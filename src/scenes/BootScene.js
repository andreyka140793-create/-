import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.failedKeys = new Set();
  }

  preload() {
    // Ловим 404 — потом дорисуем процедурно
    this.load.on('loaderror', (file) => {
      this.failedKeys.add(file.key);
      console.warn('[Boot] asset missing, will use procedural:', file.key, file.url);
    });

    // Путь относительно корня сайта (Vite: public/ → /)
    this.load.setPath('assets/');

    // --- Спрайт-листы ---
    this.load.spritesheet('sanych_sheet', 'sanych.png', {
      frameWidth: 48,
      frameHeight: 64
    });
    this.load.spritesheet('neighbor_sheet', 'neighbor.png', {
      frameWidth: 44,
      frameHeight: 58
    });
    this.load.spritesheet('cat_sheet', 'cat.png', {
      frameWidth: 48,
      frameHeight: 36
    });

    // --- Одиночные ---
    this.load.image('boss', 'boss.png');
    this.load.image('nut', 'nut.png');
    this.load.image('tape', 'tape.png');
    this.load.image('wrench', 'wrench.png');
    this.load.image('tile_ground', 'tile_ground.png');
    this.load.image('tile_pipe', 'tile_pipe.png');
    this.load.image('tile_brick', 'tile_brick.png');
    this.load.image('enemy_bill', 'enemy_bill.png');
    this.load.image('boss_spit', 'boss_spit.png');
    this.load.image('water_drop', 'water_drop.png');
    this.load.image('deco_bench', 'deco_bench.png');
    this.load.image('deco_swing', 'deco_swing.png');
    this.load.image('btn_base', 'btn_base.png');
    this.load.image('btn_attack', 'btn_attack.png');
    this.load.image('mailbox', 'mailbox.png');
    this.load.image('power_wrench', 'power_wrench.png');
  }

  create() {
    // Что не загрузилось — генерируем
    this.generateFallbacks();

    // Кадры для листов (если текстура есть, но кадры ещё не нарезаны — для procedural)
    this.ensureSheetFrames('sanych_sheet', 6, 48, 64);
    this.ensureSheetFrames('neighbor_sheet', 3, 44, 58);
    this.ensureSheetFrames('cat_sheet', 3, 48, 36);

    this.createAnimations();
    this.scene.start('MenuScene');
  }

  /** Нарезает кадры у текстуры-листа, если их ещё нет */
  ensureSheetFrames(key, count, fw, fh) {
    if (!this.textures.exists(key)) return;
    const tex = this.textures.get(key);
    // Если загрузили через spritesheet — кадры уже есть (0..n-1)
    // Если generateTexture — нужно добавить вручную
    for (let i = 0; i < count; i++) {
      if (!tex.has(String(i)) && !tex.has(i)) {
        tex.add(i, 0, i * fw, 0, fw, fh);
      }
    }
  }

  createAnimations() {
    const safeAnim = (key, frames, frameRate, repeat = -1) => {
      if (this.anims.exists(key)) return;
      // Проверяем, что хотя бы первый кадр существует
      const first = frames[0];
      if (!this.textures.exists(first.key)) return;
      this.anims.create({ key, frames, frameRate, repeat });
    };

    safeAnim('sanych_idle', [{ key: 'sanych_sheet', frame: 0 }], 1, 0);
    safeAnim('sanych_run', [
      { key: 'sanych_sheet', frame: 1 },
      { key: 'sanych_sheet', frame: 2 },
      { key: 'sanych_sheet', frame: 3 },
      { key: 'sanych_sheet', frame: 4 }
    ], 10, -1);
    safeAnim('sanych_jump', [{ key: 'sanych_sheet', frame: 5 }], 1, 0);

    safeAnim('neighbor_walk', [
      { key: 'neighbor_sheet', frame: 0 },
      { key: 'neighbor_sheet', frame: 1 },
      { key: 'neighbor_sheet', frame: 2 }
    ], 6, -1);

    safeAnim('cat_walk', [
      { key: 'cat_sheet', frame: 0 },
      { key: 'cat_sheet', frame: 1 },
      { key: 'cat_sheet', frame: 2 }
    ], 8, -1);
  }

  /** Рисуем только те ключи, которых нет после load */
  generateFallbacks() {
    const need = (key) => !this.textures.exists(key) || this.failedKeys.has(key);

    // Если loaderror пометил ключ, текстура может быть битой — удаляем
    this.failedKeys.forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }
    });

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    if (need('sanych_sheet')) {
      const fw = 48, fh = 64;
      const drawSanych = (gx, offsetX, legPhase = 0, armPhase = 0, jump = false) => {
        gx.fillStyle(0x212121);
        if (jump) {
          gx.fillRect(offsetX + 10, 54, 12, 6);
          gx.fillRect(offsetX + 26, 54, 12, 6);
        } else {
          const legL = legPhase === 1 ? 2 : (legPhase === 2 ? -2 : 0);
          gx.fillRect(offsetX + 8 + legL, 56, 14, 8);
          gx.fillRect(offsetX + 26 - legL, 56, 14, 8);
        }
        gx.fillStyle(0x1565c0);
        gx.fillRect(offsetX + 10, 28, 28, 28);
        gx.fillStyle(0x1976d2);
        const armY = jump ? 26 : 30 + armPhase;
        gx.fillRect(offsetX + 2, armY, 9, 16);
        gx.fillRect(offsetX + 37, armY - armPhase, 9, 16);
        gx.fillStyle(0xffcc80);
        gx.fillRect(offsetX + 12, 10, 24, 20);
        gx.fillStyle(0x3e2723);
        gx.fillRect(offsetX + 14, 24, 20, 5);
        gx.fillStyle(0x212121);
        gx.fillRect(offsetX + 16, 16, 5, 5);
        gx.fillRect(offsetX + 27, 16, 5, 5);
        gx.fillStyle(0xc62828);
        gx.fillRect(offsetX + 8, 2, 32, 10);
        gx.fillStyle(0xb71c1c);
        gx.fillRect(offsetX + 6, 8, 36, 4);
        gx.fillStyle(0x90a4ae);
        gx.fillRect(offsetX + 34, 40, 12, 4);
      };
      drawSanych(g, 0 * fw, 0, 0, false);
      drawSanych(g, 1 * fw, 1, 1, false);
      drawSanych(g, 2 * fw, 0, 0, false);
      drawSanych(g, 3 * fw, 2, -1, false);
      drawSanych(g, 4 * fw, 0, 0, false);
      drawSanych(g, 5 * fw, 0, -2, true);
      g.generateTexture('sanych_sheet', fw * 6, fh);
      g.clear();
    }

    if (need('neighbor_sheet')) {
      const nw = 44, nh = 58;
      const drawNeighbor = (gx, ox, leg = 0) => {
        gx.fillStyle(0x5d4037);
        gx.fillRect(ox + 6, 24, 32, 34);
        gx.fillStyle(0xffcc80);
        gx.fillRect(ox + 10, 8, 24, 20);
        gx.fillStyle(0x212121);
        gx.fillRect(ox + 10, 4, 24, 8);
        gx.fillStyle(0xc62828);
        gx.fillRect(ox + 16, 22, 12, 3);
        gx.fillStyle(0x212121);
        gx.fillRect(ox + 14, 14, 4, 4);
        gx.fillRect(ox + 26, 14, 4, 4);
        gx.fillStyle(0x3e2723);
        gx.fillRect(ox + 10 + leg, 52, 10, 6);
        gx.fillRect(ox + 24 - leg, 52, 10, 6);
      };
      drawNeighbor(g, 0, 0);
      drawNeighbor(g, nw, 3);
      drawNeighbor(g, nw * 2, -3);
      g.generateTexture('neighbor_sheet', nw * 3, nh);
      g.clear();
    }

    if (need('cat_sheet')) {
      const cw = 48, ch = 36;
      const drawCat = (gx, ox, stretch = 0) => {
        gx.fillStyle(0x212121);
        gx.fillRect(ox + 4, 14, 36 + stretch, 18);
        gx.fillRect(ox + 28, 4, 16, 16);
        gx.fillTriangle(ox + 30, 4, ox + 34, -2, ox + 38, 4);
        gx.fillTriangle(ox + 38, 4, ox + 42, -2, ox + 44, 4);
        gx.fillStyle(0xffeb3b);
        gx.fillCircle(ox + 34, 10, 3);
        gx.fillCircle(ox + 40, 10, 3);
        gx.fillStyle(0x212121);
        gx.fillRect(ox + 0, 18, 8, 6);
      };
      drawCat(g, 0, 0);
      drawCat(g, cw, 2);
      drawCat(g, cw * 2, -1);
      g.generateTexture('cat_sheet', cw * 3, ch);
      g.clear();
    }

    if (need('wrench')) {
      g.fillStyle(0xb0bec5);
      g.fillRect(4, 12, 40, 10);
      g.fillRect(30, 4, 14, 26);
      g.fillStyle(0x78909c);
      g.fillRect(32, 6, 4, 22);
      g.generateTexture('wrench', 48, 32);
      g.clear();
    }

    if (need('tile_ground')) {
      g.fillStyle(0x37474f);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x263238);
      g.fillRect(0, 0, 64, 8);
      g.fillStyle(0x455a64);
      for (let i = 0; i < 4; i++) {
        g.fillRect(i * 16 + 2, 16, 12, 4);
        g.fillRect(i * 16 + 2, 36, 12, 4);
      }
      g.generateTexture('tile_ground', 64, 64);
      g.clear();
    }

    if (need('tile_pipe')) {
      g.fillStyle(0x546e7a);
      g.fillRect(0, 8, 64, 16);
      g.fillStyle(0x37474f);
      g.fillRect(0, 8, 64, 4);
      g.fillStyle(0x78909c);
      g.fillCircle(8, 16, 4);
      g.fillCircle(56, 16, 4);
      g.generateTexture('tile_pipe', 64, 32);
      g.clear();
    }

    if (need('tile_brick')) {
      g.fillStyle(0xbf360c);
      g.fillRect(0, 0, 64, 32);
      g.fillStyle(0xe64a19);
      g.fillRect(2, 2, 28, 12);
      g.fillRect(34, 2, 28, 12);
      g.fillRect(2, 18, 28, 12);
      g.fillRect(34, 18, 28, 12);
      g.generateTexture('tile_brick', 64, 32);
      g.clear();
    }

    if (need('nut')) {
      g.fillStyle(0xffc107);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0xff8f00);
      g.fillCircle(16, 16, 10);
      g.fillStyle(0x212121);
      g.fillCircle(16, 16, 5);
      g.generateTexture('nut', 32, 32);
      g.clear();
    }

    if (need('tape')) {
      g.fillStyle(0x1565c0);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0x0d47a1);
      g.fillCircle(16, 16, 9);
      g.fillStyle(0xffffff);
      g.fillRect(12, 6, 8, 20);
      g.generateTexture('tape', 32, 32);
      g.clear();
    }

    if (need('enemy_bill')) {
      g.fillStyle(0xfffde7);
      g.fillRect(2, 2, 28, 36);
      g.fillStyle(0xff5252);
      g.fillRect(2, 2, 28, 8);
      g.fillStyle(0x212121);
      g.fillRect(6, 14, 20, 2);
      g.fillRect(6, 20, 16, 2);
      g.fillRect(6, 26, 18, 2);
      g.generateTexture('enemy_bill', 32, 40);
      g.clear();
    }

    if (need('boss')) {
      g.fillStyle(0x455a64);
      g.fillRect(10, 30, 100, 90);
      g.fillStyle(0xbf360c);
      g.fillRect(20, 40, 30, 20);
      g.fillRect(70, 70, 25, 30);
      g.fillStyle(0x00e676);
      g.fillRect(30, 10, 20, 30);
      g.fillRect(60, 5, 25, 35);
      g.fillStyle(0xffffff);
      g.fillCircle(60, 70, 22);
      g.fillStyle(0xff1744);
      g.fillCircle(60, 70, 14);
      g.fillStyle(0x212121);
      g.fillCircle(60, 70, 6);
      g.fillStyle(0xb0bec5);
      g.fillRect(40, 100, 40, 12);
      g.generateTexture('boss', 120, 130);
      g.clear();
    }

    if (need('boss_spit')) {
      g.fillStyle(0x40c4ff);
      g.fillCircle(12, 12, 12);
      g.fillStyle(0x80d8ff);
      g.fillCircle(12, 12, 7);
      g.generateTexture('boss_spit', 24, 24);
      g.clear();
    }

    if (need('deco_bench')) {
      g.fillStyle(0x5d4037);
      g.fillRect(0, 20, 80, 8);
      g.fillRect(8, 28, 8, 20);
      g.fillRect(64, 28, 8, 20);
      g.fillStyle(0x8d6e63);
      g.fillRect(4, 12, 72, 10);
      g.generateTexture('deco_bench', 80, 48);
      g.clear();
    }

    if (need('deco_swing')) {
      g.fillStyle(0x6d4c41);
      g.fillRect(0, 20, 48, 10);
      g.fillStyle(0x90a4ae);
      g.fillRect(8, 0, 4, 22);
      g.fillRect(36, 0, 4, 22);
      g.generateTexture('deco_swing', 48, 32);
      g.clear();
    }

    if (need('btn_base')) {
      g.fillStyle(0xffffff, 0.22);
      g.fillCircle(45, 45, 42);
      g.lineStyle(3, 0xffffff, 0.4);
      g.strokeCircle(45, 45, 42);
      g.generateTexture('btn_base', 90, 90);
      g.clear();
    }

    if (need('btn_attack')) {
      g.fillStyle(0xff1744, 0.35);
      g.fillCircle(45, 45, 42);
      g.lineStyle(3, 0xff5252, 0.5);
      g.strokeCircle(45, 45, 42);
      g.generateTexture('btn_attack', 90, 90);
      g.clear();
    }

    if (need('water_drop')) {
      g.fillStyle(0x29b6f6);
      g.fillCircle(8, 12, 7);
      g.fillTriangle(8, 0, 2, 10, 14, 10);
      g.generateTexture('water_drop', 16, 20);
      g.clear();
    }

    if (need('mailbox')) {
      g.fillStyle(0x1565c0);
      g.fillRect(4, 16, 40, 28);
      g.fillStyle(0x0d47a1);
      g.fillRect(8, 20, 32, 12);
      g.fillStyle(0x90a4ae);
      g.fillRect(20, 4, 8, 14);
      g.fillStyle(0xffc107);
      g.fillCircle(36, 30, 3);
      g.generateTexture('mailbox', 48, 48);
      g.clear();
    }

    if (need('power_wrench')) {
      g.fillStyle(0xffd54f);
      g.fillRect(4, 12, 40, 10);
      g.fillRect(30, 4, 14, 26);
      g.fillStyle(0xff8f00);
      g.fillRect(32, 6, 4, 22);
      g.generateTexture('power_wrench', 48, 32);
      g.clear();
    }

    g.destroy();
  }
}

