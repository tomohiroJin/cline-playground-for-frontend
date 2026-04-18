# Air Hockey S8 — リファクタリング・UI 改善・Chapter 2 タスクチェックリスト

> 凡例: ⬜ 未着手 / 🔄 作業中 / ✅ 完了 / ⏭️ スキップ

---

## Phase S8-1: AirHockeyGame.tsx Hook 分割リファクタリング（L）

### S8-1-0: 事前準備

- ✅ S8-1-0a: リファクタリング前のベースライン確認（`npm run ci` 全パス）
- ✅ S8-1-0b: AirHockeyGame.tsx の現在行数を記録（ベースライン: 585 行）

### S8-1-1: useUIOverlayState 抽出

- ✅ S8-1-1a: `presentation/hooks/useUIOverlayState.ts` を新規作成
- ✅ S8-1-1b: `showHelp`, `showTutorial`, `isHelpMode`, `showSettings`, `showExitConfirm`, `selectedCharacterId` の useState を移動
- ✅ S8-1-1c: `handleTutorialComplete` ロジックを Hook 内に移動
- ✅ S8-1-1d: AirHockeyGame.tsx で `useUIOverlayState()` を呼び出し、既存参照を置換
- ✅ S8-1-1e: テスト全パス確認（604 スイート / 7707 テスト）

### S8-1-2: useStoryScreen 抽出

- ✅ S8-1-2a: `presentation/hooks/useStoryScreen.ts` を新規作成
- ✅ S8-1-2b: `cpuCharacter`, `storyCharacters`, `stageBackgroundUrl`, `hasNextStage`, `storyAiConfig` の useMemo を移動
- ✅ S8-1-2c: AirHockeyGame.tsx で `useStoryScreen()` を呼び出し、既存参照を置換
- ✅ S8-1-2d: 型チェック通過

### S8-1-3: useFreeBattleScreen 抽出

- ✅ S8-1-3a: `presentation/hooks/useFreeBattleScreen.ts` を新規作成
- ✅ S8-1-3b: `freeBattleAiConfig`, `freeBattleCpuCharacter`, `allBattleCharacters`, `freeBattleSelectableCharacters` の useMemo を移動
- ✅ S8-1-3c: AirHockeyGame.tsx で `useFreeBattleScreen()` を呼び出し、既存参照を置換
- ✅ S8-1-3d: 型チェック通過

### S8-1-4: usePairMatchSetup 抽出

- ✅ S8-1-4a: `presentation/hooks/usePairMatchSetup.ts` を新規作成
- ✅ S8-1-4b: `pairAlly`, `pairEnemy1`, `pairEnemy2` のデフォルト算出を移動
- ✅ S8-1-4c: `resultPlayerCharacter`, `resultOpponentCharacter`, `currentCpuName` の算出を移動
- ✅ S8-1-4d: AirHockeyGame.tsx で `usePairMatchSetup()` を呼び出し、既存参照を置換
- ✅ S8-1-4e: テスト全パス確認（604 スイート / 7707 テスト）

### S8-1-5: useGameHandlers 抽出

- ✅ S8-1-5a: `presentation/hooks/useGameHandlers.ts` を新規作成
- ✅ S8-1-5b: メニュー系ハンドラを移動（handleFreeStart, handleStoryClick, handleDailyChallengeClick, handleBackToMenu 等）
- ✅ S8-1-5c: ストーリー系ハンドラを移動（handleSelectStage, handleStoryReset, handleNextStage, handlePostDialogueComplete 等）
- ✅ S8-1-5d: ゲーム操作系ハンドラを移動（handleGameMenuClick, handleExitConfirm, handleExitCancel, handleScreenChange 等）
- ✅ S8-1-5e: キャラ選択・2v2 系ハンドラを移動（handleStartBattle, handlePairMatchStart 等）
- ✅ S8-1-5f: リザルト系ハンドラを移動（handleResultBackToMenu, handleAcceptDifficulty 等）
- ✅ S8-1-5g: AirHockeyGame.tsx で `useGameHandlers()` を呼び出し、既存参照を置換
- ✅ S8-1-5h: `npm run ci` 全パス確認（lint:ci + typecheck + test）
- ✅ S8-1-5i: `useGameHandlers.ts` の行数確認 — 143 行（200 行以内、二次分割不要）

### S8-1-6: 最終整理・検証

- ✅ S8-1-6a: AirHockeyGame.tsx の不要な import を整理
- ✅ S8-1-6b: AirHockeyGame.tsx の最終行数 — 428 行（585→428: 157 行削減。JSX テンプレートが約 170 行占有のため 350 行以下は困難）
- ✅ S8-1-6c: 全テストスイート全パス確認（604 スイート / 7707 テスト、lint:ci エラー 0）
- ⬜ S8-1-6d: 手動確認 — フリー対戦の正常動作
- ⬜ S8-1-6e: 手動確認 — ストーリーモードの正常動作
- ⬜ S8-1-6f: 手動確認 — 2P 対戦の正常動作
- ⬜ S8-1-6g: 手動確認 — ペアマッチ 2v2 の正常動作
- ⬜ S8-1-6h: 手動確認 — デイリーチャレンジの正常動作

