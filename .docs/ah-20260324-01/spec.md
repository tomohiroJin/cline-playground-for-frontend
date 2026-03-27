# Step 2: CPU AI のキャラ個性化 — 仕様書

## S-01: 型定義

### AiPlayStyle 型

```typescript
// core/story-balance.ts に追加
type AiPlayStyle = {
  /** 横方向のターゲットオフセット傾向（-1.0 左寄せ 〜 0 中央 〜 1.0 右寄せ） */
  sidePreference: number;
  /** ターゲット位置の横ブレの振幅（px）— 揺さぶり */
  lateralOscillation: number;
  /** ターゲット位置の横ブレの周期（ms） */
  lateralPeriod: number;
  /** 前後のポジショニング（0: 守備的 〜 1: 攻撃的） */
  aggressiveness: number;
  /** スコア差に応じた適応度（0: 適応なし 〜 1: 高適応） */
  adaptability: number;
};
```

### AiBehaviorConfig 拡張

```typescript
// 既存フィールドに追加
type AiBehaviorConfig = {
  maxSpeed: number;
  predictionFactor: number;
  wobble: number;
  skipRate: number;
  centerWeight: number;
  wallBounce: boolean;
  playStyle?: AiPlayStyle;  // 新規: オプショナル（後方互換）
};
```

### DEFAULT_PLAY_STYLE

```typescript
const DEFAULT_PLAY_STYLE: AiPlayStyle = {
  sidePreference: 0,
  lateralOscillation: 0,
  lateralPeriod: 0,
  aggressiveness: 0.5,
  adaptability: 0,
};
```

---

## S-02: キャラクター AI プロファイル

### ファイル: `core/character-ai-profiles.ts`

キャラクター ID → `AiPlayStyle` のマッピングを提供する。

### 各キャラクターの AI プロファイル詳細

#### ヒロ（hiro）— ストレートシューター

```typescript
{
  sidePreference: 0,       // 左右の偏りなし
  lateralOscillation: 0,   // 揺さぶりなし
  lateralPeriod: 0,        // 揺さぶりなし
  aggressiveness: 0.7,     // 前に出る — 積極的に打ち返す
  adaptability: 0.2,       // 低適応 — 素直な性格通り、あまり戦略を変えない
}
```

**動きの特徴**: まっすぐパックに向かい、正面から力強く打ち返す。前に出がちなので隙が生まれやすいが、パックが来た時の反応は速い。

#### ミサキ（misaki）— テクニシャン

```typescript
{
  sidePreference: 0,       // 左右の偏りなし
  lateralOscillation: 40,  // 大きな揺さぶり
  lateralPeriod: 2000,     // 2秒周期で左右に揺れる
  aggressiveness: 0.5,     // 中間的なポジション
  adaptability: 0.3,       // 中低適応 — ある程度は戦略を変える
}
```

**動きの特徴**: 常に左右に揺れながらポジションを取り、パックを斜めの角度で打ち返す。予測しづらい返球になるが、揺さぶり中に隙ができることもある。

#### タクマ（takuma）— パワーバウンサー

```typescript
{
  sidePreference: 0,       // 左右の偏りなし
  lateralOscillation: 0,   // 揺さぶりなし
  lateralPeriod: 0,        // 揺さぶりなし
  aggressiveness: 0.2,     // ゴール前に構える — 守備重視
  adaptability: 0.1,       // 低適応 — 部長としての貫禄、戦略は変えない
}
```

**動きの特徴**: ゴール近くにどっしり構え、壁反射予測（wallBounce）と組み合わせて確実に打ち返す。攻めには出ないが、守りは鉄壁。

#### ユウ（yuu）— アナライザー

```typescript
{
  sidePreference: 0,       // 左右の偏りなし
  lateralOscillation: 20,  // 控えめな揺さぶり
  lateralPeriod: 3000,     // 3秒周期（ゆっくりした分析的な動き）
  aggressiveness: 0.4,     // やや守備的
  adaptability: 0.8,       // 高適応 — 負けているとデータから学んで強くなる
}
```

