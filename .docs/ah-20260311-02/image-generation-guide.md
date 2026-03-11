# Phase 1: 画像生成ガイド

> **生成ツール**: Google Nanobanana2
> **重要制約**: Nanobanana2 は透過背景 (transparent background) を生成できない
> **対策**: キャラクター立ち絵はグリーンバック (#00FF00) で生成し、後処理で透過に変換する

---

## 目次

1. [生成ツールの制約と対策](#1-生成ツールの制約と対策)
2. [共通ルール](#2-共通ルール)
3. [立ち絵プロンプト一覧（16枚）](#3-立ち絵プロンプト一覧16枚)
4. [背景プロンプト一覧（3枚）](#4-背景プロンプト一覧3枚)
5. [勝利カットインプロンプト（1枚）](#5-勝利カットインプロンプト1枚)
6. [ユウのアイコンプロンプト（1枚）](#6-ユウのアイコンプロンプト1枚)
7. [VS画面用画像の作成手順](#7-vs画面用画像の作成手順)
8. [後処理ワークフロー](#8-後処理ワークフロー)
9. [品質チェックリスト](#9-品質チェックリスト)
10. [全アセット一覧](#10-全アセット一覧)

---

## 1. 生成ツールの制約と対策

### Nanobanana2 の制約

| 制約 | 影響 | 対策 |
|------|------|------|
| 透過背景が生成できない | 立ち絵・VS画像・カットインでキャラの背景が残る | グリーンバックで生成し後処理で除去 |
| 出力サイズの制約がある可能性 | 指定サイズ通りに出力されない場合がある | 生成後にリサイズ・トリミングで調整 |

### グリーンバック方式

**立ち絵・カットイン（キャラクターが含まれ、透過が必要な画像）** に適用する。

- **背景色**: `#00FF00`（純緑、クロマキーグリーン）
- **プロンプト指定**: `transparent background` → `solid bright green (#00FF00) chroma key background, flat uniform green backdrop`
- **ネガティブプロンプトに追加**: `green clothing, green hair, green accessories`（緑色の要素がグリーンバックに溶け込むのを防止）
- **例外**: テーマカラーが緑のキャラ（ユウ #2ecc71、ソウタ #27ae60）は **ブルーバック** `#0000FF` を使用

### グリーンバック不要な画像

| 画像種別 | 理由 |
|---------|------|
| 背景画像（backgrounds/） | 透過不要。そのまま背景として使用 |
| 勝利カットイン（cutins/） | 背景込みの一枚絵として使用。透過不要 |

---

## 2. 共通ルール

### アートスタイル

| カテゴリ | 指定 |
|---------|------|
| ジャンル | アニメスタイル / 少年漫画風 |
| 塗り | セルシェーディング（フラットな影 + ハイライト） |
| 線画 | やや太めのクリーンライン |
| 色調 | 高彩度・明るいトーン |
| 雰囲気 | 爽やか・スポーティー・前向き |

### 共通ネガティブプロンプト（全アセット）

```
realistic, photorealistic, 3D render, dark atmosphere,
gloomy, horror, gore, text, watermark, signature,
blurry, low quality, deformed, extra limbs,
overly detailed background, noise, grain
```

### 立ち絵追加ネガティブプロンプト

グリーンバックのキャラには以下も追加:

```
green clothing, green hair, green accessories, green skin,
background details, background objects, gradient background
```

ブルーバックのキャラ（ユウ、ソウタ）には以下を追加:

```
blue clothing, blue hair, blue accessories, blue skin,
background details, background objects, gradient background
```

> **注意**: ブルーバックのキャラのネガティブプロンプトでは `green clothing` 等は不要。代わりに `blue` 系を除外する。ただし、ソウタの `blue eyes` は正のプロンプトで明示的に指定しているため問題ない。

### 生成順序

1. **スタイルテスト**: アキラの normal を生成しスタイル確認
2. **立ち絵 normal**: 全8キャラの normal を一括生成（スタイル統一のため）
3. **立ち絵 happy**: 全8キャラの happy を一括生成
4. **背景**: 3枚を生成
5. **カットイン**: 1枚を生成
6. **アイコン**: ユウの 128px アイコンを生成
7. **後処理**: グリーン/ブルーバック除去 → 透過PNG変換
8. **VS画像**: 立ち絵からトリミング生成

---

## 3. 立ち絵プロンプト一覧（16枚）

### 立ち絵の共通仕様

| 項目 | 仕様 |
|------|------|
| 生成サイズ | 512 × 1024 px |
| 出力フォーマット | PNG |
| 構図 | 膝上〜全身、5.5頭身 |
| 視線 | やや正面向き（3/4 ビュー） |
| ライティング | 正面やや上からの柔らかい光 |
| 背景 | グリーンバック or ブルーバック（後処理で透過に変換） |

---

### 3-1. 蒼葉アキラ（akira）— 主人公

| 項目 | 設定 |
|------|------|
| テーマカラー | 青 #3498db |
| 背景方式 | グリーンバック #00FF00 |
| 髪型・髪色 | 黒髪ショート |
| 目の色 | 茶色 |
| 体格 | 普通（165cm） |
| 服装 | 白スポーツウェア + 青ライン |
| アクセサリー | 右手首に青いリストバンド |

#### akira-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 15, short black hair,
brown eyes, calm confident expression with slight smile,
wearing white sports jersey with blue (#3498db) trim and lines,
blue wristband on right wrist, small wind emblem on chest,
relaxed standing pose with hands at sides,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**:
```
realistic, photorealistic, 3D render, dark atmosphere,
gloomy, horror, gore, text, watermark, signature,
blurry, low quality, deformed, extra limbs,
overly detailed background, noise, grain,
green clothing, green hair, green accessories, green skin,
background details, background objects, gradient background
```

#### akira-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 15, short black hair,
brown eyes, bright joyful smile with sparkling eyes,
wearing white sports jersey with blue (#3498db) trim and lines,
blue wristband on right wrist, small wind emblem on chest,
energetic pose with right fist raised,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （akira-normal と同じ）

---

### 3-2. 日向ヒロ（hiro）— ステージ 1-1

| 項目 | 設定 |
|------|------|
| テーマカラー | オレンジ #e67e22 |
| 背景方式 | グリーンバック #00FF00 |
| 髪型・髪色 | 茶髪ショート（毛先がハネている） |
| 目の色 | 緑 |
| 体格 | やや細身（172cm） |
| 服装 | オレンジスポーツウェア |
| アクセサリー | なし |

#### hiro-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 16, short messy brown hair
with spiky ends, green eyes, bright friendly grin,
wearing orange (#e67e22) sports jersey with white accents,
small wind emblem on chest,
casual standing pose with one hand on hip,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

#### hiro-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 16, short messy brown hair
with spiky ends, green eyes, wide cheerful laugh with eyes closed,
wearing orange (#e67e22) sports jersey with white accents,
small wind emblem on chest,
excited pose with both arms raised in celebration,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

---

### 3-3. 水瀬ミサキ（misaki）— ステージ 1-2

| 項目 | 設定 |
|------|------|
| テーマカラー | 紫 #9b59b6 |
| 背景方式 | グリーンバック #00FF00 |
| 髪型・髪色 | 紫がかった黒髪ポニーテール |
| 目の色 | 紫 |
| 体格 | やや小柄（162cm） |
| 服装 | 紫スポーツウェア |
| アクセサリー | 紫のヘアゴム |

#### misaki-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young girl age 16,
purple-black hair in high ponytail, purple eyes,
smart calm expression with slight knowing smile,
wearing purple (#9b59b6) sports jersey with white accents,
purple hair tie on ponytail, small wind emblem on chest,
composed standing pose with arms crossed lightly,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

#### misaki-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young girl age 16,
purple-black hair in high ponytail, purple eyes,
playful happy smile with one eye winking,
wearing purple (#9b59b6) sports jersey with white accents,
purple hair tie on ponytail, small wind emblem on chest,
cheerful pose with index finger raised as if making a point,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

---

### 3-4. 鷹見タクマ（takuma）— ステージ 1-3

| 項目 | 設定 |
|------|------|
| テーマカラー | 赤 #c0392b |
| 背景方式 | グリーンバック #00FF00 |
| 髪型・髪色 | 黒髪オールバック |
| 目の色 | 赤茶 |
| 体格 | がっしり（180cm） |
| 服装 | 赤スポーツウェア |
| アクセサリー | 赤いヘッドバンド |

#### takuma-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young man age 17,
short slicked-back black hair, sharp reddish-brown eyes,
stern dignified expression with slight composure,
wearing red (#c0392b) sports jersey with white accents,
red headband, small wind emblem on chest,
strong standing pose with arms crossed over chest,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

#### takuma-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young man age 17,
short slicked-back black hair, sharp reddish-brown eyes,
proud satisfied smile with approving nod,
wearing red (#c0392b) sports jersey with white accents,
red headband, small wind emblem on chest,
confident pose with one fist clenched at side and thumbs up,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

---

### 3-5. 柊ユウ（yuu）— 解説役 ★ブルーバック

| 項目 | 設定 |
|------|------|
| テーマカラー | 緑 #2ecc71 |
| 背景方式 | **ブルーバック #0000FF**（服が緑のため） |
| 髪型・髪色 | 黒髪マッシュ |
| 目の色 | 濃い緑 |
| 体格 | 小柄（160cm） |
| 服装 | 緑スポーツウェア |
| アクセサリー | 丸メガネ、首からストップウォッチ |

#### yuu-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 15,
black mushroom-cut hair, dark green eyes,
round glasses, calm analytical expression,
wearing green (#2ecc71) sports jersey with white accents,
stopwatch hanging from neck strap, small wind emblem on chest,
standing pose with one hand holding stopwatch,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright blue (#0000FF) chroma key background, flat uniform blue backdrop,
high quality, detailed
```

**ネガティブプロンプト**:
```
realistic, photorealistic, 3D render, dark atmosphere,
gloomy, horror, gore, text, watermark, signature,
blurry, low quality, deformed, extra limbs,
overly detailed background, noise, grain,
blue clothing, blue hair, blue accessories, blue skin,
background details, background objects, gradient background
```

#### yuu-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 15,
black mushroom-cut hair, dark green eyes,
round glasses, gentle pleased smile with slight blush,
wearing green (#2ecc71) sports jersey with white accents,
stopwatch hanging from neck strap, small wind emblem on chest,
happy pose adjusting glasses with one hand,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright blue (#0000FF) chroma key background, flat uniform blue backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （yuu-normal と同じ）

---

### 3-6. 春日ソウタ（rookie）— フリー対戦 Easy ★ブルーバック

| 項目 | 設定 |
|------|------|
| テーマカラー | ライム #27ae60 |
| 背景方式 | **ブルーバック #0000FF**（服が緑のため） |
| 髪型・髪色 | 金髪ぼさぼさ |
| 目の色 | 青 |
| 体格 | 普通（168cm） |
| 服装 | 緑スポーツウェア |
| アクセサリー | なし |

#### rookie-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 15,
messy blonde hair, blue eyes,
gentle easygoing smile with relaxed expression,
wearing green (#27ae60) sports jersey with white accents,
small emblem on chest,
relaxed standing pose with hands in jersey pockets,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright blue (#0000FF) chroma key background, flat uniform blue backdrop,
high quality, detailed
```

**ネガティブプロンプト**:
```
realistic, photorealistic, 3D render, dark atmosphere,
gloomy, horror, gore, text, watermark, signature,
blurry, low quality, deformed, extra limbs,
overly detailed background, noise, grain,
blue clothing, blue hair, blue accessories, blue skin,
background details, background objects, gradient background
```

> **注意**: ソウタは `blue eyes` がプロンプトにあるが、ネガティブに `blue clothing` 等を入れてもAIは文脈的に「目の色の青」と「服の青」を区別できることが多い。もし目の色が生成されない場合は、ネガティブから `blue` 関連を `blue clothing, blue jersey, blue shirt` に限定する。

#### rookie-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 15,
messy blonde hair, blue eyes,
surprised happy expression with wide open mouth,
wearing green (#27ae60) sports jersey with white accents,
small emblem on chest,
excited pose scratching back of head sheepishly,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright blue (#0000FF) chroma key background, flat uniform blue backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （rookie-normal と同じ）

---

### 3-7. 秋山ケンジ（regular）— フリー対戦 Normal

| 項目 | 設定 |
|------|------|
| テーマカラー | ネイビー #2c3e50 |
| 背景方式 | グリーンバック #00FF00 |
| 髪型・髪色 | 茶髪スポーツ刈り |
| 目の色 | 茶色 |
| 体格 | がっしり（175cm） |
| 服装 | ネイビースポーツウェア |
| アクセサリー | 額にスポーツヘッドバンド |

#### regular-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 16,
short brown crew cut hair, brown eyes,
sports headband on forehead,
serious but friendly expression with determined look,
wearing navy blue (#2c3e50) sports jersey with white accents,
small emblem on chest,
firm standing pose with fists clenched at sides,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

#### regular-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young boy age 16,
short brown crew cut hair, brown eyes,
sports headband on forehead,
relieved happy smile with eyes slightly narrowed,
wearing navy blue (#2c3e50) sports jersey with white accents,
small emblem on chest,
happy pose with right arm flexing in triumph,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

---

### 3-8. 氷室レン（ace）— フリー対戦 Hard

| 項目 | 設定 |
|------|------|
| テーマカラー | 黒+赤 #2c3e50 / #e74c3c |
| 背景方式 | グリーンバック #00FF00 |
| 髪型・髪色 | 銀髪ウルフカット |
| 目の色 | 灰色 |
| 体格 | やや細身で長身（178cm） |
| 服装 | 黒スポーツウェア + 赤ライン |
| アクセサリー | 左耳に小さなピアス（銀） |

#### ace-normal.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young man age 17,
silver wolf-cut hair, sharp gray eyes,
cool confident expression with slight smirk,
wearing black sports jersey with red (#e74c3c) trim and lines,
small silver earring on left ear, emblem on chest,
composed standing pose with one hand in pocket,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

#### ace-happy.png

```
anime style character illustration, cel-shaded coloring,
clean bold outlines, young man age 17,
silver wolf-cut hair, sharp gray eyes,
subtle satisfied smile with eyes showing respect,
wearing black sports jersey with red (#e74c3c) trim and lines,
small silver earring on left ear, emblem on chest,
acknowledging pose with slight head tilt,
knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors,
solid bright green (#00FF00) chroma key background, flat uniform green backdrop,
high quality, detailed
```

**ネガティブプロンプト**: （共通グリーンバック用）

---

## 4. 背景プロンプト一覧（3枚）

### 背景の共通仕様

| 項目 | 仕様 |
|------|------|
| 生成サイズ | 450 × 900 px |
| 出力フォーマット | WebP |
| 透過 | **不要**（そのまま使用） |
| 人物 | 含めない |

### 背景ネガティブプロンプト（共通）

```
characters, people, text, watermark, signature,
photorealistic, 3D render, dark gloomy atmosphere,
blurry, low quality, noise
```

---

### 4-1. bg-clubroom.webp — 部室

| 項目 | 設定 |
|------|------|
| 場面 | エアホッケー部の部室 |
| 使用箇所 | ステージ 1-1 ダイアログ |
| 時間帯 | 放課後（夕方の柔らかい光） |
| 季節 | 春（4月） |

```
anime style background illustration, soft afternoon lighting,
warm color palette, no characters, no text,
cozy school club room on second floor corner room,
two air hockey tables in center of room,
large windows on two walls letting in warm golden sunlight,
bulletin board with tournament brackets and team photos,
shelves with trophies and equipment,
sports bags on floor near wall,
spring afternoon, cherry blossom petals visible through window,
clean detailed background art, vertical composition 450x900,
high quality, inviting atmosphere
```

---

### 4-2. bg-gym.webp — 体育館

| 項目 | 設定 |
|------|------|
| 場面 | 体育館 |
| 使用箇所 | ステージ 1-2 ダイアログ |
| 時間帯 | 日中（明るい照明） |
| 季節 | 春（4月） |

```
anime style background illustration, bright indoor lighting,
warm color palette, no characters, no text,
spacious school gymnasium with high ceiling,
professional air hockey table in center spotlight,
bleacher seats on both sides,
banners hanging from ceiling with school colors,
polished wooden floor reflecting light,
dramatic atmosphere for an important match,
clean detailed background art, vertical composition 450x900,
high quality, exciting competitive atmosphere
```

---

### 4-3. bg-school-gate.webp — 校門・桜

| 項目 | 設定 |
|------|------|
| 場面 | 校門前の桜並木 |
| 使用箇所 | ステージ 1-3 ダイアログ、チャプタータイトル |
| 時間帯 | 朝〜昼（明るい光） |
| 季節 | 春（4月・満開の桜） |

```
anime style background illustration, bright spring sunlight,
warm pink and white color palette, no characters, no text,
school entrance gate with cherry blossom trees in full bloom,
stone path leading to school building on a hill,
petals floating in gentle breeze,
clear blue sky with soft white clouds,
fresh green leaves mixed with pink blossoms,
clean detailed background art, vertical composition 450x900,
high quality, hopeful new beginning atmosphere
```

---

## 5. 勝利カットインプロンプト（1枚）

### 勝利カットインの仕様

| 項目 | 仕様 |
|------|------|
| 生成サイズ | 450 × 400 px |
| 出力フォーマット | PNG |
| 透過 | **不要**（背景込みの一枚絵） |
| 内容 | アキラ中央 + チームメイト4人が背景 |

### victory-ch1.png

```
anime style victory illustration, cel-shaded coloring,
clean bold outlines, dynamic composition,
center: young boy (Akira) with short black hair, brown eyes,
triumphant expression, right fist raised high in the air,
wearing white sports jersey with blue trim,
background: four teammates cheering and smiling,
(orange jersey boy, purple jersey girl, red jersey tall boy, green jersey boy with glasses),
confetti and sparkle effects,
warm golden lighting from above,
bright vivid celebratory colors,
high quality, detailed, 450x400 pixels
```

**ネガティブプロンプト**: （共通ネガティブプロンプトのみ）

---

## 6. ユウのアイコンプロンプト（1枚）

### アイコンの仕様

| 項目 | 仕様 |
|------|------|
| 生成サイズ | 128 × 128 px |
| 出力フォーマット | PNG |
| 背景方式 | **ブルーバック #0000FF**（服が緑のため） |
| 頭身 | 約 1.5 頭身（チビ / SD） |
| 配置先 | `public/assets/characters/yuu.png` |

### yuu.png（アイコン）

```
anime style chibi character portrait, young boy age 15,
black mushroom-cut hair, dark green eyes, round glasses,
calm analytical expression, wearing green (#2ecc71) sports jersey,
stopwatch hanging from neck,
3/4 view bust shot, clean line art, cel-shaded,
bright vivid colors,
solid bright blue (#0000FF) chroma key background, flat uniform blue backdrop,
128x128 pixels
```

**ネガティブプロンプト**:
```
realistic, photorealistic, 3D render, dark atmosphere,
gloomy, text, watermark, signature, blurry, low quality,
deformed, extra limbs, noise, grain,
blue clothing, blue hair, blue accessories,
background details, background objects, gradient background
```

---

## 7. VS画面用画像の作成手順

VS画面用の画像は、Phase 1 では立ち絵をトリミングして作成する（新規生成は不要）。

### 手順

1. 透過済みの立ち絵（512x1024px）を用意
2. 全体を 256x512px にリサイズ（アスペクト比 1:2 を維持）
3. `public/assets/vs/{characterId}-vs.png` として保存

> **補足**: 立ち絵は膝上〜全身の構図のため、リサイズのみで VS 画面に適した上半身中心の画像になる。
> もし頭部が小さすぎる場合は、上半身部分（上端から 768px）を切り出し → 256x384 にリサイズ → 256x512 のキャンバスに上寄せ配置する。

### 対象キャラ（7枚）

| 入力ファイル | 出力ファイル |
|-------------|-------------|
| `portraits/akira-normal.png` | `vs/akira-vs.png` |
| `portraits/hiro-normal.png` | `vs/hiro-vs.png` |
| `portraits/misaki-normal.png` | `vs/misaki-vs.png` |
| `portraits/takuma-normal.png` | `vs/takuma-vs.png` |
| `portraits/rookie-normal.png` | `vs/rookie-vs.png` |
| `portraits/regular-normal.png` | `vs/regular-vs.png` |
| `portraits/ace-normal.png` | `vs/ace-vs.png` |

> **注意**: ユウは Phase 1 で VS 画面に登場しないため不要。

### リサイズコマンド例（ImageMagick）

```bash
# 全体リサイズ（アスペクト比維持）
convert portraits/akira-normal.png -resize 256x512 vs/akira-vs.png

# もし上半身を切り出す場合（上端から768px → リサイズ → 上寄せ配置）
convert portraits/akira-normal.png -crop 512x768+0+0 -resize 256x384 \
  -gravity North -extent 256x512 vs/akira-vs.png
```

---

## 8. 後処理ワークフロー

### グリーンバック / ブルーバック除去

生成された画像からクロマキー背景を除去し、透過PNGに変換する。

#### 方法1: ImageMagick（推奨）

```bash
# グリーンバック除去
convert input.png -fuzz 20% -transparent "#00FF00" output.png

# ブルーバック除去
convert input.png -fuzz 20% -transparent "#0000FF" output.png
```

- `-fuzz 20%`: 色の許容誤差。グラデーションや微妙な色ムラに対応
- 値が大きすぎるとキャラの一部が透過されるので調整が必要

#### 方法2: GIMP（手動調整が必要な場合）

1. 「ファジー選択」ツールで背景を選択
2. 選択範囲を2px拡大（境界のフリンジ除去）
3. 削除で透過に変換
4. 「色→マット除去→フリンジ除去」で境界を整える

#### 方法3: remove.bg API / rembg（AI ベース）

```bash
# rembg (Python)
pip install rembg
rembg i input.png output.png
```

> AI ベースの背景除去はグリーンバックなしでも動作するが、アニメ絵では精度にばらつきがある。グリーンバック + ImageMagick の組み合わせが最も安定。

### 後処理チェックポイント

- [ ] 背景が完全に透過されている
- [ ] キャラの輪郭に緑/青のフリンジ（にじみ）が残っていない
- [ ] 半透明のエッジ（髪の毛先等）が自然に処理されている
- [ ] キャラの緑/青の要素（ユウの緑服、ソウタの青い目等）が消えていない

---

## 9. 品質チェックリスト

### 個別画像チェック

- [ ] 指定サイズ通りの解像度
- [ ] 指定フォーマット（PNG / WebP）
- [ ] アートスタイルの統一（セルシェーディング、太めの線画、高彩度）
- [ ] キャラクターの外見が設定書と一致（髪型、髪色、目の色、体格）
- [ ] テーマカラーが正しく反映されている
- [ ] 服装・アクセサリーが設定書と一致
- [ ] 表情が指定通り（normal / happy の違いが明確）

### クロスチェック

- [ ] 全キャラの頭身が統一されている（5.5頭身）
- [ ] 全キャラの線の太さが統一されている
- [ ] 全キャラの色温度・ライティングが統一されている
- [ ] 立ち絵と既存 128px アイコンで「同じキャラ」と認識できる
- [ ] normal と happy で体のポーズ・服装の大きな差異がない（表情のみ変化が理想）

### 透過チェック（後処理後）

- [ ] 背景が完全に透過されている（白背景・黒背景の両方で確認）
- [ ] 緑/青のフリンジが残っていない
- [ ] キャラの一部が誤って透過されていない

---

## 10. 全アセット一覧

### 生成が必要な画像（合計21枚）

| # | ファイル名 | 種類 | サイズ | 背景方式 | 後処理 |
|---|-----------|------|--------|---------|--------|
| 1 | `akira-normal.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 2 | `akira-happy.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 3 | `hiro-normal.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 4 | `hiro-happy.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 5 | `misaki-normal.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 6 | `misaki-happy.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 7 | `takuma-normal.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 8 | `takuma-happy.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 9 | `yuu-normal.png` | 立ち絵 | 512x1024 | ブルーバック | 透過変換 |
| 10 | `yuu-happy.png` | 立ち絵 | 512x1024 | ブルーバック | 透過変換 |
| 11 | `rookie-normal.png` | 立ち絵 | 512x1024 | ブルーバック | 透過変換 |
| 12 | `rookie-happy.png` | 立ち絵 | 512x1024 | ブルーバック | 透過変換 |
| 13 | `regular-normal.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 14 | `regular-happy.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 15 | `ace-normal.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 16 | `ace-happy.png` | 立ち絵 | 512x1024 | グリーンバック | 透過変換 |
| 17 | `bg-clubroom.webp` | 背景 | 450x900 | 不要 | なし |
| 18 | `bg-gym.webp` | 背景 | 450x900 | 不要 | なし |
| 19 | `bg-school-gate.webp` | 背景 | 450x900 | 不要 | なし |
| 20 | `victory-ch1.png` | カットイン | 450x400 | 不要 | なし |
| 21 | `yuu.png` | アイコン | 128x128 | ブルーバック | 透過変換 |

### 後処理で作成する画像（7枚）

| # | ファイル名 | 種類 | サイズ | 元画像 | 処理 |
|---|-----------|------|--------|--------|------|
| 22 | `akira-vs.png` | VS用 | 256x512 | akira-normal.png | トリミング+リサイズ |
| 23 | `hiro-vs.png` | VS用 | 256x512 | hiro-normal.png | トリミング+リサイズ |
| 24 | `misaki-vs.png` | VS用 | 256x512 | misaki-normal.png | トリミング+リサイズ |
| 25 | `takuma-vs.png` | VS用 | 256x512 | takuma-normal.png | トリミング+リサイズ |
| 26 | `rookie-vs.png` | VS用 | 256x512 | rookie-normal.png | トリミング+リサイズ |
| 27 | `regular-vs.png` | VS用 | 256x512 | regular-normal.png | トリミング+リサイズ |
| 28 | `ace-vs.png` | VS用 | 256x512 | ace-normal.png | トリミング+リサイズ |

### 配置先ディレクトリ

```
public/assets/
├── characters/          # 既存アイコン（128x128px）
│   ├── akira.png        # 既存
│   ├── hiro.png         # 既存
│   ├── misaki.png       # 既存
│   ├── takuma.png       # 既存
│   ├── rookie.png       # 既存
│   ├── regular.png      # 既存
│   ├── ace.png          # 既存
│   └── yuu.png          # ★新規
├── portraits/           # ★新規ディレクトリ
│   ├── akira-normal.png
│   ├── akira-happy.png
│   ├── ...（16枚）
├── vs/                  # ★新規ディレクトリ
│   ├── akira-vs.png
│   ├── ...（7枚）
├── backgrounds/         # ★新規ディレクトリ
│   ├── bg-clubroom.webp
│   ├── bg-gym.webp
│   └── bg-school-gate.webp
└── cutins/              # ★新規ディレクトリ
    └── victory-ch1.png
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-12 | 初版作成。Nanobanana2 のグリーンバック/ブルーバック方式に対応 |
