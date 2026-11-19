
// Configuração atual. Quem atualiza isso é o settings.js.
let config = { volume: 0.7, sfxOn: true, musicOn: false };

export function configureAudio(newConfig) {
  config = newConfig;
}

let ctx = null;

function getContext() {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null; // navegador sem suporte: fica mudo
    ctx = new AudioContextClass();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Toca UMA nota.
//  freq     → altura (Hz). Maior = mais agudo.
//  duration → quanto dura, em segundos.
//  type     → formato da onda: "square" (retrô), "triangle" (suave), "sawtooth"...
//  gain     → volume base desta nota (0 a 1), multiplicado pelo volume geral.
//  slideTo  → se tiver, a nota "desliza" até essa frequência.
//  when     → atraso em segundos (pra encadear notas).
function tone(freq, duration, { type = "square", gain = 0.2, slideTo = null, when = 0 } = {}) {
  const c = getContext();
  if (!c || config.volume <= 0) return;

  const start = c.currentTime + when;
  const osc = c.createOscillator();
  const amp = c.createGain(); // controle de volume desta nota

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  }

  amp.gain.setValueAtTime(gain * config.volume, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(amp);
  amp.connect(c.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// ---------- Efeitos sonoros ----------
const SOUNDS = {
  click: () => tone(660, 0.05, { gain: 0.12 }),
  eat: () => {
    tone(520, 0.07);
    tone(780, 0.09, { when: 0.07 });
  },
  gameover: () => tone(300, 0.6, { type: "sawtooth", slideTo: 60 }),
};

export function playSound(name) {
  if (!config.sfxOn) return;
  SOUNDS[name]?.();
}

// ---------- Música de fundo ----------
const MELODY = [220, 261.63, 329.63, 261.63, 196, 246.94, 329.63, 246.94];
const STEP_MS = 240;

let musicTimer = null;
let musicStep = 0;

export function startMusic() {
  if (musicTimer) return; // já tá tocando
  getContext();
  musicTimer = setInterval(() => {
    if (!config.musicOn) return; // dá pra ligar/desligar com o jogo rolando
    tone(MELODY[musicStep % MELODY.length], 0.22, { type: "triangle", gain: 0.1 });
    musicStep++;
  }, STEP_MS);
}

export function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}