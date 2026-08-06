# 灰燼の城壁 反復5 実装計画 — 経済（手札・マナ・盤面の消耗）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 盤面が一方向のラチェット（置いたものが減らない）である状態を解除し、溢れにライフの対価をつけることで、「札を終盤まで抱えるか、今出すか」という判断を成立させる。

**Architecture:** 敵に `attackRange` を持たせ、経路外の守り手にもダメージが届くようにする（変更1）。溢れ1枚につきライフを1点引き、ライフを「序盤の余剰を終盤の飢餓へ運ぶ交換レート」にする（変更2）。両プリセットにコスト4以上を供給する（変更3）。ドメインは純粋関数のまま保ち、`balance.test.ts` の不変条件5本＋プリセットの偏りで較正を守る（**当初は6本の予定だった。6本目の撤回理由は Task 9 の注記を参照**）。

**Tech Stack:** TypeScript / React 19 / Jest 30 + SWC / styled-components

**設計書:** `docs/superpowers/specs/2026-08-06-ashen-rampart-iteration5-design.md`（節番号はすべてこの設計書を指す）

## Global Constraints

- **応答・コメント・ドキュメントは日本語。** 変数名・関数名は英語
- **`any` 型の使用は禁止。** `unknown` + 型ガードを使う
- **`domain/` は外部依存ゼロ。** `infrastructure/` や `presentation/` を参照しない
- **`stepTick` は純粋関数のまま。** 乱数・タイマー・副作用を持ち込まない。同じ状態と同じ操作列からは常に同じ結果になること
- **`features/ashen-rampart/` は他の feature を参照しない**
- **マナ源（魔力炉）に触らない。** ドロー間隔（`DRAW_INTERVAL_TICKS = 40`）、山札の枚数（`DECK_SIZE = 20`）、`HAND_LIMIT = 5`、魔力炉の生成間隔・生成量は**この反復では変更しない**（§5.1）
- **魔力炉・罠・燠火は敵の攻撃対象にしない。** 攻撃対象は `units`（守り手）だけ（§4.2）
- コミットメッセージは Conventional Commits（`feat:` / `fix:` / `test:` / `refactor:` / `docs:`）。本文は日本語
- **各タスクの完了判定には3つすべてが要る。** `npm run lint:ci`（警告ゼロを強制）/ `npm run typecheck` / `npx jest src/features/ashen-rampart`。**jest だけでは足りない**——移動やリファクタで残った未使用 import は型チェックもテストも素通りし、lint:ci でだけ落ちる（Task 2 で実際に発生した）
- **テストは「名乗った保証」を守ること。** 同じ関数を自分自身と比べる、変更前から真だった条件を確かめる、イベントが出たことだけ見て結果を見ない——反復4で9件見つかったこれらのパターンを作らない
- **本計画のテストコードは import 文を省略している。** 追記先の既存テストファイルを読み、不足する import（`PLAINS_MAP` / `laneOf` / `createCombatState` / `createDeck` / `CellPos` / `ActiveEnemy` / `PlacedUnit` / `TickEvent` 等）を足すこと。既存ファイルにヘルパーが既にあれば、重複定義せずそれを使う
- **座標をテストにハードコードしない。** `laneOf(PLAINS_MAP, 0)` から取る。地図が変わってもテストの主張が保たれる

---

## File Structure

| ファイル | 責務 | 変更 |
|---|---|---|
| `domain/combat/enemy-position.ts` | 進行度→盤面座標の変換 | **新規**（`step-tick.ts` から切り出し。循環参照の予防） |
| `domain/combat/enemies.ts` | 敵5種の定義 | `attackRange` を追加 |
| `domain/combat/blocking.ts` | ブロック判定と攻撃標的の選択 | `attackTargetIndexFor` を追加、`attackersFor` を改修 |
| `domain/combat/step-tick.ts` | 1 tick 前進 | `applyEnemyAttacks` の標的、溢れのライフ減算 |
| `domain/combat/run-simulation.ts` | テスト用のラン全体シミュレータ | `deployThenIdleStrategy` を追加 |
| `domain/combat/balance.test.ts` | 較正の不変条件 | 不変条件5本の閾値を再測定（**当初は6本の予定。6本目は撤回。Task 9 参照**） |
| `domain/cards/card-pool.ts` | カード14種とプリセット | プリセットにコスト4以上を供給 |
| `application/ports/play-log-port.ts` | 行動ログのスキーマ | v4 へ。`run_tally` に6項目追加 |
| `infrastructure/play-log/local-storage-play-log.ts` | ログの保存先 | キーを v4 へ |
| `presentation/run-summary.ts` | 判定用の集計 | `RunTally` に6項目追加 |
| `presentation/useAshenRampartGame.ts` | ゲームのオーケストレーション | 集計の結線 |
| `presentation/RunStatusBar.tsx` | 砦のライフ表示 | ライフが減った理由の表示 |
| `presentation/RunSummary.tsx` | リザルト | ライフ内訳 |
| `presentation/EnemyLegend.tsx` | 敵の凡例 | 射程の表示 |
| `presentation/HandArea.tsx` | 手札 | 手札上限時のドローバー警告 |
| `presentation/StartOverlay.tsx` | 開始時の操作説明 | 捨札と敵の射程の案内 |

---

## Task 1: 診断を実測して固定する

**設計書 §10.1。** 反復5 が存在する理由そのものを、実プレイに依らない形で先に証明する。**このタスクは実装ではなく計測である。** ここで「勝ってしまう」ことが確認できなければ、§2.1 の診断が間違っているので設計に戻る。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/run-simulation.ts`
- Test: `src/features/ashen-rampart/domain/combat/balance.test.ts`

**Interfaces:**
- Consumes: `greedyStrategy`, `Strategy`, `simulateRun`（既存）
- Produces: `deployThenIdleStrategy: Strategy`, `DEPLOY_ONLY_UNTIL_TICK: number`

- [ ] **Step 1: 戦略を追加する**

`run-simulation.ts` の末尾（`noPureGroundAttackStrategy` の後）に追加:

```ts
/**
 * 山札が尽きる tick（DRAW_INTERVAL_TICKS 40 × 17枚 = 680）
 *
 * 初期手札3枚を除いた山札17枚を40tickに1枚ずつ引くので、この tick で供給が終わる。
 * 定数から導出せず実数で置くのは、この値が「供給の終わり」という
 * 判定上の意味を持つ tick であり、式の変更で静かに動いてほしくないため。
 */
export const DEPLOY_ONLY_UNTIL_TICK = 680;

/**
 * 配備が終わったら何もしない戦略（反復5 の診断・対照条件）
 *
 * 供給が尽きる tick までは素直に打ち、以降は一切操作しない。
 * 盤面が一方向のラチェット（置いたものが減らない）である限り、この戦略は勝ててしまう。
 * **反復5 は、この戦略が負けるようにするための反復である**（設計書 §10.1）。
 */
export const deployThenIdleStrategy: Strategy = (state, map) =>
  state.tick >= DEPLOY_ONLY_UNTIL_TICK ? [] : greedyStrategy(state, map);
```

- [ ] **Step 2: 診断テストを書く**

> **【実施後の修正】このテストは Task 9 で「負けること」へ反転させる計画だったが、
> 反転は撤回された。** 現在は `較正ハーネスの性質` という別の describe に移り、
> 「測定器の性質の記録であって設計の要求ではない」と名乗り直している。理由は Task 9 の注記へ。

`balance.test.ts` の import に `deployThenIdleStrategy` を足し、`describe('較正の不変条件（反復3）', ...)` の直前に追加:

```ts
describe('【反復5 の診断】配備が終わると判断が消える', () => {
  // このテストは Task 9 で「負けること」へ反転させる。
  // ここで緑になることが、設計書 §2.1 の診断（経路外の守り手は仕様として無敵）の証拠になる。
  it('配備後に何もしない戦略が、素直な戦略とほとんど変わらない勝率を出す（Task 9 で反転させる）', () => {
    const idle = winsOf(FULL_DECK, deployThenIdleStrategy, 'deployThenIdle');
    const greedy = winsOf(FULL_DECK);
    // **絶対値ではなく差で見る。** 「ランの後半4割で操作を完全に止めても、素直に打ち続けた
    // 場合と4本差以内にしか落ちない」＝配備が終わった後の操作が勝敗にほとんど寄与していない。
    // 絶対値の閾値を置くと、後の較正で素直な戦略の勝率が動いたときに、この閾値の意味も
    // 黙って変わってしまう。greedy の掃引は runAllSeeds のキャッシュに載るので実行コストは増えない
    expect(greedy - idle).toBeLessThanOrEqual(4);
  });
});
```

- [ ] **Step 3: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/balance.test.ts -t "配備後に何もしない戦略"
```

期待: **PASS**。

**赤になった場合は実装を進めず、実測値を記録して報告すること。** 診断が外れているので設計書 §2.1 から見直しが要る。

- [ ] **Step 4: 判定者に反復4 のログが残っているか尋ねる**

**設計書 §9.1。** 「溢れはマナが細い序盤に集中する」は設計書の推測であり、実データで確かめられる。

判定者に次を依頼する:

> 反復4 のログが残っていれば、較正の初期値を決める前に見たいです。ブラウザで灰燼の城壁を開き、開発者ツールのコンソールで次を実行して、出力を貼り付けてください。
>
> ```js
> JSON.parse(localStorage.getItem('ashen-rampart:play-log-v3') ?? '{"events":[]}')
>   .events.filter(e => e.kind === 'card_discarded_overflow')
>   .map(e => ({ tick: e.tick, cardId: e.cardId }))
> ```

