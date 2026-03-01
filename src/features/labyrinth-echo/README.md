# 迷宮の残響（Labyrinth Echo）

## 概要

テキスト探索×判断×ローグライトRPG。
不確かな情報の中で選択を重ね、迷宮からの生還を目指す。
周回プレイで知見ポイント（KP）を蓄積し、アンロック要素を解放して深層攻略に挑む。
全5階層・4難易度・複数エンディングを搭載した本格的なテキストアドベンチャー。

## 操作方法

- **マウスクリック**: 選択肢を選択、メニュー操作
- **キーボード**: 数字キー（1-9）で選択肢を直接選択、↑↓キーで移動、Enterで決定

## 技術詳細

### ファイル構成

```
src/features/labyrinth-echo/
  definitions.ts        # ゲーム定義データ（フロア・エンディング・死因等）
  contracts.tsx         # DbC アサーション・ErrorBoundary
  storage.ts            # localStorage ラッパー
  audio.ts              # AudioEngine（BGM・効果音）
  styles.ts             # CSS・ページスタイル定義
  game-logic.ts         # ゲームロジック（純粋関数）
  hooks.ts              # カスタムフック（useMeta, useShake, useKeyboardControl）
  images.ts             # 画像アセット一元管理（61枚）
  LabyrinthEchoGame.tsx # メインゲームコンポーネント
  index.ts              # barrel export
  events/
    event-data.ts       # イベントデータ定義
    event-utils.ts      # イベントユーティリティ
  components/
    Badge.tsx           # バッジ表示
    CollectionScreens.tsx  # コレクション画面
    DiffSelectScreen.tsx   # 難易度選択画面
    EndScreens.tsx      # エンディング・ゲームオーバー画面
    EventResultScreen.tsx  # イベント結果画面
    FloorIntroScreen.tsx   # 階層導入画面
    GameComponents.tsx  # ゲームUI部品（ガイダンス・難易度ラベル等）
    Page.tsx            # ページレイアウト（パララックス統合）
    ParallaxBg.tsx      # パララックス背景（3層自動ドリフト）
    Section.tsx         # セクションレイアウト
    SettingsScreens.tsx # 設定画面
    StatusOverlay.tsx   # 状態異常オーバーレイ（5種）
    TitleScreen.tsx     # タイトル画面（3層マウスパララックス）
  __tests__/            # ユニットテスト
    game-logic.test.ts
    storage.test.ts
src/pages/LabyrinthEchoPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useEffect`, `useRef`, `useMemo`）
- カスタムフック（`useMeta` でメタデータ管理、`useShake` で画面振動、`useKeyboardControl` でキーボード操作）

### 使用技術

- **Web Audio API**: AudioEngine による BGM・効果音（トーン、ノイズ、スウィープ、環境音）
- **CSS Animation**: フェード、グロー、パルス、ドリフト等のアニメーション
- **パララックス背景**: フロア背景は3層CSS自動ドリフト、タイトルは3層マウス追従
- **状態異常オーバーレイ**: 透過画像による画面端エフェクト（中央透明）
- **Design-by-Contract (DbC)**: `invariant` によるアサーション
- **ErrorBoundary**: クラスコンポーネントによるエラーハンドリング
- **localStorage**: セーブデータ永続化（周回情報、アンロック状態）

### ゲームシステム

- **階層構造**: 表層回廊→灰色の迷路→深淵の間→忘却の底→迷宮の心臓（全5階層）
- **難易度**: 探索者（Easy）/ 挑戦者（Normal）/ 求道者（Hard）/ 修羅（Abyss）
- **アンロックシステム**: 基本・特別・トロフィー・実績の4カテゴリ（40種）
- **状態異常**: 負傷・混乱・出血・恐怖・呪いの5種（専用オーバーレイ付き）
- **複数エンディング**: プレイ内容に応じた分岐（11種）
- **初心者ガイダンス**: 1周目は6種のメッセージがローテーション表示

### パララックス背景

#### タイトル画面（マウス追従）

3層構成でマウス移動に応じて各レイヤーが異なる速度で動く:

| レイヤー | 画像 | 画像透過 | CSS opacity | 移動量 |
|---------|------|---------|-------------|--------|
| 遠景 (far) | `le_title_far.webp` | 不透明 | 0.7 | ±5px |
| 中景 (mid) | `le_title_mid.webp` | 76%透過 | 0.85 | ±12px |
| 近景 (near) | `le_title.webp` | 不透明 | 0.18 | ±20px |

#### フロア背景（CSS自動ドリフト）

各フロアに3層の背景画像が異なる周期で自動的にドリフト:

| レイヤー | 画像透過 | CSS opacity | 周期 |
|---------|---------|-------------|------|
| 遠景 (far) | 不透明 | 0.7 | 28秒 |
| 中景 (mid) | 不透明 | 0.55 | 20秒 |
| 近景 (near) | 約50%透過 | 0.4 | 14秒 |

### 画像アセット

#### スタイルガイド

全シナリオ画像は統一スタイルで制作:

- **画風**: 温かみのある物語的写実主義 × 重厚なダンジョンファンタジーアート
- **タッチ**: 油絵調の筆致 + 重厚なダンジョンファンタジー
- **主人公**: 10代後半の若い冒険者、革鎧・フード付きクローク・ブーツ着用
- **照明**: ドラマチックなキアロスクーロ（松明・魔法光源の明暗対比）
- **色調**: ダークベース + 各シーンのテーマカラーアクセント
- **禁則**: テキスト、ウォーターマーク、署名は含めない

#### 画像一覧（61枚）

| カテゴリ | 枚数 | ファイル名パターン | 用途画面 |
|---|---|---|---|
| タイトル | 3 | `le_title.webp`, `le_title_far.webp`, `le_title_mid.webp` | TitleScreen（3層パララックス） |
| 背景 | 15 | `le_bg_{n}_{far\|mid\|near}.webp` | ParallaxBg（フロア別3層パララックス） |
| シーン | 15 | `le_scene_{name}.webp` | EventResultScreen |
| エンディング | 11 | `le_ending_{id}.webp` | VictoryScreen |
| オーバーレイ | 5 | `le_overlay_{status}.webp` | StatusOverlay（状態異常エフェクト） |
| フロア | 5 | `le_floor_{n}.webp` | FloorIntroScreen |
| 難易度 | 4 | `le_diff_{id}.webp` | DiffSelectScreen |
| イベント | 4 | `le_event_{type}.webp` | EventResultScreen |
| ゲームオーバー | 1 | `le_gameover.webp` | GameOverScreen |

#### 透過処理

パララックスとオーバーレイに使用する11枚は透過処理済み:

| 処理 | 対象 | 方式 |
|-----|------|------|
| 楕円グラデーションマスク | `le_overlay_*.webp`（5枚） | 中央透明、端にエフェクトを残す |
| 矩形ビネットマスク | `le_bg_*_near.webp`（5枚） | 中央透明、端にシーン要素を残す |
| 輝度ベースアルファ | `le_title_mid.webp`（1枚） | 暗部を透明に、明るい構造物を残す |

#### 画像仕様

- **フォーマット**: WebP（品質82%）
- **サイズ上限**: 300KB/枚
- **配置**: `src/assets/images/`（Webpack バンドル）
- **管理**: `src/features/labyrinth-echo/images.ts` で一元管理
