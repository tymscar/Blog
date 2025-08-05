---
title: "Running OpenAI's GPT-OSS locally: the good, the bad, and the loopy"
date: "2025-08-05T20:20:00+00:00"
author: "Oscar Molnar"
authorTwitter: "tymscar"
tags:
  - ai
  - local-llm
  - openai
  - gpu
  - development
keywords:
  - gpt-oss
  - openai
  - local-llm
  - rtx-4080
  - tool-calling
  - opencode
description: "My experience running OpenAI's new open source GPT-OSS model locally, from impressive reasoning to frustrating tool calling failures"
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

OpenAI recently launched something I didn't expect to see from them: an open source model called [GPT-OSS](https://openai.com/index/introducing-gpt-oss/). After years of keeping their models locked behind APIs, they've finally released both 20 billion and 120 billion parameter models that you can run entirely on your own hardware. Both can run on consumer grade hardware, but realistically most people would go with the 20 billion model since it fully fits into 16 gigs of VRAM on a GPU, which is why I went with that one as well.

Obviously, I had to try it out.

## Getting it running locally

The moment I saw that I could run this thing on my own computer, I knew I had to try it. I managed to fit the entire 20 billion parameter model onto my NVIDIA RTX 4080 GPU. The cool thing is that I can run this on my desktop and then use it over the network from my MacBook, which is exactly what I wanted to do.

I decided to test it through OpenCode, mainly because OpenAI was making bold claims about how great GPT-OSS is at tool calling, and everyone on Twitter was echoing the same sentiment. If it's really that good at tool calling, then using it in an agentic way through OpenCode seemed like the perfect test.

## The setup was smooth, the execution... not so much

Setting it up with OpenCode was a breeze. Everything seemed to work pretty damn well initially. The only issue? Whenever I would ask it something, it would be really, really bad at tool calling. It would mess up constantly.

For example, it would throw errors like this:

```
AI_NoSuchToolError: Model tried to call unavailable tool 'webfetch'. No tools are available.
```

Out of all the errors, this one is the weirdest because WebFetch actually *is* a tool inside of OpenCode. So I'm not entirely sure what happened there, perhaps it was just called with the wrong arguments or something.

One "tool" that it would always, always, always fail on is something called `Assistant`. I'm not entirely sure why it does that, it might try to talk with sub-agents or something, but it would always try to call this tool called Assistant, even though it has a list of the available tools provided. It would always call it and fail:

```
AI_NoSuchToolError: Model tried to call unavailable tool 'assistant'. Available tools: edit, glob, grep, list, read, write, task, webfetch.
```

## The dreaded infinite loops

It would also happen a lot where it would get itself into a loop, writing the same thing over and over and over again. Then when you'd think it gets out of the loop, it would do something different for a second, and then go right back into the loop again.

Here's one example that perfectly captures this behavior (I've commented out the non-JSON parts for better syntax highlighting):

```javascript
// Write /Users/tymscar/Projects/todoreact/todo-cli/package.json

{
  "name": "todo-cli",
  "version": "1.0.0",
  "description": "A tiny CLI todo‑app built with @inkjs/ink",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@inkjs/ink": "^4.2.0"
  }
}

// Write /Users/tymscar/Projects/todoreact/todo-cli/package.json

{
  "name": "todo-cli",
  "version": "1.0.0",
  "description": "A tiny CLI todo‑app built with @inkjs/ink",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@inkjs/ink": "^4.2.0"
  }
}

// Glob  (pattern=**/*)
// /Users/tymscar/Projects/todoreact/todo-cli/package.json
// We need to write two files. Let's read existing? Let's check if folder exists.
// gpt-oss:20b (09:18 PM)

// Glob /Users/tymscar/Projects/todoreact (pattern=todo-cli)
// No files found

// Write /Users/tymscar/Projects/todoreact/todo-cli/package.json

{
  "name": "todo-cli",
  "version": "1.0.0",
  "description": "A tiny CLI todo‑app built with @inkjs/ink",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@inkjs/ink": "^4.2.0"
  }
}

// Write /Users/tymscar/Projects/todoreact/todo-cli/package.json

{
  "name": "todo-cli",
  "version": "1.0.0",
  "description": "A tiny CLI todo‑app built with @inkjs/ink",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@inkjs/ink": "^4.2.0"
  }
}
```

After chatting with other users on the OpenCode Discord server, we kind of decided that tool calling really isn't this model's strongest suit.

## Where it actually shines

So I wanted to give it a go in just normal chat mode and see how well it fares there. I was actually pleasantly surprised.

For example, I tried the infamous question about how many R's are there in "strawberry" and it got it right. You could argue that maybe this is something that was already very common on the internet, so it probably just remembers it. But then I tried asking it how many R's are there in "strawberry" typed as "strawbery," and it still got the correct answer.

