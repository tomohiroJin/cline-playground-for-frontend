# 迷宮の残響 第6階層＋真エンディング（最終章・Phase 5）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** echoDepth≥6＋全断片収集で5階クリア時に「第6階層（戦闘なしの物語クライマックス）」を解禁し、最後の決断で真エンディング4種に分岐させ、重厚な締めくくりとクリア後の到達感を出す。

**Architecture:** 5階クリア（脱出）の victory コミット部を `commitVictory(ending,…)` に抽出し、通常脱出（`determineEnding`）と真END（`determineTrueEnding`）で共有。第6階層は新 `finale` フェーズ1本（`finaleStep` で offer→3ビート）で表現し、戦闘なし。`MAX_FLOOR:5`・simulator・バランス契約・難易度/escalation は不変。

**Tech Stack:** React 19 + TypeScript / Jest 30 + SWC + @testing-library/react / 既存 reducer・EndingDef・SET_VICTORY・title/archive/title-screen を再利用。

## Global Constraints

- 言語: コメント/UIテキストは日本語、変数/関数名は英語。`any` 禁止（`unknown`+型ガード）。`var` 禁止・`const` 優先。`null` より `undefined`（既存モデルが `string | null` 等を使う箇所はその慣習に合わせる）。
- マジックナンバーは名前付き定数。定数は `Object.freeze`。名前付きエクスポート。ファイル名 kebab-case。`dangerouslySetInnerHTML` 禁止。リスト key は安定一意値。関数コンポーネントのみ。
- 依存方向: `domain/` は外部依存なし。`finale-service` は同 domain の `echo-service`（`isPredecessorComplete`/`PREDECESSORS`）を参照可。
- 第6階層は**戦闘なし**。`MAX_FLOOR`(=5)・simulator(`run-simulator.ts`)・バランス契約(`balance-contract.test.ts`)・難易度設計値・escalation 係数は**一切変更しない**。
- 新規画像アセットは作らない（既存 `bg5` 再利用＋icon/gradient/CSS。任意フックのキー予約のみ）。
- 解禁条件（verbatim）: `TRUE_ROUTE_DEPTH_GATE = 6`、`isTrueRouteUnlocked(meta)` = `meta.echoDepth >= 6` かつ 全 `PREDECESSORS` が `isPredecessorComplete(p.id, meta.fragments)`。
- 真END昇格（verbatim）: `TRUE_ENDING_PROMOTE_PRESSURE = 5`、`promoted = pressure >= 5 || legacyId === 'lg_first'`。
- 真END4種 id（verbatim）: `te_inheritor` / `te_liberator` / `te_inheritor_true` / `te_liberator_true`。

base dir（以降の相対パスの起点）: `src/features/labyrinth-echo/`

---

### Task 1: finale モデルと第6階層ビート定義

**Files:**
- Create: `domain/models/finale.ts`
- Create: `domain/constants/finale-defs.ts`
- Test: `__tests__/domain/constants/finale-defs.test.ts`

**Interfaces:**
- Produces: `FinaleDecision = 'inherit' | 'sever'`、`FinaleChoice { label, decision? }`、`FinaleBeat { id, title, text, choices }`、`FINALE_BEATS: readonly FinaleBeat[]`（3ビート）。

- [ ] **Step 1: 失敗する契約テストを書く**

`__tests__/domain/constants/finale-defs.test.ts`:

```ts
import { FINALE_BEATS } from '../../../domain/constants/finale-defs';

describe('FINALE_BEATS 契約', () => {
  it('3ビート（集う残響→始まりの探索者→最後の決断）', () => {
    expect(FINALE_BEATS).toHaveLength(3);
    expect(FINALE_BEATS.map(b => b.id)).toEqual(['fin_gather', 'fin_confront', 'fin_decide']);
  });
  it('各ビートは非空のタイトル・本文・選択肢を持つ', () => {
    for (const b of FINALE_BEATS) {
      expect(b.title.length).toBeGreaterThan(0);
      expect(b.text.length).toBeGreaterThan(0);
      expect(b.choices.length).toBeGreaterThan(0);
    }
  });
  it('最終ビートのみ decision を持つ2択（inherit/sever）、他ビートは非分岐', () => {
    const last = FINALE_BEATS[FINALE_BEATS.length - 1];
    expect(last.choices.map(c => c.decision).sort()).toEqual(['inherit', 'sever']);
    for (const b of FINALE_BEATS.slice(0, -1)) {
      for (const c of b.choices) expect(c.decision).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest finale-defs`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: finale.ts（型）を作成**

`domain/models/finale.ts`:

```ts
/** 迷宮の残響 - 第6階層（終章）モデル */

/** 最後の決断 */
export type FinaleDecision = 'inherit' | 'sever';

/** 終章ビートの選択肢（最終ビートのみ decision を持つ） */
export interface FinaleChoice {
  readonly label: string;
  /** 最終ビートの分岐。非分岐ビートは undefined（前進のみ） */
  readonly decision?: FinaleDecision;
}

/** 終章の固定ビート */
export interface FinaleBeat {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly choices: readonly FinaleChoice[];
}
```

- [ ] **Step 4: finale-defs.ts（3ビート）を作成**

`domain/constants/finale-defs.ts`（本文は重厚な日本語で。下記は確定文面）:

```ts
/**
 * 迷宮の残響 - 第6階層（終章）ビート定義
 *
 * 解禁時のみ到達する固定シーケンス。ランダムプールではない。
 * 4層の真相と先人5名の物語を回収し、最後の決断で真エンディングに分岐する。
 */
import type { FinaleBeat } from '../models/finale';

/** 終章ビート一覧（固定順） */
export const FINALE_BEATS: readonly FinaleBeat[] = Object.freeze([
  {
    id: 'fin_gather',
    title: '集う残響',
    text: '第五層を越え、さらに下りた先――そこは底ではなかった。闇の中に、見覚えのある気配が次々と灯る。写本師リアンの筆跡、双子の二つの足音、地図屋ガレンの描いた線、守人エルナの灯火。彼らの残響が、お前を待っていたように集ってくる。残響の正体も、迷宮の意図も、お前という存在の意味も、今ならすべて繋がる。',
    choices: [{ label: '記憶を受け止める' }],
  },
  {
    id: 'fin_confront',
    title: '始まりの探索者',
    text: '最奥に、ひとつの残響が佇んでいた。始まりの探索者。迷宮はかつて、彼の「忘れたくない」という願いから生まれた。死すら記憶の保存に変え、訪れた者を忘れぬ場所。なぜ自分を呼び、なぜ何度も還したのか――問う前から、その答えはお前の中にある。',
    choices: [{ label: '問い返す' }],
  },
  {
    id: 'fin_decide',
    title: '最後の決断',
    text: '始まりの探索者が、願いをお前に差し出す。継ぐのか。断つのか。迷宮の記憶の番人となり、先人たちの物語を抱え続けるのか。それとも願いを終わらせ、囚われた残響のすべてを解き放つのか。――選べるのは、ここまで来たお前だけだ。',
    choices: [
      { label: '願いを継ぐ', decision: 'inherit' },
      { label: '願いを断つ', decision: 'sever' },
    ],
  },
]);
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest finale-defs`
Expected: PASS（全件）

- [ ] **Step 6: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/domain/models/finale.ts src/features/labyrinth-echo/domain/constants/finale-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/finale-defs.test.ts
git commit -m "feat: 迷宮の残響 第6階層の終章ビートを定義"
```

---

### Task 2: 真エンディング定義（4種）

**Files:**
- Create: `domain/constants/true-ending-defs.ts`
- Test: `__tests__/domain/constants/true-ending-defs.test.ts`

**Interfaces:**
- Consumes: `EndingDef`（`domain/models/ending`）。
- Produces: `TRUE_ENDINGS: readonly EndingDef[]`（4種）、`TRUE_ENDING_PROMOTE_PRESSURE = 5`。

- [ ] **Step 1: 失敗する契約テストを書く**

`__tests__/domain/constants/true-ending-defs.test.ts`:

```ts
import { TRUE_ENDINGS, TRUE_ENDING_PROMOTE_PRESSURE } from '../../../domain/constants/true-ending-defs';

