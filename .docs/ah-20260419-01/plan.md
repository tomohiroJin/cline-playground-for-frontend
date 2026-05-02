# Air Hockey S9 — UI/UX デザイン深化・ビジュアル品質・パフォーマンス計画（v4）

> 作成日: 2026-04-19（v4: 全レビュー反映）
> ブランチ: `feature/air-hockey-brushup-20260419`
> ベース: `main`（S8 リファクタ・第 2 章マージ済み）
> レビュー記録: [review-log.md](./review-log.md)

## 目的

S6–S8 までで機能面は揃った。S9 では **手触り・完成度** と **保守運用性** を底上げする。

1. **A. UX/表示の仕上げ** — 未実装リストの UI 隙間を埋め、実装済みだが検証されていない機能を確認
2. **B. ビジュアル品質** — 第 2 章カットイン確認・透過アーティファクト最終除去
3. **C. パフォーマンス** — 定量計測基盤を整備し、2v2 60fps 維持を数値で担保
4. **D. デザイン深化** — トークン統一・コントラスト・アニメーション原則の徹底（基盤）
5. **V. 横断的品質** — VRT / アクセシビリティ / i18n 準備（新規追加）

## スコープ外（明示）

- ストーリー第 3 章の本実装（シオン伏線回収は別マイルストーン）
- オンライン対戦・マッチメイキング
- ゲームバランスの大規模再設計
- 新アイテム/新フィールドの追加
- **フル i18n 実装**（本計画では「準備」まで。実翻訳は別フェーズ）
- **PWA / オフライン対応**（既存挙動のまま）
- **Haptics（`navigator.vibrate`）**（モバイル UX 強化は別フェーズ）
- **ストーリー口調の大規模統一**（SC-04/SC-06。第 3 章執筆時に方針決定）

## フェーズ構成

| Phase | 内容 | サイズ | 依存 | 出力 PR (M) |
|-------|------|--------|------|------------|
| S9-D | デザイントークン・`useReducedMotion`（基盤のみ） | S | — | M1 |
| S9-V | VRT 基盤 / Canvas A11y ライブリージョン / i18n 語彙分離 | M | — | M1 |
| S9-A1 | VsScreen 2v2 モバイルレスポンシブ + トークン適用 | M | S9-D, S9-V | M2 |
| S9-A2 | ゲームパッドトースト Canvas 描画の検証・補強 | XS | — | M2 |
| S9-A3 | 操作タイプ表示統一（内部語彙 + aria-label） | S | S9-D, S9-V | M2 |
| S9-B1 | 第 2 章勝利カットイン・ユウ VS 画像の品質確認 | S | — | M3 |
| S9-B2 | 透過アーティファクト（輪郭近傍限定）除去 | M | — | M3 |
| S9-S | シナリオ補強（Ch2 の構造整合・未植え付け伏線回収） | S | — | M3 |
| S9-C1 | パフォーマンス計測基盤（FPS + TBT + DPR） | M | S9-V | M4 |
| S9-C2 | パフォーマンス最適化（計測結果に基づく 1〜2 施策） | M | S9-C1 | M4 |

**並行可能**:
- S9-D と S9-V は独立、同一 PR（M1）で並行
- S9-B1 / S9-B2 は他と独立、アセット作業なので並行可（M3）
- S9-A2 は他に依存なし、M2 に相乗り

## 成功基準（定量）

### C. パフォーマンス（S9-C1 で測定手順確定）

| 指標 | 目標 | 測定方法 |
|---|---|---|
| FPS 中央値 (p50) | ≥ 58 | `?perf=1` で 60 秒計測 |
| FPS p95 | ≥ 55 | 同上 |
| FPS p99 | ≥ 50 | 同上 |
| Total Blocking Time (TBT) | < 300ms | Performance API / DevTools |
| メモリリーク | 5 分連続プレイで heap 増加 < 20MB | DevTools Memory |
| 対象モード | 1v1 (Original / Pillars), 2v2 (Original / Wide / Bastion) | — |
| 対象端末 | iPhone SE 2 (Safari) / Android 低価格帯 (Chrome) / Desktop Chrome | — |

