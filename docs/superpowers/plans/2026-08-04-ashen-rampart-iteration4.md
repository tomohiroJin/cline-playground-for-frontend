# 灰燼の城壁 反復4 実装計画 — 盤面とカードの表現

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 盤面の設置物と手札のカードに「形 × サイズ × 文字」の符号を与え、置いたもの・持っている札が何であるかを見て分かるようにする。

**Architecture:** プレゼンテーション層に閉じる。`enemy-visual.ts`（敵の「形 × サイズ × 色」）の対称物として `unit-visual.ts`（カードの「形 × サイズ × 文字」）を新設し、`board-plates.ts` が `CombatState` を描画用モデルへ変換、`UnitPlate` / `PlacedStatusBar` が描画する。**ドメイン層のファイルは1つも変更しない。**

**Tech Stack:** React 19 + styled-components + TypeScript / Jest 30 + @testing-library/react

設計書: `docs/superpowers/specs/2026-08-04-ashen-rampart-iteration4-design.md`

## Global Constraints

- **ドメイン層（`src/features/ashen-rampart/domain/`）を変更しない。** ルールが変わらないことが判定の前提（設計書 §3.1）
- **新しい色を追加しない。** `presentation/theme.ts` の6トークン（`dominant` / `secondary` / `danger` / `dangerText` / `opportunity` / `grid`）のみ使う
- **情報を色だけに載せない。** グレースケールでも形とサイズで判別できること
- `any` 型の使用禁止（`unknown` + 型ガード）
- コメント・docstring は日本語。変数名・関数名は英語
- ファイル名は kebab-case、コンポーネントは PascalCase、定数は UPPER_SNAKE_CASE
- マジックナンバーは名前付き定数にする
- 関数は30行以内・パラメータ3個以内を目安。コンポーネントは200行以内を目安
- アニメーションは300ms 以内、`prefers-reduced-motion: reduce` で無効化
- 各タスクの最後に必ずコミットする。コミットメッセージは Conventional Commits（日本語本文）

---

## ファイル構成

**新規作成**

| ファイル | 責務 |
|---|---|
| `src/features/ashen-rampart/presentation/unit-visual.ts` | 純粋。カードID → 役割・文字・サイズ。`enemy-visual.ts` の対称物 |
| `src/features/ashen-rampart/presentation/unit-visual.test.ts` | 上のテスト（網羅・一意性・分岐） |
| `src/features/ashen-rampart/presentation/board-plates.ts` | 純粋。`CombatState` → 台座モデル配列（位置・状態バー・発射中フラグ） |
| `src/features/ashen-rampart/presentation/board-plates.test.ts` | 上のテスト |
| `src/features/ashen-rampart/presentation/UnitPlate.tsx` | 台座1つの描画（形・サイズ・文字） |
| `src/features/ashen-rampart/presentation/UnitPlate.test.tsx` | 上のテスト |
| `src/features/ashen-rampart/presentation/PlacedStatusBar.tsx` | 状態バー1本の描画（意味は役割が決める） |
| `src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx` | 上のテスト |
| `src/features/ashen-rampart/presentation/CardGlyph.tsx` | 手札・デッキ構築で使う小さな形アイコン |
| `src/features/ashen-rampart/presentation/CardGlyph.test.tsx` | 上のテスト |
| `src/features/ashen-rampart/presentation/InspectPanel.tsx` | 要求時の能力チップ（盤面外） |
| `src/features/ashen-rampart/presentation/InspectPanel.test.tsx` | 上のテスト |
| `src/features/ashen-rampart/presentation/RangeOverlay.tsx` | 射程リング／隣接枠の描画 |
| `src/features/ashen-rampart/presentation/RangeOverlay.test.tsx` | 上のテスト |

**変更**

| ファイル | 変更内容 |
|---|---|
| `presentation/card-text.ts` | `cardStatsOf` / `cardBadgesOf` を追加 |
| `presentation/BoardGrid.tsx` | `occupantLabel` を撤去し台座レイヤへ差し替え。設置済みセルでレーン印・矢印を隠す |
| `presentation/UnitHpBar.tsx` | **削除**（`PlacedStatusBar.tsx` が置き換える） |
| `presentation/HandArea.tsx` | 形アイコン・数値・バッジを追加 |
| `presentation/DeckBuilder.tsx` | 形アイコンを追加 |
| `presentation/useAshenRampartGame.ts` | 能力表示の状態、UI カウンタ、`run_tally` の記録 |
| `presentation/AshenRampartGame.tsx` | `InspectPanel` の配置、コピーボタンの文言 |
| `application/ports/play-log-port.ts` | `CURRENT_ITERATION` を 4 に、イベント3種を追加 |
| `infrastructure/play-log/local-storage-play-log.ts` | スキーマ v3・キー変更 |

---

## Task 1: `unit-visual.ts` — 符号体系の純粋関数

**Files:**
- Create: `src/features/ashen-rampart/presentation/unit-visual.ts`
- Test: `src/features/ashen-rampart/presentation/unit-visual.test.ts`

**Interfaces:**
- Consumes: `getCardDefinition` / `CARD_IDS`（`domain/cards/card-pool`）、`CardDefinition`（`domain/cards/card-definition`）
- Produces:
  - `type UnitRole = 'attacker' | 'support' | 'wall' | 'trap' | 'reactor' | 'ember' | 'spell' | 'levy'`
  - `interface UnitVisual { name: string; role: UnitRole; glyph: string; sizePct: number; isWide: boolean }`
  - `roleOf(card: CardDefinition): UnitRole`
  - `getUnitVisual(cardId: string): UnitVisual`
  - `sizePctOf(cost: number): number`
  - `getRoleClipPath(role: UnitRole): string | undefined`
  - `roleLabelOf(role: UnitRole): string`
  - `MISSING_GLYPH_IDS: readonly string[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/unit-visual.test.ts`:

```ts
/**
 * カードの視覚表現のテスト
 *
 * カードは「形 × サイズ × 文字」の3重符号で区別する。敵（enemy-visual.ts）が
 * 色を使うのに対し、こちらは文字を使う。theme.ts の6トークンを増やさないため。
 * グレースケールでも (形, サイズ) だけで一意に定まることが要件（設計書 §4.5）。
 */
import {
  getUnitVisual,
  getRoleClipPath,
  roleLabelOf,
  roleOf,
  sizePctOf,
  MISSING_GLYPH_IDS,
} from './unit-visual';
import { CARD_IDS, getCardDefinition } from '../domain/cards/card-pool';

describe('unit-visual の網羅', () => {
  it('14種すべてに文字が定義されている', () => {
    expect(MISSING_GLYPH_IDS).toEqual([]);
    expect(CARD_IDS).toHaveLength(14);
  });

  it('未知のカードIDは契約違反として例外', () => {
    expect(() => getUnitVisual('unknown-card')).toThrow();
  });
});

describe('roleOf', () => {
  it.each([
    ['arrow-tower', 'attacker'],
    ['ballista', 'attacker'],
    ['cannon-tower', 'attacker'],
    ['piercer', 'attacker'],
    ['catapult', 'attacker'],
    ['beacon', 'support'],
    ['forge', 'support'],
    ['stone-wall', 'wall'],
    ['spike-trap', 'trap'],
    ['snare-net', 'trap'],
    ['reactor', 'reactor'],
    ['ember-blast', 'ember'],
    ['mud-time', 'spell'],
    ['levy', 'levy'],
  ])('%s は %s', (cardId, expected) => {
    expect(roleOf(getCardDefinition(cardId))).toBe(expected);
  });
});

describe('sizePctOf', () => {
  it('コスト0が最小45%、コスト5が最大85%', () => {
    expect(sizePctOf(0)).toBe(45);
    expect(sizePctOf(5)).toBe(85);
  });

  it('コストが1上がるごとに8%widen する', () => {
    expect(sizePctOf(3) - sizePctOf(2)).toBe(8);
  });
});

describe('符号の一意性（グレースケール要件）', () => {
  it('(役割, サイズ, 横長) の組が14種で重複しない', () => {
    const keys = CARD_IDS.map((id) => {
      const v = getUnitVisual(id);
      return `${v.role}:${v.sizePct}:${v.isWide}`;
    });
    expect(new Set(keys).size).toBe(CARD_IDS.length);
  });

  it('文字も14種で重複しない', () => {
    const glyphs = CARD_IDS.map((id) => getUnitVisual(id).glyph);
    expect(new Set(glyphs).size).toBe(CARD_IDS.length);
  });
});

describe('形とラベル', () => {
  it('石壁だけが横長プレート', () => {
    expect(getUnitVisual('stone-wall').isWide).toBe(true);
    expect(getUnitVisual('arrow-tower').isWide).toBe(false);
  });

  it('円と横長長方形は clip-path を使わない（border-radius で描くため）', () => {
    expect(getRoleClipPath('support')).toBeUndefined();
    expect(getRoleClipPath('wall')).toBeUndefined();
    expect(getRoleClipPath('attacker')).toContain('polygon');
  });

  it('役割の日本語ラベルが引ける（aria-label 用）', () => {
    expect(roleLabelOf('attacker')).toBe('攻撃塔');
    expect(roleLabelOf('reactor')).toBe('魔力炉');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/unit-visual.test.ts`
Expected: FAIL — `Cannot find module './unit-visual'`

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/unit-visual.ts`:

```ts
/**
 * 灰燼の城壁 - カードの視覚表現マッピング（純粋）
 *
 * enemy-visual.ts の対称物。敵を「形 × サイズ × 色」で区別するのに対し、
 * カードは「形 × サイズ × 文字」で区別する。色を使わないのは theme.ts の
 * 6トークンを増やさないため（設計書 §9.4）。
 *
 * (役割, サイズ) の組が14種で一意になることをテストで保証している。
 * これによりグレースケールでも——文字が読めない小ささでも——識別できる。
 */
import type { CardDefinition } from '../domain/cards/card-definition';
import { CARD_IDS, getCardDefinition } from '../domain/cards/card-pool';

export type UnitRole =
  | 'attacker'
  | 'support'
  | 'wall'
  | 'trap'
  | 'reactor'
  | 'ember'
  | 'spell'
  | 'levy';

export interface UnitVisual {
  name: string;
  role: UnitRole;
  /** 個体を表す1文字 */
  glyph: string;
  /** セル辺に対する台座の辺長（%） */
  sizePct: number;
  /**
   * 横長プレートにするか（石壁のみ）
   *
   * サイズはコスト＝投資額を表すため、コスト1でHP60の石壁は小さくなる。
   * 横長にして面積を稼ぎ「硬さ」の直感との乖離を緩和する（設計書 §4.3）。
   */
  isWide: boolean;
}

const GLYPHS: Readonly<Record<string, string>> = {
  reactor: '炉',
  'arrow-tower': '弓',
  ballista: '弩',
  'cannon-tower': '砲',
  piercer: '徹',
  catapult: '投',
  forge: '鍛',
  beacon: '篝',
  'stone-wall': '壁',
  'spike-trap': '棘',
  'snare-net': '網',
  'ember-blast': '燠',
  'mud-time': '泥',
  levy: '徴',
};

/** 文字が全カードを網羅していることを起動時に保証する（card-text.ts と同じ取り漏れ検出） */
export const MISSING_GLYPH_IDS: readonly string[] = CARD_IDS.filter(
  (id) => GLYPHS[id] === undefined
);

