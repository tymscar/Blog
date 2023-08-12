---
title: How I deploy private GitHub projects to local self-hosted servers (CI/CD)
date: '2023-08-12T18:04:45+01:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - development
  - linux
  - technical
  - CI/CD
  - docker
  - git
keywords:
  - development
  - linux
  - technical
  - CI/CD
  - docker
  - git
description: How I deploy private GitHub projects to local self-hosted servers (CI/CD)
showFullContent: false
readingTime: false
hideComments: true
draft: false
---

# How I deploy private GitHub projects to local self-hosted servers (CI/CD)

I have a lot of experience with massive CI/CD pipelines that deploy private code to public servers. I've also worked with pipelines that deploy public repositories to private servers, such as my homelab. However, I never experimented with a pipeline that takes a private GitHub repo, builds it, and deploys it to a server on the LAN. That's precisely what I needed for a project I'm currently working on that isn't yet public.

I took some time to design the best method for this. The two top ideas were: running a self-hosted GitHub Actions runner, which would then redeploy the service in the same LAN as the runner, or hosting a Docker container on a Proxmox VM. This container would act as a webhook and later redeploy the service on the same VM. I chose the second option because it offers more flexibility for future scenarios, such as deploying from repositories hosted on other platforms like GitLab.

Here's what the workflow looks like:
```ascii
     +---------------------+
     | Code gets modified  |
     | and commited to the |
     | github repository   |
     +----------+----------+
                |
                v
       +------------------+
       | A github action  |
       | script downloads |
       | builds and lints |
       | the code         |
       +--------+---------+
                |
                v
     +----------------------+
     | This POST request is |
     | then routed through  |
     | a cloudflare tunnel  |
     +----------+-----------+
                |
                v
    +------------------------+
    | If all of that         |
    | passes successfully    |
    | send the redeploy      |
    | command to the webhook |
    | container              |
    +-----------+------------+
                |
                v
    +------------------------+
    | The webhook container  |
    | now inside of the lan  |
    | SSH'es into the host   |
    | VM and recreates the   |
    | project docker compose |
    | stack                  |
    +-----------+------------+
                |
                v
     +----------------------+
     | The project docker   |
     | compose has a custom |
     | entrypoint that gets |
     | run every time it is |
     | recreated            |
     +----------+-----------+
                |
                v
    +------------------------+
    | This entrypoint script |
    | loads the private key  |
    | approved by github,    |
    | downloads the repo,    |
    | build the project,     |
    | and serves it locally  |
    +-----------+------------+
                |
                v
+--------------------------------+
| Because of some extra          |
| traefik configuration          |
| parametres in the docker       |
| compose file, the project      |
| is then exposed on the lan     |
| behind a valid SSL certificate |
+--------------------------------+
```

## The GitHub Action
Creating a GitHub Action is straightforward. You need to create a YAML file that instructs GitHub what to do. In our case, we want it to execute every time code is committed to `main`.

The filename isn't crucial, but its location is. Mine is in the `.github/workflows` directory in the repo and is named `build_and_publish.yaml`.

The YAML is relatively easy to understand; it has two jobs. One job downloads, builds, and lints the code. The other, "publish", triggers the webhook in our local LAN to republish the project. The "publish" job only executes if the "build" job completes without errors.
```yaml
name: Build and Publish

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

  publish:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Trigger Webhook
        run: |
          RESPONSE=$(curl -X POST https://webhook.tymsc.ar/hooks/redeploy)
          echo "$RESPONSE"
```

## The Cloudflare tunnel and the webhook container
The tunnel's purpose is to avoid exposing my local LAN's homelab ports to the internet. With a Cloudflare tunnel, I can control any exposed service and manage its traffic.

I chose to host both the tunnel and the webhook container on a VM in my local Proxmox server using Docker Compose. Here's the `docker-compose.yml` for them:
```yaml
version: '3.3'

services:
  webhook:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: webhook
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/London
      - EXTRA_PARAM=-hotreload
    volumes:
      - /root/webhook:/config
      - /root/webhook/secrets/webhook_id_rsa:/etc/ssh_keys/id_rsa:rw
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.webhook.entrypoints=http"
      - "traefik.http.routers.webhook.rule=Host(`webhook.tymsc.ar`)"
      - "traefik.http.middlewares.webhook-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.webhook.middlewares=webhook-https-redirect"
      - "traefik.http.routers.webhook-secure.entrypoints=https"
      - "traefik.http.routers.webhook-secure.rule=Host(`webhook.tymsc.ar`)"
      - "traefik.http.routers.webhook-secure.tls=true"
      - "traefik.http.routers.webhook-secure.service=webhook"
      - "traefik.http.services.webhook.loadbalancer.server.port=9000"
      - "traefik.docker.network=proxy"
    networks:
      - proxy
    restart: always

  tunnel:
    container_name: cloudflared-tunnel-webhook
    image: cloudflare/cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN= ### SECRET KEY HERE ###
    networks:
        - proxy

networks:
  proxy:
    external: true
```