describe('TRUE_ENDINGS 契約', () => {
  it('真END4種・id一意・te_ プレフィックス', () => {
    const ids = TRUE_ENDINGS.map(e => e.id);
    expect(ids.sort()).toEqual(['te_inheritor', 'te_inheritor_true', 'te_liberator', 'te_liberator_true']);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('te_')).toBe(true);
  });
  it('cond は常に false（通常の determineEnding スキャンに載らない）', () => {
    const dummy = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] } as never;
    for (const e of TRUE_ENDINGS) expect(e.cond(dummy, [], null)).toBe(false);
  });
  it('名称・説明は非空、bonusKp は正、昇格版は基本版以上の bonusKp', () => {
    for (const e of TRUE_ENDINGS) {
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.description.length).toBeGreaterThan(0);
      expect(e.bonusKp).toBeGreaterThan(0);
    }
    const byId = Object.fromEntries(TRUE_ENDINGS.map(e => [e.id, e]));
    expect(byId['te_inheritor_true'].bonusKp).toBeGreaterThanOrEqual(byId['te_inheritor'].bonusKp);
    expect(byId['te_liberator_true'].bonusKp).toBeGreaterThanOrEqual(byId['te_liberator'].bonusKp);
  });
  it('昇格しきい値は 5', () => {
    expect(TRUE_ENDING_PROMOTE_PRESSURE).toBe(5);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest true-ending-defs`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: true-ending-defs.ts を作成**

既存 `EndingDef` 型（`{ id, name, subtitle, description, cond, color, icon, bonusKp, gradient }`）に合わせる。`cond` は常に false。

`domain/constants/true-ending-defs.ts`:

```ts
/**
 * 迷宮の残響 - 真エンディング定義（第6階層の最後の決断で到達）
 *
 * 通常の determineEnding（player 状態スキャン）には載せず、
 * determineTrueEnding が決断と昇格条件から直接選択する。
 */
import type { EndingDef } from '../models/ending';

/** 残響圧がこの値以上、または起源の継承で到達すると「真・」へ昇格 */
export const TRUE_ENDING_PROMOTE_PRESSURE = 5;

/** 真エンディング一覧（determineTrueEnding が直接選択） */
export const TRUE_ENDINGS: readonly EndingDef[] = Object.freeze([
  {
    id: 'te_inheritor', name: '継承者', subtitle: 'THE INHERITOR',
    description: '願いを継ぎ、迷宮の記憶の番人となった。先人たちの物語は、お前の中で生き続ける。忘れないという約束だけが、ここに残る。',
    cond: () => false, color: '#fbbf24', icon: '🕯', bonusKp: 30,
    gradient: 'linear-gradient(135deg, #3a2e0e, #7c5e16, #fbbf24)',
  },
  {
    id: 'te_liberator', name: '解放者', subtitle: 'THE LIBERATOR',
    description: '願いを断ち、囚われた残響のすべてを解き放った。迷宮は静かに崩れ、先人たちはようやく安らぐ。お前もまた、ひとつの光となって還る。',
    cond: () => false, color: '#7dd3fc', icon: '✶', bonusKp: 30,
    gradient: 'linear-gradient(135deg, #0c2a3a, #155e75, #7dd3fc)',
  },
  {
    id: 'te_inheritor_true', name: '真・継承者', subtitle: 'THE TRUE INHERITOR',
    description: '極限の残響圧を制し、起源の力を継いでなお願いを継いだ。お前は番人を超え、迷宮そのものの意志となる。すべての記憶は、もう二度と失われない。',
    cond: () => false, color: '#fde68a', icon: '☀', bonusKp: 50,
    gradient: 'linear-gradient(135deg, #4a3a0e, #b8860b, #fde68a, #fffbe6)',
  },
  {
    id: 'te_liberator_true', name: '真・解放者', subtitle: 'THE TRUE LIBERATOR',
    description: '極限を越えてなお、願いを断つ道を選んだ。崩れゆく迷宮の中心で、お前は始まりの探索者ごと、すべての残響を祝福して送り出す。後には、澄んだ静寂だけが残る。',
    cond: () => false, color: '#bae6fd', icon: '❅', bonusKp: 50,
    gradient: 'linear-gradient(135deg, #0a2233, #0e7490, #bae6fd, #f0f9ff)',
  },
]);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest true-ending-defs`
Expected: PASS（全件）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/domain/constants/true-ending-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/true-ending-defs.test.ts
git commit -m "feat: 迷宮の残響 真エンディング4種を定義"
```

---

### Task 3: finale-service（解禁・真END判定・到達判定）

**Files:**
- Create: `domain/services/finale-service.ts`
- Test: `__tests__/domain/services/finale-service.test.ts`

**Interfaces:**
- Consumes: `MetaState`、`EndingDef`、`PREDECESSORS`＋`isPredecessorComplete`（`domain/services/echo-service`）、`TRUE_ENDINGS`＋`TRUE_ENDING_PROMOTE_PRESSURE`（Task 2）、`FinaleDecision`（Task 1）。
- Produces:
  - `TRUE_ROUTE_DEPTH_GATE = 6`
  - `isTrueRouteUnlocked(meta: MetaState): boolean`
  - `determineTrueEnding(decision: FinaleDecision, pressure: number, legacyId: string | null): EndingDef`
  - `hasReachedTrueEnding(meta: MetaState): boolean`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/services/finale-service.test.ts`:

```ts
import {
  TRUE_ROUTE_DEPTH_GATE, isTrueRouteUnlocked, determineTrueEnding, hasReachedTrueEnding,
} from '../../../domain/services/finale-service';
import { createMetaState } from '../../../domain/models/meta-state';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const allFrags = ECHO_FRAGMENTS.map(f => f.id);

describe('finale-service', () => {
  it('解禁しきい値は 6', () => {
    expect(TRUE_ROUTE_DEPTH_GATE).toBe(6);
  });

  it('isTrueRouteUnlocked: echoDepth≥6 かつ 全断片収集で true', () => {
    expect(isTrueRouteUnlocked(createMetaState({ echoDepth: 6, fragments: allFrags }))).toBe(true);
  });
  it('isTrueRouteUnlocked: echoDepth不足で false', () => {
    expect(isTrueRouteUnlocked(createMetaState({ echoDepth: 5, fragments: allFrags }))).toBe(false);
  });
  it('isTrueRouteUnlocked: 断片欠落で false', () => {
    expect(isTrueRouteUnlocked(createMetaState({ echoDepth: 6, fragments: allFrags.slice(0, -1) }))).toBe(false);
  });

  it('determineTrueEnding: 継ぐ×非昇格→継承者、断つ×非昇格→解放者', () => {
    expect(determineTrueEnding('inherit', 0, null).id).toBe('te_inheritor');
    expect(determineTrueEnding('sever', 0, null).id).toBe('te_liberator');
  });
  it('determineTrueEnding: 圧≥5 で昇格', () => {
    expect(determineTrueEnding('inherit', 5, null).id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 6, null).id).toBe('te_liberator_true');
  });
  it('determineTrueEnding: 起源の継承(lg_first)で昇格', () => {
    expect(determineTrueEnding('inherit', 0, 'lg_first').id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 0, 'lg_first').id).toBe('te_liberator_true');
  });

  it('hasReachedTrueEnding: endings に te_ を含むとき true', () => {
    expect(hasReachedTrueEnding(createMetaState({ endings: ['standard'] }))).toBe(false);
    expect(hasReachedTrueEnding(createMetaState({ endings: ['standard', 'te_liberator'] }))).toBe(true);
  });
});
```

注: `createMetaState` が受け取れるフィールド（echoDepth/fragments/endings）を確認し、必要なら既存テストの生成法に合わせる。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest finale-service`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: finale-service.ts を作成**

`domain/services/finale-service.ts`:

```ts
/**
 * 迷宮の残響 - FinaleService（終章サービス）
 *
 * 真ルートの解禁判定・真エンディング選択・真相到達判定を提供する純粋関数群。
 */
import type { MetaState } from '../models/meta-state';
import type { EndingDef } from '../models/ending';
import type { FinaleDecision } from '../models/finale';
import { PREDECESSORS } from '../constants/predecessor-defs';
import { isPredecessorComplete } from './echo-service';
import { TRUE_ENDINGS, TRUE_ENDING_PROMOTE_PRESSURE } from '../constants/true-ending-defs';

/** 真ルート解禁に必要な残響深度（truth_4 開示と一致） */
export const TRUE_ROUTE_DEPTH_GATE = 6;

/** 真ルート（第6階層）が解禁されているか */
export const isTrueRouteUnlocked = (meta: MetaState): boolean =>
  meta.echoDepth >= TRUE_ROUTE_DEPTH_GATE &&
  PREDECESSORS.every(p => isPredecessorComplete(p.id, meta.fragments));

/** 終章の id から真エンディングを取得（内部用） */
const byId = (id: string): EndingDef => {
  const found = TRUE_ENDINGS.find(e => e.id === id);
  if (!found) throw new Error(`unknown true ending: ${id}`);
  return found;
};

/** 決断と昇格条件（圧≥しきい値 or 起源の継承）から真エンディングを決定する */
export const determineTrueEnding = (
  decision: FinaleDecision,
  pressure: number,
  legacyId: string | null,
): EndingDef => {
  const promoted = pressure >= TRUE_ENDING_PROMOTE_PRESSURE || legacyId === 'lg_first';
  if (decision === 'inherit') return byId(promoted ? 'te_inheritor_true' : 'te_inheritor');
  return byId(promoted ? 'te_liberator_true' : 'te_liberator');
};

/** いずれかの真エンディングに到達済みか */
export const hasReachedTrueEnding = (meta: MetaState): boolean =>
  meta.endings.some(id => id.startsWith('te_'));
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest finale-service`
Expected: PASS（全件）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/domain/services/finale-service.ts src/features/labyrinth-echo/__tests__/domain/services/finale-service.test.ts
git commit -m "feat: 迷宮の残響 finale-service（真ルート解禁・真END判定）を追加"
```

---

### Task 4: 真エンディング称号（4種）

**Files:**
- Modify: `domain/constants/title-defs.ts`
- Test: `__tests__/domain/constants/title-defs.test.ts`（無ければ作成、有れば追記）

**Interfaces:**
- Consumes: `TitleDef`（`cond: (meta) => boolean`）。
- Produces: `TITLES` に4称号追加（解禁条件＝`meta.endings` に対応 te_id を含む）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/constants/title-defs.test.ts` に追記（既存が無ければ新規）:

```ts
import { TITLES } from '../../../domain/constants/title-defs';
import { createMetaState } from '../../../domain/models/meta-state';

describe('真エンディング称号', () => {
  it('真END称号4種が存在する', () => {
    const ids = TITLES.map(t => t.id);
    for (const id of ['t_te_inheritor', 't_te_liberator', 't_te_inheritor_true', 't_te_liberator_true']) {
      expect(ids).toContain(id);
    }
  });
  it('対応する真END到達で称号が解禁される', () => {
    const t = TITLES.find(x => x.id === 't_te_liberator')!;
    expect(t.cond(createMetaState({ endings: [] }))).toBe(false);
    expect(t.cond(createMetaState({ endings: ['te_liberator'] }))).toBe(true);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest title-defs`
Expected: FAIL

- [ ] **Step 3: TITLES に4称号を追加**

`domain/constants/title-defs.ts` の `TITLES` 配列末尾付近に追加（既存の `{ id, name, icon, color, cond, desc }` 形式に合わせる）:

```ts
  // 真エンディング（第6階層）
  { id: "t_te_inheritor",      name: "継承者",     icon: "🕯", color: "#fbbf24", cond: (m: MetaState) => m.endings.includes("te_inheritor"),      desc: "願いを継ぎ、迷宮の記憶の番人となった" },
  { id: "t_te_liberator",      name: "解放者",     icon: "✶", color: "#7dd3fc", cond: (m: MetaState) => m.endings.includes("te_liberator"),      desc: "願いを断ち、囚われた残響を解き放った" },
  { id: "t_te_inheritor_true", name: "真・継承者", icon: "☀", color: "#fde68a", cond: (m: MetaState) => m.endings.includes("te_inheritor_true"), desc: "極限を制してなお、すべての記憶を継いだ" },
  { id: "t_te_liberator_true", name: "真・解放者", icon: "❅", color: "#bae6fd", cond: (m: MetaState) => m.endings.includes("te_liberator_true"), desc: "極限を越え、すべての残響を祝福して送り出した" },
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest title-defs`
Expected: PASS

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/domain/constants/title-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/title-defs.test.ts
git commit -m "feat: 迷宮の残響 真エンディング称号4種を追加"
```

---

### Task 5: reducer に finale フェーズを追加

**Files:**
- Modify: `presentation/hooks/use-game-orchestrator.ts`
- Test: `__tests__/presentation/hooks/use-game-orchestrator.test.ts`（追記）

**Interfaces:**
- Produces:
  - `UIPhase` に `'finale'` 追加。
  - `GameReducerState` に `finaleStep: number`（0=offer提示、1..3=ビート）。
  - アクション `ENTER_FINALE`（phase='finale', finaleStep=1：offer の「さらに深く」確定後にビート1へ）、`ADVANCE_FINALE`（finaleStep+1）。
  - `OFFER_TRUE_ROUTE`（phase='finale', finaleStep=0：offer 提示）。
  - `createInitialState` に `finaleStep: 0`。

注: offer（さらに深く/脱出）は `finaleStep===0`、ビートは `finaleStep 1..3`（ビート index = finaleStep-1）。脱出は use-game-actions 側で通常 victory を呼ぶ（Task 6）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/use-game-orchestrator.test.ts` に追記:

```ts
describe('finale reducer', () => {
  it('初期 finaleStep は 0', () => {
    expect(createInitialState().finaleStep).toBe(0);
  });
  it('OFFER_TRUE_ROUTE で phase=finale, finaleStep=0', () => {
    const s = gameReducer(createInitialState(), { type: 'OFFER_TRUE_ROUTE' } as never);
    expect(s.phase).toBe('finale');
    expect(s.finaleStep).toBe(0);
  });
  it('ENTER_FINALE で finaleStep=1（最初のビート）', () => {
    const s = gameReducer(createInitialState(), { type: 'ENTER_FINALE' } as never);
    expect(s.phase).toBe('finale');
    expect(s.finaleStep).toBe(1);
  });
  it('ADVANCE_FINALE で finaleStep+1', () => {
    const base = gameReducer(createInitialState(), { type: 'ENTER_FINALE' } as never);
    expect(gameReducer(base, { type: 'ADVANCE_FINALE' } as never).finaleStep).toBe(2);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest use-game-orchestrator -t finale`
Expected: FAIL

- [ ] **Step 3: reducer を更新**

`presentation/hooks/use-game-orchestrator.ts`:

- `UIPhase` union に `| 'finale'` 追加。
- `GameReducerState` に `readonly finaleStep: number;` 追加。
- `GameAction` に追加:
  ```ts
  | { type: 'OFFER_TRUE_ROUTE' }
  | { type: 'ENTER_FINALE' }
  | { type: 'ADVANCE_FINALE' }
  ```
- `createInitialState()` に `finaleStep: 0,` 追加。
- reducer case 追加:
  ```ts
    case 'OFFER_TRUE_ROUTE':
      return { ...state, phase: 'finale', finaleStep: 0 };
    case 'ENTER_FINALE':
      return { ...state, phase: 'finale', finaleStep: 1 };
    case 'ADVANCE_FINALE':
      return { ...state, finaleStep: state.finaleStep + 1 };
  ```

注: `SET_VICTORY` は既存のまま（真ENDも同じ経路で victory に遷移する）。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest use-game-orchestrator`
Expected: PASS（既存回帰含む）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-orchestrator.ts src/features/labyrinth-echo/__tests__/presentation/hooks/use-game-orchestrator.test.ts
git commit -m "feat: 迷宮の残響 reducer に終章 finale フェーズを追加"
```

---

### Task 6: 脱出分岐と真END commit（use-game-actions）

**Files:**
- Modify: `presentation/hooks/use-game-actions.ts`
- Test: `__tests__/presentation/hooks/finale-flow.test.ts`

**Interfaces:**
- Consumes: `isTrueRouteUnlocked`/`determineTrueEnding`（finale-service）、`FINALE_BEATS`（finale-defs）、既存 `determineEnding`。
- Produces:
  - `handleEscapeOutcome` の victory コミット部を `commitVictory(ending, drained, state, meta, deps)` に抽出（SET_VICTORY＋updateMeta。bonusKp は `ending.bonusKp` を使用）。
  - 脱出時: `isTrueRouteUnlocked(meta)` なら `dispatch({type:'OFFER_TRUE_ROUTE'})`（commit を保留）、そうでなければ従来通り `commitVictory(determineEnding(...))`。
  - 終章ハンドラ（`GameActionsApi` に追加）:
    - `finaleEscape()`: offer の「脱出する」→ `commitVictory(determineEnding(drained,...))`（通常END）。
    - `finaleAdvance()`: offer の「さらに深く」→ `dispatch ENTER_FINALE`。ビート前進→ `dispatch ADVANCE_FINALE`。
    - `finaleDecide(decision)`: 最終ビート→ `commitVictory(determineTrueEnding(decision, state.pressure, state.legacyId))`。

注: `commitVictory` は drained（脱出時のプレイヤー）を必要とする。offer 保留中は drained を state か ref で保持する（既存の drained の供給元を確認し、最小改修で finale 経路に渡す）。真END でも escapes+1・echoDepth+1・endings 記録・clearedDifficulties 更新は通常脱出と同一ロジックを共有する。

- [ ] **Step 1: 失敗するテストを書く（純粋部分の合成仕様）**

`__tests__/presentation/hooks/finale-flow.test.ts`:

```ts
import { determineTrueEnding } from '../../../domain/services/finale-service';
import { determineEnding } from '../../../domain/services/ending-service';

/**
 * 終章の victory コミットが「決断×昇格条件」で正しい真ENDを選ぶことを固定する。
 * （commitVictory の実配線は Step 3、回帰は use-game で担保）
 */
describe('終章 victory の真END選択', () => {
  it('継ぐ×圧6 → 真・継承者、断つ×継承なし圧0 → 解放者', () => {
    expect(determineTrueEnding('inherit', 6, null).id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 0, null).id).toBe('te_liberator');
  });
  it('通常 determineEnding は真END id を返さない（経路分離）', () => {
    const p = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] } as never;
    expect(determineEnding(p, [], { id: 'normal' }).id.startsWith('te_')).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗しない（合成仕様）ことを確認**

Run: `npx jest finale-flow`
Expected: 純粋合成のため初回 PASS しうる。実配線は Step 3、回帰は Step 5 の use-game で担保（Phase 3/4 の純粋テストと同方針）。

- [ ] **Step 3: use-game-actions を配線**

import 追加:
```ts
import { isTrueRouteUnlocked, determineTrueEnding } from '../../domain/services/finale-service';
import { FINALE_BEATS } from '../../domain/constants/finale-defs';
import type { FinaleDecision } from '../../domain/models/finale';
```

`handleEscapeOutcome`（:91-）を改修:
- victory コミット部（:106-132 の `safeTimeout`→`SET_VICTORY`＋`updateMeta`）を `commitVictory(ending, drained, state, meta, deps)` に抽出。`end`/`isNew`/`isNewDiff` を `ending` 引数から算出（`ending.id`/`ending.bonusKp` を使用）。
- `handleEscapeOutcome` 本体:
  ```ts
  if (isTrueRouteUnlocked(meta)) {
    dispatch({ type: 'OFFER_TRUE_ROUTE' });   // commit を保留し offer を提示
    return;
  }
  commitVictory(determineEnding(drained, [...state.log], state.diff), drained, state, meta, deps);
  ```

`GameActionsApi`（型）に追加し、`useGameActions` 戻り値で公開:
```ts
readonly finaleEscape: () => void;
readonly finaleAdvance: () => void;
readonly finaleDecide: (decision: FinaleDecision) => void;
```
実装:
- `finaleEscape`: 保持中の drained で `commitVictory(determineEnding(drained, [...state.log], state.diff), ...)`。
- `finaleAdvance`: `state.finaleStep === 0` なら `dispatch ENTER_FINALE`、それ以外は `dispatch ADVANCE_FINALE`。
- `finaleDecide(decision)`: `commitVictory(determineTrueEnding(decision, state.pressure, state.legacyId), drained, state, meta, deps)`。

注: drained（脱出時プレイヤー）の保持方法は既存実装に合わせる（state に格納されていればそれを使用、無ければ ref）。`commitVictory` の updateMeta は通常脱出と完全同一（escapes/echoDepth/fragments セーフティネット/kp/endings/clearedDifficulties/lastRun/maxPressureCleared）。kp の `end.bonusKp` は `ending.bonusKp` に置換するのみ。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest finale-flow`
Expected: PASS

- [ ] **Step 5: 回帰・型チェック**

Run: `npx jest use-game && npm run typecheck`
Expected: PASS（未解禁の通常脱出は従来通り。commitVictory 抽出で挙動不変）

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-actions.ts src/features/labyrinth-echo/__tests__/presentation/hooks/finale-flow.test.ts
git commit -m "feat: 迷宮の残響 脱出分岐と真ENDコミットを配線"
```

---

### Task 7: FinaleScreen（offer＋ビート描画）

**Files:**
- Create: `presentation/components/screens/FinaleScreen.tsx`
- Test: `__tests__/finale-screen.test.tsx`

**Interfaces:**
- Consumes: `FINALE_BEATS`（finale-defs）、`FinaleDecision`（finale model）。
- Props: `{ Particles, finaleStep, onEscape, onAdvance, onDecide }`。
  - `finaleStep===0`: offer 提示（「さらに深く潜る」→`onAdvance()`／「ここで脱出する」→`onEscape()`）。
  - `finaleStep 1..3`: `FINALE_BEATS[finaleStep-1]` を描画。非分岐ビートは選択肢→`onAdvance()`、最終ビートは decision 付き選択肢→`onDecide(decision)`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/finale-screen.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FinaleScreen } from '../presentation/components/screens/FinaleScreen';

const baseProps = (over = {}) => ({
  Particles: null, finaleStep: 0,
  onEscape: jest.fn(), onAdvance: jest.fn(), onDecide: jest.fn(),
  ...over,
});

describe('FinaleScreen', () => {
  it('finaleStep=0 は offer（さらに深く／脱出）を提示する', () => {
    const p = baseProps();
    render(<FinaleScreen {...p} />);
    fireEvent.click(screen.getByText(/さらに深く/));
    expect(p.onAdvance).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/脱出/));
    expect(p.onEscape).toHaveBeenCalled();
  });
  it('finaleStep=1 は最初のビート「集う残響」を描画し、前進で onAdvance', () => {
    const p = baseProps({ finaleStep: 1 });
    render(<FinaleScreen {...p} />);
    expect(screen.getByText('集う残響')).toBeInTheDocument();
    fireEvent.click(screen.getByText('記憶を受け止める'));
    expect(p.onAdvance).toHaveBeenCalled();
  });
  it('finaleStep=3 の最終ビートは decision を onDecide に渡す', () => {
    const p = baseProps({ finaleStep: 3 });
    render(<FinaleScreen {...p} />);
    fireEvent.click(screen.getByText('願いを継ぐ'));
    expect(p.onDecide).toHaveBeenCalledWith('inherit');
    fireEvent.click(screen.getByText('願いを断つ'));
    expect(p.onDecide).toHaveBeenCalledWith('sever');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest finale-screen`
Expected: FAIL（未実装）

- [ ] **Step 3: FinaleScreen を実装**

`presentation/components/screens/FinaleScreen.tsx`（既存 `Page`/`EventScreen` の様式に倣う。背景は重厚なトーン。画像非依存）:

```tsx
/**
 * 迷宮の残響 - 第6階層（終章）画面
 * finaleStep 0 は offer（さらに深く/脱出）、1..3 は FINALE_BEATS を描画する。
 */
import type { ReactNode } from 'react';
import { FINALE_BEATS } from '../../../domain/constants/finale-defs';
import type { FinaleDecision } from '../../../domain/models/finale';
import { Page } from '../../../components/Page';

interface FinaleScreenProps {
  Particles: ReactNode;
  finaleStep: number;
  onEscape: () => void;
  onAdvance: () => void;
  onDecide: (decision: FinaleDecision) => void;
}

export const FinaleScreen = ({ Particles, finaleStep, onEscape, onAdvance, onDecide }: FinaleScreenProps) => {
  // offer: さらに深く潜る / ここで脱出する
  if (finaleStep === 0) {
    return (
      <Page particles={Particles}>
        <div className="card" style={{ marginTop: "6vh", animation: "fadeUp .6s ease", textAlign: "center" }}>
          <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 4, marginBottom: 10 }}>さらなる深淵</h2>
          <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.9, fontFamily: "var(--sans)", marginBottom: 20 }}>
            脱出口の先に、まだ下りていく階段が見える。迷宮の最も深い場所が、お前を呼んでいる。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-p tc" onClick={onAdvance} aria-label="さらに深く潜る">さらに深く潜る</button>
            <button className="btn tc" onClick={onEscape} aria-label="ここで脱出する">ここで脱出する</button>
          </div>
        </div>
      </Page>
    );
  }

  const beat = FINALE_BEATS[finaleStep - 1];
  if (!beat) return null;

  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: "5vh", animation: "fadeUp .6s ease" }}>
        <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 4, textAlign: "center", marginBottom: 14 }}>{beat.title}</h2>
        <p style={{ fontSize: 13, color: "#d8d8e8", lineHeight: 2.0, fontFamily: "var(--sans)", marginBottom: 22 }}>{beat.text}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {beat.choices.map((c, i) => (
            <button key={`${beat.id}_${i}`} className="btn btn-p tc"
              onClick={() => (c.decision ? onDecide(c.decision) : onAdvance())}
              aria-label={c.label}>{c.label}</button>
          ))}
        </div>
      </div>
    </Page>
  );
};
```

注: `Page` の import パスと props は既存画面（例 `DiffSelectScreen`）に合わせること。`btn`/`btn-p`/`tc` クラスは既存ボタン様式。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest finale-screen`
Expected: PASS

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/presentation/components/screens/FinaleScreen.tsx src/features/labyrinth-echo/__tests__/finale-screen.test.tsx
git commit -m "feat: 迷宮の残響 第6階層 FinaleScreen を追加"
```

---

### Task 8: GameRouter / LabyrinthEchoGame 配線

**Files:**
- Modify: `presentation/components/GameRouter.tsx`
- Modify: `presentation/LabyrinthEchoGame.tsx`
- Test: `__tests__/presentation/components/game-router-finale.test.tsx`

**Interfaces:**
- Consumes: `FinaleScreen`（Task 7）、Task 6 の `finaleEscape`/`finaleAdvance`/`finaleDecide`、reducer の `finaleStep`。
- Produces: `phase==='finale'` で FinaleScreen を描画し、ハンドラを配線。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/components/game-router-finale.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { GameRouter } from '../../../presentation/components/GameRouter';

// 既存 game-router テストの最小 props 生成法に倣う（game/derived/ui/handlers）。
// phase='finale', finaleStep=1 のとき FinaleScreen（集う残響）が描画されることを確認する。
it('phase=finale, finaleStep=1 で終章ビートが描画される', () => {
  // ... 既存テストのヘルパで game.phase='finale', game.finaleStep=1 を与えて render
  // expect(screen.getByText('集う残響')).toBeInTheDocument();
});
```

注: 既存 `game-router.test.tsx` の props 構築ヘルパを参照し、`game.phase='finale'`/`game.finaleStep` と finale ハンドラを渡す形に合わせて具体化する。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest game-router-finale`
Expected: FAIL

- [ ] **Step 3: GameRouter / LabyrinthEchoGame を配線**

`GameRouter.tsx`:
- `phase === 'finale'` の分岐を追加:
  ```tsx
  if (phase === "finale") {
    return <FinaleScreen Particles={Particles} finaleStep={game.finaleStep}
      onEscape={handlers.finaleEscape} onAdvance={handlers.finaleAdvance} onDecide={handlers.finaleDecide} />;
  }
  ```
- `GameState`（GameRouter の型）に `finaleStep: number` を追加。`GameHandlers` に `finaleEscape`/`finaleAdvance`/`finaleDecide` を追加。

`LabyrinthEchoGame.tsx`:
- `useGameActions` から `finaleEscape`/`finaleAdvance`/`finaleDecide` を取得し、`game`（GameRouter へ渡す state）に `finaleStep: state.finaleStep` を含め、`handlers` に finale ハンドラを渡す。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest game-router-finale game-router`
Expected: PASS（既存 game-router 回帰含む）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/presentation/components/GameRouter.tsx src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx src/features/labyrinth-echo/__tests__/presentation/components/game-router-finale.test.tsx
git commit -m "feat: 迷宮の残響 終章フェーズを GameRouter に配線"
```

---

### Task 9: 書庫の真相到達・タイトル踏破微光・画像フォールバック

**Files:**
- Modify: `components/ArchiveScreen.tsx`
- Modify: `components/TitleScreen.tsx`
- Modify: `images.ts`
- Test: `__tests__/archive-screen.test.tsx`（追記）

