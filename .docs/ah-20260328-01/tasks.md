# Air Hockey ペアマッチ完成版 — タスクチェックリスト

## Phase S5-1: 状態管理の拡張（S）

- [x] **S5-1-1**: `useGameMode` に `allyCharacter` / `enemyCharacter1` / `enemyCharacter2` state を追加
  - 対象: `presentation/hooks/useGameMode.ts`
- [x] **S5-1-2**: `useGameMode` に `pairMatchDifficulty` state を追加（デフォルト: `'normal'`）
  - 対象: `presentation/hooks/useGameMode.ts`
- [x] **S5-1-3**: `UseGameModeReturn` 型に新フィールドの setter を追加
  - 対象: `presentation/hooks/useGameMode.ts`
- [x] **S5-1-4**: `resetToFree` で新フィールドをリセットする処理を追加
  - 対象: `presentation/hooks/useGameMode.ts`
- [x] **S5-1-5**: テスト — useGameMode の新フィールド管理が正しく動作する
  - 対象: テストファイル新規作成 or 既存追加

## Phase S5-2: TeamSetupScreen の機能拡充（L）

- [x] **S5-2-1**: TeamSetupScreen の Props インターフェースを拡張（キャラ選択・難易度）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-2-2**: スロット表示コンポーネント作成（アイコン + 名前 + 選択ボタン）
  - 対象: `components/TeamSetupScreen.tsx`（内部コンポーネント）
- [x] **S5-2-3**: インラインキャラクター選択パネル実装（展開/折りたたみ）
  - 対象: `components/TeamSetupScreen.tsx`
  - 参考: `FreeBattleCharacterSelect.tsx` のグリッドレイアウト
- [x] **S5-2-4**: P1 固定表示（アキラ）、P2/P3/P4 キャラ選択 UI 実装
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-2-5**: 難易度選択 UI（かんたん / ふつう / むずかしい 3 択ボタン）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-2-6**: アンロック済み判定（ロック済みキャラはグレーアウト）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-2-7**: テスト — TeamSetupScreen のレンダリング・キャラ選択・難易度変更
  - 対象: テストファイル新規作成

## Phase S5-3: VsScreen の 2v2 対応（M）

- [x] **S5-3-1**: VsScreen の Props に `is2v2` / `allyCharacter` / `enemyCharacter2` を追加
  - 対象: `components/VsScreen.tsx`
- [x] **S5-3-2**: 2v2 レイアウト実装（チーム1: P1+P2 左、チーム2: P3+P4 右）
  - 対象: `components/VsScreen.tsx`
- [x] **S5-3-3**: 2v2 時のアニメーション調整（チーム単位のスライドイン）
  - 対象: `components/VsScreen.tsx`
- [x] **S5-3-4**: テスト — VsScreen の 1v1 / 2v2 レイアウト切り替え
  - 対象: テストファイル新規作成

## Phase S5-4: ゲーム開始フローの接続（M）

- [x] **S5-4-1**: AirHockeyGame の handlePairMatchClick を更新（TeamSetupScreen に Props を渡す）
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-4-2**: handlePairMatchStart を変更（VsScreen を経由するフローに）
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-4-3**: VsScreen → Game 遷移で選択キャラ・難易度を useGameLoop に伝達
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-4-4**: 2v2 開始時の CPU 難易度を `pairMatchDifficulty` から適用
  - 対象: `presentation/hooks/useGameLoop.ts` or `presentation/AirHockeyGame.tsx`
- [x] **S5-4-5**: テスト — 画面遷移フロー（TeamSetup → Vs → Game）が正しく動作
  - 対象: テストファイル新規作成 or 既存追加

## Phase S5-5: ResultScreen の 2v2 最適化（S）

- [x] **S5-5-1**: ResultScreen の Props に `is2v2Mode` / `allyCharacterName` / `enemyCharacter2Name` を追加
  - 対象: `components/ResultScreen.tsx`
- [x] **S5-5-2**: 2v2 時の勝者テキスト表示を「チーム1/チーム2」に変更
  - 対象: `components/ResultScreen.tsx`
- [x] **S5-5-3**: 2v2 時のキャラクターアイコン表示（チームごとに 2 キャラ並列）
  - 対象: `components/ResultScreen.tsx`
- [x] **S5-5-4**: テスト — ResultScreen の 2v2 表示が正しいこと
  - 対象: テストファイル新規作成 or 既存追加

## Phase S5-6: テスト・品質保証（M）

