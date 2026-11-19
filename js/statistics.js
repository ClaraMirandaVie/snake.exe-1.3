
import { load, save, getHighScores } from "./storage.js";

const DEFAULTS = {
  gamesPlayed: 0,     // partidas iniciadas
  gamesCompleted: 0,  // partidas que foram até o fim (Game Over)
  totalFood: 0,       // comidas consumidas, somando todas as partidas
  longestLength: 0,   // maior comprimento já alcançado
};

function getStats() {
  return { ...DEFAULTS, ...load("stats", {}) };
}

// Chamada quando uma partida começa.
export function recordGameStart(startLength) {
  const stats = getStats();
  stats.gamesPlayed++;
  stats.longestLength = Math.max(stats.longestLength, startLength);
  save("stats", stats);
}

// Chamada cada vez que a cobrinha come.
export function recordFoodEaten(snakeLength) {
  const stats = getStats();
  stats.totalFood++;
  stats.longestLength = Math.max(stats.longestLength, snakeLength);
  save("stats", stats);
}

// Chamada quando a partida termina em Game Over.
export function recordGameCompleted() {
  const stats = getStats();
  stats.gamesCompleted++;
  save("stats", stats);
}

// Escreve os números na tela de Statistics.
export function renderStats() {
  const stats = getStats();
  const scores = getHighScores();

  setText("stat-played", stats.gamesPlayed);
  setText("stat-completed", stats.gamesCompleted);
  setText("stat-highest", Math.max(...Object.values(scores)));
  setText("stat-food", stats.totalFood);
  setText("stat-length", stats.longestLength);

  setText("stat-best-easy", scores.easy);
  setText("stat-best-normal", scores.normal);
  setText("stat-best-hard", scores.hard);
  setText("stat-best-insane", scores.insane);
  setText("stat-best-extreme", scores.extreme);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}