# Air Hockey ブラッシュアップ タスク一覧 v2

## タスクの粒度について

各タスクは以下の条件を満たす:
- 1タスク = 1つの変更単位（コミット可能な粒度）
- 変更対象ファイルが明示されている
- 受け入れ基準が明示されている
- 前のタスクの完了に依存する場合は依存関係を記載

---

## Phase 1: 見た目改善（US-1.1 〜 US-1.5）

### P1-01: 色ヘルパー関数の追加 ✅
**ファイル**: `renderer.ts`
**内容**: `lightenColor(hex, amount)` と `darkenColor(hex, amount)` をファイル先頭に追加
**受け入れ基準**:
- [x] `lightenColor('#3498db', 40)` が明るい青を返す
- [x] `darkenColor('#3498db', 40)` が暗い青を返す
- [x] `#` 付きの6桁HEXを受け取り `rgb()` 文字列を返す
**依存**: なし

### P1-02: 台の外枠グラデーション ✅
**ファイル**: `renderer.ts` → `Renderer.drawField()`
**内容**: 既存の `strokeRect`（59行目付近）を木目風グラデーション + 多重線に置換
**受け入れ基準**:
- [x] 外枠が暗い茶〜黒のグラデーション（幅12px）
- [x] 内側に 1px の光沢ハイライト線
- [x] フィールドカラーのネオン枠線が内側に2px幅で描画
- [x] 6フィールドすべてで正常表示
**依存**: なし

### P1-03: フィールド面の照明効果 ✅
**ファイル**: `renderer.ts` → `Renderer.drawField()`
**内容**: 外枠描画直後に放射グラデーション（中央が明るい）を追加
**受け入れ基準**:
- [x] フィールド中央が微かに明るく、端が微かに暗い
- [x] 障害物の視認性を阻害しない（透明度十分低い）
**依存**: P1-02

### P1-04: 中央ラインの装飾 ✅
**ファイル**: `renderer.ts` → `Renderer.drawField()`
**内容**: 既存の点線中央ライン（62-67行目）を二重線 + 中央円内ドットに置換
**受け入れ基準**:
- [x] 中央ラインが3本線（太い半透明 + 上下の細い線）
- [x] 中央円内に小さな塗りつぶし円がある
- [x] 既存の中央円ネオングロー（68-74行目）は維持
**依存**: P1-02

### P1-05: ゴールエリア LED 発光 ✅
**ファイル**: `renderer.ts` → `Renderer.drawField()`
**内容**: 既存のゴール `fillRect`（75-83行目）を LED 風描画に置換
**受け入れ基準**:
- [x] ゴールラインに沿ってドット状の発光がある
- [x] CPU 側（上）が赤、プレイヤー側（下）がシアン
- [x] `field.goalSize` に応じたドット数
- [x] 各フィールドのゴールサイズ（105〜180px）で正常表示
**依存**: P1-02

### P1-06: マレットの立体感 ✅
**ファイル**: `renderer.ts` → `Renderer.drawMallet()`
**内容**: 既存の単色円描画を放射グラデーション + シャドウ + ハイライトに置換
**受け入れ基準**:
- [x] マレットが球体のように立体的に見える
- [x] 左上にハイライト（光沢）がある
- [x] マレット下に楕円シャドウがある
- [x] 外周にエッジリングがある
- [x] プレイヤー（`#3498db`）とCPU（`#e74c3c`）で色が正しい
- [x] `sizeScale=1.5`（Big アイテム）で崩れない
- [x] `hasGlow=true`（Speed エフェクト）のマゼンタグローが描画される
**依存**: P1-01

### P1-07: パックの金属質感 ✅
**ファイル**: `renderer.ts` → `Renderer.drawPuck()`
**内容**: 既存の単色円描画をメタリックグラデーション + エッジ + ハイライトに置換
**受け入れ基準**:
- [x] パックにメタリック感（中心が明るく外周が暗い）がある
- [x] 速度による色変化（白→黄→赤）が維持されている
- [x] 高速時のグロー（`shadowBlur`）が維持されている
- [x] 小さなハイライトスポットがある
- [x] 透明パック（`visible=false`）は描画されない
**依存**: P1-01

