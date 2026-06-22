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
    } else if (type === 'buy') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

let gameState = 'START';
let numPlayers = 1;
let score = 0;
let money = 0;
let level = 1;
let wave = 1;
let highScore = localStorage.getItem("spaceShooterHighScore") || 0;
let flashTime = 0;

let players = [];
let bullets = [];
let enemyBullets = []; 
let enemies = [];
let powerUps = [];
let asteroids = [];
let stars = [];
let particles = [];

let boss = { active: false, x: 0, y: 60, width: 80, height: 80, hp: 0, maxHp: 0, dx: 3 };

const enemyRows = 3;
const enemyCols = 8;
const enemyWidth = 40;
const enemyHeight = 32;
let enemySpeed = 1;
let enemyDirection = 1;

for(let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, speed: Math.random() * 3 + 1 });
}

function initPlayers(count) {
    players = [];
    players.push({ id: 1, x: canvas.width / 2 - 40, y: canvas.height - 40, width: 40, height: 32, speed: 6, dx: 0, dy: 0, lives: 3, bombs: 1, doubleShot: 0, shield: false, invincible: 0, emoji: "🛸" });
    if(count === 2) {
        players.push({ id: 2, x: canvas.width / 2 + 20, y: canvas.height - 40, width: 40, height: 32, speed: 6, dx: 0, dy: 0, lives: 3, bombs: 1, doubleShot: 0, shield: false, invincible: 0, emoji: "🚀" });
    }
}

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
                let isArmored = Math.random() < 0.15;
                enemies.push({ x: c * 55 + 50, y: r * 47 + 80, width: 40, height: 32, alive: true, hp: isArmored ? 3 : 1, type: isArmored ? "🪖" : "👾" });
            }
        }
    }
}

function createParticles(x, y, color) {
    for(let i = 0; i < 15; i++) {
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 30, color: color, size: Math.random() * 3 + 1 });
    }
}

document.addEventListener("keydown", (e) => {
    if (gameState === 'START') {
        if (e.key === '1') { numPlayers = 1; startGame(); }
        if (e.key === '2') { numPlayers = 2; startGame(); }
        return;
    }
    if (gameState === 'GAMEOVER') {
        if (e.key === 'Enter') location.reload();
        return;
    }
    if (gameState === 'SHOP') {
        handleShop(e.key);
        return;
    }
    if (e.key === 'p' || e.key === 'P') {
        gameState = gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING';
        return;
    }

    if (gameState !== 'PLAYING') return;

    if (e.key === "ArrowRight" || e.key === "Right") players[0].dx = players[0].speed;
    if (e.key === "ArrowLeft" || e.key === "Left") players[0].dx = -players[0].speed;
    if (e.key === "ArrowUp" || e.key === "Up") players[0].dy = -players[0].speed;
    if (e.key === "ArrowDown" || e.key === "Down") players[0].dy = players[0].speed;
    if (e.key === " " || e.key === "Spacebar") shoot(players[0]);
    if (e.key === "b" || e.key === "B") useBomb(players[0]);

    if (numPlayers === 2 && players[1]) {
        if (e.key === "d" || e.key === "D") players[1].dx = players[1].speed;
        if (e.key === "a" || e.key === "A") players[1].dx = -players[1].speed;
        if (e.key === "w" || e.key === "W") players[1].dy = -players[1].speed;
        if (e.key === "s" || e.key === "S") players[1].dy = players[1].speed;
        if (e.key === "f" || e.key === "F") shoot(players[1]);
        if (e.key === "x" || e.key === "X") useBomb(players[1]);
    }
});

document.addEventListener("keyup", (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.key === "ArrowRight" || e.key === "Right" || e.key === "ArrowLeft" || e.key === "Left") players[0].dx = 0;
    if (e.key === "ArrowUp" || e.key === "Up" || e.key === "ArrowDown" || e.key === "Down") players[0].dy = 0;
    
    if (numPlayers === 2 && players[1]) {
        if (e.key === "d" || e.key === "D" || e.key === "a" || e.key === "A") players[1].dx = 0;
        if (e.key === "w" || e.key === "W" || e.key === "s" || e.key === "S") players[1].dy = 0;
    }
});

