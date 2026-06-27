# 迷宮の残響 — ベース難易度の再調整＋バランス契約テスト（Phase 2）設計書

- 作成日: 2026-06-27
- 対象ゲーム: `src/features/labyrinth-echo/`
- ステータス: 設計承認待ち → 実装計画（writing-plans）へ
- 前提: Phase 1（物語の背骨＋残響書庫）= PR #135 でレビュー済み。ロードマップは memory `labyrinth-echo-narrative-roadmap`

## 1. 背景と目的

「迷宮の残響」は **Normal（挑戦者）が簡単すぎる**。初期HP55・ドレイン-1MN/ターン・安息イベントが重み2倍で出やすく+12HP回復、かつ dmgMult 1.0 のため、慎重に選べばまず死なない。

**目的**: 初回プレイから歯ごたえが出るよう**ベース難易度を「理不尽でない程度に締める」**。慎重にやれば初回でも生還可能だが、油断・ミスは確実に罰される中程度バランスへ。あわせて、難易度の歯ごたえを回帰から守る**バランス契約テスト**を整備する。

### 1.1 決定済みの方針（ブレインストーミング）

- **難易度の狙い**: 理不尽でない程度に締める（Normal は「慎重なら概ね半々で生還」）。
- **調整ノブ**: 中央集権ノブのみ（config / difficulty modifier / status tick / 安息の重み / echo 読み解きコスト）。**個別イベントの情報ゲート（163件）は非改変**＝低リスク。
- **契約テスト**: 決定論的シミュレーション＋静的不変量の二段構え。
- **Easy は据置**（物語を楽しむ層の間口を守る）。Normal→Hard→Abyss を段階的に締める。

## 2. スコープ

### 2.1 やること
- 中央集権5ノブの数値再調整（§3）。
- ヘッドレス・ランシミュレータ（純粋関数）の新設（§4）。
- バランス契約テスト（生還率バンド＋単調性＋静的不変量）の新設（§4）。
- 数値変更で期待値がズレる既存テストの更新（§5）。
- README へのバランス再調整追記。

### 2.2 やらないこと（スコープ外）
- 個別イベントの情報ゲート（`inf>N`）・ダメージ量・結果（163件）の改変。
- echoDepth 連動の NG+ エスカレーション（→ Phase 3）。
- KP 報酬経済の再設計（現状維持）。
- `use-game-actions`（React フック）を simulator と共有させる大規模リファクタ（将来。今回は重複をコメント明示して許容）。

## 3. 数値チューニング（中央集権5ノブ）

Normal を基準に締める。`dmgMult` の Normal は定義上 1.0 維持し、Normal の締めはドレイン・ベース・安息で表現する。

### 3.1 ノブ1: ベース初期値（`domain/constants/config.ts`）
| 値 | 現行 | 変更 | 意図 |
|---|---|---|---|
| BASE_HP | 55 | **52** | HP余裕を微減 |
| BASE_MN | 35 | **33** | 序盤から精神圧 |
| BASE_INF | 5 | 5（据置） | 情報ゲート非改変方針 |

### 3.2 ノブ2: 難易度modifier（`domain/constants/difficulty-defs.ts`）`{hpMod, mnMod, drainMod, dmgMult}`
| 難易度 | 現行 | 変更 | 最終HP（現→新） |
|---|---|---|---|
| easy | 12, 8, 0, 0.7 | **14, 9, 0, 0.7** | 67→66（実質据置） |
| normal | 0, 0, -1, 1.0 | **0, 0, -2, 1.0** | 55→52・ドレイン倍 |
| hard | -15, -12, -3, 1.35 | **-14, -12, -4, 1.4** | 40→38 |
| abyss | -25, -20, -5, 1.8 | **-24, -20, -6, 1.9** | 30→28 |

Easy の hpMod/mnMod を +2/+1 してベース減を相殺＝Easy はほぼ現状維持。Normal 以上だけが実質的に締まる。`rewards`（kpOnDeath/kpOnWin）は現状維持。

### 3.3 ノブ3: 状態異常tick（`domain/constants/status-effect-defs.ts`）
| 状態 | 現行 tick | 変更 |
|---|---|---|
| 出血 | hpDelta -5 | **hpDelta -6** |
| 恐怖 | mnDelta -4 | **mnDelta -5** |
| 負傷 / 混乱 / 呪い | null | 据置（選択ゲート・情報半減等の既存効果を維持） |

### 3.4 ノブ4: 安息の出やすさ（`events/event-utils.ts` の `pickEvent`、および `domain/events/event-selector.ts`）
- 現状 rest イベントは重み +1（2倍出現）。**この重みブーストを撤去**し通常頻度に。回復頼みのコースト戦法を抑制。
- 2つの `pickEvent` 実装（`event-utils.ts`=本番／`event-selector.ts`=別実装）の双方を一致させる。

### 3.5 ノブ5: echo読み解きコスト（`events/echo-events.ts`、Phase1申し送り）
- `READ_MN_COST` -3 → **-4**。精神が締まる中で断片読解にトレードオフを持たせる。

## 4. シミュレーション＋バランス契約テスト

### 4.1 ヘッドレス・ランシミュレータ（`domain/services/run-simulator.ts`、新規・純粋）

