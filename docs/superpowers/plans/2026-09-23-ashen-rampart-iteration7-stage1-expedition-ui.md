# 灰燼の城壁 反復7 段階1 — 遠征 UI 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 暫定ステージのまま、構築 → ブリーフィング → [ステージ → 獲得3択]×2 → ステージ3 → 遠征の決着 を画面から遊べるようにし、判定用ログ（スキーマ v6）が遠征単位で揃う状態にする。

**Architecture:** 既存の単発ラン画面（`RunView` + `useAshenRampartGame`）を「1ステージの戦闘」（`StageView`）に縮め、その上に遠征の状態を組み立てる `useExpedition` フックと画面3部品（`ExpeditionBar` / `OfferChoice` / `ExpeditionSummary`）を載せる。遠征のドメインとユースケース（`startExpedition` / `startStage` / `advanceStage` / `chooseAcquisition`）は反復6 で揃っており、**本計画では変更しない**。

**Tech Stack:** React 19 + TypeScript + styled-components / Jest 30 + @testing-library/react / Playwright

**Spec:** `docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-design.md`（§1.1 / §3 / §7。§3 は `83ec6ba5` で訂正済み）

## Global Constraints

- 作業ディレクトリ: `/workspaces/claym/local/cline-playground-for-frontend`。対象は `src/features/ashen-rampart/`（以下 `F/` と略す）
- ブランチ: `feature/ashen-rampart-iteration7-stage1`（`main` から切る。`main` へ直接コミットしない）
- `any` 禁止（`unknown` + 型ガード）。`dangerouslySetInnerHTML` 禁止。他の `features/*` を import しない
- コメント・テスト名は日本語。コミットは Conventional Commits（`feat(ashen-rampart): …` 等）、本文は日本語、末尾に `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
- `presentation/` から副作用・複数ドメイン操作の組み立ては `application/use-cases/` 経由で呼ぶ。`domain/` の純粋関数（`chooseAcquisition` / `declineOffer` / `currentStage` 等）は直接 import してよい
- ログ: キー `ashen-rampart:play-log-v6`、`SCHEMA_VERSION = 6`、`CURRENT_ITERATION = 7`
- **獲得の辞退ボタンを UI に出さない**（`declineOffer` の契約）。候補0枚のときだけ自動で辞退する
- 単発の戦闘モードは画面から消える（遠征で置き換える）
- 徴発の UI 経路（`LevyChoice` / `chooseLevy` / `levyOptions` / `rejection-text.ts`）は**触らない**（`StageView` にそのまま残す）
- **重いテストをサブエージェントで回さない。** `npm test` / `npm run ci` / `AshenRampartGame.test.tsx` 全体 / `domain/combat` 全体はツールの2分タイムアウトを超える。**実装者は自分のタスクのテストファイルだけを `npx jest <パス>` で回す。** 全体の検証はコントローラが背景で行う（Task 12）
- マジックナンバーは名前付き定数へ。関数は30行・引数3個を目安（超えるならオブジェクト引数）

## Review Focus

1. **獲得候補が0枚の提示**（全獲得札が同名上限）— 画面が獲得フェーズで止まらず、自動で次ステージへ進むこと → Task 5 の `resolveEmptyOffer` テスト
2. **StrictMode の二重実行**— `expedition_started` / `stage_started` / `card_offered` / `expedition_ended` がそれぞれ1回だけ記録されること → Task 5 の StrictMode テスト
3. **ステージをまたいだ `StageView` の状態漏れ**— 前ステージの選択中カード・能力表示・溢れ通知が次ステージへ残らないこと（`key` による再マウント）→ Task 10 の「ステージ2 は手札・盤面が新しい」テスト
4. **敗北で終わった遠征の `reachedTier3`**— 層3 で敗北しても `true`、層2 で敗北なら `false` → Task 5 のテスト
5. **構築画面に戻ったときのシード欄**— 空で始まり、前回のシードは明示操作でしか入らないこと（同一盤面の事故を防ぐ）→ Task 9 のテスト

---

## ファイル構成

| ファイル | 種別 | 責務 |
|---|---|---|
| `F/application/simulation/axis-knockout-sanity.manual.test.ts` | 改名 | 陰性対照を環境変数ゲートへ（CI 常駐をやめる） |
| `F/application/ports/play-log-port.ts` | 変更 | スキーマ v6 のイベント型、`createExpeditionId` |
| `F/infrastructure/play-log/local-storage-play-log.ts` | 変更 | キーと版を v6 へ |
| `F/presentation/run-summary.ts` | 変更 | `manaIncomeTotal` / `lastPlayMana` の集計（判定項目6） |
| `F/presentation/useAshenRampartGame.ts` | 変更 | マップ・初期状態・遠征識別子を受け取る |
| `F/presentation/useExpedition.ts` | 新設 | 遠征状態の組み立てと遠征ログ |
| `F/presentation/StageView.tsx` | 新設（`RunView` から移設） | 1ステージの戦闘画面と決着パネル |
| `F/presentation/ExpeditionBar.tsx` | 新設 | 層・ステージ名・獲得枚数 |
| `F/presentation/OfferChoice.tsx` | 新設 | 獲得3択 |
| `F/presentation/ExpeditionSummary.tsx` | 新設 | 遠征の決着・振り返り・コピー・再挑戦 |
| `F/presentation/copy-log.ts` | 新設（`AshenRampartGame.tsx` から移設） | クリップボードへのコピー |
| `F/presentation/briefing-seen.ts` | 新設（`AshenRampartGame.tsx` から移設） | ブリーフィング既読フラグ |
| `F/presentation/ExpeditionView.tsx` | 新設 | 遠征の画面遷移（ブリーフィング／ステージ／獲得／決着） |
| `F/presentation/AshenRampartGame.tsx` | 変更 | 構築 ⇄ 遠征 の2画面へ |
| `F/presentation/DeckCardRow.tsx` | 新設（`DeckBuilder.tsx` から分割） | 構築画面の1行 |
| `F/presentation/SeedField.tsx` | 新設（`DeckBuilder.tsx` から分割） | シード欄と前回のシード |
| `F/presentation/DeckBuilder.tsx` | 変更 | 200行未満へ |
| `e2e/ashen-rampart/expedition-flow.spec.ts` | 新設 | 遠征の E2E と 360px 計測 |

---

### Task 0: ブランチを切る

- [ ] **Step 1: main を最新にしてブランチを作る**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
git checkout main && git pull --ff-only
git checkout -b feature/ashen-rampart-iteration7-stage1
```

設計書のブランチ `docs/ashen-rampart-iteration7-design` が未マージなら、先に `git merge --no-ff docs/ashen-rampart-iteration7-design` で取り込む（計画と設計書を同じ PR で見られるようにする）。

---

### Task 1: 陰性対照を CI 常駐から外す（設計書 §1.1）

**Files:**
- Rename: `F/application/simulation/axis-knockout-sanity.test.ts` → `F/application/simulation/axis-knockout-sanity.manual.test.ts`

**Interfaces:**
- Consumes: なし
- Produces: 環境変数 `ASHEN_RAMPART_B0_SANITY=1` で実行する陰性対照

- [ ] **Step 1: 改名する**

```bash
git mv src/features/ashen-rampart/application/simulation/axis-knockout-sanity.test.ts \
       src/features/ashen-rampart/application/simulation/axis-knockout-sanity.manual.test.ts
```

- [ ] **Step 2: 環境変数ゲートを入れる**

ファイル先頭の docstring の直後（import 群の後）に次を足す:

```ts
/**
 * CI には常駐させない（反復7 設計書 §1.1）
 *
 * 約47〜60秒かかり、§8.3 の実行時間予算をほぼ単独で使い切っていた。
 * 反復7 は軸を難度の土台から外したので、この対照を毎回回す理由が無くなった。
 * 道具（ノックアウト）を触ったときだけ次で実行する:
 *   ASHEN_RAMPART_B0_SANITY=1 npx jest axis-knockout-sanity
 */
const isEnabled = process.env.ASHEN_RAMPART_B0_SANITY === '1';
```

`grep -n "^describe(" <ファイル>` で出たトップレベルの `describe(` を**すべて** `(isEnabled ? describe : describe.skip)(` に置き換える（`axis-demand-gate.manual.test.ts:186` と同じ形）。

- [ ] **Step 3: スキップされることを確かめる**

Run: `npx jest axis-knockout-sanity`
Expected: `Tests: N skipped` で数秒以内に終わる（失敗0）

- [ ] **Step 4: コミット**

```bash
git add -A src/features/ashen-rampart/application/simulation/
git commit -m "test(ashen-rampart): 陰性対照を環境変数ゲートへ移し CI 常駐をやめる"
```

---

### Task 2: ログスキーマ v6（設計書 §3.3）

**Files:**
- Modify: `F/application/ports/play-log-port.ts`
- Modify: `F/infrastructure/play-log/local-storage-play-log.ts:13-18`
- Test: `F/infrastructure/play-log/local-storage-play-log.test.ts`（行 28 / 50 / 59 / 73 / 74 / 83 / 94 / 95）
- Test: `F/presentation/AshenRampartGame.test.tsx:227`

**Interfaces:**
- Produces:
  - `CURRENT_ITERATION = 7`
  - `createExpeditionId(): string`
  - `PlayLogEventBody` に `expedition_started` / `stage_started` / `card_offered` / `card_acquired` / `expedition_ended` / `expedition_note` を追加。`run_started` に任意の `expeditionId?: string; stageIndex?: number`、`run_tally` に `manaIncomeTotal: number; lastPlayMana: number`（Task 3 で値を入れる）

- [ ] **Step 1: 失敗するテストに書き換える**

`local-storage-play-log.test.ts` の `version` の期待値 `5` をすべて `6` に、`'ashen-rampart:play-log-v5'` を `'ashen-rampart:play-log-v6'` に置き換える（行 28 / 50 / 59 / 73 / 74 / 83 / 94 / 95）。`AshenRampartGame.test.tsx:227` の `toBe(5)` を `toBe(6)` にする。

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest local-storage-play-log`
Expected: FAIL（`Expected: 6, Received: 5` と キー不一致）

- [ ] **Step 3: キーと版を上げる**

`local-storage-play-log.ts` の 13〜18 行を次に置き換える:

```ts
// スキーマ v6（反復7。v5 のデータと混ざらないようキーを変更している）。
// キーが別なので古いデータを読みに行かず、判定前に旧ログを消す作業も要らない。
export const PLAY_LOG_STORAGE_KEY = 'ashen-rampart:play-log-v6';

const SCHEMA_VERSION = 6;
```

- [ ] **Step 4: イベント型を足す**

`play-log-port.ts`:

1. 先頭 docstring の `（スキーマ v5）` を `（スキーマ v6）` に、`CURRENT_ITERATION = 6` を `CURRENT_ITERATION = 7` にする
2. `run_started` の型を次に置き換える:

```ts
  | {
      kind: 'run_started';
      runId: string;
      iteration: number;
      seed: number;
      /** 使用したデッキのカードID列（反復4の判定項目1「使われなかったカード種」の分母） */
      deckCards: string[];
      /**
       * 遠征のどのステージのランか（反復7）
       *
       * ステージ内のイベント（`card_played` 等）は `runId` しか持たない。
       * `runId → (expeditionId, stageIndex)` をここで1回だけ結ぶことで、
       * 全イベントへ識別子を付けずにステージ単位の集計（反復7の判定項目3・4）ができる。
       */
      expeditionId?: string;
      stageIndex?: number;
    }
```

3. `run_tally` の `drawPileExhaustedTick: number;` の直後に足す:

```ts
      /**
       * 反復7の判定項目6: そのステージのマナ収入の合計（初期マナ＋魔力炉の産出）
       *
       * 反復6 §7.2: 魔力炉が最大3枚に減りステージも短いので、残マナの絶対値は比べられない。
       * 「最後の1手の残マナ ÷ 総マナ収入」の分母。
       */
      manaIncomeTotal: number;
      /** 反復7の判定項目6: 最後に札を出した直後のマナ。0 なら一度も出していないか使い切った */
      lastPlayMana: number;
