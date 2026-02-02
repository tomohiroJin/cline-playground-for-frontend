# タスク一覧・進捗管理（IPNE MVP1）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ0: リネーム・テスト準備 | ✅ 完了 | 4/4 |
| フェーズ1: 自動生成迷路コア | ✅ 完了 | 5/5 |
| フェーズ2: 自動マッピング | ✅ 完了 | 4/4 |
| フェーズ3: ゲーム画面統合 | ✅ 完了 | 3/3 |
| フェーズ4: 調整・検証 | ⚠️ 一部完了 | 2/6 |
| フェーズ5: 動作確認FB対応 | ✅ 完了 | 5/5 |
| フェーズ6: UI/操作性改善 | ✅ 完了 | 4/4 |
| フェーズ6.5: 追加UI調整 | ✅ 完了 | 2/2 |
| **合計** | **94%** | **29/32** |

---

## フェーズ0: リネーム・テスト準備（TDD起点）

- [x] `ipne-mvp0` → `ipne` にリネーム
  - [x] `src/pages/IpneMvp0Page.tsx` → `IpnePage.tsx`
  - [x] `src/features/ipne-mvp0/` → `src/features/ipne/`
  - [x] `src/App.tsx` のルートを `/ipne-mvp0` → `/ipne` に変更
  - [x] GameListのカードリンク先を更新
- [x] `src/features/ipne/` に迷路生成テスト雛形を追加
- [x] 自動マッピングテスト雛形を追加（探索状態/表示切替）
- [x] `npm test` でリネーム後の既存テストが通ることを確認

---

## フェーズ1: 自動生成迷路コア

- [x] `src/features/ipne/types.ts` を拡張（迷路生成用の型追加）
- [x] `src/features/ipne/mazeGenerator.ts` を作成
  - [x] BSP（Binary Space Partitioning）アルゴリズム実装
  - [x] 部屋生成ロジック（5〜10部屋）
  - [x] 通路生成ロジック（部屋間接続）
  - [x] ループ追加ロジック（0〜2箇所）
- [x] `src/features/ipne/pathfinder.ts` を作成
  - [x] BFS による到達可能性検証
  - [x] スタート→ゴール間の最遠距離計算
- [x] スタート/ゴール配置ロジック実装
  - [x] スタート：外周付近の部屋に配置
  - [x] ゴール：最遠地点に配置
- [x] 迷路サイズ調整（1、2分規模：60x60〜80x80）
  > 実装値: 70x70、maxDepth=5（8-32部屋）、corridorWidth=3、loopCount=2（Phase 5で更新）

---

## フェーズ2: 自動マッピング

- [x] `src/features/ipne/autoMapping.ts` を作成
  - [x] 探索状態管理（未探索/探索済み/可視）
  - [x] プレイヤー移動時の探索状態更新
- [x] マップ描画ロジック実装
  - [x] 通過済み通路を線で描画（十字線で表現）
  - [x] 通過済み部屋を塗りつぶしで描画（十字線で表現）
  - [x] 現在位置マーカー描画（円形マーカー）
  - [x] ゴール位置描画（発見後のみ、正方形）
- [x] 半透明オーバーレイ描画（不透明度50〜70%）
  > 実装値: 70%（rgba(0, 0, 0, 0.7)）
- [x] マップ表示切替UI実装
  - [x] PC：`M` キーで切替
  - [x] モバイル：アイコンタップで切替（🗺️ボタン）

---

## フェーズ3: ゲーム画面統合

- [x] 既存の `IpnePage.tsx` に自動生成迷路を統合
  > createMap()による自動生成、initExploration()による探索状態管理を統合
- [x] 自動生成迷路の Canvas 描画実装
  - [x] 床・壁・通路の描画（抽象ファンタジー遺跡カラー）
    > 床: #1f2937、壁: #374151、ゴール: #10b981、プレイヤー: #667eea
  - [x] ゴールの視覚的強調
- [x] マップオーバーレイの統合
  - [x] 常時表示モード（右上小窓）
    > 右上200x200px
  - [x] 全画面モード（画面中央）
    > 画面中央80%サイズ、Mキーで切替

---

## フェーズ4: 調整・検証

### 技術調整

- [x] 迷路難易度調整
  - [x] サイズ調整（広すぎ/狭すぎの調整）
    > 70x70に設定（プレイ時間1-2分を想定）
  - [x] ループ数調整（迷い具合の調整）
    > loopCount=1に設定
  - [x] 部屋数調整
    > maxDepth=4で5-16部屋を生成
- [x] `npm test` 実行で全体パスを確認
  > ✅ 38テストスイート、228テスト全てパス（Phase 5完了後）

### プレイ体験検証（手動）

> **MVP1の本質：「プレイヤーが自分で把握しようとするか」を検証**

- [x] プレイ時間計測（目標：1、2分程度）
  > ⚠️ 要手動テスト
- [x] マップ使用頻度の確認
  - [x] マップ表示回数ログ機能の実装（任意）
  - [x] 2〜3回連続プレイしてマップ使用状況を観察
  > ⚠️ 要手動テスト
