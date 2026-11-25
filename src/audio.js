// Procedural Web Audio API synthesizer for SUNTHREAD.
// Zero external audio assets — crisp Japanese pentatonic koto plucks,
// silk-cleave sweeps, bronze temple bells, parry pings, and taiko impacts.

const HIRAJOSHI_SCALE = [
  293.66, // D4
  329.63, // E4
  349.23, // F4
  440.00, // A4
  466.16, // Bb4
  587.33, // D5
  659.25, // E5
  698.46, // F5
  880.00, // A5
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.volume = 0.42;
  }

  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  _ready() {
    return !this.muted && this.ctx && this.master && this.ctx.state === 'running';
  }

  playThrow() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.065);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playTetherLatch(tetherCount = 1) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const idx = Math.min(HIRAJOSHI_SCALE.length - 1, Math.max(0, tetherCount - 1));
    const freq = HIRAJOSHI_SCALE[idx];

    // Plucked koto string: triangle fundamental + bright overtone with quick decay
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.003, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  playCleave(chainIndex = 0) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    // Silk slash sweep + crisp harmonic snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const base = 260 + chainIndex * 75;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(base * 2.1, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.55, now + 0.14);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + chainIndex * 220, now);
    filter.Q.value = 2.4;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playLoomSeal(size = 3) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    // Resonant bronze temple bell + shimmering pentatonic chord
    const ratios = [1, 1.5, 2.0, 2.756, 3.31];
    const root = size >= 4 ? 220 : 196;
    ratios.forEach((r, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(root * r, now);
      const amp = 0.24 / (i * 0.75 + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.95 - i * 0.1);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 1.0);
    });

    // Sub taiko punch
    this._taiko(now, 118, 0.28);
  }

  playParry(deflectedCount = 0) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const freq = deflectedCount > 0 ? 1046.5 : 660;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.498, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(deflectedCount > 0 ? 0.3 : 0.15, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (deflectedCount > 0 ? 0.42 : 0.16));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.master);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  playEnemyKill(combo = 1) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const note = HIRAJOSHI_SCALE[Math.min(HIRAJOSHI_SCALE.length - 1, Math.floor(combo / 2))];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(note * 2, now + 0.08);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playPlayerHit() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._taiko(now, 84, 0.38);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.22);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playWaveClear() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const chord = [293.66, 440.0, 587.33, 880.0];
    chord.forEach((freq, i) => {
      const t = now + i * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  playRelicPick() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    [440, 587.33, 880].forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  _taiko(now, startFreq, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.2);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}
