import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Задний фон меню
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a237e);

    // Заголовок
    this.add.text(width / 2, 180, 'САНЫЧ', {
      fontSize: '72px',
      fill: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 260, 'Приключения Сантехника', {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Чтение рекорда из Telegram CloudStorage
    this.highScoreText = this.add.text(width / 2, 340, 'Рекорд: ...', {
      fontSize: '24px',
      fill: '#4fc3f7'
    }).setOrigin(0.5);

    this.loadHighScore();

    // Кнопка Старт
    const btnStart = this.add.rectangle(width / 2, 460, 280, 70, 0x2e7d32)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 460, 'ИГРАТЬ', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnStart.on('pointerdown', () => {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      this.scene.start('GameScene');
    });

    // Инструкции управления
    this.add.text(width / 2, 620, 'Управление: Кнопки на экране или [Стрелки] — Бег/Прыжок | [Пробел] — Удар ключом', {
      fontSize: '18px',
      fill: '#b0bec5'
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
