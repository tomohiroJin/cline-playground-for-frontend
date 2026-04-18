# Chapter 2 アセット生成プロンプト & 配置先

> スタイルガイド参照: `src/features/air-hockey/doc/world/image-style-guide.md`

## 共通スタイル指示

- アニメ調イラスト、Nanobanana2 スタイル準拠
- **背景は単色（白 `#FFFFFF` または明るいグレー `#F0F0F0`）で生成すること**
  - 透過処理は Claude Code 側で ImageMagick を使って実施する
  - グラデーション背景・複雑な背景は透過処理の精度が落ちるため避ける
- 既存キャラクターとの統一感を重視
- **画像内にテキスト（「VS」等）を描き込まないこと** — テキストはアプリ側で表示する

## 後処理手順（Claude Code で実施）

生成された画像を受け取ったら以下の手順で処理する:

1. **背景除去**: `convert input.png -fuzz 10% -transparent white output.png` で白背景を透過
2. **リサイズ**: 仕様サイズにリサイズ/トリミング
3. **配置**: 指定パスにコピー
4. **検証**: `file` コマンドで PNG RGBA + 正しいサイズを確認

---

## カナタ（白波カナタ）

### キャラアイコン（128x128 PNG RGBA）
- **保存先**: `public/assets/characters/kanata.png`
- **プロンプト**: `anime style character icon, teal-haired boy, age 16, mischievous smile, school uniform, teal theme color #1abc9c, solid white background, bust shot, clean lineart`
- **後処理**: 白背景を透過 → 128x128 にリサイズ

### ポートレート normal（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/kanata-normal.png`
- **プロンプト**: `anime style portrait, teal-haired boy, age 16, relaxed confident expression, school uniform with teal accents, half body shot, solid white background, 1:2 vertical aspect ratio`
- **後処理**: 白背景を透過 → 512x1024 にリサイズ（縦長 1:2）

### ポートレート happy（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/kanata-happy.png`
- **プロンプト**: `anime style portrait, teal-haired boy, age 16, playful laughing expression, school uniform with teal accents, half body shot, solid white background, 1:2 vertical aspect ratio`
- **後処理**: 白背景を透過 → 512x1024 にリサイズ

### VS 画像（256x512 PNG RGBA）
- **保存先**: `public/assets/vs/kanata-vs.png`
- **プロンプト**: `anime style portrait, teal-haired boy, age 16, competitive smirk, dynamic pose, teal theme color #1abc9c, solid white background, 1:2 vertical aspect ratio, no text`
- **後処理**: 白背景を透過 → 256x512 にリサイズ

---

## リク（風早リク）

### キャラアイコン（128x128 PNG RGBA）
- **保存先**: `public/assets/characters/riku.png`
- **プロンプト**: `anime style character icon, yellow-haired boy, age 16, energetic confident expression, school uniform, yellow theme color #f39c12, solid white background, bust shot, clean lineart`
- **後処理**: 白背景を透過 → 128x128 にリサイズ

### ポートレート normal（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/riku-normal.png`
- **プロンプト**: `anime style portrait, yellow-haired boy, age 16, determined expression, athletic build, school uniform with yellow accents, half body shot, solid white background, 1:2 vertical aspect ratio`
- **後処理**: 白背景を透過 → 512x1024 にリサイズ

### ポートレート happy（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/riku-happy.png`
- **プロンプト**: `anime style portrait, yellow-haired boy, age 16, excited victory expression, athletic build, school uniform with yellow accents, half body shot, solid white background, 1:2 vertical aspect ratio`
- **後処理**: 白背景を透過 → 512x1024 にリサイズ

### VS 画像（256x512 PNG RGBA）
- **保存先**: `public/assets/vs/riku-vs.png`
- **プロンプト**: `anime style portrait, yellow-haired boy, age 16, dynamic running pose, yellow theme color #f39c12, solid white background, 1:2 vertical aspect ratio, no text`
- **後処理**: 白背景を透過 → 256x512 にリサイズ

---

## シオン（朝霧シオン）

### キャラアイコン（128x128 PNG RGBA）
- **保存先**: `public/assets/characters/shion.png`
- **プロンプト**: `anime style character icon, silver-haired girl, age 16, calm analytical expression, school uniform, silver theme color #bdc3c7, solid white background, bust shot, clean lineart`
- **後処理**: 白背景を透過 → 128x128 にリサイズ

### ポートレート normal（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/shion-normal.png`
- **プロンプト**: `anime style portrait, silver-haired girl, age 16, cool composed expression, intellectual aura, school uniform with silver accents, half body shot, solid white background, 1:2 vertical aspect ratio`
- **後処理**: 白背景を透過 → 512x1024 にリサイズ

### ポートレート happy（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/shion-happy.png`
- **プロンプト**: `anime style portrait, silver-haired girl, age 16, subtle interested smile, intellectual aura, school uniform with silver accents, half body shot, solid white background, 1:2 vertical aspect ratio`
- **後処理**: 白背景を透過 → 512x1024 にリサイズ

### VS 画像（256x512 PNG RGBA）
- **保存先**: `public/assets/vs/shion-vs.png`
- **プロンプト**: `anime style portrait, silver-haired girl, age 16, observing pose with crossed arms, silver theme color #bdc3c7, solid white background, 1:2 vertical aspect ratio, no text`
- **後処理**: 白背景を透過 → 256x512 にリサイズ

---

## 大会会場背景

### 背景画像（450x900 WebP）
- **保存先**: `public/assets/backgrounds/bg-tournament.webp`
- **プロンプト**: `anime style interior, large school gymnasium converted to air hockey tournament venue, banners and scoreboards, crowd silhouettes, dramatic lighting, warm golden tones, vertical composition, 1:2 aspect ratio`
- **後処理**: 450x900 にリサイズ → WebP に変換（`convert input.png -resize 450x900! output.webp`）
- **注意**: 背景画像は透過不要。既存背景（bg-gym 等）は全て **450x900（1:2 縦長）**

---

## VictoryCutIn Chapter 2

### カットイン画像
- **保存先**: `public/assets/cutins/victory-ch2.png`
- **参照**: `getVictoryCutInUrl(2)` → `/assets/cutins/victory-ch2.png`
- **プロンプト**: `anime style celebration scene, air hockey tournament victory, gold trophy, confetti, warm golden lighting, achievement atmosphere, wide composition`
- **後処理**: 既存 `victory-ch1.png` と同じサイズにリサイズ

---

## デザインレビュー指摘事項（2026-04-05）

### 生成時の注意

| # | 指摘 | 対策 |
|---|------|------|
| MF-1 | JPEG で生成された（透過不可） | **白背景で生成** → Claude Code で透過処理 |
| MF-2 | 全画像が 1024x1024 正方形 | Claude Code でリサイズ/トリミング |
| MF-3 | ポートレートに背景が描き込まれた | `solid white background` を明示指定 |
| R-1 | VS 画像に「VS」テキストが含まれた | `no text` を明示指定 |
| R-2 | 背景サイズが 1200x600（横長）だった | 既存背景に合わせ **450x900（1:2 縦長）** に修正 |

### シオンの髪色に関する注意

シオンのテーマカラー `#bdc3c7`（シルバー）は白背景と近いため、透過処理で髪の輪郭が欠ける可能性がある。
シオンのみ `solid light gray background #E0E0E0` に変更し、fuzz 値を調整して処理すること。

```bash
# シオンの透過処理（グレー背景用）
convert shion.png -fuzz 15% -transparent '#E0E0E0' shion-transparent.png
```
