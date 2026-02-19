# Deep Sea Interceptor ブラッシュアップ — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- **I**: Implementation（実装タスク）
- **V**: Verification（検証タスク）

---

## Phase 1: コア体験の強化

---

### 1. コンボ & グレイズシステム

> 変更規模: 中 | 依存: なし | 影響ファイル: types.ts, collision.ts, game-logic.ts, HUD.tsx, audio.ts

#### 実装タスク

- [x] **I-1.1** `types.ts` の `GameState` に新フィールド追加
  - `combo: number` — 現在のコンボ数
  - `comboTimer: number` — 最後の撃破タイムスタンプ
  - `maxCombo: number` — 最大コンボ記録
  - `grazeCount: number` — グレイズ累計
  - `grazedBulletIds: Set<number>` — グレイズ済み弾のID集合
- [x] **I-1.2** `types.ts` の `UiState` に新フィールド追加
  - `combo: number` — 表示用コンボ数
  - `multiplier: number` — 表示用倍率
  - `grazeCount: number` — 表示用グレイズ数
  - `maxCombo: number` — リザルト用最大コンボ
- [x] **I-1.3** `game-logic.ts` の `createInitialGameState` を更新（新フィールドの初期値追加）
- [x] **I-1.4** `game-logic.ts` の `createInitialUiState` を更新（新フィールドの初期値追加）
- [x] **I-1.5** `collision.ts` に `Collision.graze` メソッドを追加
  - プレイヤーと敵弾の距離が「衝突半径 < d < グレイズ半径」の場合に true
  - グレイズ半径 = playerHitboxRadius + 16px
- [x] **I-1.6** `game-logic.ts` の `updateFrame` 内の敵撃破セクションにコンボロジックを追加
  - 撃破時: `gd.combo++`, `gd.comboTimer = now`, `gd.maxCombo` 更新
  - 倍率計算: `Math.min(5.0, 1.0 + gd.combo * 0.1)`
  - スコア計算を `e.points * multiplier` に変更
- [x] **I-1.7** `game-logic.ts` の `updateFrame` 内の被弾判定セクションにグレイズ判定を追加
  - 各敵弾に対して `Collision.graze` をチェック
  - グレイズ発生時: スコア加算（50 × 倍率）、コンボタイマー延長、audioPlay('graze')
  - `grazedBulletIds` で重複判定を防止
- [x] **I-1.8** `game-logic.ts` のフレーム末尾にコンボタイマー切れ処理を追加
  - `now - gd.comboTimer > 3000` でコンボリセット
- [x] **I-1.9** `audio.ts` に 'graze' サウンド定義を追加
- [x] **I-1.10** `components/HUD.tsx` にコンボカウンター表示を追加
  - 右上にコンボ数と倍率を表示
  - combo >= 10 で文字色を金色に変更、text-shadow 追加
- [x] **I-1.11** `components/HUD.tsx` にグレイズ累計表示を追加

#### 検証タスク

- [x] **V-1.1** 既存の collision テストが通ること（`npm test -- --testPathPattern=collision`）
- [x] **V-1.2** 既存の game-logic テストが通ること（`npm test -- --testPathPattern=game-logic`）
- [ ] **V-1.3** 新規テスト: `Collision.graze` が正しい距離範囲で true/false を返すこと
- [ ] **V-1.4** 新規テスト: コンボ加算、倍率計算、コンボタイマー切れが正しく動作すること
- [ ] **V-1.5** 新規テスト: グレイズスコア加算が正しく計算されること
- [ ] **V-1.6** プレイテスト: 連続撃破でコンボ数が増加し、HUDに倍率が表示されること
- [ ] **V-1.7** プレイテスト: 敵弾をギリギリで回避した時にグレイズが発生すること
- [ ] **V-1.8** プレイテスト: 3秒間撃破がないとコンボがリセットされること

---

### 2. ボスの個性化（5種 × 2フェーズ）

> 変更規模: 大 | 依存: なし | 影響ファイル: types.ts, constants.ts, entities.ts, enemy-ai.ts, movement.ts, components/EnemySprite.tsx

#### 実装タスク

- [x] **I-2.1** `types.ts` の `EnemyType` に `'boss1'〜'boss5'` を追加（`'boss'` は後方互換で残す）
- [x] **I-2.2** `types.ts` の `Enemy` に `bossPhase: number` フィールドを追加
- [x] **I-2.3** `constants.ts` の `EnemyConfig` に boss1〜boss5 の設定を追加
  - 各ボスの HP, speed, points, sizeRatio, canShoot, fireRate を定義
