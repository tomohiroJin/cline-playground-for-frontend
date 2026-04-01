# Air Hockey ペアマッチ品質向上 — 仕様書

## 1. ally CPU の AI プロファイル修正（SR-3）

### 1.1 現状の問題

`useGameLoop.ts` 内で ally CPU の AI 設定を構築する際、`buildAllyAiConfig(difficulty, characterId)` に
`allyCharacterId` が正しく渡されていない。結果として `getCharacterAiProfile(undefined)` が呼ばれ、
`DEFAULT_PLAY_STYLE` が適用される。

### 1.2 修正仕様

```typescript
// useGameLoop.ts 内の ally AI 設定構築（あるべき姿）
const allyAiConfig = buildAllyAiConfig(
  config.difficulty,
  config.allyCharacterId   // ← ここが undefined にならないようにする
);

// enemy AI 設定構築（参考: 正しく動作している）
const enemy1AiConfig = buildFreeBattleAiConfig(
  config.difficulty,
  config.enemyCharacter1Id
);
const enemy2AiConfig = buildFreeBattleAiConfig(
  config.difficulty,
  config.enemyCharacter2Id
);
```

### 1.3 検証ポイント

- P2 に「タクマ」を選んだ場合: aggressiveness=0.2（守備的）が反映されること
- P2 に「ヒロ」を選んだ場合: aggressiveness=0.7→0.5（上限キャップ）が反映されること
- P2 に「ユウ」を選んだ場合: adaptability=0.8 が反映されること

## 2. sidePreference ロジック

### 2.1 パラメータ定義

```typescript
// AiPlayStyle 内の既存フィールド
sidePreference: number;  // -1.0（左寄り）〜 0.0（中央）〜 1.0（右寄り）
```

### 2.2 アルゴリズム

```typescript
// ai.ts: calculateTargetWithBehavior 内
const SIDE_OFFSET_MAX = 75; // px（フィールド幅 600px の 12.5%）

function applySidePreference(
  targetX: number,
  sidePreference: number,
  fieldWidth: number
): number {
  const offset = sidePreference * SIDE_OFFSET_MAX;
  const centerX = fieldWidth / 2;
  // 中央からの距離に応じて効果を減衰（端に寄りすぎない）
  const distFromCenter = Math.abs(targetX - centerX);
  const maxDist = fieldWidth / 2 - MALLET_RADIUS;
  const dampingFactor = 1 - (distFromCenter / maxDist) * 0.5;
  const adjustedX = targetX + offset * dampingFactor;
  return clamp(adjustedX, MALLET_RADIUS, fieldWidth - MALLET_RADIUS);
}
```

### 2.3 sidePreference と lateralOscillation の適用順序（#7）

両パラメータが X 座標に影響するため、適用順序を明確にする。

```typescript
// ai.ts: calculateTargetWithBehavior 内のX座標計算パイプライン
//
// Step 1: 基本ターゲット X を計算（パック追跡 or 守備ポジション）
// Step 2: sidePreference を適用（基本ターゲットにオフセット）
// Step 3: lateralOscillation を適用（sidePreference 適用後に揺さぶり）
// Step 4: clamp で壁境界内に収める（最終段）
//
// この順序により、sidePreference が「ホームポジション」を決め、
// oscillation がその周りで揺さぶりを行う。
// 壁際で oscillation が片方向のみ効く問題は clamp で安全に処理される。
```

> **設計判断**: oscillation の振幅が sidePreference と累積して壁にへばりつく場合、
> clamp が最終段で効くため安全。ただし壁際では振幅が非対称になるのは許容する
> （物理的にも壁際では移動が制限されるのが自然）。

### 2.4 ally CPU の Y 軸反転時の sidePreference 処理（R-4）

ally CPU は `updateExtraMalletAI` 内で Y 軸を反転して AI 計算するため、
sidePreference の左右も反転する必要がある。

```typescript
// pair-match-logic.ts: updateExtraMalletAI 内
// ally（player チーム）の場合
const effectiveSidePreference = team === 'player'
  ? playStyle.sidePreference * -1  // Y 軸反転に伴い左右も反転
  : playStyle.sidePreference;
```

**理由**: ally は画面下半分にいるが、AI は CPU 視点（上半分）で計算して結果を反転している。
左右が鏡像になるため、sidePreference も反転しないと意図と逆方向に寄る。

### 2.3 キャラ別 sidePreference 設定

