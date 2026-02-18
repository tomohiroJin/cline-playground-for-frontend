# IPNE ゲームブラッシュアップ — 詳細仕様書

## 要件1: STAGE表示の重なり修正

### 現状

```typescript
// src/pages/IpnePage.styles.ts:1392-1405
export const StageIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;          // ← マップ切替ボタンと重なる
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 0.5rem;
  padding: 0.3rem 0.8rem;
  z-index: 20;
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: bold;
  color: #fbbf24;
`;
```

### 変更後

```typescript
export const StageIndicator = styled.div`
  position: absolute;
  top: 3rem;             // タイマー（top: 1rem）の下
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 0.5rem;
  padding: 0.3rem 0.8rem;
  z-index: 20;
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: bold;
  color: #fbbf24;

  @media (max-width: 480px) {
    top: 2.5rem;
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }
`;
```

### レイアウト配置図

```
┌─────────────────────────────────┐
│ [HP] [EXP] [Lv]  ⏱ 05:23  [PT] [?] [🗺]│
│                 STAGE 3                   │  ← 新位置（中央上部、タイマー直下）
│                                           │
│              [ゲーム画面]                   │
│                                           │
└─────────────────────────────────┘
```

- `TimerDisplay`: `top: 1rem; left: 50%; transform: translateX(-50%)`
- `StageIndicator`: `top: 3rem; left: 50%; transform: translateX(-50%)`（タイマーの約2rem下）

---

## 要件2: 主人公スプライト改善

### 改善方針

現在のスプライトの問題点と対策：

| 問題 | 対策 | 技術的変更 |
|------|------|-----------|
| 歩行フレーム間の足の移動量が少なく、滑って見える | 足のピクセル移動幅を1px→2pxに拡大 | 歩行フレームの足位置（row 13-15）を修正 |
| 腕が固定されており、ロボットのように見える | 歩行フレームで腕を前後に1px振る | 歩行フレームの腕位置（row 6-9 の左右端）を修正 |
| 体が上下に動かず、浮遊感がある | 歩行フレーム2でスプライト全体を1px上にシフト（ボビング効果） | walk2フレーム全体のY座標を-1 |
| アニメーションが遅く、機敏さが足りない | `frameDuration` を 200ms → 150ms に短縮 | `createSheet()` 内の値変更 |

### 変更対象

- **ファイル**: `src/features/ipne/presentation/sprites/playerSprites.ts`
- **変更対象スプライト**: 歩行フレーム（walk1/walk2）のみ → 4方向×2フレーム×2クラス = **16スプライト**
- **idleフレームは変更しない**

### frameDuration 変更

```typescript
// 変更前
function createSheet(frames: SpriteDefinition[]): SpriteSheetDefinition {
  return {
    sprites: frames,
    frameDuration: 200,  // ← 変更前
  };
}