得られた tick の分布を Task 9 の較正の初期値に使う。**残っていなければ推測のまま進め、判定記録にその旨を書く。** このステップは実装をブロックしない。

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/run-simulation.ts src/features/ashen-rampart/domain/combat/balance.test.ts
git commit -m "test(ashen-rampart): 配備後に何もしない戦略が勝つことを実測する

反復5 の診断（設計書 §2.1・§10.1）。経路外の守り手にダメージを与える
手段が存在しないため、配備が終わると判断が消える。この不変条件は
Task 9 で「負けること」へ反転させる。"
```

---

## Task 2: 座標ヘルパーを切り出す（循環参照の予防）

`blocking.ts` が敵の座標を必要とするが、`enemyPosition` は `step-tick.ts` にあり、`step-tick.ts` は `blocking.ts` を import している。そのままでは循環参照になる。**振る舞いは1ミリも変えない、純粋な移動のみのタスク。**

**Files:**
- Create: `src/features/ashen-rampart/domain/combat/enemy-position.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts:120-143`

**Interfaces:**
- Produces: `positionOf(progress: number, path: readonly CellPos[]): CellPos`, `laneFor(map: StageMap, enemy: ActiveEnemy): readonly CellPos[]`, `goalFor(map: StageMap, enemy: ActiveEnemy): number`, `enemyPosition(map: StageMap, enemy: ActiveEnemy): CellPos`

- [ ] **Step 1: 新しいファイルを作る**

`enemy-position.ts`:

```ts
/**
 * 灰燼の城壁 - 敵の盤面座標
 *
 * 進行度（レーン上の位置）から実座標への変換だけを持つ。
 * step-tick.ts から切り出したのは、blocking.ts が射程判定で座標を必要とし、
 * step-tick.ts → blocking.ts の import 方向と衝突するため（反復5 Task 2）。
 * 依存は stage-map と combat-state の型のみで、戦闘の手順を一切知らない。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf } from '../board/stage-map';
import type { ActiveEnemy } from './combat-state';

/** 進行度から補間済みの盤面座標を求める */
export const positionOf = (progress: number, path: readonly CellPos[]): CellPos => {
  if (path.length === 0) return { x: 0, y: 0 };
  const last = path.length - 1;
  const clamped = Math.max(0, Math.min(progress, last));
  const i = Math.min(Math.floor(clamped), Math.max(0, last - 1));
  const a = path[i];
  const b = path[i + 1] ?? a;
  if (!a || !b) return { x: 0, y: 0 };
  const frac = clamped - i;
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
};

/** その敵の所属レーン */
export const laneFor = (map: StageMap, enemy: ActiveEnemy): readonly CellPos[] =>
  laneOf(map, enemy.laneIndex);

/** その敵が砦に到達したとみなす進行度 */
export const goalFor = (map: StageMap, enemy: ActiveEnemy): number =>
  Math.max(0, laneFor(map, enemy).length - 1);

/** その敵の現在の盤面座標 */
export const enemyPosition = (map: StageMap, enemy: ActiveEnemy): CellPos =>
  positionOf(enemy.progress, laneFor(map, enemy));
```

- [ ] **Step 2: step-tick.ts から削除して再エクスポートする**

`step-tick.ts` の 120〜143 行（`positionOf` / `laneFor` / `goalFor` / `enemyPosition` の4つ）を削除し、import 群の末尾に追加:

```ts
import { positionOf, laneFor, goalFor, enemyPosition } from './enemy-position';

// 既存の import 元（step-tick）を変えずに済ませるため再エクスポートする。
// 反復1〜4 のテストが step-tick から positionOf / enemyPosition を取っている。
export { positionOf, enemyPosition } from './enemy-position';
```

- [ ] **Step 3: 全テストを実行する**

```bash
npx jest src/features/ashen-rampart
```

期待: **すべて PASS**。振る舞いを変えていないので、1件でも落ちたら移動を間違えている。

- [ ] **Step 4: 型チェック**

```bash
npm run typecheck
```

期待: エラーなし。

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemy-position.ts src/features/ashen-rampart/domain/combat/step-tick.ts
git commit -m "refactor(ashen-rampart): 敵の座標計算を独立したモジュールへ切り出す

blocking.ts が射程判定で敵の座標を必要とするが、enemyPosition は
step-tick.ts にあり step-tick → blocking の import 方向と衝突する。
振る舞いは変えず、step-tick からの再エクスポートで既存の import を保つ。"
```

---

## Task 3: `attackRange` を追加し、攻撃標的の選択を作る

**設計書 §4.1・§4.2。** この時点では全敵 `attackRange: 0` にするので**振る舞いは変わらない**。標的選択の関数だけを先に、単体でテストできる形で作る。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/enemies.ts`
- Modify: `src/features/ashen-rampart/domain/combat/blocking.ts`
- Test: `src/features/ashen-rampart/domain/combat/blocking.test.ts`

**Interfaces:**
- Consumes: `BlockContext { units, map, tick }`, `blockerIndexFor`, `enemyPosition`（Task 2）
- Produces: `EnemySpec.attackRange: number`, `attackTargetIndexFor(ctx: BlockContext, enemy: ActiveEnemy): number | undefined`

- [ ] **Step 1: 失敗するテストを書く**

`blocking.test.ts` の末尾に追加（既存の import に合わせて `attackTargetIndexFor` を足す）:

```ts
describe('attackTargetIndexFor（反復5: 射程内の守り手を撃つ）', () => {
  // PLAINS_MAP のレーン0 の3番目のセルを基準に、その隣接セルへ守り手を置く。
  // 座標をハードコードせず地図から取るのは、地図が変わってもテストの意味が保たれるようにするため。
  const lane0 = laneOf(PLAINS_MAP, 0);
  const cellAt = (index: number): CellPos => {
    const cell = lane0[index];
    if (!cell) throw new Error(`レーン0 に index ${index} のセルがありません`);
    return cell;
  };

  const enemyAt = (progress: number, enemyId: string): ActiveEnemy => ({
    id: 1, enemyId, hp: 60, maxHp: 60, progress,
    spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  });

  const unitAt = (pos: CellPos): PlacedUnit => ({
    cardId: 'arrow-tower', pos, hp: 8, maxHp: 8, cooldownLeft: 0,
  });

  it('射程0 の敵は、ブロックされていなければ誰も攻撃しない', () => {
    // 俊足は南レーン専属で attackRange 0 のまま（Task 5 でも変わらない）。
    // ここで雑兵を使うと Task 5 で射程1.2 が入った瞬間にこのテストが自壊する
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = { units: [unitAt(beside)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'runner'))).toBeUndefined();
  });

  it('自分をブロックしている守り手を、射程内の他の守り手より優先する', () => {
    // 経路上の壁（ブロッカー）と、より近い経路外の塔を同時に置く。
    // 優先順位が壊れると壁が機能を失い、反復3 の中核（経路上でブロックする）が壊れる
    const blockerCell = cellAt(4);
    const nearbyOffPath = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = {
      units: [unitAt(nearbyOffPath), unitAt(blockerCell)],
      map: PLAINS_MAP,
      tick: 100,
    };
    // 2体は敵から等距離。距離だけで選ぶ実装なら同距離の先頭（index 0）が返るが、
    // ブロッカー優先が効いていれば index 1（ブロッカー）が返る
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'brute'))).toBe(1);
  });

  it('ブロッカーがいなければ、射程内で最も近い守り手を選ぶ', () => {
    // **両方とも射程1.5 の内側に置くこと。** 片方を射程外に置くと、この
    // テストは「射程外は選ばない」テストと同じことしか確かめられず、
    // 最近接の比較分岐が一度も通らない（実装を反転させても緑のまま通る）
    const near = { x: cellAt(3).x, y: cellAt(3).y + 1 };        // 距離 1.0
    const mid = { x: cellAt(3).x + 1, y: cellAt(3).y + 1 };     // 距離 √2 ≒ 1.414
    // 遠いほうを配列の先頭に。配列順で選ぶ実装なら index 0 が返る
    const ctx = { units: [unitAt(mid), unitAt(near)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'brute'))).toBe(1);
  });

  it('射程外の守り手は選ばない', () => {
    const farAway = { x: cellAt(3).x, y: cellAt(3).y + 5 };
    const ctx = { units: [unitAt(farAway)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'brute'))).toBeUndefined();
  });

  it('飛行中の敵は射程内でも攻撃しない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = { units: [unitAt(beside)], map: PLAINS_MAP, tick: 100 };
    // 鴉は飛行。groundedUntilTick 0 なので tick 100 では飛んでいる
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'raven'))).toBeUndefined();
  });

  it('死んだ敵は攻撃しない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = { units: [unitAt(beside)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, { ...enemyAt(3, 'brute'), alive: false })).toBeUndefined();
  });
});
```

このテストは `brute` の `attackRange` が 1.5 であることを前提にしている。Step 3 で重装だけ先に値を入れる。

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/blocking.test.ts -t "attackTargetIndexFor"
```

期待: **FAIL**（`attackTargetIndexFor is not a function`）。

- [ ] **Step 3: `EnemySpec` に `attackRange` を足す**

`enemies.ts`。インターフェースに追加:

```ts
  /** 攻撃間隔（tick） */
  attackIntervalTicks: number;
  /**
   * 経路外の守り手にも届く攻撃の射程（セル）
   *
   * 0 なら、自分をブロックしている守り手しか殴らない（反復4 までの挙動）。
   * 0 より大きいと、進みながら射程内の守り手を削る（反復5・設計書 §4）。
   * **持たせるのは北レーン専属の2種だけ。** 南（俊足・群れ・鴉）に持たせると、
   * 群れ22体が同時に削るため上限3 でも盤面が溶ける（設計書 §4.3）。
   */
  attackRange: number;
```

