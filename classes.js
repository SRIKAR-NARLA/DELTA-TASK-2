class Game{
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.player = new Player(this,10,10,0,1,0,1,40,40,100);
        this.score=0;
        this.cash=20000;
        this.zombies = [];
        this.utilities = [];
        this.powerups=null;
        this.paused=false;
        this.gameOver=false;
        this.startSpawning();
        this.spawnPowerup();
    }

    spawnPowerup(){
        if(this.gameOver===false){
            this.powerups=new Powerup(this,'ns','drain',5000);
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
            setTimeout(() => this.spawnZombie3(), 15000);
        }
    }

    update() {
        if (this.paused || this.gameOver) return;
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
        
        // if (this.paused) {
        //     this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        //     this.ctx.fillRect(0, 0, this.width, this.height);
        //     this.ctx.fillStyle = 'white';
        //     this.ctx.font = '40px Arial';
        //     this.ctx.fillText('Paused', this.width / 2 - 60, this.height / 2);
        //}
        
        if (this.gameOver) {
           this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
           this.ctx.fillRect(0, 0, this.width, this.height);
           this.ctx.fillStyle = 'white';
           this.ctx.font = '40px Arial';
           this.ctx.fillText('Game Over', this.width / 2 - 100, this.height / 2);
           this.ctx.font = '20px Arial';
           this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2 - 60, this.height / 2 + 40);
        }
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
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
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
                    if(this.player.health<=0)this.player.health=0;
                    if(this.player.health===0)this.gameOver=true;
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
                    if (this.player.y + this.player.height <= utility.y + this.player.vy) {
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
                    // Right collision
                    else if (this.player.x + this.player.width <= utility.x + this.player.vx) {
                        this.player.x = utility.x - this.player.width;
                        this.player.vx = 0;
                    }
                    // Left collision
                    else if (this.player.x >= utility.x + utility.width - this.player.vx) {
                        this.player.x = utility.x + utility.width;
                        this.player.vx = 0;
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
                        zombie.isBlocked=true;
                        utility.health-=25;
                        if(utility.health===0)this.utilities = this.utilities.filter(p => p !== utility);
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
        this.health = health;
        this.shotArray=[];
        this.weapon1 = new Weapon1(this);
        this.weapon2 = new Weapon2(this);
        this.weapon3 = new Weapon3(this);
        this.weapon=this.weapon1;
        this.facingDirection = 'right';
        this.maxFuel = 200; 
        this.currentFuel = this.maxFuel; 
        this.fuelConsumptionRate = 1; 
        this.fuelRegenerationRate = 0.25; 
        this.control();
    }

    control(){
        window.addEventListener('keyup', (e) => {
            if (e.key === 'd' || e.key === 'a') this.vx = 0;
            if(e.key==='w'){
                this.vy=0;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'd') {
                this.vx = factor/2;
                this.facingDirection = 'right';
            }
            else if (e.key === 'a') {
                this.vx = -factor/2;
                this.facingDirection = 'left';
            }
            else if (e.key === ' ' && !this.isJumping) {
                this.vy = -factor;
                this.ay=factor/10;
                this.ax=this.ay;
                this.isJumping = true;
                this.onBlock=false;
                this.facingDirection = 'up';
            }
            else if(e.key==='w'){
                if (this.currentFuel > 0) {
                    this.isJumping = true;
                    this.isFlying = true;
                    this.vy = -factor;
                    this.ay = 0;
                    this.facingDirection = 'up';
                }
            }
            else if(e.key==='s'){
                this.isFlying=false;
                this.vy = factor;
                this.ay=factor/10;
                this.facingDirection = 'down';
            } 
            else if(e.key==='p'){
                if(this.weapon===this.weapon1){
                    this.weapon.shoot(this.x, this.y,this.facingDirection);
                    if(this.facingDirection==='right'){
                        this.x-=1;
                        this.y-=1;
                    }else if(this.facingDirection==='left'){
                        this.x+=1;
                        this.y-=1;
                    }
                }else if(this.weapon===this.weapon2){
                    this.weapon.shoot(this.x, this.y);
                }
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
            }
        });

        window.addEventListener('click', (e) => {
            if(this.weapon===this.weapon3){
                const rect = canvas.getBoundingClientRect();
                const x2 = e.clientX - rect.left;
                const y2 = e.clientY - rect.top;
                this.weapon.shoot(this.x + this.width / 2, this.y, x2, y2);
            }
        });
    }

    draw(c) {
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

    update() {

        if (this.isFlying) {
            if (this.currentFuel > 0) {
                this.currentFuel -= this.fuelConsumptionRate;
                if (this.currentFuel < 0) {
                    this.currentFuel = 0;
                }
            } else {
                this.isFlying = false;
                this.vy = 0;
                this.ay = factor / 10;
                this.facingDirection='down';
            }
        } else {
            if (this.currentFuel < this.maxFuel) {
                this.currentFuel += this.fuelRegenerationRate;
                if (this.currentFuel > this.maxFuel) {
                    this.currentFuel = this.maxFuel;
                }
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    
        if (this.y + this.height >= this.game.height) {
            this.y = this.game.height - this.height;
            this.vy = 0;
            this.isJumping = false;
        } else {
            this.vy += this.ay;
            if(this.isJumping && !this.isFlying && this.vy>=0)this.facingDirection='down';
        }
    }
}

class Zombie {
    constructor(game, width, height, vx, vy, health) {
        this.game = game;
        this.justHit = false;
        this.froze = false;
        this.isBlocked=false;
        this.width = width;
        this.height = height;
        this.x = Math.random() < 0.5 ? 0 : this.game.width - this.width;
        this.y = this.game.height - this.height;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;
        this.health = health;
    }

    draw(c) {
        if (this.health > 0) {
            c.fillStyle = this.getColor();
            c.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update() {
        if(this.isBlocked){
            this.health=0;
        }

        if (this.health > 0) {
            this.y += this.vy;

            if (this.y + this.height >= this.game.height) {
                this.y = this.game.height - this.height;
                this.vy = 0;
                if (!this.froze) {
                    if (this.x < this.game.player.x) {
                        this.x += this.vx;
                    } else {
                        this.x -= this.vx;
                    }
                }
                this.isJumping = false;
            } else {
                this.vy += this.ay;
                if(this.vy>0)this.facingDirection='down';
            }
        } else {
            this.game.zombies = this.game.zombies.filter(z => z !== this);
            this.game.score+=1;
            this.game.cash+=20;
        }
    }

    getColor() {
        return 'white';
    }
}

class Zombie1 extends Zombie {
    constructor(game) {
        super(game, 20, 20, 1, 0, 20);
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

    // update() {
    //     if (this.health !== 0) {
    //         this.y += this.vy;

    //         // Simple climbing logic (example)
    //         // Assume obstacles are rectangles in an array `this.game.obstacles`
    //         let onGround = false;
    //         this.game.obstacles.forEach(obstacle => {
    //             if (
    //                 this.x < obstacle.x + obstacle.width &&
    //                 this.x + this.width > obstacle.x &&
    //                 this.y + this.height >= obstacle.y &&
    //                 this.y < obstacle.y + obstacle.height
    //             ) {
    //                 this.y = obstacle.y - this.height;
    //                 onGround = true;
    //                 this.vy = 0;
    //             }
    //         });

    //         if (!onGround) {
    //             if (this.y + this.height >= this.game.height) {
    //                 this.y = this.game.height - this.height;
    //                 this.vy = 0;
    //             } else {
    //                 this.vy += this.ay;
    //             }
    //         }

    //         if (!this.froze) {
    //             if (this.x < this.game.player.x) {
    //                 this.x += this.vx;
    //             } else {
    //                 this.x -= this.vx;
    //             }
    //         }

    //         this.isJumping = false;
    //     } else {
    //         this.game.zombies = this.game.zombies.filter(z => z !== this);
    //     }
    // }
}


class Attack{
    constructor(game,x,y,speed,radius){
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.radius = radius;
    }
}

class Projectile extends Attack{
    constructor(game,x,y,speed,direction,damage,radius){
        super(game,x,y,speed,radius);
        this.direction = direction; 
        this.damage = damage;
        this.vx=0;
        this.vy=0;
        this.ax=0;
        this.ay=factor/100;
        this.type='type1';

        if(this.direction==='right'){
            this.vx = this.speed * Math.cos(Math.PI / 4); 
            this.vy = -this.speed * Math.sin(Math.PI / 4);
        }
        else if(this.direction==='left'){
            this.vx = -this.speed * Math.cos(Math.PI / 4); 
            this.vy = -this.speed * Math.sin(Math.PI / 4);
        }
    }

    update() {
        this.x += this.vx;
        this.vy += this.ay;

        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.game.player.shotArray = this.game.player.shotArray.filter(p => p !== this);
            return;
        }
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2,true);
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
    }

    update() {
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

    shoot(x, y, direction) {
        //if (Date.now() - this.player.prevShotTime > 0){
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed,direction,this.damage,10));
        //this.player.prevShotTime= Date.now();
        //}
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
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed1,'right',this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed2,'right',this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed3,'right',this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed1,'left',this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed2,'left',this.damage,5));
        this.player.shotArray.push(new Projectile(this.player.game,x+this.player.width/2,y,this.speed3,'left',this.damage,5));
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
        this.player.shotArray.push(new Shot(this.player.game,x1+this.player.width/2,y1,x2,y2,this.speed,this.damage,20));

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
    }

    update(){
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
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 'left', this.attackPower,5));
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
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 'right', this.attackPower,5));
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
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 'right', this.attackPower,5));
            this.game.player.shotArray.push(new Projectile(this.game, this.x + this.width / 2, this.y, 5, 'left', this.attackPower,5));
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













