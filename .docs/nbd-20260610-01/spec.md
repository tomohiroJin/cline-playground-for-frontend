# Non-Brake Descent ゲームフィール刷新 設計仕様書

- 対象ゲーム: `src/features/non-brake-descent/`
- 作成日: 2026-06-10
- ブランチ: `feature/nbd-gameplay-brushup-20260610`
- 目的: ゲーム内容（メカニクスのバランス）ではなく、**手触り・爽快感（ゲームフィール）** を刷新し、プレイ体験のインパクトを最大化する。SNS連携等の外部機能は対象外。

## 1. 背景とゴール

Non-Brake Descent は「ブレーキなしで坂道を高速降下し続けるランニングアクション」。
既に以下のフィードバック演出は実装済み:

- パーティクル / ジェットパーティクル / スコアポップアップ / ニアミス演出
- 画面振動（shake, 減衰0.88）/ トランジション演出 / 危険ビネット
- 効果音（jump/score/hit/death/enemyKill/rampChange/nearMiss/combo）/ 簡易BGM・各種メロディ

伸びしろ（本仕様で強化する点）:

1. **ヒットストップが無い** — 衝突・撃破の瞬間の「溜め」が欠如
2. **スローモーが無い** — ニアミスの危うさ演出が弱い
3. **スピード感の視覚演出が弱い** — 高速時の没入感不足
4. **細かいフィードバックが薄い** — 着地・火花・残像・スクワッシュ等が未実装
5. **サウンドが単純** — BGMが4音ループ固定、速度/コンボに非連動
6. **グラフィック質感** — 光/影/グラデ等の作り込み余地

### 既存メカニクスは維持

スコア計算・難易度バランス・障害物テーブル等の**ゲームバランスは変更しない**。本仕様は演出（フィール）層に限定する。

## 2. アーキテクチャ方針（タイムスケール層）

現状のゲームループは `presentation/hooks/use-game-engine.ts` 内の単一 `setInterval(1000/60)`。
ここを全面リライトせず、**最小侵襲**でタイムスケール制御を導入する。

### 2.1 GameClock（新規・純粋ロジック・TDD対象）

```typescript
// application/game-loop/game-clock.ts
export interface GameClock {
  readonly hitstopFrames: number;  // 完全停止する残り tick 数（ヒットストップ）
  readonly slowMoFrames: number;   // スローモー残り tick 数
  readonly slowMoFactor: number;   // 何 tick に1回 sim を進めるか（例: 3）
  readonly tickCounter: number;    // スローモー間引き判定用カウンタ
}

export const createGameClock: () => GameClock;

// ヒットストップ発動（既存値より長ければ上書き = max 合成）
export const triggerHitstop: (clock: GameClock, frames: number) => GameClock;

// スローモー発動（frames tick の間、factor 間引き）
export const triggerSlowMo: (clock: GameClock, frames: number, factor: number) => GameClock;

// 1 real-tick 進める。シミュレーションを進めるべきか返す
export const advanceClock: (clock: GameClock) => {
  readonly clock: GameClock;
  readonly shouldStepSim: boolean;
};
```

**advanceClock の判定規則**:

1. `hitstopFrames > 0` → `hitstopFrames--`、`shouldStepSim = false`（完全停止）
2. else `slowMoFrames > 0` → `slowMoFrames--`、`tickCounter++`、
   `shouldStepSim = (tickCounter % slowMoFactor === 0)`（間引きで bullet-time）
3. else → `shouldStepSim = true`（通常）

**設計意図**: スローモーを「速度を 0.3 倍」ではなく「N tick に1回 sim を進める」方式にすることで、
`jumpCD` やコンボタイマー等のフレームベース整数計算を壊さず、bullet-time の質感を出す。

### 2.2 ループへの配線（use-game-engine.ts）

```typescript
const clockRef = useRef<GameClock>(createGameClock());

// ループ先頭
const { clock, shouldStepSim } = advanceClock(clockRef.current);
clockRef.current = clock;
if (!shouldStepSim) {
  // 停止/間引き tick: 振動の減衰のみ進め、sim 本体はスキップ
  setShake(s => Math.max(0, s * Config.animation.shakeDecay));
  return;
}
// 以降は既存の sim 更新ロジック（変更なし）
```

イベント発生箇所で `clockRef.current = triggerHitstop(...)` / `triggerSlowMo(...)` を呼ぶ。

**設計意図**: 既存 sim ロジックを一切書き換えず、先頭ゲートの追加とトリガー呼び出しのみで完結させる（リスク最小化）。

### 2.3 トリガー対応表

| イベント | 効果 | パラメータ（初期値・調整可） |
|---------|------|------------------------|
| 敵撃破（onEnemyKill） | ヒットストップ | 4 frames |
| プレイヤー死亡（handleDeath 冒頭） | ヒットストップ | 6 frames |
| ニアミス（nearMiss 判定） | スローモー | 12 frames / factor 3 |
| アイテム取得（onScore） | ヒットストップ（任意・弱） | 2 frames |

数値は `Config` に集約し、調整しやすくする（マジックナンバー禁止）。

## 3. 演出機能の詳細（5本柱）

### 3.1 ヒットストップ & スローモー
2章の GameClock で実現。トリガーは 2.3 の通り。

### 3.2 スピード感演出
- **速度線（スピードライン）**: 速度ランク HIGH 時、画面端から中央へ流れる線を描画。生成・更新ロジックは純粋関数化（テスト対象）。
- **カメラ微ズーム**: 高速時にワールドコンテナへ僅かな `transform: scale`（例: 1.0 → 1.04）。速度に連動した補間。
- **エッジビネット強化**: 高速・危険時に画面外周の暗化/着色を多段化（既存 danger vignette を拡張）。
- **加速時の流線**: 加速入力中にエッジへ短い流線を追加。

