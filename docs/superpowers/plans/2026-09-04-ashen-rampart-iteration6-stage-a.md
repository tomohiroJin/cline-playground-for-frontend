# 灰燼の城壁 反復6 段階A0＋A 実装計画 — 遠征の骨格

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1ラン＝1ステージだったゲームに「3ステージを勝ち抜く遠征」の骨格を入れ、ステージ間の獲得が較正上も効いていることを実測で確かめる。

**Architecture:** `CombatState`（1ステージの戦闘）はそのまま残し、その上に `domain/expedition/` を新設する。乱数は単一ストリームをやめ、目的ごとの派生シード（`derivedSeed(seed, purpose, index)`）にすることで、獲得の有無でシャッフルがずれない。UI はこの計画では触らない（段階C）。

**Tech Stack:** TypeScript / Jest 30 + @testing-library/react + SWC / ESLint 9 flat config

**Spec:** `docs/superpowers/specs/2026-09-04-ashen-rampart-iteration6-design.md`

## この計画の範囲と、範囲外

**範囲**: 設計書の**段階A0 と段階A** のみ。

段階B（新敵・新カード・6ステージ）、段階C（UI）、段階D（較正）は**別計画にする。**
理由は設計書 §8.2 が段階A の出口ゲート `G1` について
「**差が出なければ較正を続けず、設計へ戻る**」と規定しているためで、
B・C・D の計画を先に書くと `G1` が落ちたときに丸ごと無駄になる。

**この計画の完了時点で得られるもの:**
- 遠征ドメイン一式（テスト付き）
- **`G1` の実測値**（獲得の選び方が踏破率を動かすか）
- **遠征の完全再生テスト**（反復5 の因果検証を反復6 でも使えることの保証）

**この計画の完了時点で得られないもの:**
- 遊べる画面（段階C まで、遠征はテストからしか動かせない）
- 新しい敵・カード・マップ（段階B）
- 較正された難度（段階D）

## Global Constraints

設計書から引き写す。**すべてのタスクの要件に暗黙に含まれる。**

- **応答・コメント・ドキュメントは日本語。** コード（変数名・関数名）は英語可
- **`any` 禁止**（`unknown` ＋ 型ガード）
- **依存方向**: `domain/` は外部依存なし。`domain/expedition/` は `domain/board`・`domain/combat`・`domain/cards` を参照してよいが、**逆向きの参照を作らない**（`CombatState` は遠征を知らない）
- **`domain/combat/run-simulation.ts` から `domain/expedition/` を import しない**（循環になる）。遠征のシミュレーションは `domain/expedition/expedition-simulation.ts` に置く
- **乱数オブジェクトを React の state / ref に置かない**（`StrictMode` で初期化子が二重に呼ばれる）
- **`PLAINS_MAP` と `PLAINS_WAVES` を改変しない**（Task 1 で凍結する）
- **完了条件は `npm run ci`**（`lint:ci` → `typecheck` → `test:coverage` → `build`）が緑。**`lint:ci` を飛ばさない**
- **テストは対象と同じディレクトリに `*.test.ts(x)` で置く**
- **コミットは Conventional Commits**（`feat:` / `fix:` / `refactor:` / `test:` / `chore:`）。英語タイトル不要、日本語で書く
- **`main` への直接コミット禁止。** この計画は `feature/ashen-rampart-iteration6-stage-a` ブランチで作業する

## 既知の中間状態（この計画の実行中に起きること）

**`DECK_SIZE` を 20 → 12 にすると、現在遊べる単一ラン版のゲームが極端に難しくなる。**
段階0 の実測で 12枚デッキ／反復5 台本（約1160 tick）は **3/20** である。

これは**中間状態として許容する。** 遠征では1ステージが 420〜560 tick になるので解消し、
画面が遠征に切り替わるのは段階C である。**この計画の途中でゲームを遊んで
「難しすぎる」と判断しないこと。**

## ファイル構成

**新規作成:**

| ファイル | 責務 |
|---|---|
| `src/features/ashen-rampart/domain/shared/derived-seed.ts` | 1つのシードから目的別の独立したシードを導く純関数 |
| `src/features/ashen-rampart/domain/expedition/stage-definition.ts` | `StageDefinition` / `StageTier` / `DemandAxis` |
| `src/features/ashen-rampart/domain/expedition/stage-pool.ts` | 暫定ステージ6つ（段階B で置き換える） |
| `src/features/ashen-rampart/domain/expedition/stage-draw.ts` | 派生シードから層ごとに1つを抽選 |
| `src/features/ashen-rampart/domain/expedition/acquisition.ts` | 獲得の3択抽選と適用 |
| `src/features/ashen-rampart/domain/expedition/expedition-state.ts` | `ExpeditionState` と遷移 |
| `src/features/ashen-rampart/application/simulation/expedition-simulation.ts` | 遠征のシミュレーションと獲得戦略（use-case を組み立てるので application 層） |
| `src/features/ashen-rampart/application/use-cases/start-expedition.ts` | 遠征開始とステージ開始 |
| `src/features/ashen-rampart/application/use-cases/advance-stage.ts` | ステージ決着 → 獲得提示 or 遠征終了 |
| `src/features/ashen-rampart/application/use-cases/acquire-card.ts` | 3択から1枚を選ぶ |
| `src/features/ashen-rampart/domain/combat/plains-fixture.test.ts` | `PLAINS_MAP` / `PLAINS_WAVES` の凍結ガード |
| `src/features/ashen-rampart/application/simulation/expedition-gate.test.ts` | `G1`（獲得の測定可能性ゲート） |
| `src/features/ashen-rampart/application/simulation/expedition-replay.test.ts` | 遠征の完全再生テスト |

**変更:**

| ファイル | 変更内容 |
|---|---|
| `domain/cards/card-definition.ts` | `CardAvailability` を追加 |
| `domain/cards/card-pool.ts` | `DECK_SIZE` 12・魔力炉の上限・徴発を `retired`・プリセット12枚版 |
| `domain/cards/deck-builder.ts` | `validateDeck`（構築用）と `validateRuntimeDeck`（実行時）を分離 |
| `domain/combat/combat-state.ts` | `createCombatState` に初期ライフ引数・`STAGE_CLEAR_HEAL` |
| `application/ports/play-log-port.ts` | スキーマ v5 |
| `infrastructure/play-log/local-storage-play-log.ts` | キーと `SCHEMA_VERSION` を v5 へ |
| `presentation/useAshenRampartGame.ts` | v5 の必須フィールドを供給（段階C で作り直す暫定対応） |
| `domain/cards/deck-builder.test.ts` ほか5ファイル | 12枚前提へ移行（設計書 §10.3） |

---

## Task 1: `PLAINS_MAP` / `PLAINS_WAVES` の凍結ガード（段階A0）

**Files:**
- Create: `src/features/ashen-rampart/domain/combat/plains-fixture.test.ts`

**Interfaces:**
- Consumes: `PLAINS_MAP`（`domain/board/stage-map.ts`）、`PLAINS_WAVES`・`totalEnemyCount`・`totalEnemyHp`（`domain/combat/waves.ts`）
- Produces: なし（ガードテストのみ）

**なぜ必要か:** `PLAINS_MAP` と `PLAINS_WAVES` への参照は33ファイル・326箇所あり、
うち22ファイルがテストで、`step-tick-*.test.ts` の26箇所が平原の座標（y:2 / y:4 / x:8）を直書きしている。
**改変すると一斉に赤くなる。** 設計書 §5.2 の決定「既存マップを改変せず、新マップは別名で追加する」を
**テストで強制する。**

- [ ] **Step 1: 凍結ガードのテストを書く**

```ts
/**
 * 灰燼の城壁 - 平原フィクスチャの凍結ガード（反復6 段階A0）
 *
 * PLAINS_MAP / PLAINS_WAVES は33ファイル・326箇所から参照され、
 * step-tick-*.test.ts の26箇所が平原の座標を直書きしている。
 * 反復6 は6つの新マップを追加するが、**平原そのものは改変しない**
 * （設計書 §5.2・§12 段階A0）。新マップは別名で追加すること。
 *
 * このテストが赤くなったら、平原を改変しようとしている。
 * 意図的に改変するなら、その前に上記26箇所の座標直書きを移行すること。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyCount, totalEnemyHp } from './waves';

describe('平原フィクスチャの凍結（反復6 段階A0）', () => {
  it('マップの寸法・レーン・高台・滞留が変わっていない', () => {
    expect(PLAINS_MAP.id).toBe('plains');
    expect(PLAINS_MAP.width).toBe(9);
    expect(PLAINS_MAP.height).toBe(7);
    expect(PLAINS_MAP.lanes).toHaveLength(2);
    expect(PLAINS_MAP.lanes[0]).toHaveLength(10);
    expect(PLAINS_MAP.lanes[1]).toHaveLength(12);
    // 砦は全レーン共通の終端
    expect(PLAINS_MAP.lanes[0]?.[9]).toEqual({ x: 8, y: 3 });
    expect(PLAINS_MAP.lanes[1]?.[11]).toEqual({ x: 8, y: 3 });
    expect(PLAINS_MAP.highGround).toEqual([{ x: 2, y: 3 }, { x: 6, y: 3 }]);
    expect(PLAINS_MAP.slowCells).toEqual([{ x: 4, y: 5 }, { x: 5, y: 5 }]);
  });

  it('ウェーブ台本の開始tick・体数・総HPが変わっていない', () => {
    expect(PLAINS_WAVES.map((w) => w.startTick)).toEqual([0, 260, 540, 820]);
    // 2 / (2+2) / 22 / (4+13+4) = 49体
    expect(totalEnemyCount(PLAINS_WAVES)).toBe(49);
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(808);
  });
});
```

- [ ] **Step 2: テストを実行して緑になることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/plains-fixture.test.ts`
Expected: PASS（現状を固定するテストなので最初から緑。**赤なら期待値のほうが誤り**なので、実際の値を読んで直す）

- [ ] **Step 3: 変異でガードの実効性を確認する**

`waves.ts` のウェーブ2 の `startTick` を 260 → 261 に一時的に書き換える。

Run: `npx jest src/features/ashen-rampart/domain/combat/plains-fixture.test.ts`
Expected: **FAIL**（`[0, 261, 540, 820]` を受け取った旨）

確認できたら `261` を `260` に戻し、再度実行して PASS になることを確認する。

- [ ] **Step 4: コミット**

```bash
git checkout -b feature/ashen-rampart-iteration6-stage-a
git add src/features/ashen-rampart/domain/combat/plains-fixture.test.ts
git commit -m "test(ashen-rampart): 平原フィクスチャの凍結ガードを追加

反復6 は6マップを追加するが、PLAINS_MAP/PLAINS_WAVES は改変しない
（設計書 §5.2・§12 段階A0）。参照は33ファイル・326箇所あり、
step-tick-*.test.ts の26箇所が平原の座標を直書きしているため、
改変すると一斉に赤くなる。新マップは別名で追加する。

変異（ウェーブ2 の startTick を 260→261）で実効性を確認した。"
```

---

## Task 2: 派生シード

**Files:**
- Create: `src/features/ashen-rampart/domain/shared/derived-seed.ts`
- Create: `src/features/ashen-rampart/domain/shared/derived-seed.test.ts`

**Interfaces:**
- Consumes: なし（純関数）
- Produces: `derivedSeed(seed: number, purpose: SeedPurpose, index?: number): number`、`type SeedPurpose = 'stage-draw' | 'shuffle' | 'offer'`

**なぜ必要か:** 設計書 §4.4。単一ストリームを固定順序で消費すると、
**`noAcquire` が3択抽選を消費しないため以降のシャッフルが全部ずれ、§8.2 のゲートが壊れる。**
目的ごとに独立したシードを導けば、獲得の有無にかかわらずシャッフルを共有できる。

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { derivedSeed } from './derived-seed';

describe('derivedSeed', () => {
  it('同じ入力からは常に同じ値を返す（決定的）', () => {
    expect(derivedSeed(12345, 'shuffle', 0)).toBe(derivedSeed(12345, 'shuffle', 0));
  });

  it('目的が違えば違う値を返す', () => {
    expect(derivedSeed(12345, 'shuffle', 0)).not.toBe(derivedSeed(12345, 'offer', 0));
  });

  it('index が違えば違う値を返す', () => {
    expect(derivedSeed(12345, 'shuffle', 0)).not.toBe(derivedSeed(12345, 'shuffle', 1));
  });

  it('元のシードが違えば違う値を返す', () => {
    expect(derivedSeed(1, 'stage-draw')).not.toBe(derivedSeed(2, 'stage-draw'));
  });

  it('index を省略すると 0 を指定したのと同じ', () => {
    expect(derivedSeed(7, 'offer')).toBe(derivedSeed(7, 'offer', 0));
  });

  it('常に正の32bit整数を返す（SeededRandom に渡せる）', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const value = derivedSeed(seed, 'shuffle', seed % 3);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it('隣接するシードが衝突しない（1000件で重複なし）', () => {
    const values = new Set<number>();
    for (let seed = 1; seed <= 1000; seed++) values.add(derivedSeed(seed, 'shuffle', 0));
    expect(values.size).toBe(1000);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/shared/derived-seed.test.ts`
Expected: FAIL（`Cannot find module './derived-seed'`）

- [ ] **Step 3: 最小の実装を書く**

```ts
/**
 * 灰燼の城壁 - 派生シード（反復6・設計書 §4.4）
 *
 * 遠征は1つのシードから「ステージ抽選」「各ステージのシャッフル」「獲得の3択」を
 * 決めるが、**1本のストリームを順に消費してはいけない。**
 *
 * 較正では「獲得する腕」と「獲得しない腕」を比べる（設計書 §8.2 の G1）。
 * 単一ストリームだと、獲得しない腕は3択の抽選を消費しないため以降の
 * シャッフルが全部ずれ、**獲得が無力でも必ず差が出る**。それでは
 * ゲートが何も検出しない。
 *
 * 目的ごとに独立したシードを導けば、両腕で同じシャッフルを共有できる。
 * FNV-1a を32bitで回すだけの純関数で、暗号強度は要らない
 * （必要なのは決定性と、目的間で相関しないこと）。
 */

/** 派生の目的。増やすときは衝突しない名前にすること */
export type SeedPurpose = 'stage-draw' | 'shuffle' | 'offer';

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * 元のシード・目的・添字から、独立したシードを導く
 *
 * 戻り値は 1 以上 0xffffffff 以下の整数。`SeededRandom` にそのまま渡せる。
 */
export const derivedSeed = (seed: number, purpose: SeedPurpose, index = 0): number => {
  const source = `${seed >>> 0}:${purpose}:${index}`;
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  // 0 を避ける（値域の下端を 1 にするだけで、分布は実用上変わらない）
  return (hash >>> 0) || 1;
};
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/shared/derived-seed.test.ts`
Expected: PASS（7件すべて）

- [ ] **Step 5: 変異でテストの実効性を確認する**

`derivedSeed` の `source` から `purpose` を抜く（`` `${seed >>> 0}:${index}` ``）。

Run: 同上
Expected: **FAIL**（「目的が違えば違う値を返す」が落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/shared/derived-seed.ts \
        src/features/ashen-rampart/domain/shared/derived-seed.test.ts
git commit -m "feat(ashen-rampart): 目的ごとの派生シードを追加

遠征は1シードからステージ抽選・シャッフル・獲得の3択を決めるが、
単一ストリームを順に消費すると、獲得しない腕が3択の抽選を消費しない
ぶん以降のシャッフルがずれる。獲得が無力でも必ず差が出るため、
設計書 §8.2 のゲートが何も検出しなくなる（初版の欠陥）。

FNV-1a による純関数。変異（source から purpose を抜く）で実効性を確認した。"
```

---

## Task 3: カードの入手経路（`CardAvailability`）

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-definition.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`

**Interfaces:**
- Consumes: `CardDefinition`・`CARD_IDS`・`getCardDefinition`
- Produces: `type CardAvailability = 'buildable' | 'acquire-only' | 'retired'`、`availabilityOf(id: string): CardAvailability`、`BUILDABLE_CARD_IDS: readonly string[]`、`ACQUIRABLE_CARD_IDS: readonly string[]`

**なぜ必要か:** 設計書 §5.5 の獲得専用カード（構築で選べず獲得でのみ手に入る）と、
§4.6 の徴発（構築にも獲得にも出さないが定義は残す）を、**1つの概念で表す。**

**このタスクでは値を変えない。** 全カードが既定の `buildable` のままで、
実際に `retired` を付けるのは Task 5（`DECK_SIZE` の切り替えと同時でないと CI が赤になる）。

- [ ] **Step 1: 失敗するテストを書く**

`card-pool.test.ts` の末尾に追記する。import 行に
`availabilityOf, BUILDABLE_CARD_IDS, ACQUIRABLE_CARD_IDS` を足すこと。

