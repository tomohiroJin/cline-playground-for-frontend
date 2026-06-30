# 迷宮の残響 — シミュレーション・レポート＆実験的テスト基盤 設計書

- 日付: 2026-06-29
- 対象: `src/features/labyrinth-echo`
- ブランチ: `feature/labyrinth-echo-sim-report`

## 1. 目的と背景

迷宮の残響（labyrinth-echo）はバランス＋物語強化（残響深度ロードマップ、全5フェーズ）を経て、
単発runの生還率カーブと周回キャリアの進行データが計測可能になっている。
本プロジェクトは、それらのシミュレーション結果を **目で見えるHTMLレポート** として出力し、
さらに **継承（レガシー）取得を含む多角的シミュレーション** と **不変条件による異常検出** を
恒久的なテスト基盤として整備する。

### 解決したい課題
- シミュレーション結果が CLI のテキスト出力にとどまり、俯瞰・比較・共有がしづらい。
- 真エンディング解禁までの周回数や、継承システムの取得タイミングが定量化されていない。
- 周回・継承を含むメタ進行で「変なバグ（負のHP、断片の二重収集、レガシーの不正解禁など）」が
  混入しても気づける仕組みがない。

## 2. スコープ

### やること
- 単一の自己完結HTMLレポートを CLI で生成（表・カード・inline SVG 棒グラフ、外部依存ゼロ）。
- 4軸のシミュレーション: ①単発run生還率カーブ ②周回（キャリア）進行 ③継承（レガシー）分析
  ④エンディング到達分布。
- 不変条件チェッカを実装し、(a) CIテスト（回帰ガード＋検出器自体のテスト）と
  (b) レポート警告欄の両方で使用。

### やらないこと（YAGNI）
- チャートライブラリ等の依存追加（inline SVG/div で描画）。
- ゲーム本体（プレイ画面・ビルド成果物）への機能追加。レポートは開発支援ツール。
- レポートHTMLの git 追跡（`reports/` は gitignore）。

## 3. アーキテクチャ

純粋な分析層とレポート生成層を分離し、ドメイン関数を流用して定数乖離を防ぐ。

```
src/features/labyrinth-echo/simulation/
├── run-simulator.ts          # 既存。fragmentsRead を恒久追加（+テスト）
├── career-simulator.ts       # 新規: 周回進行（純粋）。run-simulator＋
│                             #   incrementEchoDepth/selectSafetyNetFragment/
│                             #   isTrueRouteUnlocked/unlockedLegacies を流用
├── policies.ts               # 新規: CAREFUL/RANDOM/LORE を集約（run-simulatorから移設）
├── analysis.ts               # 新規: 集計（生還率行列・キャリア統計・レガシー分析・END分布）
│                             #   すべて plain data を返す純粋関数
├── invariants.ts             # 新規: 不変条件チェッカ。違反レコードの配列を返す
└── report/
    ├── report-data.ts        # 新規: 全シム実行→単一 ReportData に集約（シード固定）
    ├── render-html.ts        # 新規: ReportData→HTML文字列（インラインCSS/SVG、依存ゼロ）
    └── generate-report.ts    # 新規: CLIエントリ。reports/ にHTML出力しパス表示

src/features/labyrinth-echo/__tests__/simulation/
├── run-simulator.test.ts     # 既存を拡張（fragmentsRead）
├── career-simulator.test.ts  # 新規: 周回ロジック
├── invariants.test.ts        # 新規: 故意の不正データ検出＋実シムで違反ゼロ
└── analysis.test.ts          # 新規: 集計の正しさ
```

### 設計原則
- **分析と描画の分離**: `analysis.ts` は plain data を返す。同じ集計を Jest（数値アサート）と
  HTMLレンダリングが共有 → 「レポートは緑、CIは赤」の乖離を原理的に防ぐ。
- **副作用の隔離**: fs書き込みと日時生成は `generate-report.ts` のみ。`render-html.ts` は
  純粋関数 `ReportData → string`。ドメイン/分析層は時刻非依存（`Date.now()` は CLI で注入）。
- **再現性**: 全シムはシード固定。同じコード→同じレポートで差分比較が可能。
- **定数乖離の防止**: echoDepth上限・断片・レガシー解禁・難易度は本番ドメイン関数を流用。

### データフロー
```
domain(純粋) ← run-simulator ← career-simulator ← analysis ← report-data → render-html → file
                                              ↘ invariants ↗
```

## 4. レポートの中身（HTML構成）

1. **サマリーヘッダー** — 生成日時、総シム回数、不変条件違反の総数
   （0なら緑「✓ 異常なし」、>0なら赤バッジ）。
2. **① 単発run 生還率カーブ** — 難易度×残響圧（0〜6）のヒートマップ表＋
   careful/random 比較棒グラフ（戦略性の効きを可視化）。
3. **② 周回（キャリア）進行** — 条件別（easy/normal × careful/lorehunter）の
   「真END解禁まで総周回・脱出・死亡」表＋代表キャリア1本の周ごと depth/断片数推移グラフ。
4. **③ 継承（レガシー）分析** — (a) 取得タイミング: 代表キャリアで各先人が何周目に
   完収集→どのレガシーが解禁されるか (b) 各レガシー5種の生還率トレードオフ
   （圧0/圧3、継承なし比較）。
5. **④ エンディング到達分布** — 条件別に各ENDへの到達割合（通常11種＋真4種）の積み上げ棒。
6. **⚠ 検出した異常（警告欄）** — 不変条件違反を一覧表示。0件なら「異常なし」。