### P1-08: ヒットストップ型定義 ✅
**ファイル**: `core/types.ts`
**内容**: `HitStopState` 型を追加
**受け入れ基準**:
- [x] `HitStopState` 型が export されている
- [x] `active`, `framesRemaining`, `impactX`, `impactY`, `shockwaveRadius`, `shockwaveMaxRadius` フィールドを持つ
**依存**: なし

### P1-09: ヒットストップロジック ✅
**ファイル**: `hooks/useGameLoop.ts`
**内容**: パック-マレット衝突後に速度 > 8 でヒットストップ発動、物理更新スキップ
**受け入れ基準**:
- [x] `hitStop` がローカル変数として初期化される
- [x] パック速度 > 8 のヒット時に `active=true`, `framesRemaining=3` が設定される
- [x] `active=true` の間、物理更新（パック移動、AI更新等）がスキップされる
- [x] 描画は継続される（衝撃波含む）
- [x] 3フレーム後に自動解除
- [x] SE（ヒット音）は通常通り発動
**依存**: P1-08

### P1-10: 衝撃波描画 ✅
**ファイル**: `renderer.ts`
**内容**: `Renderer.drawShockwave()` メソッド追加 + ゲームループの描画セクションから呼出
**受け入れ基準**:
- [x] 衝突地点から拡がる半透明の白リング（3フレームで最大80px）
- [x] 内側にもう1つの薄いオレンジリング
- [x] 拡がるにつれて透明度が下がる
**依存**: P1-09

### P1-11: スローモーション型定義 ✅
**ファイル**: `core/types.ts`
**内容**: `SlowMotionState` 型を追加
**受け入れ基準**:
- [x] `SlowMotionState` 型が export されている
- [x] `active`, `startTime`, `duration` フィールドを持つ
**依存**: なし

### P1-12: ゴールスローモーションロジック ✅
**ファイル**: `hooks/useGameLoop.ts`
**内容**: ゴール判定直後にスローモーション開始、物理更新速度を 0.3 倍に
**受け入れ基準**:
- [x] `slowMo` がローカル変数として初期化される
- [x] ゴール判定時に `active=true`, `duration=400` が設定される
- [x] `active=true` の間、パック/マレットの移動速度が 0.3 倍になる
- [x] 400ms 後に自動解除、通常速度に復帰
- [x] スロー中はビネット描画が呼ばれる
- [x] 自分の得点でも相手の得点でも発動する
**依存**: P1-11

### P1-13: ビネット効果描画 ✅
**ファイル**: `renderer.ts`
**内容**: `Renderer.drawVignette()` メソッド追加
**受け入れ基準**:
- [x] 画面四隅が暗くなる放射グラデーション
- [x] `intensity` パラメータ（0-1）で濃さを制御可能
- [x] スローモーション中のみ呼ばれる
**依存**: P1-12

### P1-14: Phase 1 テスト ✅
**ファイル**: `core/visual-effects.test.ts`（新規作成）
**内容**: 既存テストの実行確認 + ヒットストップ・スローモーションのユニットテスト追加
**受け入れ基準**:
- [x] 既存テストが全て通る（全 192 テスト PASS）
- [x] ヒットストップ: 速度 > 8 で発動、3フレームで解除のテスト
- [x] スローモーション: ゴール時に発動、400ms で解除のテスト
- [x] `lightenColor` / `darkenColor` のユニットテスト
**依存**: P1-01 〜 P1-13

### P1-15: Phase 1 パフォーマンス確認
**内容**: ブラウザでの動作確認、60fps 維持の確認
**受け入れ基準**:
- [ ] Chrome / Safari で 60fps を維持
- [ ] グラデーション描画でフレーム落ちがないこと
- [ ] 必要に応じてフィールド背景を `OffscreenCanvas` にプリレンダリング
**依存**: P1-14

---

## Phase 2: キャラクター基盤（US-2.1, US-2.7, US-2.8）

### P2-01: キャラクター型定義 ✅
**ファイル**: `core/types.ts`
**内容**: `Character`, `CharacterReaction`, `GameMode` 型を追加
**受け入れ基準**:
- [x] `Character` 型: `id`, `name`, `icon`, `color`, `reactions`
- [x] `CharacterReaction` 型: `onScore[]`, `onConcede[]`, `onWin[]`, `onLose[]`
- [x] `GameMode` 型: `'free' | 'story'`
**依存**: P1-14