- [x] **S5-6-1**: 既存テスト全パス確認（`npm test`）
  - 対象: 全テスト
- [x] **S5-6-2**: 型エラーなし確認（`tsc --noEmit`）
  - 対象: 全ソース
- [x] **S5-6-3**: ESLint エラーなし確認（`npm run lint:ci`）
  - 対象: 全ソース
- [x] **S5-6-4**: ビルド成功確認（`npm run build`）
  - 対象: 全ソース
- [x] **S5-6-5**: ペアマッチ一連フローの動作確認（手動）
  - チーム設定 → キャラ選択 → VS 演出 → ゲーム → リザルト
- [x] **S5-6-6**: 既存モード（フリー対戦・ストーリー・2P）への影響がないことを確認
  - 対象: 既存テスト + 手動確認

## Phase S5-7: フィードバック対応 — P2 CPU/人間切り替え（M）

- [x] **S5-7-1**: `useGameMode` に `allyControlType: 'cpu' | 'human'` state を追加（デフォルト: `'cpu'`）
  - 対象: `presentation/hooks/useGameMode.ts`
- [x] **S5-7-2**: テスト — allyControlType の初期値・変更・resetToFree での挙動
  - 対象: `presentation/hooks/useGameMode.test.ts`
- [x] **S5-7-3**: `TeamSetupScreen` の P2 スロットにセグメントコントロール `[CPU|人間]` を追加
  - 対象: `components/TeamSetupScreen.tsx`
  - Props に `allyControlType` / `onAllyControlTypeChange` を追加
  - 選択中: `#e67e22` 背景 + 白文字、未選択: 透明 + グレー
  - タッチターゲット 44x44px 以上
  - 「人間」選択時に操作ヒント `WASD / タッチ` を表示
- [x] **S5-7-4**: テスト — トグルの表示・切り替え・コールバック・ヒント表示
  - 対象: `components/TeamSetupScreen.test.tsx`
- [x] **S5-7-5**: `useGameLoop` の 2v2 入力処理を `allyControlType` で分岐
  - `'cpu'`: ally に `updateExtraMalletAI` を適用（enemy と同じ方式）
  - `'human'`: 現在の WASD/タッチ入力を適用
  - 対象: `presentation/hooks/useGameLoop.ts`
- [x] **S5-7-6**: `AirHockeyGame` で `allyControlType` を useGameLoop に伝達
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-7-7**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S5-8: デザインレビュー指摘対応 — UI/UX 改善（L）

### TeamSetupScreen 改善

- [x] **S5-8-1**: チーム1/チーム2 セクションの色分け（青/赤の左ボーダー + タイトル色）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-2**: P1 固定スロットの改善（`opacity: 1` + `cursor: default` + ラベル強調）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-3**: 難易度セクションをチーム構成の上に移動
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-4**: テスト — TeamSetupScreen の色分け・P1 表示・セクション順序
  - 対象: `components/TeamSetupScreen.test.tsx`

### VsScreen 改善

- [x] **S5-8-5**: `prefers-reduced-motion` 対応（アニメーションスキップ）
  - 対象: `components/VsScreen.tsx`
- [x] **S5-8-6**: 2v2 時のチームラベル表示（「チーム1」「チーム2」）
  - 対象: `components/VsScreen.tsx`
- [x] **S5-8-7**: テスト — VsScreen の reduced-motion・ラベル
  - 対象: `components/VsScreen.test.tsx`

### ResultScreen 改善

- [x] **S5-8-8**: 2v2 時の立ち絵 4 体表示（P1+P2 / P3+P4）
  - 対象: `components/ResultScreen.tsx`
- [x] **S5-8-9**: `AirHockeyGame` から ResultScreen へ ally/enemy2 キャラを渡す
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-8-10**: テスト — ResultScreen の 2v2 立ち絵 4 体表示
  - 対象: `components/ResultScreen.test.tsx`

### 品質保証

- [x] **S5-8-11**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S5-9: デザイン残課題対応 — レスポンシブ・UX 磨き込み（M）

### VsScreen レスポンシブ（DR-1 + DR-6）

- [x] **S5-9-1**: `CharacterPanel` に `prefersReducedMotion` Props を追加し `transition` を制御
  - 対象: `components/VsScreen.tsx`
  - 1v1 レイアウトでも reduced-motion 時に transition を無効化
