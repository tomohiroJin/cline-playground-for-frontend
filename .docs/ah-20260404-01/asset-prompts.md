# Chapter 2 アセット生成プロンプト & 配置先

> ダミー画像は ImageMagick で生成済み。本番画像は AI 画像生成ツールで差し替え。
> スタイルガイド参照: `src/features/air-hockey/doc/world/image-style-guide.md`

## 共通スタイル指示

- アニメ調イラスト、Nanobanana2 スタイル準拠
- 背景透過（PNG、RGBA）
- 既存キャラクターとの統一感を重視

---

## カナタ（白波カナタ）

### キャラアイコン（128x128 PNG）
- **保存先**: `public/assets/characters/kanata.png`
- **プロンプト**: `anime style character icon, teal-haired boy, age 16, mischievous smile, school uniform, teal theme color #1abc9c, transparent background, 128x128, clean lineart`

### ポートレート normal（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/kanata-normal.png`
- **プロンプト**: `anime style portrait, teal-haired boy, age 16, relaxed confident expression, school uniform with teal accents, half body shot, transparent background, 512x1024`

### ポートレート happy（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/kanata-happy.png`
- **プロンプト**: `anime style portrait, teal-haired boy, age 16, playful laughing expression, school uniform with teal accents, half body shot, transparent background, 512x1024`

### VS 画像（256x512 PNG RGBA）
- **保存先**: `public/assets/vs/kanata-vs.png`
- **プロンプト**: `anime style VS screen portrait, teal-haired boy, age 16, competitive smirk, dynamic pose, teal theme color #1abc9c, transparent background, 256x512`

---

## リク（風早リク）

### キャラアイコン（128x128 PNG）
- **保存先**: `public/assets/characters/riku.png`
- **プロンプト**: `anime style character icon, yellow-haired boy, age 16, energetic confident expression, school uniform, yellow theme color #f39c12, transparent background, 128x128, clean lineart`

### ポートレート normal（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/riku-normal.png`
- **プロンプト**: `anime style portrait, yellow-haired boy, age 16, determined expression, athletic build, school uniform with yellow accents, half body shot, transparent background, 512x1024`

### ポートレート happy（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/riku-happy.png`
- **プロンプト**: `anime style portrait, yellow-haired boy, age 16, excited victory expression, athletic build, school uniform with yellow accents, half body shot, transparent background, 512x1024`

### VS 画像（256x512 PNG RGBA）
- **保存先**: `public/assets/vs/riku-vs.png`
- **プロンプト**: `anime style VS screen portrait, yellow-haired boy, age 16, speed lines background effect, dynamic running pose, yellow theme color #f39c12, transparent background, 256x512`

---

## シオン（朝霧シオン）

### キャラアイコン（128x128 PNG）
- **保存先**: `public/assets/characters/shion.png`
- **プロンプト**: `anime style character icon, silver-haired girl, age 16, calm analytical expression, school uniform, silver theme color #bdc3c7, transparent background, 128x128, clean lineart`

### ポートレート normal（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/shion-normal.png`
- **プロンプト**: `anime style portrait, silver-haired girl, age 16, cool composed expression, intellectual aura, school uniform with silver accents, half body shot, transparent background, 512x1024`

### ポートレート happy（512x1024 PNG RGBA）
- **保存先**: `public/assets/portraits/shion-happy.png`
- **プロンプト**: `anime style portrait, silver-haired girl, age 16, subtle interested smile, intellectual aura, school uniform with silver accents, half body shot, transparent background, 512x1024`

### VS 画像（256x512 PNG RGBA）
- **保存先**: `public/assets/vs/shion-vs.png`
- **プロンプト**: `anime style VS screen portrait, silver-haired girl, age 16, observing pose with crossed arms, silver theme color #bdc3c7, transparent background, 256x512`

---

## 大会会場背景

### 背景画像（1200x600 WebP）
- **保存先**: `public/assets/backgrounds/bg-tournament.webp`
- **プロンプト**: `anime style interior, large school gymnasium converted to air hockey tournament venue, banners and scoreboards, crowd silhouettes, dramatic lighting, warm golden tones, wide shot, 1200x600`

---

## VictoryCutIn Chapter 2

### カットイン画像（既存 Chapter 1 と同構造）
- **保存先**: 既存の VictoryCutIn コンポーネントが `getVictoryCutInUrl(chapter)` で参照
- **要確認**: `get-stage-asset-urls.ts` の実装を確認し、Chapter 2 用パスを追加する必要がある場合あり