const SIZE_BASE_PCT = 45;
const SIZE_PER_COST_PCT = 8;

/** コスト（投資額）を台座の辺長（セル辺に対する%）へ写す */
export const sizePctOf = (cost: number): number => SIZE_BASE_PCT + SIZE_PER_COST_PCT * cost;

/**
 * カードの役割を導出する
 *
 * 3つの塔系（攻撃塔・支援塔・壁）は damage と aura の有無で排他に分かれる。
 * 篝火・鍛冶場・石壁はいずれも damage 0 で、石壁だけ aura を持たない。
 */
export const roleOf = (card: CardDefinition): UnitRole => {
  if (card.type === 'trap') return 'trap';
  if (card.type === 'reactor') return 'reactor';
  if (card.type === 'ember') return 'ember';
  if (card.type === 'spell') return 'spell';
  if (card.type === 'levy') return 'levy';
  const tower = card.tower;
  if (!tower) throw new Error(`塔の性能を持たないカードIDです: ${card.id}`);
  if (tower.damage > 0) return 'attacker';
  if (tower.aura) return 'support';
  return 'wall';
};

export const getUnitVisual = (cardId: string): UnitVisual => {
  const card = getCardDefinition(cardId);
  const glyph = GLYPHS[cardId];
  if (glyph === undefined) throw new Error(`文字が未定義のカードIDです: ${cardId}`);
  const role = roleOf(card);
  return { name: card.name, role, glyph, sizePct: sizePctOf(card.cost), isWide: role === 'wall' };
};

const CLIP_PATHS: Readonly<Partial<Record<UnitRole, string>>> = {
  attacker: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  trap: 'polygon(0% 0%, 100% 0%, 50% 100%)',
  reactor: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  ember: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
  spell: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  levy: 'polygon(50% 0%, 100% 100%, 0% 100%)',
};

/** CSS clip-path の値。円（支援塔）と横長長方形（壁）は border-radius で描くため持たない */
export const getRoleClipPath = (role: UnitRole): string | undefined => CLIP_PATHS[role];

const ROLE_LABELS: Readonly<Record<UnitRole, string>> = {
  attacker: '攻撃塔',
  support: '支援塔',
  wall: '壁',
  trap: '罠',
  reactor: '魔力炉',
  ember: '燠火',
  spell: '呪文',
  levy: '徴発',
};

/** 役割の日本語ラベル（aria-label と能力チップで使う） */
export const roleLabelOf = (role: UnitRole): string => ROLE_LABELS[role];
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/unit-visual.test.ts`
Expected: PASS（全ケース）

- [ ] **Step 5: 型チェックと lint**

Run: `npm run typecheck && npx eslint src/features/ashen-rampart/presentation/unit-visual.ts src/features/ashen-rampart/presentation/unit-visual.test.ts`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/unit-visual.ts src/features/ashen-rampart/presentation/unit-visual.test.ts
git commit -m "feat(ashen-rampart): カードの符号体系を形・サイズ・文字で定義する

敵にだけ存在した視覚符号の規約を守り手側へ対称適用する。
色の代わりに文字を使うため theme.ts の6トークンを増やさない。
(役割, サイズ) の組が14種で一意になることをテストで保証し、
グレースケールでも識別できることを機械的に担保する。"
```

---

## Task 2: `board-plates.ts` — 戦闘状態から台座モデルへ

**Files:**
- Create: `src/features/ashen-rampart/presentation/board-plates.ts`
- Test: `src/features/ashen-rampart/presentation/board-plates.test.ts`

**Interfaces:**
- Consumes: `getUnitVisual` / `UnitVisual`（Task 1）、`CombatState`（`domain/combat/combat-state`）、`CellPos`（`domain/board/stage-map`）
- Produces:
  - `interface PlateModel { key: string; cardId: string; pos: CellPos; visual: UnitVisual; statusNow: number; statusMax: number; statusLabel: string; isFiring: boolean }`
  - `buildPlates(state: CombatState): PlateModel[]`
  - `plateKeyOf(pos: CellPos): string`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/board-plates.test.ts`:

```ts
/**
 * 台座モデルのテスト
 *
 * 状態バーは常に1本で、意味は役割が決める（設計書 §5.1）。
 * 守り手=残HP、罠=残り回数、燠=再点火の進捗、炉=マナ生成の進捗。
 */
import { buildPlates } from './board-plates';
import type { CombatState } from '../domain/combat/combat-state';

/** テスト用に必要な部分だけ持つ CombatState を組む */
const stateWith = (partial: Partial<CombatState>): CombatState =>
  ({ units: [], traps: [], reactors: [], embers: [], ...partial }) as CombatState;

