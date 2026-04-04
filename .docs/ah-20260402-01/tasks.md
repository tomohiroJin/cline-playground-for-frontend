# Air Hockey — VsScreen ラベル・トースト通知・Canvas 描画最適化 タスク一覧

> 凡例: ⬜ 未着手 / 🔄 作業中 / ✅ 完了 / ⏭️ スキップ

---

## Phase 1: VsScreen P3/P4 操作タイプラベル（S7-1）

### S7-1-1: VsScreen Props 拡張

- ✅ S7-1-1a: `VsScreenProps` に `enemy1ControlType` / `enemy2ControlType` を追加（optional）
- ✅ S7-1-1b: テスト追加 — `enemy1ControlType='cpu'` で P3 に「CPU」ラベル表示
- ✅ S7-1-1c: テスト追加 — `enemy1ControlType='human'` で P3 に「3P」ラベル表示
- ✅ S7-1-1d: テスト追加 — `enemy2ControlType='cpu'` で P4 に「CPU」ラベル表示
- ✅ S7-1-1e: テスト追加 — `enemy2ControlType='human'` で P4 に「4P」ラベル表示
- ✅ S7-1-1f: テスト追加 — controlType が `undefined` の場合ラベル非表示

### S7-1-2: VsScreen ラベル描画実装

- ✅ S7-1-2a: 2v2 レイアウトの P3 `CharacterPanel` に `label` prop を接続
- ✅ S7-1-2b: 2v2 レイアウトの P4 `CharacterPanel` に `label` prop を接続
- ✅ S7-1-2c: ラベル文字列変換ロジック実装（`resolveControlLabel` ヘルパー）
- ✅ S7-1-2d: ラベルスタイル変更 — サイズ `10px` → `12px` に拡大（R-1）
- ✅ S7-1-2e: 人間操作ラベルにチームカラー着色（Team1: `#3498db` / Team2: `#e74c3c`）（R-1）
- ✅ S7-1-2f: CPU ラベルは `#888` 控えめグレーで統一（R-1）

### S7-1-3: データフロー接続

- ✅ S7-1-3a: `AirHockeyGame.tsx` の VsScreen 呼び出しに `enemy1ControlType` を追加
- ✅ S7-1-3b: `AirHockeyGame.tsx` の VsScreen 呼び出しに `enemy2ControlType` を追加
- ✅ S7-1-3c: `useGameMode` から取得した値が正しく伝搬されることを確認

### S7-1-4: 検証

- ✅ S7-1-4a: 既存 VsScreen テスト全パス確認（38/38）
- ✅ S7-1-4b: ESLint / TypeScript エラー 0 確認
- ✅ S7-1-4c: 手動確認 — フリー対戦 VS 画面でラベル非表示
- ✅ S7-1-4d: 手動確認 — 2v2 VS 画面で P3/P4 ラベル正常表示（ゲームパッド実機で確認済み）

---

## Phase 2: ゲームパッド接続/切断トースト通知（S7-2）

### S7-2-1: ui-renderer にトースト描画メソッド追加

- ✅ S7-2-1a: `UIRenderer.drawToast()` メソッドのシグネチャ定義
- ✅ S7-2-1b: テスト追加 — toast が `undefined` の場合、描画関数が呼ばれない
- ✅ S7-2-1c: テスト追加 — toast が有効な場合、背景矩形とテキストが描画される
- ✅ S7-2-1d: テスト追加 — 表示期間を過ぎた toast は描画されない
- ✅ S7-2-1e: テスト追加 — フェードアウト期間中に opacity が減少する
- ✅ S7-2-1f: テスト追加 — 接続メッセージで緑背景 `rgba(0,128,0,0.8)` が使用される（SG-1）
- ✅ S7-2-1g: テスト追加 — 切断メッセージで赤背景 `rgba(128,0,0,0.8)` が使用される（SG-1）
- ✅ S7-2-1h: テスト追加 — 背景幅が `measureText` ベースの動的計算になっている（R-2）
- ✅ S7-2-1i: `drawToast` 実装 — 経過時間計算 + 表示期間チェック
- ✅ S7-2-1j: `drawToast` 実装 — フェードアウト opacity 計算
- ✅ S7-2-1k: `drawToast` 実装 — 接続/切断判定 → 背景色選択（SG-1）
- ✅ S7-2-1l: `drawToast` 実装 — `measureText` で背景幅を動的算出（R-2）
- ✅ S7-2-1m: `drawToast` 実装 — 角丸矩形背景描画（Y 座標: `H - 100`）（MF-2）
- ✅ S7-2-1n: `drawToast` 実装 — テキスト描画（フォントフォールバック含む）（MF-1）

### S7-2-2: canvas-renderer Facade 拡張

- ✅ S7-2-2a: `CanvasRenderer` に `drawToast()` の委譲メソッドを追加
- ✅ S7-2-2b: テスト — Facade 経由で描画が委譲される（既存テストに統合）

### S7-2-3: ゲームループとの接続

- ✅ S7-2-3a: `useGameLoop` の描画フェーズに `Renderer.drawToast(ctx, toast, now)` を追加
- ✅ S7-2-3b: `useGamepadInput` → `AirHockeyGame` → `useGameLoop` の `config.gamepadToast` で伝搬
- ✅ S7-2-3c: toast 描画は drawShockwave の後、showHelp の前（HUD より後、ヘルプの下）

### S7-2-4: 検証

- ✅ S7-2-4a: 既存テスト全パス確認（33/33）
- ✅ S7-2-4b: TypeScript エラー 0 確認
- ✅ S7-2-4c: 手動確認 — ゲームパッド接続時にトースト表示（実機確認済み）
- ✅ S7-2-4d: 手動確認 — ゲームパッド切断時にトースト表示（実機確認済み）
- ✅ S7-2-4e: 手動確認 — 3 秒後にフェードアウトして消える（実機確認済み）

