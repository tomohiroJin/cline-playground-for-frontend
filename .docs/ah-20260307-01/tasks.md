# Air Hockey ブラッシュアップ タスクリスト

## Phase 1: 基盤改善＋ゲームフィール強化

### 1.0 レスポンシブデザイン対応

#### 定数・型の整理
- [ ] `core/types.ts` から `CanvasSize` 型を削除
- [ ] `core/types.ts` から `SizeConfig` 型を削除
- [ ] `core/constants.ts` の `SIZE_CONFIGS` を削除
- [ ] `core/constants.ts` の `getConstants(size)` 関数を `CONSTANTS` 定数オブジェクトに置換（解像度 450x900 固定）
- [ ] `core/constants.ts` の `GameConstants` 型定義はそのまま維持
- [ ] `core/config.ts` から `SIZE_OPTIONS` を削除
- [ ] `core/config.ts` の障害物座標を 450x900 スケールに更新（x1.5 換算）

#### CSS レスポンシブ化
- [ ] `styles.ts` の `GameCanvas` を `width: 100%` + `max-width: 450px` + `aspect-ratio: 1 / 2` + `max-height: calc(100vh - 100px)` に変更
- [ ] `styles.ts` の `ScoreBoardContainer` の `max-width` を `450px` に変更し `width: 100%` を追加
- [ ] `styles.ts` の `MenuCard` の `max-width` を `450px` に統一（任意）

#### コンポーネントから canvasSize を除去
- [ ] `components/Field.tsx` から `canvasSize` プロップを削除、Canvas の width/height を固定値に
- [ ] `components/TitleScreen.tsx` から Size 選択セクション（ButtonGroup + SIZE_OPTIONS）を完全削除
- [ ] `components/TitleScreen.tsx` から `canvasSize` / `setCanvasSize` プロップを削除
- [ ] `AirHockeyGame.tsx` から `canvasSize` state と関連する useState を削除
- [ ] `AirHockeyGame.tsx` の `startGame` / `useInput` / `useGameLoop` 呼び出しから `canvasSize` 引数を削除
- [ ] `AirHockeyGame.tsx` の TitleScreen / Field への `canvasSize` プロップ渡しを削除

#### フック・ロジックから canvasSize を除去
- [ ] `hooks/useInput.ts` から `canvasSize` パラメータを削除、`CONSTANTS` を直接参照
- [ ] `hooks/useGameLoop.ts` から `canvasSize` パラメータを削除、`CONSTANTS` を直接参照
- [ ] `core/entities.ts` の `getConstants()` 呼び出しを `CONSTANTS` に置換
- [ ] `core/physics.ts` の `getConstants()` 呼び出しを `CONSTANTS` に置換
- [ ] `core/ai.ts` の `getConstants()` 呼び出しを `CONSTANTS` に置換
- [ ] `renderer.ts` の全 `getConstants()` 呼び出しを `CONSTANTS` に置換

#### テスト更新
- [ ] `core/entities.test.ts` の `getConstants()` 参照を `CONSTANTS` に更新
- [ ] `core/Physics.test.ts` の `CONSTANTS` 参照を更新（解像度 450x900 前提に）
- [ ] `core/AI.test.ts` の `getConstants()` 呼び出しを `CONSTANTS` に更新
- [ ] `AirHockeyPage.test.tsx` の Size 選択関連テストがあれば削除
- [ ] 全既存テストがパスすることを確認

#### 動作確認
- [ ] スマートフォン幅（375px）で Canvas が画面幅いっぱいに表示されることを確認
- [ ] タブレット幅（768px）で適切なサイズに表示されることを確認
- [ ] デスクトップ（1920px）で max-width: 450px で中央寄せされることを確認
- [ ] マウス / タッチ入力の座標変換が正しく機能することを確認（CSS スケーリング後）
- [ ] スコアボードが Canvas と同じ幅に揃っていることを確認

