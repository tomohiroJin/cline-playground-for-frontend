# 灰燼の城壁 ASHEN RAMPART — P1 基盤 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デッキ構築×タワーディフェンス「灰燼の城壁」の P1 基盤 — domain 全層＋ユースケース＋最小 UI で、1ステージ3ウェーブのミニランをプレースホルダ描画で1周遊べる状態にする。

**Architecture:** Clean Architecture の Feature モジュール `src/features/ashen-rampart/`。戦闘は `(盤面, ウェーブ定義, 修飾子) → tick列` の決定的シミュレーション純粋関数。乱数は domain には `RandomFn = () => number` を渡し、application の `RandomPort` で抽象化。UI は tick 列を setInterval で再生するだけの層。

**Tech Stack:** React 19 + styled-components + Jotai(P1 では useState で足りるため未使用可) / Jest 30 + RTL / TypeScript strict

**Spec:** `docs/superpowers/specs/2026-07-16-ashen-rampart-design.md`

## Global Constraints

- `any` 型禁止（`unknown` + 型ガード）。`dangerouslySetInnerHTML` 禁止
- `domain/` は外部依存なし（React/application/infrastructure を import しない）
- 他 Feature モジュール（`features/ashen-rampart/` 以外の features）への import 禁止
- テストは対象と同じディレクトリに `*.test.ts(x)` で配置（コロケーション）
- コメント・テスト記述は日本語。変数名・関数名は英語
- コミットメッセージは Conventional Commits（`feat:` 等）＋日本語
- カバレッジ目標: domain 90%+、application 80%+
- テスト実行: `npm test -- <path>`（単体）、最終確認は `npm run ci`
- 作業ブランチ: `feature/ashen-rampart-p1`（main 直コミット禁止）

## P1 のスコープ境界（スペックの4フェーズ分割に基づく）

- **P1 でやる**: カード8種・敵3種・マップ1面（平原）・3ウェーブ・報酬選択・勝敗とスコア・プレースホルダUI（絵文字と色付き div）
- **P1 でやらない**: ステージ2/3・分岐選択・ボス・飛行敵・聖光の尖塔・Canvas エフェクト層・記録保存(StoragePort)・カードのドラッグ操作・SE

## ファイル構成マップ

```
src/features/ashen-rampart/
├── domain/
│   ├── shared/random.ts                 # RandomFn 型
│   ├── cards/card-definition.ts         # カード型定義
│   ├── cards/card-pool.ts               # カードデータ・初期デッキ・報酬プール
│   ├── cards/deck.ts                    # シャッフル・ドロー・捨札
│   ├── board/stage-map.ts               # マップ型 + 平原マップデータ
│   ├── board/board-state.ts             # 盤面状態・設置検証
│   ├── combat/enemies.ts                # 敵定義3種
│   ├── combat/waves.ts                  # 平原3ウェーブ定義
│   ├── combat/simulate-wave.ts          # 決定的戦闘シミュレーション（最重要）
│   └── run/run-state.ts                 # ラン状態型・定数
│   └── run/reward.ts                    # 報酬候補生成
├── application/
│   ├── ports/random-port.ts             # RandomPort
│   └── use-cases/start-run.ts
│   └── use-cases/play-card.ts
│   └── use-cases/start-wave.ts          # startWave + finishWave
│   └── use-cases/choose-reward.ts
├── infrastructure/random/seeded-random.ts  # mulberry32 + DefaultRandom
├── presentation/
│   ├── useAshenRampartGame.ts           # ゲームフック（状態＋リプレイ進行）
│   ├── AshenRampartGame.tsx             # メインコンテナ
│   ├── BoardGrid.tsx                    # 盤面グリッド＋敵オーバーレイ
│   ├── HandArea.tsx                     # 手札
│   ├── StatusBar.tsx                    # ライフ/マナ/ウェーブ/スコア
│   ├── RewardPanel.tsx                  # 報酬選択
│   └── ResultPanel.tsx                  # リザルト
└── index.ts                             # AshenRampartGame をエクスポート
src/pages/AshenRampartPage.tsx
src/App.tsx（ルート追加）
src/pages/GameListPage.tsx（一覧エントリ追加）
```

---

### Task 0: ブランチ作成

- [ ] **Step 1: 作業ブランチを切る**

```bash
git checkout main && git pull
git checkout -b feature/ashen-rampart-p1
```

---

### Task 1: RandomFn / RandomPort / SeededRandom

**Files:**
- Create: `src/features/ashen-rampart/domain/shared/random.ts`
- Create: `src/features/ashen-rampart/application/ports/random-port.ts`
- Create: `src/features/ashen-rampart/infrastructure/random/seeded-random.ts`
- Test: `src/features/ashen-rampart/infrastructure/random/seeded-random.test.ts`

**Interfaces:**
- Produces: `RandomFn = () => number`（domain 用）、`RandomPort { random(): number }`（application 用）、`SeededRandom implements RandomPort`（seed 指定で決定的）、`DefaultRandom implements RandomPort`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/infrastructure/random/seeded-random.test.ts
import { SeededRandom } from './seeded-random';

