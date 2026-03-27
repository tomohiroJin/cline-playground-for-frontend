# Step 4: ペアマッチ（2v2）— 仕様書

## S-01: 型定義の拡張

### GameMode

```typescript
export type GameMode = 'free' | 'story' | '2p-local' | '2v2-local';
```

### GameState（ally / enemy 追加）

```typescript
export type GameState = {
  player: Mallet;      // P1（チーム1・左下）
  cpu: Mallet;         // P3（チーム2・左上）— 2v2 では敵1
  ally?: Mallet;       // P2（チーム1・右下）— 2v2 時のみ
  enemy?: Mallet;      // P4（チーム2・右上）— 2v2 時のみ
  pucks: Puck[];
  items: Item[];
  effects: GameEffects;
  // ... 既存フィールド
};
```

### GameEffects

```typescript
export type GameEffects = {
  player: EffectState;
  cpu: EffectState;
  ally?: EffectState;   // 2v2 時のみ
  enemy?: EffectState;  // 2v2 時のみ
};
```

### PlayerSlot

```typescript
export type PlayerSlot = 'player1' | 'player2' | 'player3' | 'player4';
```

---

## S-02: 4分割ゾーン

### ゾーン境界

```typescript
// constants.ts に追加
export function getPlayerZone(
  slot: PlayerSlot,
  constants: GameConstants
): { minX: number; maxX: number; minY: number; maxY: number } {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const MR = constants.SIZES.MALLET;
  const margin = MALLET_WALL_MARGIN;
  const centerMargin = MALLET_CENTER_LINE_MARGIN;
  const halfW = W / 2;
  const halfH = H / 2;

  switch (slot) {
    case 'player1': // 左下
      return { minX: MR + margin, maxX: halfW, minY: halfH + MR + centerMargin, maxY: H - MR - margin };
    case 'player2': // 右下
      return { minX: halfW, maxX: W - MR - margin, minY: halfH + MR + centerMargin, maxY: H - MR - margin };
    case 'player3': // 左上
      return { minX: MR + margin, maxX: halfW, minY: MR + margin, maxY: halfH - MR - centerMargin };
    case 'player4': // 右上
      return { minX: halfW, maxX: W - MR - margin, minY: MR + margin, maxY: halfH - MR - centerMargin };
  }
}
```

### 初期位置

| スロット | 初期 X | 初期 Y |
|---------|--------|--------|
| P1（左下） | W/4 | H - 120 |
| P2（右下） | 3W/4 | H - 120 |
| P3（左上） | W/4 | 120 |
| P4（右上） | 3W/4 | 120 |

---

## S-03: マルチタッチ4タッチ対応

### MultiTouchState 拡張

```typescript
export type MultiTouchState = {
  player1TouchId: number | null;
  player1Position: TouchPosition | null;
  player2TouchId: number | null;
  player2Position: TouchPosition | null;
  player3TouchId: number | null;    // 追加
  player3Position: TouchPosition | null;
  player4TouchId: number | null;    // 追加
  player4Position: TouchPosition | null;
};
```

### ゾーン判定

タッチ開始位置のゾーン（4分割）でプレイヤーを割り当て:

```typescript
function getZone(pos: CanvasPosition, constants: GameConstants): PlayerSlot {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const isBottom = pos.canvasY > H / 2;
  const isLeft = pos.canvasX < W / 2;

  if (isBottom && isLeft) return 'player1';
  if (isBottom && !isLeft) return 'player2';
  if (!isBottom && isLeft) return 'player3';
  return 'player4';
}
```

---

## S-04: 衝突処理

### processCollisions の4マレット対応

```typescript
// 2v2 時は4マレットを配列化してループ
const mallets = [
  { mallet: game.player, slot: 'player' as const },
  { mallet: game.cpu, slot: 'cpu' as const },
];
if (is2v2Mode && game.ally) mallets.push({ mallet: game.ally, slot: 'ally' as const });
if (is2v2Mode && game.enemy) mallets.push({ mallet: game.enemy, slot: 'enemy' as const });

for (const { mallet, slot } of mallets) {
  // 既存の衝突検出・解決ロジック
}
```

### resolveMalletPuckOverlap

同様に4マレット分呼び出す:

```typescript
resolveMalletPuckOverlap(game.player, game.pucks, playerMR, BR, MAX_POWER);
resolveMalletPuckOverlap(game.cpu, game.pucks, cpuMR, BR, MAX_POWER);
if (is2v2Mode && game.ally) resolveMalletPuckOverlap(game.ally, game.pucks, allyMR, BR, MAX_POWER);
if (is2v2Mode && game.enemy) resolveMalletPuckOverlap(game.enemy, game.pucks, enemyMR, BR, MAX_POWER);
```

---

## S-05: CPU AI（2体制御）

P3 と P4 を個別の AI プロファイルで制御:

```typescript
// P3（cpu = 敵1）
const cpuUpdate = CpuAI.updateWithBehavior(game, aiConfigP3, now, consts, scoreDiff);

// P4（enemy = 敵2）
if (game.enemy) {
  const enemyUpdate = CpuAI.updateWithBehavior(
    { ...game, cpu: game.enemy },  // cpu として扱う
    aiConfigP4, now, consts, scoreDiff
  );
  if (enemyUpdate) game.enemy = enemyUpdate.cpu;
}
```

P2（ally）が CPU の場合も同様に制御。

---

## S-06: ゴール判定（チーム制）

```typescript
// 2v2 モード: チーム制スコア
if (is2v2Mode) {
  if (scored === 'cpu') {
    // 上ゴールに入った → team1 得点
    scoreRef.current.p++;
  } else {
    // 下ゴールに入った → team2 得点
    scoreRef.current.c++;
  }
}
```

既存の `{ p, c }` スコア構造をそのまま利用（p = team1, c = team2）。

---

## S-07: レンダリング

### 4マレット描画

```typescript
// チーム1（下）
Renderer.drawMallet(ctx, game.player, team1Color1, false, consts, scale);
if (game.ally) Renderer.drawMallet(ctx, game.ally, team1Color2, false, consts, scale);

// チーム2（上）
Renderer.drawMallet(ctx, game.cpu, team2Color1, false, consts, scale);
if (game.enemy) Renderer.drawMallet(ctx, game.enemy, team2Color2, false, consts, scale);
```

### スコアボード

既存の `ScoreBoard` をそのまま使用（team1 vs team2 表示）。

---

## S-08: UI 画面フロー

### 画面遷移

```
TitleScreen（「ペアマッチ」ボタン）
  ↓
TeamSetupScreen（チーム設定・キャラ選択・CPU/人間切替）
  ↓
VsScreen（チーム1 vs チーム2 演出）
  ↓
Game（2v2 対戦）
  ↓
ResultScreen（チーム制リザルト）
```

### TeamSetupScreen

```
┌─────────────────────────────────────┐
│ ← 戻る      ペアマッチ設定          │
├─────────────────────────────────────┤
│ [チーム1]                           │
│  P1: アキラ（あなた）                │
│  P2: [CPU] レギュラー ▼             │
│                                     │
│ [チーム2]                           │
│  P3: [CPU] エース ▼                 │
│  P4: [CPU] ルーキー ▼               │
├─────────────────────────────────────┤
│ フィールド: [クラシック ▼]          │
│ 勝利スコア: [3] [7] [15]           │
├─────────────────────────────────────┤
│         ［ 対戦開始！ ］             │
└─────────────────────────────────────┘
```

---

## S-09: テスト仕様

### 型定義・初期化テスト

| テスト | 検証内容 |
|-------|---------|
| 2v2 GameState 初期化 | ally/enemy マレットが正しい初期位置に配置される |
| ゾーン境界 | 4分割ゾーンが重複なく全フィールドをカバーする |
| 既存モード互換 | ally/enemy が undefined の場合に既存動作と同一 |

### 衝突テスト

| テスト | 検証内容 |
|-------|---------|
| 4マレット衝突 | ally/enemy マレットとパックの衝突が正しく処理される |
| ゾーン制約 | 各マレットが自分のゾーン外に出ない |

### ゴール判定テスト

| テスト | 検証内容 |
|-------|---------|
| チーム制得点 | 上ゴール → team1 得点、下ゴール → team2 得点 |
| 勝利判定 | winScore に達したチームが勝利 |

---

## S-10: ally（P2）入力接続（S4-7-1）

### 2v2 モード入力フロー全体図

```
P1（あなた）:  マウス/タッチ/矢印キー → game.player（左下ゾーン）
P2（味方）  :  タッチ(右下)/WASD      → game.ally  （右下ゾーン）
P3（敵1）   :  CPU AI                 → game.cpu   （左上ゾーン）
P4（敵2）   :  CPU AI                 → game.enemy （右上ゾーン）
```