describe('buildPlates', () => {
  it('守り手のバーは残HPを表す', () => {
    const plates = buildPlates(
      stateWith({
        units: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 4, maxHp: 8, cooldownLeft: 0 },
        ],
      })
    );
    expect(plates).toHaveLength(1);
    expect(plates[0].statusNow).toBe(4);
    expect(plates[0].statusMax).toBe(8);
    expect(plates[0].statusLabel).toBe('弓兵 の耐久');
    expect(plates[0].visual.glyph).toBe('弓');
  });

  it('罠のバーは残り発動回数を表す', () => {
    const plates = buildPlates(
      stateWith({
        traps: [{ cardId: 'spike-trap', pos: { x: 2, y: 2 }, usesLeft: 2, hitEnemyIds: [] }],
      })
    );
    expect(plates[0].statusNow).toBe(2);
    expect(plates[0].statusMax).toBe(3);
    expect(plates[0].statusLabel).toBe('棘罠 の残り回数');
  });

  it('燠火のバーは再点火までの進捗を表す（残りではなく経過）', () => {
    const plates = buildPlates(
      stateWith({ embers: [{ pos: { x: 3, y: 3 }, cooldownLeft: 0, radius: 2 }] })
    );
    // cooldownLeft 0 = 再点火可能 = 満タン
    expect(plates[0].statusNow).toBe(plates[0].statusMax);
    expect(plates[0].visual.glyph).toBe('燠');
  });

  it('魔力炉のバーは次のマナ生成までの進捗を表す', () => {
    const plates = buildPlates(
      stateWith({ reactors: [{ pos: { x: 4, y: 4 }, ticksToMana: 0 }] })
    );
    expect(plates[0].statusNow).toBe(plates[0].statusMax);
    expect(plates[0].statusLabel).toBe('魔力炉 のマナ生成');
  });

  it('撃った直後の攻撃塔は isFiring になる', () => {
    // 弓兵の cooldownTicks は 8。撃った tick に cooldownLeft が最大へ戻る
    const fired = buildPlates(
      stateWith({
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 8 }],
      })
    );
    const idle = buildPlates(
      stateWith({
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 2 }],
      })
    );
    expect(fired[0].isFiring).toBe(true);
    expect(idle[0].isFiring).toBe(false);
  });

  it('攻撃しない守り手は isFiring にならない（cooldownTicks が 0 のため）', () => {
    const plates = buildPlates(
      stateWith({
        units: [{ cardId: 'stone-wall', pos: { x: 1, y: 1 }, hp: 60, maxHp: 60, cooldownLeft: 0 }],
      })
    );
    expect(plates[0].isFiring).toBe(false);
  });

  it('4種の設置物が同時にあってもすべて台座になる', () => {
    const plates = buildPlates(
      stateWith({
        units: [{ cardId: 'ballista', pos: { x: 0, y: 0 }, hp: 12, maxHp: 12, cooldownLeft: 0 }],
        traps: [{ cardId: 'snare-net', pos: { x: 1, y: 0 }, usesLeft: 3, hitEnemyIds: [] }],
        reactors: [{ pos: { x: 2, y: 0 }, ticksToMana: 5 }],
        embers: [{ pos: { x: 3, y: 0 }, cooldownLeft: 10, radius: 2 }],
      })
    );
    expect(plates.map((p) => p.visual.glyph).sort()).toEqual(['弩', '燠', '炉', '網'].sort());
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/board-plates.test.ts`
Expected: FAIL — `Cannot find module './board-plates'`

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/board-plates.ts`:

```ts
/**
 * 灰燼の城壁 - 盤面の台座モデル（純粋）
 *
 * CombatState を描画用の配列へ変換する。状態バーは常に1本で、
 * 意味は役割が決める（設計書 §5.1）。UnitPlate / PlacedStatusBar は
 * この結果を描くだけにし、意味の判断をここへ集約する。
 */
import type { CellPos } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { getCardDefinition } from '../domain/cards/card-pool';
import { getUnitVisual, type UnitVisual } from './unit-visual';

/**
 * PlacedReactor と PlacedEmber は cardId を持たない（combat-state.ts）ため、
 * 「炉カードは1種・燠カードは1種」というカードプールの前提に依存する。
 * これは run-summary.ts が撃破の帰属で抱えているのと同じ制約であり、
 * 2種類目を追加した瞬間に静かに誤表示する。そのときはドメインに cardId を
 * 持たせる変更とセットで直すこと。
 */
const REACTOR_CARD_ID = 'reactor';
const EMBER_CARD_ID = 'ember-blast';

export interface PlateModel {
  /** React の key。1マスに設置物は1つまでなので座標で一意 */
  key: string;
  cardId: string;
  pos: CellPos;
  visual: UnitVisual;
  /** 状態バーの現在値。statusMax が 0 のときバーは描かない */
  statusNow: number;
  statusMax: number;
  /** 状態バーの意味（aria-label に使う） */
  statusLabel: string;
  /** この tick に撃ったか（台座を脈動させる） */
  isFiring: boolean;
}

export const plateKeyOf = (pos: CellPos): string => `${pos.x},${pos.y}`;

const plateOf = (
  cardId: string,
  pos: CellPos,
  status: { now: number; max: number; suffix: string },
  isFiring = false
): PlateModel => {
  const visual = getUnitVisual(cardId);
  return {
    key: plateKeyOf(pos),
    cardId,
    pos,
    visual,
    statusNow: status.now,
    statusMax: status.max,
    statusLabel: `${visual.name} ${status.suffix}`,
    isFiring,
  };
};

/**
 * 設置物すべてを台座モデルへ変換する
 *
 * 攻撃直後の判定は cooldownLeft が最大に戻ったことで見る。stepTick は
 * 撃った tick に cooldownLeft を cooldownTicks へ戻すため、エフェクト層を
 * 参照せずに「今撃った」が分かる。
 */
export const buildPlates = (state: CombatState): PlateModel[] => {
  const plates: PlateModel[] = [];

  state.units.forEach((unit) => {
    const tower = getCardDefinition(unit.cardId).tower;
    const cooldownTicks = tower?.cooldownTicks ?? 0;
    const isFiring = cooldownTicks > 0 && unit.cooldownLeft >= cooldownTicks;
    plates.push(
      plateOf(unit.cardId, unit.pos, { now: unit.hp, max: unit.maxHp, suffix: 'の耐久' }, isFiring)
    );
  });

  state.traps.forEach((trap) => {
    const uses = getCardDefinition(trap.cardId).trap?.uses ?? 0;
    plates.push(
      plateOf(trap.cardId, trap.pos, { now: trap.usesLeft, max: uses, suffix: 'の残り回数' })
    );
  });

  state.reactors.forEach((reactor) => {
    const interval = getCardDefinition(REACTOR_CARD_ID).reactor?.intervalTicks ?? 0;
    plates.push(
      plateOf(REACTOR_CARD_ID, reactor.pos, {
        now: interval - reactor.ticksToMana,
        max: interval,
        suffix: 'のマナ生成',
      })
    );
  });

  state.embers.forEach((ember) => {
    const cooldown = getCardDefinition(EMBER_CARD_ID).ember?.cooldownTicks ?? 0;
    plates.push(
      plateOf(EMBER_CARD_ID, ember.pos, {
        now: cooldown - ember.cooldownLeft,
        max: cooldown,
        suffix: 'の再点火',
      })
    );
  });

  return plates;
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/board-plates.test.ts`
Expected: PASS

> テストが「弓兵の cooldownTicks は 8」を前提にしている。実際の値が違って落ちた場合は、**テスト側の期待値をカードプールの実測値へ合わせる**（実装を曲げない）。`grep -n "arrow-tower" -A 6 src/features/ashen-rampart/domain/cards/card-pool.ts` で確認する。

- [ ] **Step 5: 型チェックと lint**

Run: `npm run typecheck && npx eslint src/features/ashen-rampart/presentation/board-plates.ts src/features/ashen-rampart/presentation/board-plates.test.ts`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/board-plates.ts src/features/ashen-rampart/presentation/board-plates.test.ts
git commit -m "feat(ashen-rampart): 設置物を台座モデルへ変換する純粋関数を追加する

状態バーを1本に統一し、意味は役割が決める規約をここへ集約する。
これまで見えなかった罠の残り回数・燠火の再点火・魔力炉のマナ生成が
守り手のHPと同じ形で読めるようになる。ドメインの追加は不要で、
既存の状態フィールドだけから計算している。"
```

---

## Task 3: `UnitPlate.tsx` — 台座の描画

**Files:**
- Create: `src/features/ashen-rampart/presentation/UnitPlate.tsx`
- Test: `src/features/ashen-rampart/presentation/UnitPlate.test.tsx`

**Interfaces:**
- Consumes: `PlateModel`（Task 2）、`getRoleClipPath` / `roleLabelOf`（Task 1）、`COLORS`（`./theme`）
- Produces: `UnitPlate: React.FC<{ plate: PlateModel; columns: number; rows: number }>`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/UnitPlate.test.tsx`:

```tsx
/**
 * 台座の描画テスト
 *
 * 台座は「形（役割）× サイズ（コスト）× 文字（個体）」を担う。
 * 敵マーカーと混同しないよう pointer-events を持たず、セルのボタンが
 * クリックを受ける（UnitHpBar と同じ方針）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UnitPlate } from './UnitPlate';
import { buildPlates } from './board-plates';
import type { CombatState } from '../domain/combat/combat-state';

const plateFor = (cardId: string) =>
  buildPlates({
    units: [{ cardId, pos: { x: 2, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
    traps: [],
    reactors: [],
    embers: [],
  } as unknown as CombatState)[0];

describe('UnitPlate', () => {
  it('個体を表す文字を描く', () => {
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByText('弓')).toBeInTheDocument();
  });

  it('役割と個体名を aria-label に持つ', () => {
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByLabelText('攻撃塔 弓兵')).toBeInTheDocument();
  });

  it('石壁は横長プレートになる', () => {
    render(<UnitPlate plate={plateFor('stone-wall')} columns={9} rows={7} />);
    expect(screen.getByTestId('unit-plate-2-3')).toHaveAttribute('data-wide', 'true');
  });

  it('攻撃塔以外は data-role で区別できる', () => {
    render(<UnitPlate plate={plateFor('beacon')} columns={9} rows={7} />);
    expect(screen.getByTestId('unit-plate-2-3')).toHaveAttribute('data-role', 'support');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/UnitPlate.test.tsx`
Expected: FAIL — `Cannot find module './UnitPlate'`

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/UnitPlate.tsx`:

```tsx
/**
 * 灰燼の城壁 - 設置物の台座
 *
 * 形＝役割、サイズ＝コスト、文字＝個体の3重符号を描く（設計書 §4）。
 * 敵マーカーが「動く小さな塗り」なのに対し、台座は「固定された大きな枠」で
 * 図と地を分ける。クリックは下のセルボタンが受けるため pointer-events を持たない。
 *
 * z 順序: 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
 * 台座はセルの地であり、攻撃エフェクトを隠してはならない。
 */
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { PlateModel } from './board-plates';
import { getRoleClipPath, roleLabelOf } from './unit-visual';
import { COLORS } from './theme';

/** 撃った瞬間だけ脈動させる。装飾ではなく「今起きたこと」の合図 */
const firePulse = keyframes`
  from { opacity: 0.95; }
  to { opacity: 0.45; }
`;

const PLATE_BACKGROUND = 'rgba(232, 222, 210, 0.14)';

/** 石壁の横長プレート。セル辺に対する幅・高さの割合（%） */
const WIDE_WIDTH_PCT = 90;
const WIDE_HEIGHT_PCT = 45;

const Plate = styled.div<{
  $left: number;
  $top: number;
  $widthCqw: number;
  $heightCqw: number;
  $wide: boolean;
  $clipPath?: string;
  $firing: boolean;
}>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(-50%, -50%);
  width: ${({ $widthCqw }) => $widthCqw}cqw;
  height: ${({ $heightCqw }) => $heightCqw}cqw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${PLATE_BACKGROUND};
  border: 1px solid ${COLORS.secondary};
  border-radius: ${({ $wide, $clipPath }) => ($wide ? '4px' : $clipPath ? '0' : '50%')};
  ${({ $clipPath }) => ($clipPath ? css`clip-path: ${$clipPath};` : '')}
  color: ${COLORS.secondary};
  font-size: 12px;
  line-height: 1;
  z-index: 0;
  pointer-events: none;

  ${({ $firing }) =>
    $firing
      ? css`
          animation: ${firePulse} 150ms ease-out alternate 2;
        `
      : ''}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

interface Props {
  plate: PlateModel;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
}

export const UnitPlate: React.FC<Props> = ({ plate, columns, rows }) => {
  const { visual, pos } = plate;
  // sizePct は「セル辺に対する割合」だが、cqw は「盤面幅に対する割合」。
  // セル辺は盤面幅の 1/columns なので、両者を掛けて cqw へ換算する。
  // 単位を混ぜると横長プレートだけ縮尺が狂うため、ここで一度に確定させる。
  const cellCqw = 100 / columns;
  const widthCqw = ((visual.isWide ? WIDE_WIDTH_PCT : visual.sizePct) / 100) * cellCqw;
  const heightCqw = ((visual.isWide ? WIDE_HEIGHT_PCT : visual.sizePct) / 100) * cellCqw;
  return (
    <Plate
      data-testid={`unit-plate-${pos.x}-${pos.y}`}
      data-role={visual.role}
      data-wide={visual.isWide ? 'true' : 'false'}
      aria-label={`${roleLabelOf(visual.role)} ${visual.name}`}
      $left={((pos.x + 0.5) / columns) * 100}
      $top={((pos.y + 0.44) / rows) * 100}
      $widthCqw={widthCqw}
      $heightCqw={heightCqw}
      $wide={visual.isWide}
      $clipPath={getRoleClipPath(visual.role)}
      $firing={plate.isFiring}
    >
      {visual.glyph}
    </Plate>
  );
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/UnitPlate.test.tsx`
Expected: PASS

- [ ] **Step 5: 型チェックと lint**

Run: `npm run typecheck && npx eslint src/features/ashen-rampart/presentation/UnitPlate.tsx src/features/ashen-rampart/presentation/UnitPlate.test.tsx`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/UnitPlate.tsx src/features/ashen-rampart/presentation/UnitPlate.test.tsx
git commit -m "feat(ashen-rampart): 設置物の台座を描くコンポーネントを追加する

形・サイズ・文字の3重符号を1つの要素で描く。敵マーカーとは
位置・サイズ・塗り・z順序の4点で図地が分かれるため、形が
一部重複しても誤読しない。撃った瞬間だけ150msの脈動を出し、
prefers-reduced-motion では止める。"
```

---

## Task 4: `PlacedStatusBar.tsx` — 状態バーの汎用化

**Files:**
- Create: `src/features/ashen-rampart/presentation/PlacedStatusBar.tsx`
- Create: `src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx`
- Delete: `src/features/ashen-rampart/presentation/UnitHpBar.tsx`（および同名のテストがあれば併せて削除）

**Interfaces:**
- Consumes: `PlateModel`（Task 2）、`HP_BAR_COLOR`（`./enemy-visual`）、`COLORS`（`./theme`）
- Produces: `PlacedStatusBar: React.FC<{ plate: PlateModel; columns: number; rows: number }>`

> **設計上の変更を明示する。** 旧 `UnitHpBar` はバー幅を `getHpBarWidthPct(maxHp)`（最大HP60を基準にした絶対スケール）で決めていた。新しいバーは**台座の幅に一致させる**。台座の幅はコスト＝投資額を表すため、バーの長さの意味も「硬さ」から「投資額」へ変わる。石壁は横長プレートなので依然として最も長いバーになる。**敵側の `getHpBarWidthPct` は変更しない**（S1 の教訓は敵の判別に必要なまま）。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx`:

```tsx
/**
 * 状態バーのテスト
 *
 * バーは常に1本で、意味は役割が決める（設計書 §5.1）。
 * 意味の切り替えは board-plates.ts が済ませているため、
 * ここでは「モデルどおりに描くこと」だけを検証する。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlacedStatusBar } from './PlacedStatusBar';
import { buildPlates } from './board-plates';
import type { CombatState } from '../domain/combat/combat-state';

const stateWith = (partial: Partial<CombatState>): CombatState =>
  ({ units: [], traps: [], reactors: [], embers: [], ...partial }) as CombatState;

describe('PlacedStatusBar', () => {
  it('守り手は残HPを progressbar として出す', () => {
    const plate = buildPlates(
      stateWith({
        units: [{ cardId: 'ballista', pos: { x: 1, y: 2 }, hp: 5, maxHp: 12, cooldownLeft: 0 }],
      })
    )[0];
    render(<PlacedStatusBar plate={plate} columns={9} rows={7} />);
    const bar = screen.getByRole('progressbar', { name: '弩砲 の耐久' });
    expect(bar).toHaveAttribute('aria-valuenow', '5');
    expect(bar).toHaveAttribute('aria-valuemax', '12');
  });

  it('罠は残り回数を出す', () => {
    const plate = buildPlates(
      stateWith({
        traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 2 }, usesLeft: 1, hitEnemyIds: [] }],
      })
    )[0];
    render(<PlacedStatusBar plate={plate} columns={9} rows={7} />);
    expect(screen.getByRole('progressbar', { name: '棘罠 の残り回数' })).toHaveAttribute(
      'aria-valuenow',
      '1'
    );
  });

  it('最大値が0のときはバーを描かない（0除算を避ける）', () => {
    const plate = buildPlates(
      stateWith({
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 0, maxHp: 0, cooldownLeft: 0 }],
      })
    )[0];
    const { container } = render(<PlacedStatusBar plate={plate} columns={9} rows={7} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx`
Expected: FAIL — `Cannot find module './PlacedStatusBar'`

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/PlacedStatusBar.tsx`:

```tsx
/**
 * 灰燼の城壁 - 設置物の状態バー
 *
 * バーは常に1本で、意味は台座の形が決める（設計書 §5.1）。守り手=残HP、
 * 罠=残り回数、燠火=再点火の進捗、魔力炉=マナ生成の進捗。プレイヤーが
 * 覚えるルールを1つに保ったまま、これまで見えなかった状態を可視化する。
 *
 * z 順序: 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
 * 反復2・3 と同じ理由で、エフェクトがバーを覆ってはならない。
 *
 * 幅は台座と一致させる（旧 UnitHpBar の最大HP絶対スケールから変更）。
 * サイズがコスト＝投資額を表す設計に合わせ、バーの長さの意味も揃える。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { HP_BAR_COLOR } from './enemy-visual';
import { COLORS } from './theme';

const WIDE_WIDTH_PCT = 90;

const Track = styled.div<{ $left: number; $top: number; $widthCqw: number }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  width: ${({ $widthCqw }) => $widthCqw}cqw;
  height: 3px;
  transform: translate(-50%, -50%);
  background: ${COLORS.grid};
  z-index: 2;
  pointer-events: none;
`;

const Fill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  background: ${HP_BAR_COLOR};
`;

interface Props {
  plate: PlateModel;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
}

export const PlacedStatusBar: React.FC<Props> = ({ plate, columns, rows }) => {
  if (plate.statusMax <= 0) return null;
  const { visual, pos } = plate;
  const cellCqw = 100 / columns;
  const widthCqw = ((visual.isWide ? WIDE_WIDTH_PCT : visual.sizePct) / 100) * cellCqw;
  return (
    <Track
      data-testid={`unit-status-${pos.x}-${pos.y}`}
      role="progressbar"
      aria-valuenow={plate.statusNow}
      aria-valuemin={0}
      aria-valuemax={plate.statusMax}
      aria-label={plate.statusLabel}
      $left={((pos.x + 0.5) / columns) * 100}
      // 台座の下端へ寄せ、文字と重ねない
      $top={((pos.y + 0.82) / rows) * 100}
      $widthCqw={widthCqw}
    >
      <Fill $ratio={plate.statusNow / plate.statusMax} />
    </Track>
  );
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx`
Expected: PASS

- [ ] **Step 5: 型チェックと lint**

Run: `npm run typecheck && npx eslint src/features/ashen-rampart/presentation/PlacedStatusBar.tsx src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx`
Expected: エラーなし

**旧 `UnitHpBar.tsx` はこのタスクでは削除しない。** `BoardGrid.tsx` がまだ参照しているため、削除すると型チェックが赤くなる。削除は参照が消える Task 5 で行う。**このタスクは緑で終わること。**

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/PlacedStatusBar.tsx src/features/ashen-rampart/presentation/PlacedStatusBar.test.tsx
git commit -m "feat(ashen-rampart): 状態バーを4種の設置物へ汎用化する

守り手のHPバーを PlacedStatusBar へ置き換え、罠の残り回数・
燠火の再点火・魔力炉のマナ生成も同じ1本のバーで表す。意味は
台座の形が決めるため、覚えるルールは増えない。

幅は台座に一致させた。旧 UnitHpBar は最大HP60の絶対スケール
だったが、サイズがコストを表す設計に合わせて意味を揃える。
敵側の getHpBarWidthPct は判別に必要なため変更しない。"
```

---

## Task 5: `BoardGrid.tsx` — 台座レイヤへの差し替え

**Files:**
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.test.tsx`
- Delete: `src/features/ashen-rampart/presentation/UnitHpBar.tsx`（および同名のテストがあれば併せて削除）

**Interfaces:**
- Consumes: `buildPlates` / `plateKeyOf`（Task 2）、`UnitPlate`（Task 3）、`PlacedStatusBar`（Task 4）、`roleLabelOf`（Task 1）
- Produces: `MAX_CELL_MARKS: number`（`BoardGrid.tsx` から named export）。Task 11 の検証で参照する

- [ ] **Step 1: 失敗するテストを書く**

`BoardGrid.test.tsx` の既存テスト（97行目付近）は占有ラベルに `塔` を期待している。次のテストへ置き換え、さらに新しいケースを追加する。

```tsx
  it('設置済みのマスは役割と個体名を aria-label に持つ', () => {
    // 既存の「1,1 設置可 塔」を期待していたケースの置き換え
    expect(screen.getByRole('button', { name: /1,1 設置可 攻撃塔 弓兵/ })).toBeInTheDocument();
  });

  it('設置済みのセルではレーン印と進行方向の矢印を隠す（情報量の上限）', () => {
    // 経路セルに守り手を置いた状態で描画する
    const cell = screen.getByTestId('cell-1-1');
    expect(cell.querySelectorAll('[data-mark="lane"]')).toHaveLength(0);
    expect(cell.querySelectorAll('[data-mark="arrow"]')).toHaveLength(0);
  });

  it('設置済みセルに常時描く印は MAX_CELL_MARKS 以下である', () => {
    // 台座・文字・状態バーの3つ。文字は台座の子なので要素数は台座1 + バー1
    const plates = screen.getAllByTestId(/^unit-plate-/);
    plates.forEach((plate) => {
      const pos = plate.getAttribute('data-testid')!.replace('unit-plate-', '');
      const marks = [
        plate,
        screen.queryByTestId(`unit-status-${pos}`),
        plate.textContent ? plate : null,
      ].filter(Boolean);
      expect(marks.length).toBeLessThanOrEqual(MAX_CELL_MARKS);
    });
  });
```

`MAX_CELL_MARKS` を `./BoardGrid` から import する。テストのセットアップは既存ファイルの流儀に合わせ、`state.units` に `{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 0 }` を含む状態を渡すこと。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/BoardGrid.test.tsx`
Expected: FAIL（`MAX_CELL_MARKS` が未エクスポート、および `攻撃塔 弓兵` が見つからない）

- [ ] **Step 3: 実装する**

`BoardGrid.tsx` を次のように直す。

1. import を差し替える

```tsx
import { buildPlates, plateKeyOf } from './board-plates';
import { UnitPlate } from './UnitPlate';
import { PlacedStatusBar } from './PlacedStatusBar';
import { roleLabelOf } from './unit-visual';
```

`import { UnitHpBar } from './UnitHpBar';` を削除する。

2. `occupantLabel` 関数（147〜157行）と `Occupant` styled コンポーネント（67〜70行）を**削除**する

3. 情報量の上限を定数化する

```tsx
/**
 * 設置済みセルに常時描く印の上限（台座・文字・状態バー）
 *
 * 反復2 の MAX_CONCURRENT_EFFECTS と同じ考え方。情報を足すほど盤面は
 * 読めなくなるため、上限を定数で持ち、テストで機械的に守る（設計書 §4.6）。
 */
export const MAX_CELL_MARKS = 3;
```

4. `LaneMark` と `CellArrow` に `data-mark` 属性を足す

```tsx
<LaneMark data-mark="lane" aria-hidden="true" $shape={...} />
<CellArrow data-mark="arrow" aria-hidden="true">{ARROW_GLYPH[direction]}</CellArrow>
```

5. コンポーネント本体を差し替える

```tsx
export const BoardGrid: React.FC<Props> = ({ map, state, placeableCells, effects, onCellClick }) => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) cells.push({ x, y });
  }
  const stacks = stackEnemies(state.enemies, map);
  const laneIndexByCell = buildLaneIndexByCell(map);
  const plates = buildPlates(state);
  const plateByCell = new Map(plates.map((plate) => [plate.key, plate]));

  return (
    <Frame $columns={map.width} $rows={map.height}>
      {cells.map((pos) => {
        const isPath = isPathCell(map, pos);
        const laneIndex = laneIndexByCell.get(plateKeyOf(pos));
        const direction =
          laneIndex !== undefined ? pathDirectionAt(laneOf(map, laneIndex), pos) : undefined;
        const highlighted = placeableCells.some((c) => samePos(c, pos));
        const plate = plateByCell.get(plateKeyOf(pos));
        const terrain = isHighGround(map, pos) ? '高台' : isSlowCell(map, pos) ? '滞留' : '';
        const occupantText = plate
          ? `${roleLabelOf(plate.visual.role)} ${plate.visual.name}`
          : undefined;
        const label = [
          `${pos.x},${pos.y}`,
          isPath ? '経路' : '設置可',
          terrain,
          occupantText,
          highlighted ? 'ここに置ける' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <Cell
            key={plateKeyOf(pos)}
            type="button"
            data-testid={`cell-${pos.x}-${pos.y}`}
            data-path={isPath ? 'true' : 'false'}
            data-lane={laneIndex}
            $kind={isPath ? 'path' : 'slot'}
            $highlighted={highlighted}
            aria-label={label}
            onClick={() => onCellClick(pos)}
          >
            {/* 設置物が乗ったマスではレーン印と矢印を隠す。配置時点で判断済みの
                情報であり、上限3を守るために優先度が最も低い（設計書 §4.6） */}
            {!plate && laneIndex !== undefined && (
              <LaneMark data-mark="lane" aria-hidden="true" $shape={laneIndex % 2 === 0 ? 'circle' : 'square'} />
            )}
            {!plate && direction && (
              <CellArrow data-mark="arrow" aria-hidden="true">{ARROW_GLYPH[direction]}</CellArrow>
            )}
          </Cell>
        );
      })}
      {plates.map((plate) => (
        <UnitPlate key={plate.key} plate={plate} columns={map.width} rows={map.height} />
      ))}
      <BoardEffectLayer effects={effects} map={map} />
      {plates.map((plate) => (
        <PlacedStatusBar key={plate.key} plate={plate} columns={map.width} rows={map.height} />
      ))}
      {stacks.map((stack) => (
        <EnemyMarker key={stack.id} stack={stack} columns={map.width} rows={map.height} />
      ))}
    </Frame>
  );
};
```

台座は `BoardEffectLayer` より**前**に置く（z-index 0 でエフェクトの下）。状態バーは後（z-index 2）。ファイル冒頭の z 順序コメントも次に更新する。

```
 * z 順序: セル(0) < 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/BoardGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: 旧 `UnitHpBar` を削除する**