```ts
interface RunResult {
  readonly survived: boolean;
  readonly floorReached: number;
  readonly endingId: string | null;
  readonly cause: string;       // "escape" | "体力消耗" | "精神崩壊"
  readonly events: number;      // 消化イベント数
}

simulateRun(params: {
  difficulty: DifficultyDef;
  fx: FxState;                  // 無アンロック中立 FxState（初回相当）
  rng: RandomSource;            // seeded（決定論）
  policy: RunPolicy;            // careful | random
  events: readonly GameEvent[]; // 通常＋echo 統合済みイベント
}): RunResult
```

- 内部ループ（本番進行ルールを純粋関数で再構成）:
  1. `pickEvent`（seeded rng）でイベント選出。
  2. `policy` が選択肢インデックスを決定。
  3. `processChoice`（純粋・drain 込み）で結果適用。
  4. `checkSecondLife` 判定。
  5. 死亡（hp/mn ≤ 0）/脱出（outcome.fl==="escape"）判定。
  6. フロア進行（`EVENTS_PER_FLOOR`/`MAX_FLOOR`）・ボス再戦（`BOSS_EVENT_ID`/`MAX_BOSS_RETRIES`）。
- フロア/ボス進行の判定は小さな純粋ヘルパに切り出し、可能な範囲で本番フックと共有を図る。残る重複はコメントで明示。simulator は CFG を直接参照しマジックナンバー乖離を防ぐ。
- fx は無アンロック中立（`unlocked: []` から導出）＝初回プレイの歯ごたえを測る。

### 4.2 ポリシー2種（`run-simulator.ts` 内）
- **careful（慎重）**: 各選択肢で `processChoice` を試行し、結果 `drained.hp + drained.mn` が最良の選択肢を貪欲選択（`outcome.fl==="escape"` を最優先）。「理不尽でない」の基準層。
- **random（無策）**: 一様ランダム選択（rng 駆動）。下限の歯ごたえ検証用。

### 4.3 バランス契約テスト

**A. 決定論的 sim（`__tests__/domain/services/balance-contract.test.ts`、seeded, N=200ラン/難易度）**

careful 生還率バンド（合格基準。実装時に微調整して収める）:
| 難易度 | careful 生還率バンド |
|---|---|
| easy | ≥ 65% |
| normal | 40–70% |
| hard | 15–45% |
| abyss | ≤ 22% |

- **単調性（主軸）**: careful・random 双方で `easy > normal > hard > abyss`。
- **random < careful**（同一難易度で無策は確実に不利）。
- バンドは緩め・主軸は単調性（sim はポリシー依存で絶対値が揺れるため。memory「sim較正の限界」への対処）。

**B. 静的不変量（同ファイル、決定論・高速）**
- `hpMod`: easy > normal ≥ 0 > hard > abyss
- `drainMod`: easy(0) > normal(-2) > hard(-4) > abyss(-6)
- `dmgMult`: easy(0.7) < normal(1.0) < hard(1.4) < abyss(1.9)
- `kpOnWin`: easy < normal < hard < abyss
- 全難易度で初期 HP/MN > 0（破綻防止）。

### 4.4 決定論の担保（`domain/events/random.ts`）
- seeded な `RandomSource` 実装（既存に無ければ追加。既存 `shuffleWith` は rng 注入対応済）。
- 固定シード列で N ラン回し再現可能＝テスト安定。`Date.now`/`Math.random` 不使用。
- simulator 単体テスト（`run-simulator.test.ts`）で「同一シード→同一結果」を固定。

## 5. 既存テストへの影響

数値変更により以下が期待値ズレで失敗するため、新しい値に更新する（回帰の正当な更新）:
- `__tests__/domain/models/difficulty.test.ts`（modifier 期待値）
- `__tests__/domain/services/combat-service.test.ts`（drain/dmg 計算）
- config（BASE_HP/MN）/ status tick を参照する各テスト
- echo 読み解きコスト（READ_MN_COST）を参照するテスト（あれば）

実装時に `npm test` で失敗を洗い出し、設計値に合わせて更新する。

## 6. 実装順（TDD・反復較正）

1. 静的不変量テスト（高速・決定論）を先に固定。
2. `run-simulator` を TDD（同一シード再現性・基本生還/死亡/脱出・フロア進行）。
3. ノブ変更を適用し、影響する既存テストの期待値を更新。
4. 生還率バンドテストを追加→実測しバンド内に収まるようノブを微調整（Primal Path 再較正と同手法。バンドは緩め、主軸は単調性）。
5. README 追記。
6. `npm run ci` 通過確認。

## 7. リスクと対処

- **sim とフック本番ロジックの乖離**: simulator は本番進行ルールを再構成するため重複が生じる。フロア/ボス進行を純粋ヘルパに切り出して可能な範囲で共有、残る重複はコメントで明示（Primal Path sim の前例あり）。simulator が CFG を直接参照することで定数乖離を防止。
- **バンド未達**: 設計方向の範囲でノブを微調整（数値は設計の「方向」、バンドが合格基準）。Normal が締まり過ぎたら drainMod を戻す等。
- **Easy 過剰ナーフ**: Easy modifier の相殺（+2/+1）で現状維持を担保。静的不変量＋ sim バンドで監視。

## 8. 受け入れ基準（Phase 2 完了条件）

- [ ] 5ノブの数値が設計値に更新されている。
- [ ] `run-simulator` が同一シードで再現可能・脱出/死亡/フロア進行が正しい。
- [ ] バランス契約テスト（生還率バンド＋単調性＋静的不変量）が通る。
- [ ] 影響する既存テストが新値で更新され通る。
- [ ] `npm run ci`（lint:ci / typecheck / test / build）が通る。