### useGameLoop の入力処理変更

2v2 モードでは `playerTargetRef`（useInput フック経由のマウス/タッチ）を**無効化**し、
マルチタッチの `player1Position` で P1 を操作する（P2 との一貫性を保つため）。

```typescript
// マウス/タッチ入力（フレーム同期）— 2v2 モードでは無効化
// 2v2 ではマルチタッチの player1Position を使用する
if (!is2v2Mode && playerTargetRef?.current) {
  moveMalletTo(game.player, playerTargetRef.current.x, playerTargetRef.current.y);
  playerTargetRef.current = null;
}

// 2v2 モード: マルチタッチで P1 と P2（ally）を操作
if (is2v2Mode && multiTouchRef?.current) {
  const touchState = multiTouchRef.current;
  // P1: player1Position → game.player
  if (touchState.player1Position) {
    moveMalletTo(game.player, touchState.player1Position.x, touchState.player1Position.y);
    lastInputRef.current = Date.now();
  }
  // P2: player2Position → game.ally（4分割ゾーンで右下にクランプ済み）
  if (touchState.player2Position && game.ally) {
    moveMalletTo(game.ally, touchState.player2Position.x, touchState.player2Position.y);
  }
}

// 2v2 キーボード: WASD → game.ally（右下ゾーンにクランプ）
// getPlayerZone('player2') で右下ゾーン境界を取得し、X/Y 両方をクランプ
if (is2v2Mode && player2KeysRef && game.ally) {
  const keys2 = player2KeysRef.current;
  const hasInput = keys2.up || keys2.down || keys2.left || keys2.right;
  if (hasInput) {
    const zone = getPlayerZone('player2', consts);
    let dx = 0, dy = 0;
    if (keys2.left) dx -= KEYBOARD_MOVE_SPEED;
    if (keys2.right) dx += KEYBOARD_MOVE_SPEED;
    if (keys2.up) dy -= KEYBOARD_MOVE_SPEED;
    if (keys2.down) dy += KEYBOARD_MOVE_SPEED;
    const newX = clamp(game.ally.x + dx, zone.minX, zone.maxX);
    const newY = clamp(game.ally.y + dy, zone.minY, zone.maxY);
    moveMalletTo(game.ally, newX, newY);
  }
}
```

**注意**: `calculateKeyboardMovement` は `getPlayerYBounds('player2')` を内部で使い、
これは上半分を返す（2P モード互換）。2v2 の ally は右下にいるため、
`getPlayerZone('player2')` を直接使い、X/Y 両方を正しいゾーンにクランプする。

### ally の CPU AI スキップ

**2v2 モードでは ally の CPU AI を常にスキップする。**
初期リリースでは ally は常に人間操作とする。
将来 CPU/人間 切替機能を TeamSetupScreen に追加する際に、フラグで制御する。

```typescript
// 2v2 モード: enemy（P4）のみ CPU AI で制御。ally は人間操作のため AI スキップ
if (is2v2Mode && game.enemy) {
  const result = updateExtraMalletAI(...);
  // ally の updateExtraMalletAI 呼び出しは削除
}
```

---

## S-11: TeamSetupScreen 簡素化（S4-7-2）

### 変更前

```
┌─────────────────────────────────────┐
│ ← 戻る      ペアマッチ設定          │
├─────────────────────────────────────┤
│ [チーム構成]                        │
│ フィールド: [クラシック ▼]          │  ← タイトルと重複
│ 勝利スコア: [3] [7] [15]           │  ← タイトルと重複
├─────────────────────────────────────┤
│         ［ 対戦開始！ ］             │
└─────────────────────────────────────┘
```

### 変更後

```
┌─────────────────────────────────────┐
│ ← 戻る      ペアマッチ             │
├─────────────────────────────────────┤
│ [チーム1（下）]                     │
│  P1: あなた                         │
│  P2: CPU（味方）                    │
│                                     │
│ [チーム2（上）]                     │
│  P3: CPU（敵1）                     │
│  P4: CPU（敵2）                     │
├─────────────────────────────────────┤
│         ［ 対戦開始！ ］             │
└─────────────────────────────────────┘
```

### 型・コールバック変更

`TeamSetupConfig` 型を**完全に削除**する。
`onStart` のシグネチャを `() => void` に変更し、引数なしのコールバックにする。

