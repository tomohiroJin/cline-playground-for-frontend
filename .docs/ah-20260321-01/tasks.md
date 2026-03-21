# Air Hockey Phase 3: 2P 対戦モード — タスクチェックリスト

## 進捗サマリー

| フェーズ | ステータス | タスク数 | 完了日 |
|---------|-----------|---------|--------|
| 3-1 2P 入力システム | [ ] 未着手 | 20 | — |
| 3-2 ゲームモード拡張 | [ ] 未着手 | 16 | — |
| 3-3 キャラクター選択 | [ ] 未着手 | 18 | — |
| 3-4 画面・演出対応 | [ ] 未着手 | 20 | — |
| 3-5 テスト・品質保証 | [ ] 未着手 | 18 | — |
| 3-6 ドキュメント更新 | [ ] 未着手 | 14 | — |

---

## Phase 3-1: 2P 入力システム

### 3-1-1: 入力抽象化

- [ ] `domain/contracts/input.ts` を新規作成
  - [ ] `InputSource` インターフェース定義（`getPosition`, `isActive`, `update`, `dispose`）
  - [ ] `PlayerSlot` 型定義（`'player1' | 'player2'`）
- [ ] `domain/types.ts` に `PlayerSlot` を追加（re-export）

**テスト**:
- [ ] `tsc --noEmit` で型エラーなし

### 3-1-2: WASD キーボード入力

- [ ] `hooks/useKeyboardInput.ts` を拡張
  - [ ] `KeyboardState` に WASD キーの状態を追加（`w`, `a`, `s`, `d`）
  - [ ] `keydown` / `keyup` ハンドラで WASD キーを処理
  - [ ] `applyKeyboardMovement()` に `playerSlot` パラメータを追加
  - [ ] 1P（矢印キー）と 2P（WASD）で独立した移動ベクトルを計算
- [ ] 2P 用のキーボード入力が既存の 1P 入力に干渉しないことを確認

**テスト**:
- [ ] `useKeyboardInput.test.ts` に WASD 入力のテストを追加
  - [ ] W キーで上方向の移動が発生する
  - [ ] A キーで左方向の移動が発生する
  - [ ] S キーで下方向の移動が発生する
  - [ ] D キーで右方向の移動が発生する
  - [ ] WASD と矢印キーの同時押しがそれぞれ独立して動作する
  - [ ] 2P モード以外では WASD が無視される

### 3-1-3: マルチタッチ入力

- [ ] `hooks/useMultiTouchInput.ts` を新規作成
  - [ ] Canvas 要素の上下分割（1P: 下半分、2P: 上半分）
  - [ ] `Touch.identifier` によるタッチポイント追跡
  - [ ] 各ゾーンで最初の 1 タッチのみ追跡
  - [ ] タッチ座標 → Canvas 座標系への変換
  - [ ] `touchstart`, `touchmove`, `touchend`, `touchcancel` の処理
  - [ ] `touch-action: none` の適用（ブラウザジェスチャー無効化）

**テスト**:
- [ ] `useMultiTouchInput.test.ts` を作成
  - [ ] 下半分のタッチで 1P 位置が更新される
  - [ ] 上半分のタッチで 2P 位置が更新される
  - [ ] 同時に 2 つのタッチが独立して追跡される
  - [ ] タッチ終了で位置が undefined になる

### 3-1-4: 既存入力の適合

- [ ] 既存の `useInput.ts`（マウス/タッチ）が 1P モードで変わらず動作することを確認
- [ ] 既存の `useKeyboardInput.ts`（矢印キー）が 1P モードで変わらず動作することを確認
- [ ] 既存テスト全パス確認

---

## Phase 3-2: ゲームモード拡張

### 3-2-1: GameMode に '2p-local' を追加

- [ ] `core/types.ts` の `GameMode` 型に `'2p-local'` を追加
- [ ] `ScreenType` に `'characterSelect'` を追加
- [ ] 型変更の影響箇所を確認し、必要に応じて更新
  - [ ] `presentation/hooks/useGameMode.ts`
  - [ ] `presentation/hooks/useScreenNavigation.ts`
  - [ ] `presentation/AirHockeyGame.tsx`

**テスト**:
- [ ] `tsc --noEmit` で型エラーなし

### 3-2-2: ゲームループの 2P 対応

- [ ] `presentation/hooks/useGameLoop.ts` を改修
  - [ ] `GameLoopConfig` に `gameMode: GameMode` を追加
  - [ ] `GameLoopRefs` に `player2KeysRef: React.MutableRefObject<KeyboardState>` を追加（オプショナル）
  - [ ] `gameMode === '2p-local'` 時の分岐を追加:
    - [ ] AI 更新（`updateAI()`）をスキップ
    - [ ] 2P の入力（WASD / タッチ上半分）から CPU マレット位置を更新
    - [ ] 2P マレットの移動を上半分（y < height/2）に制限
