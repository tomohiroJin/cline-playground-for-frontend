---
タイトル: feat: Air Hockey S9 ブラッシュアップ（デザイン・A11y・シナリオ・パフォーマンス基盤）
ベース: main
ヘッド: feature/air-hockey-brushup-20260419
---

## 概要

Air Hockey の UX/A11y/シナリオ/パフォーマンスを横断的に底上げする S9 ブラッシュアップ。
5 レビュー（Codex ×3 / Gemini ×2）+ Claude `/design-review` + Claude `/scenario-review` を経て **Codex Approve 2 回取得済み**。

主目的は次の 4 点:

1. **デザイントークン基盤**を整備し、Canvas/DOM 両側でハードコード色・フォントを排除
2. **A11y 強化**: Canvas 内のスコア・トースト・勝敗を `aria-live` で支援技術に露出
3. **シナリオ補強**: 第 2 章の伏線・キャラ整合性を `/scenario-review` の指摘に沿って修正
4. **パフォーマンス計測基盤**を導入し、`?perf=1` で physics/ai/render を分離計測可能に

## 変更内容（8 カテゴリ）

### 1. デザイン基盤（S9-D）
- `core/design-tokens.ts` — `AH_TOKENS`（既存 `styles/tokens/` 参照中心、独自定数は 4 項目のみ）
- `hooks/useReducedMotion.ts` — matchMedia 一元化
- `styles/tokens/game-ui.ts` — `--game-team-a/-b` トークン追加
- コントラスト修正（`#888` → `#b4b4b4` / `colors.textMuted`）
- `doc/design-system.md` — 原則ドキュメント

### 2. 横断的品質基盤（S9-V）
- `components/CanvasLiveRegion.tsx` — `aria-live` ライブリージョン
- `core/i18n-strings.ts` — `AH_STRINGS` で Canvas 描画文字列を一元化
- `core/canvas-fonts.ts` — `Inter` + `Noto Sans JP` + 絵文字フォールバック
- `e2e/air-hockey-visual.spec.ts` — 4 viewport（375/393/768/1280）VRT + `assertNoHorizontalOverflow`
- VRT ベースライン: `title-{iphone-se,iphone-14,tablet,desktop}-chromium-linux.png`

### 3. UX/表示の仕上げ（S9-A）
- **A1**: `VsScreen.tsx` 2v2 モバイルレスポンシブ（styled + `min(45vw, 240px)` + `clamp()`）
- **A2**: ゲームパッドトースト Canvas 描画 + `CanvasLiveRegion` 転送
- **A3**: 内部語彙（`p2`/`p3`/`p4`）と表示（`2P`/`3P`/`4P`）分離 + `aria-label` 併用
- `TeamSetupScreen.tsx` — `aria-pressed` / `aria-disabled` + ゲームパッド接続数ガード

### 4. シナリオ補強（S9-S、Ch2 dialogue）
- **SC-01**: Stage 2-3 アキラの 2 回戦勝利補足
- **SC-02**: Stage 2-4 リクの 1 行追加（出演実体化）
- **SC-03**: Stage 2-4 ユウの祝辞挿入
- **SC-05**: Stage 2-3 preDialogue 並び替え
- **SC-08**: Stage 2-4 タクマの余韻追加
- **SC-09**: 冗長 `expression: 'normal'` 削除

### 5. パフォーマンス計測（S9-C1）
- `core/perf-probe.ts` — physics/ai/render の p50/p95/p99 + TBT + DPR + heap 計測
- `presentation/hooks/useGameLoop.ts` — `?perf=1` で計測有効化、`window.__ahPerfSnapshot` を expose
- `e2e/air-hockey-perf.spec.ts` + `npm run test:e2e:perf`

### 6. パフォーマンス最適化（S9-C2）
- C2-3: パーティクル上限動的化（2v2 時半減、フィーバー時 1.5x 許容）
- C2-4: マレット-マレット衝突の AABB 事前除外

### 7. ビジュアル品質（S9-B2）
- `scripts/air-hockey/audit-portrait-fringe.ts` — 半透明境界ピクセル + 白フリンジ/黒ずみ検出
- `npm run audit:portrait` で 22 ファイル走査（処理前 6 NG / 処理後 22/22 OK）
- `public/assets/portraits/{kanata,riku,shion}-{happy,normal}.png` — 黒ずみ除去

### 8. ドキュメント
- `.docs/ah-20260419-01/` — plan / spec / tasks / review-log / summary / contrast-audit / portrait-audit
- `src/features/air-hockey/doc/{architecture,design-system,features,story-mode}.md` 更新
- `src/features/air-hockey/README.md` — フェーズ表に S9 追加 + 「未実装の機能」整理 + 「S9 で追加された基盤」節追加

## レビュー対応統計

| レビュアー | 回数 | 指摘数 | 全反映 |
|---|---|---|---|
| Codex | 5（内 2 回 Approve） | P1×8 + P2×3 | ✅ |
| Gemini | 2（Approve w/ Comments） | 高 2 + 中 4 + 低 2 | ✅ |
| Claude `/design-review` | 1 | Must Fix 4 + Rec 7 | ✅ |
| Claude `/scenario-review` | 1 | 高 2 + 中 5 + 低 3 | ✅ |

## テスト方法

- [ ] `npm run ci`（lint:ci + typecheck + test + build）が全パス
- [ ] `npm run audit:portrait` で 22/22 OK
- [ ] `npm run test:e2e -- e2e/air-hockey-visual.spec.ts` で TitleScreen × 4 viewport が VRT パス
- [ ] `?perf=1` 付きでローカル起動し、HUD に FPS/p99/TBT/DPR/heap が出ることを確認
- [ ] フリー対戦 1v1 / 2v2 / ストーリー Ch1+Ch2 / ペアマッチを 1 周プレイ
- [ ] ゲームパッド接続/切断でトーストが Canvas に出ることと、`aria-live` で読み上げられることを確認

## 残作業（別 PR / 後続セッション）

| 項目 | 内容 |
|---|---|
| S9-B1 カットイン目視 | `victory-ch2.png` / `yuu-vs.png` を他キャラと並べて確認、NG なら Nanobanana2 でリテイク |
| S9-C1-4 実機計測 | iPhone SE 2 (Safari) / Android (Chrome) で `?perf=1` 60 秒、`perf-baseline.md` に記録 |
| S9-C2 追加最適化 | 計測結果に基づく施策 1〜2 件を選定 |
| S9-Z 手動検証 | フリー対戦 / Ch1+Ch2 / 2P / ペアマッチ / デイリーの目視確認 |
| VRT 残スクショ | free-char-select / game の baseline を次回 `--update-snapshots` で生成 |
| ResultScreen VRT | `test.fixme` 解除に e2e モードでのスコア注入拡張が必要 |

## 規模

- **61 files changed / +4,628 / -159**
- 新規テストファイル 7 本 / 新規テストケース 約 80 件
- 既存テスト全パス（617 suites / 7918+ tests）
