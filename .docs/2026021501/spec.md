# IPNE ブラッシュアップ — 仕様書

## 1. ドット絵アセット仕様

### 1.1 基本方針

- **コードスプライト方式**: 外部画像ファイルを使用せず、TypeScript 内で 2D 配列（パレットインデックス）として定義
- **ベースサイズ**: タイル・キャラクター 16×16px、アイテム 8×8px、ボス 24×24px
- **パレット**: 各スプライトに最大 8 色パレット（透明色を含む）
- **スケーリング**: 実行時に `tileSize` に合わせてニアレストネイバー拡大

### 1.2 スプライトデータ形式

```typescript
/**
 * スプライト定義
 * pixels[y][x] = パレットインデックス（0 = 透明）
 */
interface SpriteDefinition {
  width: number;
  height: number;
  pixels: number[][];
  palette: string[]; // palette[0] は常に透明
}

/**
 * スプライトシート定義（アニメーション用）
 */
interface SpriteSheetDefinition {
  sprites: SpriteDefinition[];
  frameDuration: number; // フレームあたりの表示時間（ms）
}
```

### 1.3 タイルスプライト

| タイル | パレット | デザイン |
|--------|---------|---------|
| 床 | `#1f2937`, `#2d3748`, `#1a202c` | 石畳パターン（4×4 タイル繰り返し） |
| 壁 | `#374151`, `#4b5563`, `#1f2937`, `#6b7280` | レンガパターン（横2行、オフセット配置） |
| ゴール | `#10b981`, `#34d399`, `#065f46` | 下向き階段 + 緑の光（2 フレーム点滅） |
| スタート | `#3b82f6`, `#60a5fa`, `#1e40af` | 青い光るタイル（円形グロー） |

### 1.4 プレイヤースプライト

**戦士（warrior）**:
- ベース色: `#667eea`（青紫）
- 装備: 剣 + 盾の簡易シルエット
- 方向: 4 方向（up/down/left/right）
- アニメーション: idle（1 フレーム）、walk（2 フレーム交互）
- 合計: 4 方向 × 3 フレーム = 12 スプライト

**盗賊（thief）**:
- ベース色: `#a78bfa`（薄紫）
- 装備: ダガーのシルエット
- 方向: 4 方向
- アニメーション: idle（1 フレーム）、walk（2 フレーム交互）
- 合計: 12 スプライト

### 1.5 敵スプライト

| 敵タイプ | デザイン | サイズ | フレーム | パレット |
|---------|---------|--------|---------|---------|
| patrol | スライム（丸い、跳ねる） | 16×16 | 2 | `#6b21a8`, `#7c3aed`, `#4c1d95` |
| charge | 突進獣（角付き、前傾） | 16×16 | 2 | `#991b1b`, `#dc2626`, `#7f1d1d` |
| ranged | 射手（ローブ、杖） | 16×16 | 2 | `#c2410c`, `#ea580c`, `#9a3412` |
| specimen | 標本（結晶体） | 16×16 | 2 | `#1e3a5f`, `#2563eb`, `#1e40af` |
| boss | 大型ボス（角・翼付き） | 24×24 | 4 | `#7c2d12`, `#dc2626`, `#451a03`, `#f97316` |

### 1.6 アイテムスプライト

| アイテム | デザイン | サイズ | フレーム |
|---------|---------|--------|---------|
| health_small | 緑ポーション瓶 | 8×8 | 1 |
| health_large | 赤ポーション瓶 | 8×8 | 1 |
| health_full | 金ポーション瓶（キラキラ） | 8×8 | 2 |
| level_up | ピンク星 | 8×8 | 2 |
| map_reveal | 茶色巻物 | 8×8 | 1 |
| key | 金色鍵（キラキラ） | 8×8 | 2 |

### 1.7 罠・特殊壁スプライト

**罠**:
- damage: 赤いトゲ（hidden 時は薄く、triggered 時に赤く点滅）
- slow: 青い蜘蛛の巣パターン
- teleport: 紫の渦巻き（2 フレーム回転アニメ）

