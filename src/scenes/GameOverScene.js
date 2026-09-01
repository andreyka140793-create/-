import Phaser from 'phaser';
import SFX from '../audio/SoundManager';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.isWin = data.win || false;
    this.checkpointX = data.checkpointX || 120;
    this.level = data.level || 1;
  }

  create() {
    const { width, height } = this.scale;

    if (this.isWin) SFX.win();
    else SFX.lose();

    // Фон
    const bgColor = this.isWin ? 0x1b5e20 : 0x4a148c;
    this.add.rectangle(width / 2, height / 2, width, height, bgColor);

    // Лёгкий градиентный оверлей (два полупрозрачных прямоугольника)
    this.add.rectangle(width / 2, 0, width, 180, 0x000000, 0.25).setOrigin(0.5, 0);
    this.add.rectangle(width / 2, height, width, 200, 0x000000, 0.3).setOrigin(0.5, 1);

    // --- Заголовок ---
    const title = this.isWin ? 'ПОБЕДА!' : 'АВАРИЯ!';
    const subtitle = this.isWin ? 'Труба починена. Порядок наведён.' : 'Трубу прорвало. ЖЭК в панике.';

    this.add.text(width / 2, 110, title, {
      fontSize: '56px',
      fill: this.isWin ? '#69f0ae' : '#ff8a80',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 175, subtitle, {
      fontSize: '22px',
      fill: '#eceff1',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // --- Счёт ---
    const scoreBox = this.add.rectangle(width / 2, 260, 340, 70, 0x000000, 0.35);
    this.add.text(width / 2, 248, 'Собрано гаек', {
      fontSize: '16px',
      fill: '#b0bec5'
    }).setOrigin(0.5);

    this.add.text(width / 2, 278, `${this.finalScore}`, {
      fontSize: '36px',
      fill: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Рекорд
    this.recordText = this.add.text(width / 2, 320, '', {
      fontSize: '18px',
      fill: '#80cbc4'
    }).setOrigin(0.5);

    this.saveAndShowRecord(this.finalScore);

    // ========== КНОПКИ ==========
    const btnY = this.isWin ? 400 : 390;

    if (this.isWin && this.level === 1) {
      localStorage.setItem('sanych_level2', '1');
    }

    if (this.isWin && this.level === 1) {
      this.makeButton(width / 2, btnY, 320, 64, 0x2e7d32, '#ffffff', 'УРОВЕНЬ 2: ДАЧА →', () => {
        SFX.click();
        this.scene.start('Level2Scene', { score: this.finalScore });
      });
      this.makeButton(width / 2, btnY + 75, 320, 56, 0xffb300, '#000000', 'ЕЩЁ РАЗ ХРУЩЁВКУ', () => {
        SFX.click();
        this.scene.start('GameScene');
      }, 22);
    } else {
      this.makeButton(width / 2, btnY, 320, 64, 0xffb300, '#000000', 'ИГРАТЬ СНОВА', () => {
        SFX.click();
        this.scene.start(this.level === 2 ? 'Level2Scene' : 'GameScene');
      });
    }

    // 2. Только при поражении — Продолжить за Stars
    if (!this.isWin) {
      this.makeButton(width / 2, btnY + 80, 320, 64, 0x7c4dff, '#ffffff', '⭐ ПРОДОЛЖИТЬ ЗА 15', () => {
        this.tryContinueWithStars();
      });

      this.starsHint = this.add.text(width / 2, btnY + 130, 'Восстановит 1 жизнь и продолжит уровень', {
        fontSize: '14px',
        fill: '#b39ddb'
      }).setOrigin(0.5);
    }

    // 3. В меню
    let menuY = this.isWin ? btnY + 80 : btnY + 170;
    if (this.isWin && this.level === 1) menuY = btnY + 150;
    this.makeButton(width / 2, menuY, 280, 52, 0x37474f, '#ffffff', 'В ГЛАВНОЕ МЕНЮ', () => {
      SFX.click();
      this.scene.start('MenuScene');
    }, 22);

    // Подсказка про Stars (для разработчика / MVP)
    if (!this.isWin) {
      this.add.text(width / 2, height - 28, 'Полная оплата Stars подключается через бота (Bot API)', {
        fontSize: '12px',
        fill: '#78909c'
      }).setOrigin(0.5);
    }
  }

  makeButton(x, y, w, h, color, textColor, label, onClick, fontSize = 26) {
    const bg = this.add.rectangle(x, y, w, h, color)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff, 0.15);

    const txt = this.add.text(x, y, label, {
      fontSize: `${fontSize}px`,
      fill: textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setScale(1.03));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', onClick);

    return { bg, txt };
  }

  tryContinueWithStars() {
    SFX.click();

    const tg = window.Telegram?.WebApp;

    // --- Реальная оплата Stars (когда будет invoice-ссылка от бота) ---
    // Раскомментируй и подставь ссылку, когда настроишь бота:
    //
    // if (tg?.openInvoice) {
    //   tg.openInvoice('https://t.me/$YOUR_BOT/invoice_link', (status) => {
    //     if (status === 'paid') {
    //       this.doContinue();
    //     }
    //   });
    //   return;
    // }

    // --- MVP / демо: локальные «звёзды» ---
    let localStars = parseInt(localStorage.getItem('sanych_stars') || '30', 10);

    if (localStars >= 15) {
      localStars -= 15;
      localStorage.setItem('sanych_stars', String(localStars));
      this.showToast(`Списано 15 ⭐  Осталось: ${localStars}`);
      this.time.delayedCall(500, () => this.doContinue());
    } else {
      // Для удобства тестирования — один раз даём «в долг»
      const usedFree = localStorage.getItem('sanych_free_continue') === '1';
      if (!usedFree) {
        localStorage.setItem('sanych_free_continue', '1');
        this.showToast('Демо: бесплатное продолжение (1 раз)');
        this.time.delayedCall(500, () => this.doContinue());
      } else {
        this.showToast('Недостаточно Stars. Для теста: localStorage sanych_stars = 50');
        // В реальном приложении здесь открывался бы инвойс
        if (tg?.showAlert) {
          tg.showAlert('Недостаточно Stars. Оплата через бота пока не подключена.');
        }
      }
    }
  }

  doContinue() {
    this.scene.start(this.level === 2 ? 'Level2Scene' : 'GameScene', {
      continue: true,
      score: this.finalScore,
      hp: 1,
      startX: this.checkpointX
    });
  }

  showToast(msg) {
    const { width, height } = this.scale;
    const toast = this.add.text(width / 2, height - 80, msg, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: height - 110,
      duration: 2200,
      ease: 'Power2',
      onComplete: () => toast.destroy()
    });
  }

  saveAndShowRecord(score) {
    const tg = window.Telegram?.WebApp;
    const key = 'sanych_highscore';

    const apply = (record) => {
      const isNew = score > record;
      if (isNew) {
        this.recordText.setText(`🏆 Новый рекорд! Было: ${record}`);
        this.recordText.setColor('#ffd54f');
      } else {
        this.recordText.setText(`Рекорд: ${record} гаек`);
      }
    };

    if (tg?.CloudStorage) {
      tg.CloudStorage.getItem(key, (err, value) => {
        const current = parseInt(value || '0', 10);
        apply(current);
        if (score > current) {
          tg.CloudStorage.setItem(key, String(score));
        }
      });
    } else {
      const current = parseInt(localStorage.getItem(key) || '0', 10);
      apply(current);
      if (score > current) {
        localStorage.setItem(key, String(score));
      }
    }
  }
}
