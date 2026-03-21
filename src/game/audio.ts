// Procedural audio system for Latency Escape using Web Audio API

let audioCtx: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let bgmPlaying = false;
let muted = false;

export function isMuted() { return muted; }

export function toggleMute(): boolean {
  muted = !muted;
  if (bgmGain) {
    bgmGain.gain.value = muted ? 0 : 0.06;
  }
  return muted;
}
let bgmOscillators: OscillatorNode[] = [];

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ─── Sound Effects ───

export function playLaneSwitch() {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

export function playJump() {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function playPickup() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Two-tone chime
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, t + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.07);
    osc.stop(t + i * 0.07 + 0.15);
  });
}

export function playHit() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Noise burst + low thud
  const bufferSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start();
  noise.stop(t + 0.12);

  // Low thud
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(t + 0.15);
}

export function playAbility() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Rising sweep with shimmer
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc2.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.3);
  osc2.frequency.setValueAtTime(400, t);
  osc2.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.setValueAtTime(0.1, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 2;
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(ctx.destination);
  osc.start();
  osc2.start();
  osc.stop(t + 0.4);
  osc2.stop(t + 0.4);
}

export function playLevelUp() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Ascending arpeggio
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = t + i * 0.1;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

export function playGameOver() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Descending tones
  const notes = [440, 330, 220, 110];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const start = t + i * 0.15;
    gain.gain.setValueAtTime(0.08, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 - i * 150;
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.25);
  });
}

// ─── Background Music (Procedural Synthwave Loop) ───

export function startBGM() {
  if (bgmPlaying) return;
  const ctx = getCtx();
  bgmPlaying = true;

  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.06;
  bgmGain.connect(ctx.destination);

  // Bass line - cycling through notes
  const bassNotes = [55, 65.4, 73.4, 82.4]; // A1, C2, D2, E2
  let bassIndex = 0;

  function createBassNote() {
    if (!bgmPlaying || !bgmGain) return;
    const ctx2 = getCtx();
    const t = ctx2.currentTime;
    const osc = ctx2.createOscillator();
    const gain = ctx2.createGain();
    const filter = ctx2.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = bassNotes[bassIndex % bassNotes.length];
    bassIndex++;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(150, t + 0.4);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.3);
    gain.gain.linearRampToValueAtTime(0, t + 0.45);
    osc.connect(filter).connect(gain).connect(bgmGain!);
    osc.start(t);
    osc.stop(t + 0.45);
    bgmOscillators.push(osc);
    setTimeout(createBassNote, 500);
  }

  // Pad - sustained ambient chord
  function createPad() {
    if (!bgmPlaying || !bgmGain) return;
    const ctx2 = getCtx();
    const t = ctx2.currentTime;
    const freqs = [130.8, 164.8, 196]; // C3, E3, G3
    freqs.forEach(f => {
      const osc = ctx2.createOscillator();
      const gain = ctx2.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      // Slow LFO vibrato
      const lfo = ctx2.createOscillator();
      const lfoGain = ctx2.createGain();
      lfo.frequency.value = 0.5;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 1);
      gain.gain.linearRampToValueAtTime(0.06, t + 3);
      gain.gain.linearRampToValueAtTime(0, t + 4);
      osc.connect(gain).connect(bgmGain!);
      osc.start(t);
      osc.stop(t + 4);
      lfo.stop(t + 4);
      bgmOscillators.push(osc);
    });
    setTimeout(createPad, 4000);
  }

  // Hi-hat rhythm
  function createHiHat() {
    if (!bgmPlaying || !bgmGain) return;
    const ctx2 = getCtx();
    const t = ctx2.currentTime;
    const bufSize = ctx2.sampleRate * 0.04;
    const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = ctx2.createBufferSource();
    src.buffer = buf;
    const gain = ctx2.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    const hp = ctx2.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    src.connect(hp).connect(gain).connect(bgmGain!);
    src.start();
    setTimeout(createHiHat, 250);
  }

  createBassNote();
  setTimeout(createPad, 100);
  setTimeout(createHiHat, 200);
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmGain) {
    bgmGain.gain.linearRampToValueAtTime(0, getCtx().currentTime + 0.5);
  }
  bgmOscillators.forEach(o => { try { o.stop(); } catch {} });
  bgmOscillators = [];
}

export function resumeAudio() {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume();
  }
}
