# Falldown Shooter ブラッシュアップ タスクリスト

## 凡例

- [ ] 未着手
- [x] 完了
- 🔴 高優先度 / 🟡 中優先度 / 🟢 低優先度

---

## Phase 1: UI改善（ユーザー要望対応）

### 1-1. レスポンシブ対応の強化 🔴

- [x] **1-1-1**: `use-responsive-size.ts` を改修し、`isLandscape` / `isMobile` / `controllerPosition` を返すようにする
- [x] **1-1-2**: ブレイクポイント定数を `constants.ts` に追加（mobile: 480px, tablet: 768px, desktop: 1024px）
- [x] **1-1-3**: `PageContainer` をモバイル縦向きで画面内に収まるよう改修（overflow対策）
- [x] **1-1-4**: `GameArea` の `max-height` を画面高さに応じて動的設定
- [x] **1-1-5**: スマートフォン横向き（landscape）レイアウトの実装（ゲーム画面 + HUD/コントローラー横並び）
- [x] **1-1-6**: `ControlsContainer` を縦向き時は画面下部固定（`position: sticky`）にする
- [x] **1-1-7**: Header をモバイルでコンパクト化（タイトル短縮、アイコン配置最適化）
- [x] **1-1-8**: SkillGauge / StatusBar / PowerUpIndicator のモバイル向けレイアウト調整
- [x] **1-1-9**: オーバーレイ画面（Start / Clear / GameOver / Ending）のレスポンシブ対応
- [ ] **1-1-10**: 各ブレイクポイントでの表示確認テスト（Chrome DevTools / 実機）
- [x] **1-1-11**: `use-responsive-size.ts` のユニットテスト追加
- [x] **1-1-12**: セルサイズ計算に画面高さを考慮（縦向き時、幅と高さ両方から画面に収まる最大サイズを算出）
- [x] **1-1-13**: モバイル・タブレットでセルサイズの上限30px制約を撤廃し画面に合わせて拡大・縮小するよう修正
- [x] **1-1-14**: `use-responsive-size.ts` のユニットテスト更新（拡大・高さ考慮のケース追加）

### 1-2. コントローラーUIの刷新 🔴

- [x] **1-2-1**: 左移動ボタン用SVGシェブロンアイコンコンポーネント作成
- [x] **1-2-2**: 右移動ボタン用SVGシェブロンアイコンコンポーネント作成
- [x] **1-2-3**: 射撃ボタン用SVGクロスヘアアイコンコンポーネント作成
- [x] **1-2-4**: `ControlBtn` スタイルをリデザイン（グラデーション背景、枠線、グロー効果）
- [x] **1-2-5**: 射撃ボタンを円形にリデザイン（64×64px、赤グラデーション）
- [x] **1-2-6**: ボタン押下時のインタラクションアニメーション実装（scale + グロー変化）
- [x] **1-2-7**: レスポンシブ対応（モバイル/タブレット/デスクトップでサイズ調整）
- [x] **1-2-8**: アクセシビリティ確認（aria-label維持、フォーカス表示）
- [x] **1-2-9**: 既存のコントローラー関連テストの更新

---

## Phase 2: ゲーム体験の向上

### 2-1. コンボシステムの導入 🟡

- [x] **2-1-1**: コンボ関連の型定義を `types.ts` に追加（ComboState, ComboConfig, ComboMultiplierEntry）
- [x] **2-1-2**: コンボ関連の定数を `constants.ts` に追加（COMBO_CONFIG: ウィンドウ時間、倍率テーブル等）
- [x] **2-1-3**: `use-combo-system.ts` フック作成（コンボカウント、倍率計算、タイマー管理）
- [x] **2-1-4**: `use-game-loop.ts` のスコア計算にコンボ倍率を統合（onLineClear, comboMultiplier パラメータ追加。※ 当初 onBlockHit としたが、フィードバックによりライン消しトリガーに変更）
- [x] **2-1-5**: コンボ表示UIコンポーネント `ComboDisplay.tsx` 作成
- [x] **2-1-6**: コンボポップアップアニメーション実装（scale + フェードアウト）
- [x] **2-1-7**: スキルゲージへのコンボボーナス連携（5コンボごとに+10%）
- [x] **2-1-8**: コンボシステムのユニットテスト（20テスト）
- [x] **2-1-9**: コンボUIのコンポーネントテスト（6テスト）

