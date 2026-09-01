import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.generateTextures();
  }

  generateTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ========== САНЫЧ: 4 кадра бега + idle + jump (каждый 48x64) ==========
    // Лист: 6 кадров горизонтально = 288x64
    const frameW = 48;
    const frameH = 64;

    const drawSanych = (gx, offsetX, legPhase = 0, armPhase = 0, jump = false) => {
      // Тень/ботинки
      gx.fillStyle(0x212121);
      if (jump) {
        gx.fillRect(offsetX + 10, 54, 12, 6);
        gx.fillRect(offsetX + 26, 54, 12, 6);
      } else {
        const legL = legPhase === 1 ? 2 : (legPhase === 2 ? -2 : 0);
        const legR = -legL;
        gx.fillRect(offsetX + 8 + legL, 56, 14, 8);
        gx.fillRect(offsetX + 26 + legR, 56, 14, 8);
      }
      // Комбинезон
      gx.fillStyle(0x1565c0);
      gx.fillRect(offsetX + 10, 28, 28, 28);
      // Руки
      gx.fillStyle(0x1976d2);
      const armY = jump ? 26 : 30 + armPhase;
      gx.fillRect(offsetX + 2, armY, 9, 16);
      gx.fillRect(offsetX + 37, armY + (armPhase ? -armPhase : 0), 9, 16);
      // Лицо
      gx.fillStyle(0xffcc80);
      gx.fillRect(offsetX + 12, 10, 24, 20);
      // Усы
      gx.fillStyle(0x3e2723);
      gx.fillRect(offsetX + 14, 24, 20, 5);
      // Глаза
      gx.fillStyle(0x212121);
      gx.fillRect(offsetX + 16, 16, 5, 5);
      gx.fillRect(offsetX + 27, 16, 5, 5);
      // Кепка
      gx.fillStyle(0xc62828);
      gx.fillRect(offsetX + 8, 2, 32, 10);
      gx.fillStyle(0xb71c1c);
      gx.fillRect(offsetX + 6, 8, 36, 4);
      // Ключ на поясе
      gx.fillStyle(0x90a4ae);
      gx.fillRect(offsetX + 34, 40, 12, 4);
    };

    // Кадры: 0 idle, 1-4 run, 5 jump
    drawSanych(g, 0 * frameW, 0, 0, false);       // idle
    drawSanych(g, 1 * frameW, 1, 1, false);       // run1
    drawSanych(g, 2 * frameW, 0, 0, false);       // run2
    drawSanych(g, 3 * frameW, 2, -1, false);      // run3
    drawSanych(g, 4 * frameW, 0, 0, false);       // run4
    drawSanych(g, 5 * frameW, 0, -2, true);       // jump
    g.generateTexture('sanych_sheet', frameW * 6, frameH);
    g.clear();

    // ========== КЛЮЧ ==========
    g.fillStyle(0xb0bec5);
    g.fillRect(4, 12, 40, 10);
    g.fillRect(30, 4, 14, 26);
    g.fillStyle(0x78909c);
    g.fillRect(32, 6, 4, 22);
    g.generateTexture('wrench', 48, 32);
    g.clear();

    // ========== ТАЙЛЫ ==========
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

    g.fillStyle(0x546e7a);
    g.fillRect(0, 8, 64, 16);
    g.fillStyle(0x37474f);
    g.fillRect(0, 8, 64, 4);
    g.fillStyle(0x78909c);
    g.fillCircle(8, 16, 4);
    g.fillCircle(56, 16, 4);
    g.generateTexture('tile_pipe', 64, 32);
    g.clear();

    g.fillStyle(0xbf360c);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0xe64a19);
    g.fillRect(2, 2, 28, 12);
    g.fillRect(34, 2, 28, 12);
    g.fillRect(2, 18, 28, 12);
    g.fillRect(34, 18, 28, 12);
    g.generateTexture('tile_brick', 64, 32);
    g.clear();

    // ========== ПРЕДМЕТЫ ==========
    g.fillStyle(0xffc107);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xff8f00);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0x212121);
    g.fillCircle(16, 16, 5);
    g.generateTexture('nut', 32, 32);
    g.clear();

    g.fillStyle(0x1565c0);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0x0d47a1);
    g.fillCircle(16, 16, 9);
    g.fillStyle(0xffffff);
    g.fillRect(12, 6, 8, 20);
    g.generateTexture('tape', 32, 32);
    g.clear();

    // ========== СОСЕД: 3 кадра ходьбы (44x58) ==========
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
      // Ноги
      gx.fillStyle(0x3e2723);
      gx.fillRect(ox + 10 + leg, 52, 10, 6);
      gx.fillRect(ox + 24 - leg, 52, 10, 6);
    };
    drawNeighbor(g, 0, 0);
    drawNeighbor(g, nw, 3);
    drawNeighbor(g, nw * 2, -3);
    g.generateTexture('neighbor_sheet', nw * 3, nh);
    g.clear();

    // ========== КОТ: 3 кадра (48x36) ==========
    const cw = 48, ch = 36;
    const drawCat = (gx, ox, stretch = 0) => {
      gx.fillStyle(0x212121);
      gx.fillRect(ox + 4, 14, 36 + stretch, 18);
      gx.fillRect(ox + 28, 4, 16, 16);
      gx.fillStyle(0x212121);
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

    // ========== КВИТАНЦИЯ ==========
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

    // ========== БОСС ==========
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

    g.fillStyle(0x40c4ff);
    g.fillCircle(12, 12, 12);
    g.fillStyle(0x80d8ff);
    g.fillCircle(12, 12, 7);
    g.generateTexture('boss_spit', 24, 24);
    g.clear();

    // ========== ДЕКОР ==========
    g.fillStyle(0x5d4037);
    g.fillRect(0, 20, 80, 8);
    g.fillRect(8, 28, 8, 20);
    g.fillRect(64, 28, 8, 20);
    g.fillStyle(0x8d6e63);
    g.fillRect(4, 12, 72, 10);
    g.generateTexture('deco_bench', 80, 48);
    g.clear();

    g.fillStyle(0x6d4c41);
    g.fillRect(0, 20, 48, 10);
    g.fillStyle(0x90a4ae);
    g.fillRect(8, 0, 4, 22);
    g.fillRect(36, 0, 4, 22);
    g.generateTexture('deco_swing', 48, 32);
    g.clear();

    // ========== UI ==========
    g.fillStyle(0xffffff, 0.22);
    g.fillCircle(45, 45, 42);
    g.lineStyle(3, 0xffffff, 0.4);
    g.strokeCircle(45, 45, 42);
    g.generateTexture('btn_base', 90, 90);
    g.clear();

    g.fillStyle(0xff1744, 0.35);
    g.fillCircle(45, 45, 42);
    g.lineStyle(3, 0xff5252, 0.5);
    g.strokeCircle(45, 45, 42);
    g.generateTexture('btn_attack', 90, 90);
    g.clear();

    g.fillStyle(0x29b6f6);
    g.fillCircle(8, 12, 7);
    g.fillTriangle(8, 0, 2, 10, 14, 10);
    g.generateTexture('water_drop', 16, 20);
    g.clear();

    // Старый ключ 'sanych' для совместимости (idle-кадр)
    // Phaser анимации будут из sheet
  }

  create() {
    // Регистрируем кадры спрайт-листов
    const addFrames = (key, count, fw, fh) => {
      const tex = this.textures.get(key);
      if (!tex) return;
      for (let i = 0; i < count; i++) {
        if (!tex.has(i)) {
          tex.add(i, 0, i * fw, 0, fw, fh);
        }
      }
    };

    addFrames('sanych_sheet', 6, 48, 64);
    addFrames('neighbor_sheet', 3, 44, 58);
    addFrames('cat_sheet', 3, 48, 36);

    // Анимации Саныча
    this.anims.create({
      key: 'sanych_idle',
      frames: [{ key: 'sanych_sheet', frame: 0 }],
      frameRate: 1
    });
    this.anims.create({
      key: 'sanych_run',
      frames: [
        { key: 'sanych_sheet', frame: 1 },
        { key: 'sanych_sheet', frame: 2 },
        { key: 'sanych_sheet', frame: 3 },
        { key: 'sanych_sheet', frame: 4 }
      ],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'sanych_jump',
      frames: [{ key: 'sanych_sheet', frame: 5 }],
      frameRate: 1
    });

    // Сосед
    this.anims.create({
      key: 'neighbor_walk',
      frames: [
        { key: 'neighbor_sheet', frame: 0 },
        { key: 'neighbor_sheet', frame: 1 },
        { key: 'neighbor_sheet', frame: 2 }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Кот
    this.anims.create({
      key: 'cat_walk',
      frames: [
        { key: 'cat_sheet', frame: 0 },
        { key: 'cat_sheet', frame: 1 },
        { key: 'cat_sheet', frame: 2 }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.scene.start('MenuScene');
  }
}

