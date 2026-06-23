# PRIMAL PATH バランス再調整（実プレイ較正）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** シミュレータを実プレイの最適化バースト（低HP×倍率）に忠実化し、それを基準に狂気倍率ナーフ＋難易度再較正で「原始でも苦戦・断崖なし・必勝でない」体験へ調整する。

**Architecture:** sim に「実効ATK(atk×aM)最大化」の `'burst'` 戦略とキーストーン最適選択を追加して実プレイを再現。新ガードレールに実プレイ較正の目標値をハードアサーション化し、狂血/儀式の倍率と難易度 hm/am を反復調整して緑にする。

**Tech Stack:** TypeScript / Jest 30 / 既存 reducer 駆動シミュレータ（決定論・production相当）

## 【改訂・2026-06-23】プレイテストアンカーへの方針転換

測定の結果、sim のキーストーン最適化だけでは実プレイの楽勝を再現できなかった（無強化 di1=33% のまま）。
sim greedy-atk は「rit フォーカス→大覚醒で fe='rit'→低HP×3＋狂血」のエキスパート建造を再現しない。
よって **sim を「並プレイヤーの下限サニティチェック」に格下げ**し、主たる較正は**ユーザーの実プレイデータ
（現状難易度で di1 楽勝 / di2 辛うじて負け）を主アンカー＋再プレイテスト**で行う。`'burst'` 戦略は
simEvo が既に実効ATK(atk×aM×dm)を返すため冗長と判明し取り下げ済み（キーストーン最適選択のみ採用）。

## Global Constraints

- 狂気倍率ナーフ（エキスパート優位を直接削る主レバー）: 狂血(madblood) ×2→×1.6、儀式(rit)低HP ×3→×2
  （合算上限 ×6→×3.2）。最終値はプレイテストで微調整可。
- 難易度再較正（プレイテストアンカー基準・reasoned）: 原始にも歯ごたえを与え、di2→di3 の断崖を是正する。
  最終確認はユーザーの再プレイ。
- sim 下限サニティガードレール（greedy-atk・トーテム平均勝率。**苦戦の体感ではなく健全性のみ**を守る）:
  - フル強化 di1 > 0.55（ツリー投資が氷河期クリアに報われる）。
  - フル強化 di3 ∈ [0.30, 0.85]（必勝でない・かつ到達不能でない）。
  - ツリーが効く: 無強化 di1 がフル強化 di1 より 0.30 以上低い（メタ進行が勝敗に乗る）。
  - 断崖なし: フル強化で隣接難易度（di1→di2→di3）の勝率低下が各 ≤ 0.40。
  - (b) パワーカーブ終盤交差（bc0/bc1 blood>ember、bc2 ember>blood）維持。
- `any` 型禁止。コメントは日本語で「なぜ」。色相/表示文字列の整合を保つ。
- バランスは経験的反復で収束。数値は出発点。**sim ガードレール緑＋プレイテスト体感**が受け入れ基準。
- 調整は軽量(`SIM_SEEDS=30`)で方向確認→フル(150)で最終ゲート。レバーは1つずつ。

## 現状の確定値（調査済み）

- `__sim__/run-simulator.ts:28-31` `EvoStrategy = 'greedy-atk'|'random'|'balanced'`。`pickEvo`（116-133行）。`greedy-atk` は `simEvo(run,ev).atk`（base atk）を最大化。`simEvo` は `game-logic.ts` 経由 `evolution-service`。
- sim キーストーン選択（240-245行）は一様ランダム。`SELECT_KEYSTONE` に `id` を渡す。
- `domain/keystone/keystone-service.ts:48` `if (hasKeystone(r,'madblood') && r.hp < r.mhp*0.3) mult *= 2;`（関数 `keystonePlayerAtkMods`）。
- `domain/battle/combat-calculator.ts:83` `if (r.fe==='rit' && r.hp < r.mhp*RIT_LOW_HP_RATIO) pa *= 3;`（関数 `calcPlayerAtk`、`RIT_LOW_HP_RATIO=0.3`）。
- 倍率の表示文字列: `constants/keystone.ts:8`（madblood desc「ATK×2」）、`constants/awakening.ts:18`（rit「低HP ATK×3」）、`domain/battle/tick-phases.ts:65`（ログ「⚡ 血の力が覚醒！ATK×3」）、`components/battle/PlayerPanel.tsx:54`（「⚡ATK×3」）。
- HP犠牲系進化: `constants/evolution.ts:33` 血の契約 `{ half:1, aM:2 }`（HP半減・ATK×2乗算）。
- 倍率の依存テスト: `keystone-service.test.ts:57`（`keystonePlayerAtkMods(low).mult).toBeCloseTo(2,5)`）、`signature-combos.test.ts:18`（`expect(mods.mult).toBe(2)`）。rit×3 を直接アサートするテストは無し。
- `constants/difficulty.ts` 現状: 原始 hm1/am1、氷河期 hm1.25/am1.2、大災厄 hm1.8/am1.55、神話世界 hm5.8/am5.4。`difficulty.test.ts` は構造のみ（hm/am 値は未アサート）。
- 既存バランス guardrail: `__sim__/balance-guardrail.test.ts`（前回の中間バンド目標。本計画で上書き）。