### 2-2. スコア演出の強化 🟡

- [x] **2-2-1**: フローティングスコアコンポーネント `FloatingScore.tsx` 作成
- [x] **2-2-2**: フローティングスコア管理フック `use-floating-scores.ts` 作成、ゲーム画面に統合
- [x] **2-2-3**: ラインクリア時の光るエフェクト実装（CSS animation `line-flash`）
- [x] **2-2-4**: ハイスコア更新検知ロジック追加（`FalldownShooterGame.tsx` にuseEffect追加）
- [x] **2-2-5**: ハイスコア更新時の演出コンポーネント `HighScoreEffect.tsx` 作成
- [x] **2-2-6**: フローティングスコア・ハイスコアエフェクトのテスト（6テスト）

### 2-3. 画面シェイクエフェクト 🟡

- [x] **2-3-1**: シェイク用CSSキーフレームアニメーション定義（`FallingShooterPage.styles.ts` に ShakeKeyframes 追加）
- [x] **2-3-2**: `use-screen-shake.ts` フック作成（triggerShake + プリセット: bombShake, blastShake, lineShake, gameOverShake）
- [x] **2-3-3**: 爆弾使用時のシェイクトリガー連携（`usePowerUp` に `onBomb` コールバック追加）
- [x] **2-3-4**: ブラストスキル使用時のシェイクトリガー連携（`useSkillSystem` に `onBlast` コールバック追加）
- [x] **2-3-5**: ゲームオーバー時のシェイクトリガー連携（`FalldownShooterGame.tsx` にステータス監視useEffect追加）
- [x] **2-3-6**: `prefers-reduced-motion` 対応
- [x] **2-3-7**: シェイクフックのユニットテスト（9テスト）


---

## Phase 3: スコアバランス調整

### 3-1. コンボトリガーの修正 🔴

- [x] **3-1-1**: `use-game-loop.ts` の `onBlockHit`（弾ヒット時）を `onLineClear`（ライン消し時）に変更
- [x] **3-1-2**: `FalldownShooterGame.tsx` の `handleBlockHit` を `handleLineClear` にリネームし、ライン消しに接続
- [x] **3-1-3**: フローティングスコアの表示をブロック破壊位置から盤面下部（ライン消し位置付近）に変更
- [x] **3-1-4**: TypeScript 型チェック・全テスト通過を確認

### 3-2. 同時消しボーナスの導入 🔴

- [ ] **3-2-1**: 同時消しボーナス倍率テーブルを `constants.ts` に定数定義（1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0）
- [ ] **3-2-2**: `use-game-loop.ts` のライン消しスコア計算に同時消しボーナス倍率を組み込む
- [ ] **3-2-3**: 同時消しボーナスのユニットテスト追加
- [ ] **3-2-4**: フローティングスコアにボーナス倍率を反映

### 3-3. ライン消しスコアへのコンボ倍率適用 🔴

- [ ] **3-3-1**: ライン消しスコア計算に `comboMultiplier` を適用
- [ ] **3-3-2**: 弾ヒットスコアから `comboMultiplier` を除去
- [ ] **3-3-3**: スコア計算のユニットテスト追加（同時消し × コンボのバランス確認）
- [ ] **3-3-4**: TypeScript 型チェック・全テスト通過を確認

---

## 横断タスク

### テスト・品質 🟡

- [x] **X-1**: 既存テスト158件が全て通ることを各Phase完了時に確認（Phase 2完了: 229テスト全通過）
- [x] **X-2**: 新規コードのテストカバレッジ80%以上を確認
- [x] **X-3**: Lint エラーがないことを確認

### ドキュメント 🟢

- [x] **X-4**: 各Phase完了時に変更内容をこのタスクリストに反映
- [x] **X-5**: 新規フック・コンポーネントにJSDoc コメントを追加

