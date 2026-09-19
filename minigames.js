// ==========================================
// MÓDULO DE MINIJUEGOS - CHAVITXS (SNAKE)
// ==========================================

let snakeCanvas, snakeCtx;
let snake = [];
let food = {};
let dx = 20;
let dy = 0;
let score = 0;
let gameInterval = null;
let gridSiz = 20; // Tamaño de cada bloque

function initSnakeGame(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Inyectar estructura HTML del juego dentro del contenedor designado
  container.innerHTML = `
    <div style="text-align: center; background: #1f060d; padding: 16px; border-radius: 16px; border: 1px solid rgba(250,244,223,0.15);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: bold; color: var(--cream, #faf4df);">🐍 VIBORITA RETRO</span>
        <span style="color: #a39397; font-size: 13px;">Puntos: <strong id="snake-score" style="color: #fff;">0</strong></span>
      </div>
      
      <!-- Lienzo del juego -->
      <canvas id="snakeCanvas" width="280" height="280" style="background: #121214; border-radius: 10px; border: 1px solid #333; display: block; margin: 0 auto;"></canvas>
      
      <!-- Controles Táctiles para celular -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 180px; margin: 14px auto 0 auto;">
        <div></div>
        <button class="btn-inv" onclick="changeDirection('UP')" style="padding: 12px;"><i class="fa-solid fa-chevron-up"></i></button>
        <div></div>
        <button class="btn-inv" onclick="changeDirection('LEFT')" style="padding: 12px;"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="btn-inv" onclick="changeDirection('DOWN')" style="padding: 12px;"><i class="fa-solid fa-chevron-down"></i></button>
        <button class="btn-inv" onclick="changeDirection('RIGHT')" style="padding: 12px;"><i class="fa-solid fa-chevron-right"></i></button>
      </div>

      <button onclick="startSnakeGame()" class="btn-inv" style="width: 100%; margin-top: 14px; background: #90082e; color: #faf4df; border: none; font-weight: bold;">
        Iniciar / Reiniciar Partida
      </button>
    </div>
  `;

  snakeCanvas = document.getElementById('snakeCanvas');
  snakeCtx = snakeCanvas.getContext('2d');
}

function startSnakeGame() {
  clearInterval(gameInterval);
  snake = [
    { x: 100, y: 100 },
    { x: 80, y: 100 },
    { x: 60, y: 100 }
  ];
  dx = 20;
  dy = 0;
  score = 0;
  document.getElementById('snake-score').innerText = score;
  createFood();
  gameInterval = setInterval(mainGameLoop, 120); // Velocidad del juego
}

function mainGameLoop() {
  if (hasGameEnded()) {
    clearInterval(gameInterval);
    alert('¡Juego terminado! Puntuación obtenida: ' + score);
    return;
  }

  clearCanvas();
  drawFood();
  moveSnake();
  drawSnake();
}

function clearCanvas() {
  snakeCtx.fillStyle = "#121214";
  snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
}

function drawSnake() {
  snake.forEach((part, index) => {
    snakeCtx.fillStyle = index === 0 ? "#90082e" : "#faf4df";
    snakeCtx.fillRect(part.x, part.y, gridSiz - 2, gridSiz - 2);
  });
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);

  const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
  if (hasEatenFood) {
    score += 5;
    document.getElementById('snake-score').innerText = score;
    createFood();
    
    // AQUÍ CONECTAREMOS LA RECOMPENSA DE RACHA CUANDO LLEGUE A X PUNTOS (ej. 20 puntos)
    if (score >= 20) {
      clearInterval(gameInterval);
      triggerStreakRescue();
    }
  } else {
    snake.pop();
  }
}

function randomGridCoord(max) {
  return Math.floor(Math.random() * (max / gridSiz)) * gridSiz;
}

function createFood() {
  food.x = randomGridCoord(snakeCanvas.width);
  food.y = randomGridCoord(snakeCanvas.height);

  snake.forEach(part => {
    if (part.x === food.x && part.y === food.y) createFood();
  });
}

function drawFood() {
  snakeCtx.fillStyle = "#f59e0b";
  snakeCtx.fillRect(food.x, food.y, gridSiz - 2, gridSiz - 2);
}

function changeDirection(direction) {
  const goingUp = dy === -20;
  const goingDown = dy === 20;
  const goingRight = dx === 20;
  const goingLeft = dx === -20;

  if (direction === 'UP' && !goingDown) { dx = 0; dy = -20; }
  if (direction === 'DOWN' && !goingUp) { dx = 0; dy = 20; }
  if (direction === 'LEFT' && !goingRight) { dx = -20; dy = 0; }
  if (direction === 'RIGHT' && !goingLeft) { dx = 20; dy = 0; }
}

function hasGameEnded() {
  for (let i = 4; i < snake.length; i++) {
    if (snake[i].x === snake[i - 1].x && snake[i].y === snake[i - 1].y) return true;
  }
  const hitLeftWall = snake[0].x < 0;
  const hitRightWall = snake[0].x >= snakeCanvas.width;
  const hitToptWall = snake[0].y < 0;
  const hitBottomWall = snake[0].y >= snakeCanvas.height;
  return hitLeftWall || hitRightWall || hitToptWall || hitBottomWall;
}

function triggerStreakRescue() {
  alert('¡Increíble! ¡Has rescatado tu racha con éxito!');
  
  // 1. Recuperamos la racha anterior o sumamos el día de rescate
  let currentStreak = parseInt(localStorage.getItem('dose_streak') || '1', 10);
  
  // Actualizamos la fecha de la última toma al día de hoy para normalizar el sistema
  const todayStr = new Date().toISOString().split('T')[0];
  localStorage.setItem('last_dose_date', todayStr);
  
  // 2. Ocultamos el contenedor del miniguego
  const gameContainer = document.getElementById('streak-rescue-container');
  if (gameContainer) {
    gameContainer.style.display = 'none';
  }

  // 3. Refrescamos la interfaz de la PWA
  if (typeof renderDashboard === 'function') {
    renderDashboard();
  }
}