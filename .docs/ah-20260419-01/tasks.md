# Air Hockey S9 — タスクチェックリスト（v4）

> 凡例: ⬜ 未着手 / 🔄 作業中 / ✅ 完了 / ⏭️ スキップ
> v4: 全レビュー（Codex / Gemini / design-review / scenario-review + v3 最終 Codex/Gemini）反映。詳細は [plan.md](./plan.md) / [spec.md](./spec.md) / [review-log.md](./review-log.md)

**重要**: 本チェックリストで「useGameLoop.ts」と書いた場合、常に **実体の `src/features/air-hockey/presentation/hooks/useGameLoop.ts`** を指す。`hooks/useGameLoop.ts`（アダプタ 85 行）は原則ノータッチ。

---

## M1: S9-D + S9-V（基盤整備）

### S9-D-0: 事前調査（v3 でトークン棚卸しを強化）

- ✅ S9-D-0a: 既存 `src/styles/tokens/{colors,game-ui,typography,spacing,radii,shadows}.ts` の内容を全読し、再利用可能トークンをリスト化
- ✅ S9-D-0b: `components/` 以下のインラインスタイル出現箇所を grep で洗い出し（色・フォントサイズ・スペーシング Top 20）
- ⬜ S9-D-0c: ダークテーマ (`body.premium-theme`) で各画面の基準スクショを取得（VRT 初期化前の確認用）
- ✅ S9-D-0d: **MF-1 準備**: 既存 `tokens/game-ui.ts` にチーム色（`--game-team-a`, `--game-team-b`）を追加
- ✅ S9-D-0e: `tokens/game-ui.ts` の `gameUi` オブジェクトに `teamA`, `teamB` を追加（TS 側）

### S9-D-1: design-tokens 作成（既存トークン参照版、MF-1/RC-3 反映）

- ✅ S9-D-1a: `src/features/air-hockey/core/design-tokens.ts` を新規作成
- ✅ S9-D-1b: `AH_TOKENS` を以下で構成:
  - `team.a/b` → `gameUi.teamA/teamB` 参照（MF-1）
  - `label.cpu` → `colors.textMuted` 参照（MF-4）
  - `vs.textSize/characterNameSize/infoSize/labelSize` → `typography.fontSize3xl/Lg/Base/Xs` 参照（RC-3）
  - `vs.mobileBreakpoint` のみ独自定数
  - `anim.enter/exit/emphasis` は既存トークンに該当なし、独自定義
- ✅ S9-D-1c: `animCss()` ヘルパを実装
- ✅ S9-D-1d: 単体テスト `design-tokens.test.ts` 作成（値の整合性 + 既存トークン参照整合）
- ✅ S9-D-1e: PR 本文に「独自定義は 3 項目（mobileBreakpoint, anim 3 種）のみ。他は既存トークン参照」を明記

### S9-D-2: useReducedMotion フック

- ✅ S9-D-2a: `src/features/air-hockey/hooks/useReducedMotion.ts` を新規作成
- ✅ S9-D-2b: matchMedia change イベント購読を実装
- ✅ S9-D-2c: `useReducedMotion.test.ts` を作成（matchMedia モック）
- ✅ S9-D-2d: **置換は M1 では行わない**（本適用は A1/A3 と同 PR、Codex P0）

### S9-D-3: コントラスト修正（v3 で Scoreboard/ResultScreen 追加、MF-2/3 反映）

**ラベル色（軽微置換）**:

- ✅ S9-D-3a: `renderer.ts` および `ui-renderer.ts` 両方の `#888` / `#888888` を `#b4b4b4` へ置換（ヘルプ文・ポーズ文、Codex P0 追加）
- ✅ S9-D-3b: `TitleScreen.tsx` のアンロック注釈 `#888` を `colors.textMuted` へ置換
- ✅ S9-D-3c: 変更で既存テストが崩れた箇所を同期修正

**Scoreboard コントラスト検査（MF-2 新規）**:

- ✅ S9-D-3d: `.docs/ah-20260419-01/contrast-audit.md` を新規作成、テンプレ配置
- ✅ S9-D-3e: 既存 11 キャラ色をリスト化し、WebAIM 相当の関数で背景 `#0d1117` 対比を一括計測
- ✅ S9-D-3f: 4.5:1 未満のキャラ色を特定 → 対応方針決定（text-shadow 補強 / 1px ストローク / 派生色追加）
- ✅ S9-D-3g: `Scoreboard.tsx` の `ScoreText` に対応を実装
- ✅ S9-D-3h: 修正後の比率を contrast-audit.md に記録

**ResultScreen コントラスト（MF-3 新規）**:

- ✅ S9-D-3i: `ResultScreen.tsx:87` StatRow ラベル `#888` を `colors.textMuted` 参照へ
- ✅ S9-D-3j: `ResultScreen.tsx:333,337,347,364` の `#aaa`/`#666` を `colors.textSecondary` 参照へ
- ✅ S9-D-3k: MVP 金色 `#ffd700` を `gameUi.achievement` 参照へ統一（`:324,363` 他）
- ✅ S9-D-3l: 既存テストの文字色アサーションと同期

### S9-D-4: design-system.md ドキュメント

- ✅ S9-D-4a: `src/features/air-hockey/doc/design-system.md` を新規作成
- ✅ S9-D-4b: カラー・タイポ・アニメーション・原則チェックリストを記載
- ✅ S9-D-4c: 「プロジェクト共通トークンへの還元候補」セクション作成（Gemini 低）
- ✅ S9-D-4d: `doc/architecture.md` に design-tokens / useReducedMotion の節を追記

### S9-V-1: VRT 基盤（v3 で reduced-motion 強制を追加、RC-7 反映）

- ✅ S9-V-1a: `e2e/air-hockey-visual.spec.ts` を新規作成
- ✅ S9-V-1b: VIEWPORTS 定義（375×667 / 393×852 / 768×1024 / 1280×720）
- ✅ S9-V-1c: `test.use({ reducedMotion: 'reduce' })` を全 viewport に適用
- ✅ S9-V-1d: beforeEach で `FREEZE_ANIMATIONS_CSS`（`animation-duration: 0s`, `transition-duration: 0s` 強制）を `page.addStyleTag` で注入
- ✅ S9-V-1e: beforeEach で `await page.evaluate(() => document.fonts.ready)` を入れて WebFont 読込待機
- ✅ S9-V-1f: TitleScreen のスクショテストを実装
- ⬜ S9-V-1g: VsScreen 1v1 / 2v2 のスクショテストを実装（テスト用初期状態注入で最短到達）
- ⬜ S9-V-1h: ResultScreen のスクショテストを実装
- ⬜ S9-V-1i: 初回ベースライン画像を `--update-snapshots` で生成
- ⬜ S9-V-1j: 生成画像を目視確認 → `e2e/screenshots/` にコミット
- ⬜ S9-V-1k: CI で Playwright 実行が走ることを確認（既存の `npm run test:e2e` に統合）
- ⬜ S9-V-1l: 3 回連続実行で flaky でないこと確認

### S9-V-2: Canvas A11y ライブリージョン

- ✅ S9-V-2a: `components/CanvasLiveRegion.tsx` を新規作成
- ✅ S9-V-2b: `CanvasLiveRegion.test.tsx` で `aria-live` + `aria-atomic` の属性確認（role は付けない、Codex P2-5）
- ⬜ S9-V-2c: `AirHockeyGame.tsx` にマウント（`screen === 'game'` 時）
- ⬜ S9-V-2d: スコア変化を検出して message を更新する useEffect を実装
- ⬜ S9-V-2e: ゲーム終了時の assertive メッセージを実装

### S9-V-3: i18n 語彙分離

- ✅ S9-V-3a: `src/features/air-hockey/core/i18n-strings.ts` を新規作成
- ✅ S9-V-3b: `AH_STRINGS` に common / player / playerAria / game を定義
- ✅ S9-V-3c: `renderer.ts` および `ui-renderer.ts` 両方のハードコード文字列を置換（`"PAUSED"`, `"Tap to Resume"`, `"GO!"`, `"How to Play"` 等、Codex P0 追加）
- ✅ S9-V-3d: 既存テストが文字列比較している箇所を同期修正
- ✅ S9-V-3e: `i18n-strings.test.ts` を作成（キーの存在・重複なし）

