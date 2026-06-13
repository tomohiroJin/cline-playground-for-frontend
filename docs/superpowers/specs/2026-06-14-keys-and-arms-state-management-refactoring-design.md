# KEYS & ARMS 状態管理リファクタリング 設計

- 日付: 2026-06-14
- 対象: `src/features/keys-and-arms/`
- 種別: リファクタリング（振る舞い不変）
- スコープ: A + B（StageNavigator 抽出 ＋ ステージ状態の所有権整理）

## 1. 背景と目的

KEYS & ARMS は Game & Watch 風アクションゲーム（元 HTML 2,522 行を React 移植）。
すでに Phase 2〜6 のリファクタリングを経ており、`core/` `stages/` `screens/`
`infrastructure/` `types/` に分割済み、テストも統合テストを含めて整備されている。

それでも残る最大の設計上の「におい」は **状態管理** にある:

1. **`GameState` が神オブジェクト** — 約 50 フィールドを単一の可変バッグに保持。
   画面制御・入力・トランジション・各ステージ状態・パーティクルプール 16 種・
   ステージ遷移用の関数レジストリが混在している。
2. **遅延バインドの可変関数ポインタ** — `G.cavInit` / `G.grsInit` / `G.bosInit` /
   `G.startGame` を後から代入。状態オブジェクトに「関数の入れ物」という異質な責務が混入。
3. **型の歪み** — 上記と空オブジェクト初期化（`cav: {}` 等）のために
   `UninitializedGameState` 型と `engine.ts:45` の `uninitG as GameState` キャストが必要。

本リファクタリングの目的は、**状態の所有権（ownership）と不変条件を明確化** し、
型の歪み（キャスト・Uninitialized 型）を根絶すること。振る舞いは一切変えない。

### 非目標（YAGNI）

- 各ステージクロージャへの完全な状態所有権逆転（アプローチ C）。
  blast radius が数百箇所に及ぶため、本タスクでは扱わない。将来別タスクで検討。
- レンダラーの分割やゲームロジックの変更。

## 2. 現状調査の要点

- 非テストコードでの `G.<field>` アクセスは **819 箇所**。全フィールド一括再構築は高リスク。
- パーティクル配列 16 種は各 **4〜5 箇所** のみのアクセスで、`cav*` / `grs*` / `bos*` の
  接頭辞でステージごとに綺麗に分離している → スライス移動は中程度の churn（~60 箇所）で可能。
- **`G.grsDust` はアクセス 0 件＝死蔵フィールド**。
- ステージ遷移レジストリ（`cavInit` 等）の呼び出しは **わずか 8 箇所**。
- 除去対象キャストは `engine.ts:45` の 1 箇所のみ（他の `as` 2 件は無害）。
- ステージ init は `G.cav = { ... }` の形で状態を完全再構築する → 初期状態ファクトリの抽出が自然。
- テスト側のパーティクル／レジストリ参照は約 30 箇所で追従可能。

## 3. 設計

### 3.1 (A) StageNavigator の導入

`GameState` から `cavInit` / `grsInit` / `bosInit` / `startGame` の 4 フィールドを取り除き、
単一責務オブジェクト `StageNavigator` に移す。`EngineContext` に `nav` として追加する。

```ts
// types/stage-navigator.ts（新規）
/** ステージ遷移ナビゲータ（遷移先ステージの init を保持する単一責務レジストリ） */
export interface StageNavigator {
  cave: () => void;
  prairie: () => void;
  boss: () => void;
  startGame: () => void;
}
```

- 遅延バインド自体は循環依存回避のため残すが、**`GameState` ではなく専用オブジェクトに隔離**する。
- バインド漏れを型で防ぐため、各メソッドは `| undefined` を許さない非オプショナル型にする
  （engine.ts でステージ生成直後に必ずバインドする）。
- 呼び出し側の置換:
  - `transTo('PRAIRIE', G.grsInit, ...)` → `transTo('PRAIRIE', nav.prairie, ...)`
  - `G.startGame?.()` → `nav.startGame()`（オプショナルチェーンの握りつぶしも解消）
- `hud.transTo(text, fn, sub)` のシグネチャは据え置き（引き続き `fn` を受ける）。

呼び出し箇所（計 8 箇所）:

| ファイル | 現状 | 変更後 |
|---|---|---|
| `screens/title.ts` | `transTo('CAVE', G.cavInit, ...)` | `transTo('CAVE', nav.cave, ...)` |
| `screens/ending.ts` | `transTo(..., G.cavInit, ...)` | `transTo(..., nav.cave, ...)` |
| `screens/true-end.ts` | `transTo(..., G.cavInit, ...)` | `transTo(..., nav.cave, ...)` |
| `screens/game-over.ts` | `G.startGame?.()` | `nav.startGame()` |
| `stages/boss/boss-logic.ts` | `transTo(..., G.cavInit, ...)` | `transTo(..., nav.cave, ...)` |
| `stages/cave/cave-logic.ts` | `transTo('PRAIRIE', G.grsInit, ...)` | `transTo('PRAIRIE', nav.prairie, ...)` |
| `stages/prairie/prairie-logic.ts` | `transTo('CASTLE', G.bosInit, ...)` | `transTo('CASTLE', nav.boss, ...)` |
| `engine.ts` | `G.cavInit = cave.init; ...` | `nav` を構築して `ctx` に注入 |