定義の5種すべてに値を入れる（この時点では重装だけ非ゼロ。雑兵は Task 5 で入れる）:

```ts
const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, flying: false, attack: 3, attackIntervalTicks: 20, attackRange: 0 },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, flying: false, attack: 2, attackIntervalTicks: 12, attackRange: 0 },
  { id: 'swarm', name: '群れ', hp: 8, speed: 0.12, flying: false, attack: 1, attackIntervalTicks: 15, attackRange: 0 },
  { id: 'brute', name: '重装', hp: 60, speed: 0.06, flying: false, attack: 10, attackIntervalTicks: 30, attackRange: 1.5 },
  { id: 'raven', name: '鴉', hp: 16, speed: 0.14, flying: true, attack: 2, attackIntervalTicks: 20, attackRange: 0 },
];
```

- [ ] **Step 4: `attackTargetIndexFor` を実装する**

`blocking.ts`。import に追加:

```ts
import { getEnemySpec } from './enemies';
import { enemyPosition } from './enemy-position';
```

`blockerIndexFor` の後に追加:

```ts
/**
 * その敵が今 tick に攻撃する守り手の index
 *
 * 契約（設計書 §4.1）:
 * 1. 自分をブロックしている守り手がいれば、それを攻撃する
 * 2. いなければ、射程内で最も近い守り手を攻撃する。同距離なら units の配列順
 *
 * **順序を逆にしてはいけない。** 壁を無視して奥の塔を撃つようになると石壁が
 * 機能を失い、反復3 で作った「経路上でブロックする」という中核が壊れる。
 *
 * 距離は敵の補間済み座標から守り手のセルまでのユークリッド距離で測り、
 * `<= attackRange` を射程内とする。守り手側の射程判定（hypot(...) <= range）と
 * 同じ式にそろえてある——反復4 では判定と描画が半セルずれる欠陥が出ている。
 *
 * 1体の敵が殴る守り手は1つだけ（範囲攻撃ではない）。
 */
export const attackTargetIndexFor = (
  ctx: BlockContext,
  enemy: ActiveEnemy
): number | undefined => {
  const blocker = blockerIndexFor(ctx, enemy);
  if (blocker !== undefined) return blocker;
  if (!enemy.alive) return undefined;
  // 飛行はブロックも射程攻撃もしない。地上化中は地上の敵と同じ扱い
  if (isEnemyFlying(enemy, ctx.tick)) return undefined;
  const range = getEnemySpec(enemy.enemyId).attackRange;
  if (range <= 0) return undefined;
  const pos = enemyPosition(ctx.map, enemy);
  const found = ctx.units.reduce<{ index: number; distance: number } | undefined>(
    (best, unit, index) => {
      const distance = Math.hypot(pos.x - unit.pos.x, pos.y - unit.pos.y);
      if (distance > range) return best;
      // 同距離は配列順で決定的に選ぶ（> ではなく >= にすると後勝ちになる）
      if (best !== undefined && best.distance <= distance) return best;
      return { index, distance };
    },
    undefined
  );
  return found?.index;
};
```

- [ ] **Step 5: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/blocking.test.ts
```

期待: **すべて PASS**。

- [ ] **Step 6: 既存テストが壊れていないことを確認する**

```bash
npx jest src/features/ashen-rampart && npm run typecheck
```

期待: すべて PASS。`applyEnemyAttacks` はまだ `blockerIndexFor` を使っているので、振る舞いは変わっていないはず。

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemies.ts src/features/ashen-rampart/domain/combat/blocking.ts src/features/ashen-rampart/domain/combat/blocking.test.ts
git commit -m "feat(ashen-rampart): 敵の攻撃標的の選択を追加する

EnemySpec に attackRange を足し、ブロッカー優先・射程内最近接という
標的選択（設計書 §4.1）を作る。まだ applyEnemyAttacks からは呼ばないので
盤面の振る舞いは変わらない。"
```

---

## Task 4: `applyEnemyAttacks` を射程攻撃に対応させる

**設計書 §4.2。** ここで初めて経路外の守り手が壊れるようになる。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/blocking.ts`（`attackersFor` と定数名）
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`（`applyEnemyAttacks` の docstring）
- Test: `src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`

**Interfaces:**
- Consumes: `attackTargetIndexFor`（Task 3）
- Produces: `MAX_ATTACKERS_PER_UNIT: number`（`MAX_ATTACKERS_PER_BLOCKER` からの改名）、`attackersFor` は同じシグネチャのまま標的選択が変わる

- [ ] **Step 1: 失敗するテストを書く**

`step-tick-blocking.test.ts` の末尾に追加:

```ts
describe('敵の射程攻撃（反復5）', () => {
  const lane0 = laneOf(PLAINS_MAP, 0);
  const cellAt = (index: number): CellPos => {
    const cell = lane0[index];
    if (!cell) throw new Error(`レーン0 に index ${index} のセルがありません`);
    return cell;
  };

  const bruteAt = (progress: number, id = 1): ActiveEnemy => ({
    id, enemyId: 'brute', hp: 60, maxHp: 60, progress,
    spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  });

  it('経路外に置いた守り手が、隣を通る重装に削られる', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    // 重装の攻撃間隔は30。tick 30 に殴られるよう tick 29 から進める
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [{ cardId: 'arrow-tower', pos: beside, hp: 8, maxHp: 8, cooldownLeft: 0 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // 弓兵 HP8 に重装の攻撃10 → 消滅する。イベントだけでなく units が減ることまで見る
    expect(next.events).toContainEqual(
      expect.objectContaining({ kind: 'unit-lost', cardId: 'arrow-tower' })
    );
    expect(next.units).toHaveLength(0);
  });

  it('射程外の守り手は削られない', () => {
    const farAway = { x: cellAt(3).x, y: cellAt(3).y + 5 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [{ cardId: 'arrow-tower', pos: farAway, hp: 8, maxHp: 8, cooldownLeft: 0 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    expect(next.units[0]?.hp).toBe(8);
  });

  it('射程攻撃をしても敵は止まらない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      // 硬い壁を経路外に置く（消滅して条件が変わらないように）
      units: [{ cardId: 'stone-wall', pos: beside, hp: 60, maxHp: 60, cooldownLeft: 0 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // 進んだことだけを見る。0.06 という実数で比べると、そのセルが滞留セルかどうか
    // （SLOW_TERRAIN_MULT 0.6 が掛かるか）に依存してしまい、地図を触ると壊れる。
    // 主張は「射程攻撃をしても止まらない」であって速度の値ではない
    expect(next.enemies[0]?.progress).toBeGreaterThan(3);
    expect(next.units[0]?.hp).toBeLessThan(60);
  });

  it('魔力炉・罠・燠火は射程内でも攻撃されない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [],
      reactors: [{ pos: beside, ticksToMana: 60 }],
      traps: [{ cardId: 'spike-trap', pos: beside, usesLeft: 3, hitEnemyIds: [] }],
      embers: [{ pos: beside, cooldownLeft: 300 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // マナ源が壊れると詰みへ戻る（設計書 §4.2）。数が減っていないことを確かめる
    expect(next.reactors).toHaveLength(1);
    expect(next.traps).toHaveLength(1);
    expect(next.embers).toHaveLength(1);
  });

  it('1つの守り手を同時に殴れる敵は3体まで', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [{ cardId: 'stone-wall', pos: beside, hp: 60, maxHp: 60, cooldownLeft: 0 }],
      enemies: [bruteAt(3, 1), bruteAt(3, 2), bruteAt(3, 3), bruteAt(3, 4), bruteAt(3, 5)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // 5体いても3体分（10 × 3 = 30）しか通らない
    expect(next.units[0]?.hp).toBe(30);
  });
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts -t "敵の射程攻撃"
```

期待: **FAIL**（守り手が削られない）。

- [ ] **Step 3: `attackersFor` の標的判定を差し替える**

`blocking.ts`:

```ts
/**
 * 1体の守り手を同時に殴れる敵の数
 *
 * 群れ22体が同時に殴ると、石壁HP60 は 41tick で溶ける
 * （22 × 1ダメージ / 15tick = 1.47 dps）。上限3 で約300tick 保つ。
 *
 * 副次的に、待たされた敵が経路上に詰まるため範囲攻撃が刺さるようになる。
 *
 * **反復5 で射程攻撃込みの上限になった**（旧名 MAX_ATTACKERS_PER_BLOCKER）。
 * ブロックしていない敵も削るようになったため、この上限が無いと経路の脇に
 * 置いた守り手が群れに瞬殺される。
 */
export const MAX_ATTACKERS_PER_UNIT = 3;

/** その守り手を殴っている敵（進行度の高い順に上限まで） */
export const attackersFor = (
  ctx: BlockContext,
  enemies: readonly ActiveEnemy[],
  unitIndex: number
): ActiveEnemy[] =>
  enemies
    .filter((e) => attackTargetIndexFor(ctx, e) === unitIndex)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, MAX_ATTACKERS_PER_UNIT);
```

- [ ] **Step 4: 旧名の参照を洗い出して直す**

```bash
grep -rn "MAX_ATTACKERS_PER_BLOCKER" src/
```

見つかった箇所をすべて `MAX_ATTACKERS_PER_UNIT` に置換する。

- [ ] **Step 5: `applyEnemyAttacks` の docstring を実態に合わせる**

`step-tick.ts` の `applyEnemyAttacks` の docstring 冒頭を書き換える:

```
 * 敵の攻撃と守り手の消滅
 *
 * 移動確定後に呼ぶ。**自分をブロックしている守り手か、射程内の最も近い守り手**を
 * attackIntervalTicks ごとに削り、0 になった守り手を取り除く（反復5・設計書 §4）。
 * 標的の決定は attackTargetIndexFor が持ち、この関数は「誰が誰を殴るか」を知らない。
```

（以降の「攻撃タイミングは…」以下の段落はそのまま残す。）

- [ ] **Step 6: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts
```

期待: **すべて PASS**。

- [ ] **Step 7: 全テストを実行する**

```bash
npx jest src/features/ashen-rampart
```

**`balance.test.ts` が落ちることが想定される**（較正が動くため）。落ちたテスト名と実測値を記録し、**Task 9 で直す**。他のテストが落ちた場合は実装の誤りなのでここで直す。

- [ ] **Step 8: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 敵が射程内の守り手を攻撃するようにする

経路外に置いた守り手は仕様として無敵だった（設計書 §2.1）。
attackersFor の標的判定を attackTargetIndexFor に差し替え、ラチェットを解除する。
上限は射程攻撃込みで数えるため MAX_ATTACKERS_PER_UNIT へ改名した。
balance.test.ts の較正は Task 9 で取り直す。"
```

---

## Task 5: 雑兵に射程を与える

**設計書 §4.3。** 北レーン専属の2種目。重装（2体・攻撃10）だけでは摩耗が単発の事故になるため、雑兵（6体・攻撃3）でじわじわ効かせる。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/enemies.ts`
- Test: `src/features/ashen-rampart/domain/combat/enemies.test.ts`（**新規**）

**Interfaces:**
- Consumes: `EnemySpec.attackRange`（Task 3）
- Produces: なし（数値の投入のみ）

- [ ] **Step 1: 失敗するテストを書く**

`enemies.test.ts`（新規）:

```ts
/**
 * 敵定義の不変条件（反復5）
 *
 * 射程を持つ敵をレーンで分けたことを、コメントではなくテストで守る。
 * ここが崩れると群れ22体が盤面を溶かす（設計書 §4.3）。
 */
import { ENEMY_IDS, getEnemySpec } from './enemies';
import { PLAINS_WAVES } from './waves';

/** その敵が出現するレーン番号の集合 */
const lanesOf = (enemyId: string): Set<number> =>
  new Set(
    PLAINS_WAVES.flatMap((wave) =>
      wave.entries.filter((e) => e.enemyId === enemyId).map((e) => e.laneIndex)
    )
  );

describe('射程を持つ敵（反復5）', () => {
  it('射程を持つのは重装と雑兵だけ', () => {
    const withRange = ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0);
    expect(withRange.sort()).toEqual(['brute', 'grunt']);
  });

  it('射程を持つ敵はすべて北レーン（0）にしか出現しない', () => {
    // 南レーンは群れ22体と鴉13体。ここに射程を配ると盤面が溶ける
    ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0).forEach((id) => {
      expect([...lanesOf(id)]).toEqual([0]);
    });
  });

  it('射程を持たない敵は南レーンに出現する（レーンの性格分けが成立している）', () => {
    const southOnly = ENEMY_IDS.filter(
      (id) => getEnemySpec(id).attackRange === 0 && lanesOf(id).size > 0
    );
    expect(southOnly.length).toBeGreaterThan(0);
    southOnly.forEach((id) => {
      expect([...lanesOf(id)]).toEqual([1]);
    });
  });
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/enemies.test.ts
```

期待: **FAIL**（1本目は `['brute']` しか返らない）。

- [ ] **Step 3: 雑兵に射程を入れる**

`enemies.ts` の `grunt` の行:

```ts
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, flying: false, attack: 3, attackIntervalTicks: 20, attackRange: 1.2 },
```

- [ ] **Step 4: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/enemies.test.ts
```

期待: **すべて PASS**。

3本目が落ちる場合、`waves.ts` のレーン配分が変わっている。その場合はテストの期待ではなく **`waves.ts` を確認する**（性格分けが崩れているのが問題）。

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemies.ts src/features/ashen-rampart/domain/combat/enemies.test.ts
git commit -m "feat(ashen-rampart): 雑兵にも射程を与え、北を壊し屋のレーンにする

重装だけでは摩耗が単発の事故になる。雑兵6体で継続的に削る。
射程を持つのは北レーン専属の2種だけ、という制約をテストで守る
（南に配ると群れ22体で盤面が溶ける。設計書 §4.3）。"
```

---

## Task 6: 溢れにライフの対価をつける

**設計書 §5。** ライフを「序盤の余剰を終盤の飢餓へ運ぶ交換レート」にする。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`（`applyActions` の徴発処理、`stepTick` のライフ計算）
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts`（定数）
- Test: `src/features/ashen-rampart/domain/combat/step-tick-overflow.test.ts`（**新規**）

**Interfaces:**
- Consumes: `TickEvent` の `{ kind: 'overflow'; cardId: string }`（既存）
- Produces: `OVERFLOW_LIFE_COST: number`

- [ ] **Step 1: 失敗するテストを書く**

`step-tick-overflow.test.ts`（新規）:

```ts
/**
 * 溢れのライフ対価（反復5・設計書 §5）
 *
 * 「抱える」と「出す」の両方に痛みを置くための中核。
 * マナ源には一切触らないので、ここが原因で詰むことはない。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck, HAND_LIMIT } from '../cards/deck';
import { createCombatState, LIFE_INITIAL, DRAW_INTERVAL_TICKS, type CombatState } from './combat-state';
import { stepTick } from './step-tick';

/** 手札を上限まで埋め、次の tick でドローが起きる状態を作る */
const stateWithFullHand = (drawPile: readonly string[]): CombatState => {
  const base = createCombatState(createDeck([], () => 0), []);
  return {
    ...base,
    ticksToDraw: 1,
    deck: {
      hand: Array.from({ length: HAND_LIMIT }, () => 'arrow-tower'),
      drawPile: [...drawPile],
      graveyard: [],
    },
  };
};

describe('溢れのライフ対価', () => {
  it('溢れ1枚につきライフを1点失う', () => {
    const next = stepTick(stateWithFullHand(['ballista']), [], PLAINS_MAP);
    expect(next.events).toContainEqual({ kind: 'overflow', cardId: 'ballista' });
    expect(next.life).toBe(LIFE_INITIAL - 1);
  });

  it('溢れなければライフは減らない', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      ticksToDraw: 1,
      deck: { hand: ['arrow-tower'], drawPile: ['ballista'], graveyard: [] },
    };
    const next = stepTick(state, [], PLAINS_MAP);
    expect(next.events).toContainEqual({ kind: 'draw', cardId: 'ballista' });
    expect(next.life).toBe(LIFE_INITIAL);
  });

  it('溢れでライフが0以下になればラン敗北になる', () => {
    const state: CombatState = { ...stateWithFullHand(['ballista']), life: 1 };
    const next = stepTick(state, [], PLAINS_MAP);
    expect(next.life).toBe(0);
    expect(next.outcome).toBe('lost');
  });

  it('手動で捨てても対価はない', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      // ドローが起きない tick にして、捨札だけを見る
      ticksToDraw: DRAW_INTERVAL_TICKS,
      deck: { hand: ['arrow-tower', 'ballista'], drawPile: [], graveyard: [] },
    };
    const next = stepTick(state, [{ kind: 'discard', handIndex: 0 }], PLAINS_MAP);
    expect(next.deck.hand).toEqual(['ballista']);
    expect(next.life).toBe(LIFE_INITIAL);
  });

  it('徴発で選んだ札が手札上限で入らなければ、溢れとして対価を払う', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      ticksToDraw: DRAW_INTERVAL_TICKS,
      levyOptions: ['catapult', 'ballista', 'forge'],
      deck: {
        hand: Array.from({ length: HAND_LIMIT }, () => 'arrow-tower'),
        drawPile: [],
        graveyard: [],
      },
    };
    const next = stepTick(state, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(next.events).toContainEqual({ kind: 'overflow', cardId: 'catapult' });
    // 選ばなかった2枚は徴発そのものの代償であって溢れではない。1点だけ
    expect(next.life).toBe(LIFE_INITIAL - 1);
  });

  it('徴発で選んだ札が手札に入るなら対価はない', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      ticksToDraw: DRAW_INTERVAL_TICKS,
      levyOptions: ['catapult', 'ballista', 'forge'],
      deck: { hand: ['arrow-tower'], drawPile: [], graveyard: [] },
    };
    const next = stepTick(state, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(next.deck.hand).toContain('catapult');
    expect(next.life).toBe(LIFE_INITIAL);
  });
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/step-tick-overflow.test.ts
```

期待: **FAIL**（ライフが減らない、徴発で overflow イベントが出ない）。

- [ ] **Step 3: 定数を追加する**

`combat-state.ts` の `LIFE_INITIAL` の後:

```ts
/**
 * 溢れ1枚あたりのライフの対価（反復5・設計書 §5）
 *
 * 手札が上限のときに引いた札は墓地へ落ちるが、そこに値段が付いていなかったため
 * 「捨てているのはプレイヤーではなくゲームで、しかも無料」だった（反復4 の実測で
 * 溢れ23回 対 手動の捨札1回）。山札は抱えようが出そうが同じ速さで減るので、
 * **札を終盤へ運ぶ方法は手札に留めること以外に無く、留めれば溢れる。**
 * つまりこの値が、序盤の余剰と終盤の飢餓を交換するレートになる。
 *
 * ライフを選んだのは、現状ライフがほぼ余っているため（初期12 に対し反復4 の漏れは
 * 5ラン通して0〜3体）。マナを対価にすると、溢れが集中する序盤に詰みへ押す。
 */
