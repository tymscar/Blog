---
title: "From 400 Mbps to 1.7 Gbps: A WiFi 7 Debugging Journey"
date: '2025-11-01T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - networking
  - wifi
  - unifi
  - debugging
  - performance
keywords:
  - networking
  - wifi
  - unifi
  - debugging
  - performance
description: Upgraded to WiFi 7 expecting 1.7 Gbps speeds. Got 400 Mbps instead. Here's what was actually wrong and how I fixed it.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

I recently upgraded from a [UniFi Dream Machine](https://techcrunch.com/2019/12/02/the-unifi-dream-machine-router-is-a-great-entry-point-for-networking-nerds) to a [UniFi Dream Router 7](https://techspecs.ui.com/unifi/cloud-gateways/udr7) because I'm getting 2.5 Gbps internet in two weeks and figured I'd jump on the WiFi 7 bandwagon while I'm at it. My iPhone 17 Pro Max supports it, so why not? After setting everything up, I was getting nowhere near the speeds I expected. Time for some debugging.

## The disappointing numbers

My wired connection was pulling 950 Mbps through a 1 Gbps switch, and iperf3 directly to the UDR7's 2.5 Gbps port showed around 2.3 Gbps. The backbone was solid. But on WiFi 7 (6 GHz, 160 MHz width), standing literally a foot from the router, I was getting around 400 Mbps with iperf3. With 10 concurrent streams it went up to 650 Mbps, but that's still pathetic.

A quick note on my testing: I was using iperf3's `-R` flag (reverse mode) which makes the server send data to the client instead of the other way around. This typically gives better results on WiFi since the AP has stronger transmit power than phones, and the phone only needs to send tiny ACKs back.

Meanwhile, [reviewers were getting 1,635 Mbps average on 6 GHz with the UDR7](https://www.rtings.com/router/reviews/unifi/dream-router-7), with peaks up to 1,890 Mbps. There's even [a YouTube video showing an iPhone 17 Pro Max hitting 1.9 Gb/s on 6 GHz 160 MHz](https://www.youtube.com/watch?v=fSovy5LzYvM). I was getting a third of that.

## False start #1: "Maybe I'm testing wrong"

I created a dedicated 6 GHz-only network with 160 MHz channel width on Auto transmit power. The spectrum was clean with no other 6 GHz broadcasts. I wondered if maybe 160 MHz was causing issues, so I tried switching to 80 MHz width to test that theory - but that made things worse at 374 Mbps total. So it wasn't that 160 MHz was broken; something else was going on. Moving the iperf server from the UDR itself to my MacBook over Ethernet improved things to 727 Mbps, but still nowhere near the expected speeds.

At this point I knew [the phone could only do 160 MHz width, not 320 MHz](https://5gstore.com/blog/2025/09/16/apple-n1-chip-wifi-7-iphone-17/) - that's what Apple's N1 chip is limited to. I hadn't enabled IPS/IDS or QOS yet, though I was planning to since the UDR7 can handle it at full 2.5 Gbps.

## Finding the first bottleneck

After banging my head against this for hours, I had a hypothesis about my test setup. My wired MacBook could hit 2.3 Gbps to the router, so the network was fine. But looking at my iperf3 results when testing WiFi against 10.0.0.1 (the router itself), I wondered if that was the issue:

```bash
iperf3 -c 10.0.0.1 -P 6 -R -t 20 -w 2M
# ...
[SUM]   0.00-20.01  sec  1.30 GBytes   560 Mbits/sec    0             sender
```

Running iperf server on the router itself creates CPU contention between the WiFi scheduling and the iperf process. The router's TCP stack isn't tuned for this either. Classic mistake.

## False start #2: "It's a 2.5 GbE problem"

Moved the iperf server to my MacBook connected through a USB-C 2.5 GbE adapter. Verified the port negotiated at 2.5G in UniFi's port settings. Ran the test again:

```bash
iperf3 -c <mac_ip> -P 6 -R -t 20
# ...
[SUM]   0.00-20.01  sec  1.67 GBytes   718 Mbits/sec                  sender
```

Better, but still nowhere close to 1.9 Gbps. Time to check what UniFi was actually showing for the client connection during the test. That's when I found the real problem.

## The actual issue: 80 MHz, not 160 MHz

Looking at the UniFi client details while running iperf, I saw this:

```
Ch. 37 (6 GHz, 80 MHz)
Tx/Rx Rate: 1.20 Gbps
```

Wait, what? My iPhone was connecting at 80 MHz channel width, not 160 MHz. Even though I had configured the SSID for 160 MHz, the actual radio was still on 80 MHz. The 1.20 Gbps PHY rate is exactly what you'd expect for 2×2 MIMO at 80 MHz. That explained the 650-900 Mbps TCP throughput perfectly. When I had manually tested 80 MHz earlier and got worse speeds (374 Mbps), it was probably due to testing against the router itself rather than the channel width.

The fix was in the UDR7's radio settings, not the SSID settings. I went to:
- Devices → UDR7 → Radios → 6 GHz
- Set channel width explicitly to 160 MHz (not Auto)
- Set transmit power to High

## The working configuration

After applying those changes and reconnecting:

```bash
iperf3 -c <mac_ip> -P 6 -R -t 20
# ...
[SUM]   0.00-20.01  sec  3.77 GBytes  1.62 Gbits/sec                  sender
```

Finally! The UniFi panel now showed:
- 6 GHz, 160 MHz
- Tx/Rx Rate: 2.4-2.9 Gbps

That's exactly the expected PHY rate for 2×2 WiFi 7 at 160 MHz with 4096-QAM.

## Why certain iperf flags matter

During this journey I learned why specific iperf3 flags make such a huge difference:

**The `-R` flag (reverse mode)**: As I mentioned earlier, this is crucial for WiFi testing. It's faster because:
- The AP has higher transmit power and better antennas
- The phone only has to send tiny ACKs back
- iOS's TCP receive path is better optimized than its send path
- Phones transmit at much lower power on 6 GHz

**Multiple streams (`-P 6`)**: Overcomes single-flow TCP limitations like slow start, congestion window, and socket buffer limits. Four to eight streams usually hit peak; more gives diminishing returns.

**TCP window size (`-w 2M`)**: Less critical on LAN where RTT is tiny, but can help with bursty traffic.

## Why no 2×2 client hits 2.5 Gbps on WiFi

Even with everything optimized, I'll never see 2.5 Gbps on my phone. Here's why:

The fastest PHY a 2×2 client can negotiate on 160 MHz WiFi 7 is about 2.88 Gbps (4096-QAM, MCS13). But that's the raw link rate. After overhead:
- MAC/PHY overhead (preambles, pilots, guard intervals, CSMA/CA backoff, block ACKs)
- IP/TCP headers
- Encryption overhead

Best-case TCP "goodput" is typically 60-75% of PHY on a clean single-client link. So 60-75% of 2.88 Gbps gives you roughly 1.7-2.1 Gbps. That's why reviews land around 1.6-1.9 Gbps.

To exceed 2.0-2.1 Gbps you'd need:
- 320 MHz channels (not supported on iPhones)
- More spatial streams (3×3 or 4×4, but phones are 2×2)
- WiFi 7 MLO using multiple bands simultaneously

## Key takeaways

For anyone else trying to maximize their WiFi 7 speeds:

1. **Don't test against the router itself** - Use a separate machine on >=2.5 GbE
2. **Check your actual channel width** - The client details panel tells the truth, not the SSID settings
3. **Set transmit power to High for testing** - But use Auto/Medium for daily use to avoid uplink/downlink imbalance
4. **Use reverse mode with multiple streams** - `iperf3 -c <server> -P 6 -R -t 20`
5. **Stand 6-10 feet away** - Too close can hurt signal quality

After all this debugging, I'm now consistently seeing 1.6-1.7 Gbps on WiFi 7 with my iPhone. Not quite the headline 1.9 Gbps some reviewers got, but definitely in the expected range for real-world performance. More importantly, I understand exactly why the numbers are what they are.

Now I just need my ISP to actually deliver that 2.5 Gbps upgrade...