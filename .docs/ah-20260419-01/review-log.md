# Air Hockey S9 計画 — レビュー記録

> 作成日: 2026-04-19
> レビュアー: CodexCLI (gpt-5.4) / GeminiCLI / Claude 自己レビュー

## 初版の観測で見つけた実装済み項目

- `drawToast` は `presentation/hooks/useGameLoop.ts:916` で既に呼ばれている → **S9-A2 は実装済み**。タスクは「検証・補強」に縮小
- `useGameLoop` は **2 ファイル存在**:
  - `src/features/air-hockey/hooks/useGameLoop.ts`（85 行、後方互換アダプタ）
  - `src/features/air-hockey/presentation/hooks/useGameLoop.ts`（1032 行、実体）
  - 計画書では **実体側を正** と明記すること

---

## CodexCLI レビューサマリ

### P0（計画即修正）
1. **S9-D が A 系の前提になりすぎ** — D-1/D-2（トークン定義・useReducedMotion）までに縮小し、VsScreen/ResultScreen への適用（D-3）は A1/A3 と同一 PR へ寄せる
2. **useGameLoop の実装パスを明記** — `src/features/air-hockey/presentation/hooks/useGameLoop.ts` を正とし、アダプタ側はノータッチ

### P1（加筆必須）
3. **成功基準の測定手順** — `端末名 / OS / ブラウザ / モード / フィールド / 60 秒計測 / p50 / p95 / p99 / サンプル数`。コントラストは「5 箇所」ではなく「対象セレクタ一覧」を固定
4. **A1 の検証は Playwright スクショ比較** — `375x667 / 393x852 / 768x1024` の 3 パターンで横スクロール・オーバーフロー・視認性を acceptance 化
5. **A3 の絵文字ラベルに i18n/A11y 逆風** — 内部語彙 `CPU / P1 / P2 / P3 / P4` をベースに、装飾は view 層。`aria-label="プレイヤー1（ゲームパッド）"` 付与
6. **C2 の OffscreenCanvas は iOS Safari 非互換** — 機能検出フォールバック、通常の hidden canvas でも成立する設計

### P2（運用品質）
7. **B2 白フリンジは輪郭近傍に限定** — 白衣装/瞳ハイライトを誤検出しないよう半透明境界ピクセルのみ対象、22 枚に OK/NG/理由テンプレ
8. **ドキュメント更新を各 M で分散** — M4 にまとめると差分レビューが重くなる

### 実行順の提案（Codex）
1. 計画書修正
2. S9-D を D-0〜D-2 の基盤整備に縮小
3. S9-A1 と S9-A3 を同一スライスで実装
4. S9-A2 を useGameLoop 実体側に限定で検証
5. S9-B1 / B2 を並行実施
6. S9-C1 で測定基盤と測定手順を確定
7. S9-C2 は 1〜2 施策に限定
8. 各 M で関連ドキュメントを即時更新

### 全体工数（Codex）
- 計画修正と基盤整備: 1〜1.5 日
- UI/UX 仕上げ（A 系）: 1.5〜2 日
- アセット品質（B 系）: 1〜2 日
- 計測と最適化（C 系）: 2〜3 日
- **合計: 5.5〜8.5 日**

---

## GeminiCLI レビューサマリ

### 【高】
1. **パフォーマンス計測の定量化** — TBT（Total Blocking Time）、メモリリーク、Performance API を追加
2. **Canvas 内部状態のアクセシビリティ** — `aria-live="polite"` の DOM 要素でスコア・トースト・勝敗を露出
3. **キーボード操作の完結** — `tabindex` + Enter/Space/Esc でポーズ・設定変更
4. **VRT 導入** — Playwright の `expect(page).toHaveScreenshot()`

### 【中】
5. **i18n 拡張性** — Canvas 描画テキスト（"GOAL!", "YOU WIN!"）のハードコード排除、翻訳パイプライン明確化
6. **High DPI（Retina）対応** — `window.devicePixelRatio` のスケーリング検証
7. **サーマルスロットリング対応** — 省電力/低負荷モード（パーティクル削減、FPS 30 上限）

### 【低】
8. **デザイントークンのグローバル還元** — air-hockey で洗練した原則を他 12 タイトルへ
9. **画像品質の客観的基準** — 「他キャラとの彩度・コントラスト誤差 10% 以内」「境界アンチエイリアスに黒ずみなし」
10. **Haptics / Autoplay Policy** — `navigator.vibrate`、音声の同時再生制限
11. **PWA / オフライン対応** — アセット・プリロード、ネットワーク切断時のエラーハンドリング

