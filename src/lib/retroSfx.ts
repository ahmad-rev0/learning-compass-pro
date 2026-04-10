// Retro 8-bit sound effects using Web Audio API — no external files needed
let audioCtx: AudioContext | null = null;
let _muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

const VOLUME = 0.08;

function beep(freq: number, duration: number, type: OscillatorType = "square") {
  if (_muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = VOLUME;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export const sfx = {
  get muted() { return _muted; },
  set muted(v: boolean) { _muted = v; },
  toggle() { _muted = !_muted; return _muted; },

  click: () => beep(800, 0.06),
  navigate: () => { beep(600, 0.05); setTimeout(() => beep(900, 0.05), 50); },
  success: () => { beep(523, 0.1); setTimeout(() => beep(659, 0.1), 100); setTimeout(() => beep(784, 0.15), 200); },
  xp: () => { beep(1047, 0.08); setTimeout(() => beep(1319, 0.12), 80); },
  error: () => { beep(200, 0.15, "sawtooth"); setTimeout(() => beep(150, 0.2, "sawtooth"), 120); },
  submit: () => { beep(440, 0.06); setTimeout(() => beep(550, 0.06), 60); setTimeout(() => beep(660, 0.08), 120); },
  nudge: () => { beep(400, 0.08); setTimeout(() => beep(500, 0.06), 100); },
  boot: () => { [262, 330, 392, 523].forEach((f, i) => { setTimeout(() => beep(f, 0.12), i * 120); }); },
};
