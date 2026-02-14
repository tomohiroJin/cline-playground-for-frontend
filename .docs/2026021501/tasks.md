# IPNE ブラッシュアップ — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- 括弧内はストリーム: `[A]` グラフィックス, `[B]` エフェクト, `[C]` サウンド

---

## フェーズ 0: 基盤整備（スプライトシステム）

> 前提: なし | ストリーム: A, B 共通

- [x] **T-00.1** `[A/B]` `sprites/` ディレクトリ作成、barrel export（`index.ts`）
- [x] **T-00.2** `[A/B]` `spriteData.ts` 実装 — `createSprite(pixels, palette)` で ImageData 生成
- [x] **T-00.3** `[A/B]` `spriteRenderer.ts` 実装 — `SpriteRenderer` クラス（`drawSprite`, `drawAnimatedSprite`, `drawSpriteWithAlpha`, キャッシュ管理）
- [x] **T-00.4** `[A/B]` `spriteSheet.ts` 実装 — `SpriteSheetDefinition` 型、フレーム計算ヘルパー
- [x] **T-00.5** `[A/B]` ユニットテスト: `createSprite` のピクセルデータ→ImageData 変換テスト

---

## フェーズ 1: ドット絵アセット作成

> 前提: フェーズ 0 完了 | ストリーム: A

- [ ] **T-01.1** `[A]` `tileSprites.ts` — 床・壁・ゴール・スタートのスプライト定義
- [ ] **T-01.2** `[A]` `playerSprites.ts` — 戦士スプライト（4 方向 × 3 フレーム = 12 スプライト）
- [ ] **T-01.3** `[A]` `playerSprites.ts` — 盗賊スプライト（4 方向 × 3 フレーム = 12 スプライト）
- [ ] **T-01.4** `[A]` `enemySprites.ts` — patrol, charge, ranged, specimen スプライト（各 2 フレーム）
- [ ] **T-01.5** `[A]` `enemySprites.ts` — boss スプライト（24×24, 4 フレーム）
- [ ] **T-01.6** `[A]` `itemSprites.ts` — 全 6 種アイテムスプライト
- [ ] **T-01.7** `[A]` `trapSprites.ts` — damage, slow, teleport 罠スプライト（各 2 フレーム）
- [ ] **T-01.8** `[A]` `wallSprites.ts` — breakable（3 状態）, passable, invisible 壁スプライト
- [ ] **T-01.9** `[A]` `effectSprites.ts` — 攻撃斬撃スプライト（3 フレーム）

---

## フェーズ 2: Canvas 描画切り替え

> 前提: フェーズ 1 完了 | ストリーム: A

- [ ] **T-02.1** `[A]` Game.tsx に `SpriteRenderer` インスタンス生成（`useMemo`）
- [ ] **T-02.2** `[A]` マップタイル描画を `fillRect` → `drawSprite` に置換
- [ ] **T-02.3** `[A]` 敵描画を `arc` → `drawAnimatedSprite` に置換
- [ ] **T-02.4** `[A]` プレイヤー描画を `arc + 三角` → `drawAnimatedSprite` に置換（方向・移動状態でフレーム選択）
- [ ] **T-02.5** `[A]` アイテム描画を `fillRect` → `drawSprite` に置換
- [ ] **T-02.6** `[A]` 罠描画を幾何学図形 → `drawAnimatedSprite` に置換
- [ ] **T-02.7** `[A]` 特殊壁描画を幾何学図形 → `drawSprite` に置換
- [ ] **T-02.8** `[A]` 攻撃エフェクトを白枠 → 斬撃アニメーションに置換
- [ ] **T-02.9** `[A]` `config.ts` にスプライト参照定数を追加（色定数は維持）
- [ ] **T-02.10** `[A]` 目視テスト: 全タイル・キャラクター・アイテムが正しく描画されることを確認

---

## フェーズ 3: エフェクトシステム拡張

> 前提: フェーズ 0 完了 | ストリーム: B

- [ ] **T-03.1** `[B]` `effects/` ディレクトリ作成、barrel export（`index.ts`）
- [ ] **T-03.2** `[B]` `effectTypes.ts` — `EffectType`, `GameEffect`, `Particle` 型定義
- [ ] **T-03.3** `[B]` `particleSystem.ts` — パーティクル生成・更新・描画ロジック
- [ ] **T-03.4** `[B]` `effectManager.ts` — `EffectManager` クラス（`addEffect`, `update`, `draw`, `clear`）
- [ ] **T-03.5** `[B]` 攻撃ヒットエフェクト実装（白い火花 × 8 個 + 斬撃アニメ）
- [ ] **T-03.6** `[B]` ダメージエフェクト実装（赤い粒子 × 6 個）
- [ ] **T-03.7** `[B]` 罠発動エフェクト実装（damage/slow/teleport 各種）
- [ ] **T-03.8** `[B]` アイテム取得エフェクト実装（キラキラ × 6 個）
- [ ] **T-03.9** `[B]` レベルアップエフェクト実装（黄色リング + キラキラ × 12 個）
- [ ] **T-03.10** `[B]` ボス撃破エフェクト実装（大規模爆発 × 24 個 + 画面フラッシュ）
- [ ] **T-03.11** `[B]` Game.tsx にエフェクト描画統合（描画ループに `effectManager.draw()` 追加）
- [ ] **T-03.12** `[B]` `feedback.ts` に FeedbackType.BOSS_KILL, SPEED_BOOST 追加
- [ ] **T-03.13** `[B]` ユニットテスト: EffectManager のライフサイクルテスト