| キャラ | sidePreference | 理由 |
|--------|---------------|------|
| ヒロ | 0.0 | ストレートシューター、中央基調 |
| ミサキ | 0.3 | テクニシャン、やや右寄りで角度をつける |
| タクマ | 0.0 | 守備的、ゴール中央を固守 |
| ユウ | -0.2 | アナライザー、やや左寄り |
| ルーキー | 0.0 | 中立 |
| レギュラー | 0.1 | わずかに右寄り |
| エース | -0.1 | わずかに左寄り |

## 3. CPU 戦略の深化

### 3.1 型定義の拡張

```typescript
// character-ai-profiles.ts
export type AiPlayStyle = {
  // 既存
  sidePreference: number;
  lateralOscillation: number;
  lateralPeriod: number;
  aggressiveness: number;
  adaptability: number;

  // 新規追加
  defenseStyle: 'center' | 'wide' | 'aggressive';
  deflectionBias: number;     // -1.0（ストレート）〜 1.0（バウンス）
  reactionDelay: number;      // ms（0: 即座、200: やや遅い、500: 遅い）
  teamRole: 'attacker' | 'defender' | 'balanced';
};
```

### 3.2 守備パターン（defenseStyle）

パックが**相手陣地にある時のみ**の AI ポジショニングを制御。

> **#6 優先ルール**: `defenseStyle` はパックが相手陣地にある時のみ適用する。
> パックが自陣にある時は従来の `aggressiveness` ベースのターゲット計算が優先。
> これにより aggressiveness と defenseStyle の競合を回避する。

```typescript
// ai.ts: calculateTargetWithBehavior 内の適用順序
function calculateTarget(puck, config, playStyle) {
  if (puckInOpponentHalf(puck, team)) {
    // Phase 1: defenseStyle で守備ポジションを決定
    return applyDefenseStyle(playStyle.defenseStyle, puck, fieldCenter, goalLineY);
  } else {
    // Phase 2: パックが自陣 → aggressiveness ベースの攻撃/追跡ロジック（既存）
    return calculateAggressiveTarget(puck, config, playStyle.aggressiveness);
  }
}
```

**center（中央守備）**:
```typescript
// パックが相手陣地にある時、ゴール中央付近に戻る
if (puckInOpponentHalf) {
  targetX = fieldCenter;
  targetY = goalLineY + MALLET_RADIUS * 2;
}
```

**wide（ワイド守備）**:
```typescript
// パックの X 座標を追跡しつつ、ゴールラインに近い位置を維持
if (puckInOpponentHalf) {
  targetX = puck.x * 0.6 + fieldCenter * 0.4; // パック追従 60%
  targetY = goalLineY + MALLET_RADIUS * 2;
}
```

**aggressive（前線守備）**:
```typescript
// パックが相手陣地にある時も中盤付近に留まる
if (puckInOpponentHalf) {
  targetX = puck.x * 0.3 + fieldCenter * 0.7;
  targetY = midFieldY; // 中盤ライン
}
```

### 3.3 打ち返し角度（deflectionBias）

マレットとパックの衝突解消時に、反射方向にバイアスをかける。

```typescript
// entities.ts: resolveMalletPuckOverlap 内（または新関数）
function applyDeflectionBias(
  normalX: number,
  normalY: number,
  deflectionBias: number
): { nx: number; ny: number } {
  // bias > 0: 法線を壁方向（水平）に傾ける
  // bias < 0: 法線をゴール方向（垂直）に傾ける
  const angle = Math.atan2(normalY, normalX);
  const biasAngle = deflectionBias * (Math.PI / 6); // 最大 ±30°
  const newAngle = angle + biasAngle;
  return {
    nx: Math.cos(newAngle),
    ny: Math.sin(newAngle),
  };
}
```

**制約**: `deflectionBias` の効果は衝突時のみ。通常移動には影響しない。

**#3: CPU/人間の区別方法**:

`resolveMalletPuckOverlap` は現在マレットが CPU か人間かを知らない。
衝突関数にバイアス値を渡す設計で解決する。

```typescript
// entities.ts: 関数シグネチャの拡張
function resolveMalletPuckOverlap(
  mallet: Mallet,
  pucks: Puck[],
  deflectionBias: number,  // ← 新規追加。人間マレット=0, CPUマレット=キャラ値
  // ... 既存パラメータ
): void;

// useGameLoop.ts: 呼び出し側で区別
// P1（人間）
resolveMalletPuckOverlap(playerMallet, pucks, 0, ...);
// CPU
resolveMalletPuckOverlap(cpuMallet, pucks, cpuAiConfig.playStyle?.deflectionBias ?? 0, ...);
// ally（CPU時）
resolveMalletPuckOverlap(allyMallet, pucks, allyControlType === 'cpu' ? allyDeflectionBias : 0, ...);
```