Another really cool thing I asked it to do was to write me a sentence that contains the number of letters (not numbers, spaces, or punctuation) that the sentence has inside of the sentence. This is the answer it came up with:

> "This sentence contains 27 letters."

Pretty impressive!

## The dancing penguin experiment

I asked it to create me an SVG of a dancing penguin. While it did give me something that was moving and had sort of the correct colors, the penguin was a bit off-screen:

<div style="text-align: center; margin: 20px 0;">
<svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#e0f7ff"/>
  <!-- Whole penguin group (will be rotated for dancing) -->
  <g id="penguin" transform="translate(100,200)">
    <!-- Body -->
    <ellipse cx="0" cy="0" rx="40" ry="60" fill="#111" />
    <ellipse cx="0" cy="-10" rx="34" ry="55" fill="#222" />
    <!-- Belly -->
    <ellipse cx="0" cy="20" rx="20" ry="30" fill="#fff" />
    <!-- Head -->
    <circle cx="0" cy="-70" r="30" fill="#111" />
    <circle cx="0" cy="-70" r="25" fill="#222" />
    <!-- Eyes -->
    <circle cx="-7" cy="-75" r="5" fill="#fff"/>
    <circle cx="7" cy="-75" r="5" fill="#fff"/>
    <circle cx="-7" cy="-75" r="2" fill="#000"/>
    <circle cx="7" cy="-75" r="2" fill="#000"/>
    <!-- Wing left -->
    <path d="M -30 0 A 20 30 0 0 1 -35 30" stroke="#111" stroke-width="6" fill="none"/>
    <!-- Wing right -->
    <path d="M 30 0 A 20 30 0 0 0 35 30" stroke="#111" stroke-width="6" fill="none"/>
    <!-- Feet -->
    <polygon points="-10,70 -5,80 5,80 10,70 -10,70" fill="#ff5c00"/>
    <polygon points="10,70 5,80 -5,80 -10,70 10,70" fill="#ff5c00"/>
    <!-- Dance animation -->
    <animateTransform
        attributeName="transform"
        type="rotate"
        dur="0.8s"
        values="0 0 0; -20 0 0; 20 0 0; 0 0 0"
        repeatCount="indefinite"/>
  </g>
</svg>
</div>

I then asked it to try again, but this time without animation, just give me a simple SVG with a penguin. This is where it got into one of those loops again, where it forgot that I was asking for an SVG and started hallucinating ASCII art:

```
   .--.
  (o   o)
   |~|
  /| |\
   _|_


No. Let me design a more classic penguin.


   _
 ('v')
//-\\
(   )

No. Let's use a more known ASCII penguin:

   _
 ('v')
  \ /
   "

Better maybe:

  /\_/\
 ( o.o )
  > ^ <

But that's cat. We'll use penguin: A classic little penguin:

   _
  /_\
 (o o)
  \_/
   /\

Better maybe:

  /\_/\
 ( @ @ )
  \   /
   ~~~

No, cat. I'd prefer:

   .--.
  /--\
( o  o )
  \   /
   \_/

No.

Let's just do:

   __
  /  \
 (    )
  \__/

This is too generic. Let's search memory of a known ASCII penguin:

   __
 _(  )_
( \  / )
 \____/

No.

We can also use the one:

   __
  /  \
 ( o  o )
  \  /
   \/

Alright, maybe simpler: The penguin we can provide like:

   _
 _( )_
(_   _)
  \ /
   "

It's probably too abstract. I'll produce a small penguin that fits in 60 columns max.

I think I want to give something like:

   .
  / \\_
 ( o_o)
/  >^< \

Hmm.

Better we can produce a simpler minimal one:

   __
  (oo)
  /||\

But that's an owl? No.

Actually, consider a simple cartoon penguin:

  _
 ('-o-)
  (   )
  |   |

Maybe it's okay.

Let's give a simple, widely recognized ASCII penguin from e.g., "Tux" style:

  .--.
 ( o  o )
  >  <

But that's not perfect.

Ok we can provide a typical "Penguin ASCII Art" e.g.:

   __
  /  \
 (    )
 \    /
   \/

Hmm.

Maybe the best is:

 /\_/\
( o.o )
 > ^ <

No.

But we can also just give:

   _
 _/ \_
(  o  )
 \___/

Alright.

We should probably accompany with apology: "I'm sorry, here's a correct version."

We can also ask if they want more lines.

Let's respond: provide a simple, short ASCII penguin that fits.

Let's give:

   _
  (o )
  /|\
  / \

Wait.

Let's design one:

   _
 (\_/)
 (o o)
  \_/

Ok we can't decide. I'd probably use a known "penguin" like:

   ___
  /___\
 (o o )
  \_/
```