---

## 統合改訂方針

両レビューを受けて以下を実施:

| 改訂項目 | 根拠 | 反映先 |
|---|---|---|
| useGameLoop 実体パス明記 | Codex P0 | spec.md（影響範囲マトリクス） |
| S9-D を基盤のみに縮小、D-3 を A1/A3 へ統合 | Codex P0 | plan.md / tasks.md |
| S9-A2 を「検証・補強」に縮小 | 自己観測 | plan.md / spec.md / tasks.md |
| 新フェーズ S9-V（VRT + A11y + i18n 基盤）追加 | Gemini 高 / Codex P1 | plan.md / spec.md / tasks.md |
| 成功基準の定量化（FPS p50/p95/p99、TBT、メモリ、対象セレクタ） | Codex P1 / Gemini 高 | plan.md / spec.md / tasks.md |
| A1 に Playwright スクショ比較タスク | Codex P1 / Gemini 高 | spec.md / tasks.md |
| A3 に内部語彙と aria-label | Codex P1 / Gemini 高 | spec.md / tasks.md |
| C2 に OffscreenCanvas フォールバック仕様 | Codex P1 | spec.md / tasks.md |
| C1 に DevicePixelRatio / TBT / メモリ計測 | Gemini 中 | spec.md / tasks.md |
| C2 に省電力モード候補 | Gemini 中 | spec.md |
| B2 の輪郭近傍限定 + OK/NG テンプレ | Codex P2 / Gemini 低 | spec.md / tasks.md |
| ドキュメント更新をマイルストーン分散 | Codex P2 | plan.md / tasks.md |
| i18n 準備（内部語彙と表示分離、Canvas 描画定数化） | Codex P1 / Gemini 中 | spec.md / tasks.md |
| Haptics / Autoplay / PWA は「スコープ外メモ」として記録 | Gemini 低 | plan.md |
| デザイントークンのグローバル還元 | Gemini 低 | tasks.md（M1 の最終タスク） |

上記を反映した v2 を plan.md / spec.md / tasks.md として書き直す。

---

## 追加レビュー: デザインレビュー（Claude /design-review、2026-04-19）

v2 提出後、`/design-review` スキルで Game UI ドメインの構造化レビューを実施。

### 必須修正（Must Fix）
- **MF-1**: 計画の `AH_TOKENS` と既存 `tokens/game-ui.ts` の二重管理リスク。チーム色は `--game-team-a/-b` として game-ui.ts に追加してから参照する方針へ
- **MF-2**: `Scoreboard.tsx:22,27` のキャラカラー × ゲーム背景 `#0d1117` のコントラスト比が未検査。11 キャラ × 背景の組み合わせを AA 基準で計測
- **MF-3**: `ResultScreen.tsx` の `#888`/`#aaa`/`#666` 多用箇所（統計ラベル・MVP サブテキスト）が D-3 対象から漏れている
- **MF-4**: `AH_TOKENS.label.cpu: '#b4b4b4'` 固定値は既存 `--color-text-muted` への参照に修正

### 推奨改善（Recommended）
- **RC-1**: HUD（Scoreboard）のミニマリズム再検討（ゲーム中の透明度調整） → **将来スコープメモ**
- **RC-2**: reduced-motion 時の VsScreen を「opacity フェード 150ms」に → `useReducedMotion` のパターン化で吸収
- **RC-3**: `AH_TOKENS.vs.textSize` 等の独自 clamp を既存 `typography.ts` の `--font-size-3xl` 等で代替検討
- **RC-4**: Canvas 内テキストが `'Arial'` ハードコード。`core/canvas-fonts.ts` で DOM と統一（Inter + Noto Sans JP フォールバック）
- **RC-5**: 60-30-10 ルールの面積比検査をスコショから K-means で計測 → **将来スコープメモ**
- **RC-6**: ダークモード切替を air-hockey の SettingsPanel に追加 → **本計画外（別マイルストーン）**
- **RC-7**: Playwright VRT に reduced-motion エミュレーション + アニメーション強制停止 CSS を必須化

### 提案（Suggestions、将来スコープメモ）
- **SG-1**: ストーリーモード完走時の個人ハイライト・祝辞カード
- **SG-2**: マイクロインタラクション 3 種（enter/exit/emphasis）の GIF 付きガイド
- **SG-3**: `TEAM1/TEAM2` → `TEAM_HOME/TEAM_AWAY`、`playerColor/cpuColor` → `allyColor/opponentColor`
- **SG-4**: P3 色域は本計画では見送り
- **SG-5**: タッチターゲット 44×44px 実測（S9-A3 の TeamSetupScreen 改修と併せて）