```

4. `run_tally` の型の直前（`| {` の前）に遠征イベントを足す:

```ts
  /** 遠征の開始（反復7）。`stageIds` は抽選済みの3ステージ */
  | {
      kind: 'expedition_started';
      expeditionId: string;
      iteration: number;
      seed: number;
      stageIds: string[];
      initialDeckCards: string[];
    }
  /** ステージの開始（反復7の判定項目3・4）。`life` はそのステージ開始時の持ち越しライフ */
  | {
      kind: 'stage_started';
      expeditionId: string;
      stageIndex: number;
      stageId: string;
      tier: number;
      life: number;
      deckCards: string[];
    }
  /** 獲得の提示（反復7の判定項目1）。`offerIndex` は遠征内で0始まり */
  | { kind: 'card_offered'; expeditionId: string; offerIndex: number; offered: string[] }
  /**
   * 獲得の選択（反復7）
   *
   * 選ばなかった札を `offered` に残す。選択の情報量は「何を捨てたか」の側にあり、
   * 主観（反復7の判定項目8）の回答を検算する材料になる。
   */
  | {
      kind: 'card_acquired';
      expeditionId: string;
      offerIndex: number;
      cardId: string;
      offered: string[];
    }
  /**
   * 遠征の決着（反復7の判定項目7）
   *
   * `reachedTier3` は「層3 のステージに挑んだか」。層3 で敗れても true。
   */
  | {
      kind: 'expedition_ended';
      expeditionId: string;
      outcome: 'cleared' | 'failed';
      stagesCleared: number;
      reachedTier3: boolean;
      acquired: string[];
      life: number;
    }
  /** 遠征の振り返り（反復7の判定項目8・9(a) の材料） */
  | { kind: 'expedition_note'; expeditionId: string; text: string }
```

5. ファイル末尾に足す:

```ts
/** 遠征識別子を生成する（決定性は不要。ドメイン乱数とは無関係） */
export const createExpeditionId = (): string =>
  `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
```

- [ ] **Step 5: 型エラーの箇所を一時的に埋める**

`run_tally` に必須フィールドを足したので `useAshenRampartGame.ts` の `run_tally` 記録が型エラーになる。Task 3 で正しい値を入れるので、ここでは `drawPileExhaustedTick: view.drawPileExhaustedTick,` の直後に次を足しておく:

```ts
      manaIncomeTotal: settled.manaIncomeTotal,
      lastPlayMana: settled.lastPlayMana,
```

（`settled` は `RunTally`。フィールドは Task 3 で足す。**このタスクのコミットは Task 3 と同時に行う**——単独では型が通らないため）

- [ ] **Step 6: テストが通ることを確かめる**

Run: `npx jest local-storage-play-log`
Expected: PASS

- [ ] **Step 7: Task 3 へ進む（コミットは Task 3 の Step 6 でまとめる）**

---

### Task 3: マナ収入の集計（反復7の判定項目6）

**Files:**
- Modify: `F/presentation/run-summary.ts:36-100, 201-255`
- Test: `F/presentation/run-summary.test.ts`

**Interfaces:**
- Consumes: Task 2 の `run_tally.manaIncomeTotal` / `lastPlayMana`
- Produces: `RunTally.manaIncomeTotal: number`（初期値 `MANA_INITIAL`）、`RunTally.lastPlayMana: number`（初期値 0）

- [ ] **Step 1: 失敗するテストを書く**

`run-summary.test.ts` の末尾に足す（import が無ければ `createCombatState, MANA_INITIAL, type CombatState` を `'../domain/combat/combat-state'` から、`PLAINS_MAP` を `'../domain/board/stage-map'` から足す）:

```ts
describe('マナ収入の集計（反復7の判定項目6）', () => {
  const emptyDeck = { hand: [], drawPile: [], graveyard: [] };
  const stateWith = (patch: Partial<CombatState>): CombatState => ({
    ...createCombatState(emptyDeck, []),
    ...patch,
  });

  it('初期値は初期マナで、魔力炉の産出イベントの量を足していく', () => {
    const tick1 = stateWith({ tick: 1, events: [{ kind: 'mana', amount: 1 }] });
    const tick2 = stateWith({
      tick: 2,
      events: [
        { kind: 'mana', amount: 1 },
        { kind: 'mana', amount: 1 },
      ],
    });

    const tally = accumulateTick(accumulateTick(emptyTally(), tick1, PLAINS_MAP), tick2, PLAINS_MAP);

    expect(emptyTally().manaIncomeTotal).toBe(MANA_INITIAL);
    expect(tally.manaIncomeTotal).toBe(MANA_INITIAL + 3);
  });

  it('最後に札を出した tick のマナだけを覚え、出していない tick では上書きしない', () => {
    const played = stateWith({ tick: 5, mana: 3, events: [{ kind: 'played', cardId: 'reactor' }] });
    const idle = stateWith({ tick: 6, mana: 9, events: [] });

    const tally = accumulateTick(accumulateTick(emptyTally(), played, PLAINS_MAP), idle, PLAINS_MAP);

    expect(tally.lastPlayMana).toBe(3);
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/run-summary`
Expected: FAIL（`manaIncomeTotal` が `undefined`）

- [ ] **Step 3: 実装する**

`run-summary.ts`:

1. import に `MANA_INITIAL` を足す（`'../domain/combat/combat-state'`）
2. `RunTally` の `manualDiscards: number;` の直後に足す:

```ts
  /** 反復7の判定項目6: マナ収入の合計（初期マナ＋魔力炉の産出） */
  manaIncomeTotal: number;
  /** 反復7の判定項目6: 最後に札を出した tick のマナ（支払い後） */
  lastPlayMana: number;
```

3. `emptyTally` に `manaIncomeTotal: MANA_INITIAL,` と `lastPlayMana: 0,` を足す
4. `accumulateTick` の `if (state.events.some((e) => e.kind === 'played')) {` ブロックを次に置き換える:

```ts
  if (state.events.some((e) => e.kind === 'played')) {
    next.lastPlayTick = state.tick;
    next.lastPlayMana = state.mana;
  }

  // 反復7の判定項目6 の分母。産出量はイベントの amount を足す
  // （`runReactors` は現状 manaPerTick=1 で amount も 1。将来ずれたら amount 側を直すこと）
  next.manaIncomeTotal += state.events.reduce(
    (sum, e) => (e.kind === 'mana' ? sum + e.amount : sum),
    0
  );
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx jest presentation/run-summary infrastructure/play-log`
Expected: PASS

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck`（約1分）
Expected: エラー0

- [ ] **Step 6: コミット（Task 2 と合わせる）**

```bash
git add src/features/ashen-rampart/application/ports/play-log-port.ts \
        src/features/ashen-rampart/infrastructure/play-log/ \
        src/features/ashen-rampart/presentation/run-summary.ts \
        src/features/ashen-rampart/presentation/run-summary.test.ts \
        src/features/ashen-rampart/presentation/useAshenRampartGame.ts \
        src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx
git commit -m "feat(ashen-rampart): ログスキーマ v6 と遠征イベント・マナ収入の集計を追加する"
```

---

### Task 4: ゲームフックがステージを受け取る

**Files:**
- Modify: `F/presentation/useAshenRampartGame.ts`
- Test: `F/presentation/useAshenRampartGame.stage.test.ts`（新設。既存の1363行のファイルには足さない）

**Interfaces:**
- Consumes: Task 2 の `run_started.expeditionId?` / `stageIndex?`
- Produces:

```ts
export interface UseAshenRampartGameOptions {
  cards: readonly string[];
  seed?: number;
  playLog?: PlayLogPort;
  /** 盤面。省略時は PLAINS_MAP（既存テストの互換） */
  map?: StageMap;
  /** ステージの初期状態（持ち越しライフ込み）。省略時は cards と seed から作る */
  initialState?: CombatState;
  /** 遠征のどのステージか。run_started に載せる */
  expeditionId?: string;
  stageIndex?: number;
}
// 戻り値に `map: StageMap` を追加
```

- [ ] **Step 1: 失敗するテストを書く**

`F/presentation/useAshenRampartGame.stage.test.ts`:

```ts
/**
 * ゲームフックが遠征のステージを受け取れること（反復7 段階1）
 */
import { renderHook } from '@testing-library/react';
import { useAshenRampartGame } from './useAshenRampartGame';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

const swiftCards = (): string[] => [...PRESET_DECKS.swift!.cards];

const createRecordingLog = (): PlayLogPort & { records: PlayLogEventBody[] } => {
  const records: PlayLogEventBody[] = [];
  return {
    records,
    record: (event) => {
      records.push(event);
    },
    exportAll: () => ({ version: 6, events: [] }),
  };
};

describe('useAshenRampartGame（ステージ入力）', () => {
  const expedition = startExpedition(swiftCards(), 42, createSeededRandom);
  const stageState = { ...startStage(expedition, createSeededRandom), life: 7 };
  const stageMap = { ...PLAINS_MAP, id: 'stage-test-map' };

  it('初期状態を渡すと、その状態（持ち越しライフ）から始まる', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: expedition.deckCards, seed: 42, initialState: stageState, map: stageMap })
    );

    expect(result.current.state.life).toBe(7);
    expect(result.current.state.deck.hand).toEqual(stageState.deck.hand);
  });

  it('渡したマップを返す（盤面の描画に使う）', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: expedition.deckCards, seed: 42, initialState: stageState, map: stageMap })
    );

    expect(result.current.map).toBe(stageMap);
  });

  it('マップを省略すると PLAINS_MAP になる（既存の呼び出しの互換）', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));

    expect(result.current.map).toBe(PLAINS_MAP);
  });

  it('run_started に遠征識別子とステージ番号が載る', () => {
    const log = createRecordingLog();

    renderHook(() =>
      useAshenRampartGame({
        cards: expedition.deckCards,
        seed: 42,
        initialState: stageState,
        map: stageMap,
        playLog: log,
        expeditionId: 'exp-test',
        stageIndex: 1,
      })
    );

    const started = log.records.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ seed: 42, expeditionId: 'exp-test', stageIndex: 1 });
  });

  it('遠征識別子を渡さなければ run_started に載らない（単発ランの互換）', () => {
    const log = createRecordingLog();

    renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log }));

    const started = log.records.find((e) => e.kind === 'run_started');
    expect(started).not.toHaveProperty('expeditionId');
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest useAshenRampartGame.stage`
Expected: FAIL（`life` が 12、`map` が `undefined`）

- [ ] **Step 3: 実装する**

`useAshenRampartGame.ts`:

1. import に `import type { StageMap } from '../domain/board/stage-map';` を足す（`PLAINS_MAP` の import は残す）
2. `UseAshenRampartGameOptions` を上の Interfaces の形に置き換える
3. 関数の先頭を次に置き換える:

```ts
export const useAshenRampartGame = ({
  cards,
  seed,
  playLog,
  map = PLAINS_MAP,
  initialState,
  expeditionId,
  stageIndex,
}: UseAshenRampartGameOptions) => {
  const logRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [runId, setRunId] = useState(() => createRunId());
  const [runSeed, setRunSeed] = useState<number>(() => seed ?? createSeed());
  // 遠征ではステージの初期状態（持ち越しライフ・獲得札の挿入済み山札）を外から受け取る。
  // 省略時は従来どおり cards と seed から単発ランを作る
  const [state, setState] = useState<CombatState>(
    () => initialState ?? startRunWithDeck(cards, new SeededRandom(runSeed))
  );
```

（`runSeed` の直前にあった既存コメント2行は `runSeed` の行の上へ残す）

4. `run_started` の `record` を次に置き換える:

```ts
    logRef.current.record({
      kind: 'run_started',
      runId,
      iteration: CURRENT_ITERATION,
      seed: runSeed,
      deckCards: [...cards],
      ...(expeditionId !== undefined ? { expeditionId, stageIndex } : {}),
    });
  }, [runId, runSeed, cards, expeditionId, stageIndex]);
