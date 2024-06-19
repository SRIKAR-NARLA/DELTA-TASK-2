const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth*0.5;
canvas.height = window.innerHeight*0.5;
let factor = 20;

let game = new Game(ctx, canvas.width, canvas.height);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();