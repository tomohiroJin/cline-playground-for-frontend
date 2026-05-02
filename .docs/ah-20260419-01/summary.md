# Air Hockey S9 作業サマリ

> 作業期間: 2026-04-19（1 セッション）
> ブランチ: `feature/air-hockey-brushup-20260419`

## 成果

5 レビュー経由・**Codex Approve 2 回取得**して完了:

- Codex M1 / Codex M2-M4 / Codex M1 再確認 / Codex M2-M4 再確認 / Codex 最終 → **Approve**
- Gemini M1 (Approve w/ Comments) / Gemini M2-M4 (Approve w/ Comments)
- Claude design-review / Claude scenario-review

## コミット履歴（feature ブランチ）

| # | ハッシュ | 内容 |
|---|---|---|
| 1 | `1de8a19` | docs: v4 計画策定（4 レビュー反映） |
| 2 | `c3f3675` | feat: M1 S9-D+V 基盤 |
| 3 | `85a3abf` | feat: M2 S9-A1+A2+A3 |
| 4 | `902ef0f` | feat: M3 S9-S シナリオ補強 |
| 5 | `e6819ee` | feat: M4 S9-C1 PerfProbe 基盤 |
| 6 | `5287811` | fix: Codex M1 レビュー P1×3+P2 |
| 7 | `c1f40c1` | fix: Gemini M2-M4 Approve w/ Comments |
| 8 | `f4b9248` | fix: Codex M2-M4 P1×3+P2 |
| 9 | `603f92b` | fix: Codex 最終確認 P1×2（E2E 実到達型） |
| 10 | `17e2fc0` | feat: S9-C2 + S9-B2 監査スクリプト |
| 11 | `4119e69` | docs: タスク進捗更新 |
| 12 | `942a5a6` | docs: README S9 反映 |

## 実装完了項目（コードベース）

### S9-D デザイン基盤
- `core/design-tokens.ts`（AH_TOKENS、既存グローバルトークン参照中心）
- `hooks/useReducedMotion.ts`（matchMedia 一元化）
- `tokens/game-ui.ts` に `--game-team-a/-b` 追加
- コントラスト修正（`#888` → `#b4b4b4` / `colors.textMuted`）
- `doc/design-system.md` 原則ドキュメント

### S9-V 横断的品質基盤
- `components/CanvasLiveRegion.tsx`（aria-live、role 付けず assertive 対応）
- `core/i18n-strings.ts`（AH_STRINGS 一元化）
- `core/canvas-fonts.ts`（Inter + Noto Sans JP + 絵文字フォールバック、debugInfo 追加）
- `e2e/air-hockey-visual.spec.ts`（4 viewport × 実到達型 VRT + scrollWidth 検証）
- `renderer.ts` / `ui-renderer.ts` の Arial + ハードコード文字列を全面置換

### S9-A UX/表示の仕上げ
- **A1**: VsScreen 2v2 モバイルレスポンシブ（`VsImage` / `VsText` styled + `min(45vw, 240px)` + `clamp()`）
- **A2**: ゲームパッドトースト Canvas 描画検証 + aria-live 転送
- **A3**: 内部語彙（`p2/p3/p4`）と表示（`2P/3P/4P`）分離、`aria-label` 併用
- TeamSetupScreen: `aria-pressed` / `aria-disabled` + gamepad 接続数ガード

### S9-B ビジュアル品質（スクリプト整備）
- **B2-1**: `scripts/air-hockey/audit-portrait-fringe.ts` + 12 純粋関数テスト

### S9-S シナリオ補強
- **SC-01**: Stage 2-3 preDialogue にアキラ 2 回戦勝利の補足
- **SC-02**: Stage 2-4 preDialogue にリク 1 行追加
- **SC-03**: Stage 2-4 postWin にユウの祝辞挿入
- **SC-05**: Stage 2-3 preDialogue の会話フロー再構成
- **SC-08**: Stage 2-4 postWin にタクマの余韻
- **SC-09**: 冗長 `expression: 'normal'` 削除