### P2-02: キャラクターデータ定義 ✅
**ファイル**: 新規 `core/characters.ts`
**内容**: 主人公 + フリー対戦用3キャラ + ストーリー用3キャラのデータ定義
**受け入れ基準**:
- [x] `PLAYER_CHARACTER` が定義されている
- [x] `FREE_BATTLE_CHARACTERS` に `easy`, `normal`, `hard` の3キャラ
- [x] `STORY_CHARACTERS` に `hiro`, `misaki`, `takuma` の3キャラ
- [x] 各キャラにリアクションテキスト（各2-3パターン）
- [x] `icon` フィールドはファイルパス文字列（画像は後で追加）
- [x] `getCharacterByDifficulty()`, `findCharacterById()`, `getRandomReaction()` ヘルパー関数
**依存**: P2-01

### P2-03: キャラクターアイコン画像プロンプト設計 ✅
**ファイル**: 新規 `.docs/ah-20260308-01/image-prompts.md`
**内容**: 7キャラ分の AI 画像生成プロンプトを設計
**受け入れ基準**:
- [x] 各キャラの「外見設定」「性格を反映した表情」「色指定」が明記されている
- [x] 全キャラ共通の「アートスタイル指定」が定義されている
- [x] 出力仕様（128x128px、PNG、透過背景）が明記されている
- [x] ネガティブプロンプト（避けたい要素）が定義されている
**依存**: P2-02（キャラ設定が必要）

### P2-04: キャラクターアイコン画像生成 🔧（プレースホルダー → 正式画像に差し替え待ち）
**ファイル**: `public/assets/characters/` 配下に7枚の PNG
**内容**: プレースホルダー画像を配置済み。正式画像に差し替え必要。
**プロンプト設計**: `.docs/ah-20260308-01/image-prompts.md` 参照

**配置先・ファイル名**:

| ファイル名 | キャラ名 | コード参照パス |
|-----------|---------|---------------|
| `public/assets/characters/akira.png` | アキラ（主人公） | `/assets/characters/akira.png` |
| `public/assets/characters/hiro.png` | ヒロ（ステージ1-1） | `/assets/characters/hiro.png` |
| `public/assets/characters/misaki.png` | ミサキ（ステージ1-2） | `/assets/characters/misaki.png` |
| `public/assets/characters/takuma.png` | タクマ（ステージ1-3） | `/assets/characters/takuma.png` |
| `public/assets/characters/rookie.png` | ルーキー（Easy） | `/assets/characters/rookie.png` |
| `public/assets/characters/regular.png` | レギュラー（Normal） | `/assets/characters/regular.png` |
| `public/assets/characters/ace.png` | エース（Hard） | `/assets/characters/ace.png` |

**受け入れ基準**:
- [x] 7枚の画像が上記パスに配置されている
- [x] 全画像が 128x128px の PNG
- [ ] アートスタイルが統一されている（同一ツール・同一セッションで生成）
- [ ] 背景が透過（または単色で切り抜き可能）
- [ ] 各キャラの特徴（髪色、表情、雰囲気）が `image-prompts.md` の設定と一致している
**依存**: P2-03
**備考**: 現在はプレースホルダー画像。`image-prompts.md` のプロンプト・外見設定を参考に AI 画像生成ツールで正式画像を作成し、上記ファイル名で差し替えてください

### P2-05: Scoreboard のキャラ名表示 ✅
**ファイル**: `components/Scoreboard.tsx`, `AirHockeyGame.tsx`
**内容**: Scoreboard に `cpuName` props を追加、「CPU」をキャラ名に置換
**受け入れ基準**:
- [x] `cpuName` が指定された場合、「CPU」の代わりにキャラ名が表示される
- [x] `cpuName` が未指定の場合、「CPU」がフォールバック表示される
- [x] AirHockeyGame から難易度に応じた `FREE_BATTLE_CHARACTERS[diff].name` が渡される
- [x] スコアテキストのレイアウトが崩れない
**依存**: P2-02

