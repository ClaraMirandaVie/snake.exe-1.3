import { load, save } from "./storage.js";

export function cleanName(raw) {
  const name = raw.trim().replace(/\s+/g, " "); // tira espaços do começo/fim e duplicados
  const isValid = /^[\p{L}\p{N}_\- ]{1,12}$/u.test(name);
  return isValid ? name : null;
}

export function getPlayerName() {
  return load("player", null);
}

export function hasPlayerName() {
  return getPlayerName() !== null;
}

export function setPlayerName(raw) {
  const name = cleanName(raw);
  if (name === null) return null;
  save("player", name);
  return name;
}