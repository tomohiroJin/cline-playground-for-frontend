# 迷宮の残響 — 残響継承（先人レガシーの排他選択ビルド・Phase 4）設計書

- 作成日: 2026-06-28
- 対象ゲーム: `src/features/labyrinth-echo/`
- ステータス: 設計承認待ち → 実装計画（writing-plans）へ
- 前提: Phase 1（物語の背骨＋残響書庫, #135）・Phase 2（バランス再調整, #136）・Phase 3（NG+残響エスカレーション, #137）マージ済。ロードマップ: memory `labyrinth-echo-narrative-roadmap`

## 1. 背景と目的

ユーザーの不満4点のうち「**自分が強く変わる／組み合わせ発見の面白さ**」を実現する。Phase 1 で集めた先人の物語（断片）に**メカニクス上の報酬**を与え、先人の生き様を**継承（レガシー）**として周回ビルドに昇華する。毎回違うビルド／プレイスタイルで挑め、難易度×残響圧×既存アンロックとの掛け合わせで「組み合わせ発見」を生む。

### 1.1 決定済みの方針（ブレインストーミング）
- **解禁と選択**: 先人の断片を**全収集**（書庫でアーク完成）するとその先人のレガシーが解禁。run 開始時に解禁済みから**1つを排他選択**（「継承なし」も可）。
- **効果の質**: **トレードオフ型**（強い上振れ＋明確な下振れ）。先人の生き様を反映し、別々のプレイスタイルを促す。
- **表現**: すべて**既存 FxState キー**で表現（負の加算・乗算<1/>1・healMult<1）。`combat-service`・`FxState` は無改造。
- **適用**: レガシーを `Partial<FxState>` デルタとし、run 開始で `baseFx` にマージして実効 fx を作る（Phase 3 の「実効難易度」と同じ境界吸収パターン）。
- **検証**: Phase 3 simulator に legacy 対応を足し、各レガシーで単調性・健全帯・トレードオフが効くことを契約テスト化。

## 2. スコープ

### 2.1 やること
- レガシーシステム（型・データ・サービス・run 状態）（§3）。
- 5つのトレードオフ・レガシー（§4）。
- UI（難易度画面の継承セレクタ・書庫連携・実行中バッジ）（§5）。
- legacy 対応 simulator＋バランス契約（単調性・健全帯・トレードオフ）（§6）。

### 2.2 やらないこと（スコープ外）
- 継承の永続解禁メタフィールド（`isPredecessorComplete(fragments)` から導出）。
- レガシーのレベル／強化／成長。
- 複数継承の同時装備（**排他選択**＝1 run 1レガシー）。
- 個別イベント（163件）・断片データ・難易度設計値（Phase 2）・escalation 係数（Phase 3）の改変。
- Phase 5（第6階層・真エンディング）。

## 3. 残響継承システム

### 3.1 解禁と選択
- **解禁**: `isPredecessorComplete(predId, meta.fragments)`（先人の全断片収集）で、その先人のレガシーが解禁。新メタフィールド不要（fragments から導出）。
- **選択**: run 開始時に解禁済みレガシーから1つを排他選択（既定「継承なし」）。run 状態 `legacyId: string | null` を reducer に追加。
- `SELECT_DIFFICULTY` アクションが `legacyId` を運ぶ。

### 3.2 効果の適用（Fx デルタのマージ）
**設計の要**: 戦闘系のシグネチャ・FxState を変えず、境界でレガシーを実効 fx に畳む。

- `EchoLegacy` 型（`domain/models/echo.ts`）:
  ```ts
  interface EchoLegacy {
    readonly id: string;            // 例 "lg_lian"
    readonly predecessorId: string; // 例 "p_lian"
    readonly name: string;
    readonly icon: string;
    readonly color: string;
    readonly upside: string;        // 上振れの説明
    readonly downside: string;      // 下振れの説明
    readonly fx: Partial<FxState>;  // fx デルタ
  }
  ```
- `mergeLegacyIntoFx(baseFx: FxState, legacy: EchoLegacy | null): FxState`:
  - legacy が null なら baseFx をそのまま返す（回帰）。
  - 加算キー（hpBonus/mentalBonus/infoBonus）は加算（負値で下振れ）。
  - 乗算キー（infoMult/healMult/mnReduce/hpReduce）は乗算（<1で軽減・>1で増悪）。
  - ブールキー（dangerSense/bleedReduce/drainImmune/curseImmune/secondLife/chainBoost/negotiator/mentalSense）は OR。
