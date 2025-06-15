---
title: 'Public Dotfiles, Private Secrets: My Nix OS Docker Workflow'
date: '2025-06-15T21:39:22+01:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - nix
  - linux
  - docker
  - secrets
  - nixos
keywords:
  - nix
  - linux
  - docker
  - secrets
  - nixos
description: Run Docker containers on Nix OS, commit every line to GitHub, and still keep your API tokens private using Agenix and age.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

For the longest time I ran every container in my homelab on Proxmox. It did the job, but because I use NixOS on my main workstation and NixDarwin on my laptop, I eventually wanted the lab to follow the same declarative model. A few months ago I switched those machines to NixOS as well. Everything went smoothly except for one thing: moving the containers themselves.

The problem was secrets. I keep my entire configuration, including the lab, in a public [dotfiles repository](https://github.com/tymscar/dotfiles). Many of the containers need tokens such as Cloudflare, API keys, you name it, that obviously must not end up on GitHub. Every time I sat down to migrate the stack I put it off for this single reason.

One free weekend I finally dug into secret management on NixOS and discovered [Agenix](https://github.com/ryantm/agenix). At first the plan was to write a quick post about Agenix alone, but it made more sense to walk through an end-to-end example: adding a brand-new service, Grafana, to the lab while keeping every line of infrastructure code public.

## Adding a new service!
The easiest way to explain the workflow is to follow it start to finish. Grafana is a nice self-contained example, so we will add that.

First, here is the minimal subset of the repository we will touch. I generated this tree view by stripping unrelated files.

```bash
.
├── .gitignore
├── flake.nix
├── apps
│   └── nixos
│       └── docker
│           ├── default.nix
│           └── grafana
│               ├── data/
│               ├── default.nix
│               └── docker-compose.yml
├── devices
│   └── farnsworth
│       ├── configurations.nix
│       └── secrets.nix
└── secrets
    ├── docker
    │   └── grafana.age
    └── secrets.nix
```

## Setting up Agenix

Agenix manages secrets with age-encrypted files that are transparently decrypted at activation time. You commit only the ciphertext while the private key never leaves the host.

Add it to the flake inputs and enable its module. I have replaced unrelated code with ellipses.

```nix
{
  description = "Tymscar's system configuration";

  inputs = {
    # ... other inputs ...
    agenix = {
      url = "github:ryantm/agenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      # ... other outputs ...
      agenix,
      ...
    }:
    let
      nixosDeviceConfig =
        device:
        let
          system = "x86_64-linux";
          linuxUsername = "tymscar";
        in
        {
          "${device}" = nixpkgs.lib.nixosSystem {
            inherit system;
            specialArgs = {
              inherit device;
              accountUsername = linuxUsername;
            };
            modules = [
              agenix.nixosModules.default
              # ... other modules ...
            ];
          };
        };

      # ... rest of the configuration ...
    in
    {
      # ... nixosConfigurations and darwinConfigurations ...
    };
}
```

Create a top-level secrets directory. Its heart is secrets.nix, which declares which public keys may decrypt which file.

```nix
let
  one-password-agenix = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPeudL4pX9bw/g9apBN7uOBGjbqOJW/pxLKvZNiAMVWs";
  farnsworth = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAe9FWKQXgkfRiGEw8P1ajzg5vx4Wg8c/5gMOLAyEGua";
in
{
  # 
  "docker/grafana.age".publicKeys = [
    one-password-agenix
    farnsworth
  ];
}
```

The first key lives in 1Password (you can keep yours wherever you want. At first I wanted to keep it on my yubikey, but there are still issues with that approach. I will probably make an update on that...), so I can always re-encrypt or add devices. The second is the homelab host itself.

Inside `secrets/docker` run Agenix to create the encrypted file.

```bash
nix run github:ryantm/agenix -- -e grafana.age --identity /home/tymscar/.ssh/id_agenix
```

Your editor opens a blank buffer. Paste the environment variables Grafana needs, one KEY=value per line. In my case there are three as you can see below:

!["Age secrets in your editor"](/nixos-docker-agenix/agenixSecrets.png) 

Next import those secrets into the host configuration. In `devices/farnsworth/configurations.nix` add a line to pull in `secrets.nix`.

```nix
imports = [
    ./hardware-configuration.nix
    ./secrets.nix
    # other imports ...
  ];
```

Then create `devices/farnsworth/secrets.nix`:

```nix
{ ... }:
{
  age.secrets = {
    docker-grafana.file = ../../secrets/docker/grafana.age;
  };
}
```

Whenever you introduce another service you simply append another attribute.

And believe it or not, that's basically it when it comes to the secrets. Now the next thing we have to do is actually add the Grafana service. 

## Adding the Grafana service

I keep every container under `apps/nixos/docker`. The `default.nix` there enables Docker on the host and imports one subdirectory per service.

```nix
{ ... }:

{
  imports = [
    ./grafana
  ];

  virtualisation.docker.enable = true;
}
```

Because the folder `apps/nixos/docker/grafana` contains its own `default.nix`, Nix treats the directory as a module.
Here is that file:

```nix
{ pkgs, config, ... }:

let
  dockerEnv = config.age.secrets.docker-grafana.path;
in
{
  systemd.services.grafana = {
    description = "Grafana";
    after       = [ "network.target" "docker.service" ];
    wants       = [ "docker.service" ];

    serviceConfig = {
      ExecStart  = "${pkgs.docker}/bin/docker compose --env-file ${dockerEnv} -f docker-compose.yml up --force-recreate";
      ExecStop   = "${pkgs.docker}/bin/docker compose -f docker-compose.yml down";
      WorkingDirectory = "/home/tymscar/dotfiles/apps/nixos/docker/grafana";
      Restart    = "always";
    };

    wantedBy = [ "multi-user.target" ];
  };
}
```

I prefer to run ordinary docker compose exactly as on any other distro but let systemd own the lifecycle. The only special part is the `--env-file` flag, which points at the decrypted Age file supplied by Nix.

The compose file itself is vanilla:

```yaml
version: "3.5"

services:
  grafana:
    image: grafana/grafana-oss:latest
    container_name: grafana
    restart: unless-stopped

    volumes:
      - data:/var/lib/grafana

    environment:
      - GF_SECURITY_ADMIN_USER=${GF_SECURITY_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD}
      - GF_AUTH_ANONYMOUS_ENABLED=false
      - GF_SERVER_ROOT_URL=https://${GRAFANA_HOST}/

    networks:
      - default
      - proxy

    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.entrypoints=http"
      - "traefik.http.routers.grafana.rule=Host(`${GRAFANA_HOST}`)"
      - "traefik.http.middlewares.grafana-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.grafana.middlewares=grafana-https-redirect"
      - "traefik.http.routers.grafana-secure.entrypoints=https"
      - "traefik.http.routers.grafana-secure.rule=Host(`${GRAFANA_HOST}`)"
      - "traefik.http.routers.grafana-secure.tls=true"
      - "traefik.http.routers.grafana-secure.service=grafana"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
      - "traefik.docker.network=proxy"

volumes:
  data:

networks:
  proxy:
    external: true
```

Finally add runtime directories like `data/` to `.gitignore` so they do not clutter the repo:

```gitignore
apps/nixos/docker/grafana/data
```

## Deploying the service

Deployment is the best part: commit, push and rebuild.

First stage the new files:
```bash
git add .
git commit -m "add grafana service"
```

Then switch the host to the new flake:
```bash
sudo nixos-rebuild switch --flake '.#farnsworth'
```

Seconds later Grafana is up behind Traefik and SSL. Browse to the hostname you set in the compose file and log in with the admin credentials from the secret. (You also want to point your domain to the Traefik instance, but again, outside the scope of this post)

!["Logging into Grafana with the secret details"](/nixos-docker-agenix/grafanaLogin.png)

## Conclusion

This approach ticks every box for me: declarative infrastructure, secrets that stay secret, and plain old Docker where it makes sense. I could not find another write-up that pieced these parts together, so now there is one. Thanks for reading, and happy hacking.