// 変更後
function createSheet(frames: SpriteDefinition[]): SpriteSheetDefinition {
  return {
    sprites: frames,
    frameDuration: 150,  // ← 変更後（33%高速化）
  };
}
```

### スプライト修正の具体規則

#### 足の移動幅拡大（全方向共通）

- **walk1（左足前）**: 左足を現在位置からさらに1px左へ、右足を1px右へ
- **walk2（右足前）**: 右足を現在位置からさらに1px右へ、左足を1px左へ
- 対象行: row 13〜15（足ピクセル）

#### 腕振り（下向き・上向き）

- **walk1**: 左腕（盾/クローク側）を1px前方（下へ）、右腕（剣/ダガー側）を1px後方（上へ）
- **walk2**: 逆方向に振る
- 対象行: row 6〜9（腕ピクセル列の端）

#### ボビング効果

- **walk2フレームのみ**: スプライト全体を1行上にシフト
  - row 0 の内容 → 削除（空行に）
  - row 1〜15 → row 0〜14 にシフト
  - row 15 → 全て透明（0）

### 目視確認チェックリスト

- [ ] 戦士・下向きの歩行が自然に見える
- [ ] 戦士・上向きの歩行が自然に見える
- [ ] 戦士・左向きの歩行が自然に見える
- [ ] 戦士・右向きの歩行が自然に見える
- [ ] 盗賊・下向きの歩行が自然に見える
- [ ] 盗賊・上向きの歩行が自然に見える
- [ ] 盗賊・左向きの歩行が自然に見える
- [ ] 盗賊・右向きの歩行が自然に見える
- [ ] アニメーション速度が適切に感じる（速すぎず遅すぎず）
- [ ] idle状態から歩行への遷移が滑らか

---

## 要件3: 1ステージ3レベルアップ

### 設計方針

各ステージで **ちょうど3レベル** 上がるように、以下を変更する：

1. `stageConfig.ts` の各ステージ `maxLevel` を `3, 6, 9, 12, 15` に変更
2. `progression.ts` の `KILL_COUNT_TABLE` を再設計

### maxLevel 変更

| ステージ | 現在のmaxLevel | 新maxLevel | そのステージでのレベル範囲 |
|---------|---------------|-----------|------------------------|
| 1 | 11 | 3 | Lv1 → Lv3 |
| 2 | 12 | 6 | Lv4 → Lv6 |
| 3 | 13 | 9 | Lv7 → Lv9 |
| 4 | 14 | 12 | Lv10 → Lv12 |
| 5 | 15 | 15 | Lv13 → Lv15 |

### 新 KILL_COUNT_TABLE

各ステージの敵数を考慮し、ステージ内で3回レベルアップできる撃破数を設定する。

**ステージ内の敵数（ボス除く）**:
- S1: 25体（patrol:10 + charge:6 + ranged:5 + specimen:4）
- S2: 31体（patrol:12 + charge:8 + ranged:6 + specimen:5）
- S3: 40体（patrol:14 + charge:10 + ranged:8 + specimen:6 + miniBoss:2）
- S4: 47体（patrol:16 + charge:12 + ranged:10 + specimen:7 + miniBoss:2）
- S5: 55体（patrol:18 + charge:14 + ranged:12 + specimen:8 + miniBoss:3）

**設計**: 各ステージで敵の40〜60%を倒せばmaxLevelに到達するバランス

```typescript
export const KILL_COUNT_TABLE: Record<number, number> = {
  // ステージ1（敵25体、maxLevel=3）
  1: 0,     // 初期状態
  2: 3,     // 3体撃破でLv2
  3: 7,     // 7体撃破でLv3（ステージ1の上限）
  // ステージ2（累計、敵31体追加）
  4: 12,    // 累計12体でLv4
  5: 18,    // 累計18体でLv5
  6: 25,    // 累計25体でLv6（ステージ2の上限）
  // ステージ3（累計、敵40体追加）
  7: 33,    // 累計33体でLv7
  8: 42,    // 累計42体でLv8
  9: 52,    // 累計52体でLv9（ステージ3の上限）
  // ステージ4（累計、敵47体追加）
  10: 63,   // 累計63体でLv10
  11: 75,   // 累計75体でLv11
  12: 88,   // 累計88体でLv12（ステージ4の上限）
  // ステージ5（累計、敵55体追加）
  13: 102,  // 累計102体でLv13
  14: 118,  // 累計118体でLv14
  15: 135,  // 累計135体でLv15（最終上限）
};
```

### ステージ内レベルアップ確認表

> **注**: 「必要撃破数（ステージ内）」は前ステージで丁度 maxLevel 到達に必要な最低数だけ撃破した最悪ケースの値。
> 実際にはボス撃破や探索で余分に倒すため、必要撃破率はこれより低くなる。

| ステージ | レベル範囲 | 必要撃破数（ステージ内・最悪ケース） | 敵数 | 必要撃破率（最悪） |
|---------|-----------|-------------------------------|------|-----------------|
| 1 | Lv1→3 | 7体 | 25体 | 28% |
| 2 | Lv4→6 | 18体（25-7） | 31体 | 58% |
| 3 | Lv7→9 | 27体（52-25） | 40体 | 68% |
| 4 | Lv10→12 | 36体（88-52） | 47体 | 77% |
| 5 | Lv13→15 | 47体（135-88） | 55体 | 85% |

段階的に難しくなるが、実際には前ステージからのキャリーオーバーがあり、ボス撃破に向けた探索で十分達成可能。

---

## 要件4: 時間ベースHP回復（リジェネ）

### 仕様

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| 基本回復間隔 | 8000ms（8秒） | |
| healBonusによる短縮 | 800ms/ポイント | healBonus=1で7.2秒、healBonus=5で4秒 |
| 最短回復間隔 | 3000ms（3秒） | healBonusをいくら上げても3秒より短くならない |
| 回復量 | 1HP（固定） | healBonusに関わらず1HP |
| HP上限到達時 | 回復しない | `player.hp >= player.maxHp` なら何もしない |
| タイマーリセット | 回復発生時 | `lastRegenAt = currentTime` |

### 計算式

```typescript
const BASE_REGEN_INTERVAL = 8000;     // 8秒
const REGEN_REDUCTION_PER_BONUS = 800; // healBonus 1ポイントあたり 0.8秒短縮
const MIN_REGEN_INTERVAL = 3000;       // 最短3秒