describe('SeededRandom', () => {
  it('同じシードから同じ乱数列を生成する', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = [a.random(), a.random(), a.random()];
    const seqB = [b.random(), b.random(), b.random()];
    expect(seqA).toEqual(seqB);
  });

  it('異なるシードからは異なる乱数列を生成する', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    expect(a.random()).not.toBe(b.random());
  });

  it('0以上1未満の値を返す', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rng.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/infrastructure/random/seeded-random.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/shared/random.ts
/**
 * 灰燼の城壁 - 乱数関数型
 *
 * domain 層は application/ports に依存できないため、
 * 乱数は「0以上1未満を返す関数」としてのみ受け取る。
 */
export type RandomFn = () => number;
```

```ts
// src/features/ashen-rampart/application/ports/random-port.ts
/**
 * 灰燼の城壁 - RandomPort（乱数ソースポート）
 *
 * 本番: DefaultRandom（Math.random ラッパー）
 * テスト/シード固定: SeededRandom
 */
export interface RandomPort {
  /** 0 以上 1 未満の乱数を返す */
  random(): number;
}
```

```ts
// src/features/ashen-rampart/infrastructure/random/seeded-random.ts
/**
 * 灰燼の城壁 - シード付き乱数実装（mulberry32）
 */
import type { RandomPort } from '../../application/ports/random-port';

/** シード指定で決定的な乱数列を生成する */
export class SeededRandom implements RandomPort {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  random(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** 本番用の Math.random ラッパー */
export class DefaultRandom implements RandomPort {
  random(): number {
    return Math.random();
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/infrastructure/random/seeded-random.test.ts`
Expected: PASS（3件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat: 灰燼の城壁 乱数ポートとシード付き乱数を追加"
```

---

### Task 2: カード定義とカードプール

**Files:**
- Create: `src/features/ashen-rampart/domain/cards/card-definition.ts`
- Create: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Test: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`

**Interfaces:**
- Produces:
  - `CardType = 'tower' | 'trap' | 'spell' | 'tactic'`、`Rarity = 'common' | 'rare' | 'epic'`
  - `TowerSpec { range: number; damage: number; cooldownTicks: number; splashRadius: number }`
  - `TrapSpec { damage: number; uses: number }`
  - `SpellSpec { openingDamage?: number; speedMultiplier?: number; gainMana?: number }`
  - `TacticSpec { towerAttackBonus?: number }`
  - `CardDefinition { id; name; type; cost; rarity; description; tower?; trap?; spell?; tactic? }`
  - `getCardDefinition(id: string): CardDefinition`（未知 id は throw）
  - `INITIAL_DECK: string[]`（10枚）、`REWARD_POOL: string[]`（6種）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/cards/card-pool.test.ts
import { getCardDefinition, INITIAL_DECK, REWARD_POOL } from './card-pool';

describe('card-pool', () => {
  it('初期デッキは10枚（タワー6・スペル3・罠1）', () => {
    expect(INITIAL_DECK).toHaveLength(10);
    const types = INITIAL_DECK.map((id) => getCardDefinition(id).type);
    expect(types.filter((t) => t === 'tower')).toHaveLength(6);
    expect(types.filter((t) => t === 'spell')).toHaveLength(3);
    expect(types.filter((t) => t === 'trap')).toHaveLength(1);
  });

  it('報酬プールの全カードが定義済みでコストが1以上', () => {
    expect(REWARD_POOL.length).toBeGreaterThanOrEqual(6);
    for (const id of REWARD_POOL) {
      const card = getCardDefinition(id);
      expect(card.cost).toBeGreaterThanOrEqual(1);
    }
  });

  it('タワーカードは tower スペックを持つ', () => {
    const arrow = getCardDefinition('arrow-tower');
    expect(arrow.type).toBe('tower');
    expect(arrow.tower).toBeDefined();
    expect(arrow.tower?.range).toBeGreaterThan(0);
  });

  it('未知のカードIDは例外を投げる', () => {
    expect(() => getCardDefinition('unknown-card')).toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/cards/card-definition.ts
/**
 * 灰燼の城壁 - カード型定義
 *
 * カードはデータ駆動: 効果は少数のスペック（tower/trap/spell/tactic）の
 * 組み合わせで表現し、カード追加＝データ追加にする。
 */
export type CardType = 'tower' | 'trap' | 'spell' | 'tactic';
export type Rarity = 'common' | 'rare' | 'epic';

/** タワー性能 */
export interface TowerSpec {
  /** 射程（セル距離・ユークリッド） */
  range: number;
  /** 1発のダメージ */
  damage: number;
  /** 攻撃間隔（tick） */
  cooldownTicks: number;
  /** 範囲ダメージ半径（0 = 単体攻撃） */
  splashRadius: number;
}

/** 罠性能（経路マスに設置、踏んだ敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
}

/** スペル効果（準備フェーズで使用、即時 or 次ウェーブに作用） */
export interface SpellSpec {
  /** 次ウェーブの敵のスポーン時ダメージ */
  openingDamage?: number;
  /** 次ウェーブの敵速度倍率（0.6 = 40%減速） */
  speedMultiplier?: number;
  /** 即時マナ獲得 */
  gainMana?: number;
}

/** 戦術効果（永続的なルール変更） */
export interface TacticSpec {
  /** 全タワー攻撃倍率への加算（0.15 = +15%） */
  towerAttackBonus?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  rarity: Rarity;
  description: string;
  tower?: TowerSpec;
  trap?: TrapSpec;
  spell?: SpellSpec;
  tactic?: TacticSpec;
}
```

```ts
// src/features/ashen-rampart/domain/cards/card-pool.ts
/**
 * 灰燼の城壁 - P1 カードプール（8種）
 */
import type { CardDefinition } from './card-definition';

const CARDS: readonly CardDefinition[] = [
  {
    id: 'arrow-tower',
    name: '弓兵の塔',
    type: 'tower',
    cost: 2,
    rarity: 'common',
    description: '単体を速射する基本タワー。',
    tower: { range: 2.5, damage: 6, cooldownTicks: 8, splashRadius: 0 },
  },
  {
    id: 'cannon-tower',
    name: '火砲台',
    type: 'tower',
    cost: 3,
    rarity: 'rare',
    description: '着弾点の周囲にもダメージを与える重砲。攻撃間隔は長い。',
    tower: { range: 2, damage: 12, cooldownTicks: 18, splashRadius: 1 },
  },
  {
    id: 'spike-trap',
    name: '棘罠',
    type: 'trap',
    cost: 1,
    rarity: 'common',
    description: '経路に仕掛ける棘。3体まで傷つける。',
    trap: { damage: 5, uses: 3 },
  },
  {
    id: 'pitfall',
    name: '落とし穴',
    type: 'trap',
    cost: 2,
    rarity: 'rare',
    description: '最初に踏んだ敵を確実に葬る一発罠。',
    trap: { damage: 999, uses: 1 },
  },
  {
    id: 'fire-blast',
    name: '業火',
    type: 'spell',
    cost: 2,
    rarity: 'common',
    description: '次のウェーブの敵全員に、現れた瞬間8ダメージ。',
    spell: { openingDamage: 8 },
  },
  {
    id: 'mud-time',
    name: '時泥',
    type: 'spell',
    cost: 2,
    rarity: 'rare',
    description: '次のウェーブの敵全員の足を 40% 遅くする。',
    spell: { speedMultiplier: 0.6 },
  },
  {
    id: 'supply',
    name: '補給',
    type: 'spell',
    cost: 1,
    rarity: 'common',
    description: 'ただちにマナを2得る。',
    spell: { gainMana: 2 },
  },
  {
    id: 'smith-blessing',
    name: '鍛冶の加護',
    type: 'tactic',
    cost: 2,
    rarity: 'rare',
    description: 'このステージの間、全タワーの攻撃力 +15%。',
    tactic: { towerAttackBonus: 0.15 },
  },
];

const CARD_MAP: ReadonlyMap<string, CardDefinition> = new Map(
  CARDS.map((c) => [c.id, c])
);

/** カード定義を取得する。未知の id は契約違反として例外 */
export const getCardDefinition = (id: string): CardDefinition => {
  const card = CARD_MAP.get(id);
  if (!card) {
    throw new Error(`未知のカードIDです: ${id}`);
  }
  return card;
};

/** 初期デッキ10枚: 基本タワー×6、基本スペル×3、罠×1 */
export const INITIAL_DECK: readonly string[] = [
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'fire-blast',
  'fire-blast',
  'supply',
  'spike-trap',
];

/** ウェーブクリア報酬の抽選プール */
export const REWARD_POOL: readonly string[] = [
  'cannon-tower',
  'pitfall',
  'mud-time',
  'smith-blessing',
  'arrow-tower',
  'fire-blast',
];
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: PASS（4件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards
git commit -m "feat: 灰燼の城壁 カード定義とP1カードプール8種を追加"
```

---

### Task 3: デッキ操作（シャッフル・ドロー・捨札）

**Files:**
- Create: `src/features/ashen-rampart/domain/cards/deck.ts`
- Test: `src/features/ashen-rampart/domain/cards/deck.test.ts`

**Interfaces:**
- Consumes: `RandomFn`（Task 1）
- Produces:
  - `DeckState { drawPile: string[]; hand: string[]; discardPile: string[] }`
  - `HAND_SIZE = 5`
  - `shuffle(cards: readonly string[], random: RandomFn): string[]`
  - `drawHand(deck: DeckState, random: RandomFn): DeckState` — 現在の手札を捨札に送ってから5枚引く。山札不足時は捨札をシャッフルして補充。全体が5枚未満なら引けるだけ引く

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/cards/deck.test.ts
import { shuffle, drawHand, HAND_SIZE, DeckState } from './deck';
import { SeededRandom } from '../../infrastructure/random/seeded-random';

const makeRandom = (seed: number) => {
  const rng = new SeededRandom(seed);
  return () => rng.random();
};

describe('shuffle', () => {
  it('同じシードなら同じ並びになる（決定性）', () => {
    const cards = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(cards, makeRandom(1))).toEqual(shuffle(cards, makeRandom(1)));
  });

  it('要素の集合は変わらない', () => {
    const cards = ['a', 'b', 'c', 'd', 'e'];
    expect([...shuffle(cards, makeRandom(9))].sort()).toEqual([...cards].sort());
  });

  it('元の配列を破壊しない', () => {
    const cards = ['a', 'b', 'c'];
    shuffle(cards, makeRandom(1));
    expect(cards).toEqual(['a', 'b', 'c']);
  });
});

describe('drawHand', () => {
  it('山札から5枚引く', () => {
    const deck: DeckState = {
      drawPile: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      hand: [],
      discardPile: [],
    };
    const next = drawHand(deck, makeRandom(1));
    expect(next.hand).toHaveLength(HAND_SIZE);
    expect(next.drawPile).toHaveLength(2);
  });

  it('現在の手札は捨札に送られる', () => {
    const deck: DeckState = {
      drawPile: ['a', 'b', 'c', 'd', 'e'],
      hand: ['x', 'y'],
      discardPile: [],
    };
    const next = drawHand(deck, makeRandom(1));
    expect(next.discardPile).toEqual(expect.arrayContaining(['x', 'y']));
  });

  it('山札不足時は捨札をシャッフルして補充する', () => {
    const deck: DeckState = {
      drawPile: ['a', 'b'],
      hand: [],
      discardPile: ['c', 'd', 'e', 'f'],
    };
    const next = drawHand(deck, makeRandom(1));
    expect(next.hand).toHaveLength(HAND_SIZE);
    expect(next.discardPile).toHaveLength(0);
    expect(next.drawPile).toHaveLength(1);
  });

  it('全カードが5枚未満なら引けるだけ引く', () => {
    const deck: DeckState = { drawPile: ['a', 'b'], hand: [], discardPile: ['c'] };
    const next = drawHand(deck, makeRandom(1));
    expect(next.hand).toHaveLength(3);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/cards/deck.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/cards/deck.ts
/**
 * 灰燼の城壁 - デッキ操作（純粋関数）
 */
import type { RandomFn } from '../shared/random';

export interface DeckState {
  drawPile: string[];
  hand: string[];
  discardPile: string[];
}

export const HAND_SIZE = 5;

/** Fisher-Yates シャッフル（非破壊） */
export const shuffle = (cards: readonly string[], random: RandomFn): string[] => {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 手札を引き直す。
 * 現在の手札を捨札に送り、山札から5枚引く。
 * 山札が尽きたら捨札をシャッフルして山札に戻す。
 */
export const drawHand = (deck: DeckState, random: RandomFn): DeckState => {
  let drawPile = [...deck.drawPile];
  let discardPile = [...deck.discardPile, ...deck.hand];
  const hand: string[] = [];
  while (hand.length < HAND_SIZE) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile, random);
      discardPile = [];
    }
    const card = drawPile.shift();
    if (card === undefined) break;
    hand.push(card);
  }
  return { drawPile, hand, discardPile };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/cards/deck.test.ts`
Expected: PASS（7件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards
git commit -m "feat: 灰燼の城壁 デッキ操作（シャッフル・ドロー・捨札循環）を追加"
```

---

### Task 4: ステージマップと盤面状態

**Files:**
- Create: `src/features/ashen-rampart/domain/board/stage-map.ts`
- Create: `src/features/ashen-rampart/domain/board/board-state.ts`
- Test: `src/features/ashen-rampart/domain/board/board-state.test.ts`

**Interfaces:**
- Consumes: `getCardDefinition`（Task 2）
- Produces:
  - `CellPos { x: number; y: number }`
  - `StageMap { id; name; width; height; path: CellPos[]; buildSlots: CellPos[] }`、`PLAINS_MAP: StageMap`
  - `PlacedTower { cardId: string; pos: CellPos }`、`PlacedTrap { cardId: string; pos: CellPos; usesLeft: number }`
  - `BoardState { map: StageMap; towers: PlacedTower[]; traps: PlacedTrap[]; towerAttackMultiplier: number }`
  - `createBoard(map: StageMap): BoardState`
  - `canPlaceTower(board, pos): boolean` / `canPlaceTrap(board, pos): boolean`
  - `placeTower(board, cardId, pos): BoardState` / `placeTrap(board, cardId, pos): BoardState`（不正配置は throw）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/board/board-state.test.ts
import { PLAINS_MAP } from './stage-map';
import {
  createBoard,
  canPlaceTower,
  canPlaceTrap,
  placeTower,
  placeTrap,
} from './board-state';

describe('PLAINS_MAP', () => {
  it('経路は連結している（隣接セル同士）', () => {
    for (let i = 1; i < PLAINS_MAP.path.length; i++) {
      const a = PLAINS_MAP.path[i - 1];
      const b = PLAINS_MAP.path[i];
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      expect(dist).toBe(1);
    }
  });

  it('設置マスは経路と重ならない', () => {
    for (const slot of PLAINS_MAP.buildSlots) {
      const onPath = PLAINS_MAP.path.some((p) => p.x === slot.x && p.y === slot.y);
      expect(onPath).toBe(false);
    }
  });
});

describe('board-state', () => {
  const board = createBoard(PLAINS_MAP);
  const slot = PLAINS_MAP.buildSlots[0];
  const pathCell = PLAINS_MAP.path[3];

  it('設置マスにはタワーを置ける', () => {
    expect(canPlaceTower(board, slot)).toBe(true);
    const next = placeTower(board, 'arrow-tower', slot);
    expect(next.towers).toHaveLength(1);
  });

  it('同じマスに二重にタワーは置けない', () => {
    const next = placeTower(board, 'arrow-tower', slot);
    expect(canPlaceTower(next, slot)).toBe(false);
    expect(() => placeTower(next, 'arrow-tower', slot)).toThrow();
  });

  it('経路マスにはタワーを置けない', () => {
    expect(canPlaceTower(board, pathCell)).toBe(false);
  });

  it('罠は経路マスにのみ置ける（usesLeft はカード定義から）', () => {
    expect(canPlaceTrap(board, pathCell)).toBe(true);
    expect(canPlaceTrap(board, slot)).toBe(false);
    const next = placeTrap(board, 'spike-trap', pathCell);
    expect(next.traps[0].usesLeft).toBe(3);
  });

  it('同じ経路マスに二重に罠は置けない', () => {
    const next = placeTrap(board, 'spike-trap', pathCell);
    expect(() => placeTrap(next, 'pitfall', pathCell)).toThrow();
  });

  it('元の盤面は変更されない（イミュータブル）', () => {
    placeTower(board, 'arrow-tower', slot);
    expect(board.towers).toHaveLength(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/board/board-state.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/board/stage-map.ts
/**
 * 灰燼の城壁 - ステージマップ定義
 *
 * path: 敵の進軍経路（入口→砦の順、隣接セルの連結列）
 * buildSlots: タワー設置可能マス（経路とは重ならない）
 */
export interface CellPos {
  x: number;
  y: number;
}

export interface StageMap {
  id: string;
  name: string;
  width: number;
  height: number;
  path: CellPos[];
  buildSlots: CellPos[];
}

/** P1 ステージ: 平原（9×7、S字経路） */
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: 9,
  height: 7,
  path: [
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 4, y: 2 },
    { x: 4, y: 1 },
    { x: 5, y: 1 },
    { x: 6, y: 1 },
    { x: 7, y: 1 },
    { x: 8, y: 1 },
  ],
  buildSlots: [
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 5, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 2 },
    { x: 5, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
  ],
};
```

```ts
// src/features/ashen-rampart/domain/board/board-state.ts
/**
 * 灰燼の城壁 - 盤面状態（イミュータブル）
 */
import { getCardDefinition } from '../cards/card-pool';
import type { CellPos, StageMap } from './stage-map';

export interface PlacedTower {
  cardId: string;
  pos: CellPos;
}

export interface PlacedTrap {
  cardId: string;
  pos: CellPos;
  usesLeft: number;
}

export interface BoardState {
  map: StageMap;
  towers: PlacedTower[];
  traps: PlacedTrap[];
  /** 戦術カードによる全タワー攻撃倍率（初期値 1.0） */
  towerAttackMultiplier: number;
}

export const createBoard = (map: StageMap): BoardState => ({
  map,
  towers: [],
  traps: [],
  towerAttackMultiplier: 1,
});

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** 設置マスかつ空きならタワーを置ける */
export const canPlaceTower = (board: BoardState, pos: CellPos): boolean => {
  const isSlot = board.map.buildSlots.some((s) => samePos(s, pos));
  const occupied = board.towers.some((t) => samePos(t.pos, pos));
  return isSlot && !occupied;
};

/** 経路マスかつ罠未設置なら罠を置ける */
export const canPlaceTrap = (board: BoardState, pos: CellPos): boolean => {
  const isPath = board.map.path.some((p) => samePos(p, pos));
  const occupied = board.traps.some((t) => samePos(t.pos, pos));
  return isPath && !occupied;
};

export const placeTower = (
  board: BoardState,
  cardId: string,
  pos: CellPos
): BoardState => {
  if (!canPlaceTower(board, pos)) {
    throw new Error(`タワーを設置できないマスです: (${pos.x}, ${pos.y})`);
  }
  return { ...board, towers: [...board.towers, { cardId, pos }] };
};

export const placeTrap = (
  board: BoardState,
  cardId: string,
  pos: CellPos
): BoardState => {
  if (!canPlaceTrap(board, pos)) {
    throw new Error(`罠を設置できないマスです: (${pos.x}, ${pos.y})`);
  }
  const trapSpec = getCardDefinition(cardId).trap;
  if (!trapSpec) {
    throw new Error(`罠カードではありません: ${cardId}`);
  }
  return {
    ...board,
    traps: [...board.traps, { cardId, pos, usesLeft: trapSpec.uses }],
  };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/board/board-state.test.ts`
Expected: PASS（8件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/board
git commit -m "feat: 灰燼の城壁 平原マップと盤面状態・設置検証を追加"
```

---

### Task 5: 敵定義とウェーブ定義

**Files:**
- Create: `src/features/ashen-rampart/domain/combat/enemies.ts`
- Create: `src/features/ashen-rampart/domain/combat/waves.ts`
- Test: `src/features/ashen-rampart/domain/combat/waves.test.ts`

**Interfaces:**
- Produces:
  - `EnemySpec { id: string; name: string; hp: number; speed: number; reward: number }`（speed は「経路セル/tick」）
  - `getEnemySpec(id: string): EnemySpec`（未知 id は throw）
  - `WaveEntry { enemyId: string; count: number; spawnIntervalTicks: number }`
  - `WaveDefinition { entries: WaveEntry[] }`
  - `PLAINS_WAVES: WaveDefinition[]`（3ウェーブ）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/waves.test.ts
import { getEnemySpec } from './enemies';
import { PLAINS_WAVES } from './waves';

describe('enemies', () => {
  it('雑兵・俊足・重装の3種が定義されている', () => {
    expect(getEnemySpec('grunt').name).toBe('雑兵');
    expect(getEnemySpec('runner').speed).toBeGreaterThan(getEnemySpec('grunt').speed);
    expect(getEnemySpec('brute').hp).toBeGreaterThan(getEnemySpec('grunt').hp);
  });

  it('未知の敵IDは例外を投げる', () => {
    expect(() => getEnemySpec('dragon')).toThrow();
  });
});

describe('PLAINS_WAVES', () => {
  it('3ウェーブ定義され、全エントリの敵IDが解決できる', () => {
    expect(PLAINS_WAVES).toHaveLength(3);
    for (const wave of PLAINS_WAVES) {
      for (const entry of wave.entries) {
        expect(() => getEnemySpec(entry.enemyId)).not.toThrow();
        expect(entry.count).toBeGreaterThan(0);
        expect(entry.spawnIntervalTicks).toBeGreaterThan(0);
      }
    }
  });

  it('後のウェーブほど総HP量が増える（難易度曲線）', () => {
    const totalHp = (waveIndex: number) =>
      PLAINS_WAVES[waveIndex].entries.reduce(
        (sum, e) => sum + getEnemySpec(e.enemyId).hp * e.count,
        0
      );
    expect(totalHp(1)).toBeGreaterThan(totalHp(0));
    expect(totalHp(2)).toBeGreaterThan(totalHp(1));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/waves.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/combat/enemies.ts
/**
 * 灰燼の城壁 - 敵定義（P1: 地上3種）
 */
export interface EnemySpec {
  id: string;
  name: string;
  hp: number;
  /** 移動速度（経路セル/tick） */
  speed: number;
  /** 撃破時のスコア報酬 */
  reward: number;
}

const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, reward: 10 },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, reward: 12 },
  { id: 'brute', name: '重装', hp: 60, speed: 0.06, reward: 20 },
];

const ENEMY_MAP: ReadonlyMap<string, EnemySpec> = new Map(
  ENEMIES.map((e) => [e.id, e])
);

export const getEnemySpec = (id: string): EnemySpec => {
  const spec = ENEMY_MAP.get(id);
  if (!spec) {
    throw new Error(`未知の敵IDです: ${id}`);
  }
  return spec;
};
```

```ts
// src/features/ashen-rampart/domain/combat/waves.ts
/**
 * 灰燼の城壁 - 平原ステージのウェーブ定義（事前定義・乱数なし）
 *
 * ウェーブ構成を固定にすることで「盤面の答え合わせが運で崩れない」
 * ことを保証する（設計書の方針）。
 */
export interface WaveEntry {
  enemyId: string;
  count: number;
  /** 同一エントリ内のスポーン間隔（tick） */
  spawnIntervalTicks: number;
}

export interface WaveDefinition {
  entries: WaveEntry[];
}

export const PLAINS_WAVES: WaveDefinition[] = [
  // ウェーブ1: 雑兵の小隊
  { entries: [{ enemyId: 'grunt', count: 6, spawnIntervalTicks: 12 }] },
  // ウェーブ2: 雑兵＋俊足の混成
  {
    entries: [
      { enemyId: 'grunt', count: 6, spawnIntervalTicks: 10 },
      { enemyId: 'runner', count: 4, spawnIntervalTicks: 8 },
    ],
  },
  // ウェーブ3: 雑兵の大隊＋重装
  {
    entries: [
      { enemyId: 'grunt', count: 8, spawnIntervalTicks: 8 },
      { enemyId: 'brute', count: 2, spawnIntervalTicks: 20 },
    ],
  },
];
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/waves.test.ts`
Expected: PASS（4件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat
git commit -m "feat: 灰燼の城壁 敵3種と平原3ウェーブ定義を追加"
```

---

### Task 6: 戦闘シミュレーション（最重要タスク）

**Files:**
- Create: `src/features/ashen-rampart/domain/combat/simulate-wave.ts`
- Test: `src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`

**Interfaces:**
- Consumes: `BoardState`/`PlacedTower`/`PlacedTrap`（Task 4）、`getCardDefinition`（Task 2）、`getEnemySpec`/`WaveDefinition`（Task 5）
- Produces:
  - `WaveModifiers { openingDamage: number; speedMultiplier: number }`、`NO_MODIFIERS: WaveModifiers`
  - `EnemySnapshot { index: number; enemyId: string; hp: number; maxHp: number; x: number; y: number }`
  - `TickEvent =` `{ kind: 'shot'; towerIndex; targetIndex }` `| { kind: 'trap'; trapIndex; targetIndex }` `| { kind: 'defeat'; enemyIndex }` `| { kind: 'leak'; enemyIndex }`
  - `CombatTick { tick: number; enemies: EnemySnapshot[]; events: TickEvent[] }`
  - `CombatResult { ticks: CombatTick[]; defeated: number; leaked: number; rewardScore: number; trapUsesLeft: number[] }`
  - `simulateWave(board: BoardState, wave: WaveDefinition, modifiers?: WaveModifiers): CombatResult` — 完全決定的（乱数なし）

**仕様詳細（実装者向け）:**
- tick ループ順序: ①スポーン（openingDamage 適用）→ ②移動・漏れ判定 → ③罠発動 → ④タワー攻撃 → ⑤スナップショット
- 敵の位置は経路上の進行度 `progress`（float）。描画座標は `path[floor]` と `path[floor+1]` の線形補間
- 漏れ: `progress >= path.length - 1` に到達
- 罠: 敵の現在セル（`path[floor(progress)]`）が罠マスと一致で発動。同じ罠は同じ敵に1回のみ。uses を1消費
- タワー: cooldown 0 のとき、射程内（ユークリッド距離）で **progress 最大** の敵を狙う。ダメージ = `Math.round(damage × towerAttackMultiplier)`。`splashRadius > 0` ならターゲット位置から splashRadius 以内の敵全員に同ダメージ
- 終了: 未スポーン敵も生存敵もいなくなったら終了。安全弁 `MAX_TICKS = 2000`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/simulate-wave.test.ts
import { PLAINS_MAP } from '../board/stage-map';
import { createBoard, placeTower, placeTrap } from '../board/board-state';
import { simulateWave, NO_MODIFIERS } from './simulate-wave';
import type { WaveDefinition } from './waves';

const SMALL_WAVE: WaveDefinition = {
  entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 10 }],
};

describe('simulateWave', () => {
  it('タワーなしなら全敵が漏れる', () => {
    const board = createBoard(PLAINS_MAP);
    const result = simulateWave(board, SMALL_WAVE);
    expect(result.leaked).toBe(3);
    expect(result.defeated).toBe(0);
    expect(result.ticks.length).toBeGreaterThan(0);
  });

  it('同一入力からは同一の結果になる（決定性）', () => {
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'arrow-tower',
      PLAINS_MAP.buildSlots[0]
    );
    const a = simulateWave(board, SMALL_WAVE);
    const b = simulateWave(board, SMALL_WAVE);
    expect(a).toEqual(b);
  });

  it('タワーを並べれば敵を撃破しスコア報酬を得る', () => {
    let board = createBoard(PLAINS_MAP);
    // 経路沿いの設置マス全部に弓兵の塔を建てる（過剰火力）
    for (const slot of PLAINS_MAP.buildSlots) {
      board = placeTower(board, 'arrow-tower', slot);
    }
    const result = simulateWave(board, SMALL_WAVE);
    expect(result.defeated).toBe(3);
    expect(result.leaked).toBe(0);
    // 雑兵の reward は 10
    expect(result.rewardScore).toBe(30);
    // 撃破イベントが3回記録されている
    const defeats = result.ticks.flatMap((t) =>
      t.events.filter((e) => e.kind === 'defeat')
    );
    expect(defeats).toHaveLength(3);
  });

  it('openingDamage が敵HP以上ならスポーン時に全滅する', () => {
    const board = createBoard(PLAINS_MAP);
    const result = simulateWave(board, SMALL_WAVE, {
      openingDamage: 999,
      speedMultiplier: 1,
    });
    expect(result.defeated).toBe(3);
    expect(result.leaked).toBe(0);
  });

  it('speedMultiplier で減速すると突破に時間がかかる', () => {
    const board = createBoard(PLAINS_MAP);
    const normal = simulateWave(board, SMALL_WAVE, NO_MODIFIERS);
    const slowed = simulateWave(board, SMALL_WAVE, {
      openingDamage: 0,
      speedMultiplier: 0.5,
    });
    expect(slowed.ticks.length).toBeGreaterThan(normal.ticks.length);
  });

  it('落とし穴は最初に踏んだ敵を倒し使用回数を消費する', () => {
    const board = placeTrap(createBoard(PLAINS_MAP), 'pitfall', PLAINS_MAP.path[5]);
    const result = simulateWave(board, SMALL_WAVE);
    expect(result.defeated).toBe(1);
    expect(result.leaked).toBe(2);
    expect(result.trapUsesLeft).toEqual([0]);
  });

  it('敵スナップショットの座標は経路の範囲内にある', () => {
    const board = createBoard(PLAINS_MAP);
    const result = simulateWave(board, SMALL_WAVE);
    for (const tick of result.ticks) {
      for (const enemy of tick.enemies) {
        expect(enemy.x).toBeGreaterThanOrEqual(0);
        expect(enemy.x).toBeLessThan(PLAINS_MAP.width);
        expect(enemy.y).toBeGreaterThanOrEqual(0);
        expect(enemy.y).toBeLessThan(PLAINS_MAP.height);
      }
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/combat/simulate-wave.ts
/**
 * 灰燼の城壁 - 戦闘シミュレーション（決定的・純粋関数）
 *
 * (盤面, ウェーブ定義, 修飾子) → tick列 を返す。乱数を使わないため
 * 同一入力からは常に同一結果。UI はこの tick 列を再生するだけで、
 * ゲームロジックを一切持たない。
 */
import type { BoardState } from '../board/board-state';
import type { CellPos } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';
import { getEnemySpec, type EnemySpec } from './enemies';
import type { WaveDefinition } from './waves';

/** スペルによる次ウェーブへの修飾 */
export interface WaveModifiers {
  /** スポーン時に全敵へ与えるダメージ */
  openingDamage: number;
  /** 敵速度の倍率 */
  speedMultiplier: number;
}

export const NO_MODIFIERS: WaveModifiers = {
  openingDamage: 0,
  speedMultiplier: 1,
};

export interface EnemySnapshot {
  index: number;
  enemyId: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
}

export type TickEvent =
  | { kind: 'shot'; towerIndex: number; targetIndex: number }
  | { kind: 'trap'; trapIndex: number; targetIndex: number }
  | { kind: 'defeat'; enemyIndex: number }
  | { kind: 'leak'; enemyIndex: number };

export interface CombatTick {
  tick: number;
  enemies: EnemySnapshot[];
  events: TickEvent[];
}

export interface CombatResult {
  ticks: CombatTick[];
  defeated: number;
  leaked: number;
  /** 撃破報酬の合計スコア */
  rewardScore: number;
  /** 盤面の罠ごとの残使用回数（インデックスは board.traps と対応） */
  trapUsesLeft: number[];
}

/** 無限ループ防止の安全弁 */
export const MAX_TICKS = 2000;

interface RuntimeEnemy {
  index: number;
  spec: EnemySpec;
  hp: number;
  progress: number;
  spawnTick: number;
  alive: boolean;
  leaked: boolean;
  hitTraps: Set<number>;
}

/** 進行度から補間済み描画座標を求める */
const positionOf = (progress: number, path: CellPos[]): { x: number; y: number } => {
  const i = Math.min(Math.floor(progress), path.length - 2);
  const frac = Math.min(progress - i, 1);
  const a = path[i];
  const b = path[i + 1];
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
};

export const simulateWave = (
  board: BoardState,
  wave: WaveDefinition,
  modifiers: WaveModifiers = NO_MODIFIERS
): CombatResult => {
  const path = board.map.path;

  // スポーン計画: エントリ順に間隔を空けて出現
  const enemies: RuntimeEnemy[] = [];
  let spawnOffset = 0;
  for (const entry of wave.entries) {
    const spec = getEnemySpec(entry.enemyId);
    for (let c = 0; c < entry.count; c++) {
      enemies.push({
        index: enemies.length,
        spec,
        hp: spec.hp,
        progress: 0,
        spawnTick: spawnOffset + c * entry.spawnIntervalTicks,
        alive: false,
        leaked: false,
        hitTraps: new Set(),
      });
    }
    spawnOffset += entry.count * entry.spawnIntervalTicks;
  }

  const towers = board.towers.map((t) => {
    const spec = getCardDefinition(t.cardId).tower;
    if (!spec) {
      throw new Error(`タワーカードではありません: ${t.cardId}`);
    }
    return { pos: t.pos, spec, cooldown: 0 };
  });
  const trapUsesLeft = board.traps.map((t) => t.usesLeft);

  const ticks: CombatTick[] = [];
  let defeated = 0;
  let leaked = 0;
  let rewardScore = 0;

  const kill = (e: RuntimeEnemy, events: TickEvent[]): void => {
    e.alive = false;
    defeated++;
    rewardScore += e.spec.reward;
    events.push({ kind: 'defeat', enemyIndex: e.index });
  };

  for (let tick = 0; tick < MAX_TICKS; tick++) {
    const events: TickEvent[] = [];

    // ① スポーン（先制ダメージ適用）
    for (const e of enemies) {
      if (!e.alive && !e.leaked && e.hp > 0 && e.spawnTick === tick) {
        e.alive = true;
        if (modifiers.openingDamage > 0) {
          e.hp -= modifiers.openingDamage;
          if (e.hp <= 0) kill(e, events);
        }
      }
    }

    // ② 移動と漏れ判定
    for (const e of enemies) {
      if (!e.alive) continue;
      e.progress += e.spec.speed * modifiers.speedMultiplier;
      if (e.progress >= path.length - 1) {
        e.alive = false;
        e.leaked = true;
        leaked++;
        events.push({ kind: 'leak', enemyIndex: e.index });
      }
    }

    // ③ 罠発動（同じ罠は同じ敵に1回だけ）
    board.traps.forEach((trap, trapIndex) => {
      const trapSpec = getCardDefinition(trap.cardId).trap;
      if (!trapSpec) return;
      for (const e of enemies) {
        if (trapUsesLeft[trapIndex] <= 0) break;
        if (!e.alive || e.hitTraps.has(trapIndex)) continue;
        const cell = path[Math.min(Math.floor(e.progress), path.length - 1)];
        if (cell.x === trap.pos.x && cell.y === trap.pos.y) {
          e.hp -= trapSpec.damage;
          e.hitTraps.add(trapIndex);
          trapUsesLeft[trapIndex]--;
          events.push({ kind: 'trap', trapIndex, targetIndex: e.index });
          if (e.hp <= 0) kill(e, events);
        }
      }
    });

    // ④ タワー攻撃（射程内で最も進んだ敵を狙う）
    towers.forEach((tower, towerIndex) => {
      if (tower.cooldown > 0) {
        tower.cooldown--;
        return;
      }
      let target: RuntimeEnemy | null = null;
      for (const e of enemies) {
        if (!e.alive) continue;
        const p = positionOf(e.progress, path);
        const dist = Math.hypot(p.x - tower.pos.x, p.y - tower.pos.y);
        if (dist <= tower.spec.range && (!target || e.progress > target.progress)) {
          target = e;
        }
      }
      if (!target) return;
      const damage = Math.round(tower.spec.damage * board.towerAttackMultiplier);
      const targetPos = positionOf(target.progress, path);
      const victims =
        tower.spec.splashRadius > 0
          ? enemies.filter((e) => {
              if (!e.alive) return false;
              const p = positionOf(e.progress, path);
              return (
                Math.hypot(p.x - targetPos.x, p.y - targetPos.y) <=
                tower.spec.splashRadius
              );
            })
          : [target];
      events.push({ kind: 'shot', towerIndex, targetIndex: target.index });
      for (const v of victims) {
        v.hp -= damage;
        if (v.hp <= 0 && v.alive) kill(v, events);
      }
      tower.cooldown = tower.spec.cooldownTicks;
    });

    // ⑤ スナップショット
    ticks.push({
      tick,
      enemies: enemies
        .filter((e) => e.alive)
        .map((e) => {
          const p = positionOf(e.progress, path);
          return {
            index: e.index,
            enemyId: e.spec.id,
            hp: e.hp,
            maxHp: e.spec.hp,
            x: p.x,
            y: p.y,
          };
        }),
      events,
    });

    // 終了判定: 生存もスポーン待ちもいなければ終わり
    const hasPending = enemies.some(
      (e) => e.alive || (!e.leaked && e.hp > 0 && e.spawnTick > tick)
    );
    if (!hasPending) break;
  }

  return { ticks, defeated, leaked, rewardScore, trapUsesLeft };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`
Expected: PASS（7件）。「タワーを並べれば撃破」テストが火力不足で落ちる場合は、テスト側を `defeated + leaked === 3` の検査に緩めるのではなく、**タワー射程/ダメージまたはウェーブの敵数を調整して意図通り全滅する構成にする**（バランス値は P4 で較正するため、P1 ではテストが決定的に通る値でよい）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat
git commit -m "feat: 灰燼の城壁 決定的戦闘シミュレーション simulateWave を追加"
```

---

### Task 7: ラン状態・報酬生成・start-run / play-card ユースケース

**Files:**
- Create: `src/features/ashen-rampart/domain/run/run-state.ts`
- Create: `src/features/ashen-rampart/domain/run/reward.ts`
- Create: `src/features/ashen-rampart/application/use-cases/start-run.ts`
- Create: `src/features/ashen-rampart/application/use-cases/play-card.ts`
- Test: `src/features/ashen-rampart/domain/run/reward.test.ts`
- Test: `src/features/ashen-rampart/application/use-cases/play-card.test.ts`

**Interfaces:**
- Consumes: `DeckState`/`drawHand`/`shuffle`（Task 3）、`BoardState`/`createBoard`/`placeTower`/`placeTrap`/`canPlaceTower`/`canPlaceTrap`（Task 4）、`WaveModifiers`/`NO_MODIFIERS`/`CombatResult`（Task 6）、`RandomPort`（Task 1）、`INITIAL_DECK`/`REWARD_POOL`/`getCardDefinition`（Task 2）、`PLAINS_MAP`（Task 4）
- Produces:
  - `RunPhase = 'preparation' | 'combat' | 'reward' | 'result'`、`RunStatus = 'playing' | 'won' | 'lost'`
  - `RunState { phase; status; life; mana; manaMax; deck: DeckState; board: BoardState; waveIndex; pendingModifiers: WaveModifiers; rewardChoices: string[]; score; lastResult: CombatResult | null }`
  - `INITIAL_LIFE = 10`、`INITIAL_MANA_MAX = 4`
  - `generateRewardChoices(random: RandomFn, count?: number): string[]`（REWARD_POOL から重複なしで3枚）
  - `startRun(rng: RandomPort): RunState`
  - `playCard(state: RunState, handIndex: number, target?: CellPos): RunState`（不正はすべて throw）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/run/reward.test.ts
import { generateRewardChoices } from './reward';
import { REWARD_POOL } from '../cards/card-pool';
import { SeededRandom } from '../../infrastructure/random/seeded-random';

describe('generateRewardChoices', () => {
  const makeRandom = (seed: number) => {
    const rng = new SeededRandom(seed);
    return () => rng.random();
  };

  it('報酬プールから重複なしで3枚選ぶ', () => {
    const choices = generateRewardChoices(makeRandom(1));
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    for (const id of choices) {
      expect(REWARD_POOL).toContain(id);
    }
  });

  it('同じシードなら同じ選択肢になる（決定性）', () => {
    expect(generateRewardChoices(makeRandom(5))).toEqual(
      generateRewardChoices(makeRandom(5))
    );
  });
});
```

```ts
// src/features/ashen-rampart/application/use-cases/play-card.test.ts
import { startRun } from './start-run';
import { playCard } from './play-card';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { getCardDefinition } from '../../domain/cards/card-pool';
import { INITIAL_LIFE, INITIAL_MANA_MAX } from '../../domain/run/run-state';
import { HAND_SIZE } from '../../domain/cards/deck';

describe('startRun', () => {
  it('準備フェーズ・ライフ10・マナ4・手札5枚で開始する', () => {
    const state = startRun(new SeededRandom(42));
    expect(state.phase).toBe('preparation');
    expect(state.status).toBe('playing');
    expect(state.life).toBe(INITIAL_LIFE);
    expect(state.mana).toBe(INITIAL_MANA_MAX);
    expect(state.deck.hand).toHaveLength(HAND_SIZE);
    expect(state.waveIndex).toBe(0);
    expect(state.board.towers).toHaveLength(0);
  });
});

describe('playCard', () => {
  // シード探索用ヘルパ: 手札に指定タイプのカードが来るシードで開始する
  const startWithCardInHand = (type: string) => {
    for (let seed = 0; seed < 100; seed++) {
      const state = startRun(new SeededRandom(seed));
      const idx = state.deck.hand.findIndex(
        (id) => getCardDefinition(id).type === type
      );
      if (idx >= 0) return { state, idx };
    }
    throw new Error(`テスト用シードが見つかりません: ${type}`);
  };

  it('タワーカードを設置マスに使うとタワーが建ちマナが減る', () => {
    const { state, idx } = startWithCardInHand('tower');
    const cost = getCardDefinition(state.deck.hand[idx]).cost;
    const next = playCard(state, idx, PLAINS_MAP.buildSlots[0]);
    expect(next.board.towers).toHaveLength(1);
    expect(next.mana).toBe(state.mana - cost);
    expect(next.deck.hand).toHaveLength(state.deck.hand.length - 1);
  });

  it('タワーカードは捨札に行かない（盤面への永続投資）', () => {
    const { state, idx } = startWithCardInHand('tower');
    const next = playCard(state, idx, PLAINS_MAP.buildSlots[0]);
    expect(next.deck.discardPile).toHaveLength(state.deck.discardPile.length);
  });

  it('スペルカードは捨札に行く', () => {
    const { state, idx } = startWithCardInHand('spell');
    const cardId = state.deck.hand[idx];
    const next = playCard(state, idx);
    expect(next.deck.discardPile).toContain(cardId);
  });

  it('業火を使うと次ウェーブの openingDamage が積まれる', () => {
    for (let seed = 0; seed < 100; seed++) {
      const state = startRun(new SeededRandom(seed));
      const idx = state.deck.hand.findIndex((id) => id === 'fire-blast');
      if (idx < 0) continue;
      const next = playCard(state, idx);
      expect(next.pendingModifiers.openingDamage).toBe(8);
      return;
    }
    throw new Error('テスト用シードが見つかりません: fire-blast');
  });

  it('マナ不足なら例外を投げる', () => {
    const { state, idx } = startWithCardInHand('tower');
    const broke = { ...state, mana: 0 };
    expect(() => playCard(broke, idx, PLAINS_MAP.buildSlots[0])).toThrow();
  });

  it('タワーを経路マスに置こうとすると例外を投げる', () => {
    const { state, idx } = startWithCardInHand('tower');
    expect(() => playCard(state, idx, PLAINS_MAP.path[0])).toThrow();
  });

  it('準備フェーズ以外では使えない', () => {
    const { state, idx } = startWithCardInHand('tower');
    const combat = { ...state, phase: 'combat' as const };
    expect(() => playCard(combat, idx, PLAINS_MAP.buildSlots[0])).toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/run src/features/ashen-rampart/application`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/run/run-state.ts
/**
 * 灰燼の城壁 - ラン状態
 */
import type { DeckState } from '../cards/deck';
import type { BoardState } from '../board/board-state';
import type { CombatResult, WaveModifiers } from '../combat/simulate-wave';

export type RunPhase = 'preparation' | 'combat' | 'reward' | 'result';
export type RunStatus = 'playing' | 'won' | 'lost';

export interface RunState {
  phase: RunPhase;
  status: RunStatus;
  /** 砦のライフ（敵1体漏れで-1、0で敗北） */
  life: number;
  mana: number;
  manaMax: number;
  deck: DeckState;
  board: BoardState;
  /** 次に戦うウェーブの添字（0始まり） */
  waveIndex: number;
  /** スペルによる次ウェーブへの修飾（ウェーブ終了でリセット） */
  pendingModifiers: WaveModifiers;
  /** 報酬フェーズの選択肢（カードID×3） */
  rewardChoices: string[];
  score: number;
  /** 直近ウェーブの戦闘結果（combat フェーズでの再生用） */
  lastResult: CombatResult | null;
}

export const INITIAL_LIFE = 10;
export const INITIAL_MANA_MAX = 4;
/** ウェーブクリアボーナス */
export const WAVE_CLEAR_BONUS = 50;
/** 勝利時の残ライフ1あたりのボーナス */
export const LIFE_BONUS = 10;
```

```ts
// src/features/ashen-rampart/domain/run/reward.ts
/**
 * 灰燼の城壁 - 報酬候補生成
 */
import type { RandomFn } from '../shared/random';
import { REWARD_POOL } from '../cards/card-pool';

/** 報酬プールから重複なしで count 枚のカードIDを選ぶ */
export const generateRewardChoices = (
  random: RandomFn,
  count = 3
): string[] => {
  const pool = [...REWARD_POOL];
  const choices: string[] = [];
  while (choices.length < count && pool.length > 0) {
    const i = Math.floor(random() * pool.length);
    choices.push(pool.splice(i, 1)[0]);
  }
  return choices;
};
```

```ts
// src/features/ashen-rampart/application/use-cases/start-run.ts
/**
 * 灰燼の城壁 - ユースケース: ラン開始
 */
import type { RandomPort } from '../ports/random-port';
import { INITIAL_DECK } from '../../domain/cards/card-pool';
import { drawHand, shuffle } from '../../domain/cards/deck';
import { createBoard } from '../../domain/board/board-state';
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { NO_MODIFIERS } from '../../domain/combat/simulate-wave';
import {
  INITIAL_LIFE,
  INITIAL_MANA_MAX,
  type RunState,
} from '../../domain/run/run-state';

export const startRun = (rng: RandomPort): RunState => {
  const random = () => rng.random();
  const drawPile = shuffle(INITIAL_DECK, random);
  const deck = drawHand({ drawPile, hand: [], discardPile: [] }, random);
  return {
    phase: 'preparation',
    status: 'playing',
    life: INITIAL_LIFE,
    mana: INITIAL_MANA_MAX,
    manaMax: INITIAL_MANA_MAX,
    deck,
    board: createBoard(PLAINS_MAP),
    waveIndex: 0,
    pendingModifiers: { ...NO_MODIFIERS },
    rewardChoices: [],
    score: 0,
    lastResult: null,
  };
};
```

```ts
// src/features/ashen-rampart/application/use-cases/play-card.ts
/**
 * 灰燼の城壁 - ユースケース: カード使用
 *
 * タワー/罠は盤面への永続投資（デッキから除外）、
 * スペルは捨札へ（再循環する）、戦術は永続効果でデッキから除外。
 */
import { getCardDefinition } from '../../domain/cards/card-pool';
import { placeTower, placeTrap } from '../../domain/board/board-state';
import type { CellPos } from '../../domain/board/stage-map';
import type { RunState } from '../../domain/run/run-state';

export const playCard = (
  state: RunState,
  handIndex: number,
  target?: CellPos
): RunState => {
  if (state.phase !== 'preparation') {
    throw new Error('準備フェーズ以外ではカードを使用できません');
  }
  const cardId = state.deck.hand[handIndex];
  if (cardId === undefined) {
    throw new Error(`手札のインデックスが不正です: ${handIndex}`);
  }
  const card = getCardDefinition(cardId);
  if (card.cost > state.mana) {
    throw new Error(`マナが不足しています: 必要${card.cost} / 所持${state.mana}`);
  }

  const hand = state.deck.hand.filter((_, i) => i !== handIndex);
  let mana = state.mana - card.cost;
  let board = state.board;
  let discardPile = state.deck.discardPile;
  let pendingModifiers = state.pendingModifiers;

  switch (card.type) {
    case 'tower': {
      if (!target) throw new Error('タワーには設置先の指定が必要です');
      board = placeTower(board, cardId, target);
      break;
    }
    case 'trap': {
      if (!target) throw new Error('罠には設置先の指定が必要です');
      board = placeTrap(board, cardId, target);
      break;
    }
    case 'spell': {
      const spell = card.spell ?? {};
      mana += spell.gainMana ?? 0;
      pendingModifiers = {
        openingDamage: pendingModifiers.openingDamage + (spell.openingDamage ?? 0),
        speedMultiplier:
          pendingModifiers.speedMultiplier * (spell.speedMultiplier ?? 1),
      };
      discardPile = [...discardPile, cardId];
      break;
    }
    case 'tactic': {
      const tactic = card.tactic ?? {};
      board = {
        ...board,
        towerAttackMultiplier:
          board.towerAttackMultiplier + (tactic.towerAttackBonus ?? 0),
      };
      break;
    }
  }

  return {
    ...state,
    mana,
    board,
    pendingModifiers,
    deck: { ...state.deck, hand, discardPile },
  };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/run src/features/ashen-rampart/application`
Expected: PASS（10件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat: 灰燼の城壁 ラン状態と start-run / play-card ユースケースを追加"
```

---

### Task 8: start-wave / finish-wave / choose-reward ユースケース

**Files:**
- Create: `src/features/ashen-rampart/application/use-cases/start-wave.ts`
- Create: `src/features/ashen-rampart/application/use-cases/choose-reward.ts`
- Test: `src/features/ashen-rampart/application/use-cases/start-wave.test.ts`

**Interfaces:**
- Consumes: `simulateWave`/`NO_MODIFIERS`（Task 6）、`PLAINS_WAVES`（Task 5）、`generateRewardChoices`（Task 7）、`drawHand`（Task 3）、`RunState`/`WAVE_CLEAR_BONUS`/`LIFE_BONUS`（Task 7）、`RandomPort`（Task 1）
- Produces:
  - `startWave(state: RunState): RunState` — シミュレーション実行、`phase: 'combat'`・`lastResult` 設定
  - `finishWave(state: RunState, rng: RandomPort): RunState` — 結果適用（ライフ減・スコア加算・罠消費反映）。敗北→`result/lost`、最終ウェーブ勝利→`result/won`＋ライフボーナス、続行→`reward` フェーズ＋報酬候補生成＋`waveIndex`+1＋修飾子リセット
  - `chooseReward(state: RunState, choiceIndex: number | null, rng: RandomPort): RunState` — null はスキップ。カードは捨札へ。マナ全回復・手札引き直し・`preparation` へ

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/application/use-cases/start-wave.test.ts
import { startRun } from './start-run';
import { playCard } from './play-card';
import { startWave, finishWave } from './start-wave';
import { chooseReward } from './choose-reward';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../../domain/board/stage-map';
import { PLAINS_WAVES } from '../../domain/combat/waves';
import { getCardDefinition } from '../../domain/cards/card-pool';
import { HAND_SIZE } from '../../domain/cards/deck';
import type { RunState } from '../../domain/run/run-state';

const rng = () => new SeededRandom(42);

/** タワーを全設置マスに強制配置した状態を作る（テスト用に盤面だけ差し替え） */
const withFullTowers = (state: RunState): RunState => ({
  ...state,
  board: {
    ...state.board,
    towers: PLAINS_MAP.buildSlots.map((pos) => ({ cardId: 'arrow-tower', pos })),
  },
});

describe('startWave', () => {
  it('戦闘フェーズへ遷移し戦闘結果を保持する', () => {
    const state = startWave(startRun(rng()));
    expect(state.phase).toBe('combat');
    expect(state.lastResult).not.toBeNull();
    expect(state.lastResult?.ticks.length).toBeGreaterThan(0);
  });

  it('準備フェーズ以外からは開始できない', () => {
    const state = startWave(startRun(rng()));
    expect(() => startWave(state)).toThrow();
  });
});

describe('finishWave', () => {
  it('漏れた敵の数だけライフが減る', () => {
    // タワーなし → 全敵漏れ
    const combat = startWave(startRun(rng()));
    const leaked = combat.lastResult?.leaked ?? 0;
    const next = finishWave(combat, rng());
    expect(leaked).toBeGreaterThan(0);
    expect(next.life).toBe(combat.life - leaked);
  });

  it('ライフが0以下になると敗北リザルトへ', () => {
    const combat = startWave({ ...startRun(rng()), life: 1 });
    const next = finishWave(combat, rng());
    expect(next.phase).toBe('result');
    expect(next.status).toBe('lost');
    expect(next.life).toBe(0);
  });

  it('ウェーブを凌ぐと報酬フェーズへ進み選択肢3枚と waveIndex が進む', () => {
    const combat = startWave(withFullTowers(startRun(rng())));
    const next = finishWave(combat, rng());
    expect(next.phase).toBe('reward');
    expect(next.rewardChoices).toHaveLength(3);
    expect(next.waveIndex).toBe(1);
    expect(next.score).toBeGreaterThan(0);
    // 修飾子はリセットされる
    expect(next.pendingModifiers.openingDamage).toBe(0);
    expect(next.pendingModifiers.speedMultiplier).toBe(1);
  });

  it('最終ウェーブを凌ぐと勝利リザルトへ（ライフボーナス加算）', () => {
    const base = withFullTowers(startRun(rng()));
    const lastWaveState: RunState = {
      ...base,
      waveIndex: PLAINS_WAVES.length - 1,
    };
    const next = finishWave(startWave(lastWaveState), rng());
    expect(next.phase).toBe('result');
    expect(next.status).toBe('won');
  });
});

describe('chooseReward', () => {
  const rewardState = (): RunState =>
    finishWave(startWave(withFullTowers(startRun(rng()))), rng());

  it('選んだカードが捨札に加わり準備フェーズへ戻る', () => {
    const state = rewardState();
    const chosen = state.rewardChoices[0];
    const next = chooseReward(state, 0, rng());
    expect(next.phase).toBe('preparation');
    expect(next.mana).toBe(next.manaMax);
    expect(next.deck.hand).toHaveLength(HAND_SIZE);
    // 選んだカードがデッキ全体（山札+手札+捨札）に含まれる
    const all = [...next.deck.drawPile, ...next.deck.hand, ...next.deck.discardPile];
    expect(all).toContain(chosen);
    expect(getCardDefinition(chosen)).toBeDefined();
  });

  it('スキップ（null）ではデッキ枚数が変わらない', () => {
    const state = rewardState();
    const before =
      state.deck.drawPile.length +
      state.deck.hand.length +
      state.deck.discardPile.length;
    const next = chooseReward(state, null, rng());
    const after =
      next.deck.drawPile.length +
      next.deck.hand.length +
      next.deck.discardPile.length;
    expect(after).toBe(before);
  });

  it('報酬フェーズ以外では選択できない', () => {
    expect(() => chooseReward(startRun(rng()), 0, rng())).toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/application/use-cases/start-wave.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/application/use-cases/start-wave.ts
/**
 * 灰燼の城壁 - ユースケース: ウェーブ開始と結果適用
 *
 * startWave: シミュレーションを実行し combat フェーズへ（UI が tick を再生）
 * finishWave: 再生完了後に結果をラン状態へ適用する
 */
import type { RandomPort } from '../ports/random-port';
import { simulateWave, NO_MODIFIERS } from '../../domain/combat/simulate-wave';
import { PLAINS_WAVES } from '../../domain/combat/waves';
import { generateRewardChoices } from '../../domain/run/reward';
import {
  LIFE_BONUS,
  WAVE_CLEAR_BONUS,
  type RunState,
} from '../../domain/run/run-state';

export const startWave = (state: RunState): RunState => {
  if (state.phase !== 'preparation') {
    throw new Error('準備フェーズ以外からウェーブは開始できません');
  }
  const wave = PLAINS_WAVES[state.waveIndex];
  if (!wave) {
    throw new Error(`ウェーブ定義が存在しません: ${state.waveIndex}`);
  }
  const result = simulateWave(state.board, wave, state.pendingModifiers);
  return { ...state, phase: 'combat', lastResult: result };
};

export const finishWave = (state: RunState, rng: RandomPort): RunState => {
  if (state.phase !== 'combat' || !state.lastResult) {
    throw new Error('戦闘フェーズ以外では結果を適用できません');
  }
  const result = state.lastResult;
  const life = Math.max(0, state.life - result.leaked);

  // 罠の使用回数を反映し、使い切った罠は盤面から除去
  const traps = state.board.traps
    .map((t, i) => ({ ...t, usesLeft: result.trapUsesLeft[i] ?? t.usesLeft }))
    .filter((t) => t.usesLeft > 0);
  const board = { ...state.board, traps };
  const baseScore = state.score + result.rewardScore;

  if (life <= 0) {
    return { ...state, board, life: 0, score: baseScore, phase: 'result', status: 'lost' };
  }

  const score = baseScore + WAVE_CLEAR_BONUS;
  const isLastWave = state.waveIndex + 1 >= PLAINS_WAVES.length;
  if (isLastWave) {
    return {
      ...state,
      board,
      life,
      score: score + life * LIFE_BONUS,
      phase: 'result',
      status: 'won',
    };
  }

  const random = () => rng.random();
  return {
    ...state,
    board,
    life,
    score,
    phase: 'reward',
    waveIndex: state.waveIndex + 1,
    rewardChoices: generateRewardChoices(random),
    pendingModifiers: { ...NO_MODIFIERS },
  };
};
```

```ts
// src/features/ashen-rampart/application/use-cases/choose-reward.ts
/**
 * 灰燼の城壁 - ユースケース: 報酬選択（スキップ可）
 */
import type { RandomPort } from '../ports/random-port';
import { drawHand } from '../../domain/cards/deck';
import type { RunState } from '../../domain/run/run-state';

export const chooseReward = (
  state: RunState,
  choiceIndex: number | null,
  rng: RandomPort
): RunState => {
  if (state.phase !== 'reward') {
    throw new Error('報酬フェーズ以外では報酬を選択できません');
  }
  let discardPile = state.deck.discardPile;
  if (choiceIndex !== null) {
    const cardId = state.rewardChoices[choiceIndex];
    if (cardId === undefined) {
      throw new Error(`報酬の選択が不正です: ${choiceIndex}`);
    }
    discardPile = [...discardPile, cardId];
  }
  const random = () => rng.random();
  const deck = drawHand({ ...state.deck, discardPile }, random);
  return {
    ...state,
    deck,
    mana: state.manaMax,
    phase: 'preparation',
    rewardChoices: [],
    lastResult: null,
  };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/application`
Expected: PASS（start-wave.test 9件 + play-card.test 8件）

- [ ] **Step 5: ここまでの全テストを回してコミット**

Run: `npm test -- src/features/ashen-rampart`
Expected: PASS（全件）

```bash
git add src/features/ashen-rampart/application
git commit -m "feat: 灰燼の城壁 ウェーブ進行と報酬選択のユースケースを追加"
```

---

### Task 9: ゲームフック useAshenRampartGame

**Files:**
- Create: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Test: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`

**Interfaces:**
- Consumes: `startRun`/`playCard`/`startWave`/`finishWave`/`chooseReward`（Task 7-8）、`RandomPort`/`DefaultRandom`（Task 1）、`getCardDefinition`（Task 2）、`CellPos`（Task 4）
- Produces:
  - `TICK_INTERVAL_MS = 100`
  - `useAshenRampartGame(rng?: RandomPort)` が返すオブジェクト:
    - `run: RunState`、`selectedHandIndex: number | null`、`replayTick: number`、`error: string | null`
    - `selectCard(handIndex: number): void` — タワー/罠は選択トグル、スペル/戦術は即時使用
    - `placeAt(pos: CellPos): void` — 選択中カードを配置
    - `beginWave(): void`、`pickReward(choiceIndex: number | null): void`、`restart(): void`
  - combat フェーズ中は `TICK_INTERVAL_MS` 間隔で `replayTick` が進み、tick 列の末尾に達すると自動で `finishWave` が呼ばれる

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { SeededRandom } from '../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';

describe('useAshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('準備フェーズ・手札5枚で開始する', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    expect(result.current.run.phase).toBe('preparation');
    expect(result.current.run.deck.hand).toHaveLength(5);
  });

  it('タワーカードを選択して設置マスに置ける', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    const idx = result.current.run.deck.hand.findIndex(
      (id) => getCardDefinition(id).type === 'tower'
    );
    // シード42の初期手札にタワーがあることを前提（無ければシードを変更）
    expect(idx).toBeGreaterThanOrEqual(0);
    act(() => result.current.selectCard(idx));
    expect(result.current.selectedHandIndex).toBe(idx);
    act(() => result.current.placeAt(PLAINS_MAP.buildSlots[0]));
    expect(result.current.run.board.towers).toHaveLength(1);
    expect(result.current.selectedHandIndex).toBeNull();
  });

  it('不正配置は error に格納されクラッシュしない', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    const idx = result.current.run.deck.hand.findIndex(
      (id) => getCardDefinition(id).type === 'tower'
    );
    act(() => result.current.selectCard(idx));
    act(() => result.current.placeAt(PLAINS_MAP.path[0]));
    expect(result.current.error).not.toBeNull();
    expect(result.current.run.board.towers).toHaveLength(0);
  });

  it('ウェーブ開始→リプレイ完走→自動で次フェーズへ進む', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    act(() => result.current.beginWave());
    expect(result.current.run.phase).toBe('combat');
    const totalTicks = result.current.run.lastResult?.ticks.length ?? 0;
    act(() => {
      jest.advanceTimersByTime((totalTicks + 2) * TICK_INTERVAL_MS);
    });
    // タワーなし全漏れでもライフ10>漏れ数なので報酬フェーズへ
    expect(['reward', 'result']).toContain(result.current.run.phase);
  });

  it('restart で新しいランが始まる', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    act(() => result.current.beginWave());
    act(() => result.current.restart());
    expect(result.current.run.phase).toBe('preparation');
    expect(result.current.run.waveIndex).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/presentation/useAshenRampartGame.ts
/**
 * 灰燼の城壁 - ゲームフック
 *
 * ラン状態の保持・ユースケース呼び出し・戦闘リプレイの進行を担う。
 * ゲームルールは一切持たない（すべて application/use-cases 経由）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RandomPort } from '../application/ports/random-port';
import { DefaultRandom } from '../infrastructure/random/seeded-random';
import { startRun } from '../application/use-cases/start-run';
import { playCard } from '../application/use-cases/play-card';
import { startWave, finishWave } from '../application/use-cases/start-wave';
import { chooseReward } from '../application/use-cases/choose-reward';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { CellPos } from '../domain/board/stage-map';
import type { RunState } from '../domain/run/run-state';

/** 戦闘リプレイの tick 間隔（ms） */
export const TICK_INTERVAL_MS = 100;

export const useAshenRampartGame = (rng?: RandomPort) => {
  const rngRef = useRef<RandomPort>(rng ?? new DefaultRandom());
  const [run, setRun] = useState<RunState>(() => startRun(rngRef.current));
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [replayTick, setReplayTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** ユースケース呼び出しを共通のエラーハンドリングで包む */
  const dispatch = useCallback((update: (state: RunState) => RunState) => {
    setRun((current) => {
      try {
        setError(null);
        return update(current);
      } catch (e) {
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
        return current;
      }
    });
  }, []);

  const selectCard = useCallback(
    (handIndex: number) => {
      const cardId = run.deck.hand[handIndex];
      if (cardId === undefined) return;
      const card = getCardDefinition(cardId);
      if (card.type === 'spell' || card.type === 'tactic') {
        // 対象指定不要のカードは即時使用
        dispatch((s) => playCard(s, handIndex));
        setSelectedHandIndex(null);
        return;
      }
      // タワー/罠は選択トグル（同じカード再クリックで解除）
      setSelectedHandIndex((cur) => (cur === handIndex ? null : handIndex));
    },
    [run.deck.hand, dispatch]
  );

  const placeAt = useCallback(
    (pos: CellPos) => {
      if (selectedHandIndex === null) return;
      dispatch((s) => playCard(s, selectedHandIndex, pos));
      setSelectedHandIndex(null);
    },
    [selectedHandIndex, dispatch]
  );

  const beginWave = useCallback(() => {
    setSelectedHandIndex(null);
    setReplayTick(0);
    dispatch((s) => startWave(s));
  }, [dispatch]);

  const pickReward = useCallback(
    (choiceIndex: number | null) => {
      dispatch((s) => chooseReward(s, choiceIndex, rngRef.current));
    },
    [dispatch]
  );

  const restart = useCallback(() => {
    setSelectedHandIndex(null);
    setReplayTick(0);
    setError(null);
    setRun(startRun(rngRef.current));
  }, []);

  // 戦闘リプレイ: combat フェーズ中は tick を進める
  useEffect(() => {
    if (run.phase !== 'combat' || !run.lastResult) return undefined;
    const timer = setInterval(() => {
      setReplayTick((t) => t + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [run.phase, run.lastResult]);

  // リプレイ完走で結果を適用
  useEffect(() => {
    if (run.phase !== 'combat' || !run.lastResult) return;
    if (replayTick >= run.lastResult.ticks.length) {
      dispatch((s) => finishWave(s, rngRef.current));
      setReplayTick(0);
    }
  }, [replayTick, run.phase, run.lastResult, dispatch]);

  return {
    run,
    selectedHandIndex,
    replayTick,
    error,
    selectCard,
    placeAt,
    beginWave,
    pickReward,
    restart,
  };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
Expected: PASS（5件）。「シード42の手札にタワーがある」前提が崩れる場合はテストのシード値を変更して調整

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation
git commit -m "feat: 灰燼の城壁 ゲームフック（状態管理と戦闘リプレイ進行）を追加"
```

---

### Task 10: UI コンポーネント（プレースホルダ描画）

**Files:**
- Create: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Create: `src/features/ashen-rampart/presentation/HandArea.tsx`
- Create: `src/features/ashen-rampart/presentation/StatusBar.tsx`
- Create: `src/features/ashen-rampart/presentation/RewardPanel.tsx`
- Create: `src/features/ashen-rampart/presentation/ResultPanel.tsx`
- Create: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`
- Create: `src/features/ashen-rampart/index.ts`
- Test: `src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx`

**Interfaces:**
- Consumes: `useAshenRampartGame`/`TICK_INTERVAL_MS`（Task 9）、domain の型
- Produces: `AshenRampartGame: React.FC`（`index.ts` から named export）

**ビジュアル指針（P1 プレースホルダ）:** ダーク基調（背景 `#1a1418`、経路 `#3d3230`、設置マス `#2a3040` 枠線）。タワー🏹💣・罠🕳・敵は赤系の円＋HPバー。敵は tick スナップショットの座標を `left/top %` で絶対配置し `transition: left 0.1s linear, top 0.1s linear` で補間。P3 で Canvas エフェクト層に置き換えるため、見た目の作り込みはしない。

- [ ] **Step 1: 失敗するテストを書く（主要フローの RTL テスト）**

```tsx
// src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AshenRampartGame } from './AshenRampartGame';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';

describe('AshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('準備フェーズのUI（手札・ウェーブ開始ボタン・ステータス）が表示される', () => {
    render(<AshenRampartGame seed={42} />);
    expect(screen.getByText('灰燼の城壁')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ウェーブ開始' })).toBeInTheDocument();
    expect(screen.getAllByTestId('hand-card')).toHaveLength(5);
    expect(screen.getByTestId('status-life')).toHaveTextContent('10');
  });

  it('ウェーブ開始で戦闘フェーズになり、完走後に次フェーズへ進む', () => {
    render(<AshenRampartGame seed={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'ウェーブ開始' }));
    expect(screen.getByText(/戦闘中/)).toBeInTheDocument();
    act(() => {
      // 十分な時間を進めてリプレイを完走させる（安全弁 MAX_TICKS ぶん）
      jest.advanceTimersByTime(2100 * TICK_INTERVAL_MS);
    });
    // タワーなし全漏れ → ライフは残るので報酬フェーズ
    expect(screen.getByText('報酬を選択')).toBeInTheDocument();
    expect(screen.getAllByTestId('reward-card')).toHaveLength(3);
  });

  it('報酬をスキップして次の準備フェーズへ戻れる', () => {
    render(<AshenRampartGame seed={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'ウェーブ開始' }));
    act(() => {
      jest.advanceTimersByTime(2100 * TICK_INTERVAL_MS);
    });
    fireEvent.click(screen.getByRole('button', { name: 'スキップ' }));
    expect(screen.getByRole('button', { name: 'ウェーブ開始' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: 実装**

```tsx
// src/features/ashen-rampart/presentation/StatusBar.tsx
/**
 * 灰燼の城壁 - ステータスバー（ライフ/マナ/ウェーブ/スコア）
 */
import React from 'react';
import styled from 'styled-components';
import { PLAINS_WAVES } from '../domain/combat/waves';
import type { RunState } from '../domain/run/run-state';

const Bar = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: #241d22;
  color: #e8ded2;
  border-radius: 8px;
  font-size: 14px;
`;

export const StatusBar: React.FC<{ run: RunState }> = ({ run }) => (
  <Bar>
    <span data-testid="status-life">❤️ {run.life}</span>
    <span data-testid="status-mana">🔮 {run.mana}/{run.manaMax}</span>
    <span data-testid="status-wave">
      🌊 {Math.min(run.waveIndex + 1, PLAINS_WAVES.length)}/{PLAINS_WAVES.length}
    </span>
    <span data-testid="status-score">⭐ {run.score}</span>
  </Bar>
);
```

```tsx
// src/features/ashen-rampart/presentation/BoardGrid.tsx
/**
 * 灰燼の城壁 - 盤面グリッド（P1 プレースホルダ描画）
 *
 * 敵は tick スナップショットの補間座標を % 配置し、
 * CSS transition で滑らかに見せる。ロジックは持たない。
 */
import React from 'react';
import styled from 'styled-components';
import type { BoardState } from '../domain/board/board-state';
import type { CellPos } from '../domain/board/stage-map';
import type { EnemySnapshot } from '../domain/combat/simulate-wave';
import { getCardDefinition } from '../domain/cards/card-pool';

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
`;

const Grid = styled.div<{ $cols: number; $rows: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
  grid-template-rows: repeat(${({ $rows }) => $rows}, 1fr);
  gap: 2px;
  aspect-ratio: ${({ $cols, $rows }) => `${$cols} / ${$rows}`};
  background: #161114;
  padding: 4px;
  border-radius: 8px;
`;

const Cell = styled.button<{ $kind: 'path' | 'slot' | 'empty'; $placeable: boolean }>`
  border: none;
  border-radius: 4px;
  font-size: 16px;
  padding: 0;
  background: ${({ $kind }) =>
    $kind === 'path' ? '#3d3230' : $kind === 'slot' ? '#222b3a' : '#1a1418'};
  outline: ${({ $placeable }) => ($placeable ? '2px solid #7fb069' : 'none')};
  cursor: ${({ $placeable }) => ($placeable ? 'pointer' : 'default')};
`;

const EnemyDot = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  width: 5%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #c0392b;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  transition: left 0.1s linear, top 0.1s linear;
  pointer-events: none;
`;

const HpBar = styled.div<{ $ratio: number }>`
  position: absolute;
  top: -4px;
  left: 0;
  height: 3px;
  width: ${({ $ratio }) => Math.max(0, $ratio * 100)}%;
  background: #7fb069;
`;

interface Props {
  board: BoardState;
  enemies: EnemySnapshot[];
  /** 選択中カードの種別（配置可能マスのハイライト用）。null = 未選択 */
  placingType: 'tower' | 'trap' | null;
  onCellClick: (pos: CellPos) => void;
}

export const BoardGrid: React.FC<Props> = ({
  board,
  enemies,
  placingType,
  onCellClick,
}) => {
  const { width, height, path, buildSlots } = board.map;
  const cells: React.ReactElement[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isPath = path.some((p) => p.x === x && p.y === y);
      const isSlot = buildSlots.some((s) => s.x === x && s.y === y);
      const tower = board.towers.find((t) => t.pos.x === x && t.pos.y === y);
      const trap = board.traps.find((t) => t.pos.x === x && t.pos.y === y);
      const placeable =
        (placingType === 'tower' && isSlot && !tower) ||
        (placingType === 'trap' && isPath && !trap);
      const icon = tower
        ? getCardDefinition(tower.cardId).tower?.splashRadius
          ? '💣'
          : '🏹'
        : trap
          ? '🕳'
          : '';
      cells.push(
        <Cell
          key={`${x}-${y}`}
          $kind={isPath ? 'path' : isSlot ? 'slot' : 'empty'}
          $placeable={placeable}
          onClick={() => onCellClick({ x, y })}
          aria-label={`マス (${x}, ${y})`}
        >
          {icon}
        </Cell>
      );
    }
  }
  return (
    <Wrapper>
      <Grid $cols={width} $rows={height}>
        {cells}
      </Grid>
      {enemies.map((e) => (
        <EnemyDot
          key={e.index}
          $x={((e.x + 0.5) / width) * 100}
          $y={((e.y + 0.5) / height) * 100}
        >
          <HpBar $ratio={e.hp / e.maxHp} />
        </EnemyDot>
      ))}
    </Wrapper>
  );
};
```

```tsx
// src/features/ashen-rampart/presentation/HandArea.tsx
/**
 * 灰燼の城壁 - 手札表示
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';

const Area = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Card = styled.button<{ $selected: boolean; $affordable: boolean }>`
  width: 96px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 2px solid ${({ $selected }) => ($selected ? '#e8b04b' : '#463a42')};
  background: #241d22;
  color: ${({ $affordable }) => ($affordable ? '#e8ded2' : '#6b5f66')};
  cursor: ${({ $affordable }) => ($affordable ? 'pointer' : 'not-allowed')};
  font-size: 12px;
  text-align: center;
`;

const TYPE_LABEL: Record<string, string> = {
  tower: 'タワー',
  trap: '罠',
  spell: 'スペル',
  tactic: '戦術',
};

interface Props {
  hand: string[];
  mana: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const HandArea: React.FC<Props> = ({ hand, mana, selectedIndex, onSelect }) => (
  <Area>
    {hand.map((cardId, i) => {
      const card = getCardDefinition(cardId);
      const affordable = card.cost <= mana;
      return (
        <Card
          key={`${cardId}-${i}`}
          data-testid="hand-card"
          $selected={selectedIndex === i}
          $affordable={affordable}
          disabled={!affordable}
          onClick={() => onSelect(i)}
        >
          <div>
            【{TYPE_LABEL[card.type]}】🔮{card.cost}
          </div>
          <strong>{card.name}</strong>
          <div>{card.description}</div>
        </Card>
      );
    })}
  </Area>
);
```

```tsx
// src/features/ashen-rampart/presentation/RewardPanel.tsx
/**
 * 灰燼の城壁 - 報酬選択パネル
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';

const Panel = styled.div`
  text-align: center;
  color: #e8ded2;
`;

const Choices = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 12px 0;
`;

const Choice = styled.button`
  width: 140px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid #e8b04b;
  background: #241d22;
  color: #e8ded2;
  cursor: pointer;
`;

interface Props {
  choices: string[];
  onPick: (index: number | null) => void;
}

export const RewardPanel: React.FC<Props> = ({ choices, onPick }) => (
  <Panel>
    <h3>報酬を選択</h3>
    <Choices>
      {choices.map((cardId, i) => {
        const card = getCardDefinition(cardId);
        return (
          <Choice key={`${cardId}-${i}`} data-testid="reward-card" onClick={() => onPick(i)}>
            <strong>{card.name}</strong>
            <div>🔮{card.cost}</div>
            <div>{card.description}</div>
          </Choice>
        );
      })}
    </Choices>
    <button onClick={() => onPick(null)}>スキップ</button>
  </Panel>
);
```

```tsx
// src/features/ashen-rampart/presentation/ResultPanel.tsx
/**
 * 灰燼の城壁 - リザルトパネル
 */
import React from 'react';
import styled from 'styled-components';
import type { RunState } from '../domain/run/run-state';

const Panel = styled.div`
  text-align: center;
  color: #e8ded2;
  padding: 24px;
`;

export const ResultPanel: React.FC<{ run: RunState; onRestart: () => void }> = ({
  run,
  onRestart,
}) => (
  <Panel>
    <h2>{run.status === 'won' ? '🏰 砦は守られた' : '💀 城壁は灰燼に帰した'}</h2>
    <p>スコア: {run.score}</p>
    <button onClick={onRestart}>もう一度挑む</button>
  </Panel>
);
```

```tsx
// src/features/ashen-rampart/presentation/AshenRampartGame.tsx
/**
 * 灰燼の城壁 - メインコンテナ
 *
 * フェーズに応じて準備/戦闘/報酬/リザルトの UI を切り替える。
 */
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAshenRampartGame } from './useAshenRampartGame';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { StatusBar } from './StatusBar';
import { RewardPanel } from './RewardPanel';
import { ResultPanel } from './ResultPanel';
import { SeededRandom, DefaultRandom } from '../infrastructure/random/seeded-random';
import { getCardDefinition } from '../domain/cards/card-pool';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #1a1418;
  min-height: 100vh;
`;

const Title = styled.h1`
  color: #e8b04b;
  text-align: center;
  font-size: 24px;
  margin: 0;
`;

const ErrorText = styled.p`
  color: #e07a5f;
  text-align: center;
  margin: 0;
`;

const WaveButton = styled.button`
  align-self: center;
  padding: 10px 32px;
  border-radius: 8px;
  border: none;
  background: #8b2635;
  color: #e8ded2;
  font-size: 16px;
  cursor: pointer;
`;

interface Props {
  /** テスト用: シード指定で決定的なランにする */
  seed?: number;
}

export const AshenRampartGame: React.FC<Props> = ({ seed }) => {
  const rng = useMemo(
    () => (seed !== undefined ? new SeededRandom(seed) : new DefaultRandom()),
    [seed]
  );
  const game = useAshenRampartGame(rng);
  const { run, selectedHandIndex, replayTick, error } = game;

  const enemies =
    run.phase === 'combat' && run.lastResult
      ? (run.lastResult.ticks[Math.min(replayTick, run.lastResult.ticks.length - 1)]
          ?.enemies ?? [])
      : [];

  const placingType = useMemo(() => {
    if (selectedHandIndex === null) return null;
    const cardId = run.deck.hand[selectedHandIndex];
    if (cardId === undefined) return null;
    const type = getCardDefinition(cardId).type;
    return type === 'tower' || type === 'trap' ? type : null;
  }, [selectedHandIndex, run.deck.hand]);

  return (
    <Container>
      <Title>灰燼の城壁</Title>
      <StatusBar run={run} />
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {run.phase === 'result' ? (
        <ResultPanel run={run} onRestart={game.restart} />
      ) : (
        <>
          <BoardGrid
            board={run.board}
            enemies={enemies}
            placingType={placingType}
            onCellClick={game.placeAt}
          />
          {run.phase === 'preparation' && (
            <>
              <HandArea
                hand={run.deck.hand}
                mana={run.mana}
                selectedIndex={selectedHandIndex}
                onSelect={game.selectCard}
              />
              <WaveButton onClick={game.beginWave}>ウェーブ開始</WaveButton>
            </>
          )}
          {run.phase === 'combat' && <ErrorText as="p">⚔️ 戦闘中…</ErrorText>}
          {run.phase === 'reward' && (
            <RewardPanel choices={run.rewardChoices} onPick={game.pickReward} />
          )}
        </>
      )}
    </Container>
  );
};
```

```ts
// src/features/ashen-rampart/index.ts
/**
 * 灰燼の城壁 - ASHEN RAMPART
 * デッキ構築×タワーディフェンスのローグライト
 */
export { AshenRampartGame } from './presentation/AshenRampartGame';
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/presentation`
Expected: PASS（フックテスト＋コンポーネントテスト全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat: 灰燼の城壁 P1プレースホルダUI（盤面・手札・報酬・リザルト）を追加"
```

---

### Task 11: ページ・ルーティング・ゲーム一覧登録・CI

**Files:**
- Create: `src/pages/AshenRampartPage.tsx`
- Modify: `src/App.tsx`（lazy import とルート追加）
- Modify: `src/pages/GameListPage.tsx`（一覧エントリ追加）
- Test: 既存テストの回帰確認（`npm run ci`）

**Interfaces:**
- Consumes: `AshenRampartGame`（Task 10）
- Produces: ルート `/ashen-rampart`

- [ ] **Step 1: ページコンポーネントを作成**

```tsx
// src/pages/AshenRampartPage.tsx
/**
 * 灰燼の城壁 ゲームページ
 */
import React from 'react';
import { AshenRampartGame } from '../features/ashen-rampart';

const AshenRampartPage: React.FC = () => {
  return <AshenRampartGame />;
};

export default AshenRampartPage;
```

- [ ] **Step 2: App.tsx にルートを追加**

lazy import 群の末尾（`PrimalPathPage` の下）に追加:

```tsx
const AshenRampartPage = lazy(
  () => import(/* webpackChunkName: "AshenRampartPage" */ './pages/AshenRampartPage')
);
```

`<Route path="/primal-path" ...>` の行の直後に追加:

```tsx
<Route path="/ashen-rampart" element={<GamePageWrapper><AshenRampartPage /></GamePageWrapper>} />
```

- [ ] **Step 3: GameListPage.tsx に一覧エントリを追加**

まず `GameCardData` 型の `importImage` が必須か確認する:

```bash
grep -n "importImage" src/pages/GameListPage.tsx | head -5
```

- **任意（`importImage?:`）の場合**: `importImage` なしでエントリを追加
- **必須の場合**: P1 ではカード背景画像が未制作のため、既存アセットをプレースホルダとして複製する（P3 で正式画像に差し替え）:

```bash
cp src/assets/images/primal_path_card_bg.webp src/assets/images/ashen_rampart_card_bg.webp
```

`GAME_CARDS` 配列の末尾（primal-path エントリの後）に追加:

```tsx
{
  id: 'ashen-rampart',
  path: '/ashen-rampart',
  title: '灰燼の城壁 - ASHEN RAMPART',
  description:
    'カードで砦を築くデッキ構築×タワーディフェンス。手札からタワーと罠を配置し、魔物のウェーブを凌ぎ切れ。報酬でデッキを育てるローグライト。',
  ariaLabel: '灰燼の城壁 - ASHEN RAMPART ゲームをプレイする',
  imageAriaLabel: '灰燼の城壁 - ASHEN RAMPARTのゲーム画面プレビュー',
  importImage: () =>
    import(/* webpackChunkName: "img-ashen-rampart" */ '../assets/images/ashen_rampart_card_bg.webp'),
},
```

- [ ] **Step 4: ゲーム数を検証している既存テストを探して更新**

```bash
grep -rn "GAME_CARDS\|toHaveLength(13)\|13タイトル\|13本" src --include="*.test.*" --include="*.spec.*" | head
grep -rn "13" e2e/ tests/ 2>/dev/null | head
```

ゲーム総数を assert しているテストが見つかったら 14 に更新する。見つからなければ何もしない。

- [ ] **Step 5: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: lint:ci / typecheck / test / build すべて成功

E2E（Playwright）はローカル実行不可のため、PR の CI で確認する。

- [ ] **Step 6: コミット**

```bash
git add src/pages src/App.tsx src/assets 2>/dev/null || git add src/pages src/App.tsx
git commit -m "feat: 灰燼の城壁 ページ・ルーティング・ゲーム一覧登録を追加"
```

- [ ] **Step 7: 動作確認（手動プレイ）**

`npm start` で開発サーバーを起動し、`/ashen-rampart` で1ラン通しプレイして以下を確認:

- タワー配置 → ウェーブ開始 → 敵が経路を進む → 報酬選択 → 3ウェーブ目クリアで勝利画面
- タワーを置かない場合、ライフが減り続けて敗北画面が出る

- [ ] **Step 8: PR 作成**

```bash
git push -u origin feature/ashen-rampart-p1
gh pr create --title "feat: 灰燼の城壁 ASHEN RAMPART P1基盤（デッキ構築×TD）" --body "$(cat <<'EOF'
## 概要
新規ゲーム14本目「灰燼の城壁 - ASHEN RAMPART」の P1 基盤。
デッキ構築×タワーディフェンスのローグライト。設計書: docs/superpowers/specs/2026-07-16-ashen-rampart-design.md

## 変更内容
- domain: カード8種・デッキ操作・平原マップ・敵3種・3ウェーブ・決定的戦闘シミュレーション
- application: start-run / play-card / start-wave / finish-wave / choose-reward ユースケース + RandomPort
- infrastructure: mulberry32 シード付き乱数
- presentation: プレースホルダUI（P3 で Canvas エフェクト層に強化予定）
- ルーティング・ゲーム一覧登録

## テスト方法
- [ ] npm run ci が全パス
- [ ] /ashen-rampart で1ラン完走（勝利・敗北の両方）
EOF
)"
```

---

## P1 完了条件

- [ ] `npm run ci` 全パス
- [ ] `/ashen-rampart` で1ラン（3ウェーブ）を勝利・敗北の両方で完走できる
- [ ] domain のテストカバレッジ 90%+（`npm run test:coverage` で確認）
- [ ] PR 作成・CI（E2E 含む）グリーン

## P2 以降への申し送り

- ステージ2/3・分岐選択・ボス・飛行敵・聖光の尖塔 → P2
- Canvas エフェクト層・カードアニメーション・背景アート・カード背景画像の正式版 → P3
- バランス較正・ヘッドレス sim・スコア記録(StoragePort) → P4
- `useAshenRampartGame` の戦闘リプレイは P3 で Canvas 層と同期する際に rAF ベースへの移行を検討