```ts
describe('カードの入手経路（反復6）', () => {
  it('既定は buildable', () => {
    expect(availabilityOf('arrow-tower')).toBe('buildable');
  });

  it('BUILDABLE_CARD_IDS は buildable のみを含む', () => {
    BUILDABLE_CARD_IDS.forEach((id) => {
      expect(availabilityOf(id)).toBe('buildable');
    });
  });

  it('ACQUIRABLE_CARD_IDS は retired を含まず、buildable をすべて含む', () => {
    ACQUIRABLE_CARD_IDS.forEach((id) => {
      expect(availabilityOf(id)).not.toBe('retired');
    });
    BUILDABLE_CARD_IDS.forEach((id) => {
      expect(ACQUIRABLE_CARD_IDS).toContain(id);
    });
  });

  it('未知のカードIDは例外', () => {
    expect(() => availabilityOf('no-such-card')).toThrow('未知のカードIDです');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: FAIL（`availabilityOf is not a function` 相当）

- [ ] **Step 3: 実装する**

`card-definition.ts` に追加:

```ts
/**
 * カードの入手経路（反復6・設計書 §4.6 / §5.5）
 *
 * - `buildable`   : 構築画面で選べ、獲得の3択にも出る（既定）
 * - `acquire-only`: 構築では選べず、遠征中の獲得でのみ手に入る。
 *                   **獲得が「見たことのない札」で自己紹介するための仕掛け**
 * - `retired`     : 構築にも獲得にも出ないが、定義は残す。徴発がこれ
 */
export type CardAvailability = 'buildable' | 'acquire-only' | 'retired';
```

`CardDefinition` に `availability?: CardAvailability;` を追加する。

`card-pool.ts` の `maxCopiesOf` の直後に追加:

```ts
/** カードの入手経路。定義が無ければ 'buildable' */
export const availabilityOf = (id: string): CardAvailability =>
  getCardDefinition(id).availability ?? 'buildable';

/** 構築画面で選べる札 */
export const BUILDABLE_CARD_IDS: readonly string[] = CARD_IDS.filter(
  (id) => availabilityOf(id) === 'buildable'
);

/** 獲得の3択に出る札（buildable ＋ acquire-only） */
export const ACQUIRABLE_CARD_IDS: readonly string[] = CARD_IDS.filter(
  (id) => availabilityOf(id) !== 'retired'
);
```

`card-pool.ts` の import に `type CardAvailability` を足すこと。

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-definition.ts \
        src/features/ashen-rampart/domain/cards/card-pool.ts \
        src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat(ashen-rampart): カードの入手経路を型で表す

獲得専用カード（構築では選べず獲得でのみ出る）と、定義は残すが
どちらにも出さない札（徴発）を1つの概念で表す。設計書 §4.6・§5.5。

このコミットでは値を変えない。実際に retired を付けるのは
DECK_SIZE の切り替えと同時（それ以前に付けるとプリセットが壊れる）。"
```

**⚠️ この時点では `retired` の札が1枚も無いため、上のテストは空虚に緑である。**
実効性は Task 5 Step 8 の変異で確認する。**そこまで確認を持ち越すことを明示的に記録した。**

---

## Task 4: 実行時のデッキ検証（`validateRuntimeDeck`）

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/deck-builder.ts`
- Modify: `src/features/ashen-rampart/domain/cards/deck-builder.test.ts`

**Interfaces:**
- Consumes: `DECK_SIZE`・`maxCopiesOf`・`CARD_IDS`・`getCardDefinition`（`card-pool.ts`）、`DeckValidation`（既存）
- Produces: `validateRuntimeDeck(cards: readonly string[]): DeckValidation`、`RUNTIME_DECK_MAX: number`

**なぜ必要か:** **初版の設計が必ず落ちた箇所である。**
`start-run.ts:43` が `validateDeck` を呼び、`deck-builder.ts:37` は
`cards.length !== DECK_SIZE` なら例外を投げる。**獲得後の13枚では層2 の開始時に必ず落ちる。**

- [ ] **Step 1: 失敗するテストを書く**

`deck-builder.test.ts` の末尾に追記する。import に
`validateRuntimeDeck, RUNTIME_DECK_MAX` と、`card-pool` から `maxCopiesOf` を足すこと。

```ts
describe('validateRuntimeDeck（反復6・遠征中のデッキ）', () => {
  /** 同名上限を守りながら n 枚のデッキを作る */
  const base = (n: number): string[] => {
    const pool = ['reactor', 'arrow-tower', 'ballista', 'stone-wall', 'cannon-tower', 'beacon'];
    const cards: string[] = [];
    pool.forEach((id) => {
      while (cards.length < n && cards.filter((c) => c === id).length < maxCopiesOf(id)) {
        cards.push(id);
      }
    });
    return cards;
  };

  it('組み立てヘルパが要求どおりの枚数を返す（テスト自身の前提）', () => {
    expect(base(DECK_SIZE)).toHaveLength(DECK_SIZE);
    expect(base(RUNTIME_DECK_MAX + 1)).toHaveLength(RUNTIME_DECK_MAX + 1);
  });

  it('DECK_SIZE ちょうどは通る', () => {
    expect(validateRuntimeDeck(base(DECK_SIZE)).isValid).toBe(true);
  });

  it('獲得で増えた DECK_SIZE + 1 と RUNTIME_DECK_MAX も通る', () => {
    expect(validateRuntimeDeck(base(DECK_SIZE + 1)).isValid).toBe(true);
    expect(validateRuntimeDeck(base(RUNTIME_DECK_MAX)).isValid).toBe(true);
  });

  it('RUNTIME_DECK_MAX を1枚超えたら弾く（境界）', () => {
    expect(validateRuntimeDeck(base(RUNTIME_DECK_MAX + 1)).isValid).toBe(false);
  });

  it('DECK_SIZE を1枚下回ったら弾く（境界）', () => {
    expect(validateRuntimeDeck(base(DECK_SIZE - 1)).isValid).toBe(false);
  });

  it('同名上限は実行時も守る', () => {
    const over = [...base(DECK_SIZE), 'arrow-tower'];
    expect(over.filter((c) => c === 'arrow-tower').length).toBeGreaterThan(
      maxCopiesOf('arrow-tower')
    );
    expect(validateRuntimeDeck(over).isValid).toBe(false);
  });

  it('未知のカードは弾く', () => {
    expect(validateRuntimeDeck([...base(DECK_SIZE - 1), 'no-such-card']).isValid).toBe(false);
  });

  it('RUNTIME_DECK_MAX は DECK_SIZE + 2（獲得2回ぶん）', () => {
    expect(RUNTIME_DECK_MAX).toBe(DECK_SIZE + 2);
  });
});
```

**「組み立てヘルパが要求どおりの枚数を返す」を最初に置いた理由**: `base` は
同名上限に達するとプールを使い切って要求枚数に届かないことがある。
**ヘルパが黙って短い配列を返すと、境界のテストが「枚数が足りないから false」で
偶然通り、上限判定を一度も検査しないまま緑になる。**

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/deck-builder.test.ts`
Expected: FAIL（`validateRuntimeDeck is not a function`）

- [ ] **Step 3: 実装する（`validateDeck` は変更しない）**

```ts
/**
 * 遠征中に許されるデッキの最大枚数（反復6・設計書 §4.3）
 *
 * 獲得は2回なので DECK_SIZE + 2 が上限。
 */
export const RUNTIME_DECK_MAX = DECK_SIZE + 2;

/**
 * ステージ開始時のデッキ検証（反復6・設計書 §4.3）
 *
 * `validateDeck` は**構築時**の規則で、枚数が `DECK_SIZE` ちょうどであることを要求する。
 * 遠征では獲得でデッキが 12 → 13 → 14 と育つため、
 * **ステージ開始でこれを呼ぶと層2 で必ず例外になる**（初版の設計はここで落ちた）。
 *
 * 実行時に守るべきなのは「既知の札」「同名上限」「枚数が範囲内」だけである。
 * **入手経路は検査しない**——獲得専用の札は正当にデッキへ入るため。
 */
export const validateRuntimeDeck = (cards: readonly string[]): DeckValidation => {
  const errors: string[] = [];

  if (cards.length < DECK_SIZE || cards.length > RUNTIME_DECK_MAX) {
    errors.push(
      `遠征中のデッキは${DECK_SIZE}〜${RUNTIME_DECK_MAX}枚です（現在${cards.length}枚）`
    );
  }

  const unknown = cards.filter((id) => !CARD_IDS.includes(id));
  [...new Set(unknown)].forEach((id) => {
    errors.push(`未知のカードが含まれています: ${id}`);
  });

  countByCard(cards).forEach((count, id) => {
    if (!CARD_IDS.includes(id)) return;
    const limit = maxCopiesOf(id);
    if (count <= limit) return;
    errors.push(`${getCardDefinition(id).name}は${limit}枚までです（現在${count}枚）`);
  });

  return { isValid: errors.length === 0, errors };
};
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/deck-builder.test.ts`
Expected: PASS

- [ ] **Step 5: 変異で実効性を確認する**

上限判定を `cards.length > RUNTIME_DECK_MAX` → `cards.length > RUNTIME_DECK_MAX + 1` に変える。

Run: 同上
Expected: **FAIL**（「RUNTIME_DECK_MAX を1枚超えたら弾く（境界）」が落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/deck-builder.ts \
        src/features/ashen-rampart/domain/cards/deck-builder.test.ts
git commit -m "feat(ashen-rampart): 実行時のデッキ検証を構築時から分離

validateDeck は枚数ちょうどを要求するため、獲得で 12→13→14 と育つ
遠征ではステージ開始時に必ず例外になる（初版の設計が落ちた箇所）。

境界（DECK_SIZE-1 / RUNTIME_DECK_MAX / +1）で検査し、組み立てヘルパが
黙って短い配列を返さないことも先に検査した。変異（上限を +1 する）で
実効性を確認した。"
```

---

## Task 5: `DECK_SIZE` を12へ切り替える

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Modify: `src/features/ashen-rampart/domain/cards/deck-builder.ts`
- Modify: `src/features/ashen-rampart/domain/combat/balance.test.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`
- Modify: `src/features/ashen-rampart/domain/cards/deck-builder.test.ts`
- Modify: `src/features/ashen-rampart/presentation/DeckBuilder.test.tsx`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`

**Interfaces:**
- Consumes: Task 3 の `availabilityOf`
- Produces: `DECK_SIZE = 12`、`PRESET_DECKS`（12枚版）、`validateDeck` が `acquire-only` / `retired` を弾く

**⚠️ このタスクは分割できない。** `DECK_SIZE`・魔力炉の上限・徴発の `retired` 化・
プリセットの作り直し・`validateDeck` の検査は**互いに依存しており、途中で切ると CI が赤になる。**

**`balance.test.ts` の方針:** **20枚時代の較正として凍結し、生かしたまま残す。**
設計書 §8.5 は「鴉の間隔 10 と 18 の両方で反復4・5 の台本を回す」ことを求めており、
**その baseline はこのファイルにしかない。** 遠征の較正は段階D で別ファイルに作る。

- [ ] **Step 1: `balance.test.ts` を本番の `DECK_SIZE` から切り離す**

冒頭 docstring に追記する。

```
 * ⚠️ このファイルは **20枚デッキ時代（反復1〜5）の較正**である。
 *
 * 反復6 で本番の DECK_SIZE は 12 になったが、ここは LEGACY_DECK_SIZE = 20 と
 * 凍結した PLAINS_WAVES を使い続ける。理由は2つ:
 *
 * 1. 設計書 §8.5 の宿題（鴉の間隔 10 と 18 で撃破位置がどれだけ動くか）は
 *    反復4・5 と同じ条件でしか測れない。**その baseline はここにしかない**
 * 2. 遠征の較正は前提（ステージ長・デッキ枚数・ライフ持ち越し）が全部違う。
 *    同じファイルに混ぜるとどちらの結論なのか読めなくなる
 *
 * 遠征の較正は段階D で expedition-balance.test.ts として別に作る。
```

変更点:

- `import { DECK_SIZE, maxCopiesOf, getCardDefinition } from '../cards/card-pool';` から `DECK_SIZE` を外す
- `import { validateDeck } from '../cards/deck-builder';` の行を削除する
- 冒頭の定数群に追加:

```ts
/** 20枚デッキ時代の枚数。本番の DECK_SIZE（12）とは独立に凍結する */
const LEGACY_DECK_SIZE = 20;

/**
 * 反復5 時点の同名上限
 *
 * **本番の `maxCopiesOf` は使えない。** 反復6 で魔力炉の例外を外したため、
 * `OFF_PATH_DOMINANT_DECK`（魔力炉5）が「不正なデッキ」になってしまう。
 * このファイルが記録しているのは**反復5 時点の実測**であり、
 * そのとき魔力炉は無制限だった。
 */
const legacyMaxCopiesOf = (id: string): number =>
  id === 'reactor' ? LEGACY_DECK_SIZE : MAX_COPIES;

/** 20枚デッキが反復5 時点の構築規則を満たすか */
const legacyDeckErrors = (cards: readonly string[]): string[] => {
  const errors: string[] = [];
  if (cards.length !== LEGACY_DECK_SIZE) errors.push(`枚数が${cards.length}`);
  const counts = new Map<string, number>();
  cards.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  counts.forEach((count, id) => {
    if (count > legacyMaxCopiesOf(id)) errors.push(`${id}が${count}枚`);
  });
  return errors;
};
```

`card-pool` からの import に `MAX_COPIES` を足すこと。

- `padToDeckSize` の中の `DECK_SIZE` を**すべて** `LEGACY_DECK_SIZE` に置換（198・202・203行の3箇所）
- `padToDeckSize` の中の `maxCopiesOf(id)` を `legacyMaxCopiesOf(id)` に置換（198行）
- 218・234行の `toHaveLength(DECK_SIZE)` → `toHaveLength(LEGACY_DECK_SIZE)`
- 219・235・393・519行の `expect(validateDeck(X).errors).toEqual([])` → `expect(legacyDeckErrors(X)).toEqual([])`
- 292行付近のコメント「DECK_SIZE や DRAW_INTERVAL_TICKS が…」→「LEGACY_DECK_SIZE や…」
- **支配デッキ関連の2本のテスト名を、事実に合わせて狭める。** 反復6 で魔力炉の上限を
  戻したため、`OFF_PATH_DOMINANT_DECK`（魔力炉5）は**もはや本番の構築規則では合法でない**:
  - `it('⚠️ 既知の欠陥: 塔だけの合法デッキが素直な戦略で全勝する')` →
    `it('⚠️ 反復5 の規則で合法だった塔だけデッキが、素直な戦略で全勝する')`
  - 同じ趣旨の注記を `it.failing('どのデッキでも…')` の docstring にも足す:
    「**反復6 で魔力炉の上限を戻したため、このデッキは本番の構築規則では組めない。
    ここは反復5 時点の実測の記録として残す。12枚デッキ空間の支配戦略は
    段階D で `expedition-balance.test.ts` が別に探索する**」

**⚠️ `it.failing` を「直った」と判断して通常の `it` に戻さないこと。**
設計書 §10.3 が言う「反復6 で支配デッキを解消したら戻す」の対象は
**12枚デッキ空間の話**であり、このファイルが測っているのは20枚時代である。
**段階0 の実測では、12枚でも層1・層2 で経路外のみが 20/20・18/20 と大きく破れている。**
戻せるかどうかは段階D で判断する。

- [ ] **Step 2: 対照条件の生成器が入力を切り捨てていないことを検査する**

`describe('対照条件の作り方')` に追加する。**これは敵対的検証で見つかった静かな失敗経路である**——
`padToDeckSize` は最後に `.slice(0, LEGACY_DECK_SIZE)` するため、入力が上限を超えていると
**黙って札を落とし、対照条件は緑のまま意味だけが変わる。**

```ts
it('padToDeckSize は入力を切り捨てていない', () => {
  const predicates = [hasAntiAir, hasMassAnswer, hasAreaDamage, hasPiercing];
  predicates.forEach((isExcluded) => {
    const kept = FULL_DECK.filter((id) => !isExcluded(id));
    expect(kept.length).toBeLessThanOrEqual(LEGACY_DECK_SIZE);
  });
});
```

述語名は既存の定義に合わせること（このファイルの冒頭で定義されている）。

- [ ] **Step 3: `balance.test.ts` が緑のままであることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/balance.test.ts`
Expected: PASS（約100秒）

**ここで緑にしてから次へ進む。** `DECK_SIZE` を変えてから直そうとすると、
較正の失敗なのか切り離しの失敗なのか切り分けられなくなる。

- [ ] **Step 4: `card-pool.ts` を12枚版へ切り替える**

```ts
/** デッキの枚数（反復6 で 20 → 12。設計書 §4.6） */
export const DECK_SIZE = 12;
```

魔力炉の `maxCopies: DECK_SIZE,` の行を**削除**し、直前のコメントを差し替える:

```ts
    // 盤面では3〜4基で消費レート（3マナ/60tick）を飽和させるため、並べるほど強くはならない。
    //
    // **反復6 で同名上限の例外を外した。** 20枚中3枚(15%)ではマナ基盤が
    // 確立する前にランが進んでいたため上限を外していたが、12枚中3枚は25%で
    // 確実に引ける。例外の理由が消えた。
    // **支配デッキ対策ではない**（設計書 §4.5——魔力炉3＋攻撃塔3種×3 の
    // 塔だけ12枚は依然として合法である。初版はここを論証の誤りで塞いだつもりでいた）
```

徴発の定義に追加:

```ts
    // **反復6 で構築・獲得の両プールから外した（設計書 §4.6）。**
    // 山札の上から3枚を一括で焼くため、12枚デッキでは山札の33%が一度に消える。
    // 実測で枯渇 tick 360→276、出せた枚数 11.3→10.1、無操作の尾 9.9%→20.8%。
    // 「獲得した札は次のステージで必ず引かれる」という構造的保証を壊す。
    // さらに「3枚見て1枚選ぶ」は獲得とまったく同じ動詞である。
    // 定義は残す（較正で20枚時代を再現するのに要る）。反復7 で12枚経済へ再設計する。
    availability: 'retired',
