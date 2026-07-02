# IPNE Phase 2「キャラ・敵の生命感」実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プレイヤー攻撃の4枚化・被弾専用フレーム（プレイヤー＋全敵）・敵の予備動作と種別個性で、キャラクターの生命感を底上げする（スペック: `docs/superpowers/specs/2026-07-02-ipne-visual-motion-brushup-design.md` の Phase 2）。

**Architecture:** すべて `src/features/ipne/presentation/` 層で完結。プレイヤースプライトは既存流儀（生の 2D パレット配列を1行1フレームで手書き）、敵の新フレームは `applyEnemyPixelEdits(base, edits)` による差分編集で追加する。攻撃フレーム選択は free-running modulo から進行度ベースへ変更（プレイヤーは `playerAttackUntilRef`、敵は `enemy.attackAnimUntil` からの逆算）。品質は不変条件テスト（サイズ・パレット範囲・フレーム間差分）でゲートする。

**Tech Stack:** React 19 + Canvas 2D + Jest 30。テストは対象と同ディレクトリに `*.test.ts`。

## Global Constraints

- ブランチ: `feature/ipne-visual-p2`（作成済み・origin/main 起点、Phase 1 マージ済み）
- `domain/` / `application/` のファイルは変更禁止（型・定数の参照は可。依存方向 presentation→domain は合法）
- `any` 型禁止。コメントは日本語
- ロジック（フレーム選択・トラッカー API・進行度計算）は TDD。スプライト配列自体は不変条件テストで検証（サイズ 32×32、パレット index 範囲内、既存フレームとの非同一）
- 各タスク完了時にコミット（Conventional Commits、日本語）
- 最終タスクで `npm run ci` 全パス。E2E は CI 実行
- Phase 1 で確立した前提を壊さない: rAF 描画ループ、`FrameContext.now` は凍結 visualNow（`realNow` が実時刻）、`EffectManager.updateAt`、`VisualPositionTracker` 経由の描画位置

## 既存コードの前提知識（全タスク共通）

- プレイヤースプライト: `presentation/sprites/warriorSpritesV3.ts`（72行）/ `thiefSpritesV3.ts`（63行）。1フレーム＝1行の `number[][]` リテラル（32×32）。`def(pixels)` / `sheet(frames, frameDuration)` ヘルパー、パレット13色（index 0 透明）
- `WARRIOR_ATTACK_SPRITE_SHEETS` は `Record<Direction, SpriteSheetDefinition>`、現在 `sheet([atk1, atk2], 150)`（thief は 130）
- `WARRIOR_DAMAGE_SPRITES` / `THIEF_DAMAGE_SPRITES` は現在 idle 流用（warriorSpritesV3.ts:67-72 / thiefSpritesV3.ts:61-63）
- 不変条件テスト: `warriorSpritesV3.test.ts` / `thiefSpritesV3.test.ts`。`allFrames()`（21-27行付近）が全シートを平坦化して 32×32・パレット範囲を検証。**新シート追加時は `allFrames()` への登録が必須**
- 敵スプライト: `presentation/sprites/enemySprites.ts`（2488行）。状態別フレームは「ベース pixels リテラル＋`applyEnemyPixelEdits(base, edits)`」方式（例: `PATROL_ATTACK_FRAME` 1752-1803行）。`PixelEdit = { x, y, value }`（`pixelOps.ts:10`）
- 敵の攻撃状態: `EnemyState.ATTACK` は 300ms 固定（`GAME_BALANCE.enemyAi.attackAnimDurationMs`）。`Enemy.attackAnimUntil?: number` が終了時刻を持ち、開始時刻は `attackAnimUntil - 300` で逆算（`drawPlayer.ts:128` と同パターン）。非ボス4種（PATROL/CHARGE/RANGED/SPECIMEN）に被弾フレームなし、溜めフレームは全種なし
- `drawPlayer.ts:125` の攻撃フレーム選択は free-running modulo（`Math.floor(now / frameDuration) % length`）で、変形（`computeAttackTransform`）は progress ベース — 時間基準が不統一
- `drawEnemies.ts:39-60` `getEnemyStateFrame(enemyType, enemyState)` が ATTACK/KNOCKBACK の静的1枚を返す
- CHARGE の突進は単発2タイルワープ（`enemyMovement.ts` の `attemptLunge`）。`VisualPositionTracker` は距離 1.5 超をスナップするため lunge は補間されない
- 陳腐化コメント: enemySprites.ts の 18/229/496/743/1311/1522 行（「2フレーム」「16×16」等）、drawWorld.ts:4-5 / drawEnemies.ts:4 / combatEffects.ts:15-17 / renderContext.ts:4-6 の「逐語移植・完全に同一」ヘッダー