`BoardGrid.tsx` が参照をやめた今、`UnitHpBar` の参照元は無い。Task 4 で作った `PlacedStatusBar` が完全に置き換えている。

```bash
grep -rn "UnitHpBar" src/ && echo "参照が残っている。削除前に解消すること" || git rm src/features/ashen-rampart/presentation/UnitHpBar.tsx
ls src/features/ashen-rampart/presentation/UnitHpBar.test.tsx 2>/dev/null && git rm src/features/ashen-rampart/presentation/UnitHpBar.test.tsx
```

- [ ] **Step 6: 全テストと型チェック**

Run: `npm run typecheck && npx jest src/features/ashen-rampart`
Expected: すべて PASS（`UnitHpBar` への参照が残っていないこと）

- [ ] **Step 7: コミット**

```bash
git add -A src/features/ashen-rampart/presentation/BoardGrid.tsx src/features/ashen-rampart/presentation/BoardGrid.test.tsx src/features/ashen-rampart/presentation/UnitHpBar.tsx
git commit -m "feat(ashen-rampart): 盤面の占有表示を台座レイヤへ差し替える

5種類の攻撃塔がすべて「塔」の1文字だった状態を解消し、
形・サイズ・文字で12種の設置物を区別できるようにする。

設置物が乗ったセルではレーン印と進行方向の矢印を隠す。
これらは配置時点で判断済みの情報であり、常時3印までという
上限を守るうえで優先度が最も低い。上限は MAX_CELL_MARKS
として定数化し、テストで機械的に守る。"
```

