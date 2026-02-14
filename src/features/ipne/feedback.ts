/**
 * IPNE フィードバックエフェクトシステム
 *
 * ダメージ、回復、レベルアップなどの視覚的フィードバックを管理
 */

import { FeedbackEffect, FeedbackType, FeedbackTypeValue } from './types';

/** フィードバック設定 */
export const FEEDBACK_CONFIGS: Record<
  FeedbackTypeValue,
  {
    color: string;
    duration: number;
    flashDuration?: number;
    flashColor?: string;
  }
> = {
  [FeedbackType.DAMAGE]: {
    color: '#ef4444',
    duration: 500,
    flashDuration: 100,
    flashColor: 'rgba(255, 0, 0, 0.3)',
  },
  [FeedbackType.HEAL]: {
    color: '#22c55e',
    duration: 800,
  },
  [FeedbackType.LEVEL_UP]: {
    color: '#fbbf24',
    duration: 1200,
    flashDuration: 200,
    flashColor: 'rgba(251, 191, 36, 0.3)',
  },
  [FeedbackType.TRAP]: {
    color: '#f97316',
    duration: 600,
    flashDuration: 150,
    flashColor: 'rgba(249, 115, 22, 0.3)',
  },
  [FeedbackType.ITEM_PICKUP]: {
    color: '#3b82f6',
    duration: 600,
  },
  [FeedbackType.BOSS_KILL]: {
    color: '#f97316',
    duration: 1200,
    flashDuration: 200,
    flashColor: 'rgba(255, 255, 255, 0.4)',
  },
  [FeedbackType.SPEED_BOOST]: {
    color: '#60a5fa',
    duration: 500,
  },
};

let feedbackIdCounter = 0;

/**
 * フィードバックIDカウンタをリセットする（テスト用）
 */
export function resetFeedbackIdCounter(): void {
  feedbackIdCounter = 0;
}

/**
 * 新しいフィードバックエフェクトを作成する
 * @param type フィードバックの種類
 * @param x X座標
 * @param y Y座標
 * @param text 表示テキスト（オプション）
 * @param now 現在時刻（ミリ秒）- テスト用にオプショナル
 * @returns フィードバックエフェクト
 */
export function createFeedback(
  type: FeedbackTypeValue,
  x: number,
  y: number,
  text?: string,
  now: number = Date.now()
): FeedbackEffect {
  feedbackIdCounter += 1;
  const config = FEEDBACK_CONFIGS[type];

  return {
    id: `feedback-${feedbackIdCounter}`,
    type,
    x,
    y,
    text,
    color: config.color,
    startTime: now,
    duration: config.duration,
  };
}

/**
 * ダメージフィードバックを作成する
 * @param x X座標
 * @param y Y座標
 * @param damage ダメージ量
 * @param now 現在時刻
 * @returns フィードバックエフェクト
 */
export function createDamageFeedback(
  x: number,
  y: number,
  damage: number,
  now: number = Date.now()
): FeedbackEffect {
  return createFeedback(FeedbackType.DAMAGE, x, y, `-${damage}`, now);
}

/**
 * 回復フィードバックを作成する
 * @param x X座標
 * @param y Y座標
 * @param healAmount 回復量
 * @param now 現在時刻
 * @returns フィードバックエフェクト
 */
export function createHealFeedback(
  x: number,
  y: number,
  healAmount: number,
  now: number = Date.now()
): FeedbackEffect {
  return createFeedback(FeedbackType.HEAL, x, y, `+${healAmount}`, now);
}

/**
 * レベルアップフィードバックを作成する
 * @param x X座標
 * @param y Y座標
 * @param level 新しいレベル
 * @param now 現在時刻
 * @returns フィードバックエフェクト
 */
export function createLevelUpFeedback(
  x: number,
  y: number,
  level: number,
  now: number = Date.now()
): FeedbackEffect {
  return createFeedback(FeedbackType.LEVEL_UP, x, y, `Level ${level}!`, now);
}

/**
 * 罠フィードバックを作成する
 * @param x X座標
 * @param y Y座標
 * @param trapName 罠の名前
 * @param now 現在時刻
 * @returns フィードバックエフェクト
 */