### P2-06: リアクション吹き出し描画 ✅（描画関数のみ）
**ファイル**: `renderer.ts`
**内容**: `Renderer.drawReaction()` メソッド追加
**受け入れ基準**:
- [x] 吹き出しが 1.5 秒かけてフェードアウト
- [x] CPU 側は画面上部（y=H*0.15）、プレイヤー側は画面下部（y=H*0.85）に表示
- [x] 角丸の半透明黒背景 + 白テキスト
- [ ] ゴール時に得点側キャラの `onScore` からランダム選択してテキスト表示 ← useGameLoop 統合は Phase 3
- [ ] 同時に失点側キャラの `onConcede` からランダム選択してテキスト表示 ← useGameLoop 統合は Phase 3
**依存**: P2-02
**備考**: useGameLoop からの呼び出し統合は Phase 3（ストーリーモード遷移統合）で実施

### P2-07: ストーリー進行保存 ✅
**ファイル**: 新規 `core/story.ts`
**内容**: `StoryProgress` 型、`loadStoryProgress()`, `saveStoryProgress()`, `resetStoryProgress()`, `isStageUnlocked()` の実装
**受け入れ基準**:
- [x] `loadStoryProgress()` が localStorage から進行データを読み込む
- [x] `saveStoryProgress()` が localStorage に進行データを保存する
- [x] `resetStoryProgress()` が localStorage のデータを削除する
- [x] `isStageUnlocked()` が前ステージのクリア状態を判定する
- [x] localStorage のキーが `ah_story_progress`（既存キーと衝突しない）
**依存**: なし

### P2-08: ダイアログデータ定義 ✅
**ファイル**: 新規 `core/dialogue-data.ts`
**内容**: 第1章3ステージの `StageDefinition` 配列（ダイアログ含む）
**受け入れ基準**:
- [x] `CHAPTER_1_STAGES` が3要素の配列として export される
- [x] 各ステージに `preDialogue`（3-5セリフ）、`postWinDialogue`（2-3セリフ）、`postLoseDialogue`（2セリフ）がある
- [x] `characterId` が `characters.ts` のキャラ ID と一致する
- [x] `fieldId` が `config.ts` の FIELDS ID と一致する
**依存**: P2-02, P2-07

### P2-09: Phase 2 テスト ✅
**ファイル**: 新規 `core/characters.test.ts`, `core/story.test.ts`, `core/dialogue-data.test.ts`
**内容**: キャラクターデータの整合性テスト、ストーリー進行ロジックのテスト、ダイアログデータの整合性テスト
**受け入れ基準**:
- [x] 全キャラの `reactions` に空配列がないことのテスト
- [x] `isStageUnlocked()` のテスト（初期状態で1-1のみ解放、1-1クリアで1-2解放）
- [x] `saveStoryProgress` / `loadStoryProgress` の round-trip テスト
- [x] `findCharacterById()` のテスト
- [x] ダイアログデータの整合性テスト（characterId, fieldId の参照整合性）
- [x] 既存テストが全て通る（全 241 テスト PASS）
**依存**: P2-01 〜 P2-08

---

## Phase 3: ストーリーモード UI（US-2.2 〜 US-2.6）

### P3-01: TitleScreen にストーリーボタン追加
**ファイル**: `components/TitleScreen.tsx`, `AirHockeyGame.tsx`
**内容**: 「ストーリー」ボタン追加、既存「START」を「フリー対戦」に名称変更
**受け入れ基準**:
- [ ] タイトル画面に「📖 ストーリー」ボタンがある
- [ ] 「START」ボタンのテキストが「フリー対戦」に変更されている
- [ ] ストーリーボタン押下で `onStoryClick` コールバックが呼ばれる
- [ ] 既存のフリー対戦フローが変わらない
**依存**: なし

### P3-02: GameMode 状態管理
**ファイル**: `AirHockeyGame.tsx`
**内容**: `gameMode`, `currentStage`, `storyProgress` の state 追加、`screen` 型に新画面追加
**受け入れ基準**:
- [ ] `screen` 型に `'stageSelect' | 'preDialogue' | 'vsScreen' | 'postDialogue'` が追加
- [ ] `gameMode` state が `'free' | 'story'` で管理される
- [ ] `currentStage` state が現在のステージ情報を保持する
- [ ] ストーリーボタン押下で `gameMode='story'`, `screen='stageSelect'` に遷移
**依存**: P3-01