---

## Task 6: `card-text.ts` — 手札に出す数値とバッジ

**Files:**
- Modify: `src/features/ashen-rampart/presentation/card-text.ts`
- Modify: `src/features/ashen-rampart/presentation/card-text.test.ts`

**Interfaces:**
- Produces:
  - `cardStatsOf(cardId: string): string[]`（最大2要素）
  - `cardBadgesOf(cardId: string): string[]`（最大2要素）
  - `MAX_CARD_BADGES: number`

- [ ] **Step 1: 失敗するテストを書く**

`card-text.test.ts` に追記する。

```ts
import { cardStatsOf, cardBadgesOf, MAX_CARD_BADGES } from './card-text';
import { CARD_IDS } from '../domain/cards/card-pool';

describe('cardStatsOf', () => {
  it('塔はHPと攻撃力を出す', () => {
    expect(cardStatsOf('arrow-tower')).toEqual(['HP8', '攻撃4']);
  });

  it('罠はダメージと回数を出す', () => {
    expect(cardStatsOf('spike-trap')).toEqual(['ダメージ5', '3回']);
  });

  it('徴発は数値が1つだけ', () => {
    expect(cardStatsOf('levy')).toHaveLength(1);
  });

  it('全14種が数値を持ち、2つを超えない', () => {
    CARD_IDS.forEach((id) => {
      const stats = cardStatsOf(id);
      expect(stats.length).toBeGreaterThan(0);
      expect(stats.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('cardBadgesOf', () => {
  it('徹甲弩は対空と貫通の2つ', () => {
    expect(cardBadgesOf('piercer')).toEqual(['対空', '貫通']);
  });

  it('火砲台は範囲のみ（飛行に当たらない）', () => {
    expect(cardBadgesOf('cannon-tower')).toEqual(['範囲']);
  });

  it('弓兵はバッジなし', () => {
    expect(cardBadgesOf('arrow-tower')).toEqual([]);
  });

  it('塔でないカードはバッジなし', () => {
    expect(cardBadgesOf('mud-time')).toEqual([]);
  });

  it('どのカードもバッジは上限を超えない', () => {
    CARD_IDS.forEach((id) => {
      expect(cardBadgesOf(id).length).toBeLessThanOrEqual(MAX_CARD_BADGES);
    });
  });
});
```

> `arrow-tower` の HP・攻撃力、`spike-trap` のダメージ・回数はカードプールの実測値である。値が違って落ちた場合は**テストの期待値をカードプールに合わせる**。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/card-text.test.ts`
Expected: FAIL — `cardStatsOf is not a function`

- [ ] **Step 3: 実装する**

`card-text.ts` の末尾に追記する。

```ts
/** 1秒あたりの tick 数。表示用に秒へ丸めるときだけ使う */
const TICKS_PER_SECOND = 10;

const toSeconds = (ticks: number): number => Math.ceil(ticks / TICKS_PER_SECOND);

/**
 * 手札とデッキ構築に出す主要数値（最大2つ）
 *
 * 面積が限られるため、そのカードの働きを最も端的に表す2つに絞る。
 * 3つ目以降は能力表示（盤面）とデッキ構築の「効かない相手」に譲る。
 */
export const cardStatsOf = (cardId: string): string[] => {
  const card = getCardDefinition(cardId);
  if (card.tower) return [`HP${card.tower.hp}`, `攻撃${card.tower.damage}`];
  if (card.trap) return [`ダメージ${card.trap.damage}`, `${card.trap.uses}回`];
  if (card.reactor)
    return [`マナ+${card.reactor.manaPerTick}`, `${toSeconds(card.reactor.intervalTicks)}秒`];
  if (card.ember) return [`ダメージ${card.ember.damage}`, `半径${card.ember.radius}`];
  if (card.spell)
    return [`速度x${card.spell.speedMultiplier}`, `${toSeconds(card.spell.durationTicks)}秒`];
  if (card.levy) return [`${card.levy.peekCount}枚から選ぶ`];
  throw new Error(`性能が未定義のカードIDです: ${cardId}`);
};

/** 属性バッジの上限。増やすと手札が読めなくなる（設計書 §6） */
export const MAX_CARD_BADGES = 2;

/**
 * 手札とデッキ構築に出す属性バッジ（最大2つ）
 *
 * 貫通と範囲は排他に扱う。徹甲弩は splashRadius 0 の貫通、火砲台と
 * 投石機は splashRadius > 0 の範囲であり、両方を持つカードは存在しない。
 */
export const cardBadgesOf = (cardId: string): string[] => {
  const tower = getCardDefinition(cardId).tower;
  if (!tower) return [];
  const badges: string[] = [];
  if (tower.hitsFlying) badges.push('対空');
  if (tower.piercing) badges.push('貫通');
  else if (tower.splashRadius > 0) badges.push('範囲');
  return badges.slice(0, MAX_CARD_BADGES);
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/card-text.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/card-text.ts src/features/ashen-rampart/presentation/card-text.test.ts
git commit -m "feat(ashen-rampart): 手札に出す数値とバッジの導出を追加する

カード種別ごとに最も端的な2つの数値と、対空・範囲・貫通の
バッジを返す。上限を定数で持ち、手札の読み負担が増え続けない
ようにする。"
```

---

## Task 7: `CardGlyph.tsx` と `HandArea.tsx` — 手札に符号を出す

**Files:**
- Create: `src/features/ashen-rampart/presentation/CardGlyph.tsx`
- Create: `src/features/ashen-rampart/presentation/CardGlyph.test.tsx`
- Modify: `src/features/ashen-rampart/presentation/HandArea.tsx`
- Modify: `src/features/ashen-rampart/presentation/HandArea.test.tsx`

**Interfaces:**
- Consumes: `getUnitVisual` / `getRoleClipPath` / `roleLabelOf`（Task 1）、`cardStatsOf` / `cardBadgesOf`（Task 6）
- Produces: `CardGlyph: React.FC<{ cardId: string }>`

- [ ] **Step 1: 失敗するテストを書く**

`CardGlyph.test.tsx`:

```tsx
/**
 * 手札・デッキ構築で使う形アイコンのテスト
 *
 * 盤面の台座と同じ形を使うことが要件。ここが崩れると「持っていた札」と
 * 「置いたもの」が繋がらず、この反復の目的そのものが達成できない。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardGlyph } from './CardGlyph';
import { getRoleClipPath, getUnitVisual } from './unit-visual';
import { CARD_IDS } from '../domain/cards/card-pool';

describe('CardGlyph', () => {
  it('個体の文字を描く', () => {
    render(<CardGlyph cardId="ballista" />);
    expect(screen.getByText('弩')).toBeInTheDocument();
  });

  it('役割を data-role に持つ', () => {
    render(<CardGlyph cardId="mud-time" />);
    expect(screen.getByTestId('card-glyph-mud-time')).toHaveAttribute('data-role', 'spell');
  });

  it('全14種が描画でき、盤面の台座と同じ役割・形を使う', () => {
    CARD_IDS.forEach((id) => {
      const { unmount } = render(<CardGlyph cardId={id} />);
      const el = screen.getByTestId(`card-glyph-${id}`);
      const visual = getUnitVisual(id);
      expect(el).toHaveAttribute('data-role', visual.role);
      expect(el).toHaveAttribute('data-clip-path', getRoleClipPath(visual.role) ?? 'none');
      unmount();
    });
  });
});
```

`HandArea.test.tsx` に追記する。

```tsx
  it('手札のカードに形アイコン・数値・バッジが出る', () => {
    // 手札に徹甲弩がある状態で描画する（既存のセットアップ流儀に合わせること）
    expect(screen.getByTestId('card-glyph-piercer')).toBeInTheDocument();
    expect(screen.getByText('HP14')).toBeInTheDocument();
    expect(screen.getByText('対空')).toBeInTheDocument();
    expect(screen.getByText('貫通')).toBeInTheDocument();
  });

  it('カードの aria-label に役割が入る', () => {
    expect(
      screen.getByRole('button', { name: '攻撃塔 徹甲弩 コスト4' })
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/CardGlyph.test.tsx src/features/ashen-rampart/presentation/HandArea.test.tsx`
Expected: FAIL

- [ ] **Step 3: `CardGlyph.tsx` を実装する**

```tsx
/**
 * 灰燼の城壁 - カードの形アイコン
 *
 * 盤面の台座（UnitPlate）と同じ形・同じ文字を、手札とデッキ構築でも使う。
 * 手札のアイコンと盤面のアイコンが一致して初めて「自分が置いたものが何か」
 * が繋がる（設計書 §6）。呪文と徴発は盤面に残らないため、この2形は
 * 手札とデッキ構築にしか現れない。
 */
import React from 'react';
import styled, { css } from 'styled-components';
import { getRoleClipPath, getUnitVisual } from './unit-visual';

const GLYPH_SIZE_PX = 18;
const GLYPH_BACKGROUND = 'rgba(232, 222, 210, 0.14)';

const Glyph = styled.span<{ $clipPath?: string; $wide: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: ${GLYPH_SIZE_PX}px;
  height: ${({ $wide }) => ($wide ? GLYPH_SIZE_PX * 0.6 : GLYPH_SIZE_PX)}px;
  background: ${GLYPH_BACKGROUND};
  border: 1px solid currentColor;
  border-radius: ${({ $wide, $clipPath }) => ($wide ? '2px' : $clipPath ? '0' : '50%')};
  ${({ $clipPath }) => ($clipPath ? css`clip-path: ${$clipPath};` : '')}
  font-size: 10px;
  line-height: 1;
`;

interface Props {
  cardId: string;
}

export const CardGlyph: React.FC<Props> = ({ cardId }) => {
  const visual = getUnitVisual(cardId);
  const clipPath = getRoleClipPath(visual.role);
  return (
    <Glyph
      data-testid={`card-glyph-${cardId}`}
      data-role={visual.role}
      data-clip-path={clipPath ?? 'none'}
      aria-hidden="true"
      $clipPath={clipPath}
      $wide={visual.isWide}
    >
      {visual.glyph}
    </Glyph>
  );
};
```

> `aria-hidden="true"` にするのは、役割が親の `aria-label`（「攻撃塔 徹甲弩 コスト4」）に既に含まれるため。読み上げの重複を避ける。枠線は `currentColor` を使うので `COLORS` の import は不要。

- [ ] **Step 4: `HandArea.tsx` を修正する**

1. import を追加する

```tsx
import { CardGlyph } from './CardGlyph';
import { cardBadgesOf, cardStatsOf } from './card-text';
import { getUnitVisual, roleLabelOf } from './unit-visual';
```

2. カードの最小幅を広げ、内側のレイアウトを整える

```tsx
const Card = styled.button<{ $selected: boolean }>`
  min-width: 112px;
  min-height: 44px;
  /* ...既存のプロパティはそのまま... */
`;

const CardHead = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatRow = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11px;
  opacity: 0.85;
`;

const Badge = styled.span`
  padding: 0 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
  font-size: 10px;
`;
```

3. カードの中身を差し替える

```tsx
              <Card
                type="button"
                $selected={selectedIndex === index}
                aria-pressed={selectedIndex === index}
                aria-label={`${roleLabelOf(getUnitVisual(cardId).role)} ${card.name} コスト${card.cost}`}
                disabled={!affordable}
                onClick={() => onSelect(index)}
              >
                <CardHead>
                  <CardGlyph cardId={cardId} />
                  {card.name}
                </CardHead>
                <StatRow>
                  <span>コスト{card.cost}</span>
                  {cardStatsOf(cardId).map((stat) => (
                    <span key={stat}>{stat}</span>
                  ))}
                  {cardBadgesOf(cardId).map((badge) => (
                    <Badge key={badge}>{badge}</Badge>
                  ))}
                </StatRow>
              </Card>
```

`Card` に `display: flex; flex-direction: column; gap: 2px;` を足し、既存の `<br />` による改行を削除する。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/CardGlyph.test.tsx src/features/ashen-rampart/presentation/HandArea.test.tsx`
Expected: PASS

- [ ] **Step 6: 型チェックと lint**

Run: `npm run typecheck && npx eslint src/features/ashen-rampart/presentation/CardGlyph.tsx src/features/ashen-rampart/presentation/HandArea.tsx`
Expected: エラーなし

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/presentation/CardGlyph.tsx src/features/ashen-rampart/presentation/CardGlyph.test.tsx src/features/ashen-rampart/presentation/HandArea.tsx src/features/ashen-rampart/presentation/HandArea.test.tsx
git commit -m "feat(ashen-rampart): 手札に形アイコン・数値・バッジを出す

盤面の台座と同じ形を手札にも出す。この一致がなければ「持っていた札」
と「置いたもの」が繋がらないため、同じ形を使うことをテストで守る。

カードタイプは内部に既に存在していたが画面に出していなかった。
形アイコンがそのままカードタイプの表示を兼ねる。"
```

---

## Task 8: `DeckBuilder.tsx` — デッキ構築にも同じ符号を出す

**Files:**
- Modify: `src/features/ashen-rampart/presentation/DeckBuilder.tsx`
- Modify: `src/features/ashen-rampart/presentation/DeckBuilder.test.tsx`

**Interfaces:**
- Consumes: `CardGlyph`（Task 7）、`cardBadgesOf`（Task 6）、`roleLabelOf` / `getUnitVisual`（Task 1）

- [ ] **Step 1: 失敗するテストを書く**

`DeckBuilder.test.tsx` に追記する。

```tsx
  it('各カードに形アイコンと役割名が出る', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getByTestId('card-glyph-arrow-tower')).toBeInTheDocument();
    expect(screen.getAllByText('攻撃塔').length).toBeGreaterThan(0);
  });

  it('属性バッジが出る', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getAllByText('貫通').length).toBeGreaterThan(0);
  });
