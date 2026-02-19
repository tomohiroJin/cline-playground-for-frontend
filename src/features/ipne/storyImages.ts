/**
 * ストーリー画像レジストリ
 *
 * ストーリー画面・エンディング画面で使用する画像を一元管理する。
 * 初期段階ではプレースホルダー画像を返し、本番アセット準備後に差し替える。
 */

/** 画像エントリ */
export interface StoryImageEntry {
  /** 画像ソース (URL or data URI) */
  src: string;
  /** alt テキスト */
  alt: string;
  /** 表示幅 (px) */
  width: number;
  /** 表示高さ (px) */
  height: number;
}

const PLACEHOLDER_BG_COLOR = '#1a1a2e';
const PLACEHOLDER_TEXT_COLOR = '#e2e8f0';
const PLACEHOLDER_BORDER_COLOR = '#4a5568';

/** プレースホルダー画像を Canvas API で生成する */
function createPlaceholder(
  alt: string,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 背景
  ctx.fillStyle = PLACEHOLDER_BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // 枠線
  ctx.strokeStyle = PLACEHOLDER_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // テキスト
  ctx.fillStyle = PLACEHOLDER_TEXT_COLOR;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const line1 = '[画像準備中]';
  const line2 = alt;
  ctx.fillText(line1, width / 2, height / 2 - 12);
  ctx.fillText(line2, width / 2, height / 2 + 12);

  return canvas.toDataURL('image/png');
}

/** 画像定義（キー → alt, width, height） */
const IMAGE_DEFINITIONS: Record<string, { alt: string; width: number; height: number }> = {
  prologue_scene_1: { alt: '任務ブリーフィング', width: 480, height: 270 },
  prologue_scene_2: { alt: 'ダンジョン入口', width: 480, height: 270 },
  prologue_scene_3: { alt: '閉じた入口', width: 480, height: 270 },
  story_stage_1: { alt: '第一層突破', width: 480, height: 270 },
  story_stage_2: { alt: '深部への接近', width: 480, height: 270 },
  story_stage_3: { alt: '異変', width: 480, height: 270 },
  story_stage_4: { alt: '最深部へ', width: 480, height: 270 },
  story_stage_5: { alt: '封鎖解除', width: 480, height: 270 },
  game_over: { alt: '冒険の終わり', width: 480, height: 270 },
};

/** プレースホルダーキャッシュ */
const imageCache = new Map<string, StoryImageEntry>();

/**
 * 画像キーからエントリを取得する
 * @param key 画像キー
 * @returns StoryImageEntry | undefined
 */
export function getStoryImage(key: string): StoryImageEntry | undefined {
  const def = IMAGE_DEFINITIONS[key];
  if (!def) return undefined;

  const cached = imageCache.get(key);
  if (cached) return cached;

  const entry: StoryImageEntry = {
    src: createPlaceholder(def.alt, def.width, def.height),
    alt: def.alt,
    width: def.width,
    height: def.height,
  };
  imageCache.set(key, entry);
  return entry;
}

/**
 * 画像キーが登録されているか確認する
 * @param key 画像キー
 * @returns boolean
 */
export function hasStoryImage(key: string): boolean {
  return key in IMAGE_DEFINITIONS;
}
