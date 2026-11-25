// Dynamic Web Audio synthesizer for SOLARIS 3D FPS.
// Includes velocity-reactive wind rush, Prism Lance rail-shots, crystal shatters,
// Solar Grapple magnetic zip, air-dash whoosh, execute booms, and parry chimes.

const STYLE_CHORD = [293.66, 369.99, 440.0, 554.37, 587.33, 739.99, 880.0];

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.windGain = null;
    this.windFilter = null;
    this.muted = false;
    this.volume = 0.42;
  }

  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
      this._initWindLoop();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _initWindLoop() {
    if (!this.ctx || !this.master) return;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();

    this.windFilter = filter;
    this.windGain = gain;
  }

  updateWind(speed) {
    if (!this._ready() || !this.windGain || !this.windFilter) return;
    const now = this.ctx.currentTime;
    const norm = Math.max(0, Math.min(1, (speed - 11) / 26));
    this.windGain.gain.setTargetAtTime(norm * 0.14, now, 0.08);
    this.windFilter.frequency.setTargetAtTime(320 + norm * 1100, now, 0.08);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  _ready() {
    return !this.muted && this.ctx && this.master && this.ctx.state === 'running';
  }

  playShot() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    // Punchy sci-fi solar rail-lance crack + sub thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.11);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.11);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.14);

    // Crisp crystalline click transient
    const ping = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1920, now);
    ping.frequency.exponentialRampToValueAtTime(980, now + 0.045);
    pg.gain.setValueAtTime(0.14, now);
    pg.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    ping.connect(pg);
    pg.connect(this.master);
    ping.start(now);
    ping.stop(now + 0.055);
  }

  playHit(crit = false) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(crit ? 1480 : 920, now);
    osc.frequency.exponentialRampToValueAtTime(crit ? 2200 : 620, now + 0.06);
    gain.gain.setValueAtTime(crit ? 0.24 : 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playKill(combo = 1) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const freq = STYLE_CHORD[Math.min(STYLE_CHORD.length - 1, combo % STYLE_CHORD.length)];

    // Crystalline shatter chime + bass drop
    [1, 1.5, 2.0].forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * mult, now + i * 0.015);
      gain.gain.setValueAtTime(0.001, now + i * 0.015);
      gain.gain.linearRampToValueAtTime(0.18 / (i + 1), now + i * 0.015 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now + i * 0.015);
      osc.stop(now + 0.36);
    });
  }

  playGrapple() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(1420, now + 0.14);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playExecute() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    // Sub-bass kinetic boom + shimmering gold bell
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.26);
    sg.gain.setValueAtTime(0.42, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    sub.connect(sg);
    sg.connect(this.master);
    sub.start(now);
    sub.stop(now + 0.3);

    this.playKill(5);
  }

  playDash() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.16);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playJumpPad() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    [330, 495, 660].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(f * 1.4, now + i * 0.03 + 0.2);
      gain.gain.setValueAtTime(0.14, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.24);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.26);
    });
  }

  playParry(deflected = 0) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(deflected > 0 ? 1174.66 : 587.33, now);
    osc.frequency.exponentialRampToValueAtTime(deflected > 0 ? 1760 : 440, now + 0.18);
    gain.gain.setValueAtTime(deflected > 0 ? 0.34 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  playPlayerDamage() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}