### D. デザイン（S9-D で対象セレクタ固定、v3 でデザインレビュー反映）

- **コントラスト比 WCAG AA**: 下記セレクタ一覧で計測（最低 4.5:1）、結果を `.docs/ah-20260419-01/contrast-audit.md` に記録
  - `VsScreen.tsx`: `LABEL_COLOR_CPU`, キャラ名, VS テキスト, ステージ名
  - `TitleScreen.tsx`: `#888` で描いているアンロック注釈
  - **`Scoreboard.tsx`: スコア数字（11 キャラ色 × 背景 `#0d1117`）全組み合わせ**（MF-2）
  - **`ResultScreen.tsx`: `#888`/`#aaa`/`#666` の統計ラベル・MVP サブテキスト**（MF-3）
  - `ui-renderer.ts`: ヘルプ文・ポーズ文
- **既存トークンの活用**（MF-1, RC-3）: 新しい色・サイズは `src/styles/tokens/{colors,game-ui,typography,spacing}.ts` で代替できないことを PR 本文で説明する
- **Canvas フォント統一**（RC-4）: `ui-renderer.ts` の全 `ctx.font` を `core/canvas-fonts.ts` の `CANVAS_FONTS` 経由で DOM 側（Inter + Noto Sans JP）と統一
- **アニメーション**: `enter` (200ms) / `exit` (150ms) / `emphasis` (300ms) の 3 種以外の独自 `transition` 禁止
- **`prefers-reduced-motion`**: `useReducedMotion` フックで全コンポーネントに一元適用
- **VRT 撮影時のアニメ強制停止**（RC-7）: `reducedMotion: 'reduce'` + `animation-duration: 0s` 注入で flaky 防止

### V. 横断的品質（S9-V で基盤）

- **VRT**: VsScreen（1v1 / 2v2）、ResultScreen、TitleScreen の Playwright スクショが基準画像と一致（差分 < 0.1%）
- **A11y**: Canvas 内部状態（スコア / トースト / 勝敗）が `aria-live` DOM で読み上げ可能
- **i18n 準備**: Canvas / DOM 内のユーザー向け表示文字列が定数化され、Jotai atom から注入可能な形になっている

### A. UX/表示

- 未実装リストの 3 項目をクローズ:
  - 2v2 モバイルレスポンシブ（S9-A1）
  - ゲームパッドトースト Canvas 描画（S9-A2: 検証）
  - VsScreen P3/P4 操作タイプ表示（S9-A3: 補強）

### B. ビジュアル

- `victory-ch2.png` / `yuu-vs.png` の品質 OK（他キャラとの彩度・コントラスト誤差 < 10%）
- 22 枚 portraits の輪郭近傍に白フリンジ・黒ずみなし

### S. シナリオ補強（v3+ でシナリオレビュー反映）

- 重要度「高」の 2 件（SC-01 アキラ準々決勝の欠落 / SC-02 リク実装ゼロ）を解消
- 重要度「中」のうち即時対応可能な 3 件（SC-03 ユウ祝辞 / SC-05 会話フロー / SC-07 情報伝達）を補完
- 低優先度の SC-08（余韻）・SC-09（冗長指定）を合わせて処理
- 口調統一（SC-04 / SC-06）は第 3 章着手時に回す

---

## マイルストーン

