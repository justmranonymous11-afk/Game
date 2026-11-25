// Realistic layered procedural Web Audio engine for SOLARIS: AEGIS POINT.
// Distinct weapon acoustics (Carbine, Railgun, Shotgun + pump rack), footsteps,
// concrete crouch-slide, shield deflection, metallic hit clanks, reloads & explosions.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.windGain = null;
    this.windFilter = null;
    this.muted = false;
    this.volume = 0.45;
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
      this._buildNoiseBuffer();
      this._initWindLoop();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _buildNoiseBuffer() {
    const len = this.ctx.sampleRate * 1.5;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  _initWindLoop() {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 340;
    filter.Q.value = 1.2;

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
    const norm = Math.max(0, Math.min(1, (speed - 12) / 24));
    this.windGain.gain.setTargetAtTime(norm * 0.12, now, 0.08);
    this.windFilter.frequency.setTargetAtTime(280 + norm * 960, now, 0.08);
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

  _noiseBurst(now, dur, filterType, freq, q, gainPeak) {
    if (!this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainPeak, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  playShot(weaponId = 'carbine') {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;

    if (weaponId === 'railgun') {
      // High-energy electromagnetic crack + sub boom + capacitor discharge
      this._noiseBurst(now, 0.24, 'bandpass', 1800, 0.7, 0.42);
      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(320, now);
      sub.frequency.exponentialRampToValueAtTime(42, now + 0.26);
      sg.gain.setValueAtTime(0.36, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      sub.connect(sg);
      sg.connect(this.master);
      sub.start(now);
      sub.stop(now + 0.3);

      const whine = this.ctx.createOscillator();
      const wg = this.ctx.createGain();
      whine.type = 'sine';
      whine.frequency.setValueAtTime(2400, now);
      whine.frequency.exponentialRampToValueAtTime(480, now + 0.22);
      wg.gain.setValueAtTime(0.16, now);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      whine.connect(wg);
      wg.connect(this.master);
      whine.start(now);
      whine.stop(now + 0.25);
      return;
    }

    if (weaponId === 'shotgun') {
      // Thunderous 12-gauge flechette boom + mechanical pump rack!
      this._noiseBurst(now, 0.28, 'lowpass', 1350, 0.8, 0.52);
      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(145, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 0.22);
      sg.gain.setValueAtTime(0.45, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      sub.connect(sg);
      sg.connect(this.master);
      sub.start(now);
      sub.stop(now + 0.26);

      // Delayed metallic pump rack "chk-chk"
      this._noiseBurst(now + 0.24, 0.06, 'bandpass', 2600, 2.5, 0.14);
      this._noiseBurst(now + 0.34, 0.06, 'bandpass', 3200, 2.5, 0.16);
      return;
    }

    // MK-IV Carbine: crisp supersonic crack + bolt transient + punchy low end
    this._noiseBurst(now, 0.11, 'bandpass', 2200, 0.9, 0.32);
    const punch = this.ctx.createOscillator();
    const pg = this.ctx.createGain();
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(195, now);
    punch.frequency.exponentialRampToValueAtTime(52, now + 0.085);
    pg.gain.setValueAtTime(0.32, now);
    pg.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    punch.connect(pg);
    pg.connect(this.master);
    punch.start(now);
    punch.stop(now + 0.1);
  }

  playReload() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, 0.05, 'bandpass', 1900, 3.0, 0.15);
    this._noiseBurst(now + 0.36, 0.06, 'bandpass', 2600, 3.0, 0.18);
    this._noiseBurst(now + 0.62, 0.07, 'bandpass', 3400, 2.2, 0.22);
  }

  playFootstep() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, 0.055, 'lowpass', 480, 1.0, 0.08);
  }

  playSlide() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, 0.34, 'bandpass', 880, 1.1, 0.18);
  }

  playHit(crit = false, shield = false) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = shield ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(shield ? 520 : crit ? 1560 : 840, now);
    osc.frequency.exponentialRampToValueAtTime(shield ? 310 : crit ? 2250 : 540, now + 0.065);
    g.gain.setValueAtTime(crit ? 0.24 : 0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  playExplosion(big = false) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, big ? 0.65 : 0.36, 'lowpass', big ? 680 : 950, 0.7, big ? 0.48 : 0.32);
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(big ? 110 : 140, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + (big ? 0.55 : 0.28));
    sg.gain.setValueAtTime(big ? 0.46 : 0.32, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + (big ? 0.58 : 0.3));
    sub.connect(sg);
    sg.connect(this.master);
    sub.start(now);
    sub.stop(now + (big ? 0.6 : 0.32));
  }

  playKill() {
    this.playExplosion(false);
  }

  playGrapple() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.16);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playExecute() {
    this.playExplosion(true);
  }

  playDash() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, 0.18, 'bandpass', 1100, 0.9, 0.24);
  }

  playJumpPad() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, 0.26, 'bandpass', 950, 1.4, 0.26);
  }

  playParry(deflected = 0) {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(deflected > 0 ? 1180 : 620, now);
    osc.frequency.exponentialRampToValueAtTime(deflected > 0 ? 1760 : 420, now + 0.2);
    g.gain.setValueAtTime(deflected > 0 ? 0.32 : 0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playPlayerDamage() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(now, 0.15, 'lowpass', 540, 1.0, 0.3);
  }
}
