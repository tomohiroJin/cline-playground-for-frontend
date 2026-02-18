# IPNE ゲームブラッシュアップ — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- **I**: Implementation（実装タスク）
- **V**: Verification（検証タスク）

---

## 要件1: STAGE表示の重なり修正

> 変更規模: 小 | 依存: なし

### 実装タスク

- [x] **I-1.1** `src/pages/IpnePage.styles.ts` の `StageIndicator` を修正
  - `right: 1rem` を削除
  - `top: 3rem; left: 50%; transform: translateX(-50%)` に変更
  - モバイル対応の `@media` クエリを追加（`top: 2.5rem`）

### 検証タスク

- [ ] **V-1.1** デスクトップ表示でSTAGE表示がタイマー直下の中央に表示されること
- [ ] **V-1.2** モバイル表示（480px以下）でSTAGE表示が適切な位置に表示されること
- [ ] **V-1.3** STAGE表示がマップ切替ボタン・ヘルプボタンと重ならないこと
- [ ] **V-1.4** STAGE表示がタイマーと重ならないこと

---

## 要件5: 最終ボス攻撃力低減

> 変更規模: 小 | 依存: なし

### 実装タスク

- [x] **I-5.1** `src/features/ipne/enemy.ts` の `ENEMY_CONFIGS[MEGA_BOSS].damage` を `6` → `4` に変更
- [x] **I-5.2** `src/features/ipne/stageConfig.ts` の `STAGE_5.scaling.damage` を `2.0` → `1.8` に変更

### 検証タスク

- [x] **V-5.1** `ENEMY_CONFIGS[MEGA_BOSS].damage` が `4` であること
- [x] **V-5.2** `STAGE_5.scaling.damage` が `1.8` であること
- [x] **V-5.3** 既存の enemy テストが通ること（`npm test -- --testPathPattern=enemy`）
- [ ] **V-5.4** Stage5メガボスの実効ダメージが 7（4 × 1.8 = 7.2 → 切り捨て7）であることをプレイテストで確認

---

## 要件3: ステージ別レベル上限（3レベルずつ拡張）

> 変更規模: 中 | 依存: なし（要件5と並行可能）
> 注: 当初仕様から修正。レベル上限は10→13→16→19→22（1ステージあたり3レベルずつ拡張）

### 実装タスク

- [x] **I-3.1** `src/features/ipne/stageConfig.ts` の各ステージ `maxLevel` を変更
  - STAGE_1: `maxLevel: 10`
  - STAGE_2: `maxLevel: 13`
  - STAGE_3: `maxLevel: 16`
  - STAGE_4: `maxLevel: 19`
  - STAGE_5: `maxLevel: 22`
- [x] **I-3.2** `src/features/ipne/progression.ts` の `MAX_LEVEL` を `22` に変更し、`KILL_COUNT_TABLE` を全面改訂
  ```
  ステージ1: 1:0, 2:1, 3:2, 4:4, 5:6, 6:8, 7:10, 8:13, 9:16, 10:20
  ステージ2: 11:25, 12:31, 13:38
  ステージ3: 14:46, 15:55, 16:65
  ステージ4: 17:76, 18:88, 19:101
  ステージ5: 20:116, 21:132, 22:150
  ```
- [x] **I-3.3** `src/features/ipne/__tests__/progression.test.ts` を新しいテーブルに合わせて更新
  - `KILL_COUNT_TABLE` の全22レベル分のテストケースを更新
  - `getKillCountForLevel` のテストケースを更新
  - `getLevelFromKillCount` のテストケースを更新
  - `shouldLevelUp` のテストケースを更新
  - `getNextKillsRequired` のテストケースを更新
- [x] **I-3.4** `src/features/ipne/__tests__/stageConfig.test.ts` の `maxLevel` 期待値を更新
- [x] **I-3.5** `src/features/ipne/__tests__/player.test.ts` のレベルアップ条件テストを更新

### 検証タスク