| M | スコープ | 主要成果物 | ドキュメント更新 |
|---|---|---|---|
| **M1** | S9-D + S9-V（基盤） | design-tokens / useReducedMotion / VRT 基盤 / aria-live / i18n 語彙分離 | `doc/design-system.md`, `doc/architecture.md` |
| **M2** | S9-A1 + S9-A2 + S9-A3 | 2v2 モバイル / トースト検証 / ラベル統一 | `doc/features.md`, `README.md`（未実装節クローズ） |
| **M3** | S9-B1 + S9-B2 + **S9-S** | カットイン確認 / 立ち絵最終処理 / シナリオ補強 | `README.md`（既知問題節更新）、`doc/story-mode.md`（リク出演状況） |
| **M4** | S9-C1 + S9-C2 | 計測基盤 / 最適化 1〜2 件 | `perf-baseline.md`, `doc/architecture.md`（PerfProbe 追記） |

各 M で PR を切り、独立してマージ。衝突最小化。

---

## フェーズ詳細

### Phase S9-D: デザイン基盤（縮小版）

**縮小方針**（Codex P0）: 従来案の `D-3 VsScreen/ResultScreen 全面スタイル置換` は A1/A3 と同一 PR に移動。M1 ではトークン定義と `useReducedMotion`、および **軽微な UI 修正（コントラスト値の置換のみ）** までを含める。

**やること（M1 で完結）**:
- `core/design-tokens.ts` を新規作成（`AH_TOKENS`）
- `hooks/useReducedMotion.ts` を新規作成
- `doc/design-system.md` で原則明文化
- **軽微 UI 修正（M1 許容範囲）**（v3 最終 Codex P1-4 で明示化）:
  - `renderer.ts` / `ui-renderer.ts` のラベル色 `#888` → `#b4b4b4`（文字列値のみの置換）
  - `TitleScreen.tsx`, `ResultScreen.tsx`, `Scoreboard.tsx` のコントラスト関連の軽微な色置換（構造変更なし）
- `tokens/game-ui.ts` へチーム色（`--game-team-a/b`）を追加

**M2 以降に回すもの**:
- `VsScreen.tsx` / `ResultScreen.tsx` / `TitleScreen.tsx` のインラインスタイルの全面 styled-components 化（A1/A3 と一体）
- `AH_TOKENS` を用いたレイアウト全面書き換え

### Phase S9-V: 横断的品質基盤（新設）

**V-1. VRT 基盤**:
- `e2e/air-hockey-visual.spec.ts` を新規作成
- 対象: VsScreen（1v1 / 2v2 の 4 人）、TitleScreen、ResultScreen
- viewport: `375x667 / 393x852 / 768x1024 / 1280x720` の 4 パターン
- ベースライン画像は `e2e/screenshots/` に保存（初回作成 → コミット）

**V-2. Canvas A11y ライブリージョン**:
- `components/CanvasLiveRegion.tsx` を新規作成
- `aria-live="polite"` + `visually-hidden` CSS
- 発火ポイント: スコア変化、ゲームパッドトースト、ゲーム終了

**V-3. i18n 語彙分離**:
- `core/i18n-strings.ts` を新規作成
- Canvas 描画される日本語文字列（"GOAL!", "YOU WIN!", "FEVER!", etc.）を定数化
- 当面は日本語のみ。将来の Jotai atom 注入に備えた構造のみ用意

### Phase S9-A1: VsScreen 2v2 モバイルレスポンシブ

- styled-components + media query に書き換え（インラインスタイル排除）
- `AH_TOKENS`（S9-D 成果）を適用
- **検証は Playwright スクリーンショット比較**（Jest matchMedia モックは補助）
- 3 viewport で横スクロール・オーバーフロー・視認性をアサート

### Phase S9-A2: ゲームパッドトースト検証（縮小）

- `presentation/hooks/useGameLoop.ts:916` で `Renderer.drawToast` が呼ばれていることを確認済み
- **やること**:
  - `canvas-renderer.test.ts` でトースト発火 → α 減衰の単体テスト
  - ゲーム中に実機でゲームパッド接続/切断 → トースト表示を目視確認
  - A11y: トースト内容を `CanvasLiveRegion` へ転送（S9-V-2 との連携）

### Phase S9-A3: 操作タイプ表示統一（内部語彙分離）

