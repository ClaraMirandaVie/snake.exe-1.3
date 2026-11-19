
import { load, save } from "./storage.js";

export const SKINS = {
  default: { body: "#22e3e3", head: "#ffffff" },
  pink:    { body: "#ff5ccf", head: "#ffffff" },
  lime:    { body: "#b6f23a", head: "#ffffff" },
  white:   { body: "#e8eaed", head: "#22e3e3" },
};

let currentSkin = load("skin", "default");
if (!SKINS[currentSkin]) currentSkin = "default";

export function getSkin() {
  return SKINS[currentSkin];
}

export function selectSkin(id) {
  if (!SKINS[id]) return;
  currentSkin = id;
  save("skin", id);
  markSelected();
}

function markSelected() {
  document.querySelectorAll(".skin").forEach((button) => {
    const isSelected = button.dataset.skin === currentSkin;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", isSelected);
  });
}

export function initSkins() {
  // Passa as cores pro CSS via variáveis, pra mostrar a prévia de cada skin
  document.querySelectorAll(".skin").forEach((button) => {
    const skin = SKINS[button.dataset.skin];
    button.style.setProperty("--skin", skin.body);
    button.style.setProperty("--skin-head", skin.head);
  });
  markSelected();
}