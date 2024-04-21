---
title: I wrote my Vision Pro killer app (Script Anchor) 
date: '2024-04-21T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - Vision Pro
  - swift
  - spatial computing
  - development
keywords:
  - Vision Pro
  - swift
  - spatial computing
  - development
description: Discover Script Anchor, the essential app for Vision Pro, designed by a developer, for developers. Enhance your spatial computing with seamless multitasking and control.
showfullcontent: false
readingtime: true
hidecomments: true
draft: false
---

# I've always like VR
For 15 years, I've been captivated by the possibilities of VR/AR. It all became real when I held my first Google Cardboard at Google I/O 2015—here's the moment captured:

![My Google Cardboard](/script-anchor/google-cardboard.jpg)

My professional and personal life has been deeply intertwined with virtual reality. I spent five fulfilling years harnessing VR's potential at JLR, and for my Bachelor of Science First Class Honours degree at BCU, I pioneered an augmented reality project that allowed users to overlay virtual attractions onto the real world. Even outside of work, I've remained an avid VR enthusiast, frequently engaging with the best headsets out there, from the industry-celebrated Microsoft Hololens to the impressive capabilities of the less known Pimax 8K.

![Selfie with the Hololens](/script-anchor/selfie-hololens.jpg)

I'm sharing this because Script Anchor didn't just appear out of thin air. After nearly a decade immersed in VR and AR, the launch of Apple's Vision Pro left me waiting for that killer app that would speak directly to programmers like myself. That's when I decided to create Script Anchor, potentially *the* killer app for the likes of me—tech enthusiasts who code at the cutting edge and value an undisturbed workflow.

# Script Anchor

Introducing Script Anchor, the spatial computing toolkit for Vision Pro:
{{< youtube vpUUuARNpEQ >}}

The Mac Virtual Display of the Vision Pro is impressive, but its single-screen projection fell short for someone accustomed to a multi-screen setup. For me, flipping back and forth to check a log or send a quick GET request was more than an annoyance—it was a flow-breaker.

![Programming flow](https://www.monkeyuser.com/2018/focus/79-focus.png)

Here's how Script Anchor addresses this:

1) A floating SSH window that's always in view, whether you're coding on a Mac or Linux machine. You can keep an eye on `htop`, or swap in any command output—be it logs from a Kotlin Ktor app, Docker, or kernel messages while crafting a Linux driver.
![Htop running in Script Anchor](/script-anchor/htop.png)
2) The ability to execute HTTP requests without the need to switch to Postman or cycle through terminal history with '↑' and '⏎'. It's designed for those times when you're deep in development and any deviation is a distraction.
![HTTP Requests in Script Anchor](/script-anchor/http.png)
3) Direct control over Home Assistant lights from the interface—I can't count how many times reaching for my phone to tweak the lighting has disrupted my coding rhythm. With Script Anchor, it's a disruption of the past.
![Controlling Home Assistant from Script Anchor](/script-anchor/home-assistant.png)

Script Anchor is more labor-intensive than I initially thought, yet the fundamental rule I've embraced is to launch functional features that can immediately enhance someone's workflow and evolve over time. The ability to add scriptable buttons for quick commands in SSH windows is already on the horizon.

You can get Script Anchor in the App Store as of `TODAY`. For details and links, head over to the dedicated website at https://scriptanchor.app.

See you in the coding zone!

