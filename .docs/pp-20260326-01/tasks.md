# 原始進化録（PRIMAL PATH）大規模改良 — チェックリスト

## Phase 1: レイアウト基盤の刷新

### 1-1. GameShell の基準サイズ変更

- [x] `styles.ts` の `GameShell` 幅を 480px → 800px に変更
- [x] `styles.ts` の `GameShell` 高さを 720px → 1200px に変更
- [x] 既存のメディアクエリ（`@media max-width: 500px`）を削除

### 1-2. レスポンシブスケーリングの実装

- [x] `useGameScale` カスタムフックを作成（`ResizeObserver` ベース）
- [x] `PrimalPathGame.tsx` にスケーリング Hook を統合
- [x] `GameShell` に `transform: scale()` + `transform-origin: top center` を適用
- [x] スケール係数の計算ロジック実装（`min(vw/800, vh/1200, 1.0)`）
- [x] 外側ラッパーの `overflow: hidden` + 動的サイズ調整

### 1-3. ビルド・基本動作確認

- [x] ビルドが通ることを確認
- [ ] デスクトップ表示の目視確認（基準サイズでの表示）

## Phase 2: フォントサイズの拡大（styled-components）

### 2-1. 大サイズフォント

- [x] `Title` のフォントサイズを 22px → 32px
- [x] `PausedOverlay` のフォントサイズを 24px → 36px
- [x] `OverlayIcon` のフォントサイズを 48px → 64px

### 2-2. 中サイズフォント

- [x] `SubTitle` のフォントサイズを 14px → 20px
- [x] `OverlayText` のフォントサイズを 16px → 22px
- [x] `SkillBtn` のフォントサイズを 14px → 20px
- [x] `GameButton` のフォントサイズを 12px → 16px

### 2-3. 小サイズフォント

- [x] `StatText` のフォントサイズを 10px → 14px
- [x] `LogContainer` のフォントサイズを 9px → 13px
- [x] `LogLine` のフォントサイズを 9px → 13px（LogContainer から継承）
- [x] `SpeedBtn` のフォントサイズを 9px → 13px
- [x] `AllyBadge` のフォントサイズを 9px → 13px
- [x] `SurrenderBtn` のフォントサイズを 8px → 12px

## Phase 2b: インラインフォントサイズの拡大（146 箇所）

※ 詳細な方針・はみ出し対策は `plan-phase2-fix.md` を参照

### 2b-1. 定数追加 + テスト

- [x] `constants/ui.ts` に `IFS` 定数マップ（xs=12, sm=14, md=16, lg=18, xl=20）を追加
- [x] `IFS` の全値が 12px 以上であるテストを作成（7件パス）

### 2b-2. styles.ts はみ出し防止 + レイアウト調整

- [x] `AllyBadge`: `min-width` 62→80px、`padding` 3px 6px→4px 8px、overflow+ellipsis 追加
- [x] `TreeNodeBox`: `min-width` 84→110px、`padding` 5px 6px→6px 8px、overflow-wrap: break-word 追加
- [x] `SkillBtn`: `min-width` 96→120px

### 2b-3. 大量修正（10+ 箇所）— フォント + はみ出し対策を同時実施

- [x] `HowToPlayScreen.tsx` — 19 箇所
- [x] `EvolutionScreen.tsx` — 11 箇所
- [x] `TreeScreen.tsx` — 7 箇所 + TreeNodeBox レイアウト確認（flex-wrap 設定済み）

### 2b-4. 中規模修正（4〜9 箇所）— フォント + はみ出し対策を同時実施

- [x] `ChallengeScreen.tsx` — 9 箇所
- [x] `GameOverScreen.tsx` — 8 箇所
- [x] `PlayerPanel.tsx` — 7 箇所 + バフ・バッジ padding 拡大
- [x] `AllyReviveScreen.tsx` — 7 箇所
- [x] `StatsScreen.tsx` — 5 箇所
- [x] `DifficultyScreen.tsx` — 5 箇所
- [x] `AchievementScreen.tsx` — 5 箇所
- [x] `BiomeSelectScreen.tsx` — 5 箇所
- [x] `TitleScreen.tsx` — 4 箇所
- [x] `AwakeningScreen.tsx` — 4 箇所
- [x] `EndlessCheckpointScreen.tsx` — 4 箇所

### 2b-5. 小規模修正（1〜3 箇所）— フォント + はみ出し対策を同時実施

- [x] `BattleScreen.tsx` — 1 箇所（12→`IFS.lg`=18px）
- [x] `EnemyPanel.tsx` — 1 箇所 + 敵名 overflow+ellipsis 対策
- [x] `PreFinalScreen.tsx` — 3 箇所
- [x] `contracts.tsx` — 2 箇所
- [x] `AllyList.tsx` — 2 箇所
- [x] `HpBar.tsx` — 1 箇所
- [x] `AffinityBadge.tsx` — 2 箇所 + padding 拡大
- [x] `CivBadge.tsx` — 1 箇所 + padding 拡大
- [x] `SynergyBadges.tsx` — 1 箇所 + padding 拡大
- [x] `StatPreview.tsx` — 2 箇所
- [x] `SpeedControl.tsx` — 1 箇所
- [x] `AwakeningBadges.tsx` — 1 箇所 + padding 拡大
- [x] `ProgressBar.tsx` — 1 箇所 + overflow+ellipsis 対策

### 2b-6. styled-components 修正（CSS-in-JS）

