import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.isWin = data.win || false;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, this.isWin ? 0x1b5e20 : 0xb71c1c);

    const titleText = this.isWin ? 'ПОБЕДА! ТРУБА ПОЧИНЕНА!' : 'АВАРИЯ! ТРУБУ ПРОРВАЛО!';
    this.add.text(width / 2, 200, titleText, {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 300, `Собрано гаек: ${this.finalScore}`, {
      fontSize: '36px',
      fill: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.saveHighScore(this.finalScore);

    // Кнопка Заново
    const btnRestart = this.add.rectangle(width / 2, 440, 300, 70, 0xffb300)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 440, 'ИГРАТЬ СНОВА', {
      fontSize: '28px',
      fill: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Кнопка Меню
    const btnMenu = this.add.rectangle(width / 2, 530, 300, 60, 0x37474f)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 530, 'В ГЛАВНОЕ МЕНЮ', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    btnRestart.on('pointerdown', () => this.scene.start('GameScene'));
    btnMenu.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  saveHighScore(score) {
    const tg = window.Telegram?.WebApp;

    if (tg?.CloudStorage) {
      tg.CloudStorage.getItem('sanych_highscore', (err, value) => {
        const currentRecord = parseInt(value || '0', 10);
        if (score > currentRecord) {
          tg.CloudStorage.setItem('sanych_highscore', score.toString());
        }
      });
    } else {
      const currentRecord = parseInt(localStorage.getItem('sanych_highscore') || '0', 10);
      if (score > currentRecord) {
        localStorage.setItem('sanych_highscore', score.toString());
      }
    }
  }
}