### 3.3 エフェクト拡充
- **着地土煙**: ジャンプ着地（didLand 検出）時に dust バースト粒子。
- **ニアミス火花**: 既存 NearMissEffect にスパーク粒子を追加。
- **高速トレイル残像**: 高速時にプレイヤーの残像を数フレーム分サンプリング描画（サンプリングロジックは純粋関数化）。
- **スクワッシュ & ストレッチ**: ジャンプ/着地でプレイヤーを縦横変形（CSS transform）。
- **粒子グロー**: 既存粒子に加算合成風の発光（CSS `mix-blend-mode` / box-shadow）。

### 3.4 サウンド強化
- **速度ランク連動BGM**: LOW/MID/HIGH でテンポ・レイヤーを変化させる。どのBGMパターンを選ぶかは純粋関数 `selectBgmProfile(rank)` 等で表現（テスト対象）。
- **コンボ段階上昇音階**: 既存 `playCombo(level)` を段階的に拡張（コンボ数で音階上昇）。
- **SFX追加**: 着地音、トレイル/加速音、ニアミス音の質感改善。
- インターフェースは既存 `AudioPort` を拡張（後方互換維持）。

### 3.5 グラフィック質感（演出強化中心 / アート全面刷新はしない）
- CSS の光/影/グラデーションを強化（プレイヤー・ランプ・障害物にグロー・影）。
- **コンボ時の画面ティント/フラッシュ**: コンボ段階で画面に淡い色被せ。
- **背景パララックス強化**: 雲・ビルの奥行き表現を多層化。

## 4. プレゼンテーション構成

新規UI状態は既存 `UIState`（`application/game-loop/game-state.ts`）に追加:

```typescript
interface UIState {
  // 既存
  particles; jetParticles; scorePopups; nearMissEffects; clouds; shake; transitionEffect;
  // 追加
  speedLines: readonly SpeedLine[];
  dustParticles: readonly Particle[];
  playerTrail: readonly TrailSample[];
  comboTint: number;     // 0..1 コンボ演出の強度
  cameraZoom: number;    // 1.0.. ワールド拡大率
}
```

描画は既存 `renderers/{effects,entities,environment,ui}` 構造を踏襲して新コンポーネントを追加:
- `effects/`: SpeedLines, PlayerTrail, ComboTint, DustParticles
- `entities/`: プレイヤーのスクワッシュ&ストレッチ対応

## 5. テスト方針（TDD 厳守）

| 対象 | 種別 | 目標 |
|------|------|------|
| `game-clock.ts` | 単体（完全網羅） | 停止カウントダウン/スローモー間引き/トリガー遷移/境界値 |
| 速度線生成・トレイルサンプリング・BGMプロファイル選択 | 単体 | 純粋関数として網羅 |
| 新レンダラーコンポーネント | 描画スモーク | 表示崩れ無しの確認 |
| 既存テスト | 回帰 | 全パス維持 |

- Red → Green → Refactor を厳守。純粋ロジックは先にテストを書く。
- カバレッジ: 新規ドメイン/アプリ層ロジック 90%+、プレゼンテーション 70%+。
- 各フェーズ末で `npm run ci`（lint:ci + typecheck + test + build）グリーン必須。

## 6. アクセシビリティ

`prefers-reduced-motion: reduce` を尊重する。ON 時は以下を減衰/無効化:
- 画面振動の強度低減、ヒットストップ/スローモーの軽量化、速度線・トレイル・ティントの抑制。

判定はメディアクエリ由来の「motion intensity」係数として一元管理し、各演出が参照する。
（プロジェクト UI 規約「`prefers-reduced-motion` でオプトアウト可能」に準拠）

## 7. フェーズ分割（段階リリース）

| Phase | 内容 |
|-------|------|
| **P0** | GameClock 基盤（TDD）＋敵撃破・死亡ヒットストップ配線 |
| **P1** | ニアミス bullet-time（スローモー）＋ `prefers-reduced-motion` 基盤 |
| **P2** | スピード感（速度線・カメラズーム・エッジ演出） |
| **P3** | エフェクト拡充（土煙・トレイル・スクワッシュ&ストレッチ・火花・グロー） |
| **P4** | サウンド強化（動的BGM・コンボ音階・SFX追加） |
| **P5** | グラフィック質感（光/影/グラデ・コンボティント・パララックス強化） |

各フェーズは独立して `npm run ci` グリーン＋コミット可能な単位とする。

## 8. 非対象（YAGNI / スコープ外）

- ゲームバランス・難易度・スコア計算式の変更
- アート全面刷新（エンティティ/背景の再デザイン）
- SNS連携・ランキング共有等の外部機能
- ゲームループの rAF 全面リライト（C案は不採用）
- 新規メカニクス（ダッシュ・ゲージ技等の戦略要素追加）

## 9. リスクと対策

| リスク | 対策 |
|--------|------|
| ループゲート追加で既存挙動が変わる | sim 本体は無改変。ゲートは「スキップするか否か」のみ。回帰テストで担保 |
| ヒットストップ中に入力/タイマーがズレる | 停止 tick は sim 全体をスキップするため内部的に時間が止まり整合 |
| 演出過多で可読性低下（チラつき） | `prefers-reduced-motion` 対応＋強度を Config 集約で調整可能に |
| パフォーマンス低下（粒子/残像増） | 上限数を Config で制御。プロファイルで確認 |
