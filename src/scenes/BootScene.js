import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // ===== 1. САНЫЧ (48x64) =====
    // Комбинезон
    gfx.fillStyle(0x1565c0);
    gfx.fillRect(8, 28, 32, 30);
    // Руки
    gfx.fillStyle(0x1976d2);
    gfx.fillRect(2, 30, 8, 18);
    gfx.fillRect(38, 30, 8, 18);
    // Лицо
    gfx.fillStyle(0xffcc80);
    gfx.fillRect(12, 10, 24, 22);
    // Усы
    gfx.fillStyle(0x3e2723);
    gfx.fillRect(14, 24, 20, 5);
    // Глаза
    gfx.fillStyle(0x212121);
    gfx.fillRect(16, 16, 5, 5);
    gfx.fillRect(27, 16, 5, 5);
    // Кепка-восьмиклинка
    gfx.fillStyle(0xc62828);
    gfx.fillRect(8, 2, 32, 10);
    gfx.fillStyle(0xb71c1c);
    gfx.fillRect(6, 8, 36, 4);
    // Ботинки
    gfx.fillStyle(0x212121);
    gfx.fillRect(8, 56, 14, 8);
    gfx.fillRect(26, 56, 14, 8);
    // Ключ на поясе
    gfx.fillStyle(0x90a4ae);
    gfx.fillRect(36, 40, 10, 4);
    gfx.generateTexture('sanych', 48, 64);
    gfx.clear();

    // ===== 2. РАЗВОДНОЙ КЛЮЧ =====
    gfx.fillStyle(0xb0bec5);
    gfx.fillRect(4, 12, 40, 10);
    gfx.fillRect(30, 4, 14, 26);
    gfx.fillStyle(0x78909c);
    gfx.fillRect(32, 6, 4, 22);
    gfx.generateTexture('wrench', 48, 32);
    gfx.clear();

    // ===== 3. ТАЙЛЫ =====
    // Земля / асфальт
    gfx.fillStyle(0x37474f);
    gfx.fillRect(0, 0, 64, 64);
    gfx.fillStyle(0x263238);
    gfx.fillRect(0, 0, 64, 8);
    gfx.fillStyle(0x455a64);
    for (let i = 0; i < 4; i++) {
      gfx.fillRect(i * 16 + 2, 16, 12, 4);
      gfx.fillRect(i * 16 + 2, 36, 12, 4);
    }
    gfx.generateTexture('tile_ground', 64, 64);
    gfx.clear();

    // Платформа-труба
    gfx.fillStyle(0x546e7a);
    gfx.fillRect(0, 8, 64, 16);
    gfx.fillStyle(0x37474f);
    gfx.fillRect(0, 8, 64, 4);
    gfx.fillStyle(0x78909c);
    gfx.fillCircle(8, 16, 4);
    gfx.fillCircle(56, 16, 4);
    gfx.generateTexture('tile_pipe', 64, 32);
    gfx.clear();

    // Кирпич хрущёвки
    gfx.fillStyle(0xbf360c);
    gfx.fillRect(0, 0, 64, 32);
    gfx.fillStyle(0xe64a19);
    gfx.fillRect(2, 2, 28, 12);
    gfx.fillRect(34, 2, 28, 12);
    gfx.fillRect(2, 18, 28, 12);
    gfx.fillRect(34, 18, 28, 12);
    gfx.generateTexture('tile_brick', 64, 32);
    gfx.clear();

    // ===== 4. ПРЕДМЕТЫ =====
    // Гайка
    gfx.fillStyle(0xffc107);
    gfx.fillCircle(16, 16, 14);
    gfx.fillStyle(0xff8f00);
    gfx.fillCircle(16, 16, 10);
    gfx.fillStyle(0x212121);
    gfx.fillCircle(16, 16, 5);
    gfx.generateTexture('nut', 32, 32);
    gfx.clear();

    // Изолента
    gfx.fillStyle(0x1565c0);
    gfx.fillCircle(16, 16, 14);
    gfx.fillStyle(0x0d47a1);
    gfx.fillCircle(16, 16, 9);
    gfx.fillStyle(0xffffff);
    gfx.fillRect(12, 6, 8, 20);
    gfx.generateTexture('tape', 32, 32);
    gfx.clear();

    // ===== 5. ВРАГИ =====
    // Сосед с жалобой
    gfx.fillStyle(0x5d4037); // халат
    gfx.fillRect(6, 24, 32, 34);
    gfx.fillStyle(0xffcc80); // лицо
    gfx.fillRect(10, 8, 24, 20);
    gfx.fillStyle(0x212121); // волосы
    gfx.fillRect(10, 4, 24, 8);
    gfx.fillStyle(0xc62828); // рот (злой)
    gfx.fillRect(16, 22, 12, 3);
    gfx.fillStyle(0x212121);
    gfx.fillRect(14, 14, 4, 4);
    gfx.fillRect(26, 14, 4, 4);
    gfx.generateTexture('enemy_neighbor', 44, 58);
    gfx.clear();

    // Бродячий кот
    gfx.fillStyle(0x212121);
    gfx.fillRect(4, 14, 36, 18);
    // Голова
    gfx.fillRect(28, 4, 16, 16);
    // Уши
    gfx.fillTriangle(30, 4, 34, -4, 38, 4);
    gfx.fillTriangle(38, 4, 42, -4, 44, 4);
    // Глаза
    gfx.fillStyle(0xffeb3b);
    gfx.fillCircle(34, 10, 3);
    gfx.fillCircle(40, 10, 3);
    // Хвост
    gfx.fillStyle(0x212121);
    gfx.fillRect(0, 18, 8, 6);
    gfx.generateTexture('enemy_cat', 48, 36);
    gfx.clear();

    // Квитанция ЖКХ (летающий враг)
    gfx.fillStyle(0xfffde7);
    gfx.fillRect(2, 2, 28, 36);
    gfx.fillStyle(0xff5252);
    gfx.fillRect(2, 2, 28, 8);
    gfx.fillStyle(0x212121);
    gfx.fillRect(6, 14, 20, 2);
    gfx.fillRect(6, 20, 16, 2);
    gfx.fillRect(6, 26, 18, 2);
    gfx.generateTexture('enemy_bill', 32, 40);
    gfx.clear();

    // ===== 6. БОСС: Труба-Моллюск =====
    gfx.fillStyle(0x455a64);
    gfx.fillRect(10, 30, 100, 90);
    // Ржавчина
    gfx.fillStyle(0xbf360c);
    gfx.fillRect(20, 40, 30, 20);
    gfx.fillRect(70, 70, 25, 30);
    // Токсичные подтёки
    gfx.fillStyle(0x00e676);
    gfx.fillRect(30, 10, 20, 30);
    gfx.fillRect(60, 5, 25, 35);
    // Глаз
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(60, 70, 22);
    gfx.fillStyle(0xff1744);
    gfx.fillCircle(60, 70, 14);
    gfx.fillStyle(0x212121);
    gfx.fillCircle(60, 70, 6);
    // Зубы/клапан
    gfx.fillStyle(0xb0bec5);
    gfx.fillRect(40, 100, 40, 12);
    gfx.generateTexture('boss', 120, 130);
    gfx.clear();

    // Плевок босса (вода)
    gfx.fillStyle(0x40c4ff);
    gfx.fillCircle(12, 12, 12);
    gfx.fillStyle(0x80d8ff);
    gfx.fillCircle(12, 12, 7);
    gfx.generateTexture('boss_spit', 24, 24);
    gfx.clear();

    // ===== 7. ДЕКОР =====
    // Лавочка
    gfx.fillStyle(0x5d4037);
    gfx.fillRect(0, 20, 80, 8);
    gfx.fillRect(8, 28, 8, 20);
    gfx.fillRect(64, 28, 8, 20);
    gfx.fillStyle(0x8d6e63);
    gfx.fillRect(4, 12, 72, 10);
    gfx.generateTexture('deco_bench', 80, 48);
    gfx.clear();

    // Качели (сиденье)
    gfx.fillStyle(0x6d4c41);
    gfx.fillRect(0, 20, 48, 10);
    gfx.fillStyle(0x90a4ae);
    gfx.fillRect(8, 0, 4, 22);
    gfx.fillRect(36, 0, 4, 22);
    gfx.generateTexture('deco_swing', 48, 32);
    gfx.clear();

    // ===== 8. UI КНОПКИ =====
    gfx.fillStyle(0xffffff, 0.22);
    gfx.fillCircle(45, 45, 42);
    gfx.lineStyle(3, 0xffffff, 0.4);
    gfx.strokeCircle(45, 45, 42);
    gfx.generateTexture('btn_base', 90, 90);
    gfx.clear();

    gfx.fillStyle(0xff1744, 0.35);
    gfx.fillCircle(45, 45, 42);
    gfx.lineStyle(3, 0xff5252, 0.5);
    gfx.strokeCircle(45, 45, 42);
    gfx.generateTexture('btn_attack', 90, 90);
    gfx.clear();

    // Капля воды (урон)
    gfx.fillStyle(0x29b6f6);
    gfx.fillCircle(8, 12, 7);
    gfx.fillTriangle(8, 0, 2, 10, 14, 10);
    gfx.generateTexture('water_drop', 16, 20);
    gfx.clear();
  }

  create() {
    this.scene.start('MenuScene');
  }
}
