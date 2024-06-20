class Game{
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.player = new Player(this,200,200,0,1,0,1,40,40,100);
        this.score=0;
        this.cash=200;
        this.zombies = [];
        this.utilities = [];
        this.powerups=null;
        this.paused=false;
        this.gameOver=false;
        this.startSpawning();
        this.spawnPowerup();
    }

    reset() {
        this.player = new Player(this, 200, 200, 0, 1, 0, 0.1, 40, 40, 100);
        this.score = 0;
        this.cash = 200;
        this.zombies = [];
        this.powerups = null;
        this.utilities = [];
        this.paused = false;
        this.gameOver = false;
        this.leaderBoard = this.loadLeaderBoard();
        this.startSpawning();
        this.spawnPowerup();
    }

    restartGame() {
        if (this.gameOver) {
            this.reset();
            this.paused = false;
            this.gameOver = false;
        }
    }

    spawnPowerup(){
        if(this.gameOver===false || this.paused===false){
            const powerupTypes = [
                { image: 'ns', effect: 'drain', duration: 5000 },
                { image: 'ns', effect: 'heal', duration: 7000 },
                { image: 'ns', effect: 'freeze', duration: 10000 }
            ];
            const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            this.powerups=new Powerup(this, randomPowerup.name, randomPowerup.effect, randomPowerup.duration);
            setTimeout(() => this.spawnPowerup(), 15000);
        }
    }

    startSpawning() {
        this.spawnZombie1();
        this.spawnZombie2();
        this.spawnZombie3();
    }

    spawnZombie1() {
        if (!this.gameOver) {
            this.zombies.push(new Zombie1(this));
            setTimeout(() => this.spawnZombie1(), 5000);
        }
    }

    spawnZombie2() {
        if (!this.gameOver) {
            if(this.score>5)
                this.zombies.push(new Zombie2(this));
            setTimeout(() => this.spawnZombie2(), 15000);
        }
    }

    spawnZombie3() {
        if (!this.gameOver) {
            if(this.score>25)
                this.zombies.push(new Zombie3(this));
            setTimeout(() => this.spawnZombie3(), 25000);
        }
    }

    update() {
        if (this.paused || this.gameOver) {
            return;
        }
        this.player.update();
        this.zombies.forEach(zombie => zombie.update());
        this.powerups && this.powerups.update();
        this.player.shotArray.forEach(shot => shot.update());
        this.utilities && this.utilities.forEach(utility=>{
            utility.update();
            if(utility.name==='tower')
                utility.shoot();
        })
        this.checkCollisions();
        this.player.isBlocked=null;

        if(this.player.health<=0)this.player.health=0;
                    if(this.player.health===0){
                        this.gameOver=true;
                        this.saveScore(this.score);
                        this.leaderBoard = this.loadLeaderBoard();
        }
    }

    draw() {
        this.player.draw(this.ctx);
        this.zombies.forEach(zombie => zombie.draw(this.ctx));
        this.player.shotArray.forEach(shot => shot.draw(this.ctx));
        this.powerups && this.powerups.draw(this.ctx);
        this.utilities && this.utilities.forEach(utility=>utility.draw(this.ctx));
        this.ctx.fillStyle = 'red';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.width - 150, 20);
        this.ctx.fillText(`Cash: ${this.cash}`, this.width - 150, 50);
        
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('Paused', this.width / 2 - 60, this.height / 2);
        }
        
        if (this.gameOver) {
           this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
           this.ctx.fillRect(0, 0, this.width, this.height);
           this.ctx.fillStyle = 'white';
           this.ctx.font = '40px Arial';
           this.ctx.fillText('Game Over', this.width / 2 - 100, this.height / 2);
           this.ctx.font = '20px Arial';
           this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2 - 60, this.height / 2 + 40);
           this.displayLeaderBoard();
        }
    }

    saveScore(score) {
        let leaderBoard = this.loadLeaderBoard();
        leaderBoard.push(score);
        leaderBoard.sort((a, b) => b - a); 
        if (leaderBoard.length > 3) {
            leaderBoard.pop(); 
        }
        localStorage.setItem('leaderBoard', JSON.stringify(leaderBoard));
    }

    loadLeaderBoard() {
        let leaderBoard = localStorage.getItem('leaderBoard');
        return leaderBoard ? JSON.parse(leaderBoard) : [];
    }

    displayLeaderBoard() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Leaderboard:', this.width / 2 - 60, this.height / 2 + 80);
        this.leaderBoard.forEach((score, index) => {
            this.ctx.fillText(`${index + 1}. ${score}`, this.width / 2 - 60, this.height / 2 + 100 + index * 20);
        });
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    isCollidingCR(circle, rect) {
        const closestX = this.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = this.clamp(circle.y, rect.y, rect.y + rect.height);
    
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
    
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        return distanceSquared < circle.radius * circle.radius;
    }

    isCollidingRR(rect1, rect2) {
        return (
            rect1.x <= rect2.x + rect2.width &&
            rect1.x + rect1.width >= rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    checkCollisions() {
        //Shot and Zombie
        this.player.shotArray.forEach(projectile => {
            this.zombies.forEach(zombie => {
                if (this.isCollidingCR(projectile, zombie)) {
                    zombie.health-=projectile.damage;
                    if(projectile.type==='type1')
                        this.player.shotArray = this.player.shotArray.filter(p => p !== projectile);
                }
            });
        });

        // Zombie and Player
        this.zombies.forEach(zombie=>{
            if(this.isCollidingRR(zombie,this.player)){
                if(zombie.justHit===false){
                    zombie.justHit=true;
                    this.player.health-=25;
                    if(zombie instanceof Zombie3){
                        for(let i=0;i<5;i++){
                            setTimeout(()=>{
                                this.player.health-=5;
                                if(this.player.health<=0)this.player.health=0;
                            },5000);
                        }
                    }
                    setTimeout(()=>{
                        zombie.justHit=false;
                    },2500);
                }
            }
        })

        // Player and PowerUp
        if(this.powerups && this.isCollidingRR(this.powerups,this.player)){
            this.powerups.applypowerup();
            this.powerups=null;
        } 

        // Player and Block
        let isFree = true;
        this.utilities.forEach(utility=>{
            if(utility.name==='block'){
                if (this.isCollidingRR(this.player, utility)) {
                    // Top collision
                    if (this.player.y + this.player.height < utility.y + this.player.vy) {
                        this.player.y = utility.y - this.player.height;
                        this.player.vy = 0;
                        this.player.ay = 0;
                        this.player.isJumping = false;
                        this.player.onBlock = true;
                        isFree=false;
                    }
                    // Bottom collision
                    else if (this.player.y >= utility.y + utility.height - this.player.vy) {
                        this.player.y = utility.y + utility.height;
                        this.player.vy = 0;
                    }
                }
                else if(this.player.onBlock && (this.player.x > utility.x + this.player.width || this.player.x < utility.x - this.player.width)){
                    this.player.onBlock=false;
                    this.player.ay=1;
                }
            }
        })
        if(isFree===true && !this.player.isFlying){
            this.player.onBlock=false;
            this.player.ay=1;
        }
        
        // Utility and Zombie
        this.zombies.forEach(zombie=>{
            this.utilities.forEach(utility=>{
                if (this.isCollidingRR(utility, zombie)) {
                    if(utility.name==='mine'){
                        this.utilities = this.utilities.filter(p => p !== utility);
                        zombie.health-=utility.damage;
                    }else if(utility.name==='trap'){
                        this.utilities = this.utilities.filter(p => p !== utility);
                        zombie.vx/=2;
                    }else if(utility.name==='block'){
                        if(zombie.y+zombie.height===utility.y+utility.height){
                            zombie.isBlocked=true;
                            utility.health-=50;
                            if(utility.health===0)this.utilities = this.utilities.filter(p => p !== utility);   
                        }
                    }else if(utility.name==='tower'){
                        zombie.isBlocked=true;
                        utility.health-=25;
                        if(utility.health===0){
                            utility.isdestroyed=true;
                            this.utilities = this.utilities.filter(p => p !== utility);
                        }
                    }
                }
            })
        })
    }

}

class Player{
    constructor(game,x,y,vx,vy,ax,ay,height,width,health){
        this.game=game;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = ax;
        this.ay = ay;
        this.isJumping = false;
        this.isFlying = false;
        this.onBlock=false;
        this.isBlocked=null;
        this.health = health;
        this.shotArray=[];
        this.prevShotTime=0;
        this.weapon1 = new Weapon1(this);
        this.weapon2 = new Weapon2(this);
        this.weapon3 = new Weapon3(this);
        this.weapon=this.weapon1;
        this.facingDirection = 'right';
        this.wfacingDirection = 'right';
        this.maxFuel = 200; 
        this.currentFuel = this.maxFuel; 
        this.fuelConsumptionRate = 1; 
        this.fuelRegenerationRate = 0.25;
        this.fireParticles=[]; 
        this.control();
        this.mouseX = null;
        this.mouseY = null;
    }

    control(){
        window.addEventListener('keyup', (e) => {
            if (e.key === 'd' || e.key === 'a'){
                this.vx=0;
                this.game.zombies.forEach(zombie=>{
                    zombie.dx=0;
                })
                this.game.utilities.forEach(utility=>{
                    utility.dx=0;
                })
                this.shotArray.forEach(shot=>{
                    shot.dx=0;
                })
                if(this.game.powerups)this.game.powerups.dx=0;
            }
            if(e.key==='w'){
                this.vy=0;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'd') {
                if(this.x>=800){
                    this.x=800;
                    this.vx = 0;
                    this.game.zombies.forEach(zombie=>{
                        zombie.dx=-5;
                    })
                    this.game.utilities.forEach(utility=>{
                        utility.dx=-5;
                    })
                    this.shotArray.forEach(shot=>{
                        shot.dx=-5;
                    })
                    if(this.game.powerups)this.game.powerups.dx=-5;
                }
                else this.vx = 5;
                this.facingDirection = 'right';
                this.wfacingDirection = 'right';
            }
            else if (e.key === 'a') {
                if(this.x<=200){
                    this.x=200;
                    this.vx = 0;
                    this.game.zombies.forEach(zombie=>{
                        zombie.dx=5;
                    })
                    this.game.utilities.forEach(utility=>{
                        utility.dx=5;
                    })
                    this.shotArray.forEach(shot=>{
                        shot.dx=5;
                    })
                    if(this.game.powerups)this.game.powerups.dx=5;
                }
                else this.vx = -5;
                this.facingDirection = 'left';
                this.wfacingDirection = 'left';
            }
            else if (e.key === ' ' && !this.isJumping) {
                this.isBlocked=null;
                this.vy = -factor;
                this.ay=factor/10;
                this.ax=this.ay;
                this.isJumping = true;
                this.onBlock=false;
                this.facingDirection = 'up';
            }
            else if(e.key==='w'){
                if (this.currentFuel > 0) {
                    this.isBlocked=null;
                    this.isJumping = true;
                    this.isFlying = true;
                    this.vy = -factor;
                    this.ay = 0;
                    this.facingDirection = 'up';
                    this.fireParticles=[];
                }
            }
            else if(e.key==='s'){
                this.isFlying=false;
                this.vy = factor;
                this.ay=factor/10;
                this.facingDirection = 'down';
                this.fireParticles=[];
            } 
            else if(e.key==='p'){
                this.game.restartGame();
            }else if(e.key==='1'){
                this.weapon=this.weapon1;
            }else if(e.key==='2'){
                if(this.game.score>20){
                    this.weapon=this.weapon2;
                }
                else{
                    console.log(this.game.score);
                }
            }else if(e.key==='3'){
                if(this.game.score>50){
                    this.weapon=this.weapon3;
                }
                else{
                    console.log(this.game.score);
                }
            }else if(e.key==='7'){
                if(this.game.cash>=50 && this.y===this.game.height-this.height){
                    this.game.utilities.push(new Mine(this.game,this.x,this.y+35))
                    this.game.cash-=50;
                }
            }else if(e.key==='8'){
                if(this.game.cash>=25 && this.y===this.game.height-this.height){
                    this.game.utilities.push(new Trap(this.game,this.x,this.y+35))
                    this.game.cash-=25;
                }
            }else if(e.key==='9'){
                if(this.game.cash>=75 && this.vy===0 && !this.isFlying && !this.isJumping){
                    this.game.utilities.push(new Block(this.game,this.x,this.y))
                    this.game.cash-=75;
                }
            }else if(e.key==='4'){
                if(this.game.cash>=200 && this.y===this.game.height-this.height){
                    this.game.utilities.push(new LeftTower(this.game,this.x,this.y))
                    this.game.cash-=200;
                }
            }
            else if(e.key==='5'){
                if(this.game.cash>=300 && this.y===this.game.height-this.height){
                    this.game.utilities.push(new DoubleTower(this.game,this.x,this.y))
                    this.game.cash-=300;
                }
            }
            else if(e.key==='6'){
                if(this.game.cash>=200 && this.y===this.game.height-this.height){
                    this.game.utilities.push(new RightTower(this.game,this.x,this.y))
                    this.game.cash-=200;
                }
            }else if(e.key==='f')this.game.paused=!this.game.paused;
        });

        window.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            if(!this.paused && !this.gameOver)
            {if(this.weapon===this.weapon3){
                this.weapon.shoot(this.x + this.width / 2, this.y, this.mouseX, this.mouseY);
            }else if(this.weapon===this.weapon1){
                this.weapon.shoot(this.x + this.width / 2, this.y, this.mouseX, this.mouseY);
                if(this.facingDirection==='right'){
                    this.x-=1;
                    this.y-=1;
                }else if(this.facingDirection==='left'){
                    this.x+=1;
                    this.y-=1;
                }
            }else if(this.weapon===this.weapon2){
                this.weapon.shoot(this.x, this.y);
            }}
        });
    }

    draw(c) {
        // if (this.mouseX !== null && this.mouseY !== null) {
        //     c.beginPath();
        //     c.moveTo(this.x + this.width / 2, this.y);
        //     c.lineTo(this.mouseX, this.mouseY);
        //     c.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        //     c.lineWidth = 2;
        //     c.stroke();
        //     c.closePath();
        // }

        this.fireParticles.forEach(particle => particle.draw(ctx));
        c.fillStyle = 'blue';
        c.fillRect(this.x, this.y, this.width, this.height);

        c.fillStyle = 'green';
        const HealthBarWidth = (this.health / 100) * this.width;
        c.fillRect(this.x, this.y - 10, HealthBarWidth, 5);

        c.strokeStyle = 'black';
        c.strokeRect(this.x, this.y - 10, this.width, 5);

        c.fillStyle = 'green';
        const fuelBarWidth = (this.currentFuel / this.maxFuel) * 100; 
        c.fillRect(10, 10, fuelBarWidth, 10);

        c.strokeStyle = 'black';
        c.strokeRect(10, 10, 100, 10);
    }

    createFireParticles() {
        for (let i = 0; i < 20; i++) {
            this.fireParticles.push(new FireParticle(this.game, this.x + this.width / 2, this.y + this.height));
        }
    }

    update() {
        if(this.x>800 ){
            this.vx=0;
            this.x=800;
        }else if(this.x<200){
            this.vx=0;
            this.x=200;
        }

        if (this.isFlying) {
            if (this.currentFuel > 0) {
                this.currentFuel -= this.fuelConsumptionRate;
                this.createFireParticles();
                if (this.currentFuel < 0) {
                    this.currentFuel = 0;
                }
            } else {
                this.isFlying = false;
                this.vy = 0;
                this.ay = factor / 10;
                this.facingDirection = 'down';
                this.fireParticles = [];
            }
        } else {
            if (this.currentFuel < this.maxFuel) {
                this.currentFuel += this.fuelRegenerationRate;
                if (this.currentFuel > this.maxFuel) {
                    this.currentFuel = this.maxFuel;
                }
            }
        }
    
        this.fireParticles.forEach(particle => particle.update());
        this.fireParticles = this.fireParticles.filter(particle => particle.isAlive());
    
        this.y += this.vy;

        if(this.x + this.vx>800 && this.x!==800)this.x=800;
        else if(this.x+this.vx<200 && this.x!==200)this.x=200
        else this.x += this.vx;
    
        const canvasTop = 0; 
    
        if (this.y + this.height >= this.game.height) {
            this.y = this.game.height - this.height;
            this.vy = 0;
            this.isJumping = false;
        } else if (this.y < canvasTop) {
            this.y = canvasTop;
            this.vy = 0;
            this.isJumping = false;
        } else {
            this.vy += this.ay;
            if (this.isJumping && !this.isFlying && this.vy >= 0) {
                this.facingDirection = 'down';
            }
        }
    }
}    

