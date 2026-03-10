# Air Hockey ブラッシュアップ仕様書 v2

---

## Phase 1: 見た目改善

### 1.1 台の質感向上（US-1.1）

**変更ファイル**: `renderer.ts` の `Renderer.drawField()`

**現状の実装**（renderer.ts:53-83）:
```typescript
drawField(ctx, field, consts, obstacleStates, now) {
  // 外枠: 単色の strokeRect（幅5px、field.color）
  // 中央ライン: 点線（field.color + '55'）
  // 中央円: field.color のネオングロー
  // ゴール: 赤(CPU側) / シアン(プレイヤー側) の fillRect
}
```

**変更内容**:

#### 1.1.1 台の外枠（木目風グラデーション）

`drawField()` の冒頭、既存の `strokeRect` を以下に置換:

```typescript
// 外枠の描画（グラデーション + 多重線で厚み表現）
const frameGrad = ctx.createLinearGradient(0, 0, W, H);
frameGrad.addColorStop(0, '#2a1810');   // 暗い茶
frameGrad.addColorStop(0.5, '#3d2518'); // 中間
frameGrad.addColorStop(1, '#1a0e08');   // 最暗

// 外枠（太い線）
ctx.strokeStyle = frameGrad;
ctx.lineWidth = 12;
ctx.strokeRect(6, 6, W - 12, H - 12);

// 内枠（光沢ハイライト）
ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
ctx.lineWidth = 1;
ctx.strokeRect(12, 12, W - 24, H - 24);

// フィールドカラーのネオン枠線（既存を維持、位置調整）
ctx.strokeStyle = field.color;
ctx.lineWidth = 2;
ctx.shadowColor = field.color;
ctx.shadowBlur = 15;
ctx.strokeRect(12, 12, W - 24, H - 24);
ctx.shadowBlur = 0;
```

#### 1.1.2 フィールド面の照明効果

`Renderer.clear()` の後、`drawField()` 内に追加:

```typescript
// 放射グラデーション（照明効果）
const lightGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, H * 0.6);
lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
lightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.015)');
lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
ctx.fillStyle = lightGrad;
ctx.fillRect(12, 12, W - 24, H - 24);
```

#### 1.1.3 中央ライン装飾

既存の点線描画を以下に置換:

```typescript
// 中央ライン（二重線）
ctx.strokeStyle = field.color + '33';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(15, H / 2);
ctx.lineTo(W - 15, H / 2);
ctx.stroke();

ctx.strokeStyle = field.color + '66';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(15, H / 2 - 3);
ctx.lineTo(W - 15, H / 2 - 3);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(15, H / 2 + 3);
ctx.lineTo(W - 15, H / 2 + 3);
ctx.stroke();

// 中央円（装飾）
ctx.shadowColor = field.color;
ctx.shadowBlur = 15;
ctx.strokeStyle = field.color + '55';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
ctx.stroke();
// 内側の小円
ctx.beginPath();
ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2);
ctx.fillStyle = field.color + '44';
ctx.fill();
ctx.shadowBlur = 0;
```

#### 1.1.4 ゴールエリア LED 発光

既存のゴール描画を以下に置換:

```typescript
// ゴールエリア（LED風発光）
const drawGoalLED = (y: number, color: string, glowColor: string) => {
  const gs = field.goalSize;
  const gx = W / 2 - gs / 2;
  // グロー（背景光）
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;
  ctx.fillRect(gx, y, gs, 6);
  // 内部発光ドット（LED粒感）
  ctx.shadowBlur = 0;
  const dotCount = Math.floor(gs / 12);
  for (let i = 0; i < dotCount; i++) {
    const dx = gx + 6 + i * 12;
    ctx.beginPath();
    ctx.arc(dx, y + 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }
};
drawGoalLED(0, '#ff3333', '#ff0000');       // CPU側（上）
drawGoalLED(H - 6, '#33ffff', '#00ffff');   // プレイヤー側（下）
```