function startGame() {
    score = 0; money = 0; level = 1; wave = 1; enemySpeed = 1;
    initPlayers(numPlayers);
    initEnemies();
    gameState = 'PLAYING';
}

function shoot(p) {
    if(p.lives <= 0) return;
    playSound('shoot');
    if (p.doubleShot > 0) {
        bullets.push({ x: p.x, y: p.y, width: 4, height: 12, speed: 7 });
        bullets.push({ x: p.x + p.width - 4, y: p.y, width: 4, height: 12, speed: 7 });
    } else {
        bullets.push({ x: p.x + p.width / 2 - 2, y: p.y, width: 4, height: 12, speed: 7 });
    }
}

function useBomb(p) {
    if(p.bombs <= 0 || p.lives <= 0) return;
    p.bombs--;
    flashTime = 15;
    playSound('explosion');
    enemyBullets = [];
    
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.alive = false;
            createParticles(enemy.x, enemy.y, "#00ffff");
            score += 10; money += 5;
        }
    });

    if (boss.active) {
        boss.hp -= 30;
        createParticles(boss.x + 40, boss.y + 40, "red");
        score += 50;
        if (boss.hp <= 0) {
            boss.active = false;
            score += 500; money += 200;
            setTimeout(advanceWave, 500);
        }
    }
    
    if (enemies.length > 0 && enemies.every(e => !e.alive)) setTimeout(advanceWave, 500);
}

function hitPlayer(p) {
    if (p.invincible > 0 || p.lives <= 0) return;
    playSound('explosion');
    createParticles(p.x + 20, p.y + 15, "orange");
    if (p.shield) {
        p.shield = false;
        p.invincible = 30;
    } else {
        p.lives--;
        p.invincible = 30;
        if (players.every(pl => pl.lives <= 0)) {
            if (score > highScore) localStorage.setItem("spaceShooterHighScore", score);
            gameState = 'GAMEOVER';
        }
    }
}

function handleShop(key) {
    if(key === 'Enter') {
        gameState = 'PLAYING';
        initEnemies();
        return;
    }
    let p = players[0];
    if(key === '1' && money >= 100) { money -= 100; players.forEach(pl => pl.speed += 1); playSound('buy'); }
    if(key === '2' && money >= 200) { money -= 200; players.forEach(pl => pl.lives += 1); playSound('buy'); }
    if(key === '3' && money >= 150) { money -= 150; players.forEach(pl => pl.bombs += 1); playSound('buy'); }
}

function advanceWave() {
    bullets = []; enemyBullets = []; asteroids = []; powerUps = [];
    wave++;
    if (wave > 3) {
        level++;
        wave = 1;
        enemySpeed *= 1.10;
        gameState = 'SHOP';
    } else {
        initEnemies();
    }
}