### S9-V-4: Canvas フォント統一（v3 新規、RC-4 反映）

- ✅ S9-V-4a: `src/features/air-hockey/core/canvas-fonts.ts` を新規作成
- ✅ S9-V-4b: `CANVAS_FONTS` に countdown/pause/help/hud/combo/toast の各スタックを定義
- ✅ S9-V-4c: `FONT_STACK_BODY` / `FONT_STACK_HEADING` に `Noto Sans JP`, `Segoe UI Emoji`, `Apple Color Emoji` を含める
- ✅ S9-V-4d: `renderer.ts` および `infrastructure/renderer/ui-renderer.ts` 両方の `ctx.font = 'bold Npx Arial'` 形式を全て `CANVAS_FONTS.xxx` へ置換（Codex P0 追加）
- ✅ S9-V-4e: 既存 canvas-renderer テストのフォント文字列アサーションを同期修正
- ⬜ S9-V-4f: WebFont 未読込時のフォールバック挙動を目視確認（初回表示時に日本語がシステムフォントでも崩れないこと）
- ⬜ S9-V-4g: 初回描画時のフォント切替ちらつき確認 — `document.fonts.ready` await の要否を判定（必要なら `useGameLoop` 初期化に追加）

### M1: 検証・ドキュメント

- ⬜ M1-1: `npm run ci` 全パス
- ⬜ M1-2: `npm run test:e2e` で VRT スクショ生成 & 目視確認（reduced-motion 強制 + フォント読込待ち）
- ⬜ M1-3: ダーク/ライト両テーマで各画面を目視確認
- ⬜ M1-4: `README.md` の「ドキュメント」節に design-system.md リンク追加
- ⬜ M1-5: `contrast-audit.md` の全対象で ≥ 4.5:1 達成確認（MF-2/3）
- ⬜ M1-6: Canvas フォント統一で日本語（ひらがな混在）の描画が崩れないことを実機確認（S9-V-4）
- ⬜ M1-7: PR 作成 → レビュー → マージ

---

## M2: S9-A1 + S9-A2 + S9-A3（UX/表示の仕上げ）

### S9-A1: VsScreen 2v2 モバイルレスポンシブ

- ⬜ S9-A1-1a: `VsScreen.tsx` の 2v2 レイアウトを styled-components + media query に書き換え
- ⬜ S9-A1-1b: インライン style を排除、`AH_TOKENS` 参照
- ⬜ S9-A1-1c: 立ち絵サイズを `clamp()` でレスポンシブ化
- ⬜ S9-A1-1d: VS テキスト・ステージ名・フィールド名を `clamp()` でレスポンシブ化
- ⬜ S9-A1-1e: `useReducedMotion` フックを適用（既存のインライン matchMedia 置換）
- ⬜ S9-A1-1f: 3 秒シーケンスとアニメーションは既存互換を維持

**検証（Playwright 主体、Codex P1）**:

- ⬜ S9-A1-2a: `VsScreen.test.tsx` に viewport モックでの 2v2 mobile レイアウト検証
- ⬜ S9-A1-2b: 既存テスト（3 秒自動遷移・1v1/2v2 描画）全パス
- ⬜ S9-A1-2c: Playwright スクショ比較: viewport 375×667 で横スクロールなし
- ⬜ S9-A1-2d: 同上: viewport 393×852 で立ち絵視認可
- ⬜ S9-A1-2e: 同上: viewport 768×1024 で PC レイアウト維持
- ⬜ S9-A1-2f: `page.evaluate(() => document.documentElement.scrollWidth)` ≤ window.innerWidth アサート

### S9-A2: ゲームパッドトースト Canvas 描画（検証・補強）

