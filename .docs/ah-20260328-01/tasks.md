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
  - チーム1: `#3498db`（青系）、チーム2: `#e74c3c`（赤系）
- [x] **S5-8-2**: P1 固定スロットの改善（`opacity: 1` + `cursor: default` + ラベル強調）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-3**: 難易度セクションをチーム構成の上に移動
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-4**: キャラ選択パネルの開閉アニメーション（`max-height` 200ms ease-out）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-5**: キャラ選択グリッド展開時の自動スクロール（`scrollIntoView`）
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S5-8-6**: テスト — TeamSetupScreen の色分け・P1 表示・セクション順序
  - 対象: `components/TeamSetupScreen.test.tsx`

### VsScreen 改善

- [x] **S5-8-7**: 2v2 時の立ち絵サイズをレスポンシブ化（`min()` で縮小）
  - 対象: `components/VsScreen.tsx`
  - 480px 未満で縦並びレイアウトに切り替え
- [x] **S5-8-8**: `prefers-reduced-motion` 対応（アニメーションスキップ）
  - 対象: `components/VsScreen.tsx`
- [x] **S5-8-9**: 2v2 時のチームラベル表示（「チーム1」「チーム2」）
  - 対象: `components/VsScreen.tsx`
- [x] **S5-8-10**: テスト — VsScreen のレスポンシブ・reduced-motion・ラベル
  - 対象: `components/VsScreen.test.tsx`

### ResultScreen 改善

- [x] **S5-8-11**: 2v2 時の立ち絵 4 体表示（P1+P2 / P3+P4）
  - 対象: `components/ResultScreen.tsx`
  - `allyCharacter` / `enemyCharacter2` Props を追加
- [x] **S5-8-12**: `AirHockeyGame` から ResultScreen へ ally/enemy2 キャラを渡す
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S5-8-13**: テスト — ResultScreen の 2v2 立ち絵 4 体表示
  - 対象: `components/ResultScreen.test.tsx`

### 品質保証

- [x] **S5-8-14**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
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
| S5-8 | L | 4 | 〜200行 |

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
