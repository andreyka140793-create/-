import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Саныч (Игрок)
    gfx.fillStyle(0x1e88e5); // Синий комбинезон
    gfx.fillRect(0, 0, 48, 64);
    gfx.fillStyle(0xffcc80); // Лицо
    gfx.fillRect(12, 8, 24, 20);
    gfx.fillStyle(0x333333); // Усы
    gfx.fillRect(14, 22, 20, 5);
    gfx.fillStyle(0xd32f2f); // Кепка
    gfx.fillRect(8, 2, 32, 8);
    gfx.generateTexture('sanych', 48, 64);
    gfx.clear();

    // 2. Разводной ключ (Эффект атаки)
    gfx.fillStyle(0xb0bec5);
    gfx.fillRect(0, 10, 36, 12);
    gfx.fillRect(24, 0, 12, 32);
    gfx.generateTexture('wrench', 36, 32);
    gfx.clear();

    // 3. Тайл платформы (Хрущёвка/Асфальт)
    gfx.fillStyle(0x3e2723);
    gfx.fillRect(0, 0, 64, 64);
    gfx.fillStyle(0x40c4ff); // Линия подвала/труб
    gfx.fillRect(0, 0, 64, 8);
    gfx.generateTexture('tile_ground', 64, 64);
    gfx.clear();

    // 4. Коллекционные предметы
    // Гайка
    gfx.fillStyle(0xffd54f);
    gfx.fillCircle(16, 16, 14);
    gfx.fillStyle(0x111111);
    gfx.fillCircle(16, 16, 6);
    gfx.generateTexture('nut', 32, 32);
    gfx.clear();

    // Синяя изолента (Щит/Неуязвимость)
    gfx.fillStyle(0x2979ff);
    gfx.fillCircle(16, 16, 14);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(16, 16, 6);
    gfx.generateTexture('tape', 32, 32);
    gfx.clear();

    // 5. Враги
    // Недовольный сосед
    gfx.fillStyle(0xe64a19);
    gfx.fillRect(0, 0, 44, 58);
    gfx.fillStyle(0xffcc80);
    gfx.fillRect(10, 6, 24, 18);
    gfx.generateTexture('enemy_neighbor', 44, 58);
    gfx.clear();

    // Бродячий кот
    gfx.fillStyle(0x212121);
    gfx.fillRect(0, 10, 40, 24);
    gfx.fillRect(30, 0, 10, 14); // Уши
    gfx.generateTexture('enemy_cat', 40, 34);
    gfx.clear();

    // 6. Босс: Труба-Моллюск
    gfx.fillStyle(0x757575);
    gfx.fillRect(0, 20, 120, 100);
    gfx.fillStyle(0x00e676); // Токсичные подтеки
    gfx.fillRect(20, 0, 80, 40);
    gfx.fillStyle(0xff1744); // Глаз босса
    gfx.fillCircle(60, 60, 18);
    gfx.generateTexture('boss', 120, 120);
    gfx.clear();

    // 7. Touch UI Кнопки
    gfx.fillStyle(0xffffff, 0.25);
    gfx.fillCircle(45, 45, 45);
    gfx.generateTexture('btn_base', 90, 90);
    gfx.clear();

    gfx.fillStyle(0xff1744, 0.4);
    gfx.fillCircle(45, 45, 45);
    gfx.generateTexture('btn_attack', 90, 90);
    gfx.clear();
  }

  create() {
    this.scene.start('MenuScene');
  }
}