---

## フェーズ 4: 移動スピードエフェクト

> 前提: フェーズ 3 完了 | ストリーム: B

- [ ] **T-04.1** `[B]` `movement.ts` に `SPEED_EFFECT_THRESHOLD = 5.2` 定数追加
- [ ] **T-04.2** `[B]` `effects/speedEffect.ts` — 残像管理（過去 3 フレーム位置保持）
- [ ] **T-04.3** `[B]` `effects/speedEffect.ts` — スピードライン描画（4 本、移動逆方向）
- [ ] **T-04.4** `[B]` Game.tsx にスピードエフェクト描画統合
- [ ] **T-04.5** `[B]` 目視テスト: 盗賊 Lv3 以上で残像・スピードラインが表示されることを確認

---

## フェーズ 5: 死亡エフェクト・遅延遷移

> 前提: フェーズ 3 完了 | ストリーム: B（フェーズ 4 と並列可能）

- [ ] **T-05.1** `[B]` `types.ts` に `ScreenState.DYING = 'dying'` 追加
- [ ] **T-05.2** `[B]` `effects/deathEffect.ts` — 死亡アニメーション管理クラス
- [ ] **T-05.3** `[B]` 死亡フェーズ 1 実装: 点滅（0.0～0.5 秒）
- [ ] **T-05.4** `[B]` 死亡フェーズ 2 実装: 赤変色（0.5～1.0 秒）
- [ ] **T-05.5** `[B]` 死亡フェーズ 3 実装: パーティクル分解（1.0～1.5 秒）
- [ ] **T-05.6** `[B]` `useGameLoop.ts` — GAME_OVER → DYING 遷移変更、1.5 秒後に GAME_OVER 遷移
- [ ] **T-05.7** `[B]` Game.tsx — DYING 状態中の描画処理（死亡アニメーション表示）
- [ ] **T-05.8** `[B]` 目視テスト: HP 0 で 1.5 秒のアニメーション後にゲームオーバー画面に遷移することを確認

---

## フェーズ 6: 効果音追加

> 前提: なし（独立） | ストリーム: C

- [x] **T-06.1** `[C]` `types.ts` に `SoundEffectType` 12 種追加
- [x] **T-06.2** `[C]` `soundEffect.ts` — MOVE_STEP, WALL_BUMP 効果音設定追加
- [x] **T-06.3** `[C]` `soundEffect.ts` — ATTACK_SWING, ATTACK_MISS 効果音設定追加
- [x] **T-06.4** `[C]` `soundEffect.ts` — ENEMY_DAMAGE, DODGE 効果音設定追加
- [x] **T-06.5** `[C]` `soundEffect.ts` — KEY_PICKUP メロディ追加（3 音上昇）
- [x] **T-06.6** `[C]` `soundEffect.ts` — DOOR_OPEN, SPEED_BOOST 効果音設定追加
- [x] **T-06.7** `[C]` `soundEffect.ts` — WALL_BREAK, TELEPORT 効果音設定追加
- [x] **T-06.8** `[C]` `soundEffect.ts` — DYING メロディ追加（下降メロディ）
- [x] **T-06.9** `[C]` `soundEffect.ts` — 便利関数 12 種追加（`playMoveStepSound` 等）
- [x] **T-06.10** `[C]` Game.tsx — 移動成功/失敗時の効果音トリガー追加
- [x] **T-06.11** `[C]` `useGameLoop.ts` — 新効果音のディスパッチ追加
- [ ] **T-06.12** `[C]` 目視テスト: 全 12 種の効果音が適切なタイミングで鳴ることを確認

---

## 最終検証

- [ ] **T-99.1** `npm run build` 成功確認
- [ ] **T-99.2** `npm test` 全テストパス確認
- [ ] **T-99.3** `npm run dev` で全機能統合動作確認
- [ ] **T-99.4** パフォーマンス確認（Canvas 描画が 16ms/frame 以内）

---

## サマリー

| フェーズ | タスク数 | ストリーム | 前提条件 |
|---------|---------|-----------|---------|
| Phase 0 | 5 | A/B 共通 | — |
| Phase 1 | 9 | A | Phase 0 |
| Phase 2 | 10 | A | Phase 1 |
| Phase 3 | 13 | B | Phase 0 |
| Phase 4 | 5 | B | Phase 3 |
| Phase 5 | 8 | B | Phase 3 |
| Phase 6 | 12 | C | — |
| 最終検証 | 4 | — | 全フェーズ |
| **合計** | **66** | — | — |
