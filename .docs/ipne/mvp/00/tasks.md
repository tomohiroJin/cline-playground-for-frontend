# タスク一覧・進捗管理（IPNE MVP0）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ0: テスト準備 | 完了 | 4/4 |
| フェーズ1: 画面骨組み | 完了 | 4/4 |
| フェーズ2: ゲームコア | 完了 | 5/5 |
| フェーズ3: UI統合 | 完了 | 6/6 |
| フェーズ4: 調整・確認 | 完了 | 4/4 |
| **合計** | **100%** | **23/23** |

---

## フェーズ0: テスト準備（TDD起点）

- [x] `src/pages/IpneMvp0Page.test.tsx` を追加（タイトル/プロローグ/aria）
- [x] `src/pages/GameListPage.test.tsx` のカード数を 8 に更新
- [x] ロジックテスト雛形を追加（移動/衝突/ゴール）
- [x] 固定マップ生成テストを追加（サイズ・開始/ゴール位置）

---

## フェーズ1: 画面骨組み

- [x] `src/pages/IpneMvp0Page.tsx` を作成
- [x] タイトル → プロローグ → ゲーム → クリア の遷移実装
- [x] `IpneMvp0Page.styles.ts` を追加（既存UIの雰囲気に合わせる）
- [x] ゲーム領域に `role="region"` / `aria-label` を付与

---

## フェーズ2: ゲームコア（固定迷路）

- [x] `src/features/ipne-mvp0/` に純粋ロジックを分離
- [x] プレイヤー移動ロジック実装（WASD/矢印）
- [x] 壁衝突判定を実装
- [x] ゴール接触判定を実装
- [x] 2〜3分規模の固定マップを実装

---

## フェーズ3: UI統合

- [x] `src/App.tsx` に `/ipne-mvp0` ルートを追加（lazy import）
- [x] `src/pages/GameListPage.tsx` にカード追加
- [x] カード用画像 `src/assets/images/ipne_mvp0_card_bg.webp` を追加
- [x] タイトル画面用画像 `src/assets/images/ipne_mvp0_title_bg.webp` を追加
- [x] プロローグ画面用画像 `src/assets/images/ipne_mvp0_prologue_bg.webp` を追加
- [x] `src/pages/GameListPage.test.tsx` の画像モックを更新

---

## フェーズ4: 調整・確認

- [/] モバイル操作要件（連続移動・優先順位・幾何学4分割）の修正
- [/] ARIA Role (`role="region"`) の修正
- [/] レイアウト（Flex）とOpacityの修正
- [/] `npm test` 実行で全体パスを確認
