# KEYS & ARMS 入力処理 DRY 解消 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 入力処理の DRY 負債（アクションキー二重定義・`gameTick` 重複）を解消し、その単一定義を使って `z` 開始で GOD MODE が発動しない既存バグを根治する。

**Architecture:** (A) `ACTION_KEYS`/`isActionKey` を `core/input.ts` の単一定義にする。(B) `gameTick` を `core/game-tick.ts` に、トランジション前進を `core/transition.ts` に抽出し、`engine.ts` と `test-engine.ts` が共有する（render タイミングは温存＝振る舞い不変）。(C) cheat 蓄積ループで `isActionKey` を使い `z` を除外する（GOD MODE が z/space/Enter で一律発動）。

**Tech Stack:** TypeScript, React 19, Jest 30 (SWC)。型: `npm run typecheck` / テスト: `npm test -- keys-and-arms` / 全体: `npm run ci`。

**作業ディレクトリ:** `src/features/keys-and-arms/`（以下、パスはこのディレクトリ起点。ブランチ `refactor/keys-and-arms-input-dry` で作業、新規ブランチは作らない）

**設計書:** `docs/superpowers/specs/2026-06-14-keys-and-arms-input-dry-refactoring-design.md`

> **方針:** A・B は振る舞い不変（既存テストが安全網）。C のみ意図的な挙動変更（z 開始 GOD MODE）。
> 各タスクで `npm run typecheck` + `npm test -- keys-and-arms` をグリーンにしてからコミットする。

---

## Task 1: (A) アクションキーの単一定義

**Files:**
- Modify: `core/input.ts`
- Test: `__tests__/core/input.test.ts`

- [ ] **Step 1: テストを追加（失敗する）**

`__tests__/core/input.test.ts` の末尾（最後の `});` の前のトップレベル）に以下の describe を追加:

```ts
import { ACTION_KEYS, isActionKey, createInputHandler } from '../../core/input';

describe('ACTION_KEYS / isActionKey', () => {
  it('アクションキーは z と space', () => {
    expect([...ACTION_KEYS]).toEqual(['z', ' ']);
  });

  it('isActionKey は z / space を true、それ以外を false にする', () => {
    expect(isActionKey('z')).toBe(true);
    expect(isActionKey('Z')).toBe(true); // 大文字も
    expect(isActionKey(' ')).toBe(true);
    expect(isActionKey('a')).toBe(false);
    expect(isActionKey('enter')).toBe(false);
  });

  it('isAction は z または space の justPressed で true', () => {
    const h = createInputHandler();
    expect(h.isAction()).toBe(false);
    h.handleKeyDown('z');
    expect(h.isAction()).toBe(true);
  });
});
```

> 注: `__tests__/core/input.test.ts` の既存 import に `createInputHandler` が含まれていれば重複 import にならないよう調整する（既存行に統合）。

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest input.test -t "ACTION_KEYS"`
Expected: FAIL（`ACTION_KEYS` / `isActionKey` が未エクスポート）

- [ ] **Step 3: input.ts に単一定義を追加し、isAction/jAct を委譲**

Modify `core/input.ts`。ファイル冒頭（`export interface InputHandler` の前）に追加:

```ts
/** アクションキー（拾う・攻撃・設置・開始などに使う）の唯一の定義 */
export const ACTION_KEYS = ['z', ' '] as const;

/** 指定キーがアクションキーかどうか */
export function isActionKey(key: string): boolean {
  return (ACTION_KEYS as readonly string[]).includes(key.toLowerCase());
}
```

`isAction()`（現状 `return justPressed('z') || justPressed(' ');`）を変更:

```ts
  function isAction(): boolean {
    return ACTION_KEYS.some((k) => justPressed(k));
  }
```

`createInputHelpers` 内の `jAct`（現状 `return J('z') || J(' ');`）を変更:

```ts
  function jAct(): boolean { return ACTION_KEYS.some((k) => J(k)); }
```

- [ ] **Step 4: テスト緑を確認**

Run: `npx jest input.test`
Expected: PASS

- [ ] **Step 5: 全体の型・テスト確認**

Run: `npm run typecheck && npm test -- keys-and-arms`
Expected: PASS（振る舞い不変。判定対象は従来どおり z/space）

- [ ] **Step 6: コミット**

```bash
git add src/features/keys-and-arms/core/input.ts src/features/keys-and-arms/__tests__/core/input.test.ts
git commit -m "refactor: KEYS & ARMS のアクションキー定義を単一化