- [x] **I-2.4** `constants.ts` の `ColorPalette.enemy` に boss1〜boss5 の色を追加
- [x] **I-2.5** `entities.ts` の `EntityFactory.enemy` でボスタイプ別の生成ロジックを追加
  - `bossPhase` の初期値を 1 に設定
- [x] **I-2.6** `enemy-ai.ts` に `BossPatterns` オブジェクトを新設
  - boss1 Phase 1: 5発の扇状弾（中心から ±30度）
  - boss1 Phase 2: 引き寄せ力 + 自機狙い弾
- [x] **I-2.7** `enemy-ai.ts` に boss2 の攻撃パターンを追加
  - Phase 1: 機雷設置（3秒間隔）+ 左右直線弾
  - Phase 2: 高速機雷（1.5秒間隔）+ 自機狙い弾
- [x] **I-2.8** `enemy-ai.ts` に boss3 の攻撃パターンを追加
  - Phase 1: 熱水噴射（縦列3本）+ 回転弾（12方向）
  - Phase 2: 画面半分ダメージゾーン + 弱点露出
- [x] **I-2.9** `enemy-ai.ts` に boss4 の攻撃パターンを追加
  - Phase 1: 波状弾幕（sin波弾道）+ 子クラゲ召喚
  - Phase 2: 稲妻パターン（縦線弾幕 + 予告線）
- [x] **I-2.10** `enemy-ai.ts` に boss5 の攻撃パターンを追加
  - Phase 1: boss1〜boss4 のランダム選択（3秒切替）
  - Phase 2: 全方位16発 + 弱点回転
- [x] **I-2.11** `enemy-ai.ts` の `createBullets` をリファクタリング
  - ボスタイプに応じて `BossPatterns[bossType][bossPhase]` にディスパッチ
- [x] **I-2.12** `game-logic.ts` の敵更新セクションにフェーズ遷移ロジックを追加
  - HP <= 50% でフェーズ2に遷移、弾クリア、SE再生
- [x] **I-2.13** `movement.ts` にボスタイプ別の移動パターンを追加（boss2〜boss5 用）
- [x] **I-2.14** `components/EnemySprite.tsx` にボスタイプ別の見た目を追加
  - 各ボスの SVG/CSS による外見表現

#### 検証タスク

- [x] **V-2.1** 既存の enemy-ai テストが通ること（`npm test -- --testPathPattern=enemy-ai`）
- [x] **V-2.2** 既存の entities テストが通ること（`npm test -- --testPathPattern=entities`）
- [x] **V-2.3** 既存の movement テストが通ること（`npm test -- --testPathPattern=movement`）
- [ ] **V-2.4** 新規テスト: 各ボスの Phase1 攻撃パターンが正しい弾を生成すること
- [ ] **V-2.5** 新規テスト: 各ボスの Phase2 遷移条件が HP 50% 以下であること
- [ ] **V-2.6** 新規テスト: フェーズ遷移時に敵弾がクリアされること
- [x] **V-2.7** TypeScript コンパイルが通ること（`npx tsc --noEmit`）
- [ ] **V-2.8** プレイテスト: 各ステージのボスが固有の攻撃パターンを使うこと
- [ ] **V-2.9** プレイテスト: HP 50% 以下でフェーズ2に遷移し攻撃が変化すること
- [ ] **V-2.10** プレイテスト: ボスの外見がステージごとに異なること

---

### 3. ステージ拡張（3 → 5ステージ）

> 変更規模: 中 | 依存: #2（ボス個性化）の boss4, boss5 が必要 | 影響ファイル: constants.ts, game-logic.ts

#### 実装タスク

- [x] **I-3.1** `constants.ts` の `StageConfig` の型を拡張（`gimmick: string` フィールド追加）
- [x] **I-3.2** `constants.ts` の `StageConfig` に Stage4, Stage5 を追加
  - Stage3 を「熱水噴出域」に名称変更、bg を `'#1a0a05'` に変更
  - Stage4: 生物発光帯（`bg: '#050a1a'`, `rate: 450`, `bossScore: 18000`）
  - Stage5: 最深部・海溝（`bg: '#020810'`, `rate: 350`, `bossScore: 25000`）
