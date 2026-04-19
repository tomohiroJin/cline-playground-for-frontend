/**
 * Air Hockey ポートレート画像の輪郭近傍フリンジ監査スクリプト（S9-B2-1）
 *
 * - public/assets/portraits/*.png を走査
 * - 境界ピクセル（0 < alpha < 255）の中で白フリンジ（R/G/B >= 240）と
 *   黒ずみ（R+G+B < 60）の割合を計測
 * - 白フリンジ率 / 黒ずみ率のいずれかが 2% を超えると NG 判定
 *
 * 使い方: `npx ts-node scripts/air-hockey/audit-portrait-fringe.ts`
 * テストは scripts/__tests__/audit-portrait-fringe.test.ts（純粋関数のみ）
 */

export type Pixel = { r: number; g: number; b: number; a: number };

/** 半透明境界ピクセル判定（完全透明・完全不透明は除外） */
export const isEdgePixel = (alpha: number): boolean => alpha > 0 && alpha < 255;

/** 白フリンジ判定（R/G/B 全て 240 以上） */
export const isWhiteFringe = (p: Pixel): boolean =>
  p.r >= 240 && p.g >= 240 && p.b >= 240;

/** 黒ずみ判定（R+G+B の総和が 60 未満） */
export const isDarkened = (p: Pixel): boolean =>
  p.r + p.g + p.b < 60;

const THRESHOLD_PERCENT = 0.02;

export type AuditResult = {
  totalEdgePixels: number;
  whiteFringeCount: number;
  darkenedCount: number;
  whiteRatio: number;
  darkenedRatio: number;
  verdict: 'OK' | 'NG';
};

/** ピクセル配列を走査して監査結果を返す（純粋関数） */
export function analyzePixels(pixels: Pixel[]): AuditResult {
  let totalEdgePixels = 0;
  let whiteFringeCount = 0;
  let darkenedCount = 0;

  for (const p of pixels) {
    if (!isEdgePixel(p.a)) continue;
    totalEdgePixels++;
    if (isWhiteFringe(p)) whiteFringeCount++;
    if (isDarkened(p)) darkenedCount++;
  }

  const whiteRatio = totalEdgePixels > 0 ? whiteFringeCount / totalEdgePixels : 0;
  const darkenedRatio = totalEdgePixels > 0 ? darkenedCount / totalEdgePixels : 0;
  const verdict: 'OK' | 'NG' =
    whiteRatio >= THRESHOLD_PERCENT || darkenedRatio >= THRESHOLD_PERCENT ? 'NG' : 'OK';

  return {
    totalEdgePixels,
    whiteFringeCount,
    darkenedCount,
    whiteRatio,
    darkenedRatio,
    verdict,
  };
}

/**
 * CLI エントリポイント（PNG 実ファイルを読み込んで監査）
 *
 * Node.js 実行時のみ動作。Jest テストでは呼ばれない。
 * PNG 読み込みは軽量な画素走査のため、sharp や node-canvas が必要。
 * 実運用では以下のコマンドで実行:
 *   npx ts-node scripts/air-hockey/audit-portrait-fringe.ts
 */
async function main(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = await import('node:fs/promises');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = await import('node:path');

  const portraitsDir = path.resolve(__dirname, '../../public/assets/portraits');
  let entries: string[];
  try {
    entries = (await fs.readdir(portraitsDir)).filter(f => f.endsWith('.png'));
  } catch (err) {
    console.error(`portraits ディレクトリが見つかりません: ${portraitsDir}`, err);
    process.exit(1);
    return;
  }

  console.log('| ファイル | 境界Px | 白% | 黒% | 判定 |');
  console.log('|---|---|---|---|---|');

  for (const file of entries) {
    const filepath = path.join(portraitsDir, file);
    try {
      // sharp が利用可能な場合に使用（未インストールなら警告のみ）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sharp: any;
      try {
        sharp = (await import('sharp')).default;
      } catch {
        console.log(`| ${file} | - | - | - | (sharp 未インストール) |`);
        continue;
      }
      const { data, info } = await sharp(filepath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const pixels: Pixel[] = [];
      for (let i = 0; i < data.length; i += info.channels) {
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
      }
      const r = analyzePixels(pixels);
      console.log(`| ${file} | ${r.totalEdgePixels} | ${(r.whiteRatio * 100).toFixed(2)}% | ${(r.darkenedRatio * 100).toFixed(2)}% | ${r.verdict} |`);
    } catch (err) {
      console.error(`${file}: 読み込み失敗`, err);
    }
  }
}

// 直接実行時のみ main を呼び出す
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