- [x] 以下の評価観点をチェック
  - [x] マップを何回開いたか
  - [x] ゴールまで直進できたか
  - [x] 迷って引き返す行動があったか
  - [x] 一本道に感じたか／迷路に感じたか
  > ⚠️ 要手動テスト

### NG例の確認

- [x] 迷路が広すぎてダレる → サイズ縮小
- [x] 一本道すぎて迷わない → ループ追加/構造変更
- [x] マップを見なくてもクリアできる → 複雑化
> ⚠️ プレイ体験検証後に判断

---

## フェーズ5: 動作確認フィードバック対応

> 手動テストで発見された5つの問題に対応

### 5.1 ビューポート/カメラシステム（課題#2, #3対応）

- [x] `src/features/ipne/viewport.ts` 新規作成
  - [x] `Viewport` 型定義（x, y, width, height, tileSize）
  - [x] `VIEWPORT_CONFIG` 定数（15x11タイル、48px固定）
    > Phase 5初期値は25x18/32px、Phase 6で15x11/48pxに調整
  - [x] `calculateViewport()` 関数実装
    - [x] プレイヤー中心配置
    - [x] マップ端でのクランプ処理
- [x] `src/features/ipne/viewport.test.ts` 新規作成
  - [x] ビューポート計算テスト
  - [x] 端クランプテスト
  > カバレッジ100%達成
- [x] `src/pages/IpnePage.tsx` Canvas描画更新
  - [x] ビューポート内タイルのみ描画
  - [x] プレイヤーをビューポート相対座標で描画
  - [x] タイルサイズ48px固定（Phase 6で更新）
- [x] `src/features/ipne/index.ts` エクスポート追加

### 5.2 ミニマップ位置調整（課題#1対応）

- [x] `src/features/ipne/autoMapping.ts` 修正
  - [x] 小窓モード位置を右上に固定（D-padと重ならない）
  - [x] プレイヤーマーカー最小サイズ保証（4px以上）
  - [x] プレイヤーマーカーに白い縁取りを追加（視認性向上）

### 5.3 迷路複雑化（課題#4対応）

- [x] `src/features/ipne/map.ts` DEFAULT_CONFIG 更新
  - [x] `maxDepth: 4 → 5`（部屋数増加）
  - [x] `loopCount: 1 → 2`（分岐増加）

### 5.4 デバッグモード（課題#5対応）

- [x] `src/features/ipne/debug.ts` 新規作成
  - [x] `isDebugMode()` 関数（URLパラメータ `?debug=1` 判定）
  - [x] `DebugState` 型定義（`showPanel` 追加）
  - [x] `initDebugState()` 関数
  - [x] `toggleDebugOption()` 関数
  - [x] `drawDebugPanel()` 関数（`showPanel` で表示制御）
  - [x] `drawCoordinateOverlay()` 関数
- [x] `src/features/ipne/pathfinder.ts` に `findPath()` 関数追加
  - [x] スタート→ゴールの最短経路を計算
- [x] `src/pages/IpnePage.tsx` デバッグUI追加
  - [x] `Shift+D` キーでデバッグパネル表示切替（移動キーと競合しない）
  - [x] `Shift+F` キーで迷路全体表示切替（実際に全体マップを描画）
  - [x] `Shift+C` キーで座標表示切替
  - [x] `Shift+P` キーでパス表示切替（実際に最短経路を描画）
- [x] `src/features/ipne/debug.test.ts` テスト追加
  - [x] toggleDebugOption のテスト（8テスト）

### 5.5 テスト・検証

- [x] 全テスト実行 `npm test`
  > ✅ 38テストスイート、228テスト全てパス
- [x] 手動動作確認
  - [x] プレイヤー周辺のみ表示される
  - [x] ゴールが最初から見えない
  - [x] プレイヤーが視認できる
  - [x] ミニマップがD-padと重ならない
  - [x] `/ipne?debug=1` でデバッグモード有効

---

## フェーズ6: UI/操作性改善

> Phase 5の手動テストでのフィードバック対応

### 6.1 ビューポートサイズ調整（課題#1対応）

- [x] `src/features/ipne/viewport.ts` 修正
  - [x] `tilesX: 25 → 15`（視界を狭くして探索感を増す）
  - [x] `tilesY: 18 → 11`（視界を狭くして探索感を増す）
  - [x] `tileSize: 32 → 48`（プレイヤーを見やすくするため拡大）
  - [x] Canvas解像度: 800x576px → 720x528px
- [x] `src/features/ipne/viewport.test.ts` テスト更新
  - [x] 新しい設定値に合わせてテスト修正

### 6.2 メイン画面位置調整（課題#2対応）

- [x] `src/pages/IpnePage.styles.ts` 修正
  - [x] `GameRegion`: `justify-content: flex-start` に変更
  - [x] `Canvas`: `max-height: 55vh`、`margin-top: 1rem`、`margin-bottom: auto` 追加
  - [x] D-padコントローラーとの重なりを回避

