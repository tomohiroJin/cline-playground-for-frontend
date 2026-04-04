# Air Hockey S8 — リファクタリング・UI 改善・Chapter 2 タスクチェックリスト

> 凡例: ⬜ 未着手 / 🔄 作業中 / ✅ 完了 / ⏭️ スキップ

---

## Phase S8-1: AirHockeyGame.tsx Hook 分割リファクタリング（L）

### S8-1-0: 事前準備

- ⬜ S8-1-0a: リファクタリング前のベースライン確認（`npm run ci` 全パス）
- ⬜ S8-1-0b: AirHockeyGame.tsx の現在行数を記録（ベースライン: 586 行）

### S8-1-1: useUIOverlayState 抽出

- ⬜ S8-1-1a: `presentation/hooks/useUIOverlayState.ts` を新規作成
- ⬜ S8-1-1b: `showHelp`, `showTutorial`, `isHelpMode`, `showSettings`, `showExitConfirm`, `selectedCharacterId` の useState を移動
- ⬜ S8-1-1c: `handleTutorialComplete` ロジックを Hook 内に移動
- ⬜ S8-1-1d: AirHockeyGame.tsx で `useUIOverlayState()` を呼び出し、既存参照を置換
- ⬜ S8-1-1e: `npm run ci` 全パス確認

### S8-1-2: useStoryScreen 抽出

- ⬜ S8-1-2a: `presentation/hooks/useStoryScreen.ts` を新規作成
- ⬜ S8-1-2b: `cpuCharacter`, `storyCharacters`, `stageBackgroundUrl`, `hasNextStage`, `storyAiConfig` の useMemo を移動
- ⬜ S8-1-2c: AirHockeyGame.tsx で `useStoryScreen()` を呼び出し、既存参照を置換
- ⬜ S8-1-2d: `npm run ci` 全パス確認

### S8-1-3: useFreeBattleScreen 抽出

- ⬜ S8-1-3a: `presentation/hooks/useFreeBattleScreen.ts` を新規作成
- ⬜ S8-1-3b: `freeBattleAiConfig`, `freeBattleCpuCharacter`, `freeBattleSelectableCharacters` の useMemo を移動
- ⬜ S8-1-3c: AirHockeyGame.tsx で `useFreeBattleScreen()` を呼び出し、既存参照を置換
- ⬜ S8-1-3d: `npm run ci` 全パス確認

### S8-1-4: usePairMatchSetup 抽出

- ⬜ S8-1-4a: `presentation/hooks/usePairMatchSetup.ts` を新規作成
- ⬜ S8-1-4b: `pairAlly`, `pairEnemy1`, `pairEnemy2` のデフォルト算出を移動
- ⬜ S8-1-4c: `resultPlayerCharacter`, `resultOpponentCharacter`, `currentCpuName` の算出を移動
- ⬜ S8-1-4d: AirHockeyGame.tsx で `usePairMatchSetup()` を呼び出し、既存参照を置換
- ⬜ S8-1-4e: `npm run ci` 全パス確認

### S8-1-5: useGameHandlers 抽出

- ⬜ S8-1-5a: `presentation/hooks/useGameHandlers.ts` を新規作成
- ⬜ S8-1-5b: メニュー系ハンドラを移動（handleFreeStart, handleStoryClick, handleDailyChallengeClick, handleBackToMenu 等）
- ⬜ S8-1-5c: ストーリー系ハンドラを移動（handleSelectStage, handleStoryReset, handleNextStage, handlePostDialogueComplete 等）
- ⬜ S8-1-5d: ゲーム操作系ハンドラを移動（handleGameMenuClick, handleExitConfirm, handleExitCancel, handleScreenChange 等）
- ⬜ S8-1-5e: キャラ選択・2v2 系ハンドラを移動（handleStartBattle, handlePairMatchStart 等）
- ⬜ S8-1-5f: リザルト系ハンドラを移動（handleResultBackToMenu, handleAcceptDifficulty 等）
- ⬜ S8-1-5g: AirHockeyGame.tsx で `useGameHandlers()` を呼び出し、既存参照を置換
- ⬜ S8-1-5h: `npm run ci` 全パス確認
- ⬜ S8-1-5i: `useGameHandlers.ts` の行数確認（200 行超の場合はメニュー系/ゲーム操作系/ストーリー系に二次分割を検討）