> この方式により衝突関数自体は CPU/人間を意識せず、呼び出し側がバイアス値を制御する。

### 3.4 リアクション速度（reactionDelay）

パックの方向転換後、AI が新ターゲットを再計算するまでの遅延。

```typescript
// ai.ts: updateWithBehavior 内
function shouldRecalculateTarget(
  lastTargetTime: number,
  currentTime: number,
  reactionDelay: number,
  puckDirectionChanged: boolean
): boolean {
  if (!puckDirectionChanged) return false; // 方向転換がなければ既存ターゲットを維持
  const elapsed = currentTime - lastTargetTime;
  return elapsed >= reactionDelay;
}
```

**パック方向転換の検出**:
- 前フレームと現フレームの `puck.vy` の符号が異なる場合
- 壁バウンス直後（`puck.vx` の符号反転）

**MF-3 + #1 + #11: AI 間引きとの統合設計（方式 A 確定）**

> **確定**: 方式 A（reactionDelay に統合）を採用する。`AI_UPDATE_INTERVAL` は使用しない。

reactionDelay が AI ターゲット再計算の間引きの役割を兼ねる。

**S6-3 と S6-4 の役割分離**:
- **S6-3-10 の責務**: パック方向転換を検出し、`shouldRecalculateTarget` で遅延を制御する基本ロジック
- **S6-4-8 の責務**: S6-3-10 で作ったロジックに「通常時のターゲット追従間隔」を統合する
  - パック方向転換**がない**フレームでも、reactionDelay に基づきターゲット再計算を間引く
  - S6-3-10 の `puckDirectionChanged` 条件を拡張し、経過時間ベースの定期再計算を追加

```typescript
// 確定設計: S6-3 で基本実装 → S6-4 で拡張
function shouldRecalculateTarget(
  lastTargetTime: number,
  currentTime: number,
  reactionDelay: number,
  puckDirectionChanged: boolean
): boolean {
  const elapsed = currentTime - lastTargetTime;

  // S6-3 で実装: パック方向転換時の遅延
  if (puckDirectionChanged) {
    return elapsed >= reactionDelay;
  }

  // S6-4 で追加: 通常時の定期再計算（reactionDelay の 3 倍を上限に）
  const periodicInterval = Math.max(reactionDelay * 3, 100); // 最低 100ms
  return elapsed >= periodicInterval;
}
```

> **不採用案（参考）**: 方式 B（共通間引き `AI_UPDATE_INTERVAL` + reactionDelay 併用）は
> 二重遅延の管理が複雑になるため不採用。

### 3.5 連携 AI（teamRole）

2v2 時の ally/enemy の役割分担。

**attacker（前線役）**:
- `aggressiveness` を +0.3 加算（上限 1.0）
- パックが自陣にある時もパックを積極追跡
- ゾーン制約は変更しない（上下2分割のまま）

**defender（守備役）**:
- `aggressiveness` を -0.3 減算（下限 0.0）
- パックが相手陣地にある時はゴール前に張り付く
- パック追跡の閾値を厳しくする（パックが近づいた時だけ反応）

**balanced（バランス型）**:
- 現行の `aggressiveness` 値をそのまま使用
- 既存動作と同等

### 3.6 動的 teamRole 切り替え（S-4）

スコア差に応じて teamRole の影響を動的に調整する。

```typescript
function getScoreAdjustment(
  scoreDiff: number,        // 自チーム - 相手チーム
  adaptability: number      // 0.0 〜 1.0
): number {
  if (Math.abs(scoreDiff) < 2) return 0;
  const direction = scoreDiff < 0 ? 1 : -1; // 負けている→攻撃的、勝っている→守備的
  return direction * 0.1 * adaptability;     // adaptability が高いほど調整幅が大きい
}

// 適用例: teamRole による aggressiveness 調整後にさらに加算
// ユウ（adaptability=0.8）が 2点負けている場合: +0.08 加算
```

### 3.7 キャラ AI 特性の視覚表示（R-3）

TeamSetupScreen のキャラスロット・グリッドにキャラ特性アイコンを表示。

