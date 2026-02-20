# LAP DRAFT RACING タスクチェックリスト

> 文書ID: LDR-20260221-01-TASKS
> 作成日: 2026-02-21
> 対象: フェーズ0（操作感改善）+ フェーズ1（コア体験）
> ステータス: ドラフト

---

## 凡例

- **難易度**: S（Small / 半日以内） / M（Medium / 1日） / L（Large / 2-3日）
- **ステータス**: `[ ]` 未着手 / `[x]` 完了
- **依存関係**: そのタスクの着手前に完了が必要なタスク

---

## フェーズ0: 操作感改善（T-001 〜 T-014）

### T-001: 型定義の追加（DriftState, HeatState, CourseEffect, GamePhase）

- [x] **難易度**: S
- **依存関係**: なし
- **変更ファイル**: `types.ts`
- **内容**:
  - `DriftState` インターフェース追加
  - `HeatState` インターフェース追加
  - `CourseEffect` インターフェース追加
  - `GamePhase` 型（`'menu' | 'countdown' | 'race' | 'draft' | 'result'`）追加
  - 既存 `Player` インターフェースに `drift: DriftState`, `heat: HeatState` フィールド追加
- **テスト項目**:
  - [x] 型定義が正しくコンパイルされること
  - [x] 既存コードの型エラーが発生しないこと（`Player` 拡張の後方互換性）

### T-002: 定数パラメータの追加（DRIFT, HEAT, WALL）

- [x] **難易度**: S
- **依存関係**: T-001
- **変更ファイル**: `constants.ts`
- **内容**:
  - `DRIFT` 定数オブジェクト追加（`MIN_SPEED`, `ANGLE_MULTIPLIER`, `SPEED_RETAIN` 等）
  - `HEAT` 定数オブジェクト追加（`WALL_THRESHOLD`, `CAR_THRESHOLD`, `GAIN_RATE` 等）
  - `WALL` 定数オブジェクト追加（段階的減速パラメータ）
- **テスト項目**:
  - [x] 定数値が spec.md の仕様通りであること
  - [x] 既存の `Config`, `Colors`, `Options`, `Courses` と名前衝突がないこと

### T-003: ドリフト物理計算モジュール作成

- [x] **難易度**: M
- **依存関係**: T-001, T-002
- **変更ファイル**: `drift.ts`（新規作成）
- **内容**:
  - `initDriftState(): DriftState` — 初期状態生成
  - `startDrift(state: DriftState, speed: number): DriftState` — ドリフト開始判定
  - `updateDrift(state: DriftState, steering: number, speed: number, dt: number): DriftState` — フレーム更新
  - `endDrift(state: DriftState): DriftState` — ドリフト終了・ブースト計算
  - `getDriftBoost(state: DriftState): number` — 現在のブースト値取得
- **テスト項目**:
  - [x] `speed < DRIFT.MIN_SPEED (0.4)` でドリフトが開始されないこと
  - [x] ドリフト中の角速度が `Config.game.turnRate × DRIFT.ANGLE_MULTIPLIER (1.8)` になること
  - [x] ドリフト終了時にブースト量が `DRIFT.BOOST_BASE + duration × DRIFT.BOOST_PER_SEC` で計算されること
  - [x] ブースト量が `DRIFT.BOOST_MAX (0.3)` を超えないこと
  - [x] 壁接触（`onTrack === false`）でドリフトが終了すること

### T-004: ドリフトの game-logic 統合

- [x] **難易度**: M
- **依存関係**: T-003
- **変更ファイル**: `game-logic.ts`, `hooks.ts`
- **内容**:
  - `hooks.ts`: `useInput` にハンドブレーキキー（Space / Shift）の追跡を追加
  - `game-logic.ts` の `Logic.movePlayer()` にドリフト処理を組み込み
  - ドリフト中の速度・角度計算を `drift.ts` に委譲
  - ドリフトブーストの速度反映