### 3.2 (B) ステージ状態の所有権整理

- **パーティクルプールのスライス移動**: 16 種のトップレベル配列を各ステージ state スライスへ移す。
  接頭辞を剥がしてスライス内に収める。

  | 現状（トップレベル） | 移動後 |
  |---|---|
  | `G.sparks` `G.dust` `G.feathers` `G.smoke` `G.stepDust` `G.keySpk` `G.cavDrips` | `G.cav.*`（`sparks` `dust` `feathers` `smoke` `stepDust` `keySpk` `drips`） |
  | `G.grsSlash` `G.grsDead` `G.grsGrass` `G.grsLaneFlash` `G.grsMiss` | `G.grs.*`（`slash` `dead` `grass` `laneFlash` `miss`） |
  | `G.bosParticles` `G.bosShieldBreak` `G.bosArmTrail` | `G.bos.*`（`particles` `shieldBreak` `armTrail`） |

- **トランジション集約**: `trT` / `trTxt` / `trFn` / `trSub` を `G.transition`
  （`{ t: number; txt: string; fn: (() => void) | undefined; sub: string }`）にまとめる。
- **死蔵削除**: `grsDust` を型・初期化・参照から削除。
- **完全初期状態の付与**: `cav` / `grs` / `bos` に空オブジェクト（`{}`）ではなく
  完全な初期状態を与える初期化ファクトリ（`createInitialCaveState()` /
  `createInitialPrairieState()` / `createInitialBossState()`）を用意する。
  これにより `UninitializedGameState` 型と `uninitG as GameState` キャストを完全廃止する。

### 3.3 不変条件・エラー処理

- 既存ステージ init の `assert`（DbC の事前条件、例: `cavInit: loop must be >= 1`）は維持。
- `StageNavigator` のバインド漏れは型（非オプショナル）で防止し、
  従来 `| undefined` だった遅延バインドの曖昧さを型レベルで解消する。

## 4. ビルド順序（各ステップでテスト緑を維持）

`refactor-safely` の原則に従い、既存テストを安全網として小さなステップで進める。
各ステップ完了時に `npm test` + `npm run typecheck` をグリーンに保ち、ステップ単位でコミットする。

1. **StageNavigator 抽出（A）**
   1. `types/stage-navigator.ts` を追加し `EngineContext` に `nav` を追加
   2. engine.ts で `nav` を生成・バインドし `ctx` に含める
   3. 呼び出し側 8 箇所を `G.*Init` → `nav.*` に置換
   4. `GameState` 型と初期化ファクトリから 4 フィールドを削除
   5. テスト緑を確認 → コミット（`refactor:`）
2. **死蔵削除（B-0）**: `grsDust` を削除 → 緑確認 → コミット
3. **パーティクルプールのスライス移動（B-1）**: ステージ単位（cave → prairie → boss）で実施。
   各ステージ＝1 コミット。型移動 → 初期化ファクトリ作成 → 参照置換 → 緑確認 → コミット
4. **トランジション集約（B-2）**: `trT/trTxt/trFn/trSub` → `G.transition.*` → 緑確認 → コミット
5. **Uninitialized 型・キャスト廃止（B-3）**: `cav/grs/bos` を完全初期状態で生成、
   `UninitializedGameState` 削除、`engine.ts` のキャスト除去 → 緑確認 → コミット

## 5. テスト戦略

- 既存テスト（統合テスト含む）を安全網として全ステップで実行。
- `mock-factories` / `test-state-builder` のパーティクル参照（~30 箇所）は各ステップで追従更新。
- 構造変更のみで **振る舞いは不変** のため、新規テストは原則不要。
- ただし初期状態ファクトリ（`createInitial*State()`）には
  「全フィールドが定義済みであること」を保証する軽いテストを追加する。

## 6. 完了条件

- [ ] `GameState` から遷移レジストリ 4 フィールドが消え、`StageNavigator` に隔離されている
- [ ] 16 種のパーティクルプールが各ステージ state スライスに収まっている
- [ ] トランジション 4 フィールドが `G.transition` に集約されている
- [ ] 死蔵 `grsDust` が削除されている
- [ ] `UninitializedGameState` 型と `uninitG as GameState` キャストが存在しない
- [ ] `npm run ci`（lint:ci + typecheck + test + build）がグリーン
- [ ] ゲームの振る舞いに変化がない（既存テストで担保）