- [x] **I-3.3** `constants.ts` の既存 StageConfig に `gimmick` フィールドを追加
  - Stage1: `'current'`, Stage2: `'minefield'`, Stage3: `'thermalVent'`
- [x] **I-3.4** `game-logic.ts` のステージクリア判定を `stage < 3` → `stage < 5` に変更
- [x] **I-3.5** `game-logic.ts` のボススポーン処理を `boss${stage}` 形式に変更
  - `EntityFactory.enemy('boss', ...)` → `EntityFactory.enemy(`boss${currentUi.stage}`, ...)`

#### 検証タスク

- [x] **V-3.1** 既存の game-logic テストが通ること
- [ ] **V-3.2** 新規テスト: StageConfig に Stage1〜5 が定義されていること
- [x] **V-3.3** 新規テスト: ステージ5クリアで ending イベントが発生すること（既存テスト更新済み）
- [x] **V-3.4** TypeScript コンパイルが通ること
- [ ] **V-3.5** プレイテスト: 全5ステージを通してプレイできること
- [ ] **V-3.6** プレイテスト: 各ステージの背景色が異なること

---

## Phase 2: リプレイ性の向上

---

### 4. 武器セレクトシステム

> 変更規模: 中 | 依存: Phase 1 完了 | 影響ファイル: types.ts, entities.ts, movement.ts, hooks.ts, DeepSeaInterceptorGame.tsx

#### 実装タスク

- [x] **I-4.1** `types.ts` に `WeaponType` 型を追加（`'torpedo' | 'sonarWave' | 'bioMissile'`）
- [x] **I-4.2** `types.ts` の `Bullet` に新フィールドを追加
  - `weaponType: WeaponType`
  - `piercing: boolean`
  - `homing: boolean`
  - `homingTarget?: number`
  - `lifespan?: number`（ソナーウェーブの射程制限用）
- [x] **I-4.3** `entities.ts` の `EntityFactory.bullet` を `weaponType` 対応に拡張
  - torpedo: 既存挙動 + 貫通チャージ
  - sonarWave: 扇状3発 + 寿命制限
  - bioMissile: ホーミング + 低火力
- [x] **I-4.4** `movement.ts` に `MovementStrategies.homing` を追加
  - 最近接の敵に向かって旋回（最大旋回角 0.08 rad/frame）
- [x] **I-4.5** `game-logic.ts` のプレイヤー弾移動処理にホーミング弾対応を追加
  - `b.homing === true` の場合は `MovementStrategies.homing(b, gd.enemies)` を使用
- [x] **I-4.6** `game-logic.ts` の弾→敵の衝突判定で `piercing` 対応を追加
  - `piercing === true` の弾は敵にヒットしても消えない
- [x] **I-4.7** `game-logic.ts` のプレイヤー弾フィルタに `lifespan` 対応を追加
  - `lifespan` が設定されている弾は寿命切れで消滅
- [x] **I-4.8** `hooks.ts` に武器選択状態の管理を追加
  - `weaponType: WeaponType` state を追加
  - `startGame` で武器タイプを受け取る
  - 射撃ロジックを武器種別で分岐
- [x] **I-4.9** `DeepSeaInterceptorGame.tsx` のタイトル画面に武器選択UIを追加
  - 3種の武器を表示、選択状態をハイライト
- [ ] **I-4.10** `components/BulletSprite.tsx` を武器タイプ別の見た目に対応

#### 検証タスク

- [x] **V-4.1** 既存の entities テストが通ること
- [x] **V-4.2** 既存の movement テストが通ること
- [ ] **V-4.3** 新規テスト: 各武器タイプの弾が正しいパラメータで生成されること
- [ ] **V-4.4** 新規テスト: ホーミング弾が最近接の敵に向かって旋回すること
- [ ] **V-4.5** 新規テスト: 貫通弾が敵にヒットしても消えないこと
- [ ] **V-4.6** 新規テスト: ソナーウェーブの弾が寿命で消滅すること
- [x] **V-4.7** TypeScript コンパイルが通ること
- [ ] **V-4.8** プレイテスト: タイトル画面で3種の武器を選択できること
- [ ] **V-4.9** プレイテスト: 各武器で異なる射撃パターンが発動すること
- [ ] **V-4.10** プレイテスト: ホーミング弾が敵を追尾すること
- [ ] **V-4.11** プレイテスト: チャージショットが武器ごとに異なること

---

### 5. 難易度選択

