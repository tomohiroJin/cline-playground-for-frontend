# 原始進化録（PRIMAL PATH）Phase 3 設計：上位トーテム＋シグネチャーコンボ統合

## 概要

PRIMAL PATH ビルド多様性ブラッシュアップの最終フェーズ（Phase 3）。Phase 1（始祖トーテム基盤・基本3種）、Phase 2（キーストーン効果エンジン10種・取得UI・ドラフト混入）で確立した「**宣言的トーテム効果＋ tick フックのキーストーン効果**」パターンを踏襲・拡張し、横軸（アーキタイプ）×縦軸（パワーカーブ）×コンボの三次元設計を完成させる。

本フェーズの核心は次の2点：

1. **上位トーテム3種**（🛡️岩／👻霊／🌰種火）の効果実装と解放制御。基本3種ではカバーされない「反射タンク」「覚醒スケール」「極・晩成」のアーキタイプを開放する。
2. **シグネチャーコンボ6種の統合テスト**（Phase 2a で積み残した「棘の守護の反射キル1tick遅延」バグの固定を含む）。

加えてフルスコープとして、キーストーン提示のタグ軸重み付け拡張、RunStats/StatsScreen 連携、バランス調整を含む。

## 前提：上位設計との関係

- 上位設計書：`docs/superpowers/specs/2026-06-18-primal-path-build-variety-design.md`
- 本書はその「実装フェーズ Phase 3」（同設計書 line 141-146）の詳細設計である。

### 既に実装済みで本フェーズの対象外

調査により、上位設計書の Phase 3 箇条書きのうち以下は Phase 1/2 で既に実装済みであることを確認した：

- **解放フィルタ**：`TotemSelectScreen.tsx:28` が `TOTEMS.filter(t => save.clears >= t.unlock)` で解放制御済み。上位トーテムは `unlock` 値（2/5/10）を設定するだけで解放が効く。
- **curve 重み付け**：`rollKeystones`（`domain/keystone/keystone-service.ts:104`）が「トーテムの curve 一致を重み2で優先」する重み付けを実装済み。本フェーズではこれに **tag 軸**を合算する。

## 全体アプローチ

新規アーキテクチャは導入しない。既存の純粋関数群（`domain/totem/`・`domain/keystone/`・`domain/battle/`）に新フィールド・新フックを足す。後方互換は **optional フィールド＋`?? 既定値`** で担保し、既存セーブ・既存ランを非破壊とする（Phase 1/2 と同方針）。

**重要な制約：新規フェーズ（`GamePhase`）は追加しない。** 既存の `totem`/`keystone`/`evo` フェーズを再利用するため、E2E ヘルパー（`e2e/helpers/primal-path-helper.ts`）の `PHASE_MARKERS`/`startRun`/`advanceToPhase` の追従は不要（Phase 1 の教訓を回避）。

## A. 上位トーテム3種

`TotemEffect` に新フィールドを追加し、`constants/totem.ts` の `TOTEMS` 配列に3種を追加する。`TotemId` 型に `'rock' | 'spirit' | 'ember'` を追加。

| トーテム | id | 解放 | curve | 効果 | 効果フィールド |
|---|---|---|---|---|---|
| 🛡️ 岩の祖 | `rock` | 2クリア | combo | DEF+4＋環境ダメージ-30% | `defAdd: 4`（既存）＋`envDmgR: 0.3`（新） |
| 👻 霊の祖 | `spirit` | 5クリア | scaling | 覚醒要求-1＋覚醒効果+25% | `awkReqReduce: 1`（新）＋`awkMul: 0.25`（新） |
| 🌰 種火の祖 | `ember` | 10クリア | scaling | 開始ATK-30%＋踏破ごと全ステ+12%（線形・差分回復） | `atkMul: 0.7`（既存）＋`biomeScale: 0.12`（新） |

### A-1. 環境ダメージ軽減（岩の祖）

- `TotemEffect.envDmgR?: number`（軽減率、岩=0.3）を追加。
- 純粋関数 `calcEnvDmg(biome, envScale, tb, fe)`（`domain/battle/combat-calculator.ts:52`）のシグネチャは温存する。
- **配線**：`calcEnvDmg` の呼出側（`tick-phases.ts:31`）で、トーテム由来の軽減率を既存の `tb.iR/fR`（ツリー由来の抵抗）に合算して渡す。`calcEnvDmg` 内部は `d * (1 - (tb[cfg.resist] || 0))` で計算するため、`tb` に軽減率を上乗せした実効抵抗を渡せば自然に反映される。
- **代替案（不採用）**：run に `envDmgR` を持たせ `calcEnvDmg` に引数追加。純粋関数の引数増は全呼出・全テストに波及するため不採用。

### A-2. 覚醒要求緩和＋効果増（霊の祖）

