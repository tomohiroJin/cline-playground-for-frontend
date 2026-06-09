# プロダクト全体 アーキテクチャレビュー（2026-06-09）

- **対象**: puzzle-game（React 19 + TypeScript + Jotai / 約 132,000 行 / 1,919 ファイル / 13 ゲーム）
- **ブランチ**: `chore/full-product-review-20260609`
- **方式**: 18 ユニット（共有コア 5 + feature 13）を並列レビュー → 各指摘を敵対的検証 → 確定分を統合
- **確定指摘数**: 21 件（High 3 / Medium 13 / Low 5）＋ 検証未完了の補足多数

> 検証メモ: 敵対的検証フェーズはサーバー側のレート制限で 2 回とも一部が失敗したため、
> (1) 2 回の実行で確定した指摘の**和集合 17 件**、(2) その後に**手動で直接検証した 4 件**を「確定」とした。
> レビュアーが検出したが検証を完了できなかった項目は末尾に「検証未完了」として列挙する。

---

## 総評

機械的にチェックできる規律は非常に高い。

| 項目 | 結果 |
|---|---|
| `dangerouslySetInnerHTML` | 0 件（JSON-LD も `textContent` 経由で安全） |
| `any` 型（非テスト） | 0 件 |
| domain → infra/presentation 参照 | なし |
| feature 間の直接参照 | なし |
| RAF/timer/listener の解放 | 大半の feature で適切に cleanup |

一方で、**プロダクト全体を貫く 1 つの構造問題**が浮かび上がった。

---

## 🔴 最重要・横断課題：「使われない並行アーキテクチャ層」アンチパターン

CLAUDE.md が要求する Clean Architecture 層（`domain/application/infrastructure/presentation`）が
**テストまで完備して存在するのに、実際に動くゲームはその層を使わず、ロジックをフラットファイル/フックにインライン再実装している**
——という二重実装＋死蔵コードの問題が **8 feature ＋ 共有コア**で独立検出された。

| Feature | 実態 | 検証 |
|---|---|---|
| `agile-quiz-sugoroku` | `application` ユースケース群・`AchievementObserver`・`contracts/` が本番未呼び出し。実プレイは `hooks/` | ✅ 確定（複数） |
| `labyrinth-of-shadows` | `domain` の maze 生成/モデルが死蔵、root の `maze-service.ts` が正。domain→root の逆流 | ✅ 確定（複数） |
| `non-brake-descent` | 正統な `application/game-loop`・port 層がテスト付きで存在も、稼働中の `use-game-engine.ts` がループを丸ごとインライン再実装 | ⚠️ 検証未完了 |
| `keys-and-arms` | `domain/`（1,231 行）がテストからのみ参照の孤立層。本番は `stages/*-logic.ts` | ⚠️ 検証未完了 |
| `deep-sea-interceptor` | `domain/application/...` が root フラットファイルの re-export シム。依存方向が逆転 | ⚠️ 検証未完了 |
| `air-hockey` | `domain/application/infrastructure` が本番から分離されたテスト専用の並行実装 | ⚠️ 検証未完了 |
| `falldown-shooter` | `domain/application/infrastructure` が実ゲームから未参照、flat 群と二重実装 | ⚠️ 検証未完了 |
| `labyrinth-echo` | 正しい `domain/application` を `events/event-utils.ts` の legacy 経路が迂回し、自動解放ロジックを誤再実装 | ⚠️ 検証未完了 |

**影響**: DRY 違反 / DbC 不発 / テストが「動かない側」を検証して本番は無保護 / CLAUDE.md「ドメインは domain/ に集約」「依存方向 外→内」の崩壊。

**推奨**: feature ごとに「Clean Architecture 層を正にしてフックを薄いアダプタへ寄せる」か「現実装を正にして未使用層を削除」のいずれかへ収斂。中途半端な二重維持が最も危険。

---

## ✅ 確定指摘（21 件）

### High（3 件）

**H-1. `puzzle_records` キーに 2 系統のストレージ実装が並存し読み書きで別実装を混用**
`src/infrastructure/storage/puzzle-records-store.ts` ＋ `src/utils/storage/puzzleRecords.ts`
`PuzzlePage.tsx` が書き込みはポート実装、読み取りは旧 utils。2 つの `recordScore` のベスト判定ロジックが実際に乖離（utils はクリア毎更新、ポートは `isBestScore` 時のみ）。移行途中の二重維持で single source of truth が破れている。書き込みパスは一本化済みのため即データ破壊ではなく将来リスク。

**H-2. `agile-quiz-sugoroku`：application ユースケース群が本番未呼び出しで死蔵（hooks 側に同等ロジック再実装）**
`src/features/agile-quiz-sugoroku/application/answer-question.ts:66-146`（重複先 `hooks/useGameReducer.ts:201-271`）
回答評価・負債計算・タグ統計・不正解記録が application と hooks に二重存在。application 側は production から到達不能。片側修正事故を誘発する重大 DRY 違反。

