/**
 * deathEffect のユニットテスト
 *
 * プレイヤー死亡エフェクトの3フェーズアニメーションを検証する。
 */

import { DeathEffect, DeathPhase, DEATH_ANIMATION_DURATION } from './deathEffect';
import { createMockCanvasContext } from '../../__tests__/testUtils';

describe('DeathEffect', () => {
  let effect: DeathEffect;

  beforeEach(() => {
    effect = new DeathEffect();
  });

  describe('初期状態', () => {
    it('非アクティブである', () => {
      expect(effect.isActive()).toBe(false);
    });

    it('フェーズは DONE である', () => {
      expect(effect.getPhase(0)).toBe(DeathPhase.DONE);
    });
  });

  describe('start', () => {
    it('アクティブ状態になる', () => {
      effect.start(1000);
      expect(effect.isActive()).toBe(true);
    });

    it('開始直後はBLINKフェーズである', () => {
      effect.start(1000);
      expect(effect.getPhase(1000)).toBe(DeathPhase.BLINK);
    });
  });

  describe('getPhase', () => {
    beforeEach(() => {
      effect.start(0);
    });

    it('0〜499ms はBLINKフェーズ', () => {
      expect(effect.getPhase(0)).toBe(DeathPhase.BLINK);
      expect(effect.getPhase(250)).toBe(DeathPhase.BLINK);
      expect(effect.getPhase(499)).toBe(DeathPhase.BLINK);
    });

    it('500〜999ms はRED_SHIFTフェーズ', () => {
      expect(effect.getPhase(500)).toBe(DeathPhase.RED_SHIFT);
      expect(effect.getPhase(750)).toBe(DeathPhase.RED_SHIFT);
      expect(effect.getPhase(999)).toBe(DeathPhase.RED_SHIFT);
    });

    it('1000〜1499ms はDECOMPOSEフェーズ', () => {
      expect(effect.getPhase(1000)).toBe(DeathPhase.DECOMPOSE);
      expect(effect.getPhase(1250)).toBe(DeathPhase.DECOMPOSE);
      expect(effect.getPhase(1499)).toBe(DeathPhase.DECOMPOSE);
    });

    it('1500ms 以降はDONEフェーズ', () => {
      expect(effect.getPhase(1500)).toBe(DeathPhase.DONE);
      expect(effect.getPhase(2000)).toBe(DeathPhase.DONE);
    });
  });

  describe('isPlayerVisible', () => {
    beforeEach(() => {
      effect.start(0);
    });

    it('BLINKフェーズで100ms間隔の点滅を行う', () => {
      // 0ms: 表示（0/100 = 0、偶数）
      expect(effect.isPlayerVisible(0)).toBe(true);
      // 50ms: 表示（0/100 = 0、偶数）
      expect(effect.isPlayerVisible(50)).toBe(true);
      // 100ms: 非表示（100/100 = 1、奇数）
      expect(effect.isPlayerVisible(100)).toBe(false);
      // 200ms: 表示（200/100 = 2、偶数）
      expect(effect.isPlayerVisible(200)).toBe(true);
      // 300ms: 非表示（300/100 = 3、奇数）
      expect(effect.isPlayerVisible(300)).toBe(false);
    });

    it('RED_SHIFTフェーズでは常に表示する', () => {
      expect(effect.isPlayerVisible(500)).toBe(true);
      expect(effect.isPlayerVisible(750)).toBe(true);
      expect(effect.isPlayerVisible(999)).toBe(true);
    });

    it('DECOMPOSEフェーズでは非表示にする', () => {
      expect(effect.isPlayerVisible(1000)).toBe(false);
      expect(effect.isPlayerVisible(1250)).toBe(false);
    });
  });

  describe('getRedShiftAlpha', () => {
    beforeEach(() => {
      effect.start(0);
    });

    it('BLINKフェーズでは0を返す', () => {
      expect(effect.getRedShiftAlpha(250)).toBe(0);
    });

    it('RED_SHIFT開始時（500ms）は0に近い', () => {
      expect(effect.getRedShiftAlpha(500)).toBeCloseTo(0, 1);
    });

    it('RED_SHIFT中間（750ms）は0.4に近い', () => {
      // progress = (750 - 500) / 500 = 0.5 → alpha = 0.5 * 0.8 = 0.4
      expect(effect.getRedShiftAlpha(750)).toBeCloseTo(0.4, 1);
    });

    it('RED_SHIFT終了時（999ms）は0.8に近い', () => {
      expect(effect.getRedShiftAlpha(999)).toBeCloseTo(0.8, 1);
    });

    it('DECOMPOSEフェーズでは0を返す', () => {
      expect(effect.getRedShiftAlpha(1000)).toBe(0);
    });

    it('最大値は0.8を超えない', () => {
      expect(effect.getRedShiftAlpha(999)).toBeLessThanOrEqual(0.8);
    });
  });

  describe('update', () => {
    it('非アクティブ時は何もしない', () => {
      // start() を呼ばない状態で update しても例外は出ない
      expect(() => {
        effect.update(100, 0, 0, ['#fff']);
      }).not.toThrow();
    });

    it('アニメーション終了後にアクティブフラグをfalseにする', () => {
      effect.start(0);
      effect.update(DEATH_ANIMATION_DURATION, 100, 100, ['#fff']);
      expect(effect.isActive()).toBe(false);
    });

    it('DECOMPOSEフェーズでパーティクルを生成する', () => {
      effect.start(0);
      // BLINKフェーズ — パーティクル無し
      effect.update(250, 100, 100, ['#ff0000', '#0000ff']);
      // DECOMPOSEフェーズに入る
      effect.update(1100, 100, 100, ['#ff0000', '#0000ff']);
      // パーティクルが生成されている（内部状態なのでdrawで確認）
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      effect.draw(ctx, 1100, 100, 100, 32);
      // パーティクル描画のため fillRect が呼ばれる
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('draw', () => {
    it('非アクティブ時は何も描画しない', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      effect.draw(ctx, 0, 100, 100, 32);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('RED_SHIFTフェーズで赤色オーバーレイを描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      effect.start(0);
      effect.draw(ctx, 750, 100, 100, 32);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('BLINKフェーズでは何も描画しない', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      effect.start(0);
      effect.draw(ctx, 250, 100, 100, 32);
      // BLINKフェーズでは描画なし
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('すべての状態を初期化する', () => {
      effect.start(0);
      expect(effect.isActive()).toBe(true);

      effect.reset();
      expect(effect.isActive()).toBe(false);
      expect(effect.getPhase(0)).toBe(DeathPhase.DONE);
    });

    it('リセット後に再度startできる', () => {
      effect.start(0);
      effect.reset();
      effect.start(5000);
      expect(effect.isActive()).toBe(true);
      expect(effect.getPhase(5000)).toBe(DeathPhase.BLINK);
    });
  });

  describe('DEATH_ANIMATION_DURATION', () => {
    it('1500ms である', () => {
      expect(DEATH_ANIMATION_DURATION).toBe(1500);
    });
  });
});
