
import { Snake, DIRECTIONS } from "./snake.js";
import { spawnFood } from "./food.js";
import { getHighScores, saveHighScore } from "./storage.js";
import { getSkin } from "./skins.js";
import { playSound, startMusic, stopMusic } from "./audio.js";
import { recordGameStart, recordFoodEaten, recordGameCompleted } from "./statistics.js";
import { getPlayerName } from "./player.js";
import { isRankingConfigured, isBetterThanSent, submitScore } from "./ranking.js";

// ---------- Configurações ----------
const GRID_SIZE = 20;   // tabuleiro de 20 x 20 casas
const CELL = 24;        // cada casa tem 24px (20 * 24 = 480px do canvas)
const POINTS_PER_FOOD = 10;

const SPEEDS = { easy: 180, normal: 130, hard: 80, insane: 50, extreme: 35 };

// Nestas dificuldades a comida nunca nasce nos 4 cantinhos
// (de tão rápida, a cobrinha não conseguiria pegar).
const NO_CORNER_FOOD = ["insane", "extreme"];

const FOOD_COLOR = "#ff6b81";

// ---------- Elementos da página ----------
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d"); // "ctx" é o nosso pincel
const scoreEl = document.getElementById("hud-score");
const timeEl = document.getElementById("hud-time");
const finalTimeEl = document.getElementById("final-time");
const recordEl = document.getElementById("hud-record");
const gameOverEl = document.getElementById("game-over");
const finalScoreEl = document.getElementById("final-score");
const finalRecordEl = document.getElementById("final-record");
const newRecordEl = document.getElementById("new-record");
const pauseEl = document.getElementById("pause-menu");
const rankingStatusEl = document.getElementById("ranking-status-game");

// ---------- Estado da partida ----------
let snake;
let food;
let score;
let tickMs;           // intervalo entre passos
let lastTick;         // quando foi o último passo
let animationId;      // "número do ingresso" do loop, pra poder cancelar
let running = false;  // true = o loop está rodando
let paused = false;   // true = jogo congelado pela jogadora
let directionQueue;   // fila de curvas que a jogadora apertou
let currentSpeed;     // "easy" | "normal" | "hard" (pra saber qual recorde usar)
let highScore;        // recorde da dificuldade atual (mostrado no HUD)
let skin;             // cores da cobrinha nesta partida
let avoidCorners;     // true = a comida não nasce nos cantinhos
let elapsedMs;        // tempo de jogo (só conta enquanto está rodando)
let lastFrame;        // quando foi o último quadro (pra medir o tempo)
let shownTime;        // texto do relógio que está na tela

// ---------- Começar / parar ----------
export function startGame(speed) {
  stopGame(); // garante que não tem outro loop rodando

  avoidCorners = NO_CORNER_FOOD.includes(speed);
  snake = new Snake(5, 10);
  food = spawnFood(snake.body, GRID_SIZE, avoidCorners);
  score = 0;
  tickMs = SPEEDS[speed];
  directionQueue = [];

  currentSpeed = speed;
  highScore = getHighScores()[speed];
  recordEl.textContent = highScore;
  skin = getSkin(); // a skin é lida quando a partida começa

  scoreEl.textContent = score;
  gameOverEl.classList.remove("visible");
  pauseEl.classList.remove("visible");
  rankingStatusEl.hidden = true;

  recordGameStart(snake.body.length);
  startMusic();

  elapsedMs = 0;
  shownTime = "";
  updateTimer();

  running = true;
  lastTick = performance.now();
  lastFrame = lastTick;
  draw();
  animationId = requestAnimationFrame(loop);
}

export function stopGame() {
  running = false;
  paused = false;
  cancelAnimationFrame(animationId);
  stopMusic();
}

function endGame() {
  stopGame();

  const isNewRecord = saveHighScore(currentSpeed, score);
  recordGameCompleted();
  playSound("gameover");

  finalScoreEl.textContent = score;
  finalTimeEl.textContent = formatTime(elapsedMs);
  finalRecordEl.textContent = getHighScores()[currentSpeed];
  newRecordEl.hidden = !isNewRecord;
  gameOverEl.classList.add("visible");

  if (isRankingConfigured() && isBetterThanSent(currentSpeed, score)) {
    rankingStatusEl.textContent = "Enviando pro ranking...";
    rankingStatusEl.hidden = false;

    submitScore(getPlayerName(), currentSpeed, score).then((ok) => {
      rankingStatusEl.textContent = ok
        ? "Pontuação enviada pro ranking! 🏆"
        : "Não deu pra enviar pro ranking (sem internet?)";
    });
  }
}

// ---------- Pausa ----------
// Pausar = parar o loop (nada se mexe) e mostrar o menu.
// Continuar = ligar o loop de novo.
export function pauseGame() {
  if (!running) return; // só dá pra pausar uma partida rolando
  running = false;
  paused = true;
  cancelAnimationFrame(animationId);
  stopMusic();
  pauseEl.classList.add("visible");
}