**特殊壁**:
- breakable/intact: 茶色レンガ + ひび割れ線
- breakable/revealed: intact と同じ外見（発見済みだが未破壊）
- breakable/damaged: オレンジレンガ + 大きなひび割れ
- breakable/broken: 緑の開口部
- passable: 半透明壁（点線パターン）
- invisible: 紫壁（太い輪郭）

---

## 2. Canvas 描画パイプライン変更仕様

### 2.1 SpriteRenderer API

```typescript
class SpriteRenderer {
  /** スプライトキャッシュ（スケール別） */
  private cache: Map<string, OffscreenCanvas>;

  /** 単一スプライト描画 */
  drawSprite(
    ctx: CanvasRenderingContext2D,
    sprite: SpriteDefinition,
    x: number,
    y: number,
    scale: number
  ): void;

  /** アニメーションスプライト描画 */
  drawAnimatedSprite(
    ctx: CanvasRenderingContext2D,
    sheet: SpriteSheetDefinition,
    currentTime: number,
    x: number,
    y: number,
    scale: number
  ): void;

  /** 透明度付きスプライト描画（残像用） */
  drawSpriteWithAlpha(
    ctx: CanvasRenderingContext2D,
    sprite: SpriteDefinition,
    x: number,
    y: number,
    scale: number,
    alpha: number
  ): void;

  /** キャッシュクリア */
  clearCache(): void;
}
```

### 2.2 描画順序（変更なし）

```
1. 背景クリア（黒）
2. マップタイル（床→壁→ゴール→スタート）
3. グリッド線（デバッグ時のみ）
4. 罠描画
5. 特殊壁描画
6. アイテム描画
7. 敵描画
8. 攻撃エフェクト描画  ← 斬撃アニメに変更
9. プレイヤー描画
10. パーティクルエフェクト描画  ← 新規追加
11. フィードバックテキスト描画（既存）
12. 自動マップ描画
13. デバッグパネル描画
```

### 2.3 スプライト選択ロジック

**プレイヤー**:
```typescript
// 方向 + 移動状態からスプライトを選択
const spriteIndex = getPlayerSpriteIndex(
  player.direction,     // up/down/left/right
  player.playerClass,   // warrior/thief
  isMoving,             // 直近200ms以内に移動したか
  currentTime           // アニメーションフレーム計算用
);
```

**敵**:
```typescript
// 敵タイプ + 時間からアニメーションフレームを選択
const frame = Math.floor(currentTime / enemySheet.frameDuration) % enemySheet.sprites.length;
```

---

## 3. エフェクト仕様

### 3.1 エフェクトマネージャー

```typescript
interface GameEffect {
  id: string;
  type: EffectType;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  particles: Particle[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;        // X方向速度
  vy: number;        // Y方向速度
  size: number;       // サイズ
  color: string;
  alpha: number;      // 透明度
  life: number;       // 残りライフ（0.0～1.0）
  decay: number;      // ライフ減衰率
}
```

### 3.2 攻撃ヒットエフェクト

- **トリガー**: `attackEffect` が発生時
- **パーティクル**: 白い火花 × 8 個
- **挙動**: 攻撃位置から放射状に飛散（速度: ランダム 2～5px/frame）
- **持続時間**: 300ms
- **サイズ**: 2～4px、徐々に縮小
- **スプライト**: 斬撃アニメーション（3 フレーム × 100ms）を同位置に重ねて描画

### 3.3 ダメージエフェクト

- **トリガー**: プレイヤー被ダメージ時
- **パーティクル**: 赤い粒子 × 6 個
- **挙動**: プレイヤー位置から上方向に飛散（重力付き）
- **持続時間**: 400ms
- **既存連携**: `DamageOverlay` のフラッシュはそのまま維持

### 3.4 罠発動エフェクト