---

### Task 1: シミュレータ忠実化（`'burst'` 戦略＋キーストーン最適選択）

**Files:**
- Modify: `src/features/primal-path/__sim__/run-simulator.ts`（`EvoStrategy` 28-31行、`pickEvo` 116-133行、keystone case 240-245行）
- Test: `src/features/primal-path/__sim__/run-simulator.test.ts`（健全性。緑維持を確認）

**Interfaces:**
- Produces: `EvoStrategy` に `'burst'` を追加。`pickEvo(run, picks, 'burst')` は実効ATK(atk×aM)最大の進化を返す。キーストーン選択は madblood>primal_roar>hunter_stack>先頭の優先順。

- [ ] **Step 1: `EvoStrategy` に `'burst'` を追加する**

`run-simulator.ts:28-31` を変更:

```typescript
/** 進化選択ポリシー */
export type EvoStrategy =
  | 'greedy-atk' // 実効 ATK が最も伸びる進化を選ぶ（攻撃特化プレイヤー）
  | 'random' // 一様ランダム（無方針プレイヤー）
  | 'balanced' // 文明レベルが最も低い系統を伸ばす（覚醒・調和狙い）
  | 'burst'; // 実効ATK(atk×aM)最大化＋HP犠牲を許容する最適バースト（実プレイ最強ビルド近似）
```

- [ ] **Step 2: `pickEvo` に `'burst'` 分岐を追加する**

`pickEvo`（116-133行）の `greedy-atk` 分岐の直後に追加（base atk ではなく atk×aM を比較し、血の契約等の乗算系を取って低HP化を促す）:

```typescript
  if (strategy === 'burst') {
    // 実効ATK(atk×aM)を最大化。aM 乗算系(血の契約 half/aM2 等)を取るため自然に低HP域へ入り、
    // 狂血/儀式の低HPバーストが発火する実プレイ最強ビルドを近似する。
    const eff = (ev: Evolution): number => {
      const s = simEvo(run, ev);
      return s.atk * s.aM;
    };
    return picks.reduce((best, ev) => (eff(ev) > eff(best) ? ev : best));
  }
```

（`simEvo` の戻り値に `aM` が含まれることを実装時に確認。含まれない場合は `s.atk * (s.aM ?? 1)`。）

- [ ] **Step 3: キーストーン選択を最適化する**

`run-simulator.ts` の keystone case（240-245行）を、ATK系強キーストーン優先へ変更:

```typescript
      case 'keystone': {
        inBattle = false;
        const picks = s.keystonePicks ?? [];
        // 実プレイの最適選択を近似: ATK バースト系を優先（狂血>原始の咆哮>狩人の蓄積）、無ければ先頭。
        const PRIORITY = ['madblood', 'primal_roar', 'hunter_stack'];
        const best = PRIORITY.map(id => picks.find(p => p.id === id)).find(Boolean) ?? picks[0];
        s = gameReducer(s, { type: 'SELECT_KEYSTONE', id: best.id });
        break;
      }
```

- [ ] **Step 4: 健全性テストが緑のままか確認する**

