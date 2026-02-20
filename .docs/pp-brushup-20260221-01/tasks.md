# Picture Puzzle ブラッシュアップ - タスクチェックリスト

---

## Phase 1: 基盤整備（Foundation）

### 1-1. 画像アップロード機能の削除

- [x] **`ImageUploader` コンポーネント削除**
  - 対象: `src/components/molecules/ImageUploader.tsx`
  - 作業: ファイルを削除
  - 完了条件: ファイルが存在しないこと
  - 依存: なし

- [x] **`ImageUploader` スタイル削除**
  - 対象: `src/components/molecules/ImageUploader.styles.ts`
  - 作業: ファイルを削除
  - 完了条件: ファイルが存在しないこと
  - 依存: なし

- [x] **`ImageUploader` テスト削除**
  - 対象: `src/components/molecules/ImageUploader.test.tsx`（存在する場合）
  - 作業: ファイルを削除
  - 完了条件: ファイルが存在しないこと
  - 依存: なし

- [x] **トグル UI の削除**
  - 対象: `src/components/PuzzleSections.tsx`
  - 作業: `ToggleButtonsContainer`、`ToggleButton`、`imageSourceMode` による条件分岐を削除。`DefaultImageSelector` を常時表示に変更
  - 完了条件: トグル UI がレンダリングされず、デフォルト画像選択が直接表示されること
  - 依存: なし

- [x] **`imageSourceMode` 状態の削除**
  - 対象: `src/hooks/useGameState.ts`
  - 作業: `imageSourceMode` / `setImageSourceMode` 状態と、それを返す部分を削除
  - 完了条件: `useGameState` の返り値に `imageSourceMode` が含まれないこと
  - 依存: トグル UI 削除後

- [x] **`PuzzlePage` からアップロード関連 props 削除**
  - 対象: `src/pages/PuzzlePage.tsx`
  - 作業: `SetupSectionComponent` に渡す `imageSourceMode` / `setImageSourceMode` props を削除
  - 完了条件: `PuzzlePage` にアップロード関連のコードが残っていないこと
  - 依存: `imageSourceMode` 状態削除後

- [x] **`SetupSectionProps` 型定義の更新**
  - 対象: `src/components/PuzzleSections.tsx`
  - 作業: `SetupSectionProps` から `imageSourceMode` / `setImageSourceMode` を削除
  - 完了条件: 型定義にアップロード関連プロパティがないこと
  - 依存: トグル UI 削除後

- [x] **`checkFileSize` 関数の削除**
  - 対象: `src/utils/puzzle-utils.ts`
  - 作業: `checkFileSize` 関数を削除
  - 完了条件: 関数が存在せず、インポート先にもエラーがないこと
  - 依存: なし

- [x] **`extractImageName` の data URL 分岐削除**
  - 対象: `src/utils/storage-utils.ts`
  - 作業: `imageUrl.startsWith('data:')` の分岐を削除
  - 完了条件: data URL に対して `'アップロード画像'` を返す分岐がないこと
  - 依存: なし

- [x] **`PuzzlePage.styles.ts` からトグルスタイル削除**
  - 対象: `src/pages/PuzzlePage.styles.ts`
  - 作業: `ToggleButtonsContainer`、`ToggleButton` のスタイル定義を削除
  - 完了条件: トグル関連のスタイル定義がないこと
  - 依存: トグル UI 削除後

- [x] **遊び方テキストの更新**
  - 対象: `src/pages/PuzzlePage.tsx`
  - 作業: `<InstructionsList>` の最初の項目から「画像をアップロードするか、」を削除
  - 完了条件: 遊び方の説明にアップロードの記述がないこと
  - 依存: なし

- [x] **テストの実行と修正**
  - 対象: 全テストファイル
  - 作業: `npm test` を実行し、アップロード関連の参照でエラーが出るテストを修正
  - 完了条件: `npm test` がすべてパスすること
  - 依存: 上記すべて完了後

---

### 1-2. 著作権リスクのあるファイル名・alt テキストのリネーム

