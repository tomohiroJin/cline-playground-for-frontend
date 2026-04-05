# VS 画像 3 枚の再生成指示書

> 前回の原本が 1024x1024 正方形で、256x512（1:2 縦長）の VS フォーマットに合わなかった。
> **1:2 縦長の構図（バストアップ）で再生成する。**

## 既存の正常な VS 画像の特徴

既存の VS 画像（akira-vs, hiro-vs 等）の共通点:
- **構図**: 頭頂〜胸元のバストアップ（腰より下は映らない）
- **アスペクト比**: 1:2 縦長（256x512）
- **背景**: 白の透過済み
- **画面占有率**: キャラが画面の 80% 以上を占める（余白が少ない）
- **向き**: 正面〜やや斜め

## 共通指示

- **アスペクト比**: 必ず **1:2 縦長**（例: 512x1024, 768x1536 等）で生成すること
- **構図**: 頭頂〜胸元のバストアップ。腰より下は描かない
- **背景**: 単色の白 `#FFFFFF`（Claude Code で透過処理する）
- **テキスト**: 一切入れないこと
- **画面占有率**: キャラクターが画面の 80% 以上を占めること（余白を最小限に）

## 後処理（Claude Code で実施）

```bash
# 幅 256 にアスペクト比保持リサイズ → 上寄せ 256x512 配置 → floodfill 透過
convert input.png \
  -resize 256x \
  -background none -gravity North -extent 256x512 \
  PNG32:/tmp/_step1.png

convert /tmp/_step1.png \
  -alpha set -fuzz 10% -fill none \
  -draw "matte 0,0 floodfill" \
  -draw "matte 255,0 floodfill" \
  -draw "matte 0,255 floodfill" \
  -draw "matte 255,255 floodfill" \
  PNG32:output.png
```

---

## 1. kanata-vs.png（カナタ VS 画像）

- **保存先**: `public/assets/vs/kanata-vs.png`
- **最終サイズ**: 256x512 PNG RGBA

### プロンプト
```
anime style character portrait, close-up bust shot,
teal-haired boy, age 16,
competitive confident smirk, looking slightly to the side,
wearing dark school jacket with teal accents and teal striped tie,
teal theme color #1abc9c,
solid white background,
portrait orientation 1:2 vertical aspect ratio,
character fills 80% of the frame,
head to chest composition, no waist or legs visible,
no text, no letters, clean illustration
```

### 参考
- 既存 kanata-normal.png と同じ顔・髪型を維持
- 表情だけ「対戦相手として対峙する自信」に変更

---

## 2. riku-vs.png（リク VS 画像）

- **保存先**: `public/assets/vs/riku-vs.png`
- **最終サイズ**: 256x512 PNG RGBA

### プロンプト
```
anime style character portrait, close-up bust shot,
yellow-haired boy, age 16,
energetic confident grin, looking forward,
wearing dark school blazer with yellow accents and yellow tie,
yellow theme color #f39c12,
solid white background,
portrait orientation 1:2 vertical aspect ratio,
character fills 80% of the frame,
head to chest composition, no waist or legs visible,
no text, no letters, no decorative effects, no splash effects,
clean illustration
```

### 注意
- **装飾エフェクト（スプラッシュ等）を入れないこと**（前回のオレンジスプラッシュ問題）
- `no decorative effects, no splash effects` を明示

---

## 3. shion-vs.png（シオン VS 画像）

- **保存先**: `public/assets/vs/shion-vs.png`
- **最終サイズ**: 256x512 PNG RGBA

### プロンプト
```
anime style character portrait, close-up bust shot,
silver-haired girl, age 16,
calm observing expression with slight smirk, arms crossed at chest level,
wearing dark school blazer with silver accents,
silver theme color #bdc3c7,
solid white background,
portrait orientation 1:2 vertical aspect ratio,
character fills 80% of the frame,
head to chest composition, no waist or legs visible,
no text, no letters, clean illustration
```

### 注意
- 背景は **白** で生成（前回のグレー背景問題を回避）
- 髪色がシルバーで白に近いが、バストアップで顔が大きく描かれるため floodfill の影響は限定的
- fuzz を 5〜8% に下げて処理する

---

## チェックリスト（生成後に確認）

- [ ] アスペクト比が 1:2 縦長である（正方形でない）
- [ ] 構図がバストアップ（頭〜胸）で腰より下が映っていない
- [ ] キャラが画面の 80% 以上を占めている
- [ ] 背景が単色の白である
- [ ] テキスト・装飾エフェクトが含まれていない
- [ ] 既存 VS 画像（akira-vs, hiro-vs）と並べて違和感がない
