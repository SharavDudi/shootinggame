const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bgMusic');

// Game settings
const player = { x: 50, y: canvas.height / 2 - 20, width: 20, height: 20, speed: 5, health: 3 };
let bullets = [];
let powerUps = [];
let obstacles = [];
const initialBulletSpeed = 5;
let bulletSpeed = initialBulletSpeed;
let score = 0;
let level = 1;
let gameOver = false;
let canShoot = true;
const shootCooldown = 500; // 500ms cooldown for shooting
const maxHealth = 5;
const powerUpFrequency = 0.01; // Power-up spawn rate
const maxPowerUps = 3; // Maximum number of power-ups on screen
const powerUpLifetime = 10000; // Time in milliseconds before power-up disappears

// Initialize the game
function initializeGame() {
    // Reset player state
    player.health = 3;
    player.x = 50;
    player.y = canvas.height / 2 - 20;

    // Reset game state
    bullets = [];
    powerUps = [];
    obstacles = [];
    score = 0;
    level = 1;
    bulletSpeed = initialBulletSpeed;
    gameOver = false;

    // Add initial obstacles
    addObstacles();

    // Play background music
    bgMusic.play();

    // Start game loop
    update();
}

// Add obstacles based on the level
function addObstacles() {
    const numberOfObstacles = level + 3; // Increase number of obstacles as level increases
    for (let i = 0; i < numberOfObstacles; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 50),
            y: Math.random() * (canvas.height - 50),
            width: 50,
            height: 50,
            dx: 2 + level // Speed increases with level
        });
    }
}

// Collision detection function
function detectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game elements
function update() {
    if (gameOver) return;

    // Move obstacles
    obstacles.forEach(obstacle => {
        obstacle.x += obstacle.dx;
        if (obstacle.x <= 0 || obstacle.x + obstacle.width >= canvas.width) {
            obstacle.dx *= -1;
        }
    });

    // Move bullets
    bullets.forEach(bullet => bullet.x += bulletSpeed);

    // Check for collisions between bullets and obstacles
    bullets = bullets.filter(bullet => {
        const hitObstacle = obstacles.some(obstacle => detectCollision(bullet, obstacle));
        if (hitObstacle) {
            obstacles = obstacles.filter(obstacle => {
                if (detectCollision(bullet, obstacle)) {
                    score += 10; // Increase score
                    return false; // Remove obstacle
                }
                return true;
            });
            return false; // Remove bullet
        }
        return bullet.x <= canvas.width; // Keep bullet if still on screen
    });

    // Check for collision between player and obstacles
    if (obstacles.some(obstacle => detectCollision(player, obstacle))) {
        player.health -= 1;
        if (player.health <= 0) {
            gameOver = true;
            bgMusic.pause(); // Pause music on game over
            return; // Exit update function to prevent further updates
        } else {
            // Respawn player and obstacles
            player.x = 50;
            player.y = canvas.height / 2 - 20;
            obstacles = [];
            addObstacles();
            level++; // Increase level after clearing obstacles
        }
    }

    // Check if all obstacles are destroyed to move to the next level
    if (obstacles.length === 0 && !gameOver) {
        level++;
        addObstacles();
    }

    // Check for power-up collection
    powerUps = powerUps.filter(powerUp => {
        if (detectCollision(player, powerUp)) {
            if (powerUp.type === 'speed') {
                bulletSpeed = Math.min(bulletSpeed + 2, 10); // Increase bullet speed, max 10
                console.log("Speed power-up collected");
            } else if (powerUp.type === 'health') {
                player.health = Math.min(player.health + 1, maxHealth); // Restore health, max 5
                console.log("Health power-up collected");
            }
            return false; // Remove power-up after collection
        }
        return true; // Keep power-up if not collected
    });

    // Remove expired power-ups
    const now = Date.now();
    powerUps = powerUps.filter(powerUp => now - powerUp.spawnTime < powerUpLifetime);

    // Add new power-ups randomly with control
    if (powerUps.length < maxPowerUps && Math.random() < powerUpFrequency) {
        powerUps.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 20),
            width: 20,
            height: 20,
            type: Math.random() < 0.5 ? 'speed' : 'health',
            spawnTime: Date.now() // Track when the power-up was created
        });
    }

    draw();
    requestAnimationFrame(update);
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

    // Draw obstacles
    ctx.fillStyle = 'green';
    obstacles.forEach(obstacle => ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height));

    // Draw power-ups
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'speed' ? 'yellow' : 'purple';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    // Draw health
    ctx.fillText('Health: ' + player.health, canvas.width - 100, 20);

    // Draw level
    ctx.fillText('Level: ' + level, canvas.width / 2 - 50, 20);

    // Draw game over message if game is over
    if (gameOver) {
        ctx.fillText('Game Over! Press R to Restart', canvas.width / 2 - 100, canvas.height / 2);
    }
}

// Handle user input
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && canShoot && !gameOver) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - 2,
            width: 10,
            height: 5
        });
        canShoot = false;
        setTimeout(() => canShoot = true, shootCooldown);
    } else if (e.key === 'ArrowUp' && player.y > 0) {
        player.y -= player.speed;
    } else if (e.key === 'ArrowDown' && player.y < canvas.height - player.height) {
        player.y += player.speed;
    } else if (e.key === 'r' || e.key === 'R') {
        if (gameOver) {
            bgMusic.currentTime = 0; // Reset music to start
            initializeGame(); // Restart the game
        }
    }
});

// Start the game initially
initializeGame();