- [x] **画像ファイルのリネーム**
  - 対象: `public/images/default/`
  - 作業:
    - `hokusai_kangchenjunga.webp` → `snowy_mountain_ukiyoe.webp`
    - `midnight_times_square.webp` → `midnight_neon_street.webp`
  - 完了条件: 旧ファイル名が存在せず、新ファイル名でアクセスできること
  - 依存: 1-1 完了

- [x] **動画ファイルのリネーム**
  - 対象: `public/videos/default/`
  - 作業:
    - `hokusai_kangchenjunga.mp4` → `snowy_mountain_ukiyoe.mp4`（存在する場合）
    - `midnight_times_square.mp4` → `midnight_neon_street.mp4`（存在する場合）
  - 完了条件: 旧ファイル名が存在せず、新ファイル名でアクセスできること
  - 依存: 1-1 完了

- [x] **`DefaultImageSelector.tsx` の参照更新**
  - 対象: `src/components/molecules/DefaultImageSelector.tsx`
  - 作業:
    - `hokusai_kangchenjunga.webp` → `snowy_mountain_ukiyoe.webp`
    - `'カンチェンジュンガの北斎'` → `'雪山の浮世絵風イラスト'`
    - `midnight_times_square.webp` → `midnight_neon_street.webp`
    - `'真夜中のタイムズスクエア'` → `'真夜中のネオン街'`
  - 完了条件: DEFAULT_IMAGES 配列に旧名が含まれないこと
  - 依存: 画像ファイルリネーム後

- [x] **`useVideoPlayback.ts` の参照更新**
  - 対象: `src/hooks/useVideoPlayback.ts`
  - 作業: `validFilenames` 配列内の
    - `'hokusai_kangchenjunga'` → `'snowy_mountain_ukiyoe'`
    - `'midnight_times_square'` → `'midnight_neon_street'`
  - 完了条件: validFilenames に旧名が含まれないこと
  - 依存: 動画ファイルリネーム後

- [x] **テスト内の参照更新**
  - 対象: `src/components/molecules/DefaultImageSelector.test.tsx`、その他関連テスト
  - 作業: テスト内の旧ファイル名・旧 alt テキストを新しいものに更新
  - 完了条件: `npm test` がすべてパスすること
  - 依存: 上記すべて完了後

---

### 1-3. 手数カウンター＆進捗表示

- [x] **新規アトム追加**
  - 対象: `src/store/atoms.ts`
  - 作業: `moveCountAtom`、`shuffleMovesAtom`、`correctRateAtom`、`hintUsedAtom` を追加
  - 完了条件: 4 つのアトムが export されていること
  - 依存: 1-2 完了

- [x] **`usePuzzle.ts` に手数カウント追加**
  - 対象: `src/hooks/usePuzzle.ts`
  - 作業:
    - `initializePuzzle` で `moveCountAtom` を 0 にリセット、`shuffleMovesAtom` に `calculateShuffleMoves(division)` の値を保存
    - `movePiece` で `moveCountAtom` を +1
    - `movePiece` 後に `correctRateAtom` を `calculateCorrectRate(updatedPieces)` で更新
  - 完了条件: ピース移動ごとに手数がインクリメントされ、正解率が更新されること
  - 依存: アトム追加後

- [x] **`calculateCorrectRate` 関数の実装**
  - 対象: `src/utils/puzzle-utils.ts`
  - 作業: 正解率計算関数を追加。空ピースを除く全ピースのうち正解位置にあるものの割合を返す
  - 完了条件: 全ピース正解で 100、全ピース不正解で 0 を返すこと
  - 依存: なし

- [x] **ヒント使用追跡**
  - 対象: `src/hooks/useHintMode.ts`
  - 作業: `toggleHintMode` で `hintModeEnabled` が `true` になるとき、`hintUsedAtom` も `true` に設定
  - 完了条件: 一度でもヒントを表示したら `hintUsedAtom` が `true` になること
  - 依存: アトム追加後