---

### Task 1: プレイヤー攻撃の4枚化（進行度ベース選択）

**Files:**
- Modify: `src/features/ipne/presentation/sprites/warriorSpritesV3.ts`
- Modify: `src/features/ipne/presentation/sprites/thiefSpritesV3.ts`
- Modify: `src/features/ipne/presentation/sprites/motion.ts`（フレーム選択関数を追加）
- Modify: `src/features/ipne/presentation/screens/render/drawPlayer.ts`
- Test: `src/features/ipne/presentation/sprites/motion.test.ts`（追記）、`warriorSpritesV3.test.ts` / `thiefSpritesV3.test.ts`（追記）

**Interfaces:**
- Consumes: 既存 `def` / `sheet` ヘルパー、`ATTACK_DURATION_MS = 300`（drawPlayer.ts:32）
- Produces: `selectProgressFrameIndex(progress: number, frameCount: number): number`（motion.ts、純粋関数 — Task 4 も使用）。`WARRIOR_ATTACK_SPRITE_SHEETS` / `THIEF_ATTACK_SPRITE_SHEETS` が各方向4枚（`sheet([windup, atk1, atk2, recover], 75)`）

- [ ] **Step 1: selectProgressFrameIndex を TDD で追加（motion.test.ts に追記 → RED）**

```typescript
describe('selectProgressFrameIndex', () => {
  it('進行度 0 で最初のフレーム、1 直前で最後のフレームを返す', () => {
    expect(selectProgressFrameIndex(0, 4)).toBe(0);
    expect(selectProgressFrameIndex(0.99, 4)).toBe(3);
  });

  it('進行度に応じて均等にフレームが切り替わる', () => {
    expect(selectProgressFrameIndex(0.2, 4)).toBe(0);
    expect(selectProgressFrameIndex(0.3, 4)).toBe(1);
    expect(selectProgressFrameIndex(0.6, 4)).toBe(2);
    expect(selectProgressFrameIndex(0.8, 4)).toBe(3);
  });

  it('範囲外はクランプする（1 以上でも最終フレーム）', () => {
    expect(selectProgressFrameIndex(-0.5, 4)).toBe(0);
    expect(selectProgressFrameIndex(1, 4)).toBe(3);
    expect(selectProgressFrameIndex(1.5, 4)).toBe(3);
  });
});
```

Run: `npm test -- src/features/ipne/presentation/sprites/motion.test.ts` → FAIL 確認

- [ ] **Step 2: motion.ts に実装（GREEN）**

```typescript
/**
 * 進行度（0..1）からアニメーションフレーム番号を選択する。
 * free-running modulo と違い、モーションの開始・終了とフレームが同期する。
 *
 * @param progress 進行度 0..1（範囲外はクランプ）
 * @param frameCount フレーム総数（正の整数であること）
 */
export function selectProgressFrameIndex(progress: number, frameCount: number): number {
  const t = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  return Math.min(frameCount - 1, Math.floor(t * frameCount));
}
```

- [ ] **Step 3: 攻撃フレームを4枚化（スプライト作画）**

warrior/thief 各4方向に `windup`（予備動作）と `recover`（復帰）フレームを追加する。既存流儀（1フレーム＝1行の 32×32 リテラル）を厳守。作画方針:

- `W_down_windup` 等: **atk1 の配列をコピーして編集** — 武器腕を振りかぶり側（進行方向の逆）へ 2〜3px 引き、上体をわずかに後傾（頭部・胴の列を1px 逆方向シフト）。既存パレットのみ使用（新色追加禁止）
- `W_down_recover` 等: **idle の配列をコピーして編集** — 武器腕だけ atk2 の位置から idle 位置へ戻る中間（1〜2px 差）に置く
- 盗賊は二刀のため windup は両腕を引く。盗賊の個性（すばやさ）を出すため編集量は戦士より小さく（1〜2px）
- シート定義を更新: `sheet([W_down_windup, W_down_atk1, W_down_atk2, W_down_recover], 75)`（thief も同様、frameDuration 75）

不変条件テストを追記（warriorSpritesV3.test.ts / thiefSpritesV3.test.ts、`allFrames()` は ATTACK シート経由で新フレームを自動的に含むことを確認した上で）:

```typescript
it('攻撃シートは4フレームで、隣接フレームが互いに異なる', () => {
  for (const dir of ['down', 'up', 'left', 'right'] as const) {
    const sheet = WARRIOR_ATTACK_SPRITE_SHEETS[dir];
    expect(sheet.sprites).toHaveLength(4);
    for (let i = 0; i < 3; i++) {
      expect(sheet.sprites[i].pixels).not.toEqual(sheet.sprites[i + 1].pixels);
    }
  }
});
```

Run: `npm test -- src/features/ipne/presentation/sprites` → 全緑（32×32・パレット範囲は既存テストが新フレームにも自動適用される）

- [ ] **Step 4: drawPlayer のフレーム選択を進行度ベースに変更**

`drawPlayer.ts:125` の

```typescript
const attackFrameIndex = Math.floor(now / attackSheet.frameDuration) % attackSheet.sprites.length;
```

を、既存の `atkProgress` 計算（128-129行）を上に移動した上で

```typescript
const attackFrameIndex = selectProgressFrameIndex(atkProgress, attackSheet.sprites.length);
```

に変更（import 追加: `selectProgressFrameIndex` を `'../../sprites/motion'` から）。`computeAttackTransform` と同じ progress を共有し、時間基準を統一する。

- [ ] **Step 5: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): プレイヤー攻撃アニメを4枚化し進行度ベース選択に統一

- 予備動作→振り→フォロースルー→復帰の4フレーム（戦士・盗賊×4方向）
- フレーム選択を free-running modulo から攻撃進行度ベースへ変更
- computeAttackTransform と時間基準を統一"
```

---

### Task 2: プレイヤー被弾専用フレーム

**Files:**
- Modify: `src/features/ipne/presentation/sprites/warriorSpritesV3.ts`（DAMAGE_SPRITES の idle 流用を置換）
- Modify: `src/features/ipne/presentation/sprites/thiefSpritesV3.ts`（同上）
- Test: `warriorSpritesV3.test.ts` / `thiefSpritesV3.test.ts`（追記）

**Interfaces:**
- Consumes: 既存 `def` ヘルパー、既存 idle フレーム配列
- Produces: `WARRIOR_DAMAGE_SPRITES` / `THIEF_DAMAGE_SPRITES`（型は既存のまま `Record<Direction, SpriteDefinition>`、中身が専用フレームに）。drawPlayer 側は変更不要（参照は既存）

- [ ] **Step 1: 被弾フレームを作画**

各クラス×4方向の `W_down_damage` 等を追加。作画方針: **idle の配列をコピーして編集** — のけぞり（上体を被弾方向逆へ 1〜2px シフト）＋目を閉じる/食いしばり（顔部の 2〜4 ピクセル変更）＋防御姿勢（腕を体の前へ）。白点滅（`drawPlayer.ts:91` の isBlinkOff）と重なるため、シルエット変化を主とし色変更は最小限に。

`WARRIOR_DAMAGE_SPRITES` の定義（67-72行）を `down: def(W_down_damage), ...` に置換（thief も同様）。

- [ ] **Step 2: 不変条件テスト追記（RED→GREEN の順で）**

```typescript
it('被弾フレームは idle と異なる専用フレームである', () => {
  for (const dir of ['down', 'up', 'left', 'right'] as const) {
    expect(WARRIOR_DAMAGE_SPRITES[dir].pixels).not.toEqual(
      WARRIOR_IDLE_SPRITE_SHEETS[dir].sprites[0].pixels
    );
  }
});
```

（このテストを先に書いて FAIL（現状 idle 流用のため）を確認してから作画するのが RED→GREEN）
`allFrames()` が DAMAGE を含むことを確認（含まれている: 既存実装）。

Run: `npm test -- src/features/ipne/presentation/sprites` → PASS

- [ ] **Step 3: コミット**

```bash
git add -A src/features/ipne/presentation/sprites
git commit -m "feat(ipne): プレイヤー被弾専用フレームを追加（idle 流用を解消）