- **damage 罠**: 赤い火花が下から上に飛ぶ（トゲが突き出す演出）
- **slow 罠**: 青い霧パーティクルがゆっくり拡散
- **teleport 罠**: 紫のリングが収縮→拡散（テレポート先にも拡散エフェクト）

### 3.5 アイテム取得エフェクト

- **パーティクル**: アイテム色のキラキラ × 6 個
- **挙動**: 取得位置から上方向に浮遊
- **持続時間**: 500ms

### 3.6 レベルアップエフェクト

- **リングエフェクト**: 黄色の円がプレイヤー位置から拡大（radius: 0 → 40px）
- **パーティクル**: 黄色キラキラ × 12 個、上方向に浮遊
- **持続時間**: 800ms

### 3.7 ボス撃破エフェクト

- **大規模爆発**: パーティクル × 24 個、ボス色 + 白
- **挙動**: ボス位置から全方向に高速飛散
- **画面フラッシュ**: 白 → フェードアウト（200ms）
- **持続時間**: 1200ms

---

## 4. 移動スピードエフェクト仕様（削除済み）

> **削除理由**: 残像が移動方向の後方ではなく横並び・前方に表示されてしまい、エフェクトとして正常に機能しないため、視覚エフェクト（残像 + ダッシュダスト）を削除した。
> SPEED_BOOST 効果音は将来別用途の可能性があるため残存させる。
>
> 削除対象: `speedEffect.ts`、`Game.tsx` のスピードエフェクト描画呼び出し、`movement.ts` の `SPEED_EFFECT_THRESHOLD` 定数

---

## 5. 死亡エフェクト・遅延遷移仕様

### 5.1 ScreenState 拡張

```typescript
export const ScreenState = {
  TITLE: 'title',
  CLASS_SELECT: 'class_select',
  PROLOGUE: 'prologue',
  GAME: 'game',
  DYING: 'dying',        // ← 新規追加
  CLEAR: 'clear',
  GAME_OVER: 'game_over',
} as const;
```

### 5.2 状態遷移フロー

```
HP > 0: ScreenState.GAME（通常プレイ）
    ↓ HP <= 0
ScreenState.DYING（1.5秒間）
    ↓ 1.5秒経過
ScreenState.GAME_OVER（ゲームオーバー画面）
```

### 5.3 DYING 状態中の挙動

- **敵 AI**: 停止（移動・攻撃しない）
- **プレイヤー入力**: 無効化（移動・攻撃不可）
- **ゲームループ**: tick 処理をスキップ
- **タイマー**: 停止
- **音声**: 死亡メロディ再生（DYING 効果音）

### 5.4 死亡アニメーション詳細

**フェーズ 1（0.0～0.5 秒）**: 点滅
- プレイヤースプライトを 100ms 間隔で点滅
- 既存の無敵時点滅と同じロジック

**フェーズ 2（0.5～1.0 秒）**: 赤変色
- プレイヤースプライトを徐々に赤くシフト
- 実装: `ctx.globalCompositeOperation = 'source-atop'` + 赤色半透明重ね
- alpha: 0.0 → 0.8（線形補間）

**フェーズ 3（1.0～1.5 秒）**: パーティクル分解
- プレイヤースプライトを非表示
- スプライトの各ピクセルをパーティクルとして飛散
- 各パーティクル: ランダム方向 + 重力（下方向加速度）
- 色: スプライトの元ピクセル色
- 12～16 個のパーティクルに簡略化（全ピクセルだと重い）

### 5.5 useGameLoop 変更

```typescript
// 既存: GAME_OVER に直接遷移
case TickDisplayEffect.GAME_OVER:
  setIsGameOver(true);
  setScreen(ScreenState.GAME_OVER);
  break;

// 変更後: DYING に遷移、タイマーで GAME_OVER へ
case TickDisplayEffect.GAME_OVER:
  setScreen(ScreenState.DYING);
  // 死亡効果音を再生
  playDyingSound();
  setTimeout(() => {
    setIsGameOver(true);
    setScreen(ScreenState.GAME_OVER);
  }, 1500);
  break;
```

