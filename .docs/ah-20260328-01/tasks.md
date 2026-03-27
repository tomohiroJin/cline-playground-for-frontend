# Air Hockey ペアマッチ完成版 — タスクチェックリスト

## Phase S5-1: 状態管理の拡張（S）

- [ ] **S5-1-1**: `useGameMode` に `allyCharacter` / `enemyCharacter1` / `enemyCharacter2` state を追加
  - 対象: `presentation/hooks/useGameMode.ts`
- [ ] **S5-1-2**: `useGameMode` に `pairMatchDifficulty` state を追加（デフォルト: `'normal'`）
  - 対象: `presentation/hooks/useGameMode.ts`
- [ ] **S5-1-3**: `UseGameModeReturn` 型に新フィールドの setter を追加
  - 対象: `presentation/hooks/useGameMode.ts`
- [ ] **S5-1-4**: `resetToFree` で新フィールドをリセットする処理を追加
  - 対象: `presentation/hooks/useGameMode.ts`
- [ ] **S5-1-5**: テスト — useGameMode の新フィールド管理が正しく動作する
  - 対象: テストファイル新規作成 or 既存追加

## Phase S5-2: TeamSetupScreen の機能拡充（L）

- [ ] **S5-2-1**: TeamSetupScreen の Props インターフェースを拡張（キャラ選択・難易度）
  - 対象: `components/TeamSetupScreen.tsx`
- [ ] **S5-2-2**: スロット表示コンポーネント作成（アイコン + 名前 + 選択ボタン）
  - 対象: `components/TeamSetupScreen.tsx`（内部コンポーネント）
- [ ] **S5-2-3**: インラインキャラクター選択パネル実装（展開/折りたたみ）
  - 対象: `components/TeamSetupScreen.tsx`
  - 参考: `FreeBattleCharacterSelect.tsx` のグリッドレイアウト
- [ ] **S5-2-4**: P1 固定表示（アキラ）、P2/P3/P4 キャラ選択 UI 実装
  - 対象: `components/TeamSetupScreen.tsx`
- [ ] **S5-2-5**: 難易度選択 UI（かんたん / ふつう / むずかしい 3 択ボタン）
  - 対象: `components/TeamSetupScreen.tsx`
- [ ] **S5-2-6**: アンロック済み判定（ロック済みキャラはグレーアウト）
  - 対象: `components/TeamSetupScreen.tsx`
- [ ] **S5-2-7**: テスト — TeamSetupScreen のレンダリング・キャラ選択・難易度変更
  - 対象: テストファイル新規作成

## Phase S5-3: VsScreen の 2v2 対応（M）

- [ ] **S5-3-1**: VsScreen の Props に `is2v2` / `allyCharacter` / `enemyCharacter2` を追加
  - 対象: `components/VsScreen.tsx`
- [ ] **S5-3-2**: 2v2 レイアウト実装（チーム1: P1+P2 左、チーム2: P3+P4 右）
  - 対象: `components/VsScreen.tsx`
- [ ] **S5-3-3**: 2v2 時のアニメーション調整（チーム単位のスライドイン）
  - 対象: `components/VsScreen.tsx`
- [ ] **S5-3-4**: テスト — VsScreen の 1v1 / 2v2 レイアウト切り替え
  - 対象: テストファイル新規作成

## Phase S5-4: ゲーム開始フローの接続（M）

- [ ] **S5-4-1**: AirHockeyGame の handlePairMatchClick を更新（TeamSetupScreen に Props を渡す）
  - 対象: `presentation/AirHockeyGame.tsx`
- [ ] **S5-4-2**: handlePairMatchStart を変更（VsScreen を経由するフローに）
  - 対象: `presentation/AirHockeyGame.tsx`
- [ ] **S5-4-3**: VsScreen → Game 遷移で選択キャラ・難易度を useGameLoop に伝達
  - 対象: `presentation/AirHockeyGame.tsx`
- [ ] **S5-4-4**: 2v2 開始時の CPU 難易度を `pairMatchDifficulty` から適用
  - 対象: `presentation/hooks/useGameLoop.ts` or `presentation/AirHockeyGame.tsx`
- [ ] **S5-4-5**: テスト — 画面遷移フロー（TeamSetup → Vs → Game）が正しく動作
  - 対象: テストファイル新規作成 or 既存追加

## Phase S5-5: ResultScreen の 2v2 最適化（S）

- [ ] **S5-5-1**: ResultScreen の Props に `is2v2Mode` / `allyCharacterName` / `enemyCharacter2Name` を追加
  - 対象: `components/ResultScreen.tsx`
- [ ] **S5-5-2**: 2v2 時の勝者テキスト表示を「チーム1/チーム2」に変更
  - 対象: `components/ResultScreen.tsx`
- [ ] **S5-5-3**: 2v2 時のキャラクターアイコン表示（チームごとに 2 キャラ並列）
  - 対象: `components/ResultScreen.tsx`
- [ ] **S5-5-4**: テスト — ResultScreen の 2v2 表示が正しいこと
  - 対象: テストファイル新規作成 or 既存追加

## Phase S5-6: テスト・品質保証（M）

- [ ] **S5-6-1**: 既存テスト全パス確認（`npm test`）
  - 対象: 全テスト
- [ ] **S5-6-2**: 型エラーなし確認（`tsc --noEmit`）
  - 対象: 全ソース
- [ ] **S5-6-3**: ESLint エラーなし確認（`npm run lint:ci`）
  - 対象: 全ソース
- [ ] **S5-6-4**: ビルド成功確認（`npm run build`）
  - 対象: 全ソース
- [ ] **S5-6-5**: ペアマッチ一連フローの動作確認（手動）
  - チーム設定 → キャラ選択 → VS 演出 → ゲーム → リザルト
- [ ] **S5-6-6**: 既存モード（フリー対戦・ストーリー・2P）への影響がないことを確認
  - 対象: 既存テスト + 手動確認

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

## 進捗サマリー

| Phase | ステータス | 完了日 |
|-------|----------|--------|
| S5-1 状態管理の拡張 | [ ] 未着手 | — |
| S5-2 TeamSetupScreen 機能拡充 | [ ] 未着手 | — |
| S5-3 VsScreen 2v2 対応 | [ ] 未着手 | — |
| S5-4 ゲーム開始フロー接続 | [ ] 未着手 | — |
| S5-5 ResultScreen 2v2 最適化 | [ ] 未着手 | — |
| S5-6 テスト・品質保証 | [ ] 未着手 | — |
