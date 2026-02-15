# 迷宮の残響（Labyrinth Echo）

## 概要

テキスト探索×判断×ローグライトRPG。
不確かな情報の中で選択を重ね、迷宮からの生還を目指す。
周回プレイで知見ポイント（KP）を蓄積し、アンロック要素を解放して深層攻略に挑む。
全5階層・4難易度・複数エンディングを搭載した本格的なテキストアドベンチャー。

## 操作方法

- **マウスクリック**: 選択肢を選択、メニュー操作

## 技術詳細

### ファイル構成

```
src/features/labyrinth-echo/
  types.ts              # 型定義
  definitions.ts        # ゲーム定義データ
  contracts.tsx         # DbC アサーション・ErrorBoundary
  storage.ts            # localStorage ラッパー
  audio.ts              # AudioEngine（効果音）
  styles.ts             # スタイル定義
  game-logic.ts         # ゲームロジック（純粋関数）
  hooks.ts              # カスタムフック（useMeta, useShake）
  LabyrinthEchoGame.tsx # メインゲームコンポーネント
  index.ts              # barrel export
  events/
    event-data.ts       # イベントデータ定義
    event-utils.ts      # イベントユーティリティ
  components/
    Badge.tsx           # バッジ表示
    CollectionScreens.tsx  # コレクション画面
    DiffSelectScreen.tsx   # 難易度選択画面
    EndScreens.tsx      # エンディング画面
    EventResultScreen.tsx  # イベント結果画面
    FloorIntroScreen.tsx   # 階層導入画面
    GameComponents.tsx  # ゲームUI部品
    Page.tsx            # ページレイアウト
    Section.tsx         # セクションレイアウト
    SettingsScreens.tsx # 設定画面
    TitleScreen.tsx     # タイトル画面
  __tests__/            # ユニットテスト
    game-logic.test.ts
    storage.test.ts
src/pages/LabyrinthEchoPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useEffect`, `useRef`, `useMemo`）
- カスタムフック（`useMeta` でメタデータ管理、`useShake` で画面振動）

### 使用技術

- **Web Audio API**: AudioEngine による効果音（トーン、ノイズ、スウィープ、環境音）
- **CSS Animation**: フェード、グロー、パルスアニメーション
- **Design-by-Contract (DbC)**: `invariant` によるアサーション
- **ErrorBoundary**: クラスコンポーネントによるエラーハンドリング
- **localStorage**: セーブデータ永続化（周回情報、アンロック状態）

### ゲームシステム

- **階層構造**: 表層回廊→灰色の迷路→深淵の間→忘却の底→迷宮の心臓（全5階層）
- **難易度**: 探索者（Easy）/ 挑戦者（Normal）/ 求道者（Hard）/ 修羅（Abyss）
- **アンロックシステム**: 基本・特別・トロフィー・実績の4カテゴリ（40種）
- **状態異常**: 負傷・混乱・出血・恐怖・呪いの5種
- **複数エンディング**: プレイ内容に応じた分岐

### 画像アセット

#### スタイルガイド

全シナリオ画像は統一スタイルで制作:

- **画風**: ノーマン・ロックウェル（トムソーヤ/ハックルベリーフィン）× ジェフ・イーズリー（D&D）
- **タッチ**: 油絵調の筆致 + 重厚なダンジョンファンタジー
- **主人公**: 10代後半の若い冒険者、革鎧・フード付きクローク・ブーツ着用
- **照明**: ドラマチックなキアロスクーロ（松明・魔法光源の明暗対比）
- **色調**: ダークベース + 各シーンのテーマカラーアクセント
- **禁則**: テキスト、ウォーターマーク、署名は含めない

#### 画像一覧（26枚）

| カテゴリ | 枚数 | ファイル名パターン | 用途画面 |
|---|---|---|---|
| タイトル | 1 | `le_title.webp` | TitleScreen |
| 難易度 | 4 | `le_diff_{id}.webp` | DiffSelectScreen |
| フロア | 5 | `le_floor_{n}.webp` | FloorIntroScreen |
| イベント | 4 | `le_event_{type}.webp` | EventResultScreen |
| エンディング | 11 | `le_ending_{id}.webp` | VictoryScreen |
| ゲームオーバー | 1 | `le_gameover.webp` | GameOverScreen |

#### 画像仕様

- **フォーマット**: WebP（品質82%）
- **サイズ上限**: 300KB/枚
- **配置**: `src/assets/images/`（Webpack バンドル）
- **管理**: `src/features/labyrinth-echo/images.ts` で一元管理