- 戦士・盗賊×4方向にのけぞり姿勢の専用フレーム
- 被弾フレームが idle と異なることを不変条件テストで保証"
```

---

### Task 3: 敵の被弾フレーム（非ボス4種＋ボス品質向上）

**Files:**
- Modify: `src/features/ipne/presentation/sprites/enemySprites.ts`
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`（KNOCKBACK 分岐拡張）
- Test: `src/features/ipne/presentation/sprites/enemySprites.test.ts`（存在すれば追記、無ければ状態フレーム用に新規作成）

**Interfaces:**
- Consumes: `applyEnemyPixelEdits(base, edits)`（enemySprites.ts:12-15）、各 `*_SPRITE_SHEET.sprites[0]` をベースに
- Produces: `PATROL_DAMAGE_FRAME` / `CHARGE_DAMAGE_FRAME` / `RANGED_DAMAGE_FRAME` / `SPECIMEN_DAMAGE_FRAME`（export、`SpriteDefinition`）。`getEnemyStateFrame` の KNOCKBACK 分岐が全7種を返す

- [ ] **Step 1: 失敗するテストを書く**

```typescript
import {
  PATROL_DAMAGE_FRAME, CHARGE_DAMAGE_FRAME,
  RANGED_DAMAGE_FRAME, SPECIMEN_DAMAGE_FRAME,
  PATROL_SPRITE_SHEET, CHARGE_SPRITE_SHEET,
  RANGED_SPRITE_SHEET, SPECIMEN_SPRITE_SHEET,
} from './enemySprites';

describe('非ボス敵の被弾フレーム', () => {
  const cases = [
    ['PATROL', PATROL_DAMAGE_FRAME, PATROL_SPRITE_SHEET],
    ['CHARGE', CHARGE_DAMAGE_FRAME, CHARGE_SPRITE_SHEET],
    ['RANGED', RANGED_DAMAGE_FRAME, RANGED_SPRITE_SHEET],
    ['SPECIMEN', SPECIMEN_DAMAGE_FRAME, SPECIMEN_SPRITE_SHEET],
  ] as const;

  it.each(cases)('%s: ベースと同サイズ・同パレットで、ピクセルが異なる', (_name, frame, sheet) => {
    const base = sheet.sprites[0];
    expect(frame.width).toBe(base.width);
    expect(frame.height).toBe(base.height);
    expect(frame.palette).toEqual(base.palette);
    expect(frame.pixels).not.toEqual(base.pixels);
  });
});
```

Run: 対象テスト → FAIL（フレーム未定義）

- [ ] **Step 2: applyEnemyPixelEdits で4種の被弾フレームを実装**

既存の `BOSS_DAMAGE_FRAME`（2219行付近）の流儀に合わせ、「8. 状態別追加フレーム」セクションに追加。編集方針（各 10〜20 edits）:
- PATROL（スライム）: 体を横につぶす（上部輪郭を1px 下げ、左右へ広げ）＋目を×に
- CHARGE（突進獣）: 頭部を上げてのけぞり＋口を開く
- RANGED（射手）: 弓/腕を下げて防御姿勢＋後傾
- SPECIMEN（クリスタル）: 亀裂ピクセル（明色の斜め線 3〜4 点）を追加