- run 開始（selectDiff）で `activeFx = mergeLegacyIntoFx(baseFx, legacy)` を計算し、`createNewPlayer(eff, activeFx)` と run 全体の fx（useGameActions の fx）に流す。
- `combat-service`・`FxState` 定義は無改造。下振れは負の加算・乗算>1・healMult<1 で表現。

### 3.3 乗算キーの既存挙動（combat-service）
- 被ダメ: hp<0 のとき `hp = round(hp × hpReduce)`、mn<0 のとき `mn = round(mn × mnReduce)`。<1で軽減・>1で増悪。
- 回復: hp>0 のとき `hp = round(hp × healMult)`。<1で鈍化。
- 情報: inf>0 のとき `inf = round(inf × infoMult)`。

## 4. 5つのトレードオフ・レガシー

| id | 継承（先人） | 上振れ Fx | 下振れ Fx | プレイ個性 |
|---|---|---|---|---|
| lg_lian | 記録者の継承（リアン / p_lian） | infoBonus +8, infoMult ×1.3 | healMult ×0.55, hpReduce ×1.2 | 情報ゲートを次々開ける知識特化。回復鈍く打たれ弱い |
| lg_twins | 絆の継承（双子 / p_twins） | secondLife true | hpBonus -10, mentalBonus -8 | 攻めて倒れても一度蘇る。器が小さく綱渡り |
| lg_galen | 解析者の継承（ガレン / p_galen） | dangerSense true, mentalSense true, negotiator true | mnReduce ×1.3 | 危機・精神・遭遇の判定が緩む先読み型。精神が脆い |
| lg_elna | 守人の継承（エルナ / p_elna） | drainImmune true, bleedReduce true, hpReduce ×0.82, mnReduce ×0.82 | hpBonus -14, mentalBonus -12 | 侵蝕無効＋被ダメ軽減の持久戦型。器が低くミスに弱い |
| lg_first | 起源の継承（始まりの探索者 / p_first） | hpBonus +10, mentalBonus +10, infoBonus +6, healMult ×1.25, drainImmune true | hpReduce ×1.4, mnReduce ×1.4 | 全ステ強化＋侵蝕無効の最強格。被ダメ激増＝ガラスの大砲。究極の博打（終盤解禁） |

すべて既存 FxState キーで表現。数値は実装時にバランス契約（§6）で較正しうる（legacy の fx デルタのみ調整、難易度設計値・escalation は不変）。

## 5. UI

### 5.1 難易度選択画面の継承セレクタ（Phase 3 の圧セレクタと同パターン）
- `DiffSelectScreen` に継承セレクタ行を追加。**解禁済みレガシーが1つ以上あるときのみ表示**。
- チップ列: `継承なし`（既定）＋ 解禁済みレガシーごとに `アイコン＋名前`。選択中レガシーの**上振れ/下振れを1行で表示**（上振れ=緑系・下振れ=赤系）。
- 難易度カードクリックで `selectDiff(d, pressure, legacyId)` を呼ぶ。**新フェーズ・pending 状態は作らない**（1画面・1 dispatch）。
- レガシー選択で各 DiffCard の HP/精神プレビューが実効値（`mergeLegacyIntoFx` 反映）に追従。

### 5.2 残響書庫（ArchiveScreen）連携
- 完成した先人カード（全断片収集）に「**継承解禁：〈レガシー名〉**」と上振れ/下振れの要約を表示。
- 物語ループ: 書庫で先人を理解しきる → その生き様がレガシーとして継承可能になる、を一画面で繋ぐ。

### 5.3 実行中の継承バッジ（軽量）
- フロア紹介画面に**現在の継承バッジ**（アイコン＋名前）を小さく表示。過剰演出はしない。

## 6. シミュレーション＋バランス契約

### 6.1 simulator 拡張
- `simulateRun` の params に `legacy?: EchoLegacy | null`（既定 null）を追加。
- 内部で `fx = mergeLegacyIntoFx(params.fx, legacy)` を適用してから既存ループ。
- `legacy=null` のとき挙動は現状と完全一致（回帰）。