| teamRole | アイコン | 色 |
|----------|---------|-----|
| attacker | ⚔️ 剣 | `#e74c3c`（赤） |
| defender | 🛡️ 盾 | `#3498db`（青） |
| balanced | ⚖️ 天秤 | `#f39c12`（オレンジ） |

表示位置: キャラアイコンの右下に小さくバッジ表示（16x16px）

### 3.8 キャラ別パラメータ設定（#8: 設計意図付き）

| キャラ | defenseStyle | deflectionBias | reactionDelay | teamRole | 設計意図 |
|--------|-------------|---------------|---------------|----------|---------|
| ヒロ | aggressive | -0.3（ストレート） | 50ms | attacker | 攻撃型エース。ストレートで撃ち抜く |
| ミサキ | wide | 0.5（バウンス） | 80ms | balanced | テクニシャン。壁バウンスで翻弄する |
| タクマ | center | -0.5（ストレート） | 30ms | defender | 鉄壁の守護神。ゴール前で素早く反応し直球で返す |
| ユウ | wide | 0.2（ややバウンス） | 40ms | balanced | アナライザー。adaptability で試合展開に適応 |
| ルーキー | center | 0.0 | 200ms | balanced | 初心者。反応が遅く癖がない素直な動き |
| レギュラー | wide | 0.1 | 100ms | balanced | 標準レベル。バランスの良い中堅 |
| エース | aggressive | 0.3 | 50ms | attacker | 上級者。積極的にバウンスショットを狙う |

### 3.9 ally CPU の reactionDelay キャップ（#9）

ally（味方 CPU）にルーキー等の reactionDelay が大きいキャラを選んだ場合、
「味方が足を引っ張る」体験になりプレイヤーフラストレーションにつながる。

`buildAllyAiConfig` で reactionDelay に上限キャップを適用する。

```typescript
// story-balance.ts: buildAllyAiConfig 内
const ALLY_REACTION_DELAY_CAP = 120; // ms（ally は最低限これ以下の反応速度を保証）

function buildAllyAiConfig(difficulty: Difficulty, characterId?: string): AiBehaviorConfig {
  const config = buildFreeBattleAiConfig(difficulty, characterId);
  if (config.playStyle) {
    // aggressiveness の上限キャップ（既存: 0.5）
    config.playStyle.aggressiveness = Math.min(config.playStyle.aggressiveness, 0.5);
    // reactionDelay の上限キャップ（新規）
    config.playStyle.reactionDelay = Math.min(config.playStyle.reactionDelay, ALLY_REACTION_DELAY_CAP);
  }
  return config;
}
```

> **結果**: ally にルーキーを選んでも reactionDelay は 200ms → 120ms に制限される。
> キャラ個性は残しつつ、最低限の味方性能を保証する。

### 3.10 DEFAULT_PLAY_STYLE の更新

```typescript
export const DEFAULT_PLAY_STYLE: AiPlayStyle = {
  sidePreference: 0,
  lateralOscillation: 0,
  lateralPeriod: 3000,
  aggressiveness: 0.5,
  adaptability: 0,
  // 新規追加
  defenseStyle: 'center',
  deflectionBias: 0,
  reactionDelay: 100,
  teamRole: 'balanced',
};
```

## 4. パフォーマンス最適化

### 4.1 計測手順

1. 開発サーバーを起動（`npm start`）
2. 2v2 モードでゲームを開始（4マレット + フィーバー時追加パック）
3. Chrome DevTools → Performance タブで 10 秒間記録
4. 以下を計測:
   - フレーム間隔（目標: 16.67ms = 60fps）
   - `gameLoop` 関数の実行時間
   - `processCollisions` の実行時間
   - Canvas `drawImage` / `fillRect` の呼び出し回数

### 4.2 パフォーマンス計測の自動化（R-5）

```typescript
// useGameLoop.ts 内（開発モードのみ）
const PERF_ENABLED = process.env.NODE_ENV === 'development';

function perfMark(name: string): void {
  if (PERF_ENABLED) performance.mark(name);
}

function perfMeasure(name: string, start: string, end: string): void {
  if (PERF_ENABLED) {
    performance.measure(name, start, end);
  }
}

// 使用例
perfMark('ai-update-start');
// ... AI 更新処理 ...
perfMark('ai-update-end');
perfMeasure('ai-update', 'ai-update-start', 'ai-update-end');
```