- [ ] 後方互換アダプタ（`hooks/useGameLoop.ts`）の更新

**テスト**:
- [ ] 2P モードで AI が動作しないことの確認
- [ ] 2P モードで WASD 入力が CPU マレットに反映されることの確認
- [ ] 1P モード（free, story, daily）で既存動作が変わらないことの確認

### 3-2-3: 2P 対戦ユースケース

- [ ] `application/use-cases/two-player-battle.ts` を新規作成
  - [ ] `TwoPlayerBattleUseCase` クラスの実装
  - [ ] `start(config: TwoPlayerConfig)`: 対戦の初期化
  - [ ] `getResult(): TwoPlayerResult`: 対戦結果の取得
  - [ ] `getMatchStats(): MatchStats`: 試合統計の取得

**テスト**:
- [ ] `application/use-cases/two-player-battle.test.ts` を作成
  - [ ] 対戦初期化でスコアが 0-0 になる
  - [ ] 勝利スコアに到達した側が勝者になる
  - [ ] 試合統計が正しく集計される

### 3-2-4: スコア・勝敗管理の 2P 対応

- [ ] スコア表示ラベルの 2P 対応（`Player/CPU` → `1P/2P` or キャラ名）
- [ ] 勝敗判定ロジックは変更なし（winScore 到達で終了）

---

## Phase 3-3: キャラクター選択

### 3-3-1: キャラクター選択画面

- [ ] `components/CharacterSelectScreen.tsx` を新規作成
- [ ] Props 型定義
  ```typescript
  type CharacterSelectScreenProps = {
    characters: Character[];          // 選択可能なキャラクター一覧
    unlockedIds: string[];            // アンロック済みキャラ ID
    unlockedFieldIds: string[];       // アンロック済みフィールド ID
    onStartBattle: (config: TwoPlayerConfig) => void;
    onBack: () => void;
  };
  ```

**ヘッダー部**:
- [ ] 「2P 対戦」タイトル表示
- [ ] 「戻る」ボタン

**キャラ選択パネル**:
- [ ] 1P / 2P 選択パネルの表示（選択中のキャラアイコン + 名前）
- [ ] 「VS」テキストの中央配置
- [ ] 選択中プレイヤーのハイライト表示（タップで切替）

**キャラクターグリッド**:
- [ ] アンロック済みキャラのアイコン + 名前のグリッド表示
- [ ] タップでキャラ選択（選択中プレイヤーに反映）
- [ ] 選択済みキャラにチェックマーク / ボーダーハイライト
- [ ] 同キャラ選択可能

**設定セクション**:
- [ ] フィールド選択（アンロック済みのみ）
- [ ] 勝利スコア選択（1-10）

**対戦開始ボタン**:
- [ ] 「対戦開始！」ボタン（両プレイヤーキャラ選択済みで有効化）
- [ ] パルスアニメーション

**テスト**:
- [ ] `CharacterSelectScreen.test.tsx` を作成
  - [ ] アンロック済みキャラが一覧表示される
  - [ ] キャラタップで 1P キャラが変更される
  - [ ] 2P パネルタップ後にキャラタップで 2P キャラが変更される
  - [ ] フィールド変更が動作する
  - [ ] 勝利スコア変更が動作する
  - [ ] 対戦開始で `onStartBattle` が正しい config で呼ばれる
  - [ ] 戻るボタンで `onBack` が呼ばれる
  - [ ] 同キャラ選択が可能

### 3-3-2: マレットのキャラクター反映

- [ ] マレット描画にキャラテーマカラーを適用（`infrastructure/renderer/entity-renderer.ts`）
- [ ] 2P モード時: 1P マレット = 1P キャラカラー、2P マレット = 2P キャラカラー
- [ ] 1P モード時: 既存のマレット色を維持（変更なし）

**テスト**:
- [ ] マレット描画がキャラカラーを受け取れることの確認

### 3-3-3: 2P 対戦設定フロー

- [ ] `presentation/hooks/useScreenNavigation.ts` に 2P 対戦の遷移を追加
  - [ ] `menu → characterSelect` への遷移
  - [ ] `characterSelect → vsScreen` への遷移
  - [ ] `result → characterSelect` への遷移（キャラ選択に戻る）
  - [ ] `result → game` への遷移（同設定で再戦）
- [ ] `presentation/hooks/useGameMode.ts` に 2P 対戦モードの状態を追加
  - [ ] `player1Character` / `player2Character` の状態管理