class Zombie {
    constructor(game, width, height, vx, vy, health) {
        this.game = game;
        this.justHit = false;
        this.froze = false;
        this.isBlocked = false;
        this.width = width;
        this.height = height;
        this.x = Math.random() < 0.5 ? 0 : this.game.width - this.width;
        this.y = this.game.height - this.height;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;
        this.health = health;
        this.direction = 'right';
        this.dx = 0;
        this.dy = 0;

    }

    draw(c) {
        if (this.health > 0) {

            if (this.direction === 'right') {
                // Draw the sprite facing right
                c.fillRect(this.x,this.y,this.width,this.height);
            } else {
                // Draw the sprite facing left (flip horizontally)
                c.fillRect(this.x,this.y,this.width,this.height);
                
            }
        }
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.isBlocked) {
            if (this.direction === 'right') this.x -= 100;
            else this.x += 100;
            this.isBlocked = !this.isBlocked;
        }

        if (this.health > 0) {
            this.y += this.vy;

            if (this.y + this.height >= this.game.height) {
                this.y = this.game.height - this.height;
                this.vy = 0;
                if (!this.froze) {
                    if (this.x + this.width <= this.game.player.x) {
                        this.direction = 'right';
                        this.x += this.vx;
                    } else if (this.x >= this.game.player.x + this.game.player.width) {
                        this.x -= this.vx;
                        this.direction = 'left';
                    }
                }
                this.isJumping = false;
            } else {
                this.vy += this.ay;
                if (this.vy > 0) this.facingDirection = 'down';
            }

        } else {
            this.game.zombies = this.game.zombies.filter(z => z !== this);
            this.game.score += 1;
            this.game.cash += 20;
        }
    }

    getColor() {
        return 'white';
    }
}