ボス3種の既存 `_DAMAGE_FRAME` 品質向上: 各 5〜10 edits 追加（ひび・体勢崩れの強調）。既存 edits は削除せず追加のみ。

- [ ] **Step 3: drawEnemies の KNOCKBACK 分岐を拡張**

`getEnemyStateFrame`（drawEnemies.ts:52-58）の KNOCKBACK switch に4種を追加:

```typescript
  if (enemyState === EnemyState.KNOCKBACK) {
    switch (enemyType) {
      case EnemyType.PATROL: return PATROL_DAMAGE_FRAME;
      case EnemyType.CHARGE: return CHARGE_DAMAGE_FRAME;
      case EnemyType.RANGED: return RANGED_DAMAGE_FRAME;
      case EnemyType.SPECIMEN: return SPECIMEN_DAMAGE_FRAME;
      case EnemyType.BOSS: return BOSS_DAMAGE_FRAME;
      case EnemyType.MINI_BOSS: return MINI_BOSS_DAMAGE_FRAME;
      case EnemyType.MEGA_BOSS: return MEGA_BOSS_DAMAGE_FRAME;
    }
  }
```

import に4定数を追加。

- [ ] **Step 4: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): 全敵に被弾フレームを追加

- 非ボス4種（PATROL/CHARGE/RANGED/SPECIMEN）に applyEnemyPixelEdits で被弾姿勢を追加
- ボス3種の既存被弾フレームの描き込みを強化
- KNOCKBACK 時のフレーム分岐を全7種に拡張"
```

---

### Task 4: 敵の予備動作（溜め→攻撃の2段モーション）

**Files:**
- Modify: `src/features/ipne/presentation/sprites/enemySprites.ts`（溜めフレーム追加）
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`（進行度ベース2段分岐）
- Test: `enemySprites.test.ts`（追記）、`drawEnemies` のフレーム選択ロジックは純粋関数化してテスト

**Interfaces:**
- Consumes: `Enemy.attackAnimUntil?: number`（domain 型、読み取りのみ）、攻撃継続 300ms（`GAME_BALANCE.enemyAi.attackAnimDurationMs` を feature index 経由で import。エクスポートされていなければ `domain/config/gameBalance` から直接 import — domain 参照は合法）、Task 1 の `selectProgressFrameIndex`
- Produces: `PATROL_WINDUP_FRAME` / `CHARGE_WINDUP_FRAME` / `RANGED_WINDUP_FRAME` / `SPECIMEN_WINDUP_FRAME` / `BOSS_WINDUP_FRAME` / `MINI_BOSS_WINDUP_FRAME` / `MEGA_BOSS_WINDUP_FRAME`（export）。`selectEnemyAttackFrame(enemyType: string, progress: number): SpriteDefinition | null`（純粋関数、drawEnemies.ts 内 export）

- [ ] **Step 1: 溜めフレームを applyEnemyPixelEdits で7種追加（テスト先行）**

Task 3 と同型の it.each テストを WINDUP 7種に追加（ベース同サイズ・同パレット・ピクセル相違）→ FAIL 確認 → 実装。編集方針: 発光（アクセント色ピクセルを輪郭に 4〜8 点）＋膨張/沈み込み（輪郭 1px 拡張 or 脚部圧縮）。種別の個性: CHARGE は前傾、RANGED は弓を引き絞る、SPECIMEN は中心の輝点増加、ボス系は目の発光強化。

- [ ] **Step 2: 攻撃フレーム選択を進行度2段に（純粋関数化・TDD）**

`getEnemyStateFrame` から ATTACK 分岐を分離し、進行度対応の関数を新設（drawEnemies.ts 内 export、テストは drawEnemies.test.ts 新規または既存に追記）:

```typescript
/** 攻撃進行度の溜め→実行の境界（前 40% が溜め） */
export const ENEMY_WINDUP_RATIO = 0.4;

/**
 * 攻撃中の敵フレームを進行度で選択する（前 40% 溜め、後 60% 攻撃）
 */
export function selectEnemyAttackFrame(
  enemyType: string,
  progress: number
): SpriteDefinition | null {
  const isWindup = progress < ENEMY_WINDUP_RATIO;
  switch (enemyType) {
    case EnemyType.PATROL: return isWindup ? PATROL_WINDUP_FRAME : PATROL_ATTACK_FRAME;
    // ... 全7種
  }
  return null;
}
```

テスト例:

```typescript
it('進行度 0.39 は溜め、0.4 以降は攻撃フレームを返す', () => {
  expect(selectEnemyAttackFrame(EnemyType.PATROL, 0.39)).toBe(PATROL_WINDUP_FRAME);
  expect(selectEnemyAttackFrame(EnemyType.PATROL, 0.4)).toBe(PATROL_ATTACK_FRAME);
});
```

- [ ] **Step 3: drawEnemies の描画分岐を進行度ベースに**

敵ループ内の状態フレーム選択（173行付近）を変更: `enemy.state === EnemyState.ATTACK && enemy.attackAnimUntil !== undefined` のとき

```typescript
const attackElapsed = now - (enemy.attackAnimUntil - ENEMY_ATTACK_ANIM_DURATION_MS);
const attackProgress = attackElapsed / ENEMY_ATTACK_ANIM_DURATION_MS;
const frame = selectEnemyAttackFrame(enemy.type, attackProgress);
```

`attackAnimUntil` が undefined の場合は従来の `getEnemyStateFrame`（ATTACK 静的フレーム）へフォールバック。KNOCKBACK 分岐は Task 3 のまま。

- [ ] **Step 4: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): 敵の攻撃に予備動作（溜め）を追加

- 全7種に発光・膨張の溜めフレームを追加（applyEnemyPixelEdits）
- 攻撃 300ms を前40%溜め→後60%攻撃の進行度2段モーションに
- attackAnimUntil からの逆算で進行度を取得（domain 無変更）"
```

---

### Task 5: 種別個性エフェクト（CHARGE 残像・RANGED 詠唱光・SPECIMEN 脈動）

**Files:**
- Modify: `src/features/ipne/presentation/screens/render/visualPosition.ts`（直近遷移の公開 API 追加）
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`（種別エフェクト描画）
- Test: `visualPosition.test.ts`（追記）

**Interfaces:**
- Consumes: `TweenEntry`（visualPosition.ts 内部）、Task 4 の windup 判定
- Produces: `VisualPositionTracker.getRecentTransition(id: string, now: number): { from: Position; to: Position; startAt: number; isWarp: boolean } | undefined`（直近の位置遷移。`TRANSITION_MEMORY_MS = 240` を超えたら undefined）

- [ ] **Step 1: getRecentTransition を TDD で追加**

テスト（RED）:

```typescript
describe('getRecentTransition', () => {
  it('移動直後は遷移情報を返し、ワープはisWarp=trueで元位置を保持する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('e1', { x: 5, y: 3 }, 1000);
    tracker.resolve('e1', { x: 7, y: 3 }, 1100); // 距離2 > 1.5 → ワープ
    const t = tracker.getRecentTransition('e1', 1150);
    expect(t).toEqual({ from: { x: 5, y: 3 }, to: { x: 7, y: 3 }, startAt: 1100, isWarp: true });
  });

  it('TRANSITION_MEMORY_MS 経過後は undefined を返す', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('e1', { x: 5, y: 3 }, 1000);
    tracker.resolve('e1', { x: 6, y: 3 }, 1100);
    expect(tracker.getRecentTransition('e1', 1100 + 240)).toBeUndefined();
  });

  it('未知のIDと移動していないエンティティは undefined', () => {
    const tracker = new VisualPositionTracker();
    expect(tracker.getRecentTransition('nobody', 1000)).toBeUndefined();
    tracker.resolve('e1', { x: 5, y: 3 }, 1000);
    expect(tracker.getRecentTransition('e1', 1050)).toBeUndefined(); // 初回登録は遷移ではない
  });
});
```