```

プリセットを12枚版に差し替える。**並び順にも意味がある**（シャッフルは入力配列の順序に
依存し、枚数構成が同一でも並べ替えるだけで実測勝率が動く）。**この順序のまま段階D で較正する。**

```ts
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '石壁で受けつつ、安い弓兵と棘罠で手数を稼ぐ。群れは火砲台、対空は弩砲、仕上げに徹甲弩。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('stone-wall', 2),
      ...repeat('arrow-tower', 2),
      ...repeat('ballista', 2),
      'cannon-tower',
      'spike-trap',
      'piercer',
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '石壁で足を止め、徹甲弩と投石機で火力を通す。飛行は落網で落として叩く。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('stone-wall', 2),
      ...repeat('piercer', 2),
      ...repeat('snare-net', 2),
      'catapult',
      'ballista',
      'beacon',
    ],
  },
```

プリセットの docstring の較正実測表に注記を足す:

```
 * **⚠️ 反復6 で12枚版に作り直した。上の実測値は20枚時代のものである。**
 * 12枚版の較正は段階D で行う。それまでこの表の数値を根拠に使わないこと。
```

- [ ] **Step 5: `validateDeck` に入手経路の検査を足す**

`validateDeck` の同名上限チェックの後ろに追加する。

```ts
  // 構築で選べない札が混ざっていないか（反復6・設計書 §5.5）
  //
  // UI で隠すだけでは startRunWithDeck に獲得専用札のデッキを渡せてしまう。
  // 「テストは通るが UI で組めないデッキ」を作らないため、ここで弾く。
  [...new Set(cards)].forEach((id) => {
    if (!CARD_IDS.includes(id)) return;
    const availability = availabilityOf(id);
    if (availability === 'buildable') return;
    const name = getCardDefinition(id).name;
    errors.push(
      availability === 'acquire-only'
        ? `${name}は遠征中の獲得でしか手に入りません`
        : `${name}は現在デッキに入れられません`
    );
  });
```

`deck-builder.ts` の import に `availabilityOf` を足すこと。

- [ ] **Step 6: 既存テストを12枚前提へ移行する**

| ファイル | 直す内容 |
|---|---|
| `card-pool.test.ts:175-178` | `expect(unlimited).toEqual(['reactor'])` → `expect(unlimited).toEqual([])`。テスト名を「同名上限に例外を持つカードは無い」に直す |
| `card-pool.test.ts:186-188` | プリセットの `toHaveLength(20)` → `toHaveLength(DECK_SIZE)` |
| `deck-builder.test.ts:12-21,43-44,108-118` | 20枚リテラルを Task 4 の `base(DECK_SIZE)` と同じ作り方で組み直す |
| `deck-builder.test.ts:25,33` | `toContain('20')` → `toContain(String(DECK_SIZE))` |
| `deck-builder.test.ts:120-122` | `expect(maxCopiesOf('reactor')).toBe(DECK_SIZE)` → `.toBe(MAX_COPIES)`。テスト名も直す |
| `DeckBuilder.test.tsx:145` | `/20枚ちょうどにしてください/` → `` new RegExp(`${DECK_SIZE}枚ちょうどにしてください`) `` |
| `useAshenRampartGame.test.ts:37-44` | `emberDeckCards()` の20枚リテラルを12枚へ。**業火を含めること**（このテストの主題）。例: `['ember-blast', 'reactor','reactor','reactor', 'arrow-tower','arrow-tower','arrow-tower', 'stone-wall','stone-wall','stone-wall', 'ballista', 'cannon-tower']` |
| `start-run.test.ts:17` | `DECK_SIZE - INITIAL_HAND_SIZE` は定数経由なので**変更不要**。実行して確認する |

- [ ] **Step 7: 全テストを実行して緑を確認する**

Run: `npm test`
Expected: PASS（`balance.test.ts` を含むので3〜4分）

赤が残ったら、**上の表に無いファイル**が出ていないか確認する。
出ていたらそのファイルも直し、**この表に追記してからコミットする。**

- [ ] **Step 8: 変異で Task 3 のテストの実効性を確認する（持ち越していた確認）**

`card-pool.ts` の `ACQUIRABLE_CARD_IDS` の述語を `!== 'retired'` → `=== 'buildable'` に変える。
（徴発が `retired` になったので、これで両者の差が初めて観測できる）

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: この変異では**まだ緑になる可能性がある**（`acquire-only` の札が段階B まで存在しないため）。
そこで**次のテストを `card-pool.test.ts` に追加してから**再度変異させる:

```ts
it('徴発は構築にも獲得にも出ないが、定義は残っている（反復6 §4.6）', () => {
  expect(availabilityOf('levy')).toBe('retired');
  expect(BUILDABLE_CARD_IDS).not.toContain('levy');
  expect(ACQUIRABLE_CARD_IDS).not.toContain('levy');
  expect(CARD_IDS).toContain('levy');
});
```

追加後、`availability: 'retired'` を一時的に削除して実行する。
Expected: **FAIL**（4つの assertion のうち3つが落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 9: `npm run ci` を通す**

Run: `npm run ci`
Expected: `lint:ci` → `typecheck` → `test:coverage` → `build` がすべて緑

- [ ] **Step 10: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "feat(ashen-rampart): デッキを20枚から12枚へ

遠征では獲得した1枚が次のステージで必ず引かれることを構造で保証する
（設計書 §4.6）。12枚・ドロー間隔40 なら山札は 360 tick で尽き、
420〜560 tick のステージでほぼ全枚数を引く（段階0 の実測で 11.3/12）。

- 魔力炉の同名上限の例外を外した。20枚中3枚(15%)では引けなかったが
  12枚中3枚は25%で、例外の理由が消えた。支配デッキ対策ではない
- 徴発を retired にした。山札の33%を一度に焼いて構造的保証を壊し
  （実測: 枯渇 360→276、尾 9.9%→20.8%）、かつ獲得と同じ動詞である
- validateDeck が入手経路を検査する。UI で隠すだけでは
  startRunWithDeck に獲得専用札のデッキを渡せてしまう
- balance.test.ts は LEGACY_DECK_SIZE=20 で凍結した。設計書 §8.5 の
  鴉の対抗仮説は反復4・5 と同じ条件でしか測れず、その baseline は
  このファイルにしかない。遠征の較正は段階D で別ファイルに作る
- padToDeckSize が入力を切り捨てていないことの検査を追加した
  （対照条件が緑のまま意味だけ変わる経路。敵対的検証で発覚）

中間状態: 単一ラン版は 12枚/反復5台本 で 3/20 と極端に難しくなるが、
遠征では1ステージ 420〜560 tick になるので解消する（段階C）。"
```

---

## Task 6: ステージ間で持ち越すライフ

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.test.ts`

**Interfaces:**
- Consumes: `LIFE_INITIAL`・`DeckState`・`WaveDefinition`
- Produces: `createCombatState(deck, waves, initialLife?: number)`（省略時 `LIFE_INITIAL`）、`STAGE_CLEAR_HEAL: number`

**なぜ必要か:** 設計書 §4.1。**既定引数にするので `createCombatState` の
既存呼び出し110箇所は無変更で通る。**

- [ ] **Step 1: 失敗するテストを書く**

`step-tick.test.ts` の末尾に追記する。import に `STAGE_CLEAR_HEAL` を足すこと。

```ts
describe('ステージ間で持ち越すライフ（反復6・設計書 §4.1）', () => {
  const anyDeck = createDeck(PRESET_DECKS.swift.cards, () => 0.5);

  it('初期ライフを省略すると LIFE_INITIAL で始まる（既存の呼び出しを壊さない）', () => {
    expect(createCombatState(anyDeck, PLAINS_WAVES).life).toBe(LIFE_INITIAL);
  });

  it('初期ライフを渡すとその値で始まる', () => {
    expect(createCombatState(anyDeck, PLAINS_WAVES, 7).life).toBe(7);
  });

  it('LIFE_INITIAL と異なる値で検査している（テスト自身の前提）', () => {
    expect(LIFE_INITIAL).not.toBe(7);
  });

  it('初期ライフ0 でもそのまま作れる（決着判定は stepTick が行う）', () => {
    expect(createCombatState(anyDeck, PLAINS_WAVES, 0).life).toBe(0);
  });

  it('STAGE_CLEAR_HEAL は正の整数（較正対象だが符号は変えない）', () => {
    expect(Number.isInteger(STAGE_CLEAR_HEAL)).toBe(true);
    expect(STAGE_CLEAR_HEAL).toBeGreaterThan(0);
  });
});
```

**「LIFE_INITIAL と異なる値で検査している」を入れた理由**: もし `LIFE_INITIAL` が
将来 7 に変わると、「初期ライフを渡すとその値で始まる」は**実装を revert しても通る**。

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick.test.ts -t "ステージ間で持ち越すライフ"`
Expected: FAIL（`STAGE_CLEAR_HEAL` が未定義、初期ライフ7 が 12 になる）

- [ ] **Step 3: 実装する**

`combat-state.ts` に追加:

```ts
/**
 * ステージクリア時のライフ回復（反復6・設計書 §4.1）
 *
 * 遠征はライフを3ステージに持ち越すため、回復が無いと層1 の失点が
 * そのまま層3 の敗北を決める。**較正対象**（段階D）だが、
 * 「回復する」という符号自体は設計の一部なので 0 や負にはしない。
 */
export const STAGE_CLEAR_HEAL = 3;
```

`createCombatState` のシグネチャを変える:

```ts
/**
 * ラン開始時の戦闘状態を作る
 *
 * `initialLife` は遠征がステージ間でライフを持ち越すために使う（反復6）。
 * 省略時は `LIFE_INITIAL`——**既存の呼び出し110箇所を無変更で通すため。**
 */
export const createCombatState = (
  deck: DeckState,
  waves: readonly WaveDefinition[],
  initialLife: number = LIFE_INITIAL
): CombatState => ({
  tick: 0,
  life: initialLife,
  // 以降は既存のまま
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick.test.ts -t "ステージ間で持ち越すライフ"`
Expected: PASS

- [ ] **Step 5: 既存の全テストが無変更で通ることを確認する**

Run: `npx jest src/features/ashen-rampart`
Expected: PASS

- [ ] **Step 6: 変異で実効性を確認する**

`life: initialLife` を `life: LIFE_INITIAL` に戻す。

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick.test.ts -t "ステージ間で持ち越すライフ"`
Expected: **FAIL**（「初期ライフを渡すとその値で始まる」が落ちる）

確認できたら元に戻す。

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/combat-state.ts \
        src/features/ashen-rampart/domain/combat/step-tick.test.ts
git commit -m "feat(ashen-rampart): ステージ開始時のライフを指定できるようにする

遠征はライフを3ステージに持ち越す（設計書 §4.1）。既定引数にしたので
createCombatState の既存呼び出し110箇所は無変更で通る。

STAGE_CLEAR_HEAL は段階D の較正対象だが、符号（回復する）は設計の一部。
変異（initialLife を LIFE_INITIAL に戻す）で実効性を確認した。"
```

---

## Task 7: ステージ定義と暫定ステージプール

**Files:**
- Create: `src/features/ashen-rampart/domain/expedition/stage-definition.ts`
- Create: `src/features/ashen-rampart/domain/expedition/stage-definition.test.ts`
- Create: `src/features/ashen-rampart/domain/expedition/stage-pool.ts`
- Create: `src/features/ashen-rampart/domain/expedition/stage-pool.test.ts`

**Interfaces:**
- Consumes: `StageMap`・`PLAINS_MAP`（`domain/board/stage-map.ts`）、`WaveDefinition`（`domain/combat/waves.ts`）、`getCardDefinition`（`domain/cards/card-pool.ts`）
- Produces:
  - `type StageTier = 1 | 2 | 3`
  - `type DemandAxis = 'block' | 'anti-air' | 'mass-answer' | 'heavy-hit'`
  - `interface StageDefinition { id: string; name: string; tier: StageTier; map: StageMap; waves: readonly WaveDefinition[]; demands: readonly DemandAxis[] }`
  - `axesOf(cardId: string): readonly DemandAxis[]`
  - `PROVISIONAL_STAGES: readonly StageDefinition[]`（6つ）
  - `stagesOfTier(tier: StageTier): readonly StageDefinition[]`

**⚠️ 暫定ステージは段階B で捨てる。** 段階A の目的は骨格と `G1` であって、
コンテンツではない。台本は**段階0 の検算で実測に使ったもの**をそのまま使う
（決着 488 / 540 / 720 tick、枯渇 360 tick が実測済み）。

- [ ] **Step 1: `axesOf` の失敗するテストを書く**

```ts
import { axesOf } from './stage-definition';

describe('axesOf（カードが満たす要求軸）', () => {
  it('石壁は block（HP60 の壁）', () => {
    expect(axesOf('stone-wall')).toContain('block');
  });

  it('弓兵は block を満たさない（HP8）', () => {
    expect(axesOf('arrow-tower')).not.toContain('block');
  });

  it('弩砲は anti-air（hitsFlying）', () => {
    expect(axesOf('ballista')).toContain('anti-air');
  });

  it('落網は anti-air（飛行を地上化する罠）', () => {
    expect(axesOf('snare-net')).toContain('anti-air');
  });

  it('弓兵は anti-air を満たさない（hitsFlying: false）', () => {
    expect(axesOf('arrow-tower')).not.toContain('anti-air');
  });

  it('火砲台は mass-answer（範囲）と heavy-hit（12ダメージ）を両方満たす', () => {
    expect(axesOf('cannon-tower')).toEqual(expect.arrayContaining(['mass-answer', 'heavy-hit']));
  });

  it('徹甲弩は mass-answer（貫通）を満たす', () => {
    expect(axesOf('piercer')).toContain('mass-answer');
  });

  it('業火は mass-answer を満たす', () => {
    expect(axesOf('ember-blast')).toContain('mass-answer');
  });

  it('弩砲は heavy-hit を満たさない（9ダメージ・境界の下側）', () => {
    // heavy-hit の閾値は 12。弩砲は 9 なので通らない。
    // 火砲台(12)がちょうど通り、弩砲(9)が通らないことで境界を検査している。
    expect(axesOf('ballista')).not.toContain('heavy-hit');
  });

  it('魔力炉はどの軸も満たさない', () => {
    expect(axesOf('reactor')).toEqual([]);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/stage-definition.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: `stage-definition.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - ステージ定義（反復6・設計書 §4.3 / §5.2）
 *
 * 難度カーブを「層の易しさ」ではなく **同時に満たすべき軸の本数** で作る。
 * 段階0 の実測で、易しく作った層では経路外のみ戦略が 20/20 勝ってしまい、
 * 宣言した要求軸がどれも成立していなかった（設計書 §2.5(e)）。
 * **易しい層は「何を置いても勝てる」＝支配戦略の成立する場所になる。**
 */
import type { StageMap } from '../board/stage-map';
import type { WaveDefinition } from '../combat/waves';
import { getCardDefinition } from '../cards/card-pool';

export type StageTier = 1 | 2 | 3;

/**
 * ステージが要求する軸
 *
 * **デッキ述語で表せるものだけを列挙する。** 「摩尔」「優先撃破」「配分」「持久」は
 * 較正ハーネスで測れない（設計書 §7.1）ので、ここには入れない。
 * とくに優先撃破は**プレイヤーに標的を選ぶ操作が存在しない**ため要求できない。
 */
export type DemandAxis = 'block' | 'anti-air' | 'mass-answer' | 'heavy-hit';

export interface StageDefinition {
  id: string;
  name: string;
  tier: StageTier;
  map: StageMap;
  waves: readonly WaveDefinition[];
  /** 層1 は1本、層2 は2本、層3 は3本 */
  demands: readonly DemandAxis[];
}

/** block とみなす守り手のHP下限。石壁(60)だけが通り、弓兵(8)などは通らない */
const BLOCK_HP_THRESHOLD = 40;
/** heavy-hit とみなす1発のダメージ下限。火砲台(12)がちょうど通り、弩砲(9)は通らない */
const HEAVY_HIT_DAMAGE_THRESHOLD = 12;

/**
 * そのカードが満たす要求軸
 *
 * カード定義から導く（ID の直書きにしない）ので、段階B で追加する
 * 新カードも自動で拾われる。
 */
export const axesOf = (cardId: string): readonly DemandAxis[] => {
  const card = getCardDefinition(cardId);
  const tower = card.tower;
  const axes: DemandAxis[] = [];

  if (tower && tower.hp >= BLOCK_HP_THRESHOLD) axes.push('block');
  if ((tower?.hitsFlying ?? false) || card.trap?.groundedTicks !== undefined) axes.push('anti-air');
  if ((tower && (tower.splashRadius > 0 || tower.piercing === true)) || card.ember !== undefined) {
    axes.push('mass-answer');
  }
  if (tower && tower.damage >= HEAVY_HIT_DAMAGE_THRESHOLD) axes.push('heavy-hit');

  return axes;
};
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/stage-definition.test.ts`
Expected: PASS（10件）

- [ ] **Step 5: 暫定ステージプールの失敗するテストを書く**

```ts
import { PROVISIONAL_STAGES, stagesOfTier } from './stage-pool';
import { PLAINS_MAP } from '../board/stage-map';

