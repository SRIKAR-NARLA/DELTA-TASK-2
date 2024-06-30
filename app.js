const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentTime,lastTime;
let interval;



canvas.width = window.innerWidth*0.5;
canvas.height = window.innerHeight*0.5;
let factor =20;

let game = new Game(ctx, canvas.width, canvas.height);

function showDialog(dialogId) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById(dialogId).style.display = 'block';
}

function closeDialog(dialogId) {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById(dialogId).style.display = 'none';
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('hi')
    showDialog('startDialog');
});


function startGame() {
    closeDialog('startDialog');
    showInstructions();
}

function showInstructions() {
    showDialog('instructionsDialog');
}

function closeInstructions() {
    closeDialog('instructionsDialog');
    game.paused=false;
    gameLoop();
}

function gameOver() {
    showDialog('gameOverDialog');
    updateLeaderboard();
}

function restartGame() {
    closeDialog('gameOverDialog');
    game.reset();
    game.paused = false;
    game.gameOver = false;
}

function updateLeaderboard() {
    // Assume we have a way to get the leaderboard data
    const scores = game.loadLeaderBoard(); // This function should return an array of scores
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    console.log(scores)

    scores.forEach((score,index)=> {
        const listItem = document.createElement('li');
        listItem.textContent = `${index+1}. ${score}`;
        leaderboardList.appendChild(listItem);
    });
}

// Add event listeners to all inventory buttons
const inventoryButtons = document.querySelectorAll('.inventory-item');
inventoryButtons.forEach(button => {
    button.addEventListener('click', function() {
        console.log(`${this.innerText} button clicked`);
        // Perform actions specific to the button clicked
        handleInventoryItemClick(this.innerText);
    });
});

// Handle inventory item click
function handleInventoryItemClick(itemName) {
    switch(itemName) {
        case 'Mines':
            console.log('Mines selected');
            if(game.cash>=50 && game.player.y===game.height-game.player.height){
                    game.utilities.push(new Mine(game,game.player.x,game.player.y+35))
                    console.log(game.utilities)
                    game.cash-=50;
            }
            closeDialog('inventoryDialog');
            break;
        case 'Traps':
            console.log('Traps selected');
            if(game.cash>=25 && game.player.y===game.height-game.player.height){
                game.utilities.push(new Trap(game,game.player.x,game.player.y+35))
                console.log(game.utilities)
                game.cash-=25;
            }
            closeDialog('inventoryDialog');          
            break;
        case 'Blocks':
            console.log('Blocks selected');
            if(game.cash>=75){
                game.utilities.push(new Block(game,game.player.x,game.player.y))
                console.log(game.utilities)
                game.cash-=75;
            }
            closeDialog('inventoryDialog');          
            break;
        case 'Tower 1':
            console.log('Tower 1 selected');
            if(game.cash>=200 && game.player.y===game.height-game.player.height){
                game.utilities.push(new LeftTower(game,game.player.x,game.player.y))
                console.log(game.utilities)
                game.cash-=200;
            }
            closeDialog('inventoryDialog');          
            break;
        case 'Tower 2':
            console.log('Tower 2 selected');
            if(game.cash>=300 && game.player.y===game.height-game.player.height){
                game.utilities.push(new DoubleTower(game,game.player.x,game.player.y))
                console.log(game.utilities)
                game.cash-=300;
            }
            closeDialog('inventoryDialog');          
            break;
        case 'Tower 3':
            console.log('Tower 3 selected');
            if(game.cash>=200 && game.player.y===game.height-game.player.height){
                game.utilities.push(new RightTower(game,game.player.x,game.player.y))
                console.log(game.utilities)
                game.cash-=200;
            }
            closeDialog('inventoryDialog');          
            break;
        case 'Close':
            closeDialog('inventoryDialog');          
            break;
        default:
            console.log('Unknown item selected');
            break;
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}