- **テスト項目**:
  - [x] ハンドブレーキ押下 + ステアリング入力でドリフトが開始されること
  - [x] ドリフト中の移動計算が正しいこと
  - [x] ドリフト終了後にブーストが適用されること
  - [x] 既存の通常移動に影響がないこと（ハンドブレーキ未押下時）

### T-005: ドリフトエフェクト（視覚・音声）

- [x] **難易度**: M
- **依存関係**: T-004
- **変更ファイル**: `renderer.ts`, `entities.ts`, `audio.ts`
- **内容**:
  - `entities.ts`: `Entity.driftSmoke(x, y)` パーティクル生成関数追加
  - `renderer.ts`: タイヤスモーク描画、タイヤ痕描画
  - `audio.ts`: `SoundEngine.driftStart()`, `driftLoop()`, `driftBoost()` 追加
- **テスト項目**:
  - [x] ドリフト中にスモークパーティクルが生成されること（`Config.game.maxParticles` 内）
  - [x] ドリフト音が開始/停止されること
  - [x] ブースト発動時に効果音が再生されること

### T-006: HEAT 計算モジュール作成

- [x] **難易度**: M
- **依存関係**: T-001, T-002
- **変更ファイル**: `heat.ts`（新規作成）
- **内容**:
  - `initHeatState(): HeatState` — 初期状態生成
  - `updateHeat(state: HeatState, wallDist: number, carDist: number, dt: number): HeatState` — フレーム更新
  - `activateBoost(state: HeatState): HeatState` — ブースト発動
  - `getHeatBoost(state: HeatState): number` — 現在のブースト値取得
- **テスト項目**:
  - [x] 壁距離が `trackWidth - HEAT.WALL_THRESHOLD` より大きい（壁に近い）時にゲージが蓄積されること
  - [x] 車間距離 < `HEAT.CAR_THRESHOLD (40)` かつ > `Config.game.collisionDist (25)` でゲージ蓄積
  - [x] 距離が近いほど蓄積量が大きいこと（距離反比例）
  - [x] ゲージが `HEAT.DECAY_RATE` で自然減衰すること
  - [x] ゲージ 1.0 でブーストが発動し、ゲージが 0 にリセットされること
  - [x] クールダウン中（`HEAT.COOLDOWN` 秒）にゲージが蓄積されないこと

### T-007: HEAT の game-logic 統合

- [x] **難易度**: M
- **依存関係**: T-006
- **変更ファイル**: `game-logic.ts`
- **内容**:
  - `Logic.movePlayer()` に HEAT 計算を統合
  - `Track.getInfo().dist` を使った壁距離の取得
  - `Utils.dist()` を使った車間距離の計算
  - HEAT ブースト発動の速度反映
- **テスト項目**:
  - [x] ゲームループ中に HEAT が正しく計算されること
  - [x] ブースト発動で速度が増加すること
  - [x] 既存の `Logic.handleCollision()` に影響がないこと

### T-008: HEAT ゲージ UI・エフェクト

- [x] **難易度**: M
- **依存関係**: T-007
- **変更ファイル**: `renderer.ts`, `audio.ts`
- **内容**:
  - `renderer.ts`: `Render.rect()` を活用した HEAT ゲージバー描画（色遷移: 青→黄→赤）、MAX 点滅
  - `audio.ts`: `SoundEngine.heatCharge()`, `heatMax()`, `heatBoost()` 追加
- **テスト項目**:
  - [x] ゲージバーが `HeatState.gauge` に応じた幅で描画されること
  - [x] 色が青(0〜0.3)→黄(0.3〜0.7)→赤(0.7〜1.0)と遷移すること
  - [x] ゲージ 1.0 到達時に白点滅すること

### T-009: 壁ヒットペナルティ改善

- [x] **難易度**: M
- **依存関係**: T-001, T-002
- **変更ファイル**: `game-logic.ts`, `track.ts`
- **内容**:
  - `track.ts`: `Track.getNormal(seg, points): { nx, ny }` 壁法線ベクトル計算を追加
  - `game-logic.ts` の `Logic.movePlayer()` 内の壁判定ロジックを改修:
    - 完全停止（`speed = 0`）→ スライドベクトル方式に変更
    - `wallStuck` 値に応じた3段階減速（× 0.85 / × 0.70 / × 0.50）
    - `Config.game.wallWarpThreshold` を 10 → 15 に調整