### P3-03: ステージ選択画面
**ファイル**: 新規 `components/StageSelectScreen.tsx`
**内容**: ステージカード一覧表示、解放状態管理、ステージ選択
**受け入れ基準**:
- [ ] 章タイトル「第1章 はじめの挑戦」がヘッダーに表示される
- [ ] 3ステージがカード形式で縦並びに表示される
- [ ] 各カードに「ステージ番号」「ステージ名」「対戦相手名」「フィールド名」「難易度（★表示）」がある
- [ ] クリア済みカードに ✅ チェックマークがある
- [ ] 未解放カードは暗転 + 🔒 表示、タップ不可
- [ ] 解放済みカードをタップで `onSelectStage(stage)` が呼ばれる
- [ ] 「戻る」ボタンでタイトル画面に遷移
- [ ] 「リセット」ボタンで進行データをクリア（確認ダイアログ付き）
- [ ] キャラアイコン画像が各カードに表示される（画像未配置時はフォールバック表示）
**依存**: P2-07, P2-08, P3-02

### P3-04: ダイアログオーバーレイ
**ファイル**: 新規 `components/DialogueOverlay.tsx`
**内容**: テキストボックス形式のダイアログ表示コンポーネント
**受け入れ基準**:
- [ ] 画面全体に半透明の暗転オーバーレイ
- [ ] 画面下部にテキストボックス（角丸、半透明背景）
- [ ] テキストボックス内にキャラアイコン（64x64px）+ 名前 + セリフ
- [ ] セリフが1文字ずつ表示される（30ms/文字）
- [ ] 表示中にタップ → 全文が即座に表示される
- [ ] 全文表示後にタップ → 次のセリフへ進む
- [ ] 最後のセリフの後にタップ → `onComplete()` 呼出
- [ ] 「スキップ」ボタンで即座に `onComplete()`
- [ ] キャラアイコン画像が存在しない場合、キャラ名の頭文字がフォールバック表示
**依存**: P2-02, P3-02

### P3-05: VS 画面
**ファイル**: 新規 `components/VsScreen.tsx`
**内容**: 対決演出画面（2秒自動遷移）
**受け入れ基準**:
- [ ] 画面中央に「VS」の大文字（白、ボールド、40px以上）
- [ ] 左側にプレイヤーキャラアイコン + 名前、右側に対戦相手キャラアイコン + 名前
- [ ] 下部にステージ名とフィールド名
- [ ] 300ms フェードインで表示
- [ ] 2秒間表示後、300ms フェードアウト
- [ ] フェードアウト完了で `onComplete()` 呼出
**依存**: P2-02, P3-02

### P3-06: ストーリーモード遷移統合
**ファイル**: `AirHockeyGame.tsx`
**内容**: stageSelect → preDialogue → vsScreen → game → postDialogue → result の画面遷移を実装
**受け入れ基準**:
- [ ] ステージ選択でステージを選ぶと `preDialogue` 画面に遷移
- [ ] ダイアログ完了で `vsScreen` に遷移
- [ ] VS 画面完了で `game` 画面に遷移（カウントダウン開始）
- [ ] ゲーム中の難易度・フィールド・勝利スコアがステージ定義に従う
- [ ] 試合終了で `postDialogue` 画面に遷移（勝敗に応じたダイアログ）
- [ ] ダイアログ完了で `result` 画面に遷移
- [ ] 勝利時、ストーリー進行が保存される（次ステージ解放）
- [ ] リザルト画面「ステージ選択」ボタンで `stageSelect` に遷移
- [ ] リザルト画面「リプレイ」で同じステージを再プレイ
- [ ] スコアボードの「メニュー」ボタンでタイトル画面に戻れる
**依存**: P3-01 〜 P3-05

### P3-07: ストーリーモード用リザルト画面調整
**ファイル**: `components/ResultScreen.tsx`, `AirHockeyGame.tsx`
**内容**: ストーリーモード時に「ステージ選択に戻る」ボタンを追加
**受け入れ基準**:
- [ ] ストーリーモード時、リザルト画面に「ステージ選択」ボタンが表示される
- [ ] フリー対戦時は既存の「BACK TO MENU」のみ
- [ ] 「リプレイ」ボタンはストーリーモードでも機能する（同じステージを再プレイ）
- [ ] 勝利時に「次のステージへ」ボタンが表示される（最終ステージ以外）
**依存**: P3-06