> 変更規模: 小 | 依存: Phase 1 完了 | 影響ファイル: types.ts, constants.ts, game-logic.ts, hooks.ts, DeepSeaInterceptorGame.tsx

#### 実装タスク

- [x] **I-5.1** `types.ts` に `Difficulty` 型を追加（`'cadet' | 'standard' | 'abyss'`）
- [x] **I-5.2** `types.ts` の `UiState` に `difficulty: Difficulty` を追加
- [x] **I-5.3** `constants.ts` に `DifficultyConfig` 定数を追加
  - cadet: spawnRate ×0.7, bulletSpeed ×0.8, lives 5, score ×0.5
  - standard: すべて ×1.0, lives 3
  - abyss: spawnRate ×1.3, bulletSpeed ×1.2, lives 2, score ×2.0
- [x] **I-5.4** `game-logic.ts` の `updateFrame` にて難易度倍率を適用
  - スポーン間隔: `stg.rate / diffConfig.spawnRateMultiplier`
  - スコア計算: `e.points * multiplier * diffConfig.scoreMultiplier`
- [ ] **I-5.5** `enemy-ai.ts` の弾速計算に `bulletSpeedMultiplier` を適用
  - `updateFrame` から難易度設定を渡す方法を検討（引数追加 or UiState 経由）
- [x] **I-5.6** `hooks.ts` に難易度選択状態の管理を追加
  - `startGame` で難易度と初期ライフを設定
- [x] **I-5.7** `DeepSeaInterceptorGame.tsx` のタイトル画面に難易度選択UIを追加

#### 検証タスク

- [x] **V-5.1** 既存の game-logic テストが通ること
- [ ] **V-5.2** 新規テスト: 各難易度のスポーン倍率が正しく適用されること
- [ ] **V-5.3** 新規テスト: 各難易度のスコア倍率が正しく計算されること
- [x] **V-5.4** TypeScript コンパイルが通ること
- [ ] **V-5.5** プレイテスト: CADET で敵のスポーンが遅くライフが5であること
- [ ] **V-5.6** プレイテスト: ABYSS で敵が多くライフが2であること

---

### 6. リザルト画面強化 + ランク判定

> 変更規模: 小 | 依存: #1（コンボ/グレイズ）, #4（武器）, #5（難易度） | 影響ファイル: types.ts, game-logic.ts, DeepSeaInterceptorGame.tsx

#### 実装タスク

- [x] **I-6.1** `types.ts` に `PlayStats` インターフェースを追加
- [x] **I-6.2** `game-logic.ts` に `calculateRank` 純粋関数を追加
  - S: 40,000+ & ノーコンティニュー、A: 25,000+、B: 15,000+、C: 5,000+、D: それ以下
  - 難易度補正: CADET ×2、ABYSS ×0.5
- [x] **I-6.3** `types.ts` の `GameState` に `gameStartTime: number` を追加（プレイ時間計測用）
- [x] **I-6.4** `game-logic.ts` の `createInitialGameState` に `gameStartTime` の初期値追加
- [x] **I-6.5** `hooks.ts` の `startGame` で `gameStartTime = Date.now()` を設定
- [x] **I-6.6** `DeepSeaInterceptorGame.tsx` のゲームオーバー画面を詳細リザルトに置き換え
  - スコア、最大コンボ、グレイズ数、プレイ時間、ランク表示
- [x] **I-6.7** `DeepSeaInterceptorGame.tsx` のエンディング画面を詳細リザルトに置き換え
- [x] **I-6.8** ShareButton のテキストにランクと最大コンボを追加

#### 検証タスク

- [ ] **V-6.1** 新規テスト: `calculateRank` が各スコア範囲で正しいランクを返すこと
- [ ] **V-6.2** 新規テスト: 難易度補正が正しく適用されること
- [x] **V-6.3** TypeScript コンパイルが通ること
- [ ] **V-6.4** プレイテスト: リザルト画面に全項目（スコア、コンボ、グレイズ、時間、ランク）が表示されること
- [ ] **V-6.5** プレイテスト: ランクが S〜D で正しく判定されること

---

## Phase 3: 演出・やり込み

---

### 7. 演出強化

> 変更規模: 中 | 依存: Phase 2 完了 | 影響ファイル: styles.ts, DeepSeaInterceptorGame.tsx, HUD.tsx, game-logic.ts

#### 実装タスク

