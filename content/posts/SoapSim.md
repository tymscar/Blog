---
title: Soap sim
date: '2024-01-18T12:00:00+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - web
  - wasm
  - rust
  - javascript
  - development
keywords:
  - web
  - wasm
  - rust
  - javascript
  - development
description: Soap sim
showFullContent: false
readingTime: true
hideComments: true
draft: true
---

# Soap sim in JS
<script type="module" src="/soap-sim/index-js.js"></script>
<div id="js-canvas-container" style="display: flex; justify-content: center; align-items: center; ">
    <canvas id="js-canvas" style="width: 100%; height: auto;">
        Your browser does not support the canvas element.
    </canvas>
</div>
<div style="display: flex; justify-content: space-around; align-items: center; padding-top: 1em ">
    <button id="js-simulate-button">Toggle JS simulation</button>
    <button id="js-reset-button">Reset JS simulation</button>
</div>

# Soap sim in WASM (Rust)
<script type="module" src="/soap-sim/index-wasm.js"></script>
<div id="wasm-canvas-container" style="display: flex; justify-content: center; align-items: center; ">
    <canvas id="wasm-canvas" style="width: 100%; height: auto;">
        Your browser does not support the canvas element.
    </canvas>
</div>
<div style="display: flex; justify-content: space-around; align-items: center; padding-top: 1em ">
    <button id="wasm-simulate-button">Toggle WASM simulation</button>
    <button id="wasm-reset-button">Reset WASM simulation</button>
</div>