class Zombie1 extends Zombie {
    constructor(game) {
        const image = new Image();
        image.src='./zombie1/zombie-1-run.jpg'
        super(game, 20, 20, 1, 0, 20,image,1,1);
    }

    getColor() {
        return 'green';
    }
}


class Zombie2 extends Zombie {
    constructor(game) {
        super(game, 20, 40, 3, 0, 40);
    }

    getColor() {
        return 'red';
    }
}

class Zombie3 extends Zombie{
    constructor(game) {
        super(game, 30, 30, 2, 0, 30);
    }

    getColor() {
        return 'blue';
    }
}


class Attack{
    constructor(game,x,y,speed,radius){
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.radius = radius;
        this.dx=0;
        this.dy=0;
    }
}

class Projectile extends Attack {
    constructor(game, x, y, speed, targetX, targetY, damage, radius) {
        super(game,x,y,speed,radius);
        this.damage = damage;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0.1; 
        this.type = 'type1';
        this.dx=0;
        this.dy=0;

        const angle = Math.atan2(targetY - y, targetX - x);

        this.vx = this.speed * Math.cos(angle);
        this.vy = this.speed * Math.sin(angle);
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.ay;

        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.game.player.shotArray = this.game.player.shotArray.filter(p => p !== this);
            return;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
    }
}


