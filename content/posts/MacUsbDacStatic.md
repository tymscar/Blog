---
title: How to fix static noise on macOS headphones 
date: '2024-05-07T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - macOS
  - nuggets
  - audio
  - glitches
keywords:
  - macOS
  - nuggets
  - audio
  - glitches
description: Static noise coming from headphones on macOS. Here is the fix! 
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

A bit over a year ago, I bought a pair of [Steelseries Arctis Nova Pro](https://steelseries.com/gaming-headsets/arctis-nova-pro) headphones. They are amazing for what I need—they work great over 2.4 GHz, so I don't experience noticeable latency like with Bluetooth, and I can connect four devices to the base station simultaneously. This is something I do daily when working on multiple computers.

I never had any issues until I connected them to a Mac mini with an M2 processor. After an indeterminate amount of time, static noise started coming out of the headphones, getting progressively louder until they became unusable. Rebooting the headphones didn’t help, nor did changing the output device to something else and back again. If I hadn't used them successfully on other devices, I would have assumed they were broken.

After searching online for the issue, I found multiple threads discussing it. They all mentioned that on Apple Silicon Macs, once RAM pressure in Activity Monitor surpasses the yellow mark, some desynchronization occurs with audio. The only solution that consistently worked was running `sudo killall coreaudiod`, which restarts the CoreAudio daemon handling macOS audio. This would temporarily eliminate the static noise, sometimes for 5 minutes and sometimes for 30.

Because so many people said it was a memory pressure issue, I didn’t question it too much, especially since the Mac mini was only with me temporarily. Ultimately, it didn't matter.

However, I then got my hands on a MacBook Pro with an M3 Pro CPU and 18 GB of RAM. I set everything up, began working on my projects, and plugged my headphones in via the base station as usual. I had forgotten about the issue I encountered with the Mac mini, so I continued with my workday. After a while, the static returned. "Oh no," I thought, "Don't tell me the RAM pressure is in the yellow; I'm not even doing that much." I checked Activity Monitor, and lo and behold, it wasn't in the yellow—it was well within the green.

<img src="/mac-usb-dac-static/ram-activity.png" alt="Ram activity" style="display: block; margin: auto; width: 100%; max-width: 550px;">

So clearly, RAM pressure wasn't the issue. What could it be? I opened `/Applications/Console.app` and enabled streaming log messages. I continued working and, as soon as I started hearing static noise again, I checked the console to see if there were any new messages. There was a crash report for `coreaudiod`, the process I had been restarting. The report was extensive, but this part stood out:

```
0x102900000 -        0x102953fff com.apple.AppleUSBAudio (1.0) <16595ba4-160a-399b-9f81-f8deb4935c77> /System/Library/Audio/Plug-Ins/HAL/AppleUSBAudio.driver/Contents/MacOS/AppleUSBAudio
```

Could this have something to do with the fact that it's treated as a USB DAC? I searched again and found people reporting similar issues with static noise and USB DACs on macOS. Some suggested adding a USB hub between the DAC and the Mac, but that didn’t help. Others recommended upgrading the firmware, but that didn’t solve it either. Some mentioned a mismatch between the DAC's bitrate and macOS output. Setting it to 16-bit/48 kHz was supposed to help, but mine was already set to that.

<img src="/mac-usb-dac-static/bitrate.png" alt="Bitrate" style="display: block; margin: auto; width: 100%; max-width: 450px;">

I remembered that my base station has two USB inputs and two audio jack inputs, so I connected a cable directly from the MacBook's headphone output to the base station's jack input. No more static noise. Eight hours of work went by without issue. Could this be the fix, or was it just luck? I had never had more than an hour of silence before, so the chances of luck seemed slim. I connected the USB audio interface again, and the static returned in 20 minutes. Switching back to the audio jack eliminated the static for a week. To confirm, I tried the USB interface one last time while writing this blog post, and the static reappeared.

For me, the solution was to use an audio jack from my Mac to the base station, which then transmits audio via 2.4 GHz to my headset. I sent a bug report to Apple with crash logs and my findings. Hopefully, in the future, we'll all be able to use USB DACs without issues, but in the meantime, I'll stick with the internal DAC to avoid static noise!
