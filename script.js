const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

let score = 0;
let lives = 3;
let gameOver = false;
let highScore = localStorage.getItem("spaceShooterHighScore") || 0;

let level = 1;
let wave = 1;

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 32,
    speed: 6,
    dx: 0,
    dy: 0 
};

let bullets = [];
let enemyBullets = []; 
let enemies = [];
let boss = { active: false, x: canvas.width / 2 - 40, y: 60, width: 80, height: 80, hp: 0, maxHp: 0, dx: 3 };

const enemyRows = 3;
const enemyCols = 8;
const enemyWidth = 40;
const enemyHeight = 32;
const enemyPadding = 15;
const enemyOffsetTop = 80; 
const enemyOffsetLeft = 50;
let enemySpeed = 1;
let enemyDirection = 1;

function initEnemies() {
    enemies = [];
    if (level % 5 === 0 && wave === 3) {
        boss.active = true;
        boss.hp = 50 + (level * 10);
        boss.maxHp = boss.hp;
        boss.x = canvas.width / 2 - boss.width / 2;
    } else {
        boss.active = false;
        for (let r = 0; r < enemyRows; r++) {
            for (let c = 0; c < enemyCols; c++) {
                let enemyX = c * (enemyWidth + enemyPadding) + enemyOffsetLeft;
                let enemyY = r * (enemyHeight + enemyPadding) + enemyOffsetTop;
                enemies.push({ x: enemyX, y: enemyY, width: enemyWidth, height: enemyHeight, alive: true });
            }
        }
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right" || e.key === "d") player.dx = player.speed;
    if (e.key === "ArrowLeft" || e.key === "Left" || e.key === "a") player.dx = -player.speed;
    if (e.key === "ArrowUp" || e.key === "Up" || e.key === "w") player.dy = -player.speed;
    if (e.key === "ArrowDown" || e.key === "Down" || e.key === "s") player.dy = player.speed;
    if (e.key === " " || e.key === "Spacebar") shoot();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right" || e.key === "ArrowLeft" || e.key === "Left" || e.key === "d" || e.key === "a") {
        player.dx = 0;
    }
    if (e.key === "ArrowUp" || e.key === "Up" || e.key === "ArrowDown" || e.key === "Down" || e.key === "w" || e.key === "s") {
        player.dy = 0;
    }
});

function shoot() {
    if (gameOver) return;
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, speed: 7 });
}

function update() {
    if (gameOver) return;

    player.x += player.dx;
    player.y += player.dy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 60) player.y = 60; 
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    enemyBullets.forEach((eb, index) => {
        eb.y += eb.speed;
        if (eb.x < player.x + player.width && eb.x + eb.width > player.x &&
            eb.y < player.y + player.height && eb.y + eb.height > player.y) {
            lives--;
            enemyBullets.splice(index, 1);
            if (lives <= 0) {
                checkHighScore();
                gameOver = true;
            }
        } else if (eb.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });

    if (boss.active) {
        boss.x += boss.dx;
        if (boss.x < 0 || boss.x + boss.width > canvas.width) boss.dx *= -1;

        if (Math.random() < 0.04) {
            enemyBullets.push({ x: boss.x + boss.width / 2 - 3, y: boss.y + boss.height, width: 6, height: 15, speed: 6 });
        }

        bullets.forEach((bullet, bIndex) => {
            if (bullet.x < boss.x + boss.width && bullet.x + bullet.width > boss.x &&
                bullet.y < boss.y + boss.height && bullet.y + bullet.height > boss.y) {
                boss.hp--;
                bullets.splice(bIndex, 1);
                score += 5;
                scoreDisplay.textContent = score;

                if (boss.hp <= 0) {
                    boss.active = false;
                    score += 500;
                    scoreDisplay.textContent = score;
                    advanceWave();
                }
            }
        });

        if (boss.y + boss.height >= player.y && boss.y <= player.y + player.height &&
            boss.x + boss.width >= player.x && boss.x <= player.x + player.width) {
            lives--;
            if (lives <= 0) {
                checkHighScore();
                gameOver = true;
            }
        }

    } else {
        let hitWall = false;
        let aliveEnemies = [];

        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            aliveEnemies.push(enemy);

            enemy.x += enemySpeed * enemyDirection;
            if (enemy.x + enemy.width > canvas.width || enemy.x < 0) hitWall = true;

            if (enemy.y + enemy.height >= player.y && enemy.y <= player.y + player.height &&
                enemy.x + enemy.width >= player.x && enemy.x <= player.x + player.width) {
                lives--;
                if (lives <= 0) {
                    checkHighScore();
                    gameOver = true;
                } else {
                    enemy.alive = false; 
                }
            }
        });

        if (hitWall) {
            enemyDirection *= -1;
            enemies.forEach(enemy => {
                if (enemy.alive) enemy.y += 15;
            });
        }

        if (aliveEnemies.length > 0 && Math.random() < 0.015 + (level * 0.002)) {
            let randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({ x: randomEnemy.x + randomEnemy.width / 2 - 2, y: randomEnemy.y + randomEnemy.height, width: 4, height: 12, speed: 5 });
        }

        bullets.forEach((bullet, bIndex) => {
            enemies.forEach((enemy) => {
                if (enemy.alive &&
                    bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {

                    enemy.alive = false;
                    bullets.splice(bIndex, 1);
                    score += 10;
                    scoreDisplay.textContent = score;
                }
            });
        });

        if (enemies.length > 0 && enemies.every(e => !e.alive)) {
            advanceWave();
        }
    }
}

function advanceWave() {
    bullets = [];
    enemyBullets = [];
    wave++;
    if (wave > 3) {
        level++;
        wave = 1;
        enemySpeed *= 1.10; 
    }
    initEnemies();
}

function checkHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("spaceShooterHighScore", highScore);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffcc00";
    ctx.font = "16px Courier New";
    ctx.fillText(`HI-SCORE: ${highScore}`, canvas.width / 2 - 60, 25);
    ctx.fillText(`NIVEL: ${level} - OLEADA: ${wave}/3`, canvas.width / 2 - 90, 45);
    
    ctx.fillStyle = "#ff0055";
    ctx.fillText(`VIDAS: ${"❤️ ".repeat(lives)}`, 20, 25);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Courier New";
        ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillStyle = "white";
        ctx.fillText("F5 para reiniciar", canvas.width / 2 - 90, canvas.height / 2 + 40);
        return;
    }

    ctx.font = "32px Arial";
    ctx.fillText("🛸", player.x, player.y + 28);

    ctx.fillStyle = "#39ff14";
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.fillStyle = "#ff0055";
    enemyBullets.forEach(eb => {
        ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
    });

    if (boss.active) {
        ctx.font = "80px Arial";
        ctx.fillText("👹", boss.x, boss.y + 70);
        
        ctx.fillStyle = "red";
        ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
        ctx.fillStyle = "#39ff14";
        ctx.fillRect(boss.x, boss.y - 10, boss.width * (boss.hp / boss.maxHp), 5);
    } else {
        ctx.font = "32px Arial";
        enemies.forEach(enemy => {
            if (enemy.alive) {
                ctx.fillText("👾", enemy.x, enemy.y + 28);
            }
        });
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

initEnemies();
loop();