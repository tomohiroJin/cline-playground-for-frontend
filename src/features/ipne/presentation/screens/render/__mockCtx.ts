/**
 * 描画コマンド列を記録するモック CanvasRenderingContext2D と SpriteRenderer（Phase D-1 特性化用）
 *
 * 主要メソッドの呼び出し名・引数と主要プロパティ代入を順に records へ積む。
 * SpriteRenderer の drawSprite 等も同一 records に積み、描画シーケンス全体を捕捉する。
 * NOTE: Phase D-1 完了後に本ファイルとスナップショットを削除する。
 */
import type { SpriteRenderer } from '../../sprites';

export interface DrawCall {
  op: string;
  args: unknown[];
}

const sanitize = (a: unknown): unknown => {
  if (a && typeof a === 'object') {
    const name = (a as { constructor?: { name?: string } }).constructor?.name;
    return `[${name ?? 'object'}]`;
  }
  return a;
};

export function createRecordingCtx(): { ctx: CanvasRenderingContext2D; records: DrawCall[] } {
  const records: DrawCall[] = [];
  const methods = [
    'save', 'restore', 'translate', 'setTransform', 'resetTransform', 'scale', 'rotate',
    'fillRect', 'strokeRect', 'clearRect', 'beginPath', 'closePath', 'moveTo', 'lineTo',
    'arc', 'ellipse', 'rect', 'fill', 'stroke', 'clip', 'fillText', 'strokeText',
    'drawImage', 'createLinearGradient', 'createRadialGradient', 'measureText',
    'setLineDash', 'putImageData', 'getImageData', 'createImageData', 'quadraticCurveTo', 'bezierCurveTo',
  ];
  const props = [
    'fillStyle', 'strokeStyle', 'globalAlpha', 'lineWidth', 'font',
    'textAlign', 'textBaseline', 'globalCompositeOperation',
    'shadowBlur', 'shadowColor', 'lineCap', 'lineJoin',
  ];
  const target: Record<string, unknown> = {};
  for (const m of methods) {
    target[m] = (...args: unknown[]) => {
      records.push({ op: m, args: args.map(sanitize) });
      if (m === 'measureText') return { width: 0 } as TextMetrics;
      if (m === 'createLinearGradient' || m === 'createRadialGradient') return { addColorStop: () => {} };
      if (m === 'getImageData' || m === 'createImageData') return { data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData;
      return undefined;
    };
  }
  for (const p of props) {
    let v: unknown;
    Object.defineProperty(target, p, {
      get: () => v,
      set: (nv: unknown) => {
        v = nv;
        records.push({ op: `set:${p}`, args: [sanitize(nv)] });
      },
    });
  }
  return { ctx: target as unknown as CanvasRenderingContext2D, records };
}

/** drawSprite 等の呼び出しを records に記録する SpriteRenderer スパイ */
export function createRecordingSpriteRenderer(records: DrawCall[]): SpriteRenderer {
  const rec = (op: string) => (...args: unknown[]) => {
    // 第1引数の ctx は除外し、スプライト識別・座標・scale を記録
    records.push({ op: `sprite:${op}`, args: args.slice(1).map(sanitize) });
  };
  return {
    drawSprite: rec('drawSprite'),
    drawAnimatedSprite: rec('drawAnimatedSprite'),
    drawSpriteWithAlpha: rec('drawSpriteWithAlpha'),
    clearCache: () => {},
  } as unknown as SpriteRenderer;
}
