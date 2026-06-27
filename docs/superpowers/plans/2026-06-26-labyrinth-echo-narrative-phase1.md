# 迷宮の残響 物語の背骨＋残響書庫（Phase 1）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** クリアを重ねるたびに「先人の残響（過去の探索者の物語断片）」が解禁され、新画面「残響書庫」で読み解ける縦軸の物語層を、既存メタ進行の上に追加する。

**Architecture:** `MetaState` に単一のメタ変数 `echoDepth`（残響深度）と `fragments`（収集済み断片ID）を追加。先人5名・断片19件・真相4レイヤーをデータ定義し、断片から echo イベントを動的生成する。echo イベントは既存 `metaCond` 機構で深度・フロア・収集状況によりゲートされ、`fl:"frag:<id>"` フラグで断片を付与する。生還時に深度+1＋取りこぼし救済（セーフティネット断片）を行い、書庫画面で先人カード・断片リーダー・真相レイヤーを描画する。

**Tech Stack:** React 19 + TypeScript / Jotai は不使用（本機能は React Hooks + 既存 useReducer）/ Jest 30 + @testing-library/react + SWC / styled は inline style（既存パターン踏襲）。

## Global Constraints

- 言語: コメント・docstring・UI テキストは日本語。変数/関数名は英語。
- `any` 型禁止 → `unknown` + 型ガード。`var` 禁止、`const` 優先。`null` より `undefined` 優先（外部境界除く）。
- 依存方向厳守: `domain/` は外部依存なし。`presentation/` が `domain/` を参照（逆は禁止）。
- `dangerouslySetInnerHTML` 禁止。
- ファイル名 kebab-case、型/コンポーネント PascalCase、定数 UPPER_SNAKE_CASE。
- テストは対象と同階層（または既存の `__tests__/` ミラー構造）に `*.test.ts(x)`。
- カバレッジ: 新規コード 80%+、ドメインロジック 90%+。
- コミット: Conventional Commits（`feat:` / `test:` / `docs:`）。本文は日本語可。
- `echoDepth` の上限定数は `ECHO_DEPTH_MAX = 6`（Phase 5 で拡張）。
- 断片総数 19（内訳: p_lian 4 / p_twins 4 / p_galen 4 / p_elna 4 / p_first 3）。
- テスト実行: `npx jest <path>`。型: `npm run typecheck`。リント: `npm run lint`。

base dir（以降の相対パスの起点）:
`src/features/labyrinth-echo/`

---

### Task 1: MetaState に echoDepth / fragments を追加（マイグレーション自動化）

`mergeWithDefaults` は `Object.keys(FRESH_META)` を走査するため、`FRESH_META` にフィールドを足すだけで旧セーブは自動的にデフォルト補完される。専用マイグレーションコードは不要。

**Files:**
- Modify: `domain/models/meta-state.ts`
- Test: `__tests__/presentation/hooks/migrate-meta-state.test.ts`（既存に追記）

**Interfaces:**
- Produces: `MetaState.echoDepth: number`, `MetaState.fragments: readonly string[]`, `FRESH_META` に `echoDepth: 0, fragments: []`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/migrate-meta-state.test.ts` に以下を追記（既存 import の `mergeWithDefaults` を利用。未 import なら追加）:

```ts
import { mergeWithDefaults } from '../../../presentation/hooks/use-persistence-sync';

