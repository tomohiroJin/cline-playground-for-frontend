# Non-Brake Descent ゲームフィール刷新 実装計画（P2〜P5: 演出拡充）

> 前提: P0+P1（GameClock / motion-scale / useReducedMotion）はマージ済み（PR #100）。本計画はその基盤を利用する。
> 仕様: `.docs/nbd-20260610-01/spec.md` §3.2〜3.5。

**Goal:** スピード感演出・エフェクト拡充・サウンド強化・グラフィック質感を追加し、既存メカニクス無改変で爽快感を一段引き上げる。

**並列戦略（2段構え）:**
- **Stage 1（並列・新規ファイルのみ）**: 各フェーズの純粋ロジック（`domain/services/`）+ テスト + 新規レンダラーコンポーネントを作成。既存ファイルは一切編集しない（config.ts も触らず、チューニング値は各モジュール内の名前付き定数で持つ）。→ 4並列で衝突ゼロ。
- **Stage 2（逐次・中核統合）**: `use-game-engine.ts` / `NonBrakeDescentGame.tsx` / `PlayScreen.tsx` / 既存レンダラー / オーディオアダプタへ統合。reduced-motion 連動。CI グリーン。

**全フェーズ共通の規約:** `any` 禁止、コメント日本語、マジックナンバーは名前付き定数、テストは AAA + `正常系/異常系/境界値` + 日本語名、co-located。`domain/services/` は外部依存なしの純粋関数。

---

## Stage 1: 並列作成（新規ファイルのみ）

### P2 スピード感演出
新規ファイル:
- `domain/services/speed-line-service.ts` + `.test.ts`
  - 型 `SpeedLine = { x; y; len; opacity; side: 'left' | 'right' }`
  - `spawnSpeedLines(existing, speed, rank, w, h)`: SpeedRank.HIGH 時のみ画面端に線を生成し、中央へ流す。上限本数あり。
  - `updateSpeedLines(lines)`: 各線を中央方向へ移動＋フェード、寿命切れを除去。
  - テスト: rank が HIGH 未満では生成しない / 更新で opacity が減衰し中央へ動く / 上限を超えない。
- `domain/services/camera-zoom-service.ts` + `.test.ts`
  - `cameraZoomForSpeed(speed, minSpeed, maxSpeed)`: 速度を 1.0〜1.05 のズーム率に線形補間（clamp）。
  - テスト: min で 1.0 / max で 1.05 / 範囲外は clamp。
- `renderers/effects/speed-lines-renderer.tsx`
  - `SpeedLinesRenderer({ lines }: { lines: readonly SpeedLine[] })`: SVG `<line>` を描画（既存 effects/index.tsx は編集しない・独立ファイル）。

### P3 エフェクト拡充
新規ファイル:
- `domain/services/trail-service.ts` + `.test.ts`
  - 型 `TrailSample = { x; y; opacity }`
  - `sampleTrail(existing, player, camY, rampH, maxLen)`: プレイヤー現在位置を先頭に追加し、古いものをフェード・上限超過を除去。
  - テスト: 追加で先頭に入る / maxLen を超えない / opacity が古いほど低い。
- `domain/services/squash-stretch-service.ts` + `.test.ts`
  - `squashStretch(player)`: `{ scaleX; scaleY }` を返す。上昇/落下中は縦長、着地直後は横潰れ。`scaleX*scaleY ≈ 1` を保つ（体積保存）。
  - テスト: 地上静止で {1,1} / 落下中は scaleY>1 / 着地直後は scaleX>1。
- `domain/services/dust-service.ts` + `.test.ts`
  - `createDust(x, y, count)`: `Particle[]`（既存 `types.ts` の `Particle` を import 利用）。地面に沿って横へ広がる土煙。
  - テスト: count 個生成 / 各粒子の life>0 / 横方向に分散。
- `renderers/effects/player-trail-renderer.tsx`
  - `PlayerTrailRenderer({ trail }: { trail: readonly TrailSample[] })`: 残像を SVG `<rect>`/`<circle>` で半透明描画。

### P4 サウンド強化
新規ファイル:
- `infrastructure/audio/bgm-profile.ts` + `.test.ts`
  - 型 `BgmProfile = { notes: ReadonlyArray<readonly [number, number]>; interval: number }`
  - `selectBgmProfile(rank)`: SpeedRank に応じてテンポ（interval）と音列を返す。HIGH ほど速く・音数多く。
  - テスト: 各 rank で異なる interval / HIGH が最短 interval / notes が空でない。