**テスト**:
- 既存の `phase1.test.ts` のフィールド描画関連テストが通ること
- 6つのフィールド（classic, wide, pillars, zigzag, fortress, bastion）すべてで表示確認

---

### 1.2 マレットの立体感（US-1.2）

**変更ファイル**: `renderer.ts` の `Renderer.drawMallet()`

**現状の実装**: `ctx.arc()` + `ctx.fill()` で単色の円を描画。`shadowBlur` でグロー。`sizeScale` パラメータでサイズ調整。

**変更内容**:

```typescript
drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string,
           hasGlow: boolean, sizeScale = 1,
           consts: GameConstants = CONSTANTS) {
  const r = consts.SIZES.MALLET * sizeScale;
  const { x, y } = mallet;

  // 1. ドロップシャドウ（楕円）
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 4, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fill();

  // 2. 本体（放射グラデーション = 球体感）
  const bodyGrad = ctx.createRadialGradient(
    x - r * 0.25, y - r * 0.25, r * 0.1,  // 光源（左上寄り）
    x, y, r
  );
  bodyGrad.addColorStop(0, lightenColor(color, 40));   // 明るい中心
  bodyGrad.addColorStop(0.7, color);                    // 本来の色
  bodyGrad.addColorStop(1, darkenColor(color, 40));     // 暗い外縁

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 3. エッジリング
  ctx.strokeStyle = darkenColor(color, 60);
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. ハイライト（左上の光沢スポット）
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  // 5. グロー（速度エフェクト時）
  if (hasGlow) {
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
```

**ヘルパー関数を追加**（`renderer.ts` 先頭に）:

```typescript
// 色を明るくする
const lightenColor = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
};

// 色を暗くする
const darkenColor = (hex: string, amount: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r}, ${g}, ${b})`;
};
```

**テスト**: マレット描画の視覚確認。Big アイテム時の `sizeScale=1.5` でも正常に描画されること。

---

### 1.3 パックの金属質感（US-1.3）

**変更ファイル**: `renderer.ts` の `Renderer.drawPuck()`

**変更内容**:

```typescript
drawPuck(ctx: CanvasRenderingContext2D, puck: Puck,
         consts: GameConstants = CONSTANTS, now = 0) {
  if (!puck.visible) return;
  const r = consts.SIZES.PUCK;
  const speed = magnitude(puck.vx, puck.vy);
  const color = getPuckColorBySpeed(speed);

  // 1. ドロップシャドウ
  ctx.beginPath();
  ctx.ellipse(puck.x + 1, puck.y + 2, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fill();

  // 2. 本体（メタリックグラデーション）
  const metalGrad = ctx.createRadialGradient(
    puck.x - r * 0.2, puck.y - r * 0.2, r * 0.05,
    puck.x, puck.y, r
  );
  metalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  metalGrad.addColorStop(0.3, color);
  metalGrad.addColorStop(0.8, darkenColor(color === '#ffffff' ? '#cccccc' : color, 30));
  metalGrad.addColorStop(1, darkenColor(color === '#ffffff' ? '#999999' : color, 60));

  // 速度グロー
  if (speed > SPEED_NORMAL) {
    ctx.shadowColor = color;
    ctx.shadowBlur = speed > SPEED_FAST ? 25 : 12;
  }

  ctx.beginPath();
  ctx.arc(puck.x, puck.y, r, 0, Math.PI * 2);
  ctx.fillStyle = metalGrad;
  ctx.fill();
  ctx.shadowBlur = 0;

  // 3. エッジリング
  ctx.strokeStyle = `rgba(200, 200, 200, 0.3)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. ハイライト
  ctx.beginPath();
  ctx.arc(puck.x - r * 0.25, puck.y - r * 0.25, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();
}
```

---

### 1.4 ヒットストップ（US-1.4）

**変更ファイル**:
- `core/types.ts`: 型追加
- `hooks/useGameLoop.ts`: ロジック
- `renderer.ts`: 衝撃波描画

#### types.ts に追加

```typescript
export type HitStopState = {
  active: boolean;
  framesRemaining: number;   // 残りフレーム数（3フレーム = 約50ms）
  impactX: number;           // 衝突地点X
  impactY: number;           // 衝突地点Y
  shockwaveRadius: number;   // 衝撃波の現在半径
  shockwaveMaxRadius: number; // 衝撃波の最大半径
};
```

#### useGameLoop.ts の変更

**挿入位置**: パック-マレット衝突判定の直後（既存の `resolveCollision` 呼び出し後）

```typescript
// ヒットストップ判定（パック速度 > STRONG_HIT_THRESHOLD 時）
const STRONG_HIT_THRESHOLD = 8;
const postSpeed = magnitude(puck.vx, puck.vy);
if (postSpeed > STRONG_HIT_THRESHOLD && !hitStopRef.current.active) {
  hitStopRef.current = {
    active: true,
    framesRemaining: 3,
    impactX: puck.x,
    impactY: puck.y,
    shockwaveRadius: 0,
    shockwaveMaxRadius: 80,
  };
}
```

**ゲームループ冒頭に追加**:

```typescript
// ヒットストップ中は物理更新をスキップ、描画のみ実行
if (hitStopRef.current.active) {
  hitStopRef.current.framesRemaining -= 1;
  hitStopRef.current.shockwaveRadius += 20;
  if (hitStopRef.current.framesRemaining <= 0) {
    hitStopRef.current.active = false;
  }
  // 描画のみ実行（物理更新をスキップ）→ 既存の描画セクションにジャンプ
  // ... 描画コード ...
  return;
}
```

#### renderer.ts に `drawShockwave()` 追加

```typescript
drawShockwave(ctx: CanvasRenderingContext2D, hitStop: HitStopState) {
  if (!hitStop.active) return;
  const { impactX, impactY, shockwaveRadius, shockwaveMaxRadius } = hitStop;
  const alpha = 1 - shockwaveRadius / shockwaveMaxRadius;

  ctx.beginPath();
  ctx.arc(impactX, impactY, shockwaveRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 内側の薄い円
  ctx.beginPath();
  ctx.arc(impactX, impactY, shockwaveRadius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
```

---

### 1.5 ゴールスローモーション（US-1.5）

**変更ファイル**:
- `core/types.ts`: 型追加
- `hooks/useGameLoop.ts`: ロジック
- `renderer.ts`: ビネット描画

#### types.ts に追加

```typescript
export type SlowMotionState = {
  active: boolean;
  startTime: number;
  duration: number; // 400ms
};
```

#### useGameLoop.ts の変更

**挿入位置**: ゴール判定直後（パック Y 座標判定 → スコア更新の間）

```typescript
// ゴール検出時にスローモーション開始
if (isGoal) {
  slowMoRef.current = {
    active: true,
    startTime: now,
    duration: 400,
  };
}
```

**ゲームループの物理更新速度制御**:

```typescript
// スローモーション倍率
const getTimeScale = (): number => {
  if (!slowMoRef.current.active) return 1;
  const elapsed = now - slowMoRef.current.startTime;
  if (elapsed >= slowMoRef.current.duration) {
    slowMoRef.current.active = false;
    return 1;
  }
  return 0.3; // 0.3倍速
};

const timeScale = getTimeScale();
// 既存の物理更新で速度に timeScale を乗算
// puck.x += puck.vx * timeScale;
// puck.y += puck.vy * timeScale;
```

#### renderer.ts に `drawVignette()` 追加

```typescript
drawVignette(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS,
             intensity = 0.5) {
  const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
  const grad = ctx.createRadialGradient(W/2, H/2, W * 0.3, W/2, H/2, W * 0.8);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}
```

---

## Phase 2: キャラクター基盤

### 2.1 キャラクター定義（US-2.1, US-2.7）

**新規ファイル**: `core/characters.ts`

```typescript
export type CharacterReaction = {
  onScore: string[];      // 自分が得点した時（ランダム選択）
  onConcede: string[];    // 失点した時
  onWin: string[];        // 勝利時
  onLose: string[];       // 敗北時
};

export type Character = {
  id: string;
  name: string;
  icon: string;           // アイコン画像パス（public/assets/characters/）
  color: string;          // テーマカラー（マレット色に使用）
  reactions: CharacterReaction;
};

// 主人公
export const PLAYER_CHARACTER: Character = {
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/akira.png',
  color: '#3498db',
  reactions: {
    onScore: ['よし！', 'いける！'],
    onConcede: ['くっ…！', 'まだまだ！'],
    onWin: ['やった！'],
    onLose: ['次は負けない…'],
  },
};

// フリー対戦用キャラ（難易度別）
export const FREE_BATTLE_CHARACTERS: Record<string, Character> = {
  easy: {
    id: 'rookie',
    name: 'ルーキー',
    icon: '/assets/characters/rookie.png',
    color: '#e74c3c',
    reactions: {
      onScore: ['おっ、入った！', 'ラッキー！'],
      onConcede: ['あちゃー', 'やるね〜'],
      onWin: ['やったー！'],
      onLose: ['ま、いっか〜'],
    },
  },
  normal: {
    id: 'regular',
    name: 'レギュラー',
    icon: '/assets/characters/regular.png',
    color: '#e74c3c',
    reactions: {
      onScore: ['いい感じ！', 'もらった！'],
      onConcede: ['なかなかやるな', 'ちっ…'],
      onWin: ['勝った！'],
      onLose: ['やるじゃないか…'],
    },
  },
  hard: {
    id: 'ace',
    name: 'エース',
    icon: '/assets/characters/ace.png',
    color: '#e74c3c',
    reactions: {
      onScore: ['当然だ', 'フッ…'],
      onConcede: ['…面白い', 'なるほどな'],
      onWin: ['実力通りだ'],
      onLose: ['…認めよう、お前は強い'],
    },
  },
};

// ストーリーモード キャラクター（第1章）
export const STORY_CHARACTERS = {
  hiro: {
    id: 'hiro',
    name: 'ヒロ',
    icon: '/assets/characters/hiro.png',
    color: '#e67e22',
    reactions: {
      onScore: ['へへっ！', 'どんなもんだ！'],
      onConcede: ['うわっ！', 'マジか！'],
      onWin: ['俺の勝ちだな！'],
      onLose: ['やるじゃん！参った！'],
    },
  },
  misaki: {
    id: 'misaki',
    name: 'ミサキ',
    icon: '/assets/characters/misaki.png',
    color: '#9b59b6',
    reactions: {
      onScore: ['ふふっ♪', 'こんなもんよ'],
      onConcede: ['え、嘘…', 'やるわね…'],
      onWin: ['私の勝ちね♪'],
      onLose: ['あなた…やるわね'],
    },
  },
  takuma: {
    id: 'takuma',
    name: 'タクマ',
    icon: '/assets/characters/takuma.png',
    color: '#c0392b',
    reactions: {
      onScore: ['甘いな', 'まだまだだ'],
      onConcede: ['…なかなかやる', 'ほう…'],
      onWin: ['部長の座は渡さんぞ'],
      onLose: ['見事だ…お前を認める'],
    },
  },
} as const;
```

#### Scoreboard.tsx の変更

**Props に追加**:

```typescript
type ScoreboardProps = {
  scores: { p: number; c: number };
  onMenuClick: () => void;
  onPauseClick?: () => void;
  cpuName?: string;  // 追加: CPU キャラ名
};
```

**「CPU」テキストの置換**:

```tsx
// 変更前
<ScoreText color="#e74c3c">{scores.c}</ScoreText>
// 変更後
<ScoreLabel>{cpuName ?? 'CPU'}</ScoreLabel>
<ScoreText color="#e74c3c">{scores.c}</ScoreText>
```

#### renderer.ts にリアクション吹き出し追加

```typescript
drawReaction(ctx: CanvasRenderingContext2D, text: string,
             side: 'player' | 'cpu', consts: GameConstants = CONSTANTS,
             elapsed: number) {
  const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
  const alpha = Math.max(0, 1 - elapsed / 1500);
  if (alpha <= 0) return;

  const x = side === 'cpu' ? W * 0.7 : W * 0.7;
  const y = side === 'cpu' ? H * 0.15 : H * 0.85;

  // 吹き出し背景
  ctx.globalAlpha = alpha;
  const metrics = ctx.measureText(text);
  const padding = 12;
  const bw = metrics.width + padding * 2;
  const bh = 32;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  // 角丸四角
  const rx = x - bw / 2;
  const ry = y - bh / 2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, bw, bh, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // テキスト
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}
```

---

### 2.2 キャラクターアイコン画像仕様（US-2.7）

**画像仕様**:
- サイズ: 128x128px（表示時は 64x64px に縮小、Retina 対応）
- フォーマット: PNG（透過背景）
- アートスタイル: アニメ調、明るい色彩、シンプルな線画
- 配置先: `public/assets/characters/`

**必要な画像**:

| ファイル名 | キャラ名 | 用途 |
|-----------|---------|------|
| `akira.png` | アキラ（主人公） | ダイアログ、VS画面 |
| `hiro.png` | ヒロ（ステージ1-1） | ダイアログ、VS画面、ステージ選択 |
| `misaki.png` | ミサキ（ステージ1-2） | 同上 |
| `takuma.png` | タクマ（ステージ1-3） | 同上 |
| `rookie.png` | ルーキー（Easy） | フリー対戦 |
| `regular.png` | レギュラー（Normal） | フリー対戦 |
| `ace.png` | エース（Hard） | フリー対戦 |

**AI 画像生成プロンプト設計** → `image-prompts.md` に詳細プロンプト・外見設定・ファイル名一覧を定義済み

**コード内の参照パス**: `characters.ts` の各キャラクター `icon` フィールドで `/assets/characters/<ファイル名>` として参照

---

## Phase 3: ストーリーモード

### 3.1 データ構造

**新規ファイル**: `core/story.ts`

```typescript
import { Difficulty } from './types';

export type Dialogue = {
  characterId: string;   // 話者のキャラID
  text: string;          // セリフ本文
};

export type StageDefinition = {
  id: string;            // "1-1", "1-2", "1-3"
  chapter: number;
  stageNumber: number;
  name: string;          // ステージ名
  characterId: string;   // 対戦相手キャラID
  fieldId: string;       // フィールドID（config.ts の FIELDS に対応）
  difficulty: Difficulty;
  winScore: number;
  preDialogue: Dialogue[];
  postWinDialogue: Dialogue[];
  postLoseDialogue: Dialogue[];
};

export type StoryProgress = {
  clearedStages: string[];   // クリア済みステージID配列
};

// localStorage キー
const STORY_PROGRESS_KEY = 'ah_story_progress';

export const loadStoryProgress = (): StoryProgress => {
  const raw = localStorage.getItem(STORY_PROGRESS_KEY);
  if (!raw) return { clearedStages: [] };
  return JSON.parse(raw);
};

export const saveStoryProgress = (progress: StoryProgress): void => {
  localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress));
};

export const resetStoryProgress = (): void => {
  localStorage.removeItem(STORY_PROGRESS_KEY);
};

export const isStageUnlocked = (stageId: string, progress: StoryProgress,
                                 stages: StageDefinition[]): boolean => {
  const idx = stages.findIndex(s => s.id === stageId);
  if (idx === 0) return true; // 最初のステージは常に解放
  const prevStage = stages[idx - 1];
  return progress.clearedStages.includes(prevStage.id);
};
```

**新規ファイル**: `core/dialogue-data.ts`

```typescript
import { StageDefinition } from './story';

export const CHAPTER_1_STAGES: StageDefinition[] = [
  {
    id: '1-1',
    chapter: 1,
    stageNumber: 1,
    name: 'はじめの一打',
    characterId: 'hiro',
    fieldId: 'classic',
    difficulty: 'easy',
    winScore: 3,
    preDialogue: [
      { characterId: 'hiro', text: 'おっ、新入り？ エアホッケー部へようこそ！' },
      { characterId: 'hiro', text: 'まずは俺と一勝負だ。基本を見せてやるよ！' },
      { characterId: 'player', text: 'よろしくお願いします！' },
    ],
    postWinDialogue: [
      { characterId: 'hiro', text: 'やるじゃん！ 初めてとは思えないな！' },
      { characterId: 'hiro', text: 'でもこの部にはもっと強い先輩がいるぜ。' },
      { characterId: 'hiro', text: '次はミサキ先輩に挑戦してみな！' },
    ],
    postLoseDialogue: [
      { characterId: 'hiro', text: 'ドンマイ！ 最初は誰でもこんなもんだ。' },
      { characterId: 'hiro', text: 'もう一回やろうぜ！ コツを教えるからさ。' },
    ],
  },
  {
    id: '1-2',
    chapter: 1,
    stageNumber: 2,
    name: 'テクニカルな壁',
    characterId: 'misaki',
    fieldId: 'wide',
    difficulty: 'normal',
    winScore: 3,
    preDialogue: [
      { characterId: 'misaki', text: 'あなたが噂の新入り？ ヒロに勝ったんですって？' },
      { characterId: 'misaki', text: '私のフィールドは広いわよ。テクニックがないと厳しいかも♪' },
      { characterId: 'player', text: '負けません！' },
      { characterId: 'misaki', text: 'その意気よ！ アイテムの使い方、教えてあげる。' },
    ],
    postWinDialogue: [
      { characterId: 'misaki', text: 'まさか…私が負けるなんて…' },
      { characterId: 'misaki', text: 'あなた、才能あるわね。部長にも通じるかも。' },
      { characterId: 'misaki', text: 'タクマ先輩は手強いわよ。覚悟してね。' },
    ],
    postLoseDialogue: [
      { characterId: 'misaki', text: 'まだまだね♪ でもセンスは悪くないわ。' },
      { characterId: 'misaki', text: 'アイテムをうまく使えるようになれば、きっと勝てるわ。' },
    ],
  },
  {
    id: '1-3',
    chapter: 1,
    stageNumber: 3,
    name: '部長の壁',
    characterId: 'takuma',
    fieldId: 'pillars',
    difficulty: 'hard',
    winScore: 5,
    preDialogue: [
      { characterId: 'takuma', text: 'お前がヒロとミサキを倒した新入りか。' },
      { characterId: 'takuma', text: '面白い。だが部長の俺を倒すのは、そう簡単じゃないぞ。' },
      { characterId: 'player', text: '全力でいきます！' },
      { characterId: 'takuma', text: '…いい目だ。来い。' },
    ],
    postWinDialogue: [
      { characterId: 'takuma', text: '…見事だ。お前を部の正式メンバーとして認めよう。' },
      { characterId: 'takuma', text: '次は地区大会だ。もっと強い相手が待っている。' },
      { characterId: 'player', text: 'はい！ もっと強くなります！' },
    ],
    postLoseDialogue: [
      { characterId: 'takuma', text: 'まだ甘いな。だが…諦めない姿勢は認める。' },
      { characterId: 'takuma', text: '鍛え直して、もう一度来い。' },
    ],
  },
];
```

---

### 3.2 画面遷移フロー

**AirHockeyGame.tsx の `screen` 状態に追加**:

```
既存: 'menu' | 'game' | 'result' | 'achievements' | 'daily'
追加: 'stageSelect' | 'preDialogue' | 'vsScreen' | 'postDialogue'
```

**ストーリーモード遷移フロー**:

```
menu
  → stageSelect（ステージ選択画面）
    → preDialogue（試合前ダイアログ）
      → vsScreen（VS 画面、2秒自動遷移）
        → game（カウントダウン → 試合）
          → postDialogue（試合後ダイアログ）
            → result（リザルト画面）
              → stageSelect（戻る）
```

**GameMode 型追加**（`core/types.ts`）:

```typescript
export type GameMode = 'free' | 'story';
```

**AirHockeyGame.tsx に追加する state**:

```typescript
const [gameMode, setGameMode] = useState<GameMode>('free');
const [currentStage, setCurrentStage] = useState<StageDefinition | null>(null);
const [storyProgress, setStoryProgress] = useState<StoryProgress>(loadStoryProgress);
```

---

### 3.3 新規コンポーネント仕様

#### StageSelectScreen.tsx

**Props**:
```typescript
type StageSelectScreenProps = {
  stages: StageDefinition[];
  progress: StoryProgress;
  characters: Record<string, Character>;
  onSelectStage: (stage: StageDefinition) => void;
  onBack: () => void;
  onReset: () => void;
};
```

**レイアウト**:
```
┌─────────────────────────┐
│  第1章 はじめの挑戦       │  ← 章タイトル
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ ✅ 1-1 はじめの一打   │ │  ← クリア済み
│ │ 👤 ヒロ │ Original    │ │
│ │ ⭐ Easy             │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ ○ 1-2 テクニカルな壁  │ │  ← 未クリア（解放済み）
│ │ 👤 ミサキ │ Wide      │ │
│ │ ⭐⭐ Normal          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🔒 1-3 部長の壁      │ │  ← 未解放
│ │ ???                  │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ [リセット]    [戻る]     │
└─────────────────────────┘
```

#### DialogueOverlay.tsx

**Props**:
```typescript
type DialogueOverlayProps = {
  dialogues: Dialogue[];
  characters: Record<string, Character>;
  onComplete: () => void;
};
```

**レイアウト**:
```
┌─────────────────────────┐
│                          │  ← 背景暗転（半透明黒）
│                          │
│                          │
│ ┌──────────────────────┐ │
│ │ [icon] ヒロ           │ │  ← キャラアイコン + 名前
│ │ おっ、新入り？        │ │  ← セリフ（1文字ずつ表示）
│ │ エアホッケー部へ       │ │
│ │ ようこそ！            │ │
│ │         [スキップ] ▶  │ │  ← タップで次へ / スキップ
│ └──────────────────────┘ │
└─────────────────────────┘
```

**挙動**:
- セリフは1文字ずつ表示（30ms/文字）
- 表示中にタップ → 即座に全文表示
- 全文表示中にタップ → 次のセリフへ
- 最後のセリフの後にタップ → `onComplete()` 呼出
- 「スキップ」ボタンで即 `onComplete()`

#### VsScreen.tsx

**Props**:
```typescript
type VsScreenProps = {
  playerCharacter: Character;
  cpuCharacter: Character;
  stageName: string;
  fieldName: string;
  onComplete: () => void;
};
```

**レイアウト**:
```
┌─────────────────────────┐
│          VS              │  ← 中央に大文字「VS」
│                          │
│  [icon]     [icon]       │
│  アキラ  vs  ヒロ         │
│                          │
│  Stage 1-1               │
│  はじめの一打             │
│  Field: Original         │
└─────────────────────────┘
```

**挙動**:
- フェードインで表示（300ms）
- 2秒間表示
- フェードアウト（300ms）→ `onComplete()`

---

### 3.4 TitleScreen.tsx の変更

**追加ボタン**: 「ストーリー」ボタンを「START」ボタンの上に配置

```tsx
<StoryButton onClick={onStoryClick}>
  📖 ストーリー
</StoryButton>
<StartButton onClick={() => onStart()}>
  フリー対戦
</StartButton>
```

**Props に追加**:
```typescript
onStoryClick: () => void;
```

---

## 画面遷移の全体図（MVP 完了後）

```
menu ──────────┬────── stageSelect ── preDialogue ── vsScreen ── game ── postDialogue ── result
               │                                                   ↑
               ├────── game（フリー対戦）── result                   │
               │                                                   │
               ├────── achievements                                │
               ├────── daily ── game ── result                     │
               └────── settings                                    │
                                                                   │
                       result ── [リプレイ] ──────────────────────┘
                              ── [ステージ選択] → stageSelect
                              ── [メニュー] → menu
```
