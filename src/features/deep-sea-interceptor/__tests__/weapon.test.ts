import { createBulletsForWeapon, createChargedShot } from '../weapon';
import { WEAPON_COOLDOWN } from '../constants';

describe('createBulletsForWeapon', () => {
  describe('torpedo', () => {
    test('power=1 で1発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 1, false);
      expect(bullets).toHaveLength(1);
      expect(bullets[0].weaponType).toBe('torpedo');
    });

    test('power=3 で2発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 3, false);
      expect(bullets).toHaveLength(2);
    });

    test('power=4 で3発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 4, false);
      expect(bullets).toHaveLength(3);
    });

    test('power=5 で4発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 5, false);
      expect(bullets).toHaveLength(4);
    });

    test('hasSpread=true で5発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 1, true);
      expect(bullets).toHaveLength(5);
    });

    test('hasSpread=true のスプレッド角度が5方向であること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 1, true);
      const angles = bullets.map(b => b.angle.toFixed(4));
      const uniqueAngles = new Set(angles);
      expect(uniqueAngles.size).toBe(5);
    });

    test('power=5 + hasSpread=true で6発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 5, true);
      expect(bullets).toHaveLength(6);
    });

    test('power=5 + hasSpread=true で中央弾のダメージが1.5であること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'torpedo', 5, true);
      const centerBullets = bullets.filter(
        b => Math.abs(b.angle - (-Math.PI / 2)) < 0.001
      );
      expect(centerBullets.length).toBeGreaterThanOrEqual(1);
      expect(centerBullets[0].damage).toBe(1.5);
    });
  });

  describe('sonarWave', () => {
    test('power=1 で3発の弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'sonarWave', 1, false);
      expect(bullets).toHaveLength(3);
      expect(bullets[0].weaponType).toBe('sonarWave');
    });

    test('power=1 の damage が 1.5 であること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'sonarWave', 1, false);
      expect(bullets[0].damage).toBe(1.5);
    });

    test('power=3 で5発、damage=2.0 であること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'sonarWave', 3, false);
      expect(bullets).toHaveLength(5);
      expect(bullets[0].damage).toBe(2.0);
    });

    test('power=5 で5発、damage=2.5 であること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'sonarWave', 5, false);
      expect(bullets).toHaveLength(5);
      expect(bullets[0].damage).toBe(2.5);
    });

    test('lifespan が設定されていること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'sonarWave', 1, false);
      bullets.forEach(b => {
        expect(b.lifespan).toBeDefined();
        expect(b.lifespan).toBeGreaterThan(0);
      });
    });

    test('power=5 で lifespan=70 であること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'sonarWave', 5, false);
      expect(bullets[0].lifespan).toBe(70);
    });
  });

  describe('bioMissile', () => {
    test('power=1 で1発のホーミング弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'bioMissile', 1, false);
      expect(bullets).toHaveLength(1);
      expect(bullets[0].homing).toBe(true);
      expect(bullets[0].weaponType).toBe('bioMissile');
    });

    test('power=3 で2発のホーミング弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'bioMissile', 3, false);
      expect(bullets).toHaveLength(2);
    });

    test('power=5 で3発のホーミング弾を生成すること', () => {
      const bullets = createBulletsForWeapon(200, 300, 'bioMissile', 5, false);
      expect(bullets).toHaveLength(3);
    });
  });
});

describe('createChargedShot', () => {
  test('torpedo チャージショットは貫通弾であること', () => {
    const bullets = createChargedShot(200, 300, 'torpedo');
    expect(bullets).toHaveLength(1);
    expect(bullets[0].charged).toBe(true);
    expect(bullets[0].piercing).toBe(true);
    expect(bullets[0].damage).toBe(5);
  });

  test('sonarWave チャージショットは8発の全方位弾であること', () => {
    const bullets = createChargedShot(200, 300, 'sonarWave');
    expect(bullets).toHaveLength(8);
    expect(bullets[0].damage).toBe(4.0);
    bullets.forEach(b => {
      expect(b.charged).toBe(true);
      expect(b.weaponType).toBe('sonarWave');
    });
  });

  test('bioMissile チャージショットは5発のホーミング弾であること', () => {
    const bullets = createChargedShot(200, 300, 'bioMissile');
    expect(bullets).toHaveLength(5);
    bullets.forEach(b => {
      expect(b.charged).toBe(true);
      expect(b.homing).toBe(true);
    });
  });
});

describe('WEAPON_COOLDOWN', () => {
  test('sonarWave のクールダウンが 200ms であること', () => {
    expect(WEAPON_COOLDOWN.sonarWave).toBe(200);
  });
});
