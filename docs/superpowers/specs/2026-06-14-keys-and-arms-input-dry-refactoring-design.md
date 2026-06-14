# KEYS & ARMS 入力処理の DRY 解消 設計

- 日付: 2026-06-14
- 対象: `src/features/keys-and-arms/`
- 種別: リファクタリング（A・B は振る舞い不変、C のみ意図的な挙動変更）
- 前提 PR: #116（状態管理リファクタリング）— 本作業はその後続

## 1. 背景と目的

状態管理リファクタリング（PR #116）の調査過程で、GOD MODE（隠しコマンド `jin`）が
`z` 開始では発動しない既存バグが判明した。その根本原因をたどると、入力処理まわりに
DRY 違反が複数存在することが分かった。

| # | DRY 違反 | 場所 |
|---|---------|------|
| A | アクションキー定義（`z`/`space`）の二重化 | `core/input.ts` の `isAction()` と `createInputHelpers().jAct()` |
| B | `gameTick` 丸ごとの重複（テストが本番ループを再実装） | `engine.ts` の `gameTick` vs `__tests__/helpers/test-engine.ts` の `gameTick` |
| C | 「アクションキー」の単一の真実が無いため、cheat 蓄積ループが開始キーを除外できない（バグの構造的原因） | 同上 |

本作業の目的:

1. **A**: アクションキー集合の定義を単一の真実に統一する（振る舞い不変）。
2. **B**: `gameTick` の重複を解消し、テストが本番ループを駆動するようにする（振る舞い不変）。
   これにより今回のようなロジックの静かなドリフトが構造的に起こり得なくなる。
3. **C**: A の単一定義を使って `z` 衝突バグを根治し、GOD MODE を `z`/`space`/`Enter` で
   一律に発動させる（**意図的な挙動変更**）。

### 非目標（YAGNI）

- 「描画関数（`drawTrans`）が状態を変更している」という設計上の歪みの根治。
  トランジション前進を update（gameTick, 30Hz）側へ移すと、現在 render（≈60Hz）で
  前進している分が約2倍に伸び、**トランジション時間が変わってしまう**ため扱わない。
  本作業では「前進処理を共有ヘルパー化して重複だけ消す」に留め、呼び出し位置（render）は変えない。
- 入力以外の領域のリファクタリング。

## 2. 現状調査の要点

- アクションキー判定は2箇所に独立定義: `input.ts:39` `isAction()`（`justPressed('z')||justPressed(' ')`）、
  `input.ts` `createInputHelpers().jAct()`（`J('z')||J(' ')`）。後者は game-over / ending /
  true-end / boss-logic / cave-logic の5ファイルで利用。
- `gameTick` は `engine.ts`（本番）と `test-engine.ts`（テスト）に**別々に実装**されている。
- トランジションの状態前進（`G.transition.t--` と中点での `fn()` 実行）は
  `core/hud.ts` の `drawTrans()` 内にあり、`render()` から呼ばれる。
- タイミング: `TICK_RATE = 30`（gameTick は 30Hz）、`render()` は rAF（≈60Hz）。
  `TRANSITION_TOTAL = 56`、`TRANSITION_MID = 28`。
- GOD MODE 判定: `screens/title.ts`（`cheatBuf.endsWith('jin')` → `hp = cheat ? 20 : 3`）。
  cheat 蓄積は `engine.ts` の title 節（a〜z のキー入力を `G.cheatBuf` へ）。
- z 衝突: 開始キー `z` が a〜z 蓄積ループに含まれるため、`z` 開始時に
  `cheatBuf` が `jin` → `jinz` になり `endsWith('jin')` が false。

## 3. 設計

### 3.1 (A) アクションキーの単一の真実【振る舞い不変】

`core/input.ts` にアクションキー集合の唯一の定義と判定述語を置く。

```ts
/** アクションキー（拾う・攻撃・設置・開始などに使う） */
export const ACTION_KEYS = ['z', ' '] as const;

/** 指定キーがアクションキーかどうか */
export function isActionKey(key: string): boolean {
  return (ACTION_KEYS as readonly string[]).includes(key.toLowerCase());
}
```

- `InputHandler.isAction()` → `return ACTION_KEYS.some((k) => justPressed(k));`
- `createInputHelpers().jAct()` → `return ACTION_KEYS.some((k) => J(k));`

両者が `ACTION_KEYS` を参照する。判定対象は従来どおり `z`/`space` で、動作は完全同一。

### 3.2 (B) gameTick 重複の解消【振る舞い不変】

**(B-1) gameTick の抽出**