### 1.1 カウントダウン演出
- [ ] `core/types.ts` に `GamePhase` 型を追加（`countdown | playing | paused | finished`）
- [ ] `core/types.ts` の `GameState` に `phase` と `countdownStart` フィールド追加
- [ ] `renderer.ts` に `drawCountdown()` メソッド実装（数字のスケールアニメーション）
- [ ] `hooks/useGameLoop.ts` にカウントダウンフェーズの分岐処理追加
- [ ] `core/sound.ts` にカウントダウン音（ティック音＋GO音）追加
- [ ] `AirHockeyGame.tsx` の `startGame` でフェーズを `countdown` に設定
- [ ] テスト: カウントダウン中にパックが移動しないことを確認

### 1.2 画面シェイク
- [ ] `core/types.ts` に `ShakeState` 型追加（`intensity`, `duration`, `startTime`）
- [ ] `styles.ts` にシェイクアニメーション用の CSS keyframes 追加
- [ ] `components/Field.tsx` にシェイク状態を受け取り transform を適用する処理追加
- [ ] `hooks/useGameLoop.ts` のゴール判定時にシェイクトリガー追加
- [ ] `hooks/useGameLoop.ts` の強打ヒット検出時に弱シェイクトリガー追加
- [ ] `AirHockeyGame.tsx` にシェイク状態の管理追加
- [ ] テスト: シェイクが時間経過で減衰することを確認

### 1.3 パック速度ビジュアル
- [ ] `core/constants.ts` に速度閾値定数を追加（`SPEED_NORMAL`, `SPEED_FAST`, `SPEED_SUPER`）
- [ ] `renderer.ts` の `drawPuck()` を速度に応じた色変化に対応
- [ ] `renderer.ts` の `drawPuckTrail()` を速度に応じたトレイル長・太さ変化に対応
- [ ] `renderer.ts` に超高速時のスピードライン描画処理追加
- [ ] `renderer.ts` に高速時のグロー効果追加
- [ ] テスト: 速度閾値に応じた色が正しく返されることを確認

### 1.4 BGM 追加
- [ ] `core/sound.ts` に BGM 生成関数追加（Web Audio API でパターン生成）
- [ ] `core/sound.ts` に BGM の play / stop / setTempo メソッド追加
- [ ] `core/types.ts` の `SoundSystem` に bgm 関連メソッド追加
- [ ] `AirHockeyGame.tsx` に bgmEnabled 状態追加
- [ ] `components/TitleScreen.tsx` に BGM ON/OFF トグル追加
- [ ] フィーバー時の BGM テンポ変更処理追加
- [ ] ゲーム終了時の BGM 停止処理追加
- [ ] テスト: BGM トグル状態の切り替えを確認

### 1.5 サウンド改善
- [ ] `core/sound.ts` の `hit()` にパック速度パラメータを追加、速度に応じた音程変化
- [ ] `core/sound.ts` の `wall()` に衝突角度パラメータ追加
- [ ] `core/sound.ts` にコンボ対応のゴール音追加（音程上昇）
- [ ] `hooks/useGameLoop.ts` のヒット処理で速度情報をサウンドに渡す
- [ ] テスト: サウンド関数がパラメータを受け取れることを確認

---

## Phase 2: ゲームプレイ深化

### 2.1 ポーズ機能
- [ ] `core/types.ts` の `GamePhase` に `paused` が含まれていることを確認
- [ ] `renderer.ts` に `drawPauseOverlay()` 実装（半透明背景 + メニュー）
- [ ] `components/Scoreboard.tsx` にポーズボタン追加
- [ ] `hooks/useGameLoop.ts` で `paused` フェーズ時にゲームループを一時停止
- [ ] ポーズ解除時の 1 秒カウントダウン処理追加
- [ ] Escape / P キーによるポーズトグル処理追加
- [ ] テスト: ポーズ中にゲーム状態が変化しないことを確認