- ⬜ S9-A2-1a: `canvas-renderer.test.ts` に `drawToastOnCanvas` のアサート追加（undefined / 内側 / フェード）
- ⬜ S9-A2-1b: トースト発火 → `CanvasLiveRegion` に転送する useEffect を `AirHockeyGame.tsx` に追加
- ⬜ S9-A2-1c: 実機確認: ゲームパッド接続 → トースト表示 → 3 秒後フェードアウト
- ⬜ S9-A2-1d: 実機確認: 切断トーストが赤系背景で表示

### S9-A3: 操作タイプ表示統一

- ⬜ S9-A3-1a: `VsScreen.tsx` の `resolveControlLabel` を `AH_STRINGS` + `playerAria` 参照に書き換え
- ⬜ S9-A3-1b: 表示要素に `aria-label` を付与（文字列ラベルのため `role="img"` は不要、Codex P2-5）
- ⬜ S9-A3-1c: `TeamSetupScreen.tsx` の人間ボタンラベルも統一
- ⬜ S9-A3-2a: TeamSetupScreen の人間ボタン disabled 条件実装（P2: 1 台、P3: 2 台、P4: 3 台）
- ⬜ S9-A3-2b: disabled 時のスタイル + title 属性
- ⬜ S9-A3-3a: VsScreen への props は `controlType` スナップショット（遷移時点で確定）
- ⬜ S9-A3-3b: 切断時のフォールバックは実ゲームループで CPU 制御（既存挙動確認）

### M2: 検証・ドキュメント

- ⬜ M2-1: `npm run ci` 全パス
- ⬜ M2-2: Chrome DevTools デバイスモード iPhone SE / iPhone 14 Pro / タブレット確認
- ⬜ M2-3: ゲームパッド接続/切断のホットプラグ確認
- ⬜ M2-4: `src/features/air-hockey/README.md` の「未実装の機能」節を更新（3 項目クローズ）
- ⬜ M2-5: `doc/features.md` の 2v2 節を更新
- ⬜ M2-6: PR 作成 → レビュー → マージ

---

## M3: S9-B1 + S9-B2 + S9-S（ビジュアル品質 + シナリオ補強）

### S9-B1: 第 2 章カットイン・ユウ VS 画像

- ⬜ S9-B1-1a: `victory-ch2.png` の解像度・透過・色味を確認（spec.md B1-2 基準）
- ⬜ S9-B1-1b: `yuu-vs.png` の同上
- ⬜ S9-B1-1c: 他キャラ VS 画像と並べて HSL 平均値比較
- ⬜ S9-B1-1d: 文字要素の混入なしを確認

**リテイク（NG 時のみ）**:

- ⬜ S9-B1-2a: Nanobanana2 用プロンプトを `.docs/ah-20260419-01/asset-prompts.md` に記載
- ⬜ S9-B1-2b: 画像生成 → 後処理（imagesorcery） → 配置
- ⬜ S9-B1-2c: 差分画像を `.docs/ah-20260419-01/作成画像/` に保存

**動作確認**:

- ⬜ S9-B1-3a: Chapter 2 Stage 2-4 クリアで勝利カットイン表示確認
- ⬜ S9-B1-3b: フリー対戦/ストーリーでユウ対戦 → VS 画面確認

### S9-B2: 透過アーティファクト除去（輪郭近傍限定）

- ⬜ S9-B2-1a: `scripts/air-hockey/audit-portrait-fringe.ts` を新規作成
- ⬜ S9-B2-1b: 半透明境界ピクセル抽出ロジック実装（spec.md B2-1）
- ⬜ S9-B2-1c: 白フリンジ / 黒ずみカウント実装
- ⬜ S9-B2-1d: 22 枚走査 → OK/NG/理由テーブルを `.docs/ah-20260419-01/portrait-audit.md` に出力

**処理（NG キャラのみ）**:

- ⬜ S9-B2-2a: NG ファイルリスト確定
- ⬜ S9-B2-2b: imagesorcery / ImageMagick の処理コマンドをドキュメント化
- ⬜ S9-B2-2c: 処理適用 → 再検査
- ⬜ S9-B2-2d: 処理前後の diff 画像を `.docs/ah-20260419-01/作成画像/portrait-fix/` に保存

**検証**:

- ⬜ S9-B2-3a: 再度 audit スクリプトで全 OK 確認
- ⬜ S9-B2-3b: ResultScreen で各キャラ拡大表示 → 目視確認

### S9-S: シナリオ補強（v3+ 新規、/scenario-review 反映）

**編集対象**: `src/features/air-hockey/core/chapter2-dialogue-data.ts`

**SC-01: アキラの準々決勝補足**（高）:

- ⬜ S9-S-1a: `STAGE_2_3.preDialogue` にアキラの 2 回戦勝利を示す 1 行を追加（推奨: ヒロ「お前は 2 回戦もケロッと勝ち抜いてきたからな…」）

**SC-02 + SC-07: リク出演の最小実装**（高）:

- ⬜ S9-S-2a: `STAGE_2_4.preDialogue` に リク の 1 行を追加（推奨: 「俺、準々決勝でレンにやられた。あいつのスピード、マジでヤバい。気をつけろよ」）
- ⬜ S9-S-2b: リクのポートレート・アイコン画像の存在確認（未存在ならフォールバック表示確認）
- ⬜ S9-S-2c: `doc/story-mode.md` の「リク | 2-4（ダイアログ出演）」記述と実装が一致することを再確認

**SC-03: ユウの勝利祝辞**（中）:

- ⬜ S9-S-3a: `STAGE_2_4.postWinDialogue` の ミサキ 〜 ヒロ の間にユウ「県大会…行けるんだね、僕たち。データじゃ計れない戦いを、アキラが見せてくれた」を挿入（`expression: 'happy'`）

**SC-05: 2-3 preDialogue 並び替え**（中）:

- ⬜ S9-S-4a: `STAGE_2_3.preDialogue` の順序を再構成（カナタ対話の前にユウ/ミサキ情報提供を前置）
- ⬜ S9-S-4b: 並び替え後に試合開始前の緊張感が保たれていることを通し読みで確認

**SC-08: 2-4 postWin の余韻**（低）:

- ⬜ S9-S-5a: ヒロ歓喜 → シオン伏線の間にタクマ「…よくやった。本当に、よくやった」を任意挿入（テンポ次第でスキップ可）

**SC-09: `expression: 'normal'` 冗長指定の削除**（低）:

- ⬜ S9-S-6a: `chapter2-dialogue-data.ts` L26, 58, 86, 90, 93, 102, 142 の `expression: 'normal'` を全削除
- ⬜ S9-S-6b: `DialogueLine` 型の optional 扱いと `DialogueOverlay.tsx` のデフォルトが normal であることを確認
- ⬜ S9-S-6c: 既存 `dialogue-data.test.ts` / `chapter2-dialogue-data.test.ts` のアサーションを同期修正

**検証**:

- ⬜ S9-S-Z1: `npm run test` で dialogue 関連テスト全パス
- ⬜ S9-S-Z2: 手動プレイで Ch2 2-1 〜 2-4 を通し、違和感がないことを確認
- ⬜ S9-S-Z3: 手動プレイで Ch2 2-3 preDialogue のフロー確認
- ⬜ S9-S-Z4: 手動プレイで Ch2 2-4 postWin の感情曲線確認

### M3: 検証・ドキュメント

- ⬜ M3-1: `npm run ci` 全パス
- ⬜ M3-2: `npm run test:e2e` で VRT 再スクショ → 意図しない変更なし確認
- ⬜ M3-3: `src/features/air-hockey/README.md` の「既知の問題 > 画像アセット」節を更新
- ⬜ M3-4: S9-S による `story-mode.md` の記述同期（リクの 2-4 出演・ユウの祝辞）
- ⬜ M3-5: PR 作成 → レビュー → マージ

---

## M4: S9-C1 + S9-C2（パフォーマンス）

### S9-C1: パフォーマンス計測基盤