class Shot extends Attack{
    constructor(game, x1, y1, x2, y2, speed, damage,radius) {
        super(game, x1, y1, speed,radius);
        this.xFinal = x2;
        this.yFinal = y2;
        this.damage = damage;
        this.type='type2';

        const distance = Math.sqrt((this.xFinal - this.x) ** 2 + (this.yFinal - this.y) ** 2);
        this.vx = ((this.xFinal - this.x) / distance) * speed;
        this.vy = ((this.yFinal - this.y) / distance) * speed;

        this.ax = 0; 
        this.ay = 0; 
        this.dx=0;
        this.dy=0;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.vx += this.ax;
        this.vy += this.ay;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.game.player.shotArray = this.game.player.shotArray.filter(p => p !== this);
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2,true);
        ctx.fill();
        ctx.closePath();
    }
}

class Weapons{
    constructor(player){
        this.player=player;
        this.width=this.player.width;
        this.height=this.player.height;
    }
}

class Weapon1 extends Weapons{
    constructor(player){
        super(player);
        this.name = "Weapon1";
        this.damage = 20;
        this.speed = 5;
    }

    shoot(x, y, x2,y2) {
        if (Date.now() - this.player.prevShotTime > 1000){
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed,x2,y2,this.damage,10));
        this.player.prevShotTime= Date.now();
        }
    }
}

