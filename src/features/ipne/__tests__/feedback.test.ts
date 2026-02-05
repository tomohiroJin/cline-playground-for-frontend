/**
 * フィードバックシステムのテスト
 */
import {
  FEEDBACK_CONFIGS,
  resetFeedbackIdCounter,
  createFeedback,
  createDamageFeedback,
  createHealFeedback,
  createLevelUpFeedback,
  createTrapFeedback,
  createItemPickupFeedback,
  isFeedbackActive,
  getFeedbackProgress,
  updateFeedbacks,
  drawDamageFlash,
  drawTrapEffect,
  drawPopup,
  needsFlash,
} from '../feedback';
import { FeedbackType } from '../types';
import { createMockCanvasContext } from './testUtils';

describe('feedback', () => {
  beforeEach(() => {
    resetFeedbackIdCounter();
  });

  describe('FEEDBACK_CONFIGS', () => {
    test('全フィードバックタイプの設定が存在すること', () => {
      expect(FEEDBACK_CONFIGS[FeedbackType.DAMAGE]).toBeDefined();
      expect(FEEDBACK_CONFIGS[FeedbackType.HEAL]).toBeDefined();
      expect(FEEDBACK_CONFIGS[FeedbackType.LEVEL_UP]).toBeDefined();
      expect(FEEDBACK_CONFIGS[FeedbackType.TRAP]).toBeDefined();
      expect(FEEDBACK_CONFIGS[FeedbackType.ITEM_PICKUP]).toBeDefined();
    });

    test('各設定に必須プロパティがあること', () => {
      Object.values(FEEDBACK_CONFIGS).forEach(config => {
        expect(config.color).toBeDefined();
        expect(config.duration).toBeGreaterThan(0);
      });
    });

    test('ダメージ設定にフラッシュがあること', () => {
      expect(FEEDBACK_CONFIGS[FeedbackType.DAMAGE].flashDuration).toBeDefined();
      expect(FEEDBACK_CONFIGS[FeedbackType.DAMAGE].flashColor).toBeDefined();
    });
  });

  describe('createFeedback', () => {
    test('フィードバックを作成すること', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 10, 20, '-5', 1000);

      expect(feedback.id).toBe('feedback-1');
      expect(feedback.type).toBe(FeedbackType.DAMAGE);
      expect(feedback.x).toBe(10);
      expect(feedback.y).toBe(20);
      expect(feedback.text).toBe('-5');
      expect(feedback.startTime).toBe(1000);
    });

    test('連続で作成するとIDがインクリメントされること', () => {
      const feedback1 = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);
      const feedback2 = createFeedback(FeedbackType.HEAL, 0, 0, undefined, 1000);

      expect(feedback1.id).toBe('feedback-1');
      expect(feedback2.id).toBe('feedback-2');
    });
  });

  describe('createDamageFeedback', () => {
    test('ダメージフィードバックを作成すること', () => {
      const feedback = createDamageFeedback(10, 20, 5, 1000);

      expect(feedback.type).toBe(FeedbackType.DAMAGE);
      expect(feedback.text).toBe('-5');
    });
  });

  describe('createHealFeedback', () => {
    test('回復フィードバックを作成すること', () => {
      const feedback = createHealFeedback(10, 20, 10, 1000);

      expect(feedback.type).toBe(FeedbackType.HEAL);
      expect(feedback.text).toBe('+10');
    });
  });

  describe('createLevelUpFeedback', () => {
    test('レベルアップフィードバックを作成すること', () => {
      const feedback = createLevelUpFeedback(10, 20, 3, 1000);

      expect(feedback.type).toBe(FeedbackType.LEVEL_UP);
      expect(feedback.text).toBe('Level 3!');
    });
  });

  describe('createTrapFeedback', () => {
    test('罠フィードバックを作成すること', () => {
      const feedback = createTrapFeedback(10, 20, 'ダメージ罠', 1000);

      expect(feedback.type).toBe(FeedbackType.TRAP);
      expect(feedback.text).toBe('ダメージ罠');
    });
  });

  describe('createItemPickupFeedback', () => {
    test('アイテム取得フィードバックを作成すること', () => {
      const feedback = createItemPickupFeedback(10, 20, '回復薬（小）', 1000);

      expect(feedback.type).toBe(FeedbackType.ITEM_PICKUP);
      expect(feedback.text).toBe('回復薬（小）');
    });
  });

  describe('isFeedbackActive', () => {
    test('開始直後はアクティブであること', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);

      expect(isFeedbackActive(feedback, 1000)).toBe(true);
    });

    test('持続時間内はアクティブであること', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);
      const config = FEEDBACK_CONFIGS[FeedbackType.DAMAGE];

      expect(isFeedbackActive(feedback, 1000 + config.duration - 1)).toBe(true);
    });

    test('持続時間を過ぎると非アクティブになること', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);
      const config = FEEDBACK_CONFIGS[FeedbackType.DAMAGE];

      expect(isFeedbackActive(feedback, 1000 + config.duration)).toBe(false);
    });
  });

  describe('getFeedbackProgress', () => {
    test('開始時は0を返すこと', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);

      expect(getFeedbackProgress(feedback, 1000)).toBe(0);
    });

    test('終了時は1を返すこと', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);
      const config = FEEDBACK_CONFIGS[FeedbackType.DAMAGE];

      expect(getFeedbackProgress(feedback, 1000 + config.duration)).toBe(1);
    });

    test('中間で0.5を返すこと', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);
      const config = FEEDBACK_CONFIGS[FeedbackType.DAMAGE];

      expect(getFeedbackProgress(feedback, 1000 + config.duration / 2)).toBe(0.5);
    });
  });

  describe('updateFeedbacks', () => {
    test('アクティブなフィードバックのみを残すこと', () => {
      const active = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);
      const inactive = createFeedback(FeedbackType.HEAL, 0, 0, undefined, 0);
      const feedbacks = [active, inactive];

      const updated = updateFeedbacks(feedbacks, 1100);

      expect(updated).toHaveLength(1);
      expect(updated[0].type).toBe(FeedbackType.DAMAGE);
    });

    test('空配列を返すこと（全て期限切れの場合）', () => {
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 0);
      const updated = updateFeedbacks([feedback], 10000);

      expect(updated).toHaveLength(0);
    });
  });

  describe('drawDamageFlash', () => {
    test('フラッシュ時間内は描画すること', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const feedback = createDamageFeedback(0, 0, 5, 1000);

      drawDamageFlash(ctx, 800, 600, feedback, 1050);

      expect(ctx.fillRect).toHaveBeenCalled();
    });

    test('フラッシュ時間を過ぎると描画しないこと', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const feedback = createDamageFeedback(0, 0, 5, 1000);
      const config = FEEDBACK_CONFIGS[FeedbackType.DAMAGE];

      drawDamageFlash(ctx, 800, 600, feedback, 1000 + config.flashDuration! + 1);

      expect(ctx.fillRect).not.toHaveBeenCalled();
    });

    test('フラッシュ設定がないタイプは描画しないこと', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const feedback = createHealFeedback(0, 0, 10, 1000);

      drawDamageFlash(ctx, 800, 600, feedback, 1050);

      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('drawTrapEffect', () => {
    test('罠エフェクトを描画すること', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const feedback = createTrapFeedback(0, 0, 'ダメージ罠', 1000);

      drawTrapEffect(ctx, 800, 600, feedback, 1050);

      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawPopup', () => {
    test('テキストがある場合は描画すること', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const feedback = createDamageFeedback(0, 0, 5, 1000);

      drawPopup(ctx, feedback, 400, 300, 1100);

      expect(ctx.fillText).toHaveBeenCalled();
      expect(ctx.strokeText).toHaveBeenCalled();
    });

    test('テキストがない場合は描画しないこと', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const feedback = createFeedback(FeedbackType.DAMAGE, 0, 0, undefined, 1000);

      drawPopup(ctx, feedback, 400, 300, 1100);

      expect(ctx.fillText).not.toHaveBeenCalled();
    });
  });

  describe('needsFlash', () => {
    test('フラッシュ設定があるタイプはtrueを返すこと', () => {
      const feedback = createDamageFeedback(0, 0, 5, 1000);
      expect(needsFlash(feedback)).toBe(true);
    });

    test('フラッシュ設定がないタイプはfalseを返すこと', () => {
      const feedback = createHealFeedback(0, 0, 10, 1000);
      expect(needsFlash(feedback)).toBe(false);
    });
  });
});
