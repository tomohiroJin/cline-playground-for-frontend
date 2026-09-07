# 灰燼の城壁 段階B0 — 要求軸の監査の道具（軸のノックアウト）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ステージが宣言した要求軸を実際に要求しているかを、交絡なく測れる道具（軸のノックアウト）を作り、事前登録 §8.2.15（ゲート `G3`）の測定を実行できる状態にする。

**Architecture:** 「その軸を持つ札を置かない」戦略を捨て、**札はデッキの同じ位置に残したまま、その軸の能力だけを消した変種札へ差し替える**。変種は基礎札から純粋関数で導出し、`getCardDefinition` からは引けるが `CARD_IDS` には入らない別レジストリに置く。判定述語（どの札がどの軸を持つか）は `axesOfCard` 1箇所に集約し、導出と監査の両方がそれを使う。

**Tech Stack:** TypeScript 5 / Jest 30 + SWC / 既存の `stepTick`（純粋・決定的）と `mulberry32` シード乱数

**Spec:** `docs/superpowers/specs/2026-09-04-ashen-rampart-iteration6-design.md` の **§8.2.15**（ゲート `G3`・事前登録）。撤回された前版は §8.2.14（原文残置）。

## Global Constraints

- **応答・コメント・docstring・コミットメッセージは日本語。** コード（変数名・関数名）は英語。
- **`any` 禁止**（`unknown` + 型ガード）。`tsconfig.json` は `isolatedModules: true` なので型のみの import は必ず `import type`。
- **依存方向**: `domain/` は外部依存なし。`domain/cards/` は `domain/expedition/` を参照しない（**逆向きは可**）。この制約が本計画の中心にある——破ると `card-pool.ts` にモジュール循環ができ、本番バンドルだけ起動不能になりうる。
- **`card-pool.ts` は現在「型以外を一切 import しない葉モジュール」ではなくなる。** 新たに import してよいのは `./knockout-cards` と `./axis-of-card` だけで、**この2つは `card-pool` を import してはならない**。
- **ノックアウト変種の ID 接頭辞は `!ko/`。** 基礎札の ID はこの接頭辞を持たない（テストで固定する）。
- **`CARD_IDS` に変種を入れてはならない。** 入れると `card-pool.test.ts` の「飛行に当たる塔は2種」「範囲攻撃を持つ塔は2種」「攻撃する守り手が同じコストに4種以上固まっていない」、`board-plates.test.ts` の reactor/ember 種別の完全一致、`CardGlyph.test.tsx` の全カード字面、`unit-visual.test.ts` の「字面が一意」「14種」、`card-text.test.ts` の全カード網羅が一斉に赤くなる。
- **`ASHEN_RAMPART_*` 環境変数付きテストを実行しないこと**（5〜9分かかりツールタイムアウトで復帰不能になる）。重い測定はコントローラが背景実行で回す。
- 完了条件には **`npm run lint:ci`（警告ゼロ）を必ず含める**。未使用 import は型チェックもテストも素通りする。
- **`PLAINS_MAP` / `PLAINS_WAVES` は凍結済み。改変しない。**

## ファイル構成

| ファイル | 責務 | 種別 |
|---|---|---|
| `src/features/ashen-rampart/domain/cards/axis-of-card.ts` | `DemandAxis` 型・閾値2つ・**カード定義から要求軸を判定する唯一の場所** | 新規（葉。`card-definition` の型のみ import） |
| `src/features/ashen-rampart/domain/cards/axis-of-card.test.ts` | 上のテスト（合成カードで境界を直接検査） | 新規 |
| `src/features/ashen-rampart/domain/cards/knockout-cards.ts` | 基礎札から軸ノックアウト変種を導出する純粋関数 | 新規（葉。`axis-of-card` と型のみ） |
| `src/features/ashen-rampart/domain/cards/knockout-cards.test.ts` | 導出規則のテスト（DPS 保存・最小介入・極性保存） | 新規 |
| `src/features/ashen-rampart/domain/cards/card-pool.ts` | 変種を `CARD_MAP` にのみ合流。`CARD_IDS` は不変 | 変更 |
| `src/features/ashen-rampart/domain/cards/card-pool.test.ts` | 到達不能性の固定 | 変更（追記） |
| `src/features/ashen-rampart/domain/expedition/stage-definition.ts` | `axesOf(id)` は `axesOfCard` への薄い委譲になる | 変更 |
| `src/features/ashen-rampart/domain/expedition/axis-knockout.ts` | `knockoutDeck`（位置を保つ差し替え）と `AUDIT_FULL_DECK` | 新規 |
| `src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts` | `B0-P2` / `B0-P5` | 新規 |
| `src/features/ashen-rampart/domain/combat/run-simulation.ts` | 全 tick のイベント列を集める `simulateRunCollecting` を追加 | 変更 |
| `src/features/ashen-rampart/domain/shared/holm.ts` | Holm 補正 | 新規 |
| `src/features/ashen-rampart/domain/shared/holm.test.ts` | 上のテスト | 新規 |
| `src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts` | **`B0-P1`（陰性対照）と `B0-P3`。CI 常駐** | 新規 |
| `src/features/ashen-rampart/domain/expedition/axis-strategy.ts` | 反証済みの警告を貼る（削除しない） | 変更 |
| `src/features/ashen-rampart/application/simulation/stage-demand-audit.retracted.manual.test.ts` | リネーム＋警告 | リネーム |
| `src/features/ashen-rampart/application/simulation/axis-demand-gate.manual.test.ts` | `G3` の測定本体（環境変数ゲート） | 新規 |

---

### Task 1: 要求軸の判定を `axesOfCard` へ切り出し、2つの述語を「値が正か」に直す

**なぜ最初か**: `axesOf` は**カードIDを受け取る**のでプールに無いカードを検査できず、ノックアウト変種ができるまで新しい述語の Red が作れない。カード定義を直接受け取る形にすると、合成カードで境界を直接テストできる。あわせて Task 2 が判定述語を再実装せずに済む（二重定義は必ずずれる）。

**Files:**
- Create: `src/features/ashen-rampart/domain/cards/axis-of-card.ts`
- Create: `src/features/ashen-rampart/domain/cards/axis-of-card.test.ts`
- Modify: `src/features/ashen-rampart/domain/expedition/stage-definition.ts`

