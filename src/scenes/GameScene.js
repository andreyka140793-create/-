import Phaser from 'phaser';
import SFX from '../audio/SoundManager';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data = {}) {
    // Поддержка продолжения после «Продолжить за Stars»
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
  }

  create() {
    const mapWidth = 4200;
    const mapHeight = 720;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // ===== ФОН по зонам (цвет неба) =====
    this.cameras.main.setBackgroundColor('#1a237e');
    this.input.once('pointerdown', () => SFX.unlock());

    // ===== ПЛАТФОРМЫ =====
    this.platforms = this.physics.add.staticGroup();

    // Основная земля с ямами
    for (let x = 0; x < mapWidth; x += 64) {
      // Ямы: двор→подъезд, лестница, перед боссом
      if ((x >= 880 && x < 1080) || (x >= 1980 && x < 2140) || (x >= 3100 && x < 3260)) continue;
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
    

    // Платформы двора
    [
      { x: 350, y: 520 }, { x: 550, y: 420 }, { x: 750, y: 340 }
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

    // ===== ВРАГИ =====
    this.enemies = this.physics.add.group();

    // Соседи
    [600, 1300, 1700, 2500, 2800].forEach(x => {
      const e = this.enemies.create(x, 500, 'neighbor_sheet', 0);
      e.setCollideWorldBounds(true);
      e.setVelocityX(-90);
      e.setData('type', 'neighbor');
      e.setDepth(8);
      e.play('neighbor_walk');
    });

    // Коты
    [1000, 2000, 2600].forEach(x => {
      const e = this.enemies.create(x, 480, 'cat_sheet', 0);
      e.setCollideWorldBounds(true);
      e.setVelocityX(-140);
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
      delay: 900,
      loop: true,
      callback: () => {
        if (this.player.x > 2550 && this.player.x < 3400) {
          const x = 2600 + Math.random() * 700;
          const drop = this.waterDrops.create(x, 40, 'water_drop');
          drop.setVelocityY(220);
          drop.body.setAllowGravity(false);
          drop.setDepth(6);
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

    const offsetX = this.facing === 'right' ? 42 : -42;
    const wrench = this.physics.add.sprite(this.player.x + offsetX, this.player.y + 4, 'wrench');
    wrench.body.setAllowGravity(false);
    wrench.setDepth(15);
    if (this.facing === 'left') wrench.setFlipX(true);

    // Враги
    this.physics.add.overlap(wrench, this.enemies, (w, enemy) => {
      if (!enemy.active) return;
      enemy.destroy();
      this.score += 50;
      this.hudScore.setText(`Гайки: ${this.score}`);
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
        boss.hp -= 1;
        this.triggerHaptic('heavy');
        SFX.bossHit();
        boss.setTint(0xff5252);
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
    this.boss.destroy();
    this.bossProjectiles.clear(true, true);
    this.score += 500;
    this.hudScore.setText(`Гайки: ${this.score}`);
    this.hudBoss.setText('✅ ТРУБА ПОЧИНЕНА!');
    this.cameras.main.flash(600, 0, 230, 118);
    this.triggerHaptic('heavy');
    SFX.win();

    this.time.delayedCall(1800, () => {
      this.scene.start('GameOverScene', { score: this.score, win: true });
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

  takeDamage() {
    if (this.isInvulnerable) return;
    this.hp -= 1;
    this.updateHpUI();
    this.triggerHaptic('error');
    SFX.damage();
    this.makeInvulnerable(1400);
    this.cameras.main.shake(180, 0.012);

    if (this.hp <= 0) {
      this.time.delayedCall(250, () => {
        this.scene.start('GameOverScene', { score: this.score, win: false, checkpointX: Math.max(120, this.player.x - 100) });
      });
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
    if (dist > 700) return;

    this.boss.setData('attackTimer', this.boss.getData('attackTimer') + 16);

    const timer = this.boss.getData('attackTimer');
    const phase = this.boss.hp <= 3 ? 2 : 1;
    const interval = phase === 2 ? 1400 : 2000;

    if (timer >= interval) {
      this.boss.setData('attackTimer', 0);

      // Плевок
      SFX.bossSpit();
      const spit = this.bossProjectiles.create(this.boss.x - 40, this.boss.y - 20, 'boss_spit');
      spit.body.setAllowGravity(false);
      spit.setDepth(12);

      const angle = Phaser.Math.Angle.Between(spit.x, spit.y, this.player.x, this.player.y);
      const speed = phase === 2 ? 280 : 220;
      spit.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // Во второй фазе — второй плевок чуть выше
      if (phase === 2) {
        const spit2 = this.bossProjectiles.create(this.boss.x - 40, this.boss.y - 50, 'boss_spit');
        spit2.body.setAllowGravity(false);
        spit2.setDepth(12);
        const a2 = angle - 0.35;
        spit2.setVelocity(Math.cos(a2) * speed, Math.sin(a2) * speed);
      }

      this.time.delayedCall(3500, () => {
        if (spit.active) spit.destroy();
      });
    }
  }

  update(time, delta) {
    if (this.bossDefeated) return;

    const speed = 290;
    const left = this.cursors.left.isDown || this.keyA.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touchState.right;
    const jump = this.cursors.up.isDown || this.keyW.isDown || this.touchState.jump;

    if (left) {
      this.player.setVelocityX(-speed);
      this.facing = 'left';
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(speed);
      this.facing = 'right';
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && this.player.body.touching.down) {
      this.player.setVelocityY(-590);
      this.triggerHaptic('light');
      SFX.jump();
    }

    // Анимации Саныча
    if (!this.player.body.touching.down) {
      if (this.player.anims.currentAnim?.key !== 'sanych_jump') {
        this.player.play('sanych_jump', true);
      }
    } else if (left || right) {
      if (this.player.anims.currentAnim?.key !== 'sanych_run') {
        this.player.play('sanych_run', true);
      }
    } else {
      if (this.player.anims.currentAnim?.key !== 'sanych_idle') {
        this.player.play('sanych_idle', true);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      this.attack();
    }

    // Падение в яму
    if (this.player.y > 720) {
      this.takeDamage();
      if (this.hp > 0) {
        this.player.setPosition(Math.max(100, this.player.x - 180), 380);
        this.player.setVelocity(0, 0);
      }
    }

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

      if (enemy.body.blocked.left) enemy.setVelocityX(enemy.getData('type') === 'cat' ? 150 : 100);
      else if (enemy.body.blocked.right) enemy.setVelocityX(enemy.getData('type') === 'cat' ? -150 : -100);

      // Коты иногда прыгают
      if (enemy.getData('type') === 'cat') {
        let jt = enemy.getData('jumpTimer') || 0;
        jt += delta;
        if (jt > 2200 && enemy.body.touching.down) {
          enemy.setVelocityY(-420);
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