### P5 グラフィック質感
新規ファイル:
- `domain/services/combo-tint-service.ts` + `.test.ts`
  - `comboTintIntensity(combo, comboTimer)`: コンボ数とタイマー残量から 0..1 の画面ティント強度を返す。combo<2 は 0。
  - テスト: combo<2 で 0 / combo 増で増加 / 上限 1.0 を超えない / comboTimer=0 で 0。
- `renderers/effects/combo-tint-renderer.tsx`
  - `ComboTintRenderer({ intensity }: { intensity: number })`: `DangerVignette` と同様の DOM 全面オーバーレイ（金色系の淡いティント）。intensity<閾値 で非表示。

---

## Stage 2: 逐次統合

### 2a. オーディオ拡張
- `infrastructure/audio/audio-port.ts`: `AudioPort` に `setSpeedRank(rank: number): void`（rank 連動 BGM 切替）を追加。
- `infrastructure/audio/web-audio-adapter.ts`: `selectBgmProfile` を用いて rank 連動 BGM を実装。`sounds` に着地音 `land` を追加。`setSpeedRank` で現在 rank を保持し BGM パターンを切替。
- 後方互換: 既存 `startBGM`/`stopBGM` は維持。

### 2b. ゲームループ統合（`use-game-engine.ts`）
- 新規 state/ref: `speedLines`、`playerTrail`、`dust`（particles に統合 or 別配列）。`comboTint`/`cameraZoom` は描画時に純粋関数から算出（state 不要）。
- ループ内更新: `updateSpeedLines`/`spawnSpeedLines`、`sampleTrail`、dust の更新。reduced-motion 有効時はスポーンを抑制（`motionScaleRef`/`useReducedMotion` を流用）。
- 着地検出: プレイヤーが空中→接地に変化した tick で `createDust` + `Audio.play('land')`。スクワッシュは描画時算出。
- rank 変化検出: 速度ランクが変わった tick で `Audio.setSpeedRank(rank)`。
- `resetGameState` で新規配列を初期化（P0 の `clockRef` リセットと同様に漏れなく）。
- 戻り値に `speedLines`/`playerTrail` を追加。

### 2c. 描画統合（`NonBrakeDescentGame.tsx` / `PlayScreen.tsx`）
- `PlayScreen` に props 追加（`speedLines`/`playerTrail`/`cameraZoom`/`comboTint` 等）。
- SVG ワールド群に `transform: scale(cameraZoom)`（中心基準）を適用。
- `SpeedLinesRenderer`/`PlayerTrailRenderer`/`ComboTintRenderer` を描画。
- `PlayerRenderer` にスクワッシュ&ストレッチ（`squashStretch`）を適用。

### 2d. P5 質感ポリッシュ（既存レンダラー編集）
- `renderers/entities/index.tsx` の `PlayerRenderer`/`RampRenderer`/`ObstacleRenderer` に光/影/グラデーション（SVG filter `feGaussianBlur` グロー、drop-shadow）を追加。
- `renderers/environment/index.tsx` の `CloudRenderer`/`BuildingRenderer` のパララックス深度を多層化。

### 2e. アクセシビリティ
- 速度線・トレイル・ティント・カメラズーム強度を reduced-motion 有効時に抑制/無効化（`resolveMotionScale` 流用。0 で無効、1 で通常）。

### 2f. CI
- `npm run ci` グリーン。新規 `domain/services/*` と `bgm-profile` のカバレッジ 90%+。

---

## テスト方針
- Stage 1 の純粋ロジックは全て TDD（Red→Green）。境界値（rank 閾値・上限本数・combo 閾値・ズーム clamp）を網羅。
- 新規レンダラーは描画スモークテスト（任意・軽め）。
- 既存テスト全パス維持。各 Stage 末で `npm run ci`。

## 非対象（YAGNI）
- アート全面刷新（エンティティ再デザイン）。
- 新規メカニクス・難易度変更。
- 既存 sim ロジックの改変。

## 並列実行時の衝突回避（重要）
- Stage 1 の4エージェントは**新規ファイルのみ**作成し、`config.ts`/`types.ts`/`use-game-engine.ts`/`PlayScreen.tsx`/既存レンダラー/`audio-port.ts`/`web-audio-adapter.ts` を**編集しない**。
- 新規型は各サービスモジュールから export（`types.ts` に追記しない）。
- チューニング値は各モジュール内の名前付き定数（`config.ts` に追記しない）。
- 既存ファイルへの編集は全て Stage 2（逐次）で行う。
