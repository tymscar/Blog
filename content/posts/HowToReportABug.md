---
title: "How To Report A Bug So It Actually Gets Fixed"
date: '2026-08-23T12:00:00+01:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - technical
  - development
  - java
  - kotlin
  - jvm
  - debugging
keywords:
  - bug report
  - netty bytebuf leak
  - reactor-netty
  - azure sdk for java
  - debugging
  - minimal reproduction
images:
  - /how-to-report-a-bug/cover.png
description: A production ByteBuf leak took me from Netty logs to a fix shipped by Microsoft in a few weeks. Here is the step-by-step process I use to report bugs so they actually get fixed.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

I wanted to make a blog post like this for a long time, because it's something that I wish I could find more of myself. I think one of the things that helps us most in our careers as software engineers is knowing how to debug problems, how to reproduce them, and how to report them.

What prompted me to write this was watching [this awesome video](https://www.youtube.com/watch?v=AmliviVGX8Q) from Kovarex, the founder of Factorio, where he goes through a bug report and tries to fix it. I thought the bug report was written pretty well, and I thought it might be helpful to show how I went about writing a bug report like this myself, and what the thought process was.

Last year the logs of a production service I was running started filling up with

```
LEAK: ByteBuf.release() was not called before it's garbage-collected.
```

Thousands of times. You instantly think it's something to do with some sort of memory leak, considering it's spammed by the GC, but let me explain how I got from here to Microsoft shipping a fix in a few weeks.

## Own the bug

**1. Always assume you are wrong.**
We all write code. Sometimes the same code changes every day, especially if it's a feature we are actively working on. Netty, on the other hand (the networking library that the Azure OpenAI SDK my service uses is built on, and where that `LEAK` line comes from), is run by thousands of companies. Surely the issue is your code.

This is where I spent most of my time on this issue, trying to see if it was. That's not wasted time, because if it ends up being your issue, you fix it and go on with your day. If it's not your issue, well, then you get to participate in what I think is the most wholesome part of software development, which is bug reporting.

**2. Make it deterministic.**
If something is random, it usually means you haven't really found what the issue is.

The thing with Netty is that it only reports a leaked buffer when the garbage collector collects it. So even if the actual leak is steady, in the logs it looks like random bursts, because you need to wait for the garbage collector to actually get to it.

So my reproduction runs a hundred concurrent requests and calls `System.gc()` every single time one fails. Normally this is something you would never, ever do in production. But for a reproduction of a bug, it's basically the spotlight that shows you where something happens.

**3. Bisect versions, just like you do with commits.**
If you don't know about `git bisect`, well, stop reading this blog post. I think that would be a much better use of your time. It lets you quickly find where a commit has gone awry by always jumping midway between commits, so you can narrow down where the issue appears.

What I wanted to do here was something similar, but instead of jumping between commits, I wanted to jump between versions. So I had my reproduction code, something super simple, and then, using the exact same app, the same SDK and everything, I jumped between versions until I got to the border between one of them working and one of them not working. In my case, `reactor-netty-http` version 1.1.23 was clean and working, and 1.1.24 leaked. That was the issue.

**4. Shrink it into a public repository.**
There are two reasons you want to do this. Usually when you have an issue in production, there's a lot of private data sitting next to it that you wouldn't necessarily want to share with everybody online. That's the first reason. The second is that the more complex your reproduction environment is, the harder it becomes to actually pinpoint the bug. So you want to create a repository that you can share with the maintainers of the project, one that is as small as possible but still reproduces the bug.

In my case I created [a Gradle project with a single test](https://github.com/tymscar/azure-openai-bytebuf-leak), with exact pins of the versions that started having the issue. That proves the bug without you having to trust me, and it proves that it's not my app that is actually bugged, but rather something upstream. It later became the test that the fix was verified against, because if you have this reproduction inside of a public repository, you can always check whether it still fails after the fix has been deployed.

## Report it

**5. File where the evidence points.**
Now comes the fun part. In my case I filed it [with reactor-netty](https://github.com/reactor/reactor-netty/issues/3926), because the bisecting between reactor-netty versions is what showed me where the bug was. I made an issue with them, but it was closed, because it wasn't actually their fault.

They explained it to me pretty clearly, and that to me was a huge boon. I could then take that and go to the actual source of the issue, which in this case was the Azure SDK for Java. The connection between the two is that the Azure SDK is built on top of reactor-netty.

**6. Do the archaeology.**
This part is sort of optional, but I think it adds a whole lot to a bug report. I started looking through the Azure SDK for Java tracker, wanting to see if there were any issues that referenced anything very similar to this one. The best thread turned out to be [one from five months earlier](https://github.com/Azure/azure-sdk-for-java/pull/45143), from when the 1.1.24 connection lifecycle change happened, which supposedly fixed this. To be fair, I didn't find that one just by searching: violetagg, the reactor-netty maintainer, pointed me to it. But in a lot of cases nobody points you to it, and you need to find it yourself. Azure added a guard in a PR, so the exception went away, but the buffer kept leaking. The fix for that issue actually made the bug quieter, but it didn't make it go away.

This gave me more information about the history of my bug, and I think that made everything move much quicker: I could make correlations between what happened in the past and what was happening currently.

**7. Write the report you'd want to receive.**
I don't know if you've ever been on the other side, receiving a report, but a lot of them are very simplistic. They don't contain all the information that you need, and they actually waste more of your time than they help. Not everybody does their homework, and if you make a report that's very bare-bones, it makes it extremely hard for the maintainers to help you. So if you want your issue to be fixed quickly, you want to create a report that has a lot of information in it.

In [my case](https://github.com/Azure/azure-sdk-for-java/issues/46804) I had a one-sentence claim with the versions in it, everything I had found about the history, and a full trace plus a gist of logs, which I edited so it didn't contain any information I didn't want to share publicly. I had the three-step reproduction repository. And I also mentioned how my reproduction repository sort of cheats by forcing the garbage collector. I think that's important to mention, because obviously in production I wouldn't do that. My hunch was that the bug wasn't because of that, but I wanted to make that clear before reporting it.

Nothing in creating this needs talent. It just needs time, and it needs you to understand that on the other side there's another human that wants to help you, but they also need the information that you are more likely to have than them.

**8. Be as helpful as you can in the comment section of the issue.**
The maintainer, [Alan](https://github.com/alzimmermsft), just asked me a couple of questions about when it happens, whether it happens in retry situations or not. I couldn't be sure, but I was totally honest with him and explained everything that I knew. That was enough. A day later, because he's an actual hero, he had [written a fix](https://github.com/Azure/azure-sdk-for-java/pull/46850).

## Land it

**9. Verify the fix yourself.**
I verified it myself, and it indeed fixed all of the issues that I had in the reproduction. It was also good to chase the release downstream. Once they got the release out there, I upgraded to it in production and turned all of the alarms back on, because we didn't have to mute all of those leak reports anymore.

---

I think one of the biggest things the community misses right now is us sharing more about our experiences, and about when something good happened. We tend to talk about bad things, like bad issues, bad reporting, and bugs, and I'm part of the problem. I also write blog posts like that myself. So this post is me trying to share some more knowledge, and trying to get the community to be better.