### 6.3 連続移動機能（課題#4対応）

- [x] `src/features/ipne/movement.ts` 新規作成
  - [x] `MovementConfig` 型定義（moveInterval, initialDelay）
  - [x] `DEFAULT_MOVEMENT_CONFIG` 定数（100ms間隔、150ms初回遅延）
  - [x] `MovementState` 型定義（activeDirection, pressStartTime, lastMoveTime, isRepeating）
  - [x] `getDirectionFromKey()` 関数実装
  - [x] `isMovementKey()` 関数実装
  - [x] `startMovement()` 関数実装
  - [x] `stopMovement()` 関数実装
  - [x] `updateMovement()` 関数実装
- [x] `src/features/ipne/movement.test.ts` 新規作成
  - [x] 設定値テスト
  - [x] キー→方向変換テスト
  - [x] 連続移動状態管理テスト
  > カバレッジ100%達成
- [x] `src/features/ipne/index.ts` エクスポート追加
- [x] `src/pages/IpnePage.tsx` 連続移動統合
  - [x] `requestAnimationFrame` ベースの連続移動処理
  - [x] 最初の1マスは即座に移動、その後連続移動
  - [x] キー押下継続で自動移動
  - [x] 壁に当たると連続移動が継続（壁で止まる）
- [x] `src/pages/IpnePage.test.tsx` モック更新
  - [x] `requestAnimationFrame` の無限ループ防止

### 6.4 デバッグモードドキュメント（課題#3対応）

- [x] `.docs/ipne/debug-mode.md` 新規作成
  - [x] 有効化方法（`/ipne?debug=1`）
  - [x] キーボードショートカット説明
  - [x] 各デバッグ機能の詳細

### 6.5 テスト・検証

- [x] 全テスト実行 `npm test`
  > ✅ 11テストスイート（ipne関連）、89テスト全てパス
- [x] TypeScriptコンパイル確認 `npx tsc --noEmit`
  > ✅ エラーなし
- [x] 手動動作確認
  - [x] メイン画面が大きくなり、迷路全体が見えない
  - [x] メイン画面とD-padが重ならない
  - [x] キー押し続けで連続移動できる
  - [x] 移動速度が適切（秒速10マス）

---

## フェーズ6.5: 追加UI調整（フィードバック対応）

> Phase 6の手動テストでの追加フィードバック対応

### 6.5.1 Canvas位置再調整（課題#1対応）

- [x] `src/pages/IpnePage.styles.ts` 修正
  - [x] `GameRegion`: `justify-content: flex-start` → `center` に戻す
  - [x] `GameRegion`: `gap: 1rem` 追加（CanvasとD-pad間の適切な間隔）
  - [x] `Canvas`: `margin-bottom: auto`、`margin-top: 1rem` 削除
  - [x] `Canvas`: `max-height: 55vh` → `60vh` に変更
  - [x] `ControlsContainer`: `position: absolute` → 削除（flexレイアウト内で配置）
  - [x] `ControlsContainer`: `flex-shrink: 0` 追加

### 6.5.2 D-pad連続移動対応（課題#2対応）

- [x] `src/pages/IpnePage.tsx` 修正
  - [x] `handleTouchMove` を `handleDPadPointerDown` と `handleDPadPointerUp` に分離
  - [x] `handleDPadPointerDown`: 押下時に最初の1マス即座移動＋連続移動状態開始
  - [x] `handleDPadPointerUp`: 離し時に連続移動状態停止
  - [x] 各D-padボタンに `onPointerUp`、`onPointerLeave`、`onPointerCancel` イベント追加
  - [x] キーボードと同じ連続移動ロジック（`movementStateRef`）を共用

### 6.5.3 テスト・検証

- [x] 全テスト実行 `npm test`
  > ✅ 31テストスイート全てパス
- [x] 手動動作確認
  - [X] CanvasとD-padの距離が適切
  - [x] D-pad押し続けで連続移動できる
  - [x] D-padから指を離すと移動が停止する

---

## 依存関係

```
フェーズ0 → フェーズ1 → フェーズ2 → フェーズ3 → フェーズ4 → フェーズ5 → フェーズ6 → フェーズ6.5
         ↘            ↗
           並行可能
```

- フェーズ0（リネーム・テスト準備）は最初に完了
- フェーズ1（迷路生成）とフェーズ2（マッピング）は一部並行可能
- フェーズ3（統合）はフェーズ1・2の完了後
- フェーズ4（調整・検証）は全フェーズ完了後
- **フェーズ5（FB対応）はフェーズ4の手動テスト後に実施**
- **フェーズ6（UI/操作性改善）はフェーズ5の手動テスト後に実施**
- **フェーズ6.5（追加UI調整）はフェーズ6の手動テスト後に実施**

---

## 注意事項

- **既存のMVP0コードを直接拡張・改修**（新規ページ追加ではない）
- 迷路生成は「迷うが詰まらない」を優先
- テストファーストで進める
- 評価観点（マップ使用頻度、迷い発生）を常に意識
