import Phaser from 'phaser';
import SFX from '../audio/SoundManager';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Разблокируем аудио при первом касании
    this.input.once('pointerdown', () => SFX.unlock());

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a237e);

    this.add.text(width / 2, 160, 'САНЫЧ', {
      fontSize: '72px',
      fill: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 240, 'Приключения Сантехника', {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.highScoreText = this.add.text(width / 2, 320, 'Рекорд: ...', {
      fontSize: '24px',
      fill: '#4fc3f7'
    }).setOrigin(0.5);

    this.loadHighScore();

    // Кнопка Старт
    const btnStart = this.add.rectangle(width / 2, 440, 280, 70, 0x2e7d32)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 440, 'ИГРАТЬ', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnStart.on('pointerdown', () => {
      SFX.unlock();
      SFX.click();
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      this.scene.start('GameScene');
    });

    // Кнопка звука
    this.soundBtn = this.add.text(width - 40, 30, '🔊', {
      fontSize: '32px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundBtn.on('pointerdown', () => {
      const on = SFX.toggle();
      this.soundBtn.setText(on ? '🔊' : '🔇');
      if (on) SFX.click();
    });

    this.add.text(width / 2, 560, 'Управление: кнопки на экране  |  Стрелки / WASD  |  Пробел — удар', {
      fontSize: '16px',
      fill: '#b0bec5'
    }).setOrigin(0.5);

    this.add.text(width / 2, 600, 'Собери гайки, почини трубу, не попади под квитанцию ЖКХ', {
      fontSize: '16px',
      fill: '#78909c'
    }).setOrigin(0.5);
  }

  loadHighScore() {
    const tg = window.Telegram?.WebApp;
    if (tg?.CloudStorage) {
      tg.CloudStorage.getItem('sanych_highscore', (err, value) => {
        if (!err && value) {
          this.highScoreText.setText(`Рекорд: ${value} гаек`);
        } else {
          this.highScoreText.setText('Рекорд: 0 гаек');
        }
      });
    } else {
      const localRecord = localStorage.getItem('sanych_highscore') || 0;
      this.highScoreText.setText(`Рекорд: ${localRecord} гаек`);
    }
  }
}
