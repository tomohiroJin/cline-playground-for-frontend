# 灰燼の城壁 反復7 段階2 — 新敵2種と、それを画面で読めるようにする 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 段階1 の試遊で出た3件（盤面と手札が動く・道が見分けられない・途中でやめた遠征が記録に残らない）を先に直し、盾衛（装甲）・癒し手（回復）を暫定ステージに出し、装甲・回復・オーラの実効値・能力表示・敵の射程を画面で読めるようにする。

**Architecture:** ドメインは設計書 §4.2 の順序（`applyDamage` の一本化 → 回復を罠より前 → `attackersFor` のブロック優先）で `domain/combat/` に入れる。表示は `presentation/` の既存部品（`combat-effects` / `BoardEffectLayer` / `board-plates` / `InspectPanel` / `BoardGrid`）を拡張し、一時表示はすべて**高さを予約した枠**へ移す。途中でやめた遠征の検出は `application/use-cases/` の純粋関数とユースケースに置き、`useExpedition` が次の遠征の開始時に1回だけ呼ぶ。

**Tech Stack:** React 19 + TypeScript + styled-components / Jest 30 + @testing-library/react / Playwright 1.58

**Spec:** `docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-design.md`（§2・§3.7・§3.8・§4.0〜§4.4・§7・§7.1）

## Global Constraints

- 作業ディレクトリ: `/workspaces/claym/local/cline-playground-for-frontend`。対象は `src/features/ashen-rampart/`（以下 `F/` と略す）
- ブランチ: `feature/ashen-rampart-iteration7-stage2`（段階1 の PR ブランチ `feature/ashen-rampart-iteration7-stage1` の先端 `a6496aa6` から切ってある）。**PR #211（段階1）はまだマージされていない。** PR は #211 がマージ済みなら `main` 向け、未マージなら `feature/ashen-rampart-iteration7-stage1` 向けに積む（Task 13）。`main` へ直接コミットしない。ブランチを切り替えない
- `any` 禁止（`unknown` + 型ガード）。`dangerouslySetInnerHTML` 禁止。**他の `features/*` を import しない**（`features/primal-path` のコントラスト計算も使わない）
- コメント・テスト名は日本語。相対 import の `../` は2階層まで
- マジックナンバーは名前付き定数へ。関数は30行・引数3個を目安（超えるならオブジェクト引数）。コンポーネントは200行を目安
- `presentation/` から副作用・複数ドメイン操作の組み立ては `application/use-cases/` 経由で呼ぶ。`domain/` の純粋関数・値・型は直接 import してよい
- コミットは Conventional Commits（`feat(ashen-rampart): …` 等）、本文は日本語。**すべてのコミットの最終行は必ず次の1行ちょうどにする**:
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
  **自分のモデル名（Haiku 等）に書き換えてはいけない。** 過去に実装者が自分のモデル名へ置き換えた事故がある。コミットは必ず `git commit -F - <<'EOF' … EOF` の形で、上の行をそのまま末尾に書く
- **重いテストはコントローラだけが回す**: `npm test` / `npm run ci` / `domain/combat` 全体 / `domain/combat/balance.test.ts` / `AshenRampartGame.test.tsx` 全体 / `application/simulation` / すべての `*.manual.test.ts` / Playwright。**実装者は自分のタスクのテストファイルだけを `npx jest <パス>` で回し、`npm run typecheck`（約1分）を回す。** `useAshenRampartGame.test.ts`（1363行）は `-t` で絞って回す
- E2E はビルド済み dist で回す（dev server の初回コンパイルは `goto` の待ち時間を超える。`/opt` のブラウザは版が合わない）:
  `npm run build && CI=1 PLAYWRIGHT_BROWSERS_PATH=/tmp/claude-1000/-workspaces-claym-local-cline-playground-for-frontend/02a5ce9d-b9a5-4fb1-9299-820031e00606/scratchpad/pw npx playwright test e2e/ashen-rampart --project=chromium`
- 段階1 の教訓（設計書 §3.7）:
  - 統合テストでは層1 を無配置で突破できない（シード 1〜500 に無配置で勝てるものが無い）。**ステージをまたぐ検査は `ExpeditionView.test.tsx`（`StageView` をスタブ化）で行う**
  - シードに依存する計測は**最悪ケースのシードに固定する**（偶然 pass させない）
  - 判定用ログは**ちょうど1回**記録する（`recordOnce` の形）。**状態更新関数（`setX((cur) => …)` の中）で記録しない**
- `PLAINS_MAP` / `PLAINS_WAVES` は凍結（`plains-fixture.test.ts` が守る）。新敵は暫定ステージにだけ出す
- `StageDefinition.demands` は段階2 ではまだ残す（段階3 で削除）。**値を変えない**
- 徴発の UI 経路（`LevyChoice.tsx` / `chooseLevy` / `rejection-text.ts`）は触らない（設計書 §3.5）

## 計画で下した判断

設計書が決めていない点を、この計画で次のように決めた。各タスクにも同じ判断を1行で書いてある。

1. **放棄の検出の置き場所** — `F/application/use-cases/record-abandoned-expeditions.ts` に純粋関数 `findAbandonedExpeditions` とユースケース `recordAbandonedExpeditions` を置く（`PlayLogExport` の型は `application/ports/` にあり `domain/` からは import できない。`presentation/` の副作用はユースケース経由という層の規則に合う）
2. **`lastStageIndex` の定義** — その遠征で最後に記録された `stage_started.stageIndex`。ステージを1つも始めていなければ **`-1`**（`NO_STAGE_STARTED`）。フィールドは省略しない（判定の集計で「未開始」と「欠損」を区別するため）
3. **放棄の走査から除くもの** — 今回の遠征自身（StrictMode の再マウントで自分を放棄扱いにしないため）と、既に `expedition_abandoned` がある遠征（走査を二度しても二重にならない）
4. **経路の色** — 経路 `#7d6d58`（経路外 `#211c19` に対し 3.37:1）＋縁 `#a39076`。経路外は据え置き。経路が明るくなって敵マーカーとの差が縮むので、敵マーカーを背景色で1px縁取る
5. **射程の色調** — 経路外セルに `dangerText` の細い斜線（2px／周期8px）を重ねる。塗りの色ではなく**模様**にする（塗りで経路外と区別すると経路との 3:1 が崩れる。模様なら両立する）。経路セルには付けない
6. **置けるセルの縁取り** — 琥珀の縁取り（`opportunity`）の内側に暗色（`dominant`）の4pxの縁を敷く。経路を明るくすると琥珀と経路の比が 2.3:1 に落ちるため
7. **高さを予約した枠** — `RunStatusBar` を3行固定のグリッド（44／40／32px）に、手札の上の通知を2行固定（40px）の `HandNoticeSlot` に、盤面の下の拒否理由と能力表示を60px固定の `BoardInfoSlot` に移す。能力表示が閉じているときはその行に導線（「置いた札をタップすると能力を表示」）を出す
8. **`StageView` の `Center` から `flex: 1` を外す** — 70vh より中身が少ないとき、手札が伸びた分だけ手札の上端が上がる経路を構造的に消す
9. **手札の通知が3つ同時に出たら** — 優先順（溢れて失った > 溢れそう > マナ不足）の上位2つだけを出す。溢れそうの文言は360px で1行に収まるよう「手札がいっぱい。次のドローであふれてライフ-1」に縮める
10. **徴発の選択（`LevyChoice`）は盤面の上に残す** — 徴発は構築・獲得の両プールから外れており（`availability: 'retired'`）遠征では描画されない。設計書 §3.5 により触らない
11. **`applyDamage` の命中は装甲を必須の値として持つ** — `hitOn(enemy, raw, source)` が敵定義から装甲を埋める（呼び出し側が装甲を渡し忘れる経路を作らない）。`raw <= 0` は何もしない（罠の `damage > 0` ガードを吸収する）
12. **貫通にも飛行の判定を入れる**（PR #201 minor #6）— 範囲攻撃と同じ `canTowerHit`（`hitsFlying` が偽なら飛行に当たらない）。現行の札では徹甲弩が `hitsFlying: true` なので挙動は変わらない。`anti-air` のノックアウト変種の徹甲弩（`hitsFlying: false`）で初めて差が出る＝**測定道具の欠陥が直る**
13. **装甲の命中は毎回 `armor-hit` イベントを積む**（軽減0 の命中も含む）。表示（§4.3 #1）の材料
14. **設計書に無い初期値** — 盾衛 `attackIntervalTicks: 30`（重装と同じ）、癒し手 `attack: 1` / `attackIntervalTicks: 20`（壁の前で何もできず膠着しないように。鴉の `attack` と同じ理由）。どちらも `flying: false`
15. **回復の細則** — 自分は回復しない。複数の癒し手は重ねてかかる。間隔は `tick % intervalTicks === 0`（敵の攻撃と同じ方式。敵に状態を増やさない）。飛行の敵も回復する。実際に戻した量が0なら何も積まない
16. **「重装は最も硬く最も遅い」** — HP の最大は重装のまま（盾衛45 < 60）、速度は盾衛と同じ 0.06 で「最も遅い」を共有する。**盾衛の硬さは HP ではなく装甲で表す**ことを別のテストで固定する
17. **射程とレーンの不変条件** — 「射程を持つ敵は北レーンにしか出ない」は、凍結台本＋暫定ステージの和集合で「北以外に出ない」（部分集合）へ書き換え、雑兵・重装が凍結台本の北に出ることは別の検査で残す。「射程0 の敵は南」は凍結台本だけの性格分けとして変えない（癒し手は北にも出す）
18. **暫定ステージへの配置** — 層1 は変えない。層2-a（石切場）に盾衛（北）、層2-b（鴉の谷）に癒し手（南・鴉と一緒）、層3 の2本とも盾衛＋癒し手（北）。層2 に届いた遠征は必ず新敵に1種以上、層3 では両方に出会う
19. **`attackersFor`** — 自分をブロックしている敵を進行度順に先に取り、残りの枠を射程攻撃者（進行度順）で埋める。**`balance.test.ts` の不変条件が赤くなったら閾値を動かさず、コントローラが止めてユーザーに報告する。** `it.failing`（支配デッキ）が赤くなったら設計書 §6.5 に従い「直った」と読み、`it` へ戻す
20. **装甲の軽減表示** — 敵の頭上に SVG の文字 `-N (装甲M)`。**回復** — 癒し手から対象への緑の線と対象の上の `+N`（色だけに頼らない）。緑は `COLORS.heal`（敵の HP バーと同じ `#7fb069`）として `theme.ts` に足す。どちらも動きを付けない（`prefers-reduced-motion` でも見え方が同じ。寿命は `combat-effects` が既存の規則で揃える）
21. **オーラの実効値** — 盤面外の `BoardInfoSlot` の能力表示に `攻撃5（素4）`・`支援で攻撃+1`・`射程2.2（素1.6）`・`高台で攻撃×1.3` の形で出す。`buildPlates(state, map?)` の `map` は省略可にし（既存の33呼び出しを壊さない）、本番の呼び出しは必ず渡す。射程リングも実効射程で描く
22. **能力表示の導線** — **カード選択中に設置物のあるセルをタップすると能力表示を開く**（選択は保つ。配置も再点火もしない）。占有セルにはもともと置けない（`canPlaceAt`）ので失う操作は無い。`inspect_opened` に `duringCardSelection: boolean` を足す。敵の能力は凡例（`EnemyLegend`）に `装甲4`・`回復3（4秒ごと・周囲1.5）` と説明文で出す
23. **敵の射程の静的計算** — `F/domain/combat/enemy-reach.ts`。台本に出る「射程 > 0 かつ飛行でない」敵のレーンごとの最大射程で、経路の線分からの距離が射程以内の経路外セルを返す。**置けるセルがある間（カード選択中）だけ**盤面に出す。貫通と共有する `distanceToSegment` は `geometry.ts` へ移す
24. **E2E の測り方** — 文書座標（`getBoundingClientRect().top + scrollY`）で測る（クリック時の自動スクロールを打ち消す）。最悪ケースのシード `748559145` に固定し、札の選択・拒否・配置・能力表示を操作で起こしてから30秒観測する

## Review Focus

1. **StrictMode の再マウントで今回の遠征を放棄と記録する**— 1回目の effect の後に今回の `expedition_started` が記録され、2回目の走査で自分自身が「決着の無い遠征」に見える。今回の遠征は決して `expedition_abandoned` にならないこと → Task 1 の StrictMode テスト
2. **1 tick に複数の命中が同じ盾衛に当たる**— 装甲は合計ではなく1ヒットごとに引く（弓兵2基の 4+4 は 8−4=4 ではなく 0+0）→ Task 5 のテスト
3. **カード選択中に再点火可能な燠火をタップする**— 再点火せず能力表示が開き、選択は保たれ、`reactivated` は記録されないこと → Task 11 のテスト
4. **満タンの敵・自分自身・射程外への回復**— 回復イベントも HP の変化も出ないこと（満タンの敵が同じ tick に削られたとき、回復が先に入って「削られた後に戻る」ことが無い）→ Task 6 のテスト
5. **拒否理由と能力表示と溢れ通知が同時に出る**— 盤面の下と手札の上の枠が同じ高さのまま両方を収めること → Task 3 の `BoardInfoSlot` / `HandNoticeSlot` のテストと E2E

---

## ファイル構成

| ファイル | 種別 | 責務 |
|---|---|---|
| `F/application/ports/play-log-port.ts` | 変更 | `expedition_abandoned`、`inspect_opened.duringCardSelection` |
| `F/application/use-cases/record-abandoned-expeditions.ts` | 新設 | 決着の無い遠征の検出（純粋）と記録（ユースケース） |
| `F/presentation/useExpedition.ts` | 変更 | 次の遠征の開始時に放棄を1回だけ記録 |
| `F/presentation/contrast.ts` | 新設 | WCAG のコントラスト比（純粋） |
| `F/presentation/board-colors.ts` | 新設 | 盤面セルの色の名前付き定数と背景の組み立て |
| `F/presentation/BoardGrid.tsx` | 変更 | 経路の色・縁・置けるセルの暗い縁・射程の斜線 |
| `F/presentation/EnemyMarker.tsx` | 変更 | 敵マーカーの縁取り |
| `F/presentation/layout-constants.ts` | 変更 | 予約する枠の高さ |
| `F/presentation/RunStatusBar.tsx` | 変更 | 3行固定のグリッド |
| `F/presentation/HandNoticeSlot.tsx` | 新設 | 手札の上の通知（2行固定） |
| `F/presentation/HandArea.tsx` | 変更 | 通知を `HandNoticeSlot` へ移す |
| `F/presentation/BoardInfoSlot.tsx` | 新設 | 盤面の下の拒否理由と能力表示（60px固定） |
| `F/presentation/InspectPanel.tsx` | 変更 | 1行固定・横スクロール、実効値のチップ |
| `F/presentation/StageView.tsx` | 変更 | 枠の結線、`board-wrapper` の testid |
| `F/domain/combat/damage.ts` | 新設 | `applyDamage` と装甲・撃破源の規則 |
| `F/domain/combat/step-tick.ts` | 変更 | 5経路を `applyDamage` へ、回復の呼び出し、`towerDamageBreakdown` |
| `F/domain/combat/combat-state.ts` | 変更 | `armor-hit` / `enemy-healed` イベント、撃破源の契約コメント |
| `F/domain/combat/enemies.ts` | 変更 | `armor` / `heal`、盾衛・癒し手、コメントの誤記 |
| `F/domain/combat/enemy-heal.ts` | 新設 | 癒し手の回復 |
| `F/domain/combat/blocking.ts` | 変更 | `attackersFor` のブロック優先 |
| `F/domain/combat/geometry.ts` | 新設 | `distanceToSegment`（貫通と射程の計算で共有） |
| `F/domain/combat/enemy-reach.ts` | 新設 | 敵の射程が届く経路外セル |
| `F/domain/expedition/stage-pool.ts` | 変更 | 暫定ステージに新敵を出す |
| `F/presentation/enemy-visual.ts` | 変更 | 盾衛・癒し手の見た目、`HP_BAR_COLOR = COLORS.heal` |
| `F/presentation/theme.ts` | 変更 | `COLORS.heal` |
| `F/presentation/EnemyLegend.tsx` | 変更 | 装甲・回復の表記と説明 |
| `F/presentation/combat-effects.ts` | 変更 | `armor` / `heal` エフェクト |
| `F/presentation/EnemyEffectMarks.tsx` | 新設 | 装甲の文字・回復の線の描画 |
| `F/presentation/BoardEffectLayer.tsx` | 変更 | 上の2種を描く |
| `F/presentation/board-plates.ts` | 変更 | `buildPlates(state, map?)` と実効値 |
| `F/presentation/RangeOverlay.tsx` | 変更 | 実効射程でリングを描く |
| `F/presentation/useAshenRampartGame.ts` | 変更 | 選択中の能力表示、射程セル、`buildPlates` に `map` |
| `e2e/ashen-rampart/layout-stability.spec.ts` | 新設 | 戦闘中の盤面と手札の上端の不動（2幅） |

---

### Task 0: ブランチと土台を確かめる

- [ ] **Step 1: ブランチと基点を確かめる**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
git branch --show-current
git merge-base --is-ancestor a6496aa6 HEAD && echo "段階1 の先端を含む"
git status --short
```

Expected: `feature/ashen-rampart-iteration7-stage2`・`段階1 の先端を含む`・作業ツリーが空。**違っていたら作業を始めずコントローラに報告する**（ブランチを切り替えない）。

- [ ] **Step 2: PR #211 の状態を控える（Task 13 で PR の向き先に使う）**

Run: `gh pr view 211 --json state,baseRefName --jq '.state + " " + .baseRefName'`
Expected: `OPEN main` か `MERGED main`。結果をコントローラの台帳に書く。

---

### Task 1: 途中でやめた遠征を記録する（設計書 §4.0 c）

**Files:**
- Modify: `F/application/ports/play-log-port.ts`（`expedition_note` の直後）
- Create: `F/application/use-cases/record-abandoned-expeditions.ts`
- Test: `F/application/use-cases/record-abandoned-expeditions.test.ts`（新設）
- Modify: `F/presentation/useExpedition.ts:20-28, 62-82`
- Test: `F/presentation/useExpedition.test.tsx:21-50`（テスト用ログの差し替え）と末尾に追記

**Interfaces:**
- Consumes: `PlayLogPort` / `PlayLogEvent` / `PlayLogEventBody`（`play-log-port.ts`）
- Produces:
  - `PlayLogEventBody` に `{ kind: 'expedition_abandoned'; expeditionId: string; lastStageIndex: number }`
  - `NO_STAGE_STARTED = -1`
  - `interface AbandonedExpedition { expeditionId: string; lastStageIndex: number }`
  - `findAbandonedExpeditions(events: readonly PlayLogEvent[], currentExpeditionId: string): AbandonedExpedition[]`
  - `recordAbandonedExpeditions(log: PlayLogPort, currentExpeditionId: string): AbandonedExpedition[]`

判断: 検出は `application/use-cases/` に置く（`PlayLogExport` の型は `application/ports/` にあり、`domain/` から import できないため）。
判断: `lastStageIndex` はステージ未開始なら `-1`（省略しない）。
判断: 今回の遠征と、既に `expedition_abandoned` がある遠征は走査から除く（StrictMode と二重走査の対策）。

- [ ] **Step 1: イベント型を足す**

`play-log-port.ts` の `| { kind: 'expedition_note'; expeditionId: string; text: string }` の直後に足す:

```ts
  /**
   * 途中でやめた遠征（反復7 段階2・設計書 §4.0 c）
   *
   * ホームへ戻る・再読み込みで遠征が消えても、その場では何も記録できない
   * （アンマウント時の記録は StrictMode の二重実行で誤発火する）。そこで
   * **次の遠征を始めるとき**に、決着の無い遠征をこのイベントで閉じる。
   * `lastStageIndex` は最後に始めたステージ番号。1つも始めていなければ -1。
   * 判定では、この遠征を3遠征にも各項目の分母にも数えない（設計書 §2）。
   */
  | { kind: 'expedition_abandoned'; expeditionId: string; lastStageIndex: number }
```

- [ ] **Step 2: 失敗するテストを書く**

`F/application/use-cases/record-abandoned-expeditions.test.ts`:

```ts
/**
 * 途中でやめた遠征の検出と記録（反復7 段階2・設計書 §4.0 c）
 */
import {
  findAbandonedExpeditions,
  recordAbandonedExpeditions,
  NO_STAGE_STARTED,
} from './record-abandoned-expeditions';
import type { PlayLogEvent, PlayLogEventBody, PlayLogPort } from '../ports/play-log-port';

const at = (body: PlayLogEventBody): PlayLogEvent => ({ ...body, at: 0 });

const started = (expeditionId: string): PlayLogEvent =>
  at({
    kind: 'expedition_started',
    expeditionId,
    iteration: 7,
    seed: 1,
    stageIds: ['prov-t1-a', 'prov-t2-a', 'prov-t3-a'],
    initialDeckCards: [],
  });

const stageStarted = (expeditionId: string, stageIndex: number): PlayLogEvent =>
  at({ kind: 'stage_started', expeditionId, stageIndex, stageId: 'prov-t1-a', tier: 1, life: 12, deckCards: [] });

const ended = (expeditionId: string): PlayLogEvent =>
  at({
    kind: 'expedition_ended',
    expeditionId,
    outcome: 'failed',
    stagesCleared: 0,
    reachedTier3: false,
    acquired: [],
    life: 0,
  });

const abandoned = (expeditionId: string): PlayLogEvent =>
  at({ kind: 'expedition_abandoned', expeditionId, lastStageIndex: 0 });

/** 記録したものを exportAll で返す、実物（LocalStoragePlayLog）と同じ振る舞いの偽物 */
const createLog = (initial: readonly PlayLogEvent[]): PlayLogPort & { recorded: PlayLogEventBody[] } => {
  const recorded: PlayLogEventBody[] = [];
  return {
    recorded,
    record: (event) => {
      recorded.push(event);
    },
    exportAll: () => ({ version: 6, events: [...initial, ...recorded.map(at)] }),
  };
};

describe('findAbandonedExpeditions', () => {
  it('決着の無い遠征だけを、開始順に、最後に始めたステージ番号つきで返す', () => {
    // Arrange: A は決着済み・B はステージ1まで・C はステージ未開始・D は放棄記録済み・E は今回
    const events = [
      started('A'), stageStarted('A', 0), ended('A'),
      started('B'), stageStarted('B', 0), stageStarted('B', 1),
      started('C'),
      started('D'), abandoned('D'),
      started('E'), stageStarted('E', 0),
    ];

    // Act
    const result = findAbandonedExpeditions(events, 'E');

    // Assert
    expect(result).toEqual([
      { expeditionId: 'B', lastStageIndex: 1 },
      { expeditionId: 'C', lastStageIndex: NO_STAGE_STARTED },
    ]);
  });

  it('ステージを1つも始めていない遠征の lastStageIndex は -1', () => {
    expect(NO_STAGE_STARTED).toBe(-1);
    expect(findAbandonedExpeditions([started('X')], 'now')).toEqual([
      { expeditionId: 'X', lastStageIndex: -1 },
    ]);
  });

  it('今回の遠征は決着が無くても放棄とみなさない（StrictMode の再マウント対策）', () => {
    expect(findAbandonedExpeditions([started('now')], 'now')).toEqual([]);
  });

  it('ログが空なら何も返さない', () => {
    expect(findAbandonedExpeditions([], 'now')).toEqual([]);
  });
});

describe('recordAbandonedExpeditions', () => {
  it('見つけた遠征ごとに expedition_abandoned を1件ずつ記録する', () => {
    const log = createLog([started('B'), stageStarted('B', 2), started('C')]);

    recordAbandonedExpeditions(log, 'now');

    expect(log.recorded).toEqual([
      { kind: 'expedition_abandoned', expeditionId: 'B', lastStageIndex: 2 },
      { kind: 'expedition_abandoned', expeditionId: 'C', lastStageIndex: -1 },
    ]);
  });

  it('二度呼んでも二重に記録しない（記録済みの放棄はログから読み取れる）', () => {
    const log = createLog([started('B')]);

    recordAbandonedExpeditions(log, 'now');
    recordAbandonedExpeditions(log, 'now');

    expect(log.recorded).toHaveLength(1);
  });
});
```

- [ ] **Step 3: 落ちることを確かめる**

Run: `npx jest application/use-cases/record-abandoned-expeditions`
Expected: FAIL（`Cannot find module './record-abandoned-expeditions'`）

- [ ] **Step 4: 実装する**

`F/application/use-cases/record-abandoned-expeditions.ts`:

```ts
/**
 * 灰燼の城壁 - 途中でやめた遠征の記録（反復7 段階2・設計書 §4.0 c）
 *
 * 判定（設計書 §2）は、途中でやめた遠征を3遠征にも各項目の分母にも数えない。
 * そのためには「やめた」ことがログから読めなければならない。
 *
 * アンマウント時に記録すると StrictMode の二重実行で誤発火するので、
 * **次の遠征を始めるとき**にログを読み返し、`expedition_started` があって
 * `expedition_ended` も `expedition_abandoned` も無い遠征を閉じる。
 *
 * 置き場所を application にしたのは、入力が `PlayLogEvent`（ports の型）であり、
 * domain からは ports を import できないため。記録は PlayLogPort 経由の副作用
 * なので、presentation からはこのユースケースを呼ぶ（層の規則）。
 */
import type { PlayLogEvent, PlayLogPort } from '../ports/play-log-port';

/** ステージを1つも始めずにやめた遠征の lastStageIndex */
export const NO_STAGE_STARTED = -1;

export interface AbandonedExpedition {
  expeditionId: string;
  /** 最後に記録された stage_started.stageIndex。無ければ NO_STAGE_STARTED */
  lastStageIndex: number;
}

/**
 * 決着の無い遠征を開始順に返す（純粋）
 *
 * `currentExpeditionId` は必ず除く。StrictMode の再マウントでは、1回目の effect の
 * 後に今回の `expedition_started` が記録されてから2回目の走査が走るため、
 * 除かないと今回の遠征そのものを「放棄」と記録してしまう。
 */
export const findAbandonedExpeditions = (
  events: readonly PlayLogEvent[],
  currentExpeditionId: string
): AbandonedExpedition[] => {
  const startedIds: string[] = [];
  const closedIds = new Set<string>();
  const lastStageById = new Map<string, number>();
  events.forEach((event) => {
    if (event.kind === 'expedition_started') startedIds.push(event.expeditionId);
    if (event.kind === 'stage_started') lastStageById.set(event.expeditionId, event.stageIndex);
    if (event.kind === 'expedition_ended' || event.kind === 'expedition_abandoned') {
      closedIds.add(event.expeditionId);
    }
  });
  return [...new Set(startedIds)]
    .filter((id) => id !== currentExpeditionId && !closedIds.has(id))
    .map((expeditionId) => ({
      expeditionId,
      lastStageIndex: lastStageById.get(expeditionId) ?? NO_STAGE_STARTED,
    }));
};