実装（GREEN）: `TweenEntry` に `prevFromX/prevFromY`... ではなく、遷移記録を独立させる。エントリに `lastTransition?: { fromX, fromY, toX, toY, startAt, isWarp }` を追加し、`resolve()` の位置変化検知ブロックで記録（ワープ時も**スナップ前の to** を from として保存 — 現状はワープで元位置を捨てているため、この保存が本 API の眼目）。初回登録では記録しない。`getRecentTransition` は `now - startAt < TRANSITION_MEMORY_MS`（export 定数 240）の間だけ返す。

- [ ] **Step 2: drawEnemies に種別エフェクトを追加**

敵ループ内、スプライト描画の直前/直後に追加（すべて Canvas 直描画、スプライト追加なし）:

- **CHARGE 突進残像**: `enemy.type === EnemyType.CHARGE` のとき `getRecentTransition` を取得し、`isWarp` かつ経過 < 240ms なら from→to 線分上の 2 点（40%・70% 地点）に本体スプライトを `globalAlpha = 0.35 / 0.18` で描画（`spriteRenderer.drawSprite` 再利用、経過時間でさらに減衰）
- **RANGED 詠唱光**: windup 中（Task 4 の `attackProgress < ENEMY_WINDUP_RATIO`）に足元へ小さなラジアルグラデーション円（半径 `enemyDrawSize * 0.5`、橙 `rgba(251, 146, 60, ...)`、進行度で alpha 0→0.4）
- **SPECIMEN 変異の脈動**: windup 中に `ctx.translate/scale` で本体を `1 + 0.06 * Math.sin(progress * Math.PI * 4)` 倍に脈動（drawPlayer の squash と同じ save/translate/scale/restore パターン）

- [ ] **Step 3: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): 敵の種別個性エフェクトを追加

- CHARGE: 突進（2タイルワープ）に残像を表示（トラッカーの遷移記録APIを新設）
- RANGED: 詠唱中の足元に光の円
- SPECIMEN: 溜め中の脈動スケール"
```

---

### Task 6: 陳腐化コメントの是正

**Files:**
- Modify: `src/features/ipne/presentation/sprites/enemySprites.ts`（18/229/496/743/1311/1522 行）
- Modify: `src/features/ipne/presentation/screens/render/drawWorld.ts`（4-5行）
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`（4行）
- Modify: `src/features/ipne/presentation/screens/render/combatEffects.ts`（15-17行）
- Modify: `src/features/ipne/presentation/screens/render/renderContext.ts`（4-6行）

**Interfaces:** なし（コメントのみ。コード変更禁止）

- [ ] **Step 1: enemySprites.ts のセクションコメントを実データに合わせる**

例: `// 3. 射手（遠距離敵） - 16×16, 2フレーム` → `// 3. 射手（遠距離敵） - 32×32, 4フレーム`。全6箇所（18/229/496/743/1311/1522 行）を各シートの実サイズ・実フレーム数に修正（PATROL/CHARGE/RANGED/SPECIMEN=32×32・4枚、MINI_BOSS=40×40・4枚、MEGA_BOSS=56×56・4枚）。

- [ ] **Step 2: render/ 4ファイルの「逐語移植・完全に同一」ヘッダーを現状に合わせる**

各ファイルの由来（renderGameFrame からの抽出）は1行残しつつ、「完全に同一」の保証文言を削除し、現在の責務を1〜2行で記述する。例（drawEnemies.ts）:

```typescript
/**
 * 敵描画層（敵スプライト・撃破アニメ・ボスHPオーラ・HPバー・攻撃エフェクト）
 *
 * renderGameFrame.ts から抽出後、視覚位置補間・状態別フレーム選択・種別個性
 * エフェクトを追加済み。描画位置は VisualPositionTracker の補間座標を使う。
 */
```