### S8-1-6: 最終整理・検証

- ⬜ S8-1-6a: AirHockeyGame.tsx の不要な import を整理
- ⬜ S8-1-6b: AirHockeyGame.tsx の最終行数を確認（目標: 350 行以下）
- ⬜ S8-1-6c: 全テストスイート全パス確認（`npm run ci`）
- ⬜ S8-1-6d: 手動確認 — フリー対戦の正常動作
- ⬜ S8-1-6e: 手動確認 — ストーリーモードの正常動作
- ⬜ S8-1-6f: 手動確認 — 2P 対戦の正常動作
- ⬜ S8-1-6g: 手動確認 — ペアマッチ 2v2 の正常動作
- ⬜ S8-1-6h: 手動確認 — デイリーチャレンジの正常動作

---

## Phase S8-2: ConfirmDialog CSS Transition アニメーション（S）

### S8-2-1: アニメーション状態管理

- ⬜ S8-2-1a: `ConfirmDialog` に内部状態 `animationPhase` を追加（`'closed' | 'opening' | 'open' | 'closing'`）
- ⬜ S8-2-1b: `isOpen` の変化を監視し、`animationPhase` を更新する useEffect を実装
- ⬜ S8-2-1c: `animationPhase === 'closed'` のとき `return null`（DOM 除去）
- ⬜ S8-2-1d: `onTransitionEnd` で `closing → closed` 遷移を処理
- ⬜ S8-2-1e: フォールバック `setTimeout(200)` を追加（`onTransitionEnd` 未発火対策）
- ⬜ S8-2-1f: `closing` フェーズ中はオーバーレイ・ボタンに `pointer-events: none` を適用（コールバック再発火防止）

### S8-2-2: CSS Transition スタイル

- ⬜ S8-2-2a: オーバーレイに `opacity` transition を追加（opening: 200ms ease-out, closing: 150ms ease-in）
- ⬜ S8-2-2b: ダイアログボックスに `opacity` + `transform(scale)` transition を追加
- ⬜ S8-2-2c: `prefers-reduced-motion: reduce` 時に `transition-duration: 0ms` を適用

### S8-2-2b: フォーカストラップ

- ⬜ S8-2-2d: `Tab` / `Shift+Tab` でダイアログ内ボタン間のみフォーカスがループするトラップを実装
- ⬜ S8-2-2e: `confirmRef` を追加し、cancelRef と合わせてフォーカス対象を管理

### S8-2-3: テスト

- ⬜ S8-2-3a: テスト — `isOpen=true` 時にオーバーレイが表示される（既存テスト互換）
- ⬜ S8-2-3b: テスト — `isOpen=false` → `true` で opening → open の遷移
- ⬜ S8-2-3c: テスト — `isOpen=true` → `false` で closing 後に DOM から除去
- ⬜ S8-2-3d: テスト — `prefers-reduced-motion` 時に即座に遷移（transition-duration: 0ms）
- ⬜ S8-2-3e: テスト — フォールバック timer で closing → closed が確実に発生
- ⬜ S8-2-3f: テスト — closing フェーズ中のオーバーレイクリックが `onCancel` を呼ばないこと
- ⬜ S8-2-3g: テスト — Tab キーでフォーカスがダイアログ内ボタン間をループすること
- ⬜ S8-2-3h: テスト — Shift+Tab でフォーカスが逆方向にループすること

### S8-2-4: 検証

- ⬜ S8-2-4a: 既存 ConfirmDialog テスト全パス確認
- ⬜ S8-2-4b: `npm run ci` 全パス確認
- ⬜ S8-2-4c: 手動確認 — ゲーム中メニューボタンで滑らかに開閉
- ⬜ S8-2-4d: 手動確認 — `prefers-reduced-motion` 設定時にアニメーション無効

---

## Phase S8-3: ストーリー Chapter 2 実装（XL）

### S8-3-1: 新キャラクター定義

