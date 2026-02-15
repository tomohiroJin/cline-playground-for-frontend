# IPNE ブラッシュアップ — 実装計画

## 概要

IPNE（ローグライク迷路アクションゲーム）は MVP6 まで機能実装済みだが、グラフィックスは単色の幾何学図形（矩形・円）による仮描画のままである。本計画では以下を実装し、ゲームの没入感と完成度を大幅に向上させる。

- 8bit 風ドット絵への切り替え
- 各種ビジュアルエフェクト・効果音の追加
- 死亡アニメーション演出

## 設計方針

- **コードスプライト方式**: 外部画像ファイルではなく、TypeScript 内で ImageData を定義
- **既存アーキテクチャ尊重**: presentation 層にスプライト・エフェクトモジュールを新設
- **段階的移行**: 各フェーズ完了時に動作確認可能な状態を維持
- **パフォーマンス考慮**: スプライトキャッシュ、必要最小限の再描画

---

## フェーズ構成

### フェーズ 0: 基盤整備（スプライトシステム）

**目標**: スプライト定義・レンダリングの基盤モジュールを作成

**新規ファイル**:
- `src/features/ipne/presentation/sprites/index.ts` — barrel export
- `src/features/ipne/presentation/sprites/spriteData.ts` — ピクセルデータ定義（2D 配列 → ImageData 変換）
- `src/features/ipne/presentation/sprites/spriteRenderer.ts` — SpriteRenderer クラス（キャッシュ付き描画 API）
- `src/features/ipne/presentation/sprites/spriteSheet.ts` — スプライトシート定義（アニメーションフレーム管理）

**実装内容**:
1. `createSprite(pixelData: number[][], palette: string[]): ImageData` ユーティリティ
2. `SpriteRenderer` クラス:
   - `drawSprite(ctx, sprite, x, y, scale)` — 単一スプライト描画
   - `drawAnimatedSprite(ctx, sheet, frame, x, y, scale)` — アニメーション描画
   - 内部キャッシュ: `Map<string, OffscreenCanvas>` でスケール別にキャッシュ
3. `SpriteSheet` 型定義: `{ frames: ImageData[], frameDuration: number }`

**変更ファイル**:
- `src/features/ipne/presentation/config.ts` — スプライト参照定数を追加

---

### フェーズ 1: ドット絵アセット作成

**目標**: 全ゲームオブジェクトのドット絵スプライトを定義

**スプライト一覧**:

| カテゴリ | スプライト | サイズ | フレーム数 | 備考 |
|---------|----------|--------|-----------|------|
| タイル | 床 | 16×16 | 1 | 暗いグレー石畳 |
| タイル | 壁 | 16×16 | 1 | 灰色レンガ |
| タイル | ゴール | 16×16 | 2 | 緑の光る階段（点滅） |
| タイル | スタート | 16×16 | 1 | 青い光るタイル |
| プレイヤー | 戦士（4方向） | 16×16 | 4×3 | idle/walk 各方向 |
| プレイヤー | 盗賊（4方向） | 16×16 | 4×3 | idle/walk 各方向 |
| 敵 | patrol | 16×16 | 2 | 紫色のスライム |
| 敵 | charge | 16×16 | 2 | 赤い突進獣 |
| 敵 | ranged | 16×16 | 2 | オレンジの射手 |
| 敵 | specimen | 16×16 | 2 | 紺色の標本 |
| 敵 | boss | 24×24 | 4 | 大型ボス（4フレームアニメ） |
| アイテム | health_small | 8×8 | 1 | 緑ポーション |
| アイテム | health_large | 8×8 | 1 | 赤ポーション |
| アイテム | health_full | 8×8 | 2 | 金色ポーション（キラキラ） |
| アイテム | level_up | 8×8 | 2 | ピンク星（点滅） |
| アイテム | map_reveal | 8×8 | 1 | 茶色巻物 |
| アイテム | key | 8×8 | 2 | 金色鍵（キラキラ） |
| 罠 | damage | 16×16 | 2 | 赤いトゲ |
| 罠 | slow | 16×16 | 2 | 青い蜘蛛の巣 |
| 罠 | teleport | 16×16 | 2 | 紫の渦巻き |
| 壁 | breakable（3状態） | 16×16 | 1×3 | intact/damaged/broken |
| 壁 | passable | 16×16 | 1 | 半透明壁 |
| 壁 | invisible | 16×16 | 1 | 紫の壁 |
| エフェクト | 攻撃斬撃 | 16×16 | 3 | 白い斬撃アニメ |

