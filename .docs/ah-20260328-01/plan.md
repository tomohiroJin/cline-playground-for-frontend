# Air Hockey ペアマッチ完成版 — 実装計画

## 背景

Phase S4-1〜S4-8 でペアマッチ（2v2）の**ゲームロジック基盤**が完成した（2026-03-27）。
4マレット同時制御・衝突判定・AI・入力・描画は動作するが、**ユーザーがチーム構成やキャラクターを選んで遊べる状態になっていない**。

### 現在の問題点

| # | 問題 | 影響 |
|---|------|------|
| 1 | TeamSetupScreen がチーム構成を固定表示するだけ | キャラ選択・チーム構成変更ができない |
| 2 | VsScreen が 1v1 レイアウト固定 | 2v2 で 4 キャラを表示できない |
| 3 | useGameMode に P3/P4（敵チーム）のキャラ管理がない | 敵キャラが不明確なまま開始される |
| 4 | ResultScreen の 2v2 表示が最適化されていない | チーム表示名・キャラ情報が不正確 |
| 5 | 難易度設定が 2v2 用に調整されていない | CPU 難易度を選べない |

## 目標

> 「チーム構成を選び、キャラクターを選び、VS演出を見て、2v2で遊び、結果を確認する」
> — ペアマッチの一連のゲームフローを完成させる

### スコープ

**含む:**
- チーム構成の選択（人+CPU vs CPU+CPU を基本形に）
- 各スロットへのキャラクター割り当て UI
- VsScreen の 2v2 対応（4キャラ表示）
- ResultScreen の 2v2 最適化
- 2v2 用難易度設定
- 上記に対するテスト

**含まない:**
- 人+人 vs 人+人（4人同時操作）— 入力デバイス制約のため将来対応
- 1v2 / 2v1 ハンデ戦 — 別フェーズで対応
- ネットワーク対戦

## フェーズ構成

```
Phase S5-1: 状態管理の拡張（useGameMode + 型定義）
  → P3/P4 キャラクター・チーム構成の状態管理を追加
      ↓
Phase S5-2: TeamSetupScreen の機能拡充
  → キャラクター選択 UI、チーム構成選択、難易度設定
      ↓
Phase S5-3: VsScreen の 2v2 対応
  → 4 キャラ表示レイアウト、チーム vs チーム演出
      ↓
Phase S5-4: ゲーム開始フローの接続
  → TeamSetupScreen → VsScreen → Game の画面遷移を完成
      ↓
Phase S5-5: ResultScreen の 2v2 最適化
  → チーム表示名・キャラ情報・統計の 2v2 対応
      ↓
Phase S5-6: テスト・品質保証
  → 各フェーズのユニット・コンポーネントテスト
```

### Phase 間の依存関係

| 依存元 | 依存先 | 理由 |
|--------|--------|------|
| S5-1 | S5-2〜S5-5 | 状態管理が全画面の基盤 |
| S5-2 | S5-4 | TeamSetupScreen の出力をフロー接続で使用 |
| S5-3 | S5-4 | VsScreen の Props を接続で渡す |

## リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| TeamSetupScreen の UI 複雑化 | 中 | 段階的に構築、既存 FreeBattleCharacterSelect を参考 |
| VsScreen のレイアウト崩れ（4キャラ表示） | 中 | レスポンシブ対応、小画面でのフォールバック |
| 既存 1v1/2P フローへの影響 | 高 | 2v2 専用の分岐を明確化、既存テスト全パスを確認 |
| キャラクター重複選択 | 低 | バリデーションで防止 |

## 完了チェックリスト

- [x] すべてのフェーズが完了（S5-1〜S5-6: 2026-03-28）
- [x] 既存テスト全パス（85 スイート / 1226 テスト）
- [x] 型エラーなし（`tsc --noEmit`）
- [x] ESLint エラーなし
- [x] ビルド成功（`npm run build`）
- [x] ペアマッチの一連フロー（チーム設定 → VS → ゲーム → リザルト）が動作

---