export function resumeGame() {
  if (!paused) return; // só dá pra continuar se estava pausado
  paused = false;
  running = true;
  pauseEl.classList.remove("visible");
  startMusic();

  // IMPORTANTE: zera o relógio. Sem isso, o loop acharia que passou
  // muito tempo desde o último passo e a cobrinha daria um pulo
  // logo que você despausasse.
  lastTick = performance.now();
  lastFrame = lastTick; // o cronômetro também recomeça "do zero" (sem contar o tempo parado)
  animationId = requestAnimationFrame(loop);
}

// ---------- O loop do jogo ----------
function loop(time) {
  // Cronômetro: soma o tempo desde o quadro anterior. O limite de 250ms
  // evita um "salto" se a aba ficar escondida por um tempo.
  elapsedMs += Math.min(Math.max(time - lastFrame, 0), 250);
  lastFrame = time;
  updateTimer();

  // Voltou de uma aba escondida? Não tenta "recuperar" os passos perdidos.
  if (time - lastTick > 500) lastTick = time;

  while (running && time - lastTick >= tickMs) {
    lastTick += tickMs;
    update();
  }

  if (running) {
    animationId = requestAnimationFrame(loop);
  }
}

// ---------- Cronômetro ----------
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimer() {
  const text = formatTime(elapsedMs);
  if (text !== shownTime) {
    shownTime = text;
    timeEl.textContent = text;
  }
}

function update() {
  // 1) Pega a próxima curva da fila (se tiver)
  if (directionQueue.length > 0) {
    snake.direction = directionQueue.shift();
  }

  // 2) Calcula pra onde a cabeça vai
  const next = snake.getNextHead();

  // 3) Parede?
  if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) {
    endGame();
    return;
  }

  // 4) Vai comer?
  const willEat = food !== null && next.x === food.x && next.y === food.y;

  // 5) Bateu no próprio corpo?
  if (snake.hitsItself(next, willEat)) {
    endGame();
    return;
  }

  // 6) Tá tudo certo: anda!
  snake.move(willEat);

  if (willEat) {
    score += POINTS_PER_FOOD;
    scoreEl.textContent = score;
    playSound("eat");
    recordFoodEaten(snake.body.length);

    if (score > highScore) {
      highScore = score;
      recordEl.textContent = highScore;
    }

    food = spawnFood(snake.body, GRID_SIZE, avoidCorners);
    if (food === null) {
      endGame(); // tabuleiro cheio, não tem mais onde pôr comida
      return;
    }
  }

  draw();
}

// ---------- Desenho ----------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // O brilhinho (glow) vem do shadowBlur
  ctx.shadowBlur = 10;

  if (food) {
    ctx.shadowColor = FOOD_COLOR;
    ctx.fillStyle = FOOD_COLOR;
    drawCell(food.x, food.y);
  }

  snake.body.forEach((part, index) => {
    const color = index === 0 ? skin.head : skin.body;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    drawCell(part.x, part.y);
  });

  ctx.shadowBlur = 0;
}

// Desenha um quadradinho na casa (x, y), com 1px de folga
// em volta pra dar aquele visual de gominhos.
function drawCell(x, y) {
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

// ---------- Teclado ----------
// Setas E W A S D fazem a mesma coisa. As letras ficam em minúsculo
// porque usamos toLowerCase() (assim funciona com Caps Lock ligado também).
const KEY_TO_DIRECTION = {
  arrowup: DIRECTIONS.up,
  arrowdown: DIRECTIONS.down,
  arrowleft: DIRECTIONS.left,
  arrowright: DIRECTIONS.right,
  w: DIRECTIONS.up,
  s: DIRECTIONS.down,
  a: DIRECTIONS.left,
  d: DIRECTIONS.right,
};

document.addEventListener("keydown", (event) => {
  // Atalhos do navegador (Ctrl+S, Ctrl+A...) não podem virar movimento.
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const key = event.key.toLowerCase();

  // Esc ou P: pausa (se está jogando) ou continua (se está pausado)
  if (key === "escape" || key === "p") {
    if (running) pauseGame();
    else resumeGame();
    return;
  }

  const newDirection = KEY_TO_DIRECTION[key];
  if (!newDirection || !running) return;

  event.preventDefault(); // evita a página rolar com as setas
  queueDirection(newDirection);
});

function queueDirection(newDirection) {
  const last = directionQueue.length > 0
    ? directionQueue[directionQueue.length - 1]
    : snake.direction;

  const isSame = newDirection === last;
  const isReverse = newDirection.x === -last.x && newDirection.y === -last.y;

  if (isSame || isReverse) return;
  if (directionQueue.length < 2) {
    directionQueue.push(newDirection);
  }
}