---

## タスク数サマリー

| Phase | タスク数 | 完了 | 優先度 |
|-------|---------|------|--------|
| Phase 1（UI改善） | 23 | 22/23 | 🔴 高 |
| Phase 2（ゲーム体験） | 22 | 22/22 | 🟡 中 |
| Phase 3（スコアバランス） | 12 | 4/12 | 🔴 高 |
| 横断 | 5 | 5/5 | - |
| **合計** | **62** | **53/62** | - |

### Phase 1 完了サマリー

#### 変更ファイル
- `src/features/falldown-shooter/constants.ts` — `BREAKPOINTS` 定数追加
- `src/features/falldown-shooter/hooks/use-responsive-size.ts` — `ResponsiveLayout` インターフェース拡張（cellSize, isLandscape, isMobile, controllerPosition）
- `src/features/falldown-shooter/components/ControllerIcons.tsx` — **新規** SVGアイコン（ChevronLeft, ChevronRight, Crosshair）
- `src/features/falldown-shooter/components/GameController.tsx` — **新規** コントローラーコンポーネント
- `src/features/falldown-shooter/FalldownShooterGame.tsx` — GameController統合、横向きレイアウト対応
- `src/pages/FallingShooterPage.styles.ts` — ControlBtn リデザイン、レスポンシブスタイル追加

#### テストファイル
- `src/features/falldown-shooter/__tests__/use-responsive-size.test.ts` — **新規** 12テスト
- `src/features/falldown-shooter/__tests__/components/GameController.test.tsx` — **新規** 12テスト
- `src/features/falldown-shooter/__tests__/integration.test.tsx` — コントロールボタンテスト更新（テキスト → aria-label）

#### 残タスク
- **1-1-10**: 実機・DevToolsでの表示確認テスト（手動テスト）

### Phase 2 完了サマリー

#### 変更ファイル
- `src/features/falldown-shooter/types.ts` — `ComboState`, `ComboConfig`, `ComboMultiplierEntry` 型追加
- `src/features/falldown-shooter/constants.ts` — `COMBO_CONFIG` 定数追加
- `src/features/falldown-shooter/hooks/use-combo-system.ts` — **新規** コンボシステムフック
- `src/features/falldown-shooter/hooks/use-screen-shake.ts` — **新規** 画面シェイクフック
- `src/features/falldown-shooter/hooks/use-floating-scores.ts` — **新規** フローティングスコア管理フック
- `src/features/falldown-shooter/components/ComboDisplay.tsx` — **新規** コンボ表示コンポーネント
- `src/features/falldown-shooter/components/FloatingScore.tsx` — **新規** フローティングスコアコンポーネント
- `src/features/falldown-shooter/components/HighScoreEffect.tsx` — **新規** ハイスコア更新演出コンポーネント
- `src/features/falldown-shooter/hooks/use-game-loop.ts` — `onLineClear`, `comboMultiplier` パラメータ追加（※ 当初 `onBlockHit` としたが、フィードバックによりライン消しトリガーに変更）
- `src/features/falldown-shooter/hooks/use-power-up.ts` — `onBomb` コールバック追加
- `src/features/falldown-shooter/hooks/use-skill-system.ts` — `onBlast` コールバック追加
- `src/features/falldown-shooter/FalldownShooterGame.tsx` — コンボ・シェイク・フローティングスコア・ハイスコア演出統合
- `src/pages/FallingShooterPage.styles.ts` — `ShakeKeyframes`, `line-flash` グローバルスタイル追加

#### テストファイル
- `src/features/falldown-shooter/__tests__/use-combo-system.test.ts` — **新規** 20テスト
- `src/features/falldown-shooter/__tests__/components/ComboDisplay.test.tsx` — **新規** 6テスト
- `src/features/falldown-shooter/__tests__/components/FloatingScore.test.tsx` — **新規** 4テスト
- `src/features/falldown-shooter/__tests__/use-screen-shake.test.ts` — **新規** 9テスト
- `src/features/falldown-shooter/__tests__/components/HighScoreEffect.test.tsx` — **新規** 2テスト
