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

### useGameLoop の入力処理変更

```typescript
// 2v2 モード: P2（ally）をプレイヤー入力で操作
if (is2v2Mode && multiTouchRef?.current) {
  const touchState = multiTouchRef.current;
  // P1: player1Position → game.player（既存）
  if (touchState.player1Position) {
    moveMalletTo(game.player, touchState.player1Position.x, touchState.player1Position.y);
  }
  // P2: player2Position → game.ally（新規）
  if (touchState.player2Position && game.ally) {
    moveMalletTo(game.ally, touchState.player2Position.x, touchState.player2Position.y);
  }
}

// 2v2 キーボード: WASD → game.ally
if (is2v2Mode && player2KeysRef && game.ally) {
  const keys2 = player2KeysRef.current;
  const hasInput = keys2.up || keys2.down || keys2.left || keys2.right;
  if (hasInput) {
    const zone = getPlayerZone('player2', consts);
    // ally は右下ゾーンにクランプ
    const result = calculateKeyboardMovement(keys2, { x: game.ally.x, y: game.ally.y }, consts, 'player2');
    moveMalletTo(game.ally, result.x, result.y);
  }
}
```

### ally の CPU AI スキップ

人間が P2 を操作している場合、ally の CPU AI 更新をスキップする。
判定基準: WASD 入力があるか、または player2 タッチが追跡中。

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

Field / Win Score はタイトル画面の選択値をそのまま使用する。
`handlePairMatchStart` で `mode.field` / `mode.winScore` を渡す。

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

- カードサイズを `min(90px, (画面幅 - パディング) / 4列)` のレスポンシブ計算に
- キャラアイコンの表示を拡大（36px → 42px）
- パネルの最小幅を広げ（100px → 120px）タップしやすくする
- `FreeBattleCharacterSelect` と `CharacterSelectScreen` の共通スタイル定数を統一
