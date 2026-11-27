const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d"); 

const scoreText = document.getElementById("score"); 
const bestText = document.getElementById("best"); 
const overlay = document.getElementById("overlay");  
const overlayTitle = document.getElementById("overlayTitle"); 
const overlayText = document.getElementById("overlayText");
const playButton = document.getElementById("playButton");
const soundButton = document.getElementById("soundButton");
const powerupStatus = document.getElementById("powerupStatus");

const WIDTH = canvas.width; 
const HEIGHT = canvas.height; 
const GROUND_HEIGHT = 90;  

let gameState = "ready"; 
let score = 0;
let bestScore = Number(localStorage.getItem("skyHopperBest") || 0);   
let soundEnabled = true;
let audioContext;

let bird;
let pipes;
let powerups;
let spawnTimer;
let powerupTimer;
let gameSpeed; 
let groundOffset;
let activePowerup;
let gapModifier = 0;
let pipeEffectTime = 0;
let unstableTime = 0;
let unstableDirection = 1;
let bonusPoints = 0;
bestText.textContent = bestScore;

function resetGame() {
  bird = {
    x: 120,
    y: HEIGHT / 2,
    width: 36,
    height: 28,
    velocity: 0,
    gravity: 0.42,
    flapStrength: -7.2,
    rotation: 0
  };

  pipes = [];
  powerups = [];
  score = 0;
  spawnTimer = 0;
  gameSpeed = 2.8;
  groundOffset = 0;
  activePowerup = null;

  scoreText.textContent = "0";
}

function startGame() {
  resetGame();
  gameState = "playing";
  overlay.style.display = "none";
  flap();
}

function endGame() {
  gameState = "gameover";

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("skyHopperBest", bestScore);
    bestText.textContent = bestScore;
  }

  overlayTitle.textContent = "Flight Over";
  overlayText.innerHTML = `
    You scored <strong>${score}</strong> point${score === 1 ? "" : "s"}.
    <br>Can you beat your best?
  `;

  playButton.textContent = "Try Again";
  overlay.style.display = "grid";
}

function flap() {
  if (gameState !== "playing") return;
  bird.velocity = bird.flapStrength;
}

function spawnPipe() {
  const gap = Math.max(150, 190 - score * 1.5);
  const topMinimum = 80;
  const topMaximum = HEIGHT - GROUND_HEIGHT - gap - 80;
  const top = topMinimum + Math.random() * (topMaximum - topMinimum);

  pipes.push({
    x: WIDTH + 30,
    width: 72,
    top,
    gap,
    passed: false
  });
}

function update() {
  if (gameState !== "playing") return;

  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
  bird.rotation = Math.min(Math.PI / 2, bird.velocity / 10);

  spawnTimer--;
  if (spawnTimer <= 0) {
    spawnPipe();
    spawnTimer = 105;
  }

  pipes.forEach(pipe => {
    pipe.x -= gameSpeed;

    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
      scoreText.textContent = score;
      gameSpeed = Math.min(4.4, 2.8 + score * 0.035);
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipe.width > -20);
  groundOffset = (groundOffset + gameSpeed) % 48;

  checkCollisions();
}

function checkCollisions() {
  const birdBox = {
    x: bird.x - bird.width / 2 + 5,
    y: bird.y - bird.height / 2 + 4,
    width: bird.width - 10,
    height: bird.height - 7
  };

  const outsideScreen =
    birdBox.y < 0 ||
    birdBox.y + birdBox.height > HEIGHT - GROUND_HEIGHT;

  if (outsideScreen) {
    endGame();
    return;
  }

  for (const pipe of pipes) {
    const collision =
      birdBox.x < pipe.x + pipe.width &&
      birdBox.x + birdBox.width > pipe.x &&
      (birdBox.y < pipe.top ||
        birdBox.y + birdBox.height > pipe.top + pipe.gap);

    if (collision) {
      endGame();
      return;
    }
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#74d9ff");
  gradient.addColorStop(0.65, "#b9f0ff");
  gradient.addColorStop(1, "#fef0b5");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 244, 166, 0.7)";
  ctx.beginPath();
  ctx.arc(405, 90, 45, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(65, 110, 1);
  drawCloud(315, 190, 0.7);
}

function drawCloud(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";

  ctx.beginPath();
  ctx.arc(0, 15, 18, 0, Math.PI * 2);
  ctx.arc(24, 4, 24, 0, Math.PI * 2);
  ctx.arc(52, 15, 17, 0, Math.PI * 2);
  ctx.roundRect(-18, 15, 88, 24, 12);
  ctx.fill();

  ctx.restore();
}

function drawPipe(pipe) {
  drawPipePart(pipe.x, 0, pipe.width, pipe.top, true);
  drawPipePart(
    pipe.x,
    pipe.top + pipe.gap,
    pipe.width,
    HEIGHT - GROUND_HEIGHT - pipe.top - pipe.gap,
    false
  );
}

function drawPipePart(x, y, width, height, isTop) {
  const capHeight = 24;
  const capY = isTop ? y + height - capHeight : y;

  ctx.fillStyle = "#65b52e";
  ctx.fillRect(x + 7, y, width - 14, height);

  ctx.fillStyle = "#438323";
  ctx.fillRect(x + width - 13, y, 6, height);

  ctx.fillStyle = "#a7e65f";
  ctx.fillRect(x + 13, y, 7, height);

  ctx.fillStyle = "#65b52e";
  ctx.fillRect(x, capY, width, capHeight);

  ctx.fillStyle = "#438323";
  ctx.fillRect(x + width - 9, capY, 5, capHeight);

  ctx.fillStyle = "#a7e65f";
  ctx.fillRect(x + 9, capY + 4, 6, capHeight - 8);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = "#f28f16";
  ctx.beginPath();
  ctx.ellipse(-5, 8, 15, 9, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#10233e";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(9, -6, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#10233e";
  ctx.beginPath();
  ctx.arc(11, -6, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff7b00";
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(33, 5);
  ctx.lineTo(17, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawGround() {
  ctx.fillStyle = "#8bd646";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 12);

  ctx.fillStyle = "#d7a34d";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT + 12, WIDTH, GROUND_HEIGHT - 12);

  ctx.fillStyle = "#b87932";
  for (let x = -groundOffset; x < WIDTH + 48; x += 48) {
    ctx.fillRect(x, HEIGHT - GROUND_HEIGHT + 20, 24, 5);
    ctx.fillRect(x + 30, HEIGHT - GROUND_HEIGHT + 46, 14, 5);
    ctx.fillRect(x + 8, HEIGHT - GROUND_HEIGHT + 70, 26, 5);
  }
}

function draw() {
  drawBackground();
  pipes.forEach(drawPipe);
  drawBird();
  drawGround();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function handleInput(event) {
  if (
    event.type === "keydown" &&
    event.code !== "Space" &&
    event.code !== "ArrowUp"
  ) {
    return;
  }

  event.preventDefault();

  if (gameState === "playing") {
    flap();
  } else {
    startGame();
  }
}

playButton.addEventListener("click", startGame);
canvas.addEventListener("pointerdown", handleInput);
window.addEventListener("keydown", handleInput);

resetGame();
gameLoop();

