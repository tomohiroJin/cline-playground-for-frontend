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
  contracts.tsx         # DbC アサーション・ErrorBoundary
  audio.ts              # AudioEngine（BGM・効果音）
  styles.ts             # CSS・ページスタイル定義
  images.ts             # 画像アセット一元管理（63枚）
  LabyrinthEchoGame.tsx # 互換 re-export（presentation/LabyrinthEchoGame.tsx へ委譲）
  index.ts              # barrel export
  domain/               # ドメイン層（純粋なゲームロジック）
    constants/          # ゲーム定義データ（難易度・エンディング・断片・継承・真END等）
    models/             # ドメインモデル（game-state, player, meta-state, echo 等）
    services/           # ドメインサービス（combat, echo, ending, legacy, pressure 等）
    events/             # イベント選択・条件判定・乱数（event-selector, condition, random）
    contracts/          # ドメイン不変条件（invariants.ts）
  application/
    ports/              # 外部依存の抽象化（audio-port, random-port, storage-port）
  infrastructure/       # ポートの実装
    audio/              # audio-adapter.ts（AudioEngine アダプタ）
    storage/            # local-storage-adapter.ts（localStorage ラッパー）
  presentation/         # プレゼンテーション層
    LabyrinthEchoGame.tsx  # メインゲームコンポーネント
    get-random-source.ts   # 乱数ソースの解決
    hooks/              # カスタムフック（use-game-orchestrator, use-game-actions,
                        #   use-keyboard-control, use-audio-effects, use-visual-fx,
                        #   use-image-preload, use-persistence-sync, use-text-reveal）
    components/
      GameRouter.tsx    # ゲーム画面のルーティング
      screens/          # EventScreen / ResultScreen / FinaleScreen / StatusPanel
  events/
    event-data.ts       # イベントデータ定義
    event-utils.ts      # イベントユーティリティ
    echo-events.ts      # 残響（先人の断片）イベント
    revenant-events.ts  # 残響の亡霊イベント
  simulation/           # 開発支援: シミュレーション・レポート基盤（本体ビルド非同梱）
    run-simulator.ts    # 1ラン分の探索を決定論再現（fragmentsRead 記録）
    policies.ts         # 選択ポリシー（CAREFUL / RANDOM / LORE）
    career-simulator.ts # 周回（キャリア）進行＝真END解禁まで run を反復
    invariants.ts       # 不変条件チェッカ（CIテスト＋レポート警告で共用）
    analysis.ts         # 集計層（生還率/周回/継承/END分布＋違反収集）
    report/             # HTMLレポート生成（render→data→generate-report CLI）
    README.md           # シミュレーション基盤の詳細ドキュメント
  components/
    ArchiveScreen.tsx   # 残響書庫画面（先人の断片閲覧）
    Badge.tsx           # バッジ表示
    CollectionScreens.tsx  # コレクション画面
    DiffSelectScreen.tsx   # 難易度選択画面
    EndScreens.tsx      # エンディング・ゲームオーバー画面
    FloorIntroScreen.tsx   # 階層導入画面
    GameComponents.tsx  # ゲームUI部品（ガイダンス・難易度ラベル等）
    LogPanel.tsx        # 探索ログパネル
    Page.tsx            # ページレイアウト（パララックス統合）
    ParallaxBg.tsx      # パララックス背景（3層自動ドリフト）
    Section.tsx         # セクションレイアウト
    SettingsScreens.tsx # 設定画面
    StatusOverlay.tsx   # 状態異常オーバーレイ（5種）
    TitleScreen.tsx     # タイトル画面（3層マウスパララックス）
  __tests__/            # ユニットテスト（domain / events / infrastructure /
                        #   presentation / simulation 等、実装と同じ階層構成）