**H-3. `agile-quiz-sugoroku`：チャレンジモードで全問消化クリア時にハイスコアが保存されない**
`src/features/agile-quiz-sugoroku/hooks/useChallenge.ts:79-81, 110-116`
`saveHighScore` は不正解分岐のみ。全問正解で問題枯渇 → ゲームオーバーになると保存されず、最高成績が記録されない。問題枯渇分岐でも `saveHighScore(correctCount)` を呼ぶべき。

### Medium（13 件）

**M-1. `buildRecordScore` の非ベスト分岐が改善された time/moves を取りこぼす**
`src/application/ports/storage-port.ts:60-73` — `isBestScore` は score のみ判定。スコア劣後でも time/moves が改善した再クリアで `bestTime`/`bestMoves` が更新されない。`bestTime` は `ClearHistoryList.tsx:73` で表示されるため実害あり。

**M-2. インフラ層（storage/timer）にテストが 0 件**
`src/infrastructure/{storage,timer}/`（4 ファイル）— `buildRecordScore`・`readLocalStorage` フォールバック・`BrowserTimer` 状態遷移はビジネスロジックなのに無テスト。CLAUDE.md「ビジネスロジック 90%+」「テストなしマージ禁止」違反。

**M-3. `extractImageName` が `shared/utils` と `utils/storage/clearHistory.ts` で完全重複**
`src/shared/utils/image-utils.ts:11-19` — `storage-utils.ts` が「shared へ移動済み」と宣言しているのに `clearHistory.ts` に独立実装が残存（しかも未 import の孤立コード）。

**M-4. 値オブジェクト `createGridPosition` がドメイン構築経路で未使用**
`src/domain/puzzle/aggregates/puzzle-board.ts:39, 45` — 整数・範囲・freeze を保証する `createGridPosition` があるのに、生 `{row, col}` リテラルで構築。DDD「値オブジェクトでプリミティブを包む／不変条件をコンストラクタで保証」が名目化。

**M-5. `agile-quiz-sugoroku`：`contracts/`（DbC アサーション群）が本番未発火**
`src/features/agile-quiz-sugoroku/contracts/quiz-contracts.ts:15-56` ほか — assert 群が定義・テストされているが、ドメイン処理の入口で一切呼ばれず契約が実行時検証されない。

**M-6. `agile-quiz-sugoroku`：実績 `study-100` が到達不能**
`src/features/agile-quiz-sugoroku/domain/achievement/achievement-checker.ts:113-121` — `check: () => false` でコメントは「useStudy 側で判定」とするが、`useStudy.ts` に累計回答数の永続化も解除呼び出しもない。デッドコンテンツ。

**M-7. `labyrinth-of-shadows`：domain の maze 生成/モデルが本番未使用の重複実装**
`src/features/labyrinth-of-shadows/domain/services/maze-generator.ts` — テストからのみ参照、本番は root の `maze-service.ts`。横断課題の個別事例。

**M-8. `labyrinth-of-shadows`：domain サービスが root の `maze-service` を import（依存方向逆流）**
`src/features/labyrinth-of-shadows/domain/services/enemy-strategy.ts:9` — 等価な純粋関数が `domain/models/maze.ts` にあるのに外側の非純粋モジュール（`Math.random` 直用）を参照。`../models/maze` へ差し替えで解消。

**M-9. `labyrinth-of-shadows`：テレポート敵のワープ先が注入 `randomFn` を無視し `Math.random` 依存**
`src/features/labyrinth-of-shadows/domain/services/enemy-strategy.ts:141-161` — DI で乱数源を受け取る設計なのにテレポート先だけ `Math.random` 由来で再現性が壊れる。

**M-10.（手動検証）`falldown-shooter`：エフェクトの `setTimeout` にクリーンアップ無し**
`src/features/falldown-shooter/components/Effects.tsx:13-15, 25-27` — `LaserEffectComponent`/`ExplosionEffectComponent` の `useEffect` 内 `setTimeout` に `clearTimeout` が無く、アンマウント時にタイマー解放漏れ＋未マウントへの `setState`。

**M-11.（手動検証）`risk-lcd`：`useGameEngine` のタイマー群にアンマウント時クリーンアップ無し**
`src/features/risk-lcd/hooks/useGameEngine.ts` — `timersRef`/`clearTimers` を持つが、`useEffect(() => () => clearTimers(), [])` が存在しない。ゲーム中離脱で `setArtTemp`/`showPop`/各フェーズタイマーが残存しリーク。

**M-12.（手動検証）`labyrinth-echo`：アンロック通知 `ToastContainer` が一度もマウントされない**
`src/features/labyrinth-echo/components/GameComponents.tsx:426`（定義のみ）— `<ToastContainer>` の使用箇所が皆無で、CustomEvent ベースのアンロック通知 UI が死んでいる。

**M-13.（手動検証）`picture-puzzle`：値オブジェクト `createDivision` が構築経路で未使用**
`src/domain/puzzle/aggregates/puzzle-board.ts:28-29`（`createPuzzleBoard(division: number)` が生 number ＋ `assert` のみ）— `createDivision` を通さず分割数の不変条件が実質未保証。M-4 と同型。

