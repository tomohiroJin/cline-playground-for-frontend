# 迷宮の残響 — 第6階層＋真エンディング（最終章・Phase 5）設計書

- 作成日: 2026-06-28
- 対象ゲーム: `src/features/labyrinth-echo/`
- ステータス: 設計承認待ち → 実装計画（writing-plans）へ
- 前提: Phase 1（物語の背骨＋書庫, #135）・Phase 2（バランス, #136）・Phase 3（残響圧, #137）・Phase 4（残響継承, #138）マージ済。ロードマップ: memory `labyrinth-echo-narrative-roadmap` の最終フェーズ。

## 1. 背景と目的

物語強化ロードマップの締めくくり。4層の真相（truth_1〜4）と先人5名の物語を回収する「第6階層」を条件付きで解禁し、**真エンディング**で重厚な締めくくりとクリア後の到達感を出す。truth_4「始まりの願い」(depthGate 6) は "――まだ、終わりではない" で終わり、本フェーズへの布石になっている。

### 1.1 決定済みの方針（ブレインストーミング）
- **解禁条件**: `echoDepth ≥ 6`（truth_4 開示済み）**かつ** 全先人の断片収集済み（書庫完成）。5階クリア（脱出）時に分岐が出現。
- **第6階層の中身**: 対話・選択のクライマックス（戦闘なし）。固定3ビート（集う残響→始まりの探索者→最後の決断）。最終ビートのみ分岐。
- **真エンディング**: 2基本（継承者／解放者）＋ 高ステーク到達（残響圧≥5 または 起源の継承 lg_first）で「真・」昇格。計4種。
- **クリア後の到達感**: 称号・書庫の「真相到達」印・タイトル画面の踏破微光・`meta.endings` 記録。
- **画像**: 新規画像なしで完成（既存背景の再利用＋icon/gradient/CSS）。後から `.webp` を置けば無改修で高級化できる**任意フック**を予約。
- **不変**: 第6階層は戦闘なし → `MAX_FLOOR:5` の戦闘・simulator・バランス契約・難易度/escalation は一切変更しない。

## 2. スコープ

### 2.1 やること
- 真ルート解禁判定とフロー分岐（§3）。
- 第6階層の固定ビート（§4）。
- 真エンディング4種＋判定（§5）。
- クリア後の到達感（称号・書庫・タイトル演出・meta 記録）（§6）。
- 画像フォールバックと任意フック（§7）。

### 2.2 やらないこと（スコープ外）
- `MAX_FLOOR` 拡張・新戦闘システム・simulator/バランス契約/難易度/escalation の改変。
- 新規画像アセットの制作（任意フックの予約のみ）。
- 第7階層以降・追加の周回メカ。
- 個別イベント（既存163件）・断片・難易度・レガシー定義の改変。

## 3. 真ルート解禁とフロー

### 3.1 解禁判定（純粋関数）
- `isTrueRouteUnlocked(meta: MetaState): boolean` =
  `meta.echoDepth >= TRUE_ROUTE_DEPTH_GATE(=6)` **かつ** 全先人が `isPredecessorComplete(predId, meta.fragments)` を満たす。
- 過去の生還で自然に満たされる条件。「物語を理解しきった者」だけが解禁。

### 3.2 フロー（既存の脱出＝勝利を保ったまま分岐）
- 現状: 5階の最終ステップをクリア → `phase: 'victory'`（`determineEnding` で通常エンディング）。
- 変更: 5階クリアの瞬間（ResultScreen の脱出確定時）に `isTrueRouteUnlocked(meta)` なら、**「さらに深く潜る／ここで脱出する」** を提示。
  - 「脱出する」→ 従来通り `victory`（通常エンディング）。回帰経路。
  - 「さらに深く」→ 新フェーズ `finale`（第6階層）へ（`ENTER_FINALE`）。
- 第6階層は**戦闘なし**（HP/精神ドレインなし）。真ENDに到達すると脱出扱いの勝利（`escapes`+1・`echoDepth`+1・ending 記録は既存 `SET_VICTORY` 経路）。

## 4. 第6階層の中身（固定ビート）

### 4.1 ビート構成（`FINALE_BEATS`）
固定シーケンス（ランダムプールではない）。専用 `FinaleScreen` で `finaleStep` を進行。