Run: `npx jest src/features/primal-path/__sim__/run-simulator.test.ts --no-coverage`
Expected: PASS（既存5件。`'burst'` 追加で型・実行が壊れないこと）。

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck`
Expected: EXIT=0。

- [ ] **Step 6: フィードバック再現を測定・記録する（較正ベースライン）**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-report -t "①" --no-coverage --silent=false`
（`balance-report.test.ts:26` の `STRATEGIES` に一時的に `'burst'` を含めるか、別途 `'burst'` で `batch` を呼ぶ簡易確認でも可）
Expected: `'burst'` 戦略では現状定数で無強化 di1/di2 の勝率が高い（楽勝）ことを観測し、レポートに記録する。
これがユーザーフィードバックの再現＝sim が実プレイに近づいた証拠。

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/__sim__/run-simulator.ts
git commit -m "test: PRIMAL PATH シミュレータに burst 戦略＋キーストーン最適選択を追加

- 実効ATK(atk×aM)最大化で低HPバーストの実プレイ最強ビルドを近似
- キーストーンを狂血/原始の咆哮/狩人の蓄積優先で選択（従来は一様ランダム）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 新ガードレール（実プレイ較正の目標値）

**Files:**
- Modify: `src/features/primal-path/__sim__/balance-guardrail.test.ts`（前回の中間バンド目標を上書き）

**Interfaces:**
- Consumes: Task 1 の `'burst'` 戦略、`simulateRun`/`FULL_TREE`/`TOTEMS`

- [ ] **Step 1: ガードレールを新目標へ書き換える**

`balance-guardrail.test.ts` の `batch` を `'burst'` 戦略に変更し、(a) 系アサーションを新目標へ置換、(b) は維持する。
`totemAvgWinRate`/`curveAt` の `evoStrategy` を `'burst'` にする。アサーション:

```typescript
  it('(a) 原始でも苦戦: 無強化 di0 トーテム平均勝率が [0.40, 0.65]', () => {
    const wr = totemAvgWinRate(0, undefined);
    expect(wr).toBeGreaterThanOrEqual(0.40);
    expect(wr).toBeLessThanOrEqual(0.65);
  });

  it('(a) ツリーなしは厳しい: 無強化 di1 トーテム平均勝率が 0.30 未満', () => {
    expect(totemAvgWinRate(1, undefined)).toBeLessThan(0.30);
  });

  it('(a) 上限: フル強化 di3 トーテム平均勝率が [0.55, 0.80]（必勝でない）', () => {
    const wr = totemAvgWinRate(3, FULL_TREE);
    expect(wr).toBeGreaterThanOrEqual(0.55);
    expect(wr).toBeLessThanOrEqual(0.80);
  });

  it('(a) 断崖なし: 無強化の隣接難易度の勝率低下が緩やか（各差 ≤ 0.40）', () => {
    const w0 = totemAvgWinRate(0, undefined);
    const w1 = totemAvgWinRate(1, undefined);
    const w2 = totemAvgWinRate(2, undefined);
    expect(w0 - w1).toBeLessThanOrEqual(0.40);
    expect(w1 - w2).toBeLessThanOrEqual(0.40);
  });

  it('(b) 終盤交差: bc0/bc1 は blood>ember、bc2 は ember>blood', () => {
    expect(curveAt('blood', 0)).toBeGreaterThan(curveAt('ember', 0));
    expect(curveAt('blood', 1)).toBeGreaterThan(curveAt('ember', 1));
    expect(curveAt('ember', 2)).toBeGreaterThan(curveAt('blood', 2));
  });
```

（`curveAt`/`totemAvgWinRate` 内の `evoStrategy: 'greedy-atk'` を `'burst'` に変更すること。前回の (a) 系 it は削除・置換。)

- [ ] **Step 2: 現状定数では FAIL することを確認する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail --no-coverage --silent=false`
Expected: FAIL。特に「原始でも苦戦」（現状は無強化 di0 が高勝率で上限超過）・「di1<0.30」（現状は楽勝で超過）が落ちる。実測値を記録。

- [ ] **Step 3: コミット**

```bash
git add src/features/primal-path/__sim__/balance-guardrail.test.ts
git commit -m "test: PRIMAL PATH バランスガードレールを実プレイ較正基準へ更新（未達）