- **テスト項目**:
  - [x] 壁接触時に完全停止しないこと（`speed > 0`）
  - [x] スライド方向がトラックセグメントに沿っていること
  - [x] `wallStuck` 増加に応じて減速率が変化すること（3段階）
  - [x] ワープしきい値 15 で正常にワープすること
  - [x] コースショートカットが不可能なこと（`Logic.updateCheckpoints()` で担保）

### T-010: 壁改善エフェクト調整

- [x] **難易度**: S
- **依存関係**: T-009
- **変更ファイル**: `renderer.ts`, `audio.ts`
- **内容**:
  - 接触段階に応じた画面シェイク振幅調整（1px / 2px / 4px）
  - `SoundEngine.wall()` の音量を接触段階に応じて変更
- **テスト項目**:
  - [x] 軽接触と強接触でシェイク強度が異なること
  - [x] 音量が段階に応じて変化すること

### T-011: コース環境効果モジュール作成

- [x] **難易度**: M
- **依存関係**: T-001, T-002
- **変更ファイル**: `course-effects.ts`（新規作成）, `constants.ts`
- **内容**:
  - 6コースの `CourseEffect` データ定義（`Courses[].deco` と対応）
  - `getEffect(deco: string): CourseEffect` — デコタイプから効果取得
  - `applyEffect(player: Player, effect: CourseEffect, segment: number): Player` — 物理パラメータ修正
  - `constants.ts` の各コースに `effect` プロパティを追加
- **テスト項目**:
  - [x] 各コースの効果パラメータが spec.md の仕様通りであること
  - [x] 摩擦係数が正しく適用されること
  - [x] `segmentBased === true` のコースでセグメントごとに効果が異なること

### T-012: コース環境効果の統合

- [x] **難易度**: M
- **依存関係**: T-011, T-004（ドリフトとの相互作用あり）
- **変更ファイル**: `game-logic.ts`, `RacingGame.tsx`
- **内容**:
  - `Logic.movePlayer()` の呼び出し前に `applyEffect()` で物理パラメータを一時修正
  - ドリフト角度ボーナスの反映（Snow: +20%, City: +10%）
  - 速度修正の反映（Mountain: セグメント傾斜 ±5%）
- **テスト項目**:
  - [x] Forest: 特定セグメントで `frictionMultiplier = 0.85` が適用されること
  - [x] City: 全体で `frictionMultiplier = 0.90`、`driftAngleBonus = +10%`
  - [x] Mountain: セグメント傾斜で速度が ±5% 変化すること
  - [x] Beach: トラック外縁20%で `frictionMultiplier = 0.70`
  - [x] Night: ビネットエフェクトが描画されること
  - [x] Snow: `frictionMultiplier = 0.75`、`driftAngleBonus = +20%`

### T-013: コース環境視覚エフェクト

- [x] **難易度**: M
- **依存関係**: T-012
- **変更ファイル**: `renderer.ts`, `entities.ts`
- **内容**:
  - 落ち葉パーティクル（Forest）— `Render.ellipse()` 活用
  - 雨パーティクル（City）— `Render.rect()` で細長い白矩形
  - 雪パーティクル強化（Snow）— `Render.circle()` 活用、密度増加
  - ビネットエフェクト（Night）— Canvas ラジアルグラデーション
- **テスト項目**:
  - [x] 各コースで対応する視覚エフェクトが表示されること
  - [x] パーティクル数が `Config.game.maxParticles` を超えないこと
  - [x] 60fps を維持できるパフォーマンスであること

### T-014: フェーズ0 統合テスト・バランス調整