### 2.2 新アイテム追加

#### Shield（バリア）
- [ ] `core/types.ts` に `ItemType` へ `'shield'` 追加
- [ ] `core/types.ts` に `ShieldState` 型追加（`active`, `owner`, `hitPoints`）
- [ ] `core/config.ts` の ITEMS に Shield 追加
- [ ] `core/items.ts` に `shield` エフェクト実装
- [ ] `renderer.ts` にゴール前バリアの描画追加
- [ ] `hooks/useGameLoop.ts` にバリアとパックの衝突判定追加
- [ ] テスト: バリアがパックを1回ブロックして消滅することを確認

#### Magnet（磁力）
- [ ] `core/types.ts` に `ItemType` へ `'magnet'` 追加
- [ ] `core/types.ts` の `EffectState` に `magnet` フィールド追加
- [ ] `core/config.ts` の ITEMS に Magnet 追加
- [ ] `core/items.ts` に `magnet` エフェクト実装
- [ ] `hooks/useGameLoop.ts` にマグネットの引力計算追加
- [ ] `renderer.ts` にマグネットエフェクト描画追加
- [ ] テスト: マグネット発動中にパックが引き寄せられることを確認

#### Big（マレット拡大）
- [ ] `core/types.ts` に `ItemType` へ `'big'` 追加
- [ ] `core/types.ts` の `EffectState` に `big` フィールド追加
- [ ] `core/config.ts` の ITEMS に Big 追加
- [ ] `core/items.ts` に `big` エフェクト実装
- [ ] `hooks/useGameLoop.ts` でマレット衝突判定に拡大半径を反映
- [ ] `renderer.ts` でマレット描画に拡大サイズを反映
- [ ] テスト: Big 発動中にマレット半径が 1.5 倍になることを確認

### 2.3 コンボシステム強化
- [ ] `core/types.ts` に `ComboState` 型追加（`count`, `lastScorer`）
- [ ] `core/types.ts` の `GameState` に `combo` フィールド追加
- [ ] `hooks/useGameLoop.ts` にコンボ判定ロジック追加（連続得点カウント）
- [ ] `renderer.ts` に `drawCombo()` メソッド追加（コンボ数表示＋演出）
- [ ] コンボに応じたパーティクル量の増加処理追加
- [ ] コンボ x3+ でフィーバー突入時間を短縮するロジック追加
- [ ] テスト: 連続得点でコンボカウントが増加することを確認
- [ ] テスト: 相手得点でコンボがリセットされることを確認

### 2.4 カムバックメカニクス
- [ ] `core/constants.ts` にカムバック定数追加（`COMEBACK_THRESHOLD: 3`, `COMEBACK_MALLET_BONUS: 0.1`, `COMEBACK_GOAL_REDUCTION: 0.1`）
- [ ] `hooks/useGameLoop.ts` にカムバック判定ロジック追加
- [ ] マレット衝突判定でカムバックボーナスの半径拡大を反映
- [ ] ゴール判定でカムバックボーナスのゴールサイズ縮小を反映
- [ ] テスト: スコア差 3 以上でカムバック効果が発動することを確認
- [ ] テスト: スコア差 2 以下で効果が解除されることを確認

### 2.5 試合統計
- [ ] `core/types.ts` に `MatchStats` 型追加
- [ ] `core/types.ts` の `GameState` または別 ref に統計フィールド追加
- [ ] `hooks/useGameLoop.ts` でヒット・セーブ・最高速度を記録
- [ ] `AirHockeyGame.tsx` に統計 ref 追加
- [ ] `components/ResultScreen.tsx` に統計表示セクション追加
- [ ] 統計値のカウントアップアニメーション実装
- [ ] テスト: ヒット検出時に統計が正しくカウントされることを確認

---

## Phase 3: リプレイ性・UX 向上

