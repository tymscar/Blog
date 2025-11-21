---
title: "OpenAI Demo'd Fixing Issue #2472 Live. It's Still Open."
date: '2025-11-21T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - ai
  - openai
  - development
  - promises
keywords:
  - ai
  - openai
  - gpt5
  - development
  - promises
description: OpenAI live-fixed a bug on stage during their GPT-5 launch, promised to merge it after the show, and three months later it's still broken. Nobody seems to care.
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

During OpenAI's GPT-5 launch event, they demoed the model's ability to fix real bugs in production code. Live on stage. In their own repository. The kind of demo that makes CTOs reach for their credit cards and engineers nervously update their resumes. There's just one small problem: the fix they promised to merge "right after the show" is still sitting there, unmerged, three and a half months later.

## The Demo

At exactly 1 hour and 7 minutes into their launch video, they started working on issue [#2472](https://github.com/openai/openai-python/issues/2472) in their openai-python repository.

{{< youtube id="0Uu_VJeVVfo" start="4029" >}}

A real issue, affecting real users, that had been open for months. The model appeared to understand the problem, wrote what seemed like a reasonable fix, and at 1:11:00, they declared: "this looks roughly right, and would love to merge the PR too."

Then came the promise: "Let's do that after the show."

The demo moved on. Revolutionary AI was here to fix our bugs.

## What Actually Happened

Nothing.

I checked after the show. Nothing.

I gave them the benefit of the doubt. Live demos are chaotic. Laptops need to be returned. Teams need to debrief. So I checked the next day. Still nothing.

Next week? Nope.

Next month? The issue sat there, untouched.

It's now been exactly three and a half months. Issue #2472 is still open. The magical GPT-5 fix that was "roughly right" never materialized into an actual pull request.

## The Part That Makes Even Less Sense

Here's where it gets properly weird: they didn't forget about the issue. When people started flooding the comments section with jokes about the unfixed demo (because of course they did), OpenAI locked the thread to contributors only to prevent spam.

![Comments on the issue](/gpt5-live-issue-fix/comment1.png)
![More comments on the issue](/gpt5-live-issue-fix/comment2.png)
![Even more comments on the issue](/gpt5-live-issue-fix/comment3.png) 

Think about that for a second. Someone at OpenAI:
1. Noticed the issue was getting spammed
2. Made the decision to lock it
3. Took the time to actually lock it
4. But didn't merge the fix they claimed worked

They had more interaction with the issue's comment moderation than with the actual code fix they demoed on stage.

At this point, telling GPT "hey, LGTM, merge it" would literally take less time than what they've already spent managing the thread. But they haven't.

## What They Should Have Done

The responsible thing would have been to actually test the fix on stage. Run the test suite. Show that it passes. Then either:

**If it worked:** Merge it on the spot (though I wouldn't), or more responsibly, explain that even though the AI found a fix, you still need human review to ensure it's not just working around the test cases or introducing subtle bugs. Use it as a teaching moment about AI as a tool, not a replacement.

**If it didn't work:** Own it. Say "looks like we're not quite there yet, but this shows how GPT can be a valuable debugging companion even when it doesn't nail the solution first try." Engineers would respect the honesty.

Instead, they painted this picture of a magical future where AI just fixes your bugs while you sip coffee, then never delivered on even the most basic proof of that claim.

## Why Nobody's Talking About This

This is perhaps the strangest part. A major tech company stages a demo showing their AI fixing a real production bug, promises to merge the fix, and then just... doesn't. And somehow this isn't a bigger story.

Imagine if a FAANG company pulled this move - demo a feature on stage, promise to ship it, then just... don't. The tech press would have a field day. It's happened before.

But here we are, months later, and the issue still sits open.

## The Actual Damage

This kind of thing matters because it shapes expectations. When executives see these demos, they don't understand the nuance. They see AI fixing bugs in minutes and wonder why their engineering team needs weeks for similar fixes. They see a future where headcount can be reduced because "the AI can handle it."

Meanwhile, those of us actually writing code know the reality: AI can be a useful tool but still needs human judgment, especially for production systems. But try explaining that to someone who just watched OpenAI "fix" a bug live on stage.

The responsible thing would be to show AI as it actually is: a powerful assistant that can help with certain tasks but still needs human oversight, validation, and often significant correction. Instead, we get demonstrations that set unrealistic expectations.

## The Oddest Part

Maybe the fix needed more testing. Maybe it didn't quite work as expected. Maybe priorities shifted. These things happen in software development all the time. 

But after making such a public demonstration, showing how AI could tackle real issues in real repositories, you'd expect at least some follow-through. Even a comment saying "turned out to be more complex than the demo suggested" would be better than silence.

Three and a half months later, the issue remains open. The promised merge never happened. And we're left wondering what actually worked in that demo and what didn't.