- [x] **難易度**: L
- **依存関係**: T-005, T-008, T-010, T-013
- **変更ファイル**: 全ファイル（パラメータ微調整）
- **内容**:
  - ドリフト + HEAT + 壁改善 + コース効果の相互作用テスト
  - CPU AI がドリフト/HEAT に適応するか確認（`Logic.cpuTurn()` の調整）
  - パラメータのバランス調整（`Options.speed` 3段階との整合性）
  - パフォーマンスプロファイリング（60fps 維持確認）
- **テスト項目**:
  - [x] 6コース（`Courses[0-5]`）全てで正常にレースが完走できること
  - [x] 2P モード（`mode === '2p'`）で両プレイヤーが正常に動作すること
  - [x] CPU がドリフト/HEAT を使用すること（`skill` パラメータに応じて）
  - [x] フレームレートが 55fps 以上を維持すること
  - [x] 既存のベストタイム保存（`bests`）に影響がないこと
  - [x] デモモード（`useIdle`）が正常に動作すること

---

## フェーズ1: コア体験（T-101 〜 T-112）

### T-101: カード型定義とデータ作成

- [x] **難易度**: M
- **依存関係**: T-001
- **変更ファイル**: `types.ts`, `draft-cards.ts`（新規作成）
- **内容**:
  - `types.ts`: `Card`, `CardEffect`, `CardCategory`, `CardRarity`, `DeckState` 型定義追加
  - `draft-cards.ts`: 15枚のカードデータ定義（spec.md のカード一覧に準拠）
  - レアリティごとのドロー確率定数（R:60%, SR:30%, SSR:10%）
- **テスト項目**:
  - [x] 15枚全てのカードデータが正しく定義されていること
  - [x] カテゴリ分類: speed 5枚, handling 4枚, defense 3枚, special 3枚
  - [x] レアリティ分布: R 8枚, SR 5枚, SSR 2枚

### T-102: デッキ管理ロジック

- [x] **難易度**: M
- **依存関係**: T-101
- **変更ファイル**: `draft-cards.ts`
- **内容**:
  - `createDeck(): DeckState` — 全15枚からデッキ生成・シャッフル
  - `drawCards(deck: DeckState, count: number): DeckState` — 確率ベースの3枚ドロー
  - `selectCard(deck: DeckState, cardId: string): DeckState` — カード選択・デッキ更新
  - `getActiveEffects(deck: DeckState): CardEffect` — 適用中効果の集計
  - `clearActiveEffects(deck: DeckState): DeckState` — ラップ終了時の効果解除
- **テスト項目**:
  - [x] デッキが正しくシャッフルされること
  - [x] 3枚ドローでレアリティ確率が概ね正しいこと（R:60%, SR:30%, SSR:10%）
  - [x] 選択したカードがデッキから除外されること
  - [x] デッキ3枚未満で全15枚から再生成されること
  - [x] 効果の加算合算が正しいこと（乗算ではなく加算）

### T-103: カード効果適用ロジック

- [x] **難易度**: L
- **依存関係**: T-102, T-004（ドリフト統合後）, T-007（HEAT 統合後）
- **変更ファイル**: `draft-cards.ts`, `game-logic.ts`
- **内容**:
  - `applyCardEffects(player: Player, effects: CardEffect): Player` — 物理パラメータへの効果反映
  - 各カード効果の具体的実装:
    - 速度系: `speedMultiplier` → `baseSpd` に適用, `accelMultiplier` → `speedRecovery` に適用
    - ハンドリング系: `turnMultiplier` → `Config.game.turnRate` に適用
    - 防御系: `wallDamageMultiplier` → 壁減速率に適用, `shieldCount` → 衝突無効化
    - 特殊系: `heatGainMultiplier` → `HEAT.GAIN_RATE` に適用
  - ワイルドカード（SPC_03）: `Utils.randChoice()` で2枚ランダム選択
- **テスト項目**:
  - [x] 各カード効果が正しく適用されること（15枚すべて）
  - [x] 効果が1ラップで正しく解除されること
  - [x] シールドが衝突時に消費されること（`Logic.handleCollision()` 連携）
  - [x] ワイルドカードがランダムに2枚効果を発動すること
  - [x] 複数カード効果の加算合算が正しいこと

