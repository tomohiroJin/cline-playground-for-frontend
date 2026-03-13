/**
 * バリューオブジェクトのテスト
 */
import { HP, Score, BeatCounter } from '../../domain/shared/value-objects';

describe('shared/value-objects', () => {
  // ── HP ──────────────────────────────────────────────

  describe('HP', () => {
    it('正常な値で生成できる', () => {
      const hp = HP.create(3);
      expect(hp.current).toBe(3);
    });

    it('0 で生成できる', () => {
      const hp = HP.create(0);
      expect(hp.current).toBe(0);
      expect(hp.isDead).toBe(true);
    });

    it('負の値で生成するとエラーになる', () => {
      expect(() => HP.create(-1)).toThrow('[Contract]');
    });

    it('99 を超える値で生成するとエラーになる', () => {
      expect(() => HP.create(100)).toThrow('[Contract]');
    });

    it('ダメージを受けて HP が減少する', () => {
      const hp = HP.create(3);
      const damaged = hp.damage(1);
      expect(damaged.current).toBe(2);
    });

    it('ダメージで HP が 0 未満にならない', () => {
      const hp = HP.create(1);
      const damaged = hp.damage(5);
      expect(damaged.current).toBe(0);
      expect(damaged.isDead).toBe(true);
    });

    it('負のダメージ量はエラーになる', () => {
      const hp = HP.create(3);
      expect(() => hp.damage(-1)).toThrow('[Contract]');
    });

    it('回復で HP が増加する', () => {
      const hp = HP.create(2);
      const healed = hp.heal(1);
      expect(healed.current).toBe(3);
    });

    it('回復で HP が 99 を超えない', () => {
      const hp = HP.create(98);
      const healed = hp.heal(5);
      expect(healed.current).toBe(99);
    });

    it('isDead は HP > 0 で false を返す', () => {
      const hp = HP.create(1);
      expect(hp.isDead).toBe(false);
    });
  });

  // ── Score ───────────────────────────────────────────

  describe('Score', () => {
    it('0 で生成できる', () => {
      const score = Score.create(0);
      expect(score.current).toBe(0);
    });

    it('正の値で生成できる', () => {
      const score = Score.create(1000);
      expect(score.current).toBe(1000);
    });

    it('負の値で生成するとエラーになる', () => {
      expect(() => Score.create(-1)).toThrow('[Contract]');
    });

    it('ポイントを加算できる', () => {
      const score = Score.create(100);
      const added = score.add(50);
      expect(added.current).toBe(150);
    });

    it('負のポイント加算はエラーになる', () => {
      const score = Score.create(100);
      expect(() => score.add(-10)).toThrow('[Contract]');
    });
  });

  // ── BeatCounter ─────────────────────────────────────

  describe('BeatCounter', () => {
    it('指定した周期で生成できる', () => {
      const counter = BeatCounter.create(34);
      expect(counter.current).toBe(0);
    });

    it('初期状態はビート上にある', () => {
      const counter = BeatCounter.create(34);
      expect(counter.isOnBeat).toBe(true);
    });

    it('tick で値が増加する', () => {
      const counter = BeatCounter.create(34);
      const next = counter.tick();
      expect(next.current).toBe(1);
      expect(next.isOnBeat).toBe(false);
    });

    it('周期に達するとリセットされる', () => {
      let counter = BeatCounter.create(3);
      counter = counter.tick(); // 1
      counter = counter.tick(); // 2
      counter = counter.tick(); // 0 にリセット
      expect(counter.current).toBe(0);
      expect(counter.isOnBeat).toBe(true);
    });

    it('周期 0 以下で生成するとエラーになる', () => {
      expect(() => BeatCounter.create(0)).toThrow('[Contract]');
      expect(() => BeatCounter.create(-1)).toThrow('[Contract]');
    });
  });
});