**Interfaces:**
- Consumes: `hasReachedTrueEnding`（finale-service）。
- Produces: 書庫の「真相到達 ✦」表示、タイトルの踏破微光、`images.ts` の floor 6 背景フォールバック。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/archive-screen.test.tsx` に追記:

```tsx
it('真エンディング到達済みのとき書庫に「真相到達」が表示される', () => {
  render(<ArchiveScreen Particles={null} meta={createMetaState({ echoDepth: 6, endings: ['te_liberator'] })} setPhase={() => undefined} />);
  expect(screen.getByText(/真相到達/)).toBeInTheDocument();
});
it('真エンディング未到達では「真相到達」を表示しない', () => {
  render(<ArchiveScreen Particles={null} meta={createMetaState({ echoDepth: 6, endings: [] })} setPhase={() => undefined} />);
  expect(screen.queryByText(/真相到達/)).toBeNull();
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest archive-screen -t 真相到達`
Expected: FAIL

- [ ] **Step 3: ArchiveScreen に真相到達表示を追加**

`components/ArchiveScreen.tsx`:
- import: `import { hasReachedTrueEnding } from '../domain/services/finale-service';`
- 真相レイヤー表示（truth_4 付近）の後に、`hasReachedTrueEnding(meta)` のとき表示:
  ```tsx
  {hasReachedTrueEnding(meta) && (
    <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, textAlign: "center",
      background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.4)", fontFamily: "var(--sans)" }}>
      <div style={{ fontSize: 12, color: "#fde68a", letterSpacing: 2 }}>真相到達 ✦</div>
      <div style={{ fontSize: 10, color: "#a0a0b8", marginTop: 4 }}>迷宮の最奥で、最後の決断を下した者の証。</div>
    </div>
  )}
  ```

- [ ] **Step 4: TitleScreen に踏破微光を追加**

`components/TitleScreen.tsx`:
- `hasReachedTrueEnding(meta)` のとき、タイトルに軽量な発光レイヤー（CSS/粒子のみ・画像不要）を重ねる。既存のタイトル描画構造に合わせ、`prefers-reduced-motion` を尊重（既存アニメ方針に倣う）。最小限の装飾とする。

- [ ] **Step 5: images.ts に floor 6 背景フォールバックを追加**

`images.ts`:
- `LE_BG_IMAGES` の getter 利用箇所（フロア背景取得）が floor 6 で `bg5` にフォールバックするよう、`LE_BG_IMAGES[6] ??` のフォールバックを取得関数に追加するか、`LE_BG_IMAGES[6] = LE_BG_IMAGES[5]` 相当の明示エントリを置く（`le_bg_6_*` を後で import すれば差し替え可能なコメントを残す）。真END画像 `le_ending_te_*` は任意フックのため、`LE_IMAGES.endings` に該当キーが無い場合は呼び出し側が icon/gradient フォールバックする旨をコメントで明記。

注: 既存の背景取得経路（`LE_BG_IMAGES[floor]` を引く箇所）を確認し、`floor` が 6 のとき undefined にならないようにする。

- [ ] **Step 6: テストが通ることを確認**

Run: `npx jest archive-screen`
Expected: PASS

- [ ] **Step 7: 型チェック＋コミット**

Run: `npm run typecheck`

```bash
git add src/features/labyrinth-echo/components/ArchiveScreen.tsx src/features/labyrinth-echo/components/TitleScreen.tsx src/features/labyrinth-echo/images.ts src/features/labyrinth-echo/__tests__/archive-screen.test.tsx
git commit -m "feat: 迷宮の残響 書庫の真相到達・タイトル踏破演出・背景フォールバックを追加"
```

---

### Task 10: README 更新と全体 CI 確認

**Files:**
- Modify: `src/features/labyrinth-echo/README.md`

- [ ] **Step 1: README に第6階層・真エンディングを追記**

`README.md` の「### ゲームシステム」リスト（残響継承の後）に追加:

```markdown
- **第6階層・真エンディング（Phase 5）**: echoDepth≥6＋全先人の断片収集で、5階クリア時に「さらに深く」分岐が出現。戦闘なしの物語クライマックス（集う残響→始まりの探索者→最後の決断）を経て、決断（願いを継ぐ／断つ）×高ステーク（残響圧≥5 または起源の継承）で真エンディング4種に分岐。称号・書庫の真相到達印・タイトル踏破演出でクリア後の到達感を得る。戦闘・simulator・バランス契約は不変
```

- [ ] **Step 2: 関連テストを一括実行**

Run: `npx jest finale true-ending title-defs use-game archive game-router balance-contract run-simulator`
Expected: 全 PASS（balance-contract / run-simulator は不変＝回帰なし）

- [ ] **Step 3: lint / typecheck**

Run: `npm run lint && npm run typecheck`
Expected: エラーなし

- [ ] **Step 4: フル CI**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build すべて PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/README.md
git commit -m "docs: 迷宮の残響 README に第6階層・真エンディング（Phase 5）を追記"
```

---

## 完了時の受け入れ基準（spec §11 対応）

- [x] echoDepth≥6＋全断片収集で5階クリア時に「さらに深く」分岐（Task 3, 6, 7）
- [x] 第6階層3ビート進行＋最終決断で真END分岐（戦闘なし）（Task 1, 7, 8）
- [x] 真END4種が決断×（圧≥5 or 起源）で決まり SET_VICTORY 経由で記録（Task 2, 3, 6）
- [x] 真END称号・書庫の真相到達印・タイトル踏破演出（Task 4, 9）
- [x] 未解禁で従来の脱出→victory が完全一致（回帰）。simulator・バランス契約は不変（Task 6, 10）
- [x] 画像なしで成立・任意フック（Task 9）
- [x] `npm run ci` グリーン（Task 10）

## 申し送り

- 任意画像（`le_bg_6_*`／`le_floor_6`／`le_ending_te_*`／終章シーン絵）は後から `assets/images/` に置き、import＋マップ追記で無改修差し込み可能。
- ロードマップ（labyrinth-echo-narrative-roadmap）はこれで全フェーズ完了。