### S9-C パフォーマンス
- **C1**: `core/perf-probe.ts` + useGameLoop への組み込み（physics/ai/render 別計測、p50/p95/p99/TBT/DPR/Heap）
- `?perf=1` 有効化 + `window.__ahPerfSnapshot` expose
- `e2e/air-hockey-perf.spec.ts` + `npm run test:e2e:perf`
- **C2-3**: パーティクル上限動的化（2v2 時半減、フィーバー 1.5x 許容）
- **C2-4**: マレット-マレット衝突の AABB 事前除外

## テスト統計

| 種別 | 数 |
|---|---|
| 新規追加テストファイル | 7（design-tokens / useReducedMotion / i18n-strings / canvas-fonts / CanvasLiveRegion / perf-probe / audit-portrait-fringe） |
| 新規テストケース | 約 80 件 |
| 既存テスト影響 | 全パス（VsScreen / TeamSetupScreen / TitleScreen / ResultScreen / Scoreboard 等） |
| 全テストスイート | 617 suites / 7918+ tests（最終確認時） |
| typecheck / lint | 全期間 exit 0 維持 |

## レビュー対応統計

| レビュアー | 回数 | 指摘数 | 全反映 |
|---|---|---|---|
| Codex | 5（内 2 回 Approve、3 回 Request changes） | P1×8 + P2×3 | ✅ |
| Gemini | 2（いずれも Approve w/ Comments） | 高 2 + 中 4 + 低 2 | ✅ |
| Claude /design-review | 1（Must Fix 4 + Rec 7） | 11 | ✅ |
| Claude /scenario-review | 1（高 2 + 中 5 + 低 3） | 10 | ✅ |

## 残作業（実機・スナップショット・目視判断が必要）

| 項目 | 必要作業 |
|---|---|
| VRT ベースライン画像生成 | `npx playwright test --update-snapshots` 実行（ローカル／CI 双方で） |
| S9-B1 カットイン品質確認 | `victory-ch2.png` / `yuu-vs.png` を他キャラと並べて目視 |
| S9-B2-2 portrait 処理 | audit スクリプト実行結果の NG キャラを imagesorcery 等で処理 |
| S9-C1-4 実機計測 | iPhone SE 2 (Safari) / Android (Chrome) / Desktop Chrome で `?perf=1` 60 秒計測 |
| S9-C2-1〜2 追加最適化 | 計測結果に基づくボトルネック特定 → 施策 1〜2 件選定 |
| S9-Z 手動検証（M1〜M4） | フリー対戦 / ストーリー Ch1+Ch2 / 2P / ペアマッチ / デイリー全モードをプレイ確認 |

## 将来スコープ（別計画へ）

### シナリオ深化
- SC-04 ユウ口調統一（reactions vs dialogue）
- SC-06 シオン口調統一

### UX/A11y 強化
- HUD ミニマリズム改善（RC-1）
- 60-30-10 面積比検査（RC-5）
- air-hockey 独自テーマトグル（RC-6）
- タッチターゲット 44×44px 実測（SG-5）

### ゲームプレイ・物語
- ストーリー完走時の個人ハイライト（SG-1）
- 章完走時の祝辞メッセージカード（SG-1）
- 第 3 章（県大会編、シオン対戦）

### 技術深化
- AI 再計算の間引き（C2 候補 1）— 計測結果を見て判断
- 省電力モード（C2 候補 5）— 設定パネルトグル追加
- デザイントークンのプロジェクト共通還元（Gemini 低）
- Haptics / Autoplay Policy / PWA 対応

## 次セッションへの引き継ぎ

1. **PR 作成**: `feature/air-hockey-brushup-20260419` → `main`
2. VRT 初回ベースライン画像生成 + 目視確認
3. 実機計測の結果を `.docs/ah-20260419-01/perf-baseline.md` に記録
4. S9-B2-2 の NG 画像処理
5. 手動検証後に残タスクチェック