Any `labels` you see are optional. I included them to route internal traffic and assign SSL certificates.

`PUID` and `PGID` labels are there to grant necessary permissions to the webhook user later.

The `TUNNEL_TOKEN` variable is the key from Cloudflare you get when creating a tunnel. To get yours, visit Cloudflare -> Zero Trust -> Access -> Tunnels, and establish a tunnel with your desired URL, in my case, `webhook.tymsc.ar`.

Because the tunnel and webhook service are defined in this Docker Compose file, they can reference each other by name. So, in the Cloudflare online console, when you create the tunnel, set the Service parameter to `http://webhook:9000`. 9000 is the default port for `roxedus/webhook`.

An observant reader might notice the webhook container uses a Dockerfile instead of a container name. That's because I needed SSH access on that container, and the base container didn't have it. So, I added it. Here's the Dockerfile:
```Dockerfile
FROM roxedus/webhook

RUN apk --no-cache add openssh-client
```

Here's the folder structure for the webhook service:
```bash
.
|-- Dockerfile
|-- docker-compose.yml
|-- hooks
|   `-- hooks.json
|-- scripts
|   `-- redeploy.sh
`-- secrets
    `-- webhook_id_rsa
```

We discussed the first two, but what about the others?

`webhook_id_rsa` inside `secrets` is the SSH key allowing this container to SSH into the Proxmox VM hosting it, and the project's container we want to deploy.

The `hooks/hooks.json` file has a definition of hooks and their actions. Currently, there's only one hook, `redeploy`, which executes the `redeploy.sh` script in the scripts directory.
```json
[
  {
    "id": "redeploy",
    "execute-command": "/config/scripts/redeploy.sh",
    "command-working-directory": "/config/scripts",
    "response-message": "✅ Redeploying project!"
  }
]
```
```bash
#!/bin/sh

COMMAND="nohup docker compose -f /root/project/docker-compose.yml up --force-recreate --build -d &"
HOST_IP=$(ip route | awk '/default/ { print $3 }')

ssh-keyscan $HOST_IP > /root/.ssh/known_hosts
ssh -i /etc/ssh_keys/id_rsa root@$HOST_IP -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $COMMAND
```

## The project container
This is much simpler than the webhook container. Here's its folder structure:
```bash
.
|-- Dockerfile
|-- docker-compose.yml
|-- entrypoint.sh
`-- secrets
    `-- id_rsa
```

The `secrets/id_rsa` file is an SSH private key allowing us to download a private GitHub repository. Its public counterpart was uploaded to GitHub.

Here's the `docker-compose.yml` file for the project container:
```yaml
version: '3'

services:
  project:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: project
    ports:
      - "5000:5000"
    volumes:
      - /root/project/secrets:/secrets
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.project.entrypoints=http"
      - "traefik.http.routers.project.rule=Host(`project.tymsc.ar`)"
      - "traefik.http.middlewares.project-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.project.middlewares=project-https-redirect"
      - "traefik.http.routers.project-secure.entrypoints=https"
      - "traefik.http.routers.project-secure.rule=Host(`project.tymsc.ar`)"
      - "traefik.http.routers.project-secure.tls=true"
      - "traefik.http.routers.project-secure.service=project"
      - "traefik.http.services.project.loadbalancer.server.port=5000"
      - "traefik.docker.network=proxy"
    networks:
      - proxy
    restart: always

networks:
  proxy:
    external: true
```

Like before, the `labels` are optional. They're there to access `project.tymsc.ar` locally, with SSL certificates handled by Traefik.

The critical part is the secrets passed as a volume and the use of a custom Dockerfile. Here's the Dockerfile:
```Dockerfile
FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y git openssh-client && npm install -g serve

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000
CMD ["/entrypoint.sh"]
```

As you can see, each time this runs, it calls an `entrypoint.sh` script. This ensures tasks inside it execute every time this container is recreated. As you now know, this happens every time the webhook is called. Let's look at the script:
```bash
#!/bin/sh

mkdir -p ~/.ssh
cp /secrets/id_rsa ~/.ssh/
chmod 600 ~/.ssh/id_rsa
ssh-keyscan github.com >> ~/.ssh/known_hosts

git clone git@github.com:tymscar/project.git /app

cd /app

npm install
npm run build

serve -s build -p 5000
```
The first half of it handles the SSH keys for the private repo and downloads the project, while the last half installs the dependencies, builds it, and serves it to the LAN. At that point, if you go to the IP of the VM where you're running this container and access port 5000, you should be able to see your project. Because I have the traefik labels set up, I can go to project.tymsc.ar and see it there.

And that's basically it.

## Thoughts

The beauty of this approach is that if later down the line I want to do this with another private project, all I need to do is add another hook to the webhook container, create the project container just like this last one, and make sure the project has a GitHub action that triggers the webhook.

The best part is that this is not GitHub-specific either. If later down the line I want to move to GitLab, or I have a self-hosted Gitea instance, the same logic would apply. I would just need to find a way to trigger the webhook on a merge to the main branch.