describe('echoDepth / fragments マイグレーション', () => {
  it('echoDepth/fragments を持たない旧セーブはデフォルト値で補完される', () => {
    const oldSave = { runs: 3, escapes: 1, kp: 10 };
    const merged = mergeWithDefaults(oldSave);
    expect(merged.echoDepth).toBe(0);
    expect(merged.fragments).toEqual([]);
  });

  it('保存済みの echoDepth/fragments は保持される', () => {
    const save = { runs: 5, echoDepth: 2, fragments: ['f_lian_1'] };
    const merged = mergeWithDefaults(save);
    expect(merged.echoDepth).toBe(2);
    expect(merged.fragments).toEqual(['f_lian_1']);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest migrate-meta-state -t echoDepth`
Expected: FAIL（`merged.echoDepth` が `undefined`）

- [ ] **Step 3: MetaState と FRESH_META を更新**

`domain/models/meta-state.ts` の `MetaState` インターフェースに2フィールドを追加（`activeTitle` の後）:

```ts
  readonly activeTitle: string | null;
  /** 残響深度 — 生還ごとに +1（上限 ECHO_DEPTH_MAX）。物語/解禁のゲート */
  readonly echoDepth: number;
  /** 収集済み残響断片ID */
  readonly fragments: readonly string[];
}
```

同ファイルの `FRESH_META` にデフォルト値を追加（`activeTitle: null` の後）:

```ts
  activeTitle: null,
  echoDepth: 0,
  fragments: [],
});
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest migrate-meta-state`
Expected: PASS（全件）

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし（`createMetaState` は Partial 上書きなので既存呼び出しは影響なし）

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/domain/models/meta-state.ts src/features/labyrinth-echo/__tests__/presentation/hooks/migrate-meta-state.test.ts
git commit -m "feat: 迷宮の残響 MetaState に echoDepth/fragments を追加"
```

---

### Task 2: echo ドメインモデル型と先人データ

**Files:**
- Create: `domain/models/echo.ts`
- Create: `domain/constants/predecessor-defs.ts`
- Test: `__tests__/domain/constants/predecessor-defs.test.ts`

**Interfaces:**
- Produces:
  - `interface EchoFragment { id: string; predecessorId: string; order: number; depthGate: number; floors: readonly number[]; title: string; body: string }`
  - `interface Predecessor { id: string; name: string; icon: string; color: string; floors: readonly number[]; summary: string; truthLayer: number }`
  - `isEchoFragment(v: unknown): v is EchoFragment`（型ガード）
  - `PREDECESSORS: readonly Predecessor[]`（5名）

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/constants/predecessor-defs.test.ts`:

```ts
import { PREDECESSORS } from '../../../domain/constants/predecessor-defs';

describe('PREDECESSORS', () => {
  it('先人は5名定義されている', () => {
    expect(PREDECESSORS).toHaveLength(5);
  });
  it('IDは一意である', () => {
    const ids = PREDECESSORS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('期待する先人IDを全て含む', () => {
    const ids = PREDECESSORS.map(p => p.id);
    expect(ids).toEqual(['p_lian', 'p_twins', 'p_galen', 'p_elna', 'p_first']);
  });
  it('truthLayer は 1〜4 の範囲', () => {
    for (const p of PREDECESSORS) {
      expect(p.truthLayer).toBeGreaterThanOrEqual(1);
      expect(p.truthLayer).toBeLessThanOrEqual(4);
    }
  });
  it('name/summary は非空、floors は非空配列', () => {
    for (const p of PREDECESSORS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.summary.length).toBeGreaterThan(0);
      expect(p.floors.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest predecessor-defs`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: echo.ts を作成**

`domain/models/echo.ts`:

```ts
/**
 * 迷宮の残響 - 残響モデル（先人・断片）
 *
 * 過去の探索者（先人）とその残響断片を表現する型。
 * 純粋な型定義のみ。外部依存なし。
 */

/** 残響断片 — 先人の物語アークを構成する1片 */
export interface EchoFragment {
  /** 断片の一意ID（例 "f_lian_1"） */
  readonly id: string;
  /** 属する先人ID（例 "p_lian"） */
  readonly predecessorId: string;
  /** アーク内の読む順序（1始まり連番） */
  readonly order: number;
  /** この echoDepth 以上で出現可能（0〜6） */
  readonly depthGate: number;
  /** 探索中発見の対象フロア */
  readonly floors: readonly number[];
  /** 書庫の断片見出し */
  readonly title: string;
  /** 断片本文（重厚な散文） */
  readonly body: string;
}

/** 先人 — 残響の主（物語アークの単位） */
export interface Predecessor {
  readonly id: string;
  readonly name: string;
  /** アイコン（絵文字。画像は任意で後日差し替え） */
  readonly icon: string;
  readonly color: string;
  readonly floors: readonly number[];
  /** 全断片収集で解禁される人物総括 */
  readonly summary: string;
  /** この先人が属する真相レイヤー（1〜4） */
  readonly truthLayer: number;
}

/** EchoFragment の型ガード */
export const isEchoFragment = (v: unknown): v is EchoFragment => {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return typeof f.id === 'string'
    && typeof f.predecessorId === 'string'
    && typeof f.order === 'number'
    && typeof f.depthGate === 'number'
    && Array.isArray(f.floors)
    && typeof f.title === 'string'
    && typeof f.body === 'string';
};
```

- [ ] **Step 4: predecessor-defs.ts を作成**

`domain/constants/predecessor-defs.ts`:

```ts
/**
 * 迷宮の残響 - 先人定義
 *
 * 過去の探索者（残響の主）5名のデータ。
 */
import type { Predecessor } from '../models/echo';

/** 先人定義一覧 */
export const PREDECESSORS: readonly Predecessor[] = Object.freeze([
  {
    id: 'p_lian', name: '写本師リアン', icon: '📜', color: '#60a5fa', floors: [1, 2], truthLayer: 1,
    summary: '全てを記録すれば生還できると信じた写本師。情報に溺れ、錆びた檻の中で餓死した。彼の手記は、迷宮で最初に出会う「残響」となった。',
  },
  {
    id: 'p_twins', name: '双子 カイとノア', icon: '♊', color: '#a0a0b8', floors: [2, 3], truthLayer: 1,
    summary: '二人で挑んだ双子。片方がもう片方を背負い続けたが、灰色の迷路で別たれた。残された者の慟哭が、壁の引っ掻き傷に刻まれている。',
  },
  {
    id: 'p_galen', name: '地図屋ガレン', icon: '🗺', color: '#c084fc', floors: [3, 4], truthLayer: 2,
    summary: '迷宮を完全に図化しようとした地図屋。歪んだ幾何に正気を蝕まれ、狂気の果てに奇妙な悟りへ至った。',
  },
  {
    id: 'p_elna', name: '守人エルナ', icon: '🕯', color: '#fbbf24', floors: [4, 5], truthLayer: 3,
    summary: '最深部に到達しながら、自ら「留まる」ことを選んだ十二人目の探索者。先人たちの残響を看取る、迷宮の守人となった。',
  },
  {
    id: 'p_first', name: '始まりの探索者', icon: '✶', color: '#ff8fa3', floors: [5], truthLayer: 4,
    summary: '迷宮を生み出した最古の存在。喪った者を忘れぬため、全てを記憶する場所を願った。その願いの続きに、お前がいる。',
  },
]);
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest predecessor-defs`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/domain/models/echo.ts src/features/labyrinth-echo/domain/constants/predecessor-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/predecessor-defs.test.ts
git commit -m "feat: 迷宮の残響 先人モデルと先人データ5名を追加"
```

---

### Task 3: 残響断片データ（19件）と契約テスト

**Files:**
- Create: `domain/constants/echo-fragment-defs.ts`
- Test: `__tests__/domain/constants/echo-fragment-defs.test.ts`

**Interfaces:**
- Consumes: `EchoFragment`（Task 2）, `PREDECESSORS`（Task 2）。
- Produces: `ECHO_FRAGMENTS: readonly EchoFragment[]`（19件）。

- [ ] **Step 1: 失敗する契約テストを書く**

`__tests__/domain/constants/echo-fragment-defs.test.ts`:

```ts
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';
import { PREDECESSORS } from '../../../domain/constants/predecessor-defs';

const predIds = new Set(PREDECESSORS.map(p => p.id));

describe('ECHO_FRAGMENTS 契約', () => {
  it('断片は合計19件', () => {
    expect(ECHO_FRAGMENTS).toHaveLength(19);
  });
  it('断片IDは一意', () => {
    const ids = ECHO_FRAGMENTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('predecessorId は全て有効な先人を指す', () => {
    for (const f of ECHO_FRAGMENTS) expect(predIds.has(f.predecessorId)).toBe(true);
  });
  it('depthGate は 0〜6 の範囲', () => {
    for (const f of ECHO_FRAGMENTS) {
      expect(f.depthGate).toBeGreaterThanOrEqual(0);
      expect(f.depthGate).toBeLessThanOrEqual(6);
    }
  });
  it('floors は非空、title/body は非空', () => {
    for (const f of ECHO_FRAGMENTS) {
      expect(f.floors.length).toBeGreaterThan(0);
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.body.length).toBeGreaterThan(0);
    }
  });
  it('先人ごとの断片数は p_lian4/p_twins4/p_galen4/p_elna4/p_first3', () => {
    const count = (pid: string) => ECHO_FRAGMENTS.filter(f => f.predecessorId === pid).length;
    expect(count('p_lian')).toBe(4);
    expect(count('p_twins')).toBe(4);
    expect(count('p_galen')).toBe(4);
    expect(count('p_elna')).toBe(4);
    expect(count('p_first')).toBe(3);
  });
  it('各先人の order は 1 始まりの連番', () => {
    for (const p of PREDECESSORS) {
      const orders = ECHO_FRAGMENTS.filter(f => f.predecessorId === p.id).map(f => f.order).sort((a, b) => a - b);
      orders.forEach((o, i) => expect(o).toBe(i + 1));
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest echo-fragment-defs`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: echo-fragment-defs.ts を作成**

`domain/constants/echo-fragment-defs.ts`:

```ts
/**
 * 迷宮の残響 - 残響断片定義
 *
 * 先人ごとの物語断片（合計19件）。order は読む順序、depthGate は出現可能な最小 echoDepth。
 */
import type { EchoFragment } from '../models/echo';

/** 残響断片一覧 */
export const ECHO_FRAGMENTS: readonly EchoFragment[] = Object.freeze([
  // ── 写本師リアン（p_lian） ──
  { id: 'f_lian_1', predecessorId: 'p_lian', order: 1, depthGate: 0, floors: [1], title: '写本師の最初の頁',
    body: '几帳面な字で綴られた手記の冒頭。「記録こそが生還の鍵だ。見たもの全てを書き留める。一片の情報も逃さない」――まだ、希望に満ちた筆致だった。' },
  { id: 'f_lian_2', predecessorId: 'p_lian', order: 2, depthGate: 1, floors: [1, 2], title: '増えてゆく注釈',
    body: '頁の余白が、後から書き足された注釈で埋め尽くされている。「地図は信じるな」「水音は罠」「沈黙こそ危険」。文字が、少しずつ乱れ始めている。' },
  { id: 'f_lian_3', predecessorId: 'p_lian', order: 3, depthGate: 1, floors: [2], title: 'インクの切れた頁',
    body: 'インクが尽きたのか、後半は黒ずんだ色で書かれている。「もう何日いる? 頁はまだ足りない。全部、記録しなければ。忘れては、ならない」。' },
  { id: 'f_lian_4', predecessorId: 'p_lian', order: 4, depthGate: 2, floors: [2], title: '写本師の最期',
    body: '錆びた檻の中の白骨。膝の上に、ぼろぼろの手記が抱かれている。最後の頁にはただ一言――「記録は完成した。だが、私を記録する者はいない」。' },
  // ── 双子 カイとノア（p_twins） ──
  { id: 'f_twins_1', predecessorId: 'p_twins', order: 1, depthGate: 1, floors: [2], title: '二人分の足跡',
    body: '埃の上に、寄り添うように並んだ二組の足跡。片方は力強く、片方は引きずるよう。「カイ、もう少しだ」「ノア、置いていけよ」――壁に交わした言葉が刻まれている。' },
  { id: 'f_twins_2', predecessorId: 'p_twins', order: 2, depthGate: 2, floors: [2, 3], title: '背負われた重さ',
    body: '片方の足跡が消え、もう片方が深くなる。誰かが、誰かを背負い始めた地点。床に乾いた血。「重くない。お前は羽みたいだ」と、震える字。' },
  { id: 'f_twins_3', predecessorId: 'p_twins', order: 3, depthGate: 2, floors: [3], title: '鏡に映る二人',
    body: 'あの鏡の前で、双子は何を見たのか。縁に二人分の指の跡。「鏡の中では、まだ二人とも立っている」。願いが、そこに焼き付いている。' },
  { id: 'f_twins_4', predecessorId: 'p_twins', order: 4, depthGate: 3, floors: [3], title: '一人分の到達点',
    body: '通路の行き止まりに、一人分の骸と、隣に丁寧に並べられた装備一式。背負われていた方は、ここまで来られなかったらしい。残された者の慟哭が、壁の引っ掻き傷に残っている。' },
  // ── 地図屋ガレン（p_galen） ──
  { id: 'f_galen_1', predecessorId: 'p_galen', order: 1, depthGate: 2, floors: [3], title: '地図屋の宣言',
    body: '壁一面に描かれた精緻な地図。署名は「地図屋ガレン」。「この迷宮を完全に図化する。不可能などない。幾何は嘘をつかない」――自信に満ちた筆致。' },
  { id: 'f_galen_2', predecessorId: 'p_galen', order: 2, depthGate: 3, floors: [3, 4], title: '歪み始める線',
    body: '地図の線が、途中から歪み、重なり、矛盾し始める。「同じ部屋に二度戻った。いや、別の部屋だ。距離が、合わない。壁が、動いている」。' },
  { id: 'f_galen_3', predecessorId: 'p_galen', order: 3, depthGate: 3, floors: [4], title: '不可能な幾何',
    body: '床にも天井にも、無数の線が錯乱して描かれている。もはや地図ではない。「角度の総和が合わない。ここは三次元では、ない。私の頭がおかしいのか、世界がおかしいのか」。' },
  { id: 'f_galen_4', predecessorId: 'p_galen', order: 4, depthGate: 4, floors: [4], title: '地図屋の解',
    body: '中心に、ただ一点だけ正確な円が描かれている。その中に座り込んだ骸。「分かった。迷宮を図化するな。迷宮に、自分を図化させるのだ」――狂気の果ての、奇妙な悟り。' },
  // ── 守人エルナ（p_elna） ──
  { id: 'f_elna_1', predecessorId: 'p_elna', order: 1, depthGate: 3, floors: [4], title: '守人の覚書',
    body: '他の痕跡と違い、落ち着いた筆致。「私は十二人目だ。先に進んだ者の記録を、全て読んだ。リアン、双子、ガレン――彼らは消えていない。ここに、いる」。' },
  { id: 'f_elna_2', predecessorId: 'p_elna', order: 2, depthGate: 4, floors: [4, 5], title: '核との対話',
    body: '「迷宮の核と話した。あれは敵ではない。寂しいのだ。忘れられることを、何より恐れている。だから、忘れたくない者を呼び、留めておく」。' },
  { id: 'f_elna_3', predecessorId: 'p_elna', order: 3, depthGate: 4, floors: [5], title: '留まる選択',
    body: '「私は帰れる。資格はある。だが、帰らない。先に逝った者たちの残響を、誰かが看取らねばならない。私は、この迷宮の守人になる」。' },
  { id: 'f_elna_4', predecessorId: 'p_elna', order: 4, depthGate: 5, floors: [5], title: '守人の今',
    body: '最深部の手前。穏やかな気配が漂う一角。声なき声が囁く。「よく来た。お前で、何人目だろうね。安心おし。お前のことも、私が憶えていてあげる」。' },
  // ── 始まりの探索者（p_first） ──
  { id: 'f_first_1', predecessorId: 'p_first', order: 1, depthGate: 4, floors: [5], title: '最古の刻印',
    body: '他のどの痕跡より古い、石に直接刻まれた文字。言語さえ異なる。かろうじて読める一節――「私は、失った。だから、二度と忘れぬ場所を、創る」。' },
  { id: 'f_first_2', predecessorId: 'p_first', order: 2, depthGate: 5, floors: [5], title: '迷宮の起源',
    body: '「愛する者を喪い、その記憶さえ薄れゆくことに耐えられなかった。私は願った。全てを憶えていてくれる場所を。願いは、形になった。これが、迷宮だ」。' },
  { id: 'f_first_3', predecessorId: 'p_first', order: 3, depthGate: 6, floors: [5], title: '始まりと、お前',
    body: '刻印の最後。なぜか、たった今書かれたように新しい。「そして今、これを読むお前へ。お前もまた、誰かに忘れられたくなかった者だ。だから、ここにいる。――おかえり」。' },
]);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest echo-fragment-defs`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/domain/constants/echo-fragment-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/echo-fragment-defs.test.ts
git commit -m "feat: 迷宮の残響 残響断片データ19件と契約テストを追加"
```

---

### Task 4: 真相レイヤー定義

**Files:**
- Create: `domain/constants/truth-defs.ts`
- Test: `__tests__/domain/constants/truth-defs.test.ts`

**Interfaces:**
- Produces:
  - `interface TruthLayer { id: string; layer: number; depthGate: number; title: string; text: string }`
  - `TRUTH_LAYERS: readonly TruthLayer[]`（4件、layer 1〜4 / depthGate 昇順）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/constants/truth-defs.test.ts`:

```ts
import { TRUTH_LAYERS } from '../../../domain/constants/truth-defs';

describe('TRUTH_LAYERS', () => {
  it('真相レイヤーは4件', () => {
    expect(TRUTH_LAYERS).toHaveLength(4);
  });
  it('layer は 1,2,3,4', () => {
    expect(TRUTH_LAYERS.map(t => t.layer)).toEqual([1, 2, 3, 4]);
  });
  it('depthGate は昇順', () => {
    const gates = TRUTH_LAYERS.map(t => t.depthGate);
    expect([...gates].sort((a, b) => a - b)).toEqual(gates);
  });
  it('title/text は非空', () => {
    for (const t of TRUTH_LAYERS) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest truth-defs`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: truth-defs.ts を作成**

`domain/constants/truth-defs.ts`:

```ts
/**
 * 迷宮の残響 - 真相レイヤー定義
 *
 * echoDepth に応じて段階的に開示される「迷宮の真相」テキスト。
 */

/** 真相レイヤー */
export interface TruthLayer {
  readonly id: string;
  /** レイヤー番号（1〜4） */
  readonly layer: number;
  /** この echoDepth 以上で開示 */
  readonly depthGate: number;
  readonly title: string;
  readonly text: string;
}

/** 真相レイヤー一覧（depthGate 昇順） */
export const TRUTH_LAYERS: readonly TruthLayer[] = Object.freeze([
  { id: 'truth_1', layer: 1, depthGate: 1, title: '残響の正体',
    text: '先人たちは実在した。壁の染み、遺された道具、掠れた文字――それらは確かに「誰か」がここにいた痕跡だ。迷宮は、訪れた者を忘れない。' },
  { id: 'truth_2', layer: 2, depthGate: 3, title: '迷宮の意図',
    text: '気づいてしまう。この迷宮は「忘れたくない者」を選んで招いている。死は終わりではなく、記憶の保存だ。残響とは、迷宮が刻んだ記録そのもの。' },
  { id: 'truth_3', layer: 3, depthGate: 5, title: 'お前という残響',
    text: 'なぜ自分は何度も戻れるのか。答えは単純で、残酷だ――お前もまた、迷宮に保存された残響の一つ。死と再挑戦の繰り返しは、迷宮が見せる記憶の再生なのだ。' },
  { id: 'truth_4', layer: 4, depthGate: 6, title: '始まりの願い',
    text: '始まりの探索者の声が聞こえる。迷宮は彼の「忘れたくない」という願いから生まれた。そしてお前は、その願いが見続けている夢の続き。――まだ、終わりではない。' },
]);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest truth-defs`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/domain/constants/truth-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/truth-defs.test.ts
git commit -m "feat: 迷宮の残響 真相レイヤー定義を追加"
```

---

### Task 5: echo-service（純粋関数群）

**Files:**
- Create: `domain/services/echo-service.ts`
- Test: `__tests__/domain/services/echo-service.test.ts`

**Interfaces:**
- Consumes: `ECHO_FRAGMENTS`（Task 3）, `TRUTH_LAYERS`/`TruthLayer`（Task 4）, `EchoFragment`（Task 2）。
- Produces:
  - `ECHO_DEPTH_MAX: number`（= 6）
  - `incrementEchoDepth(d: number): number`
  - `isFragmentUnlockable(f: EchoFragment, echoDepth: number): boolean`
  - `selectSafetyNetFragment(echoDepth: number, collected: readonly string[]): EchoFragment | null`
  - `predecessorFragments(predId: string): EchoFragment[]`
  - `predecessorProgress(predId: string, collected: readonly string[]): { collected: number; total: number }`
  - `isPredecessorDiscovered(predId: string, collected: readonly string[]): boolean`
  - `isPredecessorComplete(predId: string, collected: readonly string[]): boolean`
  - `unlockedTruthLayers(echoDepth: number): TruthLayer[]`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/services/echo-service.test.ts`:

```ts
import {
  ECHO_DEPTH_MAX, incrementEchoDepth, isFragmentUnlockable,
  selectSafetyNetFragment, predecessorFragments, predecessorProgress,
  isPredecessorDiscovered, isPredecessorComplete, unlockedTruthLayers,
} from '../../../domain/services/echo-service';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const frag = (id: string) => ECHO_FRAGMENTS.find(f => f.id === id)!;

describe('echo-service', () => {
  it('incrementEchoDepth は +1 し ECHO_DEPTH_MAX で頭打ち', () => {
    expect(incrementEchoDepth(0)).toBe(1);
    expect(incrementEchoDepth(ECHO_DEPTH_MAX)).toBe(ECHO_DEPTH_MAX);
    expect(incrementEchoDepth(ECHO_DEPTH_MAX - 1)).toBe(ECHO_DEPTH_MAX);
  });

  it('isFragmentUnlockable は depthGate と echoDepth を比較', () => {
    expect(isFragmentUnlockable(frag('f_lian_1'), 0)).toBe(true); // gate0
    expect(isFragmentUnlockable(frag('f_lian_4'), 1)).toBe(false); // gate2
    expect(isFragmentUnlockable(frag('f_lian_4'), 2)).toBe(true);
  });

  it('selectSafetyNetFragment は解禁済み未収集の最小 order を返す', () => {
    const f = selectSafetyNetFragment(0, []);
    expect(f?.id).toBe('f_lian_1'); // depth0 で唯一 gate0
  });

  it('selectSafetyNetFragment は収集済みを除外する', () => {
    const f = selectSafetyNetFragment(1, ['f_lian_1']);
    // depth1: gate<=1 の未収集のうち order 最小 → f_lian_2 か f_twins_1（order2 vs order1）
    expect(f?.id).toBe('f_twins_1');
  });

  it('全断片を集め切ると null を返す', () => {
    const all = ECHO_FRAGMENTS.map(f => f.id);
    expect(selectSafetyNetFragment(ECHO_DEPTH_MAX, all)).toBeNull();
  });

  it('predecessorProgress は収集数/総数を返す', () => {
    expect(predecessorProgress('p_lian', ['f_lian_1', 'f_lian_2'])).toEqual({ collected: 2, total: 4 });
  });

  it('isPredecessorDiscovered は1片でも収集していれば true', () => {
    expect(isPredecessorDiscovered('p_lian', [])).toBe(false);
    expect(isPredecessorDiscovered('p_lian', ['f_lian_3'])).toBe(true);
  });

  it('isPredecessorComplete は全片収集で true', () => {
    expect(isPredecessorComplete('p_first', ['f_first_1', 'f_first_2'])).toBe(false);
    expect(isPredecessorComplete('p_first', ['f_first_1', 'f_first_2', 'f_first_3'])).toBe(true);
  });

  it('unlockedTruthLayers は depthGate<=echoDepth のレイヤーを返す', () => {
    expect(unlockedTruthLayers(0)).toHaveLength(0);
    expect(unlockedTruthLayers(1).map(t => t.layer)).toEqual([1]);
    expect(unlockedTruthLayers(6).map(t => t.layer)).toEqual([1, 2, 3, 4]);
  });

  it('predecessorFragments は order 昇順', () => {
    const orders = predecessorFragments('p_lian').map(f => f.order);
    expect(orders).toEqual([1, 2, 3, 4]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest echo-service`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: echo-service.ts を作成**

`domain/services/echo-service.ts`:

```ts
/**
 * 迷宮の残響 - EchoService（残響進行サービス）
 *
 * 残響深度・断片解禁・先人進捗・真相レイヤー導出の純粋関数群。外部依存なし。
 */
import { ECHO_FRAGMENTS } from '../constants/echo-fragment-defs';
import { TRUTH_LAYERS } from '../constants/truth-defs';
import type { TruthLayer } from '../constants/truth-defs';
import type { EchoFragment } from '../models/echo';

/** 残響深度の上限（Phase 5 で拡張） */
export const ECHO_DEPTH_MAX = 6;

/** 残響深度を +1 する（上限でクランプ） */
export const incrementEchoDepth = (d: number): number =>
  Math.min((d ?? 0) + 1, ECHO_DEPTH_MAX);

/** 断片が現在の深度で解禁可能か */
export const isFragmentUnlockable = (f: EchoFragment, echoDepth: number): boolean =>
  f.depthGate <= echoDepth;

/**
 * セーフティネット断片を選ぶ。
 * 解禁済み（depthGate<=echoDepth）かつ未収集の断片から、
 * order 昇順 → predecessorId 昇順で最小の1件を返す。なければ null。
 */
export const selectSafetyNetFragment = (
  echoDepth: number,
  collected: readonly string[],
): EchoFragment | null => {
  const candidates = ECHO_FRAGMENTS
    .filter(f => isFragmentUnlockable(f, echoDepth) && !collected.includes(f.id))
    .sort((a, b) => a.order - b.order || a.predecessorId.localeCompare(b.predecessorId));
  return candidates[0] ?? null;
};

/** 先人の断片を order 昇順で返す */
export const predecessorFragments = (predId: string): EchoFragment[] =>
  ECHO_FRAGMENTS.filter(f => f.predecessorId === predId).sort((a, b) => a.order - b.order);

/** 先人の収集進捗（収集数/総数） */
export const predecessorProgress = (
  predId: string,
  collected: readonly string[],
): { collected: number; total: number } => {
  const all = predecessorFragments(predId);
  return { collected: all.filter(f => collected.includes(f.id)).length, total: all.length };
};

/** 先人を1片でも発見済みか */
export const isPredecessorDiscovered = (predId: string, collected: readonly string[]): boolean =>
  predecessorFragments(predId).some(f => collected.includes(f.id));

/** 先人の断片を全て収集済みか */
export const isPredecessorComplete = (predId: string, collected: readonly string[]): boolean => {
  const p = predecessorProgress(predId, collected);
  return p.total > 0 && p.collected === p.total;
};

/** echoDepth で開示済みの真相レイヤーを返す */
export const unlockedTruthLayers = (echoDepth: number): TruthLayer[] =>
  TRUTH_LAYERS.filter(t => t.depthGate <= echoDepth);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest echo-service`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/domain/services/echo-service.ts src/features/labyrinth-echo/__tests__/domain/services/echo-service.test.ts
git commit -m "feat: 迷宮の残響 echo-service（残響進行の純粋関数）を追加"
```

---

### Task 6: echo イベント種別の登録と断片からのイベント動的生成

**Files:**
- Modify: `domain/constants/event-type-defs.ts`
- Create: `events/echo-events.ts`
- Test: `__tests__/events/echo-events.test.ts`

**Interfaces:**
- Consumes: `ECHO_FRAGMENTS`（Task 3）, `PREDECESSORS`（Task 2）, `GameEvent`（`events/event-utils`）。
- Produces: `EVENT_TYPE.echo`, `buildEchoEvents(): GameEvent[]`, `ECHO_EVENTS: GameEvent[]`。各 echo イベントは `id: "echo_<fragId>"`, `tp:"echo"`, `metaCond` 付き、`fl:"frag:<fragId>"` を持つ「読み解く」選択肢を含む。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/events/echo-events.test.ts`:

```ts
import { ECHO_EVENTS, buildEchoEvents } from '../../events/echo-events';
import { ECHO_FRAGMENTS } from '../../domain/constants/echo-fragment-defs';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { validateEvents } from '../../events/event-utils';
import { createMetaState } from '../../domain/models/meta-state';

describe('echo-events', () => {
  it('断片1件につき echo イベント1件を生成する', () => {
    expect(ECHO_EVENTS).toHaveLength(ECHO_FRAGMENTS.length);
  });

  it('全 echo イベントが tp:"echo" でフラグ frag: を持つ', () => {
    for (const e of ECHO_EVENTS) {
      expect(e.tp).toBe('echo');
      const fragFlags = e.ch.flatMap(c => c.o).map(o => o.fl).filter(Boolean);
      expect(fragFlags.some(fl => fl!.startsWith('frag:'))).toBe(true);
    }
  });

  it('各断片IDが echo イベントで付与可能', () => {
    const grantedIds = ECHO_EVENTS.flatMap(e =>
      e.ch.flatMap(c => c.o).map(o => o.fl).filter((fl): fl is string => !!fl && fl.startsWith('frag:')).map(fl => fl.slice(5)),
    );
    for (const f of ECHO_FRAGMENTS) expect(grantedIds).toContain(f.id);
  });

  it('metaCond は深度不足だと false、満たすと true、収集済みだと false', () => {
    const e = ECHO_EVENTS.find(ev => ev.id === 'echo_f_lian_4')!; // depthGate 2
    expect(e.metaCond!(createMetaState({ echoDepth: 1, fragments: [] }))).toBe(false);
    expect(e.metaCond!(createMetaState({ echoDepth: 2, fragments: [] }))).toBe(true);
    expect(e.metaCond!(createMetaState({ echoDepth: 2, fragments: ['f_lian_4'] }))).toBe(false);
  });

  it('EVENT_TYPE.echo が登録され validateEvents を通過する', () => {
    expect(EVENT_TYPE.echo).toBeDefined();
    expect(() => validateEvents([...ECHO_EVENTS], EVENT_TYPE)).not.toThrow();
  });

  it('buildEchoEvents は ECHO_EVENTS と同数を返す', () => {
    expect(buildEchoEvents()).toHaveLength(ECHO_FRAGMENTS.length);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest echo-events`
Expected: FAIL（モジュール未解決 / EVENT_TYPE.echo undefined）

- [ ] **Step 3: EVENT_TYPE に echo を追加**

`domain/constants/event-type-defs.ts` の `EVENT_TYPE` に追記（`rest` の後）:

```ts
  rest:        { label: "安 息", colors: ["#4ade80", "rgba(74,222,128,0.08)",  "rgba(74,222,128,0.2)"]  },
  echo:        { label: "残 響", colors: ["#c4b5fd", "rgba(196,181,253,0.08)", "rgba(196,181,253,0.2)"] },
});
```

- [ ] **Step 4: echo-events.ts を作成**

`events/echo-events.ts`:

```ts
/**
 * 迷宮の残響 - 残響イベント生成
 *
 * 断片データ（ECHO_FRAGMENTS）から echo イベントを動的生成する。
 * 各 echo イベントは metaCond で深度・収集状況によりゲートされ、
 * 「読み解く」選択で fl:"frag:<id>" により断片を付与する。
 */
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';
import { PREDECESSORS } from '../domain/constants/predecessor-defs';
import type { MetaState } from '../domain/models/meta-state';
import type { GameEvent } from './event-utils';

/** 読み解き時の精神コスト（マイナス） */
const READ_MN_COST = -3;
/** 読み解き時の情報値ボーナス */
const READ_INF_BONUS = 5;

/** 断片定義から echo イベント配列を生成する */
export const buildEchoEvents = (): GameEvent[] =>
  ECHO_FRAGMENTS.map(f => {
    const pred = PREDECESSORS.find(p => p.id === f.predecessorId);
    const predName = pred?.name ?? '先人';
    const icon = pred?.icon ?? '🕯';
    return {
      id: `echo_${f.id}`,
      fl: [...f.floors],
      tp: 'echo',
      sit: `${icon} 壁にひとつの残響が滲んでいる。${predName}の痕跡――「${f.title}」。耳を澄ませば、過去の声が聞こえてくる。`,
      metaCond: (m: MetaState) =>
        (m.echoDepth ?? 0) >= f.depthGate && !(m.fragments ?? []).includes(f.id),
      ch: [
        { t: '残響を読み解く', o: [
          { c: 'default', r: `${f.body}\n\n――その残響を、書庫に書き留めた。`, mn: READ_MN_COST, inf: READ_INF_BONUS, fl: `frag:${f.id}` },
        ] },
        { t: '触れずに先へ進む', o: [
          { c: 'default', r: 'その残響に触れず、先へ進んだ。いつか、また巡り会うだろう。', mn: 0, inf: 0 },
        ] },
      ],
    };
  });

/** 生成済み echo イベント一覧 */
export const ECHO_EVENTS: GameEvent[] = buildEchoEvents();
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest echo-events`
Expected: PASS（全件）

- [ ] **Step 6: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 7: コミット**

```bash
git add src/features/labyrinth-echo/domain/constants/event-type-defs.ts src/features/labyrinth-echo/events/echo-events.ts src/features/labyrinth-echo/__tests__/events/echo-events.test.ts
git commit -m "feat: 迷宮の残響 echo イベント種別の登録と断片からの動的生成"
```

---

### Task 7: echo イベントを選出プールに統合

`EVENTS = validateEvents(EV, EVENT_TYPE)` を `validateEvents([...EV, ...ECHO_EVENTS], EVENT_TYPE)` に変更し、echo イベントを `pickEvent` の対象に含める。タイトルの「種類数」表示は通常イベント数のまま保つ（残響でネタバレしない）。

**Files:**
- Modify: `presentation/LabyrinthEchoGame.tsx`（45行目付近、240行目付近）
- Test: `__tests__/events/echo-pick.test.ts`

**Interfaces:**
- Consumes: `ECHO_EVENTS`（Task 6）, `pickEvent`/`validateEvents`（`events/event-utils`）。
- Produces: 振る舞いのみ（深度・収集状況で echo イベントが選出される / 収集済みは除外）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/events/echo-pick.test.ts`:

```ts
import { pickEvent, validateEvents } from '../../events/event-utils';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { createMetaState } from '../../domain/models/meta-state';
import type { FxState } from '../../domain/models/unlock';

const EVENTS = validateEvents([...EV, ...ECHO_EVENTS], EVENT_TYPE);
const FX = {} as FxState;

describe('echo イベントの選出統合', () => {
  it('深度を満たす未収集の echo イベントがプールに含まれる', () => {
    // floor1, echoDepth0 → echo_f_lian_1 (gate0) のみが残る候補。
    // 通常イベントを全て usedIds に入れると floor1 で選出可能なのは echo_f_lian_1 だけ
    // → プール要素数1のため rng に依存せず必ず返る（rng は省略）。
    const meta = createMetaState({ echoDepth: 0, fragments: [] });
    const floor1NormalIds = EV.filter(e => (e.fl as number[]).includes(1)).map(e => e.id);
    const picked = pickEvent({ events: EVENTS, floor: 1, usedIds: floor1NormalIds, meta, fx: FX });
    expect(picked?.id).toBe('echo_f_lian_1');
  });

  it('収集済みの断片に対応する echo イベントは選出されない', () => {
    // f_lian_1 を収集済みにすると echo_f_lian_1 の metaCond は false。
    // floor1 通常も全て used → 選出可能イベントが無くなり null になる。
    const meta = createMetaState({ echoDepth: 0, fragments: ['f_lian_1'] });
    const floor1NormalIds = EV.filter(e => (e.fl as number[]).includes(1)).map(e => e.id);
    const picked = pickEvent({ events: EVENTS, floor: 1, usedIds: floor1NormalIds, meta, fx: FX });
    expect(picked?.id).not.toBe('echo_f_lian_1');
  });
});
```

- [ ] **Step 2: テストの位置づけを理解する**

このテストは「`pickEvent` と `ECHO_EVENTS` を結合すると正しく選出される」という**振る舞いの仕様**を固定するもので、テスト内で `EVENTS` を自前に組み立てるため Task 6 完了時点で既に PASS しうる。本タスクの主眼は **実コード（`LabyrinthEchoGame.tsx`）への統合**であり、その効果は Step 5 の event 系回帰と Task 12 の手動/E2E で担保する。

Run: `npx jest echo-pick`
Expected: PASS（このテスト単体は実装統合に依存しない仕様テスト）。もし FAIL する場合は echo-events / event-utils 側の不整合を先に解消する。

- [ ] **Step 3: LabyrinthEchoGame.tsx を統合**

`presentation/LabyrinthEchoGame.tsx` の import に追加（17行目付近の `import { EV } ...` の直後）:

```ts
import { ECHO_EVENTS } from '../events/echo-events';
```

45行目を変更:

```ts
const EVENTS = validateEvents([...EV, ...ECHO_EVENTS], EVENT_TYPE);
```

240行目付近の `eventCount={EVENTS.length}` を、通常イベント数に変更（残響を種類数表示に含めない）:

```ts
        eventCount={EV.length}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest echo-pick`
Expected: PASS

- [ ] **Step 5: 既存イベントテストの回帰確認**

Run: `npx jest event`
Expected: PASS（event-data / event-selector / echo 系すべて）

- [ ] **Step 6: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 7: コミット**

```bash
git add src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx src/features/labyrinth-echo/__tests__/events/echo-pick.test.ts
git commit -m "feat: 迷宮の残響 echo イベントを選出プールに統合"
```

---

### Task 8: 断片収集（handleChoice の frag フラグ処理）

echo イベントの「読み解く」outcome は `fl:"frag:<id>"` を持つ。`useHandleChoice` でこれを検出し `meta.fragments` に追加する。`fl` は `add:`/`remove:` で始まらないため既存のプレイヤー適用ロジックには副作用を与えない。

**Files:**
- Modify: `presentation/hooks/use-game-actions.ts`（`useHandleChoice` 内）
- Test: `__tests__/presentation/hooks/use-game-actions-fragment.test.ts`

**Interfaces:**
- Consumes: `processChoice` の戻り `outcome.fl`（`events/event-utils`）, `updateMeta`（既存 deps）。
- Produces: 断片収集の副作用（`updateMeta(m => ({ fragments: ... }))`）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/use-game-actions-fragment.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react';
import { useGameActions } from '../../../presentation/hooks/use-game-actions';
import type { GameActionsDeps } from '../../../presentation/hooks/use-game-actions';
import { createMetaState } from '../../../domain/models/meta-state';
import { createInitialState } from '../../../presentation/hooks/use-game-orchestrator';
import type { GameEvent } from '../../../events/event-utils';

// 断片付与イベント（読み解く選択肢のみ）
// 数値変化を持たせず（fx 未設定による NaN を避ける）断片付与のみを検証
const echoEvent: GameEvent = {
  id: 'echo_test', fl: [1], tp: 'echo',
  sit: 'テスト残響',
  ch: [{ t: '読み解く', o: [{ c: 'default', r: '断片獲得', fl: 'frag:f_lian_1' }] }],
};

const noop = () => undefined;
const audioSfx = {
  choice: noop, hit: noop, bigHit: noop, heal: noop, status: noop, clear: noop,
  drain: noop, over: noop, floor: noop, ambient: noop, victory: noop, levelUp: noop,
};

const makeDeps = (overrides: Partial<GameActionsDeps>): GameActionsDeps => {
  const player = { hp: 50, maxHp: 50, mn: 30, maxMn: 35, inf: 10, statuses: [] };
  return {
    state: { ...createInitialState(), phase: 'event', player, diff: null, event: echoEvent, floor: 1, step: 0 },
    dispatch: noop,
    fx: {} as GameActionsDeps['fx'],
    meta: createMetaState({ echoDepth: 0, fragments: [] }),
    events: [echoEvent],
    sfx: (fn: () => void) => fn(),
    safeTimeout: ((fn: () => void) => { fn(); return 0 as unknown as ReturnType<typeof setTimeout>; }),
    doShake: noop,
    flash: noop,
    updateMeta: noop,
    audioSfx,
    ...overrides,
  };
};

describe('断片収集', () => {
  it('read 選択で fragments に断片IDが追加される', () => {
    const updates: Array<Record<string, unknown>> = [];
    const updateMeta = (updater: (m: ReturnType<typeof createMetaState>) => Record<string, unknown>) => {
      updates.push(updater(createMetaState({ echoDepth: 0, fragments: [] })));
    };
    const deps = makeDeps({ updateMeta: updateMeta as GameActionsDeps['updateMeta'] });
    const { result } = renderHook(() => useGameActions(deps));
    act(() => { result.current.handleChoice(0); });
    const fragUpdate = updates.find(u => 'fragments' in u);
    expect(fragUpdate?.fragments).toEqual(['f_lian_1']);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest use-game-actions-fragment`
Expected: FAIL（`fragments` 更新が発生しない）

- [ ] **Step 3: useHandleChoice に断片収集を追加**

`presentation/hooks/use-game-actions.ts` の `useHandleChoice` 内、`updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));` の直後に追加:

```ts
    updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));

    // 残響断片の収集（fl:"frag:<id>"）
    const FRAG_PREFIX = 'frag:';
    if (outcome.fl?.startsWith(FRAG_PREFIX)) {
      const fragId = outcome.fl.slice(FRAG_PREFIX.length);
      updateMeta(m => ({ fragments: m.fragments.includes(fragId) ? m.fragments : [...m.fragments, fragId] }));
    }
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest use-game-actions-fragment`
Expected: PASS

- [ ] **Step 5: 既存 use-game-actions 回帰**

Run: `npx jest use-game`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-actions.ts src/features/labyrinth-echo/__tests__/presentation/hooks/use-game-actions-fragment.test.ts
git commit -m "feat: 迷宮の残響 read 選択での残響断片収集を実装"
```

---

### Task 9: 生還時の echoDepth+1 とセーフティネット断片付与

`handleEscapeOutcome` の `updateMeta` に `echoDepth` のインクリメントとセーフティネット断片の付与を組み込む。深度は **インクリメント後の値**でセーフティネットを評価する。

**Files:**
- Modify: `presentation/hooks/use-game-actions.ts`（`handleEscapeOutcome`）
- Test: `__tests__/presentation/hooks/escape-echo-depth.test.ts`

**Interfaces:**
- Consumes: `incrementEchoDepth`, `selectSafetyNetFragment`（`domain/services/echo-service`）。
- Produces: 生還時 `echoDepth` 更新 + `fragments` へのセーフティネット断片追加。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/escape-echo-depth.test.ts`:

```ts
import { incrementEchoDepth, selectSafetyNetFragment } from '../../../domain/services/echo-service';
import { createMetaState } from '../../../domain/models/meta-state';

/**
 * handleEscapeOutcome の updateMeta が組み立てる echoDepth/fragments の
 * 計算ロジックを純粋関数の組み合わせとして検証する。
 * （副作用結合は Task 11 の手動確認・E2E で担保）
 */
describe('生還時の残響深度更新ロジック', () => {
  it('深度が +1 され、新深度でセーフティネット断片が選ばれる', () => {
    const prev = createMetaState({ echoDepth: 0, fragments: [] });
    const newDepth = incrementEchoDepth(prev.echoDepth);
    const safety = selectSafetyNetFragment(newDepth, prev.fragments);
    expect(newDepth).toBe(1);
    // depth1 未収集の最小 order → f_lian_1(order1,gate0) と f_twins_1(order1,gate1)
    // localeCompare で p_lian が先
    expect(safety?.id).toBe('f_lian_1');
  });

  it('既に収集済みの断片は重複付与されない', () => {
    const prev = createMetaState({ echoDepth: 1, fragments: ['f_lian_1', 'f_twins_1'] });
    const newDepth = incrementEchoDepth(prev.echoDepth);
    const safety = selectSafetyNetFragment(newDepth, prev.fragments);
    const next = safety && !prev.fragments.includes(safety.id)
      ? [...prev.fragments, safety.id] : prev.fragments;
    expect(next).toContain(safety!.id);
    expect(next.filter(id => id === safety!.id)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest escape-echo-depth`
Expected: 初回はモジュール解決済みのため PASS する可能性あり。**このタスクの Red は実コード統合の欠如**なので、Step 3 実装前に `use-game-actions.ts` に `incrementEchoDepth` の import が無いことを確認する（grep）。テストは計算ロジックの正しさを固定する役割。

Run: `grep -n "incrementEchoDepth" src/features/labyrinth-echo/presentation/hooks/use-game-actions.ts`
Expected: マッチなし（未統合）

- [ ] **Step 3: handleEscapeOutcome に統合**

`presentation/hooks/use-game-actions.ts` の import 群に追加:

```ts
import { incrementEchoDepth, selectSafetyNetFragment } from '../../domain/services/echo-service';
```

`handleEscapeOutcome` 内の `updateMeta(m => ({ ... }))` を以下に置き換える（`lastRun` までの既存フィールドは保持し、`echoDepth`/`fragments` を追加）:

```ts
    updateMeta(m => {
      const newDepth = incrementEchoDepth(m.echoDepth);
      const safety = selectSafetyNetFragment(newDepth, m.fragments);
      const fragments = safety && !m.fragments.includes(safety.id)
        ? [...m.fragments, safety.id]
        : m.fragments;
      return {
        escapes: m.escapes + 1,
        kp: m.kp + (state.diff?.rewards.kpOnWin ?? 4) + end.bonusKp,
        bestFloor: Math.max(m.bestFloor, state.floor),
        endings: m.endings.includes(end.id) ? m.endings : [...m.endings, end.id],
        clearedDifficulties: !diffId || m.clearedDifficulties.includes(diffId)
          ? m.clearedDifficulties
          : [...m.clearedDifficulties, diffId],
        lastRun: {
          cause: "escape", floor: state.floor, endingId: end.id,
          hp: drained.hp, mn: drained.mn, inf: drained.inf,
        },
        echoDepth: newDepth,
        fragments,
      };
    });
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest escape-echo-depth`
Expected: PASS

- [ ] **Step 5: 統合確認（import の存在）**

Run: `grep -n "incrementEchoDepth" src/features/labyrinth-echo/presentation/hooks/use-game-actions.ts`
Expected: import 行と handleEscapeOutcome 内の使用がマッチ

- [ ] **Step 6: 既存テスト回帰**

Run: `npx jest use-game`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-actions.ts src/features/labyrinth-echo/__tests__/presentation/hooks/escape-echo-depth.test.ts
git commit -m "feat: 迷宮の残響 生還時の残響深度+1とセーフティネット断片付与"
```

---

### Task 10: 残響書庫画面（ArchiveScreen）

**Files:**
- Create: `components/ArchiveScreen.tsx`
- Test: `__tests__/archive-screen.test.tsx`

**Interfaces:**
- Consumes: `PREDECESSORS`, `predecessorFragments`, `predecessorProgress`, `isPredecessorDiscovered`, `isPredecessorComplete`, `unlockedTruthLayers`, `ECHO_DEPTH_MAX`（echo-service / defs）, `useTextReveal`（既存フック）, `Page`/`BackBtn`/`Section`。
- Produces: `ArchiveScreen({ Particles, meta, setPhase }: ArchiveScreenProps)`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/archive-screen.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ArchiveScreen } from '../components/ArchiveScreen';
import { createMetaState } from '../domain/models/meta-state';

const setup = (overrides = {}) =>
  render(<ArchiveScreen Particles={null} meta={createMetaState(overrides)} setPhase={() => undefined} />);

describe('ArchiveScreen', () => {
  it('未発見の先人は ??? 表示でカード名が隠れる', () => {
    setup({ echoDepth: 0, fragments: [] });
    // 写本師リアンも未発見 → 名前は出ず ??? が複数
    expect(screen.queryByText('写本師リアン')).toBeNull();
    expect(screen.getAllByText('？？？').length).toBeGreaterThan(0);
  });

  it('断片を1つ収集すると先人名が開示される', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    expect(screen.getByText('写本師リアン')).toBeInTheDocument();
  });

  it('収集済み断片をクリックすると本文リーダーが開く', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    // ボタンは "▣ 写本師の最初の頁" のため部分一致（正規表現）で取得
    fireEvent.click(screen.getByText(/写本師の最初の頁/));
    // リーダー側にもタイトルが出るため2箇所以上にマッチ
    expect(screen.getAllByText(/写本師の最初の頁/).length).toBeGreaterThan(1);
  });

  it('進捗テキストが 収集数/総数 を表示する', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    expect(screen.getByText(/1\s*\/\s*19/)).toBeInTheDocument();
  });

  it('真相レイヤーは echoDepth に応じて開示される', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    expect(screen.getByText('残響の正体')).toBeInTheDocument();
    expect(screen.queryByText('迷宮の意図')).toBeNull(); // depthGate3 未満
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest archive-screen`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: ArchiveScreen.tsx を作成**

`components/ArchiveScreen.tsx`:

```tsx
/**
 * 迷宮の残響 - 残響書庫画面
 *
 * 先人カード・断片リーダー・真相レイヤーを表示するコレクション画面。
 */
import { useState, ReactNode } from 'react';
import type { UIPhase } from '../presentation/hooks/use-game-orchestrator';
import type { MetaState } from '../domain/models/meta-state';
import { PREDECESSORS } from '../domain/constants/predecessor-defs';
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';
import type { EchoFragment } from '../domain/models/echo';
import {
  ECHO_DEPTH_MAX, predecessorFragments, predecessorProgress,
  isPredecessorDiscovered, isPredecessorComplete, unlockedTruthLayers,
} from '../domain/services/echo-service';
import { useTextReveal } from '../presentation/hooks/use-text-reveal';
import { Page } from './Page';
import { Section } from './Section';
import { BackBtn } from './GameComponents';

interface ArchiveScreenProps {
  Particles: ReactNode;
  meta: MetaState;
  setPhase: (phase: UIPhase) => void;
}

/** 断片本文リーダー（逐次表示） */
const FragmentReader = ({ fragment, onClose }: { fragment: EchoFragment; onClose: () => void }) => {
  const { revealed } = useTextReveal(fragment.body, false);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,20,0.92)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'pointer' }}>
      <div style={{ maxWidth: 560, background: 'rgba(20,18,32,0.96)', border: '1px solid rgba(196,181,253,0.3)', borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 13, color: '#c4b5fd', letterSpacing: 2, marginBottom: 16, fontFamily: 'var(--sans)' }}>{fragment.title}</div>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{revealed}</p>
        <div style={{ fontSize: 10, color: 'var(--dim)', textAlign: 'center', marginTop: 20, fontFamily: 'var(--sans)' }}>クリックで閉じる</div>
      </div>
    </div>
  );
};

/** 残響書庫画面 */
export const ArchiveScreen = ({ Particles, meta, setPhase }: ArchiveScreenProps) => {
  const [reading, setReading] = useState<EchoFragment | null>(null);
  const collected = meta.fragments;
  const truths = unlockedTruthLayers(meta.echoDepth);

  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: 'fadeUp .5s ease' }}>
        <h2 style={{ fontSize: 20, color: '#c4b5fd', letterSpacing: 3, marginBottom: 12 }}>残響書庫</h2>

        {/* 真相の深度バー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontFamily: 'var(--sans)' }}>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>真相の深度</span>
          <span style={{ letterSpacing: 2, color: '#c4b5fd' }}>
            {Array.from({ length: ECHO_DEPTH_MAX }, (_, i) => (i < meta.echoDepth ? '●' : '○')).join('')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>{meta.echoDepth}/{ECHO_DEPTH_MAX}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 20, fontFamily: 'var(--sans)' }}>
          収集 {collected.length} / {ECHO_FRAGMENTS.length} 断片
        </div>

        {/* 真相レイヤー */}
        {truths.length > 0 && (
          <Section label="迷宮の真相" color="#c4b5fd">
            {truths.map(t => (
              <div key={t.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#c4b5fd', fontFamily: 'var(--sans)', fontWeight: 600 }}>{t.title}</div>
                <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8, marginTop: 4 }}>{t.text}</p>
              </div>
            ))}
          </Section>
        )}

        {/* 先人カード */}
        <Section label="先人たちの残響">
          {PREDECESSORS.map(p => {
            const discovered = isPredecessorDiscovered(p.id, collected);
            const prog = predecessorProgress(p.id, collected);
            const complete = isPredecessorComplete(p.id, collected);
            return (
              <div key={p.id} className="uc" style={{ opacity: discovered ? 1 : 0.4, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: discovered ? 8 : 0 }}>
                  <span style={{ fontSize: 20, filter: discovered ? 'none' : 'grayscale(1)' }}>{discovered ? p.icon : '？'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: discovered ? p.color : '#505070', fontFamily: 'var(--sans)', fontWeight: 600 }}>
                      {discovered ? p.name : '？？？'}{complete && ' ✦'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--sans)' }}>{prog.collected} / {prog.total} 断片</div>
                  </div>
                </div>
                {discovered && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {predecessorFragments(p.id).map(f => {
                      const has = collected.includes(f.id);
                      return (
                        <button key={f.id} disabled={!has} onClick={() => has && setReading(f)}
                          style={{ textAlign: 'left', fontSize: 12, fontFamily: 'var(--sans)', padding: '6px 10px', borderRadius: 6, cursor: has ? 'pointer' : 'default',
                            background: has ? 'rgba(196,181,253,0.08)' : 'rgba(20,20,35,0.3)', border: `1px solid ${has ? 'rgba(196,181,253,0.3)' : 'rgba(40,40,60,0.2)'}`,
                            color: has ? 'var(--text)' : '#505070' }}>
                          {has ? `▣ ${f.title}` : `□ 第${f.floors[0]}層で出会う残響`}
                        </button>
                      );
                    })}
                    {complete && <div style={{ fontSize: 11, color: p.color, lineHeight: 1.8, marginTop: 6, fontFamily: 'var(--sans)' }}>{p.summary}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </Section>

        <BackBtn onClick={() => setPhase('title')} />
      </div>
      {reading && <FragmentReader fragment={reading} onClose={() => setReading(null)} />}
    </Page>
  );
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest archive-screen`
Expected: PASS（全件）

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/components/ArchiveScreen.tsx src/features/labyrinth-echo/__tests__/archive-screen.test.tsx
git commit -m "feat: 迷宮の残響 残響書庫画面（ArchiveScreen）を追加"
```

---

### Task 11: ルーティングと導線（archive フェーズ・タイトルボタン）

`UIPhase` に `'archive'` を追加し、`GameRouter` に分岐を追加、`TitleScreen` に「残響書庫」ボタンとキーボードメニューを追加する。

**Files:**
- Modify: `presentation/hooks/use-game-orchestrator.ts`（`UIPhase`）
- Modify: `presentation/components/GameRouter.tsx`（import + 分岐）
- Modify: `components/TitleScreen.tsx`（menuActions + ボタン）
- Test: `__tests__/presentation/components/game-router-archive.test.tsx`

**Interfaces:**
- Consumes: `ArchiveScreen`（Task 10）。
- Produces: `UIPhase` に `'archive'`、`phase==='archive'` で `ArchiveScreen` を描画、タイトルに導線ボタン。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/components/game-router-archive.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { GameRouter } from '../../../presentation/components/GameRouter';
import type { GameRouterProps } from '../../../presentation/components/GameRouter';
import { createMetaState } from '../../../domain/models/meta-state';
import { FLOOR_META } from '../../../domain/constants/floor-meta';

// 最小限の props を組み立てるヘルパー（archive 表示の確認のみ）
const baseProps = (): GameRouterProps => ({
  phase: 'archive',
  game: {
    player: null, diff: null, event: null, floor: 1, step: 0, ending: null,
    isNewEnding: false, isNewDiffClear: false, usedSecondLife: false, chainNext: null,
    log: [], resTxt: '', resChg: null, drainInfo: null,
  },
  derived: {
    meta: createMetaState({ echoDepth: 1, fragments: ['f_lian_1'] }),
    fx: {} as GameRouterProps['derived']['fx'],
    progressPct: 0, floorMeta: FLOOR_META[1], floorColor: '#60a5fa',
    vignette: {}, lowMental: false,
  },
  ui: {
    showLog: false, audioSettings: { sfxEnabled: false } as GameRouterProps['ui']['audioSettings'],
    lastBought: null, shake: false, overlay: null, revealed: '', done: true, ready: true,
  },
  handlers: {
    startRun: () => undefined, enableAudio: () => undefined, selectDiff: () => undefined,
    enterFloor: () => undefined, handleChoice: () => undefined, proceed: () => undefined,
    doUnlock: () => undefined, toggleAudio: () => undefined, setShowLog: () => undefined,
    setPhase: () => undefined, updateMeta: () => undefined, resetMeta: async () => undefined,
    handleAudioSettingsChange: () => undefined, skip: () => undefined,
  },
  Particles: null,
  eventCount: 196,
});

describe('GameRouter archive フェーズ', () => {
  it('phase=archive で残響書庫を描画する', () => {
    render(<GameRouter {...baseProps()} />);
    expect(screen.getByText('残響書庫')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest game-router-archive`
Expected: FAIL（'archive' 分岐がなく null 描画 / 型エラー）

- [ ] **Step 3: UIPhase に 'archive' を追加**

`presentation/hooks/use-game-orchestrator.ts` の `UIPhase` union に追加（`'records'` の後）:

```ts
  | 'records'
  | 'archive'
  | 'settings'
```

- [ ] **Step 4: GameRouter に分岐を追加**

`presentation/components/GameRouter.tsx` の import（22行目付近）に `ArchiveScreen` を追加:

```ts
import { UnlocksScreen, TitlesScreen, RecordsScreen } from '../../components/CollectionScreens';
import { ArchiveScreen } from '../../components/ArchiveScreen';
```

`records` 分岐の直後に追加:

```ts
  if (phase === "records") {
    return <RecordsScreen Particles={Particles} meta={meta} setPhase={setPhase} />;
  }
  if (phase === "archive") {
    return <ArchiveScreen Particles={Particles} meta={meta} setPhase={setPhase} />;
  }
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest game-router-archive`
Expected: PASS

- [ ] **Step 6: TitleScreen に導線を追加**

`components/TitleScreen.tsx` の `menuActions`（40〜44行目）を変更し、書庫を追加:

```ts
  const menuActions = [
    startRun,
    ...(meta.runs > 0 ? [() => { enableAudio(); setPhase("unlocks"); }, () => setPhase("titles"), () => setPhase("records"), () => setPhase("archive")] : []),
    () => setPhase("settings")
  ];
```

称号・実績ボタンの行（127〜130行目）の `<div>` 内に「残響書庫」ボタンを追加し、設定ボタンの selectedIndex を 4→5 にずらす:

```tsx
        {meta.runs > 0 && <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className={`btn tc ${selectedIndex === 2 ? 'selected' : ''}`} style={{ flex: 1, minWidth: 80 }} onMouseEnter={() => setSelectedIndex(2)} onClick={() => setPhase("titles")}>称号</button>
          <button className={`btn tc ${selectedIndex === 3 ? 'selected' : ''}`} style={{ flex: 1, minWidth: 80 }} onMouseEnter={() => setSelectedIndex(3)} onClick={() => setPhase("records")}>実績</button>
          <button className={`btn tc ${selectedIndex === 4 ? 'selected' : ''}`} style={{ flex: 1, minWidth: 80 }} onMouseEnter={() => setSelectedIndex(4)} onClick={() => setPhase("archive")}>残響書庫</button>
        </div>}
        <button className={`btn tc ${selectedIndex === (meta.runs > 0 ? 5 : 1) ? 'selected' : ''}`} style={{ fontSize: 12, color: "var(--dim)" }} onMouseEnter={() => setSelectedIndex(meta.runs > 0 ? 5 : 1)} onClick={() => setPhase("settings")}>⚙ 設定</button>
```

- [ ] **Step 7: TitleScreen の回帰確認**

Run: `npx jest title-screen`
Expected: PASS（既存テストが壊れていないこと。壊れる場合は selectedIndex 期待値を新レイアウトに合わせて更新）

- [ ] **Step 8: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 9: コミット**

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-orchestrator.ts src/features/labyrinth-echo/presentation/components/GameRouter.tsx src/features/labyrinth-echo/components/TitleScreen.tsx src/features/labyrinth-echo/__tests__/presentation/components/game-router-archive.test.tsx
git commit -m "feat: 迷宮の残響 残響書庫へのルーティングとタイトル導線を追加"
```

---

### Task 12: README 更新と全体 CI 確認

**Files:**
- Modify: `src/features/labyrinth-echo/README.md`
- 確認: 全タスクの統合

**Interfaces:**
- Consumes: 全タスクの成果物。
- Produces: ドキュメント整合 + `npm run ci` グリーン。

- [ ] **Step 1: README にゲームシステムを追記**

`README.md` の「### ゲームシステム」リスト（74行目付近、複数エンディングの後）に追加:

```markdown
- **残響システム（Phase 1）**: 生還ごとに残響深度（echoDepth）が深まり、過去の探索者5名の物語断片19件が解禁される。新画面「残響書庫」で読み解き、真相4レイヤーが段階的に開示される
```

- [ ] **Step 2: 残響系の単体テストを一括実行**

Run: `npx jest echo predecessor truth archive migrate use-game-actions-fragment escape-echo-depth game-router-archive`
Expected: 全 PASS

- [ ] **Step 3: lint**

Run: `npm run lint`
Expected: エラーなし（警告は既存水準内）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 5: フル CI**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build すべて PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/README.md
git commit -m "docs: 迷宮の残響 README に残響システム（Phase 1）を追記"
```

---

## 完了時の受け入れ基準（spec §10 対応）

- [x] `echoDepth`/`fragments` が `MetaState` に追加され、生還で深度が +1（上限6）（Task 1, 9）
- [x] 先人5名・断片19件・真相4レイヤーのデータ＋契約テスト（Task 2, 3, 4）
- [x] `tp:"echo"` イベントが深度/フロア/未収集でゲートされ出現（Task 6, 7）
- [x] read 選択で断片収集（Task 8）
- [x] 生還時のセーフティネットで全断片が必ず収集可能（Task 9 + echo-service 契約）
- [x] 残響書庫で先人カード・断片リーダー・真相レイヤーバーが機能（Task 10, 11）
- [x] 旧セーブが破損せずマイグレーション（Task 1）
- [x] `npm run ci` グリーン（Task 12）

## 申し送り（Phase 2 以降）

- echo イベントの重み・読み解きコスト（現状 mn-3/inf+5）の最終バランス調整は Phase 2。
- 画像アセット（先人ポートレート5枚・書庫背景1枚）は任意。spec §9 のプロンプトで生成後、`images.ts` 経由で `ArchiveScreen` の絵文字アイコンと差し替え可能。
- ログパネルに `frag:` フラグが文字列表示される場合は、`LogPanel` で `frag:` プレフィックスを非表示にする軽微対応を検討（実害なし）。