const regenInterval = Math.max(
  MIN_REGEN_INTERVAL,
  BASE_REGEN_INTERVAL - player.stats.healBonus * REGEN_REDUCTION_PER_BONUS
);

if (currentTime - player.lastRegenAt >= regenInterval && player.hp < player.maxHp) {
  player.hp = Math.min(player.hp + 1, player.maxHp);
  player.lastRegenAt = currentTime;
}
```

### healBonus別の回復間隔表

| healBonus | 回復間隔 | 1分あたりの回復量 |
|-----------|---------|-----------------|
| 0 | 8.0秒 | 7.5HP |
| 1 | 7.2秒 | 8.3HP |
| 2 | 6.4秒 | 9.4HP |
| 3 | 5.6秒 | 10.7HP |
| 4 | 4.8秒 | 12.5HP |
| 5（上限） | 4.0秒 | 15.0HP |

### Player型の変更

```typescript
// src/features/ipne/types.ts - Player インターフェースに追加
export interface Player {
  // ... 既存フィールド ...
  /** 最後にリジェネが発動した時刻（ms） */
  lastRegenAt: number;
}
```

### tickGameState.ts への追加位置

リジェネ処理は **アイテム拾得処理の後、罠処理の前** に配置する（回復→ダメージの順序で自然な体験にする）。

---

## 要件5: 最終ボス攻撃力低減

### 現状の問題

```
MEGA_BOSS ベースダメージ: 6
Stage5 scaling.damage: 2.0
実効ダメージ: 6 × 2.0 = 12
→ HP20のプレイヤーは2発で死亡、理不尽感がある
```

### 変更後

| パラメータ | 変更前 | 変更後 |
|-----------|--------|--------|
| `ENEMY_CONFIGS[MEGA_BOSS].damage` | 6 | 4 |
| `STAGE_5.scaling.damage` | 2.0 | 1.8 |

```
変更後の実効ダメージ: 4 × 1.8 = 7.2 → 7（切り捨て）
→ HP20のプレイヤーは3発で死亡、緊張感を保ちつつ対処可能
```

### 他の敵への影響（Stage5）

| 敵タイプ | ベースdmg | 変更前（×2.0） | 変更後（×1.8） |
|---------|----------|---------------|---------------|
| patrol | 1 | 2 | 1（1.8→切り捨て1） |
| charge | 2 | 4 | 3（3.6→切り捨て3） |
| ranged | 1 | 2 | 1（1.8→切り捨て1） |
| mini_boss | 3 | 6 | 5（5.4→切り捨て5） |
| mega_boss | ~~6~~→4 | ~~12~~ | 7（7.2→切り捨て7） |

patrol/rangedのダメージが2→1に下がるが、Stage5の敵数の多さ（55体）で全体的な脅威は維持。

---

## 要件6: ステージ別壁/床カラー

### 色テーマ方向

**暗くなる方向**（茶色→灰色→青緑→紫→深紅/黒）

### 5ステージ分のパレット定義

#### Stage 1: 土の迷宮（茶色系・暖かみのある色）

```typescript
const STAGE1_FLOOR_PALETTE = ['', '#2a1f14', '#3d2e1f', '#4e3d2a'];
const STAGE1_WALL_PALETTE  = ['', '#3d2e1f', '#5c4a32', '#7a6445', '#96804e'];
```

#### Stage 2: 石の迷宮（灰色系・冷たい色）

```typescript
const STAGE2_FLOOR_PALETTE = ['', '#1a202c', '#1f2937', '#2d3748'];  // 現在のデフォルト
const STAGE2_WALL_PALETTE  = ['', '#1f2937', '#374151', '#4b5563', '#6b7280'];  // 現在のデフォルト
```

#### Stage 3: 水晶の迷宮（青緑系・神秘的な色）

```typescript
const STAGE3_FLOOR_PALETTE = ['', '#0a2a2a', '#0f3d3d', '#164d4d'];
const STAGE3_WALL_PALETTE  = ['', '#0f3d3d', '#1a5c5c', '#257a7a', '#30998f'];
```

#### Stage 4: 闇の迷宮（紫系・不気味な色）

```typescript
const STAGE4_FLOOR_PALETTE = ['', '#1a0f2e', '#261547', '#331a5c'];
const STAGE4_WALL_PALETTE  = ['', '#261547', '#3d2470', '#5c3a99', '#7a50c2'];
```

#### Stage 5: 深淵（深紅/黒系・最終ステージ感）

```typescript
const STAGE5_FLOOR_PALETTE = ['', '#1a0a0a', '#2e0f0f', '#3d1414'];
const STAGE5_WALL_PALETTE  = ['', '#2e0f0f', '#4d1a1a', '#6b2424', '#8a2e2e'];
```

### パレット一覧表

| ステージ | テーマ | 床: 暗(1) | 床: 中(2) | 床: 明(3) | 壁: 暗(1) | 壁: 中低(2) | 壁: 中高(3) | 壁: 明(4) |
|---------|-------|-----------|-----------|-----------|-----------|------------|------------|-----------|
| 1 | 土 | `#2a1f14` | `#3d2e1f` | `#4e3d2a` | `#3d2e1f` | `#5c4a32` | `#7a6445` | `#96804e` |
| 2 | 石 | `#1a202c` | `#1f2937` | `#2d3748` | `#1f2937` | `#374151` | `#4b5563` | `#6b7280` |
| 3 | 水晶 | `#0a2a2a` | `#0f3d3d` | `#164d4d` | `#0f3d3d` | `#1a5c5c` | `#257a7a` | `#30998f` |
| 4 | 闇 | `#1a0f2e` | `#261547` | `#331a5c` | `#261547` | `#3d2470` | `#5c3a99` | `#7a50c2` |
| 5 | 深淵 | `#1a0a0a` | `#2e0f0f` | `#3d1414` | `#2e0f0f` | `#4d1a1a` | `#6b2424` | `#8a2e2e` |

