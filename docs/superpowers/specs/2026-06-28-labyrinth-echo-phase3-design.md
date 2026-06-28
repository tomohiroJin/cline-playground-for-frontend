# 迷宮の残響 — NG+残響エスカレーション（Phase 3）設計書

- 作成日: 2026-06-28
- 対象ゲーム: `src/features/labyrinth-echo/`
- ステータス: 設計承認待ち → 実装計画（writing-plans）へ
- 前提: Phase 1（物語の背骨＋残響書庫, #135）・Phase 2（ベース難易度再調整＋バランス契約, #136）マージ済。ロードマップ: memory `labyrinth-echo-narrative-roadmap`

## 1. 背景と目的

ユーザーの不満4点のうち「**クリア後の周回でわくわくしない**」を解決する。現状 `echoDepth` はロア専用で、戦闘・難易度に一切影響していない。Phase 3 は echoDepth を上限に**選択式の周回難易度「残響圧（Echo Pressure）」**を導入し、圧を上げるほど迷宮が手強く化け、発見済みの先人が**敵性の「残響の亡霊」**として襲来する。高圧クリアには大きな報酬（KP・称号）を与え、「さらに挑む」周回の動機を作る。

### 1.1 決定済みの方針（ブレインストーミング）
- **エスカレーション構造**: 選択式「残響圧」（Hades Heat 型）。難易度選択画面で任意に圧を上げる。圧0=従来通り。
- **圧の上限**: 0〜`echoDepth`（Phase 1 の echoDepth を再利用。生還で深めるほど上のティアが解禁。上限 `ECHO_DEPTH_MAX=6`、Phase 5 で拡張）。
- **エスカレーションの実体**: Phase 2 の中央集権ノブ（dmgMult/drainMod/初期値）を圧レベルで増分。難易度の**後段**に適用。
- **残響の亡霊**: 既存のイベント/選択肢構造を活かした高ステークの特殊イベント（先人ごとに手書き5件）。
- **報酬**: KP スケーリング＋称号＋進捗可視化（新アンロックは見送り）。
- **検証**: Phase 2 シミュレータを圧対応に拡張し、圧の単調性を契約テスト化。

## 2. スコープ

### 2.1 やること
- 残響圧システム（メタ変数・選択UI・エスカレーション純粋関数）（§3）。
- 残響の亡霊イベント5件（§4）。
- 報酬・インセンティブ（KP スケーリング・称号3種・可視化）（§5）。
- 圧対応シミュレータ＋圧の単調性／圧0回帰のバランス契約テスト（§6）。

### 2.2 やらないこと（スコープ外）
- 圧専用の新アンロック（`unlock-defs` 追加）＝見送り（KP経済の再設計を避ける）。
- 圧連動のエンディング分岐（Phase 5 の真ENDで扱う）。
- 個別イベント（163件）・echo断片データの改変。
- 戦闘システムの新設（亡霊は既存の Choice/Outcome 構造で表現）。

## 3. 残響圧（Echo Pressure）システム

### 3.1 メタ変数とラン状態
- `MetaState` に追加:
  - `maxPressureCleared: number`（生還で踏破した最高圧。既定0）
  - `revenantsDefeated: readonly string[]`（撃破した先人ID。既定[]）
- ラン状態（`use-game-orchestrator` の reducer）に追加:
  - `pressure: number`（選択中の残響圧）
  - `revenantsThisRun: number`（このランで撃破した亡霊数。KPボーナス用）
- 選択可能範囲 = `0..maxSelectablePressure(echoDepth)` = `clamp(echoDepth, 0, PRESSURE_MAX)`。

### 3.2 エスカレーション（圧→実効難易度）
**設計の要**: 戦闘系のシグネチャを変えず、境界で圧を「実効難易度」に畳む。

- `escalationFromPressure(pressure): { hpMod, mnMod, drainMod, dmgMult }`（圧あたり増分の合算）。
- `applyPressureToDifficulty(diff, pressure): DifficultyDef` — `modifiers` に escalation を加算した新 DifficultyDef を返す。`id`/`name`/`subtitle`/`color`/`icon`/`description`/`rewards` は基底のまま。
- ラン開始（selectDiff）時に `state.diff = applyPressureToDifficulty(selectedDiff, selectedPressure)` として格納。`createNewPlayer`/`processChoice`/`computeDrain`/`determineEnding` はこの実効難易度を使う＝改修不要。

圧あたり増分（`escalation-defs.ts`、方向・要較正）:
| 項目 | 圧あたり | 圧6での合算 |
|---|---|---|
| dmgMult | +0.08 / level | +0.48 |
| drainMod | -1 / 2 levels（`-floor(pressure/2)`） | -3 |
| hpMod / mnMod | -2 / 2 levels（`-floor(pressure/2)*2`） | -6 |

`PRESSURE_MAX = ECHO_DEPTH_MAX`（=6）。

