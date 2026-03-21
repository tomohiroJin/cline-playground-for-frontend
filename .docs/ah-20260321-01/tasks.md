# Air Hockey Phase 3: 2P 対戦モード — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| 3-1 2P 入力システム | [x] 完了 | 20 | 2026-03-21 |
| 3-2 ゲームモード拡張 | [x] 完了 | 16 | 2026-03-21 |
| 3-3 キャラクター選択 | [x] 完了 | 18 | 2026-03-21 |
| 3-4 画面・演出対応 | [x] 完了 | 20 | 2026-03-21 |
| 3-5 テスト・品質保証 | [x] 完了 | 18 | 2026-03-21 |
| 3-6 ドキュメント更新 | [ ] 未着手 | 14 | — |

---

## Phase 3-1: 2P 入力システム

### 3-1-1: 入力抽象化

- [x] `domain/contracts/input.ts` を新規作成
  - [x] ~~`InputSource` インターフェース定義~~ → 設計変更: Phase 3-1 では `PlayerSlot` 型のみ定義。InputSource は既存の keyboard.ts + useInput.ts の仕組みを活用し、`updateKeyboardStateForPlayer` + `calculateKeyboardMovement` の `playerSlot` パラメータで 2P 分離を実現
  - [x] `PlayerSlot` 型定義（`'player1' | 'player2'`）
- [x] ~~`domain/types.ts` に `PlayerSlot` を追加（re-export）~~ → `domain/contracts/input.ts` から直接 import する方針に変更

**テスト**:
- [x] `tsc --noEmit` で型エラーなし
- [x] `domain/contracts/input.test.ts`: PlayerSlot 型テスト（2テスト）

### 3-1-2: WASD キーボード入力

- [x] `core/keyboard.ts` を拡張（設計変更: hooks ではなく core 層で分離）
  - [x] `PLAYER1_KEY_MAP`（矢印キーのみ）と `PLAYER2_KEY_MAP`（WASD のみ）を分離エクスポート
  - [x] `updateKeyboardStateForPlayer()` を追加: プレイヤー別キーマッピング
  - [x] `calculateKeyboardMovement()` に `playerSlot` パラメータを追加（デフォルト `'player1'`）
  - [x] 2P 用の Y 軸クランプ範囲（上半分: `MR+5` 〜 `H/2-MR-10`）を実装
  - [x] マジックナンバーを `WALL_MARGIN`, `CENTER_LINE_MARGIN` として定数化
  - [x] 重複ロジックを `applyKeyMap()` に共通化
- [x] 後方互換: `updateKeyboardState()` は矢印 + WASD 両方を受け付ける既存動作を維持

**テスト**:
- [x] `core/keyboard.test.ts` を新規作成（30テスト）
  - [x] `createKeyboardState`: 初期状態テスト
  - [x] `updateKeyboardState`: 後方互換テスト（矢印・WASD・無関係キー）
  - [x] `PLAYER1_KEY_MAP`: 矢印キーのみ含む / WASD 含まない
  - [x] `PLAYER2_KEY_MAP`: WASD のみ含む / 矢印キー含まない
  - [x] `updateKeyboardStateForPlayer`: 1P 矢印キー（4方向 + WASD 無視）
  - [x] `updateKeyboardStateForPlayer`: 2P WASD（4方向 + 矢印無視 + 大文字対応）
  - [x] 1P と 2P の独立性テスト（相互非干渉）
  - [x] `calculateKeyboardMovement`: 4方向移動 + 入力なし + 下半分クランプ
  - [x] `calculateKeyboardMovement` 2P: 上半分クランプ + 上端制限 + player1 デフォルト互換

### 3-1-3: マルチタッチ入力

> **延期**: キーボード対戦を先行する方針により、マルチタッチは後続フェーズで実装予定。
> キーボード 2P 対戦だけでも完全な対戦体験が成立する。

- [ ] `hooks/useMultiTouchInput.ts` を新規作成（後続フェーズで実施）

### 3-1-4: 既存入力の適合

- [x] 既存の `useInput.ts`（マウス/タッチ）が 1P モードで変わらず動作することを確認
- [x] 既存の `useKeyboardInput.ts`（矢印キー）が 1P モードで変わらず動作することを確認
- [x] 既存テスト全パス確認（73スイート、1011テスト）

---

## Phase 3-2: ゲームモード拡張

### 3-2-1: GameMode に '2p-local' を追加