- burst戦略で測定、原始でも苦戦[0.40,0.65]/ツリーなしdi1<0.30/断崖なし/必勝でない
- 現状定数ではFAIL（楽勝を検出）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 狂気バーストのリスク化（倍率ナーフ）

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts:48`（madblood ×2→×1.6）
- Modify: `src/features/primal-path/domain/battle/combat-calculator.ts:83`（rit ×3→×2）
- Modify: 表示文字列 `constants/keystone.ts:8`、`constants/awakening.ts:18`、`domain/battle/tick-phases.ts:65`、`components/battle/PlayerPanel.tsx:54`
- Test: `__tests__/keystone-service.test.ts:57`、`__tests__/signature-combos.test.ts:18`（期待値更新）

**Interfaces:**
- Consumes: なし
- Produces: madblood mult=1.6、rit 低HP倍率=2

- [ ] **Step 1: madblood 倍率をナーフする**

`keystone-service.ts:48` を変更:

```typescript
  if (hasKeystone(r, 'madblood') && r.hp < r.mhp * 0.3) mult *= 1.6;
```

- [ ] **Step 2: rit 低HP倍率をナーフする**

`combat-calculator.ts:83` を変更:

```typescript
  if (r.fe === 'rit' && r.hp < r.mhp * RIT_LOW_HP_RATIO) pa *= 2;
```

- [ ] **Step 3: 表示文字列を倍率に合わせて更新する**

- `constants/keystone.ts:8` desc: `'HP30%以下の間 ATK×2'` → `'HP30%以下の間 ATK×1.6'`
- `constants/awakening.ts:18` rit の `bn`/`ds`: `'低HP ATK×3 ...'` → `'低HP ATK×2 ...'`（該当箇所のみ。`fx` は不変）
- `domain/battle/tick-phases.ts:65`: `'  ⚡ 血の力が覚醒！ATK×3'` → `'  ⚡ 血の力が覚醒！ATK×2'`
- `components/battle/PlayerPanel.tsx:54`: `'⚡ATK×3'` → `'⚡ATK×2'`

- [ ] **Step 4: 倍率テストの期待値を更新する**

- `__tests__/keystone-service.test.ts:57-58`: `toBeCloseTo(2, 5)` → `toBeCloseTo(1.6, 5)`。テスト名「mult ×2」→「mult ×1.6」。
- `__tests__/signature-combos.test.ts:18`: `expect(mods.mult).toBe(2)` → `toBeCloseTo(1.6, 5)`。コメント「ATK×2」→「ATK×1.6」。

- [ ] **Step 5: 関連ユニットテストの緑を確認する**

Run: `npx jest src/features/primal-path/__tests__/keystone-service.test.ts src/features/primal-path/__tests__/signature-combos.test.ts src/features/primal-path/__tests__/domain/battle/combat-calculator.test.ts --no-coverage`
Expected: PASS。万一 rit/madblood の値を間接アサートする他テストが落ちたら、新仕様（1.6/2）で期待値を更新。

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/domain/keystone/keystone-service.ts \
        src/features/primal-path/domain/battle/combat-calculator.ts \
        src/features/primal-path/constants/keystone.ts \
        src/features/primal-path/constants/awakening.ts \
        src/features/primal-path/domain/battle/tick-phases.ts \
        src/features/primal-path/components/battle/PlayerPanel.tsx \
        src/features/primal-path/__tests__/keystone-service.test.ts \
        src/features/primal-path/__tests__/signature-combos.test.ts
git commit -m "perf: PRIMAL PATH 狂気バーストをリスク化（倍率ナーフ）

- 狂血 ATK×2→×1.6、儀式低HP ATK×3→×2（合算上限×6→×3.2）
- 表示文字列(keystone/awakening/ログ/PlayerPanel)とテスト期待値を更新

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 難易度の再較正（ループの本体）

**Files:**
- Modify: `src/features/primal-path/constants/difficulty.ts`（hm/am）
- Test: `src/features/primal-path/__sim__/balance-guardrail.test.ts`（(a) 系で判定）

**Interfaces:**
- Consumes: Task 1 sim、Task 2 ガードレール、Task 3 ナーフ後の倍率

- [ ] **Step 1: 難易度 hm/am を初期候補へ再較正する**

`difficulty.ts` の hm/am を初期候補へ変更（最終値は Step 2 の反復で確定）。
原始を苦戦にし、断崖を是正する方向:

```
原始    : hm 1.0 → 1.3,  am 1.0 → 1.25
氷河期  : hm 1.25 → 2.0, am 1.2 → 1.8
大災厄  : hm 1.8 → 3.0,  am 1.55 → 2.7
神話世界: hm 5.8 → 4.2,  am 5.4 → 3.8   （断崖是正＝大災厄から滑らかに）
```

- [ ] **Step 2: 軽量シミュレーションで (a) を反復調整する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail -t "(a)" --no-coverage --silent=false`