### スコアサマリ

| 評価項目 | スコア | 主なギャップ |
|---|---|---|
| ゲシュタルト原則 | 4 | reduced-motion 時の共通運命が弱い |
| 認知負荷 | 4 | HUD ミニマリズム（RC-1） |
| 感情的デザイン | 4 | 内省レベル（SG-1） |
| 配色 | 3 | 既存トークン未活用、Scoreboard/ResultScreen 検査漏れ |
| タイポグラフィ | 3 | 独自 clamp 重複、Canvas Arial ハードコード |
| アクセシビリティ | 4 | キーボード操作完結の明示が未記載 |
| レスポンシブ | 4 | タッチターゲット実測未計画 |
| ドメイン固有 | 4 | game-ui.ts トークン活用で満点級に |

### v3 反映内容

- MF-1 → spec.md D-1 を「既存トークン優先」ルールへ再構成、`game-ui.ts` にチーム色追加を tasks へ
- MF-2 → spec.md D-3 に Scoreboard キャラカラー × 背景のコントラスト検査表を追加
- MF-3 → spec.md D-3 に ResultScreen の `#888`/`#aaa` 置換対象を追加
- MF-4 → `AH_TOKENS.label.cpu` を `var(--color-text-muted)` 参照に
- RC-3 → spec.md D-1 に「独自 clamp 定義前に typography.ts 再利用検討」ガードを追加
- RC-4 → spec.md V-3 に `core/canvas-fonts.ts` と Canvas フォント統一を追加
- RC-7 → spec.md V-1 に reduced-motion エミュレーション + `animation-duration: 0s` 強制停止を追加
- SG-3 → 内部識別子は段階移行メモとして plan.md 将来スコープに記載
- RC-1/5/6、SG-1/2/4/5 → plan.md の「将来スコープメモ」セクションに記録

---

## 追加レビュー: シナリオレビュー（Claude /scenario-review、2026-04-19）

v3 確定後、`/scenario-review` スキルでストーリーモード（Ch1 + Ch2）のシナリオ整合性を検証。

### 発見された課題

| # | カテゴリ | 問題 | 該当 | 重要度 |
|---|---|---|---|---|
| SC-01 | 物語構造 | アキラの準々決勝（2 回戦）が未描写。ヒロ/ミサキが「2 回戦敗退」と明言するためアキラだけ 1 回戦 → 準決勝で飛んでいる | `chapter2-dialogue-data.ts` 2-3 preDialogue | 高 |
| SC-02 | 伏線未植え付け | リクがプロット・`story-mode.md`・`characters.ts` で第 2 章出演キャラとされているが実装ダイアログに 0 行 | `chapter2-dialogue-data.ts` 全体 | 高 |
| SC-03 | 伏線未植え付け | ユウの 2-4 勝利コメント（プロット記載「県大会…行けるんだね、僕たち」）が実装に無い | `chapter2-dialogue-data.ts` 2-4 postWin | 中 |
| SC-04 | 口調揺れ | ユウの reactions（です・ます科学者調）とダイアログ（タメ口同期調）で別人格のよう | `characters.ts` L149-154 | 中 |
| SC-05 | 会話フロー | Ch2 2-3 preDialogue でカナタの挑発 → プレイヤー反論 → ユウ/ミサキ助言の順。対戦相手との緊張感が中断される | `chapter2-dialogue-data.ts` L85-93 | 中 |
| SC-06 | 口調揺れ | シオンの reactions（冷静な分析者）とダイアログ（俗語混じり観察者）でニュアンス差 | `characters.ts` L202-206 | 中 |
| SC-07 | 情報伝達希薄 | Ch2 2-1 postWin で ソウタ が伝える情報が「レンの噂」のみ（プロットではリクも言及予定） | `chapter2-dialogue-data.ts` L32 | 中 |
| SC-08 | 演出のキレ | Ch2 2-4 postWin のヒロ歓喜 → シオン伏線の感情落差が急で余韻がない | L135-136 | 低 |
| SC-09 | 冗長指定 | `expression: 'normal'` の明示指定が複数箇所（デフォルト値と同じ） | 複数 | 低 |
| SC-10 | スタイル | `isChapterFinale` の optional 扱いの統一 | STAGE_2_1 | 低 |

### S9 計画への反映方針