`engine.ts` の `gameTick` を `core/game-tick.ts` の `createGameTick(deps)` に切り出す。
`deps` は現状クロージャが参照している依存をまとめたもの:

```ts
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
  titleScreen: { startGame(): void };
  helpScreen: { update(): void };
}

/** ゲーム更新ティック（状態マシン）を生成する */
export function createGameTick(deps: GameTickDeps): () => void { /* ... */ }
```

- `engine.ts` は deps を組み立て `const gameTick = createGameTick(deps)` を呼ぶだけにする。
  `render()` は engine 側に残す（描画は実 Canvas 依存のため）。
- 抽出後の gameTick の中身は現行 `engine.ts:68-127` と論理的に同一（title 節の cheat 蓄積を含む）。

**(B-2) トランジション前進の共有化**

`drawTrans()` 内の状態前進部分を `core/transition.ts` に切り出す。

```ts
import type { GameState } from '../types';
import { TRANSITION_MID } from '../constants';

/**
 * トランジションの状態を1ステップ進める。
 * 残りカウントを減らし、中点で登録コールバック（次ステージ init 等）を実行する。
 * 注: 本番では render（≈60Hz）から呼ばれるため、呼び出し位置は変更しない。
 */
export function advanceTransition(G: GameState): void {
  G.transition.t--;
  if (G.transition.t === TRANSITION_MID && G.transition.fn) G.transition.fn();
}
```

- `core/hud.ts` の `drawTrans()` は冒頭ガード（`if (G.transition.t <= 0) return false;`）の後に
  `advanceTransition(G)` を呼び、以降は従来どおり `G.transition.t` を読んで描画する。
  **呼び出しタイミング（render 経由・≈60Hz）は不変。**

**(B-3) test-engine の本番駆動化**

`__tests__/helpers/test-engine.ts` の手書き `gameTick` を廃止し、`createGameTick(deps)` を利用する。
トランジション消化は `advanceTransition(G)` を呼ぶ。

- test-engine の `gameTick()` メソッド: `this.runTick()`（= 共有 gameTick）を呼び、
  トランジション活性時は `advanceTransition(this.G)` を呼ぶ（本番が render で前進するのを模す）。
  既存テストの `while (G.transition.t > 0) gameTick()` 収束を維持する。
- これにより gameTick の二重メンテナンスが消滅し、テストが本番ロジックを直接検証する。

### 3.3 (C) z 衝突バグの根治【意図的な挙動変更】

抽出後の gameTick の title 節の cheat 蓄積ループで、A の `isActionKey` を使って
アクションキーを除外する。

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

→ `z` 開始時も `cheatBuf` は `jin` のまま保たれ、GOD MODE が `z`/`space`/`Enter` で一律に発動する。

トレードオフ: 将来のチートコードに `z` を含められない（現行 `jin` は無関係）。
これは「`z` はアクションキーであり、チート入力文字ではない」という設計判断として受容する。

## 4. テスト戦略

- **A・B は振る舞い不変** → 既存205テストが全グリーンであることが第一の安全網。
- **B により GOD MODE テストは本番 `gameTick` を直接検証**するようになる（再実装ドリフトの解消）。
- `__tests__/integration/god-mode.test.ts` を更新:
  - 「`z` 開始でも HP 20」に期待値を変更（C のバグ修正を固定）。
  - space/Enter 開始で HP 20、未入力/誤入力で HP 3 は据え置き。
- A 用に軽い単体テストを追加: `isActionKey('z')`/`isActionKey(' ')` が true、その他が false。
  `isAction()` と `jAct()` が同一キー集合で一致することを検証。
- `core/transition.ts` の `advanceTransition` に単体テストを追加:
  中点で `fn` が1回だけ呼ばれ、`t` が1減ること。

## 5. 完了条件

- [ ] `ACTION_KEYS` が `core/input.ts` の唯一の定義で、`isAction`/`jAct` が両方参照している
- [ ] `gameTick` の実装が1箇所（`core/game-tick.ts`）に集約され、`engine.ts` と
      `test-engine.ts` の両方がそれを使用している（重複実装が無い）
- [ ] `advanceTransition` が `core/transition.ts` の唯一の定義で、`drawTrans` と
      test-engine が共有利用している
- [ ] `z`/`space`/`Enter` のいずれの開始でも GOD MODE が発動する
- [ ] `god-mode.test.ts` が本番ロジック経由で z 開始 GOD MODE を検証している
- [ ] `npm run ci`（lint:ci + typecheck + test + build）グリーン
- [ ] A・B により既存の他テストの結果は不変（C による変化は z 開始 GOD MODE のみ）