### T-104: カード選択 UI コンポーネント

- [x] **難易度**: L
- **依存関係**: T-102
- **変更ファイル**: `renderer.ts`（Canvas描画として実装）, `RacingGame.tsx`
- **内容**:
  - 3枚カード表示レイアウト（Canvas 900×700 内にオーバーレイ描画）
  - キーボード操作（`useInput` の `keys.current` で判定）
    - CPU 対戦: ←→ 選択、Enter/Space 決定
    - 2P P1: A/D 選択、W 決定
    - 2P P2: ←→ 選択、Enter 決定
  - カウントダウンタイマー（15秒）
  - タイムアウト時の自動選択
  - アニメーション（登場/ホバー/確定/フェードアウト）
- **テスト項目**:
  - [x] 3枚のカードが正しく表示されること
  - [x] キー操作で選択・決定ができること
  - [x] 15秒でタイムアウトしてランダム選択されること
  - [x] 2P モードで P1→P2 の順に選択できること
  - [x] アニメーションが滑らかに動作すること

### T-105: draft 状態遷移の統合

- [x] **難易度**: M
- **依存関係**: T-103, T-104
- **変更ファイル**: `RacingGame.tsx`
- **内容**:
  - `state` 変数に `GamePhase` 型を適用
  - `race` → `draft` 遷移（ラップ完了時、最終ラップ除く）
  - `draft` → `race` 遷移（カード選択完了時）
  - ゲームループの一時停止（`requestAnimationFrame` 停止）/ 再開
  - CPU のカード自動選択ロジック（`Utils.randChoice()` ベース、`cpu.skill` で重み付け）
  - デモモード時はドラフトスキップ
- **テスト項目**:
  - [x] ラップ完了時に `state === 'draft'` に遷移すること（最終ラップ除く）
  - [x] 最終ラップ完了時は直接 `state === 'result'` に遷移すること
  - [x] カード選択後に `state === 'race'` に戻りレースが再開されること
  - [x] CPU が自動でカードを選択すること
  - [x] `Options.laps === 1` の設定時はドラフトが発生しないこと
  - [x] デモモード時にドラフト UI が表示されないこと

### T-106: ゴースト記録モジュール

- [x] **難易度**: M
- **依存関係**: T-001
- **変更ファイル**: `ghost.ts`（新規作成）
- **内容**:
  - `createGhostRecorder(): GhostRecorder` — 記録インスタンス生成
  - `recordFrame(recorder, player: Player, time: number): void` — フレーム記録（3フレームに1回）
  - `finalizeRecording(recorder): GhostData` — 記録完了・GhostData 生成
- **テスト項目**:
  - [x] 3フレームに1回の頻度で記録されること（フレームカウンタ % 3 === 0）
  - [x] `state === 'draft'` 中は記録が停止されること
  - [x] `GhostFrame` のフォーマットが正しいこと（x, y, angle, speed, lap, t）

### T-107: ゴースト再生・補間

- [x] **難易度**: M
- **依存関係**: T-106
- **変更ファイル**: `ghost.ts`
- **内容**:
  - `createGhostPlayer(data: GhostData): GhostPlayer` — 再生インスタンス生成
  - `getGhostPosition(player: GhostPlayer, time: number): GhostFrame` — 補間付き位置取得（二分探索）
  - 角度の線形補間: `Utils.normalizeAngle()` を活用した最短経路補間
- **テスト項目**:
  - [x] フレーム間の線形補間が正しいこと
  - [x] 角度の補間が最短経路で行われること（-PI〜PI を考慮）
  - [x] データ範囲外の時間（レース終了後）でエラーが発生しないこと

### T-108: ゴースト保存・読込（localStorage）

- [x] **難易度**: M
- **依存関係**: T-107
- **変更ファイル**: `ghost.ts`
- **内容**:
  - `saveGhost(data: GhostData): void` — localStorage への保存
  - `loadGhost(courseIndex: number, mode: string): GhostData | null` — localStorage からの読込
  - `shouldUpdateGhost(newData: GhostData, existingData: GhostData | null): boolean` — ベスト更新判定
  - キー: `ghost_{courseIndex}_{mode}`（既存の `bests` 保存パターンを踏襲）