src/pages/LabyrinthEchoPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useEffect`, `useRef`, `useMemo`）
- カスタムフック（`useGameOrchestrator` でゲーム進行の統括、`useGameActions` でプレイヤー操作、`useVisualFx` で画面演出、`useKeyboardControl` でキーボード操作）

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
- **残響システム（Phase 1）**: 生還ごとに残響深度（echoDepth）が深まり、過去の探索者5名の物語断片19件が解禁される。新画面「残響書庫」で読み解き、真相4レイヤーが段階的に開示される
- **バランス再調整（Phase 2）**: Normal を基準に初期値・ドレイン・状態異常・安息頻度を「理不尽でない程度」に締める（Easy は据置）。決定論シミュレーション＋静的不変量のバランス契約テストで難易度の単調性・生還率バンドを回帰から保護
- **NG+残響エスカレーション（Phase 3）**: 難易度選択で「残響圧」を 0〜echoDepth から選択。圧を上げるほど侵蝕・ダメージが増し、発見済みの先人が「残響の亡霊」として襲来する。高圧クリアは KP・称号で報われる。圧0は従来通り（回帰なし）、圧の単調性をバランス契約テストで保護
- **残響継承（Phase 4）**: 先人の断片を全収集すると、その先人の「継承（レガシー）」が解禁。難易度選択で1つを排他選択でき、トレードオフ型の効果（例: 記録者=情報強化だが打たれ弱い／起源=全強化だが被ダメ+65%）で毎回違うビルドに挑める。継承なしは従来通り（回帰なし）、各レガシーの単調性・健全帯をバランス契約テストで保護
- **第6階層・真エンディング（Phase 5）**: echoDepth≥6＋全先人の断片収集で、5階クリア時に「さらに深く」分岐が出現。戦闘なしの物語クライマックス（集う残響→始まりの探索者→最後の決断）を経て、決断（願いを継ぐ／断つ）×高ステーク（残響圧≥5 または起源の継承）で真エンディング4種に分岐。称号・書庫の真相到達印・タイトル踏破演出でクリア後の到達感を得る。戦闘・simulator・バランス契約は不変
- **初心者ガイダンス**: 1周目は6種のメッセージがローテーション表示

### 開発支援: シミュレーション・レポート基盤

`simulation/` 配下に、本番ロジックをヘッドレスに回してバランス・周回進行・継承・エンディング分布を
計測し、結果を**HTMLレポート**として可視化する開発支援ツールを備える（詳細は
[`simulation/README.md`](simulation/README.md)）。ゲーム本体のビルドには含まれない（`simulation/` を
本体コードは import しない／生成物 `reports/` は gitignore）。

```bash
npm run sim:labyrinth-echo   # reports/labyrinth-echo-sim-<日付>.html を生成
```

- **生還率3層＋周回＋継承＋END到達性＋警告**: ①単発生還率カーブ（無補助）→①-b 継承パワーアップ後
  →①-c フル強化後（全アンロック＋ベストレガシー＝最大強化で全難易度100%到達を確認） ②周回進行＝真END解禁まで何周か
  ③継承（レガシー）取得タイミング＋効果 ④エンディング到達分布／④-b 全11END到達性センサス ⑤不変条件チェックの異常一覧。
- **不変条件チェッカ**: depth≤6・断片≤19・周回の単調性・レガシー解禁整合・真ルート条件などを検査し、
  CIテスト（回帰ガード＋故意の不正データで検出器自体を検証）とレポート警告欄の両方で共用。
  `error` 違反時は CLI が非0終了し CI で検知できる。
- **設計**: 本番ドメイン関数を流用して定数乖離を防ぎ、乱数は `SeededRandomSource` で決定論を担保。
  集計・描画は純粋関数、副作用（日時・fs）は CLI エントリに隔離（Jest とレポートが同一の数値を共有）。
- **計測例**: 真エンディング解禁まで easy≈19周・normal≈23周（hard 以上は実質非現実的）。
  この基盤は構築当日、本番規模でのみ表面化する周回シミュレータの断片二重収集バグを実際に検出した。

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

#### 画像一覧（63枚）

| カテゴリ | 枚数 | ファイル名パターン | 用途画面 |
|---|---|---|---|
| タイトル | 3 | `le_title.webp`, `le_title_far.webp`, `le_title_mid.webp` | TitleScreen（3層パララックス） |
| 背景 | 15 | `le_bg_{n}_{far\|mid\|near}.webp` | ParallaxBg（フロア別3層パララックス） |
| シーン | 15 | `le_scene_{name}.webp` | EventScreen |
| エンディング | 11 | `le_ending_{id}.webp` | VictoryScreen |
| オーバーレイ | 5 | `le_overlay_{status}.webp` | StatusOverlay（状態異常エフェクト） |
| フロア | 5 | `le_floor_{n}.webp` | FloorIntroScreen |
| 難易度 | 4 | `le_diff_{id}.webp` | DiffSelectScreen |
| イベント | 4 | `le_event_{type}.webp` | EventScreen |
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