/**
 * 決着の無い遠征を expedition_abandoned で閉じる
 *
 * 記録した放棄は次の exportAll に現れるため、二度呼んでも二重にならない。
 */
export const recordAbandonedExpeditions = (
  log: PlayLogPort,
  currentExpeditionId: string
): AbandonedExpedition[] => {
  const abandoned = findAbandonedExpeditions(log.exportAll().events, currentExpeditionId);
  abandoned.forEach(({ expeditionId, lastStageIndex }) =>
    log.record({ kind: 'expedition_abandoned', expeditionId, lastStageIndex })
  );
  return abandoned;
};
```

- [ ] **Step 5: 通ることを確かめる**

Run: `npx jest application/use-cases/record-abandoned-expeditions`
Expected: PASS（6件）

- [ ] **Step 6: フックのテスト用ログを「記録したものを返す」形にし、失敗するテストを書く**

`useExpedition.test.tsx` の `const createRecordingLog = …` から `setup` の定義の終わりまで（間の `kinds` を含む）を次に置き換える（既存の `setup()` / `setup(true)` の呼び出しはそのまま動く）:

```tsx
/**
 * 実物（LocalStoragePlayLog）と同じく「これまでに記録されたもの」を exportAll で返す
 *
 * 段階1 までは exportAll が空固定だったが、段階2 で放棄の検出がログを読み返すように
 * なったため実物に合わせた。`preloaded` は前の遠征までにブラウザへ溜まっていたログ。
 * `records` にはこのフックが記録したものだけが入る（既存の kinds() の数え方は変わらない）。
 */
const createRecordingLog = (
  preloaded: readonly PlayLogEventBody[] = []
): PlayLogPort & { records: PlayLogEventBody[] } => {
  const records: PlayLogEventBody[] = [];
  return {
    records,
    record: (event) => {
      records.push(event);
    },
    exportAll: () => ({
      version: 6,
      events: [...preloaded, ...records].map((event) => ({ ...event, at: 0 })),
    }),
  };
};

const kinds = (log: { records: PlayLogEventBody[] }, kind: PlayLogEventBody['kind']) =>
  log.records.filter((e) => e.kind === kind);