- [x] **StatusBar の 3 列化**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`、`PuzzleBoard.styles.ts`
  - 作業:
    - StatusBar を CSS Grid 3 列に変更
    - 経過時間 / 手数 / 正解率% を表示
    - props に `moveCount`、`correctRate` を追加
  - 完了条件: StatusBar に 3 つの情報が表示されること
  - 依存: usePuzzle 変更後

- [x] **PuzzleBoard の props 更新**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: `PuzzleBoardProps` に `moveCount: number`、`correctRate: number` を追加
  - 完了条件: 型定義が更新されていること
  - 依存: StatusBar 3 列化と同時

- [x] **props 伝搬の更新**
  - 対象: `src/components/PuzzleSections.tsx`
  - 作業: `GameSectionComponent` → `PuzzleBoard` に `moveCount`、`correctRate` を渡す
  - 完了条件: 値が正しく表示されること
  - 依存: PuzzleBoard props 更新後

- [x] **テストの追加**
  - 対象: `src/utils/puzzle-utils.test.ts`
  - 作業: `calculateCorrectRate` のユニットテストを追加
  - 完了条件: テストがパスすること
  - 依存: 関数実装後

---

### 1-4. スコアリングシステム

- [x] **型定義の追加**
  - 対象: `src/types/puzzle.ts`（新規作成）
  - 作業: `PuzzleScore`、`PuzzleRank`、`DIVISION_MULTIPLIERS`、`RANK_THRESHOLDS` を定義
  - 完了条件: 型が正しく export されていること
  - 依存: 1-3 完了

- [x] **`calculateScore` 関数の実装**
  - 対象: `src/utils/score-utils.ts`（新規作成）
  - 作業: スコア計算ロジック実装。Base 10,000 - 手数ペナルティ - タイムペナルティ - ヒントペナルティ × 難易度倍率
  - 完了条件: 仕様通りのスコア計算ができること
  - 依存: 型定義追加後

- [x] **`determineRank` 関数の実装**
  - 対象: `src/utils/score-utils.ts`
  - 作業: スコアからランクを判定（★★★ >= 8000、★★☆ >= 5000、★☆☆ >= 2000、クリア < 2000）
  - 完了条件: 各閾値で正しいランクが返ること
  - 依存: 型定義追加後

- [x] **パズル完成時のスコア計算統合**
  - 対象: `src/hooks/useGameState.ts`
  - 作業: `completed` が `true` になったタイミングで `calculateScore` を実行し、結果を保持
  - 完了条件: 完成時にスコアが計算されること
  - 依存: `calculateScore` 実装後

- [x] **テストの追加**
  - 対象: `src/utils/score-utils.test.ts`（新規作成）
  - 作業: `calculateScore`、`determineRank` のユニットテスト
  - 完了条件: 境界値テスト含めすべてパスすること
  - 依存: 関数実装後

---

### 1-5. リザルト画面の強化

- [x] **`ResultScreen` コンポーネント作成**
  - 対象: `src/components/molecules/ResultScreen.tsx`（新規作成）
  - 作業: 画像名・難易度・タイム・手数・スコア・ランク・ベストスコア更新表示を含むリザルト画面
  - 完了条件: 仕様通りの情報が表示されること
  - 依存: 1-4 完了

- [x] **`ResultScreen` スタイル作成**
  - 対象: `src/components/molecules/ResultScreen.styles.ts`（新規作成）
  - 作業: glassmorphism デザインに合わせたスタイル
  - 完了条件: ダークテーマ・ライトテーマの両方で適切に表示されること
  - 依存: なし

- [x] **`PuzzleRecord` ストレージ関連実装**
  - 対象: `src/utils/storage-utils.ts`
  - 作業: `PuzzleRecord` 型追加、`getPuzzleRecords`、`savePuzzleRecords`、`recordScore` 関数を実装
  - 完了条件: ベストスコアの保存・取得・更新判定が正しく動作すること
  - 依存: 型定義追加後

- [x] **既存 `CompletionOverlay` の置き換え**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: 完成時のオーバーレイ部分を `ResultScreen` コンポーネントに置き換え
  - 完了条件: 完成時に `ResultScreen` が表示され、旧 `CompletionOverlay` が表示されないこと
  - 依存: `ResultScreen` 完成後

- [x] **SNS シェアテキストの拡充**
  - 対象: `src/components/PuzzleSections.tsx`
  - 作業: `ShareButton` の `text` props にスコアとランクを追加
  - 完了条件: シェアテキストに「スコア: X,XXX ランク: ★★☆」のような情報が含まれること
  - 依存: スコア計算統合後

- [x] **データマイグレーション実装**
  - 対象: `src/utils/storage-utils.ts`
  - 作業: `migrateClearHistory` 関数を実装し、アプリ起動時に一度だけ実行
  - 完了条件: 既存の `ClearHistory` が `PuzzleRecord` に変換され、二重実行されないこと
  - 依存: `PuzzleRecord` ストレージ実装後

- [x] **Phase 1 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全パス確認、手動で一連のゲームフロー（画像選択→ゲーム開始→クリア→リザルト確認）を検証
  - 完了条件: すべてのテストがパスし、手動検証で問題なし
  - 依存: Phase 1 全タスク完了後

---

## Phase 2: サウンド＆操作改善（Sound & Controls）

### 2-1. BGM システム

- [ ] **BGM アトム追加**
  - 対象: `src/store/atoms.ts`
  - 作業: `bgmTrackIdAtom`、`bgmVolumeAtom`、`bgmPlayingAtom` を追加
  - 完了条件: アトムが export されていること
  - 依存: Phase 1 完了

- [ ] **BGM トラックデータ作成**
  - 対象: `src/utils/bgm-data.ts`（新規作成）
  - 作業: 4 トラック（静かな水面、星空のワルツ、朝の散歩道、深い思索）のメロディ/ベース MIDI ノート配列を定義
  - 完了条件: 4 トラックのデータが型安全に定義されていること
  - 依存: なし

- [ ] **`useBgm` フック実装**
  - 対象: `src/hooks/useBgm.ts`（新規作成）
  - 作業: Tone.js を使った BGM 再生管理。動的 import、AudioContext 初期化、再生/停止、トラック切り替え、音量制御、ループ再生
  - 完了条件: 4 トラックがループ再生でき、音量調整・トラック切り替えが動作すること
  - 依存: BGM トラックデータ後

- [ ] **`BgmController` コンポーネント作成**
  - 対象: `src/components/molecules/BgmController.tsx`（新規作成）
  - 作業: トラック名表示、再生/停止、前/次トラック、音量スライダー
  - 完了条件: UI が仕様通りに表示・操作できること
  - 依存: `useBgm` フック後

- [ ] **`BgmController` スタイル作成**
  - 対象: `src/components/molecules/BgmController.styles.ts`（新規作成）
  - 作業: glassmorphism デザインに合わせたスタイル
  - 完了条件: テーマに合ったデザインで表示されること
  - 依存: なし

- [ ] **BGM の PuzzleBoard 統合**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: StatusBar の下に `BgmController` を配置
  - 完了条件: ゲーム画面で BGM コントロールが表示されること
  - 依存: `BgmController` 完成後

- [ ] **ゲーム開始時の AudioContext 初期化**
  - 対象: `src/hooks/useGameState.ts`
  - 作業: `handleStartGame` で `Tone.start()` を呼び出し
  - 完了条件: ゲーム開始後に BGM 再生が可能になること
  - 依存: `useBgm` フック後

- [ ] **音量設定の localStorage 保存**
  - 対象: `src/hooks/useBgm.ts`
  - 作業: 音量変更時に `puzzle_bgm_volume` キーで保存、初期化時に読み込み
  - 完了条件: ページリロード後も音量設定が維持されること
  - 依存: `useBgm` フック後

---

### 2-2. SE＆アニメーション

- [ ] **`useSePlayer` フック実装**
  - 対象: `src/hooks/useSePlayer.ts`（新規作成）
  - 作業: Tone.js Synth を使った 3 種 SE（スライド: 600Hz/0.05s、正解位置: 880Hz/0.12s、完成: 523Hz/0.3s）
  - 完了条件: 3 種の SE が個別に再生できること
  - 依存: 2-1 完了（AudioContext 共有）

- [ ] **ピース移動時の SE 再生**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: `handleSlidePiece` 内でスライド SE を再生。正解位置に移動した場合は正解位置 SE も再生
  - 完了条件: スライド時に音が鳴り、正解位置移動時に追加の音が鳴ること
  - 依存: `useSePlayer` 後

- [ ] **完成時の SE 再生**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: `completed` が `true` になったタイミングで完成 SE を再生
  - 完了条件: パズル完成時に SE が鳴ること
  - 依存: `useSePlayer` 後

- [ ] **正解位置の緑ボーダーフラッシュ**
  - 対象: `src/components/molecules/PuzzlePiece.tsx`、`PuzzlePiece.styles.ts`
  - 作業: ピースが正解位置に移動した瞬間に 0.5s の緑ボーダーフラッシュアニメーション
  - 完了条件: 正解位置に移動したピースに緑のフラッシュが表示されること
  - 依存: なし

- [ ] **完成時パーティクルアニメーション**
  - 対象: `src/components/organisms/PuzzleBoard.styles.ts`
  - 作業: CSS アニメーションによる紙吹雪/パーティクル効果。ボーダーの段階的溶解（外周→中心）
  - 完了条件: 完成時に視覚的なお祝いアニメーションが表示されること
  - 依存: なし

---

### 2-3. スワイプ操作

- [ ] **`useSwipe` フック実装**
  - 対象: `src/hooks/useSwipe.ts`（新規作成）
  - 作業: タッチイベント（touchstart/touchmove/touchend）でスワイプ方向を検出。30px 閾値
  - 完了条件: 4 方向のスワイプが検出できること
  - 依存: Phase 1 完了

- [ ] **PuzzleBoard へのスワイプ統合**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: `Board` 要素に `useSwipe` を適用。スワイプ方向から移動すべきピースを特定し `onPieceMove` を呼び出し
  - 完了条件: スワイプでピースが正しい方向に移動すること
  - 依存: `useSwipe` フック後

- [ ] **スワイプとクリックの競合防止**
  - 対象: `src/hooks/useSwipe.ts`
  - 作業: 30px 未満の移動はスワイプとして処理しない（クリックイベントに任せる）
  - 完了条件: 短いタップがクリックとして動作し、長いスワイプがスワイプとして動作すること
  - 依存: スワイプ統合後

---

### 2-4. キーボード操作

- [ ] **`useKeyboard` フック実装**
  - 対象: `src/hooks/useKeyboard.ts`（新規作成）
  - 作業: `keydown` イベントで Arrow/WASD/H/R/M を検出。ゲーム中のみアクティブ
  - 完了条件: 全キーバインドが正しく動作すること
  - 依存: Phase 1 完了

- [ ] **PuzzleBoard へのキーボード統合**
  - 対象: `src/components/organisms/PuzzleBoard.tsx`
  - 作業: `useKeyboard` を統合し、方向キーでピース移動、H でヒント、R でリセット、M で BGM トグル
  - 完了条件: キーボードでゲーム操作ができること
  - 依存: `useKeyboard` フック後、2-1 BGM 後

- [ ] **Phase 2 統合テスト**
  - 対象: 全ファイル
  - 作業: BGM・SE・スワイプ・キーボードの統合テスト。モバイル端末（iOS Safari、Android Chrome）での動作確認
  - 完了条件: すべての機能が正常に動作すること
  - 依存: Phase 2 全タスク完了後

---

## Phase 3: コンテンツ＆リプレイ性（Content & Replay）

### 3-1. テーマコレクション

- [ ] **テーマ・画像型定義**
  - 対象: `src/types/puzzle.ts`
  - 作業: `ThemeId`、`UnlockCondition`、`PuzzleImage`、`Theme` 型を追加
  - 完了条件: 型が export されていること
  - 依存: Phase 1 完了

- [ ] **テーマデータ定義**
  - 対象: `src/data/themes.ts`（新規作成）
  - 作業: 6 テーマ × 画像の定義データ。既存 6 枚 + 新規 12 枚 = 18 枚の `PuzzleImage` を含む
  - 完了条件: 6 テーマが定義され、各画像に適切なメタデータがあること
  - 依存: 型定義後

- [ ] **`isThemeUnlocked` 関数の実装**
  - 対象: `src/utils/score-utils.ts`
  - 作業: `UnlockCondition` に基づくアンロック判定ロジック
  - 完了条件: always / clearCount / themesClear の全条件で正しく判定されること
  - 依存: 型定義後

- [ ] **累計クリア回数の管理**
  - 対象: `src/utils/storage-utils.ts`
  - 作業: `puzzle_total_clears` キーで累計クリア回数を管理する関数を追加
  - 完了条件: クリアごとにカウントが増加し、永続化されること
  - 依存: なし

- [ ] **`ThemeSelector` コンポーネント作成**
  - 対象: `src/components/molecules/ThemeSelector.tsx`（新規作成）
  - 作業: テーマタブ + 画像グリッド。ロック中テーマは鍵アイコン、アンロック条件ツールチップ
  - 完了条件: テーマ切り替えと画像選択ができること
  - 依存: テーマデータ定義後

- [ ] **`ThemeSelector` スタイル作成**
  - 対象: `src/components/molecules/ThemeSelector.styles.ts`（新規作成）
  - 作業: テーマタブとグリッドのスタイル
  - 完了条件: デザインがテーマに合っていること
  - 依存: なし

- [ ] **`DefaultImageSelector` → `ThemeSelector` への置き換え**
  - 対象: `src/components/PuzzleSections.tsx`
  - 作業: `SetupSectionComponent` 内の `DefaultImageSelector` を `ThemeSelector` に置き換え
  - 完了条件: 画像選択が新しいテーマ UI で行えること
  - 依存: `ThemeSelector` 完成後

- [ ] **`useVideoPlayback.ts` に新規画像対応追加**
  - 対象: `src/hooks/useVideoPlayback.ts`
  - 作業: `validFilenames` 配列に新規画像 12 枚分のファイル名を追加
  - 完了条件: 新規画像の完成動画が再生可能であること
  - 依存: 動画アセット完成後

---

### 3-2. ベストスコアボード

- [ ] **ベストスコアボード UI 作成**
  - 対象: `src/components/molecules/ClearHistoryList.tsx`（改修）
  - 作業: 既存のフラットリストから、画像×難易度ごとのベストスコア表示に変更。タブ/フィルターで画像・難易度を切り替え
  - 完了条件: 画像×難易度ごとのベストスコア・ランク・クリア回数が表示されること
  - 依存: Phase 1 完了

- [ ] **ベストスコア更新ハイライト**
  - 対象: リザルト画面
  - 作業: `recordScore` の返り値 `isBestScore` に基づき、リザルト画面に「ベストスコア更新！」を表示
  - 完了条件: ベスト更新時にハイライトが表示されること
  - 依存: `ResultScreen` 完成後

---

### 3-3. ランクバッジ表示

- [ ] **画像カードにランクバッジ追加**
  - 対象: `src/components/molecules/ThemeSelector.tsx`
  - 作業: `PuzzleRecord` からベストランクを取得し、画像サムネイル上にバッジ（★★★ 等）を表示
  - 完了条件: クリア済み画像にランクバッジが表示され、未クリア画像にはバッジがないこと
  - 依存: 3-1 テーマコレクション完了後

- [ ] **コレクション進捗表示**
  - 対象: `src/components/molecules/ThemeSelector.tsx`
  - 作業: テーマごとのクリア率（クリア済み画像数 / 全画像数）をプログレスバーで表示
  - 完了条件: テーマタブにクリア進捗が表示されること
  - 依存: ランクバッジ追加後

- [ ] **Phase 3 統合テスト**
  - 対象: 全ファイル
  - 作業: テーマアンロック・ベストスコア・ランクバッジの統合テスト。新規画像 12 枚 + 動画 12 本の表示確認
  - 完了条件: すべての機能が正常に動作すること
  - 依存: Phase 3 全タスク完了後

---

## アセット制作チケット（独立作業）

以下はコード実装とは独立して並列進行可能。

---

### A-1. 画像アセット作成

**概要**: 既存 6 枚に加え、新規 12 枚の画像を制作

**共通仕様**:
- フォーマット: WebP
- 推奨サイズ: ~1024x1024px
- 配置先: `public/images/default/`
- 命名: `lowercase_snake_case.webp`
- タイトル規則: 実在の人名・商標・施設名・作品名を含めない

**制作一覧**:

| # | テーマ | ファイル名 | alt テキスト | 優先度 |
|---|--------|----------|------------|--------|
| 1 | イラストギャラリー | (要決定) | (要決定) | 高 |
| 2 | イラストギャラリー | (要決定) | (要決定) | 高 |
| 3 | 世界の風景 | (要決定) | (要決定) | 高 |
| 4 | 世界の風景 | (要決定) | (要決定) | 高 |
| 5 | ノスタルジー | (要決定) | (要決定) | 高 |
| 6 | ノスタルジー | (要決定) | (要決定) | 高 |
| 7 | 海と空 | `coral_reef_fish.webp` | サンゴ礁の熱帯魚 | 中 |
| 8 | 海と空 | `cumulonimbus_port_town.webp` | 入道雲の港町 | 中 |
| 9 | 海と空 | `starry_beach.webp` | 星降る砂浜 | 中 |
| 10 | 四季 | `cherry_blossom_path.webp` | 桜並木の小道 | 中 |
| 11 | 四季 | `autumn_valley.webp` | 紅葉の渓谷 | 中 |
| 12 | 四季 | `snow_lantern_hotspring.webp` | 雪灯りの温泉 | 中 |

**ミステリーテーマ（3 枚）**: 内容は未定。全テーマクリア後のサプライズ要素として、ユニークな画像を制作

**完了条件**: 12 枚の WebP 画像が `public/images/default/` に配置されていること

---

### A-2. 動画アセット作成

**概要**: 新規画像に対応する完成演出動画を制作

**共通仕様**:
- フォーマット: MP4 (H.264)
- 長さ: 5〜10 秒
- 配置先: `public/videos/default/`
- 命名: 対応画像と同じベース名 + `.mp4`
- 内容: 対応画像のアニメーション版

**制作一覧**: 画像アセット 12 枚それぞれに対応する動画 12 本

**依存**: 画像アセット（A-1）完成後に着手

**完了条件**: 12 本の MP4 動画が `public/videos/default/` に配置され、完成時に再生できること

---

### A-3. BGM 作曲（4 トラック）

**概要**: Tone.js オシレーターで再生する BGM データを作曲

**トラック一覧**:

| # | ID | 名前 | BPM | 調 | メロディ波形 | ベース波形 | 雰囲気 |
|---|----|----|-----|-----|-------------|-----------|--------|
| 1 | `calm-water` | 静かな水面 | 72 | C Major | sine | triangle | 穏やかなアンビエント |
| 2 | `starry-waltz` | 星空のワルツ | 84 | G Major | triangle | sine | エレガントな 3/4 拍子 |
| 3 | `morning-walk` | 朝の散歩道 | 96 | F Major | square | sine | 軽快なチップチューン風 |
| 4 | `deep-thought` | 深い思索 | 60 | A Minor | sine | triangle | ミニマルで集中向け |

**各トラックの仕様**:
- メロディ: 8 小節 × 4 拍 = 32 ノート
- ベース: 8 小節 × 4 拍 = 32 ノート
- データ形式: MIDI ノート番号配列（number | null）
- ループ可能であること
- 非侵入的で BGM として心地よいこと

**成果物**: `src/utils/bgm-data.ts` に記述する `BgmTrack[]` データ

**依存**: なし（コード実装と独立）

**完了条件**: 4 トラックのメロディ/ベースデータが定義され、Tone.js で再生して自然なループが確認できること
