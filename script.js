const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if(type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'bomb') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(50, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        osc.start();
        osc.stop(audioCtx.currentTime + 1);
    }
}

let score = 0;
let lives = 3;
let gameOver = false;
let highScore = localStorage.getItem("spaceShooterHighScore") || 0;

let level = 1;
let wave = 1;
let bombs = 1;
let flashTime = 0;

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

let powerUps = [];
let doubleShotTimer = 0;
let shieldActive = false;
let allyTimer = 0;
let ally = { x: 0, y: 0, shootTimer: 0 };
let playerInvincible = 0;

let asteroids = [];
let stars = [];

for(let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width, 
        y: Math.random() * canvas.height, 
        size: Math.random() * 2 + 1, 
        speed: Math.random() * 3 + 1
    });
}

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
    if ((e.key === "b" || e.key === "B" || e.key === "x" || e.key === "X") && bombs > 0 && !gameOver) useBomb();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right" || e.key === "ArrowLeft" || e.key === "Left" || e.key === "d" || e.key === "a") player.dx = 0;
    if (e.key === "ArrowUp" || e.key === "Up" || e.key === "ArrowDown" || e.key === "Down" || e.key === "w" || e.key === "s") player.dy = 0;
});

function shoot() {
    if (gameOver) return;
    playSound('shoot');
    if (doubleShotTimer > 0) {
        bullets.push({ x: player.x, y: player.y, width: 4, height: 12, speed: 7 });
        bullets.push({ x: player.x + player.width - 4, y: player.y, width: 4, height: 12, speed: 7 });
    } else {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12, speed: 7 });
    }
}

function useBomb() {
    bombs--;
    flashTime = 15;
    playSound('bomb');
    enemyBullets = [];
    
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.alive = false;
            score += 10;
            if (Math.random() < 0.05) spawnPowerUp(enemy.x, enemy.y);
        }
    });

    if (boss.active) {
        boss.hp -= 30;
        score += 50;
        if (boss.hp <= 0) {
            boss.active = false;
            score += 500;
            if (Math.random() < 0.5) spawnPowerUp(boss.x + boss.width / 2, boss.y + boss.height);
            setTimeout(advanceWave, 500);
        }
    }

    scoreDisplay.textContent = score;
    
    if (enemies.length > 0 && enemies.every(e => !e.alive)) {
        setTimeout(advanceWave, 500);
    }
}

function hitPlayer() {
    if (playerInvincible > 0) return;
    playSound('explosion');
    if (shieldActive) {
        shieldActive = false;
        playerInvincible = 30;
    } else {
        lives--;
        playerInvincible = 30;
        if (lives <= 0) {
            checkHighScore();
            gameOver = true;
        }
    }
}