describe('暫定ステージプール（段階A。段階B で置き換える）', () => {
  it('6ステージある', () => {
    expect(PROVISIONAL_STAGES).toHaveLength(6);
  });

  it('各層にちょうど2つある', () => {
    expect(stagesOfTier(1)).toHaveLength(2);
    expect(stagesOfTier(2)).toHaveLength(2);
    expect(stagesOfTier(3)).toHaveLength(2);
  });

  it('ID が一意', () => {
    const ids = PROVISIONAL_STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('要求軸の本数が層番号と一致する（設計書 §5.2 の A案）', () => {
    PROVISIONAL_STAGES.forEach((stage) => {
      expect(stage.demands).toHaveLength(stage.tier);
    });
  });

  it('同じ層の2ステージは要求軸の組み合わせが異なる（抽選に意味を持たせる）', () => {
    ([1, 2, 3] as const).forEach((tier) => {
      const [a, b] = stagesOfTier(tier);
      expect([...(a?.demands ?? [])].sort()).not.toEqual([...(b?.demands ?? [])].sort());
    });
  });

  it('凍結した PLAINS_MAP をそのまま参照している（改変していない）', () => {
    PROVISIONAL_STAGES.forEach((stage) => {
      expect(stage.map).toBe(PLAINS_MAP);
    });
  });

  it('ウェーブは空でなく、開始tick が昇順', () => {
    PROVISIONAL_STAGES.forEach((stage) => {
      expect(stage.waves.length).toBeGreaterThan(0);
      const ticks = stage.waves.map((w) => w.startTick);
      expect(ticks).toEqual([...ticks].sort((x, y) => x - y));
    });
  });
});
```

- [ ] **Step 6: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/stage-pool.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 7: `stage-pool.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - 暫定ステージプール（反復6 段階A）
 *
 * **⚠️ これは段階A の足場であり、段階B で6つの新マップに置き換える。**
 * 段階A の目的は遠征の骨格と G1（獲得の測定可能性ゲート）であって、
 * コンテンツではない。
 *
 * マップは凍結した PLAINS_MAP をそのまま参照する（設計書 §5.2・段階A0）。
 * 台本は段階0 の検算で実測に使ったものをそのまま置いた——
 * 全要求充足12枚デッキ・greedyStrategy・シード1〜20 での実測は
 * 決着 488 / 540 / 720 tick、山札の枯渇はいずれも 360 tick である。
 *
 * **要求軸（demands）は暫定であり、台本がその軸を本当に要求するかは
 * まだ検査していない**（それは段階D の不変条件 C1 の仕事）。
 * G1 が「差が出ない」と判定した場合、原因が機構なのか
 * 「暫定台本が軸を要求していないこと」なのかを先に切り分けること。
 */
import { PLAINS_MAP } from '../board/stage-map';
import type { WaveDefinition } from '../combat/waves';
import type { StageDefinition, StageTier } from './stage-definition';

const tier1North: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  {
    startTick: 260,
    entries: [
      { enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 },
      { enemyId: 'runner', count: 2, spawnIntervalTicks: 6, laneIndex: 1 },
    ],
  },
];

const tier1Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 260, entries: [{ enemyId: 'swarm', count: 10, spawnIntervalTicks: 1, laneIndex: 1 }] },
];

const tier2Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 }] },
  { startTick: 340, entries: [{ enemyId: 'swarm', count: 12, spawnIntervalTicks: 1, laneIndex: 1 }] },
];

const tier2Raven: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 }] },
  { startTick: 340, entries: [{ enemyId: 'raven', count: 8, spawnIntervalTicks: 18, laneIndex: 1 }] },
];

const tier3Raven: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'swarm', count: 10, spawnIntervalTicks: 1, laneIndex: 1 }] },
  {
    startTick: 380,
    entries: [
      { enemyId: 'brute', count: 3, spawnIntervalTicks: 15, laneIndex: 0 },
      { enemyId: 'raven', count: 6, spawnIntervalTicks: 18, laneIndex: 1 },
      { enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 },
    ],
  },
];

const tier3Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'swarm', count: 14, spawnIntervalTicks: 1, laneIndex: 1 }] },
  {
    startTick: 380,
    entries: [
      { enemyId: 'brute', count: 4, spawnIntervalTicks: 15, laneIndex: 0 },
      { enemyId: 'swarm', count: 10, spawnIntervalTicks: 1, laneIndex: 1 },
    ],
  },
];

export const PROVISIONAL_STAGES: readonly StageDefinition[] = [
  { id: 'prov-t1-a', name: '隘路（暫定）', tier: 1, map: PLAINS_MAP, waves: tier1North, demands: ['block'] },
  { id: 'prov-t1-b', name: '涸れ沢（暫定）', tier: 1, map: PLAINS_MAP, waves: tier1Swarm, demands: ['mass-answer'] },
  { id: 'prov-t2-a', name: '石切場（暫定）', tier: 2, map: PLAINS_MAP, waves: tier2Swarm, demands: ['block', 'mass-answer'] },
  { id: 'prov-t2-b', name: '鴉の谷（暫定）', tier: 2, map: PLAINS_MAP, waves: tier2Raven, demands: ['block', 'anti-air'] },
  { id: 'prov-t3-a', name: '城下（暫定）', tier: 3, map: PLAINS_MAP, waves: tier3Raven, demands: ['block', 'anti-air', 'heavy-hit'] },
  { id: 'prov-t3-b', name: '灰の丘（暫定）', tier: 3, map: PLAINS_MAP, waves: tier3Swarm, demands: ['block', 'mass-answer', 'heavy-hit'] },
];

/** 指定した層のステージ。抽選はここから選ぶ */
export const stagesOfTier = (tier: StageTier): readonly StageDefinition[] =>
  PROVISIONAL_STAGES.filter((s) => s.tier === tier);
```

- [ ] **Step 8: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/stage-pool.test.ts`
Expected: PASS（7件）

- [ ] **Step 9: 変異で実効性を確認する**

`prov-t1-b` の `demands` を `['mass-answer']` → `['block']` に変える。

Run: 同上
Expected: **FAIL**（「同じ層の2ステージは要求軸の組み合わせが異なる」が落ちる）

確認できたら元に戻す。

- [ ] **Step 10: コミット**

```bash
git add src/features/ashen-rampart/domain/expedition/stage-definition.ts \
        src/features/ashen-rampart/domain/expedition/stage-definition.test.ts \
        src/features/ashen-rampart/domain/expedition/stage-pool.ts \
        src/features/ashen-rampart/domain/expedition/stage-pool.test.ts
git commit -m "feat(ashen-rampart): ステージ定義と暫定ステージプールを追加

難度カーブを層の易しさではなく「同時に満たすべき軸の本数」で作る
（設計書 §5.2 A案）。段階0 の実測で、易しく作った層では経路外のみ戦略が
20/20 勝ち、宣言した要求軸がどれも成立していなかった。

要求軸はデッキ述語で表せるものだけを列挙した。摩耗・優先撃破・配分・持久は
較正ハーネスで測れないので入れていない（§7.1）。とくに優先撃破は
プレイヤーに標的を選ぶ操作が存在しないため要求できない。

axesOf はカード定義から導くので、段階B の新カードも自動で拾われる。
境界（火砲台12 が通り弩砲9 が通らない）で検査した。

暫定ステージは段階B で6つの新マップに置き換える。台本は段階0 の検算で
実測に使ったもの（決着 488/540/720 tick、枯渇 360 tick）。"
```

---

## Task 8: ステージ抽選

**Files:**
- Create: `src/features/ashen-rampart/domain/expedition/stage-draw.ts`
- Create: `src/features/ashen-rampart/domain/expedition/stage-draw.test.ts`

**Interfaces:**
- Consumes: `stagesOfTier`（Task 7）、`RandomFn`（`domain/shared/random.ts`）
- Produces: `drawStages(rng: RandomFn): readonly StageDefinition[]`（層1→2→3 の順に3つ）

**なぜ `rng` を引数で受けるか:** `domain/` は `infrastructure/` を参照できない。
`SeededRandom` の生成は application 層が行い、ここには関数だけを渡す（既存の `createDeck` と同じ形）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { drawStages } from './stage-draw';
import { stagesOfTier } from './stage-pool';

