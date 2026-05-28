const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

// Configuración del juego
let score = 0;
let gameOver = false;

// 1. La Nave (Jugador)
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    width: 40,
    height: 30,
    speed: 6,
    dx: 0
};

// 2. Listas para Balas y Enemigos
let bullets = [];
let enemies = [];

// Configuración de los enemigos (la fila de monitos)
const enemyRows = 3;
const enemyCols = 8;
const enemyWidth = 40;
const enemyHeight = 20;
const enemyPadding = 15;
const enemyOffsetTop = 40;
const enemyOffsetLeft = 50;
let enemySpeed = 1;
let enemyDirection = 1; // 1 = Derecha, -1 = Izquierda

// Inicializar enemigos en filas
function initEnemies() {
    for (let r = 0; r < enemyRows; r++) {
        for (let c = 0; c < enemyCols; c++) {
            let enemyX = c * (enemyWidth + enemyPadding) + enemyOffsetLeft;
            let enemyY = r * (enemyHeight + enemyPadding) + enemyOffsetTop;
            enemies.push({ x: enemyX, y: enemyY, width: enemyWidth, height: enemyHeight, alive: true });
        }
    }
}

// 3. Controles
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right") player.dx = player.speed;
    if (e.key === "ArrowLeft" || e.key === "Left") player.dx = -player.speed;
    if (e.key === " " || e.key === "Spacebar") shoot();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "Right" || e.key === "ArrowLeft" || e.key === "Left") {
        player.dx = 0;
    }
});

function shoot() {
    if (gameOver) return;
    // La bala sale del centro de la nave
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10, speed: 7 });
}

// 4. Actualizar posiciones y lógica
function update() {
    if (gameOver) return;

    // Mover nave y limitar bordes
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Mover balas
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1); // Eliminar bala si sale de pantalla
    });

    // Mover enemigos en bloque
    let hitWall = false;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemySpeed * enemyDirection;
        // Detectar si algún enemigo toca la pared lateral
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            hitWall = true;
        }
        // Si los enemigos llegan abajo, se acaba el juego
        if (enemy.y + enemy.height >= player.y) {
            gameOver = true;
        }
    });

    // Si chocan la pared, bajan una fila y cambian de dirección
    if (hitWall) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            if (enemy.alive) enemy.y += 15;
        });
    }

    // Detectar Colisiones (Bala vs Enemigo)
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy) => {
            if (enemy.alive && 
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                enemy.alive = false; // El monito muere
                bullets.splice(bIndex, 1); // Desaparece la bala
                score += 10;
                scoreDisplay.textContent = score;
            }
        });
    });

    // Verificar si ganaste (todos muertos)
    if (enemies.length > 0 && enemies.every(e => !e.alive)) {
        // Reiniciar oleada más rápido
        enemySpeed += 0.5;
        enemies = [];
        initEnemies();
    }
}

// 5. Dibujar todo en el Canvas
function draw() {
    // Limpiar pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Courier New";
        ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillStyle = "white";
        ctx.fillText("F5 para reiniciar", canvas.width / 2 - 90, canvas.height / 2 + 40);
        return;
    }

    // Dibujar Nave (un triángulo estilizado verde)
    ctx.fillStyle = "#39ff14";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Dibujar Balas (líneas rojas/neón)
    ctx.fillStyle = "#ff0055";
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Dibujar Enemigos (rectángulos cian)
    ctx.fillStyle = "#00ffff";
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Ojos retro falsos para que parezcan monitos
            ctx.fillStyle = "#000";
            ctx.fillRect(enemy.x + 8, enemy.y + 5, 5, 5);
            ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 5, 5, 5);
            ctx.fillStyle = "#00ffff"; // Volver al color correcto
        }
    });
}

// Bucle principal del juego
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Arrancar juego
initEnemies();
loop();