import Phaser from 'phaser';
import SFX from '../audio/SoundManager';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data = {}) {
    this.score = data.score || 0;
    this.hp = data.hp || 3;
    this.startX = data.startX || 120;
    this.isContinue = !!data.continue;

    this.hasShield = false;
    this.isAttacking = false;
    this.isInvulnerable = false;
    this.facing = 'right';
    this.bossDefeated = false;
    this.zone = 1;

    // Геймплей
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.checkpointX = this.startX;
    this.combo = 0;
    this.comboTimer = 0;
    this.bossVulnerable = false;
    this._jumpWasHeld = false;
    this.hasPowerWrench = false;
    this.powerWrenchTimer = 0;
    this.footstepTimer = 0;
    this.tutorialStep = 0;
    this.slippery = false;
    this.spokenNeighbors = new Set();
    this.billWaveTimer = 0;
  }

  create() {
    const mapWidth = 4200;
    const mapHeight = 720;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // ===== ФОН по зонам (цвет неба) =====
    this.cameras.main.setBackgroundColor('#1a237e');
    this.input.once('pointerdown', () => SFX.unlock());

    // Чекпоинты по зонам
    this.checkpointZones = [
      { x: 120 }, { x: 900 }, { x: 1800 }, { x: 2600 }, { x: 3400 }
    ];

    // ===== ПЛАТФОРМЫ =====
    this.platforms = this.physics.add.staticGroup();

    // Основная земля с ямами
    for (let x = 0; x < mapWidth; x += 64) {
      // Ямы: двор→подъезд, лестница, перед боссом
      if ((x >= 920 && x < 1040) || (x >= 2000 && x < 2120) || (x >= 3120 && x < 3240)) continue;
      this.platforms.create(x + 32, 688, 'tile_ground');
    }

    // --- Зона 1: Двор (0–900) ---
    // Лавочка (декор)
    this.add.image(220, 640, 'deco_bench').setDepth(1);
    // Качели-платформа (движущаяся)
    this.swing = this.physics.add.image(420, 480, 'deco_swing');
    this.swing.body.setAllowGravity(false);
    this.swing.body.setImmovable(true);
    this.swing.setData('baseY', 480);
    

    // Платформы двора + мостики у ям
    [
      { x: 350, y: 520 }, { x: 550, y: 420 }, { x: 750, y: 340 },
      { x: 980, y: 560 }, { x: 2060, y: 560 }, { x: 3180, y: 560 }
    ].forEach(p => {
      this.platforms.create(p.x, p.y, 'tile_pipe').setScale(1.5, 1).refreshBody();
    });

    // --- Зона 2: Подъезд (900–1800) ---
    // Разбитые ступени
    [
      { x: 1150, y: 600 }, { x: 1250, y: 520 }, { x: 1350, y: 440 },
      { x: 1450, y: 360 }, { x: 1550, y: 440 }, { x: 1650, y: 520 }
    ].forEach(p => {
      this.platforms.create(p.x, p.y, 'tile_brick').setScale(1.2, 1).refreshBody();
    });

    // --- Зона 3: Лестничная клетка (1800–2600) ---
    // Лифтовые платформы (движущиеся)
    this.elevators = [];
    [
      { x: 1900, y: 500, range: 120 },
      { x: 2200, y: 380, range: 160 },
      { x: 2450, y: 450, amp: 100 }
    ].forEach((e, i) => {
      const elev = this.physics.add.image(e.x, e.y, 'tile_pipe');
      elev.setScale(1.8, 1);
      elev.body.setAllowGravity(false);
      elev.body.setImmovable(true);
      elev.refreshBody();
      elev.setData('baseY', e.y);
      elev.setData('amp', e.amp);
      elev.setData('speed', 0.0012 + i * 0.0003);
      elev.setData('phase', i * 1.5);
      this.elevators.push(elev);
      
    });

    // Статичные платформы лестницы
    [
      { x: 2050, y: 280 }, { x: 2350, y: 220 }
    ].forEach(p => {
      this.platforms.create(p.x, p.y, 'tile_brick').setScale(1.3, 1).refreshBody();
    });

    // --- Зона 4: Квартира с протечкой (2600–3400) ---
    [
      { x: 2700, y: 520 }, { x: 2850, y: 400 }, { x: 3000, y: 320 },
      { x: 2950, y: 520 }
    ].forEach(p => {
      this.platforms.create(p.x, p.y, 'tile_pipe').setScale(1.4, 1).refreshBody();
    });

    // --- Зона 5: Босс (3400+) ---
    this.platforms.create(3550, 600, 'tile_ground').setScale(3, 1).refreshBody();
    this.platforms.create(3800, 500, 'tile_pipe').setScale(2, 1).refreshBody();

    // ===== ИГРОК =====
    this.player = this.physics.add.sprite(this.startX || 120, 500, 'sanych_sheet', 0);
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play('sanych_idle');
    this.physics.add.collider(this.player, this.platforms);

    // Коллизии с лифтами (после создания игрока)
    this.elevators.forEach(elev => {
      this.physics.add.collider(this.player, elev);
    });

    // Качели — отдельная коллизия
    if (this.swing) {
      this.physics.add.collider(this.player, this.swing);
    }

    // ===== ПРЕДМЕТЫ =====
    this.nuts = this.physics.add.group();
    const nutPositions = [
      280, 400, 520, 680, 900, 1200, 1400, 1600, 1850, 2100,
      2300, 2550, 2750, 2900, 3050, 3400, 3600
    ];
    nutPositions.forEach((x, i) => {
      const nut = this.nuts.create(x, 180 + (i % 3) * 60, 'nut');
      nut.setBounceY(0.35);
      nut.setDepth(5);
    });
    this.physics.add.collider(this.nuts, this.platforms);
    this.physics.add.overlap(this.player, this.nuts, this.collectNut, null, this);

    this.tapes = this.physics.add.group();
    [700, 1500, 2400, 3200].forEach(x => {
      const tape = this.tapes.create(x, 250, 'tape');
      tape.setBounceY(0.3);
      tape.setDepth(5);
    });
    this.physics.add.collider(this.tapes, this.platforms);
    this.physics.add.overlap(this.player, this.tapes, this.collectTape, null, this);

    // ===== ПОЧТОВЫЕ ЯЩИКИ (разрушаемые) =====
    this.mailboxes = this.physics.add.staticGroup();
    [1050, 1280, 1520].forEach(x => {
      const box = this.mailboxes.create(x, 640, 'mailbox');
      box.setDepth(4);
      box.hp = 1;
    });
    this.physics.add.collider(this.player, this.mailboxes);

    // ===== УСИЛЕННЫЙ КЛЮЧ (буст) =====
    this.powerWrenches = this.physics.add.group();
    [1600, 2900].forEach(x => {
      const pw = this.powerWrenches.create(x, 280, 'power_wrench');
      pw.setBounceY(0.3);
      pw.setDepth(5);
    });
    this.physics.add.collider(this.powerWrenches, this.platforms);
    this.physics.add.overlap(this.player, this.powerWrenches, this.collectPowerWrench, null, this);

    // ===== СЕКРЕТНАЯ ПЛАТФОРМА + ГАЙКИ =====
    this.platforms.create(700, 200, 'tile_pipe').setScale(1.2, 1).refreshBody();
    for (let i = 0; i < 3; i++) {
      const sn = this.nuts.create(680 + i * 30, 140, 'nut');
      sn.setBounceY(0.3);
      sn.setDepth(5);
    }

    // ===== ВРАГИ =====
    this.enemies = this.physics.add.group();

    // Соседи
    [600, 1300, 1700, 2500, 2800].forEach(x => {
      const e = this.enemies.create(x, 500, 'neighbor_sheet', 0);
      e.setCollideWorldBounds(true);
      e.setVelocityX(-75);
      e.setData('type', 'neighbor');
      e.setData('uid', 'n' + x);
      e.setDepth(8);
      e.play('neighbor_walk');
    });

    // Коты
    [1000, 2000, 2600].forEach(x => {
      const e = this.enemies.create(x, 480, 'cat_sheet', 0);
      e.setCollideWorldBounds(true);
      e.setVelocityX(-120);
      e.setData('type', 'cat');
      e.setData('jumpTimer', 0);
      e.setDepth(8);
      e.play('cat_walk');
    });

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Летающие квитанции
    this.bills = this.physics.add.group();
    [1100, 1900, 2700, 3100].forEach((x, i) => {
      const bill = this.bills.create(x, 80 + i * 30, 'enemy_bill');
      bill.body.setAllowGravity(false);
      bill.setVelocityY(80 + i * 20);
      bill.setData('baseX', x);
      bill.setDepth(7);
    });
    this.physics.add.overlap(this.player, this.bills, this.handlePlayerEnemyCollision, null, this);

    // ===== КАПАЮЩАЯ ВОДА (зона квартиры) =====
    this.waterDrops = this.physics.add.group();
    this.time.addEvent({
      delay: 1300,
      loop: true,
      callback: () => {
        if (this.player.x > 2550 && this.player.x < 3400) {
          const x = 2600 + Math.random() * 700;
          const drop = this.waterDrops.create(x, 40, 'water_drop');
          drop.setVelocityY(190);
          drop.body.setAllowGravity(false);
          drop.setDepth(6);
          if (Math.random() < 0.35) SFX.drip();
          this.time.delayedCall(3000, () => { if (drop.active) drop.destroy(); });
        }
      }
    });
    this.physics.add.overlap(this.player, this.waterDrops, (player, drop) => {
      drop.destroy();
      if (!this.isInvulnerable && !this.hasShield) {
        this.takeDamage();
      } else if (this.hasShield) {
        this.hasShield = false;
        this.hudShield.setText('');
        this.makeInvulnerable(800);
      }
    }, null, this);

    // ===== БОСС =====
    this.boss = this.physics.add.sprite(3900, 480, 'boss');
    this.boss.setCollideWorldBounds(true);
    this.boss.hp = 6;
    this.boss.setImmovable(true);
    this.boss.setDepth(9);
    this.boss.setData('attackTimer', 0);
    this.boss.setData('phase', 1);
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.overlap(this.player, this.boss, this.handlePlayerBossCollision, null, this);

    this.bossProjectiles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.bossProjectiles, (player, proj) => {
      proj.destroy();
      if (!this.isInvulnerable) this.takeDamage();
    }, null, this);

    // ===== КАМЕРА =====
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);

    // ===== HUD =====
    const hudStyle = { fontSize: '24px', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 };

    this.hudScore = this.add.text(16, 14, `Гайки: ${this.score}`, { ...hudStyle, fill: '#ffd54f' }).setScrollFactor(0).setDepth(100);
    this.hudHp = this.add.text(16, 48, '❤️❤️❤️', { ...hudStyle, fill: '#ff1744', fontSize: '28px' }).setScrollFactor(0).setDepth(100);
    this.hudShield = this.add.text(16, 86, '', { ...hudStyle, fill: '#42a5f5', fontSize: '20px' }).setScrollFactor(0).setDepth(100);
    this.hudZone = this.add.text(16, 116, 'Зона: Двор', { ...hudStyle, fill: '#b0bec5', fontSize: '18px' }).setScrollFactor(0).setDepth(100);
    this.hudBoss = this.add.text(16, 146, '', { ...hudStyle, fill: '#00e676', fontSize: '20px' }).setScrollFactor(0).setDepth(100);
    this.hudPower = this.add.text(16, 176, '', { ...hudStyle, fill: '#ffd54f', fontSize: '18px' }).setScrollFactor(0).setDepth(100);

    // Полоска прогресса
    this.progressBg = this.add.rectangle(640, 16, 280, 12, 0x000000, 0.45).setScrollFactor(0).setDepth(100);
    this.progressFill = this.add.rectangle(500, 16, 0, 8, 0x69f0ae).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
    this.progressLabel = this.add.text(640, 30, 'Двор', {
      fontSize: '14px', fill: '#b0bec5', stroke: '#000', strokeThickness: 2
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0);

    // Туториал
    this.tutorialText = this.add.text(640, 680, '◄ ►  Ходи   |   ▲  Прыгай   |   🔧  Бей ключом', {
      fontSize: '18px', fill: '#ffffff', backgroundColor: '#000000aa',
      padding: { x: 12, y: 8 }
    }).setScrollFactor(0).setDepth(120).setOrigin(0.5);

    this.time.delayedCall(5000, () => {
      if (this.tutorialText?.active) {
        this.tweens.add({
          targets: this.tutorialText,
          alpha: 0,
          duration: 800,
          onComplete: () => this.tutorialText.destroy()
        });
      }
    });

    this.updateHpUI();
    if (this.isContinue) {
      this.makeInvulnerable(2000);
    }

    // ===== УПРАВЛЕНИЕ =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    this.setupTouchUI();
  }

  setupTouchUI() {
    this.touchState = { left: false, right: false, jump: false };

    const mkBtn = (x, key, label, isAttack = false) => {
      const img = this.add.image(x, 620, isAttack ? 'btn_attack' : 'btn_base')
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(100)
        .setAlpha(0.9);
      this.add.text(x - 14, 605, label, { fontSize: '28px', fill: '#fff' })
        .setScrollFactor(0)
        .setDepth(101);

      if (isAttack) {
        img.on('pointerdown', () => this.attack());
      } else {
        img.on('pointerdown', () => { this.touchState[key] = true; });
        img.on('pointerup', () => { this.touchState[key] = false; });
        img.on('pointerout', () => { this.touchState[key] = false; });
      }
      return img;
    };

    mkBtn(80, 'left', '◄');
    mkBtn(190, 'right', '►');
    mkBtn(1080, 'jump', '▲');
    mkBtn(1195, null, '🔧', true);
  }

  triggerHaptic(type = 'light') {
    const hb = window.Telegram?.WebApp?.HapticFeedback;
    if (!hb) return;
    if (type === 'error') hb.notificationOccurred('error');
    else hb.impactOccurred(type);
  }

  attack() {
    if (this.isAttacking || this.bossDefeated) return;
    this.isAttacking = true;
    this.triggerHaptic('medium');
    SFX.attack();

    const powered = this.hasPowerWrench;
    const offsetX = this.facing === 'right' ? (powered ? 55 : 42) : (powered ? -55 : -42);
    const wrench = this.physics.add.sprite(
      this.player.x + offsetX,
      this.player.y + 4,
      powered ? 'power_wrench' : 'wrench'
    );
    wrench.body.setAllowGravity(false);
    wrench.setDepth(15);
    if (powered) wrench.setScale(1.3);
    if (this.facing === 'left') wrench.setFlipX(true);

    // Удар по почтовым ящикам
    this.physics.add.overlap(wrench, this.mailboxes, (w, box) => {
      if (!box.active) return;
      SFX.breakBox();
      // Выпадают гайки
      for (let i = 0; i < 2; i++) {
        const n = this.nuts.create(box.x + (i - 0.5) * 16, box.y - 10, 'nut');
        n.setVelocity((i - 0.5) * 80, -200);
        n.setBounce(0.4);
      }
      box.destroy();
      this.score += 20;
      this.hudScore.setText(`Гайки: ${this.score}`);
    }, null, this);

    // Враги
    this.physics.add.overlap(wrench, this.enemies, (w, enemy) => {
      if (!enemy.active) return;
      enemy.destroy();
      this.combo = (this.combo || 0) + 1;
      this.comboTimer = 2500;
      const points = 50 + (this.combo - 1) * 15;
      this.score += points;
      this.hudScore.setText(`Гайки: ${this.score}` + (this.combo > 1 ? `  x${this.combo}` : ''));
      this.triggerHaptic('heavy');
      SFX.hitEnemy();
    }, null, this);

    // Квитанции
    this.physics.add.overlap(wrench, this.bills, (w, bill) => {
      if (!bill.active) return;
      bill.destroy();
      this.score += 30;
      this.hudScore.setText(`Гайки: ${this.score}`);
      this.triggerHaptic('heavy');
      SFX.hitEnemy();
    }, null, this);

    // Босс
    if (this.boss?.active) {
      this.physics.add.overlap(wrench, this.boss, (w, boss) => {
        if (this.bossDefeated) return;
        let dmg = this.bossVulnerable ? 2 : 1;
        if (this.hasPowerWrench) dmg += 1;
        boss.hp -= dmg;
        this.triggerHaptic('heavy');
        SFX.bossHit();
        boss.setTint(0xff5252);
        this.combo = (this.combo || 0) + 1;
        this.comboTimer = 2500;
        this.score += 40 * dmg;
        this.hudScore.setText(`Гайки: ${this.score}`);
        this.time.delayedCall(100, () => boss.active && boss.clearTint());
        this.hudBoss.setText(`Труба-Моллюск: ${'❤️'.repeat(Math.max(0, boss.hp))}`);

        if (boss.hp <= 0) {
          this.defeatBoss();
        }
      }, null, this);
    }

    this.time.delayedCall(200, () => {
      wrench.active && wrench.destroy();
      this.isAttacking = false;
    });
  }

  defeatBoss() {
    this.bossDefeated = true;
    this.bossProjectiles.clear(true, true);
    this.score += 500;
    this.hudScore.setText(`Гайки: ${this.score}`);
    this.hudBoss.setText('🔧 Клеим изолентой...');
    this.triggerHaptic('heavy');
    SFX.tapeFix();

    // Анимация «заклеивания»
    if (this.boss?.active) {
      this.tweens.add({
        targets: this.boss,
        alpha: 0.3,
        scaleX: 1.1,
        scaleY: 0.9,
        duration: 600,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          if (this.boss?.active) this.boss.destroy();
        }
      });
    }

    // Синяя «изолента» поверх
    const tapeFx = this.add.rectangle(
      this.boss?.x || 3900,
      this.boss?.y || 480,
      140, 30, 0x1565c0, 0.85
    ).setDepth(20);
    this.tweens.add({
      targets: tapeFx,
      scaleX: 1.4,
      alpha: 0,
      duration: 1500,
      onComplete: () => tapeFx.destroy()
    });

    this.cameras.main.flash(400, 0, 230, 118);
    this.time.delayedCall(900, () => {
      this.hudBoss.setText('✅ ТРУБА ПОЧИНЕНА!');
      SFX.win();
    });

    this.time.delayedCall(2400, () => {
      this.scene.start('GameOverScene', { score: this.score, win: true, level: 1 });
    });
  }

  collectNut(player, nut) {
    nut.disableBody(true, true);
    this.score += 10;
    this.hudScore.setText(`Гайки: ${this.score}`);
    this.triggerHaptic('light');
    SFX.collectNut();
  }

  collectTape(player, tape) {
    tape.disableBody(true, true);
    this.hasShield = true;
    this.hudShield.setText('🛡️ Изолента (5с)');
    this.triggerHaptic('medium');
    SFX.collectTape();
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
      this.makeInvulnerable(900);
      enemy.destroy();
      this.score += 25;
      this.hudScore.setText(`Гайки: ${this.score}`);
      this.triggerHaptic('medium');
      return;
    }
    this.takeDamage();
  }

  handlePlayerBossCollision() {
    if (this.isInvulnerable || this.bossDefeated) return;
    this.takeDamage();
  }

  collectPowerWrench(player, item) {
    item.disableBody(true, true);
    this.hasPowerWrench = true;
    this.powerWrenchTimer = 10000;
    this.hudPower.setText('🔧 Усиленный ключ (10с)');
    SFX.powerup();
    this.triggerHaptic('medium');
  }

  showSpeechBubble(enemy, text) {
    if (!enemy?.active) return;
    SFX.bubble();
    const bubble = this.add.text(enemy.x, enemy.y - 50, text, {
      fontSize: '14px',
      fill: '#212121',
      backgroundColor: '#fffde7',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: bubble,
      y: bubble.y - 20,
      alpha: 0,
      duration: 2200,
      ease: 'Power2',
      onComplete: () => bubble.destroy()
    });
  }

  takeDamage() {
    if (this.isInvulnerable || this.bossDefeated) return;
    this.hp -= 1;
    this.combo = 0;
    this.updateHpUI();
    this.triggerHaptic('error');
    SFX.damage();
    this.makeInvulnerable(1400);
    this.cameras.main.shake(180, 0.012);

    if (this.hp <= 0) {
      this.time.delayedCall(250, () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          win: false,
          checkpointX: this.checkpointX, level: 1
        });
      });
    } else {
      this.player.setPosition(this.checkpointX, 400);
      this.player.setVelocity(0, 0);
    }
  }

  makeInvulnerable(duration) {
    this.isInvulnerable = true;
    this.player.setAlpha(0.4);
    this.tweens.add({
      targets: this.player,
      alpha: 0.7,
      duration: 120,
      yoyo: true,
      repeat: Math.floor(duration / 240)
    });
    this.time.delayedCall(duration, () => {
      this.isInvulnerable = false;
      this.player.setAlpha(1);
    });
  }

  updateHpUI() {
    this.hudHp.setText('❤️'.repeat(Math.max(0, this.hp)) || '💀');
  }

  updateZoneLabel() {
    const x = this.player.x;
    let label = 'Двор';
    if (x > 3400) label = 'Засор (БОСС)';
    else if (x > 2550) label = 'Квартира (протечка)';
    else if (x > 1750) label = 'Лестничная клетка';
    else if (x > 850) label = 'Подъезд';
    this.hudZone.setText(`Зона: ${label}`);
  }

  bossAttack(time) {
    if (!this.boss?.active || this.bossDefeated) return;

    const dist = Math.abs(this.player.x - this.boss.x);
    if (dist > 750) return;

    this.boss.setData('attackTimer', (this.boss.getData('attackTimer') || 0) + 16);
    const timer = this.boss.getData('attackTimer');
    const phase = this.boss.hp <= 3 ? 2 : 1;
    const interval = phase === 2 ? 1800 : 2400;

    if (this.bossVulnerable) {
      this.boss.setAlpha(0.55 + Math.sin(time * 0.02) * 0.25);
    } else if (this.boss.active) {
      this.boss.setAlpha(1);
    }

    if (timer >= interval) {
      this.boss.setData('attackTimer', 0);
      this.bossVulnerable = false;

      SFX.bossSpit();
      const spit = this.bossProjectiles.create(this.boss.x - 40, this.boss.y - 20, 'boss_spit');
      spit.body.setAllowGravity(false);
      spit.setDepth(12);

      const angle = Phaser.Math.Angle.Between(spit.x, spit.y, this.player.x, this.player.y);
      const spd = phase === 2 ? 300 : 230;
      spit.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
      this.time.delayedCall(3500, () => spit.active && spit.destroy());

      if (phase === 2) {
        const spit2 = this.bossProjectiles.create(this.boss.x - 40, this.boss.y - 55, 'boss_spit');
        spit2.body.setAllowGravity(false);
        spit2.setDepth(12);
        const a2 = angle - 0.4;
        spit2.setVelocity(Math.cos(a2) * spd, Math.sin(a2) * spd);
        this.time.delayedCall(3500, () => spit2.active && spit2.destroy());
      }

      // Окно уязвимости после атаки
      this.time.delayedCall(400, () => {
        if (!this.bossDefeated) {
          this.bossVulnerable = true;
          this.time.delayedCall(1200, () => {
            this.bossVulnerable = false;
            if (this.boss?.active) this.boss.setAlpha(1);
          });
        }
      });
    }
  }

  update(time, delta) {
    if (this.bossDefeated) return;

    const speed = 300;
    const left = this.cursors.left.isDown || this.keyA.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touchState.right;
    const jumpHeld = this.cursors.up.isDown || this.keyW.isDown || this.touchState.jump;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keyW) ||
      (jumpHeld && !this._jumpWasHeld);
    this._jumpWasHeld = jumpHeld;

    const onGround = this.player.body.touching.down;

    if (onGround) this.coyoteTimer = 100;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);

    if (jumpPressed) this.jumpBufferTimer = 120;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    if (left) {
      this.player.setVelocityX(-speed);
      this.facing = 'left';
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(speed);
      this.facing = 'right';
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(this.player.body.velocity.x * (onGround ? 0.65 : 0.92));
    }

    // Прыжок: coyote + buffer
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.player.setVelocityY(-600);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.triggerHaptic('light');
      SFX.jump();
    }

    // Короткий прыжок при отпускании
    if (!jumpHeld && this.player.body.velocity.y < -220) {
      this.player.setVelocityY(this.player.body.velocity.y * 0.55);
    }

    // Анимации
    if (!onGround) {
      if (this.player.anims.currentAnim?.key !== 'sanych_jump') this.player.play('sanych_jump', true);
    } else if (Math.abs(this.player.body.velocity.x) > 30) {
      if (this.player.anims.currentAnim?.key !== 'sanych_run') this.player.play('sanych_run', true);
    } else {
      if (this.player.anims.currentAnim?.key !== 'sanych_idle') this.player.play('sanych_idle', true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      this.attack();
    }

    // Чекпоинты
    if (this.checkpointZones) {
      for (const cp of this.checkpointZones) {
        if (this.player.x >= cp.x && cp.x > this.checkpointX) {
          this.checkpointX = cp.x;
        }
      }
    }

    // Комбо-таймер
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // Падение в яму
    if (this.player.y > 720) {
      this.takeDamage();
    }

    // --- Скользкий пол в квартире (2550–3400) ---
    this.slippery = this.player.x > 2550 && this.player.x < 3400 && onGround;
    if (this.slippery && (left || right)) {
      const vx = this.player.body.velocity.x;
      this.player.setVelocityX(vx * 1.04);
      if (Math.abs(this.player.body.velocity.x) > 360) {
        this.player.setVelocityX(Math.sign(vx) * 360);
      }
    }

    // --- Усиленный ключ: таймер ---
    if (this.hasPowerWrench) {
      this.powerWrenchTimer -= delta;
      if (this.powerWrenchTimer <= 0) {
        this.hasPowerWrench = false;
        this.hudPower.setText('');
      } else {
        this.hudPower.setText(`🔧 Усиленный ключ (${Math.ceil(this.powerWrenchTimer / 1000)}с)`);
      }
    }

    // --- Шаги ---
    if (onGround && Math.abs(this.player.body.velocity.x) > 40) {
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        SFX.footstep();
        this.footstepTimer = 220;
      }
    }

    // --- Пузыри соседей ---
    this.enemies.children.iterate(enemy => {
      if (!enemy?.active || enemy.getData('type') !== 'neighbor') return;
      const id = enemy.getData('uid') || enemy.x;
      if (this.spokenNeighbors.has(id)) return;
      if (Math.abs(this.player.x - enemy.x) < 120 && Math.abs(this.player.y - enemy.y) < 80) {
        this.spokenNeighbors.add(id);
        const phrases = [
          'А разрешение получали?',
          'Кто вам разрешил?!',
          'ЖЭК в курсе?',
          'Я жалобу напишу!'
        ];
        this.showSpeechBubble(enemy, phrases[Math.floor(Math.random() * phrases.length)]);
      }
    });

    // --- Волны квитанций в подъезде ---
    if (this.player.x > 900 && this.player.x < 1800) {
      this.billWaveTimer += delta;
      if (this.billWaveTimer > 3600) {
        this.billWaveTimer = 0;
        for (let i = 0; i < 3; i++) {
          const bill = this.bills.create(this.player.x + 100 + i * 80, 30, 'enemy_bill');
          bill.body.setAllowGravity(false);
          bill.setVelocityY(120 + i * 15);
          bill.setData('baseX', bill.x);
          bill.setDepth(7);
          this.time.delayedCall(4000, () => bill.active && bill.destroy());
        }
      }
    }

    // --- Капли: звук ---
    // (капли уже спавнятся; звук при появлении добавлен в create через событие)

    // --- Полоска прогресса ---
    const mapW = 4200;
    const prog = Phaser.Math.Clamp(this.player.x / mapW, 0, 1);
    this.progressFill.width = 276 * prog;
    const zones = [
      [0, 'Двор'], [850, 'Подъезд'], [1750, 'Лестница'],
      [2550, 'Квартира'], [3400, 'Босс']
    ];
    let zLabel = 'Двор';
    for (const [x, name] of zones) {
      if (this.player.x >= x) zLabel = name;
    }
    this.progressLabel.setText(zLabel);

    // Движущиеся лифты
    this.elevators.forEach(elev => {
      const base = elev.getData('baseY');
      const amp = elev.getData('amp');
      const spd = elev.getData('speed');
      const phase = elev.getData('phase');
      elev.y = base + Math.sin(time * spd + phase) * amp;
      elev.body.updateFromGameObject();
    });

    // Качели
    if (this.swing) {
      const base = this.swing.getData('baseY');
      this.swing.y = base + Math.sin(time * 0.0015) * 40;
      this.swing.body.updateFromGameObject();
    }

    // ИИ врагов
    this.enemies.children.iterate(enemy => {
      if (!enemy?.active || !enemy.body) return;

      if (enemy.body.blocked.left) enemy.setVelocityX(enemy.getData('type') === 'cat' ? 130 : 85);
      else if (enemy.body.blocked.right) enemy.setVelocityX(enemy.getData('type') === 'cat' ? -130 : -85);

      // Коты иногда прыгают
      if (enemy.getData('type') === 'cat') {
        let jt = enemy.getData('jumpTimer') || 0;
        jt += delta;
        if (jt > 2800 && enemy.body.touching.down) {
          enemy.setVelocityY(-380);
          jt = 0;
        }
        enemy.setData('jumpTimer', jt);
      }
    });

    // Квитанции — паттерн вверх-вниз
    this.bills.children.iterate(bill => {
      if (!bill?.active) return;
      if (bill.y > 280) bill.setVelocityY(-90);
      else if (bill.y < 60) bill.setVelocityY(110);
      // Лёгкое покачивание по X
      bill.x = bill.getData('baseX') + Math.sin(time * 0.002) * 30;
    });

    this.bossAttack(time);
    this.updateZoneLabel();

    // HP босса рядом
    if (this.boss?.active && Math.abs(this.player.x - this.boss.x) < 650) {
      this.hudBoss.setText(`Труба-Моллюск: ${'❤️'.repeat(Math.max(0, this.boss.hp))}`);
    }
  }
}