### P3-08: Phase 3 テスト
**ファイル**: 新規テストファイル
**内容**: ストーリーモード全体の統合テスト
**受け入れ基準**:
- [ ] ステージ選択画面のコンポーネントテスト（解放状態の表示）
- [ ] ダイアログオーバーレイのコンポーネントテスト（文字送り、スキップ）
- [ ] VS 画面のコンポーネントテスト（タイマー遷移）
- [ ] 画面遷移フローの統合テスト（stageSelect → preDialogue → vsScreen → game → postDialogue → result）
- [ ] ストーリー進行保存のテスト（勝利でクリアフラグ保存、次ステージ解放）
- [ ] フリー対戦の既存テストが全て通る
**依存**: P3-01 〜 P3-07

### P3-09: Phase 3 E2E 動作確認
**内容**: ブラウザでストーリーモードを通しプレイ
**受け入れ基準**:
- [ ] ステージ1-1 → 1-2 → 1-3 を順にクリアできる
- [ ] 各ステージの前後ダイアログが正しく表示される
- [ ] VS 画面が2秒後に自動遷移する
- [ ] 敗北時のダイアログが勝利時と異なる
- [ ] ブラウザリロード後もクリア状態が保持される
- [ ] フリー対戦が従来通り動作する
- [ ] 既存の実績・ハイスコア・設定に影響がない
**依存**: P3-08

---

## Phase 4: 統合テスト・バランス調整

### P4-01: 全テスト実行
**内容**: `npm test -- air-hockey` で全テスト実行
**受け入れ基準**:
- [ ] 全テスト PASS
- [ ] 新規テストのカバレッジ 80% 以上

### P4-02: クロスブラウザ確認
**内容**: Chrome, Safari, Firefox でのプレイテスト
**受け入れ基準**:
- [ ] 各ブラウザでビジュアルが正常
- [ ] タッチ操作が正常（モバイル Chrome / Safari）
- [ ] キーボード操作が正常

### P4-03: バランス調整
**内容**: ストーリーモード各ステージの難易度微調整
**受け入れ基準**:
- [ ] ステージ1-1 は初心者が2-3回で勝てる
- [ ] ステージ1-2 はアイテム活用で勝てる
- [ ] ステージ1-3 は苦戦するが練習すれば勝てる
- [ ] カムバック補正が適切に機能する

---

## 画像プロンプト設計タスク詳細（P2-03）

P2-03 のタスク内で作成する `image-prompts.md` の構成:

### 共通スタイル指定

```
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
- Size: 128x128 pixels (will be displayed at 64x64)
- Format: PNG with transparent background
- Style consistency: all characters must be generated in the same session

### ネガティブプロンプト（避ける要素）
- realistic, photorealistic
- dark, gloomy atmosphere
- complex backgrounds
- full body shot
- text, watermark
- blurry, low quality
```

### キャラクター別プロンプト

各キャラに以下を定義:
1. **外見設定**: 髪型、髪色、目の色、服装
2. **表情**: 性格を反映した表情
3. **カラーパレット**: メインカラー、サブカラー
4. **プロンプト例**: 英語の生成プロンプト全文

例:
```
## アキラ（主人公）
- 外見: 黒髪ショート、茶色い目、白いスポーツウェア + 青いライン
- 表情: 自信に満ちた笑顔、やる気のある目
- カラー: 白 + 青（#3498db）

### プロンプト
anime style chibi character portrait, young boy with short black hair,
brown eyes, confident smile, wearing white sports jersey with blue trim,
3/4 view bust shot, clean line art, cel-shaded, bright vivid colors,
transparent background, 128x128 pixels
```

---

## 将来計画（MVP 外）

以下は MVP 完了後に着手する機能:

| 優先度 | 機能 | 依存 |
|--------|------|------|
| 高 | ストーリー第2章・第3章 | Phase 3 完了 |
| 高 | 漫画風コマ割りカットイン | Phase 3 完了 |
| 中 | ローカル2人対戦（US-3.1） | Phase 1 完了 |
| 中 | ボスキャラ固有 AI | ストーリー第3章 |
| 低 | チャレンジモード | Phase 1 完了 |
| 低 | フィールド固有演出 | Phase 1 完了 |
| 低 | 実績拡充 | Phase 3 完了 |
