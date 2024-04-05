---
title: Simulating soapy water
date: '2024-04-04T12:00:00+00:00'
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
description: Exploring the fascinating world of simulating soapy water using Rust and WASM
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

Do you ever just scroll mindlessly online and stumble upon a satisfying video about physics and you can't help but have that urge to reproduce it in code?


No, just me? Well perhaps this blogpost isn't for you then. Otherwise, buckle up!


The experiment that caught my eye this time around was this video of a plate of water, with some pepper sprinkled on top uniformly, that when touched with a soapy finger, makes the pepper repel.


{{< youtube ho0o7H6dXSU >}}


Now obviously coding a whole fluid simulation with particles and forces was too much to do just for a silly visualization, so I decided on writing a simple force repellent simulation in Javascript.


I quickly then noticed that the performance, while manageable, wasn't fantastic, so I ended up writing the core logic again in Rust, and embedding it onto the page with WASM. This was quite a lot of fun, and the end result was a simulation more than twice as fast.


Now instead of just showing you the Rust one, I decided on making them interactive, with an FPS counter, and have them both be runnable in your browser. Make sure to pause the one you're not using at the time, so you can correctly assess the FPS differences!

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

## Lessons learned during this
When I first started working on the Rust WASM version, I initially expected a much bigger speedup, however after performance profiling the code, I learned that most of the work was not done by the logic in Javascript, but rather by the interaction with the DOM itself.
Because at the time of writing, there is no direct way from WASM (be it Rust, or your favourite language that can deploy to WASM) to interact with the DOM, it all has to go through Javascript. This meant that for my usecase at best (read as `never`) my Rust code would be as fast as Javascript while interacting with the DOM.


Now the second kicker: how do you tell Javascript where the grains of pepper are in your simulation? For me this is what my simulation State looked like in Rust:

```rust
#[wasm_bindgen]
pub struct State {
  circles: Vec<Entity>,
  soaps: Vec<Entity>,
  canvas_size: f64,
  circle_size: f64,
  repulsion_strength: f64,
  positions: Rc<RefCell<Vec<f64>>>
}
```

Things like where the soap spots are, while being costly to transmit, are only done so maybe a couple of times over the whole lifespan of the simulation, whereas the thousands of pepper positions would need to jump from WASM to Javascript tens of times a second. So what gives? Well I ended up doing something I didn't know was possible in WASM before this, and that was sending over a pointer. Here is the Rust side:

```rust
#[wasm_bindgen]
impl State {
  // other stuff...
  pub fn get_positions_ptr(&self) -> *const f64 {
    self.positions.borrow().as_ptr()
  }
}
```

On the Javascript side then I would have to get the positions pointer from WASM, and then make a view into said array like this:

```js
const positionsPtr = wasmState.get_positions_ptr();
const positions = new Float64Array(wasmModule.memory.buffer, positionsPtr, numOfCircles * 2);
```

I find it interesting that we basically use the pointer as an offset in the buffer, and we tell it how long it is so we can have a mapping. From here on out, if I were to interact with the array on the Javascript side, it would modify it on the Rust side too!


Just to give an example of interaction from the other side, Javascript->Rust, here is how the state finds out about the new soap spots when the user taps/clicks on the screen. In Rust we have a receiver function:

```rust
#[wasm_bindgen]
impl State {
  // other stuff...
  pub fn add_soap(&mut self, x: f64, y: f64) {
	self.soaps.push(Entity::new(x, y, 0.0, 0.0));
  }
}
```

And then on the Javascript side we have this:

```js
const handleTap = (event) => {
  const canvas = document.getElementById('wasm-canvas');
  const mousePos = getTapPos(canvas, event);
  wasmState.add_soap(mousePos.x, mousePos.y);
}
```

### I should do this more often

I had a lot of fun working on this and now I can't help but wait for the day when WASM has full control over the DOM, imagine the performance!

This project has been a great learning experience, and it's always satisfying to see the final result come to life. I encourage you to take on similar challenges and explore new approaches to coding. Who knows, you might just discover a whole new way of thinking about a problem!

Until next time, happy coding!