新フェーズ **S9-S（シナリオ補強）** を M3（S9-B1 ビジュアル確認と同じマイルストーン）に追加:

- **S9-S1**: SC-01 のアキラ 2 回戦補完（1 行追加）
- **S9-S2**: SC-02 + SC-07 のリク台詞追加（Ch2 2-1 postWin にソウタ経由 or リク直接）
- **S9-S3**: SC-03 のユウ勝利祝辞挿入（Ch2 2-4 postWin）
- **S9-S4**: SC-05 の 2-3 preDialogue 並び替え
- **S9-S5**: SC-08 の 2-4 postWin 余韻追加
- **S9-S6**: SC-09 の冗長 `expression: 'normal'` 削除

**将来スコープメモへ**:
- SC-04（ユウ口調統一）: 第 3 章執筆着手時に方針決定
- SC-06（シオン口調統一）: 同上
- SC-10（isChapterFinale 表記統一）: コーディング規約マター

**重要度 "高" の 2 件（SC-01, SC-02）は第 3 章着手前に必ず解消**。M3 で処理することで本計画内に収める。

---

## 追加レビュー: 実装着手前の最終レビュー（Codex / Gemini、2026-04-19）

v3 確定後の最終ゲート。

### GeminiCLI: **Go（実装着手承認）**判定

軽微な追加推奨のみ:
1. M1 PR の分割検討（D と V）— 低優先
2. WebFont ロード完了待ちの実機確認 — **中優先** → tasks.md S9-V-4g に追加
3. `CanvasLiveRegion.tsx` の配置パス明文化 — 低 → spec.md V-2 に `feature ローカル配置` を明記
4. シナリオ補強の台詞ニュアンス微調整 — 低

### CodexCLI: **軽微な修正 4 点を入れてから着手**判定

**P0（即実装ブロック級、修正必須）**:
1. **Playwright パスずれ**: ドキュメントの `tests/e2e/` は存在しない。実際は `testDir: './e2e'`
   → 全ファイルで `tests/e2e/` → `e2e/` に一括置換、spec.md のファイルパス表記ルールに明記
2. **Canvas 描画の編集対象漏れ**: `ui-renderer.ts` だけでは不十分。**実際の描画本体は `renderer.ts` (802 行)** で `"PAUSED"` / `"Tap to Resume"` / Arial 指定が 20 箇所以上残存
   → spec.md にファイルパス表記ルールを追記、D-3 / V-3 / V-4 の編集対象に `renderer.ts` を追加、tasks.md S9-D-3a / S9-V-3c / S9-V-4d を修正

**P1（実装前に解消推奨）**:
3. **VRT beforeEach の順序が機能しない**: `page.addStyleTag()` / `document.fonts.ready` を `goto()` 前に呼ぶと `about:blank` に対して実行される
   → spec.md V-1 で各 test 内 `goto() → stabilize() → スクショ` の順に書き直し、代替案として `addInitScript()` を併記
4. **M1 の定義と実タスクのズレ**: plan では「基盤のみ」だが tasks では TitleScreen/Scoreboard/ResultScreen の改修が含まれる
   → plan.md の S9-D フェーズ詳細で「M1 許容の軽微 UI 修正」と「M2 以降に回す全面書き換え」を明示

**P2（文言改善）**:
5. **A11y API 不整合**: `role="status"` + `aria-live="assertive"` の組み合わせ、`<span role="img">` の過剰指定
   → spec.md V-2 で `role="status"` を削除（`aria-live` のみ）、A3-2 で `role="img"` を削除

### v4 反映サマリ

| 修正項目 | 反映先 |
|---|---|
| `tests/e2e/` → `e2e/` 一括置換 | plan.md / spec.md / tasks.md（計 9 箇所） |
| `renderer.ts` を編集対象に追加 | spec.md（ファイルパス表記ルール節）、tasks.md S9-D-3a / S9-V-3c / S9-V-4d |
| VRT beforeEach 順序修正 | spec.md V-1 のコード例を書き直し |
| M1 定義明示化 | plan.md S9-D フェーズ詳細 |
| A11y role 不整合修正 | spec.md V-2 / A3-2、tasks.md S9-V-2b / S9-A3-1b |
| WebFont ロード実機確認 | spec.md V-4 注意点節、tasks.md S9-V-4g |
| CanvasLiveRegion 配置パス明記 | spec.md V-2 ファイルパス |

### 最終判定（v4）

両レビュー指摘をすべて反映し、実装ブロック要因を解消。Go ステータス。