function update() {
    if (gameState !== 'PLAYING') return;
    if (flashTime > 0) flashTime--;

    stars.forEach(s => {
        s.y += s.speed;
        if(s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    });

    particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy; p.life--;
        if(p.life <= 0) particles.splice(index, 1);
    });

    players.forEach(p => {
        if(p.lives <= 0) return;
        if (p.invincible > 0) p.invincible--;
        if (p.doubleShot > 0) p.doubleShot--;

        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = 0;
        if (p.x + p.width > canvas.width) p.x = canvas.width - p.width;
        if (p.y < 60) p.y = 60; 
        if (p.y + p.height > canvas.height) p.y = canvas.height - p.height;
    });

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    enemyBullets.forEach((eb, index) => {
        eb.y += eb.speed;
        players.forEach(p => {
            if (p.lives > 0 && eb.x < p.x + p.width && eb.x + eb.width > p.x && eb.y < p.y + p.height && eb.y + eb.height > p.y) {
                hitPlayer(p);
                enemyBullets.splice(index, 1);
            }
        });
    });

    powerUps.forEach((pu, index) => {
        pu.y += pu.speed;
        players.forEach(p => {
            if (p.lives > 0 && pu.x < p.x + p.width && pu.x + pu.width > p.x && pu.y < p.y + p.height && pu.y + pu.height > p.y) {
                playSound('buy');
                if (pu.type === 0) p.doubleShot = 600;
                if (pu.type === 1) p.shield = true;
                powerUps.splice(index, 1);
            }
        });
    });

    if (!boss.active && Math.random() < 0.005 + (level * 0.001)) {
        asteroids.push({ x: Math.random() * canvas.width, y: -50, size: Math.random() * 20 + 20, speed: Math.random() * 2 + 3, dx: (Math.random() - 0.5) * 2 });
    }

    asteroids.forEach((ast, index) => {
        ast.y += ast.speed; ast.x += ast.dx;
        players.forEach(p => {
            if (p.lives > 0 && ast.x < p.x + p.width && ast.x + ast.size > p.x && ast.y < p.y + p.height && ast.y + ast.size > p.y) {
                hitPlayer(p); asteroids.splice(index, 1);
            }
        });
    });

    if (boss.active) {
        boss.x += boss.dx;
        if (boss.x < 0 || boss.x + boss.width > canvas.width) boss.dx *= -1;
        if (Math.random() < 0.05) enemyBullets.push({ x: boss.x + boss.width / 2 - 3, y: boss.y + boss.height, width: 6, height: 15, speed: 6 });

        bullets.forEach((bullet, bIndex) => {
            if (bullet.x < boss.x + boss.width && bullet.x + bullet.width > boss.x && bullet.y < boss.y + boss.height && bullet.y + bullet.height > boss.y) {
                boss.hp--;
                createParticles(bullet.x, bullet.y, "#39ff14");
                bullets.splice(bIndex, 1);
                if (boss.hp <= 0) {
                    boss.active = false; score += 500; money += 200; createParticles(boss.x+40, boss.y+40, "red");
                    advanceWave();
                }
            }
        });

        players.forEach(p => {
            if (p.lives > 0 && boss.y + boss.height >= p.y && boss.y <= p.y + p.height && boss.x + boss.width >= p.x && boss.x <= p.x + p.width) hitPlayer(p);
        });

    } else {
        let hitWall = false;
        let aliveEnemies = [];

        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            aliveEnemies.push(enemy);
            enemy.x += enemySpeed * enemyDirection;
            if (enemy.x + enemy.width > canvas.width || enemy.x < 0) hitWall = true;

            players.forEach(p => {
                if (p.lives > 0 && enemy.y + enemy.height >= p.y && enemy.y <= p.y + p.height && enemy.x + enemy.width >= p.x && enemy.x <= p.x + p.width) {
                    hitPlayer(p); enemy.alive = false; createParticles(enemy.x, enemy.y, "purple");
                }
            });
        });

        if (hitWall) {
            enemyDirection *= -1;
            enemies.forEach(enemy => { if (enemy.alive) enemy.y += 15; });
        }

        if (aliveEnemies.length > 0 && Math.random() < 0.015 + (level * 0.002)) {
            let re = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({ x: re.x + re.width / 2 - 2, y: re.y + re.height, width: 4, height: 12, speed: 5 });
        }

        bullets.forEach((bullet, bIndex) => {
            enemies.forEach((enemy) => {
                if (enemy.alive && bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x && bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
                    bullets.splice(bIndex, 1);
                    enemy.hp--;
                    createParticles(enemy.x+20, enemy.y+15, enemy.type === "🪖" ? "gray" : "#00ffff");
                    if(enemy.hp <= 0) {
                        enemy.alive = false; score += 10; money += 5; playSound('explosion');
                        if (Math.random() < 0.05) powerUps.push({ x: enemy.x, y: enemy.y, width: 25, height: 25, type: Math.floor(Math.random() * 2), speed: 2 });
                    }
                }
            });
        });

        if (enemies.length > 0 && enemies.every(e => !e.alive)) advanceWave();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    if(gameState === 'START') {
        ctx.fillStyle = "#ffcc00"; ctx.font = "40px Courier New"; ctx.fillText("SPACE SHOOTER JS", canvas.width / 2 - 170, canvas.height / 3);
        ctx.fillStyle = "white"; ctx.font = "20px Courier New"; ctx.fillText("Presiona '1' para 1 Jugador", canvas.width / 2 - 150, canvas.height / 2);
        ctx.fillText("Presiona '2' para 2 Jugadores", canvas.width / 2 - 160, canvas.height / 2 + 40);
        return;
    }
    
    if(gameState === 'PAUSED') {
        ctx.fillStyle = "#00ffff"; ctx.font = "40px Courier New"; ctx.fillText("PAUSA", canvas.width / 2 - 60, canvas.height / 2);
        return;
    }

    if(gameState === 'SHOP') {
        ctx.fillStyle = "#39ff14"; ctx.font = "40px Courier New"; ctx.fillText("TIENDA INTERGALACTICA", canvas.width / 2 - 240, 100);
        ctx.fillStyle = "white"; ctx.font = "20px Courier New";
        ctx.fillText(`Monedas: 💰 ${money}`, canvas.width / 2 - 80, 160);
        ctx.fillText("[1] Mejorar Velocidad ($100)", canvas.width / 2 - 160, 220);
        ctx.fillText("[2] Comprar Vida Extra ($200)", canvas.width / 2 - 160, 260);
        ctx.fillText("[3] Comprar Bomba ($150)", canvas.width / 2 - 160, 300);
        ctx.fillStyle = "#ffcc00"; ctx.fillText("Presiona ENTER para Siguiente Nivel", canvas.width / 2 - 200, 400);
        return;
    }

    if (flashTime > 0) { ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }

    ctx.fillStyle = "#ffcc00"; ctx.font = "16px Courier New";
    ctx.fillText(`HI-SCORE: ${highScore} | Nivel: ${level} | Oleada: ${wave}/3`, canvas.width / 2 - 180, 25);
    
    players.forEach(p => {
        if(p.lives <= 0) return;
        ctx.fillStyle = p.id === 1 ? "#00ffff" : "#ff0055";
        ctx.fillText(`P${p.id} ❤️x${p.lives} 💣x${p.bombs} 💰${money}`, p.id === 1 ? 20 : canvas.width - 200, 25);

        if (p.invincible % 10 < 5) { ctx.font = "32px Arial"; ctx.fillText(p.emoji, p.x, p.y + 28); }
        if (p.shield) { ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2 - 4, 30, 0, Math.PI * 2); ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 3; ctx.stroke(); ctx.closePath(); }
    });

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = "red"; ctx.font = "40px Courier New"; ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
        ctx.fillStyle = "white"; ctx.font = "20px Courier New"; ctx.fillText("Presiona ENTER para reiniciar", canvas.width / 2 - 160, canvas.height / 2 + 40);
        return;
    }

    ctx.fillStyle = "#39ff14"; bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));
    ctx.fillStyle = "#ff0055"; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.width, eb.height));

    ctx.font = "24px Arial"; powerUps.forEach(pu => ctx.fillText(pu.type === 0 ? "🔫" : "🛡️", pu.x, pu.y + 20));
    ctx.font = "30px Arial"; asteroids.forEach(ast => ctx.fillText("🪨", ast.x, ast.y + 25));

    particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1.0;

    if (boss.active) {
        ctx.font = "80px Arial"; ctx.fillText("👹", boss.x, boss.y + 70);
        ctx.fillStyle = "red"; ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
        ctx.fillStyle = "#39ff14"; ctx.fillRect(boss.x, boss.y - 10, boss.width * (boss.hp / boss.maxHp), 5);
    } else {
        ctx.font = "32px Arial"; enemies.forEach(enemy => { if (enemy.alive) ctx.fillText(enemy.type, enemy.x, enemy.y + 28); });
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();