- [x] **V-3.1** progression テストが全て通ること（`npm test -- --testPathPattern=progression`）
- [x] **V-3.2** stageConfig テストが全て通ること（`npm test -- --testPathPattern=stageConfig`）
- [x] **V-3.3** player テストが全て通ること（`npm test -- --testPathPattern=player`）
- [x] **V-3.4** TypeScript コンパイルが通ること（`npx tsc --noEmit`）
- [ ] **V-3.5** Stage1でLv1→Lv10のレベルアップが発生すること（プレイテスト）
- [ ] **V-3.6** Stage2でLv11→Lv13のレベルアップが発生すること（プレイテスト）
- [ ] **V-3.7** 各ステージのmaxLevelを超えてレベルアップしないこと

---

## 要件4: 時間ベースHP回復（リジェネ）

> 変更規模: 中 | 依存: 要件3/5完了後に調整が望ましい

### 実装タスク

- [x] **I-4.1** `src/features/ipne/types.ts` の `Player` インターフェースに `lastRegenAt: number` を追加
- [x] **I-4.2** `src/features/ipne/player.ts` の `createPlayer` に `lastRegenAt: 0` を追加
- [x] **I-4.3** `src/features/ipne/presentation/hooks/useGameState.ts` のステージ引き継ぎ時に `lastRegenAt: 0` をリセット
- [x] **I-4.4** `src/features/ipne/application/engine/tickGameState.ts` にリジェネ定数を追加
  - `BASE_REGEN_INTERVAL = 8000`
  - `REGEN_REDUCTION_PER_BONUS = 800`
  - `MIN_REGEN_INTERVAL = 3000`
  - `REGEN_AMOUNT = 1`
- [x] **I-4.5** `src/features/ipne/application/engine/tickGameState.ts` の `tickGameState` 関数にリジェネ処理を追加
  - アイテム拾得処理の後、罠処理の前に配置
  - HP上限チェック、間隔チェック、`lastRegenAt` 更新

### 検証タスク

- [x] **V-4.1** 既存の tickGameState テストが通ること（`npm test -- --testPathPattern=tickGameState`）
- [x] **V-4.2** TypeScript コンパイルが通ること
- [ ] **V-4.3** プレイテストで8秒間隔のHP回復を確認
- [ ] **V-4.4** healBonusを上げた状態でリジェネ間隔が短くなることを確認

---

## 要件6: ステージ別壁/床カラー

> 変更規模: 中 | 依存: なし（他の要件と並行可能）

### 実装タスク

- [x] **I-6.1** `src/features/ipne/presentation/sprites/tileSprites.ts` にステージ別パレット定数を追加
  - Stage1: 茶色系
  - Stage2: 灰色系（デフォルト）
  - Stage3: 青緑系
  - Stage4: 紫系
  - Stage5: 深紅/黒系
- [x] **I-6.2** `src/features/ipne/presentation/sprites/tileSprites.ts` に取得関数を追加
  - `getStageFloorSprite(stage: StageNumber): SpriteDefinition`
  - `getStageWallSprite(stage: StageNumber): SpriteDefinition`
- [x] **I-6.3** `src/features/ipne/presentation/sprites/index.ts` に新関数のエクスポートを追加
- [x] **I-6.4** `src/features/ipne/presentation/screens/Game.tsx` のタイル描画処理を修正
  - `FLOOR_SPRITE` → `getStageFloorSprite(currentStage)` に置き換え
  - `WALL_SPRITE` → `getStageWallSprite(currentStage)` に置き換え
  - スプライト生成をタイル描画ループ外に移動（パフォーマンス最適化）
- [x] **I-6.5** 既存の `FLOOR_SPRITE` / `WALL_SPRITE` のエクスポートは後方互換のため維持

### 検証タスク

- [x] **V-6.1** TypeScript コンパイルが通ること
- [x] **V-6.2** 既存の spriteData テストが通ること（`npm test -- --testPathPattern=spriteData`）
- [ ] **V-6.3** Stage1: 茶色い土のダンジョンに見えること（目視確認）
- [ ] **V-6.4** Stage2: 灰色の石のダンジョン（変更前と同じ）に見えること（目視確認）
- [ ] **V-6.5** Stage3: 青緑の神秘的なダンジョンに見えること（目視確認）
- [ ] **V-6.6** Stage4: 紫の不気味なダンジョンに見えること（目視確認）
- [ ] **V-6.7** Stage5: 深紅/黒の最終ステージ感があること（目視確認）
- [ ] **V-6.8** 全ステージで壁/床の区別が明確に見えること（コントラスト確認）
- [ ] **V-6.9** プレイヤー・敵・アイテムが壁/床の上で視認可能なこと

