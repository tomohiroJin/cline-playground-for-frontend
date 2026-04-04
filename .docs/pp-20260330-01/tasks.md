# 原始進化録 UI リサイズ タスクチェックリスト

## Phase 0: デザイントークン定義

- [ ] 0-1. `styles.ts` にフォントサイズトークンを定義（--fs-title 〜 --fs-tiny）
  - タイトル・サブタイトルには `clamp()` を適用
  - 全デバイスで最小 11px を保証
- [ ] 0-2. スペーシングトークンを定義（--sp-screen-pad 等）
  - ブレイクポイント別の値設定
- [ ] 0-3. カラーパレットトークンを定義（--c-accent, --c-text, --c-bg 等）
  - 基本 UI カラー、文明タイプカラー、カテゴリカラー、機能カラー
  - 既存の JS 定数（`TC`, `CAT_CL`, `LOG_COLORS`）との対応を整理
- [ ] 0-4. ゲームサイズトークンを定義（--game-width, --game-height）
- [ ] 0-5. ビルド確認 (`npm run build`)

## Phase 1: GameShell リサイズ + レスポンシブ基盤

- [ ] 1-1. `GameShell` のサイズを 480×720px → 720×960px に変更
  - PC: 720×960px 固定、画面中央配置
  - タブレット: min(90vw, 700px) × min(90vh, 960px)
  - タブレット横向き: min(90vw, 960px) × min(90vh, 700px)（`@media (orientation: landscape)` 対応）
  - モバイル: 100vw × 100dvh（`100vh` フォールバック付き）
- [ ] 1-2. `GameContainer` のセンタリング・レイアウト調整
- [ ] 1-3. `Screen` コンポーネントのパディングを CSS 変数に置換
- [ ] 1-4. ビルド確認 (`npm run build`)

## Phase 2: フォントサイズ拡大

- [ ] 2-1. `Title` コンポーネント: 22px → var(--fs-title)
- [ ] 2-2. `SubTitle` コンポーネント: 14px → var(--fs-subtitle)
- [ ] 2-3. `GameButton` コンポーネント: 12px → var(--fs-button)
- [ ] 2-4. `PanelBox` / パネル内テキスト: 10px → var(--fs-panel)
- [ ] 2-5. `StatLine` / `HpBar` ラベル: 9px → var(--fs-small)
- [ ] 2-6. `BattleLog` / `CivBadge` / `AffinityBadge`: 8px → var(--fs-tiny)
- [ ] 2-7. `SkillBtn`: 10px → var(--fs-panel)
- [ ] 2-8. 各コンポーネント内のインラインフォントサイズを CSS 変数に置換
- [ ] 2-9. カラーハードコード値を CSS 変数に段階的に置換
- [ ] 2-10. ビルド確認 (`npm run build`)

## Phase 3: スプライト拡大

- [ ] 3-1. `sprites.ts` の `drawPlayer` デフォルト scale を 2 → 3 に変更
- [ ] 3-2. `sprites.ts` の `drawEnemy` デフォルト scale を 2 → 3 に変更
- [ ] 3-3. `PlayerPanel.tsx` の Canvas サイズを更新 (40×55 → 54×72)
- [ ] 3-4. `EnemyPanel.tsx` の Canvas サイズを更新 (通常 34→52, ボス 52→76)
- [ ] 3-5. `AllyList.tsx` の Canvas サイズを更新 (24×32 → 36×48)
- [ ] 3-6. `TitleScreen.tsx` のロゴ Canvas スケールを更新
- [ ] 3-7. `EventScreen.tsx` のプレイヤー Canvas サイズを更新
- [ ] 3-8. Canvas 描画関数の座標系検証
  - `drawDmgPopup`: popup.fs、ポップアップ座標がスケールに追従するか
  - `drawEnemyHpBar`: Y 座標・バー幅がスケールに追従するか
  - `drawBurnFx`: 軌道半径・パーティクルサイズがスケールに追従するか
  - `drawTitle`: Canvas 内部の描画座標全般
  - `drawAlly`: 装飾位置
- [ ] 3-9. `image-rendering` のブラウザ互換性対応
  - `image-rendering: pixelated` + `-webkit-optimize-contrast` フォールバック
- [ ] 3-10. ビルド確認 (`npm run build`)

## Phase 3b: スプライト品質向上（※別 PR 推奨）

- [ ] 3b-1. プレイヤースプライトに文明別装飾パーツを追加
- [ ] 3b-2. ボススプライトにディテール追加（影、ハイライト）

## Phase 4: 個別画面レイアウト調整

- [ ] 4-1. `BattleScreen` レイアウト調整（パディング拡大）
- [ ] 4-2. `BattleLog` の max-height を GameShell 高さに連動（`calc(var(--game-height, 960px) * 0.22)`）
- [ ] 4-3. `SkillPanel` / `SkillBtn` のサイズ拡大
- [ ] 4-4. `EvolutionScreen` / `EvoCard` のパディング・フォント調整
- [ ] 4-5. `TitleScreen` のボタン・ロゴ配置調整
- [ ] 4-6. `EventScreen` / `EventCard` / `EventChoices` の調整
- [ ] 4-7. `HowToPlayScreen` のフォント・余白調整
- [ ] 4-8. `GameOverScreen` の調整
- [ ] 4-9. `AchievementScreen` / `StatsScreen` / `TreeScreen` の調整
- [ ] 4-10. `DifficultyScreen` / `BiomeSelectScreen` の調整
- [ ] 4-11. `AwakeningScreen` / `AllyReviveScreen` / その他画面の調整
- [ ] 4-12. 天候パーティクルのアニメーション距離を `--game-height` に連動
  - `snowfall`: 720px → var(--game-height, 960px) 対応
  - `ember`: 740px → var(--game-height, 960px) 対応
  - `spore`: 同様に動的対応
  - CSS 変数が `@keyframes` 内で使えない場合は JS で実寸取得
- [ ] 4-13. `prefers-reduced-motion: reduce` 対応
  - 無効化: titleGlow, snowfall, ember, spore, rareGlow, pulse, pausePulse, skillPulse, fadeInUp
  - 維持: flashHit, flashDmg, flashHeal, popupFloat（ゲームフィードバック）
  - 短縮: shake (0.3s → 0.1s)
- [ ] 4-14. ビルド確認 (`npm run build`)

## Phase 5: テスト・最終確認

- [ ] 5-1. 既存テストの修正（Canvas サイズ変更に伴うモック更新）
- [ ] 5-2. `npm test` 全テストパス確認
- [ ] 5-3. `npm run lint` パス確認
- [ ] 5-4. `npm run typecheck` パス確認
- [ ] 5-5. PC (1920×1080) での目視確認
- [ ] 5-6. モバイル (375×667) での目視確認
- [ ] 5-7. タブレット縦向き (768×1024) での目視確認
- [ ] 5-8. タブレット横向き (1024×768) での目視確認
- [ ] 5-9. `prefers-reduced-motion: reduce` でのアニメーション抑制確認
- [ ] 5-10. 全画面でのプレイテスト（バトル、進化、イベント通し）
- [ ] 5-11. Playwright スクリーンショット比較（Visual Regression Testing）の導入検討
  - 13画面 × 3デバイスの手動確認漏れ防止