### 3.3 較正目標（§6 のシミュレータで検証）
- **圧0は Phase 2 と完全一致**（escalation 全項目0）。Phase 2 契約が圧0の回帰ガードになる。
- **同一難易度で圧が上がるほど生還率が単調減少**（圧の単調性）。
- 目安: careful Normal 生還率 圧0≈82% → 圧3≈50% → 圧6≈20%（理不尽でなく、上手いほど上の圧に挑める）。バンドは緩め・単調性が主軸。

## 4. 残響の亡霊イベント

### 4.1 仕組み
- 先人5名ごとに敵性イベントを1件ずつ手書き（`events/revenant-events.ts`）。`ECHO_EVENTS` 同様 `EVENTS` に concat。
- 新イベント種別 `tp:"revenant"`（`EVENT_TYPE` に登録）。
- **二重ゲート**: ①残響圧 ≥ `minPressure`、②その先人を発見済み（`isPredecessorDiscovered(predId, meta.fragments)` を `metaCond` で判定）。
- 出没フロアは先人の `floors` に準拠。圧0では `minPressure` を持つイベントは出ない（回帰なし）。

### 4.2 圧ゲートの実装
- `GameEvent` に `minPressure?: number` を追加。
- `pickEvent` に `pressure` 引数（既定0）を追加し、`!e.minPressure || pressure >= e.minPressure` でフィルタ。発見済み判定は既存 `metaCond`（`meta.fragments` 参照）。
- `pressure` は `events/event-utils.ts` と `domain/events/event-selector.ts` の両 `pickEvent` でパリティ維持。

### 4.3 亡霊一覧
| 先人ID | 亡霊 | minPressure | 出没階層 | 性格・攻略軸 |
|---|---|---|---|---|
| p_lian | 写本師リアンの亡霊 | 2 | 1-2 | 記録に溺れた狂気。inf で弱点／情で鎮める |
| p_twins | 双子の亡霊 | 2 | 2-3 | 遺された側の慟哭。情に訴える選択が効く |
| p_galen | 地図屋ガレンの亡霊 | 3 | 3-4 | 空間を歪めて惑わす。inf/冷静さで対処 |
| p_elna | 守人エルナの試練 | 4 | 4-5 | 半ば守護者の試練。対話か実力か |
| p_first | 始まりの探索者 | 5 | 5 | 起源との対峙。最大の脅威にして真相の入口 |

### 4.4 イベント構造
各亡霊は3択・条件分岐つき。高ダメージ（hp/mn 大）だが、突破すると大きな情報値＋報酬フラグ。物語的に決着する。
- 「鎮めた/退けた」outcome は `fl:"revenant:<predId>"` を付与。`fl:"frag:"` と同じ既存フラグ機構（player 適用・chain・escape に干渉しない）。
- 例（リアン）:
  - 「記録の山から弱点を読む」`inf>25`成功＝低被害＋大inf＋`fl:"revenant:p_lian"`／失敗＝混乱付与
  - 「力ずくで振り払う」`hp>40`＝中被害／default＝大被害＋出血
  - 「『お前の記録は確かに残った』と語りかける」`mn>35`＝鎮める（大報酬・`fl:"revenant:p_lian"`）／default＝精神大被害
- 5件の全文は実装計画で確定。

## 5. 報酬とインセンティブ

### 5.1 KP スケーリング
生還時の KP に加算: `+ round(kpOnWin × selectedPressure × 0.25) + revenantsThisRun`。
- 圧0は加算ゼロ＝従来通り。
- 例: Normal（kpOnWin 3）を圧6で生還＝通常 + round(3×6×0.25)=+5、亡霊2体撃破で +2。

### 5.2 撃破の追跡
- `useHandleChoice` で outcome の `fl:"revenant:<predId>"` を検出（`fragments` 収集と同パターン）:
  - `revenantsThisRun` をインクリメント（reducer）。
  - `meta.revenantsDefeated` に predId を重複なく追加（永続）。
- 生還時（`handleEscapeOutcome`）に `maxPressureCleared = Math.max(m.maxPressureCleared, state.pressure)`。

### 5.3 称号（`title-defs.ts` に追加）
| 称号 | 条件 |
|---|---|
| 残響に抗う者 | `maxPressureCleared >= 3` |
| 残響を統べる者 | `maxPressureCleared >= 6` |
| 亡霊狩り | `revenantsDefeated.length === 5` |

### 5.4 進捗可視化
- Records/TitleScreen の統計に「最高残響圧 N」を1行追加。
- ArchiveScreen の先人カードに「亡霊：撃破済/未遭遇」バッジを追加。

## 6. シミュレーション＋バランス契約テスト