| # | id | タイトル | 内容（要旨） | 選択 |
|---|---|---|---|---|
| 1 | `fin_gather` | 集う残響 | 5階より下、降りた先で先人5名の残響が集う。写本師リアン・双子・地図屋ガレン・守人エルナ、始まりの探索者の気配。4層の真相を束ねる回想。 | 「記憶を受け止める」→進む |
| 2 | `fin_confront` | 始まりの探索者 | 彼の残響との対話。迷宮は彼の「忘れたくない」願いから生まれた（truth_4 回収）。なぜ呼び、なぜ還したのか。 | 「問い返す」→進む |
| 3 | `fin_decide` | 最後の決断 | 願いをどうするか。 | 「願いを継ぐ」→ inherit ／「願いを断つ」→ sever |

- ビート1・2は線形（単一の前進選択）、最終ビート3のみ分岐。
- 戦闘なし。脱出時の player 状態は真ENDの演出フレーバーに利用可（必須ではない）。

### 4.2 型（`domain/models/finale.ts`）
```ts
export type FinaleDecision = 'inherit' | 'sever';
export interface FinaleChoice {
  readonly label: string;
  /** 最終ビートのみ decision を持つ。非分岐ビートは undefined（前進） */
  readonly decision?: FinaleDecision;
}
export interface FinaleBeat {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly choices: readonly FinaleChoice[];
}
```

## 5. 真エンディング（2基本 × 真・昇格）

### 5.1 判定（`determineTrueEnding`）
```ts
const promoted = pressure >= TRUE_ENDING_PROMOTE_PRESSURE(=5) || legacyId === 'lg_first';
inherit → promoted ? te_inheritor_true : te_inheritor
sever   → promoted ? te_liberator_true : te_liberator
```
- 昇格条件＝残響圧 ≥ 5 または 起源の継承（lg_first）で到達。Phase 3（圧）／Phase 4（起源）の最高ステークが終章で報われる。
- 通常の `determineEnding`（player 状態スキャン）とは**別経路**。決断という明示入力から直接引く。

### 5.2 真END定義（`TRUE_ENDINGS`、4種）
既存 `EndingDef` 型を再利用（`cond: () => false` で通常判定スキャンに載らない）。別ファイル `true-ending-defs.ts`。

| id | 名称 | 要旨 | bonusKp |
|---|---|---|---|
| `te_inheritor` | 継承者 | 願いを継ぎ、迷宮の記憶の番人となる。先人たちの物語はお前の中で生き続ける。 | 大 |
| `te_liberator` | 解放者 | 願いを断ち、囚われた残響を解き放つ。迷宮は静かに崩れ、先人たちは安らぐ。 | 大 |
| `te_inheritor_true` | 真・継承者 | （昇格）継承の意味が一段深まる特別な締めの一文。 | 特大 |
| `te_liberator_true` | 真・解放者 | （昇格）解放の代償と祝福を描く特別な締めの一文。 | 特大 |

- 真END到達は既存 `SET_VICTORY` に流し、勝利/エンディング画面をそのまま再利用（色/グラデーション/アイコンで差別化、画像は任意フック §7）。

## 6. クリア後の到達感

### 6.1 称号
- 真ENDごとに称号を解禁（継承者／解放者／真・継承者／真・解放者）。`title-defs` に4つ追加。解禁条件＝`meta.endings` に対応 id を含む。`activeTitle` に設定可。

### 6.2 残響書庫の「真相到達」印
- `ArchiveScreen` に、`hasReachedTrueEnding(meta)` のとき truth_4 の下へ「真相到達 ✦」を表示（到達した真END名も併記）。

### 6.3 タイトル画面の踏破演出
- 真END到達済みのとき、タイトル画面に微光（踏破の印）を重ねる（CSS/粒子のみ・画像不要）。

### 6.4 meta 記録（新フィールド不要）
- 既存 `meta.endings: readonly string[]` に真END id を追加するだけ。
- `hasReachedTrueEnding(meta): boolean` = `endings` に `te_` 接頭の id を含む。書庫・タイトル演出・称号を駆動。

## 7. 画像フォールバックと任意フック

- **第6階層背景**: `bg5` を暗転＋粒子強化で再利用。`LE_BG_IMAGES[6]` を予約キーとし、`le_bg_6_*` があれば優先・無ければ `bg5` フォールバック。
- **真END画面**: `icon`＋`gradient`＋CSS で4種差別化。`LE_IMAGES.endings.te_*` を予約キーとし、画像があれば優先・無ければ絵文字＋グラデ。
- 既存 `getSceneImage` の「該当なし→undefined→汎用」と同じ流儀。後から `.webp` を置くだけで無改修高級化。

## 8. アーキテクチャ・ファイル構成