---

## 6. 効果音仕様

### 6.1 新規効果音一覧

| 名称 | キー | 波形 | 周波数(Hz) | 持続(s) | sweep(Hz) | 音量 | 説明 |
|------|------|------|-----------|---------|----------|------|------|
| 移動音 | MOVE_STEP | sine | 1200 | 0.04 | — | 0.15 | 軽い足音（ピッ） |
| 壁衝突 | WALL_BUMP | sawtooth | 80 | 0.1 | 40 | 0.3 | 低い衝突音 |
| 攻撃振り | ATTACK_SWING | square | 800 | 0.06 | 400 | 0.3 | 振り下ろし音 |
| 空振り | ATTACK_MISS | sawtooth | 300 | 0.08 | 100 | 0.2 | 空気を切る音 |
| 敵ダメージ | ENEMY_DAMAGE | square | 500 | 0.1 | 200 | 0.35 | 敵被弾音 |
| 回避 | DODGE | sine | 900 | 0.08 | 1400 | 0.25 | 上昇スウィープ |
| 鍵取得 | KEY_PICKUP | — | — | — | — | 0.35 | 3音上昇メロディ |
| 扉開放 | DOOR_OPEN | sine | 300 | 0.2 | 600 | 0.35 | 上昇トーン |
| 速度上昇 | SPEED_BOOST | sine | 400 | 0.3 | 1200 | 0.3 | 長い上昇スウィープ |
| 壁破壊 | WALL_BREAK | sawtooth | 100 | 0.15 | 50 | 0.4 | 崩壊音 |
| テレポート | TELEPORT | sine | 600 | 0.25 | 1800 | 0.3 | ワープ音（往復スウィープ） |
| 死亡 | DYING | — | — | — | — | 0.45 | 下降メロディ |

### 6.2 メロディ定義

**KEY_PICKUP メロディ（3 音上昇）**:
```typescript
const KEY_PICKUP_MELODY: readonly [number, number][] = [
  [659, 0.1],  // E5
  [784, 0.1],  // G5
  [1047, 0.2], // C6
];
```

**DYING メロディ（下降、不穏）**:
```typescript
const DYING_MELODY: readonly [number, number][] = [
  [440, 0.15],  // A4
  [370, 0.15],  // F#4
  [330, 0.15],  // E4
  [262, 0.2],   // C4
  [0, 0.1],     // 休符
  [220, 0.15],  // A3
  [196, 0.3],   // G3
  [165, 0.4],   // E3
];
```

### 6.3 SoundEffectType 拡張

```typescript
export const SoundEffectType = {
  // 既存 10 種
  PLAYER_DAMAGE: 'player_damage',
  ENEMY_KILL: 'enemy_kill',
  BOSS_KILL: 'boss_kill',
  GAME_CLEAR: 'game_clear',
  GAME_OVER: 'game_over',
  LEVEL_UP: 'level_up',
  ATTACK_HIT: 'attack_hit',
  ITEM_PICKUP: 'item_pickup',
  HEAL: 'heal',
  TRAP_TRIGGERED: 'trap_triggered',
  // 新規 12 種
  MOVE_STEP: 'move_step',
  WALL_BUMP: 'wall_bump',
  ATTACK_SWING: 'attack_swing',
  ATTACK_MISS: 'attack_miss',
  ENEMY_DAMAGE: 'enemy_damage',
  DODGE: 'dodge',
  KEY_PICKUP: 'key_pickup',
  DOOR_OPEN: 'door_open',
  SPEED_BOOST: 'speed_boost',
  WALL_BREAK: 'wall_break',
  TELEPORT: 'teleport',
  DYING: 'dying',
} as const;
```

### 6.4 効果音トリガーポイント