**新規ファイル**:
- `src/features/ipne/presentation/sprites/tileSprites.ts` — タイルスプライト
- `src/features/ipne/presentation/sprites/playerSprites.ts` — プレイヤースプライト
- `src/features/ipne/presentation/sprites/enemySprites.ts` — 敵スプライト
- `src/features/ipne/presentation/sprites/itemSprites.ts` — アイテムスプライト
- `src/features/ipne/presentation/sprites/trapSprites.ts` — 罠スプライト
- `src/features/ipne/presentation/sprites/wallSprites.ts` — 特殊壁スプライト
- `src/features/ipne/presentation/sprites/effectSprites.ts` — エフェクトスプライト

---

### フェーズ 2: Canvas 描画切り替え

**目標**: Game.tsx の図形描画をスプライト描画に置き換え

**変更ファイル**:
- `src/features/ipne/presentation/screens/Game.tsx`
- `src/features/ipne/presentation/config.ts`

**実装内容**:
1. `SpriteRenderer` インスタンスを Game コンポーネント内で生成（`useMemo`）
2. マップタイル描画: `fillRect` → `renderer.drawSprite(tileSprite, ...)`
3. 敵描画: `arc` → `renderer.drawAnimatedSprite(enemySheet, ...)`
4. プレイヤー描画: `arc + 三角` → `renderer.drawAnimatedSprite(playerSheet, ...)`
5. アイテム描画: `fillRect` → `renderer.drawSprite(itemSprite, ...)`
6. 罠描画: 幾何学図形 → `renderer.drawAnimatedSprite(trapSheet, ...)`
7. 特殊壁描画: 幾何学図形 → `renderer.drawSprite(wallSprite, ...)`
8. 攻撃エフェクト: 白枠 → 斬撃アニメーション

**互換性**:
- CONFIG の色定数は残す（自動マップ・デバッグ表示で継続使用）
- フォールバック不要（一括切り替え）

---

### フェーズ 3: エフェクトシステム拡張

**目標**: 視覚エフェクトの統一管理システムを構築

**新規ファイル**:
- `src/features/ipne/presentation/effects/index.ts` — barrel export
- `src/features/ipne/presentation/effects/effectManager.ts` — エフェクトマネージャー
- `src/features/ipne/presentation/effects/particleSystem.ts` — パーティクルシステム
- `src/features/ipne/presentation/effects/effectTypes.ts` — エフェクト型定義

**実装内容**:
1. `EffectManager` クラス:
   - `addEffect(type, x, y, params)` — エフェクト追加
   - `update(deltaTime)` — 全エフェクト更新
   - `draw(ctx, viewport)` — 全エフェクト描画
   - `clear()` — 全クリア
2. パーティクル型エフェクト:
   - 攻撃ヒット: 白い火花パーティクル（8 個、放射状に飛散）
   - ダメージ: 赤い粒子が飛び散る
   - 罠発動: タイプ別パーティクル（赤トゲ / 青霧 / 紫渦）
   - アイテム取得: 上昇するキラキラパーティクル
   - レベルアップ: 黄色リングが拡大→消滅
   - ボス撃破: 大規模爆発パーティクル（24 個）
3. 既存の `feedback.ts` との統合:
   - `drawPopup` は引き続き使用（テキスト表示）
   - パーティクルを `EffectManager` 側で追加管理

**変更ファイル**:
- `src/features/ipne/presentation/screens/Game.tsx` — エフェクト描画統合
- `src/features/ipne/feedback.ts` — FeedbackType 拡張（BOSS_KILL, SPEED_BOOST 追加）
- `src/features/ipne/types.ts` — FeedbackType に新タイプ追加

---

### フェーズ 4: 移動スピードエフェクト

**目標**: 高速移動時の視覚演出

**しきい値**: `moveSpeed >= 5.2`（盗賊 Lv3 以上、戦士は移動速度特化時）

**実装内容**:
1. **残像エフェクト**:
   - 過去 3 フレームのプレイヤー位置を記録
   - 半透明（alpha: 0.5 → 0.3 → 0.1）でスプライト描画
2. **スピードライン**:
   - 移動方向と逆方向に細い白線を 4 本描画
   - 長さはスピードに比例（5～15px）

**変更ファイル**:
- `src/features/ipne/movement.ts` — `SPEED_EFFECT_THRESHOLD = 5.2` 定数追加
- `src/features/ipne/presentation/effects/speedEffect.ts` — **新規** スピードエフェクト
- `src/features/ipne/presentation/screens/Game.tsx` — スピードエフェクト描画統合

---

### フェーズ 5: 死亡エフェクト・遅延遷移

**目標**: HP 0 時に即時ゲームオーバー画面遷移ではなく、1.5 秒の死亡アニメーションを挟む

**実装内容**:
1. `ScreenState.DYING` を追加（`'dying'`）
2. 死亡アニメーション（1.5 秒間）:
   - 0.0～0.5 秒: プレイヤー点滅（100ms 間隔）
   - 0.5～1.0 秒: プレイヤースプライトが徐々に赤く変色
   - 1.0～1.5 秒: パーティクルに分解（スプライトのピクセルが飛散）
