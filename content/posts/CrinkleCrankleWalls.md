---
title: "Do Wavy Walls Really Use Fewer Bricks? I Tested It in Blender"
date: '2026-07-04T10:00:00+01:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - blender
  - geometry-nodes
  - simulation
  - 3d
  - physics
  - architecture
keywords:
  - crinkle crankle wall
  - wavy wall
  - serpentine wall
  - blender
  - geometry nodes
  - physics simulation
  - brick count
description: Do crinkle crankle walls actually save bricks? Geometry nodes, rigid body sims, and some answers.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---


![Render of a serpentine wall in Blender](/crinkle-crankle/render.png)

Fifteen years or so ago I read about this cool thing on Reddit, called [Crinkle Crankle walls](https://en.wikipedia.org/wiki/Crinkle_crankle_wall), which is basically an unusual type of wall made out of bricks that is curvy.

As far as I can see, this first started in Egypt 3 and a half millennia ago, but nowadays it's most "common" in England.

Fast forward to 11 years ago and I moved to the UK myself. I had forgotten about these, but one day during a bus trip, I noticed one of these curvy walls out the window.

It got me excited again and I started reading more about it, and that's when I found out that while there is some information online about them, there's way less than you would expect.


## The theories


There are some mentions on Wikipedia about how "The sinusoidal curves in the wall provide stability and help it to resist lateral forces", but the source website is always offline when I try to visit it.

They usually compare it saying: "leading to greater strength than a straight wall of the same thickness of bricks without the need for buttresses". Hm, same thickness, huh? Well, actually not!

I found this out after watching every single video I could find online about it (and later Wikipedia added this detail too: A typical free-standing brickwork wall is "one brick thick", but this is measured as one brick lengthways. Such a wall is built from two bricks side by side).


Loads of sources, because of this, claim that the straight walls use 2 bricks of width (and that's usually what I see in real life when I walk next to walls) whereas this one uses only one brick, while being stronger (again, varies a lot, some say it's just as strong, others like random comments in building Discord servers say it's up to 3x stronger against lateral impact).


Ok, well another issue is that while the walls use half the bricks in width, surely it compensates and uses more in length because of the curves, right? And surely this depends a lot on the amplitude and frequency of the sinusoid that makes up the wall.

Well, it's basically impossible to find any clear information. There are some out there that sound like the holy grail, for example Wikipedia talks about how Thomas Jefferson, yes, that one, incorporated serpentine walls into the architecture of the University of Virginia and that there is a university document in his own hand where he shows how he calculated the savings and combined aesthetics with utility. And you've guessed it, when I click the source... No results found.

The only measurement I could find is this image from [gobrick](https://www.gobrick.com/media/file/29a-brick-in-landscape-architecture---garden-walls.pdf). It helped with the angles, but it wasn't everything I needed.


![Serpentine wall measurements from gobrick](/crinkle-crankle/measurements.png)


So I did the next best thing and I obsessively looked at all the images I could find, checked Google Maps and tried to come up with a measurement.


## Building the wall in Blender


I went straight to Blender, and started making a fully procedural serpentine wall in geometry nodes. It took a couple of hours but what I ended up with is this beauty of a network:


![The geometry nodes network](/crinkle-crankle/geonodes.png)


I have attached the [Blender file here](/crinkle-crankle/serpentine.blend) so you can go through it at your own pace, but I do want to highlight some of the cool things I've had to do.


For example, the way I created the wall is I have generated a curve, I have shaped it as a sine wave (with controls over frequency and amplitude) and then later on, for each point on that curve I would spawn a brick.

All good, but I wanted my wall to be more than a brick tall, which means I now needed to spawn a vertical line with however many points I want to have bricks, and then for each point I spawned my sinusoidal line of bricks.

The issue? Well, they all started and ended at the same point, and I wanted them to be offset like in real life. I wanted every other line of the wall to be offset by half a brick, and I couldn't do that because by the time I had spawned the lines I lost their index.

Then I discovered that Blender added "for each" nodes in geometry nodes since I last used it, which let me run whatever algorithm I wanted through all the lines while getting a new index, which is exactly what I've done.


![The for each nodes](/crinkle-crankle/foreach.png)


Another thing I found pretty neat is that I have created the bricks in geometry nodes too, based on the UK brick measurements, and then at the end, to find out dynamically how many bricks my wall had in total, all I needed to do is divide the total number of faces in my wall by the total amount of faces in my brick.


![Counting bricks by dividing face counts](/crinkle-crankle/countbricks.png)


The brick material is nothing to write home about, I have just played around with random noise and colours until something looked good enough and random, where it would be harder to notice the repeating pattern.

The point of this whole thing wasn't for it to look good, right? Ok, I'm just coping.


![The brick shader](/crinkle-crankle/shader.png)


## Does it use fewer bricks?


I basically did the same for the straight wall but I skipped the sinusoidal function and lo and behold, I had fully parametric walls in Blender.

So what does that mean? Well, we had to find out in real time, does this use fewer bricks for the same length? I already had the computed length in the geometry nodes so using some more font magic I instantiated that on the screen in 3D and rendered it overnight:


<video controls style="width: 100%; height: auto;">
  <source src="/crinkle-crankle/LengthAnimation.webm" type="video/webm">
  <source src="/crinkle-crankle/LengthAnimation.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


Look at that, at 100m the serpentine walls use 55% as many bricks when built the way most of the ones I can find are! That is massive! So myth confirmed there.


## The impact test


But what about it being more resistant to lateral impact? Well, I have added a slope with a 150kg metal ball rolling down it towards our beautiful serpentine wall.


<video controls style="width: 100%; height: auto;">
  <source src="/crinkle-crankle/CurvedWallCombined150kg.webm" type="video/webm">
  <source src="/crinkle-crankle/CurvedWallCombined150kg.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


Well, ok, the wall fell... Not great. Let's see how the straight wall with double thickness fared:


<video controls style="width: 100%; height: auto;">
  <source src="/crinkle-crankle/StraightWallCombined150kg.webm" type="video/webm">
  <source src="/crinkle-crankle/StraightWallCombined150kg.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


Well that fell too, but the ball didn't get to the other side, so I think I would call this myth a bust.


But ok, I hear you, why don't we try with a heavier ball? Alright, I got the 300kg ball out of the depths of Blender. And here we go:


<video controls style="width: 100%; height: auto;">
  <source src="/crinkle-crankle/CurvedWallCombined300kg.webm" type="video/webm">
  <source src="/crinkle-crankle/CurvedWallCombined300kg.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


Honestly that didn't stand a chance. The ball went through it like through Lego. Let's take a look at the straight wall with the 300kg ball now:


<video controls style="width: 100%; height: auto;">
  <source src="/crinkle-crankle/StraightWallCombined300kg.webm" type="video/webm">
  <source src="/crinkle-crankle/StraightWallCombined300kg.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


Sadly it still went through it, but it stopped way quicker, so I think as far as weekend Blender renders based on sparse measurements but still correct weights and sizes go (including brick on brick friction but sadly excluding filling, which for what it's worth is excluded from both of them, making the comparison fair), this myth is busted.


I can't help but notice though that the size of the wall that's damaged in the serpentine wall is smaller.

Fewer bricks fell, so it might be less costly to repair in materials (while being more costly in man hours).


It also looks almost the same as a [real life collapsed crinkle-crankle wall from 2013 in Easton](https://www.bbc.co.uk/news/uk-england-suffolk-24984978), so I take that as a small win.


![Collapsed crinkle-crankle wall in Easton](/crinkle-crankle/easton.png)


*Photo by Evelyn Simak and Ian Palfreyman, via [BBC News](https://www.bbc.co.uk/news/uk-england-suffolk-24984978).*


## Conclusion


In conclusion, serpentine walls are super cool, they are not the strongest against brute impact (but might be against winds, it's hard for me to measure) and you should give geometry nodes in Blender a go.

See you next time!