---

## Phase S8-2: ConfirmDialog CSS Transition アニメーション（S）

### S8-2-1: アニメーション状態管理

- ✅ S8-2-1a: `ConfirmDialog` に内部状態 `phase` を追加（`'closed' | 'opening' | 'open' | 'closing'`）
- ✅ S8-2-1b: `isOpen` の変化を監視し、`phase` を更新する useEffect を実装
- ✅ S8-2-1c: `phase === 'closed'` のとき `return null`（DOM 除去）
- ✅ S8-2-1d: `onTransitionEnd` で `closing → closed` 遷移を処理
- ✅ S8-2-1e: フォールバック `setTimeout(300)` を追加（`onTransitionEnd` 未発火対策）
- ✅ S8-2-1f: `closing` フェーズ中はオーバーレイに `pointer-events: none` + ボタン onClick を無効化

### S8-2-2: CSS Transition スタイル

- ✅ S8-2-2a: オーバーレイに `opacity` transition を追加（opening: 200ms ease-out, closing: 150ms ease-in）
- ✅ S8-2-2b: ダイアログボックスに `opacity` + `transform(scale)` transition を追加
- ✅ S8-2-2c: `prefers-reduced-motion` は CSS transition で制御（インラインスタイルの duration 値で対応）

### S8-2-2b: フォーカストラップ

- ✅ S8-2-2d: `Tab` / `Shift+Tab` でダイアログ内ボタン間のみフォーカスがループするトラップを実装
- ✅ S8-2-2e: `confirmRef` を追加し、cancelRef と合わせてフォーカス対象を管理

### S8-2-3: テスト

- ✅ S8-2-3a: テスト — `isOpen=true` 時にオーバーレイが表示される（既存テスト 10 件全パス）
- ✅ S8-2-3b: テスト — `isOpen=false` → `true` で opening → open の遷移
- ✅ S8-2-3c: テスト — `isOpen=true` → `false` で closing 後に DOM から除去
- ⏭️ S8-2-3d: テスト — `prefers-reduced-motion` は CSS transition の duration で制御。jsdom では matchMedia のモック複雑度が高いためスキップ
- ✅ S8-2-3e: テスト — フォールバック timer で closing → closed が確実に発生
- ✅ S8-2-3f: テスト — closing フェーズ中のオーバーレイクリックが `onCancel` を呼ばないこと
- ✅ S8-2-3g: テスト — Tab キーでフォーカスがダイアログ内ボタン間をループすること
- ✅ S8-2-3h: テスト — Shift+Tab でフォーカスが逆方向にループすること

### S8-2-4: 検証

- ✅ S8-2-4a: 既存 ConfirmDialog テスト全パス確認（10 件 → 16 件に拡充）
- ✅ S8-2-4b: 全テスト全パス確認（604 スイート / 7713 テスト、lint:ci エラー 0、型エラー 0）
- ⬜ S8-2-4c: 手動確認 — ゲーム中メニューボタンで滑らかに開閉
- ⬜ S8-2-4d: 手動確認 — `prefers-reduced-motion` 設定時にアニメーション無効

---

## Phase S8-3: ストーリー Chapter 2 実装（XL）

### S8-3-1: 新キャラクター定義

- ✅ S8-3-1a: `characters.ts` にカナタ（kanata）のキャラクター定義を追加
- ✅ S8-3-1b: `characters.ts` にリク（riku）のキャラクター定義を追加
- ✅ S8-3-1c: `characters.ts` にシオン（shion）のキャラクター定義を追加
- ✅ S8-3-1d: テスト — 新キャラの ID が一意であること（既存テスト修正で確認）
- ✅ S8-3-1e: テスト — 新キャラの必須フィールドが存在すること（既存テスト修正で確認）
- ✅ S8-3-1f: `bg-tournament` を BACKGROUND_MAP に追加

### S8-3-2: カナタの AI プロファイル

- ✅ S8-3-2a: `character-ai-profiles.ts` にカナタの AI プロファイルを追加
- ✅ S8-3-2b: deflectionBias: 0.6（壁バウンス多用）、lateralOscillation: 30（揺さぶり）

### S8-3-3: フィールド確認（既存定義を使用）

- ✅ S8-3-3a: zigzag, fortress, bastion, pillars が `config.ts` に定義済みであることを確認

### S8-3-4: ステージバランス設定

- ✅ S8-3-4a: `story-balance.ts` に Stage 2-1 のバランス設定を追加（rookie playStyle）
- ✅ S8-3-4b: `story-balance.ts` に Stage 2-2 のバランス設定を追加（regular playStyle）
- ✅ S8-3-4c: `story-balance.ts` に Stage 2-3 のバランス設定を追加（kanata playStyle、wallBounce: true）
- ✅ S8-3-4d: `story-balance.ts` に Stage 2-4 のバランス設定を追加（ace playStyle、comebackBonus 強化）