- ACTION_KEYS / isActionKey を core/input.ts の唯一の定義にする
- isAction / jAct の重複した z/space 判定を ACTION_KEYS 参照に統一

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: (B-2) トランジション前進を core/transition.ts に抽出

**Files:**
- Create: `core/transition.ts`
- Modify: `core/hud.ts`
- Test: `__tests__/core/transition.test.ts`

- [ ] **Step 1: 失敗するテストを追加**

Create `__tests__/core/transition.test.ts`:

```ts
import { advanceTransition } from '../../core/transition';
import { TRANSITION_TOTAL, TRANSITION_MID } from '../../constants';
import { createTestEngine } from '../helpers/test-engine';

describe('advanceTransition', () => {
  it('残りカウントを1減らす', () => {
    const G = createTestEngine().G;
    G.transition = { t: TRANSITION_TOTAL, txt: '', fn: undefined, sub: '' };
    advanceTransition(G);
    expect(G.transition.t).toBe(TRANSITION_TOTAL - 1);
  });

  it('中点で登録コールバックを1回だけ実行する', () => {
    const G = createTestEngine().G;
    let calls = 0;
    G.transition = { t: TRANSITION_MID + 1, txt: '', fn: () => { calls++; }, sub: '' };
    advanceTransition(G); // t: MID+1 -> MID（中点でコールバック発火）
    expect(G.transition.t).toBe(TRANSITION_MID);
    expect(calls).toBe(1);
    advanceTransition(G); // t: MID -> MID-1（発火しない）
    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest transition.test`
Expected: FAIL（`core/transition` が存在しない）

- [ ] **Step 3: core/transition.ts を作成**

Create `core/transition.ts`:

```ts
/**
 * KEYS & ARMS — 画面トランジションの状態前進
 *
 * 残りカウントを進め、中点で登録コールバック（次ステージ init 等）を実行する。
 * 注: 本番では描画関数 drawTrans（render 経由・約60Hz）から呼ばれる。
 *     呼び出しタイミングは変更しないため、ここでは状態前進のみを担う。
 */
import type { GameState } from '../types';
import { TRANSITION_MID } from '../constants';

/** トランジションの状態を1ステップ進める */
export function advanceTransition(G: GameState): void {
  G.transition.t--;
  if (G.transition.t === TRANSITION_MID && G.transition.fn) G.transition.fn();
}
```

- [ ] **Step 4: hud.ts の drawTrans を共有ヘルパー利用に変更**

Modify `core/hud.ts`。冒頭の import に追加:

```ts
import { advanceTransition } from './transition';
```

`drawTrans()` の以下2行:

```ts
    G.transition.t--;
    if (G.transition.t === TRANSITION_MID && G.transition.fn) G.transition.fn();
```

を1行に置換:

```ts
    advanceTransition(G);
```

（`if (G.transition.t <= 0) return false;` ガードは残す。以降の `const p = ...` 描画ロジックは不変。）

`TRANSITION_MID` が hud.ts 内で他に使われていなければ import から外す（typecheck/lint が未使用を検出）。

- [ ] **Step 5: テスト緑を確認**

Run: `npx jest transition.test && npm run typecheck && npm test -- keys-and-arms`
Expected: PASS（drawTrans のタイミング・挙動は不変）

- [ ] **Step 6: コミット**

```bash
git add src/features/keys-and-arms/core/transition.ts src/features/keys-and-arms/core/hud.ts src/features/keys-and-arms/__tests__/core/transition.test.ts
git commit -m "refactor: KEYS & ARMS のトランジション前進を core/transition.ts に抽出

- drawTrans 内の状態前進（t-- と中点コールバック）を advanceTransition に切り出し
- 呼び出し位置（render 経由）は不変でタイミングを変えない

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: (B-1) gameTick を core/game-tick.ts に抽出

**Files:**
- Create: `core/game-tick.ts`
- Modify: `engine.ts:69-131`

- [ ] **Step 1: createGameTick を作成**

Create `core/game-tick.ts`（中身は現行 `engine.ts` の `gameTick` と論理的に同一。この時点では cheat ループはそのまま＝振る舞い不変）:

```ts
/**
 * KEYS & ARMS — ゲーム更新ティック（状態マシン）
 *
 * engine.ts と test-engine.ts の両方から共有利用する。
 * 描画は含まない（render は engine 側に残る）。
 */
import type { GameState } from '../types';
import type { HUDModule } from '../types/hud';
import type { AudioModule } from '../types/audio';
import type { StageNavigator } from '../types/stage-navigator';
import type { Stage } from '../types/stage';
import type { GameStorageRepository } from '../infrastructure/storage-repository';