---

## 要件2: 主人公スプライト改善

> 変更規模: 大 | 依存: なし（最後に実装推奨）

### 実装タスク

- [x] **I-2.1** `src/features/ipne/presentation/sprites/playerSprites.ts` の `createSheet` 関数内 `frameDuration` を `200` → `150` に変更
- [x] **I-2.2** 戦士・下向き歩行フレーム（`warriorDownWalk1`, `warriorDownWalk2`）を修正
  - 足の移動幅を2pxに拡大（row 13-15）
  - 腕振りを追加（row 6-9 の端列）
  - walk2にボビング効果を適用（全体1px上シフト）
- [x] **I-2.3** 戦士・上向き歩行フレーム（`warriorUpWalk1`, `warriorUpWalk2`）を修正
  - 同様の変更を適用
- [x] **I-2.4** 戦士・左向き歩行フレーム（`warriorLeftWalk1`, `warriorLeftWalk2`）を修正
  - 足の移動幅拡大 + ボビング効果
- [x] **I-2.5** 戦士・右向き歩行フレーム（`warriorRightWalk1`, `warriorRightWalk2`）を修正
  - 足の移動幅拡大 + ボビング効果
- [x] **I-2.6** 盗賊・下向き歩行フレーム（`thiefDownWalk1`, `thiefDownWalk2`）を修正
  - 戦士と同様の修正
- [x] **I-2.7** 盗賊・上向き歩行フレーム（`thiefUpWalk1`, `thiefUpWalk2`）を修正
- [x] **I-2.8** 盗賊・左向き歩行フレーム（`thiefLeftWalk1`, `thiefLeftWalk2`）を修正
- [x] **I-2.9** 盗賊・右向き歩行フレーム（`thiefRightWalk1`, `thiefRightWalk2`）を修正

### 検証タスク

- [x] **V-2.1** 既存の spriteData テストが通ること
- [ ] **V-2.2** 戦士・下向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.3** 戦士・上向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.4** 戦士・左向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.5** 戦士・右向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.6** 盗賊・下向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.7** 盗賊・上向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.8** 盗賊・左向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.9** 盗賊・右向きの歩行が自然に見えること（目視確認）
- [ ] **V-2.10** アニメーション速度が適切に感じること（150ms で速すぎないか）
- [ ] **V-2.11** idle→歩行の遷移が滑らかなこと

---

## 総合検証

> 全要件の実装完了後に実施

### 統合テスト

- [x] **V-INT.1** 全テストスイートが通ること（`npm test`） — 105スイート、1303テスト全パス
- [x] **V-INT.2** TypeScript コンパイルが通ること（`npx tsc --noEmit`）
- [ ] **V-INT.3** ビルドが成功すること（`npm run build`）

### 通しプレイテスト

- [ ] **V-PLAY.1** Stage1〜5を通しプレイし、全要件が正しく動作すること
- [ ] **V-PLAY.2** 各ステージでレベル上限まで成長できること（要件3: Lv10→13→16→19→22）
- [ ] **V-PLAY.3** リジェネが8秒間隔で1HP回復すること（要件4）
- [ ] **V-PLAY.4** Stage5メガボスのダメージが7であること（要件5）
- [ ] **V-PLAY.5** 各ステージで壁/床の色が変わること（要件6）
- [ ] **V-PLAY.6** STAGE表示がタイマー直下に表示されること（要件1）
- [ ] **V-PLAY.7** 歩行アニメーションが自然に見えること（要件2）
- [ ] **V-PLAY.8** 全体的な難易度が「やりごたえがあるが理不尽ではない」こと

### バランス確認

- [ ] **V-BAL.1** Stage1が初見でもクリア可能であること
- [ ] **V-BAL.2** Stage5が適度に難しいが不可能ではないこと
- [ ] **V-BAL.3** healBonusに振ることでリジェネが体感できること
- [ ] **V-BAL.4** レベルアップの選択に戦略性があること