- **内部語彙**: `CPU / P1 / P2 / P3 / P4`
- **表示文字列**: 絵文字装飾は view 層で `🎮 P1` 等に装飾
- **aria-label**: `aria-label="プレイヤー1（ゲームパッド）"` を併用
- TeamSetupScreen の人間ボタン: ゲームパッド未接続時 `disabled` + `title`

### Phase S9-B1: カットイン・VS 画像確認

- `victory-ch2.png` / `yuu-vs.png` を他キャラと並べて品質確認
- 客観的基準:
  - 解像度: 1024×1024 以上（cutin 1920×1080 推奨）
  - 他キャラとの彩度・コントラスト誤差 < 10%
  - 境界アンチエイリアスに黒ずみなし
- NG なら Nanobanana2 でリテイク

### Phase S9-B2: 透過アーティファクト除去（輪郭近傍限定）

- **輪郭近傍限定**（Codex P2）: 半透明境界ピクセル（`0 < alpha < 255` かつ周囲 3×3 に透明ピクセルあり）のみ検査対象
- audit スクリプトで 22 枚を走査 → OK/NG/理由テンプレに記録
- NG キャラのみ imagesorcery / ImageMagick で処理
- 処理前後の diff 画像を `.docs/ah-20260419-01/作成画像/portrait-fix/` に保存

### Phase S9-S: シナリオ補強（Ch2 の整合性向上）

**背景**: `/scenario-review` で Ch2 に 10 件の課題が検出された（詳細: [review-log.md](./review-log.md)）。重要度「高」の 2 件は第 3 章着手前の解消が必須。M3 でビジュアル確認と同時に処理することで、プレイしながら違和感のある箇所をまとめて修正する。

**対象ファイル**: `src/features/air-hockey/core/chapter2-dialogue-data.ts` のみ。他コードへの影響なし。

**やること**:
- **SC-01** アキラの準々決勝補足 — 2-3 preDialogue 冒頭にユウの 1 行追加（「アキラの 2 回戦は○○高校に勝利済み」等）
- **SC-02 + SC-07** リク出演の最小限実装 — 2-1 postWin でソウタからリクへ言及、または 2-4 preDialogue に観客席リクの 1 行追加
- **SC-03** ユウの勝利祝辞 — 2-4 postWin の ミサキ 〜 ヒロ の間に「県大会…行けるんだね、僕たち」を挿入
- **SC-05** 2-3 preDialogue 並び替え — カナタの挑発前にユウ/ミサキの情報提供を前置
- **SC-08** 2-4 postWin の余韻 — ヒロ歓喜 → シオン伏線の間に場面転換ヒントを追加
- **SC-09** `expression: 'normal'` の冗長指定を削除

**検証**:
- 既存 `chapter2-dialogue-data.test.ts` が全パス（ダイアログ数のアサーションがある場合は同期修正）
- 手動プレイで Ch2 を最初から通し、フロー確認
- `story-mode.md` の「リク | 2-4（ダイアログ出演）」記述と実装が一致

### Phase S9-C1: パフォーマンス計測基盤

- `core/perf-probe.ts` で FPS / 物理 / AI / 描画の各時間を計測
- **TBT 計測**: `PerformanceObserver` で longtask をカウント
- **DPR 検証**: `window.devicePixelRatio` を記録
- **メモリ計測**: `performance.memory` （Chrome のみ）で heap 使用量
- `?perf=1` で有効化
- 計測結果を `perf-baseline.md` に記録（端末 / OS / ブラウザ / モード / フィールド / p50 / p95 / p99 / サンプル数）

### Phase S9-C2: パフォーマンス最適化

**前提: S9-C1 の計測結果を根拠に、1〜2 施策に限定**