/** gameTick が必要とする依存の束 */
export interface GameTickDeps {
  G: GameState;
  J: (key: string) => boolean;
  clearJustPressed: () => void;
  jAct: () => boolean;
  hud: HUDModule;
  audio: AudioModule;
  nav: StageNavigator;
  cave: Stage;
  prairie: Stage;
  boss: Stage;
  helpScreen: { update(): void };
  storage: GameStorageRepository;
}

/** ゲーム更新ティック（状態マシン）を生成する */
export function createGameTick(deps: GameTickDeps): () => void {
  const { G, J, clearJustPressed: clearJ, jAct, hud, audio, nav, cave, prairie, boss, helpScreen, storage } = deps;
  const isGameplay = () =>
    G.state !== 'title' && G.state !== 'over' && G.state !== 'trueEnd' && G.state !== 'ending1';

  return function gameTick(): void {
    G.tick++;
    if (G.beatPulse > 0) G.beatPulse--;

    // リセット確認
    if (G.resetConfirm > 0) {
      G.resetConfirm--;
      if (jAct()) {
        G.resetConfirm = 0; G.state = 'title'; G.blink = 0;
        if (G.score > G.hi) { G.hi = G.score; storage.setHighScore(G.hi); }
        clearJ(); return;
      }
      if (J('escape')) G.resetConfirm = 0;
      clearJ(); return;
    }

    // ポーズトグル（ゲームプレイ中のみ）
    if (J('p') && isGameplay() && G.state !== 'help') {
      G.paused = !G.paused;
      clearJ(); return;
    }

    // ポーズ中はティックスキップ
    if (G.paused) {
      if (J('escape')) { G.paused = false; G.resetConfirm = 90; }
      clearJ(); return;
    }

    // ESC でリセット確認
    if (J('escape') && isGameplay()) {
      G.resetConfirm = 90; clearJ(); return;
    }

    // ヒットストップ
    if (G.hitStop > 0) { G.hitStop--; clearJ(); return; }
    if (G.hurtFlash > 0) G.hurtFlash--;
    if (G.shakeT > 0) G.shakeT--;

    if (G.transition.t > 0) {
      if (isGameplay()) hud.doBeat();
    } else {
      let nb = false;
      if (isGameplay()) nb = hud.doBeat();
      switch (G.state) {
        case 'cave': cave.update(nb); break;
        case 'grass': prairie.update(nb); break;
        case 'boss': boss.update(nb); break;
        case 'title':
          for (const k of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
            if (J(k)) { G.cheatBuf += k; if (G.cheatBuf.length > 10) G.cheatBuf = G.cheatBuf.slice(-10); }
          }
          if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
          if (jAct() || J('enter')) { audio.S.start(); nav.startGame(); }
          break;
        case 'help': helpScreen.update(); break;
        case 'over': case 'trueEnd': case 'ending1': break;
      }
    }
    clearJ();
  };
}
```

- [ ] **Step 2: engine.ts を createGameTick 利用に変更**

Modify `engine.ts`。冒頭の import に追加:

```ts
import { createGameTick } from './core/game-tick';
```

`engine.ts:69` の `const isGameplay = () => ...;` 行を削除（createGameTick 内に移動済み）。

> 確認: `isGameplay` が `render()` で使われていないこと（`grep -n "isGameplay" engine.ts` で gameTick 定義以外にヒットが無いこと）。
> 万一 render で使っていたら、その行は残すこと。

`engine.ts:71-131` の `/* GAME TICK — 状態マシン */ function gameTick() { ... }` ブロック全体を削除し、
遅延バインド（`nav.boss = ...; nav.startGame = ...;` の直後）に以下を追加:

```ts
  const gameTick = createGameTick({
    G, J, clearJustPressed: clearJ, jAct,
    hud, audio, nav, cave, prairie, boss, helpScreen, storage,
  });
```

`frame()` 内の `gameTick()` 呼び出しはそのまま（ローカル `const gameTick` を参照）。

- [ ] **Step 3: 型・テスト確認**

Run: `npm run typecheck`
Expected: PASS（deps の型が揃う。不足キーがあればここで検出）

Run: `npm test -- keys-and-arms`
Expected: PASS（gameTick の中身は同一。振る舞い不変）

- [ ] **Step 4: コミット**

```bash
git add src/features/keys-and-arms/core/game-tick.ts src/features/keys-and-arms/engine.ts
git commit -m "refactor: KEYS & ARMS の gameTick を core/game-tick.ts に抽出

- engine.ts のクロージャ内 gameTick を createGameTick(deps) として切り出し
- engine は deps を組んで呼ぶだけにし、render は engine 側に残す

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: (B-3) test-engine を共有 gameTick で駆動