function update() {
    if (gameOver) return;

    if (flashTime > 0) flashTime--;
    if (playerInvincible > 0) playerInvincible--;
    if (doubleShotTimer > 0) doubleShotTimer--;
    
    stars.forEach(s => {
        s.y += s.speed;
        if(s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    });

    if (!boss.active && Math.random() < 0.005 + (level * 0.001)) {
        asteroids.push({
            x: Math.random() * canvas.width, 
            y: -50, 
            size: Math.random() * 20 + 20, 
            speed: Math.random() * 2 + 3, 
            dx: (Math.random() - 0.5) * 2
        });
    }

    asteroids.forEach((ast, index) => {
        ast.y += ast.speed;
        ast.x += ast.dx;
        if (ast.y > canvas.height || ast.x < -100 || ast.x > canvas.width + 100) {
            asteroids.splice(index, 1);
        } else if (ast.x < player.x + player.width && ast.x + ast.size > player.x &&
            ast.y < player.y + player.height && ast.y + ast.size > player.y) {
            hitPlayer();
            asteroids.splice(index, 1);
        }
    });
    
    if (allyTimer > 0) {
        allyTimer--;
        ally.x = player.x + 50;
        ally.y = player.y + 10;
        ally.shootTimer++;
        if (ally.shootTimer >= 30) {
            bullets.push({ x: ally.x + 10, y: ally.y, width: 4, height: 12, speed: 7 });
            playSound('shoot');
            ally.shootTimer = 0;
        }
    }

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
            hitPlayer();
            enemyBullets.splice(index, 1);
        } else if (eb.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });

    powerUps.forEach((pu, index) => {
        pu.y += pu.speed;
        if (pu.x < player.x + player.width && pu.x + pu.width > player.x &&
            pu.y < player.y + player.height && pu.y + pu.height > player.y) {
            playSound('powerup');
            if (pu.type === 0) doubleShotTimer = 600;
            if (pu.type === 1) shieldActive = true;
            if (pu.type === 2) allyTimer = 600;
            powerUps.splice(index, 1);
        } else if (pu.y > canvas.height) {
            powerUps.splice(index, 1);
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
                playSound('explosion');

                if (boss.hp <= 0) {
                    boss.active = false;
                    score += 500;
                    scoreDisplay.textContent = score;
                    if (Math.random() < 0.5) spawnPowerUp(boss.x + boss.width / 2, boss.y + boss.height);
                    advanceWave();
                }
            }
        });

        if (boss.y + boss.height >= player.y && boss.y <= player.y + player.height &&
            boss.x + boss.width >= player.x && boss.x <= player.x + player.width) {
            hitPlayer();
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
                hitPlayer();
                enemy.alive = false; 
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
                    playSound('explosion');

                    if (Math.random() < 0.05) spawnPowerUp(enemy.x, enemy.y);
                }
            });
        });

        if (enemies.length > 0 && enemies.every(e => !e.alive)) {
            advanceWave();
        }
    }
}

function spawnPowerUp(px, py) {
    let type = Math.floor(Math.random() * 3);
    powerUps.push({ x: px, y: py, width: 25, height: 25, type: type, speed: 2 });
}

function advanceWave() {
    bullets = [];
    enemyBullets = [];
    asteroids = [];
    wave++;
    if (wave > 3) {
        level++;
        wave = 1;
        bombs++;
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

    if (flashTime > 0) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.fillStyle = "white";
    stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    ctx.fillStyle = "#ffcc00";
    ctx.font = "16px Courier New";
    ctx.fillText(`HI-SCORE: ${highScore}`, canvas.width / 2 - 60, 25);
    ctx.fillText(`NIVEL: ${level} - OLEADA: ${wave}/3`, canvas.width / 2 - 90, 45);
    
    ctx.fillStyle = "#ff0055";
    ctx.fillText(`VIDAS: ${"❤️ ".repeat(lives)}`, 20, 25);
    ctx.fillStyle = "#00ffff";
    ctx.fillText(`BOMBAS: ${"💣 ".repeat(bombs)}`, canvas.width - 150, 25);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Courier New";
        ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillStyle = "white";
        ctx.fillText("F5 para reiniciar", canvas.width / 2 - 90, canvas.height / 2 + 40);
        return;
    }

    if (playerInvincible % 10 < 5) {
        ctx.font = "32px Arial";
        ctx.fillText("🛸", player.x, player.y + 28);
    }

    if (shieldActive) {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2 - 4, 30, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }

    if (allyTimer > 0) {
        ctx.font = "24px Arial";
        ctx.fillText("🤖", ally.x, ally.y + 20);
    }

    ctx.fillStyle = "#39ff14";
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.fillStyle = "#ff0055";
    enemyBullets.forEach(eb => {
        ctx.fillRect(eb.x, eb.y, eb.width, eb.height);
    });

    ctx.font = "24px Arial";
    powerUps.forEach(pu => {
        let icon = pu.type === 0 ? "🔫" : (pu.type === 1 ? "🛡️" : "🤖");
        ctx.fillText(icon, pu.x, pu.y + 20);
    });

    ctx.font = "30px Arial";
    asteroids.forEach(ast => {
        ctx.fillText("🪨", ast.x, ast.y + 25);
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