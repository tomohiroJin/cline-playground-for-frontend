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

**残課題 → Phase S5-9 として計画化**:

| # | 指摘 | S5-9 タスク | 実装方針 |
|---|------|-----------|---------|
| DR-1 | VsScreen 2v2 レスポンシブ | S5-9-2 | `min()` で立ち絵サイズをビューポート依存に。`clamp()` でキャラ名縮小 |
| DR-2 | キャラ選択パネル開閉アニメ | S5-9-4 | `useRef` で高さ計測 → `max-height` 200ms ease-out |
| DR-3 | グリッド展開時の自動スクロール | S5-9-5 | `scrollIntoView` + reduced-motion 考慮 |
| DR-4 | ResultScreen チーム間区切り | S5-9-8 | チーム内 gap `8px`、チーム間 gap `24px` + VS 区切り |
| DR-5 | トグルのタッチターゲット | S5-9-6 | `minHeight: 32px` → `44px` |
| DR-6 | 1v1 の reduced-motion 漏れ | S5-9-1 | `CharacterPanel` に `prefersReducedMotion` Props 追加 |

### デザインシステム観点からの精査結果

**現状の課題**:
- 色定義が 312 箇所以上のコンポーネントに分散（renderer.ts, config.ts, 各コンポーネント）
- フォントサイズが `px` / `rem` 混在（10px〜72px まで 12 種類）
- スペーシングにトークン化されたスケールがない
- インラインスタイルで CSS の `@media` クエリが使えない制約

**S5-9 での対応方針**:
- インラインスタイルの制約内で `min()` / `clamp()` を活用（CSS @media 不要）
- `window.innerWidth` ベースのレイアウト切り替えは避ける（SSR 非対応・レンダリングコスト）
- `prefersReducedMotion` は `CharacterPanel` Props で伝播（コンポーネント境界を尊重）
- 色の一元管理（TEAM1_COLOR / TEAM2_COLOR 等）は既存の定数パターンを踏襲

**将来的な改善余地（S5-9 スコープ外）**:
- CSS カスタムプロパティによるゲーム UI テーマトークンの導入
- `styled-components` の `ThemeProvider` でデザイントークン注入
- フォントサイズ・スペーシングのスケール定義と一元管理

### シナリオレビュー指摘（2026-03-28）

ゲームフロー（画面遷移・状態管理）のシナリオ整合性を検証し、以下の問題を検出した。

| # | カテゴリ | 問題 | 重要度 | S5-9 対応 |
|---|---------|------|--------|----------|
| SR-1 | デッドエンド | 2v2 ResultScreen → TeamSetupScreen への戻り導線がない | **高** | S5-9-9 で「チーム設定に戻る」ボタン追加 |
| SR-2 | フラグ整合 | 2v2 リプレイ時に設定が暗黙保持される（意図が UI 上で不明確） | 中 | S5-9-12 でラベルを「同じ設定でリプレイ」に変更 |
| SR-3 | 偽りの選択肢 | P2 CPU 時のキャラ選択が AI プロファイルに反映されない | 中 | 将来対応（ally CPU に `buildFreeBattleAiConfig` 適用） |
| SR-4 | 到達不能パス | 2v2 で `onBackToCharacterSelect` が undefined（2P との非対称性） | 中 | SR-1 と合わせて対応 |
| SR-5 | 状態リセット | ペアマッチ中断時に `resetToFree` で全設定がリセットされる | 低 | 将来対応（確認ダイアログ検討） |
| SR-6 | 情報欠如 | VsScreen 2v2 で P2 が CPU か人間かの表示がない | 低 | S5-9-11 でラベル追加 |

---

## Phase S5-10: ゲームプレイ品質改善（2026-03-28）

### 発見された問題

| # | 問題 | 種別 | 原因 |
|---|------|------|------|
| GP-1 | 味方 CPU が相手陣地に移動して 3 対 1 になる | バグ | `updateExtraMalletAI` → `CpuAI` が CPU 側（上半分）のゾーン制約をハードコード。ally は下半分に制約されるべき |
| GP-2 | マレット同士が重なる | 機能不足 | マレット間の衝突判定が未実装。パック・アイテムとの衝突のみ |
| GP-3 | 人間同士（P1+P2）のとき WASD で P1 も動く | バグ | `applyKeyboardMovement` が playerSlot を区別せず、KEY_MAP が矢印+WASD 両方を含む |
| GP-4 | CPU の動きが全員同じでキャラ個性がない | 機能不足 | ally/enemy に同じ `effectiveAiConfig` を使用。キャラ別 AI プロファイル未反映 |

### GP-1: ally CPU のゾーン制約修正

**原因**: `CpuAI.updateWithBehavior` 内の Y 座標クランプ `clamp(target.y, 50, H/2 - 50)` が常に上半分を前提としている。

**修正方針**:
- `updateExtraMalletAI` に `team: 'player' | 'cpu'` パラメータを追加
- ally（player チーム）は Y 座標を `H/2 + 50` 〜 `H - 50`（下半分）に制約
- enemy（cpu チーム）は従来通り `50` 〜 `H/2 - 50`（上半分）に制約
- または `getPlayerZone` で取得したゾーンを AI に渡してクランプ

**影響ファイル**: `core/pair-match-logic.ts`, `core/ai.ts`

### GP-2: マレット間衝突判定の追加

**修正方針**:
- 4 マレット間の全ペア（最大 6 組）に対して距離判定を実行
- 重なり検出時、2 つのマレットを距離が `MALLET_RADIUS * 2` になるまで押し戻す
- 既存の `resolveMalletPuckOverlap` を参考に `resolveMalletMalletOverlap` を実装
- 押し戻し方向: 中心間ベクトルに沿って均等に分離

**影響ファイル**: `core/entities.ts` or `core/physics.ts`, `presentation/hooks/useGameLoop.ts`

### GP-3: P1/P2 キーマッピング分離

**原因**: `useKeyboardInput` の `KEY_MAP` が矢印キーと WASD の両方を含み、`applyKeyboardMovement` が常に `game.player` を更新する。

**修正方針**:
- P1 用キーマッピング: **矢印キーのみ**（↑↓←→）
- P2 用キーマッピング: **WASD**（既存の `player2KeysRef` で使用中）
- `useKeyboardInput` の `KEY_MAP` から WASD を除外（2v2 の P2 入力は別系統で処理済み）
- 2P 対戦時の既存 `PLAYER2.KEY_MAP`（WASD）との互換性を維持

**影響ファイル**: `hooks/useKeyboardInput.ts`, `core/keyboard.ts`

### GP-4: キャラ別 AI プロファイル反映

**原因**: `effectiveAiConfig` が 1 つだけ生成され、ally/enemy/cpu 全員に同じ設定が適用される。

**修正方針**:
- ally CPU 用: `buildFreeBattleAiConfig(difficulty, allyCharacter.id)` で生成
- enemy1（P3）用: `buildFreeBattleAiConfig(difficulty, enemyCharacter1.id)` で生成
- enemy2（P4）用: `buildFreeBattleAiConfig(difficulty, enemyCharacter2.id)` で生成
- cpu（P3）の既存 AI にも enemyCharacter1 の ID を反映
- キャラ ID を `useGameLoop` の config に渡す

**影響ファイル**: `presentation/hooks/useGameLoop.ts`, `presentation/AirHockeyGame.tsx`