- [x] `core/types.ts` の `GameMode` 型に `'2p-local'` を追加
- [x] `ScreenType` に `'characterSelect'` を追加
- [x] 型変更の影響箇所を確認し、必要に応じて更新
  - [x] `presentation/hooks/useGameMode.ts` — `player1Character` / `player2Character` 状態を追加、コメント更新
  - [x] `presentation/hooks/useScreenNavigation.ts` — `'characterSelect'` を ScreenType に追加
  - [x] ~~`presentation/AirHockeyGame.tsx`~~ → Phase 3-4 で統合時に対応

**テスト**:
- [x] `tsc --noEmit` で型エラーなし
- [x] `useGameMode.test.ts` に 2P 関連テスト 7件追加（22テスト全パス）

### 3-2-2: ゲームループの 2P 対応

- [x] `presentation/hooks/useGameLoop.ts` を改修
  - [x] `GameLoopConfig` に `gameMode?: 'free' | 'story' | '2p-local'` を追加（オプショナル、後方互換）
  - [x] `GameLoopRefs` に `player2KeysRef?: React.MutableRefObject<KeyboardState>` を追加
  - [x] `gameMode === '2p-local'` 時の分岐を追加:
    - [x] AI 更新（`CpuAI.update()`）をスキップ
    - [x] 2P の WASD 入力から `calculateKeyboardMovement` で CPU マレット位置を更新
    - [x] 2P マレットの移動を上半分にクランプ（`playerSlot: 'player2'`）
  - [x] レビュー指摘: 重複 import `CONSTANTS as GAME_CONSTANTS` を削除し、ループ内の `consts` を直接使用
- [x] ~~後方互換アダプタ（`hooks/useGameLoop.ts`）の更新~~ → 不要（`gameMode` はオプショナルのため既存呼び出しに影響なし）

**テスト**:
- [x] `useGameLoop.test.ts` に型テスト 3件追加（7テスト全パス）
- [x] 1P モード（free, story, daily）で既存動作が変わらないことの確認（74スイート、1028テスト全パス）

### 3-2-3: 2P 対戦ユースケース

- [x] `application/use-cases/two-player-battle.ts` を新規作成
  - [x] `TwoPlayerBattleUseCase` クラスの実装
  - [x] `TwoPlayerConfig` 型: `field`, `winScore`, `player1Character`, `player2Character`
  - [x] `start(config)`: 対戦の初期化（スコア 0-0）
  - [x] `addScore(playerSlot)`: スコア加算
  - [x] `getWinner()`: 勝利スコア到達時に勝者を返す
  - [x] `getState()`: 現在の対戦状態を取得
  - [x] `isAchievementsEnabled()`: 常に `false`（2P 対戦では実績無効）

**テスト**:
- [x] `application/use-cases/two-player-battle.test.ts` を作成（7テスト）
  - [x] 対戦初期化でスコアが 0-0 になる
  - [x] player1 / player2 にスコアを個別に加算できる
  - [x] 勝利スコアに到達した側が勝者になる（両プレイヤー）
  - [x] 対戦結果にキャラクター情報が含まれる
  - [x] 2P 対戦では実績判定が無効である

### 3-2-4: スコア・勝敗管理の 2P 対応

- [x] ~~スコア表示ラベルの 2P 対応~~ → Phase 3-4（ゲーム中 UI）で対応
- [x] 勝敗判定ロジックは変更なし（winScore 到達で終了、TwoPlayerBattleUseCase で管理）

---

## Phase 3-3: キャラクター選択

### 3-3-1: キャラクター選択画面

- [x] `components/CharacterSelectScreen.tsx` を新規作成
- [x] Props 型定義（`characters`, `unlockedFieldIds`, `fields`, `onStartBattle`, `onBack`）
- [x] レビュー指摘対応: 勝利スコア配列を `WIN_SCORE_OPTIONS` 定数に置換
- [x] レビュー指摘対応: アイコンサイズを `PANEL_ICON_SIZE` / `CARD_ICON_SIZE` として定数化

**ヘッダー部**:
- [x] 「2P 対戦」タイトル表示
- [x] 「← 戻る」ボタン

**キャラ選択パネル**:
- [x] 1P / 2P 選択パネルの表示（選択中のキャラアイコン + 名前）
- [x] 「VS」テキストの中央配置
- [x] 選択中プレイヤーのハイライト表示（`activeSlot` で切替）