export const OVERFLOW_LIFE_COST = 1;
```

- [ ] **Step 4: 徴発の溢れをイベントにする**

`step-tick.ts` の `applyActions` 内、`choose-levy` を処理している箇所を探す:

```bash
grep -n "choose-levy\|takeFromPeek" src/features/ashen-rampart/domain/combat/step-tick.ts
```

`takeFromPeek` を呼んでいる箇所を、選んだ札が手札に入ったかを見て `overflow` イベントを積む形に変える:

```ts
    } else if (action.kind === 'choose-levy') {
      const chosen = draft.levyOptions[action.optionIndex];
      const before = draft.deck.hand.length;
      draft.deck = takeFromPeek(draft.deck, draft.levyOptions, action.optionIndex);
      // 手札が増えていなければ、選んだ札は上限のため墓地へ落ちている。
      // 引いた札が入らないという点で通常のドローの溢れと同じ事象なので、同じ対価を払う
      // （設計書 §5.0）。選ばなかった残りは徴発そのものの代償なので対価はない。
      if (chosen !== undefined && draft.deck.hand.length === before) {
        draft.events.push({ kind: 'overflow', cardId: chosen });
      }
      draft.levyOptions = [];
    }
```

**注意:** 既存コードの形（変数名・分岐の位置）に合わせること。上は意図を示すもので、`draft` の名前や `levyOptions` のクリア方法は既存に従う。

- [ ] **Step 5: ライフを引く**

`step-tick.ts` の `stepTick` 内、`resolveLeaks` の直後（`const { settled, life } = ...` の次の行）に追加:

```ts
  // --- 溢れの対価（反復5・設計書 §5）---
  // ドローと徴発の両方が overflow イベントを積むため、ここで一括して数える。
  // 漏れ（resolveLeaks）と同じライフを引くが、イベントの種類で内訳を区別できる
  const overflowCount = events.filter((e) => e.kind === 'overflow').length;
  const lifeAfterOverflow = life - overflowCount * OVERFLOW_LIFE_COST;
```

そして `next` と勝敗判定の `life` をすべて `lifeAfterOverflow` に差し替える:

```ts
  const next: CombatState = {
    ...state,
    tick,
    life: lifeAfterOverflow,
    // ...（他は変更なし）
  };

  if (lifeAfterOverflow <= 0) return { ...next, life: 0, outcome: 'lost' };
```

import に `OVERFLOW_LIFE_COST` を足す。

- [ ] **Step 6: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/domain/combat/step-tick-overflow.test.ts
```

期待: **すべて PASS**。

- [ ] **Step 7: 全テストと型チェック**

```bash
npx jest src/features/ashen-rampart && npm run typecheck
```

`balance.test.ts` 以外が落ちたら実装の誤り。ここで直す。

- [ ] **Step 8: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 溢れ1枚につきライフを1点引く

捨てているのはプレイヤーではなくゲームで、しかも無料だった
（反復4 実測: 溢れ23回 対 手動の捨札1回）。山札は抱えても出しても
同じ速さで減るため、札を終盤へ運ぶ方法は手札に留めること以外に無い。
ライフが序盤の余剰と終盤の飢餓を交換するレートになる（設計書 §5）。

徴発で選んだ札が手札上限で入らない場合も同じ対価を払う。
選ばなかった残りと手動の捨札は対価なし。"
```

---

## Task 7: ログスキーマ v4

**設計書 §9。** 判定項目2・6 と、ライフ内訳の検証に必要な数値を集計へ入れる。

**Files:**
- Modify: `src/features/ashen-rampart/application/ports/play-log-port.ts`
- Modify: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts`
- Modify: `src/features/ashen-rampart/presentation/run-summary.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Test: `src/features/ashen-rampart/presentation/run-summary.test.ts`（既存に追記）

**Interfaces:**
- Consumes: `RunTally`, `accumulateTick(tally, state, map)`, `summarize(tally, deckCards)`（既存）
- Produces: `RunTally` に `overflowCount: number` / `lifeLostToOverflow: number` / `lifeLostToLeak: number` / `lastPlayTick: number` / `drawPileExhaustedTick: number` を追加。`endTick` は `run_tally` 書き出し時に `state.tick` から入れる

- [ ] **Step 1: 失敗するテストを書く**

`run-summary.test.ts` に追加:

```ts
describe('反復5 の集計項目', () => {
  it('溢れの回数と、それによって失ったライフを数える', () => {
    // overflow イベントを2件持つ tick を1回通す
    const state = stateWithEvents([
      { kind: 'overflow', cardId: 'ballista' },
      { kind: 'overflow', cardId: 'forge' },
    ]);
    const tally = accumulateTick(emptyTally(), state, PLAINS_MAP);
    expect(tally.overflowCount).toBe(2);
    expect(tally.lifeLostToOverflow).toBe(2);
  });

  it('漏れで失ったライフを、溢れと分けて数える', () => {
    const state = stateWithEvents([
      { kind: 'leak', enemyId: 1 },
      { kind: 'overflow', cardId: 'forge' },
    ]);
    const tally = accumulateTick(emptyTally(), state, PLAINS_MAP);
    expect(tally.lifeLostToLeak).toBe(1);
    expect(tally.lifeLostToOverflow).toBe(1);
  });

  it('最後にカードを出した tick を覚える', () => {
    const first = accumulateTick(
      emptyTally(),
      { ...stateWithEvents([{ kind: 'played', cardId: 'arrow-tower' }]), tick: 100 },
      PLAINS_MAP
    );
    const second = accumulateTick(
      first,
      { ...stateWithEvents([]), tick: 200 },
      PLAINS_MAP
    );
    // 出していない tick では更新されない
    expect(second.lastPlayTick).toBe(100);
  });

  it('山札が尽きた tick を、最初に空になった時点で覚える', () => {
    const emptied = accumulateTick(
      emptyTally(),
      { ...stateWithEmptyDrawPile(), tick: 680 },
      PLAINS_MAP
    );
    const later = accumulateTick(emptied, { ...stateWithEmptyDrawPile(), tick: 700 }, PLAINS_MAP);
    expect(later.drawPileExhaustedTick).toBe(680);
  });
});
```

**ヘルパー `stateWithEvents` / `stateWithEmptyDrawPile` は既存ファイルの流儀に合わせて定義すること。** 既存の `run-summary.test.ts` を読み、同種のヘルパーがあればそれを使う。無ければ次を定義する:

```ts
const stateWithEvents = (events: TickEvent[]): CombatState => ({
  ...createCombatState(createDeck([], () => 0), []),
  events,
});