**動きの特徴**: 序盤はおとなしく様子見だが、スコア差がつくと急に精度と速度が上がる。「データ不足」から「データ収集完了」への変化。

#### ルーキー（rookie）— ビギナー

```typescript
{
  sidePreference: 0,
  lateralOscillation: 0,
  lateralPeriod: 0,
  aggressiveness: 0.3,     // やや消極的
  adaptability: 0,         // 適応なし — 初心者は戦略を変えない
}
```

#### レギュラー（regular）— オールラウンダー

```typescript
{
  sidePreference: 0,
  lateralOscillation: 10,  // わずかな揺さぶり
  lateralPeriod: 4000,     // ゆっくり
  aggressiveness: 0.5,     // バランス型
  adaptability: 0.2,       // 低適応
}
```

#### エース（ace）— エリート

```typescript
{
  sidePreference: 0,
  lateralOscillation: 15,  // 控えめだが正確な揺さぶり
  lateralPeriod: 2500,     // 中速
  aggressiveness: 0.6,     // やや攻撃的
  adaptability: 0.4,       // 中適応
}
```

---

## S-03: AI ロジック拡張仕様

### 揺さぶり（lateralOscillation）

```typescript
// calculateTargetWithBehavior 内
if (playStyle.lateralOscillation > 0 && playStyle.lateralPeriod > 0) {
  const oscillation = Math.sin(now * Math.PI * 2 / playStyle.lateralPeriod)
                      * playStyle.lateralOscillation;
  predictedX += oscillation;
}
```

- パックが CPU 側に向かっている時のみ適用
- パックが来ていない時（待機中）は揺さぶりなし
- `lateralOscillation = 0` の場合は完全にスキップ

### アグレッシブネス

```typescript
// calculateTargetWithBehavior 内、Y 座標計算時
const DEFENSIVE_Y = 80;                    // ゴール近く
const AGGRESSIVE_Y = H / 2 - 100;         // 中央ライン近く
const baseY = DEFENSIVE_Y + (AGGRESSIVE_Y - DEFENSIVE_Y) * playStyle.aggressiveness;
const targetY = Math.min(puck.y + 20, baseY);
```

- パックが CPU 側に向かっている時のみ適用
- `aggressiveness = 0` → Y = 80（ゴール前に構える）
- `aggressiveness = 1` → Y = H/2 - 100（中央ラインまで前に出る）
- パック位置よりは前に出ない（パックの後ろに回り込まない）

### 適応度（adaptability）

```typescript
// updateWithBehavior 内、config の値を動的に調整
function applyAdaptability(
  config: AiBehaviorConfig,
  scoreDiff: number  // CPU が負けている点差（0 以上）
): AiBehaviorConfig {
  const playStyle = config.playStyle ?? DEFAULT_PLAY_STYLE;
  if (playStyle.adaptability <= 0 || scoreDiff <= 0) return config;

  const boost = playStyle.adaptability * Math.min(scoreDiff, 3) / 3;
  return {
    ...config,
    maxSpeed: config.maxSpeed * (1 + boost * 0.2),        // 最大 +20%
    predictionFactor: config.predictionFactor * (1 + boost * 0.3),  // 最大 +30%
    wobble: config.wobble * Math.max(0.5, 1 - boost * 0.5),        // 最大 -50%
  };
}
```

- `scoreDiff` は「CPU のスコア - プレイヤーのスコア」の絶対値（CPU が負けている場合のみ正）
- `scoreDiff` の上限は 3（3 点差以上でも同じ boost）
- `adaptability = 0` → 一切変化なし
- `adaptability = 1, scoreDiff = 3` → maxSpeed +20%, predictionFactor +30%, wobble -50%

### スコア差の取得方法

現在の `updateWithBehavior` は `GameState` を受け取るが、スコア情報は含まれていない。
新規パラメータ `scoreDiff?: number` を追加する（オプショナル、後方互換）。

