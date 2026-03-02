# Phase 3 フィードバック Round 2 — ランダムイベントシステム

## 概要

Phase 3 フィードバック対応（FB-P3-1, FB-P3-2, FB-P3-4）実装後の再テストで受領したフィードバック。

---

## フィードバック項目

### FB-P3-R2-1: ランダム進化の結果が具体的に表示されない

- **優先度**: 🔴 すぐに対応
- **理由**: 「ランダムな進化を獲得!」という汎用メッセージしか表示されず、実際に何の進化を得たのかプレイヤーが把握できない。イベント結果フィードバック（FB-P3-1）の改善効果が半減している
- **現状の問題**:
  - `formatEventResult` は `random_evolution` に対して常に `🧬 ランダムな進化を獲得!` を返す
  - 実際の進化適用は `applyEventChoice` 内で行われるが、`formatEventResult` の呼び出し時点では結果が未確定
  - オーバーレイ表示（`showOverlay`）→ ディスパッチ（`CHOOSE_EVENT`）の順序のため、結果表示時にはまだ効果が適用されていない
- **対応方針**:
  - コスト適用 + イベント効果適用をまとめた `computeEventResult(run, choice)` 関数を新規作成
  - 戻り値に `{ nextRun, evoName? }` を含め、進化名を取得可能にする
  - `formatEventResult` に進化名の引数を追加
  - PrimalPathGame で先に `computeEventResult` を呼び、結果からオーバーレイを生成してから遷移
  - reducer に `APPLY_EVENT_RESULT` アクションを追加し、事前計算済みの run を直接適用

---

## 優先度まとめ

| 優先度 | 項目 | 作業規模 |
|--------|------|---------|
| 🔴 すぐに | FB-P3-R2-1: ランダム進化の結果表示 | 中（game-logic + hooks + PrimalPathGame 変更） |