```

`DeckBuilder` の props は既存ファイルの定義に合わせること（`onStart` 以外を取る場合はそちらに従う）。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/DeckBuilder.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

`DeckBuilder.tsx` の `CardRow` 内、カード名を出している箇所に形アイコンと役割名を足す。

```tsx
import { CardGlyph } from './CardGlyph';
import { cardBadgesOf, weaknessTextOf, towerStatsTextOf } from './card-text';
import { getUnitVisual, roleLabelOf } from './unit-visual';
```

```tsx
const RowHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RoleTag = styled.span`
  font-size: 11px;
  opacity: 0.75;
`;

const Badge = styled.span`
  padding: 0 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
  font-size: 10px;
`;
```

カード名の行を次に置き換える。

```tsx
<RowHead>
  <CardGlyph cardId={id} />
  <strong>{getCardDefinition(id).name}</strong>
  <RoleTag>{roleLabelOf(getUnitVisual(id).role)}</RoleTag>
  {cardBadgesOf(id).map((badge) => (
    <Badge key={badge}>{badge}</Badge>
  ))}
</RowHead>
```

既存の `towerStatsTextOf` と `weaknessTextOf` の行はそのまま残す。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/DeckBuilder.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/DeckBuilder.tsx src/features/ashen-rampart/presentation/DeckBuilder.test.tsx
git commit -m "feat(ashen-rampart): デッキ構築にも形アイコンと役割名を出す

デッキ構築 → 手札 → 盤面 の3画面が同じ符号で繋がる。
組んだときに見た形が、引いたときも置いたときも同じであることが
「置いたものが何か」を成立させる前提になる。"
```

---

## Task 9: 能力表示 — 射程リングと能力チップ