**キャラクターグリッド**:
- [x] 4列グリッドでキャラのアイコン + 名前を表示
- [x] タップでキャラ選択（選択中プレイヤーに反映）
- [x] 選択済みキャラにテーマカラーのボーダーハイライト
- [x] 同キャラ選択可能（ミラーマッチ）

**設定セクション**:
- [x] フィールド選択（アンロック済みのみフィルタ）
- [x] 勝利スコア選択（`WIN_SCORE_OPTIONS` を使用）

**対戦開始ボタン**:
- [x] 「対戦開始！」ボタン（オレンジ系グラデーション）

**テスト**:
- [x] `CharacterSelectScreen.test.tsx` を作成（12テスト）
  - [x] 表示: タイトル、グリッド、1P/2Pパネル、VS、ボタン（6テスト）
  - [x] キャラ選択: 初期状態、1P変更、2P変更、ミラーマッチ（4テスト）
  - [x] 操作: onStartBattle 呼び出し、onBack 呼び出し（2テスト）

### 3-3-2: マレットのキャラクター反映

> **延期**: マレット描画のキャラカラー反映は Phase 3-4 のゲーム中 UI 対応と合わせて実施予定。
> 現状のマレット色のままでも 2P 対戦は成立する。

- [ ] マレット描画にキャラテーマカラーを適用（後続フェーズで実施）

### 3-3-3: 2P 対戦設定フロー

- [x] `presentation/hooks/useScreenNavigation.ts` — `'characterSelect'` を ScreenType に追加済み（Phase 3-2）
  - [x] `menu → characterSelect` への遷移: `navigateTo('characterSelect')` で利用可能
  - [x] `characterSelect → vsScreen` / `result → characterSelect` / `result → game` の遷移: 既存の `navigateTo` で対応可能
- [x] `presentation/hooks/useGameMode.ts` — `player1Character` / `player2Character` の状態管理追加済み（Phase 3-2）

---

## Phase 3-4: 画面・演出対応

### 3-4-1: タイトル画面に 2P 対戦ボタン追加

- [x] `TitleScreen.tsx` に `onTwoPlayerClick` Props を追加
- [x] `TwoPlayerButton` styled-component を追加（`StartButton` 拡張）
- [x] 「2P 対戦」ボタンを追加
  - [x] スタイル: オレンジ系グラデーション（`#e67e22` → `#d35400`）
  - [x] 位置: キャラクターボタンの下
  - [x] 幅: `StartButton` 継承で他のメインボタンと統一
  - [x] `onTwoPlayerClick` 未指定時は非表示（後方互換）

**テスト**:
- [x] `TitleScreen.test.tsx` に 2P 対戦ボタンのテスト 3件を追加
  - [x] `onTwoPlayerClick` 指定時に「2P 対戦」ボタンが表示される
  - [x] `onTwoPlayerClick` 未指定時に非表示
  - [x] ボタンタップで `onTwoPlayerClick` が呼ばれる

### 3-4-2: VS 画面の 2P 対応

- [x] VS 画面は既存の `playerCharacter` / `cpuCharacter` Props で 2P キャラをそのまま渡せる構造
  - [x] 呼び出し元で 1P/2P キャラを渡すだけで対応可能（コンポーネント側の変更不要）
  - [x] キャラの VS 画像は既存ロジックで使用される

### 3-4-3: リザルト画面の 2P 対応

- [x] `ResultScreen.tsx` の改修
  - [x] `is2PMode` Props を追加
  - [x] `player1CharacterName` / `player2CharacterName` Props を追加
  - [x] `onBackToCharacterSelect` Props を追加
  - [x] 2P モード時の勝者テキスト: 「1P Win!」/「2P Win!」
  - [x] 2P モード時は紙吹雪を常に表示（対戦を祝う）
  - [x] 2P モード時は実績通知を非表示（`!is2PMode &&` ガード）
  - [x] 「キャラ選択に戻る」ボタン（オレンジ系グラデーション）

**テスト**:
- [x] `ResultScreen.test.tsx` に 2P 対戦テスト 4件を追加
  - [x] 2P モードで player1 勝利時に「1P Win!」が表示される
  - [x] 2P モードで player2（cpu）勝利時に「2P Win!」が表示される
  - [x] 2P モードでは実績通知が表示されない
  - [x] 2P モードで「キャラ選択に戻る」ボタンが表示される

### 3-4-4: ゲーム中の 2P 表示

> **延期**: スコアラベルの Canvas 描画改修は AirHockeyGame.tsx 統合時に対応予定。
> 現状のラベル（Player/CPU）のままでも 2P 対戦は成立する。