- `TotemEffect.awkReqReduce?: number`（覚醒要求の減算、霊=1）と `TotemEffect.awkMul?: number`（覚醒効果の増加率、霊=0.25）を追加。
- **覚醒要求**：`startRunState`（run 初期化）で、トーテム適用時に `r.saReq -= awkReqReduce`・`r.fReq -= awkReqReduce`（いずれも最小1にクランプ）。`saReq`/`fReq` は `run-service.ts:48` で `4 + tb.aQ` / `5 + tb.fQ` として初期化される。
- **覚醒効果増**：`RunState` に `awkMul?: number`（既定0）を optional 追加。`applyAwkFx`（`domain/awakening/awakening-service.ts:38`）で、`AwakeningEffect` の数値効果に `×(1 + awkMul)` を掛けてから適用する。

### A-3. 踏破スケール（種火の祖）

- `TotemEffect.biomeScale?: number`（踏破ごとの全ステ加算率、種火=0.12）を追加。
- **伸び方＝加算型（線形）**：`base × (1 + 0.12 × bc)`。踏破（`bc`）ごとに**初期基準値の +12% ずつ**を加算する。endless モードでも線形で抑制が効き、バランスが読みやすい。複利（指数）は不採用。
- **保持方式**：run 初期化時に、基準ステータス（`atkMul: 0.7` 適用後の ATK/DEF/最大HP）を `RunState.emberBase?: { atk: number; def: number; mhp: number }` として snapshot する。
- **適用タイミング＝踏破時フック**：バイオーム踏破時に `emberBase.{atk,def,mhp} × 0.12` を ATK/DEF/最大HP に加算する。これにより進化カードによるステ加算とは**独立した加算トラック**となり、二重計上を防ぐ。
- **最大HP増加時の現在HP＝差分回復**：最大HPの増加分（`Δmhp`）だけ現在HPも加算する（`hp += Δmhp`）。「踏破ごとに少し息をつける」晩成テンポ。全回復ではない。
- **代替案（不採用）**：都度導出（`derived = base × 0.12 × bc`）。ATK は導出計算（`calcPlayerAtk`）に乗せられるが、最大HP/現在HP は stateful なため導出と相性が悪く、踏破時に確定する状態方式を採る。

> 注：上位設計書 line 45 の「`applyTotem` の hp クランプ `min(r.hp, next.mhp)` は HP 増加型トーテムで hp が追従しない」という積み残しは、本フェーズの種火（差分回復）で対応する。

## B. キーストーン提示の重み付け拡張（curve + tag 合算）

- `TotemDef` に推しアーキタイプ `tag?: SynergyTag` を追加し、6種すべてに付与する（`SynergyTag` は `KeystoneDef.tag` と同じ型で、`types/evolution.ts` から再利用）。
- `rollKeystones`（`keystone-service.ts:104`）の重みを以下に拡張：

  ```
  weight = 1 + (キーストーンの curve がトーテムの curve と一致 ? 1 : 0)
             + (キーストーンの tag  がトーテムの tag  と一致 ? 1 : 0)
  ```

  重みは最小1・最大3。控えめな重み（最大3倍）に留め、ランダム性を残す。
- **トーテム → 推しタグ対応**：

  | トーテム | curve | 推しタグ | 優先提示されるキーストーン例 |
  |---|---|---|---|
  | 🩸 血の祖 | front | `wild` | 狂血の覚醒・諸刃の進化 |
  | 🔥 炎の祖 | combo | `fire` | 連鎖の業火 |
  | 🏕️ 群れの祖 | scaling | `tribe` | 群狼の戦術 |
  | 🛡️ 岩の祖 | combo | `shield` | 棘の守護 |
  | 👻 霊の祖 | scaling | `spirit` | 骨喰らい |
  | 🌰 種火の祖 | scaling | `hunt` | 狩人の蓄積・原始の咆哮 |

- `rollDraftKeystone`（ドラフト混入）は一様抽選のまま据え置く（節目提示とは性質が異なり、混入は「偶然の出会い」を意図するため重み付けしない）。

## C. シグネチャーコンボ統合テスト6種＋反射1tick遅延の固定

### C-1. バグ修正：棘の守護の反射キル1tick遅延

- Phase 2a 積み残し：棘の守護の反射ダメージが当該 tick では敵HPに反映されるが撃破判定が次 tick に持ち越され、稀に1tick遅延する。
- **修正**：`tick-phases.ts` の被ダメージ→反射の処理後、**同一 tick 内**で敵の撃破判定を行うよう順序を修正する。反射による撃破がその場で成立するようにする。
- 既存の火傷・通常攻撃の撃破判定との整合（二重キル計上の防止）に注意する。

### C-2. コンボ6種の検証（メカニズム単体＋戦闘スモークの両建て）

各コンボについて、**(1) メカニズム単体テスト**（狙った乗算効果が確かに発火することを関数レベルで検証）と、**(2) 戦闘スモークテスト**（代表ビルドで戦闘ループを数 tick 回し結合を検証）の両方を用意する。検証軸は「**狙った乗算効果が確かに発火する**」であり、「必ず勝つ」の断定はしない（設計指針＝コンボは成立はするが必勝ではない、に忠実）。