**候補**（優先度は計測で決定）:
1. **AI 再計算の間引き** — `reactionDelay * 3` 周期を 2v2 で延長
2. **フィールド背景のキャッシュ** — `OffscreenCanvas` ではなく hidden `<canvas>` でフォールバック（iOS Safari 互換）
3. **パーティクル上限の動的化** — 2v2 時は半減、フィーバー時のみ増量
4. **quickReject の拡張** — マレット-マレット衝突 AABB 事前判定
5. **省電力モード**（Gemini 中）— 端末負荷検出で 30fps 上限 / パーティクル削減（オプトイン）

---

## リスク

1. **S9-V の VRT ベースライン**: 初回画像の生成は環境依存（フォントレンダリング差）→ CI 環境を `playwright-chromium` 固定、ローカル生成は docker 推奨
2. **S9-A3 の絵文字表示**: フォント差異でレンダリング不一致 → 絵文字は装飾、テキストは常に併記
3. **S9-C1 の `performance.memory`**: Chrome 専用 API → 非対応ブラウザでは undefined 許容
4. **S9-C2 の OffscreenCanvas**: iOS Safari は制限あり → hidden canvas 前提、機能検出フォールバック
5. **S9-B 画像差替え**: Nanobanana2 再生成で画風が揺れる → 再生成は S9-B1 合格基準で NG のもののみ
6. **S9-V-3 i18n 語彙分離**: 既存テストが文字列比較を含む → 定数参照に置換、アサーション同期修正

## レビュー方針

- 実装前: 計画を CodexCLI / GeminiCLI / Claude design-review でレビュー済（[review-log.md](./review-log.md)）
- 実装中: 各 PR にスクリーンショット / GIF / FPS 測定値を添付
- 実装後: M ごとに該当ドキュメント更新（M4 に集中させない）

---

## 将来スコープメモ（本計画外・別マイルストーン候補）

デザインレビューで挙がった項目のうち、本計画（S9）では扱わないもの。時期が来たら別計画として起票する。

### UX / ゲームプレイ深化
- **HUD ミニマリズム改善**（RC-1）: Scoreboard のポーズ/メニューボタンを透明度 0.4 + フォーカス時強調に
- **ストーリー完走時の個人ハイライト**（SG-1）: 「今日で連勝 3 回目」「最高速度更新」等の達成カード + ShareButton 連携
- **章完走時の祝辞メッセージカード**（SG-1）: 全キャラからの自動生成メッセージ

### デザインシステム
- **60-30-10 面積比検査**（RC-5）: スクショに K-means で主要 3 色の面積比を計測
- **air-hockey テーマトグル**（RC-6）: `SettingsPanel` にダーク/ライト切替を追加（現状は body クラスで全画面一括）
- **マイクロインタラクション 3 種の GIF ガイド**（SG-2）: enter/exit/emphasis 各 1 GIF を `doc/design-system.md` に埋め込み
- **カラー命名の意味論化**（SG-3）: `TEAM1/TEAM2 → TEAM_HOME/TEAM_AWAY`, `playerColor/cpuColor → allyColor/opponentColor`
  - 段階移行案: `game-ui.ts` では `teamA/teamB` の命名でニュートラル化済み。既存コード側の `TEAM1/TEAM2` は alias として当面残す

### レスポンシブ / アクセシビリティ
- **タッチターゲット 44×44px 実測**（SG-5）: `TitleScreen` の MenuButton など一括測定 + 調整
- **キーボードのみナビゲーション保証**: ポーズ/設定/実績などモーダルの Tab 循環を Playwright で自動検証

### 先進技術
- **P3 色域活用**（SG-4）: sRGB フォールバック付きで特別なアクセントにのみ（現状は採用見送り）

### シナリオ深化（第 3 章着手時に検討）
- **SC-04 ユウの口調統一**: reactions（です・ます科学者調）と dialogue（タメ口同期調）の統一方針決定
- **SC-06 シオンの口調統一**: 第 3 章で対戦キャラとして登場するため、reactions と dialogue の整合を先に取る
- **SC-10 `isChapterFinale` optional 表記統一**: コーディング規約マター。`undefined` or `false` 明示化を決定