**FPS カウンター（開発モード Canvas 表示）**:
```typescript
// 毎フレーム左上に表示
if (PERF_ENABLED) {
  ctx.fillStyle = '#0f0';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${currentFps.toFixed(0)}`, 8, 16);
}
```

### 4.3 衝突判定の早期リターン（S-1 改善）

```typescript
// physics.ts — 距離の二乗比較で sqrt を完全回避
function quickReject(a: Entity, b: Entity, maxDist: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy > maxDist * maxDist;
}
```

### 4.4 AI 計算の間引き（MF-3 統合 — 方式 A 確定）

§3.4 で確定した方式 A に基づき、S6-3 で実装した `shouldRecalculateTarget` を拡張する。

```typescript
// S6-4 での拡張: 通常時の定期再計算を追加
// S6-3 時点: puckDirectionChanged 時のみ reactionDelay で遅延
// S6-4 追加: 通常時も reactionDelay * 3（最低 100ms）で定期再計算

// 結果的な更新頻度:
// reactionDelay=0 のキャラ: 毎フレーム（最速）
// reactionDelay=50ms のキャラ: 方向転換時 50ms / 通常時 150ms
// reactionDelay=200ms のキャラ: 方向転換時 200ms / 通常時 600ms
```

**注意**: P1（人間操作）の入力処理は毎フレーム実行。遅延対象は CPU AI のターゲット再計算のみ。
マレットの移動（現在のターゲットに向かう補間移動）は毎フレーム実行する。

### 4.5 オブジェクト生成の抑制

```typescript
// 毎フレーム new Object を避ける
// Before:
const target = { x: calcX, y: calcY };

// After: 事前確保したオブジェクトを再利用
const _targetPool = { x: 0, y: 0 };
function getTarget(x: number, y: number): Vector {
  _targetPool.x = x;
  _targetPool.y = y;
  return _targetPool;
}
```

### 4.6 Canvas 描画最適化

- `clearRect` の範囲をフィールド領域のみに限定
- 背景（フィールドライン等）を別レイヤー（オフスクリーン Canvas）にキャッシュ
- 変化のあるエンティティのみ再描画（ダーティフラグ管理）

## 5. Gamepad API — P3/P4 人間操作

### 5.1 core/gamepad.ts

```typescript
export type GamepadState = {
  connected: boolean;
  axisX: number;     // -1.0 〜 1.0（左スティック X）
  axisY: number;     // -1.0 〜 1.0（左スティック Y）
  /** このフェーズでは未使用。次フェーズ（S7）でアイテム使用に接続予定 */
  buttonA: boolean;
};

export const DEADZONE = 0.15;

export function readGamepad(index: number): GamepadState | null {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[index];
  if (!gp) return null;

  const rawX = gp.axes[0] ?? 0;
  const rawY = gp.axes[1] ?? 0;

  return {
    connected: true,
    axisX: Math.abs(rawX) < DEADZONE ? 0 : rawX,
    axisY: Math.abs(rawY) < DEADZONE ? 0 : rawY,
    buttonA: gp.buttons[0]?.pressed ?? false,
  };
}

export function isGamepadSupported(): boolean {
  return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
}
```

### 5.2 hooks/useGamepadInput.ts

```typescript
export type UseGamepadInputReturn = {
  gamepads: (GamepadState | null)[];  // 最大4本
  connectedCount: number;
};

export function useGamepadInput(): UseGamepadInputReturn {
  const [gamepads, setGamepads] = useState<(GamepadState | null)[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    if (!isGamepadSupported()) return;

    const handleConnect = () => updateGamepads();
    const handleDisconnect = () => updateGamepads();

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, []);

  // ポーリングは useGameLoop 内で実行（RAF と同期）
  return { gamepads, connectedCount };
}
```

### 5.3 マレット移動計算（S-2: 非線形カーブ）

```typescript
const GAMEPAD_MOVE_SPEED = 12; // px/frame（非線形カーブで実効速度が下がるため調整）

// 非線形カーブ: 微調整が効きやすく、フルチルトで最大速度
function applyNonLinearCurve(axis: number): number {
  return Math.sign(axis) * axis * axis; // sign(x) * x^2
}