- [x] `EventChoices.tsx` — 5 箇所（ChoiceBtn, ChoiceLabel, ChoiceHint, CostTag, EffectHintBadge）
- [x] `EventCard.tsx` — 2 箇所（EventDesc, SituationText）

### 2b-7. 最終検証

- [x] ビルド成功確認
- [x] テスト全件パス確認（598 スイート / 7481 テスト）
- [x] `grep` でリテラル数値の fontSize が 14 未満で残存していないことを確認（0 件）
- [x] コードレビュー + リファクタリング

## Phase 3: スプライトの拡大とクォリティアップ

### 3-1. スケール係数の変更

- [x] スプライト描画のデフォルトスケール `s` を 2 → 3 に変更

### 3-2. プレイヤースプライト (`drawPlayer`)

- [x] ベースサイズを 16×22 → 24×32 に変更
- [x] Canvas サイズを `24*s × 32*s` に更新
- [x] 頭部の描画を 24px グリッドに再設計
- [x] 胴体・腕の描画を再設計
- [x] 足の描画を再設計
- [x] 武器パーツの描画を再設計・ディテール追加
- [x] 進化段階ごとの装飾パーツ調整

### 3-3. 味方スプライト (`drawAlly`)

- [x] ベースサイズを 12×16 → 18×24 に変更
- [x] Canvas サイズを `18*s × 24*s` に更新
- [x] 種族ごとのシルエット描画を再設計
- [x] 目・表情の表現追加
- [x] ボディパターン追加

### 3-4. 敵スプライト（通常） (`drawEnemy`, `big=false`)

- [x] ベースサイズを 16×16 → 24×24 に変更
- [x] Canvas サイズを `24*s × 24*s` に更新
- [x] `ENEMY_DETAILS` の座標データを 32px グリッドに再設計
- [x] `ENEMY_SMALL_DETAILS` の座標データを 24px グリッドに再設計
- [x] 敵種ごとの形状バリエーション強化

### 3-5. ボススプライト (`drawEnemy`, `big=true`)

- [x] ベースサイズを 24×24 → 32×32 に変更
- [x] Canvas サイズを `32*s × 32*s` に更新
- [x] ボス固有ディテールの再設計
- [x] 形態変化時のオーラ・模様表現追加

### 3-6. タイトルロゴ (`drawTitle`)

- [x] Canvas サイズを 240×130 → 400×200 に変更
- [x] グラデーション背景の再調整
- [x] キャラクター描画の拡大対応

### 3-7. エフェクト・パーティクル

- [x] HP バーの高さを 3px → 5px に変更
- [x] 火傷パーティクルサイズを 3-5px → 5-8px に変更
- [x] 降雪パーティクルサイズを 3px → 5px に変更

### 3-8. スプライト動作確認

- [ ] 全キャラクタースプライトの表示確認
- [ ] 進化段階ごとの表示確認
- [ ] ボス全形態の表示確認
- [ ] パーティクルエフェクトの動作確認

## Phase 4: UI コンポーネントの調整

### 4-1. パネルサイズ調整

- [x] `EnemyPanel` の通常敵表示枠を 34×34 → 80×80px に変更
- [x] `EnemyPanel` のボス表示枠を 52×52 → 104×104px に変更
- [x] ステータスパネルのサイズ調整

### 4-2. ボタンサイズ調整

- [x] `GameButton` のパディング調整（8px 18px → 10px 20px）
- [x] `SkillBtn` のパディング調整（10px 16px → 8px 14px）
- [x] `SpeedBtn` のパディング調整（1px 6px → 4px 10px）
- [x] `SurrenderBtn` のパディング調整（1px 6px → 4px 12px）
- [ ] モバイルでのタップ領域が最低 44px 確保されていることを確認

### 4-3. ログ・タブ UI 調整

- [x] ログ領域の `line-height` を 1.4 に設定
- [x] タブの `min-height` を 36px に設定
- [x] タブフォントサイズを 14px に調整

### 4-4. バトル画面レイアウト調整

- [x] キャラクター配置位置の調整（画面拡大に伴う再配置）
- [x] スキルバーの位置・サイズ調整
- [x] 情報パネルのレイアウト調整

### 4-5. UI 動作確認

- [ ] 全画面遷移のレイアウト確認
- [ ] ボタン操作の動作確認
- [ ] スクロール・オーバーフローの確認

## Phase 5: テスト・最終確認

### 5-1. 自動テスト

- [x] 既存テストの修正（サイズ変更に伴う sprites.test.ts の HP バー高さ更新）
- [x] テスト全件パス確認（597 スイート / 7474 テスト）

### 5-2. マルチデバイス確認

- [ ] PC 大画面（1920×1080）での表示確認
- [ ] PC 小画面（1366×768）での表示確認
- [ ] タブレット（768×1024）での表示確認
- [ ] モバイル（375×667 / iPhone SE 相当）での表示確認
- [ ] モバイル（390×844 / iPhone 14 相当）での表示確認

### 5-3. 機能確認

- [ ] ゲーム開始〜バトル〜進化の一連フロー動作確認
- [ ] セーブ・ロードの動作確認（既存データとの互換性）
- [ ] 音声の動作確認
- [ ] パフォーマンス確認（フレームレート劣化がないか）

### 5-4. 最終仕上げ

- [x] コードの整理・不要なコメント除去
- [x] ビルド成功確認
- [ ] PR 作成