- ⬜ S8-3-1a: `characters.ts` にカナタ（kanata）のキャラクター定義を追加
- ⬜ S8-3-1b: `characters.ts` にリク（riku）のキャラクター定義を追加（ダイアログ用最小構成）
- ⬜ S8-3-1c: `characters.ts` にシオン（shion）のキャラクター定義を追加（ダイアログ用最小構成）
- ⬜ S8-3-1d: テスト — 新キャラの ID が一意であること
- ⬜ S8-3-1e: テスト — 新キャラの必須フィールドが存在すること
- ⬜ S8-3-1f: `npm run ci` 全パス確認

### S8-3-2: カナタの AI プロファイル

- ⬜ S8-3-2a: `character-ai-profiles.ts` にカナタの AI プロファイルを追加
- ⬜ S8-3-2b: テスト — カナタの AI プロファイルのパラメータ範囲チェック
- ⬜ S8-3-2c: テスト — カナタの `deflectionBias` が高め（壁バウンス多用）であること
- ⬜ S8-3-2d: `npm run ci` 全パス確認

### S8-3-3: フィールド確認（既存定義を使用）

- ⬜ S8-3-3a: zigzag, fortress, bastion, pillars が `config.ts` に定義済みであることを確認
- ⬜ S8-3-3b: 各フィールドの障害物配置がストーリーの文脈（練習→1回戦→準決勝→決勝）と適合するか確認
- ⬜ S8-3-3c: バランステスト後に微調整が必要な場合のみ障害物位置・サイズを変更

### S8-3-4: ステージバランス設定

- ⬜ S8-3-4a: `story-balance.ts` に Stage 2-1 のバランス設定を追加
- ⬜ S8-3-4b: `story-balance.ts` に Stage 2-2 のバランス設定を追加
- ⬜ S8-3-4c: `story-balance.ts` に Stage 2-3 のバランス設定を追加（カナタ AI）
- ⬜ S8-3-4d: `story-balance.ts` に Stage 2-4 のバランス設定を追加（レン強化版 AI）
- ⬜ S8-3-4e: テスト — 各ステージの AI パラメータが有効範囲内であること
- ⬜ S8-3-4f: `npm run ci` 全パス確認

### S8-3-5: ダイアログデータ作成

- ⬜ S8-3-5a: `core/chapter2-dialogue-data.ts` を新規作成
- ⬜ S8-3-5b: Stage 2-1（嵐の前の一打）のダイアログ作成（pre / postWin / postLose）
- ⬜ S8-3-5c: Stage 2-2（堅実なる壁）のダイアログ作成（pre / postWin / postLose）
- ⬜ S8-3-5d: Stage 2-3（幻惑の罠）のダイアログ作成（pre / postWin / postLose）
- ⬜ S8-3-5e: Stage 2-4（氷の頂へ）のダイアログ作成（pre / postWin / postLose）
- ⬜ S8-3-5f: Stage 2-4 勝利後にシオンの台詞を追加
- ⬜ S8-3-5g: Stage 2-4 敗北後にシオンの台詞を追加
- ⬜ S8-3-5h: テスト — 全ダイアログの `characterId` が有効なキャラ ID であること
- ⬜ S8-3-5i: テスト — 全ステージに pre / postWin / postLose が存在し、空配列でないこと
- ⬜ S8-3-5j: テスト — 連続する同一 `characterId` の台詞がないこと（不自然な独白防止）
- ⬜ S8-3-5k: `npm run ci` 全パス確認

### S8-3-6: ステージ定義・登録

- ⬜ S8-3-6a: `core/chapter2-stages.ts` を新規作成（StageDefinition[] を export）
- ⬜ S8-3-6b: Stage 2-1 定義（chapterTitle 付き: '第2章「はじめての大舞台」'）
- ⬜ S8-3-6c: Stage 2-2 定義
- ⬜ S8-3-6d: Stage 2-3 定義
- ⬜ S8-3-6e: Stage 2-4 定義（isChapterFinale: true）
- ⬜ S8-3-6f: `story.ts` の STAGES 配列に Chapter 2 ステージを追加
- ⬜ S8-3-6g: テスト — Chapter 2 ステージの ID が `2-1` 〜 `2-4` であること
- ⬜ S8-3-6h: テスト — ステージの解放順序が正しいこと（1-3 クリア後に 2-1 が解放）
- ⬜ S8-3-6i: テスト — 2-1 → 2-2 → 2-3 → 2-4 の順でアンロックされること
- ⬜ S8-3-6j: `npm run ci` 全パス確認

