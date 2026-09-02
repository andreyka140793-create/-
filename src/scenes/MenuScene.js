import Phaser from 'phaser';
import SFX from '../audio/SoundManager';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.input.once('pointerdown', () => SFX.unlock());

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a237e);

    this.add.text(width / 2, 120, 'САНЫЧ', {
      fontSize: '72px',
      fill: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 190, 'Приключения Сантехника', {
      fontSize: '28px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.highScoreText = this.add.text(width / 2, 250, 'Рекорд: ...', {
      fontSize: '22px',
      fill: '#4fc3f7'
    }).setOrigin(0.5);
    this.loadHighScore();

    // Уровень 1
    const btn1 = this.add.rectangle(width / 2, 360, 320, 64, 0x2e7d32)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 360, '1. ХРУЩЁВКА', {
      fontSize: '28px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    btn1.on('pointerdown', () => {
      SFX.unlock();
      SFX.click();
      this.scene.start('GameScene');
    });

    // Уровень 2
    const unlocked = localStorage.getItem('sanych_level2') === '1';
    const btn2 = this.add.rectangle(width / 2, 440, 320, 64, unlocked ? 0x1565c0 : 0x455a64)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 440, unlocked ? '2. ДАЧА' : '2. ДАЧА 🔒', {
      fontSize: '28px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    btn2.on('pointerdown', () => {
      SFX.click();
      if (unlocked) {
        this.scene.start('Level2Scene');
      } else {
        // Для теста можно открыть; в проде — только после победы на 1
        this.add.text(width / 2, 500, 'Сначала пройди Хрущёвку!', {
          fontSize: '16px', fill: '#ff8a80'
        }).setOrigin(0.5);
        // Раскомментируй для свободного доступа:
        // this.scene.start('Level2Scene');
      }
    });

    this.soundBtn = this.add.text(width - 40, 30, SFX.enabled ? '🔊' : '🔇', { fontSize: '32px' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.soundBtn.on('pointerdown', () => {
      const on = SFX.toggle();
      this.soundBtn.setText(on ? '🔊' : '🔇');
      if (on) SFX.click();
    });

    this.add.text(width / 2, 560, 'Стрелки / WASD — бег   Пробел — удар   Кнопки на экране', {
      fontSize: '15px', fill: '#b0bec5'
    }).setOrigin(0.5);
  }

  loadHighScore() {
    const tg = window.Telegram?.WebApp;
    if (tg?.CloudStorage) {
      tg.CloudStorage.getItem('sanych_highscore', (err, value) => {
        this.highScoreText.setText(`Рекорд: ${(!err && value) ? value : 0} гаек`);
      });
    } else {
      const localRecord = localStorage.getItem('sanych_highscore') || 0;
      this.highScoreText.setText(`Рекорд: ${localRecord} гаек`);
    }
  }
}
