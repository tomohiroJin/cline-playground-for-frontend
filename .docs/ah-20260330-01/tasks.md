# Air Hockey ペアマッチ品質向上 — タスクチェックリスト

## Phase S6-1: ally CPU の AI プロファイル修正 — SR-3（S）

- [x] **S6-1-1**: `useGameLoop` 内の ally AI 設定構築箇所を特定し、`allyCharacterId` が渡されているか確認
  - 対象: `presentation/hooks/useGameLoop.ts`
  - 結果: 行525 で `buildAllyAiConfig(diff, allyCharacterId)` が正しく呼ばれている
- [x] **S6-1-2**: `allyCharacterId` が `undefined` の場合の原因を修正
  - 対象: `presentation/AirHockeyGame.tsx`
  - 結果: 行376 で `is2v2Mode ? pairAlly.id : undefined` が正しく設定済み。修正不要
- [x] **S6-1-3**: ally/cpu/enemy の AI 設定が独立して構築されていることを確認・修正
  - 結果: ally=buildAllyAiConfig, cpu=buildFreeBattleAiConfig(enemy1), enemy=buildFreeBattleAiConfig(enemy2) で独立。テストで検証済み
- [ ] **S6-1-3b**: [#9] `buildAllyAiConfig` に `ALLY_REACTION_DELAY_CAP = 120ms` を追加
  - → **S6-3a に移動**: reactionDelay は S6-3 で AiPlayStyle 型に追加されるため、型追加後に実装
- [x] **S6-1-4**: テスト — キャラ別 AI プロファイルが ally に反映される
  - 対象: `core/story-balance.test.ts` に 14 テスト追加
  - ケース: タクマ aggressiveness=0.2 そのまま ✓
  - ケース: ヒロ aggressiveness=0.7→0.5 キャップ ✓
  - ケース: ally と enemy で同キャラでも aggressiveness が異なる ✓
- [x] **S6-1-5**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 52 テスト全パス、型エラーなし

## Phase S6-2: sidePreference ロジック実装（M）

- [x] **S6-2-1**: `ai.ts` の `calculateTargetWithBehavior` に `applySidePreference` ロジックを追加
  - 対象: `core/ai.ts`
  - `SIDE_OFFSET_MAX = 75` px、端に寄りすぎない減衰処理、clamp で壁内に収める
- [x] **S6-2-2**: `character-ai-profiles.ts` の各キャラに `sidePreference` 値を設定
  - ヒロ: 0.0, ミサキ: 0.3, タクマ: 0.0, ユウ: -0.2, ルーキー: 0.0, レギュラー: 0.1, エース: -0.1
- [x] **S6-2-3**: `ai.ts` の TODO コメントを削除
- [x] **S6-2-4**: `character-ai-profiles.ts` の TODO コメントを削除
- [x] **S6-2-5**: [R-4] ally CPU の Y 軸反転時に sidePreference を反転する処理を追加
  - `pair-match-logic.ts` の `updateExtraMalletAI` で `sidePreference * -1`
- [x] **S6-2-6**: テスト — sidePreference > 0 で右オフセット / < 0 で左オフセット
  - `AI.test.ts` に 4 テスト追加（右/左/0/範囲外防止）
- [x] **S6-2-7**: テスト — sidePreference = 0 ではオフセットなし
- [x] **S6-2-8**: テスト — ally CPU で sidePreference が反転して適用される
  - `pair-match-logic.test.ts` に 2 テスト追加（ally 反転/enemy 非反転）
- [x] **S6-2-9**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 149 テスト全パス、型エラーなし、ESLint エラーなし

## Phase S6-3: CPU 戦略の深化（L）

### S6-3a: 型定義・プロファイル拡張

- [x] **S6-3-1**: `AiPlayStyle` 型に `defenseStyle`, `deflectionBias`, `reactionDelay`, `teamRole` を追加
- [x] **S6-3-2**: `DEFAULT_PLAY_STYLE` に新フィールドのデフォルト値を設定
- [x] **S6-3-3**: 各キャラのプロファイルに新パラメータを設定（spec §3.8 準拠）

### S6-3b: 守備パターン（defenseStyle）

- [x] **S6-3-4**: `calculateTargetWithBehavior` に `applyDefenseStyle` を追加（#6 優先ルール適用）
- [x] **S6-3-5**: テスト — center/wide/aggressive + パック自陣時は aggressiveness 優先
- [x] **S6-3-5b**: [#12] **品質ゲート 1**: 通過（型エラーなし、161テスト全パス）

### S6-3c: 打ち返し角度（deflectionBias）

- [x] **S6-3-6**: `applyDeflectionBias` 関数を ai.ts に追加（±30° バイアス）
- [x] **S6-3-7**: `resolveMalletPuckOverlap` に `deflectionBias` パラメータ追加（#3 対応）
- [x] **S6-3-8**: テスト — deflectionBias > 0 / < 0 / = 0 の 3 ケース

### S6-3d: リアクション速度（reactionDelay）

- [x] **S6-3-9**: `shouldRecalculateTarget` 関数を ai.ts に追加
- [x] **S6-3-10**: パック方向転換検出 + reactionDelay 遅延制御を実装
- [x] **S6-3-11**: テスト — 4 ケース（経過後許可/未経過拒否/転換なし拒否/delay=0 即座）

### S6-3e: 連携 AI（teamRole）

- [x] **S6-3-12**: `applyTeamAndSideAdjustments` に teamRole の aggressiveness 調整を統合
- [ ] **S6-3-13**: 2v2 ゲームループで ally/enemy の `teamRole` を AI 設定に組み込む
  - → useGameLoop.ts の変更は S6-4 のゲームループ統合と一緒に実施予定
- [x] **S6-3-14**: テスト — attacker は balanced より前方にポジション
- [x] **S6-3-14b**: [#12] **品質ゲート 2**: 通過（型エラーなし、97テスト全パス）

### S6-3f: 動的 teamRole 切り替え（S-4）

- [x] **S6-3-15**: `getScoreAdjustment` 関数を pair-match-logic.ts に実装
- [ ] **S6-3-15b**: [#2] ゲームループで `getScoreAdjustment` を呼び出し
  - → useGameLoop.ts の変更は S6-4 のゲームループ統合と一緒に実施予定
- [x] **S6-3-16**: テスト — 4 ケース（負け/勝ち/1点差以下/adaptability=0）

### S6-1-3b（S6-3a に移動）: ally reactionDelay キャップ

- [x] **S6-1-3b**: `buildAllyAiConfig` に `ALLY_REACTION_DELAY_CAP = 120ms` を追加
  - ルーキー 200ms → 120ms にキャップ確認済み

### S6-3g: キャラ特性の視覚表示（R-3）

- [x] **S6-3-17**: [R-3] ROLE_BADGE マッピング + RoleBadge コンポーネントを TeamSetupScreen.tsx に追加
  - attacker→⚔️(赤), defender→🛡️(青), balanced→⚖️(オレンジ)
- [x] **S6-3-18**: [R-3] スロット行のキャラ名横に 14px バッジを表示（P1 固定含む）
- [x] **S6-3-19**: [R-3] グリッドカードのアイコン右下に 12px バッジを表示
- [x] **S6-3-20**: テスト — スロットとグリッドにバッジ表示を確認（2件追加）

### S6-3h: 品質保証

- [x] **S6-3-21**: テスト・品質保証（型チェック・テスト全パス）
  - 600 スイート / 7641+ テスト全パス、型エラーなし
- [ ] **S6-3-22**: 全キャラでの動作確認（フリー対戦 + 2v2 でキャラごとの挙動差を目視確認）
  - 対象: 手動テスト（ユーザーに依頼）

## Phase S6-4: パフォーマンス最適化（L）

### S6-4a: 計測基盤（R-5）

- [ ] **S6-4-1**: [R-5] `performance.mark`/`performance.measure` を useGameLoop 内の主要処理に埋め込み
  - 対象: `presentation/hooks/useGameLoop.ts`
  - 計測ポイント: AI 更新、衝突判定、Canvas 描画
  - 開発モード（`process.env.NODE_ENV === 'development'`）のみ有効
- [ ] **S6-4-2**: [R-5] 開発モードで Canvas 左上に FPS カウンターを表示
  - 対象: `presentation/hooks/useGameLoop.ts` or `infrastructure/renderer/`
  - 表示: `FPS: XX`（緑色、12px monospace）
- [ ] **S6-4-3**: 2v2 モードでの計測を実施しボトルネックを特定
  - 計測項目: フレーム間隔、gameLoop 実行時間、衝突判定時間、描画時間
  - 記録: `.docs/ah-20260330-01/` にプロファイリング結果をメモ
- [ ] **S6-4-4**: ボトルネックを特定し、最適化の優先順位を決定
  - 対象: 計測結果に基づく判断
  - [#5] 想定外のボトルネックが見つかった場合は追加タスクを動的に作成:
    - React 再レンダリングが主因 → memo/useMemo 見直しタスク追加
    - 全モード共通の問題 → 影響範囲を拡大し 1v1/2P のテストも強化
    - AI 計算が軽微 → S6-4c の間引き実装をスキップ可能

### S6-4b: 衝突判定最適化（S-1）

- [ ] **S6-4-5**: [S-1] `quickReject` 関数を `physics.ts` に追加（距離の二乗比較方式）
  - 対象: `core/physics.ts`
  - `dx*dx + dy*dy > maxDist*maxDist` で sqrt を完全回避
- [ ] **S6-4-6**: `processCollisions` 内で `quickReject` を衝突判定前に呼び出し
  - 対象: `presentation/hooks/useGameLoop.ts`
- [ ] **S6-4-7**: テスト — quickReject が正しく判定する（近い/遠いペア）
  - 対象: テストファイル

### S6-4c: AI 計算の間引き（MF-3 統合）

- [ ] **S6-4-8**: [MF-3/#1] S6-3-10 の `shouldRecalculateTarget` を拡張（上書きではない）
  - 対象: `core/ai.ts`
  - S6-3-10 で実装済みの「パック方向転換時の遅延」はそのまま維持
  - 追加: 通常時の定期再計算（`reactionDelay * 3`, 最低 100ms）
  - ターゲット再計算のみ遅延、マレット移動の補間は毎フレーム実行
  - `AI_UPDATE_INTERVAL` は不要（方式 A 確定）
- [ ] **S6-4-9**: テスト — reactionDelay=0 で毎フレーム更新、reactionDelay>0 で適切にスキップ
  - 対象: テストファイル
- [ ] **S6-4-10**: テスト — 間引き中もマレットが前回ターゲットに向かって滑らかに移動する
  - 対象: テストファイル + 手動確認

### S6-4d: Canvas 描画最適化

- [ ] **S6-4-11**: 背景描画（フィールドライン・ゴール等）をオフスクリーン Canvas にキャッシュ
  - 対象: `infrastructure/renderer/` 配下
- [ ] **S6-4-12**: 計測結果に応じた追加最適化（ダーティリージョン・オブジェクトプール等）
  - 対象: 計測結果に基づく

### S6-4e: 品質保証

- [ ] **S6-4-13**: 最適化後の再計測でフレームレート改善を確認
  - 目標: 2v2 + フィーバー時でも安定 60fps
  - R-5 の FPS カウンターで before/after を定量比較
- [ ] **S6-4-14**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S6-5: Gamepad API — P3/P4 人間操作対応（L）

### S6-5a: コア層

- [ ] **S6-5-1**: `core/gamepad.ts` を新規作成（Gamepad API ラッパー）
  - `readGamepad(index)`, `isGamepadSupported()`, `DEADZONE = 0.15`
  - [S-2] `applyNonLinearCurve(axis)` — `sign(x) * x^2` の非線形カーブ
- [ ] **S6-5-2**: テスト — readGamepad のモック動作確認、非線形カーブの検証
  - 対象: `core/gamepad.test.ts`

### S6-5b: フック層

- [ ] **S6-5-3**: `hooks/useGamepadInput.ts` を新規作成
  - 接続/切断イベントの監視
  - connectedCount の管理
  - [R-2] 接続/切断時のトースト通知状態管理
- [ ] **S6-5-4**: テスト — ゲームパッド接続/切断の検出
  - 対象: `hooks/useGamepadInput.test.ts`

### S6-5c: 状態管理

- [ ] **S6-5-5**: `useGameMode` に `enemy1ControlType` / `enemy2ControlType` state を追加
  - 対象: `presentation/hooks/useGameMode.ts`
  - デフォルト: 'cpu'
- [ ] **S6-5-6**: `resetToFree` で `enemy1ControlType` / `enemy2ControlType` をリセット
  - 対象: `presentation/hooks/useGameMode.ts`
- [ ] **S6-5-7**: テスト — 新 state の初期値・変更・リセット
  - 対象: `presentation/hooks/useGameMode.test.ts`

### S6-5d: ゲームループ統合

- [ ] **S6-5-8**: `useGameLoop` にゲームパッド入力処理を追加
  - 対象: `presentation/hooks/useGameLoop.ts`
  - P3/P4 が 'human' の場合、ゲームパッドからマレット位置を更新
  - CPU の場合は従来の AI 更新
- [ ] **S6-5-9**: `GameLoopConfig` に `enemy1ControlType` / `enemy2ControlType` を追加
  - 対象: `presentation/hooks/useGameLoop.ts`
- [ ] **S6-5-10**: `AirHockeyGame` からゲームループへの伝達
  - 対象: `presentation/AirHockeyGame.tsx`

### S6-5e: UI

- [ ] **S6-5-11**: TeamSetupScreen の P3/P4 スロットに CPU/人間切り替えトグルを追加
  - 対象: `components/TeamSetupScreen.tsx`
  - ゲームパッド未接続時はグレーアウト + ツールチップ「ゲームパッドを接続してください」
- [ ] **S6-5-12**: VsScreen で P3/P4 の操作タイプ（CPU / 🎮）をラベル表示
  - 対象: `components/VsScreen.tsx`

### S6-5f: トースト通知（R-2）

- [ ] **S6-5-13**: [R-2] ゲームパッド接続/切断トースト通知コンポーネントを作成
  - 対象: `components/GamepadToast.tsx` 新規（or 共通コンポーネント化）
  - Canvas 下部中央に 3 秒表示 → フェードアウト（500ms）
  - 背景: `rgba(0, 0, 0, 0.8)`, borderRadius: 8px
- [ ] **S6-5-14**: [R-2] テスト — 接続/切断トーストの表示・自動消去
  - 対象: テストファイル

### S6-5g: 品質保証

- [ ] **S6-5-15**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体
- [ ] **S6-5-16**: ゲームパッド未接続時に既存動作に影響がないことを確認
  - 対象: 全モードの動作確認

## Phase S6-6: 中断時の確認ダイアログ — SR-5（S）

- [ ] **S6-6-1**: [S-3] `ConfirmDialog` コンポーネントを `src/components/` に作成（共通化）
  - 対象: `src/components/ConfirmDialog.tsx` 新規
  - Props: isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel
  - [MF-1] 初期フォーカスを cancelLabel ボタン（安全な操作）に設定
  - Enter→フォーカス中のボタンを実行、Escape→キャンセル
  - フォーカストラップ（Tab/Shift+Tab でボタン間移動）
  - フォーカスインジケーター: `outline: 2px solid #fff, offset: 2px`
- [ ] **S6-6-2**: [R-1] ConfirmDialog にアニメーションを追加
  - オーバーレイ: `opacity 0→0.7`（150ms ease-out）
  - ダイアログ: `scale(0.95)→scale(1)` + `opacity 0→1`（150ms ease-out）
  - `prefers-reduced-motion` 時はスキップ
- [ ] **S6-6-3**: テスト — ConfirmDialog の表示・非表示・キーボード操作・初期フォーカス
  - 対象: `src/components/ConfirmDialog.test.tsx` 新規
  - ケース: 初期フォーカスが「続ける」にあること
  - ケース: Enter で「続ける」が実行されること（MF-1 検証）
  - ケース: Tab → Enter で「メニューに戻る」が実行されること
  - ケース: Escape で「続ける」が実行されること
- [ ] **S6-6-4**: `AirHockeyGame` のメニューボタンハンドラに確認ダイアログを組み込み
  - 対象: `presentation/AirHockeyGame.tsx`
  - 2v2 モード時: ダイアログ表示 → 確定で `resetToFree()`
  - 他モード時: 即座に `resetToFree()`（従来動作維持）
- [ ] **S6-6-5**: リザルト画面のメニューボタンにも同様の確認を追加
  - 対象: `presentation/AirHockeyGame.tsx`
- [ ] ~~**S6-6-X**: TeamSetupScreen の戻るボタンにも確認を追加~~ **[MF-2 により削除]**
  - TeamSetupScreen はゲーム未開始のため確認不要
- [ ] **S6-6-6**: テスト — 2v2 ゲーム中でダイアログ表示 / 1v1 でスキップ / キャンセルで復帰
  - 対象: テストファイル
- [ ] **S6-6-7**: テスト — 2v2 リザルトでダイアログ表示 / TeamSetupScreen では不表示
  - 対象: テストファイル
- [ ] **S6-6-8**: テスト・品質保証（型チェック・テスト全パス・ビルド成功）
  - 対象: 全体

## Phase S6-7: テスト・品質保証（M）

- [ ] **S6-7-1**: 既存テスト全パス確認（`npm test`）
  - 対象: 全テスト
- [ ] **S6-7-2**: 型エラーなし確認（`npm run typecheck`）
  - 対象: 全ソース
- [ ] **S6-7-3**: ESLint エラーなし確認（`npm run lint:ci`）
  - 対象: 全ソース
- [ ] **S6-7-4**: ビルド成功確認（`npm run build`）
  - 対象: 全ソース
- [ ] **S6-7-5**: [#13] フリー対戦モードの動作確認（新パラメータ検証を含む）
  - 対象: 手動テスト
  - 各キャラを対戦相手に選び、以下を目視確認:
    - defenseStyle の違い（タクマ=center vs ヒロ=aggressive）
    - deflectionBias の違い（ミサキ=バウンス vs タクマ=ストレート）
    - reactionDelay の違い（ルーキー=遅い vs エース=速い）
  - 1v1 でもキャラ個性が体感できること
- [ ] **S6-7-6**: ストーリーモードの動作確認
  - 対象: 手動テスト
- [ ] **S6-7-7**: 2P 対戦モードの動作確認
  - 対象: 手動テスト
- [ ] **S6-7-8**: ペアマッチ（2v2）モードの動作確認
  - キャラ別 AI 個性の差が体感できること
  - パフォーマンスが安定していること（60fps 維持）
  - ゲームパッド接続時に P3/P4 操作可能なこと
  - 中断ダイアログが正しく動作すること
- [ ] **S6-7-9**: ドキュメント更新
  - 対象: `README.md`, `doc/features.md`, `doc/gameplay.md`, `doc/architecture.md`
  - 新機能（戦略深化・Gamepad・確認ダイアログ）をドキュメントに反映

---

## サイズ見積もり

| Phase | サイズ | 変更ファイル数 | 新規行数目安 | レビュー指摘反映 |
|-------|--------|-------------|-------------|----------------|
| S6-1 | S | 2-3 | 〜30行 | #9（ally reactionDelay キャップ） |
| S6-2 | M | 3 | 〜60行 | R-4（sidePreference Y軸反転） |
| S6-3 | L | 6-7 | 〜400行 | S-4, R-3, #2, #3, #6, #12（品質ゲート3段階） |
| S6-4 | L | 4-5 | 〜250行 | R-5, S-1, MF-3/#1/#11（方式A確定）, #5（分岐対応） |
| S6-5 | L | 8-9 | 〜500行 | R-2（トースト通知）、S-2（非線形カーブ） |
| S6-6 | M | 3-4 | 〜180行 | MF-1（安全キーマップ）、MF-2（TeamSetup除外）、R-1（アニメーション）、S-3（共通化） |
| S6-7 | M | 4-5 | ドキュメント更新 | — |

## 進捗サマリー

| Phase | ステータス | 完了日 |
|-------|----------|--------|
| S6-1 ally CPU AI プロファイル修正 | [x] 完了 | 2026-03-30 |
| S6-2 sidePreference 実装 | [x] 完了 | 2026-03-30 |
| S6-3 CPU 戦略の深化 | [x] 完了（ゲームループ統合は S6-4 で） | 2026-03-30 |
| S6-4 パフォーマンス最適化 | [ ] 未着手 | — |
| S6-5 Gamepad P3/P4 人間操作 | [ ] 未着手 | — |
| S6-6 中断確認ダイアログ | [ ] 未着手 | — |
| S6-7 テスト・品質保証 | [ ] 未着手 | — |