- **テスト項目**:
  - [x] 保存・読込が正しく動作すること（JSON シリアライズ/デシリアライズ）
  - [x] ベストタイム更新時のみ上書きされること
  - [x] データが存在しない場合に `null` が返ること
  - [x] localStorage 容量超過時にエラーハンドリングされること（try-catch）

### T-109: ゴースト描画・トグル UI

- [x] **難易度**: M
- **依存関係**: T-107, T-108
- **変更ファイル**: `renderer.ts`, `RacingGame.tsx`
- **内容**:
  - `renderer.ts`: `Render.ghostKart()` ゴースト車体の半透明描画（`globalAlpha = 0.3`）、"GHOST" ラベル
  - `RacingGame.tsx`: メニュー画面に Ghost トグルボタン、ゲームループにゴースト再生を統合、衝突判定対象外
- **テスト項目**:
  - [x] ゴースト車体が半透明（alpha 0.3）で描画されること
  - [x] トグル ON/OFF でゴースト表示が切り替わること
  - [x] ゴーストデータがない場合はトグルがグレーアウトすること
  - [x] ゴースト車体が `Logic.handleCollision()` で衝突判定されないこと

### T-110: ハイライト検出モジュール

- [x] **難易度**: M
- **依存関係**: T-004（ドリフト）, T-007（HEAT）, T-001
- **変更ファイル**: `highlight.ts`（新規作成）
- **内容**:
  - `createHighlightTracker(): HighlightTracker` — トラッカーインスタンス生成
  - `checkDriftBonus(tracker, driftState: DriftState): HighlightEvent | null` — ドリフト 1.5秒以上
  - `checkHeatBoost(tracker, heatState: HeatState): HighlightEvent | null` — HEAT ブースト発動時
  - `checkNearMiss(tracker, wallDist: number, dt: number): HighlightEvent | null` — 壁距離 < 10px で0.5秒以上
  - `checkOvertake(tracker, positions: number[]): HighlightEvent | null` — 順位逆転
  - `checkFastestLap(tracker, lapTime: number): HighlightEvent | null` — 最速ラップ更新
  - `checkPhotoFinish(tracker, finishTimes: number[]): HighlightEvent | null` — タイム差 < 0.5秒
  - `getHighlightSummary(tracker): { type, count, totalScore }[]` — サマリー集計
- **テスト項目**:
  - [x] ドリフト 1.5秒以上でボーナスが検出されること（スコア = duration × 100）
  - [x] HEAT ブースト発動が検出されること（スコア = 150）
  - [x] 壁距離 10px 未満 0.5秒以上でニアミスが検出されること
  - [x] `Player.progress` による順位逆転が検出されること（スコア = 300）
  - [x] `Player.lapTimes` の最速更新でファステストラップが検出されること（スコア = 200）
  - [x] ゴール時タイム差 0.5秒未満でフォトフィニッシュが検出されること（スコア = 500）

### T-111: ハイライト通知 UI・リザルト表示

- [x] **難易度**: M
- **依存関係**: T-110
- **変更ファイル**: `renderer.ts`, `RacingGame.tsx`
- **内容**:
  - `renderer.ts`: Canvas 上部中央に通知バナー描画（フェードイン/アウト、イベント色分け）
  - `RacingGame.tsx`:
    - ハイライトトラッカーのゲームループ統合（`state === 'race'` 中に毎フレーム判定）
    - 通知キュー管理（最大3つ、先入先出）
    - `state === 'result'` 画面にハイライトサマリーを表示（`Render.fireworks()` と共存）
- **テスト項目**:
  - [x] 通知バナーが正しいタイミングで表示されること（2秒間）
  - [x] 複数通知がキュー順に表示されること
  - [x] リザルト画面にハイライトサマリーが表示されること（種別×回数+スコア）
  - [x] 各イベントの背景色が spec.md 通りであること