- [x] **I-7.1** `types.ts` の `GameState` に演出用フィールドを追加
  - `bossWarning: boolean` — WARNING表示中フラグ
  - `bossWarningStartTime: number` — WARNING開始タイムスタンプ
  - `screenShake: number` — 画面振動残り時間（ms）
  - `screenFlash: number` — 画面フラッシュ残り時間（ms）
  - `stageClearTime: number` — ステージクリア演出開始タイムスタンプ
- [x] **I-7.2** `styles.ts` に `ShakeAnimation` keyframes を追加
- [x] **I-7.3** `game-logic.ts` にボス登場演出のロジックを追加
  - bossScore 到達 → `bossWarning = true` → 2秒後にボススポーン
  - WARNING中は雑魚敵のスポーンを停止
- [x] **I-7.4** `game-logic.ts` にステージクリア演出のロジックを追加
  - ボス撃破 → 大量パーティクル生成 → ステージクリアボーナス加算
  - ボーナス = `1000 × stage + maxCombo × 10 + grazeCount × 5`
- [x] **I-7.5** `game-logic.ts` の敵撃破時にボス/ミッドボス用の強化エフェクトを追加
  - ボス撃破: screenShake = 500, screenFlash = 200, パーティクル20個
  - ミッドボス撃破: screenShake = 200, パーティクル10個
- [x] **I-7.6** `DeepSeaInterceptorGame.tsx` に WARNING 表示コンポーネントを追加
  - 画面中央に「⚠ WARNING ⚠」テキスト（赤色、点滅）
  - 画面端に赤いフラッシュ
- [x] **I-7.7** `DeepSeaInterceptorGame.tsx` に STAGE CLEAR 表示を追加
  - 画面中央に「STAGE CLEAR」+ ボーナススコア表示
- [x] **I-7.8** `DeepSeaInterceptorGame.tsx` にボスHPバーを追加
  - 画面上部にHPバー + ボス名を表示
  - HP残量に応じて色変化（緑→黄→赤）
- [x] **I-7.9** `DeepSeaInterceptorGame.tsx` に画面振動エフェクトを追加
  - `StyledGameContainer` に `screenShake > 0` の時 `ShakeAnimation` を適用
- [x] **I-7.10** `components/HUD.tsx` にグレイズ発生時の「GRAZE!」テキスト表示を追加
  - 0.3秒でフェードアウト

#### 検証タスク

- [x] **V-7.1** 既存テストが通ること
- [x] **V-7.2** TypeScript コンパイルが通ること
- [ ] **V-7.3** プレイテスト: bossScore到達時に WARNING が2秒間表示されること
- [ ] **V-7.4** プレイテスト: ボス登場時に画面上部にHPバーが表示されること
- [ ] **V-7.5** プレイテスト: ボス撃破時に連続爆発 + 画面振動 + フラッシュが発生すること
- [ ] **V-7.6** プレイテスト: ステージクリア時に「STAGE CLEAR」+ボーナス表示がされること
- [ ] **V-7.7** プレイテスト: グレイズ発生時に「GRAZE!」が一瞬表示されること
- [ ] **V-7.8** プレイテスト: コンボ10以上で HUD のコンボ表示が光ること

---

### 8. 環境ギミック

> 変更規模: 中 | 依存: #3（ステージ拡張） | 影響ファイル: types.ts, constants.ts, game-logic.ts, DeepSeaInterceptorGame.tsx

#### 実装タスク

- [x] **I-8.1** `types.ts` の `GameState` にギミック用フィールドを追加
  - `currentDirection: number` — 海流の方向（Stage 1）
  - `mines: Mine[]` — 機雷リスト（Stage 2）
  - `thermalVents: ThermalVent[]` — 熱水柱リスト（Stage 3）
  - `luminescence: boolean` — 発光状態（Stage 4）
  - `luminescenceEndTime: number`
  - `pressureBounds: { left: number; right: number }` — 水圧の壁（Stage 5）
- [x] **I-8.2** `types.ts` に `Mine`, `ThermalVent` 型を追加
- [x] **I-8.3** Stage 1 ギミック「海流」を純粋関数として実装
  - `applyCurrentGimmick(gd, now)` — プレイヤー・弾に横方向の力を適用
  - 10秒ごとに方向切替
- [x] **I-8.4** Stage 2 ギミック「機雷原」を実装
  - EnemyType に `'mine'` を追加
  - 機雷は `EntityFactory.enemy('mine', ...)` で生成
  - 弾で破壊可能（HP: 2）、接触でプレイヤーダメージ