combatEffects.ts は「順序・副作用を完全に保持」→「攻撃/被弾/キュー処理の順序は移植時のまま。ヒットストップ・方向キック・updateAt はその後の追加」の趣旨に。renderContext.ts ヘッダーは「後続タスクで抽出する」という完了済み予告を現在形に修正。

- [ ] **Step 3: テスト実行とコミット**

Run: `npm test -- src/features/ipne`（コメントのみだが念のため）
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "docs(ipne): 陳腐化したソースコメントを実装に合わせて是正

- enemySprites のサイズ・フレーム数表記（16×16/2フレーム等）を実データに修正
- render/ 層の「逐語移植・完全に同一」ヘッダーを現在の責務記述に更新"
```

---

### Task 7: 全体検証と PR 作成

**Files:** なし（検証のみ）

**Interfaces:**
- Consumes: Task 1〜6 の全成果物
- Produces: CI 全パスの `feature/ipne-visual-p2` ブランチと PR

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: lint:ci（警告ゼロ）→ typecheck → test → build すべて成功

- [ ] **Step 2: プッシュして PR 作成**

```bash
git push -u origin feature/ipne-visual-p2
gh pr create --title "feat(ipne): キャラ・敵の生命感向上（攻撃4枚化・被弾フレーム・敵予備動作）" --body "$(cat <<'EOF'
## 概要
IPNE ビジュアル・モーション ブラッシュアップ Phase 2（設計: docs/superpowers/specs/2026-07-02-ipne-visual-motion-brushup-design.md）。
攻撃・被弾・予備動作のフレームを拡充し、キャラクターの生命感を底上げする。

## 変更内容
- プレイヤー攻撃を4枚化（予備→振り→フォロースルー→復帰）し、進行度ベースのフレーム選択に統一
- プレイヤー被弾専用フレームを追加（idle 流用を解消）
- 全敵7種に被弾フレーム、全7種に溜め（予備動作）フレームを追加
- 敵攻撃を前40%溜め→後60%攻撃の2段モーションに（attackAnimUntil 逆算、domain 無変更）
- 種別個性: CHARGE 突進残像／RANGED 詠唱光／SPECIMEN 脈動
- 陳腐化コメント（enemySprites のサイズ表記・render 層の「逐語移植」ヘッダー）を是正

## テスト方法
- [ ] npm run ci（lint:ci / typecheck / test / build）
- [ ] CI 上の E2E パス
- [ ] 手動確認: 攻撃モーションの繋がり・被弾の見た目・敵の溜め→攻撃・CHARGE 残像

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## リスクと注意点（実装者向け）

1. **スプライト配列の行フォーマット**: 既存は1フレーム＝1行のベタ書き。フォーマッタで改行されると diff が爆発するので既存の書式を維持する
2. **`allFrames()` の登録漏れ**: 新シート/新フレームを追加したら各 `*V3.test.ts` の `allFrames()` に含まれるか確認（ATTACK/DAMAGE シート経由なら自動、独立 export なら手動追加）
3. **frame.now は凍結時刻**: drawEnemies の攻撃進行度計算に使う `now` は FrameContext の凍結 visualNow。`enemy.attackAnimUntil` は実時刻ベースなので、ヒットストップ中は進行度が一瞬止まる — これは意図した挙動（凍結中は全アニメ停止）で、追加対応不要
4. **attackAnimUntil の undefined ガード**: `Enemy.attackAnimUntil` はオプショナル。undefined 時は静的 ATTACK フレームへフォールバックを必ず入れる
5. **CHARGE 残像の座標系**: `getRecentTransition` が返すのはタイル座標。描画時は `toScreenPosition` を通すこと
6. **敵溜めフレームの視認性**: 32×32 の小サイズで発光 4〜8 点は控えめ。輪郭の膨張と組み合わせて初めて読める。作画後に不変条件テストだけでなく差分ピクセル数（例: 8 点以上変化）の検証を入れると質が担保できる
