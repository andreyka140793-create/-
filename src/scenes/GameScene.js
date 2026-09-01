import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.score = 0;
    this.hp = 3;
    this.hasShield = false;
    this.isAttacking = false;
    this.isInvulnerable = false;
    this.facing = 'right';
    this.bossDefeated = false;
  }

  create() {
    const mapWidth = 3600;
    const mapHeight = 720;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 1. Поверхности и платформы
    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < mapWidth; x += 64) {
      // Ямы
      if ((x > 900 && x < 1100) || (x > 2200 && x < 2400)) continue;
      this.platforms.create(x + 32, 688, 'tile_ground');
    }

    // Подвесные мостки и трубы
    [
      { x: 500, y: 520 }, { x: 750, y: 380 }, { x: 1300, y: 500 },
      { x: 1600, y: 360 }, { x: 1900, y: 480 }, { x: 2600, y: 520 },
      { x: 2900, y: 400 }, { x: 3100, y: 300 }
    ].forEach(p => {
      this.platforms.create(p.x, p.y, 'tile_ground').setScale(1.8, 0.4).refreshBody();
    });

    // 2. Игрок (Саныч)
    this.player = this.physics.add.sprite(100, 500, 'sanych');
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // 3. Предметы
    this.nuts = this.physics.add.group();
    for (let x = 300; x < 3000; x += 150) {
      const nut = this.nuts.create(x, 200 + Math.random() * 150, 'nut');
      nut.setBounceY(0.4);
    }
    this.physics.add.collider(this.nuts, this.platforms);
    this.physics.add.overlap(this.player, this.nuts, this.collectNut, null, this);

    this.tapes = this.physics.add.group();
    [800, 1750, 2500].forEach(x => {
      const tape = this.tapes.create(x, 300, 'tape');
      tape.setBounceY(0.3);
    });
    this.physics.add.collider(this.tapes, this.platforms);
    this.physics.add.overlap(this.player, this.tapes, this.collectTape, null, this);

    // 4. Враги (Соседи и Коты)
    this.enemies = this.physics.add.group();
    const enemySpawns = [
      { x: 600, type: 'enemy_neighbor' },
      { x: 1400, type: 'enemy_cat' },
      { x: 1800, type: 'enemy_neighbor' },
      { x: 2100, type: 'enemy_cat' },
      { x: 2700, type: 'enemy_neighbor' }
    ];

    enemySpawns.forEach(e => {
      const enemy = this.enemies.create(e.x, 500, e.type);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocityX(-100);
      enemy.setBounce(0);
    });

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // 5. Босс (Труба-Моллюск)
    this.boss = this.physics.add.sprite(3300, 500, 'boss');
    this.boss.setCollideWorldBounds(true);
    this.boss.hp = 5;
    this.boss.setImmovable(true);
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.overlap(this.player, this.boss, this.handlePlayerBossCollision, null, this);

    // 6. Камера
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#1a237e');

    // 7. Интерфейс (HUD)
    this.hudScore = this.add.text(20, 20, 'Гайки: 0', {
      fontSize: '26px',
      fill: '#ffd54f',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setScrollFactor(0);

    this.hudHp = this.add.text(20, 55, 'Здоровье: ❤️❤️❤️', {
      fontSize: '26px',
      fill: '#ff1744',
      stroke: '#000',
      strokeThickness: 3
    }).setScrollFactor(0);

    this.hudShield = this.add.text(20, 90, '', {
      fontSize: '22px',
      fill: '#2979ff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setScrollFactor(0);

    this.hudBoss = this.add.text(20, 125, '', {
      fontSize: '22px',
      fill: '#00e676',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setScrollFactor(0);

    // 8. Управление
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    this.setupTouchUI();
  }

  setupTouchUI() {
    this.touchState = { left: false, right: false, jump: false };

    const btnLeft = this.add.image(90, 610, 'btn_base').setInteractive().setScrollFactor(0).setDepth(100);
    const btnRight = this.add.image(210, 610, 'btn_base').setInteractive().setScrollFactor(0).setDepth(100);
    const btnJump = this.add.image(1070, 610, 'btn_base').setInteractive().setScrollFactor(0).setDepth(100);
    const btnAttack = this.add.image(1190, 610, 'btn_attack').setInteractive().setScrollFactor(0).setDepth(100);

    this.add.text(80, 595, '◄', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0).setDepth(101);
    this.add.text(200, 595, '►', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0).setDepth(101);
    this.add.text(1060, 595, '▲', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0).setDepth(101);
    this.add.text(1172, 595, '🔧', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0).setDepth(101);

    btnLeft.on('pointerdown', () => { this.touchState.left = true; });
    btnLeft.on('pointerup', () => { this.touchState.left = false; });
    btnLeft.on('pointerout', () => { this.touchState.left = false; });

    btnRight.on('pointerdown', () => { this.touchState.right = true; });
    btnRight.on('pointerup', () => { this.touchState.right = false; });
    btnRight.on('pointerout', () => { this.touchState.right = false; });

    btnJump.on('pointerdown', () => { this.touchState.jump = true; });
    btnJump.on('pointerup', () => { this.touchState.jump = false; });
    btnJump.on('pointerout', () => { this.touchState.jump = false; });

    btnAttack.on('pointerdown', () => this.attack());
  }

  triggerHaptic(type = 'light') {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (type === 'error') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    }
  }

  attack() {
    if (this.isAttacking || this.bossDefeated) return;
    this.isAttacking = true;
    this.triggerHaptic('medium');

    const offsetX = this.facing === 'right' ? 40 : -40;
    const wrench = this.physics.add.sprite(this.player.x + offsetX, this.player.y, 'wrench');
    wrench.body.setAllowGravity(false);
    wrench.setDepth(10);

    // Удар по врагам
    this.physics.add.overlap(wrench, this.enemies, (w, enemy) => {
      if (!enemy.active) return;
      enemy.destroy();
      this.score += 50;
      this.hudScore.setText(`Гайки: ${this.score}`);
      this.triggerHaptic('heavy');
    }, null, this);

    // Удар по боссу
    if (this.boss && this.boss.active) {
      this.physics.add.overlap(wrench, this.boss, (w, boss) => {
        if (this.bossDefeated) return;
        boss.hp -= 1;
        this.triggerHaptic('heavy');
        boss.setTint(0xff0000);
        this.time.delayedCall(120, () => {
          if (boss.active) boss.clearTint();
        });

        this.hudBoss.setText(`Труба-Моллюск: ${'❤️'.repeat(Math.max(0, boss.hp))}`);

        if (boss.hp <= 0) {
          this.bossDefeated = true;
          boss.destroy();
          this.score += 500;
          this.hudScore.setText(`Гайки: ${this.score}`);
          this.hudBoss.setText('ТРУБА ПОЧИНЕНА!');
          this.cameras.main.flash(500, 0, 230, 118);

          this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', { score: this.score, win: true });
          });
        }
      }, null, this);
    }

    this.time.delayedCall(220, () => {
      if (wrench.active) wrench.destroy();
      this.isAttacking = false;
    });
  }

  collectNut(player, nut) {
    nut.disableBody(true, true);
    this.score += 10;
    this.hudScore.setText(`Гайки: ${this.score}`);
    this.triggerHaptic('light');
  }

  collectTape(player, tape) {
    tape.disableBody(true, true);
    this.hasShield = true;
    this.hudShield.setText('🛡️ Изолента активна (5с)');
    this.triggerHaptic('medium');

    // Щит действует 5 секунд
    this.time.delayedCall(5000, () => {
      if (this.hasShield) {
        this.hasShield = false;
        this.hudShield.setText('');
      }
    });
  }

  handlePlayerEnemyCollision(player, enemy) {
    if (this.isInvulnerable || this.bossDefeated) return;

    if (this.hasShield) {
      this.hasShield = false;
      this.hudShield.setText('');
      this.makeInvulnerable(1000);
      enemy.destroy();
      this.score += 25;
      this.hudScore.setText(`Гайки: ${this.score}`);
      this.triggerHaptic('medium');
      return;
    }

    this.takeDamage();
  }

  handlePlayerBossCollision(player, boss) {
    if (this.isInvulnerable || this.bossDefeated) return;
    this.takeDamage();
  }

  takeDamage() {
    this.hp -= 1;
    this.updateHpUI();
    this.triggerHaptic('error');
    this.makeInvulnerable(1500);
    this.cameras.main.shake(200, 0.01);

    if (this.hp <= 0) {
      this.time.delayedCall(300, () => {
        this.scene.start('GameOverScene', { score: this.score, win: false });
      });
    }
  }

  makeInvulnerable(duration) {
    this.isInvulnerable = true;
    this.player.setAlpha(0.45);
    this.time.delayedCall(duration, () => {
      this.isInvulnerable = false;
      this.player.setAlpha(1);
    });
  }

  updateHpUI() {
    const hearts = '❤️'.repeat(Math.max(0, this.hp));
    this.hudHp.setText(`Здоровье: ${hearts || '💀'}`);
  }

  update() {
    if (this.bossDefeated) return;

    const speed = 280;

    // Движение (стрелки + WASD + тач)
    const left = this.cursors.left.isDown || this.keyA.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touchState.right;
    const jump = this.cursors.up.isDown || this.keyW.isDown || this.touchState.jump;

    if (left) {
      this.player.setVelocityX(-speed);
      this.facing = 'left';
    } else if (right) {
      this.player.setVelocityX(speed);
      this.facing = 'right';
    } else {
      this.player.setVelocityX(0);
    }

    // Прыжок
    if (jump && this.player.body.touching.down) {
      this.player.setVelocityY(-580);
      this.triggerHaptic('light');
    }

    // Атака с клавиатуры
    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      this.attack();
    }

    // Падение в яму → потеря жизни / game over
    if (this.player.y > 710) {
      this.takeDamage();
      if (this.hp > 0) {
        // Респавн чуть левее ямы
        this.player.setPosition(Math.max(80, this.player.x - 150), 400);
        this.player.setVelocity(0, 0);
      }
    }

    // Простейший ИИ патрулирования врагов
    this.enemies.children.iterate(enemy => {
      if (enemy && enemy.body && enemy.active) {
        if (enemy.body.blocked.left) {
          enemy.setVelocityX(120);
        } else if (enemy.body.blocked.right) {
          enemy.setVelocityX(-120);
        }
      }
    });

    // Показываем HP босса, когда игрок близко
    if (this.boss && this.boss.active && Math.abs(this.player.x - this.boss.x) < 600) {
      this.hudBoss.setText(`Труба-Моллюск: ${'❤️'.repeat(Math.max(0, this.boss.hp))}`);
    }
  }
}