**Interfaces:**
- Produces:
  - `export type DemandAxis = 'block' | 'anti-air' | 'mass-answer' | 'heavy-hit'`
  - `export const DEMAND_AXES: readonly DemandAxis[]`
  - `export const BLOCK_HP_THRESHOLD: number`（40）
  - `export const HEAVY_HIT_DAMAGE_THRESHOLD: number`（12）
  - `export const axesOfCard: (card: CardDefinition) => readonly DemandAxis[]`
  - `stage-definition.ts` は `axesOf`（ID 受け取り）と `DemandAxis` の再エクスポートを維持する

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/cards/axis-of-card.test.ts`:

```ts
import type { CardDefinition } from './card-definition';
import { axesOfCard, BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from './axis-of-card';

/** 検査したいフィールドだけを与えるための最小のカード */
const tower = (spec: Partial<NonNullable<CardDefinition['tower']>>): CardDefinition => ({
  id: 'test-tower',
  name: 'テスト塔',
  type: 'tower',
  cost: 1,
  description: 'テスト用',
  tower: {
    hp: 8,
    range: 1,
    damage: 1,
    cooldownTicks: 10,
    splashRadius: 0,
    hitsFlying: false,
    ...spec,
  },
});

const trap = (spec: Partial<NonNullable<CardDefinition['trap']>>): CardDefinition => ({
  id: 'test-trap',
  name: 'テスト罠',
  type: 'trap',
  cost: 1,
  description: 'テスト用',
  trap: { damage: 0, uses: 3, ...spec },
});

const ember = (radius: number): CardDefinition => ({
  id: 'test-ember',
  name: 'テスト燠火',
  type: 'ember',
  cost: 2,
  description: 'テスト用',
  ember: { radius, damage: 8, cooldownTicks: 300 },
});

describe('axesOfCard（カード定義から要求軸を判定する）', () => {
  describe('block は HP の閾値', () => {
    it('閾値ちょうどは block を満たす', () => {
      expect(axesOfCard(tower({ hp: BLOCK_HP_THRESHOLD }))).toContain('block');
    });

    it('閾値の1つ下は block を満たさない（境界）', () => {
      expect(axesOfCard(tower({ hp: BLOCK_HP_THRESHOLD - 1 }))).not.toContain('block');
    });
  });

  describe('anti-air は「値が正か」で判定する（ノックアウトが 0 を使うため）', () => {
    it('hitsFlying の塔は anti-air', () => {
      expect(axesOfCard(tower({ hitsFlying: true }))).toContain('anti-air');
    });

    it('groundedTicks が正の罠は anti-air', () => {
      expect(axesOfCard(trap({ groundedTicks: 120 }))).toContain('anti-air');
    });

    it('groundedTicks が 0 の罠は anti-air を満たさない', () => {
      // フィールドを消すと applyTraps の targetsFlying が反転して罠の対象が
      // 飛行→地上へ化ける（設計書 §8.2.15(a)1）。ノックアウトは 0 を書き込むので、
      // ここが `!== undefined` のままだと軸が落ちない。
      expect(axesOfCard(trap({ groundedTicks: 0 }))).not.toContain('anti-air');
    });

    it('groundedTicks を持たない罠は anti-air を満たさない', () => {
      expect(axesOfCard(trap({ damage: 5 }))).not.toContain('anti-air');
    });
  });

  describe('mass-answer は「値が正か」で判定する', () => {
    it('範囲を持つ塔は mass-answer', () => {
      expect(axesOfCard(tower({ splashRadius: 1 }))).toContain('mass-answer');
    });

    it('貫通する塔は mass-answer', () => {
      expect(axesOfCard(tower({ piercing: true }))).toContain('mass-answer');
    });

    it('半径が正の燠火は mass-answer', () => {
      expect(axesOfCard(ember(2))).toContain('mass-answer');
    });

    it('半径 0 の燠火は mass-answer を満たさない', () => {
      // `card.ember !== undefined` のままだと、radius:0 の変種が軸を持ち続ける
      expect(axesOfCard(ember(0))).not.toContain('mass-answer');
    });
  });

  describe('heavy-hit はダメージの閾値', () => {
    it('閾値ちょうどは heavy-hit を満たす', () => {
      expect(axesOfCard(tower({ damage: HEAVY_HIT_DAMAGE_THRESHOLD }))).toContain('heavy-hit');
    });

    it('閾値の1つ下は heavy-hit を満たさない（境界）', () => {
      expect(axesOfCard(tower({ damage: HEAVY_HIT_DAMAGE_THRESHOLD - 1 }))).not.toContain('heavy-hit');
    });
  });

  it('どの軸も満たさないカードは空配列', () => {
    expect(axesOfCard(tower({}))).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/axis-of-card.test.ts`
Expected: FAIL（`Cannot find module './axis-of-card'`）

- [ ] **Step 3: `axis-of-card.ts` を実装する**

`src/features/ashen-rampart/domain/cards/axis-of-card.ts`:

```ts
/**
 * 灰燼の城壁 - カード定義から要求軸を判定する（純粋・葉モジュール）
 *
 * **ここが「どの札がどの軸を持つか」の唯一の場所である。**
 * `stage-definition.ts` の `axesOf`（ID 受け取り）も、`knockout-cards.ts` の
 * 変種導出も、この関数を通す。判定述語を2箇所に書くと必ずずれる。
 *
 * **`card-pool` を import してはならない。** import すると
 * `card-pool → knockout-cards → axis-of-card → card-pool` の循環ができ、
 * `CARD_MAP` がトップレベルで評価される都合で、入り口順によっては
 * 本番バンドルだけが起動不能になる（設計書 §8.2.15(m)）。
 *
 * **`anti-air` と `mass-answer` は「フィールドの有無」ではなく「値が正か」で判定する。**
 * ノックアウトは能力を消すのにフィールドを削除せず 0 を書き込むためである
 * （落網の `groundedTicks` を削除すると `applyTraps` の対象極性が反転する。§8.2.15(a)1）。
 * 現行プールでは挙動が変わらない（落網 120 > 0、業火 2 > 0）。
 */
import type { CardDefinition } from './card-definition';

/**
 * ステージが要求する軸
 *
 * **デッキ述語で表せるものだけを列挙する。** 「摩耗」「優先撃破」「配分」「持久」は
 * 較正ハーネスで測れない（設計書 §7.1）ので、ここには入れない。
 * とくに優先撃破は**プレイヤーに標的を選ぶ操作が存在しない**ため要求できない。
 */
export type DemandAxis = 'block' | 'anti-air' | 'mass-answer' | 'heavy-hit';

/** 全軸。監査と導出が同じ順序で回すための単一の定義 */
export const DEMAND_AXES: readonly DemandAxis[] = ['block', 'anti-air', 'mass-answer', 'heavy-hit'];

/** block とみなす守り手のHP下限。石壁(60)だけが通り、弓兵(8)などは通らない */
export const BLOCK_HP_THRESHOLD = 40;

/** heavy-hit とみなす1発のダメージ下限。火砲台(12)がちょうど通り、弩砲(9)は通らない */
export const HEAVY_HIT_DAMAGE_THRESHOLD = 12;

/** そのカードが満たす要求軸 */
export const axesOfCard = (card: CardDefinition): readonly DemandAxis[] => {
  const tower = card.tower;
  const axes: DemandAxis[] = [];

  if (tower && tower.hp >= BLOCK_HP_THRESHOLD) axes.push('block');
  if ((tower?.hitsFlying ?? false) || (card.trap?.groundedTicks ?? 0) > 0) axes.push('anti-air');
  if (
    (tower && (tower.splashRadius > 0 || tower.piercing === true)) ||
    (card.ember?.radius ?? 0) > 0
  ) {
    axes.push('mass-answer');
  }
  if (tower && tower.damage >= HEAVY_HIT_DAMAGE_THRESHOLD) axes.push('heavy-hit');

  return axes;
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/axis-of-card.test.ts`
Expected: PASS（13件）

- [ ] **Step 5: `stage-definition.ts` を委譲に書き換える**

`src/features/ashen-rampart/domain/expedition/stage-definition.ts` の先頭 import と、
`DemandAxis` 型定義・閾値2つ・`axesOf` の実装を次で置き換える（`StageTier`・`StageDefinition` はそのまま残す）:

```ts
import type { StageMap } from '../board/stage-map';
import type { WaveDefinition } from '../combat/waves';
import { getCardDefinition } from '../cards/card-pool';
import { axesOfCard, type DemandAxis } from '../cards/axis-of-card';

/**
 * ステージが要求する軸
 *
 * **定義の実体は `domain/cards/axis-of-card.ts` にある。** ここは再エクスポートで、
 * 既存の `import { axesOf, type DemandAxis } from './stage-definition'` を壊さないため。
 * 実体を `domain/cards/` へ置いたのは、`knockout-cards.ts`（`domain/cards/`）が
 * 同じ判定述語を使う必要があり、`domain/cards/` から `domain/expedition/` を
 * 参照するとモジュール循環になるため（設計書 §8.2.15(m)）。
 */
export type { DemandAxis };
export { DEMAND_AXES, BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from '../cards/axis-of-card';

/**
 * そのカードが満たす要求軸
 *
 * カード定義から導く（ID の直書きにしない）ので、段階B で追加する
 * 新カードも自動で拾われる。
 */
export const axesOf = (cardId: string): readonly DemandAxis[] =>
  axesOfCard(getCardDefinition(cardId));
```

- [ ] **Step 6: 既存テストが無変更で緑であることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition src/features/ashen-rampart/domain/cards`
Expected: PASS（`stage-definition.test.ts` の10件、`axis-strategy.test.ts` の3件を含む。現行プールでは述語の挙動が変わらないため）

- [ ] **Step 7: 型チェックと lint**

Run: `npm run typecheck && npm run lint:ci`
Expected: どちらもエラー・警告ゼロ

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/axis-of-card.ts \
        src/features/ashen-rampart/domain/cards/axis-of-card.test.ts \
        src/features/ashen-rampart/domain/expedition/stage-definition.ts
git commit -m "refactor(ashen-rampart): 要求軸の判定を axesOfCard へ切り出し、述語を値の正負で書く

- 判定の実体を domain/cards/axis-of-card.ts（葉モジュール）へ移す。
  knockout-cards.ts が同じ述語を使うため、domain/cards 側に置かないと
  モジュール循環になる（設計書 §8.2.15(m)）
- anti-air を groundedTicks !== undefined から (groundedTicks ?? 0) > 0 へ
- mass-answer を ember !== undefined から (ember.radius ?? 0) > 0 へ
- 現行プールでは挙動が変わらない（落網 120 > 0・業火 2 > 0）。
  ノックアウト変種が 0 を書き込んだときに軸が落ちるようにするための変更
- stage-definition.ts の axesOf は委譲になり、DemandAxis は再エクスポート"
```

---

### Task 2: ノックアウト変種の導出（`knockout-cards.ts`）

**Files:**
- Create: `src/features/ashen-rampart/domain/cards/knockout-cards.ts`
- Create: `src/features/ashen-rampart/domain/cards/knockout-cards.test.ts`

**Interfaces:**
- Consumes: `axesOfCard`, `DemandAxis`, `DEMAND_AXES`, `BLOCK_HP_THRESHOLD`, `HEAVY_HIT_DAMAGE_THRESHOLD`（Task 1）
- Produces:
  - `export const KNOCKOUT_ID_PREFIX = '!ko/'`
  - `export const knockoutIdOf: (axis: DemandAxis, baseId: string) => string`
  - `export const baseIdOf: (id: string) => string`
  - `export const deriveKnockouts: (cards: readonly CardDefinition[], thresholds: { blockHp: number; heavyHitDamage: number }) => CardDefinition[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/cards/knockout-cards.test.ts`:

```ts
import type { CardDefinition } from './card-definition';
import { axesOfCard, BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from './axis-of-card';
import {
  KNOCKOUT_ID_PREFIX,
  baseIdOf,
  deriveKnockouts,
  knockoutIdOf,
} from './knockout-cards';

const THRESHOLDS = { blockHp: BLOCK_HP_THRESHOLD, heavyHitDamage: HEAVY_HIT_DAMAGE_THRESHOLD };

const wall: CardDefinition = {
  id: 'wall', name: '壁', type: 'tower', cost: 1, description: '',
  tower: { hp: 60, range: 0, damage: 0, cooldownTicks: 0, splashRadius: 0, hitsFlying: false },
};
const cannon: CardDefinition = {
  id: 'cannon', name: '砲', type: 'tower', cost: 3, description: '',
  tower: { hp: 16, range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1, hitsFlying: false },
};
const net: CardDefinition = {
  id: 'net', name: '網', type: 'trap', cost: 2, description: '',
  trap: { damage: 0, uses: 3, groundedTicks: 120 },
};
const plainArrow: CardDefinition = {
  id: 'arrow', name: '弓', type: 'tower', cost: 1, description: '',
  tower: { hp: 8, range: 1.6, damage: 4, cooldownTicks: 8, splashRadius: 0, hitsFlying: false },
};

const variantOf = (cards: readonly CardDefinition[], axis: Parameters<typeof knockoutIdOf>[0], baseId: string) =>
  deriveKnockouts(cards, THRESHOLDS).find((c) => c.id === knockoutIdOf(axis, baseId));

describe('ID の規約', () => {
  it('変種の ID は接頭辞 + 軸 + 基礎IDでできている', () => {
    expect(knockoutIdOf('block', 'wall')).toBe(`${KNOCKOUT_ID_PREFIX}block/wall`);
  });

  it('baseIdOf は接頭辞を剥がして基礎IDへ戻す', () => {
    expect(baseIdOf(knockoutIdOf('heavy-hit', 'cannon'))).toBe('cannon');
  });

  it('baseIdOf は基礎IDをそのまま返す', () => {
    expect(baseIdOf('cannon')).toBe('cannon');
  });
});

describe('変種を作る対象は axesOfCard と一致する', () => {
  it('軸を持たない札には変種を作らない', () => {
    // 弓兵は4軸のどれも持たない（HP8・damage4・単体・地上のみ）
    expect(axesOfCard(plainArrow)).toEqual([]);
    expect(deriveKnockouts([plainArrow], THRESHOLDS)).toEqual([]);
  });

  it('軸を持つ札には、その軸ぶんだけ変種を作る', () => {
    expect(axesOfCard(cannon)).toEqual(['mass-answer', 'heavy-hit']);
    expect(deriveKnockouts([cannon], THRESHOLDS).map((c) => c.id)).toEqual([
      knockoutIdOf('mass-answer', 'cannon'),
      knockoutIdOf('heavy-hit', 'cannon'),
    ]);
  });
});

describe('落とした軸だけを失い、他の軸は保つ', () => {
  it.each([
    ['wall', wall],
    ['cannon', cannon],
    ['net', net],
  ] as const)('%s のすべての変種', (baseId, card) => {
    const before = axesOfCard(card);
    deriveKnockouts([card], THRESHOLDS).forEach((variant) => {
      const axis = before.find((a) => variant.id === knockoutIdOf(a, baseId));
      expect(axis).toBeDefined();
      const after = axesOfCard(variant);
      expect(after).not.toContain(axis);
      expect([...after].sort()).toEqual(before.filter((a) => a !== axis).slice().sort());
    });
  });
});

describe('block は最小介入（閾値の1つ下）にする', () => {
  it('HP を閾値 - 1 にする。最小値 8 まで落とさない', () => {
    const v = variantOf([wall], 'block', 'wall');
    expect(v?.tower?.hp).toBe(BLOCK_HP_THRESHOLD - 1);
  });

  it('コスト・攻撃力・射程は変えない', () => {
    const v = variantOf([wall], 'block', 'wall');
    expect(v?.cost).toBe(wall.cost);
    expect(v?.tower?.damage).toBe(0);
    expect(v?.tower?.range).toBe(0);
  });
});

describe('anti-air は極性を保つ（フィールドを消さない）', () => {
  it('落網の groundedTicks は削除せず 0 にする', () => {
    const v = variantOf([net], 'anti-air', 'net');
    // undefined にすると applyTraps の targetsFlying が反転し、
    // 罠の対象が飛行から地上へ化ける（設計書 §8.2.15(a)1）
    expect(v?.trap?.groundedTicks).toBe(0);
  });

  it('罠の使用回数とダメージは変えない', () => {
    const v = variantOf([net], 'anti-air', 'net');
    expect(v?.trap?.uses).toBe(3);
    expect(v?.trap?.damage).toBe(0);
  });
});

describe('mass-answer は範囲と貫通だけを消す', () => {
  it('splashRadius を 0 にし、1体あたりのダメージは保つ', () => {
    const v = variantOf([cannon], 'mass-answer', 'cannon');
    expect(v?.tower?.splashRadius).toBe(0);
    expect(v?.tower?.damage).toBe(12);
  });
});

describe('heavy-hit は DPS を保って分割する', () => {
  it('damage と cooldownTicks を同じ整数比で割る', () => {
    const v = variantOf([cannon], 'heavy-hit', 'cannon');
    expect(v?.tower?.damage).toBe(6);
    expect(v?.tower?.cooldownTicks).toBe(9);
  });

  it('素の DPS が厳密に一致する（整数比で検算する）', () => {
    const v = variantOf([cannon], 'heavy-hit', 'cannon');
    const before = cannon.tower;
    const after = v?.tower;
    expect(after).toBeDefined();
    if (!before || !after) return;
    // 12/18 === 6/9 を浮動小数で比べない
    expect(before.damage * after.cooldownTicks).toBe(after.damage * before.cooldownTicks);
  });

  it('範囲は保つ（mass-answer を巻き込まない）', () => {
    const v = variantOf([cannon], 'heavy-hit', 'cannon');
    expect(v?.tower?.splashRadius).toBe(1);
  });

  it('割り切れない札は静かに歪めず例外にする', () => {
    const odd: CardDefinition = {
      id: 'odd', name: '奇', type: 'tower', cost: 3, description: '',
      tower: { hp: 10, range: 1, damage: 13, cooldownTicks: 12, splashRadius: 0, hitsFlying: false },
    };
    // damage 13 と cooldown 12 の公約数は 1 しかないので、DPS を保った分割ができない
    expect(() => deriveKnockouts([odd], THRESHOLDS)).toThrow(/heavy-hit/);
  });
});

describe('変種は入手経路を持たない', () => {
  it('すべての変種が retired である', () => {
    deriveKnockouts([wall, cannon, net], THRESHOLDS).forEach((v) => {
      expect(v.availability).toBe('retired');
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/knockout-cards.test.ts`
Expected: FAIL（`Cannot find module './knockout-cards'`）

- [ ] **Step 3: `knockout-cards.ts` を実装する**

`src/features/ashen-rampart/domain/cards/knockout-cards.ts`:

```ts
/**
 * 灰燼の城壁 - 軸ノックアウト変種の導出（純粋・葉モジュール・設計書 §8.2.15）
 *
 * **「その軸を持つ札を置かない」ではなく「札は残して、その軸の能力だけを消す」ための道具。**
 * 旧道具（`withoutAxisStrategy`）は落ちる札の枚数とコストが軸ごとに違い、
 * 飛行が1体もいないステージで対空を落とすと差16 が出ていた——軸ではなく
 * 「デッキから何割の火力が抜けたか」を測っていた（設計書 §8.2.15(a)）。
 *
 * **`card-pool` を import してはならない**（循環になる。§8.2.15(m)）。
 * 判定述語は `axis-of-card.ts` の `axesOfCard` を使い、ここで再実装しない。
 *
 * **`heavy-hit` の分割で DPS がずれるくらいなら例外で落とす。**
 * 静かに歪めると、この道具は旧道具と同じ「量の交絡」に戻る。
 */
import type { CardDefinition } from './card-definition';
import { axesOfCard, type DemandAxis } from './axis-of-card';

/**
 * 変種 ID の接頭辞
 *
 * 基礎札の ID が構文的に取り得ない形にしてある（`card-pool.test.ts` が固定する）。
 * これにより `CARD_MAP` での衝突が起こりえず、`baseIdOf` の逆変換も一意になる。
 */
export const KNOCKOUT_ID_PREFIX = '!ko/';

/** 基礎札の ID から変種の ID を作る */
export const knockoutIdOf = (axis: DemandAxis, baseId: string): string =>
  `${KNOCKOUT_ID_PREFIX}${axis}/${baseId}`;

/**
 * 変種 ID を基礎札の ID へ戻す（基礎 ID はそのまま返す）
 *
 * 陰性対照が2つの腕の状態を比べるときに使う。腕どうしはカードIDだけが
 * 構造上必ず違うので、ここで正規化しないと深比較が使えない。
 */
export const baseIdOf = (id: string): string => {
  if (!id.startsWith(KNOCKOUT_ID_PREFIX)) return id;
  const separator = id.indexOf('/', KNOCKOUT_ID_PREFIX.length);
  return separator < 0 ? id : id.slice(separator + 1);
};

export interface KnockoutThresholds {
  blockHp: number;
  heavyHitDamage: number;
}

/** 変種の共通部分（入手経路を持たせない） */
const asVariant = (card: CardDefinition, axis: DemandAxis): CardDefinition => ({
  ...card,
  id: knockoutIdOf(axis, card.id),
  availability: 'retired',
});

/**
 * DPS を保ったまま `damage` を閾値未満へ落とす分割比
 *
 * `damage` と `cooldownTicks` の両方を割り切る最小の `k`（2以上）を探す。
 * 見つからなければ undefined（呼び出し側が例外にする）。
 */
const splitFactorFor = (
  damage: number,
  cooldownTicks: number,
  threshold: number
): number | undefined => {
  for (let k = 2; k <= damage; k++) {
    if (damage % k !== 0 || cooldownTicks % k !== 0) continue;
    if (cooldownTicks / k < 1) continue;
    if (damage / k < threshold) return k;
  }
  return undefined;
};

const withoutBlock = (card: CardDefinition, blockHp: number): CardDefinition | undefined => {
  const spec = card.tower;
  if (!spec) return undefined;
  // 最小介入。閾値の1つ下まで下げれば軸は落ちる（8 まで落とすのは必要量の5倍以上）
  return { ...asVariant(card, 'block'), tower: { ...spec, hp: blockHp - 1 } };
};

const withoutAntiAir = (card: CardDefinition): CardDefinition | undefined => {
  const tower = card.tower;
  const trap = card.trap;
  return {
    ...asVariant(card, 'anti-air'),
    ...(tower ? { tower: { ...tower, hitsFlying: false } } : {}),
    // **削除せず 0 にする。** `applyTraps` は groundedTicks の有無で
    // 罠の対象（飛行か地上か）を決めているため、消すと極性が反転する
    ...(trap ? { trap: { ...trap, groundedTicks: 0 } } : {}),
  };
};

const withoutMassAnswer = (card: CardDefinition): CardDefinition | undefined => {
  const tower = card.tower;
  const ember = card.ember;
  return {
    ...asVariant(card, 'mass-answer'),
    ...(tower ? { tower: { ...tower, splashRadius: 0, piercing: false } } : {}),
    ...(ember ? { ember: { ...ember, radius: 0 } } : {}),
  };
};

const withoutHeavyHit = (
  card: CardDefinition,
  threshold: number
): CardDefinition | undefined => {
  const spec = card.tower;
  if (!spec) return undefined;
  const factor = splitFactorFor(spec.damage, spec.cooldownTicks, threshold);
  if (factor === undefined) {
    throw new Error(
      `heavy-hit のノックアウトを導出できません（DPS を保った分割が無い）: ` +
        `${card.id} damage=${spec.damage} cooldownTicks=${spec.cooldownTicks}`
    );
  }
  return {
    ...asVariant(card, 'heavy-hit'),
    tower: { ...spec, damage: spec.damage / factor, cooldownTicks: spec.cooldownTicks / factor },
  };
};

const derivedFor = (
  card: CardDefinition,
  axis: DemandAxis,
  thresholds: KnockoutThresholds
): CardDefinition | undefined => {
  switch (axis) {
    case 'block':
      return withoutBlock(card, thresholds.blockHp);
    case 'anti-air':
      return withoutAntiAir(card);
    case 'mass-answer':
      return withoutMassAnswer(card);
    case 'heavy-hit':
      return withoutHeavyHit(card, thresholds.heavyHitDamage);
  }
};

/**
 * 基礎札の一覧から、軸ノックアウト変種をすべて導出する
 *
 * **変種を作るのは、その札が実際にその軸を持つときだけ。** 判定は `axesOfCard` に
 * 委ねるので、段階B で足す新カードも自動で拾われる（`axesOf` を ID 直書きに
 * しなかったのと同じ理由）。
 */
export const deriveKnockouts = (
  cards: readonly CardDefinition[],
  thresholds: KnockoutThresholds
): CardDefinition[] =>
  cards.flatMap((card) =>
    axesOfCard(card)
      .map((axis) => derivedFor(card, axis, thresholds))
      .filter((variant): variant is CardDefinition => variant !== undefined)
  );
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/knockout-cards.test.ts`
Expected: PASS

- [ ] **Step 5: テストの実効性を変異で確かめる**

`knockout-cards.ts` の `withoutAntiAir` の `groundedTicks: 0` を一時的に
`groundedTicks: undefined` に変え、テストを実行する。

Run: `npx jest src/features/ashen-rampart/domain/cards/knockout-cards.test.ts`
Expected: FAIL（**「落網の groundedTicks は削除せず 0 にする」の1件だけ**が赤くなる）

**「落とした軸だけを失い、他の軸は保つ」は赤くならない。** `axesOfCard` の anti-air 判定は
`(groundedTicks ?? 0) > 0` なので、`undefined` と `0` を同一視するためである。
**つまり極性の保存を単体テストで捕まえているのはこの1件だけであり**、
振る舞いのレベルで捕まえるのは Task 6 の陰性対照である。この非対称は意図どおりで、
1件だけ赤くなれば実効性の確認としては十分である。

確認後、**必ず元に戻す**。

- [ ] **Step 6: 型チェックと lint、コミット**

```bash
npm run typecheck && npm run lint:ci
git add src/features/ashen-rampart/domain/cards/knockout-cards.ts \
        src/features/ashen-rampart/domain/cards/knockout-cards.test.ts
git commit -m "feat(ashen-rampart): 軸ノックアウト変種の導出を追加

- 札はそのままに、その軸の能力だけを消した変種を純粋関数で導出する
- block は閾値の1つ下（39）まで。最小介入にする
- anti-air は groundedTicks を削除せず 0 にする。削除すると applyTraps の
  対象極性が飛行から地上へ反転する（設計書 §8.2.15(a)1）
- heavy-hit は damage と cooldownTicks を同じ整数比で割る。
  DPS を保った分割が無い札は例外にする（静かに歪めない）
- 変種を作る対象は axesOfCard に委ねる（述語を再実装しない）"
```

---

### Task 3: `card-pool` への合流と到達不能性の固定

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`

**Interfaces:**
- Consumes: `deriveKnockouts`, `KNOCKOUT_ID_PREFIX`（Task 2）、`BLOCK_HP_THRESHOLD`, `HEAVY_HIT_DAMAGE_THRESHOLD`（Task 1）
- Produces: `export const KNOCKOUT_CARD_IDS: readonly string[]`（Task 4 が使う）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/cards/card-pool.test.ts` の末尾に追記する。
**このファイルは既に `getCardDefinition` / `CARD_IDS` / `PRESET_DECKS` / `DECK_SIZE` /
`maxCopiesOf` / `availabilityOf` / `BUILDABLE_CARD_IDS` / `ACQUIRABLE_CARD_IDS` を
`./card-pool` から、`validateDeck` を `./deck-builder` から import している。**
足すのは次の2つだけで、`validateDeck` と `DECK_SIZE` を二重に import しないこと:

- 既存の `./card-pool` の import 文に `KNOCKOUT_CARD_IDS` を追記する
- `import { KNOCKOUT_ID_PREFIX } from './knockout-cards';` を新しく足す

```ts
describe('ノックアウト変種は監査からしか触れない（設計書 §8.2.15(m)）', () => {
  it('変種が1枚以上導出されている', () => {
    expect(KNOCKOUT_CARD_IDS.length).toBeGreaterThan(0);
  });

  it('基礎札の ID は接頭辞を持たない（衝突が構文的に起こりえない）', () => {
    CARD_IDS.forEach((id) => {
      expect(id.startsWith(KNOCKOUT_ID_PREFIX)).toBe(false);
    });
  });

  it('変種は CARD_IDS に含まれない', () => {
    KNOCKOUT_CARD_IDS.forEach((id) => {
      expect(CARD_IDS).not.toContain(id);
    });
  });

  it('変種は構築にも獲得にも出ない', () => {
    KNOCKOUT_CARD_IDS.forEach((id) => {
      expect(BUILDABLE_CARD_IDS).not.toContain(id);
      expect(ACQUIRABLE_CARD_IDS).not.toContain(id);
    });
  });

  it('変種は getCardDefinition から引ける（監査はこの経路だけを使う）', () => {
    KNOCKOUT_CARD_IDS.forEach((id) => {
      expect(getCardDefinition(id).id).toBe(id);
    });
  });

  it('基礎札の定義が変種に上書きされていない', () => {
    // Map は後勝ちなので、合流順を誤ると本番の札が静かに置き換わる
    expect(getCardDefinition('stone-wall').tower?.hp).toBe(60);
    expect(getCardDefinition('cannon-tower').tower?.damage).toBe(12);
    expect(getCardDefinition('snare-net').trap?.groundedTicks).toBe(120);
  });

  it('CARD_IDS の枚数は変種を足しても14のまま', () => {
    expect(CARD_IDS).toHaveLength(14);
  });
});
```

さらに `deck-builder.test.ts` ではなくここで、構築側が弾くことを固定する
（`validateDeck` は `card-pool` の `CARD_IDS` に依存しているため）:

```ts
describe('ノックアウト変種は構築規則を通らない', () => {
  it('validateDeck は変種を未知のカードとして弾く', () => {
    const koId = KNOCKOUT_CARD_IDS[0];
    expect(koId).toBeDefined();
    const deck = Array.from({ length: DECK_SIZE }, () => koId as string);
    const result = validateDeck(deck);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('未知のカード'))).toBe(true);
  });
});
```

`validateDeck` と `DECK_SIZE` を import に足すこと（`validateDeck` は `./deck-builder` から）。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: FAIL（`KNOCKOUT_CARD_IDS` が export されていない）

- [ ] **Step 3: `card-pool.ts` を変更する**

先頭の import に追加:

```ts
import { BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from './axis-of-card';
import { deriveKnockouts, KNOCKOUT_ID_PREFIX } from './knockout-cards';
```

`const CARD_MAP = new Map(CARDS.map((c) => [c.id, c]));` を次で置き換える:

```ts
/**
 * 軸ノックアウト変種（監査専用・設計書 §8.2.15）
 *
 * **`CARD_IDS` には入らない。** したがって構築（`BUILDABLE_CARD_IDS`）・
 * 獲得（`ACQUIRABLE_CARD_IDS`）・UI・`validateDeck`（`CARD_IDS.includes` で
 * 未知として弾く）からは到達できない。`getCardDefinition` からだけ引ける。
 *
 * **監査専用のデータが domain と本番バンドルに載ることは認めている**
 * （数KB・機能影響なし。`levy` の `retired` と同じ扱い）。
 */
const KNOCKOUT_CARDS: readonly CardDefinition[] = deriveKnockouts(CARDS, {
  blockHp: BLOCK_HP_THRESHOLD,
  heavyHitDamage: HEAVY_HIT_DAMAGE_THRESHOLD,
});

/**
 * 合流順は「基礎札が後ろ＝勝つ」向きにする
 *
 * `Map` は後勝ちなので、変種を後ろに置くと ID が衝突した瞬間に
 * **本番の札が沈黙して上書きされる**（`CARD_IDS` は14件のままなので
 * 到達不能性のテストも枚数のテストも通ってしまう）。事故っても
 * 本番が壊れない向きにしてある。
 */
const CARD_MAP: ReadonlyMap<string, CardDefinition> = new Map(
  [...KNOCKOUT_CARDS, ...CARDS].map((c) => [c.id, c])
);

/** 監査が使う変種の ID 一覧（`CARD_IDS` とは素である） */
export const KNOCKOUT_CARD_IDS: readonly string[] = KNOCKOUT_CARDS.map((c) => c.id);
```

`export const CARD_IDS` の直後に契約の検査を置く:

```ts
// 契約: 変種の ID は基礎札と衝突しない（衝突すると CARD_MAP が本番の札を失う）
if (CARD_IDS.some((id) => id.startsWith(KNOCKOUT_ID_PREFIX))) {
  throw new Error('基礎札の ID がノックアウトの接頭辞と衝突しています');
}
```

`CardDefinition` は既に型 import 済みであることを確認する（未 import なら
`import type { CardAvailability, CardDefinition } from './card-definition';` に含める）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards`
Expected: PASS

- [ ] **Step 5: 合流順の変異でテストの実効性を確かめる**

`CARD_MAP` の合流順を `[...CARDS, ...KNOCKOUT_CARDS]` に一時的に戻し、
`knockoutIdOf` を「接頭辞なし」（＝基礎IDと同じ）に一時変更してテストを実行する。

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: FAIL（「基礎札の定義が変種に上書きされていない」が赤くなる）
確認後、**必ず両方とも元に戻す**。

- [ ] **Step 6: 全テストで退行が無いことを確認する**

Run: `npx jest src/features/ashen-rampart`
Expected: PASS（`unit-visual.test.ts` の「14種」「字面が一意」、`card-text.test.ts` の全カード網羅、`CardGlyph.test.tsx`、`board-plates.test.ts` を含めてすべて緑）

- [ ] **Step 7: 型チェックと lint、コミット**

```bash
npm run typecheck && npm run lint:ci
git add src/features/ashen-rampart/domain/cards/card-pool.ts \
        src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat(ashen-rampart): ノックアウト変種を CARD_MAP にだけ合流させる

- CARD_IDS には入れない。構築・獲得・UI・validateDeck からは到達不能のまま
- 合流順は基礎札を後ろに置く。Map は後勝ちなので、変種を後ろにすると
  ID 衝突時に本番の札が沈黙して上書きされる
- 接頭辞 !ko/ の素性をモジュール読み込み時に検査する
- 到達不能性・上書きされないことをテストで固定した"
```

---

### Task 4: 位置を保つ差し替えと監査用デッキ（`axis-knockout.ts`）

**Files:**
- Create: `src/features/ashen-rampart/domain/expedition/axis-knockout.ts`
- Create: `src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts`

**Interfaces:**
- Consumes: `KNOCKOUT_CARD_IDS`（Task 3）、`knockoutIdOf`（Task 2）、`axesOf`・`DemandAxis`（Task 1）
- Produces:
  - `export const knockoutDeck: (cards: readonly string[], axis: DemandAxis) => string[]`
  - `export const AUDIT_FULL_DECK: readonly string[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts`:

```ts
import { validateDeck } from '../cards/deck-builder';
import { DECK_SIZE, KNOCKOUT_CARD_IDS } from '../cards/card-pool';
import { knockoutIdOf } from '../cards/knockout-cards';
import { DEMAND_AXES, axesOf } from './stage-definition';
import { AUDIT_FULL_DECK, knockoutDeck } from './axis-knockout';

describe('knockoutDeck（デッキの同じ位置で差し替える）', () => {
  it('枚数が変わらない', () => {
    DEMAND_AXES.forEach((axis) => {
      expect(knockoutDeck(AUDIT_FULL_DECK, axis)).toHaveLength(AUDIT_FULL_DECK.length);
    });
  });

  it('その軸を持つ札だけが、同じ位置で変種に置き換わる', () => {
    const swapped = knockoutDeck(AUDIT_FULL_DECK, 'anti-air');
    AUDIT_FULL_DECK.forEach((id, index) => {
      const expected = axesOf(id).includes('anti-air') ? knockoutIdOf('anti-air', id) : id;
      expect(swapped[index]).toBe(expected);
    });
  });

  it('置き換わった札は、その軸を失っている', () => {
    DEMAND_AXES.forEach((axis) => {
      knockoutDeck(AUDIT_FULL_DECK, axis).forEach((id) => {
        expect(axesOf(id)).not.toContain(axis);
      });
    });
  });

  it('その軸を持たない札は1枚も変わらない', () => {
    const swapped = knockoutDeck(AUDIT_FULL_DECK, 'block');
    AUDIT_FULL_DECK.forEach((id, index) => {
      if (axesOf(id).includes('block')) return;
      expect(swapped[index]).toBe(id);
    });
  });

  it('存在しない変種を参照しない', () => {
    DEMAND_AXES.forEach((axis) => {
      knockoutDeck(AUDIT_FULL_DECK, axis).forEach((id) => {
        if (!AUDIT_FULL_DECK.includes(id)) expect(KNOCKOUT_CARD_IDS).toContain(id);
      });
    });
  });
});

describe('AUDIT_FULL_DECK（B0-P5・設計書 §8.2.15(e)）', () => {
  it(`枚数は ${DECK_SIZE} 枚ちょうどで、構築規則を満たす`, () => {
    expect(AUDIT_FULL_DECK).toHaveLength(DECK_SIZE);
    expect(validateDeck([...AUDIT_FULL_DECK]).errors).toEqual([]);
  });

  it('4軸すべてを備えている', () => {
    DEMAND_AXES.forEach((axis) => {
      expect(AUDIT_FULL_DECK.some((id) => axesOf(id).includes(axis))).toBe(true);
    });
  });

  it('業火を含まない（再点火が基礎カードを読むため軸を消せない）', () => {
    // step-tick.ts の applyReactivate は getCardDefinition('ember-blast') を
    // ID 直書きで引き、PlacedEmber は cardId を持たない（設計書 §8.2.15(a)2）
    expect(AUDIT_FULL_DECK).not.toContain('ember-blast');
  });

  it('徹甲弩を含まない（貫通が飛行を絞らないため対空を消せない）', () => {
    // applyPiercingDamage に飛行の絞り込みが無い（設計書 §8.2.15(a)5）
    expect(AUDIT_FULL_DECK).not.toContain('piercer');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts`
Expected: FAIL（`Cannot find module './axis-knockout'`）

- [ ] **Step 3: `axis-knockout.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - 軸ノックアウトの監査で使う道具（設計書 §8.2.15）
 *
 * `knockout-cards.ts` が「変種を作る」責務、ここが「デッキへ当てる」責務。
 * 分けてあるのは、前者が `card-pool` を import できない葉である必要があるため。
 */
import { KNOCKOUT_CARD_IDS } from '../cards/card-pool';
import { knockoutIdOf } from '../cards/knockout-cards';
import type { DemandAxis } from './stage-definition';

const KNOCKOUT_ID_SET: ReadonlySet<string> = new Set(KNOCKOUT_CARD_IDS);

/**
 * その軸を持つ札を、同じ位置で変種へ差し替える
 *
 * **位置を保つことが要点である。** `createDeck` のシャッフル（Fisher-Yates）は
 * 配列の長さぶんだけ乱数を引き、中身に依存しない。したがって位置を保てば、
 * 同じシードで基準腕とノックアウト腕のシャッフル結果が1対1に対応する。
 * **フィルタして末尾に足す実装にしてはならない**（対応が壊れて陰性対照が成立しなくなる）。
 */
export const knockoutDeck = (cards: readonly string[], axis: DemandAxis): string[] =>
  cards.map((id) => {
    const variantId = knockoutIdOf(axis, id);
    return KNOCKOUT_ID_SET.has(variantId) ? variantId : id;
  });

/**
 * 監査の主要デッキ（全軸充足12枚・設計書 §8.2.15(e)）
 *
 * | 軸 | 提供する札 |
 * |---|---|
 * | block | 石壁×2 |
 * | anti-air | 弩砲×2, 落網×1 |
 * | mass-answer | 火砲台×2 |
 * | heavy-hit | 火砲台×2 |
 *
 * **業火を入れない。** 再点火が `getCardDefinition('ember-blast')` を ID 直書きで
 * 引くため、変種を置いても2回目以降は基礎の半径2・8ダメージに戻る（§8.2.15(a)2）。
 * **徹甲弩を入れない。** `applyPiercingDamage` が飛行を絞らないため、
 * `hitsFlying → false` にしても対空が消えない（§8.2.15(a)5）。
 *
 * 軸を1つも持たない札は 魔力炉×3・棘罠×1・弓兵×1 の計5枚。処置が掛かるのは残り7枚である。
 */
export const AUDIT_FULL_DECK: readonly string[] = [
  'reactor',
  'reactor',
  'reactor',
  'stone-wall',
  'stone-wall',
  'ballista',
  'ballista',
  'cannon-tower',
  'cannon-tower',
  'snare-net',
  'spike-trap',
  'arrow-tower',
];
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts`
Expected: PASS

- [ ] **Step 5: 変異でテストの実効性を確かめる**

`knockoutDeck` を「フィルタして末尾に足す」実装へ一時的に変える:

```ts
export const knockoutDeck = (cards: readonly string[], axis: DemandAxis): string[] => {
  const kept = cards.filter((id) => !KNOCKOUT_ID_SET.has(knockoutIdOf(axis, id)));
  const swapped = cards.filter((id) => KNOCKOUT_ID_SET.has(knockoutIdOf(axis, id)))
    .map((id) => knockoutIdOf(axis, id));
  return [...kept, ...swapped];
};
```

Run: `npx jest src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts`
Expected: FAIL（「その軸を持つ札だけが、同じ位置で変種に置き換わる」が赤くなる）
確認後、**必ず元に戻す**。

- [ ] **Step 6: 型チェックと lint、コミット**

```bash
npm run typecheck && npm run lint:ci
git add src/features/ashen-rampart/domain/expedition/axis-knockout.ts \
        src/features/ashen-rampart/domain/expedition/axis-knockout.test.ts
git commit -m "feat(ashen-rampart): 位置を保つ軸ノックアウトの差し替えと監査用デッキを追加

- knockoutDeck はデッキ配列の同じ位置で変種へ置き換える。
  シャッフルは配列の中身に依存しないので、位置を保てば基準腕と
  ノックアウト腕のシャッフル結果が1対1に対応する
- AUDIT_FULL_DECK は業火（再点火が基礎カードを読む）と
  徹甲弩（貫通が飛行を絞らない）を外した全軸充足12枚"
```

---

### Task 5: 全 tick のイベント列を集める `simulateRunCollecting`

**なぜ要るか**: 陰性対照は「イベント列まで同一」を主張する。`simulateRun` が返す `finalState.events` は**最後の tick のぶんだけ**なので、この主張を検査できない。主張より狭い検査を置くのが §8.2.14 の致命的欠陥だったので、ここは先に道具を用意する。

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/run-simulation.ts`
- Create: `src/features/ashen-rampart/domain/combat/run-simulation-collecting.test.ts`

**Interfaces:**
- Produces: `export const simulateRunCollecting: (initial: CombatState, strategy: Strategy, map: StageMap) => RunSimulationResult & { eventLog: readonly TickEvent[] }`
- `simulateRun` は `simulateRunCollecting` へ委譲する（ループを2つ持たない）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/combat/run-simulation-collecting.test.ts`:

```ts
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState } from './combat-state';
import { greedyStrategy, simulateRun, simulateRunCollecting } from './run-simulation';
import { PROVISIONAL_STAGES } from '../expedition/stage-pool';

// `tsconfig.json` は `noUncheckedIndexedAccess` を持たないので添字は要素型を返すが、
// 前提が壊れたときに黙って空ウェーブで走らないよう明示的に落とす
const stage = PROVISIONAL_STAGES.find((s) => s.id === 'prov-t1-a');
if (!stage) throw new Error('前提が壊れています: prov-t1-a が見つかりません');

const runOf = () => {
  const deck = createDeck(
    ['reactor', 'reactor', 'reactor', 'stone-wall', 'stone-wall', 'arrow-tower'],
    () => 0.5
  );
  return createCombatState(deck, stage.waves);
};

describe('simulateRunCollecting', () => {
  it('simulateRun と同じ結果を返す（委譲していることの裏取り）', () => {
    const a = simulateRun(runOf(), greedyStrategy, PLAINS_MAP);
    const b = simulateRunCollecting(runOf(), greedyStrategy, PLAINS_MAP);
    expect(b.outcome).toBe(a.outcome);
    expect(b.ticks).toBe(a.ticks);
    expect(b.lifeLeft).toBe(a.lifeLeft);
    expect(b.cardsPlayed).toBe(a.cardsPlayed);
  });

  it('最後の tick だけでなく、全 tick のイベントを集める', () => {
    const result = simulateRunCollecting(runOf(), greedyStrategy, PLAINS_MAP);
    // 前提: このランでは実際に札が出ている（0 なら比較が空虚になる）
    expect(result.cardsPlayed).toBeGreaterThan(0);
    // finalState.events は最後の tick のぶんだけ。eventLog はそれより多い
    expect(result.eventLog.length).toBeGreaterThan(result.finalState.events.length);
  });

  it('集めたイベントに、札を出した記録が含まれる', () => {
    const result = simulateRunCollecting(runOf(), greedyStrategy, PLAINS_MAP);
    expect(result.eventLog.filter((e) => e.kind === 'played').length).toBe(result.cardsPlayed);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/run-simulation-collecting.test.ts`
Expected: FAIL（`simulateRunCollecting` が export されていない）

- [ ] **Step 3: `run-simulation.ts` を変更する**

`simulateRun` の定義を次で置き換える（`TickEvent` の型 import を足すこと）:

```ts
/**
 * ランを丸ごと回し、**全 tick のイベント列も返す**
 *
 * `CombatState.events` はその tick のぶんしか持たないので、
 * 陰性対照（2つの腕のランが完全に一致するか）はこれが無いと検査できない。
 * ループを2つ持たないため、`simulateRun` はこれに委譲する。
 */
export const simulateRunCollecting = (
  initial: CombatState,
  strategy: Strategy,
  map: StageMap
): RunSimulationResult & { eventLog: readonly TickEvent[] } => {
  let state = initial;
  let cardsPlayed = 0;
  const eventLog: TickEvent[] = [];
  while (state.outcome === 'playing' && state.tick < SIMULATION_MAX_TICKS) {
    const actions = strategy(state, map);
    state = stepTick(state, actions, map);
    cardsPlayed += state.events.filter((e) => e.kind === 'played').length;
    eventLog.push(...state.events);
  }
  return {
    outcome: state.outcome,
    ticks: state.tick,
    lifeLeft: state.life,
    cardsPlayed,
    finalState: state,
    eventLog,
  };
};

export const simulateRun = (
  initial: CombatState,
  strategy: Strategy,
  map: StageMap
): RunSimulationResult => {
  const { eventLog: _eventLog, ...result } = simulateRunCollecting(initial, strategy, map);
  return result;
};
```

`TickEvent` の import を先頭に足す:

```ts
import type { CombatState, TickEvent } from './combat-state';
```

（既に `import type { CombatState } from './combat-state';` がある場合は `TickEvent` を追記する。
未使用変数 `_eventLog` が `lint:ci` で警告になる場合は、代わりに次の形にする:

```ts
export const simulateRun = (
  initial: CombatState,
  strategy: Strategy,
  map: StageMap
): RunSimulationResult => {
  const collected = simulateRunCollecting(initial, strategy, map);
  return {
    outcome: collected.outcome,
    ticks: collected.ticks,
    lifeLeft: collected.lifeLeft,
    cardsPlayed: collected.cardsPlayed,
    finalState: collected.finalState,
  };
};
```
）

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/run-simulation-collecting.test.ts`
Expected: PASS

- [ ] **Step 5: 既存の較正テストが退行していないことを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat`
Expected: PASS（`balance.test.ts` の実測値が1つも動いていないこと。動いたら委譲が等価でない）

- [ ] **Step 6: 型チェックと lint、コミット**

```bash
npm run typecheck && npm run lint:ci
git add src/features/ashen-rampart/domain/combat/run-simulation.ts \
        src/features/ashen-rampart/domain/combat/run-simulation-collecting.test.ts
git commit -m "feat(ashen-rampart): 全 tick のイベント列を返す simulateRunCollecting を追加

- CombatState.events はその tick のぶんしか持たないため、
  陰性対照の「イベント列まで同一」を検査できなかった
- simulateRun はこれに委譲する（ループを2つ持たない）"
```

---

### Task 6: 陰性対照（`B0-P1`・`B0-P3`）を CI 常駐で置く

**Files:**
- Create: `src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts`

**Interfaces:**
- Consumes: `simulateRunCollecting`（Task 5）、`knockoutDeck`・`AUDIT_FULL_DECK`（Task 4）、`baseIdOf`（Task 2）

- [ ] **Step 1: 失敗するテストを書く**

```ts
/**
 * 軸ノックアウトの健全性検査（設計書 §8.2.15(f)・`B0-P1` / `B0-P3`）
 *
 * **環境変数ゲートの向こうに置かない。** 重い監査の中にしか無い健全性検査は、
 * 壊れても誰も気づかない。撤回された §8.2.14 は、比較集合が主張より狭かったために
 * 「壊れているのに緑」になっていた（実測: 登録した5項目の不一致 0/20 に対し、
 * 罠状態の不一致は最大 15/20）。
 */
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { createDeck, shuffle } from '../../domain/cards/deck';
import { baseIdOf } from '../../domain/cards/knockout-cards';
import { createCombatState } from '../../domain/combat/combat-state';
import { getEnemySpec } from '../../domain/combat/enemies';
import { greedyStrategy, simulateRunCollecting } from '../../domain/combat/run-simulation';
import { AUDIT_FULL_DECK, knockoutDeck } from '../../domain/expedition/axis-knockout';
import { PROVISIONAL_STAGES } from '../../domain/expedition/stage-pool';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { StageDefinition } from '../../domain/expedition/stage-definition';

/** 陰性対照のシード帯（設計書 §8.2.15(f)） */
const SEEDS = Array.from({ length: 20 }, (_, i) => 1251 + i);

/** そのステージに飛行する敵が1体でも出るか */
const hasFlyingEnemy = (stage: StageDefinition): boolean =>
  stage.waves.some((w) => w.entries.some((e) => getEnemySpec(e.enemyId).flying));

const NO_FLYING_STAGES = PROVISIONAL_STAGES.filter((s) => !hasFlyingEnemy(s));

/** カードIDの接頭辞を剥がして比べる（腕どうしは ID だけが構造上必ず違う） */
const normalize = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) => (typeof v === 'string' ? baseIdOf(v) : v));

const runOn = (stage: StageDefinition, cards: readonly string[], seed: number) => {
  const random = createSeededRandom(seed);
  const deck = createDeck(cards, () => random.random());
  return simulateRunCollecting(createCombatState(deck, stage.waves), greedyStrategy, stage.map);
};

describe('B0-P1 陰性対照: 飛行が1体もいないステージで anti-air をノックアウトしてもランは変わらない', () => {
  jest.setTimeout(60000);

  it('飛行がいないステージが4つある（検査の前提）', () => {
    expect(NO_FLYING_STAGES.map((s) => s.id)).toEqual([
      'prov-t1-a',
      'prov-t1-b',
      'prov-t2-a',
      'prov-t3-b',
    ]);
  });

  it.each(NO_FLYING_STAGES.map((s) => [s.id, s] as const))('%s', (_id, stage) => {
    const koCards = knockoutDeck(AUDIT_FULL_DECK, 'anti-air');
    SEEDS.forEach((seed) => {
      const base = runOn(stage, AUDIT_FULL_DECK, seed);
      const ko = runOn(stage, koCards, seed);

      expect(ko.outcome).toBe(base.outcome);
      expect(ko.ticks).toBe(base.ticks);
      expect(ko.lifeLeft).toBe(base.lifeLeft);
      expect(ko.cardsPlayed).toBe(base.cardsPlayed);
      // **状態の全体とイベント列まで比べる。** スカラーだけでは、
      // 罠の使用回数の差（damage 0 なので HP に出ない）を素通りさせる
      expect(normalize(ko.finalState)).toBe(normalize(base.finalState));
      expect(normalize(ko.eventLog)).toBe(normalize(base.eventLog));
    });
  });
});

describe('B0-P3 シャッフルの位置対応', () => {
  it('同じシードなら、差し替えたデッキも同じ置換になる', () => {
    SEEDS.forEach((seed) => {
      const a = createSeededRandom(seed);
      const b = createSeededRandom(seed);
      const baseOrder = shuffle(AUDIT_FULL_DECK, () => a.random());
      const koOrder = shuffle(knockoutDeck(AUDIT_FULL_DECK, 'mass-answer'), () => b.random());
      expect(koOrder.map(baseIdOf)).toEqual(baseOrder);
    });
  });
});
```

- [ ] **Step 2: テストを実行する**

Run: `npx jest src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts`
Expected: PASS

**もし赤くなったら、閾値も比較集合も緩めないこと。** ノックアウトの導出のほうを直す
（設計書 §8.2.15(f)）。それでも一致しないなら、「この道具でも軸を分離できない」という結果として
§8.2.16 に記録し、監査は実行しない。

- [ ] **Step 3: 変異で「破れを検出できること」を確かめる**

`knockout-cards.ts` の `withoutAntiAir` を、撤回された §8.2.14 の規則
（`groundedTicks` を削除する）へ一時的に戻す:

```ts
    ...(trap ? { trap: { ...trap, groundedTicks: undefined } } : {}),
```

Run: `npx jest src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts`
Expected: **FAIL**（`normalize(ko.finalState)` と `normalize(ko.eventLog)` が赤くなる。
スカラー4項目は緑のまま——これが §8.2.14 が素通りした経路である）

**この変異が赤くならなければ、この検査は陰性対照として機能していない。** 先へ進まないこと。
確認後、**必ず元に戻す**。

- [ ] **Step 4: CI 全体を通し、実行時間を測る**

Run: `time npx jest src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts`
測った秒数を控える（§8.3 の予算表に追記するため）。

Run: `npm run ci`
Expected: すべて緑

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts
git commit -m "test(ashen-rampart): 軸ノックアウトの陰性対照を CI 常駐で置く

- 飛行が1体もいないステージで anti-air をノックアウトしても
  ランが完全に一致することを検査する（B0-P1）
- 比較は状態の全体と全 tick のイベント列。カードIDは接頭辞を剥がして比べる。
  スカラー4項目だけでは、罠の使用回数の差（damage 0 なので HP に出ない）を
  素通りさせる——撤回された §8.2.14 の致命的欠陥がこれだった
- シャッフルの位置対応も固定する（B0-P3）"
```

---

### Task 7: Holm 補正（`holm.ts`）

**Files:**
- Create: `src/features/ashen-rampart/domain/shared/holm.ts`
- Create: `src/features/ashen-rampart/domain/shared/holm.test.ts`

**Interfaces:**
- Produces: `export const holmAdjust: (pValues: readonly number[]) => number[]`（入力と同じ順序で補正後 p を返す）

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { holmAdjust } from './holm';

describe('holmAdjust（Holm-Bonferroni の補正後 p 値）', () => {
  it('空配列は空配列', () => {
    expect(holmAdjust([])).toEqual([]);
  });

  it('1本なら補正しない', () => {
    expect(holmAdjust([0.03])).toEqual([0.03]);
  });

  it('昇順の i 番目に (m - i + 1) を掛ける', () => {
    // m=3。p=(0.01, 0.02, 0.04) → (0.03, 0.04, 0.04)
    // 3番目は 0.04 * 1 = 0.04 だが、単調化で2番目の 0.04 以上に保たれる。
    // **浮動小数なので toEqual で比べない**（0.01 * 3 がたまたま 0.03 と一致するかは
    // この式の意図ではない）
    const adjusted = holmAdjust([0.01, 0.02, 0.04]);
    expect(adjusted[0]).toBeCloseTo(0.03, 10);
    expect(adjusted[1]).toBeCloseTo(0.04, 10);
    expect(adjusted[2]).toBeCloseTo(0.04, 10);
  });

  it('入力の順序で返す（昇順に並べ替えない）', () => {
    const adjusted = holmAdjust([0.04, 0.01, 0.02]);
    expect(adjusted[0]).toBeCloseTo(0.04, 10);
    expect(adjusted[1]).toBeCloseTo(0.03, 10);
    expect(adjusted[2]).toBeCloseTo(0.04, 10);
  });

  it('単調化する（生 p の昇順に並べ直すと非減少になる）', () => {
    // 単調化しないと、3番目（0.022 * 3 = 0.066）が
    // 4番目（0.023 * 2 = 0.046）を上回って順序が逆転する
    const input = [0.02, 0.021, 0.022, 0.023, 0.024];
    const adjusted = holmAdjust(input);
    for (let i = 1; i < adjusted.length; i++) {
      expect(adjusted[i]).toBeGreaterThanOrEqual(adjusted[i - 1] as number);
    }
  });

  it('1 で頭打ちにする', () => {
    expect(holmAdjust([0.5, 0.6])).toEqual([1, 1]);
  });

  it('0 以上 1 以下でない値は契約違反', () => {
    expect(() => holmAdjust([1.5])).toThrow();
    expect(() => holmAdjust([-0.1])).toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/ashen-rampart/domain/shared/holm.test.ts`
Expected: FAIL（`Cannot find module './holm'`）

- [ ] **Step 3: `holm.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - Holm-Bonferroni の補正（設計書 §8.2.15(h)）
 *
 * 生 p 値を昇順に並べ、`i` 番目に `(m - i + 1)` を掛けたうえで単調化する。
 * 単調化しないと「小さい生 p の補正後が、大きい生 p の補正後を上回る」
 * 順序の逆転が起きる。
 *
 * **`G3` では、この補正が実際に判定を変えうる。** 合格条件（相対低下50%）と
 * 前提条文 `B0-P4`（基準勝率 ≥ 0.40）を満たす組の McNemar p 値の最大は 0.01349 で、
 * 5本族の最も厳しい2段階（α/5 = 0.01・α/4 = 0.0125）を超える。
 * 撤回された §8.2.14 の設計（最大 p が 7.85e-5）では、補正は構造的に空振りしていた。
 */
export const holmAdjust = (pValues: readonly number[]): number[] => {
  pValues.forEach((p) => {
    if (!Number.isFinite(p) || p < 0 || p > 1) {
      throw new Error(`p 値は 0 以上 1 以下です: ${p}`);
    }
  });

  const m = pValues.length;
  const order = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
  const adjusted = new Array<number>(m);
  let running = 0;
  order.forEach((entry, rank) => {
    running = Math.min(1, Math.max(running, entry.p * (m - rank)));
    adjusted[entry.index] = running;
  });
  return adjusted;
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/shared/holm.test.ts`
Expected: PASS

- [ ] **Step 5: 型チェックと lint、コミット**

```bash
npm run typecheck && npm run lint:ci
git add src/features/ashen-rampart/domain/shared/holm.ts \
        src/features/ashen-rampart/domain/shared/holm.test.ts
git commit -m "feat(ashen-rampart): Holm-Bonferroni の補正を追加

- 生 p を昇順に並べ (m - i + 1) を掛けて単調化する
- G3 では合格条件と B0-P4 の下でも最大 p が 0.01349 になり、
  5本族の α/5・α/4 を超えるため、補正が実際に判定を変えうる"
```

---

### Task 8: 撤回した道具に警告を貼る

**Files:**
- Modify: `src/features/ashen-rampart/domain/expedition/axis-strategy.ts`
- Modify: `src/features/ashen-rampart/domain/expedition/axis-strategy.test.ts`
- Rename: `src/features/ashen-rampart/application/simulation/stage-demand-audit.manual.test.ts` → `stage-demand-audit.retracted.manual.test.ts`

- [ ] **Step 1: `axis-strategy.ts` の docstring を書き換える**

ファイル先頭のブロックコメントを次で置き換える（実装本体は変えない）:

```ts
/**
 * 灰燼の城壁 - 要求軸を落とした戦略【⚠️ 反証済み。測定に使ってはならない】
 *
 * **この道具は設計書 §8.2.15(a) で反証されている。**
 * 「軸が要るか」ではなく「デッキから何割の火力が抜けたか」を測っていた。
 *
 * 落ちる札の枚数とコストが軸ごとに大きく違う:
 *
 * | デッキ | 軸 | 置かなくなる枚数（12枚中） | その総コスト |
 * |---|---|---|---|
 * | swift | block | 2 | 2 |
 * | swift | anti-air | 3 | 8 |
 * | heavy | anti-air | 5 | 14 |
 * | heavy | mass-answer / heavy-hit | 3 | 13 |
 *
 * **決定的な反証**: 飛行が1体もいないステージ（`prov-t2-a` は雑兵・俊足・群れのみ）で
 * `anti-air` を落とすと、真の効果は定義上ゼロのはずなのに **差16** が出た。
 * 弩砲2枚と徹甲弩1枚＝このデッキの主火力が消えていただけである。
 *
 * **代わりに `axis-knockout.ts` の `knockoutDeck` を使う**
 * （札は同じ位置に残し、その軸の能力だけを消した変種へ差し替える）。
 *
 * 関数を残してあるのは §8.2.7 の実測を次に読む人へ渡すためで、
 * 現役の消費者は無い（`deployThenIdleStrategy` とは事情が違う）。
 */
```

- [ ] **Step 2: `axis-strategy.test.ts` の先頭に1行入れる**

ファイル先頭（import の前）に:

```ts
/**
 * ⚠️ 反証済みの道具の回帰テストである（設計書 §8.2.15(a)）。
 * `withoutAxisStrategy` は測定に使ってはならない。ここは挙動の凍結だけを目的とする。
 */
```

- [ ] **Step 3: 監査テストをリネームし、警告を貼る**

```bash
git mv src/features/ashen-rampart/application/simulation/stage-demand-audit.manual.test.ts \
       src/features/ashen-rampart/application/simulation/stage-demand-audit.retracted.manual.test.ts
```

リネーム後のファイルの先頭ブロックコメントを次で置き換える:

```ts
/**
 * 【⚠️ 撤回済み】暫定ステージが宣言した要求軸を実際に要求するかの監査
 *
 * **この測定は設計書 §8.2.15(a) で反証された。数値を根拠に使ってはならない。**
 * 使っている `withoutAxisStrategy` は軸ではなく「デッキから抜けた火力の量」を
 * 測っていた（飛行0体のステージで対空を落とすと差16）。
 *
 * §8.2.7 の表を再現するためだけに残してある。現行の監査は
 * `axis-demand-gate.manual.test.ts`（ゲート `G3`）である。
 *
 * 実行するには: ASHEN_RAMPART_AUDIT=1 npx jest stage-demand-audit
 */
```

- [ ] **Step 4: テストが緑のままであることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition && npm run lint:ci && npm run typecheck`
Expected: すべて緑（`stage-demand-audit.retracted.manual.test.ts` は環境変数が無いので skip）

- [ ] **Step 5: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "docs(ashen-rampart): 反証済みの軸監査の道具に警告を貼る

- axis-strategy.ts の docstring に反証の実測（枚数・コスト表と差16）を貼る
- stage-demand-audit を .retracted. へリネームし、冒頭に撤回を明記する
  関数だけに注記して、実際に数値を吐くテストを無印で残すと撤回の意味が消える"
```

---

### Task 9: `G3` の測定本体（環境変数ゲート）

**Files:**
- Create: `src/features/ashen-rampart/application/simulation/axis-demand-gate.manual.test.ts`

**Interfaces:**
- Consumes: `knockoutDeck`・`AUDIT_FULL_DECK`（Task 4）、`holmAdjust`（Task 7）、`mcnemarExactP`（既存）、`simulateRun`・`greedyStrategy`（既存）

**⚠️ このテストは実行しない。** 環境変数を付けた実行は約9分かかり、ツールタイムアウトで
復帰不能になる（段階A で3回発生）。コントローラが背景実行で回す。
ここでは**書いて、環境変数なしで skip されることだけを確認する**。

- [ ] **Step 1: テストを書く**

```ts
/**
 * `G3` — 要求軸の監査（設計書 §8.2.15）
 *
 * **これは測定であって合否判定ではない。閾値の assert を置かない。**
 * 数値は判定票 §8.2.16 へ人が転記する。
 *
 * CI には常駐させない。実行するには:
 *   ASHEN_RAMPART_G3=1 npx jest axis-demand-gate
 *
 * **主要対比は5本**（`anti-air` が prov-t2-b / prov-t3-a、
 * `mass-answer` が prov-t1-b / prov-t2-a / prov-t3-b）。
 * `block` と `heavy-hit` は用量の処置なので**探索的**である（§8.2.15(c)）。
 */
import { PRESET_DECKS, getCardDefinition } from '../../domain/cards/card-pool';
import { createDeck } from '../../domain/cards/deck';
import { knockoutIdOf } from '../../domain/cards/knockout-cards';
import { createCombatState } from '../../domain/combat/combat-state';
import { greedyStrategy, simulateRun } from '../../domain/combat/run-simulation';
import { HIGH_GROUND_DAMAGE_MULT } from '../../domain/combat/step-tick';
import { holmAdjust } from '../../domain/shared/holm';
import { mcnemarExactP } from '../../domain/shared/mcnemar';
import { AUDIT_FULL_DECK, knockoutDeck } from '../../domain/expedition/axis-knockout';
import { PROVISIONAL_STAGES } from '../../domain/expedition/stage-pool';
import { DEMAND_AXES, axesOf, type DemandAxis } from '../../domain/expedition/stage-definition';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { StageMap } from '../../domain/board/stage-map';
import type { StageDefinition } from '../../domain/expedition/stage-definition';

/**
 * シード帯（設計書 §8.2.15(h)）
 *
 * 1〜250 は §8.2.10(d) が使用を禁じた既使用帯。1351〜1450 は確認帯として封じてある
 * （ステージを直したあとの再測定でのみ使う。最大2回）。
 */
const SEED_FROM = 1251;
const N = 100;

const isEnabled = process.env.ASHEN_RAMPART_G3 === '1';

/** 1シードぶんの勝敗 */
const winsBySeed = (stage: StageDefinition, cards: readonly string[]): boolean[] =>
  Array.from({ length: N }, (_unused, i) => {
    const random = createSeededRandom(SEED_FROM + i);
    const deck = createDeck(cards, () => random.random());
    return simulateRun(createCombatState(deck, stage.waves), greedyStrategy, stage.map).outcome === 'won';
  });

interface Cell {
  stageId: string;
  axis: DemandAxis;
  declared: boolean;
  baseWins: number;
  koWins: number;
  b: number;
  c: number;
  p: number;
  /** 測定不能の理由（§8.2.15(g)）。空なら測定可能 */
  unmeasurable: string;
}

/** そのデッキに貫通する札が含まれるか（含むと anti-air は測定不能） */
const hasPiercingCard = (cards: readonly string[]): boolean =>
  cards.some((id) => getCardDefinition(id).tower?.piercing === true);

/**
 * そのデッキ・そのマップで到達しうるダメージ倍率の集合
 *
 * `damageBreakdown` は `Math.round(damage * 高台 * (1 + オーラ))` を計算する。
 * オーラは隣接する篝火ごとに加算されるので、デッキに入っている枚数まで積み上がる。
 * **新しいオーラ札が段階B で増えたら、ここは部分和しか列挙しない近似になる**
 * （現行プールのオーラは篝火 0.25 の1種だけなので厳密）。
 */
const reachableMultipliers = (cards: readonly string[], map: StageMap): number[] => {
  const auraSums = [0];
  let running = 0;
  cards.forEach((id) => {
    const bonus = getCardDefinition(id).tower?.aura?.towerDamageBonus ?? 0;
    if (bonus <= 0) return;
    running += bonus;
    auraSums.push(running);
  });
  const highGrounds = (map.highGround ?? []).length > 0 ? [1, HIGH_GROUND_DAMAGE_MULT] : [1];
  return highGrounds.flatMap((hg) => auraSums.map((aura) => hg * (1 + aura)));
};

/**
 * `heavy-hit` の分割が、実効ダメージの丸めを通しても DPS を保つか（`B0-P3` の実効版）
 *
 * 素の `damage / cooldownTicks` が一致しても、`Math.round` を通すとずれる
 * （投石機・高台だけで +4.35%、火砲台・篝火で +6.7%。設計書 §8.2.15(a)6）。
 * 比較は整数の交差積で行う（浮動小数の近似一致は不可・`B0-P3`）。
 */
const heavyHitDpsPreserved = (cards: readonly string[], map: StageMap): boolean => {
  const multipliers = reachableMultipliers(cards, map);
  return cards.every((id) => {
    if (!axesOf(id).includes('heavy-hit')) return true;
    const base = getCardDefinition(id).tower;
    const ko = getCardDefinition(knockoutIdOf('heavy-hit', id)).tower;
    if (!base || !ko) return false;
    return multipliers.every(
      (m) =>
        Math.round(base.damage * m) * ko.cooldownTicks ===
        Math.round(ko.damage * m) * base.cooldownTicks
    );
  });
};

/** §8.2.15(g) の3規則を機械的に当てる */
const unmeasurableReason = (
  axis: DemandAxis,
  baseWins: number,
  cards: readonly string[],
  map: StageMap
): string => {
  if (axis === 'anti-air' && hasPiercingCard(cards)) {
    return '貫通が飛行を絞らない（§8.2.15(a)5）';
  }
  if (axis === 'heavy-hit' && !heavyHitDpsPreserved(cards, map)) {
    return '丸めで実効DPSがずれる（§8.2.15(a)6）';
  }
  if (baseWins / N < 0.4) return 'B0-P4 基準勝率 < 0.40';
  return '';
};

const measure = (stage: StageDefinition, cards: readonly string[]): Cell[] => {
  const base = winsBySeed(stage, cards);
  return DEMAND_AXES.map((axis) => {
    const ko = winsBySeed(stage, knockoutDeck(cards, axis));
    let b = 0;
    let c = 0;
    base.forEach((won, i) => {
      if (won && !ko[i]) b++;
      if (!won && ko[i]) c++;
    });
    const baseWins = base.filter(Boolean).length;
    return {
      stageId: stage.id,
      axis,
      declared: stage.demands.includes(axis),
      baseWins,
      koWins: ko.filter(Boolean).length,
      b,
      c,
      p: mcnemarExactP(b, c),
      unmeasurable: unmeasurableReason(axis, baseWins, cards, stage.map),
    };
  });
};

/** 主要対比か（宣言軸のうち anti-air と mass-answer のみ。§8.2.15(c)） */
const isPrimary = (cell: Cell): boolean =>
  cell.declared && (cell.axis === 'anti-air' || cell.axis === 'mass-answer');

const render = (cells: readonly Cell[], holmByCell: ReadonlyMap<Cell, number>): string =>
  cells
    .map((cell) => {
      const ratio = cell.baseWins === 0 ? NaN : cell.koWins / cell.baseWins;
      const holm = holmByCell.get(cell);
      return (
        `  ${cell.declared ? '★' : ' '}${cell.stageId.padEnd(10)} ${cell.axis.padEnd(12)}` +
        ` 基準 ${String(cell.baseWins).padStart(3)}/${N}` +
        ` ko ${String(cell.koWins).padStart(3)}/${N}` +
        ` 比 ${Number.isNaN(ratio) ? ' n/a ' : ratio.toFixed(3)}` +
        ` b=${String(cell.b).padStart(3)} c=${String(cell.c).padStart(3)}` +
        ` p=${cell.p.toExponential(3)}` +
        ` holm=${holm === undefined ? '     -' : holm.toFixed(5)}` +
        (cell.unmeasurable === '' ? '' : `  [測定不能: ${cell.unmeasurable}]`)
      );
    })
    .join('\n');

(isEnabled ? describe : describe.skip)('G3 要求軸の監査', () => {
  jest.setTimeout(1800000);

  it('主要デッキ（全軸充足12枚）', () => {
    const cells = PROVISIONAL_STAGES.flatMap((stage) => measure(stage, AUDIT_FULL_DECK));
    const primary = cells.filter(isPrimary);

    // **測定不能でも族から外さない**（§8.2.15(g)）。データを見てから族を変えないため
    const holmByCell = new Map<Cell, number>();
    holmAdjust(primary.map((cell) => cell.p)).forEach((adjusted, i) => {
      const cell = primary[i];
      if (cell) holmByCell.set(cell, adjusted);
    });

    const unmeasurable = primary.filter((cell) => cell.unmeasurable !== '');
    console.log(
      [
        `=== 主要デッキ（シード ${SEED_FROM}..${SEED_FROM + N - 1}）===`,
        `主要対比 ${primary.length} 本（Holm 補正あり・族サイズは固定）。それ以外は探索的（補正なし）`,
        `測定不能 ${unmeasurable.length} 本（§8.2.15(k): 2本以上なら評価不能）`,
        render(cells, holmByCell),
      ].join('\n')
    );

    // 構造的な検査のみ。合否の閾値は置かない（判定票へ転記する）
    expect(primary).toHaveLength(5);
  });

  it.each(Object.values(PRESET_DECKS).map((p) => [p.id, p.cards] as const))(
    '%s デッキ（探索的）',
    (presetId, cards) => {
      const cells = PROVISIONAL_STAGES.flatMap((stage) => measure(stage, cards));
      console.log(
        [`=== ${presetId}（探索的・補正なし）===`, render(cells, new Map<Cell, number>())].join('\n')
      );
      expect(cells.length).toBeGreaterThan(0);
    }
  );
});
```

- [ ] **Step 2: 環境変数なしで skip されることを確認する**

Run: `npx jest src/features/ashen-rampart/application/simulation/axis-demand-gate.manual.test.ts`
Expected: PASS（`3 skipped` のような表示。**測定は走らない**）

- [ ] **Step 3: 型チェックと lint、CI 全体**

Run: `npm run ci`
Expected: すべて緑

- [ ] **Step 4: コミット**

```bash
git add src/features/ashen-rampart/application/simulation/axis-demand-gate.manual.test.ts
git commit -m "test(ashen-rampart): G3（要求軸の監査）の測定を追加

- 主要対比は5本（anti-air 2 + mass-answer 3）。Holm 補正はこの5本だけに掛ける
- block と heavy-hit、非宣言軸、プリセット2種は探索的（補正なし）
- シード帯 1251..1350。1〜250 は §8.2.10(d) が禁じた既使用帯
- 閾値の assert は置かない。数値は判定票 §8.2.16 へ転記する
- CI 非常駐（ASHEN_RAMPART_G3=1 で有効化）"
```

---

## 実行後にコントローラがやること（計画の範囲外）

1. **測定の実行**（背景実行・約9分）: `ASHEN_RAMPART_G3=1 npx jest axis-demand-gate`
2. **判定票 §8.2.16 の記入**（§8.2.15(q) の全欄。空欄があれば判定不能）
3. **§8.3 の予算表に陰性対照の実測時間を追記**
4. **§8.2.15(k) の写像を適用**して次にやることを決める（`k = 0` なら §5.2 を反復7 へ差し戻す）

**ステップ6（ステージ側の修正）の中身は測定前に決めない。**
