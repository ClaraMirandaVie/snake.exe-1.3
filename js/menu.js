
import { getBestScore } from "./storage.js";
import { startGame, stopGame, pauseGame, resumeGame } from "./game.js";
import { resetSettings } from "./settings.js";
import { selectSkin } from "./skins.js";
import { renderStats } from "./statistics.js";
import { playSound } from "./audio.js";
import { getPlayerName, hasPlayerName, setPlayerName } from "./player.js";
import { showRanking } from "./ranking.js";

export const selection = {
  mode: null,  // "classic"
  speed: null, // "easy" | "normal" | "hard"
};

const NOMES_DE_MODO = { classic: "Classic" };
const NOMES_DE_VELOCIDADE = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  insane: "Insane",
  extreme: "Extreme",
};

const screens = document.querySelectorAll(".screen");

export function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === `screen-${name}`);
  });

  if (name === "main-menu") updateMenuRecord();
  if (name === "statistics") renderStats();
  if (name === "name") prepareNameScreen();
  if (name === "ranking") showRanking(selection.speed ?? undefined);

  if (name === "game") {
    updateGameHud();
    startGame(selection.speed);
  } else {
    stopGame();
  }
}

function prepareNameScreen() {
  const input = document.getElementById("name-input");
  input.value = getPlayerName() ?? "";
  document.getElementById("name-error").hidden = true;
  document.getElementById("name-back").hidden = !hasPlayerName();
  input.focus();
}

function updateMenuRecord() {
  document.getElementById("record-value").textContent = getBestScore();
}

function updateGameHud() {
  const modo = NOMES_DE_MODO[selection.mode];
  const velocidade = NOMES_DE_VELOCIDADE[selection.speed];
  document.getElementById("hud-mode").textContent = `${modo} · ${velocidade}`;
}

export function initMenu() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    playSound("click"); // todo botão faz "tic"

    if (button.dataset.mode) selection.mode = button.dataset.mode;
    if (button.dataset.speed) selection.speed = button.dataset.speed;
    if (button.dataset.skin) selectSkin(button.dataset.skin);
    if (button.dataset.ranking) showRanking(button.dataset.ranking); // abas do ranking

    if (button.dataset.goto) showScreen(button.dataset.goto);

    const action = button.dataset.action;
    if (action === "retry") startGame(selection.speed); // RETRY e RESTART
    if (action === "pause") pauseGame();
    if (action === "resume") resumeGame();
    if (action === "reset-settings") resetSettings();
  });

  document.getElementById("name-form").addEventListener("submit", (event) => {
    event.preventDefault(); // impede a página de recarregar
    const name = setPlayerName(document.getElementById("name-input").value);

    if (name === null) {
      document.getElementById("name-error").hidden = false;
      return;
    }
    showScreen("main-menu");
  });

  showScreen(hasPlayerName() ? "main-menu" : "name");
}