- [x] **I-8.5** Stage 3 ギミック「熱水柱」を純粋関数として実装
  - `applyThermalVentGimmick(gd, now)` — 5秒ごとに熱水柱を噴出
  - 噴出1秒前に予告マーカー、幅40px、持続2秒
- [x] **I-8.6** Stage 4 ギミック「発光プランクトン」を実装
  - 光る粒子を生成、接触で3秒間画面が明るくなる
- [x] **I-8.7** Stage 5 ギミック「水圧」を純粋関数として実装
  - `applyPressureGimmick(gd, now)` — 30秒後から壁が収縮
  - 最小: 画面幅60%、ボス撃破で解除
- [x] **I-8.8** `game-logic.ts` の `updateFrame` にステージ別ギミック呼び出しを追加
  - `switch (stg.gimmick)` でギミック関数をディスパッチ
- [x] **I-8.9** `DeepSeaInterceptorGame.tsx` にギミックの視覚表現を追加
  - 海流: 半透明矢印、機雷: 専用スプライト、熱水柱: 赤い柱、水圧: 暗い壁

#### 検証タスク

- [ ] **V-8.1** 新規テスト: `applyCurrentGimmick` が正しい方向と強さで力を適用すること
- [ ] **V-8.2** 新規テスト: `applyThermalVentGimmick` が正しい間隔で熱水柱を生成すること
- [ ] **V-8.3** 新規テスト: `applyPressureGimmick` が正しい速度で壁を収縮させること
- [x] **V-8.4** TypeScript コンパイルが通ること
- [ ] **V-8.5** プレイテスト: Stage 1 で海流がプレイヤーと弾に影響すること
- [ ] **V-8.6** プレイテスト: Stage 2 で機雷が配置され、弾で破壊可能なこと
- [ ] **V-8.7** プレイテスト: Stage 3 で熱水柱が定期的に噴出し予告があること
- [ ] **V-8.8** プレイテスト: Stage 4 で発光プランクトンに触れると画面が明るくなること
- [ ] **V-8.9** プレイテスト: Stage 5 で画面が徐々に狭くなり、ボス撃破で解除されること

---

### 9. ミッドボス

> 変更規模: 中 | 依存: #3（ステージ拡張）, #2（ボス個性化の構造） | 影響ファイル: types.ts, constants.ts, entities.ts, enemy-ai.ts, game-logic.ts

#### 実装タスク

- [x] **I-9.1** `types.ts` の `EnemyType` に `'midboss1'〜'midboss5'` を追加
- [x] **I-9.2** `constants.ts` の `EnemyConfig` に midboss1〜midboss5 の設定を追加
  - HP: 対応ボスの40%、points: 対応ボスの50%
- [x] **I-9.3** `game-logic.ts` にミッドボススポーン条件を追加
  - `currentUi.score >= stg.bossScore * 0.5` で `midboss${stage}` をスポーン
  - 1ステージにつき1回のみ（`GameState.midBossSpawned: boolean`）
- [x] **I-9.4** `game-logic.ts` のミッドボス撃破時に確定アイテムドロップを追加
  - `life` or `power` をランダムで確定ドロップ
- [x] **I-9.5** `enemy-ai.ts` に各ミッドボスの攻撃パターンを追加
  - midboss1: ヤドカリ（3WAY弾）
  - midboss2: 双子エイ（左右交互弾）
  - midboss3: 溶岩カメ（8方向熱波）
  - midboss4: 発光イカ（拡散弾）
  - midboss5: 深海サメ（高速直線弾）
- [x] **I-9.6** `movement.ts` にミッドボス用の移動パターンを追加
- [x] **I-9.7** `components/EnemySprite.tsx` にミッドボスの見た目を追加

#### 検証タスク

- [ ] **V-9.1** 新規テスト: ミッドボスが bossScore の 50% で出現すること
- [ ] **V-9.2** 新規テスト: ミッドボス撃破時に確定アイテムがドロップすること
- [x] **V-9.3** TypeScript コンパイルが通ること
- [ ] **V-9.4** プレイテスト: 各ステージでミッドボスが出現すること
- [ ] **V-9.5** プレイテスト: ミッドボスが固有の攻撃パターンを使うこと
- [ ] **V-9.6** プレイテスト: ミッドボス撃破でアイテムが確定ドロップすること

---

### 10. 実績システム

