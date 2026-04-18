# VS 画像 3 枚の再生成指示書（v2）

> 前回の指示では正方形で生成されてしまい、1:2 縦長のフォーマットに合わなかった。
> 今回は **既存の正常な VS 画像を具体的に参考にして**、同じテイストで生成する。

---

## 既存 VS 画像の分析（これに合わせて生成する）

既存の VS 画像（akira-vs, hiro-vs, misaki-vs, takuma-vs, ace-vs）には以下の共通点がある:

### 構図
- **画角**: 頭頂〜腰（ベルト付近）まで。膝や足は映らない
- **体の占有率**: 画面の 85〜90% をキャラクターが占める。余白が非常に少ない
- **視点**: 正面〜やや斜め。カメラはキャラの胸の高さ

### 服装
- 全キャラが **スポーツウェア / 部活ユニフォーム**（学校の制服ではない）
- 各キャラのテーマカラーのスポーツシャツ
- 襟付き V ネックまたはクルーネックの半袖シャツ

### ポーズ
- 自然な立ちポーズ（激しいアクションポーズではない）
- 腕組み、腰に手を当てる、軽く構える 等
- 両腕がフレーム内に収まっている

### 画風
- クリーンなアニメ調イラスト
- 太めの輪郭線（アウトライン）
- フラットな塗りに軽い影
- 背景なし（白背景 → 透過処理済み）

### サイズ
- **256 x 512 ピクセル（1:2 縦長）**
- PNG、RGBA（背景透過）

---

## 重要: 生成時の注意事項

1. **画像サイズを 512 x 1024（または 768 x 1536）で生成すること**
   - AI ツールが正方形を出す場合は、生成設定で明示的に縦長を選択する
   - 正方形でしか生成できない場合は、**その旨を伝えてください**（Claude Code 側で対応を検討します）

2. **背景は必ず単色の白 `#FFFFFF`** にすること（Claude Code 側で透過処理する）

3. **テキスト・装飾・エフェクトは一切入れない**

4. **制服（ブレザー・ネクタイ）ではなく、スポーツウェアを着せる**

---

## 1. kanata-vs.png（カナタ VS 画像）

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
solid white background,
tall vertical format,
no text, no effects, no decorations
```

### キャラの特徴メモ
- 髪: ティール（青緑）、やや長めで無造作
- 表情: いたずらっぽい自信のある笑み
- テーマカラー: #1abc9c
- 性格: 飄々としたトリックスター

---

## 2. riku-vs.png（リク VS 画像）

- **保存先**: `public/assets/vs/riku-vs.png`
- **最終サイズ**: 256x512 PNG RGBA

### プロンプト
```
anime style character illustration, clean lineart, flat coloring with soft shadows,
yellow-haired boy, age 16, energetic confident grin,
wearing yellow colored v-neck sports shirt with dark trim,
natural standing pose with hands on hips,
head to waist composition, no legs visible,
character fills 90% of the frame,
solid white background,
tall vertical format,
no text, no effects, no decorations, no splash effects
```

### キャラの特徴メモ
- 髪: 金髪、逆立った跳ねた髪
- 表情: エネルギッシュで自信満々の笑顔
- テーマカラー: #f39c12
- 性格: スピード自慢、素直で負けず嫌い

---

## 3. shion-vs.png（シオン VS 画像）

- **保存先**: `public/assets/vs/shion-vs.png`
- **最終サイズ**: 256x512 PNG RGBA

### プロンプト
```
anime style character illustration, clean lineart, flat coloring with soft shadows,
silver-haired girl, age 16, calm analytical expression with slight smirk,
wearing dark navy sports shirt with silver-gray trim,
arms crossed at chest level, natural standing pose,
head to waist composition, no legs visible,
character fills 90% of the frame,
solid white background,
tall vertical format,
no text, no effects, no decorations
```

### キャラの特徴メモ
- 髪: シルバー（銀色）、肩につくボブ
- 表情: 冷静な観察者の目、わずかな笑み
- テーマカラー: #bdc3c7
- 性格: 分析的、冷静、好奇心

### シオン専用の注意
- 服装を **暗い紺色（dark navy）** にすること（白/グレー系だと透過処理で服が消える）
- 髪色がシルバーで白に近いので、背景との境界が明確になるよう輪郭線を太めに

---

## 後処理手順（Claude Code で実施）

ポートレートと同じく **元画像で先に透過処理 → その後リサイズ** の順で処理する。

### 1:2 縦長で生成された場合（例: 512x1024）

```bash
# Step 1: 元画像のまま透過処理
convert input.png \
  -alpha set -fuzz 10% -fill none \
  -draw "matte 0,0 floodfill" \
  -draw "matte 511,0 floodfill" \
  -draw "matte 0,1023 floodfill" \
  -draw "matte 511,1023 floodfill" \
  -draw "matte 511,300 floodfill" \
  -draw "matte 511,500 floodfill" \
  -draw "matte 511,700 floodfill" \
  -draw "matte 0,300 floodfill" \
  -draw "matte 0,500 floodfill" \
  -draw "matte 0,700 floodfill" \
  PNG32:/tmp/_transparent.png

# Step 2: 256x512 にリサイズ
convert /tmp/_transparent.png -resize 256x512 PNG32:output.png
```

シオンの場合は fuzz を 5% に下げる。

### 正方形で生成された場合のフォールバック（例: 1024x1024）

ポートレートで確立した「元画像で透過 → 中央クロップ」方式で処理する。

```bash
# Step 1: 元画像（1024x1024）のまま透過処理
convert input.png \
  -alpha set -fuzz 10% -fill none \
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
  PNG32:/tmp/_transparent.png

# Step 2: 中央から 512x1024 をクロップ
convert /tmp/_transparent.png \
  -gravity Center -crop 512x1024+0+0 +repage \
  PNG32:/tmp/_cropped.png

# Step 3: 256x512 にリサイズ
convert /tmp/_cropped.png -resize 256x512 PNG32:output.png
```

---

## 参考画像の活用

AI 画像生成ツールが参考画像（img2img）に対応している場合、既存の VS 画像を入力すると構図の再現精度が上がる。

推奨する参考画像:
- `public/assets/vs/akira-vs.png` — 標準的なバストアップ構図
- `public/assets/vs/takuma-vs.png` — 腕組みポーズの参考（シオン用）
- `public/assets/vs/misaki-vs.png` — 女性キャラの参考（シオン用）

---

## 生成後のチェックリスト

- [ ] 画像が縦長（1:2 に近い）で生成されている（正方形ではない）
- [ ] 構図が頭〜腰のバストアップである（全身や顔だけではない）
- [ ] キャラが画面の 85% 以上を占めている
- [ ] 服装がスポーツウェアである（制服・ブレザーではない）
- [ ] 背景が単色の白である（グラデーションや装飾なし）
- [ ] テキスト・エフェクトが含まれていない
- [ ] 正方形でしか生成できた場合 → フォールバック手順で後処理可能