### 6.1 シミュレータ拡張
- `simulateRun` の params に `pressure: number`（既定0）と `meta?: MetaState`（既定 fresh `createMetaState()`）を追加。
- 内部で `applyPressureToDifficulty(difficulty, pressure)` を適用してから既存ループを回す。pickEvent 呼び出しに `pressure` と `meta` を伝播（亡霊ゲート）。
- `pressure=0` かつ既定 meta のとき挙動は現状と完全一致。
- **亡霊の影響検証**: 既定の fresh meta では亡霊は「発見済み」ゲートで出現しないため、圧の単調性は主にエスカレーションノブを測る。亡霊込みの難易度は、全先人発見済みの `meta`（`createMetaState({ fragments: 全断片ID })`）を渡す変種テストで検証する。

### 6.2 バランス契約（`balance-contract.test.ts` に追記）
- **圧0回帰**: `pressure=0` の生還率が Phase 2 実測と一致（既存バンドの再利用）。
- **圧の単調性（主軸）**: 各難易度で `survival(pressure=0) >= survival(pressure=3) >= survival(pressure=6)`（careful・random 双方、最下層は `>=`）。
- **圧バンド**: 例 careful Normal 圧6 ≤ 0.45 等（緩め、実装時に較正）。
- N=200 seeded 決定論。`Date.now`/`Math.random` 不使用。

## 7. アーキテクチャ・ファイル構成

### 7.1 新規（domain/純粋・events）
| ファイル | 役割 |
|---|---|
| `domain/constants/escalation-defs.ts` | 圧あたり増分と `PRESSURE_MAX` |
| `domain/services/pressure-service.ts` | `escalationFromPressure`／`applyPressureToDifficulty`／`maxSelectablePressure` |
| `events/revenant-events.ts` | 亡霊5イベント |

### 7.2 改修
| ファイル | 変更 |
|---|---|
| `domain/models/meta-state.ts` | `maxPressureCleared`/`revenantsDefeated` 追加 |
| `domain/constants/event-type-defs.ts` | `revenant` 種別 |
| `domain/events/game-event.ts`＋`events/event-utils.ts` | `minPressure?` 追加、`pickEvent` に `pressure` 引数 |
| `domain/events/event-selector.ts` | `pickEvent` 同期 |
| `presentation/hooks/use-game-orchestrator.ts` | reducer に `pressure`/`revenantsThisRun`、`SELECT_DIFFICULTY` が圧を運ぶ |
| `presentation/hooks/use-game-actions.ts` | selectDiff で実効難易度／handleChoice で revenant 集計／escape で KP・maxPressure・revenantsDefeated／pickEvent に圧 |
| `presentation/LabyrinthEchoGame.tsx` | pickEvent 呼び出しに圧 |
| `components/DiffSelectScreen.tsx`＋`GameComponents.tsx` | 残響圧セレクタ＋プレビュー |
| `components/CollectionScreens.tsx`／`TitleScreen.tsx`／`ArchiveScreen.tsx` | 最高圧表示・亡霊バッジ |
| `domain/constants/title-defs.ts` | 称号3種 |
| `simulation/run-simulator.ts` | `pressure` 引数 |
| `README.md` | Phase 3 追記 |

### 7.3 依存方向
- `pressure-service`/`escalation-defs` は domain（外部依存なし）。
- `revenant-events` は feature root events（domain/constants・models を参照、Phase 1 の echo-events と同位置）。
- `selectDiff` のシグネチャは `(d: DifficultyDef, pressure: number)` に拡張（DiffSelectScreen・GameHandlers 連動）。

## 8. リスクと対処
- **シグネチャ波及**: 圧を実効難易度に畳む設計で戦闘系の改修を回避。波及は selectDiff（圧引数）・pickEvent（圧引数）・reducer（圧フィールド）に限定。
- **圧0回帰**: escalation 全項目0かつ minPressure イベント非出現を契約テストで保証。Phase 2 契約が圧0ガード。
- **バランス未達**: 圧の単調性を主軸に、バンドは緩め。較正は escalation-defs の増分で行い、難易度設計値（Phase 2）は不変。
- **亡霊の過剰出現**: 二重ゲート（圧＋発見済み）＋フロア限定で同時出現数を抑制。通常イベント枠を1つ占有（Phase 1 echo と同様）。

## 9. 受け入れ基準（Phase 3 完了条件）
- [ ] `maxPressureCleared`/`revenantsDefeated` が `MetaState` に追加され旧セーブが自動補完される。
- [ ] 残響圧を難易度選択画面で 0..echoDepth で選べ、実効難易度に正しく反映される。
- [ ] 圧0で Phase 2 と完全一致（回帰なし）、圧>0 で生還率が単調減少する（契約テスト）。
- [ ] 亡霊5件が圧＋発見済みゲートで出現し、撃破で `revenant:` フラグ・revenantsDefeated・revenantsThisRun が機能する。
- [ ] 生還時に KP 圧ボーナスと maxPressureCleared 更新が行われる。
- [ ] 称号3種・最高圧表示・亡霊バッジが機能する。
- [ ] `npm run ci`（lint:ci / typecheck / test / build）が通る。
