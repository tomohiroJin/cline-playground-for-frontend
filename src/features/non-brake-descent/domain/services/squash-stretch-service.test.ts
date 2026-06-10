import { squashStretch } from './squash-stretch-service';
import type { Player } from '../../types';

/** テスト用プレイヤーファクトリ（デフォルトは地上静止状態） */
const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  x: 100,
  y: 300,
  ramp: 0,
  vx: 0,
  vy: 0,
  jumping: false,
  jumpCD: 0,
  onGround: true,
  ...overrides,
});

describe('squash-stretch-service', () => {
  // --- 正常系: 地上静止 ---

  describe('正常系: 地上静止の場合', () => {
    it('jumping=false, onGround=true, vy=0 のとき {scaleX:1, scaleY:1} を返す', () => {
      // Arrange
      const player = makePlayer({ jumping: false, onGround: true, vy: 0 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleX).toBeCloseTo(1, 5);
      expect(result.scaleY).toBeCloseTo(1, 5);
    });
  });

  // --- 正常系: 落下中（vy > 閾値）---

  describe('正常系: 落下中（vy が大きい正の値）の場合', () => {
    it('落下中（vy=6）のとき scaleY > 1 になる（縦伸び）', () => {
      // Arrange
      const player = makePlayer({ jumping: true, onGround: false, vy: 6 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleY).toBeGreaterThan(1);
    });

    it('落下中（vy=6）のとき scaleX < 1 になる（横縮み）', () => {
      // Arrange
      const player = makePlayer({ jumping: true, onGround: false, vy: 6 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleX).toBeLessThan(1);
    });

    it('速い落下（vy=12）のほうが遅い落下（vy=6）より変形が大きい（scaleY が高い）', () => {
      // Arrange
      const slowFall = makePlayer({ jumping: true, onGround: false, vy: 6 });
      const fastFall = makePlayer({ jumping: true, onGround: false, vy: 12 });
      // Act
      const slowResult = squashStretch(slowFall);
      const fastResult = squashStretch(fastFall);
      // Assert
      expect(fastResult.scaleY).toBeGreaterThan(slowResult.scaleY);
    });
  });

  // --- 正常系: 上昇中（vy < 閾値の負）---

  describe('正常系: 上昇中（vy が負）の場合', () => {
    it('上昇中（vy=-6）のとき scaleY > 1 になる（縦伸び）', () => {
      // Arrange
      const player = makePlayer({ jumping: true, onGround: false, vy: -6 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleY).toBeGreaterThan(1);
    });
  });

  // --- 正常系: 着地直後（スクワッシュ）---

  describe('正常系: 着地直後（onGround=true かつ |vy| が大きい）の場合', () => {
    it('着地直後（onGround=true, vy=4）のとき scaleX > 1 になる（横潰れ）', () => {
      // Arrange
      const player = makePlayer({ jumping: false, onGround: true, vy: 4 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleX).toBeGreaterThan(1);
    });

    it('着地直後（onGround=true, vy=4）のとき scaleY < 1 になる（縦縮み）', () => {
      // Arrange
      const player = makePlayer({ jumping: false, onGround: true, vy: 4 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleY).toBeLessThan(1);
    });
  });

  // --- 境界値: 体積保存（scaleX * scaleY ≈ 1）---

  describe('境界値: 体積保存の確認', () => {
    const testCases: Array<{ label: string; player: Player }> = [
      { label: '地上静止', player: makePlayer() },
      { label: '落下中（vy=6）', player: makePlayer({ jumping: true, onGround: false, vy: 6 }) },
      { label: '上昇中（vy=-6）', player: makePlayer({ jumping: true, onGround: false, vy: -6 }) },
      { label: '着地直後（vy=4）', player: makePlayer({ jumping: false, onGround: true, vy: 4 }) },
    ];

    testCases.forEach(({ label, player }) => {
      it(`${label} のとき scaleX * scaleY が 0.7〜1.3 の範囲内（体積保存の目安）`, () => {
        // Arrange / Act
        const result = squashStretch(player);
        const volume = result.scaleX * result.scaleY;
        // Assert
        expect(volume).toBeGreaterThan(0.7);
        expect(volume).toBeLessThan(1.3);
      });
    });
  });

  // --- 境界値: scaleX・scaleY は常に正 ---

  describe('境界値: スケール値は常に正', () => {
    it('極端な落下速度（vy=100）でも scaleX, scaleY は正', () => {
      // Arrange
      const player = makePlayer({ jumping: true, onGround: false, vy: 100 });
      // Act
      const result = squashStretch(player);
      // Assert
      expect(result.scaleX).toBeGreaterThan(0);
      expect(result.scaleY).toBeGreaterThan(0);
    });
  });
});
