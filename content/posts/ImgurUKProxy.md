---
title: "Imgur Geo-Blocked the UK, So I Geo-Unblocked My Entire Network"
date: '2025-11-28T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - networking
  - nixos
  - docker
  - homelab
  - vpn
keywords:
  - imgur
  - uk-block
  - gluetun
  - traefik
  - reverse-proxy
  - pihole
description: Imgur started blocking UK users. Rather than installing a VPN on every device, I set up a network-wide proxy that tunnels Imgur traffic through a VPN automatically.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

Imgur decided to block UK users. Honestly? I don't really care that much. I haven't actively browsed the site in years. But it used to be everywhere. Back when Reddit embedded everything on Imgur, maybe fifteen years ago, it was genuinely useful. Then Reddit built their own image hosting, Discord did the same, and Imgur slowly faded into the background.

Except it never fully disappeared. And since the block, I keep stumbling across Imgur links that just show "unavailable." It's mildly infuriating.

![Imgur showing unavailable in the UK](/imgur-uk/not-working.png)

## The Minecraft shader problem

Here's a concrete example. I was playing Minecraft with some work colleagues and wanted to try different shaders. Most shader pages embed preview images hosted on Imgur. So I'd click through shader after shader, and every single preview was just gone. I couldn't see what any of them looked like without the images.

This kind of thing happens constantly now. Old forum posts, Reddit threads, documentation pages, random project READMEs. Imgur links are still scattered across the internet, and in the UK, they're all broken.

## Why I didn't just install a VPN

The obvious solution is to use a VPN. Change your location, problem solved. But I have a few issues with that approach.

First, I just [upgraded to 2.5 Gbps internet](/posts/wifi7speedhunt/) and I don't want to route all my traffic through a VPN and take the speed hit. I have this bandwidth for a reason.

Second, even if I installed a VPN on my main machine, what about my phone? My laptop? My desktop? Every device would need the VPN running, and I'd have to remember to connect it before browsing. It's messy.

I wanted something cleaner: a solution that works for every device on my network, automatically, without any client-side configuration.

## The network-level approach

I already run a homelab with Traefik as my reverse proxy, Pi-hole for DNS, and everything declaratively configured with NixOS. If you've read my [previous post on Docker containers with secrets](/posts/nixosdockerwithsecrets/), you'll recognise the pattern.

The idea was simple: intercept all requests to `i.imgur.com` at the DNS level, route them through a VPN-connected container, and serve the images back. Every device on my network automatically uses Pi-hole for DNS via DHCP, so this would be completely transparent.

Here's the flow:
1. Device requests `i.imgur.com`
2. Pi-hole returns my Traefik instance's IP instead
3. Traefik sees the SNI hostname and routes to Gluetun
4. Gluetun tunnels the request through a VPN
5. Nginx (attached to Gluetun's network) proxies to the real Imgur
6. Image comes back through the tunnel to the device

## Why Nginx when I already have Traefik?

Good question. Gluetun isn't a reverse proxy. It's a container that provides VPN connectivity to other containers attached to its network namespace. So I needed something inside Gluetun's network to actually handle the proxying. Nginx was the simplest choice.

The Nginx config is minimal. It just does TCP passthrough with SNI:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

stream {
    resolver 127.0.0.1 valid=30s;
    resolver_timeout 5s;

    server {
        listen 443;
        ssl_preread on;
        proxy_pass i.imgur.com:443;
        proxy_connect_timeout 10s;
        proxy_timeout 60s;
    }
}
```

This listens on port 443, reads the SNI header to confirm the destination, and passes the connection through to the real `i.imgur.com`. The TLS handshake happens end-to-end; Nginx never sees the decrypted traffic.

## The Docker setup

The compose file runs two containers. Gluetun handles the VPN connection, and Nginx attaches to Gluetun's network:

```yaml
version: '3.8'

services:
  gluetun:
    image: qmcgaw/gluetun:latest
    container_name: gluetun
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    environment:
      - VPN_SERVICE_PROVIDER=${VPN_SERVICE_PROVIDER}
      - VPN_TYPE=wireguard
      - WIREGUARD_PRIVATE_KEY=${WIREGUARD_PRIVATE_KEY}
      - SERVER_COUNTRIES=${SERVER_COUNTRIES}
      - FIREWALL=on
      - FIREWALL_INPUT_PORTS=443
      - FIREWALL_OUTBOUND_SUBNETS=10.0.0.0/8
      - DOT=on
      - DOT_PROVIDERS=cloudflare
      - HEALTH_VPN_DURATION_INITIAL=30s
    volumes:
      - ./gluetun:/gluetun
    restart: unless-stopped
    networks:
      - proxy
    healthcheck:
      test: ["CMD", "/gluetun-entrypoint", "healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  imgur-proxy:
    image: nginx:alpine
    container_name: imgur-proxy
    depends_on:
      gluetun:
        condition: service_healthy
    network_mode: "service:gluetun"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped

networks:
  proxy:
    external: true
```

The key detail is `network_mode: "service:gluetun"`. This makes Nginx share Gluetun's network stack, so all its traffic automatically goes through the VPN tunnel.

I'm not going to mention which VPN provider I use. It's one of the major ones with WireGuard support, but honestly I'm not thrilled with it. Use whatever you have.

## Traefik routing

The final piece is telling Traefik to route `i.imgur.com` traffic to the Gluetun container. This uses TCP routing with TLS passthrough:

```yaml
tcp:
  routers:
    imgur-router:
      rule: "HostSNI(`i.imgur.com`)"
      entryPoints:
        - https
      service: imgur-service
      tls:
        passthrough: true
  services:
    imgur-service:
      loadBalancer:
        servers:
          - address: "gluetun:443"
```

The `passthrough: true` is important. It means Traefik doesn't terminate TLS; it just inspects the SNI header and forwards the connection.

## NixOS integration

Following the same pattern from my [Docker with secrets post](/posts/nixosdockerwithsecrets/), I created a systemd service that runs the compose stack with Agenix-managed secrets:

```nix
{ pkgs, config, ... }:
let
  docker-env = config.age.secrets.docker-imgur-proxy.path;
in
{
  systemd.services.imgur-proxy = {
    description = "Imgur Proxy with VPN";
    after = [
      "network.target"
      "docker.service"
      "docker-create-proxy-network.service"
    ];
    wants = [
      "docker.service"
      "docker-create-proxy-network.service"
    ];
    serviceConfig = {
      ExecStart = "${pkgs.docker}/bin/docker compose --env-file ${docker-env} -f docker-compose.yml up --force-recreate";
      ExecStop = "${pkgs.docker}/bin/docker compose -f docker-compose.yml down";
      WorkingDirectory = "/home/tymscar/dotfiles/apps/nixos/docker/imgur-proxy";
      Restart = "always";
    };
    wantedBy = [ "multi-user.target" ];
  };
}
```

The VPN credentials are stored encrypted with Agenix, so my entire dotfiles repo stays public while keeping secrets safe.

## The result

Now when any device on my network requests an Imgur image, it works. My phone, my laptop, guest devices, everything. No VPN apps to install, no browser extensions, no manual configuration. Pi-hole intercepts the DNS, Traefik routes the connection, and Gluetun tunnels it through a non-UK exit point.

![Imgur working after the fix](/imgur-uk/working.png)

The latency increase is negligible for loading images, and it only affects Imgur traffic. Everything else still goes direct at full speed.

Is this overkill for viewing the occasional Imgur image? Probably. But it's a clean solution that requires minimal ongoing maintenance, and it scratches the homelab itch. Plus I can finally see what those Minecraft shaders look like.