- ⬜ S9-C1-1a: `src/features/air-hockey/core/perf-probe.ts` を新規作成
- ⬜ S9-C1-1b: `begin/end/commit/snapshot/reset` を実装
- ⬜ S9-C1-1c: `PerformanceObserver` で longtask を監視 → TBT 集計
- ⬜ S9-C1-1d: `performance.memory` （Chrome のみ）の取得と undefined 耐性
- ⬜ S9-C1-1e: `devicePixelRatio` を snapshot に含める
- ⬜ S9-C1-1f: `perf-probe.test.ts` を新規作成

**useGameLoop への組み込み**（実体: `presentation/hooks/useGameLoop.ts`）:

- ⬜ S9-C1-2a: `?perf=1` 時のみ PerfProbe を有効化
- ⬜ S9-C1-2b: 物理/AI/描画の各セクションで begin/end を挿入
- ⬜ S9-C1-2c: 既存 FPS 表示を拡張して p50/p95/p99 / TBT / heap / DPR も表示

**E2E 計測**:

- ⬜ S9-C1-3a: `e2e/air-hockey-perf.spec.ts` を新規作成
- ⬜ S9-C1-3b: `window.__ahPerfSnapshot` 経由でメトリクス取得
- ⬜ S9-C1-3c: 手動実行用 npm script `test:e2e:perf` を追加

**計測実施**:

- ⬜ S9-C1-4a: 1v1 Original 60 秒計測（Desktop Chrome）
- ⬜ S9-C1-4b: 1v1 Pillars 60 秒計測
- ⬜ S9-C1-4c: 2v2 Original 60 秒計測
- ⬜ S9-C1-4d: 2v2 Wide 60 秒計測
- ⬜ S9-C1-4e: 2v2 Bastion 60 秒計測
- ⬜ S9-C1-4f: iPhone SE 2 (Safari) で 2v2 Original 60 秒計測
- ⬜ S9-C1-4g: Android 低価格帯 (Chrome) で 2v2 Original 60 秒計測（可能なら）
- ⬜ S9-C1-4h: メモリリーク確認（5 分連続プレイで heap 増加 < 20MB）
- ⬜ S9-C1-4i: 計測結果を `.docs/ah-20260419-01/perf-baseline.md` に記録

### S9-C2: パフォーマンス最適化

- ⬜ S9-C2-1a: 計測結果からボトルネック（physics / ai / render）を特定
- ⬜ S9-C2-1b: 候補 1〜4 の優先順位を決定（1〜2 施策に限定、Codex P1）

**施策実施（優先度順）**:

- ⬜ S9-C2-2a: 選定した施策 1 つ目を実装
- ⬜ S9-C2-2b: 計測再実施 → 改善幅を記録
- ⬜ S9-C2-2c: 2 つ目が必要なら実装（成功基準達成なら 1 つで止める）
- ⬜ S9-C2-2d: OffscreenCanvas を使う場合は機能検出フォールバック確認（iOS Safari）

**目標達成確認**:

- ⬜ S9-C2-3a: FPS 中央値 ≥ 58 達成
- ⬜ S9-C2-3b: FPS p99 ≥ 50 達成
- ⬜ S9-C2-3c: TBT < 300ms 達成
- ⬜ S9-C2-3d: 既存テスト全パス（挙動変化なし）
- ⬜ S9-C2-3e: 手動プレイで違和感なし

### M4: 検証・ドキュメント

- ⬜ M4-1: `npm run ci` 全パス
- ⬜ M4-2: `doc/architecture.md` に PerfProbe / FieldCache（実装時）節を追記
- ⬜ M4-3: `README.md` の「未実装の機能」節からパフォーマンス項目を削除
- ⬜ M4-4: `perf-baseline.md` の最終版を確定（施策前後の対比表含む）
- ⬜ M4-5: PR 作成 → レビュー → マージ

---

## 全体完了タスク

### S9-Z: 最終仕上げ

- ⬜ S9-Z-1: `src/features/air-hockey/README.md` の全節を S9 成果で更新
- ⬜ S9-Z-2: `.docs/ah-20260419-01/summary.md` に作業記録を残す
- ⬜ S9-Z-3: `feature/air-hockey-brushup-20260419` → main への最終確認
- ⬜ S9-Z-4: 計画改訂履歴を `review-log.md` に追記（v2 以降の変更があれば）