```typescript
updateWithBehavior(
  game: GameState,
  config: AiBehaviorConfig,
  now: number,
  consts: GameConstants = CONSTANTS,
  scoreDiff?: number  // 新規: CPU が負けている点差
): CpuUpdateResult | null
```

呼び出し元（`useGameLoop`）でスコア差を計算して渡す。

---

## S-04: ストーリーバランス統合仕様

### STAGE_BALANCE_MAP への playStyle 追加

```typescript
const STAGE_BALANCE_MAP: Record<string, StageBalanceConfig> = {
  '1-1': {
    ai: {
      maxSpeed: 1.6,
      predictionFactor: 0.7,
      wobble: 53,
      skipRate: 0.1,
      centerWeight: 0.8,
      wallBounce: false,
      playStyle: CHARACTER_AI_PROFILES['hiro'],  // ヒロの個性
    },
    // ...
  },
  '1-2': {
    ai: {
      // ...
      playStyle: CHARACTER_AI_PROFILES['misaki'],  // ミサキの個性
    },
    // ...
  },
  '1-3': {
    ai: {
      // ...
      playStyle: CHARACTER_AI_PROFILES['takuma'],  // タクマの個性
    },
    // ...
  },
};
```

### AI_BEHAVIOR_PRESETS への playStyle 追加

```typescript
export const AI_BEHAVIOR_PRESETS: Record<Difficulty, AiBehaviorConfig> = {
  easy: {
    // ...既存パラメータ
    playStyle: CHARACTER_AI_PROFILES['rookie'],
  },
  normal: {
    // ...既存パラメータ
    playStyle: CHARACTER_AI_PROFILES['regular'],
  },
  hard: {
    // ...既存パラメータ
    playStyle: CHARACTER_AI_PROFILES['ace'],
  },
};
```

---

## S-05: ゲームループ統合仕様

### useGameLoop からのスコア差渡し

```typescript
// useGameLoop.ts 内の AI 更新部分
const scoreDiff = Math.max(0, scoreRef.current.p - scoreRef.current.c);
// scoreDiff > 0 → CPU が負けている
const aiResult = CpuAI.updateWithBehavior(game, aiConfig, now, consts, scoreDiff);
```

- `scoreRef.current.p` = プレイヤーのスコア（CPU から見て「相手のスコア」）
- `scoreRef.current.c` = CPU のスコア
- `scoreDiff = p - c` → 正の値なら CPU が負けている

---

## S-06: テスト仕様

### character-ai-profiles.test.ts

| テスト名 | 検証内容 |
|---------|---------|
| 全キャラクターの AI プロファイルが定義されている | hiro, misaki, takuma, yuu, rookie, regular, ace |
| パラメータが有効範囲内 | lateralOscillation >= 0, aggressiveness 0-1, adaptability 0-1 |
| DEFAULT_PLAY_STYLE が正しい | sidePreference=0, lateralOscillation=0, aggressiveness=0.5, adaptability=0 |
| ヒロは揺さぶりなし | lateralOscillation === 0 |
| ミサキは大きな揺さぶり | lateralOscillation > 20 |
| タクマは守備的 | aggressiveness < 0.3 |
| ユウは高適応 | adaptability > 0.5 |

### ai.test.ts（プレイスタイル拡張分）

| テスト名 | 検証内容 |
|---------|---------|
| playStyle 未設定時は既存動作と同一 | calculateTarget の結果が変わらない |
| lateralOscillation > 0 でターゲット X が変動する | 異なる `now` 値で X が異なる |
| lateralOscillation = 0 でターゲット X が安定 | 同条件で X が一定 |
| aggressiveness = 0 でゴール近くに留まる | targetY が小さい値 |
| aggressiveness = 1 で前に出る | targetY が大きい値 |
| adaptability > 0 でスコア差に応じて速度が上がる | scoreDiff > 0 で maxSpeed が増加 |
| adaptability = 0 でスコア差に無関係 | scoreDiff があっても速度不変 |
| scoreDiff = 0 で適応が発動しない | boost が 0 |
