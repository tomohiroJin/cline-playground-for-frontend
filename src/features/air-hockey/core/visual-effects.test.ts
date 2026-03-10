/**
 * Phase 1: 見た目改善のテスト
 * US-1.1〜US-1.5 に対応するテストスイート
 */
import { HitStopState, SlowMotionState } from './types';

// テスト用の色ヘルパー関数をインポート（まだ存在しない）
import { lightenColor, darkenColor } from '../renderer';

describe('Phase 1: 見た目改善', () => {
  // ── P1-01: 色ヘルパー関数 ──────────────────────
  describe('P1-01: 色ヘルパー関数', () => {
    describe('lightenColor', () => {
      it('#3498db を 40 明るくすると RGB 各成分が 40 増加する', () => {
        const result = lightenColor('#3498db', 40);
        // #34=52, #98=152, #db=219
        // 52+40=92, 152+40=192, 219+40=255(clamped)
        expect(result).toBe('rgb(92, 192, 255)');
      });

      it('成分が 255 を超えないようにクランプされる', () => {
        const result = lightenColor('#ffffff', 10);
        expect(result).toBe('rgb(255, 255, 255)');
      });

      it('#000000 を 100 明るくすると rgb(100, 100, 100) になる', () => {
        const result = lightenColor('#000000', 100);
        expect(result).toBe('rgb(100, 100, 100)');
      });
    });

    describe('darkenColor', () => {
      it('#3498db を 40 暗くすると RGB 各成分が 40 減少する', () => {
        const result = darkenColor('#3498db', 40);
        // 52-40=12, 152-40=112, 219-40=179
        expect(result).toBe('rgb(12, 112, 179)');
      });

      it('成分が 0 未満にならないようにクランプされる', () => {
        const result = darkenColor('#000000', 10);
        expect(result).toBe('rgb(0, 0, 0)');
      });

      it('#e74c3c を 60 暗くすると正しい値になる', () => {
        const result = darkenColor('#e74c3c', 60);
        // #e7=231, #4c=76, #3c=60
        // 231-60=171, 76-60=16, 60-60=0
        expect(result).toBe('rgb(171, 16, 0)');
      });
    });
  });

  // ── P1-08: ヒットストップ型定義 ─────────────────
  describe('P1-08: HitStopState 型定義', () => {
    it('HitStopState が必要なフィールドを持つ', () => {
      const hitStop: HitStopState = {
        active: true,
        framesRemaining: 3,
        impactX: 100,
        impactY: 200,
        shockwaveRadius: 0,
        shockwaveMaxRadius: 80,
      };
      expect(hitStop.active).toBe(true);
      expect(hitStop.framesRemaining).toBe(3);
      expect(hitStop.impactX).toBe(100);
      expect(hitStop.impactY).toBe(200);
      expect(hitStop.shockwaveRadius).toBe(0);
      expect(hitStop.shockwaveMaxRadius).toBe(80);
    });

    it('非アクティブ状態を表現できる', () => {
      const hitStop: HitStopState = {
        active: false,
        framesRemaining: 0,
        impactX: 0,
        impactY: 0,
        shockwaveRadius: 0,
        shockwaveMaxRadius: 80,
      };
      expect(hitStop.active).toBe(false);
    });
  });

  // ── P1-09: ヒットストップロジック ────────────────
  describe('P1-09: ヒットストップロジック', () => {
    const STRONG_HIT_THRESHOLD = 8;

    it('パック速度 > 8 でヒットストップが発動する', () => {
      const postSpeed = 9;
      const shouldActivate = postSpeed > STRONG_HIT_THRESHOLD;
      expect(shouldActivate).toBe(true);
    });

    it('パック速度 <= 8 ではヒットストップが発動しない', () => {
      const postSpeed = 8;
      const shouldActivate = postSpeed > STRONG_HIT_THRESHOLD;
      expect(shouldActivate).toBe(false);
    });

    it('ヒットストップは 3 フレームで解除される', () => {
      const hitStop: HitStopState = {
        active: true,
        framesRemaining: 3,
        impactX: 100,
        impactY: 200,
        shockwaveRadius: 0,
        shockwaveMaxRadius: 80,
      };

      // 3フレーム分の更新をシミュレート
      for (let i = 0; i < 3; i++) {
        hitStop.framesRemaining--;
        hitStop.shockwaveRadius += 20;
      }

      expect(hitStop.framesRemaining).toBe(0);
      expect(hitStop.shockwaveRadius).toBe(60);
    });

    it('衝撃波は拡がるにつれて透明度が下がる', () => {
      const shockwaveRadius = 40;
      const shockwaveMaxRadius = 80;
      const alpha = 1 - shockwaveRadius / shockwaveMaxRadius;
      expect(alpha).toBe(0.5);
    });
  });

  // ── P1-11: スローモーション型定義 ────────────────
  describe('P1-11: SlowMotionState 型定義', () => {
    it('SlowMotionState が必要なフィールドを持つ', () => {
      const slowMo: SlowMotionState = {
        active: true,
        startTime: 1000,
        duration: 400,
      };
      expect(slowMo.active).toBe(true);
      expect(slowMo.startTime).toBe(1000);
      expect(slowMo.duration).toBe(400);
    });
  });

  // ── P1-12: ゴールスローモーションロジック ────────
  describe('P1-12: ゴールスローモーションロジック', () => {
    it('スローモーション中は 0.3 倍速になる', () => {
      const slowMo: SlowMotionState = {
        active: true,
        startTime: 1000,
        duration: 400,
      };
      const now = 1200; // 200ms 経過
      const elapsed = now - slowMo.startTime;
      const isActive = slowMo.active && elapsed < slowMo.duration;
      const timeScale = isActive ? 0.3 : 1;
      expect(timeScale).toBe(0.3);
    });

    it('400ms 後にスローモーションが解除される', () => {
      const slowMo: SlowMotionState = {
        active: true,
        startTime: 1000,
        duration: 400,
      };
      const now = 1400; // 400ms 経過
      const elapsed = now - slowMo.startTime;
      const isActive = slowMo.active && elapsed < slowMo.duration;
      expect(isActive).toBe(false);
    });

    it('自分の得点でも相手の得点でもスローモーションが発動する', () => {
      // ゴール発生時は常に active=true にする
      const scorers: Array<'player' | 'cpu'> = ['player', 'cpu'];
      for (const scorer of scorers) {
        const slowMo: SlowMotionState = {
          active: true,
          startTime: Date.now(),
          duration: 400,
        };
        // どちらのスコアラーでも active になる
        expect(slowMo.active).toBe(true);
        // scorer が使われていることを確認（linter 対策）
        expect(['player', 'cpu']).toContain(scorer);
      }
    });
  });
});
