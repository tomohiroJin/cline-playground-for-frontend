# FB-4: カナタの画像再生成指示書

> ユーザーフィードバック FB-4: カナタの絵に白抜き透過忘れが目立つ
> 親計画: `.docs/ah-20260404-01/feedback-20260408.md`

---

## 問題

現在の `kanata-normal.png` `kanata-happy.png` で **シャツの白部分** や **輪郭周辺** に背景白が残ってしまう。原因は floodfill 透過アルゴリズムの限界:

- カナタの服装が **白いシャツ + ダークブレザー** のため、シャツの白と背景の白が連続している
- floodfill が「シャツの白」と「背景の白」を区別できず、シャツも透過される or 背景の一部が残る

## 修正方針

**生成時の対策**: シャツに **明確な色味（薄いグレー or 薄いブルー）** を持たせる、または背景を **明確な非白色** にする。

---

## 1. kanata.png（アイコン 128x128）

> ※ FB-5 と兼ねるため、デフォルメ化と同時に対応する場合は `asset-prompts-fb5-icons.md` を参照

このファイルでは「ポートレートと VS 画像のみ」を対象とする。

---

## 2. kanata-normal.png（ポートレート 512x1024）

- **保存先**: `public/assets/portraits/kanata-normal.png`
- **最終サイズ**: 512x1024 PNG RGBA
- **生成時のサイズ**: 1024x1024 (正方形) で OK（後処理で中央クロップ）

### プロンプト
```
anime style portrait illustration, clean lineart, soft cel shading,
teal-haired boy, age 16, relaxed confident expression with slight smirk,
wearing dark navy school blazer with teal accents over a light blue shirt,
green-and-teal striped tie,
half body shot with hands clasped at waist,
character fills 90% of the frame,
solid bright pink background #FFC0CB,
1:1 square format,
no text, no decorations
```

### 重要ポイント
- **シャツの色を「薄い水色 (light blue)」に明示**: 背景透過時に白として誤検出されないように
- **背景を「鮮やかなピンク #FFC0CB」に変更**: 髪色（ティール）・肌色・服装（ネイビー/ライトブルー）と完全に異なる色相にしてピクセル分離を容易に
- 既存 `kanata-normal.png` の構図とほぼ同じだが、シャツ色と背景色のみ変更

### 後処理（Claude Code 側で実施）
```bash
# Step 1: 元画像（1024x1024）でピンク背景を透過
convert input.png \
  -alpha set -fuzz 15% -fill none \
  -draw "matte 0,0 floodfill" \
  -draw "matte 1023,0 floodfill" \
  -draw "matte 0,1023 floodfill" \
  -draw "matte 1023,1023 floodfill" \
  -draw "matte 1023,300 floodfill" \
  -draw "matte 1023,500 floodfill" \
  -draw "matte 1023,700 floodfill" \
  -draw "matte 0,300 floodfill" \
  -draw "matte 0,500 floodfill" \
  -draw "matte 0,700 floodfill" \
  PNG32:/tmp/_trans.png

# Step 2: 中央 512x1024 クロップ
convert /tmp/_trans.png \
  -gravity Center -crop 512x1024+0+0 +repage \
  PNG32:public/assets/portraits/kanata-normal.png
```

**fuzz を 15% に上げる理由**: ピンクの濃淡（陰の部分）も背景として除去するため。シャツが薄い水色なので fuzz 15% でも誤って透過されない。

---

## 3. kanata-happy.png（ポートレート 512x1024）

- **保存先**: `public/assets/portraits/kanata-happy.png`
- **最終サイズ**: 512x1024 PNG RGBA

### プロンプト
```
anime style portrait illustration, clean lineart, soft cel shading,
teal-haired boy, age 16, joyful laughing expression with one hand on head,
wearing dark navy school blazer with teal accents over a light blue shirt,
green-and-teal striped tie,
half body shot,
character fills 90% of the frame,
solid bright pink background #FFC0CB,
1:1 square format,
no text, no decorations
```

### 重要ポイント
- 同じ服装（ダークネイビーブレザー + 薄水色シャツ）で表情だけ変更
- 同じピンク背景

### 後処理
kanata-normal.png と同じ手順。

---

## 4. kanata-vs.png（VS 画像 256x512）

- **保存先**: `public/assets/vs/kanata-vs.png`
- **最終サイズ**: 256x512 PNG RGBA

### プロンプト
```
anime style character illustration, clean lineart, flat coloring with soft shadows,
teal-haired boy, age 16, mischievous confident smirk,
wearing teal colored v-neck sports shirt with white trim,
natural standing pose with one hand near chin,
head to waist composition, no legs visible,
character fills 90% of the frame,
solid bright pink background #FFC0CB,
1:1 square format,
no text, no effects, no decorations
```

### 重要ポイント
- VS 画像はスポーツウェア（ティール v-neck）のままで OK
- 背景のみピンクに変更

### 後処理
```bash
convert input.png \
  -alpha set -fuzz 15% -fill none \
  -draw "matte 0,0 floodfill" \
  -draw "matte 1023,0 floodfill" \
  -draw "matte 0,1023 floodfill" \
  -draw "matte 1023,1023 floodfill" \
  -draw "matte 1023,300 floodfill" \
  -draw "matte 1023,500 floodfill" \
  -draw "matte 1023,700 floodfill" \
  -draw "matte 0,300 floodfill" \
  -draw "matte 0,500 floodfill" \
  -draw "matte 0,700 floodfill" \
  PNG32:/tmp/_trans.png

# 中央 512x1024 クロップ → 256x512 リサイズ
convert /tmp/_trans.png \
  -gravity Center -crop 512x1024+0+0 +repage \
  -resize 256x512 \
  PNG32:public/assets/vs/kanata-vs.png
```

---

## 生成後のチェックリスト

- [ ] 背景がピンク #FFC0CB の単色である
- [ ] シャツの色がダークネイビー or 薄い水色である（純白ではない）
- [ ] テキスト・装飾エフェクトが含まれていない
- [ ] 1024x1024 の正方形サイズで生成されている（縦長でも可）
- [ ] 既存 `kanata-vs.png` との構図整合性（同一キャラに見える）

## 後処理後のチェックリスト

- [ ] 透過後の輪郭にピンクのフリンジが残っていない
- [ ] シャツの白い部分が透過されていない
- [ ] 顔・肌が正常に表示されている
- [ ] 既存ポートレート（hiro/misaki 等）と同等のクオリティ