**Files:**
- Create: `src/features/ashen-rampart/presentation/RangeOverlay.tsx`
- Create: `src/features/ashen-rampart/presentation/RangeOverlay.test.tsx`
- Create: `src/features/ashen-rampart/presentation/InspectPanel.tsx`
- Create: `src/features/ashen-rampart/presentation/InspectPanel.test.tsx`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`
- Modify: `src/features/ashen-rampart/application/ports/play-log-port.ts`（`inspect_opened` の型のみ）

**Interfaces:**
- Consumes: `PlateModel` / `buildPlates` / `plateKeyOf`（Task 2）、`roleLabelOf`（Task 1）
- Produces:
  - `RangeOverlay: React.FC<{ plate: PlateModel; columns: number; rows: number }>`
  - `InspectPanel: React.FC<{ plate: PlateModel }>`
  - フックの戻り値に `inspectedPlate: PlateModel | undefined` を追加

**動作の優先順位（設計書 §5.2）** — 上から順に評価し、最初に当たったものだけを行う。

| # | 状況 | 動作 |
|---|---|---|
| 1 | 一時停止中 | 無反応 |
| 2 | カード選択中 | 配置 |
| 3 | 未選択 ＋ 再点火可能な燠火 | 再点火 |
| 4 | 未選択 ＋ 設置物あり | 能力表示を開く／同じマスの再タップで閉じる |
| 5 | 未選択 ＋ 空マス | 能力表示を閉じる |

- [ ] **Step 1: フックの失敗するテストを書く**

`useAshenRampartGame.test.ts` に追記する。

> **セットアップは既存テストをそのまま写す。** `useAshenRampartGame.test.ts:224` の
> 「interactCell: 再点火可能な燠火のあるセルを選択なしでクリックすると reactivated が
> 記録される」が、**カードを選び → セルをクリックして配置し → tick を進める**という
> 一連の手順を既に持っている。守り手（`arrow-tower`）を置くだけなので、そのテストの
> 前半部分を複製し、カードIDと座標を差し替えて使うこと。専用デッキの定義（同ファイル
> 29行目付近の `DECK`）も同じものを流用する。

```ts
  it('interactCell: 選択なしで設置物のあるセルをクリックすると能力表示が開き、再クリックで閉じる', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: DECK, playLog }));
    // ここまでで (1,1) に arrow-tower を配置しておく（上記の写し元テストと同じ手順）
    act(() => result.current.interactCell({ x: 1, y: 1 }));
    expect(result.current.inspectedPlate?.cardId).toBe('arrow-tower');
    act(() => result.current.interactCell({ x: 1, y: 1 }));
    expect(result.current.inspectedPlate).toBeUndefined();
  });

  it('interactCell: 能力表示を開くと inspect_opened が記録される', () => {
    // 開いたときだけ記録し、閉じたときは記録しない
    const events = playLog.exportAll().events.filter((e) => e.kind === 'inspect_opened');
    expect(events).toHaveLength(1);
  });

  it('interactCell: 再点火可能な燠火は能力表示より再点火が優先される', () => {
    // 燠火（cooldownLeft 0）のセルをクリックしても inspectedPlate は開かない
    expect(result.current.inspectedPlate).toBeUndefined();
  });

  it('カードを選ぶと能力表示は閉じる', () => {
    act(() => result.current.selectCard(0));
    expect(result.current.inspectedPlate).toBeUndefined();
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
Expected: FAIL — `inspectedPlate` が undefined のまま／`inspect_opened` が記録されない

- [ ] **Step 3: `inspect_opened` の型を先に足す**

このタスクが記録するイベントなので、型もここで足す。**残る2種（`card_discarded_manual` / `run_tally`）とスキーマのバージョン上げは Task 11 で行う。** タスクごとに型チェックが緑で終わるようにするための分割である。

`src/features/ashen-rampart/application/ports/play-log-port.ts` の `PlayLogEventBody` の union へ追加する。

```ts
  | { kind: 'inspect_opened'; runId: string; cardId: string; tick: number }
```

- [ ] **Step 4: フックを実装する**

`useAshenRampartGame.ts`:

1. import と state を足す

```ts
import { buildPlates, plateKeyOf, type PlateModel } from './board-plates';

const [inspectedKey, setInspectedKey] = useState<string | null>(null);
```

座標そのものではなく `plateKeyOf` の文字列を持つ。設置物が壊れて消えたときに、次の描画で自動的に対象が失われる（別途クリアする処理が要らない）。

2. `interactCell` を差し替える

```ts
  /**
   * 盤面セルへの唯一の入口（UI はこれだけを呼ぶ）
   *
   * 優先順位: 配置 > 再点火 > 能力表示。既存の2つを先に評価するため、
   * 能力表示を足しても従来の操作は1つも変わらない（設計書 §5.2）。
   * 再点火可能な燠火だけは能力表示を開けないが、クールダウン中は開ける。
   */
  const interactCell = useCallback(
    (pos: CellPos) => {
      if (isPaused) return;
      if (selectedIndex !== null) {
        clickCell(pos);
        return;
      }
      const emberIndex = state.embers.findIndex(
        (ember) => ember.pos.x === pos.x && ember.pos.y === pos.y && ember.cooldownLeft === 0
      );
      if (emberIndex !== -1) {
        reactivate(emberIndex);
        return;
      }
      const key = plateKeyOf(pos);
      const plate = buildPlates(state).find((candidate) => candidate.key === key);
      if (!plate) {
        setInspectedKey(null);
        return;
      }
      if (inspectedKey === key) {
        setInspectedKey(null);
        return;
      }
      // StrictMode は useState の関数型 updater を二重に呼ぶことがあるため、
      // 記録は updater の外で行う（togglePause と同じ理由）
      logRef.current.record({
        kind: 'inspect_opened',
        runId,
        cardId: plate.cardId,
        tick: state.tick,
      });
      inspectOpensRef.current += 1;
      setInspectedKey(key);
    },
    [isPaused, selectedIndex, state, clickCell, reactivate, inspectedKey, runId]
  );
```

3. `selectCard` と `restart` と `togglePause` で `setInspectedKey(null)` を呼ぶ

4. 戻り値へ追加する

```ts
  const inspectedPlate: PlateModel | undefined =
    inspectedKey === null
      ? undefined
      : buildPlates(state).find((plate) => plate.key === inspectedKey);
```

```ts
  return {
    // ...既存のまま...
    inspectedPlate,
  };
```

5. UI カウンタ用の ref を足す（Task 11 の `run_tally` で使う）

```ts
  const inspectOpensRef = useRef(0);
  const manualDiscardsRef = useRef(0);
```

`discardCard` の先頭で `manualDiscardsRef.current += 1;` を加える。`restart` で両方を 0 に戻す。

- [ ] **Step 5: フックのテストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
Expected: PASS

> `inspect_opened` イベントは Task 11 で `play-log-port.ts` に型を追加する。**このタスクの時点では型エラーになる**ため、Task 11 を先に実施してもよい。順序を入れ替える場合はこの依存だけ注意する。

- [ ] **Step 6: `RangeOverlay.tsx` を実装する**

```tsx
/**
 * 灰燼の城壁 - 能力表示の射程リング
 *
 * 塗らずに輪郭だけ描く。敵マーカーと攻撃エフェクトを隠さないため（設計書 §5.2）。
 * 射程0のカードが3種（篝火・鍛冶場・石壁）あるため、役割で描き分ける。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { getCardDefinition } from '../domain/cards/card-pool';
import { COLORS } from './theme';

/** 支援塔のオーラは隣接1マスに及ぶ */
const AURA_RADIUS_CELLS = 1;

const Ring = styled.div<{ $left: number; $top: number; $sizeCqw: number; $round: boolean }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  width: ${({ $sizeCqw }) => $sizeCqw}cqw;
  height: ${({ $sizeCqw }) => $sizeCqw}cqw;
  transform: translate(-50%, -50%);
  border: 1px dashed ${COLORS.opportunity};
  border-radius: ${({ $round }) => ($round ? '50%' : '2px')};
  z-index: 2;
  pointer-events: none;
`;

interface Props {
  plate: PlateModel;
  columns: number;
  rows: number;
}

export const RangeOverlay: React.FC<Props> = ({ plate, columns, rows }) => {
  const tower = getCardDefinition(plate.cardId).tower;
  if (!tower) return null;
  // 壁は射程0でオーラも持たない。描くものがない
  const radiusCells = tower.range > 0 ? tower.range : tower.aura ? AURA_RADIUS_CELLS : 0;
  if (radiusCells === 0) return null;
  const cellCqw = 100 / columns;
  return (
    <Ring
      data-testid={`range-overlay-${plate.pos.x}-${plate.pos.y}`}
      data-shape={tower.range > 0 ? 'ring' : 'adjacent'}
      aria-hidden="true"
      $left={((plate.pos.x + 0.5) / columns) * 100}
      $top={((plate.pos.y + 0.5) / rows) * 100}
      // 直径 = 半径2つ分 + 自分のセル1つ分
      $sizeCqw={(radiusCells * 2 + 1) * cellCqw}
      $round={tower.range > 0}
    />
  );
};
```

`RangeOverlay.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RangeOverlay } from './RangeOverlay';
import { buildPlates } from './board-plates';
import type { CombatState } from '../domain/combat/combat-state';

const plateFor = (cardId: string) =>
  buildPlates({
    units: [{ cardId, pos: { x: 4, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
    traps: [],
    reactors: [],
    embers: [],
  } as unknown as CombatState)[0];

describe('RangeOverlay', () => {
  it('射程を持つ攻撃塔は円のリングを描く', () => {
    render(<RangeOverlay plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByTestId('range-overlay-4-3')).toHaveAttribute('data-shape', 'ring');
  });

  it('支援塔は射程0でも隣接枠を描く', () => {
    render(<RangeOverlay plate={plateFor('beacon')} columns={9} rows={7} />);
    expect(screen.getByTestId('range-overlay-4-3')).toHaveAttribute('data-shape', 'adjacent');
  });

  it('石壁は何も描かない（射程0・オーラなし）', () => {
    const { container } = render(<RangeOverlay plate={plateFor('stone-wall')} columns={9} rows={7} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('塔でない設置物は何も描かない', () => {
    const plate = buildPlates({
      units: [],
      traps: [{ cardId: 'spike-trap', pos: { x: 4, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
      reactors: [],
      embers: [],
    } as unknown as CombatState)[0];
    const { container } = render(<RangeOverlay plate={plate} columns={9} rows={7} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 7: `InspectPanel.tsx` を実装する**

```tsx
/**
 * 灰燼の城壁 - 能力チップ（盤面外）
 *
 * 盤面に数値を並べると煩雑になるため、要求時の詳細は盤面の外に出す
 * （設計書 §5.2）。盤面には射程リングだけが出る。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { getCardDefinition } from '../domain/cards/card-pool';
import { roleLabelOf } from './unit-visual';
import { COLORS } from './theme';

const Panel = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const Chip = styled.span`
  font-size: 11px;
  opacity: 0.9;
`;

const TICKS_PER_SECOND = 10;
const toSeconds = (ticks: number): number => Math.ceil(ticks / TICKS_PER_SECOND);

/** 役割ごとに出す能力を組み立てる（盤面に出さない詳細はすべてここへ集める） */
const chipsOf = (plate: PlateModel): string[] => {
  const card = getCardDefinition(plate.cardId);
  if (card.tower) {
    const t = card.tower;
    if (t.aura) {
      const parts: string[] = [];
      if (t.aura.towerDamageBonus) parts.push(`隣接の攻撃力 +${t.aura.towerDamageBonus * 100}%`);
      if (t.aura.towerRangeBonus) parts.push(`隣接の射程 +${t.aura.towerRangeBonus}`);
      return [...parts, `HP${t.hp}`];
    }
    if (t.damage === 0) return [`HP${t.hp}`, '攻撃しない'];
    return [
      `攻撃${t.damage}`,
      `射程${t.range}`,
      `間隔${toSeconds(t.cooldownTicks)}秒`,
      t.hitsFlying ? '飛行に当たる' : '飛行に当たらない',
      t.piercing ? '貫通' : t.splashRadius > 0 ? `範囲${t.splashRadius}` : '単体',
    ];
  }
  if (card.trap) {
    return [
      `ダメージ${card.trap.damage}`,
      `残り${plate.statusNow}回`,
      ...(card.trap.groundedTicks ? [`${toSeconds(card.trap.groundedTicks)}秒 地上化`] : []),
    ];
  }
  if (card.reactor) {
    return [`マナ+${card.reactor.manaPerTick}`, `${toSeconds(card.reactor.intervalTicks)}秒ごと`];
  }
  if (card.ember) {
    return [`ダメージ${card.ember.damage}`, `半径${card.ember.radius}`, 'クリックで再点火'];
  }
  return [];
};

interface Props {
  plate: PlateModel;
}

export const InspectPanel: React.FC<Props> = ({ plate }) => (
  <Panel data-testid="inspect-panel" role="status">
    <strong>
      {roleLabelOf(plate.visual.role)} {plate.visual.name}
    </strong>
    {chipsOf(plate).map((chip) => (
      <Chip key={chip}>{chip}</Chip>
    ))}
  </Panel>
);
```

`InspectPanel.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InspectPanel } from './InspectPanel';
import { buildPlates } from './board-plates';
import type { CombatState } from '../domain/combat/combat-state';

const plateFor = (cardId: string) =>
  buildPlates({
    units: [{ cardId, pos: { x: 0, y: 0 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
    traps: [],
    reactors: [],
    embers: [],
  } as unknown as CombatState)[0];

describe('InspectPanel', () => {
  it('攻撃塔は攻撃力・射程・対空可否・攻撃の形を出す', () => {
    render(<InspectPanel plate={plateFor('piercer')} />);
    expect(screen.getByText('攻撃塔 徹甲弩')).toBeInTheDocument();
    expect(screen.getByText('飛行に当たる')).toBeInTheDocument();
    expect(screen.getByText('貫通')).toBeInTheDocument();
  });

  it('支援塔は強化内容を出す', () => {
    render(<InspectPanel plate={plateFor('forge')} />);
    expect(screen.getByText('隣接の射程 +0.6')).toBeInTheDocument();
  });

  it('石壁は攻撃しないことを明示する', () => {
    render(<InspectPanel plate={plateFor('stone-wall')} />);
    expect(screen.getByText('攻撃しない')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: `BoardGrid.tsx` と `AshenRampartGame.tsx` を繋ぐ**

`BoardGrid.tsx` に props を1つ足す。

```tsx
interface Props {
  // ...既存のまま...
  /** 能力表示の対象（未選択なら undefined） */
  inspectedPlate?: PlateModel;
}
```

import を足す。

```tsx
import { RangeOverlay } from './RangeOverlay';
import type { PlateModel } from './board-plates';
```

`PlacedStatusBar` の描画の後に加える。

```tsx
      {inspectedPlate && (
        <RangeOverlay plate={inspectedPlate} columns={map.width} rows={map.height} />
      )}
```

`AshenRampartGame.tsx` にも import を足す。

```tsx
import { InspectPanel } from './InspectPanel';
```

`AshenRampartGame.tsx` で `BoardGrid` に `inspectedPlate={game.inspectedPlate}` を渡し、`EnemyLegend` の直前に置く。

```tsx
        {game.inspectedPlate && <InspectPanel plate={game.inspectedPlate} />}
        <EnemyLegend />
```

- [ ] **Step 9: 全テストと型チェック**

Run: `npm run typecheck && npx jest src/features/ashen-rampart`
Expected: すべて PASS（`inspect_opened` の型は Step 3 で追加済み）

- [ ] **Step 10: コミット**

```bash
git add src/features/ashen-rampart/presentation/RangeOverlay.tsx src/features/ashen-rampart/presentation/RangeOverlay.test.tsx src/features/ashen-rampart/presentation/InspectPanel.tsx src/features/ashen-rampart/presentation/InspectPanel.test.tsx src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts src/features/ashen-rampart/presentation/BoardGrid.tsx src/features/ashen-rampart/presentation/AshenRampartGame.tsx
git commit -m "feat(ashen-rampart): 設置物の能力を要求時に開示する

セルをタップすると射程リングを輪郭だけで描き、詳細な数値は
盤面の外へ出す。盤面に数値を並べずに能力を読める経路を作る。

優先順位は 配置 > 再点火 > 能力表示 とし、既存の操作を
1つも変えない。射程0の3種は役割で描き分ける（支援塔は隣接枠、
壁は無描画）。"
```

---

## Task 10: 質感 — 配置時のポップインと reduced-motion

**Files:**
- Modify: `src/features/ashen-rampart/presentation/UnitPlate.tsx`
- Modify: `src/features/ashen-rampart/presentation/UnitPlate.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
  it('動きを減らす設定では脈動もポップインも止まる', () => {
    // jsdom では matchMedia が未定義のため setupTests のモックに合わせる。
    // styled-components が出力する CSS に prefers-reduced-motion のブロックが
    // 含まれることを検証する（実際の再生停止はブラウザ側の責務）。
    const { container } = render(
      <UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((el) => el.textContent ?? '')
      .join('');
    expect(styles).toContain('prefers-reduced-motion');
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/UnitPlate.test.tsx`
Expected: FAIL または PASS（Task 3 で既に `prefers-reduced-motion` を入れている場合は PASS）。**PASS した場合はこの Step を飛ばし、Step 3 のポップインを足してから再度確認する。**

- [ ] **Step 3: ポップインを足す**

`UnitPlate.tsx` に追加する。

```tsx
/** 配置された瞬間だけ小さく現れる。置けたことのフィードバック */
const popIn = keyframes`
  from { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
`;
```

`Plate` の `animation` を次のように合成する。

```tsx
  animation: ${popIn} 200ms ease-out;
  ${({ $firing }) =>
    $firing
      ? css`
          animation: ${popIn} 200ms ease-out, ${firePulse} 150ms ease-out alternate 2;
        `
      : ''}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/UnitPlate.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/UnitPlate.tsx src/features/ashen-rampart/presentation/UnitPlate.test.tsx
git commit -m "feat(ashen-rampart): 台座に配置時のポップインを足す

動くのは「何かが起きた瞬間」だけにし、装飾のための装飾は入れない。
配置200ms・発射150msでいずれも300ms以内。prefers-reduced-motion
では両方止める。"
```

---

## Task 11: ログスキーマ v3 — 集計を判定者へ届ける

**Files:**
- Modify: `src/features/ashen-rampart/application/ports/play-log-port.ts`
- Modify: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts`
- Modify: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx`

**Interfaces:**
- Produces: `PlayLogEventBody` に2種追加（`inspect_opened` は Task 9 済み）、`CURRENT_ITERATION = 4`、`PLAY_LOG_STORAGE_KEY = 'ashen-rampart:play-log-v3'`

- [ ] **Step 1: 失敗するテストを書く**

`local-storage-play-log.test.ts` に追記する。

```ts
  it('スキーマは v3 で、キーも v3 になる', () => {
    const log = new LocalStoragePlayLog();
    log.record({ kind: 'run_note', runId: 'r1', text: 'テスト' });
    expect(PLAY_LOG_STORAGE_KEY).toBe('ashen-rampart:play-log-v3');
    expect(log.exportAll().version).toBe(3);
  });
```

`useAshenRampartGame.test.ts` に追記する。

```ts
  it('決着すると run_tally が1件だけ記録される', () => {
    // ランを決着まで進める既存のヘルパ手順を使う
    const tallies = playLog.exportAll().events.filter((e) => e.kind === 'run_tally');
    expect(tallies).toHaveLength(1);
    expect(tallies[0]).toMatchObject({ iteration: 4 });
  });

  it('手動で捨てると card_discarded_manual が記録される', () => {
    act(() => result.current.discardCard(0));
    const events = playLog.exportAll().events.filter((e) => e.kind === 'card_discarded_manual');
    expect(events).toHaveLength(1);
  });
```

`AshenRampartGame.test.tsx` の既存2箇所（193行目・205行目付近、429〜444行目付近）でボタン名 `計測ログをコピー` を参照している。**新しい文言へ置き換える。**

```ts
  const COPY_BUTTON_NAME = '判定用の記録をコピー（3ラン分まとまっています）';
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart`
Expected: FAIL

- [ ] **Step 3: `play-log-port.ts` を修正する**

```ts
/** 現在の反復番号。反復を進めるたびに必ず更新する */
export const CURRENT_ITERATION = 4;
```

`PlayLogEventBody` の union に2種を追加する（`inspect_opened` は Task 9 で追加済み）。

```ts
  | { kind: 'card_discarded_manual'; runId: string; cardId: string; tick: number }
  | {
      /**
       * 決着時の集計スナップショット（反復4で追加）
       *
       * 反復1〜3 は集計が判定者へ届かなかった。生イベント列だけを渡しても
       * 判定者が自分で集計し直す必要があったためである。判定に使う数値を
       * ここへ入れ、コピー1回で6項目が揃うようにする（設計書 §9）。
       */
      kind: 'run_tally';
      runId: string;
      iteration: number;
      /** 判定項目1: 一度も出さなかった札 */
      unusedCardIds: string[];
      /** 判定項目2: 手動で捨てた回数 */
      manualDiscards: number;
      /** 判定項目3: 能力表示を開いた回数 */
      inspectOpens: number;
      /** 判定項目4: 置けない場所をタップした回数 */
      rejectedTarget: number;
      /** 反復3から継続観察する項目 */
      laneAllocation: number[];
      placedOnPath: number;
      placedOffPath: number;
      unitsLost: Record<string, number>;
      ravenDefeatAverage: number;
      ravenDefeatCount: number;
      costHistogram: number[];
    };
```

- [ ] **Step 4: `local-storage-play-log.ts` を修正する**

```ts
// スキーマ v3（v2 のデータと混ざらないようキーを変更している）
export const PLAY_LOG_STORAGE_KEY = 'ashen-rampart:play-log-v3';

const SCHEMA_VERSION = 3;
```

キーが変わるため、**実プレイ前に v2 を削除する作業は不要になる**。

- [ ] **Step 5: `useAshenRampartGame.ts` を修正する**

1. `discardCard` に記録を足す

```ts
      logRef.current.record({
        kind: 'card_discarded_manual',
        runId,
        cardId: state.deck.hand[handIndex],
        tick: state.tick,
      });
      manualDiscardsRef.current += 1;
```

依存配列に `runId` と `state` を足す。

2. 決着時に `run_tally` を1回だけ記録する

```ts
  const talliedRunIdRef = useRef<string | null>(null);

  /**
   * 決着したランの集計をログへ書き出す
   *
   * 画面にしか出ていなかった数値を、コピー1回で判定者へ渡せるようにする。
   * runId ごとに1回だけ記録する（再レンダーで重複しない）。
   */
  useEffect(() => {
    if (state.outcome === 'playing') return;
    if (talliedRunIdRef.current === runId) return;
    talliedRunIdRef.current = runId;
    const view = summarize(tally, cards);
    logRef.current.record({
      kind: 'run_tally',
      runId,
      iteration: CURRENT_ITERATION,
      unusedCardIds: view.unusedCardIds,
      manualDiscards: manualDiscardsRef.current,
      inspectOpens: inspectOpensRef.current,
      rejectedTarget:
        view.rejectionDetail.find((detail) => detail.label === '置けない場所')?.count ?? 0,
      laneAllocation: view.laneAllocation,
      placedOnPath: view.placedOnPath,
      placedOffPath: view.placedOffPath,
      unitsLost: view.unitsLost,
      ravenDefeatAverage: view.ravenDefeatAverage,
      ravenDefeatCount: view.ravenDefeatCount,
      costHistogram: view.costHistogram,
    });
  }, [state.outcome, runId, tally, cards]);
```

`CURRENT_ITERATION` を import する。`restart` で `talliedRunIdRef.current = null` にはしない（`runId` が変わるため自動的に次のランで記録される）。

- [ ] **Step 6: `AshenRampartGame.tsx` のボタン文言を変える**

```tsx
                  <ActionButton type="button" onClick={handleCopyLog}>
                    判定用の記録をコピー（3ラン分まとまっています）
                  </ActionButton>
```

`ActionRow` の中で**このボタンを先頭に**移す。集計を読んだ直後に押す動線にする。

フィードバック文言も揃える。

```tsx
                {copyStatus === 'copied' && <Feedback>判定用の記録をコピーしました</Feedback>}
```

- [ ] **Step 7: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart`
Expected: すべて PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/application/ports/play-log-port.ts src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts src/features/ashen-rampart/presentation/AshenRampartGame.tsx src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx
git commit -m "feat(ashen-rampart): 集計をログへ書き出しスキーマを v3 にする

判定項目の数値が3反復連続で届かなかった。ボタンの存在を知られて
いなかったことに加え、コピーされるのが生イベント列だけで判定者が
自分で集計し直す必要があったためである。

決着時に run_tally を1件記録し、コピー1回で判定6項目が揃うように
する。ボタンの文言も「なぜ押すのか・何回押せばよいか」が読める
形に変える。キーが v3 になるため実プレイ前の削除作業は不要になる。"
```

---

## Task 12: 全体検証と最小幅の実表示確認

**Files:** なし（検証のみ。修正が必要なら該当ファイルを直す）

- [ ] **Step 1: CI パイプライン全体を通す**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build がすべて成功

失敗した場合は原因を直してから次へ進む。**赤いまま先へ進まない。**

- [ ] **Step 2: 開発サーバーを起動する**

Run: `npm start`

- [ ] **Step 3: 最小幅360pxでの実表示を確認する**

ブラウザの開発者ツールで幅を **360px** にし、灰燼の城壁を開いて次を目視で確認する。

- [ ] 手札のカードが折り返しすぎて盤面を圧迫していないか
- [ ] 台座の形が区別できるか（特に攻撃塔5種のサイズ差）
- [ ] 個体の文字が読めるか
- [ ] 状態バーが台座と重なって読めなくなっていないか

**手札が収まらない場合の削る順序**（設計書 §6.1）:

1. 属性バッジを2つ→1つに減らす
2. 属性バッジを落とす
3. 主要数値を2つ→1つに減らす

形アイコン・名前・コストは削らない。

**台座のサイズ差が読めない場合**（設計書 §12 リスク1）: サイズによる識別を諦め、文字を主・形を従に降格する。判定は文字で成立する。この場合、`unit-visual.test.ts` の一意性テストは `(役割, サイズ)` から `(役割, 文字)` へ緩めてよいが、**緩めた事実を判定記録に必ず残す**。

- [ ] **Step 4: 実プレイ手順どおりに1ラン通す**

1. デッキを組んで開始する
2. 決着まで遊ぶ
3. 「勝敗の理由を記録する」に一言書いて「記録する」を押す
4. 「判定用の記録をコピー（3ラン分まとまっています）」を押す
5. 貼り付けた JSON に `run_tally` が含まれ、`iteration` が 4 になっていることを確認する

- [ ] **Step 5: 確認結果を記録してコミット**

修正が発生した場合はそのコミットを行う。修正が不要だった場合はコミット不要。

```bash
git commit -m "fix(ashen-rampart): 最小幅360pxでの表示崩れを直す

（実際に修正した内容を書く）"
```

---

## Task 13: 実プレイ手順を判定者へ届ける

**Files:** なし（GitHub の Issue と PR の記述）

> **これが3反復連続で失敗した箇所である。** 判定者はボタンの存在を知らなかった。
> コードをいくら直しても、手順が届かなければ4回目も同じ結果になる。

- [ ] **Step 1: Issue #203 に実プレイ手順をコメントする**

設計書 §10 の内容をそのまま貼る。特に次の2点を落とさない。

- **3ラン終わってから最後に1回だけコピーすればよい**（ログはラン横断で蓄積される）
- **localStorage の削除作業は不要**（キーが v3 に変わったため）

```bash
gh issue comment 203 --body-file - <<'EOF'
## 実プレイ手順（反復4）

1. **3ラン続けて遊ぶ。** 途中でリロードしてよい（ログは localStorage にラン横断で蓄積される）
2. **各ランの決着時に「勝敗の理由を記録する」へ一言書いて「記録する」を押す。** これが集計を開く鍵であり、判定の主材料でもある
3. **3ラン目の決着後に「判定用の記録をコピー（3ラン分まとまっています）」を1回だけ押す。** 3ラン分がまとめてクリップボードに入る
4. コピーした JSON を貼る
5. あわせて、遊んだ感想を自由に述べる

**localStorage の削除作業は不要です**（スキーマが v3 になり、キーが変わったため）。
EOF
```

- [ ] **Step 2: PR の説明にも同じ手順を入れる**

PR 本文の「テスト方法」節に手順を書く。判定者が PR から辿れる状態にする。

---

## 実施後の引き継ぎ

**実装完了は判定ではない。** DoD（CI 緑）と CoS（実プレイの記録）は別物である。

マージ後、設計書 §10 の実プレイ手順に沿って3ラン遊び、判定6項目（§8.3）と反証条件（§8.4）を記録して判定記録を残すこと。判定記録は `docs/superpowers/specs/YYYY-MM-DD-ashen-rampart-iteration4-result.md` に置く（反復1〜3 と同じ場所・同じ命名）。