| # | コンボ | 構成 | 検証する乗算効果 |
|---|---|---|---|
| 1 | 低空飛行 | 不滅の祈り＋狂血の覚醒＋🩸血の祖 | 低HP維持で ATK×2 が常時発火し、致死を祈りで耐える |
| 2 | 反射タンク | 棘の守護＋🛡️岩の祖＋高DEF/HP | 被ダメ反射が同tickで敵を削り、環境ダメ軽減で安定する |
| 3 | 火傷伝播 | 連鎖の業火＋業火シナジー＋火傷カード群 | 火傷キルで火傷倍率が恒久加算され波を溶かす |
| 4 | 群狼 | 群狼の戦術＋🏕️群れの祖＋tribeシナジー | 生存仲間数に比例してプレイヤーATKが乗算 |
| 5 | 諸刃の逆転 | 諸刃の進化＋高DEFカード/盾シナジー | 高DEFが ATK へ×3 変換される |
| 6 | 極・晩成 | 🌰種火の祖＋骨喰らい/狩人の蓄積 | 踏破スケール＋キル/骨スタックが終盤に累積する |

## D. RunStats / StatsScreen 連携

- `RunStats` に `totemId?: TotemId` を追加（`keystoneCount?` は Phase 2b で追加済み）。
- ラン終了時（統計確定処理）に選択トーテム `run.totemId` を記録する。
- `StatsScreen` の各ラン表示にトーテムアイコン/名と取得キーストーン数を表示する。後方互換のため `totemId` 未設定の旧ランは非表示（または「—」）とする。
- **実績連携**：最小限に留める。「上位トーテムでクリア」系の軽い実績を1〜2個に限定（YAGNI 寄り。既存の実績判定基盤に乗る範囲のみ）。

## E. バランス調整

- E2E はローカル実行不可（CI のみ）。jest 戦闘スモークテスト＋手動プレイを前提とする。
- **ガードレールテスト**：
  - 種火の線形成長が想定範囲に収まること（例：`bc=5` で `base × 1.6`）をアサート。
  - 各上位トーテムが自明な必勝にならないこと（極端なステ倍率になっていないこと）を境界値で確認。
- パワークリープ抑制：上位トーテムは「軸を尖らせる」効果であり、基本3種より総合的に強くなりすぎないよう効果値を調整する。

## アーキテクチャ変更点まとめ

| 区分 | 変更内容 |
|---|---|
| 型 | `TotemId` に `'rock' \| 'spirit' \| 'ember'` 追加。`TotemEffect` に `envDmgR?`・`awkReqReduce?`・`awkMul?`・`biomeScale?` 追加。`TotemDef` に `tag?: SynergyTag` 追加。`RunState` に `awkMul?`・`emberBase?` 追加（optional）。`RunStats` に `totemId?` 追加。 |
| 定数 | `constants/totem.ts` の `TOTEMS` に上位3種を追加。 |
| ドメイン | `domain/totem/`：覚醒要求緩和・種火 snapshot をラン初期化に追加。`domain/battle/tick-phases.ts`：種火の踏破フック、棘の守護の反射同tick修正、環境ダメ軽減の合算。`domain/awakening/awakening-service.ts`：`applyAwkFx` に `awkMul` 反映。`domain/keystone/keystone-service.ts`：`rollKeystones` に tag 重み合算。 |
| UI | `TotemSelectScreen.tsx`（解放表示は既存ロジックで動作、上位トーテムのカーブ/効果表示確認）。`StatsScreen.tsx` にトーテム・キーストーン表示追加。 |
| 解放 | 上位トーテムは `save.clears`（既存）から導出。新規セーブ項目なし。 |

## フェーズ遷移への影響

**なし。** 新規 `GamePhase` を追加しないため `PHASE_TRANSITIONS` および `phase-transitions.test.ts` の変更は不要。E2E ヘルパーの追従も不要。

## 非目標（YAGNI）

- ドラフトのリロール/バニッシュ/ロック（上位設計のアプローチB）。
- 文明ツリーの分岐型再設計（アプローチC）。
- 新規フェーズの追加。
- 実績の大規模追加（最小限の1〜2個に限定）。

## リスクと留意点

- **パワークリープ**：上位トーテム＋コンボは強化方向。ガードレールテスト＋手動プレイでバランス確認する。
- **反射同tick修正の回帰**：撃破判定順序の変更は既存の火傷/通常攻撃キル計上に波及しうる。既存の tick-phases テストが全てパスすることを確認する。
- **種火の二重計上**：`emberBase` snapshot により進化加算と独立トラックを保つ。snapshot タイミング（atkMul 適用後）を厳守する。
- **セーブ後方互換**：`awkMul`・`emberBase`・`totemId`（RunStats）は新規ランから付与。既存セーブ構造は不変。
