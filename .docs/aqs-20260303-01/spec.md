# Agile Quiz Sugoroku ブラッシュアップ仕様書 (Phase 2)

---

## 1. TEAMメンバー順番修正 ✅

### 変更仕様
- **対象**: `character-profiles.ts` の `CHARACTER_PROFILES` 配列
- **変更前**: ネコ → イヌ → ウサギ → タカ
- **変更後**: タカ → イヌ → ネコ → ウサギ（Phase 2b でペンギン追加後に最終確定）

---

## 2. 画像スタイル微調整 ✅

### 結論
チームバナー画像のつぶれは元画像自体の問題と判明。
スタイル微調整は実施済みだが、根本解決には画像の差し替え（セクション5参照）が必要。

### 実施済みの変更
- GuideScreen: チームバナー `objectFit` を `height: 'auto'` に変更、キャラ画像 48→52px
- ResultScreen: ビルド成功画像 60→80px + `contain`、タイプ画像 80→88px、タカアバター 52→56px

---

## 3. 新キャラクター「ペンギン」（スクラムマスター）追加

### 背景
現在イヌが「PO / スクラムマスター」を兼任しているが、スクラムガイド（2020）では PO と SM は明確に異なる責任を持つ別のロールとされている。兼任はアンチパターンとされるため、ロールを分離する。

### キャラクター定義

| 項目 | 内容 |
|------|------|
| id | `penguin` |
| name | ペンギン |
| animal | アデリーペンギン |
| role | スクラムマスター |
| color | `COLORS.cyan`（ウサギと要調整）または新色追加 |
| emoji | 🐧 |
| personality | 仲間思いで場を和ませる。困っているメンバーを真っ先に助ける。寒さ（プレッシャー）に強く、どんな逆境でもチームを守り抜く。 |
| skills | ファシリテーション、障害除去、チームコーチング、プロセス改善、コンフリクト解決 |
| catchphrase | 「みんなで一緒に進めば、どんな嵐も乗り越えられるペン！」 |
| trivia | レトロスペクティブではいつも最高のアイスブレイクを用意する。付箋の色分けにこだわりあり。 |

### イヌの role 変更

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| role | PO / スクラムマスター | プロダクトオーナー |
| skills | スクラム運営、バックログ管理、ファシリテーション、見積もり、ステークホルダー調整 | バックログ管理、優先順位付け、ステークホルダー調整、見積もり、受け入れ基準定義 |

### カラーテーマ調整

現在のウサギ（QA）は `COLORS.cyan` を使用。ペンギンも青系が自然だが被りを避けるため：
- **案1**: ペンギンに `COLORS.cyan` を割り当て、ウサギを `COLORS.pink`（新色）に変更
- **案2**: ペンギンに新色 `COLORS.blue`（`#4FC3F7`）を追加
- **推奨**: 案2（既存キャラの色変更を避ける）

### TEAMメンバー最終順序

```
タカ（BO）→ イヌ（PO）→ ペンギン（SM）→ ネコ（Dev）→ ウサギ（QA）
```

上流（ビジネス）→ プロダクト管理 → プロセス管理 → 開発 → 品質保証 の流れを表現。

### 影響範囲
- `character-profiles.ts` - ペンギン追加、イヌ修正、配列順変更
- `images.ts` - ペンギン画像 import 追加
- `GuideScreen.tsx` - `.map()` 表示のため自動対応（コード変更不要）
- `ResultScreen.tsx` - タカ固定参照のため影響なし

---

## 4. 全キャラクター画像の統一リニューアル

### 目的
- 現在の画像は個別に生成されており、スタイル・テイストにばらつきがある
- 新キャラ追加を機に、全画像を統一デザインで作り直す
- チームの一体感・プロフェッショナル感を演出

### 統一スタイルガイドライン

| 項目 | 仕様 |
|------|------|
| アートスタイル | フラットデザイン、太めのアウトライン、パステルカラー |
| 頭身 | 2〜2.5頭身（かわいい系） |
| 表情 | 明るく親しみやすい |
| 背景 | 透明（個別画像）or 統一グラデーション（集合画像） |
| 衣装 | 各ロールを象徴するもの（下記参照） |
| 形式 | WebP |

### キャラクター衣装設定

| キャラ | 衣装・アクセサリー |
|--------|-------------------|
| タカ | ダークスーツ、ネクタイ、チャート/グラフを持つ |
| ペンギン | パーカー＋ホイッスル、付箋ボードの前に立つ |
| イヌ | ポロシャツ＋バックログボード、優先順位カードを持つ |
| ネコ | パーカー＋ヘッドフォン、ノートPC、コーディング中 |
| ウサギ | 白衣＋虫眼鏡、バグレポートを持つ |

### 必要な画像一覧

#### A. 個別キャラクター画像（アイコン用）- 各 512x512px