```typescript
// 変更前
type TeamSetupScreenProps = {
  fields: readonly FieldConfig[];
  unlockedFieldIds: string[];
  onStart: (config: TeamSetupConfig) => void;
  onBack: () => void;
};

// 変更後
type TeamSetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};
```

`handlePairMatchStart` は `mode.field` / `mode.winScore` を直接使用する:

```typescript
// 変更前
const handlePairMatchStart = useCallback((config: TeamSetupConfig) => {
  mode.setGameMode('2v2-local');
  mode.setField(config.field);
  mode.setWinScore(config.winScore);
  startGame(config.field);
}, [mode, startGame]);

// 変更後
const handlePairMatchStart = useCallback(() => {
  mode.setGameMode('2v2-local');
  startGame(mode.field);  // タイトル画面の設定値をそのまま使用
}, [mode, startGame]);
```

---

## S-12: 背景ちらつき修正（S4-7-3）

### 変更前（renderer.ts clear()）

```typescript
const shift = Math.sin(now * 0.0005) * 10;
const grad = ctx.createLinearGradient(0, 0, 0, H);
grad.addColorStop(0, `rgb(${13 + shift}, ${17 + shift}, ${23 + shift})`);
grad.addColorStop(1, `rgb(${13 - shift}, ${17 - shift}, ${23 - shift})`);
```

### 変更後

```typescript
const grad = ctx.createLinearGradient(0, 0, 0, H);
grad.addColorStop(0, 'rgb(18, 22, 28)');
grad.addColorStop(1, 'rgb(8, 12, 18)');
```

静的グラデーションで暗い雰囲気を維持しつつ、ちらつきを排除。

---

## S-13: キャラ選択 UI 改善（S4-7-4）

### 問題点

- `CARD_SIZE=80` の固定サイズが画面幅に対して小さい
- タッチ操作でのタップ領域が狭い
- 他の画面（TitleScreen 等）は styled-components を使用しているのに
  キャラ選択はインラインスタイルで統一性がない

### 改善方針

- カードサイズを CSS の `min()` / `vw` ベースのレスポンシブ化に変更（JS 計算不要）
  ```css
  width: min(90px, calc((100vw - 64px) / 4));
  ```
- キャラアイコンの表示を拡大（36px → 42px）
- パネルの最小幅を広げ（100px → 120px）タップしやすくする
- `FreeBattleCharacterSelect` と `CharacterSelectScreen` の共通スタイル定数を統一

---

## S-14: startGame の gameMode 同期化（S4-8-1）

### 問題

React の `setState` は非同期のため、`mode.setGameMode('2v2-local')` の直後に
`startGame()` を呼んでも `mode.gameMode` はまだ更新されていない。

### 修正

`startGame` に `gameModeOverride` パラメータを追加:

```typescript
const startGame = useCallback((fieldOverride?: FieldConfig, gameModeOverride?: GameMode) => {
  const activeField = fieldOverride ?? mode.field;
  const effectiveGameMode = gameModeOverride ?? mode.gameMode;
  const is2v2 = effectiveGameMode === '2v2-local';
  gameRef.current = EntityFactory.createGameState(CONSTANTS, activeField, is2v2);
  // ...
}, [mode.field, mode.gameMode, navigateWithTransition]);
```

各 handler での呼び出し:

```typescript
// ペアマッチ
const handlePairMatchStart = useCallback(() => {
  mode.setGameMode('2v2-local');
  startGame(mode.field, '2v2-local');
}, [mode, startGame]);

// 2P 対戦
const handleStartBattle = useCallback((config: TwoPlayerConfig) => {
  mode.setGameMode('2p-local');
  startGame(mode.field, '2p-local');
}, [mode, startGame]);

// フリー対戦・ストーリー: 既存動作維持（gameModeOverride 未指定）
```

---

## S-15: 2P 対戦 CharacterSelectScreen の設定 UI 削除（S4-8-2）

### 変更

CharacterSelectScreen から「設定」セクション（フィールド選択・勝利スコア選択）を削除。
`TwoPlayerConfig` から `field` / `winScore` を削除し、
`handleStartBattle` でタイトル画面の `mode.field` / `mode.winScore` を使用。

---

## S-16: TeamSetupScreen のレイアウト統一（S4-8-3）

### 変更

戻るボタンとタイトルの配置を他の画面（CharacterSelectScreen 等）と統一。
現在のインラインスタイル flexbox → 共通の header スタイルパターンに合わせる。
