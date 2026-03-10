# キャラクターアイコン画像プロンプト設計

## 配置先・ファイル名一覧

**ディレクトリ**: `public/assets/characters/`

| ファイル名 | キャラ名 | 用途 | サイズ |
|-----------|---------|------|--------|
| `akira.png` | アキラ（主人公） | ダイアログ、VS画面 | 128x128px |
| `hiro.png` | ヒロ（ステージ1-1） | ダイアログ、VS画面、ステージ選択 | 128x128px |
| `misaki.png` | ミサキ（ステージ1-2） | 同上 | 128x128px |
| `takuma.png` | タクマ（ステージ1-3） | 同上 | 128x128px |
| `rookie.png` | ルーキー（Easy） | フリー対戦 | 128x128px |
| `regular.png` | レギュラー（Normal） | フリー対戦 | 128x128px |
| `ace.png` | エース（Hard） | フリー対戦 | 128x128px |

**コード内の参照パス**: `/assets/characters/<ファイル名>`（`characters.ts` の `icon` フィールド）

> 現在プレースホルダー画像が配置済み。上記ファイル名で正式画像に差し替えてください。

---

## 共通プロンプト要素

### アートスタイル
- anime style character portrait
- chibi / super deformed proportions (head-to-body ratio 1:1.5)
- clean line art, cel-shaded coloring
- bright, vivid colors
- simple background (solid color or transparent)
- facing slightly to the side (3/4 view)
- bust shot (head and upper shoulders)

### 出力仕様
- Size: 128x128 pixels（表示時は 64x64px に縮小、Retina 対応）
- Format: PNG with transparent background
- Style consistency: all characters must be generated in the same session

### ネガティブプロンプト（避ける要素）
- realistic, photorealistic
- dark, gloomy atmosphere
- complex backgrounds
- full body shot
- text, watermark
- blurry, low quality

---

## キャラクター別プロンプト

### アキラ（主人公）
- **ファイル名**: `akira.png`
- **外見**: 黒髪ショート、茶色い目、白いスポーツウェア + 青いライン
- **表情**: 自信に満ちた笑顔、やる気のある目
- **カラー**: 白 + 青（#3498db）

#### プロンプト
```
anime style chibi character portrait, young boy with short black hair,
brown eyes, confident smile, wearing white sports jersey with blue trim,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

### ヒロ（ステージ1-1）
- **ファイル名**: `hiro.png`
- **外見**: 茶髪の短髪（少しハネた髪型）、緑色の目、オレンジ色のスポーツウェア
- **表情**: 明るくフレンドリーな笑顔
- **カラー**: オレンジ（#e67e22）

#### プロンプト
```
anime style chibi character portrait, young boy with short messy brown hair,
green eyes, bright friendly smile, wearing orange sports jersey,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

### ミサキ（ステージ1-2）
- **ファイル名**: `misaki.png`
- **外見**: 紫がかった黒髪のポニーテール、紫色の目、紫のスポーツウェア
- **表情**: 知的で少しいたずらっぽい微笑み
- **カラー**: 紫（#9b59b6）

#### プロンプト
```
anime style chibi character portrait, young girl with purple-black ponytail hair,
purple eyes, smart mischievous smile, wearing purple sports jersey,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

### タクマ（ステージ1-3）
- **ファイル名**: `takuma.png`
- **外見**: 黒髪の短いオールバック、鋭い赤茶色の目、赤いスポーツウェア
- **表情**: 厳しくも威厳のある表情
- **カラー**: 赤（#c0392b）

#### プロンプト
```
anime style chibi character portrait, young man with short slicked-back black hair,
sharp reddish-brown eyes, stern dignified expression, wearing red sports jersey,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

### ルーキー（フリー対戦 Easy）
- **ファイル名**: `rookie.png`
- **外見**: 金髪のぼさぼさ髪、青い目、緑のスポーツウェア
- **表情**: おっとりした笑顔
- **カラー**: 赤（#e74c3c）

#### プロンプト
```
anime style chibi character portrait, young boy with messy blonde hair,
blue eyes, gentle easygoing smile, wearing green sports jersey,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

### レギュラー（フリー対戦 Normal）
- **ファイル名**: `regular.png`
- **外見**: 茶髪のスポーツ刈り、茶色い目、青のスポーツウェア
- **表情**: 真剣だが親しみやすい表情
- **カラー**: 赤（#e74c3c）

#### プロンプト
```
anime style chibi character portrait, young boy with short brown crew cut hair,
brown eyes, serious but friendly expression, wearing blue sports jersey,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

### エース（フリー対戦 Hard）
- **ファイル名**: `ace.png`
- **外見**: 銀髪のウルフカット、灰色の目、黒のスポーツウェア + 赤いライン
- **表情**: クールで自信に満ちた表情
- **カラー**: 赤（#e74c3c）

#### プロンプト
```
anime style chibi character portrait, young man with silver wolf-cut hair,
gray eyes, cool confident expression, wearing black sports jersey with red trim,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```
