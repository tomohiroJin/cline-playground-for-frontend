# 迷宮の残響 — シミュレーション・レポート基盤

迷宮の残響（labyrinth-echo）の**開発支援ツール**。本番ロジックをヘッドレスに回して
バランス・周回進行・継承・エンディング分布を計測し、HTMLレポートとして出力する。
あわせて不変条件チェッカで「変なバグ」を検出する。

> **重要**: これは開発支援ツールであり、**ゲーム本体のビルドには含まれない**。
> `simulation/` をゲーム本体コードは import しない（バンドル非同梱）。生成物 `reports/` は gitignore。

## 実行方法

```bash
npm run sim:labyrinth-echo
```

- 出力先: `reports/labyrinth-echo-sim-<日付>.html`（生成後にパスを標準出力に表示）。
- 規模は環境変数で調整可能（既定 `SIM_SEEDS=200` / `SIM_CAREERS=100` / `SIM_MAX_RUNS=120`）:
  ```bash
  SIM_SEEDS=400 SIM_CAREERS=200 SIM_MAX_RUNS=200 npm run sim:labyrinth-echo
  ```
- `error` レベルの不変条件違反が出ると**非0終了**する（CI で異常を検知できる）。

## レポートの4軸＋警告欄

1. **単発run 生還率カーブ** — 難易度×残響圧（0〜6）のヒートマップ。careful プレイの手応えを可視化。
2. **周回（キャリア）進行** — 真エンディング解禁まで何周かかるか（条件別の総周回・脱出・死亡）＋代表キャリアの depth/断片数の推移。
3. **継承（レガシー）分析** — 各先人の断片完収集→レガシー解禁のタイミング、各レガシー5種の生還率トレードオフ（圧0/圧3）。
4. **エンディング到達分布** — 条件別に各エンディングへの到達割合。
5. **⚠ 検出した異常** — 不変条件違反の一覧（0件なら「✓ 異常なし」）。

## ファイル構成と責務

```
simulation/
  run-simulator.ts     # 1ラン分の探索を決定論的に再現（本番の pickEvent/processChoice 等を流用）。
                       #   RunResult.fragmentsRead = 探索中に読み解いた断片ID
  policies.ts          # 選択ポリシー: CAREFUL（生還最優先）/ RANDOM（無策）/ LORE（断片を必ず読む）
  career-simulator.ts  # 周回（キャリア）進行。真ルート解禁まで run を繰り返し、
                       #   echoDepth・断片・レガシー解禁の累積を再現
  invariants.ts        # 不変条件チェッカ（純粋関数）。違反レコード配列を返す
  analysis.ts          # 集計層（純粋）。生還率行列・周回サマリー・継承分析・END分布＋違反収集
  report/
    render-html.ts     # 純粋関数 ReportData → HTML 文字列（インラインCSS/SVG、依存ゼロ）
    report-data.ts     # 純粋。aggregateAll の結果に generatedAt/config を載せる
    generate-report.ts # CLI エントリ。唯一の副作用境界（日時生成・fs 書き込み）
```

テストは `../__tests__/simulation/` 配下（各ファイルに対応する `*.test.ts`）。
難易度バンド・単調性の権威的ゲートは `../__tests__/domain/services/balance-contract.test.ts`（N=200）が担う。

## 設計原則

- **本番ロジック流用で定数乖離を防ぐ**: `createNewPlayer` / `incrementEchoDepth` /
  `selectSafetyNetFragment` / `isTrueRouteUnlocked` / `unlockedLegacies` 等のドメイン関数を
  そのまま使う。シミュレータ専用の定数複製はしない。
- **決定論**: 乱数は `SeededRandomSource(seed)` のみ（`Math.random()` 直接使用なし）。
  同じコード・同じ設定なら同じレポートになり、差分比較できる。
- **純粋／副作用の分離**: 集計・描画は純粋関数。日時生成と fs 書き込みは `generate-report.ts` に隔離。
  これにより同じ集計を Jest（数値アサート）と HTML レンダリングが共有でき、
  「レポートは緑だが CI は赤」という乖離が原理的に起きない。

## 不変条件チェッカ（バグ検出の二面作戦）

`invariants.ts` の各ルールは **CIテスト** と **レポート警告欄** の両方で使われる:

- **キャリア**: depth≤6・断片≤19・周回での非減少、レガシー解禁⟺先人完収集、真ルート解禁⟺depth6かつ全19断片、escapes+deaths==runs。
- **単発run**: floorReached が 1..5、endingId が有効、cause が既知、断片IDが有効。
- **集計**: 生還率の難易度・残響圧での単調性（統計的傾向のため `warn`。CI は落とさずレポートに表示）。

テストは2目的: (a) 実シムで違反0件（回帰ガード） (b) **故意に壊したデータ**を全ルールが検出（検出器自体のメタテスト）。

## 計測データ（既定設定での目安）

- **真エンディング解禁まで**: easy×careful=**19周ぴったり**（セーフティネット 1脱出1片×全19断片、echoDepth6=6脱出が必須）、easy×lorehunter≈14周、normal×careful≈23周。hard 以上は生還率が低すぎて実質非現実的。
- **戦略性の効き（normal）**: careful ≈81% vs random ≈3.5% と、計画プレイの価値が大きい。

> この基盤は構築当日、本番設定（seeds200/careers100）でのみ表面化する稀なバグ
> （周回シミュレータの断片二重収集＝断片が19を超過）を検出した。小設定のテストでは出ず、
> サンプル拡大で初めて顕在化したもの。「小サンプルで緑でもフルスケールで出るバグがある」ことの実例。