/** 決められた値を順に返す rng（決定性の検査用） */
const scriptedRng = (values: readonly number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe('drawStages', () => {
  it('層1→2→3 の順に3つ返す', () => {
    const stages = drawStages(scriptedRng([0]));
    expect(stages).toHaveLength(3);
    expect(stages.map((s) => s.tier)).toEqual([1, 2, 3]);
  });

  it('rng が 0 に近い値を返すと各層の1つ目を選ぶ', () => {
    const stages = drawStages(scriptedRng([0]));
    expect(stages[0]?.id).toBe(stagesOfTier(1)[0]?.id);
    expect(stages[1]?.id).toBe(stagesOfTier(2)[0]?.id);
    expect(stages[2]?.id).toBe(stagesOfTier(3)[0]?.id);
  });

  it('rng が 1 に近い値を返すと各層の2つ目を選ぶ', () => {
    const stages = drawStages(scriptedRng([0.999]));
    expect(stages[0]?.id).toBe(stagesOfTier(1)[1]?.id);
    expect(stages[1]?.id).toBe(stagesOfTier(2)[1]?.id);
    expect(stages[2]?.id).toBe(stagesOfTier(3)[1]?.id);
  });

  it('層ごとに1回ずつ rng を引く（消費数が固定＝再生可能性の前提）', () => {
    let calls = 0;
    drawStages(() => {
      calls++;
      return 0.5;
    });
    expect(calls).toBe(3);
  });

  it('同じ rng 列からは同じ結果（決定的）', () => {
    const a = drawStages(scriptedRng([0.1, 0.9, 0.4]));
    const b = drawStages(scriptedRng([0.1, 0.9, 0.4]));
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
  });

  it('8通りすべてが出うる（2×2×2）', () => {
    const combos = new Set<string>();
    [0, 0.999].forEach((a) =>
      [0, 0.999].forEach((b) =>
        [0, 0.999].forEach((c) => {
          combos.add(drawStages(scriptedRng([a, b, c])).map((s) => s.id).join('|'));
        })
      )
    );
    expect(combos.size).toBe(8);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/stage-draw.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: 実装する**

```ts
/**
 * 灰燼の城壁 - ステージ抽選（反復6・設計書 §5.2）
 *
 * 各層から1つずつ選ぶので 2×2×2 = 8通りの遠征が成立する。
 * **層で難度を保証しているため、抽選が難度カーブを壊さない。**
 *
 * rng は**層ごとにちょうど1回**引く。消費数が固定であることは
 * 再生可能性の前提である（設計書 §4.4）。
 */
import type { RandomFn } from '../shared/random';
import type { StageDefinition, StageTier } from './stage-definition';
import { stagesOfTier } from './stage-pool';

const TIERS: readonly StageTier[] = [1, 2, 3];

/** 層1→2→3 の順に1つずつ選ぶ */
export const drawStages = (rng: RandomFn): readonly StageDefinition[] =>
  TIERS.map((tier) => {
    const candidates = stagesOfTier(tier);
    const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
    const stage = candidates[index];
    if (!stage) {
      throw new Error(`層${tier}のステージが定義されていません`);
    }
    return stage;
  });
```

`Math.min` で丸めているのは、`rng()` が 1.0 を返した場合に添字が範囲外になるのを防ぐため
（`RandomFn` の契約は「0以上1未満」だが、テスト用のスタブが 1 を返しても壊れないようにする）。

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/stage-draw.test.ts`
Expected: PASS（6件）

- [ ] **Step 5: 変異で実効性を確認する**

`TIERS.map(...)` を `TIERS.slice(0, 2).map(...)` に変える。

Run: 同上
Expected: **FAIL**（「層1→2→3 の順に3つ返す」と「層ごとに1回ずつ rng を引く」が落ちる）

確認できたら元に戻す。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/expedition/stage-draw.ts \
        src/features/ashen-rampart/domain/expedition/stage-draw.test.ts
git commit -m "feat(ashen-rampart): 層ごとのステージ抽選を追加

各層から1つずつ選び 8通りの遠征が成立する。層で難度を保証しているため
抽選が難度カーブを壊さない（設計書 §5.2）。

rng は層ごとにちょうど1回引く。消費数が固定であることは再生可能性の
前提なので、呼び出し回数そのものをテストで固定した。"
```

---

## Task 9: 獲得の抽選と適用

**Files:**
- Create: `src/features/ashen-rampart/domain/expedition/acquisition.ts`
- Create: `src/features/ashen-rampart/domain/expedition/acquisition.test.ts`

**Interfaces:**
- Consumes: `ACQUIRABLE_CARD_IDS`・`maxCopiesOf`（`card-pool.ts`）、`RandomFn`
- Produces: `OFFER_SIZE: number`、`buildOffer(deckCards: readonly string[], rng: RandomFn): string[]`、`applyAcquisition(deckCards: readonly string[], offer: readonly string[], cardId: string): string[]`

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { OFFER_SIZE, buildOffer, applyAcquisition } from './acquisition';
import { ACQUIRABLE_CARD_IDS, maxCopiesOf } from '../cards/card-pool';

const rngOf = (values: readonly number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe('buildOffer', () => {
  it('OFFER_SIZE は 3', () => {
    expect(OFFER_SIZE).toBe(3);
  });

  it('3枚を提示する', () => {
    expect(buildOffer([], rngOf([0.1, 0.5, 0.9]))).toHaveLength(OFFER_SIZE);
  });

  it('提示の3枚は互いに異なる', () => {
    const offer = buildOffer([], rngOf([0.1, 0.5, 0.9]));
    expect(new Set(offer).size).toBe(OFFER_SIZE);
  });

  it('獲得できない札（retired）は提示しない', () => {
    for (let i = 0; i < 50; i++) {
      const offer = buildOffer([], rngOf([i / 50, (i + 7) / 50, (i + 13) / 50]));
      offer.forEach((id) => expect(ACQUIRABLE_CARD_IDS).toContain(id));
    }
  });

  it('同名上限まで持っている札は提示しない', () => {
    const limit = maxCopiesOf('arrow-tower');
    const full = Array.from({ length: limit }, () => 'arrow-tower');
    for (let i = 0; i < 50; i++) {
      const offer = buildOffer(full, rngOf([i / 50, (i + 7) / 50, (i + 13) / 50]));
      expect(offer).not.toContain('arrow-tower');
    }
  });

  it('上限に1枚足りない札は提示されうる（境界）', () => {
    const limit = maxCopiesOf('arrow-tower');
    const nearlyFull = Array.from({ length: limit - 1 }, () => 'arrow-tower');
    const offered = new Set<string>();
    for (let i = 0; i < 200; i++) {
      buildOffer(nearlyFull, rngOf([i / 200, (i + 31) / 200, (i + 67) / 200])).forEach((id) =>
        offered.add(id)
      );
    }
    expect(offered).toContain('arrow-tower');
  });

  it('候補が OFFER_SIZE 未満なら、あるだけ返す（例外にしない）', () => {
    // すべての獲得可能カードを上限まで持っているデッキ
    const everything = ACQUIRABLE_CARD_IDS.flatMap((id) =>
      Array.from({ length: maxCopiesOf(id) }, () => id)
    );
    expect(buildOffer(everything, rngOf([0.5]))).toEqual([]);
  });

  it('同じ rng 列からは同じ提示（決定的）', () => {
    const a = buildOffer([], rngOf([0.2, 0.6, 0.8]));
    const b = buildOffer([], rngOf([0.2, 0.6, 0.8]));
    expect(a).toEqual(b);
  });
});

describe('applyAcquisition', () => {
  it('選んだ札がデッキの末尾に加わる', () => {
    expect(applyAcquisition(['reactor'], ['arrow-tower', 'ballista', 'beacon'], 'ballista')).toEqual([
      'reactor',
      'ballista',
    ]);
  });

  it('元のデッキを変更しない（不変）', () => {
    const deck = ['reactor'];
    applyAcquisition(deck, ['arrow-tower'], 'arrow-tower');
    expect(deck).toEqual(['reactor']);
  });

  it('提示に無い札を選ぶと契約違反として例外', () => {
    expect(() => applyAcquisition([], ['arrow-tower'], 'catapult')).toThrow(
      '提示されていないカードです'
    );
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/acquisition.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: 実装する**

```ts
/**
 * 灰燼の城壁 - 獲得（反復6・設計書 §4.1 / §5.5）
 *
 * ステージ間に3択から1枚を選ぶ。デッキは 12 → 13 → 14 と育つ。
 *
 * **選ばなかった2枚は `card_acquired` に記録する**（設計書 §9.1）。
 * 選択の情報量は「何を取ったか」ではなく **「何を捨てたか」** の側にあり、
 * 判定項目2b（獲得が判断だったか）はその情報を使う。
 */
import type { RandomFn } from '../shared/random';
import { ACQUIRABLE_CARD_IDS, maxCopiesOf } from '../cards/card-pool';

/** 獲得の選択肢の枚数 */
export const OFFER_SIZE = 3;

/**
 * 獲得の3択を作る
 *
 * 同名上限まで持っている札は候補から外す。
 * 候補が `OFFER_SIZE` に満たない場合はあるだけ返す（例外にしない）——
 * デッキを上限まで埋め尽くすのは正当なプレイであり、
 * そこで遠征が止まるべきではない。
 *
 * rng は**候補を1枚選ぶごとに1回**引く。
 */
export const buildOffer = (deckCards: readonly string[], rng: RandomFn): string[] => {
  const owned = new Map<string, number>();
  deckCards.forEach((id) => owned.set(id, (owned.get(id) ?? 0) + 1));

  const candidates = ACQUIRABLE_CARD_IDS.filter(
    (id) => (owned.get(id) ?? 0) < maxCopiesOf(id)
  );

  const remaining = [...candidates];
  const offer: string[] = [];
  while (offer.length < OFFER_SIZE && remaining.length > 0) {
    const index = Math.min(remaining.length - 1, Math.floor(rng() * remaining.length));
    const [picked] = remaining.splice(index, 1);
    if (picked !== undefined) offer.push(picked);
  }
  return offer;
};

/** 3択から1枚を選んでデッキに加える。提示に無い札は契約違反 */
export const applyAcquisition = (
  deckCards: readonly string[],
  offer: readonly string[],
  cardId: string
): string[] => {
  if (!offer.includes(cardId)) {
    throw new Error(`提示されていないカードです: ${cardId}`);
  }
  return [...deckCards, cardId];
};
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/acquisition.test.ts`
Expected: PASS（11件）

- [ ] **Step 5: 変異で実効性を確認する**

`candidates` の述語から同名上限の判定を外す（`ACQUIRABLE_CARD_IDS.filter(() => true)`）。

Run: 同上
Expected: **FAIL**（「同名上限まで持っている札は提示しない」が落ちる）

確認できたら元に戻し、次に `remaining.splice(index, 1)` を `remaining[index]` の
参照だけに変える（重複を許す）。
Expected: **FAIL**（「提示の3枚は互いに異なる」が落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/expedition/acquisition.ts \
        src/features/ashen-rampart/domain/expedition/acquisition.test.ts
git commit -m "feat(ashen-rampart): 獲得の3択抽選と適用を追加

同名上限まで持つ札は提示しない。候補が3枚未満ならあるだけ返す
（デッキを埋め尽くすのは正当なプレイで、そこで遠征が止まるべきではない）。

変異2種（上限判定を外す／重複を許す）で実効性を確認した。"
```

---

## Task 10: 遠征の状態と遷移

**Files:**
- Create: `src/features/ashen-rampart/domain/expedition/expedition-state.ts`
- Create: `src/features/ashen-rampart/domain/expedition/expedition-state.test.ts`

**Interfaces:**
- Consumes: `StageDefinition`（Task 7）、`applyAcquisition`（Task 9）、`LIFE_INITIAL`・`STAGE_CLEAR_HEAL`（Task 6）
- Produces:
  - `type ExpeditionPhase = 'stage' | 'offer' | 'ended'`
  - `type ExpeditionOutcome = 'running' | 'cleared' | 'failed'`
  - `interface StageResult { won: boolean; lifeLeft: number }`
  - `interface ExpeditionState { seed; stages; stageIndex; initialDeckCards; deckCards; life; offer; acquired; phase; outcome }`
  - **`initialDeckCards` は構築時の12枚を保持し続ける。** 獲得で増えた札は `acquired` にだけ積み、
    シャッフルは常に `initialDeckCards` に対して行う（Task 11・設計書 §8.2）
  - `createExpedition(seed: number, initialDeck: readonly string[], stages: readonly StageDefinition[]): ExpeditionState`
  - `currentStage(exp: ExpeditionState): StageDefinition | undefined`
  - `completeStage(exp: ExpeditionState, result: StageResult): ExpeditionState`
  - `presentOffer(exp: ExpeditionState, offer: readonly string[]): ExpeditionState`
  - `chooseAcquisition(exp: ExpeditionState, cardId: string): ExpeditionState`

**遷移を3つに割る理由:** `completeStage` に rng を渡すと domain が乱数を持つことになる。
**提示の抽選は application が行い、domain は「提示された結果を受け取る」だけにする**
（既存の `createDeck` が `RandomFn` を受け取るのと同じ方針）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
import {
  createExpedition, currentStage, completeStage, presentOffer, chooseAcquisition,
} from './expedition-state';
import { PROVISIONAL_STAGES } from './stage-pool';
import { LIFE_INITIAL, STAGE_CLEAR_HEAL } from '../combat/combat-state';

const stages = [PROVISIONAL_STAGES[0]!, PROVISIONAL_STAGES[2]!, PROVISIONAL_STAGES[4]!];
const deck12 = [
  'reactor','reactor','reactor','stone-wall','stone-wall','arrow-tower',
  'arrow-tower','ballista','ballista','cannon-tower','spike-trap','piercer',
];
const start = () => createExpedition(1234, deck12, stages);

describe('遠征の開始', () => {
  it('層1 のステージから始まる', () => {
    const exp = start();
    expect(exp.stageIndex).toBe(0);
    expect(exp.phase).toBe('stage');
    expect(exp.outcome).toBe('running');
    expect(currentStage(exp)?.id).toBe(stages[0]!.id);
  });

  it('ライフは LIFE_INITIAL、デッキは渡したもの、獲得は空', () => {
    const exp = start();
    expect(exp.life).toBe(LIFE_INITIAL);
    expect(exp.deckCards).toEqual(deck12);
    expect(exp.initialDeckCards).toEqual(deck12);
    expect(exp.acquired).toEqual([]);
    expect(exp.offer).toEqual([]);
  });

  it('獲得しても initialDeckCards は変わらない（シャッフルの基底）', () => {
    let exp = completeStage(start(), { won: true, lifeLeft: 8 });
    exp = chooseAcquisition(presentOffer(exp, ['beacon']), 'beacon');
    expect(exp.initialDeckCards).toEqual(deck12);
    expect(exp.deckCards).toHaveLength(deck12.length + 1);
  });
});

describe('ステージの決着', () => {
  it('勝つと offer フェーズへ進み、ライフが持ち越されて回復する', () => {
    const after = completeStage(start(), { won: true, lifeLeft: 8 });
    expect(after.phase).toBe('offer');
    expect(after.stageIndex).toBe(1);
    expect(after.life).toBe(8 + STAGE_CLEAR_HEAL);
  });

  it('回復は LIFE_INITIAL を超えない（際限なく増えない）', () => {
    const after = completeStage(start(), { won: true, lifeLeft: LIFE_INITIAL });
    expect(after.life).toBe(LIFE_INITIAL);
  });

  it('負けると遠征が終わる（outcome: failed）', () => {
    const after = completeStage(start(), { won: false, lifeLeft: 0 });
    expect(after.phase).toBe('ended');
    expect(after.outcome).toBe('failed');
  });

  it('最終ステージに勝つと踏破（outcome: cleared・獲得の提示は無い）', () => {
    let exp = start();
    exp = completeStage(exp, { won: true, lifeLeft: 9 });
    exp = chooseAcquisition(presentOffer(exp, ['beacon']), 'beacon');
    exp = completeStage(exp, { won: true, lifeLeft: 6 });
    exp = chooseAcquisition(presentOffer(exp, ['forge']), 'forge');
    exp = completeStage(exp, { won: true, lifeLeft: 4 });
    expect(exp.phase).toBe('ended');
    expect(exp.outcome).toBe('cleared');
    expect(exp.deckCards).toHaveLength(deck12.length + 2);
  });

  it('終わった遠征をさらに進めようとすると契約違反', () => {
    const ended = completeStage(start(), { won: false, lifeLeft: 0 });
    expect(() => completeStage(ended, { won: true, lifeLeft: 5 })).toThrow('遠征は既に終了しています');
  });
});

describe('獲得', () => {
  it('提示を受け取ると offer に載る', () => {
    const exp = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon', 'forge', 'catapult']);
    expect(exp.offer).toEqual(['beacon', 'forge', 'catapult']);
    expect(exp.phase).toBe('offer');
  });

  it('選ぶとデッキが1枚増え、stage フェーズへ戻り、offer が空になる', () => {
    let exp = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon', 'forge', 'catapult']);
    exp = chooseAcquisition(exp, 'forge');
    expect(exp.deckCards).toHaveLength(deck12.length + 1);
    expect(exp.deckCards[exp.deckCards.length - 1]).toBe('forge');
    expect(exp.acquired).toEqual(['forge']);
    expect(exp.phase).toBe('stage');
    expect(exp.offer).toEqual([]);
  });

  it('stage フェーズで獲得しようとすると契約違反', () => {
    expect(() => chooseAcquisition(start(), 'forge')).toThrow('獲得の提示中ではありません');
  });

  it('提示に無い札を選ぶと契約違反', () => {
    const exp = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon']);
    expect(() => chooseAcquisition(exp, 'catapult')).toThrow('提示されていないカードです');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/expedition-state.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: 実装する**

```ts
/**
 * 灰燼の城壁 - 遠征の状態（反復6・設計書 §4.1 / §4.3）
 *
 * ローグライト。3ステージ連続。ライフは持ち越し、負けたら遠征終了で
 * 獲得したカードも失う。盤面の設置物はステージごとにリセットされる
 * （`CombatState` をステージごとに作り直すため、ここでは何もしない）。
 *
 * **`CombatState` は遠征を知らない。** 参照は一方向である（設計書 §4.2）。
 *
 * **乱数を持たない。** 獲得の3択を抽選するのは application 層で、
 * ここは `presentOffer` で結果を受け取るだけにしてある。
 */
import { applyAcquisition } from './acquisition';
import type { StageDefinition } from './stage-definition';
import { LIFE_INITIAL, STAGE_CLEAR_HEAL } from '../combat/combat-state';

export type ExpeditionPhase = 'stage' | 'offer' | 'ended';
export type ExpeditionOutcome = 'running' | 'cleared' | 'failed';

/** ステージの決着。`lifeLeft` は決着時点の残ライフ */
export interface StageResult {
  won: boolean;
  lifeLeft: number;
}

export interface ExpeditionState {
  seed: number;
  stages: readonly StageDefinition[];
  /** これから挑む（または挑んでいる）ステージの添字 */
  stageIndex: number;
  /**
   * 構築時の12枚。**遠征を通じて変わらない。**
   *
   * シャッフルは常にこの配列に対して行い、獲得した札は山札の固定位置へ
   * 挿入する（設計書 §8.2）。獲得を含めた配列をシャッフルすると、
   * **枚数が変わるだけでシャッフルが全面的に変わり、獲得する腕と
   * しない腕を比較できなくなる**——G1 が反転した初版の欠陥そのものである。
   */
  initialDeckCards: readonly string[];
  /** initialDeckCards ＋ acquired。表示と検証に使う */
  deckCards: readonly string[];
  life: number;
  /** 獲得の3択。空なら提示なし */
  offer: readonly string[];
  acquired: readonly string[];
  phase: ExpeditionPhase;
  outcome: ExpeditionOutcome;
}

export const createExpedition = (
  seed: number,
  initialDeck: readonly string[],
  stages: readonly StageDefinition[]
): ExpeditionState => ({
  seed,
  stages,
  stageIndex: 0,
  initialDeckCards: [...initialDeck],
  deckCards: [...initialDeck],
  life: LIFE_INITIAL,
  offer: [],
  acquired: [],
  phase: 'stage',
  outcome: 'running',
});

export const currentStage = (exp: ExpeditionState): StageDefinition | undefined =>
  exp.stages[exp.stageIndex];

/**
 * ステージの決着を反映する
 *
 * 勝ち: ライフを持ち越して回復し、次のステージがあれば獲得の提示へ。
 *       **回復は `LIFE_INITIAL` を上限とする**——上限が無いと
 *       無失点のプレイでライフが際限なく増え、難度カーブが消える。
 * 負け: 遠征終了。
 */
export const completeStage = (exp: ExpeditionState, result: StageResult): ExpeditionState => {
  if (exp.phase === 'ended') {
    throw new Error('遠征は既に終了しています');
  }
  if (!result.won) {
    return { ...exp, life: result.lifeLeft, phase: 'ended', outcome: 'failed' };
  }
  const nextIndex = exp.stageIndex + 1;
  const healed = Math.min(LIFE_INITIAL, result.lifeLeft + STAGE_CLEAR_HEAL);
  if (nextIndex >= exp.stages.length) {
    return { ...exp, life: healed, stageIndex: nextIndex, phase: 'ended', outcome: 'cleared' };
  }
  return { ...exp, life: healed, stageIndex: nextIndex, phase: 'offer' };
};

/** 抽選された3択を載せる（抽選そのものは application が行う） */
export const presentOffer = (
  exp: ExpeditionState,
  offer: readonly string[]
): ExpeditionState => ({ ...exp, offer: [...offer], phase: 'offer' });

/** 3択から1枚を選ぶ */
export const chooseAcquisition = (exp: ExpeditionState, cardId: string): ExpeditionState => {
  if (exp.phase !== 'offer') {
    throw new Error('獲得の提示中ではありません');
  }
  return {
    ...exp,
    deckCards: applyAcquisition(exp.deckCards, exp.offer, cardId),
    acquired: [...exp.acquired, cardId],
    offer: [],
    phase: 'stage',
  };
};
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/domain/expedition/expedition-state.test.ts`
Expected: PASS（12件）

- [ ] **Step 5: 変異で実効性を確認する**

`Math.min(LIFE_INITIAL, ...)` を `result.lifeLeft + STAGE_CLEAR_HEAL` に変える。
Expected: **FAIL**（「回復は LIFE_INITIAL を超えない」が落ちる）

戻したあと、`completeStage` の負け分岐を `phase: 'offer'` に変える。
Expected: **FAIL**（「負けると遠征が終わる」が落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/expedition/expedition-state.ts \
        src/features/ashen-rampart/domain/expedition/expedition-state.test.ts
git commit -m "feat(ashen-rampart): 遠征の状態と遷移を追加

ローグライト3ステージ。ライフは持ち越し、クリアで STAGE_CLEAR_HEAL 回復
（上限は LIFE_INITIAL。上限が無いと無失点で際限なく増え難度カーブが消える）。
負けたら遠征終了で獲得したカードも失う。

遷移を completeStage / presentOffer / chooseAcquisition の3つに割った。
提示の抽選は application が行い、domain は乱数を持たない。

変異2種（回復の上限を外す／負けを offer にする）で実効性を確認した。"
```

---

## Task 11: 遠征のユースケース

**Files:**
- Create: `src/features/ashen-rampart/application/use-cases/start-expedition.ts`
- Create: `src/features/ashen-rampart/application/use-cases/start-expedition.test.ts`
- Create: `src/features/ashen-rampart/application/use-cases/advance-stage.ts`
- Create: `src/features/ashen-rampart/application/use-cases/advance-stage.test.ts`

**Interfaces:**
- Consumes: `derivedSeed`（Task 2）、`drawStages`（Task 8）、`buildOffer`（Task 9）、遠征の遷移（Task 10）、`createDeck`、`createCombatState`、`validateDeck` / `validateRuntimeDeck`、`SeededRandom`
- Produces:
  - `startExpedition(initialDeck: readonly string[], seed: number): ExpeditionState`
  - `startStage(exp: ExpeditionState): CombatState`
  - `advanceStage(exp: ExpeditionState, result: StageResult): ExpeditionState`

**`acquire-card` を別ファイルにしない理由:** `chooseAcquisition`（domain）を
そのまま呼ぶだけで、application 層に足す判断が無い。**空のラッパーは作らない。**
UI は `chooseAcquisition` を直接呼ぶ（設計書は use-case 3本と書いているが、
副作用もオーケストレーションも無いものを use-case にする理由がない。
**この逸脱は設計書 §4.2 への意図的な変更としてコミットメッセージに記録する**）。

- [ ] **Step 1: 失敗するテストを書く（`start-expedition.test.ts`）**

```ts
import { startExpedition, startStage } from './start-expedition';
import { PRESET_DECKS, DECK_SIZE } from '../../domain/cards/card-pool';
import { INITIAL_HAND_SIZE } from '../../domain/cards/deck';
import { LIFE_INITIAL } from '../../domain/combat/combat-state';
import { currentStage, completeStage } from '../../domain/expedition/expedition-state';
import { ACQUIRED_INSERT_OFFSET } from './start-expedition';

const preset = PRESET_DECKS.swift.cards;

describe('startExpedition', () => {
  it('3ステージが層1→2→3 の順に決まる', () => {
    const exp = startExpedition(preset, 42);
    expect(exp.stages.map((s) => s.tier)).toEqual([1, 2, 3]);
  });

  it('同じシードからは同じ遠征（決定的）', () => {
    const a = startExpedition(preset, 42);
    const b = startExpedition(preset, 42);
    expect(a.stages.map((s) => s.id)).toEqual(b.stages.map((s) => s.id));
  });

  it('シードが違えば少なくとも一部のシードで別の並びになる', () => {
    const combos = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      combos.add(startExpedition(preset, seed).stages.map((s) => s.id).join('|'));
    }
    expect(combos.size).toBeGreaterThan(1);
  });

  it('構築規則を満たさないデッキは契約違反', () => {
    expect(() => startExpedition(['reactor'], 1)).toThrow('デッキが構築規則を満たしていません');
  });
});

describe('startStage', () => {
  it('現在のステージの台本で戦闘状態を作る', () => {
    const exp = startExpedition(preset, 42);
    const combat = startStage(exp);
    expect(combat.waves).toHaveLength(currentStage(exp)!.waves.length);
  });

  it('遠征のライフで始まる（持ち越し）', () => {
    let exp = startExpedition(preset, 42);
    exp = completeStage(exp, { won: true, lifeLeft: 5 });
    // offer フェーズだが、startStage は次ステージの戦闘を作れる
    expect(startStage(exp).life).toBe(exp.life);
    expect(exp.life).toBeLessThan(LIFE_INITIAL);
  });

  it('山札は デッキ枚数 − 初期手札 で始まる', () => {
    const combat = startStage(startExpedition(preset, 42));
    expect(combat.deck.drawPile).toHaveLength(DECK_SIZE - INITIAL_HAND_SIZE);
  });

  it('同じ遠征・同じステージなら毎回同じシャッフル（決定的）', () => {
    const exp = startExpedition(preset, 42);
    expect(startStage(exp).deck.drawPile).toEqual(startStage(exp).deck.drawPile);
  });

  it('獲得しても初期手札は変わらない（基底のシャッフルを共有する）', () => {
    const base = startExpedition(preset, 42);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    expect(startStage(withCard).deck.hand).toEqual(startStage(base).deck.hand);
  });

  it('獲得した札は山札に入り、末尾から ACQUIRED_INSERT_OFFSET の位置にある', () => {
    const base = startExpedition(preset, 42);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const pile = startStage(withCard).deck.drawPile;
    expect(pile).toContain('beacon');
    expect(pile).toHaveLength(base.deckCards.length + 1 - INITIAL_HAND_SIZE);
    expect(pile[pile.length - 1 - ACQUIRED_INSERT_OFFSET]).toBe('beacon');
  });

  it('獲得札を除いた山札の並びは、獲得していない場合と一致する', () => {
    const base = startExpedition(preset, 42);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const withoutAcquired = startStage(withCard).deck.drawPile.filter((_, i, arr) =>
      i !== arr.length - 1 - ACQUIRED_INSERT_OFFSET
    );
    expect(withoutAcquired).toEqual(startStage(base).deck.drawPile);
  });

  it('ステージが違えばシャッフルも違う', () => {
    const exp = startExpedition(preset, 42);
    const first = startStage(exp).deck.drawPile;
    const second = startStage(completeStage(exp, { won: true, lifeLeft: 9 })).deck.drawPile;
    expect(second).not.toEqual(first);
  });

  it('終了した遠征では契約違反', () => {
    const ended = completeStage(startExpedition(preset, 42), { won: false, lifeLeft: 0 });
    expect(() => startStage(ended)).toThrow('挑むステージがありません');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/application/use-cases/start-expedition.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: `start-expedition.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - 遠征の開始とステージの開始（反復6・設計書 §4.4）
 *
 * **乱数はここでしか作らない。** そして単一ストリームではなく
 * 目的ごとの派生シードを使う——獲得する腕としない腕で、
 * 同じステージのシャッフルを共有させるため（設計書 §8.2 の G1）。
 *
 * 乱数オブジェクトを React の state / ref に置かないこと。
 * `StrictMode` で初期化子が二重に呼ばれ、ストリームが2回分進む。
 * ここは呼ばれるたびに派生シードから作り直すので冪等である。
 */
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { derivedSeed } from '../../domain/shared/derived-seed';
import { shuffle, INITIAL_HAND_SIZE, type DeckState } from '../../domain/cards/deck';
import { validateDeck, validateRuntimeDeck } from '../../domain/cards/deck-builder';
import { createCombatState, type CombatState } from '../../domain/combat/combat-state';
import { drawStages } from '../../domain/expedition/stage-draw';
import {
  createExpedition, currentStage, type ExpeditionState,
} from '../../domain/expedition/expedition-state';

/**
 * 獲得した札を山札の末尾から数えて何枚目に挿すか
 *
 * 3 にしてあるのは「必ず引かれるが、序盤には来ない」位置にするため。
 * 12枚デッキなら山札は9枚で、獲得札は末尾から4枚目（残り3枚の手前）に入り、
 * ドロー間隔40 で tick 240 前後に手札へ来る。
 */
export const ACQUIRED_INSERT_OFFSET = 3;

/** 獲得札を山札の固定位置へ挿す。獲得が複数なら1枚ずつ手前へずらす */
const insertAcquired = (drawPile: readonly string[], acquired: readonly string[]): string[] => {
  let pile = [...drawPile];
  acquired.forEach((cardId, i) => {
    const position = Math.max(0, pile.length - ACQUIRED_INSERT_OFFSET - i);
    pile = [...pile.slice(0, position), cardId, ...pile.slice(position)];
  });
  return pile;
};

/** 遠征を開始する。構築規則を満たさないデッキは契約違反 */
export const startExpedition = (
  initialDeck: readonly string[],
  seed: number
): ExpeditionState => {
  const validation = validateDeck(initialDeck);
  if (!validation.isValid) {
    throw new Error(`デッキが構築規則を満たしていません: ${validation.errors.join(' / ')}`);
  }
  const drawRandom = new SeededRandom(derivedSeed(seed, 'stage-draw'));
  return createExpedition(seed, initialDeck, drawStages(() => drawRandom.random()));
};

/**
 * 現在のステージの戦闘状態を作る
 *
 * 検証は `validateRuntimeDeck`——`validateDeck` は枚数ちょうどを要求するため、
 * 獲得で13枚になった時点で必ず落ちる（初版の設計が落ちた箇所）。
 */
export const startStage = (exp: ExpeditionState): CombatState => {
  const stage = currentStage(exp);
  if (!stage) {
    throw new Error('挑むステージがありません');
  }
  const validation = validateRuntimeDeck(exp.deckCards);
  if (!validation.isValid) {
    throw new Error(`遠征中のデッキが不正です: ${validation.errors.join(' / ')}`);
  }
  const shuffleRandom = new SeededRandom(derivedSeed(exp.seed, 'shuffle', exp.stageIndex));
  // **基底（構築時の12枚）だけをシャッフルし、獲得札は山札の固定位置へ挿入する。**
  // 獲得を含めた配列をシャッフルすると、枚数が変わるだけで並びが全面的に変わり、
  // 獲得する腕としない腕を比較できなくなる（設計書 §8.2。G1 が反転した初版の欠陥）。
  const shuffled = shuffle(exp.initialDeckCards, () => shuffleRandom.random());
  const deck: DeckState = {
    hand: shuffled.slice(0, INITIAL_HAND_SIZE),
    drawPile: insertAcquired(shuffled.slice(INITIAL_HAND_SIZE), exp.acquired),
    graveyard: [],
  };
  return createCombatState(deck, stage.waves, exp.life);
};
```

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/application/use-cases/start-expedition.test.ts`
Expected: PASS（14件）

**この4件が G1 の前提である**——「獲得しても初期手札は変わらない」「獲得札を除いた
山札の並びが一致する」が通らないなら、`G1` で観測される差は**獲得の効果ではなく
シャッフル運**であり、ゲートは何も検出しない。

- [ ] **Step 5: `advance-stage.test.ts` の失敗するテストを書く**

```ts
import { advanceStage } from './advance-stage';
import { startExpedition } from './start-expedition';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { OFFER_SIZE } from '../../domain/expedition/acquisition';

const preset = PRESET_DECKS.swift.cards;

describe('advanceStage', () => {
  it('勝つと3択が提示される', () => {
    const after = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    expect(after.phase).toBe('offer');
    expect(after.offer).toHaveLength(OFFER_SIZE);
  });

  it('負けると提示は無く遠征が終わる', () => {
    const after = advanceStage(startExpedition(preset, 7), { won: false, lifeLeft: 0 });
    expect(after.phase).toBe('ended');
    expect(after.offer).toEqual([]);
  });

  it('最終ステージに勝つと踏破で、提示は無い', () => {
    let exp = startExpedition(preset, 7);
    exp = advanceStage(exp, { won: true, lifeLeft: 9 });
    exp = { ...exp, deckCards: [...exp.deckCards, exp.offer[0]!], offer: [], phase: 'stage' };
    exp = advanceStage(exp, { won: true, lifeLeft: 7 });
    exp = { ...exp, deckCards: [...exp.deckCards, exp.offer[0]!], offer: [], phase: 'stage' };
    exp = advanceStage(exp, { won: true, lifeLeft: 5 });
    expect(exp.outcome).toBe('cleared');
    expect(exp.offer).toEqual([]);
  });

  it('同じ遠征・同じ回の提示は毎回同じ（決定的）', () => {
    const a = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    const b = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    expect(a.offer).toEqual(b.offer);
  });

  it('1回目と2回目の提示は独立（同じ添字の派生シードを使い回していない）', () => {
    let exp = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    const first = exp.offer;
    exp = { ...exp, deckCards: [...exp.deckCards, first[0]!], offer: [], phase: 'stage' };
    const second = advanceStage(exp, { won: true, lifeLeft: 7 }).offer;
    expect(second).not.toEqual(first);
  });
});
```

- [ ] **Step 6: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/application/use-cases/advance-stage.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 7: `advance-stage.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - ステージの決着を遠征へ反映する（反復6）
 *
 * 勝って次のステージがあるときだけ、獲得の3択を抽選して載せる。
 * 抽選の派生シードの添字は**獲得の回数**（0 始まり）であって
 * ステージの添字ではない——踏破まで行くと獲得は2回なので、
 * 添字は 0 と 1 になる。
 */
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { derivedSeed } from '../../domain/shared/derived-seed';
import { buildOffer } from '../../domain/expedition/acquisition';
import {
  completeStage, presentOffer, type ExpeditionState, type StageResult,
} from '../../domain/expedition/expedition-state';

export const advanceStage = (
  exp: ExpeditionState,
  result: StageResult
): ExpeditionState => {
  const completed = completeStage(exp, result);
  if (completed.phase !== 'offer') return completed;

  const offerIndex = completed.acquired.length;
  const offerRandom = new SeededRandom(derivedSeed(completed.seed, 'offer', offerIndex));
  return presentOffer(completed, buildOffer(completed.deckCards, () => offerRandom.random()));
};
```

- [ ] **Step 8: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/application/use-cases/advance-stage.test.ts`
Expected: PASS（5件）

- [ ] **Step 9: 変異で実効性を確認する**

`derivedSeed(completed.seed, 'offer', offerIndex)` の `offerIndex` を `0` に固定する。
Expected: **FAIL**（「1回目と2回目の提示は独立」が落ちる）

戻したあと、`start-expedition.ts` の `validateRuntimeDeck` を `validateDeck` に戻す。
Expected: **これだけでは緑のまま**（段階A では獲得後のデッキで `startStage` を呼ぶテストがまだ無い）。
確認できたら元に戻し、PASS を確認する。

- [ ] **Step 10: コミット**

```bash
git add src/features/ashen-rampart/application/use-cases/start-expedition.ts \
        src/features/ashen-rampart/application/use-cases/start-expedition.test.ts \
        src/features/ashen-rampart/application/use-cases/advance-stage.ts \
        src/features/ashen-rampart/application/use-cases/advance-stage.test.ts
git commit -m "feat(ashen-rampart): 遠征の開始とステージ遷移のユースケースを追加

乱数はここでしか作らず、単一ストリームではなく目的ごとの派生シードを使う
（設計書 §4.4）。獲得する腕としない腕で同じシャッフルを共有させるため。

ステージ開始の検証は validateRuntimeDeck を使う。validateDeck は枚数
ちょうどを要求するので、獲得後の13枚で必ず落ちる。

設計書 §4.2 は use-case を3本としていたが、acquire-card は
domain の chooseAcquisition を呼ぶだけで application 層に足す判断が無い。
空のラッパーは作らず、UI から直接呼ぶ。意図的な逸脱として記録する。"
```

---

## Task 12: ログスキーマ v5（再生に必要な3件と世代交代）

**Files:**
- Modify: `src/features/ashen-rampart/application/ports/play-log-port.ts`
- Modify: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Modify: `src/features/ashen-rampart/infrastructure/play-log/local-storage-play-log.test.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`

**Interfaces:**
- Produces: `CURRENT_ITERATION = 6`、`PlayLogEventBody` に `levy_chosen` を追加、`reactivated` に `emberIndex`、`card_discarded_manual` に `handIndex`、`draw_pile_exhausted` を追加

**⚠️ 設計書 §12 段階A は「ログ v5」と書いているが、このタスクは
`expedition_*` イベントを含めない。** 段階A には UI が無く、
**それらのイベントを出す者がいない。** 出す者のいないイベント型を先に定義しても
「使われない型」が増えるだけで、検査もできない。
`expedition_*` は**産出者と一緒に段階C で入れる。**

**このタスクで入れるのは、今日すでに産出者が存在する3件だけである。**
いずれも設計書 §4.4 が「これが無いと遠征を完全再生できない」と特定したもので、
反復5 で再生が成立したのは**判定3ランで徴発も燠火も実質使われなかった偶然**だった。

- [ ] **Step 1: 失敗するテストを書く**

`local-storage-play-log.test.ts` に追記する。

```ts
describe('スキーマ v5（反復6）', () => {
  it('保存キーとスキーマ版が両方 v5 になっている', () => {
    const log = createLocalStoragePlayLog();
    log.record({ kind: 'run_note', runId: 'r1', text: 'x' });
    expect(localStorage.getItem('ashen-rampart:play-log-v5')).not.toBeNull();
    expect(log.exportAll().version).toBe(5);
  });

  it('旧スキーマ（v4）のキーは読まない', () => {
    localStorage.setItem('ashen-rampart:play-log-v4', JSON.stringify({ version: 4, events: [{ kind: 'run_note' }] }));
    expect(createLocalStoragePlayLog().exportAll().events).toEqual([]);
  });

  it('CURRENT_ITERATION は 6', () => {
    expect(CURRENT_ITERATION).toBe(6);
  });
});
```

`useAshenRampartGame.test.ts` に追記する。

```ts
describe('再生に必要なログ（反復6・設計書 §4.4）', () => {
  it('徴発の選択が levy_chosen として記録される', () => {
    // 徴発を1枚含む12枚デッキで起動し、徴発を打ってから chooseLevy(0) を呼ぶ。
    // levy は retired だが定義は残っており、startRunWithDeck の検証は
    // 入手経路を見ないのでテスト用デッキには入れられる。
    //
    // **起動と操作は既存テストのやり方をそのまま使うこと。**
    // このファイルには業火を打つテストが既にあり、renderHook の呼び方・
    // act の包み方・ログの取り出し方がそこに書かれている。新しい流儀を持ち込まない。
    // デッキ例:
    //   ['levy', 'reactor','reactor','reactor', 'arrow-tower','arrow-tower','arrow-tower',
    //    'stone-wall','stone-wall','stone-wall', 'ballista', 'cannon-tower']
    const events = log.exportAll().events.filter((e) => e.kind === 'levy_chosen');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ optionIndex: 0 });
    expect((events[0] as { offered: string[] }).offered).toHaveLength(3);
  });

  it('燠火の再点火が emberIndex 付きで記録される', () => {
    const events = log.exportAll().events.filter((e) => e.kind === 'reactivated');
    expect(events[0]).toMatchObject({ emberIndex: 0 });
  });

  it('手動の捨札が handIndex 付きで記録される', () => {
    const events = log.exportAll().events.filter((e) => e.kind === 'card_discarded_manual');
    expect(events[0]).toHaveProperty('handIndex');
  });

  it('山札が尽きた瞬間が手札とマナ付きで1度だけ記録される', () => {
    const events = log.exportAll().events.filter((e) => e.kind === 'draw_pile_exhausted');
    expect(events).toHaveLength(1);
    expect(events[0]).toHaveProperty('hand');
    expect(events[0]).toHaveProperty('mana');
  });
});
```

**既存テストの起動ヘルパに合わせて具体化すること。**
`useAshenRampartGame.test.ts` の既存の起動方法（`renderHook` の呼び方・
`act` の使い方・ログの取り出し方）をそのまま真似る。**新しい流儀を持ち込まない。**

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/infrastructure/play-log src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装する**

`play-log-port.ts`:

```ts
/** 現在の反復番号。反復を進めるたびに必ず更新する */
export const CURRENT_ITERATION = 6;
```

`reactivated` を差し替える:

```ts
  /**
   * 燠火の再点火（反復6 で `emberIndex` を追加）
   *
   * tick だけでは、燠火が2基以上あるときにどちらを点けたか分からず、
   * **操作列からランを再生できない**（設計書 §4.4）。
   */
  | { kind: 'reactivated'; runId: string; tick: number; emberIndex: number }
```

`card_discarded_manual` を差し替える:

```ts
  /**
   * 手動の捨札（反復6 で `handIndex` を追加）
   *
   * `discardFromHand` は添字で消すため、同名札が手札に複数あると
   * cardId だけでは手札配列を再現できず、以後の添字解釈が全部ずれる。
   */
  | { kind: 'card_discarded_manual'; runId: string; cardId: string; tick: number; handIndex: number }
```

新規に追加する:

```ts
  /**
   * 徴発の選択（反復6 で新設）
   *
   * `chooseLevy` はこれまで何もログを残しておらず、**徴発を使った瞬間に
   * ランが再生不能になっていた**（設計書 §4.4）。反復5 で再生が成立したのは
   * 判定3ランで徴発が実質使われなかった偶然である。
   *
   * 徴発は反復6 で構築・獲得の両プールから外したが（§4.6）、カード定義は
   * 残っているのでこのイベントも残す。
   */
  | { kind: 'levy_chosen'; runId: string; tick: number; optionIndex: number; offered: string[] }
  /**
   * 山札が尽きた瞬間（反復6 で新設）
   *
   * 反復5 の申し送り「山札枯渇時の手札の中身とマナ余剰」は、
   * **記録経路が無いまま観察項目に載っていた**（設計書 §7.12）。
   * 枚数だけでは足りず、中身と余剰資源を併せて見る必要がある。
   */
  | { kind: 'draw_pile_exhausted'; runId: string; tick: number; hand: string[]; mana: number }
```

`local-storage-play-log.ts`:

```ts
const PLAY_LOG_STORAGE_KEY = 'ashen-rampart:play-log-v5';
const SCHEMA_VERSION = 5;
```

**2つは別々の定数なので、必ず両方上げる**（片方だけ上げると `exportAll` の
`version` が 4 のまま出る）。

`useAshenRampartGame.ts`:
- `chooseLevy` の中で `levy_chosen` を記録する（`optionIndex` と、選択前の
  `levyOptions` を `offered` に入れる）
- `reactivate` の記録に `emberIndex` を渡す
- 手動の捨札の記録に `handIndex` を渡す
- `state.deck.drawPile.length` が 0 になった最初の tick で `draw_pile_exhausted` を
  1度だけ記録する（既に記録済みかを `useRef` のフラグで持つ）

- [ ] **Step 4: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart`
Expected: PASS

- [ ] **Step 5: 変異で実効性を確認する**

`chooseLevy` の `levy_chosen` の記録を削除する。
Expected: **FAIL**（「徴発の選択が levy_chosen として記録される」が落ちる）

戻したあと、`SCHEMA_VERSION` だけ 4 に戻す。
Expected: **FAIL**（「保存キーとスキーマ版が両方 v5」が落ちる）——
**キーだけ上げてバージョンを忘れる事故を、このテストが捕まえることを確認する。**

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 6: `npm run ci` を通してコミット**

```bash
npm run ci
git add -A src/features/ashen-rampart
git commit -m "feat(ashen-rampart): ログスキーマを v5 へ（再生に必要な3件）

設計書 §4.4 が特定した「これが無いと遠征を完全再生できない」3件を入れる。
反復5 で再生が成立したのは、判定3ランで徴発も燠火も実質使われなかった
偶然である。

- levy_chosen を新設（chooseLevy はこれまで何も記録していなかった）
- reactivated に emberIndex（燠火2基以上で再生が分岐する）
- card_discarded_manual に handIndex（同名札で手札配列が再現できない）
- draw_pile_exhausted を新設（§7.12 の観察項目に記録経路が無かった）
- 保存キーと SCHEMA_VERSION を両方 v5 へ（別定数なので片方忘れる事故がある）

expedition_* イベントは含めない。段階A には産出者がおらず、
使われない型を先に定義しても検査できない。段階C で産出者と一緒に入れる。
設計書 §12 段階A の「ログ v5」からの意図的な絞り込みとして記録する。"
```

---

## Task 13: 遠征のシミュレーションと獲得戦略

**Files:**
- Create: `src/features/ashen-rampart/application/simulation/expedition-simulation.ts`
- Create: `src/features/ashen-rampart/application/simulation/expedition-simulation.test.ts`
- Modify: `src/features/ashen-rampart/domain/expedition/expedition-state.ts`（`declineOffer` を追加）

**Interfaces:**
- Consumes: `simulateRun`・`Strategy`・`greedyStrategy`（`domain/combat/run-simulation.ts`）、`startExpedition`・`startStage`（Task 11）、`advanceStage`（Task 11）、`axesOf`（Task 7）
- Produces:
  - `type AcquireStrategy = (offer: readonly string[], nextDemands: readonly DemandAxis[], deck: readonly string[]) => string | undefined`
  - `noAcquire` / `randomAcquireOf(rng)` / `cheapestAcquire` / `demandAwareAcquire`
  - `interface ExpeditionSimulationResult { outcome; stagesCleared; reachedTier3; lifeLeft; acquired; stageOutcomes }`
  - `simulateExpedition(initialDeck, seed, strategy, acquire): ExpeditionSimulationResult`
- `declineOffer(exp: ExpeditionState): ExpeditionState`（提示を断る。`noAcquire` の腕に要る）

**⚠️ 置き場所は `application/simulation/` である。** 2つの制約が同時に効く。

1. `domain/combat/run-simulation.ts` には置けない。あちらが `domain/expedition/` を
   参照すると循環になる
2. **`domain/` にも置けない。** このファイルは `startExpedition` / `startStage` /
   `advanceStage`（application 層の use-case）を組み立てるので、
   domain に置くと **domain → application** の逆流になる（Global Constraints 違反）。
   **既存の `run-simulation.ts` が domain にあるのは、あれが domain だけで完結しているからである**

- [ ] **Step 1: `declineOffer` の失敗するテストを書く（`expedition-state.test.ts` に追記）**

```ts
describe('提示を断る（較正の noAcquire 用）', () => {
  it('デッキが増えずに stage フェーズへ戻る', () => {
    const offered = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon']);
    const after = declineOffer(offered);
    expect(after.deckCards).toHaveLength(deck12.length);
    expect(after.acquired).toEqual([]);
    expect(after.phase).toBe('stage');
    expect(after.offer).toEqual([]);
  });

  it('stage フェーズで断ろうとすると契約違反', () => {
    expect(() => declineOffer(start())).toThrow('獲得の提示中ではありません');
  });
});
```

`expedition-state.ts` に追加する:

```ts
/**
 * 3択を断る
 *
 * **UI には出さない。** 較正で「獲得しない腕」を回すために要る
 * （設計書 §8.2 の `noAcquire`）。獲得しない選択を人間に見せると
 * 判定項目2b の分母が壊れる。
 */
export const declineOffer = (exp: ExpeditionState): ExpeditionState => {
  if (exp.phase !== 'offer') {
    throw new Error('獲得の提示中ではありません');
  }
  return { ...exp, offer: [], phase: 'stage' };
};
```

- [ ] **Step 2: 獲得戦略の失敗するテストを書く**

```ts
import {
  noAcquire, cheapestAcquire, demandAwareAcquire, randomAcquireOf, simulateExpedition,
} from './expedition-simulation';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { PRESET_DECKS } from '../../domain/cards/card-pool';

describe('獲得戦略', () => {
  it('noAcquire は何も選ばない', () => {
    expect(noAcquire(['catapult', 'arrow-tower'], ['anti-air'], [])).toBeUndefined();
  });

  it('cheapestAcquire は最も安い札を選ぶ', () => {
    // 弓兵1 / 弩砲2 / 投石機5
    expect(cheapestAcquire(['catapult', 'ballista', 'arrow-tower'], [], [])).toBe('arrow-tower');
  });

  it('demandAwareAcquire は要求軸を満たす札を選ぶ', () => {
    // anti-air を満たすのは弩砲だけ（弓兵は hitsFlying: false、魔力炉は軸なし）
    expect(demandAwareAcquire(['arrow-tower', 'ballista', 'reactor'], ['anti-air'], [])).toBe('ballista');
  });

  it('demandAwareAcquire は満たす札が無ければ最も安い札に落ちる', () => {
    expect(demandAwareAcquire(['arrow-tower', 'reactor'], ['anti-air'], [])).toBe('reactor');
  });

  it('demandAwareAcquire は複数の軸を満たす札を優先する', () => {
    // 火砲台は mass-answer と heavy-hit の両方、徹甲弩は mass-answer と heavy-hit と anti-air
    const picked = demandAwareAcquire(
      ['cannon-tower', 'piercer', 'arrow-tower'],
      ['anti-air', 'mass-answer', 'heavy-hit'],
      []
    );
    expect(picked).toBe('piercer');
  });

  it('randomAcquireOf は提示の中から選ぶ', () => {
    const pick = randomAcquireOf(() => 0.99)(['a1', 'a2', 'a3'], [], []);
    expect(['a1', 'a2', 'a3']).toContain(pick);
  });

  it('提示が空なら（候補が尽きていたら）どの戦略も undefined', () => {
    [cheapestAcquire, demandAwareAcquire, randomAcquireOf(() => 0.5)].forEach((strategy) => {
      expect(strategy([], ['anti-air'], [])).toBeUndefined();
    });
  });
});

describe('simulateExpedition', () => {
  const preset = PRESET_DECKS.swift.cards;

  it('遠征を最後まで回して結果を返す', () => {
    const result = simulateExpedition(preset, 1, greedyStrategy, demandAwareAcquire);
    expect(['cleared', 'failed']).toContain(result.outcome);
    expect(result.stageOutcomes.length).toBeGreaterThan(0);
    expect(result.stagesCleared).toBeLessThanOrEqual(3);
  });

  it('踏破したら stagesCleared が 3 で reachedTier3 が true', () => {
    const result = simulateExpedition(preset, 1, greedyStrategy, demandAwareAcquire);
    if (result.outcome === 'cleared') {
      expect(result.stagesCleared).toBe(3);
      expect(result.reachedTier3).toBe(true);
    }
  });

  it('同じ入力からは同じ結果（決定的）', () => {
    const a = simulateExpedition(preset, 5, greedyStrategy, demandAwareAcquire);
    const b = simulateExpedition(preset, 5, greedyStrategy, demandAwareAcquire);
    expect(a).toEqual(b);
  });

  it('noAcquire ではデッキが増えない', () => {
    const result = simulateExpedition(preset, 5, greedyStrategy, noAcquire);
    expect(result.acquired).toEqual([]);
  });

  it('demandAwareAcquire では、層2 に到達すれば1枚以上獲得している', () => {
    const result = simulateExpedition(preset, 5, greedyStrategy, demandAwareAcquire);
    if (result.stagesCleared >= 1) {
      expect(result.acquired.length).toBeGreaterThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 3: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/application/simulation/expedition-simulation.test.ts`
Expected: FAIL（モジュールが無い）

- [ ] **Step 4: 実装する**

```ts
/**
 * 灰燼の城壁 - 遠征のシミュレーション（反復6・設計書 §8.2）
 *
 * **application 層に置く。** use-case（startExpedition / startStage / advanceStage）を
 * 組み立てるため、domain に置くと domain → application の逆流になる。
 * `domain/combat/run-simulation.ts` が domain にあるのは、あれが domain だけで
 * 完結しているからである。
 *
 * **獲得戦略を1本にしない。** どんな獲得戦略も人間とは違う癖を持つので、
 * 「獲得機構の効果」と「その戦略の癖」を分離するには複数要る（設計書 §8.2）。
 * とくに `greedyAcquire`（最も高コストを取る）は単独で使わないこと——
 * マナが唯一の律速である `greedyStrategy` にとって
 * **最も打てない札を選び続ける戦略**であり、差の符号が解釈できない。
 */
import type { RandomFn } from '../../domain/shared/random';
import { getCardDefinition } from '../../domain/cards/card-pool';
import { simulateRun, type Strategy } from '../../domain/combat/run-simulation';
import { startExpedition, startStage } from '../use-cases/start-expedition';
import { advanceStage } from '../use-cases/advance-stage';
import {
  chooseAcquisition, declineOffer, currentStage,
  type ExpeditionOutcome, type ExpeditionState,
} from '../../domain/expedition/expedition-state';
import { axesOf, type DemandAxis } from '../../domain/expedition/stage-definition';

/** 3択から1枚を選ぶ。`undefined` は「取らない」 */
export type AcquireStrategy = (
  offer: readonly string[],
  nextDemands: readonly DemandAxis[],
  deck: readonly string[]
) => string | undefined;

export const noAcquire: AcquireStrategy = () => undefined;

const costOf = (id: string): number => getCardDefinition(id).cost;

export const cheapestAcquire: AcquireStrategy = (offer) =>
  [...offer].sort((a, b) => costOf(a) - costOf(b))[0];

export const randomAcquireOf =
  (rng: RandomFn): AcquireStrategy =>
  (offer) =>
    offer[Math.min(offer.length - 1, Math.floor(rng() * offer.length))];

/** 次のステージの要求軸を最も多く満たす札を選ぶ。同点なら安いほう */
export const demandAwareAcquire: AcquireStrategy = (offer, nextDemands) => {
  if (offer.length === 0) return undefined;
  const score = (id: string): number =>
    axesOf(id).filter((axis) => nextDemands.includes(axis)).length;
  return [...offer].sort((a, b) => score(b) - score(a) || costOf(a) - costOf(b))[0];
};

export interface StageOutcome {
  stageId: string;
  won: boolean;
  ticks: number;
  lifeLeft: number;
  cardsPlayed: number;
}

export interface ExpeditionSimulationResult {
  outcome: ExpeditionOutcome;
  stagesCleared: number;
  reachedTier3: boolean;
  lifeLeft: number;
  acquired: readonly string[];
  stageOutcomes: readonly StageOutcome[];
}

/** 遠征を最後まで回す */
export const simulateExpedition = (
  initialDeck: readonly string[],
  seed: number,
  strategy: Strategy,
  acquire: AcquireStrategy
): ExpeditionSimulationResult => {
  let exp: ExpeditionState = startExpedition(initialDeck, seed);
  const stageOutcomes: StageOutcome[] = [];
  let reachedTier3 = false;

  while (exp.phase !== 'ended') {
    const stage = currentStage(exp);
    if (!stage) break;
    if (stage.tier === 3) reachedTier3 = true;

    const run = simulateRun(startStage(exp), strategy, stage.map);
    const won = run.outcome === 'won';
    stageOutcomes.push({
      stageId: stage.id,
      won,
      ticks: run.ticks,
      lifeLeft: run.lifeLeft,
      cardsPlayed: run.cardsPlayed,
    });

    exp = advanceStage(exp, { won, lifeLeft: run.lifeLeft });
    if (exp.phase !== 'offer') continue;

    const nextDemands = currentStage(exp)?.demands ?? [];
    const picked = acquire(exp.offer, nextDemands, exp.deckCards);
    exp = picked === undefined ? declineOffer(exp) : chooseAcquisition(exp, picked);
  }

  return {
    outcome: exp.outcome,
    stagesCleared: stageOutcomes.filter((s) => s.won).length,
    reachedTier3,
    lifeLeft: exp.life,
    acquired: exp.acquired,
    stageOutcomes,
  };
};
```

- [ ] **Step 5: テストを実行して緑を確認する**

Run: `npx jest src/features/ashen-rampart/application/simulation/expedition-simulation.test.ts`
Expected: PASS（14件）

- [ ] **Step 6: 変異で実効性を確認する**

`demandAwareAcquire` の `score` を常に 0 を返すように変える。
Expected: **FAIL**（「要求軸を満たす札を選ぶ」と「複数の軸を満たす札を優先する」が落ちる）

戻したあと、`simulateExpedition` の `acquire(...)` の戻り値を無視して常に `declineOffer` にする。
Expected: **FAIL**（「demandAwareAcquire では層2 に到達すれば1枚以上獲得している」が落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/application/simulation/expedition-simulation.ts \
        src/features/ashen-rampart/application/simulation/expedition-simulation.test.ts \
        src/features/ashen-rampart/domain/expedition/expedition-state.ts \
        src/features/ashen-rampart/domain/expedition/expedition-state.test.ts
git commit -m "feat(ashen-rampart): 遠征のシミュレーションと獲得戦略を追加

獲得戦略を4本用意した（noAcquire / random / cheapest / demandAware）。
1本では獲得機構の効果とその戦略の癖を分離できない（設計書 §8.2）。
greedyAcquire（最も高コスト）は入れない——マナが唯一の律速である
greedyStrategy にとって最も打てない札を選び続ける戦略であり、
差の符号が解釈できないため。

declineOffer は UI に出さない。較正の noAcquire 腕にだけ要る。

application/simulation に置いた。use-case を組み立てるので domain には
置けず（domain → application の逆流）、run-simulation.ts にも置けない
（あちらが domain/expedition を参照すると循環になる）。"
```

---

## Task 14: `G1` — 獲得の測定可能性ゲート（段階A の出口）

**Files:**
- Create: `src/features/ashen-rampart/application/simulation/expedition-gate.test.ts`
- Modify: `docs/superpowers/specs/2026-09-04-ashen-rampart-iteration6-design.md`（§8.2 に実測を追記）

**Interfaces:**
- Consumes: `simulateExpedition` と4つの獲得戦略（Task 13）、`greedyStrategy`、`PRESET_DECKS`

**このタスクは「実装」ではなく「測定と判断」である。**
設計書 §8.2 は、差が出なければ**較正を続けず設計へ戻る**と規定している。

**⚠️ 反復5 の教訓の適用箇所である。** あちらは `deployThenIdleStrategy` に
41通りの掃引を費やした末に**指標そのものが無効**と判明した。
**ここでは掃引の前にこの1本だけを走らせる。**

- [ ] **Step 1: 測定テストを書く**

```ts
/**
 * 灰燼の城壁 - G1: 獲得の測定可能性ゲート（反復6 段階A の出口・設計書 §8.2）
 *
 * **初版のゲートは反転していた。** 「差が出れば合格」としていたが、
 * 獲得でデッキ枚数が変わると createDeck のシャッフルが全面的に変わるため、
 * **獲得が因果的に無力でも必ず差が出た。**
 *
 * 段階A では startStage が「基底12枚だけをシャッフルし、獲得札を山札の
 * 固定位置へ挿す」ようになっているので、両腕は同じ初期手札・同じ基底の並びで走る
 * （start-expedition.test.ts の4件がその前提を検査している）。
 *
 * したがってここで観測される差は**獲得そのものの効果**である。
 */
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import {
  simulateExpedition, noAcquire, cheapestAcquire, demandAwareAcquire, randomAcquireOf,
  type AcquireStrategy,
} from './expedition-simulation';

const SEEDS = 20;
const seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);

const measure = (label: string, acquire: AcquireStrategy) => {
  const results = seeds.flatMap((seed) =>
    Object.values(PRESET_DECKS).map((preset) =>
      simulateExpedition(preset.cards, seed, greedyStrategy, acquire)
    )
  );
  const total = results.length;
  return {
    label,
    total,
    cleared: results.filter((r) => r.outcome === 'cleared').length,
    reachedTier3: results.filter((r) => r.reachedTier3).length,
    stagesCleared: results.reduce((s, r) => s + r.stagesCleared, 0),
    acquiredTotal: results.reduce((s, r) => s + r.acquired.length, 0),
  };
};

describe('G1: 獲得の測定可能性ゲート', () => {
  it('4つの腕を測って表に出す', () => {
    let seedCounter = 0;
    const rng = () => {
      seedCounter = (seedCounter * 1103515245 + 12345) % 2147483648;
      return seedCounter / 2147483648;
    };
    const arms = [
      measure('noAcquire', noAcquire),
      measure('randomAcquire', randomAcquireOf(rng)),
      measure('cheapestAcquire', cheapestAcquire),
      measure('demandAwareAcquire', demandAwareAcquire),
    ];
    // eslint-disable-next-line no-console
    console.table(arms);

    // 構造の検査だけを assert する。**踏破率の閾値は assert しない**——
    // まだ測っていない値を閾値にするのは反復5 で外した誤りである（設計書 §8.1）。
    arms.forEach((arm) => {
      expect(arm.total).toBe(SEEDS * Object.keys(PRESET_DECKS).length);
    });
    expect(arms[0]?.acquiredTotal).toBe(0); // noAcquire は1枚も取らない
    expect(arms[3]?.acquiredTotal).toBeGreaterThan(0); // demandAware は取る
  });

  it('demandAware と random が実際に違う札を選んでいる（差が生まれる余地があるか）', () => {
    // **反復5 の教訓の直接の適用。** deployThenIdleStrategy は
    // 20シード中11シードで両戦略のランが完全に一致していた。
    // 「2つの戦略が実際に違う行動を取る余地があるか」を先に実測する。
    let seedCounter = 0;
    const rng = () => {
      seedCounter = (seedCounter * 1103515245 + 12345) % 2147483648;
      return seedCounter / 2147483648;
    };
    const randomArm = randomAcquireOf(rng);
    let differing = 0;
    let comparable = 0;
    seeds.forEach((seed) => {
      const a = simulateExpedition(PRESET_DECKS.swift.cards, seed, greedyStrategy, demandAwareAcquire);
      const b = simulateExpedition(PRESET_DECKS.swift.cards, seed, greedyStrategy, randomArm);
      if (a.acquired.length === 0 && b.acquired.length === 0) return;
      comparable++;
      if (a.acquired.join('|') !== b.acquired.join('|')) differing++;
    });
    // eslint-disable-next-line no-console
    console.log(`獲得内容が異なった遠征: ${differing}/${comparable}`);
    expect(comparable).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 測定を実行して数値を得る**

Run: `npx jest src/features/ashen-rampart/application/simulation/expedition-gate.test.ts`
Expected: PASS ＋ `console.table` の出力

**出力の4行（`cleared` / `reachedTier3` / `stagesCleared` / `acquiredTotal`）と、
「獲得内容が異なった遠征」の値を書き写す。**

- [ ] **Step 3: ゲートの判断を下す**

**判断の基準（設計書 §8.2）:**

| 観測 | 判断 |
|---|---|
| `demandAwareAcquire` と `randomAcquire` の `cleared` に差がある | **通過。** 獲得は「選び方」が効いている。段階B へ進む |
| 差が無い **かつ** 「獲得内容が異なった遠征」が少ない（両戦略が同じ札を選んでいる） | **設計へ戻る前に、提示の多様性を疑う。** `buildOffer` の候補が偏っていないか確認する |
| 差が無い **かつ** 獲得内容は違う（選び方は違うのに結果が動かない） | **暫定ステージが要求軸を実際に要求していない可能性を先に潰す。** 下記 Step 4 |
| 上記を潰してなお差が無い | **設計へ戻る。** 獲得の枚数・獲得プールの強度・要求軸の開示を見直す。**段階B へ進まない** |

- [ ] **Step 4: 差が無かった場合だけ — 暫定ステージが軸を要求しているか診断する**

**暫定ステージの `demands` は宣言であって、台本がその軸を本当に要求するかは
まだ検査していない**（`stage-pool.ts` の docstring に明記済み。それは段階D の `C1` の仕事）。
**要求していない台本では、要求軸を満たす札を選んでも結果は動かない。**

診断: 各暫定ステージについて、その軸を持つ札を抜いたデッキの勝率が落ちるかを測る。

```ts
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { derivedSeed } from '../../domain/shared/derived-seed';
import { createDeck } from '../../domain/cards/deck';
import { createCombatState } from '../../domain/combat/combat-state';
import { simulateRun } from '../../domain/combat/run-simulation';
import { DECK_SIZE } from '../../domain/cards/card-pool';
import { PROVISIONAL_STAGES, } from '../../domain/expedition/stage-pool';
import { axesOf } from '../../domain/expedition/stage-definition';
import type { DemandAxis, StageDefinition } from '../../domain/expedition/stage-definition';

/** そのデッキで、そのステージを単独で回したときの勝ち数（20シード） */
const winsFor = (cards: readonly string[], stage: StageDefinition): number =>
  seeds.filter((seed) => {
    const rng = new SeededRandom(derivedSeed(seed, 'shuffle', 0));
    const deck = createDeck(cards, () => rng.random());
    return (
      simulateRun(createCombatState(deck, stage.waves), greedyStrategy, stage.map).outcome === 'won'
    );
  }).length;

/** 軸を持つ札を抜き、魔力炉で DECK_SIZE まで埋め戻す */
const deckWithoutAxis = (cards: readonly string[], axis: DemandAxis): string[] => {
  const kept = cards.filter((id) => !axesOf(id).includes(axis));
  const padded = [...kept];
  while (padded.length < DECK_SIZE) padded.push('reactor');
  return padded.slice(0, DECK_SIZE);
};

it('診断: 暫定ステージが宣言した軸を実際に要求しているか', () => {
  const rows = PROVISIONAL_STAGES.flatMap((stage) =>
    stage.demands.map((axis) => ({
      stage: stage.id,
      axis,
      軸あり: `${winsFor(PRESET_DECKS.swift.cards, stage)}/${seeds.length}`,
      軸なし: `${winsFor(deckWithoutAxis(PRESET_DECKS.swift.cards, axis), stage)}/${seeds.length}`,
    }))
  );
  // eslint-disable-next-line no-console
  console.table(rows);
  expect(rows.length).toBeGreaterThan(0);
});
```

**この診断は勝率を assert しない。** 数値を出して、
「暫定台本の問題」か「機構の問題」かを切り分けるためだけに使う。

**読み方**: 「軸なし」が「軸あり」と同じくらい勝っているステージは、
**その軸を要求していない。** そのステージでは `demandAwareAcquire` が
要求軸を満たす札を選んでも結果が動かないので、`G1` の差は薄まる。
**その場合の原因は機構ではなく暫定台本にあり、段階B の本番ステージで解消する見込みが立つ。**

- [ ] **Step 5: 設計書 §8.2 に実測を追記する**

設計書の §8.2 の末尾に、Step 2 で得た表と Step 3 の判断を追記する。
**通過・不通過のどちらでも書く**——不通過なら何を試したかが次の設計の入力になる。

```markdown
#### 8.2.1 `G1` の実測（段階A・YYYY-MM-DD）

| 腕 | 踏破 | 層3到達 | クリアしたステージ総数 | 獲得総枚数 |
|---|---|---|---|---|
| noAcquire | … | … | … | 0 |
| randomAcquire | … | … | … | … |
| cheapestAcquire | … | … | … | … |
| demandAwareAcquire | … | … | … | … |

獲得内容が異なった遠征: …/…

**判断:** （通過／不通過と、その理由）
```

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/application/simulation/expedition-gate.test.ts \
        docs/superpowers/specs/2026-09-04-ashen-rampart-iteration6-design.md
git commit -m "test(ashen-rampart): G1 — 獲得の測定可能性ゲートを測る

設計書 §8.2 の段階A 出口ゲート。初版のゲートは反転していた（枚数が
変わるとシャッフルが変わるため、獲得が無力でも必ず差が出た）。
段階A では基底12枚だけをシャッフルして獲得札を固定位置へ挿すので、
観測される差は獲得そのものの効果である。

踏破率の閾値は assert しない。まだ測っていない値を閾値にするのは
反復5 で外した誤りである。構造だけを assert し、判断は人間が下す。

反復5 の教訓の直接の適用として、掃引の前に『2つの戦略が実際に違う
行動を取る余地があるか』を先に実測している。

実測と判断を設計書 §8.2.1 に追記した。"
```

---

## Task 15: 遠征の完全再生テスト

**Files:**
- Create: `src/features/ashen-rampart/application/simulation/expedition-replay.test.ts`

**Interfaces:**
- Consumes: `simulateExpedition`（Task 13）、`startExpedition`・`startStage`、`stepTick`

**なぜ必要か:** 設計書 §4.4・§10.2。**反復5 の判定を救ったのは
「`seed` ＋ デッキ ＋ 操作列でランを完全再生できる」性質**である。
初版判定記録の因果の主張は、この再生によって覆された。
**遠征でもこれが成り立つことを DoD にする。**

- [ ] **Step 1: 再生テストを書く**

```ts
/**
 * 灰燼の城壁 - 遠征の完全再生（反復6・設計書 §4.4 / §10.2）
 *
 * 反復5 の判定記録は、初版の因果の主張を**3ランを完全に再生して
 * 反実仮想を実測すること**で覆した（勝敗・決着 tick・unit_lost の座標まで一致）。
 * 遠征でも同じことができなければ、反復6 の判定記録は推論しか書けない。
 */
import { greedyStrategy, simulateRun } from '../../domain/combat/run-simulation';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { startExpedition, startStage } from '../use-cases/start-expedition';
import { currentStage } from '../../domain/expedition/expedition-state';
import { simulateExpedition, demandAwareAcquire } from './expedition-simulation';

const preset = PRESET_DECKS.swift.cards;

describe('遠征の完全再生', () => {
  it('同じシード・同じ戦略なら、決着tick・勝敗・残ライフまで完全に一致する', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const a = simulateExpedition(preset, seed, greedyStrategy, demandAwareAcquire);
      const b = simulateExpedition(preset, seed, greedyStrategy, demandAwareAcquire);
      expect(b).toEqual(a);
    }
  });

  it('獲得の選択を記録しておけば、その選択列から遠征を再生できる', () => {
    const seed = 7;
    // 1回目: 戦略に選ばせ、選択列を記録する
    const original = simulateExpedition(preset, seed, greedyStrategy, demandAwareAcquire);

    // 2回目: 記録した選択列をそのまま再生する（戦略ではなく記録から選ぶ）
    let index = 0;
    const replayAcquire = (offer: readonly string[]): string | undefined => {
      const picked = original.acquired[index++];
      return picked !== undefined && offer.includes(picked) ? picked : undefined;
    };
    const replayed = simulateExpedition(preset, seed, greedyStrategy, replayAcquire);

    expect(replayed.acquired).toEqual(original.acquired);
    expect(replayed.stageOutcomes).toEqual(original.stageOutcomes);
    expect(replayed.outcome).toBe(original.outcome);
    expect(replayed.lifeLeft).toBe(original.lifeLeft);
  });

  it('ステージ単体でも、同じ遠征状態からは同じランになる', () => {
    const exp = startExpedition(preset, 3);
    const stage = currentStage(exp)!;
    const first = simulateRun(startStage(exp), greedyStrategy, stage.map);
    const second = simulateRun(startStage(exp), greedyStrategy, stage.map);
    expect(second.ticks).toBe(first.ticks);
    expect(second.outcome).toBe(first.outcome);
    expect(second.lifeLeft).toBe(first.lifeLeft);
    // 盤面の最終状態まで一致する（座標レベルの再生可能性）
    expect(second.finalState.units.map((u) => u.pos)).toEqual(
      first.finalState.units.map((u) => u.pos)
    );
  });

  it('獲得した札が違えば結果も違いうる（再生が自明に成立しているのではない）', () => {
    // すべてのシードで結果が同じなら「再生できた」ことに意味が無い。
    // 獲得を変えると結果が動くシードが存在することを先に示す。
    let differing = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const withDemand = simulateExpedition(preset, seed, greedyStrategy, demandAwareAcquire);
      const withNone = simulateExpedition(preset, seed, greedyStrategy, () => undefined);
      if (
        withDemand.outcome !== withNone.outcome ||
        withDemand.stagesCleared !== withNone.stagesCleared ||
        withDemand.lifeLeft !== withNone.lifeLeft
      ) {
        differing++;
      }
    }
    // eslint-disable-next-line no-console
    console.log(`獲得の有無で結果が動いたシード: ${differing}/20`);
    expect(differing).toBeGreaterThan(0);
  });
});
```

**最後のテストが重要である。** 「同じ入力から同じ結果が出る」だけなら、
**すべてのシードで結果が同一でも通ってしまう**（実際、反復5 の
`deployThenIdleStrategy` は20シード中11シードで両戦略のランが完全に一致していた）。
**再生できることに意味があるのは、変えれば変わる場合だけである。**

- [ ] **Step 2: テストを実行する**

Run: `npx jest src/features/ashen-rampart/application/simulation/expedition-replay.test.ts`
Expected: PASS（4件）

**最後のテストが落ちたら（`differing === 0`）、それは再生の失敗ではなく
`G1` の不通過と同じ所見である。** Task 14 Step 3 の表に戻って判断すること。

- [ ] **Step 3: 変異で実効性を確認する**

`start-expedition.ts` の `derivedSeed(exp.seed, 'shuffle', exp.stageIndex)` から
`exp.stageIndex` を落として `derivedSeed(exp.seed, 'shuffle')` にする。

Run: `npx jest src/features/ashen-rampart/application/use-cases/start-expedition.test.ts`
Expected: **FAIL**（「ステージが違えばシャッフルも違う」が落ちる）

戻したあと、`insertAcquired` の挿入位置を `pile.length - ACQUIRED_INSERT_OFFSET - i` から
`0`（先頭）に変える。

Run: `npx jest src/features/ashen-rampart/application/use-cases/start-expedition.test.ts`
Expected: **FAIL**（「末尾から ACQUIRED_INSERT_OFFSET の位置にある」が落ちる）

確認できたら元に戻し、PASS を確認する。

- [ ] **Step 4: `npm run ci` を通す**

Run: `npm run ci`
Expected: すべて緑

- [ ] **Step 5: 作業ツリーのクリーンを確認する（PR 前の必須ゲート）**

Run: `git status --porcelain && git diff --stat`
Expected: **両方とも空**

**反復5 では並行検証の未追跡ファイルがビルドを壊し、1名が実機確認できなかった。**
変異を戻し忘れていないかもここで確認する。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/application/simulation/expedition-replay.test.ts
git commit -m "test(ashen-rampart): 遠征の完全再生テストを追加

反復5 の判定記録は、初版の因果の主張を3ランの完全再生と反実仮想の
実測で覆した。遠征でも同じことができなければ、反復6 の判定記録は
推論しか書けない（設計書 §4.4・§10.2）。

『変えれば変わる』ことを先に検査している。同じ入力から同じ結果が出る
だけなら、すべてのシードで結果が同一でも通ってしまう——実際
deployThenIdleStrategy は20シード中11シードでランが完全一致していた。

変異2種（シャッフルの添字を落とす／挿入位置を先頭にする）で
実効性を確認した。"
```

---

## 段階A の完了条件

すべて満たしてから段階B の計画に進む。

- [ ] `npm run ci` が緑（`lint:ci` を含む）
- [ ] `git status --porcelain` と `git diff --stat` が両方とも空
- [ ] **`G1` の実測値が設計書 §8.2.1 に追記されている**（通過・不通過のどちらでも）
- [ ] **`G1` の判断が明示的に下されている。** 不通過なら**段階B の計画を書かず、設計へ戻る**
- [ ] 遠征の完全再生テストが緑で、かつ「獲得の有無で結果が動いたシード」が 0 でない
- [ ] `plains-fixture.test.ts` が緑（`PLAINS_MAP` / `PLAINS_WAVES` を改変していない）
- [ ] `balance.test.ts` が緑（20枚時代の較正が凍結されたまま生きている）

## 段階A では**やらない**と決めたこと（記録）

次の計画がこれらを「忘れていた」と誤認しないための記録。

| 項目 | いつやるか | 理由 |
|---|---|---|
| `expedition_*` ログイベント | 段階C | 段階A には産出者がいない。使われない型を先に定義しても検査できない |
| 遠征の UI（獲得画面・遠征バー） | 段階C | 骨格の検証はテストで足りる |
| 新敵・新カード・6マップ | 段階B | `G1` の結果次第で設計が変わる |
| `applyDamage` の一本化・`hitPattern` 共用体・`attackersFor` の修正 | 段階B | 新機構と同時でなければ検査できない |
| 遠征の較正（`C1`〜`C5`） | 段階D | コンテンツが確定してから |
| 判定項目3 の閾値の算出（§7.8） | 段階D | 較正データが要る |
