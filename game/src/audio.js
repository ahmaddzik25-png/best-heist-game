// MIDNIGHT VAULT - a pocket synthesiser. Every sound is a few
// oscillator blips made on the spot with WebAudio: no audio files, so
// the game still loads with zero network requests. Sounds stay silent
// until the first click or key press (the browser's autoplay rule).

export function createAudio() {
  let ctx = null;
  let enabled = false;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    enabled = Boolean(ctx);
  }

  function blip(freq, dur, type = 'sine', gain = 0.08, slideTo = null, delay = 0) {
    if (!enabled || !ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock,
    coin() {
      blip(1320, 0.07, 'triangle', 0.06);
      blip(1760, 0.09, 'triangle', 0.05, null, 0.05);
    },
    loot() {
      blip(880, 0.08, 'sine', 0.07);
      blip(1174, 0.1, 'sine', 0.07, null, 0.07);
      blip(1568, 0.14, 'sine', 0.06, null, 0.14);
    },
    crack() {
      blip(520, 0.06, 'square', 0.04);
      blip(660, 0.06, 'square', 0.04, null, 0.09);
      blip(990, 0.12, 'square', 0.05, null, 0.18);
    },
    spotted() {
      blip(740, 0.09, 'sawtooth', 0.045, 620);
    },
    busted() {
      blip(392, 0.18, 'sawtooth', 0.09, 196);
      blip(330, 0.22, 'sawtooth', 0.09, 165, 0.16);
      blip(262, 0.4, 'sawtooth', 0.09, 98, 0.34);
    },
    escaped() {
      blip(523, 0.12, 'triangle', 0.08);
      blip(659, 0.12, 'triangle', 0.08, null, 0.11);
      blip(784, 0.12, 'triangle', 0.08, null, 0.22);
      blip(1046, 0.3, 'triangle', 0.09, null, 0.33);
    },
  };
}
