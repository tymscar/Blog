import init, { State } from '/soap-sim/pkg/soap_sim.js';

let canvasSize = 4;
let runSimulation = false;
const circleSize = 3;
let wasmModule = undefined;
let wasmState = undefined;
let numOfCircles = 0;

let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 1;

const updateFPS = () => {
    const now = Date.now();
    const delta = now - lastFrameTime;
    frameCount++;

    if (delta >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
    }
}

const resizeCanvas = () => {
    const canvas = document.getElementById('wasm-canvas');
    canvasSize = canvas.offsetWidth;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    wasmState.update_canvas_size(canvasSize);
    wasmState.reset();
    wasmState.tick();
    numOfCircles = wasmState.get_amount_of_circles();
    render();
}

const simulateButtonHandler = () => {
    runSimulation = !runSimulation;
    render();
}


const getTapPos = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

const handleTap = (event) => {
    const canvas = document.getElementById('wasm-canvas');
    const mousePos = getTapPos(canvas, event);
    wasmState.add_soap(mousePos.x, mousePos.y);
}

const render = () => {
    const canvas = document.getElementById('wasm-canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a6788';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.strokeStyle = '#252323';

    const positionsPtr = wasmState.get_positions_ptr();
    const positions = new Float64Array(wasmModule.memory.buffer, positionsPtr, numOfCircles * 2);

    for (let i = 0; i < positions.length; i += 2) {
        const x = positions[i];
        const y = positions[i + 1];
        ctx.beginPath();
        ctx.arc(x, y, circleSize/2, 0, 2 * Math.PI);
        ctx.fillStyle = '#2d2a2a';
        ctx.fill();
        ctx.stroke();
    }

    updateFPS();
    ctx.font = '35px Arial';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;

    if(runSimulation){
        ctx.fillText('FPS: ' + fps, 10, canvasSize - 10);
        ctx.strokeText('FPS: ' + fps, 10, canvasSize - 10);
    } else {
        ctx.fillText('Paused', 10, canvasSize - 10);
        ctx.strokeText('Paused', 10, canvasSize - 10);
    }
}

const simulate = () => {

    if(runSimulation){
        render();
        wasmState.tick();
    }

    requestAnimationFrame(simulate);
}

window.addEventListener('load', async () => {
    wasmModule = await init();
    wasmState = State.new(canvasSize, 3, 0.0005);
    console.log(wasmModule)

    const canvas = document.getElementById('wasm-canvas');
    canvas.addEventListener('click', handleTap);
    document.getElementById('wasm-simulate-button').onclick = simulateButtonHandler;
    document.getElementById('wasm-reset-button').onclick = () => {
        wasmState.reset();
        wasmState.tick();
        render();
    }
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    requestAnimationFrame(simulate);
});