### 8.1 新規（domain/純粋）
| ファイル | 役割 |
|---|---|
| `domain/models/finale.ts` | `FinaleBeat`/`FinaleChoice`/`FinaleDecision` 型 |
| `domain/constants/finale-defs.ts` | `FINALE_BEATS`（3ビート） |
| `domain/constants/true-ending-defs.ts` | `TRUE_ENDINGS`（4種）＋`TRUE_ENDING_PROMOTE_PRESSURE` |
| `domain/services/finale-service.ts` | `isTrueRouteUnlocked`／`determineTrueEnding`／`hasReachedTrueEnding`（＋`TRUE_ROUTE_DEPTH_GATE`） |

### 8.2 新規（UI）
| ファイル | 役割 |
|---|---|
| `presentation/components/screens/FinaleScreen.tsx` | ビート描画・進行・最終決断 |

### 8.3 改修
| ファイル | 変更 |
|---|---|
| `presentation/hooks/use-game-orchestrator.ts` | phase `finale`、state `finaleStep`、`ENTER_FINALE`/`ADVANCE_FINALE`/`DECIDE_FINALE` |
| `presentation/LabyrinthEchoGame.tsx` | 「さらに深く」分岐・FinaleScreen 配線・pressure/legacyId を真END判定へ |
| `presentation/components/GameRouter.tsx` | `finale` フェーズ描画・分岐伝播 |
| `presentation/components/screens/ResultScreen.tsx` | 5階クリア時の解禁分岐提示 |
| `components/ArchiveScreen.tsx` | 真相到達印 |
| `components/`（TitleScreen） | 踏破微光 |
| `images.ts` | `LE_BG_IMAGES[6]` フォールバック＋`le_ending_te_*` 任意フック |
| `README.md` | Phase 5 追記 |

### 8.4 依存方向
- `finale-defs`/`true-ending-defs`/`finale-service` は domain（外部依存なし。`isPredecessorComplete`/`PREDECESSORS` は同 domain）。
- `determineTrueEnding` は純粋（decision/pressure/legacyId → EndingDef）。

## 9. テスト方針（TDD）
- **finale-service**: `isTrueRouteUnlocked`（echoDepth≥6 かつ全断片収集／境界: depth5・断片欠落で false）、`determineTrueEnding`（継ぐ/断つ × 昇格(圧≥5 or lg_first)/非昇格 の4通り）、`hasReachedTrueEnding`。
- **finale-defs / true-ending-defs 契約**: 3ビート・最終ビートに2決断選択・他ビートは非分岐／真END4種・id一意 `te_*`・`cond:()=>false`。
- **reducer**: `ENTER_FINALE`→phase/finaleStep、`ADVANCE_FINALE` 進行、決断→`SET_VICTORY` に真END、finaleStep リセット。
- **FinaleScreen**: ビート描画・進行・最終決断ハンドラ。
- **ResultScreen**: 解禁時のみ「さらに深く」表示、未解禁で従来 victory。
- **ArchiveScreen / TitleScreen**: 真相到達印・踏破微光の表示条件。
- **回帰**: 未解禁で従来の脱出→victory が完全一致。simulator・バランス契約・難易度/escalation は不変。

## 10. リスクと対処
- **戦闘/バランス波及**: 第6階層を戦闘なしの物語分岐に限定し、`MAX_FLOOR:5`・simulator・契約を不変に保つ。回帰は既存 victory/ending テストで担保。
- **解禁条件の到達性**: echoDepth≥6＋全断片は終盤到達だが、過去の生還で自然充足。境界テストで `isTrueRouteUnlocked` を保護。
- **真END誤判定**: `determineTrueEnding` を決断の明示入力から直接引き、player 状態スキャンと分離して誤判定を排除。
- **画像欠如**: 既存 undefined フォールバック流儀で画像なしでも成立。任意フックで後追加可能。

## 11. 受け入れ基準（Phase 5 完了条件）
- [ ] echoDepth≥6 かつ全断片収集で、5階クリア時に「さらに深く」分岐が出現する。
- [ ] 第6階層の3ビートを進行でき、最終決断で真ENDが分岐する（戦闘なし）。
- [ ] 真END4種が決断×（圧≥5 or 起源）で正しく決まり、`SET_VICTORY` 経由で表示・`meta.endings` に記録される。
- [ ] 真END称号・書庫の「真相到達」印・タイトル踏破微光が機能する。
- [ ] 未解禁で従来の脱出→victory が完全一致（回帰なし）。simulator・バランス契約は不変。
- [ ] 画像なしで成立し、任意フック（`le_bg_6_*`／`le_ending_te_*`）が後追加可能。
- [ ] `npm run ci`（lint:ci / typecheck / test / build）が通る。