---

## Phase 3-4: 画面・演出対応

### 3-4-1: タイトル画面に 2P 対戦ボタン追加

- [ ] `TitleScreen.tsx` に `onTwoPlayerClick` Props を追加
- [ ] 「2P 対戦」ボタンを追加
  - [ ] スタイル: オレンジ系グラデーション（`#e67e22` → `#d35400`）
  - [ ] 位置: キャラクターボタンの下
  - [ ] 幅: 他のメインボタンと統一

**テスト**:
- [ ] `TitleScreen.test.tsx` に 2P 対戦ボタンのテストを追加
  - [ ] 「2P 対戦」ボタンが表示される
  - [ ] ボタンタップで `onTwoPlayerClick` が呼ばれる

### 3-4-2: VS 画面の 2P 対応

- [ ] VS 画面コンポーネントの改修
  - [ ] 2P モード時: 左側に 1P キャラ、右側に 2P キャラを表示
  - [ ] 2P モード時: ラベルを「1P」/「2P」に変更
  - [ ] キャラの VS 画像を使用

**テスト**:
- [ ] VS 画面の 2P 表示テスト
  - [ ] 1P キャラと 2P キャラが正しく表示される
  - [ ] ラベルが「1P」「2P」になる

### 3-4-3: リザルト画面の 2P 対応

- [ ] `ResultScreen.tsx` の改修
  - [ ] 2P モード時の勝者テキスト: 「{キャラ名} Win!」
  - [ ] 勝者 happy 表情 + 敗者 normal 表情
  - [ ] 紙吹雪は常に表示
  - [ ] 実績通知・アンロック通知を非表示
  - [ ] 「もう1回」ボタン（同設定で再戦）
  - [ ] 「キャラ選択に戻る」ボタン

**テスト**:
- [ ] `ResultScreen.test.tsx` に 2P 対戦テストを追加
  - [ ] 2P モード時に勝者キャラ名が表示される
  - [ ] 2P モード時に実績通知が表示されない
  - [ ] 「もう1回」ボタンが動作する
  - [ ] 「キャラ選択に戻る」ボタンが動作する

### 3-4-4: ゲーム中の 2P 表示

- [ ] スコアラベルの 2P 対応
  - [ ] 下側: 1P キャラ名 or 「1P」
  - [ ] 上側: 2P キャラ名 or 「2P」
- [ ] レンダラーのスコアラベル描画を改修（`infrastructure/renderer/ui-renderer.ts`）

**テスト**:
- [ ] スコアラベルが 2P モードで正しく表示されることの確認

---

## Phase 3-5: テスト・品質保証

### 3-5-1: ドメイン層テスト

- [ ] `InputSource` インターフェースのテスト
- [ ] WASD 入力の全キー動作テスト
- [ ] マルチタッチ入力のゾーン判定テスト

### 3-5-2: ユースケース結合テスト

- [ ] `__tests__/use-case/two-player-flow.test.ts` を作成
  - [ ] キャラ選択 → 対戦開始 → スコア加算 → 勝敗判定のフロー
  - [ ] 2P 対戦で実績が無効化されることの確認
  - [ ] 2P 対戦でストーリー進行に影響しないことの確認

### 3-5-3: コンポーネントテスト

- [ ] `CharacterSelectScreen.test.tsx`（3-3-1 で作成済み、ここで最終確認）
- [ ] `TitleScreen.test.tsx` の 2P ボタンテスト（3-4-1 で作成済み）
- [ ] `ResultScreen.test.tsx` の 2P テスト（3-4-3 で作成済み）

### 3-5-4: 既存モード非破壊確認

- [ ] `npm test` で全テストパス
- [ ] `tsc --noEmit` で型エラーなし
- [ ] `npm run lint:ci` で ESLint エラーなし
- [ ] `npm run build` でビルド成功
- [ ] フリー対戦のテスト全パス
- [ ] ストーリーモードのテスト全パス
- [ ] デイリーチャレンジのテスト全パス
- [ ] キャラクター図鑑のテスト全パス

### 3-5-5: Phase 2 残課題

- [ ] プロフィールカード閉じるフェードアウトアニメーション
  - [ ] `isClosing` 状態の追加
  - [ ] フェードアウト CSS アニメーション（200ms）の実装
  - [ ] アニメーション完了後の `onClose` 呼び出し
  - [ ] テスト追加: 閉じるアニメーション後に `onClose` が呼ばれる

- [ ] club フィールドの表示追加
  - [ ] `CharacterProfileCard.tsx` の基本情報セクションに `club` を追加
  - [ ] 表示形式: 「{school} {club}」
  - [ ] テスト追加: club フィールドが表示される

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