| ファイル名 | 説明 | 用途 |
|-----------|------|------|
| `aqs_char_taka.webp` | タカ単体（差し替え） | GuideScreen キャラ一覧、ResultScreen 総評 |
| `aqs_char_penguin.webp` | ペンギン単体（新規） | GuideScreen キャラ一覧 |
| `aqs_char_inu.webp` | イヌ単体（差し替え） | GuideScreen キャラ一覧 |
| `aqs_char_neko.webp` | ネコ単体（差し替え） | GuideScreen キャラ一覧 |
| `aqs_char_usagi.webp` | ウサギ単体（差し替え） | GuideScreen キャラ一覧 |

#### B. チーム集合画像

| ファイル名 | サイズ | 説明 | 用途 |
|-----------|--------|------|------|
| `aqs_char_team.webp` | 1024x400 | 5キャラ横並び（差し替え） | GuideScreen TEAMバナー |
| `aqs_char_group.webp` | 512x512 | 5キャラ集合（差し替え） | 現在未使用だが今後活用可能 |

#### C. タイトル背景画像

| ファイル名 | サイズ | 説明 | 用途 |
|-----------|--------|------|------|
| `aqs_title.webp` | 1280x720 | 5キャラ＋ゲームロゴ（差し替え） | TitleScreen 背景 |

### 画像生成プロンプト集

#### 共通プレフィックス（全プロンプトに付与）
```
Cute 2.5-head-tall animal characters in flat design style with bold outlines,
pastel color palette, friendly expressions, professional but adorable,
consistent art style across all images,
```

#### A-1. aqs_char_taka.webp（タカ / BO）
```
{共通プレフィックス}
A single hawk character wearing a dark business suit with tie,
holding a chart showing upward trends,
confident and dignified expression, golden-yellow accent color,
simple transparent background, 512x512px
```

#### A-2. aqs_char_penguin.webp（ペンギン / SM）- 新規
```
{共通プレフィックス}
A single adelie penguin character wearing a hoodie with a whistle around neck,
standing in front of a sticky-note board (kanban board),
warm and supportive expression, light blue accent color,
simple transparent background, 512x512px
```

#### A-3. aqs_char_inu.webp（イヌ / PO）
```
{共通プレフィックス}
A single beagle dog character wearing a polo shirt,
holding priority cards and standing near a product backlog board,
loyal and focused expression, green accent color,
simple transparent background, 512x512px
```

#### A-4. aqs_char_neko.webp（ネコ / Dev）
```
{共通プレフィックス}
A single orange tabby cat character wearing a hoodie and headphones,
coding on a laptop with React code on screen,
curious and enthusiastic expression, orange accent color,
simple transparent background, 512x512px
```

#### A-5. aqs_char_usagi.webp（ウサギ / QA）
```
{共通プレフィックス}
A single white rabbit character wearing a lab coat,
holding a magnifying glass and a bug report document,
careful and detail-oriented expression, cyan accent color,
simple transparent background, 512x512px
```

#### B-1. aqs_char_team.webp（チームバナー）
```
{共通プレフィックス}
Five characters standing side by side in a horizontal line:
(left to right) hawk in suit, beagle dog in polo, penguin in hoodie,
orange cat with laptop, white rabbit in lab coat,
each in their signature pose, team unity feeling,
soft gradient background (dark navy to teal),
wide banner format 1024x400px
```

#### B-2. aqs_char_group.webp（集合写真風）
```
{共通プレフィックス}
Five characters in a group photo arrangement:
hawk (center back), penguin and dog (middle row),
cat and rabbit (front row),
all smiling and making team poses,
office/scrum room background with kanban board visible,
square format 512x512px
```

#### C-1. aqs_title.webp（タイトル背景）
```
{共通プレフィックス}
Five characters (hawk, penguin, dog, cat, rabbit) arranged dynamically
around a central "Agile Quiz Sugoroku" game board,
each character in an action pose related to their role,
colorful but not too busy background with subtle tech/agile motifs
(sprint lanes, user story cards, CI/CD pipelines),
landscape format 1280x720px
```

---

## 5. すごろく要素の強化案

### 案A: サイコロ演出追加（視覚的強化・低コスト）
- イベント遷移時にサイコロのアニメーションを追加
- 出目でイベントの種類（通常/ボーナス/緊急）が変わる演出
- CSS アニメーションで実装可能
- **推定工数**: 0.5日

### 案B: マスの種類多様化（ゲーム性強化・中コスト）
- アイテムマス: ヒントカード（選択肢を2つに絞る）、時間延長カード
- チャンスマス: 正解時のスコアが2倍
- トラップマス: 時間が半分になる
- **推定工数**: 1-2日

### 案C: ボード全体のビジュアル改善（視覚的強化・中コスト）
- すごろくボードの俯瞰表示
- 現在位置のアニメーション付きマーカー
- スプリント進行に合わせた背景変化
- **推定工数**: 2-3日

### 案D: アイテムシステム（ゲーム性強化・高コスト）
- スプリント間で使用可能なアイテムの収集・管理
- 正解報酬としてアイテムを獲得
- 戦略的なアイテム使用がスコアに影響
- **推定工数**: 3-5日

### 推奨組み合わせ
**案A + 案B** の段階的実装を推奨。
サイコロ演出で視覚的な面白さを追加しつつ、マスの種類でゲーム性を向上させる。