判定と調整（レバーは1つずつ）:
- 無強化 di0 が 0.65 超 → 原始 hm/am を上げる。0.40 未満 → 下げる。
- 無強化 di1 が 0.30 以上 → 氷河期 hm/am を上げる。
- フル強化 di3 が 0.80 超 → 神話世界 hm/am を上げる。0.55 未満 → 下げる。
- 断崖（隣接差 > 0.40）→ 該当難易度間の hm/am 勾配を緩める。
- 倍率（Task 3）と難易度は相互作用するため、必要なら madblood/rit 倍率も ±0.1〜0.2 で微調整（Global Constraints の範囲で）。

(a) 4件が `SIM_SEEDS=30` で緑になるまで繰り返す。

- [ ] **Step 3: コミット**

```bash
git add src/features/primal-path/constants/difficulty.ts
git commit -m "perf: PRIMAL PATH 難易度を実プレイ較正で再調整（原始でも苦戦・断崖是正）

- 過度に緩めたdi0/di1/di2を引き上げ、di2→di3断崖を是正
- balance-guardrail (a)系が緑(30seed)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 最終ゲート＋回帰＋レポート

**Files:**
- Test: `balance-guardrail.test.ts`（全件）、primal-path 全スイート
- Modify: `docs/superpowers/reports/2026-06-21-primal-path-fun-verification-report.md`（再較正の結果を追記）

- [ ] **Step 1: フルシードでガードレール全件 PASS を確認する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=150 npx jest balance-guardrail --no-coverage --silent=false`
Expected: (a) 4件 + (b) 1件すべて PASS。境界で揺れたら Task 4 Step 2 へ戻り中央寄りへ微調整。実測値を記録。

- [ ] **Step 2: primal-path 全テスト・型・lint**

Run: `npx jest src/features/primal-path --no-coverage && npm run typecheck && npm run lint`
Expected: 全 PASS、EXIT=0、警告0。Task 3 の倍率変更で間接的に落ちるテストがないこと。

- [ ] **Step 3: 検証レポートに再較正結果を追記する**

`docs/superpowers/reports/2026-06-21-primal-path-fun-verification-report.md` に「§12 実プレイ較正による再調整（2026-06-23）」を追記:
プレイフィードバック要旨、sim 忠実化（burst 戦略）、倍率ナーフ（×6→×3.2）、難易度再較正の最終 hm/am、新ガードレール結果（無強化 di0/di1、フル di3、断崖）を Before/After で記載。

- [ ] **Step 4: コミット**

```bash
git add docs/superpowers/reports/2026-06-21-primal-path-fun-verification-report.md
git commit -m "docs: PRIMAL PATH 実プレイ較正による再調整結果を検証レポートに追記

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: プレイテスト再検証を依頼する**

実プレイで「原始が苦戦・狂気がリスク化・大災厄が壁・断崖なし」を体感確認するようユーザーに依頼する（sim 較正は近似のため最終確認）。フィードバックがあれば Task 4 の較正ループへ戻る。

---

## Self-Review

- **Spec coverage:** spec §3.1 sim忠実化 → Task1。§3.4 ガードレール → Task2。§3.2 倍率ナーフ → Task3。§3.3 難易度再較正 → Task4。§4 検証/反復 → 各Task＋Task5。§5 影響テスト → Task3 Step4。全カバー。
- **Placeholder scan:** 難易度/倍率の最終値は「初期候補→較正で確定」と明示（経験的調整であり TBD ではない）。それ以外に TBD なし。
- **Type consistency:** `EvoStrategy` への `'burst'` 追加、`pickEvo` の `eff(ev)=atk*aM`、`keystonePlayerAtkMods` の mult、`calcPlayerAtk` の pa、ガードレールの `totemAvgWinRate`/`curveAt` を実コードと一致確認済み。

## 実行上の注意

- Task4 の較正は長時間の経験的ループ（フル150は数分）。軽量30で方向確認、フルは節目のみ。
- sim 忠実化は近似。最終はプレイテスト（Task5 Step5）で体感確認。