```

5. ファイル内の `PLAINS_MAP` の使用4箇所（`stepTick` / `advanceEffects` / `accumulateTick` / `computePlaceableCells`）を `map` に置き換え、各 `useEffect` の依存配列に `map` を足す:
   - ゲームループ: `[isPaused, state.outcome, map]`
   - エフェクト: `[state, prefersReducedMotion, map]`
   - 集計: `[state, map]`
6. 戻り値のオブジェクトに `map,` を足す

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx jest useAshenRampartGame.stage`
Expected: PASS

- [ ] **Step 5: 既存のフックテストが壊れていないことを確かめる**

Run: `npx jest presentation/useAshenRampartGame.test`（約1分）
Expected: PASS。**2分を超えそうならコントローラに依頼する**

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/useAshenRampartGame.ts \
        src/features/ashen-rampart/presentation/useAshenRampartGame.stage.test.ts
git commit -m "feat(ashen-rampart): ゲームフックがステージのマップと初期状態を受け取る"
```

---

### Task 5: 遠征フック `useExpedition`

**Files:**
- Create: `F/presentation/useExpedition.ts`
- Test: `F/presentation/useExpedition.test.tsx`（StrictMode の wrapper に JSX を使うため .tsx）

**Interfaces:**
- Consumes: `startExpedition` / `startStage`（`application/use-cases/start-expedition`）、`advanceStage`（`application/use-cases/advance-stage`）、`chooseAcquisition` / `declineOffer` / `currentStage` / `ExpeditionState` / `StageResult`（`domain/expedition/expedition-state`）、Task 2 の遠征イベントと `createExpeditionId`
- Produces:

```ts
export interface UseExpeditionOptions {
  cards: readonly string[];
  seed: number;
  playLog?: PlayLogPort;
}
export const resolveEmptyOffer: (exp: ExpeditionState) => ExpeditionState;
export const useExpedition: (options: UseExpeditionOptions) => {
  expeditionId: string;
  expedition: ExpeditionState;
  /** phase === 'stage' のときだけ定義される。ステージの初期戦闘状態 */
  stageCombat: CombatState | undefined;
  settleStage: (result: StageResult) => void;
  acquire: (cardId: string) => void;
  noteExpedition: (text: string) => void;
  exportLogJson: () => string;
};
```

- [ ] **Step 1: 失敗するテストを書く**

`F/presentation/useExpedition.test.tsx`:

```ts
/**
 * 遠征フック（反復7 段階1）
 *
 * 画面から勝敗を作るのは重いので、ここでは settleStage に勝敗を直接渡して
 * 遷移とログを検証する。実プレイの結線は AshenRampartGame.test.tsx が守る。
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { resolveEmptyOffer, useExpedition } from './useExpedition';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import { presentOffer, completeStage } from '../domain/expedition/expedition-state';
import { startExpedition } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

const swiftCards = (): string[] => [...PRESET_DECKS.swift!.cards];
const SEED = 42;
const WIN = { won: true, lifeLeft: 10 };
const LOSS = { won: false, lifeLeft: 0 };

const createRecordingLog = (): PlayLogPort & { records: PlayLogEventBody[] } => {
  const records: PlayLogEventBody[] = [];
  return {
    records,
    record: (event) => {
      records.push(event);
    },
    exportAll: () => ({ version: 6, events: [] }),
  };
};

const kinds = (log: { records: PlayLogEventBody[] }, kind: PlayLogEventBody['kind']) =>
  log.records.filter((e) => e.kind === kind);

const setup = (strict = false) => {
  const log = createRecordingLog();
  const wrapper = strict
    ? ({ children }: { children: React.ReactNode }) => <React.StrictMode>{children}</React.StrictMode>
    : undefined;
  const hook = renderHook(() => useExpedition({ cards: swiftCards(), seed: SEED, playLog: log }), {
    wrapper,
  });
  return { log, hook };
};

describe('useExpedition', () => {
  it('開始時にステージ1 の戦闘状態があり、expedition_started と stage_started が1回ずつ記録される', () => {
    const { log, hook } = setup();

    expect(hook.result.current.expedition.phase).toBe('stage');
    expect(hook.result.current.stageCombat?.life).toBe(hook.result.current.expedition.life);
    expect(kinds(log, 'expedition_started')).toHaveLength(1);
    expect(kinds(log, 'expedition_started')[0]).toMatchObject({
      seed: SEED,
      stageIds: hook.result.current.expedition.stages.map((s) => s.id),
    });
    expect(kinds(log, 'stage_started')).toEqual([
      expect.objectContaining({ stageIndex: 0, tier: 1, life: 12 }),
    ]);
  });

  it('StrictMode でも遠征の各イベントは1回だけ記録される', () => {
    const { log, hook } = setup(true);
    act(() => hook.result.current.settleStage(WIN));

    expect(kinds(log, 'expedition_started')).toHaveLength(1);
    expect(kinds(log, 'stage_started')).toHaveLength(1);
    expect(kinds(log, 'card_offered')).toHaveLength(1);
  });

  it('ステージに勝つと獲得の3択が出て card_offered が記録され、戦闘状態は無くなる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));

    const { expedition, stageCombat } = hook.result.current;
    expect(expedition.phase).toBe('offer');
    expect(expedition.offer).toHaveLength(3);
    expect(stageCombat).toBeUndefined();
    expect(kinds(log, 'card_offered')).toEqual([
      expect.objectContaining({ offerIndex: 0, offered: [...expedition.offer] }),
    ]);
  });

  it('3択から選ぶと card_acquired に選ばなかった札も残り、次のステージが始まる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    const offered = [...hook.result.current.expedition.offer];

    act(() => hook.result.current.acquire(offered[1]!));

    expect(kinds(log, 'card_acquired')).toEqual([
      expect.objectContaining({ offerIndex: 0, cardId: offered[1], offered }),
    ]);
    expect(hook.result.current.expedition.stageIndex).toBe(1);
    expect(hook.result.current.expedition.deckCards).toHaveLength(13);
    expect(hook.result.current.stageCombat).toBeDefined();
    expect(kinds(log, 'stage_started')[1]).toMatchObject({ stageIndex: 1, tier: 2, life: 12 });
  });

  it('層1 で敗れると遠征が終わり、層3 未到達として expedition_ended が1回記録される', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(LOSS));

    expect(hook.result.current.expedition.phase).toBe('ended');
    expect(kinds(log, 'expedition_ended')).toEqual([
      expect.objectContaining({ outcome: 'failed', stagesCleared: 0, reachedTier3: false }),
    ]);
  });

  it('層3 で敗れても reachedTier3 は true になる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(LOSS));

    expect(kinds(log, 'expedition_ended')).toEqual([
      expect.objectContaining({ outcome: 'failed', stagesCleared: 2, reachedTier3: true }),
    ]);
  });

  it('3ステージとも勝つと踏破になる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(WIN));

    expect(hook.result.current.expedition.outcome).toBe('cleared');
    expect(kinds(log, 'expedition_ended')).toEqual([
      expect.objectContaining({ outcome: 'cleared', stagesCleared: 3, reachedTier3: true }),
    ]);
  });

  it('振り返りは expedition_note として遠征識別子つきで記録される', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.noteExpedition('層2 の鴉で崩れた'));

    expect(kinds(log, 'expedition_note')).toEqual([
      { kind: 'expedition_note', expeditionId: hook.result.current.expeditionId, text: '層2 の鴉で崩れた' },
    ]);
  });
});

describe('resolveEmptyOffer', () => {
  const offerPhase = () =>
    completeStage(startExpedition(swiftCards(), SEED, createSeededRandom), WIN);

  it('候補が0枚の提示は自動で辞退して次のステージへ進める（画面が止まらない）', () => {
    const empty = presentOffer(offerPhase(), []);

    expect(resolveEmptyOffer(empty).phase).toBe('stage');
  });

  it('候補がある提示はそのまま返す（辞退はプレイヤーに見せない）', () => {
    const offered = presentOffer(offerPhase(), ['arrow-tower']);

    expect(resolveEmptyOffer(offered)).toBe(offered);
  });
});
```

注意: 暫定ステージは層ごとに2本あり、どれが引かれるかはシードで決まる。上のテストは `tier` と `stageIndex` しか見ないので、シード42 で何が引かれても成り立つ。`acquire(offered[1]!)` は3択が3枚あることを前提にしている（現行の獲得プールで12枚デッキなら必ず3枚）。

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/useExpedition`
Expected: FAIL（`Cannot find module './useExpedition'`）

- [ ] **Step 3: 実装する**

`F/presentation/useExpedition.ts`:

```ts
/**
 * 灰燼の城壁 - 遠征の組み立て（反復7 段階1・設計書 §3.2）
 *
 * 遠征の状態遷移はドメインとユースケースが持っている（反復6）。ここは
 * それを React の状態に載せ、遠征単位のログ（スキーマ v6）を記録するだけにする。
 *
 * **ログの記録は effect か、イベントハンドラの本体で行う。** 状態更新関数の中で
 * 記録すると StrictMode の二重呼び出しで2件になる（useAshenRampartGame と同じ方針）。
 * 記録済みかどうかは ref の Set で判定する。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CombatState } from '../domain/combat/combat-state';
import {
  chooseAcquisition,
  currentStage,
  declineOffer,
  type ExpeditionState,
  type StageResult,
} from '../domain/expedition/expedition-state';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { advanceStage } from '../application/use-cases/advance-stage';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import { LocalStoragePlayLog } from '../infrastructure/play-log/local-storage-play-log';
import {
  CURRENT_ITERATION,
  createExpeditionId,
  type PlayLogPort,
} from '../application/ports/play-log-port';

const TIER3 = 3;

export interface UseExpeditionOptions {
  cards: readonly string[];
  seed: number;
  playLog?: PlayLogPort;
}

/**
 * 候補0枚の提示を自動で辞退する
 *
 * 全獲得札が同名上限に達すると `buildOffer` は空を返し、遠征は `'offer'` のまま
 * 進めなくなる。辞退ボタンは UI に出さない契約（`declineOffer` の docstring）なので、
 * ここで機械的に辞退する——選べる札が無いのだから、プレイヤーの選択ではない。
 */
export const resolveEmptyOffer = (exp: ExpeditionState): ExpeditionState =>
  exp.phase === 'offer' && exp.offer.length === 0 ? declineOffer(exp) : exp;

/** 敗北した遠征でも、挑んだステージが層3 なら到達とみなす（反復7の判定項目7） */
const reachedTier3 = (exp: ExpeditionState): boolean =>
  exp.outcome === 'cleared' || currentStage(exp)?.tier === TIER3;

/** 勝ち抜いたステージ数。敗北では `stageIndex` が負けたステージを指したまま */
const stagesCleared = (exp: ExpeditionState): number =>
  exp.outcome === 'cleared' ? exp.stages.length : exp.stageIndex;