> 変更規模: 小 | 依存: Phase 3 の他項目すべて | 影響ファイル: 新規 achievements.ts, hooks.ts, DeepSeaInterceptorGame.tsx

#### 実装タスク

- [x] **I-10.1** 新ファイル `achievements.ts` を作成
  - `Achievement` インターフェース定義
  - `SavedAchievementData` インターフェース定義
  - 10個の実績定義（条件関数付き）
- [x] **I-10.2** `achievements.ts` に localStorage 連携関数を追加
  - `loadAchievements(): SavedAchievementData`
  - `saveAchievements(data: SavedAchievementData): void`
  - `checkNewAchievements(stats: PlayStats, saved: SavedAchievementData): Achievement[]`
- [x] **I-10.3** `hooks.ts` のゲーム終了処理に実績チェックを追加
  - `event === 'gameover'` or `'ending'` の時に `checkNewAchievements` を呼び出し
  - 新規解除があれば `SavedAchievementData` を更新して保存
- [x] **I-10.4** `hooks.ts` にゲーム終了時の PlayStats 集計ロジックを追加
  - score, maxCombo, grazeCount, livesLost, playTime, difficulty, weaponType, stagesCleared を集計
- [x] **I-10.5** `DeepSeaInterceptorGame.tsx` のリザルト画面に新規実績表示を追加
  - 新規解除された実績のみ表示

#### 検証タスク

- [ ] **V-10.1** 新規テスト: 各実績の条件関数が正しい PlayStats で true を返すこと
- [ ] **V-10.2** 新規テスト: `checkNewAchievements` が既解除実績を除外すること
- [ ] **V-10.3** 新規テスト: localStorage への保存/読み込みが正しく動作すること
- [x] **V-10.4** TypeScript コンパイルが通ること
- [ ] **V-10.5** プレイテスト: ゲームクリア時に「初陣」実績が解除されること
- [ ] **V-10.6** プレイテスト: 解除済み実績が重複表示されないこと

---

## 総合検証

> 全 Phase の実装完了後に実施

### 統合テスト

- [x] **V-INT.1** 全テストスイートが通ること（`npm test`）
- [ ] **V-INT.2** TypeScript コンパイルが通ること（`npx tsc --noEmit`）
- [ ] **V-INT.3** ビルドが成功すること（`npm run build`）

### パフォーマンステスト

- [ ] **V-PERF.1** Stage 5 ボス戦（弾幕最大時）で安定して 30fps 以上を維持すること
- [ ] **V-PERF.2** ホーミング弾が大量に存在する状態でフレーム落ちしないこと
- [ ] **V-PERF.3** 環境ギミック（特に水圧の壁描画）でパフォーマンスに問題がないこと

### 通しプレイテスト

- [ ] **V-PLAY.1** 各難易度（CADET / STANDARD / ABYSS）で全5ステージ通しプレイ
- [ ] **V-PLAY.2** 各武器（トーピード / ソナーウェーブ / バイオミサイル）で通しプレイ
- [ ] **V-PLAY.3** コンボシステムが全ステージで正しく動作し、HUDに反映されること
- [ ] **V-PLAY.4** グレイズが全ステージで正しく判定されること
- [ ] **V-PLAY.5** 5種のボスが固有の攻撃パターンとフェーズ遷移を持つこと
- [ ] **V-PLAY.6** 5種のミッドボスが正しいタイミングで出現すること
- [ ] **V-PLAY.7** 5種の環境ギミックがそれぞれ正しく動作すること
- [ ] **V-PLAY.8** リザルト画面にすべての情報（スコア、コンボ、グレイズ、時間、ランク、実績）が表示されること
- [ ] **V-PLAY.9** 実績が正しい条件で解除され、localStorage に保存されること

### バランス確認

- [ ] **V-BAL.1** CADET 難易度が初心者でもクリア可能であること
- [ ] **V-BAL.2** STANDARD 難易度が適度な挑戦であること
- [ ] **V-BAL.3** ABYSS 難易度が上級者にとってやりごたえがあること
- [ ] **V-BAL.4** 3種の武器それぞれにクリアに支障がないこと（バランス崩壊がないこと）
- [ ] **V-BAL.5** コンボ倍率が強すぎず弱すぎず、スコアアタックの動機になること
- [ ] **V-BAL.6** 各ステージの難易度曲線が段階的に上昇すること
- [ ] **V-BAL.7** 1プレイが15〜25分に収まること（STANDARD基準）