class Weapon2 extends Weapons{
    constructor(player){
        super(player);
        this.name = "Weapon2";
        this.damage = 10;
        this.speed1 = 4;
        this.speed2 = 5;
        this.speed3 = 6;
    }

    shoot(x,y){
        if (Date.now() - this.player.prevShotTime > 1500){
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed1,10,10,this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed2,30,30,this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed3,60,60,this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed1,300,300,this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed2,330,330,this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed3,430,430,this.damage,5));
        }
    }
}

class Weapon3 extends Weapons{
    constructor(player){
        super(player);
        this.name = "Weapon3";
        this.damage = 50;
        this.speed = 10;
    }

    shoot(x1,y1,x2,y2){
        if (Date.now() - this.player.prevShotTime > 5000){
        this.player.shotArray.push(new Shot(this.player.game,x1+this.player.width/2,y1,x2,y2,this.speed,this.damage,20));
        }

    }
}

class Powerup{
    constructor(game,image,type,lifespan){
        this.game=game;
        this.ctx= this.game.ctx;
        this.x= this.game.width / 2;
        this.y= this.game.height - 50;
        this.width=30;
        this.height=30;
        this.active=true;
        this.image=image;
        this.type=type;
        this.spawnTime = Date.now();
        this.lifespan=lifespan;
        this.dx=0;
        this.dy=0;
    }