export const useExpedition = ({ cards, seed, playLog }: UseExpeditionOptions) => {
  const logRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [expeditionId] = useState(() => createExpeditionId());
  const [expedition, setExpedition] = useState<ExpeditionState>(() =>
    startExpedition(cards, seed, createSeededRandom)
  );
  const loggedRef = useRef<Set<string>>(new Set());

  /** key ごとに1回だけ記録する（StrictMode の二重実行対策） */
  const recordOnce = useCallback((key: string, record: () => void) => {
    if (loggedRef.current.has(key)) return;
    loggedRef.current.add(key);
    record();
  }, []);

  useEffect(() => {
    recordOnce('expedition_started', () =>
      logRef.current.record({
        kind: 'expedition_started',
        expeditionId,
        iteration: CURRENT_ITERATION,
        seed: expedition.seed,
        stageIds: expedition.stages.map((s) => s.id),
        initialDeckCards: [...expedition.initialDeckCards],
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  useEffect(() => {
    const stage = currentStage(expedition);
    if (expedition.phase !== 'stage' || !stage) return;
    recordOnce(`stage_started:${expedition.stageIndex}`, () =>
      logRef.current.record({
        kind: 'stage_started',
        expeditionId,
        stageIndex: expedition.stageIndex,
        stageId: stage.id,
        tier: stage.tier,
        life: expedition.life,
        deckCards: [...expedition.deckCards],
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  useEffect(() => {
    if (expedition.phase !== 'offer' || expedition.offer.length === 0) return;
    const offerIndex = expedition.stageIndex - 1;
    recordOnce(`card_offered:${offerIndex}`, () =>
      logRef.current.record({
        kind: 'card_offered',
        expeditionId,
        offerIndex,
        offered: [...expedition.offer],
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  useEffect(() => {
    if (expedition.phase !== 'ended' || expedition.outcome === 'running') return;
    const outcome = expedition.outcome;
    recordOnce('expedition_ended', () =>
      logRef.current.record({
        kind: 'expedition_ended',
        expeditionId,
        outcome,
        stagesCleared: stagesCleared(expedition),
        reachedTier3: reachedTier3(expedition),
        acquired: [...expedition.acquired],
        life: expedition.life,
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  // ステージの初期状態は遠征の状態から決定的に作れる（派生シード）。
  // 'stage' 以外で startStage を呼ぶと契約違反で例外になるため、ここで絞る
  const stageCombat: CombatState | undefined = useMemo(
    () => (expedition.phase === 'stage' ? startStage(expedition, createSeededRandom) : undefined),
    [expedition]
  );

  const settleStage = useCallback((result: StageResult) => {
    setExpedition((current) => resolveEmptyOffer(advanceStage(current, result, createSeededRandom)));
  }, []);

  const acquire = useCallback(
    (cardId: string) => {
      const offerIndex = expedition.stageIndex - 1;
      logRef.current.record({
        kind: 'card_acquired',
        expeditionId,
        offerIndex,
        cardId,
        offered: [...expedition.offer],
      });
      setExpedition((current) => chooseAcquisition(current, cardId));
    },
    [expedition, expeditionId]
  );

  const noteExpedition = useCallback(
    (text: string) => {
      logRef.current.record({ kind: 'expedition_note', expeditionId, text });
    },
    [expeditionId]
  );

  const exportLogJson = useCallback(() => JSON.stringify(logRef.current.exportAll(), null, 2), []);

  return { expeditionId, expedition, stageCombat, settleStage, acquire, noteExpedition, exportLogJson };
};
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx jest presentation/useExpedition`
Expected: PASS（10件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/useExpedition.ts \
        src/features/ashen-rampart/presentation/useExpedition.test.tsx
git commit -m "feat(ashen-rampart): 遠征フック useExpedition と遠征ログを追加する"
```

---

### Task 6: `StageView` — 1ステージの戦闘画面

**Files:**
- Create: `F/presentation/StageView.tsx`（`AshenRampartGame.tsx` の `RunView` と styled 部品を移す）
- Create: `F/presentation/StageView.test.tsx`
- Modify: `F/presentation/AshenRampartGame.tsx`（`RunView` はこのタスクではまだ消さない。Task 10 で消す）

**Interfaces:**
- Consumes: Task 4 の `useAshenRampartGame` の `map` / `initialState` / `expeditionId` / `stageIndex`
- Produces:

```ts
export interface StageViewProps {
  cards: readonly string[];
  seed: number;
  map: StageMap;
  initialState: CombatState;
  expeditionId: string;
  stageIndex: number;
  /** 最終ステージか。決着ボタンの文言を決める */
  isFinalStage: boolean;
  /** 盤面の上に出す遠征の帯（ExpeditionBar） */
  banner?: React.ReactNode;
  onSettled: (result: StageResult) => void;
}
export const StageView: React.FC<StageViewProps>;
export const SETTLE_TO_OFFER_LABEL = '獲得へ進む';
export const SETTLE_TO_SUMMARY_LABEL = '遠征の結果へ';
```

- [ ] **Step 1: 失敗するテストを書く**

`F/presentation/StageView.test.tsx`:

```tsx
/**
 * StageView（反復7 段階1）: 1ステージの戦闘と決着パネル
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StageView, SETTLE_TO_OFFER_LABEL, SETTLE_TO_SUMMARY_LABEL } from './StageView';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import type { CombatState } from '../domain/combat/combat-state';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';

const expedition = startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);
const initial = startStage(expedition, createSeededRandom);

const renderStage = (initialState: CombatState, isFinalStage: boolean) => {
  const onSettled = jest.fn();
  render(
    <StageView
      cards={expedition.deckCards}
      seed={42}
      map={PLAINS_MAP}
      initialState={initialState}
      expeditionId="exp-test"
      stageIndex={0}
      isFinalStage={isFinalStage}
      banner={<p>帯のテスト</p>}
      onSettled={onSettled}
    />
  );
  return onSettled;
};

/** 1 tick 進めれば決着するよう、ライフ0・進行中の状態を作る（stepTick が敗北を確定させる） */
const aboutToLose = (): CombatState => ({ ...initial, life: 0 });

describe('StageView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  it('帯・盤面・手札が出て、決着パネルはまだ出ない', () => {
    renderStage(initial, false);

    expect(screen.getByText('帯のテスト')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '手札' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_SUMMARY_LABEL })).not.toBeInTheDocument();
  });

  it('敗北すると「遠征の結果へ」だけが出て、押すと残ライフつきで onSettled が呼ばれる', () => {
    const onSettled = renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    expect(screen.getByText('城壁は灰燼に帰した')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_OFFER_LABEL })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SETTLE_TO_SUMMARY_LABEL }));
    expect(onSettled).toHaveBeenCalledWith({ won: false, lifeLeft: 0 });
  });

  it('決着パネルには勝敗理由の記録欄・再挑戦・ログコピーを出さない（遠征の結果画面へ移した）', () => {
    renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    expect(screen.queryByLabelText(/勝敗の理由を記録する/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '同じデッキで別のシードに挑む' })).not.toBeInTheDocument();
  });
});
```

注意: 最初に `aboutToLose()` が本当に1 tick で `outcome: 'lost'` になるかは `stepTick` の敗北判定に依存する。**Step 2 で落ちる理由が「`城壁は灰燼に帰した` が見つからない」ではなく「`StageView` が無い」であることを確認すること。** 実装後に1 tick で決着しない場合は、`advanceTimersByTime(TICK_INTERVAL_MS * 2)` に変える前に `domain/combat/step-tick.ts` の `life <= 0` 判定の位置を読み、なぜ決着しないかを報告に書く（テストを通すために待ち時間を伸ばすだけにしない）。

勝利側の文言（`SETTLE_TO_OFFER_LABEL`）は、勝ちを1 tick で作る手段が無いので**ここでは検査しない**。Task 10 の統合テストで、勝った場合にだけ押される経路として通す。

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/StageView`
Expected: FAIL（`Cannot find module './StageView'`）

- [ ] **Step 3: 実装する**

`F/presentation/StageView.tsx` を作る。中身は `AshenRampartGame.tsx` の `RunView`（184〜321行）を次のように変えたもの:

1. `AshenRampartGame.tsx` の styled 部品 `Layout` / `Center` / `BoardWrapper` / `RejectionNotice` / `REJECTION_NOTICE_TONE`（とその docstring）/ `Result` / `ActionButton` を**移す**（`AshenRampartGame.tsx` 側は Task 10 で消す。このタスクでは両方にある状態でよい）
2. Props を上の `StageViewProps` にし、フックを次で呼ぶ:

```tsx
  const game = useAshenRampartGame({ cards, seed, map, initialState, expeditionId, stageIndex });
```

3. `noteText` / `noteSaved` / `copyStatus` / `summaryUnlocked` の state、`handleNoteSubmit`、`handleCopyLog`、`outcome` を見てそれらをリセットする `useEffect` を**削除する**
4. `BoardGrid` の `map={PLAINS_MAP}` を `map={game.map}` にする
5. `<LevyChoice …/>` の直後、`<RunStatusBar …/>` の前に `{banner}` を置く
6. 決着パネル（`{game.state.outcome !== 'playing' && (<Result>…</Result>)}`）を次に置き換える:

```tsx
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <ActionButton
              type="button"
              onClick={() => onSettled({ won: game.state.outcome === 'won', lifeLeft: game.state.life })}
            >
              {game.state.outcome === 'won' && !isFinalStage ? SETTLE_TO_OFFER_LABEL : SETTLE_TO_SUMMARY_LABEL}
            </ActionButton>
          </Result>
        )}
```

7. 定数を export する:

```tsx
/** 決着ボタンの文言。勝って次のステージがあるときだけ獲得へ進む */
export const SETTLE_TO_OFFER_LABEL = '獲得へ進む';
export const SETTLE_TO_SUMMARY_LABEL = '遠征の結果へ';
```

8. 先頭 docstring:

```tsx
/**
 * 灰燼の城壁 - 1ステージの戦闘画面（反復7 段階1・設計書 §3.2）
 *
 * 反復6 までの RunView（単発ラン）を遠征の1ステージに縮めたもの。
 * 勝敗理由の記録・集計・再挑戦・ログのコピーは遠征の結果画面
 * （ExpeditionSummary）へ移した。ステージごとに出すと、遠征の途中で
 * 集計が答えを教えてしまう（反復5 Task 12 の「記録してから集計」と同じ理由）。
 *
 * **ステージが変わるたびに key を変えて再マウントすること**（ExpeditionView）。
 * フックの ref（選択中カード・通知・集計）がステージをまたいで残らないようにする。
 */
```

`RunSummary` / `NoteForm` / `NoteLabel` / `NoteInput` / `Feedback` / `ActionRow` と `copyLogToClipboard` は `StageView` に持ち込まない（Task 8 で `ExpeditionSummary` と `copy-log.ts` へ移す）。

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx jest presentation/StageView`
Expected: PASS（3件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/StageView.tsx \
        src/features/ashen-rampart/presentation/StageView.test.tsx
git commit -m "feat(ashen-rampart): 1ステージの戦闘画面 StageView を追加する"
```

---

### Task 7: `ExpeditionBar` と `OfferChoice`

**Files:**
- Create: `F/presentation/ExpeditionBar.tsx` / `F/presentation/ExpeditionBar.test.tsx`
- Create: `F/presentation/OfferChoice.tsx` / `F/presentation/OfferChoice.test.tsx`

**Interfaces:**
- Consumes: `ExpeditionState` / `currentStage`、`getCardDefinition`、`cardStatsOf`（`./card-text`）、`CardGlyph`
- Produces:

```ts
export const ExpeditionBar: React.FC<{ expedition: ExpeditionState }>;
export const OfferChoice: React.FC<{ offer: readonly string[]; onChoose: (cardId: string) => void }>;
export const offerButtonLabel: (cardId: string) => string; // `${name} を加える`
```

- [ ] **Step 1: 失敗するテストを書く**

`F/presentation/ExpeditionBar.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExpeditionBar } from './ExpeditionBar';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import { chooseAcquisition, completeStage, presentOffer } from '../domain/expedition/expedition-state';
import { startExpedition } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';

const start = () => startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);

describe('ExpeditionBar', () => {
  it('層・ステージ名・獲得枚数を出す', () => {
    const exp = start();
    render(<ExpeditionBar expedition={exp} />);

    const bar = screen.getByRole('status', { name: '遠征の進み具合' });
    expect(bar).toHaveTextContent('層 1 / 3');
    expect(bar).toHaveTextContent(exp.stages[0]!.name);
    expect(bar).toHaveTextContent('獲得 0枚');
  });

  it('獲得した後は次の層と獲得枚数が増える', () => {
    const offered = presentOffer(completeStage(start(), { won: true, lifeLeft: 10 }), ['arrow-tower']);
    const exp = chooseAcquisition(offered, 'arrow-tower');
    render(<ExpeditionBar expedition={exp} />);

    expect(screen.getByRole('status', { name: '遠征の進み具合' })).toHaveTextContent('層 2 / 3');
    expect(screen.getByRole('status', { name: '遠征の進み具合' })).toHaveTextContent('獲得 1枚');
  });
});
```

`F/presentation/OfferChoice.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { OfferChoice, offerButtonLabel } from './OfferChoice';
import { getCardDefinition } from '../domain/cards/card-pool';

const OFFER = ['arrow-tower', 'stone-wall', 'ballista'];

describe('OfferChoice', () => {
  it('提示された札を1枚ずつ、名前とコストつきのボタンで出す', () => {
    render(<OfferChoice offer={OFFER} onChoose={jest.fn()} />);

    OFFER.forEach((id) => {
      const button = screen.getByRole('button', { name: offerButtonLabel(id) });
      expect(button).toHaveTextContent(getCardDefinition(id).name);
      expect(button).toHaveTextContent(`コスト${getCardDefinition(id).cost}`);
    });
  });

  it('押した札の id で onChoose が呼ばれる', () => {
    const onChoose = jest.fn();
    render(<OfferChoice offer={OFFER} onChoose={onChoose} />);

    fireEvent.click(screen.getByRole('button', { name: offerButtonLabel('stone-wall') }));

    expect(onChoose).toHaveBeenCalledWith('stone-wall');
  });

  it('辞退の手段を出さない（declineOffer は UI に出さない契約）', () => {
    render(<OfferChoice offer={OFFER} onChoose={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(OFFER.length);
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/ExpeditionBar presentation/OfferChoice`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: 実装する**

`F/presentation/ExpeditionBar.tsx`:

```tsx
/**
 * 灰燼の城壁 - 遠征の帯（反復7 段階1・設計書 §3.2）
 *
 * 層・ステージ名・獲得枚数だけを出す。ライフは戦闘中に RunStatusBar が
 * 刻々と出しているので、ここで開始時の値を出すと2つのライフが並んで食い違う。
 * **次ステージの予告は段階3 で足す**（暫定ステージは全て同じマップで、まだ違いが無い）。
 */
import React from 'react';
import styled from 'styled-components';
import { currentStage, type ExpeditionState } from '../domain/expedition/expedition-state';
import { COLORS } from './theme';

const TIER_COUNT = 3;

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px 12px;
  color: ${COLORS.secondary};
  border-bottom: 1px solid ${COLORS.grid};
  font-size: 14px;
`;

export const ExpeditionBar: React.FC<{ expedition: ExpeditionState }> = ({ expedition }) => {
  const stage = currentStage(expedition);
  return (
    <Bar role="status" aria-label="遠征の進み具合">
      <strong>
        層 {stage?.tier ?? TIER_COUNT} / {TIER_COUNT}
      </strong>
      <span>{stage?.name ?? ''}</span>
      <span>獲得 {expedition.acquired.length}枚</span>
    </Bar>
  );
};
```

`F/presentation/OfferChoice.tsx`:

```tsx
/**
 * 灰燼の城壁 - 獲得の3択（反復7 段階1・設計書 §3.2）
 *
 * **辞退ボタンは出さない。** `declineOffer` は較正で「獲得しない腕」を回すための
 * 遷移で、UI には出さない契約になっている（expedition-state.ts）。
 * 候補が0枚のときは useExpedition が自動で辞退するので、ここへは来ない。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { cardStatsOf } from './card-text';
import { CardGlyph } from './CardGlyph';
import { COLORS } from './theme';

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
`;

const Choices = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
`;

const Choice = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 44px;
  padding: 12px;
  text-align: left;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

export const offerButtonLabel = (cardId: string): string => `${getCardDefinition(cardId).name} を加える`;

export const OfferChoice: React.FC<{ offer: readonly string[]; onChoose: (cardId: string) => void }> = ({
  offer,
  onChoose,
}) => (
  <Panel aria-labelledby="ashen-rampart-offer-heading">
    <h2 id="ashen-rampart-offer-heading">札を1枚選んでデッキに加える</h2>
    <Choices>
      {offer.map((cardId) => {
        const card = getCardDefinition(cardId);
        return (
          <Choice key={cardId} type="button" aria-label={offerButtonLabel(cardId)} onClick={() => onChoose(cardId)}>
            <span>
              <CardGlyph cardId={cardId} /> <strong>{card.name}</strong> コスト{card.cost}
            </span>
            <span>{card.description}</span>
            <span>{cardStatsOf(cardId).join(' ／ ')}</span>
          </Choice>
        );
      })}
    </Choices>
  </Panel>
);
```

- [ ] **Step 4: テストが通ることを確かめる**

Run: `npx jest presentation/ExpeditionBar presentation/OfferChoice`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/ExpeditionBar.* src/features/ashen-rampart/presentation/OfferChoice.*
git commit -m "feat(ashen-rampart): 遠征の帯と獲得の3択を追加する"
```

---

### Task 8: `ExpeditionSummary` — 遠征の結果画面

**Files:**
- Create: `F/presentation/copy-log.ts` / `F/presentation/copy-log.test.ts`（`AshenRampartGame.tsx:156-174` の `copyLogToClipboard` を移す）
- Create: `F/presentation/ExpeditionSummary.tsx` / `F/presentation/ExpeditionSummary.test.tsx`

**Interfaces:**
- Produces:

```ts
// copy-log.ts
export const copyLogToClipboard: (json: string) => Promise<boolean>;
// ExpeditionSummary.tsx
export interface ExpeditionSummaryProps {
  expedition: ExpeditionState; // phase === 'ended'
  onNote: (text: string) => void;
  exportLogJson: () => string;
  onRetry: () => void;
  onRebuild: () => void;
  onShowBriefing: () => void;
}
export const COPY_LOG_LABEL = '判定用の記録をコピー（3遠征分まとまっています）';
export const expeditionHeadline: (exp: ExpeditionState) => string;
```

- [ ] **Step 1: 失敗するテストを書く**

`F/presentation/copy-log.test.ts`:

```ts
import { copyLogToClipboard } from './copy-log';

describe('copyLogToClipboard', () => {
  it('Clipboard API があれば書き込んで true を返す', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await expect(copyLogToClipboard('{"a":1}')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('{"a":1}');
  });

  it('Clipboard API が無ければコンソールへ出して false を返す（記録を失わない）', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await expect(copyLogToClipboard('{"a":1}')).resolves.toBe(false);
    expect(logSpy).toHaveBeenCalledWith('{"a":1}');
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});
```

`F/presentation/ExpeditionSummary.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExpeditionSummary, COPY_LOG_LABEL, expeditionHeadline } from './ExpeditionSummary';
import { PRESET_DECKS, getCardDefinition } from '../domain/cards/card-pool';
import {
  chooseAcquisition,
  completeStage,
  presentOffer,
  type ExpeditionState,
} from '../domain/expedition/expedition-state';
import { startExpedition } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';

const WIN = { won: true, lifeLeft: 10 };
const start = () => startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);
const winAndAcquire = (exp: ExpeditionState): ExpeditionState =>
  chooseAcquisition(presentOffer(completeStage(exp, WIN), ['arrow-tower']), 'arrow-tower');

/** 層2 で敗れた遠征（獲得1枚） */
const failedAtTier2 = (): ExpeditionState =>
  completeStage(winAndAcquire(start()), { won: false, lifeLeft: 0 });

const cleared = (): ExpeditionState => completeStage(winAndAcquire(winAndAcquire(start())), WIN);

const renderSummary = (expedition: ExpeditionState) => {
  const handlers = {
    onNote: jest.fn(),
    exportLogJson: jest.fn(() => '{"version":6,"events":[]}'),
    onRetry: jest.fn(),
    onRebuild: jest.fn(),
    onShowBriefing: jest.fn(),
  };
  render(<ExpeditionSummary expedition={expedition} {...handlers} />);
  return handlers;
};

const submitNote = (text: string) => {
  fireEvent.change(screen.getByLabelText(/遠征の振り返りを記録する/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: '記録する' }));
};

describe('expeditionHeadline', () => {
  it('踏破と、敗れた層を言い分ける', () => {
    expect(expeditionHeadline(cleared())).toBe('遠征を踏破した');
    expect(expeditionHeadline(failedAtTier2())).toBe('遠征は層2 で潰えた');
  });
});

describe('ExpeditionSummary', () => {
  it('振り返りを記録するまで結果とボタンは伏せる（記録が結果に引きずられないように）', () => {
    renderSummary(failedAtTier2());

    expect(screen.getByText('遠征は層2 で潰えた')).toBeInTheDocument();
    expect(screen.queryByText(/獲得した札/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COPY_LOG_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '同じデッキで別のシードに挑む' })).not.toBeInTheDocument();
  });

  it('記録すると onNote に渡り、結果（獲得した札）と各ボタンが開く', () => {
    const handlers = renderSummary(failedAtTier2());
    submitNote('層2 の鴉で崩れた');

    expect(handlers.onNote).toHaveBeenCalledWith('層2 の鴉で崩れた');
    expect(screen.getByText(/獲得した札/)).toHaveTextContent(getCardDefinition('arrow-tower').name);
    ['同じデッキで別のシードに挑む', 'デッキを組み直す', '説明をもう一度見る', COPY_LOG_LABEL].forEach((name) =>
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    );
  });

  it('空白だけの記録は受け付けない', () => {
    const handlers = renderSummary(failedAtTier2());
    submitNote('   ');

    expect(handlers.onNote).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: COPY_LOG_LABEL })).not.toBeInTheDocument();
  });

  it('各ボタンがそれぞれのコールバックへ届く', () => {
    const handlers = renderSummary(cleared());
    submitNote('踏破した');

    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));
    fireEvent.click(screen.getByRole('button', { name: 'デッキを組み直す' }));
    fireEvent.click(screen.getByRole('button', { name: '説明をもう一度見る' }));

    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
    expect(handlers.onRebuild).toHaveBeenCalledTimes(1);
    expect(handlers.onShowBriefing).toHaveBeenCalledTimes(1);
  });

  it('ログのコピーは exportLogJson の中身をクリップボードへ渡し、成否を出す', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderSummary(cleared());
    submitNote('踏破した');

    fireEvent.click(screen.getByRole('button', { name: COPY_LOG_LABEL }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('{"version":6,"events":[]}'));
    expect(await screen.findByText('判定用の記録をコピーしました')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/copy-log presentation/ExpeditionSummary`
Expected: FAIL（モジュールが無い）

- [ ] **Step 3: `copy-log.ts` を作る**

`AshenRampartGame.tsx:156-174` の docstring と `copyLogToClipboard` を `F/presentation/copy-log.ts` へそのまま移し、`export const` にする（`AshenRampartGame.tsx` 側の削除は Task 10）。

- [ ] **Step 4: `ExpeditionSummary.tsx` を作る**

```tsx
/**
 * 灰燼の城壁 - 遠征の結果画面（反復7 段階1・設計書 §3.2）
 *
 * **振り返りを記録するまで結果を伏せる。** 反復5 Task 12 の「勝敗理由を記録してから
 * 集計」を遠征単位へ移したもの。結果（獲得した札・到達した層）を先に見せると、
 * 振り返り（反復7の判定項目8・9(a) の材料）が結果に引きずられる。
 *
 * 「説明をもう一度見る」は反復1 から持ち越した minor（5回目）を閉じる導線。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { currentStage, type ExpeditionState } from '../domain/expedition/expedition-state';
import { copyLogToClipboard } from './copy-log';
import { COLORS } from './theme';
import { HEADER_CLEARANCE } from './layout-constants';

export const COPY_LOG_LABEL = '判定用の記録をコピー（3遠征分まとまっています）';

export const expeditionHeadline = (exp: ExpeditionState): string =>
  exp.outcome === 'cleared' ? '遠征を踏破した' : `遠征は層${currentStage(exp)?.tier ?? '?'} で潰えた`;

const Layout = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  padding-top: ${HEADER_CLEARANCE};
  color: ${COLORS.secondary};
  background: ${COLORS.dominant};
  min-height: 70vh;
`;

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 420px;
`;

const NoteInput = styled.textarea`
  min-height: 60px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
`;

const ActionButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

const Feedback = styled.p`
  margin: 0;
  color: ${COLORS.opportunity};
`;

export interface ExpeditionSummaryProps {
  expedition: ExpeditionState;
  onNote: (text: string) => void;
  exportLogJson: () => string;
  onRetry: () => void;
  onRebuild: () => void;
  onShowBriefing: () => void;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

const acquiredText = (exp: ExpeditionState): string =>
  exp.acquired.length === 0 ? 'なし' : exp.acquired.map((id) => getCardDefinition(id).name).join('、');

export const ExpeditionSummary: React.FC<ExpeditionSummaryProps> = ({
  expedition,
  onNote,
  exportLogJson,
  onRetry,
  onRebuild,
  onShowBriefing,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (trimmed.length === 0) return;
    onNote(trimmed);
    setIsUnlocked(true);
  };

  const handleCopy = (): void => {
    void copyLogToClipboard(exportLogJson()).then((ok) => setCopyStatus(ok ? 'copied' : 'failed'));
  };

  return (
    <Layout data-testid="ashen-rampart-expedition-summary">
      <h2>{expeditionHeadline(expedition)}</h2>
      <NoteForm onSubmit={handleSubmit}>
        <label htmlFor="ashen-rampart-expedition-note">遠征の振り返りを記録する（記録すると結果が開きます）</label>
        <NoteInput
          id="ashen-rampart-expedition-note"
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
        />
        <ActionButton type="submit">記録する</ActionButton>
      </NoteForm>
      {isUnlocked && (
        <>
          <Feedback>記録しました</Feedback>
          <p>獲得した札: {acquiredText(expedition)}</p>
          <ActionRow>
            <ActionButton type="button" onClick={handleCopy}>
              {COPY_LOG_LABEL}
            </ActionButton>
            <ActionButton type="button" onClick={onRetry}>
              同じデッキで別のシードに挑む
            </ActionButton>
            <ActionButton type="button" onClick={onRebuild}>
              デッキを組み直す
            </ActionButton>
            <ActionButton type="button" onClick={onShowBriefing}>
              説明をもう一度見る
            </ActionButton>
          </ActionRow>
          {copyStatus === 'copied' && <Feedback>判定用の記録をコピーしました</Feedback>}
          {copyStatus === 'failed' && <Feedback>コピーに失敗しました。コンソールに出力しています</Feedback>}
        </>
      )}
    </Layout>
  );
};
```

- [ ] **Step 5: テストが通ることを確かめる**

Run: `npx jest presentation/copy-log presentation/ExpeditionSummary`
Expected: PASS（8件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/copy-log.* src/features/ashen-rampart/presentation/ExpeditionSummary.*
git commit -m "feat(ashen-rampart): 遠征の結果画面 ExpeditionSummary を追加する"
```

---

### Task 9: 構築画面の分割とシード欄（持ち越し5回目の minor 2件）

**Files:**
- Create: `F/presentation/DeckCardRow.tsx`（`DeckBuilder.tsx:46-124` の styled 部品と 208〜247 行の1行分を移す）
- Create: `F/presentation/SeedField.tsx` / `F/presentation/SeedField.test.tsx`
- Modify: `F/presentation/DeckBuilder.tsx`
- Modify: `F/presentation/DeckBuilder.test.tsx:171-182`

**Interfaces:**
- Produces:

```ts
// DeckCardRow.tsx
export const DeckCardRow: React.FC<{ cardId: string; count: number; onAdd: () => void; onRemove: () => void }>;
// SeedField.tsx
export const SEED_LABEL = 'シード（空欄なら毎回ランダム）';
export const USE_LAST_SEED_LABEL = '前回のシードを使う';
export const SeedField: React.FC<{ value: string; onChange: (text: string) => void; lastSeed?: number }>;
// DeckBuilder の Props: initialSeedText を削除し lastSeed?: number を追加
interface Props {
  onStart: (cards: string[], seed?: number) => void;
  initialCards?: readonly string[];
  /** 直前の遠征で実際に使ったシード。欄には入れず、明示操作でだけ入れる */
  lastSeed?: number;
}
```

- [ ] **Step 1: 失敗するテストを書く**

`F/presentation/SeedField.test.tsx`:

```tsx
import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SeedField, SEED_LABEL, USE_LAST_SEED_LABEL } from './SeedField';

const Harness: React.FC<{ lastSeed?: number }> = ({ lastSeed }) => {
  const [value, setValue] = useState('');
  return <SeedField value={value} onChange={setValue} lastSeed={lastSeed} />;
};

describe('SeedField', () => {
  it('前回のシードがあっても欄は空で始まり、前回の値を文字で添える（同一盤面の事故を防ぐ）', () => {
    render(<Harness lastSeed={321} />);

    expect((screen.getByLabelText(SEED_LABEL) as HTMLInputElement).value).toBe('');
    expect(screen.getByText('前回のシード: 321')).toBeInTheDocument();
  });

  it('「前回のシードを使う」を押したときだけ欄に入る', () => {
    render(<Harness lastSeed={321} />);

    fireEvent.click(screen.getByRole('button', { name: USE_LAST_SEED_LABEL }));

    expect((screen.getByLabelText(SEED_LABEL) as HTMLInputElement).value).toBe('321');
  });

  it('前回のシードが無ければ添え書きもボタンも出さない', () => {
    render(<Harness />);

    expect(screen.queryByText(/前回のシード/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: USE_LAST_SEED_LABEL })).not.toBeInTheDocument();
  });
});
```

`DeckBuilder.test.tsx` の 171〜182 行のテスト（`initialSeedText を渡すと…`）を次に置き換える:

```tsx
  it('lastSeed を渡してもシード欄は空で始まり、前回のシードとして添えられる', () => {
    render(<DeckBuilder onStart={jest.fn()} lastSeed={777} />);

    const seedInput = screen.getByLabelText('シード（空欄なら毎回ランダム）') as HTMLInputElement;
    expect(seedInput.value).toBe('');
    expect(screen.getByText('前回のシード: 777')).toBeInTheDocument();
  });
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/SeedField presentation/DeckBuilder`
Expected: FAIL（`SeedField` が無い／`lastSeed` を受け付けない）

- [ ] **Step 3: `SeedField.tsx` を作る**

```tsx
/**
 * 灰燼の城壁 - シード欄（反復7 段階1・反復1 から持ち越した minor 5回目）
 *
 * 旧版は構築画面へ戻るとシード欄に**構築時に入力した古い値**が残っていた。
 * 「同じデッキで別のシードに挑む」で実際に使ったシードではなく、しかも
 * そのまま始めると同一盤面になる（判定者が2度踏んだ事故）。
 * **欄は常に空で始め、前回のシードは明示操作でだけ入れる。**
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS } from './theme';

export const SEED_LABEL = 'シード（空欄なら毎回ランダム）';
export const USE_LAST_SEED_LABEL = '前回のシードを使う';

const Field = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const UseLastButton = styled.button`
  min-height: 44px;
  padding: 0 12px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

export const SeedField: React.FC<{ value: string; onChange: (text: string) => void; lastSeed?: number }> = ({
  value,
  onChange,
  lastSeed,
}) => (
  <Field>
    <label htmlFor="ashen-rampart-seed">{SEED_LABEL}</label>
    <input id="ashen-rampart-seed" value={value} inputMode="numeric" onChange={(e) => onChange(e.target.value)} />
    {lastSeed !== undefined && (
      <>
        <span>前回のシード: {lastSeed}</span>
        <UseLastButton type="button" onClick={() => onChange(String(lastSeed))}>
          {USE_LAST_SEED_LABEL}
        </UseLastButton>
      </>
    )}
  </Field>
);
```

- [ ] **Step 4: `DeckCardRow.tsx` を作り、`DeckBuilder.tsx` を縮める**

1. `DeckBuilder.tsx` の `Cards` 以外の1行用 styled 部品（`CardRow` / `RowHead` / `RoleTag` / `Cost`（docstring ごと）/ `Controls` / `StepButton` / `Weakness` / `Stats`（docstring ごと））と、208〜247 行の `<CardRow>…</CardRow>` を `DeckCardRow.tsx` へ移し、次の形にする:

```tsx
/**
 * 灰燼の城壁 - 構築画面の1行（反復7 段階1 で DeckBuilder から分割）
 *
 * DeckBuilder が284行あり、反復1 から「行数」を minor として持ち越していた（5回目）。
 */
export const DeckCardRow: React.FC<{ cardId: string; count: number; onAdd: () => void; onRemove: () => void }> = ({
  cardId,
  count,
  onAdd,
  onRemove,
}) => {
  const card = getCardDefinition(cardId);
  return (
    <CardRow role="group" aria-label={`${card.name} コスト${card.cost}`}>
      <RowHead>
        <CardGlyph cardId={cardId} />
        <strong>{card.name}</strong>
        <Cost>コスト{card.cost}</Cost>
        <RoleTag>{roleLabelOf(getUnitVisual(cardId).role)}</RoleTag>
        {cardBadgesOf(cardId).map((badge) => (
          <CardBadge key={badge}>{badge}</CardBadge>
        ))}
      </RowHead>
      <span>{card.description}</span>
      {towerStatsTextOf(cardId) && <Stats>{towerStatsTextOf(cardId)}</Stats>}
      <Weakness>{weaknessTextOf(cardId)}</Weakness>
      <Controls>
        <StepButton type="button" aria-label={`${card.name} を1枚減らす`} disabled={count === 0} onClick={onRemove}>
          −
        </StepButton>
        <span>{count}</span>
        <StepButton
          type="button"
          aria-label={`${card.name} を1枚増やす`}
          disabled={count >= maxCopiesOf(cardId)}
          onClick={onAdd}
        >
          ＋
        </StepButton>
      </Controls>
    </CardRow>
  );
};
```

import は `React`・`styled`・`getCardDefinition` / `maxCopiesOf`（`../domain/cards/card-pool`）・`cardBadgesOf` / `weaknessTextOf` / `towerStatsTextOf`（`./card-text`）・`CardBadge`・`CardGlyph`・`getUnitVisual` / `roleLabelOf`（`./unit-visual`）・`COLORS`（`./theme`）。

2. `StepButton` と `Controls` はプリセット読み込みボタンでも使うので `DeckCardRow.tsx` から `export` し、`DeckBuilder.tsx` はそれを import する
3. `DeckBuilder.tsx` の一覧を次に置き換える:

```tsx
      <Cards>
        {BUILDABLE_CARD_IDS.map((id) => (
          <DeckCardRow
            key={id}
            cardId={id}
            count={counts.get(id) ?? 0}
            onAdd={() => add(id)}
            onRemove={() => remove(id)}
          />
        ))}
      </Cards>
```

4. Props を上の Interfaces の形にし、`const [seedText, setSeedText] = useState('');` にする（`initialSeedText` を消す）
5. Footer の `<label …>` と `<input …>` を `<SeedField value={seedText} onChange={setSeedText} lastSeed={lastSeed} />` に置き換える
6. 使わなくなった import（`cardBadgesOf` 等、`CardGlyph` / `CardBadge` / `getUnitVisual` / `roleLabelOf` / `maxCopiesOf`）を消す

- [ ] **Step 5: 行数とテストを確かめる**

Run: `wc -l src/features/ashen-rampart/presentation/DeckBuilder.tsx && npx jest presentation/SeedField presentation/DeckBuilder`
Expected: 200 行未満、PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/DeckBuilder.* src/features/ashen-rampart/presentation/DeckCardRow.tsx \
        src/features/ashen-rampart/presentation/SeedField.*
git commit -m "refactor(ashen-rampart): 構築画面を分割し、シード欄を空で始めて前回のシードを添える"
```

---

### Task 10: 遠征を画面に結線する（`ExpeditionView` と `AshenRampartGame`）

**Files:**
- Create: `F/presentation/briefing-seen.ts`（`AshenRampartGame.tsx:127-145` を移す）
- Create: `F/presentation/ExpeditionView.tsx`
- Modify: `F/presentation/AshenRampartGame.tsx`（全面書き換え）
- Modify: `F/presentation/AshenRampartGame.test.tsx`（決着画面に依存するテストを遠征へ移行）

**Interfaces:**
- Consumes: Task 5 `useExpedition`、Task 6 `StageView`、Task 7 `ExpeditionBar` / `OfferChoice`、Task 8 `ExpeditionSummary`、Task 9 `DeckBuilder` の `lastSeed`
- Produces:

```ts
// briefing-seen.ts
export const readBriefingSeen: () => boolean;
export const markBriefingSeen: () => void;
// ExpeditionView.tsx
export const ExpeditionView: React.FC<{ cards: string[]; seed: number; onRetry: () => void; onRebuild: () => void }>;
// AshenRampartGame.tsx
export const AshenRampartGame: React.FC;
export { HEADER_CLEARANCE };
```

- [ ] **Step 1: 統合テストを遠征へ書き換える（失敗するテスト）**

`AshenRampartGame.test.tsx` を次のとおり変える。

1. 冒頭 docstring の2段落目の後に足す:

```ts
 * 反復7 段階1 で単発ランを遠征に置き換えた。決着画面（勝敗理由の記録・コピー・
 * 再挑戦）は遠征の結果画面（ExpeditionSummary）へ移ったため、決着に依存する
 * テストは `advanceUntilExpeditionEnds` で遠征の終わりまで進めてから検証する。
```

2. `COPY_BUTTON_NAME` を `'判定用の記録をコピー（3遠征分まとまっています）'` にする
3. 63〜81 行（`MAX_ADVANCE_TICKS` 〜 `advanceUntilRunEnds`）を次に置き換える:

```ts
const ADVANCE_STEP_TICKS = 50;
/** 3ステージ × 1ステージ最長 1200 tick を 50 tick 刻みで進め、決着ボタンと獲得の操作ぶんを足した上限 */
const MAX_ADVANCE_STEPS = 100;
const SUMMARY_HEADING = /遠征を踏破した|遠征は層\d で潰えた/;

const isExpeditionOver = (): boolean => screen.queryByText(SUMMARY_HEADING) !== null;

/** 決着ボタンがあれば押し、獲得の3択が出ていれば先頭を選ぶ（何も配置しない進め方） */
const settleOrChoose = (): void => {
  const settle = screen.queryByRole('button', { name: /獲得へ進む|遠征の結果へ/ });
  if (settle) {
    fireEvent.click(settle);
    return;
  }
  const offer = screen.queryAllByRole('button', { name: / を加える$/ })[0];
  if (offer) fireEvent.click(offer);
};

/**
 * 何も配置せずに遠征の結果画面まで進める
 *
 * 暫定ステージの層1 は総HP が小さく、無配置でも勝つことがある（反復6 §8.2.16 の
 * prov-t1-a）。勝敗のどちらに転んでも結果画面へ着くよう、決着と獲得を都度処理する。
 */
const advanceUntilExpeditionEnds = (): void => {
  for (let step = 0; step < MAX_ADVANCE_STEPS; step += 1) {
    if (isExpeditionOver()) return;
    settleOrChoose();
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * ADVANCE_STEP_TICKS);
    });
  }
  if (!isExpeditionOver()) {
    throw new Error(`遠征が ${MAX_ADVANCE_STEPS} 段階進めても終わりませんでした（ステージ長を確認すること）`);
  }
};
```

4. `submitRunNote` を次に置き換える:

```ts
/** 遠征の結果画面で振り返りを記録する（結果・コピー・再挑戦は記録後にだけ開く） */
const submitExpeditionNote = (text = 'テスト用の記録'): void => {
  fireEvent.change(screen.getByLabelText(/遠征の振り返りを記録する/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: '記録する' }));
};
```

5. `CUSTOM_DECK_SEED` の値と docstring を Step 2 の手順で決め直す（遠征では `startStage` が派生シードでシャッフルするため、シード2 で石壁と弓兵が初期手札に来るとは限らない）
6. 決着に依存する次のテストを置き換える（テスト名は元の意図を保つ）:

| 元のテスト（行） | 置き換え後 |
|---|---|
| 180 `決着後に勝敗理由を…run_note が保存される` | 下の A |
| 196 `空欄のまま記録しても run_note は…` | 下の B |
| 210 コピー | `advanceUntilRunEnds(); submitRunNote();` を `advanceUntilExpeditionEnds(); submitExpeditionNote();` に替え、`parsed.version` を 6、`run_started` の代わりに `expedition_started` を検査する |
| 232 `もう一度挑む` | 下の C |
| 255 `同じデッキで別のシードに挑む` | 下の D |
| 276 クリップボード不可 | 210 と同じ置き換え |
| 395 `2回目以降はブリーフィングをスキップ` | `advanceUntilExpeditionEnds(); submitExpeditionNote(); fireEvent.click(… 'デッキを組み直す')` に替える |
| 408 `もう一度挑む で構築画面に戻ると…` | 下の E |
| 461 `勝敗の理由を記録するまで集計は表示されない` | 削除（`ExpeditionSummary.test.tsx` の「振り返りを記録するまで結果とボタンは伏せる」へ移った）。削除した旨を1行コメントで残す |
| 484 `restart すると集計の鍵と記録欄が…` | 下の F |
| 500 行のコメント（指摘C） | 削除し、下の G を足す |

```tsx
  // A
  it('遠征の結果画面で振り返りを記録すると expedition_note が保存される', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilExpeditionEnds();

    submitExpeditionNote('層1 で鴉に抜けられた');

    const notes = readExportedLog().events.filter((e) => e.kind === 'expedition_note');
    expect(notes).toEqual([expect.objectContaining({ text: '層1 で鴉に抜けられた' })]);
  });

  // B
  it('空欄のまま記録しても expedition_note は保存されない', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilExpeditionEnds();

    submitExpeditionNote('   ');

    expect(readExportedLog().events.filter((e) => e.kind === 'expedition_note')).toHaveLength(0);
  });

  // C
  it('「デッキを組み直す」で構築画面に戻り、別のデッキで新しい遠征を始められる', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilExpeditionEnds();
    submitExpeditionNote();

    fireEvent.click(screen.getByRole('button', { name: 'デッキを組み直す' }));
    fireEvent.click(screen.getByRole('button', { name: /重厚型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));

    expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
    expect(readExportedLog().events.filter((e) => e.kind === 'expedition_started')).toHaveLength(2);
  });

  // D
  it('「同じデッキで別のシードに挑む」で構築画面を経ずに新しいシードの遠征が始まる', () => {
    render(<AshenRampartGame />);
    startRunning(/速攻型 を読み込む/, '11');
    advanceUntilExpeditionEnds();
    submitExpeditionNote();

    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));

    expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
    const started = readExportedLog().events.filter((e) => e.kind === 'expedition_started');
    expect(started).toHaveLength(2);
    expect(started[1]).not.toMatchObject({ seed: 11 });
    expect((screen.getByLabelText('シード') as HTMLInputElement).value).toBe(String(
      (started[1] as { seed: number }).seed
    ));
  });

  // E（旧 408。持ち越し minor「in-place restart 後のシード欄」を閉じる）
  it('組み直しで構築画面に戻ると、デッキは引き継ぎ、シード欄は空で直前の遠征のシードが添えられる', () => {
    render(<AshenRampartGame />);
    startRunning(/速攻型 を読み込む/, '321');
    advanceUntilExpeditionEnds();
    submitExpeditionNote();
    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));
    const retriedSeed = (screen.getByLabelText('シード') as HTMLInputElement).value;
    advanceUntilExpeditionEnds();
    submitExpeditionNote();

    fireEvent.click(screen.getByRole('button', { name: 'デッキを組み直す' }));

    expect(screen.getByText(`${DECK_SIZE} / ${DECK_SIZE}`)).toBeInTheDocument();
    expect((screen.getByLabelText('シード（空欄なら毎回ランダム）') as HTMLInputElement).value).toBe('');
    expect(screen.getByText(`前回のシード: ${retriedSeed}`)).toBeInTheDocument();
  });

  // F
  it('別のシードに挑むと、振り返りの欄と結果の鍵は次の遠征へ持ち越されない', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilExpeditionEnds();
    submitExpeditionNote('1回目の記録');

    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));
    advanceUntilExpeditionEnds();

    expect(screen.queryByRole('button', { name: COPY_BUTTON_NAME })).not.toBeInTheDocument();
    expect((screen.getByLabelText(/遠征の振り返りを記録する/) as HTMLTextAreaElement).value).toBe('');
  });

  // G（反復1 から持ち越した minor「ブリーフィング再表示の導線」を閉じる）
  it('結果画面の「説明をもう一度見る」でブリーフィングが出て、閉じると結果画面へ戻る', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilExpeditionEnds();
    submitExpeditionNote();

    fireEvent.click(screen.getByRole('button', { name: '説明をもう一度見る' }));
    expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '開始' }));

    expect(screen.queryByRole('button', { name: '開始' })).not.toBeInTheDocument();
    // 記録済みの状態が残り、もう一度記録させない（expedition_note の重複を防ぐ）
    expect(screen.getByRole('button', { name: COPY_BUTTON_NAME })).toBeInTheDocument();
    expect(readExportedLog().events.filter((e) => e.kind === 'expedition_note')).toHaveLength(1);
  });

  // H（Review Focus 3: ステージをまたいだ状態漏れ）
  it('遠征の各ステージは新しい手札で始まり、stage_started と run_started がステージごとに結び付く', () => {
    render(<AshenRampartGame />);
    startRunning(/速攻型 を読み込む/, '11');
    advanceUntilExpeditionEnds();

    const events = readExportedLog().events;
    const stages = events.filter((e) => e.kind === 'stage_started');
    const runs = events.filter((e) => e.kind === 'run_started');
    expect(runs).toHaveLength(stages.length);
    runs.forEach((run, i) => expect(run).toMatchObject({ stageIndex: i }));
  });
```

- [ ] **Step 2: 石壁と弓兵が初期手札に来るシードを探す**

遠征のステージ1 は `startStage`（派生シード `shuffle`）でシャッフルするので、`buildCustomDeck` のシードを決め直す。次を実行する:

**リポジトリ内に一時テストを置いて探す**（jest の設定がリポジトリ内のパスだけを拾うため）:

```bash
cat > src/features/ashen-rampart/presentation/find-seed.tmp.test.ts <<'EOF'
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';

const DECK = [
  'reactor', 'reactor', 'reactor', 'stone-wall', 'stone-wall', 'stone-wall',
  'arrow-tower', 'arrow-tower', 'arrow-tower', 'ballista', 'ballista', 'ballista',
];

it('石壁と弓兵が初期手札に来る最小シード', () => {
  const found = Array.from({ length: 200 }, (_, i) => i + 1).find((seed) => {
    const hand = startStage(startExpedition(DECK, seed, createSeededRandom), createSeededRandom).deck.hand;
    return hand.includes('stone-wall') && hand.includes('arrow-tower');
  });
  console.log('FOUND_SEED', found);
  expect(found).toBeDefined();
});
EOF
npx jest find-seed.tmp 2>&1 | grep FOUND_SEED
rm src/features/ashen-rampart/presentation/find-seed.tmp.test.ts
```

出た値を `CUSTOM_DECK_SEED` に入れ、docstring の「シード2」「createDeck を直接呼ぶスクリプトで検証」を「シードN（遠征のステージ1、`startStage` の派生シードで検証）」に書き換える。**一時ファイルを消したことを `git status` で確かめる。**

- [ ] **Step 3: 落ちることを確かめる**

Run: `npx jest presentation/AshenRampartGame.test -t "説明をもう一度見る"`
Expected: FAIL（`遠征の振り返りを記録する` が見つからない）

- [ ] **Step 4: `briefing-seen.ts` を作る**

`AshenRampartGame.tsx:127-145`（`BRIEFING_SEEN_KEY` / `readBriefingSeen` / `markBriefingSeen`）をそのまま移し、2つの関数を `export` する。

- [ ] **Step 5: `ExpeditionView.tsx` を作る**

```tsx
/**
 * 灰燼の城壁 - 遠征の画面遷移（反復7 段階1・設計書 §3.2）
 *
 * ブリーフィング → [ステージ → 獲得3択]×2 → ステージ3 → 結果。
 * 敗北したステージからは結果へ直行する。遷移の判断はすべて useExpedition の
 * `expedition.phase` に従い、この部品は分岐して描くだけにする。
 */
import React, { useState } from 'react';
import { nextWavePreview } from './wave-preview';
import { useExpedition } from './useExpedition';
import { StageView } from './StageView';
import { ExpeditionBar } from './ExpeditionBar';
import { OfferChoice } from './OfferChoice';
import { ExpeditionSummary } from './ExpeditionSummary';
import { StartOverlay } from './StartOverlay';
import { markBriefingSeen, readBriefingSeen } from './briefing-seen';
import { currentStage } from '../domain/expedition/expedition-state';

interface Props {
  cards: string[];
  seed: number;
  onRetry: () => void;
  onRebuild: () => void;
}

/** ラン開始前（tick 0 より前）を表す。先頭の非空ウェーブが選ばれる（旧 FIRST_WAVE_PREVIEW と同じ） */
const BEFORE_START_TICK = -1;

export const ExpeditionView: React.FC<Props> = ({ cards, seed, onRetry, onRebuild }) => {
  const game = useExpedition({ cards, seed });
  const [isBriefingShown, setIsBriefingShown] = useState(() => !readBriefingSeen());
  const { expedition } = game;
  const stage = currentStage(expedition);

  const firstWaves = expedition.stages[0]?.waves ?? [];
  const briefing = isBriefingShown ? (
    <StartOverlay
      preview={nextWavePreview({ waves: firstWaves, tick: BEFORE_START_TICK })}
      onStart={() => {
        markBriefingSeen();
        setIsBriefingShown(false);
      }}
    />
  ) : null;

  // 結果画面は説明を開いている間もマウントしたままにする。外すと振り返りの
  // 記録済み状態が消え、閉じた後にもう一度記録させる（expedition_note が重複する）
  if (expedition.phase === 'ended') {
    return (
      <>
        {briefing}
        <ExpeditionSummary
          expedition={expedition}
          onNote={game.noteExpedition}
          exportLogJson={game.exportLogJson}
          onRetry={onRetry}
          onRebuild={onRebuild}
          onShowBriefing={() => setIsBriefingShown(true)}
        />
      </>
    );
  }
  if (briefing) return briefing;
  if (expedition.phase === 'offer') {
    return (
      <>
        <ExpeditionBar expedition={expedition} />
        <OfferChoice offer={expedition.offer} onChoose={game.acquire} />
      </>
    );
  }
  if (!stage || !game.stageCombat) return null;
  return (
    <StageView
      key={`${game.expeditionId}-${expedition.stageIndex}`}
      cards={expedition.deckCards}
      seed={expedition.seed}
      map={stage.map}
      initialState={game.stageCombat}
      expeditionId={game.expeditionId}
      stageIndex={expedition.stageIndex}
      isFinalStage={expedition.stageIndex === expedition.stages.length - 1}
      banner={<ExpeditionBar expedition={expedition} />}
      onSettled={game.settleStage}
    />
  );
};
```

- [ ] **Step 6: `AshenRampartGame.tsx` を書き換える**

ファイル全体を次にする（`RunView`・styled 部品・`copyLogToClipboard`・既読フラグは Task 6・8・Step 4 で移し終えている）:

```tsx
/**
 * 灰燼の城壁 - ゲーム画面
 *
 * 「構築 ⇄ 遠征」の2画面を遷移する（反復7 段階1・設計書 §3.2）。
 * 反復6 までの単発ランは遠征に置き換えた。遠征の中の遷移
 * （ブリーフィング・ステージ・獲得・結果）は ExpeditionView が持つ。
 *
 * **遠征は `attempt` を key にして毎回作り直す。** 「同じデッキで別のシードに挑む」で
 * 前の遠征のフック（ログの記録済み集合・ステージの状態）が残らないようにする。
 */
import React, { useState } from 'react';
import { DeckBuilder } from './DeckBuilder';
import { ExpeditionView } from './ExpeditionView';
import { HEADER_CLEARANCE } from './layout-constants';
import { createSeed } from '../application/use-cases/start-run';

export { HEADER_CLEARANCE };

type Phase = 'building' | 'expedition';

export const AshenRampartGame: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('building');
  const [cards, setCards] = useState<string[]>([]);
  const [seed, setSeed] = useState<number>(0);
  const [lastSeed, setLastSeed] = useState<number | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);

  const beginExpedition = (nextSeed: number): void => {
    setSeed(nextSeed);
    setLastSeed(nextSeed);
    setAttempt((current) => current + 1);
    setPhase('expedition');
  };

  const handleBuilderStart = (chosenCards: string[], chosenSeed?: number): void => {
    setCards(chosenCards);
    beginExpedition(chosenSeed ?? createSeed());
  };

  if (phase === 'building') {
    // デッキは引き継ぐ（12枚を毎回組み直させない）。シードは欄に入れず添えるだけ（SeedField）
    return <DeckBuilder onStart={handleBuilderStart} initialCards={cards} lastSeed={lastSeed} />;
  }
  return (
    <ExpeditionView
      key={attempt}
      cards={cards}
      seed={seed}
      onRetry={() => beginExpedition(createSeed())}
      onRebuild={() => setPhase('building')}
    />
  );
};
```

- [ ] **Step 7: 使われなくなったものを確かめる**

Run: `grep -rn "RunSummary\b" src/features/ashen-rampart/presentation --include=*.tsx | grep -v test`
Expected: `RunSummary.tsx` 自身だけ。**`RunSummary.tsx` と `run-summary.ts` の `summarize` は消さない**（設計書 §3.2: 段階3 で結果画面への出し方を決める。`run_tally` は引き続き `summarize` を使う）。`RunSummary.tsx` の先頭 docstring に次の1行を足す:

```
 * 反復7 段階1 で画面から外した（ステージ単位の集計は遠征の途中で答えを教えるため）。段階3 で結果画面への出し方を決める。
```

- [ ] **Step 8: テストが通ることを確かめる**

Run: `npx jest presentation/AshenRampartGame.test`
Expected: PASS。**このファイルは遠征を最後まで進めるテストが多く2分を超えうる。超えたらコントローラに依頼する。**

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/
git commit -m "feat(ashen-rampart): 単発ランを遠征に置き換え、構築 ⇄ 遠征 の画面遷移にする"
```

---

### Task 11: E2E と最小幅360px（持ち越し3回目の2件）

**Files:**
- Create: `e2e/ashen-rampart/expedition-flow.spec.ts`
- Modify（条件付き）: `F/presentation/HandArea.tsx:234-239`

**Interfaces:**
- Consumes: ルート `/ashen-rampart`、Task 10 の画面

- [ ] **Step 1: E2E を書く**

```ts
/**
 * E2E: 灰燼の城壁の遠征（反復7 段階1）
 *
 * 単体テストはタイマーを偽装して進めるので、実ブラウザで
 * 「構築 → 説明 → ステージ1 の盤面」まで通ることをここで守る。
 * 360px の計測は反復4 から持ち越した実機確認（3回目）の前段である。
 */
import { test, expect, type Page } from '@playwright/test';

const MIN_WIDTH = 360;
const MIN_HEIGHT = 740;

const startExpedition = async (page: Page): Promise<void> => {
  await page.goto('/ashen-rampart');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /速攻型 を読み込む/ }).click();
  await page.getByRole('button', { name: 'この構成で始める' }).click();
  await page.getByRole('button', { name: '開始' }).click();
};

test.describe('灰燼の城壁 遠征', () => {
  test('構築 → 説明 → ステージ1 の盤面と遠征の帯が出る', async ({ page }) => {
    await startExpedition(page);

    await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible();
    await expect(page.getByRole('status', { name: '遠征の進み具合' })).toContainText('層 1 / 3');
    await expect(page.getByRole('group', { name: '手札' })).toBeVisible();
  });

  test('最小幅360px で横スクロールが出ず、手札の1行あたりの枚数を記録する', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: MIN_WIDTH, height: MIN_HEIGHT });
    await startExpedition(page);
    await expect(page.getByRole('group', { name: '手札' })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const cardTops = await page
      .getByRole('group', { name: '手札' })
      .getByRole('button', { name: / コスト\d/ })
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    const cardsPerRow = Math.max(...Object.values(
      cardTops.reduce<Record<number, number>>((acc, top) => ({ ...acc, [top]: (acc[top] ?? 0) + 1 }), {})
    ));

    await page.screenshot({ path: testInfo.outputPath('ashen-rampart-360.png'), fullPage: true });
    await testInfo.attach('hand-layout-360', {
      body: JSON.stringify({ scrollWidth, cardTops, cardsPerRow }),
      contentType: 'application/json',
    });

    expect(scrollWidth).toBeLessThanOrEqual(MIN_WIDTH);
    // 反復4 §6.1 の発動条件は「1行1枚に折り返す」。2枚以上並べば手順は発動しない
    expect(cardsPerRow).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: 実行する（コントローラが回す）**

Run: `npx playwright test e2e/ashen-rampart/expedition-flow.spec.ts --project=chromium`
Expected: 2件 PASS。`hand-layout-360` の添付に `cardsPerRow` が記録される

**`cardsPerRow` が 1 で落ちたら、反復4 設計書 §6.1 の手順を順に1段ずつ当てて、そのつど再実行する**（「手札の幅を削る手順の実地検証」の本体。どの段で収まったかを報告に書く）:

1. 属性バッジを2つ→1つ: `HandArea.tsx` の `cardBadgesOf(cardId).map(` を `cardBadgesOf(cardId).slice(0, 1).map(` にする
2. 属性バッジを落とす: `HandArea.tsx` の `{cardBadgesOf(cardId).slice(0, 1).map((badge) => (…))}` のブロックを削除する（`DeckBuilder` 側のバッジは残す）
3. 主要数値を2つ→1つ: `cardStatsOf(cardId).map(` を `cardStatsOf(cardId).slice(0, 1).map(` にする

**形アイコン・名前・コストは削らない**（反復4 §6.1）。3段目でも収まらなければ、それ以上削らずに止めて報告する。

- [ ] **Step 3: 360px のスクリーンショットを保全する**

`test-results/` は gitignore 配下なので、判定の証拠として `docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-stage1-360px.png` へコピーし、添付の JSON を `docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-stage1-360px.json` として保存する。**`git ls-files docs/superpowers/specs | grep 360px` で2つとも追跡されていることを確かめてから「保全した」と書く。**

- [ ] **Step 4: コミット**

```bash
git add e2e/ashen-rampart/ docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-stage1-360px.* \
        src/features/ashen-rampart/presentation/HandArea.tsx
git commit -m "test(ashen-rampart): 遠征の E2E と最小幅360px の計測を追加する"
```

---

### Task 12: 段階1 の出口（設計書 §3.6）

- [ ] **Step 1: 全体の検証（コントローラが背景で回す）**

Run（背景実行）: `npm run ci`
Expected: lint:ci・typecheck・test・build がすべて成功。**`balance.test.ts` の `it.failing`（支配デッキ）は failing のまま＝緑。赤くなったら「直った」と読んで報告する**

- [ ] **Step 2: 設計書とメモリの更新**

1. 設計書 §8 の段階1 の行に「完了（YYYY-MM-DD・PR #N）」を書く
2. 設計書 §7 の持ち越し表で、段階1 で閉じた5件（minor 3件・360px・手札の幅）の「反復7 での扱い」に結果を書く（手札の幅は Task 11 でどの段まで当てたか）
3. 反復6 設計書の重い測定の一覧にある陰性対照の実行方法が変わったので、メモリ `ashen-rampart-iteration6-status.md` の「重い測定の回し方」に `ASHEN_RAMPART_B0_SANITY=1 npx jest axis-knockout-sanity  # 約60秒（反復7 で CI から外した）` を足す

- [ ] **Step 3: PR を作る**

タイトル: `feat(ashen-rampart): 反復7 段階1 — 遠征を画面から遊べるようにする`
本文は `.claude/rules/git-workflow.md` の構成（概要・変更内容・テスト方法）に従い、**「単発ランが画面から消えること」と「`RunSummary` を画面から外したこと」を明記する。**

- [ ] **Step 4: ユーザーの動作確認（判定ではない）**

ユーザーに依頼する:
1. 暫定ステージで1遠征を最後まで遊び、流れが途切れず結果画面まで進むか（面白さは問わない）
2. 手元の実機（最小幅360px 相当）で1回開き、盤面と手札が読めるか

**確認が取れるまで段階2 の計画を書かない。**
