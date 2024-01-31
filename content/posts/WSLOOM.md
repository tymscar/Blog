---
title: How to fix WSL2 crashing mid compile (Or any heavy IO) 
date: '2024-01-30T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - windows
  - compilation
  - development
keywords:
  - windows
  - compilation
  - development
description: WSL crashes under heavy IO usage, here's how to work around it. 
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

Reminiscing with some friends about how long the compile times were on Gentoo back in the day when we used it, I got curious about how long it would take to compile Chromium today in WSL2 on an [i9 13900KF CPU](https://www.intel.com/content/www/us/en/products/sku/230497/intel-core-i913900kf-processor-36m-cache-up-to-5-80-ghz/specifications.html). Back then, it used to take well over a day on my [i5 3470](https://ark.intel.com/content/www/us/en/ark/products/68316/intel-core-i5-3470-processor-6m-cache-up-to-3-60-ghz.html).


# Getting Chromium to compile

All you have to do to compile Chromium is follow the official Google build instructions [here](https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md):
- Install the dependencies
- Clone the depot tools as suggested
- Clone the Chromium repository
- Generate the Ninja build files
- Start the compilation.

If you want to speed it up, as I did, you can tell Ninja to use all your cores by using the `-j32` flag, where `32` is the number of threads I have available. You can get this number by running `nproc` in your terminal.

# What goes wrong

Normally, this should just work, as it does everywhere else, but in WSL, it will fail halfway through without any error. All you will see is this:
<img src="/wsloom/1.jpg" alt="autoninja crashing WSL" style="display: block; margin: auto; width: 100%;">

I then tried running with fewer threads, `-j24`, `-j16`, `-j10`, even `-j1`, as you can see in the picture.

While the compilation would be slower, the crash would always happen.

The reason I thought it made sense to try with fewer threads is that I suspected it might be a RAM issue. I only have 32GB and gave 30 of those to WSL for this compilation. However, since the entire Chromium repository is north of 40GB, I thought that might be the issue.

Googling for help was also very difficult because `[process exited with code 1(0x000000001)]` isn't the most helpful error you can get. ChatGPT was also of no use, because all it could provide were very generic ideas about how to compile Chromium or how to increase RAM allocation in WSL.

After hours of scouring GitHub, I managed to find [this issue](https://github.com/microsoft/WSL/issues/5410), which was tangentially relevant to mine.

In it, the author mentions how I/O operations on large files, such as creating a huge empty file with `dd`, would crash in the same way. I then tried it myself and, as you can see, it crashed:
<img src="/wsloom/2.jpg" alt="dd crashing WSL]" style="display: block; margin: auto; width: 100%;">

I was happy that at least now I knew something more about my error.

I tried everything mentioned in that thread, and the only thing that helped fix the `dd` issue was, contrary to what you would expect, reducing the RAM allocation for WSL from 30 gigs down to under 12.

With less RAM, it would never crash anymore. Hooray! Let's try compiling Chromium again. Nope...

`Jan 30 21:10:17 Bender kernel: Out of memory: Killed process 102026 (clang++) total-vm:2008036kB, anon-rss:991448kB, file-rss:0kB, shmem-rss:0kB, UID:1>`

As you can see, this time around we at least got a useful error, "Out of memory." Which makes sense on one hand, because I lowered the amount of RAM to just 12GB, but it doesn't make sense on the other hand, because I had well over 128GB of swap in WSL...

One thing mentioned by `therealkenc` in that thread was to give Windows a huge pagefile (basically swap). So, I tried that. I set it to 256GB, rebooted, and tried again.

This time with `-j32` again, as well as 30GB ram in WSL. The good thing about Ninja is that it continues from where it left off. The bad thing is that it would't get past 0/15840. It was stuck.
<img src="/wsloom/3.jpg" alt="j32 crashing WSL" style="display: block; margin: auto; width: 100%;">

As a last-ditch effort, I tried continuing the compilation with `-j16` instead. And that magically worked. It actually finished, and I could run Chromium!
<img src="/wsloom/4.jpg" alt="chromium running" style="display: block; margin: auto; width: 100%;">

# So how does that make sense?

This is just me speculating here, but I think there is a bug with the I/O handler in WSL2 that has issues when RAM is low on the host Windows OS.

I don't think it's a simple OOM killer, because there's nothing showing up in systemd logs, and on the Windows side, you only get logs about how Hyper-V workers got killed.

Why, on the other hand, could `-j16` work and `-j32` not, even after the huge pagefiles were added to Windows?

Perhaps the I/O scheduler is CPU-bound and it times out. I wish there were better logs so I could look deeper into it.

# So how do I get over this? (TLDR)

Well, the general rule of thumb that seems to work is:

- Give your VM as much RAM as possible, and also allocate quite a bit of SWAP to it, so it doesn't die from OOM.

- Then, to fix the WSL crashing issue, make sure to have very large pagefiles on the Windows side.

- In my case, I added 256GB, but you could probably get away with 64GB for Chromium.

- And lastly, don't use all your CPU threads when compiling, or WSL will die on you. I used half of them, but you can probably use 2/3 just fine.

And if you are curious, compiling Chromium on a 13900KF, in WSL2, takes `1 hour and 6 minutes`, extrapolating from the `-j16` timings.

