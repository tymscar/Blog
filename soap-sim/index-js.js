let canvasSize = 400;
const circleSize = 3;
const repulsionStrength = 0.0005;
let runSimulation = false;

let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 1;

let circles = [];
let soap = [];

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
    const canvas = document.getElementById('js-canvas');
    canvasSize = canvas.offsetWidth;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    resetSimulation();
}

const simulateButtonHandler = () => {
    runSimulation = !runSimulation;
    render();
}

const resetSimulation = () => {
    circles = [];
    soap = [];

    for (let i = 0; i < canvasSize/(circleSize * 2); i+=2) {
        for (let j = 0; j < canvasSize/(circleSize * 2); j+=2) {
            circles.push({
                x: i * circleSize * 2 + circleSize,
                y: j * circleSize * 2 + circleSize,
                dx: 0,
                dy: 0,
            });
        }
    }

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
    const canvas = document.getElementById('js-canvas');
    const mousePos = getTapPos(canvas, event);
    soap.push({
        x: mousePos.x,
        y: mousePos.y
    });
}

const updatePositions = () => {

    circles = circles.map((circle, index) => {
        let dx = 0;
        let dy = 0;

        circles.forEach((other, otherIndex) => {
            if (index !== otherIndex) {
                let distX = circle.x - other.x;
                let distY = circle.y - other.y;
                let distance = Math.sqrt(distX * distX + distY * distY);
                let minDist = circleSize * 3;

                if (distance < minDist && distance > 0) {
                    let overlap = minDist - distance;
                    dx += (overlap / distance) * distX * repulsionStrength;
                    dy += (overlap / distance) * distY * repulsionStrength;
                }
            }
        });

        soap.forEach(soap => {
                let distX = circle.x - soap.x;
                let distY = circle.y - soap.y;
                let distance = Math.sqrt(distX * distX + distY * distY);
                let minDist = canvasSize/8;

                if (distance < minDist && distance > 0) {
                    let overlap = minDist - distance;
                    dx += (overlap / distance) * distX * repulsionStrength;
                    dy += (overlap / distance) * distY * repulsionStrength;
                }
        });

        circle.dx += dx;
        circle.dy += dy;

        circle.x += circle.dx;
        circle.y += circle.dy;

        circle.x = Math.max(circleSize, Math.min(canvasSize - circleSize, circle.x));
        circle.y = Math.max(circleSize, Math.min(canvasSize - circleSize, circle.y));

        return circle;
    });
};

const render = () => {
    const canvas = document.getElementById('js-canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a6788';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.strokeStyle = '#252323';
    circles.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circleSize/2, 0, 2 * Math.PI);
        ctx.fillStyle = '#2d2a2a';
        ctx.fill();
        ctx.stroke();
    });

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
        updatePositions();
    }

    requestAnimationFrame(simulate);
}


window.addEventListener('load', async () => {
    const canvas = document.getElementById('js-canvas');
    canvas.addEventListener('click', handleTap);
    document.getElementById('js-simulate-button').onclick = simulateButtonHandler;
    document.getElementById('js-reset-button').onclick = resetSimulation;
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    resetSimulation();
    requestAnimationFrame(simulate);
});