const stateWithEmptyDrawPile = (): CombatState => ({
  ...createCombatState(createDeck([], () => 0), []),
  deck: { hand: [], drawPile: [], graveyard: [] },
  events: [],
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/presentation/run-summary.test.ts -t "反復5 の集計項目"
```

期待: **FAIL**。

- [ ] **Step 3: `RunTally` を拡張する**

`run-summary.ts` の `RunTally` に追加:

```ts
  /** 判定項目2: 手札上限で墓地へ落ちた札の枚数（反復5） */
  overflowCount: number;
  /** ライフ内訳: 溢れで失った点数（反復5・設計書 §5.4） */
  lifeLostToOverflow: number;
  /** ライフ内訳: 漏れで失った点数（反復5・設計書 §5.4） */
  lifeLostToLeak: number;
  /** 判定項目6: 最後にカードを出した tick。0 なら一度も出していない（反復5） */
  lastPlayTick: number;
  /** 山札が空になった最初の tick。0 なら最後まで尽きなかった（反復5） */
  drawPileExhaustedTick: number;
```

`emptyTally()` にも `overflowCount: 0, lifeLostToOverflow: 0, lifeLostToLeak: 0, lastPlayTick: 0, drawPileExhaustedTick: 0` を追加。

- [ ] **Step 4: `accumulateTick` で集計する**

`accumulateTick` の中で、イベントを走査している箇所に追加:

```ts
  // 反復5: 溢れの回数とライフ内訳
  const overflows = state.events.filter((e) => e.kind === 'overflow').length;
  const leaks = state.events.filter((e) => e.kind === 'leak').length;
  next.overflowCount += overflows;
  next.lifeLostToOverflow += overflows * OVERFLOW_LIFE_COST;
  next.lifeLostToLeak += leaks;
  // 判定項目6: 最後に出した tick。出していない tick では更新しない
  if (state.events.some((e) => e.kind === 'played')) {
    next.lastPlayTick = state.tick;
  }
  // 山札が尽きた tick。最初に空になった時点だけを覚える（0 は「まだ尽きていない」）
  if (next.drawPileExhaustedTick === 0 && state.deck.drawPile.length === 0) {
    next.drawPileExhaustedTick = state.tick;
  }
```

- [ ] **Step 5: `RunSummaryView` と `summarize` に通す**

`RunSummaryView` に同じ5項目を足し、`summarize` でそのまま渡す。

- [ ] **Step 6: ログスキーマを v4 にする**

`play-log-port.ts`:

```ts
/** 現在の反復番号。反復を進めるたびに必ず更新する */
export const CURRENT_ITERATION = 5;
```

`run_tally` のバリアントに追加:

```ts
      /** 判定項目2: 手札上限で墓地へ落ちた枚数（反復5） */
      overflowCount: number;
      /** ライフ内訳（反復5・設計書 §5.4） */
      lifeLostToOverflow: number;
      lifeLostToLeak: number;
      /** 判定項目6: 最後にカードを出した tick と決着 tick（反復5） */
      lastPlayTick: number;
      endTick: number;
      /** 山札が尽きた tick。0 なら尽きなかった（反復5） */
      drawPileExhaustedTick: number;
```

`local-storage-play-log.ts` のキーを `ashen-rampart:play-log-v4` に上げる（`v3` の文字列を探して置換）。

```bash
grep -rn "play-log-v3" src/
```

- [ ] **Step 7: `useAshenRampartGame.ts` で結線する**

`run_tally` を記録している箇所に、追加した6項目を渡す。`endTick` は決着時の `state.tick` を使う。

- [ ] **Step 8: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart && npm run typecheck
```

`balance.test.ts` 以外はすべて PASS であること。

- [ ] **Step 9: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 集計をスキーマ v4 にし、経済の判定項目を足す

溢れ回数・ライフ内訳（漏れ／溢れ）・最後に出した tick・決着 tick・
山札が尽きた tick を run_tally に入れる（設計書 §9）。
localStorage のキーを v4 へ上げ、反復4 の baseline と混ざらないようにする。"
```

---

## Task 8: プリセットデッキに重いコスト帯を供給する

**設計書 §6・§2.4。** 速攻型にはコスト4・5 が1枚も入っていないため、速攻型を選んだ人には重い札の判断が一度も発生しない。

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Test: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`

**Interfaces:**
- Consumes: `PRESET_DECKS`, `validateDeck`, `getCardDefinition`（既存）
- Produces: なし（データの変更のみ）

- [ ] **Step 1: 失敗するテストを書く**

`card-pool.test.ts` に追加:

```ts
describe('プリセットの重コスト帯（反復5）', () => {
  it('どのプリセットもコスト4以上を2枚以上持つ', () => {
    // 速攻型は最大コスト3 で、選んだ人に重い札の判断が発生しなかった（設計書 §2.4）
    Object.values(PRESET_DECKS).forEach((preset) => {
      const heavy = preset.cards.filter((id) => getCardDefinition(id).cost >= 4);
      expect(heavy.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('プリセットは構築規則を満たしたまま', () => {
    Object.values(PRESET_DECKS).forEach((preset) => {
      expect(validateDeck(preset.cards)).toEqual({ isValid: true, errors: [] });
    });
  });

  it('速攻型と重厚型の性格の違いが残っている（平均コストで重厚型が上）', () => {
    const averageCost = (cards: readonly string[]): number =>
      cards.reduce((sum, id) => sum + getCardDefinition(id).cost, 0) / cards.length;
    const swift = PRESET_DECKS.swift;
    const heavy = PRESET_DECKS.heavy;
    if (!swift || !heavy) throw new Error('プリセットが見つかりません');
    expect(averageCost(heavy.cards)).toBeGreaterThan(averageCost(swift.cards));
  });
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts -t "プリセットの重コスト帯"
```

期待: **FAIL**（速攻型のコスト4以上が0枚）。

- [ ] **Step 3: 速攻型に重い札を2枚入れる**

`card-pool.ts` の `PRESET_DECKS.swift.cards`。**20枚ちょうどを保つ**ため、2枚入れたら2枚抜く。棘罠3→2、弓兵3→2 を抜き、徹甲弩2 を足す:

```ts
    cards: [
      ...repeat('reactor', 4),
      ...repeat('stone-wall', 3),
      ...repeat('arrow-tower', 2),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 2),
      ...repeat('spike-trap', 2),
      ...repeat('piercer', 2),
      ...repeat('forge', 1),
      ...repeat('levy', 1),
    ],
```

**`PRESET_DECKS` の docstring に追記する**（既存の「配列の並び順にも意味がある」という注意の直前）:

```
 * **反復5 で速攻型にも重い帯を入れた。** それまで速攻型は最大コスト3 で、
 * これを選んだ人には「マナを貯めて重い札を出す」という反復5 の判断が
 * 一度も発生しなかった（設計書 §2.4）。手数寄りという性格は残すため、
 * 入れたのは徹甲弩2枚だけで、投石機（コスト5）は重厚型の専売のままにする。
```

- [ ] **Step 4: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts
```

期待: **すべて PASS**。

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat(ashen-rampart): 速攻型プリセットにも重いコスト帯を入れる

速攻型は最大コスト3 で、選んだ人には重い札の判断が一度も発生しなかった。
反復4 §3.3 の「コスト4・5 は実質的に死んでいる」は使用率の問題ではなく
たたき台に載っていないという供給の問題だった（設計書 §2.4）。
手数寄りの性格は残すため、徹甲弩2枚のみとし投石機は重厚型の専売にする。"
```

---

## Task 9: 較正 — `balance.test.ts` の不変条件5本＋プリセットの偏り

**設計書 §10.3。** 摩耗が入って既存の較正はすべて動いている。**このタスクは数値を合わせる作業であり、一発では終わらない。**

> **【実施後の修正】当初この Task は「不変条件6本」だった。6本目（配備後に何もしない
> 戦略が 4/20 未満）は撤回し、5本＋プリセットの偏りで確定した。**
>
> 撤回の理由は閾値が厳しすぎたからではなく、**指標が測りたいものを測っていなかった**
> ためである。境界の tick 680 は山札が尽きる tick として定義されており、
> 「配備後に何もしない戦略」が放棄しているのは平均0.6枚の札だけだった
> （20シード中11シードでは素直な戦略も 680 以降に一切操作せず、ランが完全に一致する）。
> 41通りの掃引でも、全要求充足デッキが 12/20 以上に留まる限りこの戦略は 8/20 を
> 下回らない。詳細は設計書 §10.1 と `run-simulation.ts` の
> `deployThenIdleStrategy` の docstring、および `.superpowers` の task-9-report.md。
>
> **「配備が終わった後にも判断が残るか」は実プレイの判定項目5・6（設計書 §8.2）へ移した。**
> 下記 Step 2 の「診断テストを不変条件へ反転させる」は**実施していない**。代わりに
> 診断テストを `較正ハーネスの性質` という別の describe へ移し、
> 「これは測定器の性質の記録であって設計の要求ではない」と明記してある。
>
> 最終的な実測: 全要求充足 12/20・対空なし 0/20・範囲も貫通も無し 0/20・
> 経路外のみ 0/20・地上専用の攻撃札なし 6/20・速攻型 13/20・重厚型 8/20（差5）。
> 動かしたのはウェーブ4 の3つの値だけ（鴉の間隔 10→18・北の重装 2→4・北の雑兵 2→4）で、
> `attackRange` は測定器が拾わないため較正レバーにならなかった。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/balance.test.ts`
- Modify（較正の結果として）: `src/features/ashen-rampart/domain/combat/enemies.ts`（`attackRange`）、`src/features/ashen-rampart/domain/combat/waves.ts`（数・タイミング・レーン配分）

**Interfaces:**
- Consumes: `winsOf`, `FULL_DECK`, `deployThenIdleStrategy`（Task 1）, `presetWinsOf`（既存）
- Produces: なし

- [ ] **Step 1: 現状を測る**

```bash
npx jest src/features/ashen-rampart/domain/combat/balance.test.ts 2>&1 | tee /tmp/balance-before.txt
```

落ちたテスト名と実測値をすべて書き出す。**推測で数値を動かす前に、どこがどれだけずれているかを紙に出す。**

- [ ] **Step 2: 診断テストを不変条件へ反転させる**

Task 1 で入れた `describe('【反復5 の診断】...')` ブロックを**削除**し、`describe('較正の不変条件（反復3）', ...)` の中へ次を追加する:

```ts
  it('配備後に何もしない戦略は 4/20 未満しか勝てない（配備後にも判断が残るか）', () => {
    // 反復4 まではこの戦略が 11/20 勝っていた（Task 1 の診断で実測）。素直な戦略の
    // 14/20 とわずか3本差で、ランの後半4割の操作が勝敗にほとんど寄与していなかった。
    // 経路外の守り手が仕様として無敵で、建て終わると盤面が完成したためである。
    // ここでは絶対値で見る。他の対照条件（経路外のみ・対空なし）と同じ 4/20 の壁に
    // 揃えることで、「配備後の操作」が対空やブロックと同格の要求になったことを表す。
    // これは実プレイに依らない「配備後にも判断が残るか」の直接の検証である（設計書 §10.1）
    expect(winsOf(FULL_DECK, deployThenIdleStrategy, 'deployThenIdle')).toBeLessThan(4);
  });
```

`describe` の見出しを `'較正の不変条件（反復3・反復5で再測定）'` に変える。

- [ ] **Step 3: 較正を回す**

次の6本が**同時に**成立する点を探す。動かしてよいのは **`enemies.ts` の `attackRange`（重装・雑兵）** と **`waves.ts` の数・タイミング・レーン配分**だけ。

| 不変条件 | 閾値 |
|---|---|
| 全要求充足デッキが勝つ | 12/20 以上・18/20 以下 |
| 対空を含まないデッキ | 4/20 未満 |
| 群れをまとめて削る手段が無いデッキ | 4/20 未満 |
| 経路上に一切置かない戦略 | 4/20 未満 |
| 地上専用の攻撃札を持たない戦略 | 10/20 未満 |
| **配備後に何もしない戦略（新規）** | **4/20 未満** |

**禁止事項:**
- **敵1体あたりの hp・speed・attack・attackIntervalTicks は変えない。** 反復3 の較正がこれらを固定した前提で立っている
- **閾値のほうを緩めて緑にしない。** 閾値を動かす必要が出たら、それは較正ではなく設計の失敗なので報告する
- **`LIFE_INITIAL` は変えない。** 溢れの対価（§5.3）が「初期12 のうち9点以上が余っている」という実測に基づいて設計されている

調整の順序の目安:
1. まず `attackRange` を下げて「全要求充足デッキが勝つ」を 12/20 以上に戻す
2. それで「配備後に何もしない戦略」が 4/20 以上に戻ってしまうなら、`waves.ts` のウェーブ4（北の重装・雑兵）の数かタイミングで摩耗の総量を調整する
3. 「地上専用の攻撃札を持たない戦略」が 10/20 以上になったら、摩耗が対空偏重を助けている。ウェーブ4 の北の圧力を上げる

- [ ] **Step 4: プリセットの勝率を取り直す**

```bash
npx jest src/features/ashen-rampart/domain/combat/balance.test.ts -t "プリセット2種の勝率が極端に偏らない"
```

緑にする。実測値を `card-pool.ts` の `PRESET_DECKS` docstring に書き戻す（反復3 の「速攻型 8/20・重厚型 7/20」を新しい実測値に更新し、**反復3 の値も残す**）。

- [ ] **Step 5: 較正の記録を `waves.ts` の docstring に残す**

`waves.ts` 冒頭の docstring の実測ブロックを更新する。**反復3 の値を消さず、反復5 の値を併記する**（較正の履歴が消えると、次に触る人が何を動かしたのか追えなくなる）。

- [ ] **Step 6: 全テストを実行する**

```bash
npm run ci
```

期待: lint:ci → typecheck → test → build がすべて緑。

- [ ] **Step 7: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "test(ashen-rampart): 摩耗を入れた後の較正を取り直す

不変条件を6本にした。新規は「配備後に何もしない戦略が勝てない」で、
これが反復5 の中核（配備が終わった後にも判断が残るか）の直接の検証になる。
反復4 まではこの戦略が勝ててしまっていた。

敵1体あたりの数値と LIFE_INITIAL は動かさず、attackRange と
ウェーブの数・タイミングだけで6本を同時に成立させた。"
```

---

## Task 10: 表示 — ライフの内訳

**設計書 §5.4。** ライフが防衛と経済の両方で減るため、**減った理由が区別できないと混乱する**。反証条件「ライフが何で減ったか分からない」に直結する。

**Files:**
- Modify: `src/features/ashen-rampart/presentation/RunStatusBar.tsx`
- Modify: `src/features/ashen-rampart/presentation/RunSummary.tsx`
- Test: `src/features/ashen-rampart/presentation/RunStatusBar.test.tsx`、`RunSummary.test.tsx`（既存に追記）

**Interfaces:**
- Consumes: `CombatState.events`（`{ kind: 'overflow' }` / `{ kind: 'leak' }`）、`RunSummaryView.lifeLostToOverflow` / `lifeLostToLeak`（Task 7）
- Produces: なし

- [ ] **Step 1: 失敗するテストを書く**

`RunStatusBar.test.tsx` に追加:

```ts
describe('ライフが減った理由の表示（反復5）', () => {
  it('溢れでライフが減った tick は、手札が原因だと分かる文言が出る', () => {
    render(<RunStatusBar state={stateWithEvents([{ kind: 'overflow', cardId: 'ballista' }])} />);
    expect(screen.getByText(/手札があふれ/)).toBeInTheDocument();
  });

  it('漏れでライフが減った tick は、敵が原因だと分かる文言が出る', () => {
    render(<RunStatusBar state={stateWithEvents([{ kind: 'leak', enemyId: 1 }])} />);
    expect(screen.getByText(/砦に到達/)).toBeInTheDocument();
  });

  it('どちらも起きていない tick では理由を出さない', () => {
    render(<RunStatusBar state={stateWithEvents([])} />);
    expect(screen.queryByText(/手札があふれ/)).not.toBeInTheDocument();
    expect(screen.queryByText(/砦に到達/)).not.toBeInTheDocument();
  });
});
```

**`RunStatusBar` の既存 props に合わせること。** 既存テストを読んで `render` の呼び方をそろえる。

`RunSummary.test.tsx` に追加:

```ts
it('ライフの内訳（漏れ／溢れ）をリザルトに出す', () => {
  render(<RunSummary summary={{ ...baseSummary, lifeLostToLeak: 2, lifeLostToOverflow: 3 }} {...otherProps} />);
  expect(screen.getByText(/砦への到達 2/)).toBeInTheDocument();
  expect(screen.getByText(/手札のあふれ 3/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/presentation/RunStatusBar.test.tsx src/features/ashen-rampart/presentation/RunSummary.test.tsx
```

期待: **FAIL**。

- [ ] **Step 3: `RunStatusBar` に理由を出す**

ライフ表示の隣に、その tick のイベントから理由を導いて出す。**新しい状態を持たせず、`state.events` から導出する**（描画は状態を増やさない）。

```tsx
/**
 * その tick にライフが減った理由（反復5・設計書 §5.4）
 *
 * ライフは漏れと溢れの両方で減るようになったため、内訳が読めないと
 * 「何をしたら減ったのか」が分からなくなる。state を増やさず events から導く。
 */
const lifeLossReason = (events: readonly TickEvent[]): string | undefined => {
  const overflowed = events.some((e) => e.kind === 'overflow');
  const leaked = events.some((e) => e.kind === 'leak');
  if (overflowed && leaked) return '手札があふれ、敵が砦に到達しました';
  if (overflowed) return '手札があふれました';
  if (leaked) return '敵が砦に到達しました';
  return undefined;
};
```

- [ ] **Step 4: `RunSummary` に内訳を出す**

既存のリザルト項目の並びに合わせて「ライフの内訳」を追加する。ラベルは `砦への到達 {lifeLostToLeak}` / `手札のあふれ {lifeLostToOverflow}`。

- [ ] **Step 5: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/presentation
```

- [ ] **Step 6: コミット**

```bash
git add -A src/features/ashen-rampart/presentation
git commit -m "feat(ashen-rampart): ライフが減った理由を漏れと溢れで区別して出す

ライフが防衛と経済の両方で減るようになったため、内訳が読めないと
何をしたら減ったのか分からない（設計書 §5.4）。
状態を増やさず state.events から導出する。"
```

---

## Task 11: 表示 — 敵の射程

**設計書 §4.4。** 敵の射程が見えなければ、摩耗は理不尽な事故にしかならない。

**Files:**
- Modify: `src/features/ashen-rampart/presentation/EnemyLegend.tsx`
- Test: `src/features/ashen-rampart/presentation/EnemyLegend.test.tsx`（既存に追記）

**Interfaces:**
- Consumes: `getEnemySpec(id).attackRange`（Task 3）
- Produces: なし

- [ ] **Step 1: 失敗するテストを書く**

```ts
describe('敵の射程の表示（反復5）', () => {
  it('射程を持つ敵には射程を出す', () => {
    render(<EnemyLegend />);
    // 重装は attackRange 1.5。凡例に数値が出る
    expect(screen.getByText(/射程 1\.5/)).toBeInTheDocument();
  });

  it('射程を持たない敵には射程を出さない', () => {
    render(<EnemyLegend />);
    // 射程0 の敵に「射程 0」と書くと、あたかも0マス届くように読める
    expect(screen.queryByText(/射程 0/)).not.toBeInTheDocument();
  });

  it('射程を持つ敵の数が、定義と一致する', () => {
    render(<EnemyLegend />);
    const expected = ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0).length;
    expect(screen.getAllByText(/射程 /)).toHaveLength(expected);
  });
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/presentation/EnemyLegend.test.tsx
```

期待: **FAIL**。

- [ ] **Step 3: 凡例に射程を出す**

`EnemyLegend.tsx` の各敵の行に、`attackRange > 0` のときだけ `射程 {attackRange}` を出す。既存の表示要素（名前・visual）の並びに合わせる。

```tsx
{spec.attackRange > 0 && <Stat>射程 {spec.attackRange}</Stat>}
```

**説明を1行添える。** 「射程を持つ敵は、経路の脇に置いた守り手も削ります」——数値だけでは何を意味するか伝わらない。

- [ ] **Step 4: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/presentation/EnemyLegend.test.tsx
```

- [ ] **Step 5: コミット**

```bash
git add -A src/features/ashen-rampart/presentation
git commit -m "feat(ashen-rampart): 敵の凡例に射程を出す

射程が見えないと、経路の脇の守り手が削られることが理不尽な事故になる
（設計書 §4.4）。数値だけでは意味が伝わらないので説明を1行添える。"
```

---

## Task 12: 表示 — 手札上限の警告と操作説明

**設計書 §5.5・§5.6。** 反復4 の教訓「機能は画面で自己紹介させる」の適用。**このタスクが終わるまで、変更1・2 は完了していない。**

**Files:**
- Modify: `src/features/ashen-rampart/presentation/HandArea.tsx`
- Modify: `src/features/ashen-rampart/presentation/StartOverlay.tsx`
- Test: `src/features/ashen-rampart/presentation/HandArea.test.tsx`、`StartOverlay.test.tsx`（既存に追記）

**Interfaces:**
- Consumes: `CombatState.deck.hand`, `state.ticksToDraw`, `HAND_LIMIT`, `DRAW_INTERVAL_TICKS`（既存）
- Produces: なし

- [ ] **Step 1: 失敗するテストを書く**

`HandArea.test.tsx`:

```ts
describe('手札上限の警告（反復5）', () => {
  it('手札が上限のとき、次のドローでライフを失うと分かる警告が出る', () => {
    render(<HandArea state={stateWithHandSize(HAND_LIMIT)} {...handlers} />);
    expect(screen.getByText(/あふれ/)).toBeInTheDocument();
  });

  it('手札に空きがあるときは警告を出さない', () => {
    render(<HandArea state={stateWithHandSize(HAND_LIMIT - 1)} {...handlers} />);
    expect(screen.queryByText(/あふれ/)).not.toBeInTheDocument();
  });
});
```

`StartOverlay.test.tsx`:

```ts
describe('反復5 で追加した操作の案内', () => {
  it('手札を捨てられることが操作説明に書いてある', () => {
    render(<StartOverlay {...props} />);
    expect(screen.getByText(/捨て/)).toBeInTheDocument();
  });

  it('手札があふれるとライフを失うことが書いてある', () => {
    render(<StartOverlay {...props} />);
    expect(screen.getByText(/あふれ/)).toBeInTheDocument();
  });

  it('経路の脇に置いた守り手も壊れることが書いてある', () => {
    render(<StartOverlay {...props} />);
    // 「守り手」だけで探すと他の行にも当たりうる。この案内に固有の語で掴む
    expect(screen.getByText(/経路の脇/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 実行して失敗することを確認する**

```bash
npx jest src/features/ashen-rampart/presentation/HandArea.test.tsx src/features/ashen-rampart/presentation/StartOverlay.test.tsx
```

期待: **FAIL**。

- [ ] **Step 3: `HandArea` のドローバーを警告にする**

既存のドローバー（`HandArea.tsx:170-175` あたり、`$ratio` と `aria-label` を持つ要素）に、手札が上限のときだけ警告の見た目と文言を足す:

```tsx
const isHandFull = state.deck.hand.length >= HAND_LIMIT;
// ...
<DrawBar
  $ratio={1 - state.ticksToDraw / DRAW_INTERVAL_TICKS}
  $warning={isHandFull}
  aria-label={
    isHandFull
      ? `手札がいっぱいです。次のドローまで ${toSeconds(state.ticksToDraw)}秒。このままだとあふれてライフを1失います`
      : `次のドローまで ${toSeconds(state.ticksToDraw)}秒`
  }
/>
{isHandFull && <OverflowWarning>あふれます</OverflowWarning>}
```

**色だけで伝えない**（`.claude/rules/design-ui-ux-principles.md`「色だけに依存しない情報伝達」）。文言を必ず添える。

- [ ] **Step 4: 操作説明に3行足す**

`StartOverlay.tsx:52-55` の `<li>` 群に追加:

```tsx
      <li>手札は{HAND_LIMIT}枚まで。いっぱいのまま引くと札があふれ、ライフを1失います</li>
      <li>いらない札はクリックしてから「捨てる」で手放せます（マナは戻りません）</li>
      <li>北から来る敵は、経路の脇に置いた守り手も射程内なら壊します</li>
```

- [ ] **Step 5: 実行して緑になることを確認する**

```bash
npx jest src/features/ashen-rampart/presentation
```

- [ ] **Step 6: 捨札の操作が実際に画面から到達できるか手で確かめる**

```bash
npm start
```

ブラウザで灰燼の城壁を開き、**説明を読んだだけの状態から、実際に1枚捨てられるか**を確認する。到達できなければ UI を足す。

**反復4 では、実装もテストも正しい機能が5ラン誰にも発見されなかった。** テストが緑であることは、画面から到達できることを意味しない。

- [ ] **Step 7: コミット**

```bash
git add -A src/features/ashen-rampart/presentation
git commit -m "feat(ashen-rampart): 溢れの警告と、捨札・敵の射程の操作案内を足す

反復4 では能力表示が5ラン誰にも発見されなかった。機能は画面で
自己紹介させる（設計書 §4.4・§5.5・§5.6）。
ドローの残り時間は既に出ていたので、手札が上限のときの警告だけを足す。"
```

---

## Task 13: 敵対的な最終レビューと実プレイの準備

**設計書 §13.1。** 反復4 はこの形で8件の実欠陥を出荷前に検出した（うち1件は `run_tally` 自体の誤りで、反復の存在理由の半分が静かに壊れていた）。

**Files:** なし（レビューと修正）

- [ ] **Step 1: `npm run ci` を通す**

```bash
npm run ci
```

期待: lint:ci → typecheck → test:coverage → build がすべて緑。

- [ ] **Step 2: 命題を書き出す**

このブランチが主張していることを4つに絞って書き出す:

1. 経路外の守り手にもダメージが届き、配備後に判断が残る
2. 溢れにライフの対価があり、抱えるか出すかの二択が成立する
3. 判定に必要な数値が v4 のログで判定者へ届く
4. 既存の機能（ブロック・射程・オーラ・徴発・能力表示）が退行していない

- [ ] **Step 3: 4つの視点で否定しにいく**

**「迷ったら否定に倒す」**を原則に、視点ごとに独立して見る:

| 視点 | 見るもの |
|---|---|
| 設計との整合 | 実装が設計書 §4.1・§4.2・§5.0 の契約どおりか。特に**標的の優先順位**と**魔力炉が対象外**であること |
| テストの空虚さ | 名乗った保証を守っていないテスト。トートロジー、変更前から真だった条件、イベントだけ見て結果を見ない検証、ドメインが produce しない値のフィクスチャ |
| 既存機能の退行 | 石壁のブロック、射程リング、オーラ、徴発、能力表示、拒否理由 |
| 判定の健全性 | **v4 の `run_tally` が画面のリザルトと一致するか。** 反復4 はここが1 tick ずれていて、間違った数値が唯一の数値になっていた |

- [ ] **Step 4: 反復4 の欠陥の「形」で点検する**

反復4 の教訓「欠陥を直したら、その欠陥の形で他の領域も点検する」を適用:

- **判定と描画のずれ**（射程リングが半セル過大だった）→ **敵の射程を描くなら同じずれが無いか**
- **計算済みなのに表示されていない**（`TickEvent` / `CardType`）→ **v4 で足した6項目のうち、集計しているのに画面に出ていないものは無いか**
- **1 tick 古い集計**（`run_tally`）→ **`lastPlayTick` / `endTick` が決着 tick と整合しているか**

- [ ] **Step 5: 見つかった欠陥を直してコミットする**

1件1コミット。`fix(ashen-rampart):` で始める。

- [ ] **Step 6: PR を作る**

```bash
git push -u origin feature/ashen-rampart-iteration5
gh pr create --title "feat(ashen-rampart): 反復5 — 持ち続けるか手放すかの判断" --body "$(cat <<'EOF'
## 概要

反復5。問いは「手札を持ち続けるか手放すかの判断が生まれるか。配備が終わった後にも判断が残るか」。
設計書: `docs/superpowers/specs/2026-08-06-ashen-rampart-iteration5-design.md`

## 変更内容

- 敵に `attackRange` を与え、経路外の守り手にもダメージが届くようにした（北レーンの重装・雑兵のみ）
- 溢れ1枚につきライフを1点引く。ライフが序盤の余剰と終盤の飢餓を交換するレートになる
- 速攻型プリセットにコスト4以上を供給した
- ログスキーマを v4 へ。溢れ回数・ライフ内訳・最後に出した tick・決着 tick・山札が尽きた tick を追加
- 較正の不変条件は5本のまま再測定し、プリセットの偏り（差5以内）も取り直した。
  **計画にあった6本目（配備後に何もしない戦略が勝てない）は撤回した**——
  その指標は「配備後の判断」ではなく「山札が尽きた後の平均0.6枚」しか測っておらず、
  判定は実プレイの項目5・6 へ移した（設計書 §10.1）

## 実プレイ手順（判定者へ）

1. **5ラン遊ぶ。2ラン目以降は「同じデッキで別のシードに挑む」を使うこと。** 「もう一度挑む」は前回のシードが事前入力されるためラン間比較が成立しない
2. 各ランの決着後、自由記述を残す
3. 最後に「判定用の記録をコピー」を押し、内容を貼り付ける
4. **localStorage の削除は不要**（v4 キーなので反復4 の記録と混ざらない）

## 判定項目（設計書 §8.2）

baseline は反復4 のラン3〜5。

| # | 項目 | baseline | 予測 |
|---|---|---|---|
| 1 | 手動の捨札回数 | 0 / 1 / 0 | 1ランあたり1回以上 |
| 2 | 溢れ回数 | 5 / 5 / 4 | 3ラン平均1〜3回（**0でも6以上でも No 方向**） |
| 3 | 決着時の `handRemaining` | 5ラン全部空 | 3ラン中2ラン以上で1枚以上 |
| 4 | コスト4以上の使用回数 | 0 / 2 / 2 | 1ランあたり2回以上 |
| 5 | `unitsLost` | 0 / 0 / 1 | 1ランあたり3体以上（10体以上は反証） |
| 6 | 最後に出した tick ÷ 決着 tick | baseline なし | 0.85以上 |
| 7 | 勝敗 | 5/5 勝利 | 3ラン中2ラン以上勝利 |
| 8 | 前回より面白くなったか | — | 主観 |

## テスト方法

- [ ] `npm run ci` が緑
- [ ] 実プレイ5ラン
- [ ] 判定用の記録が1回のコピーで揃う
- [ ] ライフが減ったとき、漏れか溢れかが画面で区別できる

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**注意: 実装は `feature/ashen-rampart-iteration5` ブランチで行うこと。** 設計書は `docs/ashen-rampart-iteration5-design` にあるので、実装開始時に `main` から新しいブランチを切る。

---

## 完了の定義

- [ ] `npm run ci` が緑
- [ ] `balance.test.ts` の不変条件**5本**とプリセットの偏りが同時に成立（6本目は撤回。Task 9 の注記参照）
- [ ] 判定用の記録が1回のコピーで揃い、**画面のリザルトと数値が一致する**
- [ ] ライフが減った理由（漏れ／溢れ）が画面で区別できる
- [ ] 敵の射程が凡例に出ている
- [ ] 捨札が、操作説明を読んだだけの状態から実際に到達できる
- [ ] 敵対的な最終レビューを4視点で実施済み