export function createTrapFeedback(
  x: number,
  y: number,
  trapName: string,
  now: number = Date.now()
): FeedbackEffect {
  return createFeedback(FeedbackType.TRAP, x, y, trapName, now);
}

/**
 * アイテム取得フィードバックを作成する
 * @param x X座標
 * @param y Y座標
 * @param itemName アイテム名
 * @param now 現在時刻
 * @returns フィードバックエフェクト
 */
export function createItemPickupFeedback(
  x: number,
  y: number,
  itemName: string,
  now: number = Date.now()
): FeedbackEffect {
  return createFeedback(FeedbackType.ITEM_PICKUP, x, y, itemName, now);
}

/**
 * フィードバックがアクティブかどうかを判定する
 * @param feedback フィードバックエフェクト
 * @param now 現在時刻
 * @returns アクティブの場合true
 */
export function isFeedbackActive(feedback: FeedbackEffect, now: number = Date.now()): boolean {
  return now - feedback.startTime < feedback.duration;
}

/**
 * フィードバックの進行度を取得する（0.0〜1.0）
 * @param feedback フィードバックエフェクト
 * @param now 現在時刻
 * @returns 進行度
 */
export function getFeedbackProgress(feedback: FeedbackEffect, now: number = Date.now()): number {
  const elapsed = now - feedback.startTime;
  return Math.min(1.0, Math.max(0.0, elapsed / feedback.duration));
}

/**
 * アクティブなフィードバックのみをフィルタリングする
 * @param feedbacks フィードバック配列
 * @param now 現在時刻
 * @returns アクティブなフィードバック配列
 */
export function updateFeedbacks(
  feedbacks: FeedbackEffect[],
  now: number = Date.now()
): FeedbackEffect[] {
  return feedbacks.filter(f => isFeedbackActive(f, now));
}

/**
 * ダメージフラッシュを描画する
 * @param ctx キャンバスコンテキスト
 * @param width キャンバス幅
 * @param height キャンバス高さ
 * @param feedback フィードバックエフェクト
 * @param now 現在時刻
 */
export function drawDamageFlash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  feedback: FeedbackEffect,
  now: number = Date.now()
): void {
  const config = FEEDBACK_CONFIGS[feedback.type];
  if (!config.flashDuration || !config.flashColor) {
    return;
  }

  const elapsed = now - feedback.startTime;
  if (elapsed > config.flashDuration) {
    return;
  }

  const alpha = 1 - elapsed / config.flashDuration;
  ctx.save();
  ctx.fillStyle = config.flashColor;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * 罠エフェクトを描画する
 * @param ctx キャンバスコンテキスト
 * @param width キャンバス幅
 * @param height キャンバス高さ
 * @param feedback フィードバックエフェクト
 * @param now 現在時刻
 */
export function drawTrapEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  feedback: FeedbackEffect,
  now: number = Date.now()
): void {
  drawDamageFlash(ctx, width, height, feedback, now);
}

/**
 * ポップアップテキストを描画する
 * @param ctx キャンバスコンテキスト
 * @param feedback フィードバックエフェクト
 * @param screenX 画面X座標
 * @param screenY 画面Y座標
 * @param now 現在時刻
 */
export function drawPopup(
  ctx: CanvasRenderingContext2D,
  feedback: FeedbackEffect,
  screenX: number,
  screenY: number,
  now: number = Date.now()
): void {
  if (!feedback.text) {
    return;
  }

  const progress = getFeedbackProgress(feedback, now);
  const alpha = 1 - progress;
  const offsetY = -progress * 30;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = feedback.color;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // 縁取り
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeText(feedback.text, screenX, screenY + offsetY);

  // テキスト
  ctx.fillText(feedback.text, screenX, screenY + offsetY);
  ctx.restore();
}

/**
 * フラッシュが必要なフィードバックかどうかを判定する
 * @param feedback フィードバックエフェクト
 * @returns フラッシュが必要な場合true
 */
export function needsFlash(feedback: FeedbackEffect): boolean {
  const config = FEEDBACK_CONFIGS[feedback.type];
  return config.flashDuration !== undefined && config.flashDuration > 0;
}
