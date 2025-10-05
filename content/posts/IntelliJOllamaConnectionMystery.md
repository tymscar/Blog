---
title: "When Curl Works But IntelliJ Doesn’t: The Ollama Connection Mystery"
date: '2025-09-05T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - macOS
  - development
  - jetbrains
  - debugging
  - networking
keywords:
  - macOS
  - development
  - jetbrains
  - debugging
  - networking
description: IntelliJ kept saying “Failed to connect” to my Ollama instance while curl worked perfectly. Here’s what actually broke and the one-line fix.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

I run a bunch of internal services through Traefik on my LAN, each with a proper domain name and TLS, so I don’t have to remember ports. One of them is Ollama, sitting on a beefy gaming PC at `10.0.0.105` and exposed as `https://ollama.tymscar.com`. From the terminal everything behaved exactly as expected: fast responses, certificate valid, models listed. Then IntelliJ IDEA decided this host basically didn’t exist. The “Test Connection” button just said “Failed to connect”. No detail. No hint. Just a smug little red failure.

![Failed connection dialog](/intellijOllamaConnectivity/failed-to-connect.png)

Meanwhile:

```bash
curl -s https://ollama.tymscar.com/api/tags | jq '.models[].name' | head -n 4
"gpt-oss:20b"
"llama3:8b-instruct-fp16"
"qwen3:32b"
"Supa-AI/mixtral-8x7b-instruct-v0.1:q4_k_m"
```

And the plain internal HTTP endpoint (skipping Traefik entirely) also worked:

```bash
curl -s http://10.0.0.105:11434/api/tags | jq '.models[].name' | head -n 4
"gpt-oss:20b"
"llama3:8b-instruct-fp16"
"qwen3:32b"
"Supa-AI/mixtral-8x7b-instruct-v0.1:q4_k_m"
```

So networking, DNS, TLS termination, Ollama itself: all fine.

## False Start #1: “Maybe IntelliJ just doesn’t support HTTPS here”

Not a wild idea. I’d already hit a similar limitation months before with Raycast’s Ollama support. I even tweeted about it at the time. Raycast was hardcoded to use plain HTTP for Ollama, so when I tried an HTTPS homelab endpoint it mangled the URL into something like `http://https://myDomain` and App Transport Security then blocked the non-local HTTP fallback. So the idea that IntelliJ might also just not support the HTTPS reverse-proxied variant first didn’t feel far-fetched.

![Old Raycast HTTPS issue tweet](/intellijOllamaConnectivity/raycast-tweet.png)

So I bypassed Traefik completely and pointed IntelliJ straight at `http://10.0.0.105:11434`. Exact same failure dialog. So not HTTPS.

## False Start #2: “macOS local network permission?”

Checked System Settings > Privacy & Security > Local Network. IntelliJ was already allowed. Nothing to toggle. Still failed.

## False Start #3: “Firewall?”

macOS firewall off. No third‑party blocker. Another dead end.

At this point the pattern was clear: **if curl works to both the domain and the raw IP:port, and an IDE insists it can’t connect, the problem is very likely inside the JVM layer, not the network.**

## Looking at the logs

The UI was useless, so I opened:

```
~/Library/Logs/JetBrains/IntelliJIdea2025.2/idea.log
```

There it was:

```
Failed to connect to Ollama @ http://10.0.0.105:11434/: java.net.ConnectException: No route to host
```

Important detail: that error is from the direct HTTP attempt, no Traefik, no TLS. `No route to host` when the host clearly routes fine for other processes usually screams: address family / IPv6 oddity / JVM fallback behavior.

## What was really happening

`curl` happily talks IPv4 to `10.0.0.105`. The JVM, however, was trying (or initializing toward) an IPv6 path first and not gracefully falling back, ending in “No route to host”. The LAN here is plain IPv4; there’s nothing meaningful for that IPv6 attempt to succeed with, so the connection attempt just died before any IPv4 retry happened.

## The one-line fix

In IntelliJ:

```
Help > Edit Custom VM Options…
```

Add:

```
-Djava.net.preferIPv4Stack=true
```

Save and restart.

After restart: both `http://10.0.0.105:11434` and `https://ollama.tymscar.com` connected instantly in the Test Connection dialog. Same configuration, nothing changed on Traefik or the host.

![Successful connection after adding IPv4 flag](/intellijOllamaConnectivity/successful-connection.png)

## Why that works

That flag disables the IPv6 stack for that JVM instance and forces straight IPv4 usage. Remove the early failing path, remove the misleading error. HTTPS “magically” working afterwards wasn’t magic (it was never a TLS problem), it just never got far enough previously to prove that.

(If someone wanted a softer approach they could try `-Djava.net.preferIPv4Addresses=true`, but I didn’t need nuance here.)

## Final thoughts

I almost went down the rabbit hole of tweaking Traefik rules, reissuing certificates, or inventing a phantom permissions problem. The log had the answer the whole time. If a Java GUI refuses to reach something that `curl` clearly can, check its logs immediately and consider IPv6 preference issues before dismantling half your stack.