| 効果音 | トリガー場所 | トリガー条件 |
|--------|------------|-------------|
| MOVE_STEP | Game.tsx（移動時） | プレイヤー移動成功時 |
| WALL_BUMP | Game.tsx（移動時） | プレイヤー移動失敗時（壁衝突） |
| ATTACK_SWING | Game.tsx（攻撃時） | スペースキー押下時 |
| ATTACK_MISS | useGameLoop | 攻撃したが敵がいない時 |
| ENEMY_DAMAGE | useGameLoop | 敵にダメージを与えた時 |
| DODGE | useGameLoop | 無敵時間中にダメージを回避した時 |
| KEY_PICKUP | useGameLoop | 鍵アイテム取得時 |
| DOOR_OPEN | useGameLoop | 鍵付きゴールに到達時 |
| SPEED_BOOST | useGameLoop | （※視覚エフェクト削除済み、効果音定義のみ残存） |
| WALL_BREAK | useGameLoop | 破壊可能壁を破壊した時 |
| TELEPORT | useGameLoop | テレポート罠発動時 |
| DYING | useGameLoop | HP が 0 になった時（DYING 遷移時） |

---

## 7. 技術仕様

### 7.1 アーキテクチャ整合性

新規モジュールは既存のレイヤードアーキテクチャに従う:

```
src/features/ipne/
├── presentation/
│   ├── sprites/         ← 新規: スプライト定義・レンダリング
│   │   ├── index.ts
│   │   ├── spriteData.ts
│   │   ├── spriteRenderer.ts
│   │   ├── spriteSheet.ts
│   │   ├── tileSprites.ts
│   │   ├── playerSprites.ts
│   │   ├── enemySprites.ts
│   │   ├── itemSprites.ts
│   │   ├── trapSprites.ts
│   │   ├── wallSprites.ts
│   │   └── effectSprites.ts
│   ├── effects/         ← 新規: エフェクトシステム
│   │   ├── index.ts
│   │   ├── effectManager.ts
│   │   ├── effectTypes.ts
│   │   ├── particleSystem.ts
│   │   ├── speedEffect.ts  ← 削除予定
│   │   └── deathEffect.ts
│   ├── screens/
│   │   └── Game.tsx     ← 変更: スプライト・エフェクト統合
│   ├── hooks/
│   │   └── useGameLoop.ts ← 変更: 死亡遅延・新効果音
│   └── config.ts        ← 変更: スプライト参照追加
├── audio/
│   └── soundEffect.ts   ← 変更: 12種追加
├── types.ts             ← 変更: DYING, 新SE, FeedbackType
├── movement.ts          ← 変更: SPEED_EFFECT_THRESHOLD ← 削除予定
└── feedback.ts          ← 変更: FeedbackType 拡張
```

### 7.2 パフォーマンス考慮

1. **スプライトキャッシュ**: `OffscreenCanvas` でスケール別にキャッシュ。キャッシュキーは `${spriteId}-${scale}`
2. **パーティクル上限**: EffectManager 全体で最大 200 パーティクル。超過時は古いものから削除
3. **描画最適化**: ビューポート外のスプライト・エフェクトは描画スキップ（既存ロジックを踏襲）
4. **GC 配慮**: パーティクルオブジェクトのプール化は必要に応じて後から追加

### 7.3 テスト方針

1. **ユニットテスト対象**:
   - `spriteData.ts`: `createSprite` の ImageData 生成
   - `effectManager.ts`: エフェクトのライフサイクル（追加・更新・削除）
   - `particleSystem.ts`: パーティクルの物理計算
   - `soundEffect.ts`: 新規効果音設定の型整合性
   - `types.ts`: ScreenState.DYING の追加が既存テストを壊さないこと

2. **統合テスト**:
   - `npm run build` が成功すること
   - `npm test` で既存テストが全パスすること

3. **目視テスト**:
   - `npm run dev` で各スプライトが正しく表示されること
   - 各エフェクトが適切なタイミングで再生されること
   - 死亡アニメーションが 1.5 秒で完了しゲームオーバー画面に遷移すること
   - 効果音が意図したタイミングで鳴ること