## 5. 不変条件チェック（invariants.ts）

### キャリア/メタ進行
- `echoDepth ≤ 6`（上限クランプ）かつ周回で非減少。
- `fragments` は重複なし・全て有効ID・19件以下、かつ周回で非減少。
- レガシー解禁 ⟹ 対応する先人の断片が完収集済み（`unlockedLegacies` と
  `isPredecessorComplete` の整合）。
- 真ルート解禁 ⟹ `echoDepth==6` かつ全19断片収集。
- `escapes + deaths == runs` / `escapes ≤ runs`。

### 単発run
- `floorReached` は 1〜`MAX_FLOOR(5)` の範囲。
- `endingId` は有効な END 定義に存在（survived時）。
- `cause` は既知の値（escape/体力消耗/精神崩壊）。
- `fragmentsRead` は全て有効な断片ID。

### 集計レベル（balance-contract と重複しない範囲）
- 生還率は難易度で単調減少（easy ≥ normal ≥ hard ≥ abyss）。
- 残響圧で単調減少（圧0 ≥ 圧3 ≥ 圧6）。

### バグ検出の二面作戦
- **CIテスト** (`invariants.test.ts`):
  (a) 実シムを回して違反0件を assert（回帰ガード）。
  (b) 故意に壊したデータ（depth=7、断片20件、レガシー不正解禁など）を渡して
      全ルールが検出することを確認（検出器自体のメタテスト）。
- **レポート警告欄**: 同じ `invariants.ts` を使い、生成時の違反を⚠欄へ。

## 6. データ型（ユニット間の契約）

```typescript
// career-simulator.ts — 1キャリアの結果
interface CareerResult {
  unlocked: boolean;
  runsToUnlock: number; escapesToUnlock: number; deathsToUnlock: number;
  finalDepth: number; finalFragments: number;
  timeline: CareerStep[];          // 周ごとの記録（表示・不変条件検査の対象）
  legacyUnlocks: { runIndex: number; legacyId: string }[];  // 継承取得タイミング
}
interface CareerStep {
  runIndex: number; survived: boolean; cause: string; floorReached: number;
  depth: number; fragmentCount: number; fragsReadThisRun: number; safetyNetGranted: boolean;
}

// analysis.ts — レポートが消費する集計（全て plain data）
interface ReportData {
  generatedAt: string;             // CLIが注入（Date.now禁止のため外部注入）
  survival: SurvivalMatrix;        // ①
  careers: CareerSummary[];        // ②
  legacies: LegacyAnalysis;        // ③
  endings: EndingDistribution;     // ④
  violations: Violation[];         // ⚠（invariants.ts の出力）
  config: { careers: number; seeds: number; maxRuns: number };
}

// invariants.ts
interface Violation { severity: 'error' | 'warn'; rule: string; detail: string; }
```

- `render-html.ts` は `ReportData` だけに依存（純粋関数）。
- `generate-report.ts` のみが副作用（fs書き込み・日時注入）を持つ。

## 7. 実行方法

- npm スクリプト: `npm run sim:labyrinth-echo` → ts-node で `generate-report.ts` を実行。
- 出力先: `reports/labyrinth-echo-sim-<日付>.html`（`reports/` は gitignore）。
- 生成後、出力ファイルの絶対パスを標準出力に表示。

## 8. テスト戦略（TDD: Red → Green → Refactor）

| テストファイル | 検証内容 |
|---|---|
| `run-simulator.test.ts`（拡張） | `fragmentsRead` が読み解き選択で正しく記録される |
| `career-simulator.test.ts` | 脱出でdepth+1、セーフティネット付与、解禁で停止、timeline/legacyUnlocks |
| `invariants.test.ts` | 実シムで違反0件 ＋ 故意の不正データを全ルール検出 |
| `analysis.test.ts` | 集計の単調性・件数・割合合計=100% 等 |

- レンダラは「ReportData を渡すと主要数値が HTML 文字列に含まれる」軽量アサート
  （過度なスナップショットは避ける＝testing規約準拠）。
- 既存の `balance-contract.test.ts` とは責務を分離
  （あちらは設計値バンドの恒久ガード、こちらは進行・継承・検出器）。

## 9. 実装順序

1. `run-simulator` に `fragmentsRead`（テスト先行）。
2. `policies.ts` 切り出し。
3. `career-simulator.ts`（テスト先行）。
4. `invariants.ts`（テスト先行＝故意の不正データ）。
5. `analysis.ts`（テスト先行）。
6. `report/`（render → generate）。
7. npm スクリプト＋`.gitignore` に `reports/` 追加。
8. 検証ループ（lint/typecheck/test）＋ 実際にレポート生成して目視。

## 10. リスクと留意点

- **ts-node 実行時の module 設定**: 既存 tsconfig は `module: bundler` のため、CLI 実行時は
  `TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}'` を npm スクリプトに含める。
- **シミュレーション時間**: キャリアシムは高難度で周回数が膨大になりうる（hard の真END到達は
  実質非現実的）。レポートの対象条件は easy/normal を主軸とし、`maxRuns` で打ち切り、
  打ち切りは「censored」として明示（無言の上限カットをしない）。
- **HTMLサイズ**: 代表キャリアの timeline は1本に限定し肥大化を防ぐ。
- **XSS非対象**: 出力は固定の内部データのみ。ユーザー入力を埋め込まないため
  `dangerouslySetInnerHTML` 等は使わない（そもそも React 非経由の静的HTML文字列生成）。