**Files:**
- Modify: `__tests__/helpers/test-engine.ts`

- [ ] **Step 1: test-engine が共有 gameTick と advanceTransition を使うよう変更**

Modify `__tests__/helpers/test-engine.ts`。

import に追加:

```ts
import { createGameTick } from '../../core/game-tick';
import { advanceTransition } from '../../core/transition';
```

クラスにフィールドを追加（`private readonly` 群の付近）:

```ts
  private readonly runTick: () => void;
```

コンストラクタの末尾（遅延バインド `this.nav.startGame = this.titleScreen.startGame;` の後）に追加:

```ts
    this.runTick = createGameTick({
      G: this.G,
      J: this.input.justPressed,
      clearJustPressed: this.input.clearJustPressed,
      jAct: this.input.isAction,
      hud: this.hud,
      audio,
      nav: this.nav,
      cave: this.cave,
      prairie: this.prairie,
      boss: this.boss,
      helpScreen: this.helpScreen,
      storage: this.storage,
    });
```

> 注: `audio` はコンストラクタ内のローカル `const audio = createNullAudioService();`。スコープ内なのでそのまま渡せる。

既存の手書き `gameTick()` メソッド全体（`gameTick(): void { ... }`、`G.tick++` から末尾の `clearJ();` まで）を、以下に置換:

```ts
  /** 1 ティック実行（描画スキップ）。本番 engine と同じ更新ロジックを共有する。 */
  gameTick(): void {
    this.runTick();
    // 本番では render（drawTrans）がトランジションを前進させるため、ここで同等処理を行う
    if (this.G.transition.t > 0) advanceTransition(this.G);
  }
```

- [ ] **Step 2: TRANSITION_MID 等の不要 import を整理**

`test-engine.ts` が `TRANSITION_MID` を直接使わなくなった場合（手書き gameTick 削除により）、その import を削除する。
typecheck / lint が未使用 import を検出する。

- [ ] **Step 3: 型・テスト確認**

Run: `npm run typecheck && npm test -- keys-and-arms`
Expected: PASS（test-engine が本番 gameTick を駆動。既存テストの収束 `while (transition.t > 0) gameTick()` は維持される）

> もし transition 関連の統合テストが落ちる場合、`gameTick()` の順序を確認:
> `runTick()`（t>0 時は doBeat のみ）→ その後 `advanceTransition`（t-- と中点 fn）の順であること。

- [ ] **Step 4: コミット**

```bash
git add src/features/keys-and-arms/__tests__/helpers/test-engine.ts
git commit -m "refactor: KEYS & ARMS の test-engine を共有 gameTick で駆動

- 手書きで再実装していた gameTick を廃止し createGameTick を利用
- トランジション前進は advanceTransition を共有利用
- 本番ループとの二重メンテとドリフトを解消

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: (C) z 衝突バグの根治

**Files:**
- Modify: `core/game-tick.ts`
- Modify: `__tests__/integration/god-mode.test.ts`

- [ ] **Step 1: god-mode テストの z 開始ケースを「発動する」に更新（失敗する）**

Modify `__tests__/integration/god-mode.test.ts`。
冒頭のファイル JSDoc から「既知の問題」の段落（`【既知の問題】開始キー 'z' は ...` のくだり）を、修正済みを反映した文に更新:

```ts
/**
 * KEYS & ARMS — GOD MODE（隠しチート）の挙動テスト
 *
 * タイトル画面で "jin" と入力してからゲームを開始すると、HP が 20 で始まる。
 * 開始キー（z / space / Enter）はいずれもチート文字として扱われないため、
 * どのキーで開始しても GOD MODE が発動する。
 * （screens/title.ts: cheatBuf.endsWith('jin') → hp = 20）
 */
```

`【既知の問題】"jin" 入力 → z 開始では発動しない` の it ブロックを、以下に置換:

```ts
  it('"jin" 入力 → z 開始でも HP が 20 で始まる（発動する）', () => {
    const engine = createTestEngine();
    typeCheat(engine, 'jin');

    startWith(engine, 'z');

    expect(engine.G.hp).toBe(20);
    expect(engine.G.maxHp).toBe(20);
  });
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx jest god-mode`
Expected: FAIL（`z` 開始ケースが HP 3 のまま → 期待 20 に対して失敗）

- [ ] **Step 3: cheat ループでアクションキーを除外**

Modify `core/game-tick.ts`。import に追加:

```ts
import { isActionKey } from './input';
```

title 節の cheat 蓄積ループを変更:

```ts
        case 'title':
          for (const k of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
            if (isActionKey(k)) continue; // 開始キー(z)はチート文字として扱わない
            if (J(k)) { G.cheatBuf += k; if (G.cheatBuf.length > 10) G.cheatBuf = G.cheatBuf.slice(-10); }
          }
          if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
          if (jAct() || J('enter')) { audio.S.start(); nav.startGame(); }
          break;