### 実装方式

```typescript
// src/features/ipne/presentation/sprites/tileSprites.ts に追加

import { StageNumber } from '../../types';

/** ステージ別の壁/床パレット */
const STAGE_PALETTES: Record<StageNumber, { floor: string[]; wall: string[] }> = {
  1: { floor: STAGE1_FLOOR_PALETTE, wall: STAGE1_WALL_PALETTE },
  2: { floor: STAGE2_FLOOR_PALETTE, wall: STAGE2_WALL_PALETTE },
  3: { floor: STAGE3_FLOOR_PALETTE, wall: STAGE3_WALL_PALETTE },
  4: { floor: STAGE4_FLOOR_PALETTE, wall: STAGE4_WALL_PALETTE },
  5: { floor: STAGE5_FLOOR_PALETTE, wall: STAGE5_WALL_PALETTE },
};

/**
 * ステージに応じた床スプライトを取得する
 */
export function getFloorSprite(stage: StageNumber): SpriteDefinition {
  return {
    ...FLOOR_SPRITE,
    palette: STAGE_PALETTES[stage].floor,
  };
}

/**
 * ステージに応じた壁スプライトを取得する
 */
export function getWallSprite(stage: StageNumber): SpriteDefinition {
  return {
    ...WALL_SPRITE,
    palette: STAGE_PALETTES[stage].wall,
  };
}
```

### Game.tsx での使用

現在 `FLOOR_SPRITE` / `WALL_SPRITE` を直接参照している箇所を `getFloorSprite(stage)` / `getWallSprite(stage)` に置き換える。

### 目視確認チェックリスト

- [ ] Stage1: 茶色い土のダンジョンに見える
- [ ] Stage2: 灰色の石のダンジョンに見える（現在と同じ）
- [ ] Stage3: 青緑の神秘的なダンジョンに見える
- [ ] Stage4: 紫の不気味なダンジョンに見える
- [ ] Stage5: 深紅/黒の最終ステージ感がある
- [ ] 全ステージで壁/床の区別が明確に見える（コントラスト維持）
- [ ] プレイヤー・敵・アイテムが壁/床の上で視認可能