### 3.1 実績システム
- [ ] `core/achievements.ts` 新規作成（実績定義・判定・保存ロジック）
- [ ] 実績データを localStorage で管理する関数実装
- [ ] 各実績の判定条件を実装（勝利時、統計チェック時等）
- [ ] `hooks/useGameLoop.ts` またはリザルト遷移時に実績チェック呼び出し
- [ ] `components/ResultScreen.tsx` に実績解除ポップアップ追加
- [ ] `components/TitleScreen.tsx` に実績一覧表示リンク追加
- [ ] 実績一覧画面コンポーネント新規作成
- [ ] テスト: 各実績の判定条件が正しく動作することを確認

### 3.2 リザルト画面強化
- [ ] 勝利時の紙吹雪エフェクト追加（ConfettiOverlay 検討）
- [ ] 統計値のカウントアップアニメーション実装（Phase 2.5 と連動）
- [ ] 「REPLAY」ボタン追加（同条件で再戦）
- [ ] MVP スタッツのハイライト表示
- [ ] `AirHockeyGame.tsx` にリプレイ機能追加

### 3.3 画面トランジション
- [ ] トランジション用の共通コンポーネント作成
- [ ] menu → game: フェードアウトトランジション
- [ ] game → result: フェードインタランジション
- [ ] result → menu: スライドトランジション
- [ ] `AirHockeyGame.tsx` にトランジション状態管理追加

### 3.4 音量設定
- [ ] `core/types.ts` に `AudioSettings` 型追加（`bgmVolume`, `seVolume`, `muted`）
- [ ] `core/sound.ts` に音量制御メソッド追加
- [ ] 音量設定の localStorage 保存/読み込み実装
- [ ] `components/TitleScreen.tsx` に音量スライダー UI 追加
- [ ] テスト: 音量設定が保存・復元されることを確認

### 3.5 チュートリアル改善
- [ ] チュートリアルの完了フラグを localStorage で管理
- [ ] チュートリアルステップのデータ定義
- [ ] インタラクティブなオーバーレイコンポーネント作成
- [ ] 各ステップのハイライト表示とガイドテキスト
- [ ] スキップ機能
- [ ] テスト: チュートリアル完了後に再表示されないことを確認

---

## Phase 4: 発展的機能

### 4.1 キーボード操作対応
- [ ] `hooks/useInput.ts` にキーボードイベントハンドラ追加
- [ ] WASD / 矢印キーでの移動処理実装
- [ ] 移動速度の制限ロジック追加
- [ ] テスト: キーボード入力でマレットが移動することを確認

### 4.2 難易度オートアジャスト
- [ ] 連勝/連敗カウントの localStorage 管理
- [ ] 連敗/連勝時の難易度変更提案 UI
- [ ] テスト: 連敗カウントが正しく記録されることを確認

### 4.3 フィールド/アイテムアンロック
- [ ] アンロック条件の定義
- [ ] アンロック状態の localStorage 管理
- [ ] `components/TitleScreen.tsx` のフィールド選択にロック/アンロック表示
- [ ] アンロック時の演出
- [ ] テスト: 条件達成でアンロックされることを確認

### 4.4 デイリーチャレンジ
- [ ] 日付ベースのシード値生成
- [ ] 特殊ルールのパターン定義
- [ ] チャレンジ画面 UI
- [ ] クリア結果の保存
- [ ] テスト: 同一日付で同一チャレンジが生成されることを確認

---

## 横断タスク

### テスト全般
- [ ] Phase 1 完了後: 既存テスト全パス確認
- [ ] Phase 2 完了後: 新アイテム・コンボのユニットテスト追加
- [ ] Phase 3 完了後: 実績・統計のユニットテスト追加
- [ ] 各 Phase 完了後: 手動での動作確認・プレイテスト

### ドキュメント
- [ ] README.md の更新（新機能の説明追加）
- [ ] 各 Phase 完了時に CHANGELOG 記録
