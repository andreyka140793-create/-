import Phaser from 'phaser';
import SFX from '../audio/SoundManager';

/**
 * Уровень 2: «Дача»
 * Огород, сарай, комары, шарик, септик-босс
 */
export default class Level2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level2Scene' });
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
  }

  create() {
    const mapWidth = 4000;
    const mapHeight = 720;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBackgroundColor('#4fc3f7'); // дачное небо
    this.input.once('pointerdown', () => SFX.unlock());

    this.checkpointZones = [
      { x: 120 }, { x: 800 }, { x: 1600 }, { x: 2400 }, { x: 3200 }
    ];

    // ===== ЗЕМЛЯ =====
    this.platforms = this.physics.add.staticGroup();
    for (let x = 0; x < mapWidth; x += 64) {
      // ямы
      if ((x >= 1000 && x < 1160) || (x >= 2100 && x < 2260) || (x >= 3000 && x < 3140)) continue;
      this.platforms.create(x + 32, 688, 'tile_grass');
    }

    // Грядки / заборы / крыша сарая
    [
      { x: 400, y: 520 }, { x: 600, y: 400 }, { x: 850, y: 480 },
      { x: 1300, y: 500 }, { x: 1500, y: 380 }, { x: 1750, y: 300 },
      { x: 2000, y: 450 }, { x: 2400, y: 400 }, { x: 2700, y: 520 },
      { x: 2900, y: 360 }, { x: 3300, y: 480 }, { x: 3500, y: 400 }
    ].forEach(p => {
      this.platforms.create(p.x, p.y, 'tile_wood').setScale(1.6, 1).refreshBody();
    });

    // Движущиеся платформы (качели / тележка)
    this.movers = [];
    [
      { x: 1100, y: 420, amp: 90, axis: 'y' },
      { x: 2300, y: 350, amp: 120, axis: 'x' }
    ].forEach((m, i) => {
      const plat = this.physics.add.image(m.x, m.y, 'tile_wood');
      plat.setScale(1.8, 1);
      plat.body.setAllowGravity(false);
      plat.body.setImmovable(true);
      plat.refreshBody();
      plat.setData('baseX', m.x);
      plat.setData('baseY', m.y);
      plat.setData('amp', m.amp);
      plat.setData('axis', m.axis);
      plat.setData('phase', i);
      this.movers.push(plat);
    });

    // ===== ИГРОК =====
    this.player = this.physics.add.sprite(this.startX, 500, 'sanych_sheet', 0);
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.play('sanych_idle');
    this.physics.add.collider(this.player, this.platforms);
    this.movers.forEach(m => this.physics.add.collider(this.player, m));

    // ===== ПРЕДМЕТЫ =====
    this.nuts = this.physics.add.group();
    for (let x = 250; x < 3600; x += 140) {
      const n = this.nuts.create(x, 180 + Math.random() * 120, 'nut');
      n.setBounceY(0.35);
    }
    this.physics.add.collider(this.nuts, this.platforms);
    this.physics.add.overlap(this.player, this.nuts, this.collectNut, null, this);

    this.tapes = this.physics.add.group();
    [900, 1900, 2800].forEach(x => {
      const t = this.tapes.create(x, 260, 'tape');
      t.setBounceY(0.3);
    });
    this.physics.add.collider(this.tapes, this.platforms);
    this.physics.add.overlap(this.player, this.tapes, this.collectTape, null, this);

    this.powerWrenches = this.physics.add.group();
    const pw = this.powerWrenches.create(1700, 250, 'power_wrench');
    pw.setBounceY(0.3);
    this.physics.add.collider(this.powerWrenches, this.platforms);
    this.physics.add.overlap(this.player, this.powerWrenches, this.collectPowerWrench, null, this);

    // ===== ВРАГИ =====
    this.enemies = this.physics.add.group();

    // Шарики (собаки) на земле
    [500, 1400, 2500, 3100].forEach(x => {
      const d = this.enemies.create(x, 500, 'dog');
      d.setCollideWorldBounds(true);
      d.setVelocityX(-110);
      d.setData('type', 'dog');
      d.setDepth(8);
    });
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyHit, null, this);

    // Комары (летающие)
    this.mosquitos = this.physics.add.group();
    [700, 1200, 1800, 2200, 2700, 3400].forEach((x, i) => {
      const m = this.mosquitos.create(x, 120 + (i % 3) * 40, 'mosquito');
      m.body.setAllowGravity(false);
      m.setData('baseX', x);
      m.setData('baseY', m.y);
      m.setDepth(9);
    });
    this.physics.add.overlap(this.player, this.mosquitos, this.onEnemyHit, null, this);

    // Падающие яблоки
    this.apples = this.physics.add.group();
    this.time.addEvent({
      delay: 1600,
      loop: true,
      callback: () => {
        if (this.player.x > 400 && this.player.x < 3200) {
          const a = this.apples.create(this.player.x + 80 + Math.random() * 200, 20, 'apple');
          a.setVelocityY(180);
          a.body.setAllowGravity(false);
          this.time.delayedCall(3500, () => a.active && a.destroy());
        }
      }
    });
    this.physics.add.overlap(this.player, this.apples, (p, a) => {
      a.destroy();
      if (!this.isInvulnerable) this.takeDamage();
    });

    // ===== БОСС: Септик =====
    this.boss = this.physics.add.sprite(3700, 500, 'septic_boss');
    this.boss.hp = 7;
    this.boss.setImmovable(true);
    this.boss.setDepth(9);
    this.boss.setData('attackTimer', 0);
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.overlap(this.player, this.boss, () => {
      if (!this.isInvulnerable && !this.bossDefeated) this.takeDamage();
    });

    this.bossProjectiles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.bossProjectiles, (p, proj) => {
      proj.destroy();
      if (!this.isInvulnerable) this.takeDamage();
    });

    // ===== КАМЕРА / HUD =====
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);

    const st = { fontSize: '24px', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 };
    this.hudScore = this.add.text(16, 14, `Гайки: ${this.score}`, { ...st, fill: '#ffd54f' }).setScrollFactor(0).setDepth(100);
    this.hudHp = this.add.text(16, 48, '', { ...st, fill: '#ff1744', fontSize: '28px' }).setScrollFactor(0).setDepth(100);
    this.hudShield = this.add.text(16, 86, '', { ...st, fill: '#42a5f5', fontSize: '18px' }).setScrollFactor(0).setDepth(100);
    this.hudZone = this.add.text(16, 116, 'Уровень 2: Дача', { ...st, fill: '#fff9c4', fontSize: '18px' }).setScrollFactor(0).setDepth(100);
    this.hudBoss = this.add.text(16, 146, '', { ...st, fill: '#a5d6a7', fontSize: '18px' }).setScrollFactor(0).setDepth(100);
    this.hudPower = this.add.text(16, 176, '', { ...st, fill: '#ffd54f', fontSize: '18px' }).setScrollFactor(0).setDepth(100);

    this.progressBg = this.add.rectangle(640, 16, 280, 12, 0x000000, 0.45).setScrollFactor(0).setDepth(100);
    this.progressFill = this.add.rectangle(500, 16, 0, 8, 0x8bc34a).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
    this.progressLabel = this.add.text(640, 30, 'Огород', {
      fontSize: '14px', fill: '#e8f5e9', stroke: '#000', strokeThickness: 2
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5, 0);

    this.tutorialText = this.add.text(640, 680, 'Уровень 2: ДАЧА  —  комары, шарики и септик', {
      fontSize: '18px', fill: '#fff', backgroundColor: '#1b5e20aa', padding: { x: 12, y: 8 }
    }).setScrollFactor(0).setDepth(120).setOrigin(0.5);
    this.time.delayedCall(4500, () => {
      if (this.tutorialText?.active) {
        this.tweens.add({ targets: this.tutorialText, alpha: 0, duration: 700, onComplete: () => this.tutorialText.destroy() });
      }
    });

    this.updateHpUI();
    if (this.isContinue) this.makeInvulnerable(2000);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.setupTouchUI();
  }

  setupTouchUI() {
    this.touchState = { left: false, right: false, jump: false };
    const mk = (x, key, label, attack = false) => {
      const img = this.add.image(x, 620, attack ? 'btn_attack' : 'btn_base')
        .setInteractive().setScrollFactor(0).setDepth(100).setAlpha(0.9);
      this.add.text(x - 14, 605, label, { fontSize: '28px', fill: '#fff' }).setScrollFactor(0).setDepth(101);
      if (attack) img.on('pointerdown', () => this.attack());
      else {
        img.on('pointerdown', () => { this.touchState[key] = true; });
        img.on('pointerup', () => { this.touchState[key] = false; });
        img.on('pointerout', () => { this.touchState[key] = false; });
      }
    };
    mk(80, 'left', '◄');
    mk(190, 'right', '►');
    mk(1080, 'jump', '▲');
    mk(1195, null, '🔧', true);
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
    const wrench = this.physics.add.sprite(this.player.x + offsetX, this.player.y + 4, powered ? 'power_wrench' : 'wrench');
    wrench.body.setAllowGravity(false);
    wrench.setDepth(15);
    if (powered) wrench.setScale(1.3);
    if (this.facing === 'left') wrench.setFlipX(true);

    this.physics.add.overlap(wrench, this.enemies, (w, e) => {
      if (!e.active) return;
      e.destroy();
      this.combo = (this.combo || 0) + 1;
      this.comboTimer = 2500;
      this.score += 50 + (this.combo - 1) * 15;
      this.hudScore.setText(`Гайки: ${this.score}` + (this.combo > 1 ? `  x${this.combo}` : ''));
      SFX.hitEnemy();
      this.triggerHaptic('heavy');
    });

    this.physics.add.overlap(wrench, this.mosquitos, (w, m) => {
      if (!m.active) return;
      m.destroy();
      this.score += 30;
      this.combo = (this.combo || 0) + 1;
      this.comboTimer = 2500;
      this.hudScore.setText(`Гайки: ${this.score}`);
      SFX.hitEnemy();
    });

    if (this.boss?.active) {
      this.physics.add.overlap(wrench, this.boss, (w, boss) => {
        if (this.bossDefeated) return;
        let dmg = this.bossVulnerable ? 2 : 1;
        if (this.hasPowerWrench) dmg += 1;
        boss.hp -= dmg;
        SFX.bossHit();
        boss.setTint(0xff5252);
        this.time.delayedCall(100, () => boss.active && boss.clearTint());
        this.score += 40 * dmg;
        this.hudScore.setText(`Гайки: ${this.score}`);
        this.hudBoss.setText(`Септик: ${'❤️'.repeat(Math.max(0, boss.hp))}`);
        if (boss.hp <= 0) this.defeatBoss();
      });
    }

    this.time.delayedCall(200, () => {
      wrench.active && wrench.destroy();
      this.isAttacking = false;
    });
  }

  defeatBoss() {
    this.bossDefeated = true;
    this.bossProjectiles.clear(true, true);
    this.score += 600;
    this.hudBoss.setText('🔧 Чиним септик...');
    SFX.tapeFix();
    if (this.boss?.active) {
      this.tweens.add({
        targets: this.boss, alpha: 0.2, duration: 800, yoyo: true, repeat: 1,
        onComplete: () => this.boss?.active && this.boss.destroy()
      });
    }
    this.cameras.main.flash(500, 139, 195, 74);
    this.time.delayedCall(1000, () => {
      this.hudBoss.setText('✅ СЕПТИК РАБОТАЕТ!');
      SFX.win();
    });
    this.time.delayedCall(2500, () => {
      this.scene.start('GameOverScene', { score: this.score, win: true, level: 2 });
    });
  }

  collectNut(p, nut) {
    nut.disableBody(true, true);
    this.score += 10;
    this.hudScore.setText(`Гайки: ${this.score}`);
    SFX.collectNut();
  }

  collectTape(p, tape) {
    tape.disableBody(true, true);
    this.hasShield = true;
    this.hudShield.setText('🛡️ Изолента (5с)');
    SFX.collectTape();
    this.time.delayedCall(5000, () => {
      if (this.hasShield) {
        this.hasShield = false;
        this.hudShield.setText('');
      }
    });
  }

  collectPowerWrench(p, item) {
    item.disableBody(true, true);
    this.hasPowerWrench = true;
    this.powerWrenchTimer = 10000;
    this.hudPower.setText('🔧 Усиленный ключ (10с)');
    SFX.powerup();
  }

  onEnemyHit(player, enemy) {
    if (this.isInvulnerable || this.bossDefeated) return;
    if (this.hasShield) {
      this.hasShield = false;
      this.hudShield.setText('');
      this.makeInvulnerable(900);
      enemy.destroy();
      this.score += 25;
      this.hudScore.setText(`Гайки: ${this.score}`);
      return;
    }
    this.takeDamage();
  }

  takeDamage() {
    if (this.isInvulnerable || this.bossDefeated) return;
    this.hp -= 1;
    this.combo = 0;
    this.updateHpUI();
    SFX.damage();
    this.triggerHaptic('error');
    this.makeInvulnerable(1400);
    this.cameras.main.shake(180, 0.012);
    if (this.hp <= 0) {
      this.time.delayedCall(250, () => {
        this.scene.start('GameOverScene', {
          score: this.score, win: false, checkpointX: this.checkpointX, level: 2
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
      targets: this.player, alpha: 0.7, duration: 120, yoyo: true,
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

  bossAttack(time) {
    if (!this.boss?.active || this.bossDefeated) return;
    if (Math.abs(this.player.x - this.boss.x) > 750) return;

    this.boss.setData('attackTimer', (this.boss.getData('attackTimer') || 0) + 16);
    const timer = this.boss.getData('attackTimer');
    const phase = this.boss.hp <= 3 ? 2 : 1;

    if (this.bossVulnerable) {
      this.boss.setAlpha(0.55 + Math.sin(time * 0.02) * 0.25);
    } else {
      this.boss.setAlpha(1);
    }

    if (timer >= (phase === 2 ? 1500 : 2000)) {
      this.boss.setData('attackTimer', 0);
      this.bossVulnerable = false;
      SFX.bossSpit();

      // «засор» — коричневые плевки
      const spit = this.bossProjectiles.create(this.boss.x - 40, this.boss.y - 10, 'boss_spit');
      spit.setTint(0x6d4c41);
      spit.body.setAllowGravity(false);
      const angle = Phaser.Math.Angle.Between(spit.x, spit.y, this.player.x, this.player.y);
      const spd = phase === 2 ? 310 : 240;
      spit.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
      this.time.delayedCall(3500, () => spit.active && spit.destroy());

      if (phase === 2) {
        const s2 = this.bossProjectiles.create(this.boss.x - 30, this.boss.y - 40, 'boss_spit');
        s2.setTint(0x6d4c41);
        s2.body.setAllowGravity(false);
        s2.setVelocity(Math.cos(angle - 0.35) * spd, Math.sin(angle - 0.35) * spd);
        this.time.delayedCall(3500, () => s2.active && s2.destroy());
      }

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

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.player.setVelocityY(-600);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      SFX.jump();
      this.triggerHaptic('light');
    }
    if (!jumpHeld && this.player.body.velocity.y < -220) {
      this.player.setVelocityY(this.player.body.velocity.y * 0.55);
    }

    if (!onGround) {
      if (this.player.anims.currentAnim?.key !== 'sanych_jump') this.player.play('sanych_jump', true);
    } else if (Math.abs(this.player.body.velocity.x) > 30) {
      if (this.player.anims.currentAnim?.key !== 'sanych_run') this.player.play('sanych_run', true);
    } else {
      if (this.player.anims.currentAnim?.key !== 'sanych_idle') this.player.play('sanych_idle', true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) this.attack();

    if (this.checkpointZones) {
      for (const cp of this.checkpointZones) {
        if (this.player.x >= cp.x && cp.x > this.checkpointX) this.checkpointX = cp.x;
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.player.y > 720) this.takeDamage();

    if (this.hasPowerWrench) {
      this.powerWrenchTimer -= delta;
      if (this.powerWrenchTimer <= 0) {
        this.hasPowerWrench = false;
        this.hudPower.setText('');
      } else {
        this.hudPower.setText(`🔧 Усиленный ключ (${Math.ceil(this.powerWrenchTimer / 1000)}с)`);
      }
    }

    if (onGround && Math.abs(this.player.body.velocity.x) > 40) {
      this.footstepTimer -= delta;
      if (this.footstepTimer <= 0) {
        SFX.footstep();
        this.footstepTimer = 220;
      }
    }

    // Движущиеся платформы
    this.movers.forEach(m => {
      const amp = m.getData('amp');
      const phase = m.getData('phase');
      if (m.getData('axis') === 'y') {
        m.y = m.getData('baseY') + Math.sin(time * 0.0015 + phase) * amp;
      } else {
        m.x = m.getData('baseX') + Math.sin(time * 0.0012 + phase) * amp;
      }
      m.body.updateFromGameObject();
    });

    // Собаки патруль
    this.enemies.children.iterate(e => {
      if (!e?.active || !e.body) return;
      if (e.body.blocked.left) e.setVelocityX(120);
      else if (e.body.blocked.right) e.setVelocityX(-120);
    });

    // Комары — восьмёрки
    this.mosquitos.children.iterate(m => {
      if (!m?.active) return;
      const bx = m.getData('baseX');
      const by = m.getData('baseY');
      m.x = bx + Math.sin(time * 0.002) * 50;
      m.y = by + Math.cos(time * 0.003) * 30;
    });

    this.bossAttack(time);

    // Прогресс
    const prog = Phaser.Math.Clamp(this.player.x / 4000, 0, 1);
    this.progressFill.width = 276 * prog;
    let label = 'Огород';
    if (this.player.x > 3200) label = 'Септик';
    else if (this.player.x > 2400) label = 'Сарай';
    else if (this.player.x > 1600) label = 'Баня';
    else if (this.player.x > 800) label = 'Грядки';
    this.progressLabel.setText(label);

    if (this.boss?.active && Math.abs(this.player.x - this.boss.x) < 650) {
      this.hudBoss.setText(`Септик: ${'❤️'.repeat(Math.max(0, this.boss.hp))}`);
    }
  }
}