I asked again, and this time it did give me an SVG of a penguin, which honestly looked alright. It wasn't perfect or anything, but definitely better:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style="max-width: 300px; display: block; margin: 20px auto;">
  <g>
    <!-- Body (black) -->
    <ellipse cx="100" cy="100" rx="45" ry="70" fill="black"/>
    <!-- Belly (white) -->
    <ellipse cx="100" cy="100" rx="45" ry="35" fill="white"/>
    <!-- Eyes -->
    <circle cx="85" cy="70" r="8" fill="white"/>
    <circle cx="85" cy="70" r="4" fill="black"/>
    <circle cx="84" cy="69" r="1" fill="white"/>
    <circle cx="115" cy="70" r="8" fill="white"/>
    <circle cx="115" cy="70" r="4" fill="black"/>
    <circle cx="114" cy="69" r="1" fill="white"/>
    <!-- Beak -->
    <polygon points="100,80 80,90 120,90" fill="orange"/>
    <!-- Wings -->
    <ellipse cx="70" cy="110" rx="18" ry="24" fill="black" transform="rotate(-30 70 110)"/>
    <ellipse cx="130" cy="110" rx="18" ry="24" fill="black" transform="rotate(30 130 110)"/>
    <!-- Feet -->
    <polygon points="85,170 75,190 95,190" fill="orange"/>
    <polygon points="115,170 105,190 125,190" fill="orange"/>
  </g>
</svg>

## Testing its knowledge and hallucination tendencies

Out of curiosity to see how well it actually remembers things and how likely it is to hallucinate, I tried asking it about very specific information without giving it internet access. I asked when the first McDonald's opened in my hometown, and it gave me an answer and was very adamant about it. In reality, it was completely hallucinated, the URL doesn't actually exist:

> A 2020 retrospective piece notes: "Yesterday (20 October 2000) the first McDonald's in Timisoara opened its doors in the city centre."
> *Link:* https://timisoaralive.ro/2000/10/20/first-mcdonalds-timisoara

## The coding challenge

I then tried something that was way, way more difficult: I asked it to write a program that would take in a URL, do a request, and then print out the response headers from that request. It didn't work on the first try. I gave it a couple of hints (which I realized maybe I shouldn't have), and it still didn't work. I tried to fix a couple of things, and on the third attempt, it actually worked.

Here's the final working code:

```c
#define _POSIX_C_SOURCE 200112L   /* for getaddrinfo, read, etc. */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>           /* close, read, write, ... */
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <strings.h>          /* strncasecmp */

#define BUF_SIZE 4096

/* ---------- URL parsing ---------- */
static int parse_url(const char *url,
                     char **host, char **port, char **path)
{
    const char *p, *path_start;
    char *hostname, *portnum, *q;

    /* 1. split scheme://host[:port]/path  */
    p = strstr(url, "://");
    if (!p) {
        fprintf(stderr, "Error: URL must have a scheme (e.g. http://)\n");
        return -1;
    }

    /* Verify scheme is exactly "http" */
    if (p - url != 4 || strncasecmp(url, "http", 4) != 0) {
        fprintf(stderr, "Error: Only http:// URLs are supported.\n");
        return -1;
    }

    /* 2. extract host[:port] */
    char *hostport_end = strchr(p + 3, '/');   /* first slash after scheme */
    size_t hostport_len;
    if (hostport_end) {
        hostport_len = hostport_end - (p + 3);
        path_start   = hostport_end;           /* includes the '/' */
    } else {
        hostport_len = strlen(p + 3);
        path_start   = NULL;                   /* no path => "/" */
    }

    hostname = malloc(hostport_len + 1);
    if (!hostname) return -1;
    strncpy(hostname, p + 3, hostport_len);
    hostname[hostport_len] = '\0';

    /* 3. split host and port */
    q = strchr(hostname, ':');
    if (q) {
        *q = '\0';                /* terminate host part */
        portnum = strdup(q + 1);
    } else {
        portnum = strdup("80");   /* default HTTP port */
    }

    /* 4. path */
    if (path_start) {
        *path = strdup(path_start);
    } else {
        *path = strdup("/");      /* default path */
    }

    *host = hostname;
    *port = portnum;
    return 0;
}
/* ---------- main program ---------- */
int main(int argc, char *argv[])
{
    if (argc != 2) {
        fprintf(stderr, "usage: %s http://host[:port]/path\n", argv[0]);
        return EXIT_FAILURE;
    }

    char *host = NULL, *port = NULL, *path = NULL;
    if (parse_url(argv[1], &host, &port, &path) < 0)
        return EXIT_FAILURE;

    /* 1. Resolve address */
    struct addrinfo hints, *res, *res0;
    int sfd = -1;
    memset(&hints, 0, sizeof(hints));
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_family   = AF_UNSPEC;   /* IPv4 or IPv6 */

    int gai_err = getaddrinfo(host, port, &hints, &res0);
    if (gai_err) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(gai_err));
        goto cleanup;
    }

    for (res = res0; res; res = res->ai_next) {
        sfd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
        if (sfd < 0) continue;          /* try next */

        if (connect(sfd, res->ai_addr, res->ai_addrlen) == 0)
            break;                      /* success */

        close(sfd);
        sfd = -1;
    }

    if (!res) {
        fprintf(stderr, "Could not connect to %s:%s\n", host, port);
        goto cleanup;
    }

    /* 2. Compose GET request */
    char request[BUFSIZ];
    int req_len = snprintf(request, sizeof(request),
                           "GET %s HTTP/1.1\r\n"
                           "Host: %s\r\n"
                           "Connection: close\r\n"
                           "\r\n",
                           path, host);
    if (req_len <= 0 || req_len >= (int)sizeof(request)) {
        fprintf(stderr, "Request buffer overflow\n");
        goto cleanup;
    }

    /* 3. Send request */
    ssize_t sent = 0;
    while (sent < req_len) {
        ssize_t n = send(sfd, request + sent, req_len - sent, 0);
        if (n <= 0) {
            fprintf(stderr, "send failed: %s\n", strerror(errno));
            goto cleanup;
        }
        sent += n;
    }

    /* 4. Read response and print headers */
    char buf[BUF_SIZE];
    size_t header_len = 0;
    char *header_buf = NULL;
    int header_found = 0;
    size_t header_written = 0;            /* number of bytes written into header_buf */

    while (!header_found && (header_len = read(sfd, buf, sizeof(buf))) > 0) {
        for (size_t i = 0; i < header_len; ++i) {
            if (!header_buf)          /* first allocation */
                header_buf = malloc(BUF_SIZE);

            header_buf[header_written++] = buf[i];

            /* check for "\r\n\r\n" or "\n\n" */
            if (header_written >= 4 &&
                header_buf[header_written-4]=='\r' &&
                header_buf[header_written-3]=='\n' &&
                header_buf[header_written-2]=='\r' &&
                header_buf[header_written-1]=='\n')
            {
                header_found = 1;
                break;
            }
            if (header_written >= 2 &&
                header_buf[header_written-2]=='\n' &&
                header_buf[header_written-1]=='\n')
            {
                header_found = 1;
                break;
            }
        }
    }

    if (header_len < 0) {
        fprintf(stderr, "read failed: %s\n", strerror(errno));
    }

    if (header_buf && header_found) {
        /* write headers (up to header_written) to stdout */
        fwrite(header_buf, 1, header_written, stdout);
        free(header_buf);
    }

    /* 5. Consume the rest of the body (not printed) */
    while (read(sfd, buf, sizeof(buf)) > 0);

cleanup:
    if (sfd >= 0) close(sfd);
    free(host);
    free(port);
    free(path);
    freeaddrinfo(res0);
    return EXIT_SUCCESS;
}
```

Interestingly, for some reason it only compiles properly with C23, which I found quite surprising.

And when I ran the program, here's what happened:

```bash
λ ~/Downloads/ ./wget_hdr http://tymscar.com
HTTP/1.1 301 Moved Permanently
Date: Tue, 05 Aug 2025 22:00:38 GMT
Transfer-Encoding: chunked
Connection: close
Location: https://tymscar.com/
Report-To: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=EP%2B2BZOdIlKxJq%2BWb5%2B%2BN99CnktH8%2FEvtZBUWo8ZCnKEuiHTfdXOmUOcw3UC3i0Qwc5LQ5agyX7rKFfPjjQ4RtchcakI8GX%2BIw%3D%3D"}]}
Nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
Server: cloudflare
CF-RAY: 96a991862c2aef59-LHR
alt-svc: h3=":443"; ma=86400

λ ~/Downloads/
```

## The verdict

I find it to be extremely fast for a model that runs locally on a GPU. It's quite good at reasoning, and I like the fact that you can see the reasoning tokens. I really like how well it can go through massive lists of text and code and find a needle in the haystack. And I also like the fact that it's free and open source.

The things I don't like are how bad it is at tool calling and the fact that no matter what I try to do, I cannot get it to reply with fewer tokens. It always, especially when it comes to the thinking tokens, tends to give back pages and pages of tokens, which sometimes you wouldn't necessarily want.

For example, in my case, I would want to use this model in my Home Assistant setup, but because of the thinking tokens and because I cannot get it to not do any reasoning (even when I specify it through Ollama), it tends to be way too slow. Even though it's actually a very fast model, just waiting on all those tokens is way too slow because of the thinking process.

Those are the main negatives. Overall though, give it a go, it's definitely worth experimenting with, especially if you have the hardware to run it locally.
