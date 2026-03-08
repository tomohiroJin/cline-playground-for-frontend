/**
 * フローティングテキストシステム
 *
 * ダメージ数値・回復量・コンボ表示などの浮遊テキストを管理する。
 */

/** フローティングテキストの種別 */
export const FloatingTextType = {
  DAMAGE: 'damage',
  CRITICAL: 'critical',
  PLAYER_DAMAGE: 'player_damage',
  HEAL: 'heal',
  COMBO: 'combo',
  INFO: 'info',
} as const;

export type FloatingTextTypeValue =
  (typeof FloatingTextType)[keyof typeof FloatingTextType];

/** フローティングテキストデータ */
export interface FloatingText {
  /** テキスト内容 */
  text: string;
  /** 表示位置 X（スクリーン座標） */
  x: number;
  /** 表示位置 Y（スクリーン座標） */
  y: number;
  /** 生成時刻（ms） */
  startTime: number;
  /** 持続時間（ms） */
  duration: number;
  /** 色 */
  color: string;
  /** フォントサイズ（px） */
  fontSize: number;
  /** 種別 */
  type: FloatingTextTypeValue;
}

/** 種別ごとの設定 */
interface FloatingTextConfig {
  color: string;
  fontSize: number;
  duration: number;
}

/** 種別ごとのデフォルト設定 */
export const FLOATING_TEXT_CONFIGS: Record<FloatingTextTypeValue, FloatingTextConfig> = {
  [FloatingTextType.DAMAGE]: { color: '#ffffff', fontSize: 12, duration: 800 },
  [FloatingTextType.CRITICAL]: { color: '#fbbf24', fontSize: 18, duration: 1000 },
  [FloatingTextType.PLAYER_DAMAGE]: { color: '#ef4444', fontSize: 14, duration: 800 },
  [FloatingTextType.HEAL]: { color: '#22c55e', fontSize: 12, duration: 800 },
  [FloatingTextType.COMBO]: { color: '#fbbf24', fontSize: 16, duration: 1200 },
  [FloatingTextType.INFO]: { color: '#ffffff', fontSize: 14, duration: 1500 },
};

/** フローティングテキストの上限数 */
const MAX_FLOATING_TEXTS = 30;

/** フロート方向の最大Y移動量（px） */
const FLOAT_DISTANCE = 30;

/**
 * テキストの表示位置・透明度・スケールを算出する
 */
export function getTextPosition(
  text: FloatingText,
  now: number
): { x: number; y: number; alpha: number; scale: number } {
  const elapsed = now - text.startTime;
  const progress = Math.min(1.0, elapsed / text.duration);

  // イージング付き上方向フロート（緩やかに減速）
  const floatY = -FLOAT_DISTANCE * progress * (2 - progress);

  // 後半50%でフェードアウト
  const alpha = progress < 0.5 ? 1.0 : 1.0 - (progress - 0.5) * 2;

  // CRITICALのみスケール変動
  const scale =
    text.type === FloatingTextType.CRITICAL
      ? 1.0 + 0.3 * Math.sin(progress * Math.PI)
      : 1.0;

  return { x: text.x, y: text.y + floatY, alpha: Math.max(0, alpha), scale };
}

/**
 * フローティングテキストマネージャー
 *
 * テキストの追加・更新・描画を管理する。
 */
export class FloatingTextManager {
  private texts: FloatingText[] = [];

  /**
   * テキストを追加する
   */
  addText(
    text: string,
    x: number,
    y: number,
    type: FloatingTextTypeValue,
    now: number
  ): void {
    const config = FLOATING_TEXT_CONFIGS[type];
    this.texts.push({
      text,
      x,
      y,
      startTime: now,
      duration: config.duration,
      color: config.color,
      fontSize: config.fontSize,
      type,
    });

    // 上限を超えた場合、古いテキストから削除
    while (this.texts.length > MAX_FLOATING_TEXTS) {
      this.texts.shift();
    }
  }

  /**
   * 期限切れテキストを除去する
   */
  update(now: number): void {
    this.texts = this.texts.filter(
      (t) => now - t.startTime < t.duration
    );
  }

  /**
   * 全テキストを描画する
   *
   * @param ctx - Canvas コンテキスト
   * @param now - 現在時刻（ms）
   * @param toScreen - 座標変換関数（タイル座標→スクリーン座標、省略時はそのまま使用）
   */
  draw(
    ctx: CanvasRenderingContext2D,
    now: number,
    toScreen?: (x: number, y: number) => { x: number; y: number }
  ): void {
    for (const text of this.texts) {
      const pos = getTextPosition(text, now);
      if (pos.alpha <= 0) continue;

      // 座標変換（タイル座標→スクリーン座標）
      const screen = toScreen ? toScreen(pos.x, pos.y) : { x: pos.x, y: pos.y };
      const { alpha, scale } = pos;
      const { x, y } = screen;

      const fontSize = text.fontSize * scale;

      ctx.save();
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.globalAlpha = alpha;

      // アウトライン（視認性確保）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(text.text, x, y);

      // 本文
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, x, y);
      ctx.restore();
    }
  }

  /** 全テキストをクリアする */
  clear(): void {
    this.texts = [];
  }

  /** テキスト数を取得する（テスト用） */
  getTextCount(): number {
    return this.texts.length;
  }

  /** テキスト配列を取得する（テスト用） */
  getTexts(): readonly FloatingText[] {
    return this.texts;
  }
}