### S8-3-6b: キャラクター図鑑（CharacterDex）解放条件

- ⬜ S8-3-6k: カナタの解放条件を追加（Stage 2-3 クリアで CharacterDex に追加 + フリーバトル選択可能）
- ⬜ S8-3-6l: リクの解放条件を追加（Stage 2-4 クリアで CharacterDex に追加。フリーバトル非対象）
- ⬜ S8-3-6m: シオンの解放条件を追加（Stage 2-4 クリアで CharacterDex に追加。フリーバトル非対象）
- ⬜ S8-3-6n: テスト — カナタが 2-3 クリア後にフリーバトルで選択可能であること
- ⬜ S8-3-6o: テスト — リク・シオンが図鑑に表示されるがフリーバトルでは選択不可であること
- ⬜ S8-3-6p: `npm run ci` 全パス確認

### S8-3-7: VictoryCutIn Chapter 2 対応

- ⬜ S8-3-7a: VictoryCutIn コンポーネントが Chapter 2 の `isChapterFinale` に対応しているか確認
- ⬜ S8-3-7b: Chapter 2 用の演出差分を追加（背景色をゴールド+白、パーティクル量 1.5 倍、テキスト「地区大会 優勝！」）
- ⬜ S8-3-7c: テスト — Chapter 2 フィナーレ勝利時にカットインが表示されること
- ⬜ S8-3-7d: テスト — Chapter 1 と Chapter 2 で演出が異なること

### S8-3-8: アセット対応（CharacterAvatar フォールバック活用）

- ⬜ S8-3-8a: カナタ・リク・シオンの画像パスを設定（ファイル未配置 → CharacterAvatar のフォールバック表示で代替）
- ⬜ S8-3-8b: DialogueOverlay でポートレート画像がない場合のフォールバック表示が正常に動作することを確認
- ⬜ S8-3-8c: VsScreen で VS 画像がない場合のフォールバック表示が正常に動作することを確認
- ⬜ S8-3-8d: ステージ背景は既存背景を流用（bg-gym 等）

### S8-3-9: 統合テスト・品質保証

- ⬜ S8-3-9a: 統合テスト — Chapter 1 クリア後に Chapter 2 が表示されること
- ⬜ S8-3-9b: 統合テスト — Chapter 2 全ステージのゲームフロー（開始→対戦→結果→次ステージ）
- ⬜ S8-3-9c: `npm run ci` 全パス確認
- ⬜ S8-3-9d: 手動確認 — Stage 2-1 プレイアブル（ソウタ戦）
- ⬜ S8-3-9e: 手動確認 — Stage 2-2 プレイアブル（ケンジ戦）
- ⬜ S8-3-9f: 手動確認 — Stage 2-3 プレイアブル（カナタ戦 — 壁バウンス AI 挙動確認）
- ⬜ S8-3-9g: 手動確認 — Stage 2-4 プレイアブル（レン戦 — 高難度 AI 確認）
- ⬜ S8-3-9h: 手動確認 — Chapter 2 フィナーレ勝利時の VictoryCutIn + シオン台詞
- ⬜ S8-3-9i: 手動確認 — Chapter 1 既存ステージが影響を受けていないこと
- ⬜ S8-3-9j: 手動確認 — フリー対戦・2P・2v2・デイリーが影響を受けていないこと

---

## 進捗サマリー

| Phase | ステータス | 完了日 |
|-------|----------|--------|
| S8-1 AirHockeyGame.tsx リファクタリング | ⬜ 未着手 | — |
| S8-2 ConfirmDialog アニメーション | ⬜ 未着手 | — |
| S8-3 ストーリー Chapter 2 | ⬜ 未着手 | — |

## サイズ見積もり

| Phase | サイズ | 変更ファイル数 | 新規ファイル数 | 新規行数目安 |
|-------|--------|-------------|-------------|-------------|
| S8-1 | L | 1（AirHockeyGame.tsx） | 5（Hook ファイル） | 〜500 行（移動中心） |
| S8-2 | S | 1（ConfirmDialog.tsx） | 0 | 〜80 行（フォーカストラップ + 操作ブロック追加） |
| S8-3 | XL | 3（characters, ai-profiles, story-balance） | 2（ch2-dialogue, ch2-stages） | 〜700 行（フィールド新規作成不要のため削減） |