### S8-3-5: ダイアログデータ作成

- ✅ S8-3-5a: `core/chapter2-dialogue-data.ts` を新規作成
- ✅ S8-3-5b: Stage 2-1（嵐の前の一打）のダイアログ作成
- ✅ S8-3-5c: Stage 2-2（堅実なる壁）のダイアログ作成
- ✅ S8-3-5d: Stage 2-3（幻惑の罠）のダイアログ作成
- ✅ S8-3-5e: Stage 2-4（氷の頂へ）のダイアログ作成
- ✅ S8-3-5f: Stage 2-4 勝利後にシオンの台詞を追加
- ✅ S8-3-5g: Stage 2-4 敗北後にシオンの台詞を追加

### S8-3-6: ステージ定義・登録

- ✅ S8-3-6a: `chapter2-dialogue-data.ts` に CHAPTER_2_STAGES を export（ステージ定義 + ダイアログを同一ファイルに統合）
- ✅ S8-3-6b: Stage 2-1 定義（chapterTitle: '第2章「はじめての大舞台」'）
- ✅ S8-3-6c: Stage 2-2 定義
- ✅ S8-3-6d: Stage 2-3 定義
- ✅ S8-3-6e: Stage 2-4 定義（isChapterFinale: true）
- ✅ S8-3-6f: `dialogue-data.ts` に ALL_STAGES = [...CHAPTER_1_STAGES, ...CHAPTER_2_STAGES] を追加
- ✅ S8-3-6g: AirHockeyGame.tsx + useGameHandlers.ts で ALL_STAGES を使用するよう変更

### S8-3-6b: キャラクター図鑑（CharacterDex）解放条件

- ✅ S8-3-6k: カナタの解放条件を追加（story-clear: '2-3'）
- ✅ S8-3-6l: リクの解放条件を追加（story-clear: '2-4'）
- ✅ S8-3-6m: シオンの解放条件を追加（story-clear: '2-4'）

### S8-3-7: VictoryCutIn Chapter 2 対応

- ✅ S8-3-7a: VictoryCutIn は getVictoryCutInUrl(chapter) で自動的に `/assets/cutins/victory-ch2.png` を参照
- ⬜ S8-3-7b: Chapter 2 用の演出差分（背景色・パーティクル量・テキスト変更）→ 後続タスクで対応
- ✅ S8-3-7c: ダミーカットイン画像を作成（victory-ch2.png）

### S8-3-8: アセット対応

- ✅ S8-3-8a: カナタ・リク・シオンのダミー画像を ImageMagick で生成
- ✅ S8-3-8b: 大会会場背景（bg-tournament.webp）のダミーを生成
- ✅ S8-3-8c: 画像生成プロンプトを `.docs/ah-20260404-01/asset-prompts.md` に作成

### S8-3-9: 統合テスト・品質保証

- ✅ S8-3-9a: 既存テスト修正（characters, dex-data, p1-01-data-layer, useCharacterDex, AirHockeyGame）
- ✅ S8-3-9b: 604 スイート / 7725 テスト全パス、lint:ci エラー 0、型エラー 0
- ⬜ S8-3-9d: 手動確認 — Stage 2-1 プレイアブル
- ⬜ S8-3-9e: 手動確認 — Stage 2-2 プレイアブル
- ⬜ S8-3-9f: 手動確認 — Stage 2-3 プレイアブル（カナタ戦）
- ⬜ S8-3-9g: 手動確認 — Stage 2-4 プレイアブル（レン戦）
- ⬜ S8-3-9h: 手動確認 — Chapter 2 フィナーレ勝利時の VictoryCutIn + シオン台詞
- ⬜ S8-3-9i: 手動確認 — Chapter 1 既存ステージが影響を受けていないこと
- ⬜ S8-3-9j: 手動確認 — フリー対戦・2P・2v2・デイリーが影響を受けていないこと

---

## 進捗サマリー

| Phase | ステータス | 完了日 |
|-------|----------|--------|
| S8-1 AirHockeyGame.tsx リファクタリング | ✅ 完了（自動検証済み。手動確認は別途） | 2026-04-05 |
| S8-2 ConfirmDialog アニメーション | ✅ 完了（自動検証済み。手動確認は別途） | 2026-04-05 |
| S8-3 ストーリー Chapter 2 | ✅ 完了（自動検証済み。手動確認・VictoryCutIn 演出差分は別途） | 2026-04-05 |

## サイズ見積もり

| Phase | サイズ | 変更ファイル数 | 新規ファイル数 | 新規行数目安 |
|-------|--------|-------------|-------------|-------------|
| S8-1 | L | 1（AirHockeyGame.tsx） | 5（Hook ファイル） | 〜500 行（移動中心） |
| S8-2 | S | 1（ConfirmDialog.tsx） | 0 | 〜80 行（フォーカストラップ + 操作ブロック追加） |
| S8-3 | XL | 3（characters, ai-profiles, story-balance） | 2（ch2-dialogue, ch2-stages） | 〜700 行（フィールド新規作成不要のため削減） |