### 6.2 バランス契約（`balance-contract.test.ts` に追記）
- **各レガシーで難易度の単調性**: careful で easy>normal>hard>abyss（圧0）。
- **健全帯**: 各レガシーの careful Normal 生還率が 0.40–0.95（どのレガシーも自明化>0.95 / 破綻<0.40 しない）。
- **トレードオフが効く証跡**: 起源（lg_first, 被ダメ+40%）は高圧（例 圧3）で「継承なし」よりも careful 生還率が**下がる**（下振れが効く）。少なくとも全レガシーが「継承なし」以上ではない（下振れがどこかで効く）。
- N=200 seeded 決定論。`Date.now`/`Math.random` 不使用。
- 較正は **legacy の fx デルタのみ**。難易度設計値（Phase 2）・escalation 係数（Phase 3）は不変。

### 6.3 simulator の限界（明記）
生還シミュレータは hp+mn を最適化する careful ポリシーのため、**情報特化（記録者）の強みは survival に現れにくい**。契約は「安全性・単調性・トレードオフが効く」を測り、ビルド体感（情報ラッシュの楽しさ等）は対象外。

## 7. アーキテクチャ・ファイル構成

### 7.1 新規（domain/純粋）
| ファイル | 役割 |
|---|---|
| `domain/models/echo.ts`（改修） | `EchoLegacy` 型 |
| `domain/constants/legacy-defs.ts` | レガシー5種データ |
| `domain/services/legacy-service.ts` | `mergeLegacyIntoFx`／`unlockedLegacies`／`getLegacyById`／`legacyForPredecessor` |

### 7.2 改修
| ファイル | 変更 |
|---|---|
| `presentation/hooks/use-game-orchestrator.ts` | reducer に `legacyId`、`SELECT_DIFFICULTY` が運ぶ |
| `presentation/LabyrinthEchoGame.tsx` | `selectDiff(d,pressure,legacyId)`、`activeFx` を run fx に流す |
| `presentation/components/GameRouter.tsx` | `GameHandlers.selectDiff` 型拡張、継承バッジ伝播 |
| `components/DiffSelectScreen.tsx` | 継承セレクタ＋プレビュー |
| `components/ArchiveScreen.tsx` | 完成先人に継承解禁表示 |
| `components/FloorIntroScreen.tsx` | 実行中の継承バッジ |
| `simulation/run-simulator.ts` | `legacy?` 引数 |
| `README.md` | Phase 4 追記 |

### 7.3 依存方向
- `legacy-defs`/`legacy-service` は domain（外部依存なし。`isPredecessorComplete` は同 domain/services）。
- `selectDiff` のシグネチャは `(d: DifficultyDef, pressure: number, legacyId: string | null)` に拡張（DiffSelectScreen・GameHandlers 連動）。

## 8. リスクと対処
- **シグネチャ波及**: レガシーを実効 fx に畳む設計で戦闘系の改修を回避。波及は selectDiff（legacyId 引数）・reducer（legacyId フィールド）・activeFx 導出に限定。
- **継承なし回帰**: `mergeLegacyIntoFx(fx, null)` が fx を不変返し、解禁0で継承セレクタ非表示。Phase 3 契約が継承なしガード。
- **支配的レガシー**: トレードオフ＋健全帯/単調性の契約で監視。較正は fx デルタのみ（難易度・escalation 不変）。
- **simulator の build-feel 非対応**: §6.3 に明記。survival 安全性・単調性・トレードオフを測る。

## 9. 受け入れ基準（Phase 4 完了条件）
- [ ] 先人の全断片収集でその先人のレガシーが解禁される（`isPredecessorComplete` 由来）。
- [ ] run 開始時に解禁済みレガシーを1つ排他選択でき（継承なしも可）、実効 fx に反映される。
- [ ] 継承なしで Phase 3 と完全一致（回帰なし）。
- [ ] 5レガシーが単調性・健全帯（0.40–0.95）を満たし、下振れが効く（起源は高圧で生還率が下がる）。
- [ ] 難易度画面の継承セレクタ・書庫の継承解禁表示・実行中バッジが機能する。
- [ ] `npm run ci`（lint:ci / typecheck / test / build）が通る。
