---
title: I washed my Yubikey twice by accident. Here's how I saved it both times.
date: '2025-08-16T12:10:22+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - hardware
  - nuggets
  - yubikey
  - recovery
keywords:
  - yubikey
  - hardware
  - recovery
  - water damage
description: How to save a water-damaged Yubikey using isopropyl alcohol and proper drying techniques
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

For the past five years, my Yubikey has been my digital companion. Every single day, I use it to sign my Git commits, authenticate into countless websites, and secure my most important accounts. It's become such an integral part of my workflow that I barely think about it, until it's not there.

A couple of years ago, I made the classic mistake of leaving it in my jeans pocket before throwing them in the washing machine. When I discovered it hours later, soaking wet and seemingly lifeless, I thought I'd lost everything. But I managed to save it using a technique I'd learned from dealing with other water-damaged electronics.

This morning, history repeated itself. I found my Yubikey sitting in the fold of the washing machine drum, having been submerged in soapy water for over an hour.

![Yubikey in washing machine](/yubico-washing-machine/in-washing-machine.jpg)

That's when I realized this might be a common enough problem that others could benefit from knowing how to fix it. So here's exactly how I saved my Yubikey, twice.

# Why this actually works

Before diving into the solution, it's worth understanding why a Yubikey can survive a trip through the washing machine in the first place. Unlike your phone or laptop, a Yubikey has no battery and no active electrical current running through it when it's not plugged in. This means that while water is present, there's nothing to short circuit.

Additionally, Yubikeys are IP68 rated, which means they're designed to be completely dust-tight and can withstand continuous immersion in water under conditions specified by the manufacturer. The "6" indicates complete protection against dust, while the "8" means it can handle being submerged in water beyond 1 meter for extended periods. So technically, your Yubikey should survive the washing machine just fine.

The real danger comes when you plug it back in while water is still trapped inside. That's when you'd get the short circuits that could permanently damage the device.

# The rescue procedure

The moment I found my Yubikey in the washing machine, I immediately submerged it in 99% isopropyl alcohol. This might seem counterintuitive, why would you put a wet electronic device in more liquid?, but alcohol has a crucial property: it displaces water extremely effectively.

![Yubikey in isopropyl alcohol](/yubico-washing-machine/in-alcohol.jpg)

More importantly, alcohol evaporates much faster than water and doesn't leave behind the mineral deposits that can cause corrosion. I left it submerged for exactly 30 minutes, long enough for the alcohol to penetrate and displace any trapped water, but not so long that it might affect the plastic housing.

After the alcohol bath, I dried it as thoroughly as possible with a lint-free cloth, then used my electronics air blower to force air through every crevice and opening. The goal is to remove as much moisture as possible before the final drying stage.

Finally, I placed it in a sealed bag with several silica gel packets for a couple of hours. These little desiccant packets are incredibly effective at absorbing any remaining moisture from the air around the device.

# The moment of truth

After the drying process was complete, I held my breath and plugged it into my computer. The familiar green light appeared, and everything worked perfectly, all my credentials intact, all my configurations preserved.

![Working Yubikey](/yubico-washing-machine/working.jpg)

# A few important notes

This technique works because Yubikeys are relatively simple devices without batteries or complex circuitry that would be immediately damaged by water. However, there are a few things to keep in mind:

- Don't skip the isopropyl alcohol step. Regular water can leave mineral deposits that cause problems later.
- Use 99% isopropyl alcohol if possible. Lower concentrations contain more water, which defeats the purpose.
- Don't leave it in the alcohol for too long, 30 minutes is plenty.
- Make sure it's completely dry before plugging it in. When in doubt, wait longer.

If you don't have access to 99% isopropyl alcohol immediately, the most important thing is to not plug the device in until you can properly clean and dry it. A wet Yubikey sitting on your desk is recoverable, a wet Yubikey that you've tried to use is probably not.

Here's hoping this helps someone else avoid the panic I felt both times I thought I'd lost years of carefully configured security settings to a load of laundry.