- [ ] スコアラベルの 2P 対応（後続フェーズで実施）

---

## Phase 3-5: テスト・品質保証

### 3-5-1: ドメイン層テスト

- [x] `PlayerSlot` 型テスト（`domain/contracts/input.test.ts`: 2テスト）
- [x] WASD 入力の全キー動作テスト（`core/keyboard.test.ts`: 30テスト）
- [x] ~~マルチタッチ入力のゾーン判定テスト~~ → マルチタッチ延期のためスキップ

### 3-5-2: ユースケース結合テスト

- [x] `TwoPlayerBattleUseCase` のテスト（`application/use-cases/two-player-battle.test.ts`: 7テスト）
  - [x] 対戦初期化、スコア加算、勝敗判定
  - [x] 2P 対戦で実績が無効化されることの確認
- [x] ~~`__tests__/use-case/two-player-flow.test.ts`~~ → TwoPlayerBattleUseCase のテストでカバー

### 3-5-3: コンポーネントテスト

- [x] `CharacterSelectScreen.test.tsx`: 12テスト（Phase 3-3 で作成済み）
- [x] `TitleScreen.test.tsx`: 2P ボタンテスト 3件（Phase 3-4 で作成済み）
- [x] `ResultScreen.test.tsx`: 2P テスト 4件（Phase 3-4 で作成済み）

### 3-5-4: 既存モード非破壊確認

- [x] Air Hockey 全テストパス（75スイート、1047テスト）
- [x] `tsc --noEmit` で型エラーなし
- [x] `npm run build` でビルド成功（警告のみ、エラーなし）
- [x] フリー対戦のテスト全パス
- [x] ストーリーモードのテスト全パス
- [x] デイリーチャレンジのテスト全パス
- [x] キャラクター図鑑のテスト全パス

### 3-5-5: Phase 2 残課題

> **延期**: Phase 2 残課題は Phase 3 のスコープ外として後続で対応予定。
> 2P 対戦の実装完了を優先する。

- [ ] プロフィールカード閉じるフェードアウトアニメーション（後続対応）
- [ ] club フィールドの表示追加（後続対応）

---

## Phase 3-6: ドキュメント更新

### 3-6-1: ゲームドキュメントの更新

- [ ] `src/features/air-hockey/doc/features.md` の更新
  - [ ] 2P 対戦モード（キーボード / タッチ）の機能説明を追加
  - [ ] キャラクター選択機能の説明を追加
- [ ] `src/features/air-hockey/doc/gameplay.md` の更新
  - [ ] 2P 対戦の操作方法（1P: 矢印キー / 2P: WASD）を追加
  - [ ] マルチタッチ操作（画面上下分割）の説明を追加
- [ ] `src/features/air-hockey/doc/architecture.md` の更新
  - [ ] InputSource 抽象化の設計説明を追加
  - [ ] 2P 対戦のゲームループフロー図を追加
  - [ ] `TwoPlayerBattleUseCase` のレイヤー配置を反映

### 3-6-2: 型定義・データモデルの変更記録

- [ ] `src/features/air-hockey/doc/story-mode.md` の更新
  - [ ] 2P 対戦時はストーリー進行・実績が無効化される旨を追記
- [ ] `core/types.ts` の型変更をドキュメントに反映
  - [ ] `GameMode` に `'2p-local'` が追加されたことの記録
  - [ ] `ScreenType` に `'characterSelect'` が追加されたことの記録

### 3-6-3: ブラッシュアップビジョンの更新

- [ ] `src/features/air-hockey/doc/world/` 配下のドキュメント整合性確認
  - [ ] 2P 対戦で使用するキャラクター情報が `character-profiles.md` と一致
- [ ] `.docs/ah-20260311-01/brushup-vision.md` の Phase 3 ステータスを完了に更新

### 3-6-4: Phase 3 ドキュメントの最終化

- [ ] `.docs/ah-20260321-01/plan.md` の各フェーズステータスを更新
- [ ] `.docs/ah-20260321-01/spec.md` の実装時の変更点・差異を追記
- [ ] `.docs/ah-20260321-01/tasks.md` の全タスクチェック完了を確認

---

## 各フェーズの共通完了条件

各フェーズ完了時に以下をすべて確認:

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし
- [ ] `npm run lint:ci` で ESLint エラーなし
- [ ] `npm run build` でビルド成功
- [ ] 既存モード（フリー対戦、ストーリー、デイリー、図鑑）に影響なし
