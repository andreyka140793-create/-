/**
 * Простой менеджер звуков на Web Audio API.
 * Не требует внешних файлов — всё генерируется на лету.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._unlocked = false;
  }

  /** Вызывать после первого клика/тапа пользователя */
  unlock() {
    if (this._unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Тихий буфер, чтобы разблокировать на iOS/Telegram
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
      this._unlocked = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  _tone(freq, duration, type = 'square', volume = 0.15, slideTo = null) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) {
      osc.frequency.linearRampToValueAtTime(slideTo, t0 + duration);
    }

    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  _noise(duration, volume = 0.12) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t0);
  }

  // ===== Игровые звуки =====

  jump() {
    this._tone(280, 0.12, 'square', 0.1, 420);
  }

  collectNut() {
    this._tone(660, 0.08, 'sine', 0.12);
    setTimeout(() => this._tone(880, 0.1, 'sine', 0.1), 60);
  }

  collectTape() {
    this._tone(440, 0.1, 'triangle', 0.12);
    setTimeout(() => this._tone(550, 0.1, 'triangle', 0.1), 80);
    setTimeout(() => this._tone(660, 0.15, 'triangle', 0.1), 160);
  }

  attack() {
    this._noise(0.08, 0.14);
    this._tone(180, 0.1, 'sawtooth', 0.1, 90);
  }

  hitEnemy() {
    this._tone(220, 0.12, 'square', 0.14, 80);
    this._noise(0.06, 0.1);
  }

  damage() {
    this._tone(150, 0.2, 'sawtooth', 0.16, 60);
    this._noise(0.15, 0.12);
  }

  bossSpit() {
    this._tone(120, 0.18, 'sine', 0.1, 200);
  }

  bossHit() {
    this._tone(100, 0.15, 'square', 0.15, 50);
    this._noise(0.1, 0.12);
  }

  win() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.2, 'sine', 0.12), i * 120);
    });
  }

  lose() {
    this._tone(300, 0.25, 'sawtooth', 0.14, 80);
    setTimeout(() => this._tone(200, 0.35, 'sawtooth', 0.12, 60), 200);
  }

  click() {
    this._tone(600, 0.05, 'square', 0.08);
  }

  footstep() {
    this._noise(0.04, 0.06);
    this._tone(80, 0.04, 'sine', 0.04);
  }

  drip() {
    this._tone(900, 0.06, 'sine', 0.06, 400);
  }

  powerup() {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.1, 'triangle', 0.1), i * 70);
    });
  }

  bubble() {
    this._tone(320, 0.15, 'square', 0.08);
    setTimeout(() => this._tone(280, 0.2, 'square', 0.06), 100);
  }

  breakBox() {
    this._noise(0.12, 0.14);
    this._tone(150, 0.1, 'sawtooth', 0.1, 60);
  }

  tapeFix() {
    this._noise(0.2, 0.1);
    [300, 400, 500].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.12, 'triangle', 0.1), i * 100);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Синглтон
const SFX = new SoundManager();
export default SFX;