### Low（5 件）

**L-1. `ClearHistoryStorage` ポートに本番実装が無くモックのみ（宙に浮いた抽象）**
`src/application/ports/storage-port.ts:78-84` — infrastructure に実装アダプタ無し、消費 use-case も無し。クリア履歴は別系統 `utils/storage/clearHistory.ts` で完結。削除候補。

**L-2. 総クリア数も `total-clears-store`（ポート）と `utils` 関数で二重実装・混用**
`src/infrastructure/storage/total-clears-store.ts:11-31` — `PuzzlePage` が書き込みはポート、読み取りは utils `getTotalClears`。H-1 と同型。

**L-3. `usePuzzleTimer` が未使用デッドコードで `useGameFlow` のタイマーと重複**
`src/presentation/hooks/usePuzzleTimer.ts:10-27` — 実際に動くのは `useGameFlow:60-69` のインライン版のみ。

**L-4. `agile-quiz-sugoroku`：`AchievementObserver` が本番未使用（疎結合の仕組みが空回り）**
`src/features/agile-quiz-sugoroku/application/achievement-observer.ts:18-42` — 実際は Page が直接 `checkAchievements→saveUnlock→setNewAchievements`。

**L-5. `labyrinth-of-shadows`：敵がアイテムと同一セルにスポーンしうる（参照エイリアシング）**
`src/features/labyrinth-of-shadows/entity-factory.ts:38-64` — `farCells = cells.filter(...)` が同一セル参照を共有。`cells.splice` でアイテム化したセルが `farCells` に残り、その上に敵が出現。鍵の上に敵が乗るなど難易度バランスへ影響。

---

## ⚠️ 検証未完了（レビュアー検出済み・敵対的検証がレート制限で未完了）

要約所見ベースで信頼度は高いが、第2パス検証を完了できなかったもの。

- **`core-application`**: ports ファイルに具象ロジック（`buildRecordScore`）が同居し層責務が漏れている。
- **`falldown-shooter`**: `explosions` 配列が削除されず 1 セッション中に単調増加する状態蓄積。
- **`racing-game`**: キャンペーンの時間切れ/ゲームオーバー/メニュー離脱時の音停止。**手動確認の結果は判定保留**（クラシックモードは `SoundEngine.stopEngine()` を複数箇所で呼ぶが、`useCampaignGameLoop` は終了遷移で音停止を呼ばない。キャンペーン側に持続音があれば鳴りっぱなし）。
- **`ipne`**: domain 層に I/O（`console.warn`）と非決定的 `Math.random` デフォルト＋可変モジュール状態。`GAME_OVER` の `setTimeout` 未解放。
- **`non-brake-descent`**: ライブのゲームループがテスト皆無、`setState` updater 内で副作用を多発（React 契約違反）。
- **`deep-sea-interceptor`**: 層構造が re-export シムで依存方向が逆転。未使用設定/関数（`Config.limits`, `EnemyAI.shouldShoot`, `scoring-service` 重複）。
- **`keys-and-arms`**: `types`→`infrastructure` の参照逆転、`assert`/`clamp` の三重実装。
- **`air-hockey`**: 本番経路の音量設定にバリデーション欠如（NaN 流入で Web Audio が例外）。パックスタック検出カウンタの index ずれ。
- **`primal-path`**: `requireActiveBattle` 契約が本番から呼ばれない死んだ契約。`localStorage` セーブデータの無検証取り込み。`contracts.tsx` と `contracts/` の同名共存。
- **`agile-quiz-sugoroku`**: `application`→`infrastructure` の依存逸脱（ports が `infrastructure/` 配置、`application/ports/` 不在）。機械的スキャンで 5 箇所検出済み。ポートは純粋インターフェースのため実害は軽微だが構造逸脱。
- **`picture-puzzle`**: README 記載のファイル構成（`usePuzzle.ts` 等）が実在せずドキュメント陳腐化。

---

## 推奨アクション（優先度順）

1. **【最優先・設計判断】二重実装の収斂方針を feature ごとに決定**（横断課題）。`non-brake-descent`・`keys-and-arms`・`labyrinth-echo`（自動解放ロジック誤再実装あり）から着手。
2. **【バグ】実害バグの修正**: H-3（ハイスコア未保存）、M-12（通知機能死亡）、M-10/M-11（タイマーリーク）、M-9/L-5（labyrinth-of-shadows のスポーン/再現性）、M-6（到達不能実績）。
3. **【契約・データ】ストレージ系の単一真実源化**: H-1・M-1・M-2・L-2 をまとめて対応（読み取りをポートへ統一 → 旧 utils 削除 → インフラ層テスト追加）。
4. **【規律】DDD 値オブジェクトを構築経路で使う**: M-4・M-13（`createGridPosition`/`createDivision` を初期化パスに通し不変条件を実効化）。
5. **【整理】死蔵抽象の削除**: L-1・L-3・L-4・M-5（未発火 DbC）。
