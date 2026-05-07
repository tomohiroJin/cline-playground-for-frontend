/**
 * Air Hockey ポートレート画像の輪郭フリンジ監査 CLI（S9-B2-1）
 *
 * 使い方:
 *   npx ts-node scripts/air-hockey/run-audit-portrait-fringe.ts
 *   or
 *   node --import @swc-node/register/esm-register scripts/air-hockey/run-audit-portrait-fringe.ts
 *
 * 純粋関数ロジックは ./audit-portrait-fringe.ts に分離済み。
 */
import { readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import sharp from 'sharp';
import { analyzePixels, type Pixel } from './audit-portrait-fringe';

async function main(): Promise<void> {
  const portraitsDir = resolve(__dirname, '../../public/assets/portraits');
  let entries: string[];
  try {
    entries = (await readdir(portraitsDir)).filter((f) => f.endsWith('.png'));
  } catch (err) {
    console.error(`portraits ディレクトリが見つかりません: ${portraitsDir}`);
    console.error(err);
    process.exit(1);
  }

  console.log('| ファイル | 境界Px | 白フリンジ% | 黒ずみ% | 判定 |');
  console.log('|---|---|---|---|---|');

  let ngCount = 0;
  for (const file of entries.sort()) {
    const filepath = join(portraitsDir, file);
    try {
      const { data, info } = await sharp(filepath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const pixels: Pixel[] = [];
      for (let i = 0; i < data.length; i += info.channels) {
        pixels.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3],
        });
      }
      const r = analyzePixels(pixels);
      if (r.verdict === 'NG') ngCount++;
      console.log(
        `| ${file} | ${r.totalEdgePixels} | ${(r.whiteRatio * 100).toFixed(2)}% | ${(r.darkenedRatio * 100).toFixed(2)}% | ${r.verdict} |`,
      );
    } catch (err) {
      console.error(`${file}: 読み込み失敗`, err);
    }
  }

  console.log('');
  console.log(`判定: ${ngCount === 0 ? '全 OK ✅' : `${ngCount} ファイルが NG ❌`}`);
  if (ngCount > 0) {
    // NG あり時に非 0 終了コードで exit（CI 活用時の判定）
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