---

## Phase 3: Canvas 描画最適化（S7-3）

### S7-3-1: ベースライン計測

- ⬜ S7-3-1a: 2v2 モード（全 CPU）で 30 秒間の平均 FPS をベースラインとして記録
- ⬜ S7-3-1b: Chrome DevTools Performance で描画フェーズのボトルネックを特定

### S7-3-2: quickReject を processCollisions に統合（S7-3a）

- ✅ S7-3-2a: processCollisions はクロージャ内関数のため統合テストで担保（604スイート全パス）
- ✅ S7-3-2b: 近距離衝突の正常動作は既存物理テストで確認済み
- ✅ S7-3-2c: `processCollisions` 内の detectCollision 前に `quickReject` を挿入
- ✅ S7-3-2d: `QUICK_REJECT_MARGIN = 2` を名前付き定数として定義（R-3）
- ✅ S7-3-2e: `maxDist` = `radius + effectiveMR + QUICK_REJECT_MARGIN`（bigScale/comebackScale 反映）
- ✅ S7-3-2f: 既存テスト全パス確認（604スイート / 7704テスト）

### S7-3-3: 破壊済み障害物の描画スキップ（S7-3b）

- ⏭️ S7-3-3a〜c: 既に field-renderer.ts:129-142 で実装済み（destroyed 時は早期 return + リスポーンブリンクのみ描画）

### S7-3-4: パーティクル描画のバッチ最適化（S7-3c）

- ✅ S7-3-4a: テスト追加 — パーティクル数 0 の場合 arc が呼ばれない
- ✅ S7-3-4b: effect-renderer + renderer.ts の drawParticles に早期リターンを追加
- ⏭️ S7-3-4c: バッチ描画 — 現状のパーティクル色は各個固有（alpha 依存）のためバッチ化の効果が薄い。スキップ
- ✅ S7-3-4d: 既存パーティクルテスト全パス確認

### S7-3-5: ctx.save/restore の最小化（S7-3d）

- ⏭️ S7-3-5a〜c: 調査の結果、drawHUD は save/restore 未使用。drawCombo/drawCountdown は scale/translate のため必須。削除可能な箇所なし

### S7-3-6: 最適化効果計測

- ⬜ S7-3-6a: 最適化後の 2v2 モード平均 FPS を計測
- ⬜ S7-3-6b: ベースラインとの比較結果を記録
- ✅ S7-3-6c: S7-3-3(障害物), S7-3-4c(バッチ), S7-3-5(save/restore) はスキップ判断済み

### S7-3-7: 最終検証

- ✅ S7-3-7a: 全テストスイート 604 スイート / 7704 テスト全パス
- ✅ S7-3-7b: ESLint エラー 0 / TypeScript エラー 0
- ✅ S7-3-7c: `npm run ci` 全パス確認（lint:ci + typecheck + test + build）
- ✅ S7-3-7d: 手動確認 — 全モードで正常動作（フリー対戦・ストーリー・2P・ペアマッチ）確認済み

---

## Phase 4: コードレビュー指摘対応 + ゲームパッド修正（S7-4）

### S7-4-1: コードレビュー指摘対応

- ✅ S7-4-1a: `Renderer.drawToast` から未使用の `consts` パラメータを削除（S-1）
- ✅ S7-4-1b: VsScreen テストの CPU ラベルを `getAllByText` + `toHaveLength(1)` に堅牢化（S-2）
- ✅ S7-4-1c: `canvas-renderer.test.ts` で `canvasRenderer` 変数を追加しキャストを解消（R-2）

### S7-4-2: ゲームパッドインデックス修正

- ✅ S7-4-2a: `GAMEPAD_INDEX` を `{ P2: 0, P3: 1, P4: 2 }` → `{ P3: 0, P4: 1 }` に変更（P2 は WASD 固定のため不要）
- ✅ S7-4-2b: P3 有効化条件を `gamepadConnected >= 2` → `>= 1` に修正
- ✅ S7-4-2c: P4 有効化条件を `gamepadConnected >= 3` → `>= 2` に修正
- ✅ S7-4-2d: ゲームパッド2台で P3/P4 両方が人間に切り替え可能なことを実機確認

### S7-4-3: TeamSetupScreen UI 統一 + ラベル改善

- ✅ S7-4-3a: `EnemyControlToggle`（P3/P4 専用）と P2 インライントグルを共通 `ControlToggle` に統一
- ✅ S7-4-3b: P1 ラベルを `あなた（矢印キー / マウス）` → `⌨️ 矢印キー / 🖱️ マウス` に変更
- ✅ S7-4-3c: P2 ラベルを `パートナー（CPU/人間）` → `CPU` / `⌨️ WASD / 👆 タッチ` に変更
- ✅ S7-4-3d: P3 ラベルを `敵1（CPU/🎮）` → `CPU` / `🎮 コントローラー 1` に変更
- ✅ S7-4-3e: P4 ラベルを `敵2（CPU/🎮）` → `CPU` / `🎮 コントローラー 2` に変更
- ✅ S7-4-3f: 不要になった `controlHint` スタイルを削除
- ✅ S7-4-3g: TeamSetupScreen テストを更新（操作タイプトグルの統一テスト）

### S7-4-4: 検証

- ✅ S7-4-4a: `npm run ci` 全パス確認（lint:ci + typecheck + test + build）
- ✅ S7-4-4b: 手動確認 — ペアマッチ設定画面の P2/P3/P4 トグル統一表示
- ✅ S7-4-4c: 手動確認 — P3 ゲームパッド操作正常動作
- ✅ S7-4-4d: 手動確認 — P4 ゲームパッド2台目で切り替え・操作可能
