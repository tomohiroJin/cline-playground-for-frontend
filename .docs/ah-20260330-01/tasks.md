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
- [x] **S6-1-3b**: [#9] `buildAllyAiConfig` に `ALLY_REACTION_DELAY_CAP = 120ms` を追加（S6-3f で実装済み）
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
- [x] **S6-3-13**: teamRole は `applyTeamAndSideAdjustments` で自動適用済み
- [x] **S6-3-14**: テスト — attacker は balanced より前方にポジション
- [x] **S6-3-14b**: [#12] **品質ゲート 2**: 通過（型エラーなし、97テスト全パス）

### S6-3f: 動的 teamRole 切り替え（S-4）

- [x] **S6-3-15**: `getScoreAdjustment` 関数を pair-match-logic.ts に実装
- [x] **S6-3-15b**: `applyTeamAndSideAdjustments` に scoreDiff を統合済み（S6-4）
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

- [x] **S6-4-1**: [R-5] 開発モードで FPS 計測変数を useGameLoop 内に追加
- [x] **S6-4-2**: [R-5] ゲームループ末尾に FPS カウンター表示（緑、12px monospace、Canvas 左上）
- [ ] **S6-4-3**: 2v2 モードでの計測を実施しボトルネックを特定（手動）
- [ ] **S6-4-4**: ボトルネックを特定し、最適化の優先順位を決定（手動）

### S6-4b: 衝突判定最適化（S-1）

- [x] **S6-4-5**: [S-1] `quickReject` 関数を `physics.ts` に追加（距離の二乗比較方式）
- [x] **S6-4-7**: テスト — 3 ケース（遠い/近い/境界）
- [x] **S6-4-6**: `processCollisions` 内で `quickReject` を衝突判定前に呼び出し（実装済み）

### S6-4c: AI 計算の間引き（MF-3 統合）

- [x] **S6-4-8**: [MF-3/#1] shouldRecalculateTarget に通常時定期再計算を追加（実装済み）
  - → 計測結果に応じて実施。現時点では基本ロジック（S6-3-10）のみ
- [x] **S6-4-9〜10**: テスト — 定期再計算の3ケース追加済み

### S6-3 保留タスクのゲームループ統合

- [x] **S6-3-13**: teamRole の aggressiveness 調整 → `applyTeamAndSideAdjustments` で自動適用済み
- [x] **S6-3-15b**: getScoreAdjustment → `applyTeamAndSideAdjustments` に scoreDiff パラメータ追加で統合

### S6-4d: Canvas 描画最適化

- [ ] **S6-4-11〜12**: 計測結果に応じて実施（手動計測後）

### S6-4e: 品質保証

- [ ] **S6-4-13**: 最適化後の再計測（手動）
- [x] **S6-4-14**: テスト・品質保証（型チェック・テスト全パス）

## Phase S6-5: Gamepad API — P3/P4 人間操作対応（L）

### S6-5a: コア層

- [x] **S6-5-1**: `core/gamepad.ts` を新規作成
  - `readGamepad`, `isGamepadSupported`, `applyNonLinearCurve`, `DEADZONE=0.15`, `GAMEPAD_MOVE_SPEED=12`
- [x] **S6-5-2**: テスト — 13 ケース（接続/未接続/デッドゾーン/ボタン/非線形カーブ/定数）

### S6-5b: フック層

- [x] **S6-5-3**: `hooks/useGamepadInput.ts` を新規作成（接続/切断イベント + トースト通知状態管理）
- [ ] **S6-5-4**: テスト — useGamepadInput のテスト（ブラウザ API モックが必要）

### S6-5c: 状態管理

- [x] **S6-5-5**: `useGameMode` に `enemy1ControlType` / `enemy2ControlType` を追加
- [x] **S6-5-6**: `resetToFree` で新 state をリセット
- [x] **S6-5-7**: 既存テスト全パスで実質完了（7659テスト通過）

### S6-5d: ゲームループ統合

- [x] **S6-5-8**: `useGameLoop` に P3/P4 ゲームパッド入力処理を追加
- [x] **S6-5-9**: `GameLoopConfig` に `enemy1ControlType` / `enemy2ControlType` を追加
- [x] **S6-5-10**: `AirHockeyGame` から enemy ControlType を useGameLoop に伝達

### S6-5e: UI

- [x] **S6-5-11**: TeamSetupScreen P3/P4 に CPU/🎮人間トグル追加（ゲームパッド未接続時グレーアウト）
- [ ] **S6-5-12**: VsScreen で P3/P4 操作タイプラベル表示（次フェーズで対応可）

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

- [x] **S6-6-1**: [S-3] `ConfirmDialog` を `src/components/ConfirmDialog.tsx` に作成（共通化）
  - MF-1: 初期フォーカスを cancelLabel ボタンに設定、Escape→onCancel
  - aria-modal, aria-labelledby, role="dialog" 対応
- [ ] **S6-6-2**: [R-1] アニメーション追加（CSS transition）→ 後続で対応可
- [x] **S6-6-3**: テスト — 8 ケース（表示/非表示/ボタン/Escape/初期フォーカス/タッチターゲット）
- [x] **S6-6-4**: `handleGameMenuClick` に 2v2 確認ダイアログを組み込み
- [x] **S6-6-5**: `handleResultBackToMenu` にも 2v2 確認ダイアログを組み込み
- ~~**S6-6-X**: TeamSetupScreen は MF-2 により不要~~
- [ ] **S6-6-6〜7**: 統合テスト（AirHockeyGame のモック含む）→ 手動確認
- [x] **S6-6-8**: 型チェック OK、テスト全パス

## Phase S6-7: テスト・品質保証（M）

- [x] **S6-7-1**: 全テスト全パス — 602スイート / 7671テスト
- [x] **S6-7-2**: 型エラーなし
- [x] **S6-7-3**: ESLint エラーなし（未使用変数 cpuTarget/cpuTargetTime を修正）
- [x] **S6-7-4**: ビルド成功（既存の bundle size warning のみ）
- [ ] **S6-7-5**: フリー対戦モードの動作確認（手動 — ユーザー確認）
- [ ] **S6-7-6**: ストーリーモードの動作確認（手動 — ユーザー確認）
- [ ] **S6-7-7**: 2P 対戦モードの動作確認（手動 — ユーザー確認）
- [ ] **S6-7-8**: ペアマッチ 2v2 の動作確認（手動 — ユーザー確認）
- [x] **S6-7-9**: ドキュメント更新
  - README.md: 未実装機能リスト更新 + AI クイックリファレンス表を S6-3 対応に
  - features.md: キャラ別 AI プロファイル表を 9 パラメータ対応に更新 + 新パラメータ説明追加
  - gameplay.md: ペアマッチ操作表に Gamepad 対応を追加 + 確認ダイアログ記載
  - architecture.md: gamepad.ts / character-ai-profiles.ts / useGamepadInput.ts を追加

## Phase S6-8: 手動確認フィードバック修正（S）

### S6-8a: 終了確認ダイアログの全モード対応（FB-1）

- [x] **S6-8-1**: `handleGameMenuClick` の `mode.gameMode === '2v2-local'` 条件を削除し、全モードで `setShowExitConfirm(true)` を呼ぶ
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S6-8-2**: ダイアログの `message` をモードに応じて動的に変更
  - `core/exit-confirm.ts` に `getExitConfirmMessage` ヘルパーを新規作成
  - 2v2: 「チーム設定がリセットされます」
  - story: 「進行中のステージが中断されます」
  - free/2p-local: 「対戦が中断されます」
- [x] **S6-8-3**: `handleResultBackToMenu` は確認不要 — 2v2 条件分岐を削除し直接遷移に統一
  - 対象: `presentation/AirHockeyGame.tsx`
- [x] **S6-8-4**: テスト — 全モードでモード別メッセージの検証（4テスト）
  - `core/exit-confirm.test.ts` 新規

### S6-8b: 画像プリロードによる CLS 防止（FB-2）

- [x] **S6-8-5**: `CharacterAvatar` に画像ロード前フォールバック表示を追加
  - `onLoad` で `isImageLoaded` フラグを管理し、ロード前はイニシャル表示
  - `width`/`height` 属性は既存 `size` prop を活用して明示設定
  - 対象: `components/CharacterAvatar.tsx`
- [x] **S6-8-6**: `TeamSetupScreen` のスロット/グリッド内 `<img>` に `width`/`height` 属性追加
  - 対象: `components/TeamSetupScreen.tsx`
- [x] **S6-8-7**: `CharacterSelectScreen` の全 `<img>` に `width`/`height` 属性追加
  - 対象: `components/CharacterSelectScreen.tsx`
- [x] **S6-8-8**: テスト — 画像ロード前フォールバック/ロード後/エラー時（5テスト）
  - `components/CharacterAvatar.test.tsx` 新規

### S6-8c: DialogueOverlay のレイアウト安定化（FB-3）

- [x] **S6-8-9**: ポートレート領域の条件レンダリングを廃止し、統一コンテナ構造に変更
  - `portraitUrl ? <img> : <spacer>` → 常に `portrait-container` div、中身の `<img>` のみ条件付き
  - 対象: `components/DialogueOverlay.tsx`
- [x] **S6-8-10**: テキスト領域に固定高さを設定（`minHeight: '3em'` → `height: '4.8em'` + `overflow: hidden`）
  - 対象: `components/DialogueOverlay.tsx`
- [x] **S6-8-11**: 進行インジケーターを `visibility: hidden/visible` で切り替え（常にスペース確保）
  - 対象: `components/DialogueOverlay.tsx`
- [x] **S6-8-12**: テスト — レイアウト安定化の5テスト追加
  - `components/DialogueOverlay.test.tsx` に追記

### S6-8d: 品質保証

- [x] **S6-8-13**: 型チェック・テスト全パス・ビルド成功
  - 604スイート / 7685テスト全パス、型エラーなし、ESLint エラーなし、ビルド成功
- [x] **S6-8-14**: 全モード動作確認 — E2E 打鍵チェック 4/4 パス
  - フリー対戦: 確認ダイアログ表示 + 「対戦が中断されます」メッセージ確認
  - フリー対戦: 「メニューに戻る」でタイトル画面遷移確認
  - 2P 対戦: 画像 width/height 属性の存在確認
  - ストーリー: テキスト固定高さ + インジケーター visibility 確認

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
| S6-8 | S | 4-5 | 〜80行 | FB-1, FB-2, FB-3（手動確認フィードバック） |

## 進捗サマリー

| Phase | ステータス | 完了日 |
|-------|----------|--------|
| S6-1 ally CPU AI プロファイル修正 | [x] 完了 | 2026-03-30 |
| S6-2 sidePreference 実装 | [x] 完了 | 2026-03-30 |
| S6-3 CPU 戦略の深化 | [x] 完了（ゲームループ統合は S6-4 で） | 2026-03-30 |
| S6-4 パフォーマンス最適化 | [x] コード部分完了（計測は手動） | 2026-03-31 |
| S6-5 Gamepad P3/P4 人間操作 | [x] コア+状態管理完了 | 2026-03-31 |
| S6-6 中断確認ダイアログ | [x] 完了 | 2026-03-31 |
| S6-7 テスト・品質保証 | [x] 自動検証完了（手動確認は別途） | 2026-03-31 |
| S6-8 手動確認フィードバック修正 | [x] 自動検証完了（手動確認は別途） | 2026-04-01 |