- [x] **S5-9-2**: 2v2 時の立ち絵サイズをビューポート依存に変更
  - 対象: `components/VsScreen.tsx`
  - portrait あり: `width: min(128px, 20vw)` / `height: min(256px, 40vw)`
  - portrait なし: `width: min(96px, 18vw)` / `height: min(96px, 18vw)`
  - キャラ名フォントサイズ: `clamp(12px, 3vw, 24px)`
- [x] **S5-9-3**: テスト — VsScreen の reduced-motion が 1v1 でも有効
  - 対象: `components/VsScreen.test.tsx`

### TeamSetupScreen UX 改善（DR-2 + DR-3 + DR-5）

- [x] **S5-9-4**: キャラ選択パネルの開閉アニメーション
  - 対象: `components/TeamSetupScreen.tsx`
  - `useRef` でグリッドコンテナの高さを計測
  - `max-height: 0` → `max-height: {計測値}px` で 200ms ease-out
  - `overflow: hidden` で展開中のはみ出し防止
- [x] **S5-9-5**: グリッド展開時の自動スクロール
  - 対象: `components/TeamSetupScreen.tsx`
  - `useEffect` でグリッド展開完了後に `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
  - `prefersReducedMotion` 時は `behavior: 'auto'`
- [x] **S5-9-6**: CPU/人間トグルのタッチターゲットを 44px に拡大
  - 対象: `components/TeamSetupScreen.tsx`
  - `minHeight: '32px'` → `minHeight: '44px'`
- [x] **S5-9-7**: テスト — アニメーション・スクロール・タッチターゲット
  - 対象: `components/TeamSetupScreen.test.tsx`

### ResultScreen 改善（DR-4 + シナリオ #1/#4）

- [x] **S5-9-8**: 2v2 立ち絵エリアのチーム間に視覚的区切りを追加
  - 対象: `components/ResultScreen.tsx`
  - チーム内 gap: `8px`、チーム間 gap: `24px` + 小さな VS 区切り
  - チーム1/チーム2 のキャラをグループ化する `div` でラップ
- [x] **S5-9-9**: 2v2 ResultScreen に「チーム設定に戻る」ボタンを追加
  - 対象: `components/ResultScreen.tsx` + `presentation/AirHockeyGame.tsx`
  - 2P の「キャラ選択に戻る」と同等の導線
  - `onBackToTeamSetup` Props を追加、2v2 時のみ表示
  - AirHockeyGame で `navigateTo('teamSetup')` にハンドラを接続
- [x] **S5-9-10**: テスト — 2v2 立ち絵のチーム区切り・チーム設定戻りボタン
  - 対象: `components/ResultScreen.test.tsx`

### VsScreen 情報表示（シナリオ #6）

- [x] **S5-9-11**: 2v2 VsScreen で P2 の操作タイプ（CPU / 2P）をラベル表示
  - 対象: `components/VsScreen.tsx`
  - P2 キャラ名の下に小さく「CPU」or「2P」のラベルを追加
  - Props に `allyControlType` を追加（オプショナル）

### リプレイ体験（シナリオ #2）

- [x] **S5-9-12**: 2v2 リプレイボタンのラベルを「同じ設定でリプレイ」に変更
  - 対象: `components/ResultScreen.tsx`
  - `is2v2Mode` 時のみラベル変更（1v1 / 2P は従来の「REPLAY」を維持）

### 品質保証

- [x] **S5-9-13**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S5-10: ゲームプレイ品質改善（L）

### GP-1: ally CPU ゾーン制約 + AI ターゲット計算のチーム対応

- [x] **S5-10-1**: `updateExtraMalletAI` に `team` パラメータを追加し、座標反転アプローチを実装
  - 対象: `core/pair-match-logic.ts`
  - ally（player チーム）: AI 呼び出し前にパック・マレット座標を Y 軸反転
  - AI 計算結果を再度 Y 軸反転して戻す
  - 最終結果を `getPlayerZone` でクランプして安全性を確保
- [x] **S5-10-2**: `useGameLoop` で ally AI 呼び出し時に `team: 'player'`、enemy に `team: 'cpu'` を渡す
  - 対象: `presentation/hooks/useGameLoop.ts`
- [x] **S5-10-3**: テスト — ally CPU が下半分ゾーンに制約され、パックが下に向かう時に反応する
  - 対象: `core/pair-match-logic.test.ts` or 新規

### GP-2: マレット間衝突判定

- [x] **S5-10-4**: `resolveMalletMalletOverlap` 関数を実装
  - 対象: `core/entities.ts` or `core/physics.ts`
  - 2 マレットの中心間距離 < `MALLET_RADIUS * 2` のとき、中心間ベクトルに沿って均等に押し戻し
  - 押し戻し後に `getPlayerZone` でクランプし直す（相手ゾーンへの押し出し防止）
- [x] **S5-10-5**: `useGameLoop` のフレーム更新後にマレット間衝突解消を実行
  - 対象: `presentation/hooks/useGameLoop.ts`
  - 全マレットペア（最大 6 組）に対して判定
- [x] **S5-10-6**: テスト — 重なったマレットが分離され、ゾーン内に収まる
  - 対象: テストファイル新規 or 既存追加

### GP-3: P1/P2 キーマッピング分離

- [x] **S5-10-7**: `useKeyboardInput` に `is2v2Mode` パラメータを追加し、2v2 時は P1 の KEY_MAP から WASD を除外
  - 対象: `hooks/useKeyboardInput.ts`, `core/keyboard.ts`
  - 1v1 / ストーリーモード: 矢印キー + WASD 両方で P1 操作（既存動作を維持）
  - 2v2 モード: P1 は矢印キーのみ、WASD は P2 専用
- [x] **S5-10-7b**: `AirHockeyGame` から `useKeyboardInput` に `is2v2Mode` を渡す
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-10-8**: テスト — 2v2 時に WASD が P1 に影響せず、1v1 時は影響すること
  - 対象: テストファイル

### GP-4: キャラ別 AI プロファイル反映

- [x] **S5-10-9**: `GameLoopConfig` にキャラ ID フィールドを追加
  - 対象: `presentation/hooks/useGameLoop.ts`
  - `allyCharacterId`, `enemyCharacter1Id`, `enemyCharacter2Id` を追加
- [x] **S5-10-10**: cpu/enemy に `buildFreeBattleAiConfig(difficulty, characterId)` で個別 AI 設定を生成
  - 対象: `presentation/hooks/useGameLoop.ts`
- [x] **S5-10-10b**: ally CPU 用に味方補正を適用（aggressiveness 上限 0.5）
  - 対象: `core/story-balance.ts`（`buildAllyAiConfig` 関数追加）
  - ally は守備的に行動させる（ゴールを空にしない）
- [x] **S5-10-11**: `AirHockeyGame` からキャラ ID を useGameLoop に渡す
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-10-12**: テスト — 異なるキャラ ID で異なる AI 設定が使われる
  - 対象: テストファイル

### UX 補足

- [x] **S5-10-13**: TeamSetupScreen の操作ヒント更新（P1「矢印キー / マウス」、P2「WASD / タッチ」）
  - 対象: `components/TeamSetupScreen.tsx`
  - 2v2 モードでのキー割り当てが分かるように表示

### 品質保証

- [x] **S5-10-14**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S5-11: プレイテストフィードバック対応（M）

### PT-1: 2P 対戦の WASD 分離

- [x] **S5-11-1**: `useKeyboardInput` のパラメータを `is2v2Mode` → `isMultiPlayerMode` に変更
  - 対象: `hooks/useKeyboardInput.ts`
  - 2P 対戦 / 2v2 の両方で P1 は矢印キーのみに制限
- [x] **S5-11-2**: `AirHockeyGame` で `isMultiPlayer` を `useKeyboardInput` に渡す
  - 対象: `presentation/AirHockeyGame.tsx`

### PT-2: ペアマッチ難易度セクション削除

- [x] **S5-11-3**: TeamSetupScreen から難易度セクション・Props を削除
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-11-4**: AirHockeyGame で `effectiveDifficulty` を `mode.difficulty` に統一
  - 対象: `presentation/AirHockeyGame.tsx`

### PT-3: マレット移動範囲を上下2分割に変更

- [x] **S5-11-5**: `getPlayerZone` を 2 分割に変更（味方同士は同じ半面全体を移動可能）
  - 対象: `core/constants.ts`
  - player1/player2: 下半分全体（X 全幅）
  - player3/player4: 上半分全体（X 全幅）
- [x] **S5-11-5b**: ゾーン変更後に `resolveMalletMalletOverlaps` と `updateExtraMalletAI` が正しく動作するか検証
  - 対象: テスト + 既存ロジック確認
- [x] **S5-11-6**: テスト — ゾーン変更の確認
  - 対象: テストファイル

### PT-4: 2v2 ゴールサイズ拡大

- [x] **S5-11-7**: 2v2 モード開始時にゴールサイズを拡大する仕組みを追加
  - 対象: `presentation/AirHockeyGame.tsx`
  - `startGame` 時にフィールドを immutable コピーし `goalSize` を上書き
  - 計算式: `Math.min(Math.max(goalSize * 1.5, MALLET_RADIUS * 2 * 3), W * 0.6)`
  - マレット 3 つ分（252px）以上を下限保証、Canvas 幅 60%（360px）を上限
- [x] **S5-11-8**: レンダラー・物理演算がゴールサイズ変更に追従することを確認
  - 対象: テスト + 動作確認

### PT-5: ゲーム中のヘルプ自動表示を無効化

- [x] **S5-11-9**: `useGameLoop` 内のヘルプ自動表示ロジック（HELP_TIMEOUT）を削除
  - 対象: `presentation/hooks/useGameLoop.ts`
  - タイトル画面の「？」ボタンからの手動表示は維持

### 品質保証

- [x] **S5-11-10**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S5-12: プレイテストバグ修正（S）

### PB-1: パック永久ループ対策

- [ ] **S5-12-1**: パックスタック検出ロジックを追加
  - 対象: `presentation/hooks/useGameLoop.ts`
  - パック速度 < `MIN_SPEED` が 30 フレーム以上継続で「スタック」判定
  - 脱出方向: フィールド中央に向かう方向（ゴール直入り防止）
  - 脱出速度: `MIN_SPEED * 2`
- [ ] **S5-12-2**: テスト — スタック検出のロジック（必要に応じて）
  - 対象: テストファイル

### PB-2: ゴールサイズ拡大の修正

- [ ] **S5-12-3**: `startGame` で元フィールドを基準にゴールサイズを計算し `mode.setField` で反映
  - 対象: `presentation/AirHockeyGame.tsx`
  - FIELDS 配列から ID で原本を引き直し、累積適用を防止
  - `useGameLoop` の `config.field` に自動伝播する
- [ ] **S5-12-4**: テスト — 2v2 開始時にゴールサイズが拡大されていることを確認
  - 対象: テスト + 動作確認

### PB-3: CPU 戦略強化（ドキュメント記録のみ）

- [ ] **S5-12-5**: CPU 戦略強化の将来計画をドキュメントに記録
  - 対象: plan.md（記録済み）

### 品質保証

- [ ] **S5-12-6**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

---

## サイズ見積もり

| Phase | サイズ | 変更ファイル数 | 新規行数目安 |
|-------|--------|-------------|-------------|
| S5-1 | S | 1 | 〜30行 |
| S5-2 | L | 1-2 | 〜200行 |
| S5-3 | M | 1 | 〜80行 |
| S5-4 | M | 2 | 〜50行 |
| S5-5 | S | 1 | 〜40行 |
| S5-6 | M | — | テスト実行 |
| S5-7 | M | 4 | 〜60行 |
| S5-8 | M | 4 | 〜120行 |
| S5-9 | L | 4 | 〜150行 |
| S5-10 | L | 6-7 | 〜250行 |
| S5-11 | M | 5-6 | 〜100行 |
| S5-12 | S | 2 | 〜40行 |

## 進捗サマリー

| Phase | ステータス | 完了日 |
|-------|----------|--------|
| S5-1 状態管理の拡張 | [x] 完了 | 2026-03-28 |
| S5-2 TeamSetupScreen 機能拡充 | [x] 完了 | 2026-03-28 |
| S5-3 VsScreen 2v2 対応 | [x] 完了 | 2026-03-28 |
| S5-4 ゲーム開始フロー接続 | [x] 完了 | 2026-03-28 |
| S5-5 ResultScreen 2v2 最適化 | [x] 完了 | 2026-03-28 |
| S5-6 テスト・品質保証 | [x] 完了 | 2026-03-28 |
| S5-7 P2 CPU/人間切り替え | [x] 完了 | 2026-03-28 |
| S5-8 デザインレビュー UI/UX 改善 | [x] 完了 | 2026-03-28 |
| S5-9 デザイン残課題 レスポンシブ・UX 磨き込み | [x] 完了 | 2026-03-28 |
| S5-10 ゲームプレイ品質改善 | [x] 完了 | 2026-03-28 |
| S5-11 プレイテストフィードバック対応 | [x] 完了 | 2026-03-29 |
| S5-12 プレイテストバグ修正 | [ ] 未着手 | — |