    draw(ctx){
        if(this.active){
            ctx.fillStyle='purple';
            ctx.fillRect(this.x,this.y,this.width,this.height);
            //ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
        }    
    }

    applypowerup(){
        if(this.type==='heal'){
            if(this.game.player.health > 75){
                this.game.player.health=100;
            }else{
                this.game.player.health +=25;
            }
        }else if(this.type==='freeze'){
            this.game.zombies.forEach(zombie=>{
                zombie.froze=true;
                setTimeout(()=>{
                    zombie.froze=false;
                },500)
            })
        }else if(this.type==='drain'){
            this.game.zombies.forEach(zombie=>{
                zombie.health-=20;
            })
        }
    }

    update() {
        this.x+=this.dx;
        this.y+=this.dy;
        if (Date.now() - this.spawnTime >= this.lifespan) {
            this.active = false; 
        }
    }
}

class Utility {
    constructor(game, x, y, width, height, color,name) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.name=name;
        this.vx=0;
        this.vy=1;
        this.dx=0;
        this.dy=0;
    }

    update(){
        this.x+=this.dx;
        this.y+=this.dy;
        let nextX = this.x + this.vx;
        let nextY = this.y + this.vy;

        // Check for collisions
        let collisionDetected = false;

        this.game.utilities.forEach(utility => {
            if (utility !== this && this.game.isCollidingRR(this, utility)) {
                if(this.y<utility.y)
                    collisionDetected = true;
            }
        });

        if (nextX < 0 || nextX + this.width > this.game.width) {
            collisionDetected = true;
            this.vx = 0;
        }
        if (nextY < 0 || nextY + this.height > this.game.height) {
            collisionDetected = true;
            this.vy = 0;
        }

        // Stop movement if collision detected
        if (!collisionDetected) {
            this.vx=0;
            this.vy=1;
            this.x = nextX;
            this.y = nextY;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Offensive extends Utility {
    constructor(game, x, y, width, height, damage, color,name) {
        super(game, x, y, width, height, color,name);
        this.damage = damage;
    }
}

class Mine extends Offensive {
    constructor(game, x, y) {
        super(game, x, y, 5, 5, 30, 'red','mine');
    }
}

class Trap extends Offensive {
    constructor(game, x, y) {
        super(game, x, y, 5, 5, 0, 'orange','trap');
    }
}

class Defensive extends Utility {
    constructor(game, x, y, width, height, health, color,name) {
        super(game, x, y, width, height, color,name);
        this.health = health;
    }
}

class Tower extends Defensive {
    constructor(game, x, y, width, height, health, attackPower,shootingDelay) {
        super(game, x, y, width, height, health, 'purple','tower');
        this.attackPower = attackPower;
        this.shootingDelay = shootingDelay; // delay in ms
        this.lastShotTime = 0;
        this.isdestroyed=false;
        this.shoot();
    }

    shoot() {}
}

class LeftTower extends Tower{
    constructor(game,x,y){
        super(game,x,y,40,40,100,30,1000); 
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime > this.shootingDelay) {
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5,0,20, this.attackPower,5));
            this.lastShotTime = now;
        }
        setTimeout(()=>{
            if(!this.isdestroyed)
            this.shoot();
        },this.shootingDelay)
    }
}

class RightTower extends Tower{
    constructor(game,x,y){
        super(game,x,y,40,40,100,30,1000); 
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime > this.shootingDelay) {
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 0,300, this.attackPower,5));
            this.lastShotTime = now;
        }
        setTimeout(()=>{
            if(!this.isdestroyed)
            this.shoot();
        },this.shootingDelay)
    }
}

class DoubleTower extends Tower{
    constructor(game,x,y){
        super(game,x,y,40,40,100,40,2000); 
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime > this.shootingDelay) {
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 200,200, this.attackPower,5));
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 10,10, this.attackPower,5));
            this.lastShotTime = now;
        }
        setTimeout(()=>{
            if(!this.isdestroyed)
            this.shoot();
        },this.shootingDelay)
    }
}

class Block extends Defensive {
    constructor(game, x, y) {
        super(game, x, y, 40, 40, 100, 'pink','block');
    }
}

class FireParticle {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * -1 - 1;
        this.alpha = 1;
        this.color = `rgba(255, 69, 0, ${this.alpha})`; // Orange fire color
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
        if (this.alpha <= 0) {
            this.alpha = 0;
        }
        this.color = `rgba(255, 69, 0, ${this.alpha})`;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    isAlive() {
        return this.alpha > 0;
    }
}