const setup = (strict = false, preloaded: readonly PlayLogEventBody[] = []) => {
  const log = createRecordingLog(preloaded);
  const wrapper = strict
    ? ({ children }: { children: React.ReactNode }) => <React.StrictMode>{children}</React.StrictMode>
    : undefined;
  const hook = renderHook(() => useExpedition({ cards: swiftCards(), seed: SEED, playLog: log }), {
    wrapper,
  });
  return { log, hook };
};
```

ファイル末尾に足す:

```tsx
describe('途中でやめた遠征（反復7 段階2・設計書 §4.0 c）', () => {
  const startedEvent = (expeditionId: string): PlayLogEventBody => ({
    kind: 'expedition_started',
    expeditionId,
    iteration: 7,
    seed: 1,
    stageIds: ['prov-t1-a', 'prov-t2-a', 'prov-t3-a'],
    initialDeckCards: swiftCards(),
  });
  const stageStartedEvent = (expeditionId: string, stageIndex: number): PlayLogEventBody => ({
    kind: 'stage_started',
    expeditionId,
    stageIndex,
    stageId: 'prov-t1-a',
    tier: 1,
    life: 12,
    deckCards: swiftCards(),
  });
  const endedEvent = (expeditionId: string): PlayLogEventBody => ({
    kind: 'expedition_ended',
    expeditionId,
    outcome: 'failed',
    stagesCleared: 0,
    reachedTier3: false,
    acquired: [],
    life: 0,
  });

  it('前の遠征が決着していなければ、次の遠征の開始時に expedition_abandoned を1件記録する', () => {
    const { log } = setup(false, [
      startedEvent('exp-old'),
      stageStartedEvent('exp-old', 0),
      stageStartedEvent('exp-old', 1),
    ]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([
      { kind: 'expedition_abandoned', expeditionId: 'exp-old', lastStageIndex: 1 },
    ]);
  });

  it('StrictMode の二重実行でも1件だけで、今回の遠征自身は放棄にしない', () => {
    const { log, hook } = setup(true, [startedEvent('exp-old')]);

    const abandoned = kinds(log, 'expedition_abandoned');
    expect(abandoned).toHaveLength(1);
    expect(abandoned[0]).toMatchObject({ expeditionId: 'exp-old' });
    expect(abandoned).not.toContainEqual(
      expect.objectContaining({ expeditionId: hook.result.current.expeditionId })
    );
  });

  it('正常に決着した遠征は対象外', () => {
    const { log } = setup(false, [startedEvent('exp-done'), endedEvent('exp-done')]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([]);
  });

  it('既に放棄と記録された遠征を二度記録しない', () => {
    const { log } = setup(false, [
      startedEvent('exp-old'),
      { kind: 'expedition_abandoned', expeditionId: 'exp-old', lastStageIndex: -1 },
    ]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([]);
  });

  it('ステージを1つも始めずにやめた遠征は lastStageIndex が -1', () => {
    const { log } = setup(false, [startedEvent('exp-old')]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([
      { kind: 'expedition_abandoned', expeditionId: 'exp-old', lastStageIndex: -1 },
    ]);
  });

  it('放棄の記録は今回の expedition_started より前に並ぶ（ログを上から読むと時系列になる）', () => {
    const { log } = setup(false, [startedEvent('exp-old')]);

    const order = log.records.map((e) => e.kind);
    expect(order.indexOf('expedition_abandoned')).toBeLessThan(order.indexOf('expedition_started'));
  });
});
```

- [ ] **Step 7: 落ちることを確かめる**

Run: `npx jest presentation/useExpedition`
Expected: 新しい6件のうち「正常に決着した」「既に放棄と記録された」以外の4件が FAIL（`expedition_abandoned` が0件）。既存のテストは PASS のまま

- [ ] **Step 8: フックに結線する**

`useExpedition.ts`:

1. import に足す:

```ts
import { recordAbandonedExpeditions } from '../application/use-cases/record-abandoned-expeditions';
```

2. `expedition_started` を記録する `useEffect` の**直前**に足す（effect は定義順に走るので、放棄の記録が今回の開始より前に並ぶ）:

```ts
  // 途中でやめた前の遠征を閉じる（反復7 段階2・設計書 §4.0 c）。
  // アンマウント時の記録は StrictMode の二重実行で誤発火するため、次の遠征の開始時に行う。
  // recordOnce で1回に絞り、さらにユースケース側も今回の遠征と記録済みの放棄を除くので、
  // どちらか一方の防御が外れても二重にならない
  useEffect(() => {
    recordOnce('expedition_abandoned_scan', () => {
      recordAbandonedExpeditions(logRef.current, expeditionId);
    });
  }, [recordOnce, expeditionId]);
```

- [ ] **Step 9: 通ることを確かめる**

Run: `npx jest presentation/useExpedition application/use-cases/record-abandoned-expeditions`
Expected: PASS（既存と新規すべて）

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 10: コミット**

```bash
git add src/features/ashen-rampart/application/ports/play-log-port.ts \
        src/features/ashen-rampart/application/use-cases/record-abandoned-expeditions.ts \
        src/features/ashen-rampart/application/use-cases/record-abandoned-expeditions.test.ts \
        src/features/ashen-rampart/presentation/useExpedition.ts \
        src/features/ashen-rampart/presentation/useExpedition.test.tsx
git commit -F - <<'EOF'
feat(ashen-rampart): 途中でやめた遠征を次の遠征の開始時に expedition_abandoned で閉じる

- 決着の無い遠征を検出する純粋関数と記録するユースケースを application に置く
- lastStageIndex は最後に始めたステージ番号。未開始なら -1
- 今回の遠征と記録済みの放棄を除き、StrictMode でも1件だけにする
- テスト用ログを「記録したものを返す」形にし、実物の振る舞いに合わせる

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 2: 道と置ける場所を見分けられるようにする（設計書 §4.0 b）

**Files:**
- Create: `F/presentation/contrast.ts` / Test: `F/presentation/contrast.test.ts`
- Create: `F/presentation/board-colors.ts` / Test: `F/presentation/board-colors.test.ts`
- Modify: `F/presentation/BoardGrid.tsx:53-78`（`Cell`）と `:183-192`（`<Cell>` の props）
- Modify: `F/presentation/EnemyMarker.tsx:22-36`（`Wrapper`）
- Test: `F/presentation/BoardGrid.test.tsx`（末尾に追記）

**Interfaces:**
- Produces:
  - `relativeLuminance(hex: string): number` / `contrastRatio(a: string, b: string): number`
  - `BOARD_COLORS: { path; pathEdge; slot; rangeStripe; placeableHalo }`、`WCAG_NON_TEXT_CONTRAST_MIN = 3`、`PLACEABLE_HALO_PX = 4`
  - `cellBackgroundOf(args: { isPath: boolean; isThreatened: boolean }): string`（Task 12 が `isThreatened: true` を使う）

判断: 経路 `#7d6d58`＋縁 `#a39076`、経路外 `#211c19` は据え置き（経路外に対し 3.37:1）。
判断: 射程の色調は `dangerText` の斜線の模様（塗りにすると経路との 3:1 と両立しない）。
判断: 置けるセルの琥珀の縁取りの内側に `dominant` の4px の縁を敷く（明るい経路の上で琥珀が 2.3:1 に落ちるため）。
判断: 経路の上の敵マーカーは背景色で1px縁取る（経路が明るくなりマーカーとの差が縮むため）。

- [ ] **Step 1: 失敗するテストを書く（コントラスト比）**

`F/presentation/contrast.test.ts`:

```ts
/**
 * WCAG 2.x のコントラスト比（反復7 段階2・設計書 §4.0 b）
 */
import { contrastRatio, relativeLuminance } from './contrast';

describe('relativeLuminance', () => {
  it('黒は0・白は1', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('#rrggbb 以外は契約違反として例外', () => {
    expect(() => relativeLuminance('red')).toThrow('#rrggbb 形式ではありません: red');
  });
});

describe('contrastRatio', () => {
  it('白と黒は 21:1、同じ色は 1:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#7d6d58', '#7d6d58')).toBe(1);
  });

  it('引数の順序によらない', () => {
    expect(contrastRatio('#e8a33d', '#1a1614')).toBeCloseTo(contrastRatio('#1a1614', '#e8a33d'), 10);
  });

  it('既知の値と一致する（#777777 と白は約 4.48:1）', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('段階1 の経路と経路外の比はほぼ 1:1 だった（設計書 §4.0 b の原因）', () => {
    expect(contrastRatio('#2a2320', '#211c19')).toBeLessThan(1.2);
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/contrast`
Expected: FAIL（`Cannot find module './contrast'`）

- [ ] **Step 3: 実装する**

`F/presentation/contrast.ts`:

```ts
/**
 * 灰燼の城壁 - WCAG 2.x のコントラスト比（純粋）
 *
 * 経路と経路外の色を「3:1 以上」（WCAG 1.4.11 非テキストのコントラスト）で
 * 固定するために使う（反復7 段階2・設計書 §4.0 b）。
 * features 間の import は禁止なので、primal-path のテスト用ヘルパーは使わずここに置く。
 */
const HEX_COLOR = /^#([0-9a-f]{6})$/i;
const HEX_RADIX = 16;
const RED_SHIFT = 16;
const GREEN_SHIFT = 8;
const BYTE_MASK = 0xff;
const CHANNEL_MAX = 255;

/** sRGB → 線形の変換定数（WCAG 2.x の相対輝度の定義） */
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_DIVISOR = 1.055;
const SRGB_GAMMA_EXPONENT = 2.4;
const LUMINANCE_WEIGHT = { r: 0.2126, g: 0.7152, b: 0.0722 } as const;
/** コントラスト比の分子・分母に足す定数（WCAG 2.x） */
const CONTRAST_OFFSET = 0.05;

const toLinear = (channel: number): number => {
  const c = channel / CHANNEL_MAX;
  return c <= SRGB_LINEAR_THRESHOLD
    ? c / SRGB_LINEAR_DIVISOR
    : ((c + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR) ** SRGB_GAMMA_EXPONENT;
};

/** `#rrggbb` の相対輝度（0〜1） */
export const relativeLuminance = (hex: string): number => {
  const digits = HEX_COLOR.exec(hex)?.[1];
  if (digits === undefined) {
    throw new Error(`#rrggbb 形式ではありません: ${hex}`);
  }
  const value = Number.parseInt(digits, HEX_RADIX);
  const r = (value >> RED_SHIFT) & BYTE_MASK;
  const g = (value >> GREEN_SHIFT) & BYTE_MASK;
  const b = value & BYTE_MASK;
  return (
    LUMINANCE_WEIGHT.r * toLinear(r) + LUMINANCE_WEIGHT.g * toLinear(g) + LUMINANCE_WEIGHT.b * toLinear(b)
  );
};

/** 2色のコントラスト比（1〜21）。順序によらない */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + CONTRAST_OFFSET) / (Math.min(la, lb) + CONTRAST_OFFSET);
};
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest presentation/contrast`
Expected: PASS

- [ ] **Step 5: 失敗するテストを書く（盤面の色）**

`F/presentation/board-colors.test.ts`:

```ts
/**
 * 盤面セルの色（反復7 段階2・設計書 §4.0 b）
 *
 * 段階1 の試遊で「道と置ける場所の区別が付かない」と言われた。
 * 経路 #2a2320 と経路外 #211c19 の比は約 1.1:1 だった。
 */
import { contrastRatio } from './contrast';
import {
  BOARD_COLORS,
  WCAG_NON_TEXT_CONTRAST_MIN,
  cellBackgroundOf,
} from './board-colors';
import { COLORS } from './theme';

describe('盤面の色', () => {
  it('経路と経路外のコントラスト比が 3:1 以上（WCAG 1.4.11）', () => {
    expect(contrastRatio(BOARD_COLORS.path, BOARD_COLORS.slot)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('経路の上のレーン印と矢印（secondary）が経路に対して 3:1 以上', () => {
    expect(contrastRatio(COLORS.secondary, BOARD_COLORS.path)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('射程の斜線は経路外に対して 3:1 以上', () => {
    expect(contrastRatio(BOARD_COLORS.rangeStripe, BOARD_COLORS.slot)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('置けるセルの琥珀の縁取りは、内側の暗い縁に対して 3:1 以上', () => {
    expect(contrastRatio(COLORS.opportunity, BOARD_COLORS.placeableHalo)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('射程の斜線は「置ける」の琥珀と別の色（役割を分ける。設計書 §4.3 #5）', () => {
    expect(BOARD_COLORS.rangeStripe).not.toBe(COLORS.opportunity);
  });
});

describe('cellBackgroundOf', () => {
  it('経路は経路の色、経路外は経路外の色', () => {
    expect(cellBackgroundOf({ isPath: true, isThreatened: false })).toBe(BOARD_COLORS.path);
    expect(cellBackgroundOf({ isPath: false, isThreatened: false })).toBe(BOARD_COLORS.slot);
  });

  it('射程内の経路外は、経路外の地に斜線を重ねる（塗りの色は変えない）', () => {
    const background = cellBackgroundOf({ isPath: false, isThreatened: true });
    expect(background).toContain('repeating-linear-gradient');
    expect(background).toContain(BOARD_COLORS.rangeStripe);
    expect(background.endsWith(BOARD_COLORS.slot)).toBe(true);
  });

  it('経路には射程の斜線を付けない（経路は置いて塞ぐ場所で、射程の警告の対象外）', () => {
    expect(cellBackgroundOf({ isPath: true, isThreatened: true })).toBe(BOARD_COLORS.path);
  });
});
```

- [ ] **Step 6: 落ちることを確かめる**

Run: `npx jest presentation/board-colors`
Expected: FAIL（`Cannot find module './board-colors'`）

- [ ] **Step 7: 実装する**

`F/presentation/board-colors.ts`:

```ts
/**
 * 灰燼の城壁 - 盤面セルの色（反復7 段階2・設計書 §4.0 b / §4.3 #5）
 *
 * 経路は「道」として明るくし縁を付ける。経路外（置ける場所）は据え置きの暗色。
 * 経路と経路外のコントラスト比を 3:1 以上に保つ（board-colors.test.ts が計算で守る）。
 *
 * 射程の警告（§4.3 #5）は**塗りの色ではなく斜線の模様**で出す。
 * 経路外の塗りを明るくして区別すると経路との 3:1 が崩れ、暗くすると経路外と
 * 見分けられない。模様なら地の色を変えずに両立する。
 * 「置ける」は琥珀の outline が担っているので、斜線には別の色（dangerText）を使う。
 */
import { COLORS } from './theme';

export const BOARD_COLORS = {
  /** 経路（道）。経路外に対して約 3.37:1 */
  path: '#7d6d58',
  /** 経路の縁 */
  pathEdge: '#a39076',
  /** 経路外（置ける場所）。段階1 から据え置き */
  slot: '#211c19',
  /** 敵の射程が届く経路外に重ねる斜線。射程は「削られる」脅威なので危険系の明るい色 */
  rangeStripe: COLORS.dangerText,
  /** 置けるセルの琥珀の縁取りの内側に敷く暗い縁（明るい経路の上でも琥珀を読ませる） */
  placeableHalo: COLORS.dominant,
} as const;

/** WCAG 1.4.11（非テキストのコントラスト）の最小比 */
export const WCAG_NON_TEXT_CONTRAST_MIN = 3;

/** 置けるセルの暗い縁の太さ（px）。琥珀の outline（2px）より内側に2px 見える */
export const PLACEABLE_HALO_PX = 4;

const RANGE_STRIPE_ANGLE_DEG = 135;
const RANGE_STRIPE_WIDTH_PX = 2;
const RANGE_STRIPE_PERIOD_PX = 8;

/** セルの背景。射程の斜線は経路外にだけ重ねる */
export const cellBackgroundOf = ({
  isPath,
  isThreatened,
}: {
  isPath: boolean;
  isThreatened: boolean;
}): string => {
  if (isPath) return BOARD_COLORS.path;
  if (!isThreatened) return BOARD_COLORS.slot;
  return (
    `repeating-linear-gradient(${RANGE_STRIPE_ANGLE_DEG}deg, ` +
    `${BOARD_COLORS.rangeStripe} 0 ${RANGE_STRIPE_WIDTH_PX}px, ` +
    `transparent ${RANGE_STRIPE_WIDTH_PX}px ${RANGE_STRIPE_PERIOD_PX}px), ${BOARD_COLORS.slot}`
  );
};
```

- [ ] **Step 8: 通ることを確かめる**

Run: `npx jest presentation/board-colors`
Expected: PASS（8件）

- [ ] **Step 9: 失敗するテストを書く（盤面に実際に効いている色）**

`BoardGrid.test.tsx` の import に足す:

```tsx
import { appliedValueOf } from './applied-css';
import { BOARD_COLORS, PLACEABLE_HALO_PX } from './board-colors';
import { COLORS } from './theme';
```

末尾に足す:

```tsx
describe('道と置ける場所の見分け（反復7 段階2・設計書 §4.0 b）', () => {
  it('経路セルは経路の色と縁、経路外セルは経路外の色で描かれる（実際に効いている CSS を読む）', () => {
    render(<BoardGrid {...defaultProps} />);
    const pathCell = screen.getByTestId('cell-0-2');
    const slotCell = screen.getByTestId('cell-1-1');

    expect(appliedValueOf(pathCell, 'background')).toBe(BOARD_COLORS.path);
    expect(appliedValueOf(pathCell, 'border')).toBe(`1px solid ${BOARD_COLORS.pathEdge}`);
    expect(appliedValueOf(slotCell, 'background')).toBe(BOARD_COLORS.slot);
  });

  it('置けるセルは琥珀の縁取りの内側に暗い縁を持つ', () => {
    render(<BoardGrid {...defaultProps} placeableCells={[{ x: 0, y: 2 }]} />);
    const cell = screen.getByTestId('cell-0-2');

    expect(appliedValueOf(cell, 'box-shadow')).toBe(
      `inset 0 0 0 ${PLACEABLE_HALO_PX}px ${BOARD_COLORS.placeableHalo}`
    );
  });

  it('敵マーカーは背景色で縁取られる（明るい経路の上でも輪郭が溶けない）', () => {
    const withEnemy = {
      ...emptyState,
      enemies: [
        { id: 1, enemyId: 'brute', hp: 60, maxHp: 60, progress: 1, spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0 },
      ],
    };
    render(<BoardGrid {...defaultProps} state={withEnemy} />);

    expect(appliedValueOf(screen.getByRole('img', { name: '重装' }), 'filter')).toContain(COLORS.dominant);
  });
});
```

- [ ] **Step 10: 落ちることを確かめる**

Run: `npx jest presentation/BoardGrid`
Expected: 新しい3件が FAIL（背景が `#2a2320`、`box-shadow` / `filter` が未定義）

- [ ] **Step 11: 盤面と敵マーカーに効かせる**

`BoardGrid.tsx`:

1. import に `import { BOARD_COLORS, PLACEABLE_HALO_PX, cellBackgroundOf } from './board-colors';` を足す
2. `Cell` を次に置き換える:

```tsx
const Cell = styled.button<{ $kind: string; $highlighted: boolean }>`
  position: relative;
  border: 1px solid ${({ $kind }) => ($kind === 'path' ? BOARD_COLORS.pathEdge : COLORS.grid)};
  background: ${({ $kind }) => cellBackgroundOf({ isPath: $kind === 'path', isThreatened: false })};
  outline: ${({ $highlighted }) =>
    $highlighted ? `2px solid ${COLORS.opportunity}` : 'none'};
  outline-offset: -2px;
  /* 経路を明るくしたので、琥珀の縁取りの内側に暗い縁を敷いて琥珀を読ませる（§4.0 b） */
  box-shadow: ${({ $highlighted }) =>
    $highlighted ? `inset 0 0 0 ${PLACEABLE_HALO_PX}px ${BOARD_COLORS.placeableHalo}` : 'none'};
  cursor: ${({ $highlighted }) => ($highlighted ? 'pointer' : 'default')};
  color: ${COLORS.secondary};
  font-size: 11px;
  padding: 0;
  ${({ $highlighted }) =>
    $highlighted
      ? `
    &::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      width: max(44px, 100%);
      height: max(44px, 100%);
      transform: translate(-50%, -50%);
    }
  `
      : ''}
`;
```

`EnemyMarker.tsx`:

1. `Wrapper` の直前に足す:

```tsx
/**
 * 敵マーカーの縁取り（反復7 段階2・設計書 §4.0 b）
 *
 * 経路を明るくしたため、重装（紫）等は経路の地との差が小さくなった。
 * 背景色で1px 縁取って輪郭を保つ。clip-path の形にも沿うよう drop-shadow を4方向に重ねる。
 */
const ENEMY_OUTLINE_PX = 1;
const ENEMY_OUTLINE_FILTER = [
  [ENEMY_OUTLINE_PX, 0],
  [-ENEMY_OUTLINE_PX, 0],
  [0, ENEMY_OUTLINE_PX],
  [0, -ENEMY_OUTLINE_PX],
]
  .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${COLORS.dominant})`)
  .join(' ');
```

2. `Wrapper` の `z-index: 3;` の直後に `filter: ${ENEMY_OUTLINE_FILTER};` を足す

- [ ] **Step 12: 通ることを確かめる**

Run: `npx jest presentation/BoardGrid presentation/board-colors presentation/contrast`
Expected: PASS（既存の `data-path` / `aria-label` / `MAX_CELL_MARKS` の検査も緑のまま）

- [ ] **Step 13: コミット**

```bash
git add src/features/ashen-rampart/presentation/contrast.ts \
        src/features/ashen-rampart/presentation/contrast.test.ts \
        src/features/ashen-rampart/presentation/board-colors.ts \
        src/features/ashen-rampart/presentation/board-colors.test.ts \
        src/features/ashen-rampart/presentation/BoardGrid.tsx \
        src/features/ashen-rampart/presentation/BoardGrid.test.tsx \
        src/features/ashen-rampart/presentation/EnemyMarker.tsx
git commit -F - <<'EOF'
fix(ashen-rampart): 経路を道として明るくし、経路外とのコントラスト比を 3:1 以上にする

- 段階1 の経路と経路外は約 1.1:1 で見分けられなかった（設計書 §4.0 b）
- 盤面の色を名前付き定数にし、比を単体テストで計算して固定する
- 置けるセルの琥珀の内側に暗い縁を敷き、敵マーカーを背景色で縁取る

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 3: 戦闘中に盤面と手札を上下に動かさない（設計書 §4.0 a）

**Files:**
- Modify: `F/presentation/layout-constants.ts`（末尾に追記）
- Modify: `F/presentation/RunStatusBar.tsx`（全体の組み替え） / Test: `F/presentation/RunStatusBar.test.tsx`（末尾に追記）
- Create: `F/presentation/HandNoticeSlot.tsx` / Test: `F/presentation/HandNoticeSlot.test.tsx`
- Modify: `F/presentation/HandArea.tsx:71-75, 185-188, 225-243`
- Create: `F/presentation/BoardInfoSlot.tsx` / Test: `F/presentation/BoardInfoSlot.test.tsx`
- Modify: `F/presentation/InspectPanel.tsx:15-29`
- Modify: `F/presentation/StageView.tsx:38-66, 159-176`
- Create: `e2e/ashen-rampart/layout-stability.spec.ts`

**Interfaces:**
- Produces:
  - `layout-constants.ts`: `BOARD_INFO_LINE_PX = 20` / `BOARD_INFO_GAP_PX = 4` / `INSPECT_ROW_HEIGHT_PX = 36` / `BOARD_INFO_SLOT_HEIGHT_PX = 60` / `HAND_NOTICE_LINE_PX = 20` / `HAND_NOTICE_MAX_LINES = 2`
  - `RunStatusBar.tsx`: `STATUS_TOP_ROW_PX = 44` / `STATUS_PREVIEW_ROW_PX = 40` / `STATUS_REASON_ROW_PX = 32`、testid `run-status-bar` / `danger-slot` / `life-loss-reason-slot`
  - `HandNoticeSlot: React.FC<{ overflowNotice?: string; willOverflow: boolean; maxShortage: number }>`、`OVERFLOW_WARNING_TEXT`、testid `hand-notice-slot`
  - `BoardInfoSlot: React.FC<{ rejectionNotice?: string; inspectedPlate?: PlateModel }>`、`INSPECT_HINT_TEXT`、`REJECTION_NOTICE_TONE`、testid `board-info-slot` / `rejection-line` / `inspect-hint`
  - `StageView` の盤面の包みに testid `board-wrapper`

判断: 状態帯は3行固定（44／40／32px）、手札の上は2行固定（40px）、盤面の下は60px固定。
判断: 能力表示が閉じているときは、その行に能力表示の導線を出す（判定項目9(b) の前提。段階1 では一度も開かれなかった）。
判断: `Center` の `flex: 1` を外す（中身が70vh未満のとき手札の伸びで手札の上端が上がる経路を消す）。
判断: 手札の通知が3つ同時なら優先順の上位2つだけを出し、溢れそうの文言を縮める。
判断: `LevyChoice` は盤面の上に残す（徴発は遠征から外れており描画されない。§3.5 で触らない）。

- [ ] **Step 1: 枠の高さの定数を足す**

`layout-constants.ts` の末尾に足す:

```ts
/**
 * 戦闘中に高さが変わる要素を置かないための「予約した枠」の高さ（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 の試遊で「画面のサイズがコロコロ変わり、戦闘開始時に慌てる」と言われた。
 * 一時表示（拒否理由・能力表示・溢れ通知・ライフが減った理由）が出るたびに
 * 盤面と手札が押し下げられていた。一時表示は空のときも同じ高さを占める枠に出す。
 */
/** 盤面の下の拒否理由の1行 */
export const BOARD_INFO_LINE_PX = 20;
/** 拒否理由と能力表示の間 */
export const BOARD_INFO_GAP_PX = 4;
/** 能力表示の1行（チップは折り返さず横へ流す） */
export const INSPECT_ROW_HEIGHT_PX = 36;
/** 盤面の下の枠の全体 */
export const BOARD_INFO_SLOT_HEIGHT_PX = BOARD_INFO_LINE_PX + BOARD_INFO_GAP_PX + INSPECT_ROW_HEIGHT_PX;
/** 手札の上の通知の1行 */
export const HAND_NOTICE_LINE_PX = 20;
/** 手札の上の通知の行数（これを超える通知は優先順の下位を出さない） */
export const HAND_NOTICE_MAX_LINES = 2;
```

- [ ] **Step 2: 失敗するテストを書く（状態帯）**

`RunStatusBar.test.tsx` の import に足す:

```tsx
import { appliedValueOf } from './applied-css';
import { STATUS_TOP_ROW_PX, STATUS_PREVIEW_ROW_PX, STATUS_REASON_ROW_PX } from './RunStatusBar';
```

末尾に足す:

```tsx
describe('高さを予約した枠（反復7 段階2・設計書 §4.0 a）', () => {
  it('危険と理由の欄は空でも描かれ、3行の高さは固定される', () => {
    render(<RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} runSeed={1} />);

    expect(screen.getByTestId('danger-slot')).toBeEmptyDOMElement();
    expect(screen.getByTestId('life-loss-reason-slot')).toBeEmptyDOMElement();
    expect(appliedValueOf(screen.getByTestId('run-status-bar'), 'grid-template-rows')).toBe(
      `${STATUS_TOP_ROW_PX}px ${STATUS_PREVIEW_ROW_PX}px ${STATUS_REASON_ROW_PX}px`
    );
  });

  it('理由が出ても同じ欄に入り、欄の数は変わらない', () => {
    const { container, rerender } = render(
      <RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} runSeed={1} />
    );
    const before = container.querySelectorAll('[data-testid="run-status-bar"] > *').length;

    rerender(
      <RunStatusBar
        state={{ ...state, life: 2 }}
        isPaused={false}
        onTogglePause={jest.fn()}
        runSeed={1}
        lifeLossReason="敵が砦に到達しました"
      />
    );

    expect(screen.getByTestId('life-loss-reason-slot')).toHaveTextContent('敵が砦に到達しました');
    expect(screen.getByTestId('danger-slot')).toHaveTextContent('危険');
    expect(container.querySelectorAll('[data-testid="run-status-bar"] > *').length).toBe(before);
  });
});
```

- [ ] **Step 3: 落ちることを確かめる**

Run: `npx jest presentation/RunStatusBar`
Expected: 新しい2件が FAIL（testid が無い・定数が export されていない）

- [ ] **Step 4: 状態帯を3行固定のグリッドにする**

`RunStatusBar.tsx` の `const Bar = …` から `const SeedField = …` の終わりまでを次に置き換える:

```tsx
/** 1行目（ライフ・危険・一時停止）。一時停止ボタンの最小タップ高 44px に合わせる */
export const STATUS_TOP_ROW_PX = 44;
/** 2行目（次ウェーブ予告）。2行ぶんを常に予約し、3行目以降は隠す */
export const STATUS_PREVIEW_ROW_PX = 40;
/** 3行目（ライフが減った理由・シード）。シード欄の高さ 32px に合わせる */
export const STATUS_REASON_ROW_PX = 32;
const STATUS_LINE_HEIGHT_PX = 20;

/**
 * 状態帯（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 までは flex-wrap の1行に「危険」「ライフが減った理由」を足していたため、
 * 幅によって行が増えて盤面が下がった。行の数と高さを固定したグリッドにし、
 * 一時表示は空でも同じ欄を占める。はみ出す文字は省略記号で切る（title で全文を読める）。
 */
const Bar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: ${STATUS_TOP_ROW_PX}px ${STATUS_PREVIEW_ROW_PX}px ${STATUS_REASON_ROW_PX}px;
  align-items: center;
  column-gap: 12px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border-bottom: 1px solid ${COLORS.grid};
`;

const SingleLine = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PreviewLine = styled.span`
  grid-column: 1 / -1;
  align-self: stretch;
  line-height: ${STATUS_LINE_HEIGHT_PX}px;
  overflow: hidden;
`;

const Life = styled.span<{ $danger: boolean }>`
  color: ${({ $danger }) => ($danger ? COLORS.dangerText : COLORS.secondary)};
  font-weight: 700;
`;

const PauseButton = styled.button`
  min-height: 44px;
  padding: 0 12px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

const SeedField = styled.input`
  min-height: 32px;
  width: 90px;
  padding: 0 6px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
`;
```

`return (` から最後の `);` までを次に置き換える:

```tsx
  return (
    <Bar data-testid="run-status-bar">
      <SingleLine>
        砦 <Life $danger={danger} data-leaking={isLeaking}>残り {state.life}</Life>{' '}
        <span data-testid="danger-slot">{danger ? '危険' : ''}</span>
      </SingleLine>
      <PauseButton type="button" onClick={onTogglePause}>
        {isPaused ? '再開' : '一時停止'}
      </PauseButton>
      <PreviewLine>次: {preview}</PreviewLine>
      <SingleLine data-testid="life-loss-reason-slot" title={lifeLossReason}>
        {lifeLossReason ?? ''}
      </SingleLine>
      <span>
        <label htmlFor="ashen-rampart-run-seed">シード</label>
        <SeedField
          id="ashen-rampart-run-seed"
          type="text"
          readOnly
          value={String(runSeed)}
          onFocus={(event) => event.currentTarget.select()}
        />
      </span>
    </Bar>
  );
```

- [ ] **Step 5: 通ることを確かめる**

Run: `npx jest presentation/RunStatusBar`
Expected: PASS（既存の「危険」「理由」「予告」「シード」の検査も緑）

- [ ] **Step 6: 失敗するテストを書く（手札の上の通知）**

`F/presentation/HandNoticeSlot.test.tsx`:

```tsx
/**
 * 手札の上の通知の枠（反復7 段階2・設計書 §4.0 a）
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HandNoticeSlot, OVERFLOW_WARNING_TEXT } from './HandNoticeSlot';
import { appliedValueOf } from './applied-css';
import { HAND_NOTICE_LINE_PX, HAND_NOTICE_MAX_LINES } from './layout-constants';

describe('HandNoticeSlot', () => {
  it('通知が無くても2行ぶんの高さを占める', () => {
    render(<HandNoticeSlot willOverflow={false} maxShortage={0} />);
    const slot = screen.getByTestId('hand-notice-slot');

    expect(slot).toBeEmptyDOMElement();
    expect(appliedValueOf(slot, 'height')).toBe(`${HAND_NOTICE_LINE_PX * HAND_NOTICE_MAX_LINES}px`);
  });

  it('溢れて失った札・溢れそう・マナ不足をそれぞれ文で出す', () => {
    const { rerender } = render(<HandNoticeSlot overflowNotice="火砲台" willOverflow={false} maxShortage={0} />);
    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();

    rerender(<HandNoticeSlot willOverflow maxShortage={0} />);
    expect(screen.getByText(OVERFLOW_WARNING_TEXT)).toBeInTheDocument();

    rerender(<HandNoticeSlot willOverflow={false} maxShortage={2} />);
    expect(screen.getByText('マナが2足りません')).toBeInTheDocument();
  });

  it('3つ同時なら、優先順（失った > 溢れそう > マナ不足）の上位2つだけを出す', () => {
    render(<HandNoticeSlot overflowNotice="火砲台" willOverflow maxShortage={2} />);

    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();
    expect(screen.getByText(OVERFLOW_WARNING_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('マナが2足りません')).not.toBeInTheDocument();
  });

  it('溢れそうの文言は「あふれ」と「ライフ」を含み、360px で1行に収まる長さ', () => {
    expect(OVERFLOW_WARNING_TEXT).toMatch(/あふれ/);
    expect(OVERFLOW_WARNING_TEXT).toMatch(/ライフ/);
    expect(OVERFLOW_WARNING_TEXT.length).toBeLessThanOrEqual(24);
  });
});
```

- [ ] **Step 7: 落ちることを確かめる**

Run: `npx jest presentation/HandNoticeSlot`
Expected: FAIL（`Cannot find module './HandNoticeSlot'`）

- [ ] **Step 8: 手札の上の通知を枠へ移す**

`F/presentation/HandNoticeSlot.tsx`:

```tsx
/**
 * 灰燼の城壁 - 手札の上の通知の枠（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 までは溢れ通知・マナ不足・溢れそうの警告が出るたびに行が増え、
 * 手札を押し下げていた。通知は2行固定の枠に出し、空でも同じ高さを占める。
 * 3つ同時に出たときは、取り返しのつかない順（失った > 溢れそう > マナ不足）の
 * 上位2つだけを出す。
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS } from './theme';
import { HAND_NOTICE_LINE_PX, HAND_NOTICE_MAX_LINES } from './layout-constants';

/** 360px 幅でも1行に収まる長さにした（段階1 の文言は折り返していた） */
export const OVERFLOW_WARNING_TEXT = '手札がいっぱい。次のドローであふれてライフ-1';

const Slot = styled.div`
  height: ${HAND_NOTICE_LINE_PX * HAND_NOTICE_MAX_LINES}px;
  overflow: hidden;
  line-height: ${HAND_NOTICE_LINE_PX}px;
`;

const Line = styled.p<{ $color: string }>`
  margin: 0;
  color: ${({ $color }) => $color};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  /** 溢れて失った札の名前 */
  overflowNotice?: string;
  /** このままだと次のドローで溢れるか */
  willOverflow: boolean;
  /** 手札の札のうち最大のマナ不足量（0 なら不足なし） */
  maxShortage: number;
}

interface Notice {
  key: string;
  text: string;
  color: string;
}

/** 出す通知を優先順に並べる */
const noticesOf = ({ overflowNotice, willOverflow, maxShortage }: Props): Notice[] => [
  // 溢れは「不便」であって砦が削られる危険そのものではないため opportunity（段階1 と同じ）
  ...(overflowNotice
    ? [{ key: 'lost', text: `${overflowNotice} を手札に持てず失いました`, color: COLORS.opportunity }]
    : []),
  // 溢れそうはライフを失う予告なので危険の文字色（danger は文字に使えない。theme.ts）
  ...(willOverflow ? [{ key: 'warn', text: OVERFLOW_WARNING_TEXT, color: COLORS.dangerText }] : []),
  ...(maxShortage > 0
    ? [{ key: 'mana', text: `マナが${maxShortage}足りません`, color: COLORS.secondary }]
    : []),
];

export const HandNoticeSlot: React.FC<Props> = (props) => (
  <Slot data-testid="hand-notice-slot">
    {noticesOf(props)
      .slice(0, HAND_NOTICE_MAX_LINES)
      .map((notice) => (
        <Line key={notice.key} $color={notice.color}>
          {notice.text}
        </Line>
      ))}
  </Slot>
);
```

`HandArea.tsx`:

1. import に `import { HandNoticeSlot } from './HandNoticeSlot';` を足す
2. `const OverflowWarning = styled.span` … `;`（71〜75行）と `const Notice = styled.p` … `;`（185〜188行）を削除する
3. `<Row>` の中の `{willOverflow && <OverflowWarning>…</OverflowWarning>}` の行を削除する
4. `{overflowNotice && <Notice>…</Notice>}` と `{maxShortage > 0 && <p>マナが{maxShortage}足りません</p>}` の2行を次の1行に置き換える:

```tsx
      <HandNoticeSlot overflowNotice={overflowNotice} willOverflow={willOverflow} maxShortage={maxShortage} />
```

5. `Row` の `flex-wrap: wrap;` を `flex-wrap: nowrap;` にする（中身はマナ・墓地・ドローの帯だけになり、360px でも1行に収まる。折り返すと手札が下がる）

- [ ] **Step 9: 通ることを確かめる**

Run: `npx jest presentation/HandNoticeSlot presentation/HandArea`
Expected: PASS（`HandArea.test.tsx` の `/あふれ/`・`マナが1足りません`・`火砲台 を手札に持てず失いました` の検査も緑）

- [ ] **Step 10: 失敗するテストを書く（盤面の下の枠）**

`F/presentation/BoardInfoSlot.test.tsx`:

```tsx
/**
 * 盤面の下の拒否理由と能力表示の枠（反復7 段階2・設計書 §4.0 a）
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BoardInfoSlot, INSPECT_HINT_TEXT } from './BoardInfoSlot';
import { buildPlates, type PlateModel } from './board-plates';
import { appliedValueOf } from './applied-css';
import { BOARD_INFO_SLOT_HEIGHT_PX, INSPECT_ROW_HEIGHT_PX } from './layout-constants';
import { createCombatState } from '../domain/combat/combat-state';

const arrowPlate = (): PlateModel => {
  const state = {
    ...createCombatState({ drawPile: [], hand: [], graveyard: [] }, []),
    units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
  };
  const plate = buildPlates(state)[0];
  if (!plate) throw new Error('前提が壊れています: 弓兵の台座がありません');
  return plate;
};

describe('BoardInfoSlot', () => {
  it('何も出ていないときも同じ高さを占め、能力表示の導線を出す', () => {
    render(<BoardInfoSlot />);
    const slot = screen.getByTestId('board-info-slot');

    expect(appliedValueOf(slot, 'height')).toBe(`${BOARD_INFO_SLOT_HEIGHT_PX}px`);
    expect(screen.getByTestId('rejection-line')).toBeEmptyDOMElement();
    expect(screen.getByTestId('inspect-hint')).toHaveTextContent(INSPECT_HINT_TEXT);
  });

  it('拒否理由と能力表示が同時に出ても、同じ枠の中に収まる', () => {
    render(<BoardInfoSlot rejectionNotice="そこには置けない" inspectedPlate={arrowPlate()} />);
    const slot = screen.getByTestId('board-info-slot');

    expect(within(slot).getByText('そこには置けない')).toHaveAttribute('data-tone', 'opportunity');
    expect(within(slot).getByTestId('inspect-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('inspect-hint')).not.toBeInTheDocument();
  });

  it('能力表示は1行の高さに固定し、チップは折り返さない', () => {
    render(<BoardInfoSlot inspectedPlate={arrowPlate()} />);
    const panel = screen.getByTestId('inspect-panel');

    expect(appliedValueOf(panel, 'height')).toBe(`${INSPECT_ROW_HEIGHT_PX}px`);
    expect(appliedValueOf(panel, 'flex-wrap')).toBe('nowrap');
  });
});
```

- [ ] **Step 11: 落ちることを確かめる**

Run: `npx jest presentation/BoardInfoSlot`
Expected: FAIL（`Cannot find module './BoardInfoSlot'`）

- [ ] **Step 12: 盤面の下の枠を作り、能力表示を1行にする**

`F/presentation/BoardInfoSlot.tsx`:

```tsx
/**
 * 灰燼の城壁 - 盤面の下の拒否理由と能力表示（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 までは拒否理由と能力表示が出入りするたびに、その下の凡例と手札が上下した。
 * ここは空でも同じ高さを占める枠にし、能力表示が閉じているときは
 * 能力表示の導線を出す（段階1 の試遊で能力表示は一度も開かれなかった。§3.8）。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { InspectPanel } from './InspectPanel';
import { COLORS } from './theme';
import {
  BOARD_INFO_GAP_PX,
  BOARD_INFO_LINE_PX,
  BOARD_INFO_SLOT_HEIGHT_PX,
  INSPECT_ROW_HEIGHT_PX,
} from './layout-constants';

/**
 * 拒否理由の色トーン（StageView から移設）
 *
 * 拒否は「不便」であって砦が削られる「本当の危険」ではないため、赤は使わない。
 * この定数から色と data-tone 属性の両方を導出する（片方だけ変えられないように）。
 */
export const REJECTION_NOTICE_TONE = 'opportunity' as const;

/** 能力表示が閉じているときの導線 */
export const INSPECT_HINT_TEXT = '置いた札をタップすると能力を表示';

const Slot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${BOARD_INFO_GAP_PX}px;
  height: ${BOARD_INFO_SLOT_HEIGHT_PX}px;
  margin-top: 4px;
  overflow: hidden;
`;

const RejectionLine = styled.p`
  margin: 0;
  height: ${BOARD_INFO_LINE_PX}px;
  line-height: ${BOARD_INFO_LINE_PX}px;
  color: ${COLORS[REJECTION_NOTICE_TONE]};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Hint = styled.p`
  margin: 0;
  height: ${INSPECT_ROW_HEIGHT_PX}px;
  line-height: ${INSPECT_ROW_HEIGHT_PX}px;
  padding: 0 8px;
  font-size: 11px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  rejectionNotice?: string;
  inspectedPlate?: PlateModel;
}

export const BoardInfoSlot: React.FC<Props> = ({ rejectionNotice, inspectedPlate }) => (
  <Slot data-testid="board-info-slot">
    <RejectionLine data-testid="rejection-line" data-tone={REJECTION_NOTICE_TONE}>
      {rejectionNotice ?? ''}
    </RejectionLine>
    {inspectedPlate ? (
      <InspectPanel plate={inspectedPlate} />
    ) : (
      <Hint data-testid="inspect-hint">{INSPECT_HINT_TEXT}</Hint>
    )}
  </Slot>
);
```

`InspectPanel.tsx`:

1. import に `import { INSPECT_ROW_HEIGHT_PX } from './layout-constants';` を足す
2. `Panel` と `Chip` を次に置き換える:

```tsx
/**
 * 能力表示の1行（反復7 段階2・設計書 §4.0 a）
 *
 * 高さを固定し、チップは折り返さず横へ流す（狭い画面では横にスクロールして読む）。
 * 折り返すと、開くたびに枠の高さが変わって手札が動く。
 */
const Panel = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: ${INSPECT_ROW_HEIGHT_PX}px;
  box-sizing: border-box;
  padding: 0 8px;
  overflow-x: auto;
  white-space: nowrap;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const Chip = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  opacity: 0.9;
`;
```

`StageView.tsx`:

1. import に `import { BoardInfoSlot } from './BoardInfoSlot';` を足し、`import { InspectPanel } from './InspectPanel';` を削除する
2. `Center` を次にする（`flex: 1` を外す）:

```tsx
/**
 * 盤面・盤面の下の枠・凡例・決着
 *
 * `flex: 1` を持たせない（反復7 段階2・設計書 §4.0 a）。持たせると、中身が
 * Layout の min-height（70vh）未満のとき手札が伸びた分だけ Center が縮み、
 * 手札の上端が上がる。
 */
const Center = styled.div`
  padding: 12px;
`;
```

3. `REJECTION_NOTICE_TONE` の定義（docstring を含む）と `RejectionNotice` の定義を削除する（`BoardInfoSlot.tsx` へ移した）
4. `<BoardWrapper>` を `<BoardWrapper data-testid="board-wrapper">` にする
5. `{game.rejectionNotice && (…)}` と `{game.inspectedPlate && <InspectPanel plate={game.inspectedPlate} />}` の2つを次の1行に置き換える:

```tsx
        <BoardInfoSlot rejectionNotice={game.rejectionNotice} inspectedPlate={game.inspectedPlate} />
```

6. `<LevyChoice …/>` の行の直前にコメントを足す:

```tsx
      {/* 徴発は構築・獲得の両プールから外れており（availability: 'retired'）遠征では描画されない。
          盤面の上に残すが高さは変わらない（反復7 段階2 §4.0 a。§3.5 により徴発の UI は触らない） */}
```

- [ ] **Step 13: 通ることを確かめる**

Run: `npx jest presentation/BoardInfoSlot presentation/InspectPanel presentation/StageView`
Expected: PASS

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 14: E2E を書く**

`e2e/ashen-rampart/layout-stability.spec.ts`:

```ts
/**
 * E2E: 戦闘中に盤面と手札が上下に動かない（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 の試遊で「画面のサイズがコロコロ変わり、戦闘開始時に慌てる」と言われた。
 * 一時表示（拒否理由・能力表示・溢れ・ライフが減った理由・予告）を操作と時間経過で
 * 起こしながら、盤面と手札の上端を何度も測り、変化が 0px であることを確かめる。
 *
 * 位置は文書座標（top + scrollY）で測る。Playwright のクリックは要素を画面内へ
 * スクロールさせるので、画面座標のままだとスクロールを「動いた」と誤読する。
 */
import { test, expect, type Page } from '@playwright/test';

/** localStorage のキー（expedition-flow.spec.ts と同じ） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/ashen-rampart';

/**
 * 最悪ケースのシード（expedition-flow.spec.ts と同じ）。速攻型の開始手札が
 * 弩砲・徹甲弩・火砲台の塔3枚になり、手札の幅を最も取る
 */
const WIDEST_HAND_SEED = '748559145';

/** 時間経過で起きる一時表示（予告の切り替え・手札の満杯・溢れ・漏れ）を拾う観測の長さ */
const OBSERVE_SECONDS = 30;
const OBSERVE_INTERVAL_MS = 1_000;
/** 操作が次の tick に反映されるのを待つ時間（1 tick = 100ms） */
const SETTLE_MS = 300;
/** 弩砲を置く経路外のセル（北レーンから距離2。弩砲の射程2.4 で北レーンを撃てる） */
const PLACE_CELL_TEST_ID = 'cell-4-0';

const VIEWPORTS = [
  { name: '1280x800', width: 1280, height: 800 },
  { name: '360x740', width: 360, height: 740 },
] as const;

interface Sample {
  label: string;
  board: number;
  hand: number;
}

const startExpedition = async (page: Page): Promise<void> => {
  await page.addInitScript((noticeKey) => {
    localStorage.setItem(noticeKey, 'true');
    localStorage.removeItem('ashen-rampart:play-log-v6');
    localStorage.removeItem('ashen-rampart:briefing-seen-v1');
  }, NOTICE_STORAGE_KEY);
  await page.goto('/ashen-rampart', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByRole('button', { name: /速攻型 を読み込む/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /速攻型 を読み込む/ }).click();
  await page.getByLabel('シード（空欄なら毎回ランダム）').fill(WIDEST_HAND_SEED);
  await page.getByRole('button', { name: 'この構成で始める' }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await expect(page.getByTestId('board-wrapper')).toBeVisible();
};

/** 盤面と手札の上端（文書座標・px） */
const measure = async (page: Page, label: string): Promise<Sample> => {
  const tops = await page.evaluate(() => {
    const topOf = (el: Element | null): number =>
      el ? el.getBoundingClientRect().top + window.scrollY : Number.NaN;
    return {
      board: topOf(document.querySelector('[data-testid="board-wrapper"]')),
      hand: topOf(document.querySelector('[role="group"][aria-label="手札"]')),
    };
  });
  return { label, ...tops };
};

/** 決着パネルが出たら「戦闘中」ではないので測らない */
const isPlaying = async (page: Page): Promise<boolean> =>
  (await page.getByRole('button', { name: /獲得へ進む|遠征の結果へ/ }).count()) === 0;

const spreadOf = (values: readonly number[]): number => Math.max(...values) - Math.min(...values);

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: 戦闘中に盤面と手札の上端が動かない`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await startExpedition(page);
    const samples: Sample[] = [await measure(page, '開始直後')];

    // 札を選ぶ（置けるセルの縁取りと、射程の斜線が出る）
    await page.getByRole('button', { name: /弩砲 コスト2/ }).click();
    samples.push(await measure(page, '札を選択'));

    // 砦のセルに置こうとして拒否理由を出す
    await page.getByTestId('cell-8-3').click();
    await page.waitForTimeout(SETTLE_MS);
    samples.push(await measure(page, '拒否理由'));

    // 経路外の (4,0) に置き、そのセルをタップして能力表示を開く。
    // 左上の角のセルは、スクロール後に固定表示のホームボタン（左上 40px）の下に入りうるので避ける
    await page.getByRole('button', { name: /弩砲 コスト2/ }).click();
    await expect(page.getByTestId(PLACE_CELL_TEST_ID)).toHaveAttribute('aria-label', /ここに置ける/);
    await page.getByTestId(PLACE_CELL_TEST_ID).click();
    await page.waitForTimeout(SETTLE_MS);
    samples.push(await measure(page, '配置'));
    await page.getByTestId(PLACE_CELL_TEST_ID).click();
    await expect(page.getByTestId('inspect-panel')).toBeVisible();
    samples.push(await measure(page, '能力表示'));

    // 時間経過で起きる一時表示（予告の切り替え・手札の満杯と溢れ・漏れ）を観測する
    for (let second = 1; second <= OBSERVE_SECONDS; second += 1) {
      await page.waitForTimeout(OBSERVE_INTERVAL_MS);
      if (!(await isPlaying(page))) break;
      samples.push(await measure(page, `${second}秒後`));
    }

    await testInfo.attach(`layout-${viewport.name}`, {
      body: JSON.stringify({ viewport, samples }, null, 2),
      contentType: 'application/json',
    });

    expect(samples.length).toBeGreaterThan(OBSERVE_SECONDS / 2);
    expect(spreadOf(samples.map((s) => s.board))).toBe(0);
    expect(spreadOf(samples.map((s) => s.hand))).toBe(0);
  });
}
```

- [ ] **Step 15: E2E を回す（コントローラが回す）**

Run（背景実行）:

```bash
npm run build && CI=1 PLAYWRIGHT_BROWSERS_PATH=/tmp/claude-1000/-workspaces-claym-local-cline-playground-for-frontend/02a5ce9d-b9a5-4fb1-9299-820031e00606/scratchpad/pw \
  npx playwright test e2e/ashen-rampart --project=chromium
```

Expected: `expedition-flow.spec.ts` の2件と `layout-stability.spec.ts` の2件が PASS。**落ちたら添付の `samples` を読み、どのラベルの間で動いたかから原因の要素を特定する**（閾値を緩めない）

- [ ] **Step 16: コミット**

```bash
git add src/features/ashen-rampart/presentation/layout-constants.ts \
        src/features/ashen-rampart/presentation/RunStatusBar.tsx \
        src/features/ashen-rampart/presentation/RunStatusBar.test.tsx \
        src/features/ashen-rampart/presentation/HandNoticeSlot.tsx \
        src/features/ashen-rampart/presentation/HandNoticeSlot.test.tsx \
        src/features/ashen-rampart/presentation/HandArea.tsx \
        src/features/ashen-rampart/presentation/BoardInfoSlot.tsx \
        src/features/ashen-rampart/presentation/BoardInfoSlot.test.tsx \
        src/features/ashen-rampart/presentation/InspectPanel.tsx \
        src/features/ashen-rampart/presentation/StageView.tsx \
        e2e/ashen-rampart/layout-stability.spec.ts
git commit -F - <<'EOF'
fix(ashen-rampart): 一時表示を高さを予約した枠へ移し、戦闘中に盤面と手札を動かさない

- 状態帯を3行固定のグリッドにし、危険・ライフが減った理由を空でも同じ欄に置く
- 手札の上の通知を2行固定の枠へ、盤面の下の拒否理由と能力表示を60px固定の枠へ移す
- 能力表示が閉じているときは能力表示の導線を出す
- E2E で 1280x800 と 360x740 の2幅について盤面と手札の上端の変化が 0px であることを測る

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 4: 敵へのダメージを `applyDamage` に一本化する（設計書 §4.2 (1)・PR #201 minor #6）

**Files:**
- Create: `F/domain/combat/damage.ts` / Test: `F/domain/combat/damage.test.ts`
- Modify: `F/domain/combat/combat-state.ts:62-72`（撃破源の契約コメント）、`:77-125`（`TickEvent`）
- Modify: `F/domain/combat/enemies.ts:17-45`（`EnemySpec` に `armor?`）
- Modify: `F/domain/combat/step-tick.ts:236-243`（`SourceById` を移す）、`:600-853`（5経路）、`:863-887`（`resolveDamage`）、`:951-965`（呼び出し）
- Test: `F/domain/combat/step-tick-piercing.test.ts`（末尾に追記）

**Interfaces:**
- Produces（`damage.ts`）:
  - `type SourceById = Map<number, DefeatSource>`
  - `interface DamageDraft { hpById: Map<number, number>; sourceById: SourceById; events: TickEvent[] }`
  - `interface DamageHit { enemy: ActiveEnemy; raw: number; source: DefeatSource; armor: number }`
  - `armorOf(enemy: ActiveEnemy): number` / `hitOn(enemy: ActiveEnemy, raw: number, source: DefeatSource): DamageHit`
  - `applyDamage(draft: DamageDraft, hit: DamageHit): number`（実際に削った量を返す）
  - `canTowerHit(spec: { hitsFlying: boolean }, enemy: ActiveEnemy, tick: number): boolean`
- Produces（`combat-state.ts`）: `TickEvent` に `{ kind: 'armor-hit'; enemyId: number; raw: number; dealt: number; armor: number }`
- Produces（`enemies.ts`）: `EnemySpec.armor?: number`

判断: 命中は装甲を必須の値として持ち、`hitOn` が敵定義から埋める（呼び出し側が装甲を渡し忘れる経路を作らない）。`raw <= 0` は何もしない（罠の `damage > 0` ガードを吸収する）。
判断: 貫通にも `canTowerHit` を入れる。`hitsFlying` と一貫させる。現行の札では挙動は変わらず、`anti-air` のノックアウト変種の徹甲弩で差が出る（`knockout-cards.ts:94` で `hitsFlying: false` になる。測定道具の欠陥が直る）。
判断: 装甲の命中は軽減0 を含めて毎回 `armor-hit` を積む（§4.3 #1 の表示の材料）。

**このタスクは現行の札と敵について挙動を1つも変えない**（装甲を持つ敵がまだいない）。既存の戦闘テストがそのまま緑であることが検査の中心になる。

- [ ] **Step 1: イベント型と `armor` を足す**

`combat-state.ts`:

1. `DefeatSource` の直前の docstring の `* 契約: **最後に削った者に帰属する**（オーバーキル分は問わない）。` の次の行に足す:

```ts
 * **装甲で 0 に抑えられた命中は「削った」に数えない**（反復7 段階2・設計書 §4.2）。
 * 書き込みは damage.ts の applyDamage だけが行う。
```

2. `TickEvent` の `| { kind: 'trap'; trapIndex: number; targetId: number }` の直後に足す:

```ts
  /**
   * 装甲を持つ敵への1ヒット（反復7 段階2・設計書 §4.3 #1 の表示の材料）
   *
   * `raw` は軽減前、`dealt` は実際に削った量（最低0）。装甲は1ヒットごとに引く。
   */
  | { kind: 'armor-hit'; enemyId: number; raw: number; dealt: number; armor: number }
```

`enemies.ts` の `EnemySpec` の `attackRange: number;` の直後に足す:

```ts
  /**
   * 装甲（反復7 段階2・設計書 §4.1）。1ヒットごとにこの値を引く（最低0）
   *
   * 省略は0。軽減は domain/combat/damage.ts の applyDamage だけが行う。
   */
  armor?: number;
```

- [ ] **Step 2: 失敗するテストを書く**

`F/domain/combat/damage.test.ts`:

```ts
/**
 * 敵へのダメージの一本化（反復7 段階2・設計書 §4.2 (1)）
 *
 * 装甲は1ヒットごとに引き（最低0）、実際に削ったときだけ撃破源を書き換える。
 */
import { applyDamage, canTowerHit, hitOn, type DamageDraft } from './damage';
import type { ActiveEnemy, DefeatSource } from './combat-state';

const enemy = (overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1,
  enemyId: 'grunt',
  hp: 20,
  maxHp: 20,
  progress: 1,
  spawnTick: 0,
  laneIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  ...overrides,
});

const draftOf = (target: ActiveEnemy): DamageDraft => ({
  hpById: new Map([[target.id, target.hp]]),
  sourceById: new Map(),
  events: [],
});

const UNIT: DefeatSource = { kind: 'unit', index: 0 };
const TRAP: DefeatSource = { kind: 'trap', index: 0 };

describe('applyDamage', () => {
  it('装甲の無い敵は素のダメージだけ削られ、撃破源が書かれる', () => {
    const target = enemy();
    const draft = draftOf(target);

    const dealt = applyDamage(draft, hitOn(target, 7, UNIT));

    expect(dealt).toBe(7);
    expect(draft.hpById.get(1)).toBe(13);
    expect(draft.sourceById.get(1)).toEqual(UNIT);
  });

  it('装甲は1ヒットごとに引き、最低0 にする', () => {
    const target = enemy();
    const draft = draftOf(target);

    expect(applyDamage(draft, { enemy: target, raw: 4, source: UNIT, armor: 4 })).toBe(0);
    expect(applyDamage(draft, { enemy: target, raw: 3, source: UNIT, armor: 4 })).toBe(0);
    expect(applyDamage(draft, { enemy: target, raw: 5, source: UNIT, armor: 4 })).toBe(1);
    expect(draft.hpById.get(1)).toBe(19);
  });

  it('装甲で 0 に抑えられた命中は撃破源を書き換えない（最後に「削った」者に帰属する）', () => {
    const target = enemy({ hp: 1 });
    const draft = draftOf(target);
    applyDamage(draft, { enemy: target, raw: 5, source: TRAP, armor: 4 });

    applyDamage(draft, { enemy: target, raw: 3, source: UNIT, armor: 4 });

    expect(draft.hpById.get(1)).toBe(0);
    expect(draft.sourceById.get(1)).toEqual(TRAP);
  });

  it('ダメージ0 の命中（落網）は何もせず、イベントも積まない', () => {
    const target = enemy();
    const draft = draftOf(target);

    expect(applyDamage(draft, { enemy: target, raw: 0, source: TRAP, armor: 4 })).toBe(0);

    expect(draft.hpById.get(1)).toBe(20);
    expect(draft.sourceById.has(1)).toBe(false);
    expect(draft.events).toEqual([]);
  });

  it('装甲を持つ敵への命中は、軽減0 でも armor-hit を1件積む', () => {
    const target = enemy();
    const draft = draftOf(target);

    applyDamage(draft, { enemy: target, raw: 4, source: UNIT, armor: 4 });
    applyDamage(draft, { enemy: target, raw: 6, source: UNIT, armor: 4 });

    expect(draft.events).toEqual([
      { kind: 'armor-hit', enemyId: 1, raw: 4, dealt: 0, armor: 4 },
      { kind: 'armor-hit', enemyId: 1, raw: 6, dealt: 2, armor: 4 },
    ]);
  });

  it('装甲の無い敵への命中は armor-hit を積まない', () => {
    const target = enemy();
    const draft = draftOf(target);

    applyDamage(draft, hitOn(target, 4, UNIT));

    expect(draft.events).toEqual([]);
  });

  it('hitOn は敵定義の装甲を引く（現行の雑兵は0）', () => {
    expect(hitOn(enemy(), 4, UNIT).armor).toBe(0);
  });
});

describe('canTowerHit', () => {
  const raven = (groundedUntilTick = 0): ActiveEnemy => enemy({ enemyId: 'raven', groundedUntilTick });

  it('対空の塔は飛行に当たり、対空でない塔は飛行に当たらない', () => {
    expect(canTowerHit({ hitsFlying: true }, raven(), 10)).toBe(true);
    expect(canTowerHit({ hitsFlying: false }, raven(), 10)).toBe(false);
  });

  it('地上化している鴉には対空でない塔も当たる', () => {
    expect(canTowerHit({ hitsFlying: false }, raven(20), 10)).toBe(true);
  });

  it('地上の敵にはどの塔も当たる', () => {
    expect(canTowerHit({ hitsFlying: false }, enemy(), 10)).toBe(true);
  });
});
```

- [ ] **Step 3: 落ちることを確かめる**

Run: `npx jest domain/combat/damage`
Expected: FAIL（`Cannot find module './damage'`）

- [ ] **Step 4: `damage.ts` を実装する**

`F/domain/combat/damage.ts`:

```ts
/**
 * 灰燼の城壁 - 敵へのダメージの一本化（反復7 段階2・設計書 §4.2 (1)）
 *
 * 罠・射撃・範囲・貫通・業火の5経路は、すべて applyDamage を通して hpById を削る。
 * 理由は2つ:
 * 1. **装甲は1ヒットごとに引く**（設計書 §4.1）。経路ごとに書くと、どこか1つで
 *    引き忘れる・合計してから引く、という誤りが静かに入る
 * 2. **撃破源は「最後に削った者」**（combat-state.ts の DefeatSource の契約）。
 *    装甲で 0 に抑えられた命中は削っていないので、sourceById を書き換えない
 *
 * 生死の確定はしない（resolveDamage が全経路の後にまとめて行う）。
 */
import type { ActiveEnemy, DefeatSource, TickEvent } from './combat-state';
import { getEnemySpec } from './enemies';
import { isEnemyFlying } from './enemy-status';

/** 敵ごとの「最後に削った者」。hpById と対で applyDamage だけが書く */
export type SourceById = Map<number, DefeatSource>;

/** 1 tick 分のダメージの下書き（罠・射撃・業火で共有する作業用の値） */
export interface DamageDraft {
  hpById: Map<number, number>;
  sourceById: SourceById;
  events: TickEvent[];
}

/** 1ヒット。armor は hitOn が敵定義から埋める */
export interface DamageHit {
  enemy: ActiveEnemy;
  /** 軽減前のダメージ */
  raw: number;
  source: DefeatSource;
  armor: number;
}

/** 敵の装甲（省略は0） */
export const armorOf = (enemy: ActiveEnemy): number => getEnemySpec(enemy.enemyId).armor ?? 0;

/** その敵への命中を作る。装甲を呼び出し側に渡させない（渡し忘れの経路を作らない） */
export const hitOn = (enemy: ActiveEnemy, raw: number, source: DefeatSource): DamageHit => ({
  enemy,
  raw,
  source,
  armor: armorOf(enemy),
});

/**
 * 1ヒットを下書きに反映し、実際に削った量を返す
 *
 * - raw <= 0（落網）は何もしない
 * - 装甲は1ヒットごとに引き、最低0
 * - 削った量が 0 より大きいときだけ撃破源を書き換える
 * - 装甲を持つ敵への命中は、軽減0 を含めて armor-hit を積む（表示の材料）
 */
export const applyDamage = (draft: DamageDraft, hit: DamageHit): number => {
  if (hit.raw <= 0) return 0;
  const dealt = Math.max(0, hit.raw - hit.armor);
  const current = draft.hpById.get(hit.enemy.id) ?? hit.enemy.hp;
  draft.hpById.set(hit.enemy.id, current - dealt);
  if (dealt > 0) draft.sourceById.set(hit.enemy.id, hit.source);
  if (hit.armor > 0) {
    draft.events.push({ kind: 'armor-hit', enemyId: hit.enemy.id, raw: hit.raw, dealt, armor: hit.armor });
  }
  return dealt;
};

/** その塔がその敵に当たるか（飛行は対空の塔だけ。地上化中は地上と同じ） */
export const canTowerHit = (spec: { hitsFlying: boolean }, enemy: ActiveEnemy, tick: number): boolean =>
  spec.hitsFlying || !isEnemyFlying(enemy, tick);
```

- [ ] **Step 5: 通ることを確かめる**

Run: `npx jest domain/combat/damage`
Expected: PASS（10件）

- [ ] **Step 6: 失敗するテストを書く（貫通の飛行判定）**

`step-tick-piercing.test.ts` の import に足す:

```ts
import { knockoutIdOf } from '../cards/knockout-cards';
import { KNOCKOUT_CARD_IDS } from '../cards/card-pool';
import type { ActiveEnemy } from './combat-state';
import type { WaveDefinition } from './waves';
```

末尾に足す:

```ts
describe('貫通の飛行判定（反復7 段階2・PR #201 minor #6）', () => {
  // 現行の徹甲弩は hitsFlying: true なので差が出ない。対空をノックアウトした変種
  // （hitsFlying: false・piercing: true）で「直線上の鴉に当たらない」ことを確かめる
  const KNOCKED_PIERCER = knockoutIdOf('anti-air', 'piercer');
  const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
  const onLane0 = (id: number, enemyId: string, progress: number, hp: number): ActiveEnemy => ({
    id, enemyId, hp, maxHp: hp, progress, spawnTick: 0, laneIndex: 0,
    alive: true, leaked: false, groundedUntilTick: 0,
  });
  // (3,1) から真下の雑兵 (3,2) を撃つ。鴉は同じレーンのすぐ先（x≈3.3）にいて、
  // 射線（x=3 の線分）から 0.5 以内に入る
  const setup = (cardId: string): CombatState => ({
    ...createCombatState(createDeck(['reactor'], () => 0), noWave),
    units: [{ cardId, pos: { x: 3, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    enemies: [onLane0(1, 'grunt', 3.0, 20), onLane0(2, 'raven', 3.2, 16)],
  });

  it('前提: 対空をノックアウトした徹甲弩は、貫通のまま対空だけを失っている', () => {
    expect(KNOCKOUT_CARD_IDS).toContain(KNOCKED_PIERCER);
  });

  it('対空でない貫通の塔は、直線上の鴉に当たらない', () => {
    const next = stepTick(setup(KNOCKED_PIERCER), [], PLAINS_MAP);

    expect(next.enemies.find((e) => e.id === 1)?.hp).toBeLessThan(20);
    expect(next.enemies.find((e) => e.id === 2)?.hp).toBe(16);
  });

  it('対空の貫通の塔（本物の徹甲弩）は、直線上の鴉にも当たる（挙動は変わらない）', () => {
    const next = stepTick(setup('piercer'), [], PLAINS_MAP);

    expect(next.enemies.find((e) => e.id === 2)?.hp).toBeLessThan(16);
  });
});
```

- [ ] **Step 7: 落ちることを確かめる**

Run: `npx jest domain/combat/step-tick-piercing`
Expected: 「対空でない貫通の塔は、直線上の鴉に当たらない」だけが FAIL（鴉の hp が 2）。他は PASS

- [ ] **Step 8: 5経路を `applyDamage` へ置き換える**

`step-tick.ts`:

1. import に足す:

```ts
import { applyDamage, canTowerHit, hitOn, type DamageDraft } from './damage';
```

2. `SourceById` の型定義（docstring を含む 236〜243行）を削除する（`damage.ts` へ移した）
3. `applyTraps` を次に置き換える（docstring はそのまま残し、`hpById に` を `下書き（DamageDraft）に` へ直す）:

```ts
const applyTraps = (
  traps: readonly PlacedTrap[],
  moved: readonly ActiveEnemy[],
  draft: DamageDraft,
  ctx: { statusById: Map<number, EnemyStatusDraft>; tick: number; map: StageMap }
): PlacedTrap[] =>
  traps.map((trap, trapIndex) => {
    if (trap.usesLeft <= 0) return trap;
    const spec = getCardDefinition(trap.cardId).trap;
    if (!spec) return trap;
    let usesLeft = trap.usesLeft;
    const hitEnemyIds = [...trap.hitEnemyIds];
    moved.forEach((enemy) => {
      if (!enemy.alive || usesLeft <= 0) return;
      if (hitEnemyIds.includes(enemy.id)) return;
      const flying = isEnemyFlying(enemy, ctx.tick);
      // 落網は飛行のみ、それ以外の罠は地上のみに発動する
      const targetsFlying = spec.groundedTicks !== undefined;
      if (targetsFlying !== flying) return;
      const pos = enemyPosition(ctx.map, enemy);
      if (Math.hypot(pos.x - trap.pos.x, pos.y - trap.pos.y) > TRAP_TRIGGER_DISTANCE) return;
      // 落網（damage 0）は applyDamage が何もしない（raw <= 0 は無操作）
      applyDamage(draft, hitOn(enemy, spec.damage, { kind: 'trap', index: trapIndex }));
      if (spec.groundedTicks !== undefined) {
        ctx.statusById.set(enemy.id, { groundedUntilTick: ctx.tick + spec.groundedTicks - 1 });
      }
      hitEnemyIds.push(enemy.id);
      usesLeft -= 1;
      draft.events.push({ kind: 'trap', trapIndex, targetId: enemy.id });
    });
    return { ...trap, usesLeft, hitEnemyIds };
  });
```

4. `applyUnitShots` を次に置き換える（docstring はそのまま）:

```ts
const applyUnitShots = (
  scene: { state: CombatState; units: readonly PlacedUnit[]; moved: readonly ActiveEnemy[] },
  draft: DamageDraft,
  ctx: { map: StageMap; tick: number }
): PlacedUnit[] => {
  const { state, units, moved } = scene;
  const { map, tick } = ctx;
  const stateForDamage: CombatState = { ...state, units: [...units] };
  return units.map((unit, unitIndex) => {
    const spec = getCardDefinition(unit.cardId).tower;
    if (!spec || spec.aura) return unit;
    if (unit.cooldownLeft > 0) return { ...unit, cooldownLeft: unit.cooldownLeft - 1 };
    const range = effectiveRange(stateForDamage, unitIndex, map);
    const target = selectUnitTarget(unit, spec, range, moved, map, draft.hpById, tick);
    if (!target) return unit;
    const { total: damage, auraBonus } = damageBreakdown(stateForDamage, unitIndex, map, target);
    const targetPos = enemyPosition(map, target);
    const distance = Math.hypot(targetPos.x - unit.pos.x, targetPos.y - unit.pos.y);
    draft.events.push({
      kind: 'shot',
      unitIndex,
      targetId: target.id,
      auraDamageBonus: auraBonus,
      // 素の射程を超えている＝鍛冶場のオーラで初めて届いた射撃
      beyondBaseRange: distance > spec.range,
    });
    const source: DefeatSource = { kind: 'unit', index: unitIndex };
    // 貫通・範囲・単体は互いに排他な3つの当たり方（設計書 §7 の3軸）。
    // 貫通は標的自身も直線上の1点として applyPiercingDamage が拾うため、
    // ここで別途 applyDamage しない（二重にダメージが乗ってしまう）。
    if (spec.piercing) {
      applyPiercingDamage(
        { from: unit.pos, toward: targetPos, range, damage, hitsFlying: spec.hitsFlying, source },
        moved,
        draft,
        ctx
      );
    } else {
      applyDamage(draft, hitOn(target, damage, source));
      if (spec.splashRadius > 0) {
        applySplashDamage({ target, spec, unitIndex, stateForDamage }, moved, draft, ctx);
      }
    }
    // 発射周期をちょうど cooldownTicks tick にするため -1 する（Math.max で下限0。既存の説明どおり）
    return { ...unit, cooldownLeft: Math.max(0, spec.cooldownTicks - 1) };
  });
};
```

5. `selectUnitTarget` の `.filter((e) => spec.hitsFlying || !isEnemyFlying(e, tick))` を `.filter((e) => canTowerHit(spec, e, tick))` にする
6. `applySplashDamage` を次に置き換える（docstring はそのまま）:

```ts
const applySplashDamage = (
  splash: {
    target: ActiveEnemy;
    spec: NonNullable<CardDefinition['tower']>;
    unitIndex: number;
    stateForDamage: CombatState;
  },
  moved: readonly ActiveEnemy[],
  draft: DamageDraft,
  ctx: { map: StageMap; tick: number }
): void => {
  const center = enemyPosition(ctx.map, splash.target);
  moved.forEach((other) => {
    if (other.id === splash.target.id || !other.alive) return;
    if (!canTowerHit(splash.spec, other, ctx.tick)) return;
    const pos = enemyPosition(ctx.map, other);
    if (Math.hypot(pos.x - center.x, pos.y - center.y) > splash.spec.splashRadius) return;
    const damage = effectiveDamage(splash.stateForDamage, splash.unitIndex, ctx.map, other);
    applyDamage(draft, hitOn(other, damage, { kind: 'unit', index: splash.unitIndex }));
  });
};
```

7. `applyPiercingDamage` を docstring ごと次に置き換える:

```ts
/** 貫通の1射（標的の方向へ射程いっぱいに伸ばした線分） */
interface PiercingShot {
  from: CellPos;
  toward: { x: number; y: number };
  range: number;
  damage: number;
  hitsFlying: boolean;
  source: DefeatSource;
}

/**
 * 貫通ダメージ
 *
 * 守り手から標的へ引いた直線上にいる敵すべてに、同じダメージを与える。
 * 標的より奥の敵にも当たるよう、線分は標的の先まで射程いっぱいに伸ばす。
 * **飛行の判定は範囲攻撃と同じ canTowerHit で行う**（反復7 段階2・PR #201 minor #6）。
 * 現行の徹甲弩は hitsFlying: true なので結果は変わらないが、対空をノックアウトした
 * 変種（knockout-cards.ts）が直線上の鴉に当たっていた。
 */
const applyPiercingDamage = (
  shot: PiercingShot,
  moved: readonly ActiveEnemy[],
  draft: DamageDraft,
  ctx: { map: StageMap; tick: number }
): void => {
  const dx = shot.toward.x - shot.from.x;
  const dy = shot.toward.y - shot.from.y;
  const length = Math.hypot(dx, dy) || 1;
  const end = {
    x: shot.from.x + (dx / length) * shot.range,
    y: shot.from.y + (dy / length) * shot.range,
  };
  moved.forEach((enemy) => {
    if (!enemy.alive) return;
    if ((draft.hpById.get(enemy.id) ?? enemy.hp) <= 0) return;
    if (!canTowerHit(shot, enemy, ctx.tick)) return;
    const pos = enemyPosition(ctx.map, enemy);
    if (distanceToSegment(pos, shot.from, end) > PIERCING_WIDTH) return;
    applyDamage(draft, hitOn(enemy, shot.damage, shot.source));
  });
};
```

8. `applyBlasts` を次に置き換える（docstring の `hpById` を `下書き` へ直す）:

```ts
const applyBlasts = (
  blasts: readonly PendingBlast[],
  moved: readonly ActiveEnemy[],
  draft: DamageDraft,
  ctx: { map: StageMap; tick: number }
): void => {
  blasts.forEach((blast) => {
    moved.forEach((enemy) => {
      if (!enemy.alive || isEnemyFlying(enemy, ctx.tick)) return;
      const pos = enemyPosition(ctx.map, enemy);
      if (Math.hypot(pos.x - blast.pos.x, pos.y - blast.pos.y) > blast.radius) return;
      applyDamage(draft, hitOn(enemy, blast.damage, { kind: 'ember', index: blast.emberIndex }));
    });
  });
};
```

9. `resolveDamage` の引数と本体を次に置き換える（docstring はそのまま）:

```ts
const resolveDamage = (
  moved: readonly ActiveEnemy[],
  draft: DamageDraft,
  statusById: ReadonlyMap<number, EnemyStatusDraft>
): ActiveEnemy[] =>
  moved.map((enemy) => {
    if (!enemy.alive) return enemy;
    const status = statusById.get(enemy.id);
    const withStatus =
      status === undefined
        ? enemy
        : { ...enemy, groundedUntilTick: status.groundedUntilTick ?? enemy.groundedUntilTick };
    const hp = draft.hpById.get(enemy.id) ?? withStatus.hp;
    if (hp > 0) return { ...withStatus, hp };
    const source = draft.sourceById.get(enemy.id);
    // 撃破源が無い hp<=0 は論理的に起こり得ない（削った者がいなければ 0 にならない）。
    // 万一起きた場合に defeat を握り潰すと集計が静かに壊れるため、契約違反として落とす。
    if (!source) {
      throw new Error(`撃破源が記録されていません: enemyId=${enemy.id}`);
    }
    draft.events.push({ kind: 'defeat', enemyId: enemy.id, source });
    return { ...withStatus, hp: 0, alive: false };
  });
```

10. `stepTick` の `// --- 罠 → 射撃 → 業火・燠火の順で …` から `const damaged = resolveDamage(…);` までを次に置き換える:

```ts
  // --- 罠 → 射撃 → 業火・燠火の順で hpById に下書きし、最後にまとめて反映する ---
  // 敵へのダメージはすべて applyDamage を通す（装甲と撃破源の帰属を1箇所で守る。反復7 段階2）
  const hpById = new Map<number, number>();
  moved.forEach((e) => hpById.set(e.id, e.hp));
  const draft: DamageDraft = { hpById, sourceById: new Map(), events };
  const statusById = new Map<number, EnemyStatusDraft>();
  const traps = applyTraps(afterActions.traps, moved, draft, { statusById, tick, map });
  const units = applyUnitShots({ state, units: survivingUnits, moved }, draft, { map, tick });
  applyBlasts(afterActions.blasts, moved, draft, { map, tick });

  // --- ダメージ・状態反映 → 漏れ ---
  const damaged = resolveDamage(moved, draft, statusById);
```

11. `grep -n "hpById.set\|sourceById.set" src/features/ashen-rampart/domain/combat/step-tick.ts` を実行し、**出力が空**であることを確かめる（書き込みは `damage.ts` だけ）

- [ ] **Step 9: 挙動が変わっていないことを確かめる**

Run: `npx jest domain/combat/damage domain/combat/step-tick-piercing domain/combat/step-tick-defeat-source domain/combat/step-tick-traps domain/combat/step-tick-combat domain/combat/step-tick-support domain/combat/step-tick-status domain/combat/step-tick-range domain/combat/step-tick-blocking domain/combat/step-tick.test`
Expected: PASS（既存の期待値は1つも変えない）

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 10: コントローラが `domain/combat` 全体を回す**

Run（コントローラ・背景実行）: `npx jest domain/combat`
Expected: 全件 PASS（`balance.test.ts` を含む。装甲を持つ敵がまだいないので数値は1つも動かない。**動いたら一本化で振る舞いが変わっているので、実装者に差し戻す**）

- [ ] **Step 11: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/damage.ts \
        src/features/ashen-rampart/domain/combat/damage.test.ts \
        src/features/ashen-rampart/domain/combat/combat-state.ts \
        src/features/ashen-rampart/domain/combat/enemies.ts \
        src/features/ashen-rampart/domain/combat/step-tick.ts \
        src/features/ashen-rampart/domain/combat/step-tick-piercing.test.ts
git commit -F - <<'EOF'
refactor(ashen-rampart): 敵へのダメージを applyDamage に一本化し、装甲と撃破源の規則を1箇所で守る

- 罠・射撃・範囲・貫通・業火の5経路の hpById への書き込みを applyDamage へ置き換える
- 装甲は1ヒットごとに引き、削った量が0より大きいときだけ撃破源を書き換える
- 貫通にも飛行の判定を入れる（PR #201 minor #6。対空を外した測定用の変種が鴉に当たっていた）
- 現行の札と敵では挙動を変えない

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 5: 盾衛と癒し手を敵定義に加える（設計書 §4.1・PR #201 minor #10）

**Files:**
- Modify: `F/domain/combat/enemies.ts`（冒頭コメント・`EnemySpec`・`ENEMIES`）
- Test: `F/domain/combat/waves.test.ts:11-35`、`F/domain/combat/enemies.test.ts`（全体）
- Test: `F/domain/combat/step-tick-armor.test.ts`（新設）
- Modify: `F/presentation/theme.ts`、`F/presentation/enemy-visual.ts:21-33, 48`
- Test: `F/presentation/enemy-visual.test.ts:35`
- Modify: `F/presentation/EnemyLegend.tsx` / Test: `F/presentation/EnemyLegend.test.tsx`

**Interfaces:**
- Consumes: Task 4 の `applyDamage` / `armor-hit`
- Produces:
  - `export interface EnemyHealSpec { amount: number; intervalTicks: number; radius: number }`、`EnemySpec.heal?: EnemyHealSpec`
  - 敵ID `warden`（盾衛）・`mender`（癒し手）
  - `COLORS.heal = '#7fb069'`
  - `abilityTextsOf(spec: EnemySpec): string[]`（`EnemyLegend.tsx`）

判断: 盾衛 `attackIntervalTicks: 30`、癒し手 `attack: 1` / `attackIntervalTicks: 20`（設計書に無い値。癒し手が壁の前で膠着しないように）。
判断: 「重装は最も硬く最も遅い」は HP 最大＝重装・速度は盾衛と同値で最遅を共有、と読む。盾衛の硬さは装甲で表すことを別のテストで固定する。
判断: 射程とレーンの不変条件は、凍結台本＋暫定ステージで「射程持ちは北以外に出ない」に書き換え、雑兵・重装が凍結台本の北に出ることは別の検査で残す。
判断: 敵の能力は凡例に `装甲4` / `回復3（4秒ごと・周囲1.5）` と説明文で出す（判定項目9(a) の自己紹介）。

**既存テストの期待値を変える箇所（理由つき）:**
- `waves.test.ts` 「敵は5種ある」→ 7種（2種を足すため）
- `enemies.test.ts` 「射程を持つのは重装と雑兵だけ」→ `['brute', 'grunt', 'warden']`（設計書 §4.1 が盾衛に射程1.5 を与えている）
- `enemies.test.ts` 「射程を持つ敵はすべて北レーン（0）にしか出現しない」→ 凍結台本に出ない盾衛で `[]` ≠ `[0]` になる。「北以外に出ない」（部分集合）へ書き換え、**台本の和集合で検査するので弱くならない**。存在の検査（雑兵・重装は凍結台本の北に出る）は別の `it` で残す
- `enemy-visual.test.ts` / `EnemyLegend.test.tsx` のテスト名の「5種」→「7種」
- `EnemyLegend.test.tsx` 「射程を持つ敵には射程を出す」の `getByText(/射程 1\.5/)` → `getAllByText(...)` が2件（盾衛も射程1.5 なので単数の取得は例外になる。件数を固定するので弱くならない）

- [ ] **Step 1: 失敗するテストに書き換える（敵定義）**

`waves.test.ts` の `describe('敵定義', …)` の中を次にする（「飛行するのは鴉だけ」「俊足は雑兵より速い」「未知の敵ID」の3件はそのまま残す）:

```ts
  it('敵は7種ある（反復7 段階2 で盾衛・癒し手を加えた）', () => {
    expect(ENEMY_IDS).toHaveLength(7);
  });

  it('重装は最も HP が多く、最も遅い（盾衛と同速。盾衛の硬さは HP ではなく装甲で表す）', () => {
    const hps = ENEMY_IDS.map((id) => getEnemySpec(id).hp);
    expect(getEnemySpec('brute').hp).toBe(Math.max(...hps));
    const speeds = ENEMY_IDS.map((id) => getEnemySpec(id).speed);
    expect(getEnemySpec('brute').speed).toBe(Math.min(...speeds));
  });

  it('装甲を持つのは盾衛だけで、その HP は重装より低い', () => {
    const armored = ENEMY_IDS.filter((id) => (getEnemySpec(id).armor ?? 0) > 0);
    expect(armored).toEqual(['warden']);
    expect(getEnemySpec('warden').hp).toBeLessThan(getEnemySpec('brute').hp);
  });

  it('回復を持つのは癒し手だけ', () => {
    expect(ENEMY_IDS.filter((id) => getEnemySpec(id).heal !== undefined)).toEqual(['mender']);
  });

  it('新敵の初期値は設計書 §4.1 のとおり（数値はすべて較正対象）', () => {
    expect(getEnemySpec('warden')).toMatchObject({
      name: '盾衛', hp: 45, armor: 4, speed: 0.06, attack: 8, attackRange: 1.5, flying: false,
    });
    expect(getEnemySpec('mender')).toMatchObject({
      name: '癒し手', hp: 18, speed: 0.1, attackRange: 0, flying: false,
      heal: { amount: 3, intervalTicks: 40, radius: 1.5 },
    });
  });
```

`enemies.test.ts` の import から `describe` の終わりまでを次に置き換える:

```ts
import { ENEMY_IDS, getEnemySpec } from './enemies';
import { PLAINS_WAVES, type WaveDefinition } from './waves';
import { PROVISIONAL_STAGES } from '../expedition/stage-pool';

/** 凍結台本と、暫定ステージの台本すべて（反復7 段階2 で新敵が暫定ステージに出る） */
const ALL_SCRIPTS: readonly (readonly WaveDefinition[])[] = [
  PLAINS_WAVES,
  ...PROVISIONAL_STAGES.map((stage) => stage.waves),
];

const lanesOf = (
  enemyId: string,
  scripts: readonly (readonly WaveDefinition[])[] = [PLAINS_WAVES]
): Set<number> =>
  new Set(
    scripts.flatMap((waves) =>
      waves.flatMap((wave) =>
        wave.entries.filter((e) => e.enemyId === enemyId).map((e) => e.laneIndex)
      )
    )
  );

describe('射程を持つ敵（反復5・反復7 段階2）', () => {
  it('射程を持つのは重装・雑兵・盾衛だけ', () => {
    const withRange = ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0);
    expect(withRange.sort()).toEqual(['brute', 'grunt', 'warden']);
  });

  it('射程を持つ敵は、凍結台本でも暫定ステージでも北レーン（0）以外に出ない', () => {
    // 南レーンは群れと鴉の道。ここに射程を配ると上限3 でも盤面が溶ける（反復5 §4.3）
    ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0).forEach((id) => {
      expect([...lanesOf(id, ALL_SCRIPTS)].filter((lane) => lane !== 0)).toEqual([]);
    });
  });

  it('凍結台本の射程持ち（雑兵・重装）は北レーンに出現する', () => {
    expect([...lanesOf('grunt')]).toEqual([0]);
    expect([...lanesOf('brute')]).toEqual([0]);
  });

  it('射程を持たない敵は、凍結台本では南レーンに出現する（レーンの性格分けが成立している）', () => {
    const southOnly = ENEMY_IDS.filter(
      (id) => getEnemySpec(id).attackRange === 0 && lanesOf(id).size > 0
    );
    expect(southOnly.length).toBeGreaterThan(0);
    southOnly.forEach((id) => {
      expect([...lanesOf(id)]).toEqual([1]);
    });
  });
});
```

（冒頭の docstring はそのまま残す）

- [ ] **Step 2: 失敗するテストを書く（装甲の実戦）**

`F/domain/combat/step-tick-armor.test.ts`:

```ts
/**
 * 盾衛の装甲（反復7 段階2・設計書 §4.1 / §4.4）
 *
 * 装甲4 と弓兵4 の関係は意図的である。素の弓兵は通らず、篝火（+25%）の隣なら1通る。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type ActiveEnemy, type CombatState, type PlacedUnit } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

/** 北レーンの (2,2) にいる盾衛。1 tick で 0.06 進むだけなので弓兵の射程から出ない */
const warden = (): ActiveEnemy => ({
  id: 1, enemyId: 'warden', hp: 45, maxHp: 45, progress: 2, spawnTick: 0,
  laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
});

const tower = (cardId: string, x: number, y: number): PlacedUnit => ({
  cardId, pos: { x, y }, hp: 10, maxHp: 10, cooldownLeft: 0,
});

const withUnits = (units: PlacedUnit[]): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  units,
  enemies: [warden()],
});

describe('盾衛の装甲', () => {
  it('素の弓兵（攻撃4）は装甲4 の盾衛を削れず、軽減0 の命中として記録される', () => {
    const next = stepTick(withUnits([tower('arrow-tower', 2, 1)]), [], PLAINS_MAP);

    expect(next.enemies[0]?.hp).toBe(45);
    expect(next.events).toContainEqual({ kind: 'armor-hit', enemyId: 1, raw: 4, dealt: 0, armor: 4 });
  });

  it('篝火の隣の弓兵（攻撃5）は1通る', () => {
    const next = stepTick(
      withUnits([tower('arrow-tower', 2, 1), tower('beacon', 1, 1)]),
      [],
      PLAINS_MAP
    );

    expect(next.enemies[0]?.hp).toBe(44);
    expect(next.events).toContainEqual({ kind: 'armor-hit', enemyId: 1, raw: 5, dealt: 1, armor: 4 });
  });

  it('装甲は1ヒットごとに引く（弓兵2基の合計8 から一度だけ引くのではない）', () => {
    const next = stepTick(
      withUnits([tower('arrow-tower', 2, 1), tower('arrow-tower', 3, 1)]),
      [],
      PLAINS_MAP
    );

    expect(next.enemies[0]?.hp).toBe(45);
    expect(next.events.filter((e) => e.kind === 'armor-hit')).toHaveLength(2);
  });

  it('装甲に止められ続けても撃破されず、撃破源の契約違反（例外）も起きない', () => {
    let state = withUnits([tower('arrow-tower', 2, 1)]);
    for (let i = 0; i < 20; i += 1) state = stepTick(state, [], PLAINS_MAP);

    expect(state.enemies[0]?.alive).toBe(true);
    expect(state.enemies[0]?.hp).toBe(45);
  });
});
```

- [ ] **Step 3: 落ちることを確かめる**

Run: `npx jest domain/combat/waves domain/combat/enemies domain/combat/step-tick-armor`
Expected: FAIL（`未知の敵IDです: warden`・7種でない・射程の一覧が違う）

- [ ] **Step 4: 敵定義を足す**

`enemies.ts`:

1. 冒頭の docstring を次に置き換える（PR #201 minor #10 の誤記を直す）:

```ts
/**
 * 灰燼の城壁 - 敵定義（7種）
 *
 * 設計書 §6。カウンター要求を敵の性質で担う: 鴉(飛行)は対空手段（弩砲・徹甲弩・
 * 落網）を、俊足はテンポの速さを、重装は単体高火力を要求する。
 * 反復7 段階2 で盾衛（装甲）と癒し手（回復）を加えた（設計書 §4.1）。
 *
 * 群れについて: 「範囲攻撃を要求する」は反復2 までの想定だが、反復3 の較正で
 * 明示的に否定されている（範囲攻撃を抜いても 10/20 勝つ。詳細は balance.test.ts の
 * hasMassAnswer と「範囲攻撃と貫通のそれぞれの寄与」参照）。
 * 実際の拘束は「群れをまとめて削る手段（範囲攻撃 **または** 貫通）」であり、
 * どちらか一方を持てば足りる。
 *
 * 位置について: 全ての敵は所属レーンの入口（progress:0）から出現する
 * （フィードバック#4への対応。「経路中盤から出現」という反復2 以前の仕様には
 * 戻していない。spawnAt 参照）。
 */
```

2. `EnemySpec` の直前に足す:

```ts
/** 癒し手の回復（反復7 段階2・設計書 §4.1） */
export interface EnemyHealSpec {
  /** 1回に戻す HP（maxHp を超えない） */
  amount: number;
  /** 回復の間隔（tick）。`tick % intervalTicks === 0` の tick に回復する */
  intervalTicks: number;
  /** 回復が届く距離（セル）。自分自身は含めない */
  radius: number;
}
```

3. `attackRange` の docstring の `**持たせるのは北レーン専属の2種だけ。**` を `**持たせるのは北レーン専属の3種（雑兵・重装・盾衛）だけ。**` に直す
4. Task 4 で足した `armor?: number;` の直後に足す:

```ts
  /** 回復（反復7 段階2）。持つのは癒し手だけ。処理は domain/combat/enemy-heal.ts */
  heal?: EnemyHealSpec;
```

5. `ENEMIES` の鴉の行の直後に足す:

```ts
  // 反復7 段階2（設計書 §4.1。数値はすべて較正対象）。
  // 盾衛: 装甲4 は弓兵4 を素では通さず、篝火の隣なら1通す（オーラが「通る／通らない」を分ける）。
  // 射程1.5 を持つので北レーンにしか出さない（enemies.test.ts の不変条件）。
  // attackIntervalTicks は設計書に無く、重装と同じ 30 とした
  { id: 'warden', name: '盾衛', hp: 45, speed: 0.06, flying: false, attack: 8, attackIntervalTicks: 30, attackRange: 1.5, armor: 4 },
  // 癒し手: attack は設計書に無い。0 にすると壁の前で何もできず膠着するため（鴉と同じ理由）1 とした
  { id: 'mender', name: '癒し手', hp: 18, speed: 0.1, flying: false, attack: 1, attackIntervalTicks: 20, attackRange: 0, heal: { amount: 3, intervalTicks: 40, radius: 1.5 } },
```

- [ ] **Step 5: 通ることを確かめる（ドメイン）**

Run: `npx jest domain/combat/waves domain/combat/enemies domain/combat/step-tick-armor domain/combat/damage`
Expected: PASS

- [ ] **Step 6: 失敗するテストに書き換える（見た目と凡例）**

`enemy-visual.test.ts` の `it('敵5種すべてに視覚表現がある'` を `it('敵7種すべてに視覚表現がある'` にする（中身は `ENEMY_IDS` を回すので変えない）。

`EnemyLegend.test.tsx`:

1. `it('敵5種すべてが名前付きで並ぶ'` を `it('敵7種すべてが名前付きで並ぶ'` にし、名前の配列を `['雑兵', '俊足', '群れ', '重装', '盾衛', '癒し手']` にする
2. `it('射程を持つ敵には射程を出す'` の `expect(screen.getByText(/射程 1\.5/)).toBeInTheDocument();` を次にする（盾衛も射程1.5 なので `getByText` は複数一致で例外になる。検査は「重装と盾衛の2つ」へ強める）:

```tsx
    // 重装と盾衛は attackRange 1.5。凡例に数値が出る
    expect(screen.getAllByText(/射程 1\.5/)).toHaveLength(2);
```

3. 末尾に足す:

```tsx
describe('敵の能力の表示（反復7 段階2・判定項目9(a) の自己紹介）', () => {
  it('盾衛には装甲の値、癒し手には回復量・間隔・範囲を出す', () => {
    render(<EnemyLegend />);

    expect(screen.getByText('装甲4')).toBeInTheDocument();
    expect(screen.getByText('回復3（4秒ごと・周囲1.5）')).toBeInTheDocument();
  });

  it('装甲と回復が何をするかを1文ずつ説明する', () => {
    render(<EnemyLegend />);

    expect(screen.getByText(/装甲: 1撃ごとに/)).toBeInTheDocument();
    expect(screen.getByText(/回復: 一定の間隔で/)).toBeInTheDocument();
  });

  it('能力を持たない敵には能力の表記を出さない', () => {
    render(<EnemyLegend />);

    expect(screen.getAllByText(/^装甲\d/)).toHaveLength(1);
    expect(screen.getAllByText(/^回復\d/)).toHaveLength(1);
  });
});
```

- [ ] **Step 7: 落ちることを確かめる**

Run: `npx jest presentation/enemy-visual presentation/EnemyLegend`
Expected: FAIL（`視覚表現が未定義の敵IDです: warden`）

- [ ] **Step 8: 見た目と凡例を足す**

`theme.ts` の `grid: '#3a322c',` の直後に足す:

```ts
  /**
   * 回復（反復7 段階2）。敵の HP バーと同じ緑にし、「緑＝HP が戻る」を1つの意味に揃える
   * （design-ui-ux-principles: 緑=回復）
   */
  heal: '#7fb069',
```

`enemy-visual.ts`:

1. import に `import { COLORS } from './theme';` を足す
2. `VISUALS` の鴉の行の直後に足す:

```ts
  // 盾衛: 中サイズの四角＋明るい鋼のリング。装甲を「縁の厚み」で示す（群れの小さな四角とはサイズで分ける）
  warden: { shape: 'square', color: '#4f7f8f', sizePct: 6.5, ringColor: '#c8d6dc' },
  // 癒し手: 象牙色の菱形＋回復の緑のリング。回復の線（COLORS.heal）と同じ緑で役割を結ぶ
  mender: { shape: 'diamond', color: '#f5f0e1', sizePct: 5.5, ringColor: COLORS.heal },
```

3. `export const HP_BAR_COLOR = '#7fb069';` を `export const HP_BAR_COLOR = COLORS.heal;` にする（同じ値。回復と HP を1つの色に揃える）

`EnemyLegend.tsx`:

1. import を次にする:

```tsx
import { ENEMY_IDS, getEnemySpec, type EnemySpec } from '../domain/combat/enemies';
import { getEnemyVisual, getShapeClipPath } from './enemy-visual';
import { toSeconds } from './card-text';
import { COLORS } from './theme';
```

2. `EnemyLegend` の直前に足す:

```tsx
/**
 * 敵の能力を凡例の短い表記にする（反復7 段階2）
 *
 * 「射程 」で始めない（既存のテストが「射程 」の数で射程持ちを数えている）。
 */
export const abilityTextsOf = (spec: EnemySpec): string[] => [
  ...(spec.armor ? [`装甲${spec.armor}`] : []),
  ...(spec.heal
    ? [`回復${spec.heal.amount}（${toSeconds(spec.heal.intervalTicks)}秒ごと・周囲${spec.heal.radius}）`]
    : []),
];
```

3. `{spec.attackRange > 0 && <Stat>射程 {spec.attackRange}</Stat>}` の直後に足す:

```tsx
            {abilityTextsOf(spec).map((text) => (
              <Stat key={text}>{text}</Stat>
            ))}
```

4. `<Note>射程を持つ敵は、経路の脇に置いた守り手も削ります。</Note>` の直後に足す:

```tsx
    <Note>装甲: 1撃ごとにその値だけダメージを減らす（0 まで）。</Note>
    <Note>回復: 一定の間隔で、周りの敵の HP を戻す。</Note>
```

- [ ] **Step 9: 通ることを確かめる**

Run: `npx jest presentation/enemy-visual presentation/EnemyLegend presentation/BoardGrid`
Expected: PASS（`HP_BAR_COLOR` は値が同じなので他の表示は変わらない）

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 10: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemies.ts \
        src/features/ashen-rampart/domain/combat/waves.test.ts \
        src/features/ashen-rampart/domain/combat/enemies.test.ts \
        src/features/ashen-rampart/domain/combat/step-tick-armor.test.ts \
        src/features/ashen-rampart/presentation/theme.ts \
        src/features/ashen-rampart/presentation/enemy-visual.ts \
        src/features/ashen-rampart/presentation/enemy-visual.test.ts \
        src/features/ashen-rampart/presentation/EnemyLegend.tsx \
        src/features/ashen-rampart/presentation/EnemyLegend.test.tsx
git commit -F - <<'EOF'
feat(ashen-rampart): 盾衛（装甲）と癒し手（回復）を敵定義に加え、凡例で能力を示す

- 盾衛は装甲4。素の弓兵は通らず篝火の隣なら1通ることをテストで固定する
- 癒し手は回復の値を持つ（処理は次のコミット）
- 射程とレーンの不変条件を暫定ステージを含む台本で検査する形にする
- enemies.ts のコメントの hasMassAnswer の所在の誤記を直す（PR #201 minor #10）

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 6: 癒し手の回復を罠より前に入れる（設計書 §4.2 (2)）

**Files:**
- Create: `F/domain/combat/enemy-heal.ts`
- Modify: `F/domain/combat/combat-state.ts`（`TickEvent`）
- Modify: `F/domain/combat/step-tick.ts:8-9`（処理順のコメント）と Task 4 で置き換えた下書きの作成箇所
- Test: `F/domain/combat/step-tick-heal.test.ts`（新設）

**Interfaces:**
- Consumes: Task 5 の `EnemySpec.heal`
- Produces:
  - `TickEvent` に `{ kind: 'enemy-healed'; healerId: number; targetId: number; amount: number }`
  - `interface HealContext { moved: readonly ActiveEnemy[]; hpById: Map<number, number>; map: StageMap; tick: number; events: TickEvent[] }`
  - `applyEnemyHeals(ctx: HealContext): void`

判断: 自分は回復しない。複数の癒し手は重ねてかかる。間隔は `tick % intervalTicks === 0`。飛行の敵も回復する。戻した量が0なら何も積まない。

- [ ] **Step 1: 失敗するテストを書く**

`F/domain/combat/step-tick-heal.test.ts`:

```ts
/**
 * 癒し手の回復（反復7 段階2・設計書 §4.1 / §4.2 (2)）
 *
 * 回復は hpById を種まきした直後、罠より前に入る。したがって同じ tick に
 * 削られた敵が「削られた後に戻る」ことは構造的に起きない。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type ActiveEnemy, type CombatState, type PlacedTrap } from './combat-state';
import { stepTick } from './step-tick';
import { getEnemySpec } from './enemies';
import type { WaveDefinition } from './waves';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const HEAL = getEnemySpec('mender').heal!;
/** 次の stepTick が回復の tick になる tick */
const BEFORE_HEAL_TICK = HEAL.intervalTicks - 1;

const onLane0 = (overrides: Partial<ActiveEnemy> & Pick<ActiveEnemy, 'id' | 'enemyId' | 'progress'>): ActiveEnemy => ({
  hp: 20, maxHp: 20, spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  ...overrides,
});

// 癒し手と雑兵は同じ速さ（0.1）で進むので、1 tick の後も距離は 1.0 のまま（半径1.5 以内）
const mender = (): ActiveEnemy => onLane0({ id: 1, enemyId: 'mender', progress: 0.95, hp: 18, maxHp: 18 });
const grunt = (hp: number, progress = 1.95): ActiveEnemy => onLane0({ id: 2, enemyId: 'grunt', progress, hp });

const stateAt = (tick: number, enemies: ActiveEnemy[], traps: PlacedTrap[] = []): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  tick,
  enemies,
  traps,
});

/** 雑兵が 1 tick 後に乗るセル (2,2) の棘罠（ダメージ5） */
const spikeAt2_2 = (): PlacedTrap => ({ cardId: 'spike-trap', pos: { x: 2, y: 2 }, usesLeft: 3, hitEnemyIds: [] });

const hpOf = (state: CombatState, id: number): number | undefined =>
  state.enemies.find((e) => e.id === id)?.hp;

describe('癒し手の回復', () => {
  it('回復の間隔の tick に、周囲の傷ついた敵を回復量だけ戻す', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(10)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(10 + HEAL.amount);
    expect(next.events).toContainEqual({ kind: 'enemy-healed', healerId: 1, targetId: 2, amount: HEAL.amount });
  });

  it('maxHp を超えない（実際に戻した量だけを記録する）', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(19)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(20);
    expect(next.events).toContainEqual({ kind: 'enemy-healed', healerId: 1, targetId: 2, amount: 1 });
  });

  it('満タンの敵には何もしない（イベントも積まない）', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(20)]), [], PLAINS_MAP);

    expect(next.events.some((e) => e.kind === 'enemy-healed')).toBe(false);
  });

  it('間隔でない tick には回復しない', () => {
    const next = stepTick(stateAt(HEAL.intervalTicks, [mender(), grunt(10)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(10);
  });

  it('半径の外の敵は回復しない', () => {
    // 1 tick 後の距離は 2.0（半径1.5 の外）
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(10, 2.95)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(10);
  });

  it('自分自身は回復しない', () => {
    const hurt = { ...mender(), hp: 10 };
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [hurt]), [], PLAINS_MAP);

    expect(hpOf(next, 1)).toBe(10);
  });

  it('回復は罠より前に入る: 満タンの敵が同じ tick に罠で削られても、回復は乗らない', () => {
    // 回復が罠の後なら 20-5 → 15 に +3 されて 18 になる。前なら満タンなので回復なしで 15
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(20)], [spikeAt2_2()]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(15);
    expect(next.events.some((e) => e.kind === 'enemy-healed')).toBe(false);
  });

  it('回復してから罠で削る: 3 → 6 → 1 で生き残る', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(3)], [spikeAt2_2()]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(1);
    expect(next.enemies.find((e) => e.id === 2)?.alive).toBe(true);
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest domain/combat/step-tick-heal`
Expected: 回復を期待する3件（間隔の tick・maxHp・3→6→1）が FAIL。回復しないことを期待する件は PASS

- [ ] **Step 3: イベント型を足し、回復を実装する**

`combat-state.ts` の Task 4 で足した `armor-hit` の直後に足す:

```ts
  /**
   * 癒し手の回復（反復7 段階2・設計書 §4.3 #2 の表示の材料）
   *
   * `amount` は実際に戻した量。0 のときは積まない。
   */
  | { kind: 'enemy-healed'; healerId: number; targetId: number; amount: number }
```

`F/domain/combat/enemy-heal.ts`:

```ts
/**
 * 灰燼の城壁 - 癒し手の回復（反復7 段階2・設計書 §4.1 / §4.2 (2)）
 *
 * **hpById を種まきした直後、罠より前に呼ぶ。** この tick に削られる前の HP に
 * 回復を足すので、「削られて 0 以下になった敵が同じ tick の回復で戻る」経路が
 * 構造的に存在しない（tick 内の蘇生が起きない）。
 *
 * 間隔は敵の攻撃と同じく `tick % intervalTicks === 0` で決め、敵に状態を増やさない。
 * 自分自身は回復しない。複数の癒し手は重ねてかかる。飛行の敵も回復する。
 */
import type { StageMap } from '../board/stage-map';
import type { ActiveEnemy, TickEvent } from './combat-state';
import { getEnemySpec, type EnemyHealSpec } from './enemies';
import { enemyPosition } from './enemy-position';

export interface HealContext {
  moved: readonly ActiveEnemy[];
  hpById: Map<number, number>;
  map: StageMap;
  tick: number;
  events: TickEvent[];
}

interface HealAttempt {
  healer: ActiveEnemy;
  target: ActiveEnemy;
  heal: EnemyHealSpec;
}

/** 1体の癒し手が1体の敵を回復する。戻した量が0なら何もしない */
const healOne = (ctx: HealContext, { healer, target, heal }: HealAttempt): void => {
  if (target.id === healer.id || !target.alive) return;
  const from = enemyPosition(ctx.map, healer);
  const to = enemyPosition(ctx.map, target);
  if (Math.hypot(to.x - from.x, to.y - from.y) > heal.radius) return;
  const current = ctx.hpById.get(target.id) ?? target.hp;
  const amount = Math.min(heal.amount, target.maxHp - current);
  if (amount <= 0) return;
  ctx.hpById.set(target.id, current + amount);
  ctx.events.push({ kind: 'enemy-healed', healerId: healer.id, targetId: target.id, amount });
};

/** 回復の tick にいる癒し手が、周囲の傷ついた敵を回復する */
export const applyEnemyHeals = (ctx: HealContext): void => {
  ctx.moved.forEach((healer) => {
    const heal = getEnemySpec(healer.enemyId).heal;
    if (!heal || !healer.alive) return;
    if (ctx.tick % heal.intervalTicks !== 0) return;
    ctx.moved.forEach((target) => healOne(ctx, { healer, target, heal }));
  });
};
```

`step-tick.ts`:

1. import に `import { applyEnemyHeals } from './enemy-heal';` を足す
2. 冒頭の処理順のコメント（8〜9行）を次にする:

```ts
 * 1 tick の処理順:
 *   操作 → マナ生成 → ドロー → 出現 → 移動 → 敵の攻撃 → 敵の回復 → 罠 → 射撃 → 業火 → 漏れ → 勝敗
```

3. Task 4 で書いた `moved.forEach((e) => hpById.set(e.id, e.hp));` の直後に足す:

```ts
  // 敵の回復は種まきの直後・罠より前（反復7 段階2・設計書 §4.2 (2)）。
  // 削られる前の HP に足すので、tick 内の蘇生経路が構造的に無い
  applyEnemyHeals({ moved, hpById, map, tick, events });
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest domain/combat/step-tick-heal domain/combat/step-tick-armor domain/combat/damage domain/combat/step-tick-defeat-source`
Expected: PASS

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemy-heal.ts \
        src/features/ashen-rampart/domain/combat/combat-state.ts \
        src/features/ashen-rampart/domain/combat/step-tick.ts \
        src/features/ashen-rampart/domain/combat/step-tick-heal.test.ts
git commit -F - <<'EOF'
feat(ashen-rampart): 癒し手の回復を hpById の種まき直後・罠より前に入れる

- 一定の間隔で周囲の傷ついた敵を回復する（maxHp を超えない・自分は対象外）
- 罠より前に置くので、同じ tick に削られた敵が回復で戻る経路が構造的に無い
- 実際に戻した量を enemy-healed として積む（表示の材料）

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 7: `attackersFor` をブロック優先に直す（設計書 §4.2 (3)・持ち越し2回目）

**Files:**
- Modify: `F/domain/combat/blocking.ts:115-134`
- Test: `F/domain/combat/blocking.test.ts`（`MAX_ATTACKERS_PER_UNIT` の describe の末尾に追記）

**Interfaces:**
- Consumes: `blockerIndexFor` / `attackTargetIndexFor`（同じファイル）
- Produces: `attackersFor(ctx, enemies, unitIndex): ActiveEnemy[]`（シグネチャは変えない。並びが「ブロック中→射程攻撃者」になる）

判断: ブロック中の敵を進行度順に先に取り、残り枠を射程攻撃者（進行度順）で埋める。
判断: `balance.test.ts` の不変条件が赤くなったら閾値を動かさず、コントローラが止めてユーザーに報告する。`it.failing` が赤くなったら §6.5 に従い `it` へ戻す。

**既存テストの期待値は変えない**（`MAX_ATTACKERS_PER_UNIT` の4件はすべてブロック中の敵だけなので、並びは今までと同じ）。

- [ ] **Step 1: 失敗するテストを書く**

`blocking.test.ts` の `describe('MAX_ATTACKERS_PER_UNIT', …)` の閉じ括弧の直前に足す:

```ts
  describe('ブロックしている敵を優先する（反復7 段階2・設計書 §4.2 (3)）', () => {
    // 壁（lane[3] = (3,2)）の手前で止まった雑兵3体と、壁を通り過ぎて射程1.2 から
    // 壁を殴れる雑兵。反復5 の実測では、通り過ぎた3体が止まった3体を枠から押し出していた
    const blocked = [2.5, 2.6, 2.7].map((progress, i) => enemyAt(progress, { id: 100 + i }));
    const passed = [4.0, 4.05, 4.1].map((progress, i) => enemyAt(progress, { id: 200 + i }));

    it('前提: 通り過ぎた雑兵は壁にブロックされておらず、射程で壁を殴る', () => {
      passed.forEach((enemy) => {
        expect(blockerIndexFor(ctxWith(units), enemy)).toBeUndefined();
        expect(attackTargetIndexFor(ctxWith(units), enemy)).toBe(0);
      });
    });

    it('通り過ぎた敵の進行度が高くても、ブロックしている敵が枠を取る', () => {
      const attackers = attackersFor(ctxWith(units), [...passed, ...blocked], 0);

      expect(attackers.map((e) => e.id).sort()).toEqual([100, 101, 102]);
    });

    it('ブロック中の敵が枠より少なければ、残りを射程攻撃者で進行度順に埋める', () => {
      const attackers = attackersFor(ctxWith(units), [...passed, blocked[0]!], 0);

      expect(attackers.map((e) => e.id)).toEqual([100, 202, 201]);
    });
  });
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest domain/combat/blocking`
Expected: 「通り過ぎた敵の進行度が高くても…」と「…射程攻撃者で進行度順に埋める」が FAIL（`[200, 201, 202]` が選ばれる）

- [ ] **Step 3: 実装する**

`blocking.ts` の `attackersFor` を docstring ごと次に置き換える:

```ts
/**
 * その守り手を殴っている敵（ブロックしている敵を優先し、上限まで）
 *
 * **反復7 段階2 でブロック優先に直した**（設計書 §4.2 (3)・反復5 §12.1.1 の申し送り）。
 * 以前は上限を `progress` 降順だけで切っていたため、壁を通り過ぎて射程で殴る敵が、
 * 実際に壁でブロックされている敵を枠から押し出していた（実測では壁の手前の雑兵3体が
 * ダメージ0 だった）。石壁の摩耗が想定より減る方向に効く。
 *
 * 直さなかった理由は「balance.test.ts の不変条件を測り直すことになる」だったが、
 * 段階4 で較正を全面やり直すので解除条件は満たされている。
 *
 * 並び: 自分をブロックしている敵（進行度の高い順）→ 射程で殴る敵（進行度の高い順）。
 */
export const attackersFor = (
  ctx: BlockContext,
  enemies: readonly ActiveEnemy[],
  unitIndex: number
): ActiveEnemy[] => {
  const byProgress = (a: ActiveEnemy, b: ActiveEnemy): number => b.progress - a.progress;
  const targeting = enemies.filter((e) => attackTargetIndexFor(ctx, e) === unitIndex);
  const blocked = targeting.filter((e) => blockerIndexFor(ctx, e) === unitIndex).sort(byProgress);
  const ranged = targeting.filter((e) => blockerIndexFor(ctx, e) !== unitIndex).sort(byProgress);
  return [...blocked, ...ranged].slice(0, MAX_ATTACKERS_PER_UNIT);
};
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest domain/combat/blocking domain/combat/step-tick-blocking`
Expected: PASS

- [ ] **Step 5: コントローラが較正の回帰を回す**

Run（コントローラ・背景実行）: `npx jest domain/combat/balance`（約70秒）

- 全件緑 → そのまま Step 6 へ
- **`it.failing`（「どのデッキでも、経路上に一切置かない戦略は 4/20 未満しか勝てない」）だけが赤** → 設計書 §6.5 に従い「直った」と読む。`balance.test.ts` のその行を `it.failing(` から `it(` に戻し、直前の docstring の末尾に `反復7 段階2 の attackersFor の修正で成立した（設計書 §6.5）。` を1行足して、このタスクのコミットに含める
- **それ以外の不変条件が赤** → **閾値を動かさない。** コントローラは作業を止め、赤くなった `it` の名前・期待値・実測値をユーザーに報告して判断を仰ぐ（`balance.test.ts` は20枚時代の凍結した記録であり、段階4 の較正の対象外。設計書 §6.5）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/blocking.ts \
        src/features/ashen-rampart/domain/combat/blocking.test.ts
# Step 5 で it.failing を戻した場合のみ:
# git add src/features/ashen-rampart/domain/combat/balance.test.ts
git commit -F - <<'EOF'
fix(ashen-rampart): 守り手を殴る敵の枠をブロックしている敵から先に埋める

- 壁を通り過ぎて射程で殴る敵が、壁で止まった敵を枠から押し出していた（持ち越し2回目）
- ブロック中の敵を進行度順に取り、残りの枠を射程攻撃者で埋める

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 8: 新敵を暫定ステージに出す（設計書 §4.1・§4.4）

**Files:**
- Modify: `F/domain/expedition/stage-pool.ts:1-73`（台本とコメント）
- Test: `F/domain/expedition/stage-pool.test.ts`（末尾に追記）

**Interfaces:**
- Consumes: Task 5 の敵ID `warden` / `mender`
- Produces: `PROVISIONAL_STAGES` の層2・層3 の台本に新敵（ID・並び・`demands` は変えない）

判断: 層1 は変えない。層2-a に盾衛（北）、層2-b に癒し手（南・鴉と）、層3 の2本とも盾衛＋癒し手（北）。
判断: `demands` は変えない（段階3 で削除する）。

**影響の範囲（コントローラが Step 5 で回す）:** `application/simulation` の非 manual テスト（`expedition-simulation` / `expedition-replay` / `counterfactual`）は暫定ステージで遠征を回す。層2・3 の勝敗が変わるので、`toBeGreaterThan(0)` 型の存在の検査（`counterfactual.test.ts` の `clean.length` / `pairs.length`、`expedition-replay.test.ts` の `differing`）が変わりうる。**赤くなったら期待値を緩めず、シードの範囲を広げる等でも直さず、コントローラが止めて報告する。** 層1 を変えないので `run-simulation-collecting.test.ts`（`prov-t1-a`）と段階1 の E2E のシードは影響を受けない。飛行の新敵は無いので `axis-knockout-sanity.manual.test.ts` の `NO_FLYING_STAGES` も変わらない。

- [ ] **Step 1: 失敗するテストを書く**

`stage-pool.test.ts` の import に `import type { StageDefinition } from './stage-definition';` を足し、末尾に足す:

```ts
describe('新敵の出現（反復7 段階2・設計書 §4.1 / §4.4）', () => {
  const enemiesOf = (stage: StageDefinition): Set<string> =>
    new Set(stage.waves.flatMap((wave) => wave.entries.map((entry) => entry.enemyId)));
  const NEW_ENEMIES = ['warden', 'mender'];

  it('層1 には新敵が出ない（段階1 と同じ入口を保つ）', () => {
    stagesOfTier(1).forEach((stage) => {
      NEW_ENEMIES.forEach((id) => expect(enemiesOf(stage).has(id)).toBe(false));
    });
  });

  it('層2 のどちらのステージにも新敵が1種以上出る（層2 に届いた遠征は必ず出会う）', () => {
    stagesOfTier(2).forEach((stage) => {
      expect(NEW_ENEMIES.some((id) => enemiesOf(stage).has(id))).toBe(true);
    });
  });

  it('層3 のどちらのステージにも盾衛と癒し手の両方が出る', () => {
    stagesOfTier(3).forEach((stage) => {
      NEW_ENEMIES.forEach((id) => expect(enemiesOf(stage).has(id)).toBe(true));
    });
  });

  it('層2 の2本は出る新敵が違う（抽選に意味を持たせる）', () => {
    const [a, b] = stagesOfTier(2);
    const newOf = (stage: StageDefinition | undefined) =>
      NEW_ENEMIES.filter((id) => stage !== undefined && enemiesOf(stage).has(id));
    expect(newOf(a)).not.toEqual(newOf(b));
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest domain/expedition/stage-pool`
Expected: 層2・層3 の3件が FAIL。層1 の1件は PASS

- [ ] **Step 3: 台本を書き換える**

`stage-pool.ts`:

1. 冒頭の docstring の末尾（`*/` の直前）に足す:

```ts
 *
 * **反復7 段階2 で新敵を足した**（設計書 §4.1）。層1 は変えない。層2 に届いた遠征は
 * 必ず盾衛か癒し手に、層3 では両方に出会う。数値は暫定で、段階3 で本番の6ステージに
 * 置き換え、段階4 で較正する。射程を持つ盾衛は北レーンにだけ出す（enemies.test.ts）。
```

2. `tier2Swarm` / `tier2Raven` / `tier3Raven` / `tier3Swarm` を次に置き換える（`tier1North` / `tier1Swarm` は変えない）:

```ts
const tier2Swarm: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  {
    startTick: 200,
    entries: [
      { enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 },
      // 反復7 段階2: 盾衛（装甲4）。射程を持つので北レーン
      { enemyId: 'warden', count: 2, spawnIntervalTicks: 20, laneIndex: 0 },
    ],
  },
  { startTick: 340, entries: [{ enemyId: 'swarm', count: 12, spawnIntervalTicks: 1, laneIndex: 1 }] },
];

const tier2Raven: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }] },
  { startTick: 200, entries: [{ enemyId: 'runner', count: 3, spawnIntervalTicks: 6, laneIndex: 1 }] },
  {
    startTick: 340,
    entries: [
      { enemyId: 'raven', count: 8, spawnIntervalTicks: 18, laneIndex: 1 },
      // 反復7 段階2: 癒し手。鴉と同じ南レーンで、追い越していく鴉を回復する
      { enemyId: 'mender', count: 2, spawnIntervalTicks: 40, laneIndex: 1 },
    ],
  },
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
      // 反復7 段階2: 盾衛と、それを回復する癒し手を北レーンに
      { enemyId: 'warden', count: 2, spawnIntervalTicks: 20, laneIndex: 0 },
      { enemyId: 'mender', count: 1, spawnIntervalTicks: 1, laneIndex: 0 },
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
      // 反復7 段階2: 盾衛と、それを回復する癒し手を北レーンに
      { enemyId: 'warden', count: 2, spawnIntervalTicks: 20, laneIndex: 0 },
      { enemyId: 'mender', count: 1, spawnIntervalTicks: 1, laneIndex: 0 },
    ],
  },
];
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest domain/expedition domain/combat/enemies domain/combat/run-simulation-collecting`
Expected: PASS（既存の「要求軸の本数」「ウェーブの開始tick が昇順」等も緑）

- [ ] **Step 5: コントローラが遠征の測定系を回す**

Run（コントローラ・背景実行）: `npx jest application/simulation`
Expected: 非 manual のテストがすべて PASS。**赤くなったら上の「影響の範囲」に従い、期待値を変えずに止めて報告する**

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/expedition/stage-pool.ts \
        src/features/ashen-rampart/domain/expedition/stage-pool.test.ts
git commit -F - <<'EOF'
feat(ashen-rampart): 暫定ステージの層2・層3 に盾衛と癒し手を出す

- 層2 に届いた遠征は必ず新敵に1種以上、層3 では両方に出会う
- 層1 と demands は変えない（段階3 で本番の6ステージに置き換える）

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 9: 装甲の軽減量と回復を盤面に描く（設計書 §4.3 #1 #2）

**Files:**
- Modify: `F/presentation/combat-effects.ts:28-36, 51-59, 78-95, 105-122, 149-215`
- Test: `F/presentation/combat-effects.test.ts`（末尾に追記）
- Create: `F/presentation/EnemyEffectMarks.tsx`
- Modify: `F/presentation/BoardEffectLayer.tsx`
- Test: `F/presentation/BoardEffectLayer.test.tsx`（末尾に追記）

**Interfaces:**
- Consumes: Task 4 の `armor-hit`、Task 6 の `enemy-healed`、Task 5 の `COLORS.heal`
- Produces:
  - `Effect` に `{ kind: 'armor'; id: string; at: CellPos; dealt: number; armor: number; untilTick: number }` と `{ kind: 'heal'; id: string; from: CellPos; to: CellPos; amount: number; untilTick: number }`
  - `EFFECT_LIFETIME.armor = 8` / `EFFECT_LIFETIME.heal = 5`、`EFFECT_STROKE_WIDTH.heal = 2`
  - `armorHitText(dealt: number, armor: number): string` / `healText(amount: number): string`、`ArmorMark` / `HealLink`

判断: 軽減量は敵の頭上の SVG の文字 `-N (装甲M)`、回復は癒し手→対象の緑の線と `+N`。動きは付けない（`prefers-reduced-motion` でも同じ見え方）。

- [ ] **Step 1: 失敗するテストを書く（エフェクトへの変換）**

`combat-effects.test.ts` の末尾に足す:

```ts
describe('装甲と回復のエフェクト（反復7 段階2・設計書 §4.3 #1 #2）', () => {
  it('armor-hit を敵の位置の「軽減量つき」のエフェクトに変換する', () => {
    const state = stateWith(10, [{ kind: 'armor-hit', enemyId: 1, raw: 4, dealt: 0, armor: 4 }], {
      enemies: [enemyAt(1, 2)],
    });

    const effects = advanceEffects([], state, PLAINS_MAP);

    expect(effects).toEqual([
      { kind: 'armor', id: '10-0', at: laneOf(PLAINS_MAP, 0)[2], dealt: 0, armor: 4, untilTick: 10 + EFFECT_LIFETIME.armor },
    ]);
  });

  it('enemy-healed を癒し手から対象への線に変換する', () => {
    const state = stateWith(10, [{ kind: 'enemy-healed', healerId: 1, targetId: 2, amount: 3 }], {
      enemies: [enemyAt(1, 1), enemyAt(2, 2)],
    });

    const effects = advanceEffects([], state, PLAINS_MAP);

    expect(effects).toEqual([
      {
        kind: 'heal',
        id: '10-0',
        from: laneOf(PLAINS_MAP, 0)[1],
        to: laneOf(PLAINS_MAP, 0)[2],
        amount: 3,
        untilTick: 10 + EFFECT_LIFETIME.heal,
      },
    ]);
  });

  it('reduced-motion では他のエフェクトと同じ一律の寿命になる', () => {
    const state = stateWith(10, [{ kind: 'armor-hit', enemyId: 1, raw: 4, dealt: 0, armor: 4 }], {
      enemies: [enemyAt(1, 2)],
    });

    const [effect] = advanceEffects([], state, PLAINS_MAP, { reducedMotion: true });

    expect(effect?.untilTick).toBe(10 + REDUCED_MOTION_LIFETIME);
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/combat-effects`
Expected: 新しい3件が FAIL（エフェクトが空、`EFFECT_LIFETIME.armor` が undefined）

- [ ] **Step 3: エフェクトを足す**

`combat-effects.ts`:

1. `EFFECT_LIFETIME` に `'unit-lost': 8,` の直後で足す:

```ts
  /** 装甲の軽減量（反復7 段階2）。文字を読む時間が要るので撃破と同じ長さ */
  armor: 8,
  /** 回復の線（反復7 段階2） */
  heal: 5,
```

2. `EFFECT_PRIORITY` に `'unit-damaged': 1,` の直後で足す:

```ts
  armor: 2,
  heal: 2,
```

3. `EFFECT_STROKE_WIDTH` に `unitLost: 3,` の直後で足す:

```ts
  /** 回復の線（反復7 段階2） */
  heal: 2,
```

4. `Effect` の最後の `| { kind: 'unit-lost'; … }` の直後に足す:

```ts
  /** 装甲に軽減された命中（反復7 段階2・§4.3 #1）。`-dealt (装甲armor)` と描く */
  | { kind: 'armor'; id: string; at: CellPos; dealt: number; armor: number; untilTick: number }
  /** 癒し手の回復（反復7 段階2・§4.3 #2）。癒し手から対象へ線を引く */
  | { kind: 'heal'; id: string; from: CellPos; to: CellPos; amount: number; untilTick: number };
```

（直前の `unit-lost` の行末の `;` は削る）

5. `toEffect` の直前に足す:

```ts
/**
 * 敵の装甲・回復のイベントをエフェクトへ変換する（反復7 段階2）
 *
 * toEffect がすでに長い（PR #201 minor #3）ため、新しい2種はここに分けた。
 */
const toEnemyEffect = (
  event: TickEvent,
  ctx: { state: CombatState; map: StageMap; id: string; reducedMotion: boolean }
): Effect | undefined => {
  const { state, map, id, reducedMotion } = ctx;
  if (event.kind === 'armor-hit') {
    const at = enemyPos(state, event.enemyId, map);
    if (!at) return undefined;
    const untilTick = state.tick + lifetimeOf('armor', reducedMotion);
    return { kind: 'armor', id, at, dealt: event.dealt, armor: event.armor, untilTick };
  }
  if (event.kind === 'enemy-healed') {
    const from = enemyPos(state, event.healerId, map);
    const to = enemyPos(state, event.targetId, map);
    if (!from || !to) return undefined;
    const untilTick = state.tick + lifetimeOf('heal', reducedMotion);
    return { kind: 'heal', id, from, to, amount: event.amount, untilTick };
  }
  return undefined;
};
```

6. `toEffect` の最後の `return undefined;` を次にする:

```ts
  return toEnemyEffect(event, { state, map, id, reducedMotion });
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest presentation/combat-effects`
Expected: PASS

- [ ] **Step 5: 失敗するテストを書く（描画）**

`BoardEffectLayer.test.tsx` の末尾に足す:

```tsx
describe('装甲と回復の描画（反復7 段階2・設計書 §4.3 #1 #2）', () => {
  it('装甲の命中は「-N (装甲M)」の文字で描く', () => {
    const effects: Effect[] = [
      { kind: 'armor', id: 'a', at: { x: 2, y: 2 }, dealt: 0, armor: 4, untilTick: 10 },
      { kind: 'armor', id: 'b', at: { x: 3, y: 2 }, dealt: 1, armor: 4, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);

    const marks = [...container.querySelectorAll('[data-effect="armor"]')].map((el) => el.textContent);
    expect(marks).toEqual(['-0 (装甲4)', '-1 (装甲4)']);
  });

  it('回復は回復の色の線と「+N」の文字で描く（色だけに頼らない）', () => {
    const effects: Effect[] = [
      { kind: 'heal', id: 'h', from: { x: 1, y: 2 }, to: { x: 2, y: 2 }, amount: 3, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);

    const heal = container.querySelector('[data-effect="heal"]');
    expect(heal?.querySelector('line')?.getAttribute('stroke')).toBe(COLORS.heal);
    expect(heal?.textContent).toBe('+3');
  });

  it('回復の色は危険色・好機色と別である（役割を分ける）', () => {
    expect(COLORS.heal).not.toBe(COLORS.danger);
    expect(COLORS.heal).not.toBe(COLORS.dangerText);
    expect(COLORS.heal).not.toBe(COLORS.opportunity);
  });
});
```

- [ ] **Step 6: 落ちることを確かめる**

Run: `npx jest presentation/BoardEffectLayer`
Expected: 新しい描画の2件が FAIL（要素が無い。`armor` / `heal` は既定の分岐で ✕ として描かれている）

- [ ] **Step 7: 描画を足す**

`F/presentation/EnemyEffectMarks.tsx`:

```tsx
/**
 * 灰燼の城壁 - 敵の装甲・回復のエフェクト（反復7 段階2・設計書 §4.3 #1 #2）
 *
 * BoardEffectLayer の SVG の中に描く。座標はセル座標系（viewBox と同じ）。
 * **動きは付けない。** prefers-reduced-motion でも見え方は同じで、寿命は
 * combat-effects.ts が既存の規則（reduced-motion では一律）で管理する。
 * 文字は背景色で縁取り、明るい経路の上でも読めるようにする。
 */
import React from 'react';
import type { Effect } from './combat-effects';
import { EFFECT_STROKE_WIDTH } from './combat-effects';
import { COLORS } from './theme';

/** セルの中心へ寄せる補正 */
const CENTER = 0.5;
/** 文字の大きさ（セル比）。360px 幅でセル約40px → 約10px */
const EFFECT_TEXT_SIZE = 0.26;
/** 文字を敵の頭上へずらす量（セル比） */
const TEXT_LIFT = 0.3;
/** 文字の縁取りの太さ（セル比） */
const TEXT_OUTLINE_WIDTH = 0.05;

/** 装甲の軽減量の表記（例: `-0 (装甲4)`） */
export const armorHitText = (dealt: number, armor: number): string => `-${dealt} (装甲${armor})`;

/** 回復量の表記（例: `+3`） */
export const healText = (amount: number): string => `+${amount}`;

const textProps = {
  fontSize: EFFECT_TEXT_SIZE,
  textAnchor: 'middle',
  stroke: COLORS.dominant,
  strokeWidth: TEXT_OUTLINE_WIDTH,
  paintOrder: 'stroke',
} as const;

export const ArmorMark: React.FC<{ effect: Extract<Effect, { kind: 'armor' }> }> = ({ effect }) => (
  <text
    data-effect="armor"
    x={effect.at.x + CENTER}
    y={effect.at.y + CENTER - TEXT_LIFT}
    fill={COLORS.secondary}
    {...textProps}
  >
    {armorHitText(effect.dealt, effect.armor)}
  </text>
);

export const HealLink: React.FC<{ effect: Extract<Effect, { kind: 'heal' }> }> = ({ effect }) => (
  <g data-effect="heal">
    <line
      x1={effect.from.x + CENTER}
      y1={effect.from.y + CENTER}
      x2={effect.to.x + CENTER}
      y2={effect.to.y + CENTER}
      stroke={COLORS.heal}
      strokeWidth={EFFECT_STROKE_WIDTH.heal}
    />
    <text x={effect.to.x + CENTER} y={effect.to.y + CENTER - TEXT_LIFT} fill={COLORS.heal} {...textProps}>
      {healText(effect.amount)}
    </text>
  </g>
);
```

`BoardEffectLayer.tsx`:

1. import に `import { ArmorMark, HealLink } from './EnemyEffectMarks';` を足す
2. 冒頭の docstring の `opacity は BoardGrid が…` の行の後に足す:

```tsx
 * 回復（反復7 段階2）は COLORS.heal（敵の HP バーと同じ緑）。装甲の軽減量は secondary の文字。
```

3. `if (effect.kind === 'unit-damaged') {` の直前に足す:

```tsx
      if (effect.kind === 'armor') return <ArmorMark key={effect.id} effect={effect} />;
      if (effect.kind === 'heal') return <HealLink key={effect.id} effect={effect} />;
```

- [ ] **Step 8: 通ることを確かめる**

Run: `npx jest presentation/BoardEffectLayer presentation/combat-effects presentation/BoardGrid`
Expected: PASS

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/combat-effects.ts \
        src/features/ashen-rampart/presentation/combat-effects.test.ts \
        src/features/ashen-rampart/presentation/EnemyEffectMarks.tsx \
        src/features/ashen-rampart/presentation/BoardEffectLayer.tsx \
        src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx
git commit -F - <<'EOF'
feat(ashen-rampart): 装甲の軽減量と癒し手の回復を盤面に描く

- 装甲の命中を敵の頭上に「-N (装甲M)」の文字で出す
- 回復を癒し手から対象への緑の線と「+N」で出す（色だけに頼らない）
- 動きは付けず、寿命は既存の reduced-motion の規則に従う

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 10: オーラの実効値を盤面外に出す（設計書 §4.3 #3・持ち越し3回目）

**Files:**
- Modify: `F/domain/combat/step-tick.ts:55-84`（`towerDamageBreakdown` を切り出す）
- Modify: `F/presentation/board-plates.ts`（`PlateModel.effective`・`buildPlates(state, map?)`）
- Test: `F/presentation/board-plates.test.ts`（末尾に追記）
- Modify: `F/presentation/InspectPanel.tsx:39-86`（攻撃塔のチップ）
- Test: `F/presentation/InspectPanel.test.tsx`（末尾に追記）
- Modify: `F/presentation/RangeOverlay.tsx:43-59`
- Test: `F/presentation/RangeOverlay.test.tsx`（末尾に追記）
- Modify: `F/presentation/BoardGrid.tsx`（`buildPlates(state)` → `buildPlates(state, map)`）
- Modify: `F/presentation/useAshenRampartGame.ts:532, 621`（同上）

**Interfaces:**
- Produces:
  - `towerDamageBreakdown(state: CombatState, unitIndex: number, map: StageMap): { total: number; auraBonus: number }`（`damageBreakdown` はこれに委ねる）
  - `interface TowerEffective { damage: number; range: number; auraDamageBonus: number; auraRangeBonus: number; isHighGround: boolean }`
  - `PlateModel.effective?: TowerEffective`（攻撃塔で、`map` を渡したときだけ）
  - `buildPlates(state: CombatState, map?: StageMap): PlateModel[]`

判断: 実効値は盤面外の `BoardInfoSlot` の能力表示に出す（盤面は `MAX_CELL_MARKS = 3` を使い切っている。セルには何も足さないので `BoardGrid.test.tsx` の上限の検査はそのまま守られる）。
判断: `buildPlates` の `map` は省略可（既存の33呼び出しを壊さない）。本番の呼び出し（`BoardGrid` と `useAshenRampartGame` の2箇所）は必ず渡す。
判断: チップの出どころの表記は札の名前ではなく「支援で攻撃+N」「支援で射程+N」「高台で攻撃×1.3」（新しい支援札が増えても嘘にならない）。
判断: 射程リングも実効射程で描く（鍛冶場の隣で届く範囲とリングが食い違わないように）。

- [ ] **Step 1: 失敗するテストを書く（台座の実効値）**

`board-plates.test.ts` の import に `import { PLAINS_MAP } from '../domain/board/stage-map';` を足し、末尾に足す:

```ts
describe('実効値（反復7 段階2・設計書 §4.3 #3）', () => {
  const unit = (cardId: string, x: number, y: number): PlacedUnit => ({
    cardId, pos: { x, y }, hp: 8, maxHp: 8, cooldownLeft: 0,
  });
  const plateAt = (units: PlacedUnit[], key: string) =>
    buildPlates(stateWith({ units }), PLAINS_MAP).find((plate) => plate.key === key);

  it('篝火の隣の弓兵は攻撃5（素4 に +1）', () => {
    expect(plateAt([unit('arrow-tower', 2, 1), unit('beacon', 1, 1)], '2,1')?.effective).toEqual({
      damage: 5, range: 1.6, auraDamageBonus: 1, auraRangeBonus: 0, isHighGround: false,
    });
  });

  it('鍛冶場の隣の弓兵は射程2.2（小数の誤差を落とす）', () => {
    expect(plateAt([unit('arrow-tower', 2, 1), unit('forge', 1, 1)], '2,1')?.effective).toMatchObject({
      range: 2.2, auraRangeBonus: 0.6,
    });
  });

  it('高台の弓兵は攻撃5（4×1.3 を丸める）で、支援の加算は0', () => {
    expect(plateAt([unit('arrow-tower', 2, 3)], '2,3')?.effective).toMatchObject({
      damage: 5, auraDamageBonus: 0, isHighGround: true,
    });
  });

  it('支援塔・壁には実効値を載せない', () => {
    const plates = buildPlates(stateWith({ units: [unit('beacon', 1, 1), unit('stone-wall', 0, 2)] }), PLAINS_MAP);
    plates.forEach((plate) => expect(plate.effective).toBeUndefined());
  });

  it('盤面を渡さなければ実効値は載らない（既存の呼び出しの互換）', () => {
    expect(buildPlates(stateWith({ units: [unit('arrow-tower', 2, 1)] }))[0]?.effective).toBeUndefined();
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest presentation/board-plates`
Expected: 新しい4件が FAIL（`effective` が undefined）。「盤面を渡さなければ」は PASS

- [ ] **Step 3: 実効値を計算する**

`step-tick.ts` の `damageBreakdown` を docstring ごと次に置き換える:

```ts
/**
 * 守り手の実効ダメージの内訳（標的によらない）
 *
 * 篝火の貢献を測るため、オーラ抜きのダメージと実効ダメージを両方返す。
 * 丸めはそれぞれに適用する（合計してから丸めると差分がずれる）。
 * 倍率の二重適用を避けるため、この関数だけがダメージ算出の責務を持つ。
 * 表示（board-plates.ts の実効値。反復7 段階2）も同じ関数を使い、画面と戦闘の数値をずらさない。
 */
export const towerDamageBreakdown = (
  state: CombatState,
  unitIndex: number,
  map: StageMap
): { total: number; auraBonus: number } => {
  const unit = state.units[unitIndex];
  if (!unit) return { total: 0, auraBonus: 0 };
  const spec = getCardDefinition(unit.cardId).tower;
  if (!spec || spec.aura) return { total: 0, auraBonus: 0 };
  const auraBonus = state.units.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const damageBonus = otherSpec?.aura?.towerDamageBonus;
    if (damageBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - unit.pos.x) <= 1 && Math.abs(other.pos.y - unit.pos.y) <= 1;
    return adjacent ? sum + damageBonus : sum;
  }, 0);
  const highGround = isHighGround(map, unit.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
  const base = Math.round(spec.damage * highGround);
  const total = Math.round(spec.damage * highGround * (1 + auraBonus));
  return { total, auraBonus: total - base };
};

/** 守り手の実効ダメージの内訳（射撃の呼び出し側の互換のため標的を受け取る。標的は使わない） */
export const damageBreakdown = (
  state: CombatState,
  unitIndex: number,
  map: StageMap,
  _target: ActiveEnemy
): { total: number; auraBonus: number } => towerDamageBreakdown(state, unitIndex, map);
```

`board-plates.ts`:

1. import を次にする:

```ts
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { isHighGround } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { effectiveRange, towerDamageBreakdown } from '../domain/combat/step-tick';
import { getCardDefinition } from '../domain/cards/card-pool';
import { getUnitVisual, type UnitVisual } from './unit-visual';
```

2. `PlateModel` の直前に足す:

```ts
/**
 * 攻撃塔の実効値（反復7 段階2・設計書 §4.3 #3。持ち越し3回目）
 *
 * 盤面は MAX_CELL_MARKS を使い切っているので、盤面外（BoardInfoSlot の能力表示）に出す。
 * 計算は戦闘と同じ domain の関数（towerDamageBreakdown / effectiveRange）に委ね、
 * 画面の数値と実際のダメージがずれないようにする。
 */
export interface TowerEffective {
  /** オーラ・高台を含む実効の攻撃力 */
  damage: number;
  /** オーラを含む実効の射程（表示用に小数1桁へ丸める） */
  range: number;
  /** 隣接の支援による攻撃力の加算（高台の分は含まない） */
  auraDamageBonus: number;
  /** 隣接の支援による射程の加算 */
  auraRangeBonus: number;
  isHighGround: boolean;
}
```

3. `PlateModel` の `isReady: boolean;` の直後に足す:

```ts
  /** 攻撃塔の実効値。buildPlates に盤面を渡したときだけ載る（反復7 段階2） */
  effective?: TowerEffective;
```

4. `plateOf` の `flags` の型を `{ isFiring?: boolean; isReady?: boolean; effective?: TowerEffective } = {}` にし、返り値の `isReady: flags.isReady ?? false,` の直後に `...(flags.effective ? { effective: flags.effective } : {}),` を足す
5. `buildPlates` の直前に足す:

```ts
/** 表示用の小数の桁（射程 1.6 + 0.6 = 2.2000000000000002 を 2.2 にする） */
const DISPLAY_DECIMALS = 1;
const roundForDisplay = (value: number): number => Number(value.toFixed(DISPLAY_DECIMALS));

/** 攻撃塔の実効値。支援塔・壁（攻撃しない）には無い */
const towerEffectiveOf = (
  state: CombatState,
  unitIndex: number,
  map: StageMap
): TowerEffective | undefined => {
  const unit = state.units[unitIndex];
  const spec = unit ? getCardDefinition(unit.cardId).tower : undefined;
  if (!unit || !spec || spec.aura || spec.damage === 0) return undefined;
  const { total, auraBonus } = towerDamageBreakdown(state, unitIndex, map);
  const range = effectiveRange(state, unitIndex, map);
  return {
    damage: total,
    range: roundForDisplay(range),
    auraDamageBonus: auraBonus,
    auraRangeBonus: roundForDisplay(range - spec.range),
    isHighGround: isHighGround(map, unit.pos),
  };
};
```

6. `buildPlates` のシグネチャを `export const buildPlates = (state: CombatState, map?: StageMap): PlateModel[] => {` にし、守り手の `plates.push(plateOf(…))` の flags を次にする:

```ts
        {
          isFiring: firingIndices.has(index),
          ...(map ? { effective: towerEffectiveOf(state, index, map) } : {}),
        }
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest presentation/board-plates domain/combat/step-tick-support domain/combat/step-tick-combat`
Expected: PASS

- [ ] **Step 5: 失敗するテストを書く（能力表示と射程リング）**

`InspectPanel.test.tsx` の import に `import { PLAINS_MAP } from '../domain/board/stage-map';` を足し、末尾に足す:

```tsx
describe('オーラ・高台の実効値（反復7 段階2・設計書 §4.3 #3）', () => {
  const unit = (cardId: string, x: number, y: number): PlacedUnit => ({
    cardId, pos: { x, y }, hp: 8, maxHp: 8, cooldownLeft: 0,
  });
  const plateAt = (units: PlacedUnit[], key: string) => {
    const plate = buildPlates(stateWith({ units }), PLAINS_MAP).find((p) => p.key === key);
    if (!plate) throw new Error(`前提が壊れています: ${key} に台座がありません`);
    return plate;
  };

  it('篝火の隣の弓兵は、実効の攻撃と素の値、支援の内訳を出す', () => {
    render(<InspectPanel plate={plateAt([unit('arrow-tower', 2, 1), unit('beacon', 1, 1)], '2,1')} />);

    expect(screen.getByText('攻撃5（素4）')).toBeInTheDocument();
    expect(screen.getByText('支援で攻撃+1')).toBeInTheDocument();
  });

  it('鍛冶場の隣の弓兵は、実効の射程を出す', () => {
    render(<InspectPanel plate={plateAt([unit('arrow-tower', 2, 1), unit('forge', 1, 1)], '2,1')} />);

    expect(screen.getByText('射程2.2（素1.6）')).toBeInTheDocument();
    expect(screen.getByText('支援で射程+0.6')).toBeInTheDocument();
  });

  it('高台の弓兵は、高台の倍率を出す', () => {
    render(<InspectPanel plate={plateAt([unit('arrow-tower', 2, 3)], '2,3')} />);

    expect(screen.getByText('攻撃5（素4）')).toBeInTheDocument();
    expect(screen.getByText('高台で攻撃×1.3')).toBeInTheDocument();
  });

  it('強化の無い塔は素の値だけを出す（盤面が渡っても表記は変わらない）', () => {
    render(<InspectPanel plate={plateAt([unit('arrow-tower', 4, 0)], '4,0')} />);

    expect(screen.getByText('攻撃4')).toBeInTheDocument();
    expect(screen.getByText('射程1.6')).toBeInTheDocument();
    expect(screen.queryByText(/支援で|高台で/)).not.toBeInTheDocument();
  });
});
```

`RangeOverlay.test.tsx` の import に `import { PLAINS_MAP } from '../domain/board/stage-map';` を足し、末尾に足す:

```tsx
describe('実効射程のリング（反復7 段階2・設計書 §4.3 #3）', () => {
  it('鍛冶場の隣の弓兵のリングは、実効射程 2.2 の2倍セル', () => {
    const plates = buildPlates(
      stateWith({
        units: [
          { cardId: 'arrow-tower', pos: { x: 4, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 },
          { cardId: 'forge', pos: { x: 3, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 },
        ],
      }),
      PLAINS_MAP
    );
    const plate = plates.find((p) => p.key === '4,3');
    if (!plate) throw new Error('前提が壊れています: 4,3 に台座がありません');

    render(<RangeOverlay plate={plate} columns={COLUMNS} rows={7} />);
    const widthCqw = appliedLengthOf(screen.getByTestId('range-overlay-4-3'), 'width');

    expect(widthCqw! / CELL_CQW).toBeCloseTo(2.2 * 2, 5);
  });
});
```

- [ ] **Step 6: 落ちることを確かめる**

Run: `npx jest presentation/InspectPanel presentation/RangeOverlay`
Expected: 実効値を出す3件と実効射程のリングが FAIL。「強化の無い塔」は PASS

- [ ] **Step 7: 能力表示と射程リングに実効値を使う**

`InspectPanel.tsx`:

1. import に足す:

```tsx
import type { TowerSpec } from '../domain/cards/card-definition';
import { HIGH_GROUND_DAMAGE_MULT } from '../domain/combat/step-tick';
import type { TowerEffective } from './board-plates';
```

（`import type { PlateModel } from './board-plates';` は `import type { PlateModel, TowerEffective } from './board-plates';` にまとめる）

2. `chipsOf` の直前に足す:

```tsx
/** 実効値が素の値と違うときだけ「（素N）」を添える */
const withBase = (label: string, effective: number, base: number): string =>
  effective === base ? `${label}${base}` : `${label}${effective}（素${base}）`;

/** 強化の出どころ（反復7 段階2）。札の名前ではなく働きで書く（支援札が増えても嘘にならない） */
const boostChipsOf = (effective: TowerEffective | undefined): string[] =>
  effective
    ? [
        ...(effective.auraDamageBonus > 0 ? [`支援で攻撃+${effective.auraDamageBonus}`] : []),
        ...(effective.auraRangeBonus > 0 ? [`支援で射程+${effective.auraRangeBonus}`] : []),
        ...(effective.isHighGround ? [`高台で攻撃×${HIGH_GROUND_DAMAGE_MULT}`] : []),
      ]
    : [];

/** 攻撃塔のチップ。実効値があればそれを主に、素の値を括弧で添える */
const attackChipsOf = (t: TowerSpec, effective: TowerEffective | undefined): string[] => [
  withBase('攻撃', effective?.damage ?? t.damage, t.damage),
  withBase('射程', effective?.range ?? t.range, t.range),
  `間隔${toSeconds(t.cooldownTicks)}秒`,
  t.hitsFlying ? '飛行に当たる' : '飛行に当たらない',
  t.piercing ? '貫通' : t.splashRadius > 0 ? `範囲${t.splashRadius}` : '単体',
  ...boostChipsOf(effective),
];
```

3. `chipsOf` の攻撃塔の分岐（`return [ \`攻撃${t.damage}\`, … ];`）を `return attackChipsOf(t, plate.effective);` にする

`RangeOverlay.tsx`:

1. `const isRing = tower.range > 0;` の直後に足す:

```tsx
  // 鍛冶場の隣では実際に届く範囲が広がる。素の射程で描くと「届くのに覆われていない
  // マス」が生まれるので、実効射程があればそれで描く（反復7 段階2・§4.3 #3）
  const range = plate.effective?.range ?? tower.range;
```

2. `const sizeCells = isRing ? tower.range * 2 : AURA_SIZE_CELLS;` を `const sizeCells = isRing ? range * 2 : AURA_SIZE_CELLS;` にする

本番の呼び出しに盤面を渡す:

- `BoardGrid.tsx` の `const plates = buildPlates(state);` → `const plates = buildPlates(state, map);`
- `useAshenRampartGame.ts` の `buildPlates(state).find(` の2箇所（`interactCell` と `inspectedPlate`）→ `buildPlates(state, map).find(`、`interactCell` の依存配列に `map` を足す

- [ ] **Step 8: 通ることを確かめる**

Run: `npx jest presentation/InspectPanel presentation/RangeOverlay presentation/board-plates presentation/BoardGrid presentation/BoardInfoSlot`
Expected: PASS（`BoardGrid.test.tsx` の `MAX_CELL_MARKS` の検査も緑。セルには何も足していない）

Run: `npx jest presentation/useAshenRampartGame.test.ts -t 能力表示`
Expected: PASS

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/step-tick.ts \
        src/features/ashen-rampart/presentation/board-plates.ts \
        src/features/ashen-rampart/presentation/board-plates.test.ts \
        src/features/ashen-rampart/presentation/InspectPanel.tsx \
        src/features/ashen-rampart/presentation/InspectPanel.test.tsx \
        src/features/ashen-rampart/presentation/RangeOverlay.tsx \
        src/features/ashen-rampart/presentation/RangeOverlay.test.tsx \
        src/features/ashen-rampart/presentation/BoardGrid.tsx \
        src/features/ashen-rampart/presentation/useAshenRampartGame.ts
git commit -F - <<'EOF'
feat(ashen-rampart): オーラと高台の実効値を能力表示に出し、射程リングも実効射程で描く

- buildPlates が盤面を受け取ると攻撃塔の実効の攻撃・射程と内訳を載せる（持ち越し3回目）
- 能力表示に「攻撃5（素4）」「支援で攻撃+1」の形で出す。盤面のセルには何も足さない
- 計算は戦闘と同じ domain の関数に委ね、画面と実際のダメージをずらさない

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 11: カード選択中でも能力表示を開けるようにする（設計書 §4.3 #4・持ち越し2回目）

**Files:**
- Modify: `F/application/ports/play-log-port.ts:67`（`inspect_opened`）
- Modify: `F/presentation/useAshenRampartGame.ts:506-553`（`interactCell` と docstring）
- Test: `F/presentation/useAshenRampartGame.test.ts`（「カード選択中に設置物のあるセルをクリックすると…（優先順位2）」の書き換えと追記）
- Modify: `F/presentation/BoardInfoSlot.tsx`（`INSPECT_HINT_TEXT`）

**Interfaces:**
- Consumes: Task 3 の `BoardInfoSlot` / `INSPECT_HINT_TEXT`、Task 10 の `buildPlates(state, map)`
- Produces: `inspect_opened` に `duringCardSelection: boolean`

判断: カード選択中に設置物のあるセルをタップすると能力表示を開く（選択は保つ。配置も再点火もしない）。占有セルにはもともと置けない（`canPlaceAt` の `isCellOccupied`）ので失う操作は無い。
判断: `inspect_opened` に `duringCardSelection` を足し、判定項目9(b) で「選択中に開いたか」を区別できるようにする。
判断: 敵の能力は Task 5 の凡例で示す（敵マーカーはタップの対象にしない。マーカーは `pointer-events: none`）。

**既存テストの期待値を変える箇所（理由つき）:**
- `useAshenRampartGame.test.ts` 「カード選択中に設置物のあるセルをクリックすると能力表示ではなく配置が優先される（優先順位2）」→ **設計書 §4.3 #4 が振る舞いそのものを変える**ため、「能力表示が開き、選択は保たれ、配置（拒否）は起きない」に書き換える。検査の強さ（`rejected` の有無・設置物の数・`inspect_opened` の件数）は保つ

- [ ] **Step 1: ログの型を足す**

`play-log-port.ts` の `| { kind: 'inspect_opened'; runId: string; cardId: string; tick: number }` を次に置き換える:

```ts
  /**
   * 能力表示を開いた（反復4。反復7 段階2 で duringCardSelection を追加）
   *
   * 段階2 でカード選択中にも開けるようにした（設計書 §4.3 #4）。判定項目9(b) を
   * 読むとき、選択中に開いたか（置き場所を決めながら確かめたか）を区別する。
   */
  | { kind: 'inspect_opened'; runId: string; cardId: string; tick: number; duringCardSelection: boolean }
```

- [ ] **Step 2: 失敗するテストに書き換える**

`useAshenRampartGame.test.ts` の `it('カード選択中に設置物のあるセルをクリックすると能力表示ではなく配置が優先される（優先順位2）', …)` を丸ごと次に置き換える:

```ts
    it('カード選択中でも、設置物のあるセルをタップすると能力表示が開き、選択は保たれる（反復7 段階2・§4.3 #4）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);
      const secondTowerIndex = result.current.state.deck.hand.findIndex((id) => id === 'stone-wall');
      expect(secondTowerIndex).toBeGreaterThanOrEqual(0);

      act(() => result.current.selectCard(secondTowerIndex));
      act(() => result.current.interactCell({ x: 1, y: 1 }));

      expect(result.current.inspectedPlate?.cardId).toBe('ballista');
      expect(result.current.selectedIndex).toBe(secondTowerIndex);
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      // 占有セルへの配置は元々成立しない（canPlaceAt）。ここでは配置自体が試みられない
      expect(result.current.state.events.some((e) => e.kind === 'rejected')).toBe(false);
      expect(result.current.state.units).toHaveLength(1);
      const opened = log.events.filter((e) => e.kind === 'inspect_opened');
      expect(opened).toHaveLength(1);
      expect(opened[0]).toMatchObject({ cardId: 'ballista', duringCardSelection: true });
    });

    it('カード選択中でも、空きセルのタップは従来どおり配置になる', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);
      const wallIndex = result.current.state.deck.hand.findIndex((id) => id === 'stone-wall');
      const pathCell = { x: 3, y: 2 };

      act(() => result.current.selectCard(wallIndex));
      act(() => result.current.interactCell(pathCell));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      expect(result.current.selectedIndex).toBeNull();
      expect(log.events.filter((e) => e.kind === 'inspect_opened')).toHaveLength(0);
      expect(result.current.state.events.some((e) => e.kind === 'played' || e.kind === 'rejected')).toBe(true);
    });

    it('選択なしで開いた能力表示は duringCardSelection: false で記録される', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 }));

      expect(log.events.filter((e) => e.kind === 'inspect_opened')[0]).toMatchObject({
        duringCardSelection: false,
      });
    });

    it('カード選択中に再点火可能な燠火をタップしても再点火せず、能力表示が開く', () => {
      const log = createMockPlayLog();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards: emberDeckCards(), seed: 59, playLog: log })
      );
      const emberHandIndex = result.current.state.deck.hand.findIndex((id) => id === 'ember-blast');
      act(() => result.current.selectCard(emberHandIndex));
      const placePos = result.current.placeableCells[0];
      act(() => result.current.interactCell(placePos!));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 301);
      });
      const emberPos = result.current.state.embers[0]!.pos;
      expect(result.current.state.embers[0]!.cooldownLeft).toBe(0);
      const wallIndex = result.current.state.deck.hand.findIndex((id) => id === 'stone-wall');
      expect(wallIndex).toBeGreaterThanOrEqual(0);

      act(() => result.current.selectCard(wallIndex));
      act(() => result.current.interactCell(emberPos));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      expect(log.events.filter((e) => e.kind === 'reactivated')).toHaveLength(0);
      expect(result.current.inspectedPlate?.cardId).toBe('ember-blast');
      expect(result.current.selectedIndex).toBe(wallIndex);
    });
```

`BoardInfoSlot.test.tsx` の「何も出ていないときも…」の `it` の末尾に足す:

```tsx
    // 選択中でも開けることを導線で伝える（反復7 段階2・§4.3 #4）
    expect(INSPECT_HINT_TEXT).toMatch(/札を選んでいても/);
```

- [ ] **Step 3: 落ちることを確かめる**

Run: `npx jest presentation/useAshenRampartGame.test.ts -t 能力表示`
Expected: 「カード選択中でも、設置物のあるセルを…」「カード選択中に再点火可能な燠火を…」「選択なしで開いた…」が FAIL

Run: `npx jest presentation/BoardInfoSlot`
Expected: FAIL（導線の文言に「札を選んでいても」が無い）

- [ ] **Step 4: 実装する**

`useAshenRampartGame.ts` の `interactCell` を docstring ごと次に置き換える:

```ts
  /**
   * 能力表示を開閉する。そのセルに設置物が無ければ何もせず false を返す
   *
   * 記録は updater の外で行う（StrictMode の二重呼び出し対策。togglePause と同じ理由）。
   */
  const toggleInspect = useCallback(
    (pos: CellPos, isDuringCardSelection: boolean): boolean => {
      const key = plateKeyOf(pos);
      const plate = buildPlates(state, map).find((candidate) => candidate.key === key);
      if (!plate) return false;
      if (inspectedKey === key) {
        setInspectedKey(null);
        return true;
      }
      logRef.current.record({
        kind: 'inspect_opened',
        runId,
        cardId: plate.cardId,
        tick: state.tick,
        duringCardSelection: isDuringCardSelection,
      });
      inspectOpensRef.current += 1;
      setInspectedKey(key);
      return true;
    },
    [state, map, inspectedKey, runId]
  );

  /**
   * 盤面セルへの唯一の入口（UI はこれだけを呼ぶ）
   *
   * カード選択中（反復7 段階2・設計書 §4.3 #4 で変更）:
   *   設置物のあるセル → 能力表示（選択は保つ。配置も再点火もしない）
   *   それ以外のセル → 配置
   *   占有セルには canPlaceAt がもともと置かせないので、能力表示に回しても失う操作は無い。
   *   段階1 までは選択中のタップがすべて配置に抜け、能力表示が一度も開かれなかった（§3.8）。
   * 選択なし（設計書 §5.2 の優先順位のまま）:
   *   再点火可能な燠火（cooldownLeft === 0）→ 再点火。それ以外の設置物 → 能力表示の開閉。
   *   何も無いセル → 能力表示を閉じる。
   */
  const interactCell = useCallback(
    (pos: CellPos) => {
      if (isPaused) return;
      if (selectedIndex !== null) {
        if (!toggleInspect(pos, true)) clickCell(pos);
        return;
      }
      const emberIndex = state.embers.findIndex(
        (ember) => ember.pos.x === pos.x && ember.pos.y === pos.y && ember.cooldownLeft === 0
      );
      if (emberIndex !== -1) {
        reactivate(emberIndex);
        return;
      }
      if (!toggleInspect(pos, false)) setInspectedKey(null);
    },
    [isPaused, selectedIndex, state.embers, clickCell, reactivate, toggleInspect]
  );
```

`BoardInfoSlot.tsx` の `INSPECT_HINT_TEXT` を次にする:

```tsx
/** 能力表示が閉じているときの導線（札の選択中にも開けることを伝える。§4.3 #4） */
export const INSPECT_HINT_TEXT = '置いた札をタップで能力を表示（札を選んでいても可）';
```

- [ ] **Step 5: 通ることを確かめる**

Run: `npx jest presentation/useAshenRampartGame.test.ts -t 能力表示`
Expected: PASS

Run: `npx jest presentation/useAshenRampartGame.test.ts -t inspect`
Expected: PASS（`inspect_opened には開いた設置物の cardId が入る` 等は `toMatchObject` なので緑のまま）

Run: `npx jest presentation/BoardInfoSlot presentation/useAshenRampartGame.stage`
Expected: PASS

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/application/ports/play-log-port.ts \
        src/features/ashen-rampart/presentation/useAshenRampartGame.ts \
        src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts \
        src/features/ashen-rampart/presentation/BoardInfoSlot.tsx \
        src/features/ashen-rampart/presentation/BoardInfoSlot.test.tsx
git commit -F - <<'EOF'
feat(ashen-rampart): カード選択中でも設置物をタップすれば能力表示が開くようにする

- 選択中のタップがすべて配置に抜け、能力表示が一度も開かれなかった（持ち越し2回目）
- 設置物のあるセルは能力表示へ、空きセルは従来どおり配置へ振り分ける
- inspect_opened に duringCardSelection を足し、判定項目9(b) で区別できるようにする

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 12: 敵の攻撃射程を経路外セルの色調で示す（設計書 §4.3 #5）

**Files:**
- Create: `F/domain/combat/geometry.ts`
- Modify: `F/domain/combat/step-tick.ts`（`distanceToSegment` を `geometry.ts` から import）
- Create: `F/domain/combat/enemy-reach.ts` / Test: `F/domain/combat/enemy-reach.test.ts`
- Modify: `F/presentation/useAshenRampartGame.ts`（`threatenedCells`）
- Test: `F/presentation/useAshenRampartGame.threat.test.ts`（新設）
- Modify: `F/presentation/BoardGrid.tsx`（`threatenedCells` prop）/ Test: `F/presentation/BoardGrid.test.tsx`
- Modify: `F/presentation/StageView.tsx`（結線）
- Modify: `F/presentation/EnemyLegend.tsx` / Test: `F/presentation/EnemyLegend.test.tsx`

**Interfaces:**
- Consumes: Task 2 の `cellBackgroundOf({ isPath, isThreatened })`
- Produces:
  - `distanceToSegment(p: { x: number; y: number }, a: CellPos, b: { x: number; y: number }): number`
  - `enemyReachCells(map: StageMap, waves: readonly WaveDefinition[]): CellPos[]`
  - `useAshenRampartGame` の戻り値に `threatenedCells: readonly CellPos[]`
  - `BoardGrid` の props に `threatenedCells?: readonly CellPos[]`、セルに `data-threatened`

判断: 台本（そのステージの waves）と地図だけから静的に求める。射程 > 0 かつ飛行でない敵のレーンごとの最大射程で、経路の線分からの距離が射程以内の経路外セル。
判断: 置けるセルがある間（カード選択中）だけ出す。hover は使わない（360px のタッチ環境で出ない）。
判断: `distanceToSegment` を `geometry.ts` へ移し、貫通と共有する（重複させない）。

- [ ] **Step 1: 失敗するテストを書く（射程の届くセル）**

`F/domain/combat/enemy-reach.test.ts`:

```ts
/**
 * 敵の射程が届く経路外セル（反復7 段階2・設計書 §4.3 #5）
 */
import { PLAINS_MAP, isPathCell } from '../board/stage-map';
import { enemyReachCells } from './enemy-reach';
import { distanceToSegment } from './geometry';
import type { WaveDefinition } from './waves';

const waveOf = (enemyId: string, laneIndex: number): WaveDefinition[] => [
  { startTick: 0, entries: [{ enemyId, count: 1, spawnIntervalTicks: 1, laneIndex }] },
];

describe('enemyReachCells', () => {
  it('北レーンの雑兵（射程1.2）は、北レーンの上下1行の経路外17セルに届く', () => {
    const cells = enemyReachCells(PLAINS_MAP, waveOf('grunt', 0));

    expect(cells).toHaveLength(17);
    expect(new Set(cells.map((c) => c.y))).toEqual(new Set([1, 3]));
    cells.forEach((cell) => expect(isPathCell(PLAINS_MAP, cell)).toBe(false));
  });

  it('射程を持たない敵（俊足）や飛行（鴉）しか出ない台本では、どこにも届かない', () => {
    expect(enemyReachCells(PLAINS_MAP, waveOf('runner', 1))).toEqual([]);
    expect(enemyReachCells(PLAINS_MAP, waveOf('raven', 1))).toEqual([]);
  });

  it('経路セルは返さない（経路は置いて塞ぐ場所で、射程の警告の対象外）', () => {
    const cells = enemyReachCells(PLAINS_MAP, waveOf('brute', 0));

    expect(cells.some((cell) => isPathCell(PLAINS_MAP, cell))).toBe(false);
  });

  it('台本に同じレーンの射程持ちが複数いれば、最大の射程で届く範囲を求める', () => {
    const both: WaveDefinition[] = [
      {
        startTick: 0,
        entries: [
          { enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 1 },
          { enemyId: 'brute', count: 1, spawnIntervalTicks: 1, laneIndex: 1 },
        ],
      },
    ];

    expect(enemyReachCells(PLAINS_MAP, both)).toEqual(enemyReachCells(PLAINS_MAP, waveOf('brute', 1)));
  });
});

describe('distanceToSegment', () => {
  it('線分への最短距離（端点の外は端点への距離）', () => {
    expect(distanceToSegment({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(1);
    expect(distanceToSegment({ x: 3, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(1);
    expect(distanceToSegment({ x: 0, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(2);
  });
});
```

- [ ] **Step 2: 落ちることを確かめる**

Run: `npx jest domain/combat/enemy-reach`
Expected: FAIL（`Cannot find module './enemy-reach'`）

- [ ] **Step 3: 実装する**

`F/domain/combat/geometry.ts`:

```ts
/**
 * 灰燼の城壁 - 盤面の幾何（純粋）
 *
 * 貫通（step-tick.ts）と敵の射程（enemy-reach.ts）が同じ「線分への距離」を使う。
 */
import type { CellPos } from '../board/stage-map';

/** 点 p と線分 ab の距離 */
export const distanceToSegment = (
  p: { x: number; y: number },
  a: CellPos,
  b: { x: number; y: number }
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};
```

`step-tick.ts`: `/** 点 p と線分 ab の距離（貫通の判定に使う） */` から始まる `distanceToSegment` の定義を削除し、import に `import { distanceToSegment } from './geometry';` を足す。

`F/domain/combat/enemy-reach.ts`:

```ts
/**
 * 灰燼の城壁 - 敵の射程が届く経路外セル（反復7 段階2・設計書 §4.3 #5）
 *
 * 射程を持つ敵は、進軍しながら経路の脇に置いた守り手を削る（反復5）。
 * 射程が見えなければ「経路外は安全」という前提が裏切られ、理不尽な事故になる。
 *
 * **台本と地図だけから静的に求める。** 敵の位置はレーン上を連続に動くので、
 * レーンの隣り合うセルを結ぶ線分からの距離で測る（blocking.ts の攻撃判定と同じ
 * ユークリッド距離・`<= attackRange`）。飛行の敵は射程攻撃をしない（blocking.ts）ので除く。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf, offPathCells } from '../board/stage-map';
import { getEnemySpec } from './enemies';
import { distanceToSegment } from './geometry';
import type { WaveDefinition } from './waves';

/** レーンごとの、台本に出る射程持ちの最大射程 */
const maxRangeByLane = (waves: readonly WaveDefinition[]): Map<number, number> => {
  const result = new Map<number, number>();
  waves.forEach((wave) =>
    wave.entries.forEach((entry) => {
      const spec = getEnemySpec(entry.enemyId);
      if (spec.flying || spec.attackRange <= 0) return;
      result.set(entry.laneIndex, Math.max(result.get(entry.laneIndex) ?? 0, spec.attackRange));
    })
  );
  return result;
};

/** レーンのどこかから range 以内か */
const isWithinLane = (lane: readonly CellPos[], cell: CellPos, range: number): boolean =>
  lane.some((from, index) => distanceToSegment(cell, from, lane[index + 1] ?? from) <= range);

/** 射程を持つ敵が、進軍中に攻撃できる経路外セル */
export const enemyReachCells = (map: StageMap, waves: readonly WaveDefinition[]): CellPos[] => {
  const ranges = [...maxRangeByLane(waves)];
  if (ranges.length === 0) return [];
  return offPathCells(map).filter((cell) =>
    ranges.some(([laneIndex, range]) => isWithinLane(laneOf(map, laneIndex), cell, range))
  );
};
```

- [ ] **Step 4: 通ることを確かめる**

Run: `npx jest domain/combat/enemy-reach domain/combat/step-tick-piercing`
Expected: PASS

- [ ] **Step 5: 失敗するテストを書く（フックと盤面と凡例）**

`F/presentation/useAshenRampartGame.threat.test.ts`:

```ts
/**
 * 敵の射程のセル（反復7 段階2・設計書 §4.3 #5）
 *
 * カード選択中（置けるセルがある間）だけ、そのステージの台本から求めたセルを返す。
 */
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame } from './useAshenRampartGame';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { enemyReachCells } from '../domain/combat/enemy-reach';
import { getCardDefinition, PRESET_DECKS } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { PlayLogPort } from '../application/ports/play-log-port';

const silentLog: PlayLogPort = { record: () => undefined, exportAll: () => ({ version: 6, events: [] }) };

describe('threatenedCells', () => {
  it('カードを選ぶ前は空で、置ける札を選ぶと台本から求めた射程のセルになる', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: [...PRESET_DECKS.swift!.cards], seed: 1, playLog: silentLog })
    );
    expect(result.current.threatenedCells).toEqual([]);
    const index = result.current.state.deck.hand.findIndex(
      (id) => placementKindOf(getCardDefinition(id)) !== 'none'
    );
    expect(index).toBeGreaterThanOrEqual(0);

    act(() => result.current.selectCard(index));

    expect(result.current.threatenedCells).toEqual(enemyReachCells(PLAINS_MAP, result.current.state.waves));
    expect(result.current.threatenedCells.length).toBeGreaterThan(0);
  });

  it('一時停止中は出さない（置けるセルも出ないため）', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: [...PRESET_DECKS.swift!.cards], seed: 1, playLog: silentLog })
    );
    const index = result.current.state.deck.hand.findIndex(
      (id) => placementKindOf(getCardDefinition(id)) !== 'none'
    );
    act(() => result.current.selectCard(index));
    act(() => result.current.togglePause());

    expect(result.current.threatenedCells).toEqual([]);
  });
});
```

`BoardGrid.test.tsx` の末尾に足す:

```tsx
describe('敵の射程の色調（反復7 段階2・設計書 §4.3 #5）', () => {
  it('射程内の経路外セルは斜線を持ち、読み上げにも「敵の射程内」が入る', () => {
    render(
      <BoardGrid {...defaultProps} placeableCells={[{ x: 1, y: 1 }]} threatenedCells={[{ x: 1, y: 1 }]} />
    );
    const cell = screen.getByTestId('cell-1-1');

    expect(cell).toHaveAttribute('data-threatened', 'true');
    expect(cell).toHaveAccessibleName(/1,1 設置可 ここに置ける 敵の射程内/);
    expect(appliedValueOf(cell, 'background')).toContain(BOARD_COLORS.rangeStripe);
  });

  it('射程外のセルと経路セルには斜線を付けない', () => {
    render(<BoardGrid {...defaultProps} threatenedCells={[{ x: 0, y: 2 }]} />);

    expect(screen.getByTestId('cell-1-1')).toHaveAttribute('data-threatened', 'false');
    expect(appliedValueOf(screen.getByTestId('cell-0-2'), 'background')).toBe(BOARD_COLORS.path);
  });
});
```

`EnemyLegend.test.tsx` の末尾に足す:

```tsx
describe('射程の色調の説明（反復7 段階2・設計書 §4.3 #5）', () => {
  it('札を選ぶと射程の届く場所に斜線が出ることを説明する', () => {
    render(<EnemyLegend />);

    expect(screen.getByText(/札を選ぶと、射程の届く場所に斜線/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 落ちることを確かめる**

Run: `npx jest presentation/useAshenRampartGame.threat presentation/BoardGrid presentation/EnemyLegend`
Expected: 新しいテストが FAIL（`threatenedCells` が undefined・`data-threatened` が無い・説明文が無い）

- [ ] **Step 7: 実装する**

`useAshenRampartGame.ts`:

1. import を足す（`useMemo` を react の import に加える）:

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enemyReachCells } from '../domain/combat/enemy-reach';
```

2. `const placeableCells: CellPos[] = (() => { … })();` の直後に足す:

```ts
  // 敵の射程が届く経路外セル（反復7 段階2・§4.3 #5）。台本と地図だけから静的に求まるので
  // ステージの間は一度だけ計算する。置けるセルがある間（カード選択中）だけ盤面に出す
  const reachCells = useMemo(() => enemyReachCells(map, state.waves), [map, state.waves]);
  const threatenedCells: readonly CellPos[] = placeableCells.length > 0 ? reachCells : [];
```

3. 戻り値の `placeableCells,` の直後に `threatenedCells,` を足す

`BoardGrid.tsx`:

1. `Props` の `inspectedPlate?: PlateModel;` の直後に足す:

```tsx
  /** 敵の射程が届く経路外セル（カード選択中のみ非空。反復7 段階2・§4.3 #5） */
  threatenedCells?: readonly CellPos[];
```

2. `Cell` の型パラメータを `{ $kind: string; $highlighted: boolean; $threatened: boolean }` にし、`background` の行を次にする:

```tsx
  background: ${({ $kind, $threatened }) =>
    cellBackgroundOf({ isPath: $kind === 'path', isThreatened: $threatened })};
```

3. 分割代入に `threatenedCells = [],` を足す
4. セルのループの `const highlighted = …;` の直後に足す:

```tsx
        const threatened = !isPath && threatenedCells.some((c) => samePos(c, pos));
```

5. `label` の配列の `highlighted ? 'ここに置ける' : '',` の直後に `threatened ? '敵の射程内' : '',` を足す
6. `<Cell` に `data-threatened={threatened ? 'true' : 'false'}` と `$threatened={threatened}` を足す

`StageView.tsx` の `<BoardGrid` に `threatenedCells={game.threatenedCells}` を足す。

`EnemyLegend.tsx` の `<Note>射程を持つ敵は、経路の脇に置いた守り手も削ります。</Note>` を次にする:

```tsx
    <Note>射程を持つ敵は、経路の脇に置いた守り手も削ります。札を選ぶと、射程の届く場所に斜線が出ます。</Note>
```

- [ ] **Step 8: 通ることを確かめる**

Run: `npx jest presentation/useAshenRampartGame.threat presentation/BoardGrid presentation/EnemyLegend presentation/StageView domain/combat/enemy-reach`
Expected: PASS（`BoardGrid.test.tsx` の既存の `aria-label` の正規表現（`/1,1 設置可 ここに置ける/` 等）は、語を末尾に足しただけなので緑のまま）

Run: `npm run typecheck`
Expected: エラー0

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/geometry.ts \
        src/features/ashen-rampart/domain/combat/step-tick.ts \
        src/features/ashen-rampart/domain/combat/enemy-reach.ts \
        src/features/ashen-rampart/domain/combat/enemy-reach.test.ts \
        src/features/ashen-rampart/presentation/useAshenRampartGame.ts \
        src/features/ashen-rampart/presentation/useAshenRampartGame.threat.test.ts \
        src/features/ashen-rampart/presentation/BoardGrid.tsx \
        src/features/ashen-rampart/presentation/BoardGrid.test.tsx \
        src/features/ashen-rampart/presentation/StageView.tsx \
        src/features/ashen-rampart/presentation/EnemyLegend.tsx \
        src/features/ashen-rampart/presentation/EnemyLegend.test.tsx
git commit -F - <<'EOF'
feat(ashen-rampart): カード選択中に敵の射程が届く経路外セルを斜線で示す

- 台本と地図だけから、射程持ちの敵が進軍中に届く経路外セルを静的に求める
- 置けるセルの琥珀の縁取りと役割を分け、セルの地に斜線を重ねる（hover は使わない）
- 線分への距離を geometry.ts へ移し、貫通の判定と共有する

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 13: 段階2 の出口（設計書 §4.4）

- [ ] **Step 1: 全体の検証（コントローラが背景で回す）**

Run（背景実行）: `npm run ci`
Expected: lint:ci・typecheck・test・build がすべて成功。**`balance.test.ts` は Task 7 Step 5 の判断どおりの状態**（`it.failing` を戻したならその `it` が緑）

- [ ] **Step 2: E2E（コントローラが回す）**

Run（背景実行）:

```bash
npm run build && CI=1 PLAYWRIGHT_BROWSERS_PATH=/tmp/claude-1000/-workspaces-claym-local-cline-playground-for-frontend/02a5ce9d-b9a5-4fb1-9299-820031e00606/scratchpad/pw \
  npx playwright test e2e/ashen-rampart --project=chromium
```

Expected: 4件 PASS（`expedition-flow.spec.ts` 2件・`layout-stability.spec.ts` 2件）。`expedition-flow` の 360px の `cardsPerRow >= 2` も緑のまま（手札の上の通知を枠へ移しただけで、手札のカードの幅は変えていない）

- [ ] **Step 3: 計測の生データを保全する**

`test-results/` は gitignore 配下なので、`layout-stability.spec.ts` の添付2つ（`layout-1280x800` / `layout-360x740`）の JSON を1つの配列にまとめ、`docs/superpowers/specs/2026-09-24-ashen-rampart-iteration7-stage2-layout.json` として保存する。**`git ls-files docs/superpowers/specs | grep stage2-layout` で追跡されていることを確かめてから「保全した」と書く**（コミットは Step 5）

- [ ] **Step 4: 設計書を更新する**

`docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-design.md`:

1. §4.4 の直後に `### 4.5 実装計画で下した判断（2026-09-24）` を足し、本計画の「計画で下した判断」の24件を1行ずつ転記する（計画ファイルへのリンクを添える）
2. §7 の持ち越し表の「反復7 での扱い」を更新する: オーラの実効値 → **閉じた**（能力表示に実効値、射程リングも実効射程）／能力表示の導線 → **閉じた**（カード選択中も設置物のタップで開く。`duringCardSelection` を記録）／`attackersFor` の押し出し → **閉じた**（ブロック優先。`balance.test.ts` の結果を1行で）／敵の攻撃射程の可視化 → **閉じた**（カード選択中に経路外セルへ斜線）
3. §7.1 の #6 → **閉じた**（貫通に `canTowerHit`。対空ノックアウト変種の徹甲弩が鴉に当たらなくなった）、#10 → **閉じた**、#7 → Step 6 のユーザーの試遊で見たことを書く
4. §8 の段階2 の行に「実装完了（2026-MM-DD・PR #N）。`npm run ci` 緑（コミット）。E2E 4本 緑。**ユーザーによる新敵の試遊は（済／未）**」を書く

- [ ] **Step 5: コミット**

```bash
git add docs/superpowers/specs/2026-09-23-ashen-rampart-iteration7-design.md \
        docs/superpowers/specs/2026-09-24-ashen-rampart-iteration7-stage2-layout.json
git commit -F - <<'EOF'
docs(ashen-rampart): 段階2 の実装で下した判断と閉じた持ち越しを設計書へ記録する

- 計画で決めた24件の判断を §4.5 に転記する
- 持ち越し4件と PR #201 minor 2件を閉じたことを反映する
- 戦闘中の盤面と手札の上端の計測（2幅）の生データを保全する

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: PR を作る**

Task 0 Step 2 で控えた PR #211 の状態で向き先を決める。**履歴を書き換えない**（rebase・force push はしない）。

- #211 が `MERGED` → `git fetch origin && git merge origin/main`（競合が出たら止めて報告）→ `git push -u origin feature/ashen-rampart-iteration7-stage2` → `gh pr create --base main`
- #211 が `OPEN` → `git push -u origin feature/ashen-rampart-iteration7-stage2` → `gh pr create --base feature/ashen-rampart-iteration7-stage1`（積み上げ。本文の冒頭に「#211 の上に積んでいる。#211 のマージ後に向き先を main へ変える」と書く）

タイトル: `feat(ashen-rampart): 反復7 段階2 — 新敵2種と、それを画面で読めるようにする`
本文は `.claude/rules/git-workflow.md` の構成（概要・変更内容・テスト方法）に従い、**「`attackersFor` の修正で `balance.test.ts` がどうなったか」「暫定ステージの層2・3 が新敵で重くなったこと（較正は段階4）」「カード選択中の設置物のタップが配置から能力表示に変わったこと」**を明記する。末尾に次の1行を付ける:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 7: ユーザーの試遊（判定ではない。設計書 §4.4）**

ユーザーに依頼する（新敵は層2 から出るので、層2 に届くまで遊んでもらう）:

1. 層2・層3 で盾衛と癒し手に出会い、**`-0 (装甲4)` の文字と回復の緑の線が読めるか**
2. 札を選んだとき、**射程の斜線と置けるセルの縁取りが見分けられるか**。**道と置ける場所が見分けられるか**（§4.0 b）
3. **戦闘中に盤面と手札が動かないか**（§4.0 a）
4. 札を選んだまま置いた札をタップして**能力表示が開くか**、篝火の隣の塔で `攻撃5（素4）` が出るか
5. （持ち越し）手元の実機（360px 相当）で1回開き、盤面と手札が読めるか
6. 観察（PR #201 minor #7）: **同じ種類の敵（盾衛2体）が同じ瞬間に一斉に殴るのが不自然に見えるか**。見えたら §7.1 #7 に書く

**確認が取れるまで段階3 の計画を書かない。**

---

## 自己点検の記録

- **設計書の網羅**: §4.0 a → Task 3（＋Task 13 の E2E）／§4.0 b → Task 2／§4.0 c → Task 1（§2 の分母の扱いは判定時の作業で、記録は Task 1）／§4.1 → Task 5・Task 8／§4.2 (1) → Task 4、(2) → Task 6、(3) → Task 7／§4.3 #1 #2 → Task 9、#3 → Task 10、#4 → Task 11（敵の能力は Task 5 の凡例）、#5 → Task 12／§4.4 → Task 13／§7.1 #6 → Task 4、#7 → Task 13 Step 7、#10 → Task 5
- **型の一貫性**: `DamageDraft` / `hitOn` / `applyDamage`（Task 4）を Task 6 は使わず `hpById` を直接受ける（回復はダメージではないため撃破源に触れない）。`cellBackgroundOf` の引数は Task 2 と Task 12 で同じオブジェクト形。`buildPlates(state, map?)` は Task 10 で変え、Task 11 はそれを使う。`INSPECT_HINT_TEXT` は Task 3 で定義し Task 11 で文言だけ変える
- **重いテスト**: `domain/combat` 全体（Task 4）・`balance.test.ts`（Task 7）・`application/simulation`（Task 8）・Playwright（Task 3・13）・`npm run ci`（Task 13）はすべてコントローラの手順にした