3. 画面遷移の遅延:
   - `useGameLoop` のゲームオーバー処理を変更
   - `DYING` 状態中は敵 AI・アイテム取得を停止
   - 1.5 秒後に `GAME_OVER` に遷移

**変更ファイル**:
- `src/features/ipne/types.ts` — `ScreenState.DYING` 追加
- `src/features/ipne/presentation/hooks/useGameLoop.ts` — 死亡遅延ロジック
- `src/features/ipne/presentation/screens/Game.tsx` — 死亡アニメーション描画
- `src/features/ipne/presentation/effects/deathEffect.ts` — **新規** 死亡エフェクト

---

### フェーズ 6: 効果音追加

**目標**: 12 種の新規効果音を追加

**新規効果音**:

| 効果音 | 種別 | 波形 | 備考 |
|--------|------|------|------|
| MOVE_STEP | 単音 | sine | 軽い足音（ピッ） |
| WALL_BUMP | 単音 | noise | 壁衝突（ドン） |
| ATTACK_SWING | 単音 | square | 攻撃振り（シュッ） |
| ATTACK_MISS | 単音 | noise | 空振り（スカッ） |
| ENEMY_DAMAGE | 単音 | sawtooth | 敵ダメージ（ビシッ） |
| DODGE | 単音 | sine | 回避（ヒュン） |
| KEY_PICKUP | メロディ | sine | 鍵取得（3音上昇） |
| DOOR_OPEN | 単音 | sine | 扉開放（ガチャ） |
| SPEED_BOOST | 単音 | sine | 速度上昇（シュイーン） |
| WALL_BREAK | 単音 | noise | 壁破壊（ガシャン） |
| TELEPORT | 単音 | sine | テレポート（ワープ音） |
| DYING | メロディ | sawtooth | 死亡（下降メロディ） |

**変更ファイル**:
- `src/features/ipne/types.ts` — `SoundEffectType` に 12 種追加
- `src/features/ipne/audio/soundEffect.ts` — 新規効果音の設定・メロディ追加
- `src/features/ipne/presentation/hooks/useGameLoop.ts` — 新効果音のディスパッチ
- `src/features/ipne/presentation/screens/Game.tsx` — 移動・攻撃時の効果音トリガー

---

## 並列実行戦略

```
ストリーム A（グラフィックス）: Phase 0 → Phase 1 → Phase 2
ストリーム B（エフェクト）:     Phase 0 → Phase 3 → Phase 4 + Phase 5（並列可）
ストリーム C（サウンド）:       Phase 6（独立、いつでも開始可能）
```

**依存関係**:
- Phase 1, 3 は Phase 0 の完了が前提
- Phase 2 は Phase 1 の完了が前提
- Phase 4, 5 は Phase 3 の完了が前提（エフェクトマネージャー使用）
- Phase 6 は独立（既存の soundEffect.ts を拡張するだけ）

---

## バグ修正

### BF-01: getWallSprite の revealed 状態未処理（2026-02-15）

**問題**: 破壊可能壁が `revealed`（発見済み）状態になると `getWallSprite` がエラーをスローしてゲームがクラッシュする。

**原因**: `wallSprites.ts` の `getWallSprite()` 関数は `breakable` 壁の場合に `intact`, `damaged`, `broken` の 3 状態しか処理しておらず、`WallState.REVEALED` が `default` ケースに落ちて throw される。

**修正**: `case 'revealed':` を `case 'intact':` とフォールスルーさせ、発見済み状態は無傷と同じスプライトを返すように変更。

### BF-02: スピードエフェクト視覚表現の削除（2026-02-15）

**問題**: 残像が移動方向の後方ではなく横並び・前方に表示されてしまい、スピードエフェクトとして正常に機能しない。

**修正**: スピードエフェクトの視覚表現を全面削除する。
- `speedEffect.ts` を削除
- `Game.tsx` からスピードエフェクト描画の呼び出しを除去
- `movement.ts` の `SPEED_EFFECT_THRESHOLD` 定数を削除

**残存**: SPEED_BOOST 効果音は将来別用途の可能性があるため定義を残す（`soundEffect.ts`、`SoundEffectType`）。

---

## リスク・注意事項

1. **パフォーマンス**: スプライトキャッシュが肥大化しないよう `WeakMap` またはサイズ上限を設ける
2. **Canvas サイズ**: 既存の `getCanvasSize()` でビューポートサイズが固定されている前提
3. **テスト**: スプライト描画のユニットテストは困難なため、ビルド確認 + 目視テストを主軸とする
4. **後方互換**: CONFIG の色定数は自動マップ・デバッグで使用されるため削除しない
5. **ScreenState 追加**: `DYING` 追加時に `useGameState` のスイッチ文を漏れなく更新する