## Phase S5-7: フィードバック対応（2026-03-28）

### 発見された問題

| # | 問題 | 種別 | 今回対応 |
|---|------|------|---------|
| FB-1 | P2（パートナー）が「CPU」表記だが人間操作になっている | バグ | **修正する** |
| FB-2 | P2 に人間を選択するオプションがない | 機能不足 | **修正する** |
| FB-3 | P3/P4（対戦相手）も人間が操作できると盛り上がる | 要望 | 将来対応 |
| FB-4 | ゲーム全体のパフォーマンスが低下してきた | 課題 | 将来対応 |

### FB-1 / FB-2: P2 の CPU/人間切り替え

**原因**: `useGameLoop.ts` の 2v2 入力処理（L500）で ally（P2）の CPU AI がスキップされ、
常に WASD/タッチで人間操作されるようにハードコードされている。

**修正方針**:
1. `useGameMode` に `allyControlType: 'cpu' | 'human'` state を追加（デフォルト: `'cpu'`）
2. `TeamSetupScreen` の P2 スロットに CPU/人間の切り替えトグルを追加
3. `useGameLoop` で `allyControlType` を参照し:
   - `'cpu'` → ally に CPU AI を適用（`updateExtraMalletAI` を使用）
   - `'human'` → 現在の WASD/タッチ入力を適用
4. P2 が CPU の場合、選択キャラの AI プロファイルで動作する

**影響範囲**:
- `presentation/hooks/useGameMode.ts` — state 追加
- `components/TeamSetupScreen.tsx` — トグル UI 追加
- `presentation/hooks/useGameLoop.ts` — ally の入力/AI 分岐
- `presentation/AirHockeyGame.tsx` — Props 受け渡し

### FB-3: P3/P4 の人間操作（将来対応）

**理由**: 4 人分の独立した入力系統が必要。現在のキーボード（矢印 + WASD）では 2 人が限界。
ゲームパッド対応やネットワーク入力を導入した後に対応するのが適切。

**次のステップ候補**:
- ゲームパッド API 対応（Gamepad API）
- 追加キーマッピング（IJKL 等）の検討
- ネットワーク対戦の基盤構築

### FB-4: パフォーマンス改善（将来対応）

**観測**: 4 マレット＋複数パックの同時処理でフレームレートが低下している可能性。

**次のステップ候補**:
- Chrome DevTools / React Profiler でボトルネック計測
- Canvas 描画の最適化（ダーティリージョン、オフスクリーンバッファ）
- 物理演算の最適化（空間分割、衝突判定の早期リターン）
- React の不要な再レンダリング削減（memo / useMemo の見直し）
- requestAnimationFrame のフレームスキップ戦略

---

## Phase S5-8: デザインレビュー指摘対応（2026-03-28）

### 発見された問題

| # | 指摘 | 分類 | 対象画面 |
|---|------|------|---------|
| MF-1 | キャラ選択グリッド展開時の自動スクロール不足 | 必須 | TeamSetupScreen |
| MF-2 | VsScreen 2v2 の小画面でキャラが重なる | 必須 | VsScreen |
| MF-3 | `prefers-reduced-motion` 未対応 | 必須 | VsScreen |
| R-1 | S5-7 CPU/人間トグルのビジュアル仕様不足 | 推奨 | TeamSetupScreen |
| R-2 | P1 スロットの「固定」表示がわかりにくい | 推奨 | TeamSetupScreen |
| R-3 | 2v2 リザルトに P2/P4 のキャラアイコンがない | 推奨 | ResultScreen |
| R-4 | チーム1/チーム2 の色分けが不明確 | 推奨 | TeamSetupScreen |
| S-1 | 難易度セクションの配置位置 | 提案 | TeamSetupScreen |
| S-2 | VsScreen 2v2 のチームラベル表示 | 提案 | VsScreen |
| S-3 | キャラ選択パネルの開閉アニメーション | 提案 | TeamSetupScreen |

### 修正方針

