# Portrait フリンジ監査結果（S9-B2-1）

> 実行日: 2026-04-19
> コマンド: `npm run audit:portrait`
> スクリプト: `scripts/air-hockey/run-audit-portrait-fringe.ts`

## 判定結果（閾値: 白フリンジ 2% / 黒ずみ 2%）

| ファイル | 境界Px | 白フリンジ% | 黒ずみ% | 判定 |
|---|---|---|---|---|
| ace-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| ace-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| akira-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| akira-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| hiro-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| hiro-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| **kanata-happy.png** | 7828 | 0.08% | **19.15%** | ❌ NG |
| **kanata-normal.png** | 6731 | 0.00% | **24.54%** | ❌ NG |
| misaki-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| misaki-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| regular-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| regular-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| **riku-happy.png** | 7292 | 0.00% | **78.74%** | ❌ NG |
| **riku-normal.png** | 7760 | 0.04% | **36.55%** | ❌ NG |
| rookie-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| rookie-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| **shion-happy.png** | 3261 | 0.67% | **12.08%** | ❌ NG |
| **shion-normal.png** | 6733 | 0.06% | **48.39%** | ❌ NG |
| takuma-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| takuma-normal.png | 0 | 0.00% | 0.00% | ✅ OK |
| yuu-happy.png | 0 | 0.00% | 0.00% | ✅ OK |
| yuu-normal.png | 0 | 0.00% | 0.00% | ✅ OK |

**判定: 22 ファイル中 6 ファイル NG** ❌（全て第 2 章新キャラ: kanata / riku / shion）

## 分析

- **第 1 章キャラ（8 名）** は境界ピクセル 0 で OK — 過去の FB-4 修正で 2 値化済み（アンチエイリアス無し）
- **第 2 章新キャラ（3 名）** は境界ピクセル 3000〜8000 で半透明エッジが残っている
  - 特に **黒ずみ率** が高い（12〜79%）。クロマキー変換時のエッジ暗化が未処理
  - 白フリンジ率は全体的に低い（< 1%）→ 白フリンジ対策は既に効いている

## 次の手動作業（S9-B2-2）

NG 判定の 6 ファイルに対して、以下のいずれかの処理を適用:

### オプション A: ImageMagick でエッジ 2 値化（推奨）

既存 FB-4 と同じ方針で、半透明ピクセルを 2 値化する:

```bash
# riku/kanata/shion の 6 ファイルに対して実行
for f in kanata-happy kanata-normal riku-happy riku-normal shion-happy shion-normal; do
  magick public/assets/portraits/${f}.png \
    -channel A -threshold 50% +channel \
    public/assets/portraits/${f}.png
done
```

### オプション B: imagesorcery で黒ずみを明度補正

半透明の暗いエッジを明るく持ち上げる（画像のエッジ柔らかさを維持）。

### オプション C: Nanobanana2 で再生成

第 1 章時と同じ後処理パイプラインで再生成・再変換。

## 処理後の再検証

```bash
npm run audit:portrait
# 全ファイルが OK になるまで繰り返し
```
