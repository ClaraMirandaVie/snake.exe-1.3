
import { load, save } from "./storage.js";
import { configureAudio } from "./audio.js";

const DEFAULTS = { volume: 70, sfxOn: true, musicOn: false };

let settings = { ...DEFAULTS, ...load("settings", {}) };

let volumeInput, volumeLabel, sfxInput, musicInput;

function applyToAudio() {
  configureAudio({
    volume: settings.volume / 100,
    sfxOn: settings.sfxOn,
    musicOn: settings.musicOn,
  });
}

function syncScreen() {
  volumeInput.value = settings.volume;
  volumeLabel.textContent = `${settings.volume}%`;
  sfxInput.checked = settings.sfxOn;
  musicInput.checked = settings.musicOn;
}

function update(changes) {
  settings = { ...settings, ...changes };
  save("settings", settings);
  applyToAudio();
}

export function resetSettings() {
  settings = { ...DEFAULTS };
  save("settings", settings);
  applyToAudio();
  syncScreen();
}

export function initSettings() {
  volumeInput = document.getElementById("setting-volume");
  volumeLabel = document.getElementById("setting-volume-label");
  sfxInput = document.getElementById("setting-sfx");
  musicInput = document.getElementById("setting-music");

  applyToAudio();
  syncScreen();

  volumeInput.addEventListener("input", () => {
    update({ volume: Number(volumeInput.value) });
    volumeLabel.textContent = `${settings.volume}%`;
  });
  sfxInput.addEventListener("change", () => update({ sfxOn: sfxInput.checked }));
  musicInput.addEventListener("change", () => update({ musicOn: musicInput.checked }));
}