function applyGamepadMovement(
  mallet: Mallet,
  gamepadState: GamepadState,
  zone: { minX: number; maxX: number; minY: number; maxY: number }
): void {
  const dx = applyNonLinearCurve(gamepadState.axisX) * GAMEPAD_MOVE_SPEED;
  const dy = applyNonLinearCurve(gamepadState.axisY) * GAMEPAD_MOVE_SPEED;
  mallet.x = clamp(mallet.x + dx, zone.minX, zone.maxX);
  mallet.y = clamp(mallet.y + dy, zone.minY, zone.maxY);
  mallet.vx = dx;
  mallet.vy = dy;
}
```

### 5.4 ゲームパッド接続/切断トースト通知（R-2）

```typescript
type GamepadToast = {
  message: string;
  timestamp: number;
  visible: boolean;
};

// 表示仕様
// - Canvas 下部中央に表示
// - 背景: rgba(0, 0, 0, 0.8), borderRadius: 8px, padding: 8px 16px
// - テキスト: white, fontSize: 14px
// - 表示: 3秒 → フェードアウト (500ms)
// - メッセージ例:
//   「🎮 コントローラー 1 が接続されました」
//   「🎮 コントローラー 1 が切断されました」
```

### 5.5 TeamSetupScreen UI 拡張

P3/P4 スロットに CPU/人間切り替えトグルを追加（ゲームパッド接続時のみ活性化）:

```
┌─────────────────────────────────┐
│ ▌チーム2（上）                    │  ← 赤ボーダー
│ P3: レギュラー   [CPU|🎮人間]     │  ← ゲームパッド未接続時はグレーアウト
│ P4: エース       [CPU|🎮人間]     │
└─────────────────────────────────┘
```

### 5.6 状態管理の拡張

```typescript
// useGameMode に追加
enemy1ControlType: 'cpu' | 'human';  // P3 の操作タイプ（デフォルト: 'cpu'）
enemy2ControlType: 'cpu' | 'human';  // P4 の操作タイプ（デフォルト: 'cpu'）
```

## 6. 中断時の確認ダイアログ

### 6.1 コンポーネント仕様（S-3: 共通コンポーネント）

配置先: `src/components/ConfirmDialog.tsx`（air-hockey 固有ではなく共通）

```typescript
type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;    // 破壊的操作ラベル（例: 「メニューに戻る」）
  cancelLabel: string;     // 安全操作ラベル（例: 「続ける」）
  onConfirm: () => void;
  onCancel: () => void;
};
```

### 6.2 表示条件（MF-2 対応: TeamSetupScreen 除外）

| 画面 | アクション | 2v2 モード | 他モード |
|------|-----------|-----------|---------|
| ゲーム中（pause） | メニューボタン | ダイアログ表示 | 即座にリセット |
| リザルト画面 | メニューに戻る | ダイアログ表示 | 即座にリセット |
| ~~チーム設定画面~~ | ~~戻るボタン~~ | ~~ダイアログ表示~~ | — |

> **MF-2**: TeamSetupScreen からの戻りはゲーム未開始のためやり直しコストが低い。
> 確認ダイアログは不要。

### 6.3 スタイル仕様

```css
/* モーダルオーバーレイ */
background: rgba(0, 0, 0, 0.7);
display: flex;
justify-content: center;
align-items: center;

/* R-1: アニメーション */
/* オーバーレイ: opacity 0→0.7 (150ms ease-out) */
/* ダイアログ: scale(0.95)→scale(1) + opacity 0→1 (150ms ease-out) */
/* prefers-reduced-motion 時: アニメーションスキップ */

/* ダイアログ本体 */
background: #2c3e50;
border-radius: 12px;
padding: 24px 32px;
max-width: 400px;
text-align: center;

/* ボタン */
min-height: 44px;  /* タッチターゲット */
border-radius: 8px;
/* 「続ける」: #3498db 背景（初期フォーカス） */
/* 「メニューに戻る」: #e74c3c 背景 */

/* フォーカスインジケーター */
/* outline: 2px solid #fff, outline-offset: 2px */
```

### 6.4 キーボード操作（MF-1 対応: 安全なデフォルト）

- **初期フォーカス**: 「続ける」ボタン（安全な操作）
- `Enter` → フォーカス中のボタンを実行（初期状態では「続ける」）
- `Escape` → 「続ける」（ダイアログを閉じる）
- `Tab` / `Shift+Tab` → ボタン間移動（フォーカストラップ）

> **MF-1**: `Enter` を破壊的操作に直接割り当てない。
> 「メニューに戻る」を実行するには、Tab で明示的にフォーカスを移動してから Enter、
> またはクリック/タップが必要。