**MF-1: キャラ選択グリッド展開時の自動スクロール**
- グリッド展開時に `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` を実行
- 既存の排他制御（1 スロットのみ展開）と組み合わせて視認性を確保

**MF-2: VsScreen 2v2 の小画面対応**
- 2v2 時は立ち絵サイズを `min(128px, 20vw)` / `min(256px, 40vw)` に縮小
- 画面幅 480px 以下では 2 段レイアウト（チーム1 上段 / VS / チーム2 下段）に切り替え

**MF-3: `prefers-reduced-motion` 対応**
- `window.matchMedia('(prefers-reduced-motion: reduce)')` を検出
- reduced-motion 時はスライドイン・バウンスをスキップし即座に表示
- フェードアウト → onComplete の遷移のみ短縮して維持

**R-1: CPU/人間トグルのビジュアル**（S5-7 と同時実装）
- セグメントコントロール（`[CPU | 人間]`）を P2 スロット行内に配置
- 選択中: アクセントカラー（`#e67e22`）背景、未選択: グレー
- タッチターゲット 44x44px 以上確保
- 「人間」選択時: 操作ヒント `WASD / タッチ` を表示

**R-2: P1 固定スロットの改善**
- `opacity: 0.7` → `opacity: 1` に変更、代わりに「あなた」ラベルを強調
- `cursor: default` に設定（not-allowed は不適切）

**R-3: ResultScreen 2v2 キャラアイコン 4 体表示**
- 2v2 時のキャラ立ち絵エリアを 4 分割: チーム1（P1+P2）/ チーム2（P3+P4）
- `allyCharacter` / `enemyCharacter2` を ResultScreen に渡す

**R-4: チーム色分け**
- チーム1 セクション: 左ボーダー `#3498db`（プレイヤーカラー青系）
- チーム2 セクション: 左ボーダー `#e74c3c`（敵カラー赤系）
- タイトル色もチームカラーに対応

**S-1: 難易度セクションの配置**
- チーム構成の上に移動（難易度 → チーム1 → チーム2 → 開始）

**S-2: VsScreen チームラベル**
- VS テキストの左右に小さく「チーム1」「チーム2」ラベルを表示

**S-3: キャラ選択パネルの開閉アニメーション**
- `max-height` + `overflow: hidden` で 200ms ease-out アニメーション

**影響範囲**:
- `components/TeamSetupScreen.tsx` — MF-1, R-1, R-2, R-4, S-1, S-3
- `components/VsScreen.tsx` — MF-2, MF-3, S-2
- `components/ResultScreen.tsx` — R-3
- `presentation/AirHockeyGame.tsx` — R-3（Props 受け渡し）

### S5-8 実装結果と残課題（2026-03-28）

**対応済み**: MF-3, R-1, R-2, R-3, R-4, S-1, S-2

**残課題（将来フェーズで対応）**:

| # | 指摘 | 対象 | 内容 |
|---|------|------|------|
| DR-1 | VsScreen 2v2 のレスポンシブ対応 | VsScreen | 立ち絵サイズが固定（256px×4=1024px）でモバイル画面ではみ出す。`min()` での縮小、480px 未満で縦並びレイアウトが必要 |
| DR-2 | キャラ選択パネルの開閉アニメーション | TeamSetupScreen | `max-height` + `overflow: hidden` で 200ms ease-out。現在は即座に表示/非表示 |
| DR-3 | グリッド展開時の自動スクロール | TeamSetupScreen | `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` 未実装 |
| DR-4 | ResultScreen 2v2 立ち絵のチーム間区切り | ResultScreen | 4 体が等間隔で横並びのため、チーム1/チーム2 の境界が不明瞭。gap の差別化または VS マークが必要 |
| DR-5 | CPU/人間トグルのタッチターゲット | TeamSetupScreen | 現在 `minHeight: 32px`、仕様では 44px 以上 |
| DR-6 | VsScreen 1v1 レイアウトの `prefersReducedMotion` 漏れ | VsScreen | `CharacterPanel` 内の `transition` が 1v1 レイアウトでは常に有効 |