```

- [ ] **Step 4: テスト緑を確認**

Run: `npx jest god-mode`
Expected: PASS（z / space / Enter いずれの開始でも GOD MODE 発動。未入力/誤入力は HP 3）

- [ ] **Step 5: 全体テスト確認**

Run: `npm run typecheck && npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/keys-and-arms/core/game-tick.ts src/features/keys-and-arms/__tests__/integration/god-mode.test.ts
git commit -m "fix: KEYS & ARMS の GOD MODE が z 開始で発動しないバグを修正

- cheat 蓄積ループで isActionKey によりアクションキー(z)を除外
- z/space/Enter のいずれの開始でも GOD MODE が一律発動するようになる

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: README の「既知の問題」を解消済みに更新

**Files:**
- Modify: `src/features/keys-and-arms/README.md`

- [ ] **Step 1: 既知の問題セクションを修正済みに更新**

Modify `README.md`。「### GOD MODE が `z` 開始だと発動しない」の節を、解消済みである旨に書き換える:

```markdown
### （解消済み）GOD MODE が `z` 開始だと発動しなかった問題

以前は開始キー `z` が cheat 蓄積ループ（a〜z）に混入し、`z` 開始で `cheatBuf` が
`jinz` になって GOD MODE が発動しないバグがあった。
`core/game-tick.ts` の cheat 蓄積ループで `isActionKey` によりアクションキーを除外し、
**`z`/`space`/`Enter` のいずれの開始でも発動するように修正済み**
（`__tests__/integration/god-mode.test.ts` で検証）。
```

あわせて「デバッグ / 隠しコマンド（GOD MODE）」セクションの手順3を更新:

```markdown
3. **任意の開始キー（Z / スペース / Enter）** でゲームを開始すると、HP / 最大HP が `3` → `20` になる
```

- [ ] **Step 2: コミット**

```bash
git add src/features/keys-and-arms/README.md
git commit -m "docs: KEYS & ARMS の GOD MODE 既知の問題を解消済みに更新

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 最終検証

**Files:** なし（検証のみ）

- [ ] **Step 1: DRY 解消の自動チェック**

Run:
```bash
cd src/features/keys-and-arms
# gameTick の実装が1箇所だけであること（game-tick.ts のみ）
grep -rln "function gameTick\|createGameTick" . --include='*.ts'
# アクションキーの z/space リテラル直書きが input.ts の ACTION_KEYS だけであること
grep -rn "'z'.*' '\|justPressed('z')\|J('z')" . --include='*.ts' | grep -v __tests__
```
Expected:
- `createGameTick` の定義は `core/game-tick.ts` のみ、利用は engine.ts と test-engine.ts。`function gameTick` の手書き重複が無い。
- `isAction`/`jAct` 内に z/space のリテラル直書きが残っていない（ACTION_KEYS 経由）。

- [ ] **Step 2: フル CI**

Run: `npm run ci`
Expected: lint:ci + typecheck + test + build すべて PASS。

- [ ] **Step 3: 手動動作確認（任意）**

Run: `npm start` → `/keys-and-arms` を開き、
タイトルで `jin` 入力 → **Z** で開始 → HP が 20 で始まることを目視確認。
通常開始（チート無し）が HP 3 であること、ステージ遷移・ポーズ・リセットが従来どおり動くことも確認。

---

## 完了条件チェックリスト（設計書 §5 と対応）

- [ ] `ACTION_KEYS` が `core/input.ts` の唯一の定義で `isAction`/`jAct` 両方が参照（Task 1）
- [ ] `gameTick` の実装が `core/game-tick.ts` の1箇所、engine と test-engine が共有（Task 3, 4）
- [ ] `advanceTransition` が `core/transition.ts` の唯一の定義で drawTrans と test-engine が共有（Task 2, 4）
- [ ] `z`/`space`/`Enter` いずれの開始でも GOD MODE 発動（Task 5）
- [ ] `god-mode.test.ts` が本番ロジック経由で z 開始 GOD MODE を検証（Task 4, 5）
- [ ] `npm run ci` グリーン（Task 7）
- [ ] A・B により既存の他テスト結果は不変（C による変化は z 開始 GOD MODE のみ）