### T-112: フェーズ1 統合テスト・バランス調整

- [x] **難易度**: L
- **依存関係**: T-105, T-109, T-111, T-014
- **変更ファイル**: 全ファイル（パラメータ微調整）
- **内容**:
  - ドラフトカード + ゴースト + ハイライトの統合動作確認
  - フェーズ0 の機能との相互作用テスト
  - カードバランス調整（特定カードが強すぎないか）
  - ゴーストデータサイズの最適化（フレーム間引き確認）
  - 全モード（CPU / 2P / デモ）での動作確認
- **テスト項目**:
  - [x] 3周レース（`Options.laps = 3`）でドラフトが2回発生すること
  - [x] 5周レース（`Options.laps = 5`）でドラフトが4回発生すること
  - [x] カード効果がドリフト/HEAT と正しく連動すること（`driftBoostMultiplier`, `heatGainMultiplier`）
  - [x] ゴーストとハイライトが同時に正常動作すること
  - [x] 全6コース（`Courses[0-5]`）で完走できること
  - [x] CPU 対戦（`mode === 'cpu'`）・2P 対戦（`mode === '2p'`）が正常に動作すること
  - [x] デモモード（`useIdle` 起動）が正常に動作すること
  - [x] フレームレートが 55fps 以上を維持すること
  - [x] localStorage ゴーストデータ容量が想定範囲内（1件 ~240KB）であること

---

## 依存関係図

```
フェーズ0:

T-001 (型定義)
  ├── T-002 (定数) ─┬── T-003 (ドリフト) ── T-004 (統合) ── T-005 (エフェクト)
  │                 ├── T-006 (HEAT)    ── T-007 (統合) ── T-008 (UI)
  │                 ├── T-009 (壁改善)  ── T-010 (エフェクト)
  │                 └── T-011 (コース効果) ── T-012 (統合) ── T-013 (エフェクト)
  │
  └──────── T-005, T-008, T-010, T-013 ──→ T-014 (統合テスト)


フェーズ1:

T-001 (型定義)
  ├── T-101 (カードデータ) ── T-102 (デッキ) ── T-103 (効果適用)
  │                                            ├── T-104 (UI)
  │                                            └──→ T-105 (状態遷移統合)
  │
  ├── T-106 (ゴースト記録) ── T-107 (再生) ── T-108 (保存) ── T-109 (描画/トグル)
  │
  └── T-110 (ハイライト検出) ── T-111 (通知UI)

  T-105, T-109, T-111, T-014 ──→ T-112 (統合テスト)
```

---

## 推奨実装順序

フェーズ0 とフェーズ1 のタスクは一部並行して実施可能です。以下は最適な実装順序です。

### レーン1: ドリフト系（クリティカルパス）

```
T-001 → T-002 → T-003 → T-004 → T-005
```

### レーン2: HEAT 系（T-002 完了後に並行可能）

```
              T-006 → T-007 → T-008
```

### レーン3: 壁 / コース系（T-002 完了後に並行可能）

```
              T-009 → T-010
              T-011 → T-012 → T-013
```

### レーン4: フェーズ0 統合

```
              T-005 + T-008 + T-010 + T-013 → T-014
```

### レーン5: カード系（T-001 完了後に並行可能）

```
T-101 → T-102 → T-103 → T-104 → T-105
```

### レーン6: ゴースト系（T-001 完了後に並行可能）

```
T-106 → T-107 → T-108 → T-109
```

### レーン7: ハイライト系（T-004 + T-007 完了後）

```
T-110 → T-111
```

### レーン8: フェーズ1 統合

```
T-105 + T-109 + T-111 + T-014 → T-112
```

---

## サマリー

| フェーズ | タスク数 | S | M | L | 推定工数 |
|---------|---------|---|---|---|---------|
| フェーズ0 | 14 | 2 | 10 | 2 | 約 16 人日 |
| フェーズ1 | 12 | 0 | 9 | 3 | 約 18 人日 |
| **合計** | **26** | **2** | **19** | **5** | **約 34 人日** |
