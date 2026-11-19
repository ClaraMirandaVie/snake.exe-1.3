
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { getPlayerName } from "./player.js";
import { load, save } from "./storage.js";

const TABLE_URL = `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/scores`;
const SPEEDS = ["easy", "normal", "hard", "insane", "extreme"];
const TOP_SIZE = 10;

export function isRankingConfigured() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("COLE_AQUI") &&
    !SUPABASE_KEY.includes("COLE_AQUI")
  );
}

function buildHeaders(extra = {}) {
  const headers = { apikey: SUPABASE_KEY, ...extra };
  if (!SUPABASE_KEY.startsWith("sb_")) {
    headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  }
  return headers;
}

// ---------- Lembrar o que já foi enviado ----------
export function isBetterThanSent(speed, score) {
  const sent = load("ranking-sent", {});
  return score > (sent[speed] ?? 0);
}

function rememberSent(speed, score) {
  const sent = load("ranking-sent", {});
  sent[speed] = score;
  save("ranking-sent", sent);
}

// ---------- Falar com o banco ----------

// Busca o Top 10 de uma dificuldade.
export async function fetchTopScores(speed) {
  if (!SPEEDS.includes(speed)) throw new Error("Dificuldade inválida");

  const url =
    `${TABLE_URL}?select=name,score&speed=eq.${speed}` +
    `&order=score.desc,created_at.asc&limit=100`;

  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) throw new Error(`Erro ${response.status} ao ler o ranking`);
  const rows = await response.json();

  const seen = new Set();
  const top = [];
  for (const row of rows) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    top.push(row);
    if (top.length === TOP_SIZE) break;
  }
  return top;
}

// Envia uma pontuação. Devolve true se deu certo, false se falhou.
export async function submitScore(name, speed, score) {
  try {
    const response = await fetch(TABLE_URL, {
      method: "POST",
      headers: buildHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal", // não precisamos que o banco devolva a linha criada
      }),
      body: JSON.stringify({ name, speed, score }),
    });
    if (response.ok) rememberSent(speed, score);
    else console.warn("O ranking recusou a pontuação. Status:", response.status);
    return response.ok;
  } catch (error) {
    console.warn("Não foi possível enviar a pontuação:", error);
    return false;
  }
}

// ---------- Mostrar na tela ----------
let currentTab = "normal";
let requestId = 0;

export async function showRanking(speed = currentTab) {
  currentTab = speed;

  const myRequest = ++requestId;

  const list = document.getElementById("ranking-list");
  const status = document.getElementById("ranking-status");
  document.getElementById("ranking-player").textContent = getPlayerName() ?? "";
  markTab();
  list.replaceChildren(); // esvazia a lista

  if (!isRankingConfigured()) {
    status.textContent = "O ranking online ainda não foi configurado.";
    status.hidden = false;
    return;
  }

  status.textContent = "Carregando...";
  status.hidden = false;

  try {
    const rows = await fetchTopScores(speed);
    if (myRequest !== requestId) return;

    if (rows.length === 0) {
      status.textContent = "Ninguém no ranking ainda. Seja a primeira! 🏆";
      return;
    }
    status.hidden = true;

    const me = (getPlayerName() ?? "").toLowerCase();
    rows.forEach((row, index) => {
      const item = document.createElement("li");
      item.className = "row";
      if (row.name.toLowerCase() === me) item.classList.add("me");

      item.append(
        makeElement("span", "rank-pos", index + 1),
        makeElement("span", "rank-name", row.name),
        makeElement("strong", "", row.score)
      );
      list.append(item);
    });
  } catch (error) {
    if (myRequest !== requestId) return;
    console.warn(error);
    status.textContent = "Não foi possível carregar o ranking. Tenta de novo mais tarde.";
  }
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function markTab() {
  document.querySelectorAll("[data-ranking]").forEach((button) => {
    const isSelected = button.dataset.ranking === currentTab;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", isSelected);
  });
}