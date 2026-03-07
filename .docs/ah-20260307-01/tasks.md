# Air Hockey ブラッシュアップ タスクリスト

## Phase 1: 基盤改善＋ゲームフィール強化

### 1.0 レスポンシブデザイン対応

#### 定数・型の整理
- [x] `core/types.ts` から `CanvasSize` 型を削除
- [x] `core/types.ts` から `SizeConfig` 型を削除
- [x] `core/constants.ts` の `SIZE_CONFIGS` を削除
- [x] `core/constants.ts` の `getConstants(size)` 関数を `CONSTANTS` 定数オブジェクトに置換（解像度 450x900 固定）
- [x] `core/constants.ts` の `GameConstants` 型定義はそのまま維持
- [x] `core/config.ts` から `SIZE_OPTIONS` を削除
- [x] `core/config.ts` の障害物座標を 450x900 スケールに更新（x1.5 換算）

#### CSS レスポンシブ化
- [x] `styles.ts` の `GameCanvas` を `width: 100%` + `max-width: 450px` + `aspect-ratio: 1 / 2` + `max-height: calc(100vh - 100px)` に変更
- [x] `styles.ts` の `ScoreBoardContainer` の `max-width` を `450px` に変更し `width: 100%` を追加
- [x] `styles.ts` の `MenuCard` の `max-width` を `450px` に統一（任意）

#### コンポーネントから canvasSize を除去
- [x] `components/Field.tsx` から `canvasSize` プロップを削除、Canvas の width/height を固定値に
- [x] `components/TitleScreen.tsx` から Size 選択セクション（ButtonGroup + SIZE_OPTIONS）を完全削除
- [x] `components/TitleScreen.tsx` から `canvasSize` / `setCanvasSize` プロップを削除
- [x] `AirHockeyGame.tsx` から `canvasSize` state と関連する useState を削除
- [x] `AirHockeyGame.tsx` の `startGame` / `useInput` / `useGameLoop` 呼び出しから `canvasSize` 引数を削除
- [x] `AirHockeyGame.tsx` の TitleScreen / Field への `canvasSize` プロップ渡しを削除

#### フック・ロジックから canvasSize を除去
- [x] `hooks/useInput.ts` から `canvasSize` パラメータを削除、`CONSTANTS` を直接参照
- [x] `hooks/useGameLoop.ts` から `canvasSize` パラメータを削除、`CONSTANTS` を直接参照
- [x] `core/entities.ts` の `getConstants()` 呼び出しを `CONSTANTS` に置換
- [x] `core/physics.ts` の `getConstants()` 呼び出しを `CONSTANTS` に置換
- [x] `core/ai.ts` の `getConstants()` 呼び出しを `CONSTANTS` に置換
- [x] `renderer.ts` の全 `getConstants()` 呼び出しを `CONSTANTS` に置換

#### テスト更新
- [x] `core/entities.test.ts` の `getConstants()` 参照を `CONSTANTS` に更新
- [x] `core/Physics.test.ts` の `CONSTANTS` 参照を更新（解像度 450x900 前提に）
- [x] `core/AI.test.ts` の `getConstants()` 呼び出しを `CONSTANTS` に更新
- [x] `AirHockeyPage.test.tsx` の Size 選択関連テストがあれば削除
- [x] 全既存テストがパスすることを確認

#### 動作確認
- [ ] スマートフォン幅（375px）で Canvas が画面幅いっぱいに表示されることを確認
- [ ] タブレット幅（768px）で適切なサイズに表示されることを確認
- [ ] デスクトップ（1920px）で max-width: 450px で中央寄せされることを確認
- [ ] マウス / タッチ入力の座標変換が正しく機能することを確認（CSS スケーリング後）
- [ ] スコアボードが Canvas と同じ幅に揃っていることを確認

### 1.1 カウントダウン演出
- [x] `core/types.ts` に `GamePhase` 型を追加（`countdown | playing | paused | finished`）
- [x] `core/types.ts` の `GameState` に `phase` と `countdownStart` フィールド追加 → ref で管理に変更
- [x] `renderer.ts` に `drawCountdown()` メソッド実装（数字のスケールアニメーション）
- [x] `hooks/useGameLoop.ts` にカウントダウンフェーズの分岐処理追加
- [x] `core/sound.ts` にカウントダウン音（ティック音＋GO音）追加
- [x] `AirHockeyGame.tsx` の `startGame` でフェーズを `countdown` に設定
- [x] テスト: カウントダウン中にパックが移動しないことを確認

### 1.2 画面シェイク
- [x] `core/types.ts` に `ShakeState` 型追加（`intensity`, `duration`, `startTime`）
- [x] `components/Field.tsx` にシェイク状態を受け取り transform を適用する処理追加（CSS transform で実装）
- [x] `hooks/useGameLoop.ts` のゴール判定時にシェイクトリガー追加
- [x] `hooks/useGameLoop.ts` の強打ヒット検出時に弱シェイクトリガー追加
- [x] `AirHockeyGame.tsx` にシェイク状態の管理追加
- [x] テスト: シェイクが時間経過で減衰することを確認

### 1.3 パック速度ビジュアル
- [x] `renderer.ts` に速度閾値定数を追加（`SPEED_NORMAL`, `SPEED_FAST`）
- [x] `renderer.ts` の `drawPuck()` を速度に応じた色変化に対応
- [x] `renderer.ts` の `drawPuckTrail()` を速度に応じたトレイル長・太さ変化に対応
- [x] `renderer.ts` に超高速時のスピードライン描画処理追加（`drawSpeedLines()`）
- [x] `renderer.ts` に高速時のグロー効果追加
- [x] テスト: 速度閾値に応じた色が正しく返されることを確認

### 1.4 BGM 追加
- [x] `core/sound.ts` に BGM 生成関数追加（Web Audio API でパターン生成）
- [x] `core/sound.ts` に BGM の play / stop / setTempo メソッド追加
- [x] `core/types.ts` の `SoundSystem` に bgm 関連メソッド追加
- [x] `AirHockeyGame.tsx` に bgmEnabled 状態追加
- [x] `components/TitleScreen.tsx` に BGM ON/OFF トグル追加
- [x] フィーバー時の BGM テンポ変更処理追加
- [x] ゲーム終了時の BGM 停止処理追加
- [x] テスト: BGM トグル状態の切り替えを確認

### 1.5 サウンド改善
- [x] `core/sound.ts` の `hit()` にパック速度パラメータを追加、速度に応じた音程変化
- [x] `core/sound.ts` の `wall()` に衝突角度パラメータ追加
- [x] `hooks/useGameLoop.ts` のヒット処理で速度情報をサウンドに渡す
- [x] テスト: サウンド関数がパラメータを受け取れることを確認

---

## Phase 2: ゲームプレイ深化

### 2.1 ポーズ機能
- [x] `core/types.ts` の `GamePhase` に `paused` が含まれていることを確認
- [x] `renderer.ts` に `drawPauseOverlay()` 実装（半透明背景 + メニュー）
- [x] `components/Scoreboard.tsx` にポーズボタン追加
- [x] `hooks/useGameLoop.ts` で `paused` フェーズ時にゲームループを一時停止
- [x] ポーズ解除時の処理追加（タップ/キーで即時リジューム）
- [x] Escape / P キーによるポーズトグル処理追加
- [x] テスト: ポーズ中にゲーム状態が変化しないことを確認

### 2.2 新アイテム追加

#### Shield（バリア）
- [x] `core/types.ts` に `ItemType` へ `'shield'` 追加
- [x] `core/types.ts` の `EffectState` に `shield` フィールド追加
- [x] `core/config.ts` の ITEMS に Shield 追加
- [x] `core/items.ts` に `shield` エフェクト実装
- [x] `renderer.ts` にゴール前バリアの描画追加
- [x] `hooks/useGameLoop.ts` にバリアとパックの衝突判定追加
- [x] テスト: バリアがパックを1回ブロックして消滅することを確認

#### Magnet（磁力）
- [x] `core/types.ts` に `ItemType` へ `'magnet'` 追加
- [x] `core/types.ts` の `EffectState` に `magnet` フィールド追加
- [x] `core/config.ts` の ITEMS に Magnet 追加
- [x] `core/items.ts` に `magnet` エフェクト実装
- [x] `hooks/useGameLoop.ts` にマグネットの引力計算追加
- [x] `renderer.ts` にマグネットエフェクト描画追加
- [x] テスト: マグネット発動中にパックが引き寄せられることを確認

#### Big（マレット拡大）
- [x] `core/types.ts` に `ItemType` へ `'big'` 追加
- [x] `core/types.ts` の `EffectState` に `big` フィールド追加
- [x] `core/config.ts` の ITEMS に Big 追加
- [x] `core/items.ts` に `big` エフェクト実装
- [x] `hooks/useGameLoop.ts` でマレット衝突判定に拡大半径を反映
- [x] `renderer.ts` でマレット描画に拡大サイズを反映
- [x] テスト: Big 発動中にマレット半径が 1.5 倍になることを確認

### 2.3 コンボシステム強化
- [x] `core/types.ts` に `ComboState` 型追加（`count`, `lastScorer`）
- [x] `core/types.ts` の `GameState` に `combo` フィールド追加
- [x] `hooks/useGameLoop.ts` にコンボ判定ロジック追加（連続得点カウント）
- [x] `renderer.ts` に `drawCombo()` メソッド追加（コンボ数表示＋演出）
- [x] コンボに応じた演出（x3: オレンジ、x5+: レインボー）
- [ ] コンボ x3+ でフィーバー突入時間を短縮するロジック追加
- [x] テスト: 連続得点でコンボカウントが増加することを確認
- [x] テスト: 相手得点でコンボがリセットされることを確認

### 2.4 カムバックメカニクス
- [x] `core/constants.ts` にカムバック定数追加（`COMEBACK.THRESHOLD: 3`, `COMEBACK.MALLET_BONUS: 0.1`, `COMEBACK.GOAL_REDUCTION: 0.1`）
- [x] `hooks/useGameLoop.ts` にカムバック判定ロジック追加
- [x] マレット衝突判定でカムバックボーナスの半径拡大を反映
- [x] ゴール判定でカムバックボーナスのゴールサイズ縮小を反映
- [x] テスト: スコア差 3 以上でカムバック効果が発動することを確認
- [x] テスト: スコア差 2 以下で効果が解除されることを確認

### 2.5 試合統計
- [x] `core/types.ts` に `MatchStats` 型追加
- [x] `core/entities.ts` に `createMatchStats()` ファクトリ追加、別 ref で統計管理
- [x] `hooks/useGameLoop.ts` でヒット・セーブ・最高速度を記録
- [x] `AirHockeyGame.tsx` に統計 ref 追加
- [x] `components/ResultScreen.tsx` に統計表示セクション追加
- [x] 統計値のカウントアップアニメーション実装（Phase 3.2 で対応）
- [x] テスト: ヒット検出時に統計が正しくカウントされることを確認

---

## Phase 3: リプレイ性・UX 向上

### 3.1 実績システム
- [x] `core/achievements.ts` 新規作成（実績定義・判定・保存ロジック）
- [x] 実績データを localStorage で管理する関数実装
- [x] 各実績の判定条件を実装（勝利時、統計チェック時等）
- [x] `AirHockeyGame.tsx` のリザルト遷移時に実績チェック呼び出し
- [x] `components/ResultScreen.tsx` に実績解除ポップアップ追加
- [x] `components/TitleScreen.tsx` に実績一覧表示リンク追加
- [x] 実績一覧画面コンポーネント新規作成（`components/AchievementList.tsx`）
- [x] テスト: 各実績の判定条件が正しく動作することを確認（29テスト）

### 3.2 リザルト画面強化
- [x] 勝利時の紙吹雪エフェクト追加（ConfettiOverlay 実装）
- [x] 統計値のカウントアップアニメーション実装（useCountUp フック）
- [x] 「REPLAY」ボタン追加（同条件で再戦）
- [x] MVP スタッツのハイライト表示（getMvpCategory）
- [x] `AirHockeyGame.tsx` にリプレイ機能追加

### 3.3 画面トランジション
- [x] トランジション用の共通コンポーネント作成（`components/Transition.tsx`）
- [x] menu → game: フェードアウトトランジション
- [x] game → result: フェードインタランジション
- [x] result → menu: トランジション
- [x] `AirHockeyGame.tsx` にトランジション状態管理追加

### 3.4 音量設定
- [x] `core/audio-settings.ts` に `AudioSettings` 型追加（`bgmVolume`, `seVolume`, `muted`）
- [x] `core/sound.ts` に音量制御メソッド追加（`setBgmVolume`, `setSeVolume`, `setMuted`）
- [x] `core/types.ts` の `SoundSystem` に音量制御メソッド追加
- [x] 音量設定の localStorage 保存/読み込み実装
- [x] `components/TitleScreen.tsx` に音量スライダー UI 追加
- [x] テスト: 音量設定が保存・復元されることを確認

### 3.5 チュートリアル改善
- [x] チュートリアルの完了フラグを localStorage で管理
- [x] チュートリアルステップのデータ定義（4ステップ）
- [x] インタラクティブなオーバーレイコンポーネント作成（`components/Tutorial.tsx`）
- [x] 各ステップのハイライト表示とガイドテキスト
- [x] スキップ機能
- [x] テスト: チュートリアル完了後に再表示されないことを確認

---

## Phase 3 フィードバック対応

### F1: BGM が鳴らない問題
- [x] `core/sound.ts` の `getContext()` に `audioCtx.resume()` 追加（autoplay policy 対応）
- [x] `core/sound.ts` の `setBgmVolume` 音量スケーリングを `* 0.3` → `* 0.8` に変更
- [x] `core/sound.ts` の BGM ノート持続時間を `0.15` → `0.19` に延長

### F2: ヘルプボタンのタイトル側移動
- [x] `components/Scoreboard.tsx` から `onHelpClick` prop と `?` ボタンを削除
- [x] `components/TitleScreen.tsx` に `onHelpClick` prop 追加、Best Margin 行に `?` ボタン配置
- [x] `AirHockeyGame.tsx` の Scoreboard から `onHelpClick` 渡しを削除、TitleScreen に追加

### F3: タイトル画面の設定分離
- [x] `components/SettingsPanel.tsx` 新規作成（オーバーレイモーダル形式）
- [x] `components/TitleScreen.tsx` から BGM/Volume セクション削除、`⚙` 設定ボタン追加
- [x] `components/TitleScreen.tsx` から `bgmEnabled` / `onToggleBgm` / `audioSettings` / `onAudioSettingsChange` props を削除
- [x] `AirHockeyGame.tsx` に `showSettings` state 追加、SettingsPanel の条件付きレンダリング

### F4: ゲーム中 drawHelp の情報拡充
- [x] `renderer.ts` の `drawHelp` に `field` パラメータ追加
- [x] 全6アイテムのアイコン・名前・説明を表示
- [x] 現在のフィールド名と特徴を表示
- [x] フッタを「Tap to Resume」に変更
- [x] `hooks/useGameLoop.ts` の `drawHelp` 呼び出しに `field` 引数追加

### テスト・検証
- [x] `npx tsc --noEmit` 型チェックパス
- [x] `AirHockeyPage.test.tsx` の BGM テストを設定・ヘルプボタン表示テストに更新
- [x] 全128テストパス
- [ ] 手動確認: BGM ON でゲーム開始し音楽が流れるか
- [ ] 手動確認: タイトル画面の `?` でチュートリアル表示
- [ ] 手動確認: ゲーム中5秒無操作でアイテム・フィールド情報付きヘルプ表示
- [ ] 手動確認: `⚙` で設定パネル開閉

---

## Phase 4: 発展的機能

### 4.1 キーボード操作対応
- [x] `core/keyboard.ts` 新規作成（キーボード状態管理・移動計算のコアロジック）
- [x] `hooks/useKeyboardInput.ts` 新規作成（キーボードイベントハンドラフック）
- [x] WASD / 矢印キーでの移動処理実装
- [x] 移動速度の制限ロジック追加（KEYBOARD_MOVE_SPEED = 6、マウスより遅め）
- [x] `hooks/useGameLoop.ts` にキーボード移動の適用処理追加
- [x] `AirHockeyGame.tsx` に useKeyboardInput フック統合
- [x] テスト: キーボード入力でマレットが移動することを確認（14テスト）

### 4.2 難易度オートアジャスト
- [x] `core/difficulty-adjust.ts` 新規作成（連勝/連敗記録・提案ロジック）
- [x] 連勝/連敗カウントの localStorage 管理
- [x] 連敗/連勝時の難易度変更提案 UI（ResultScreen に表示）
- [x] `AirHockeyGame.tsx` にリザルト時の連勝/連敗記録・提案生成を統合
- [x] テスト: 連敗カウントが正しく記録されることを確認（12テスト）

### 4.3 フィールド/アイテムアンロック
- [x] `core/unlock.ts` 新規作成（アンロック条件定義・状態管理）
- [x] アンロック条件の定義（フィールド4種 + アイテム3種、勝利数/難易度ベース）
- [x] アンロック状態の localStorage 管理
- [x] `components/TitleScreen.tsx` のフィールド選択にロック/アンロック表示
- [x] `AirHockeyGame.tsx` にリザルト時のアンロック更新を統合
- [x] テスト: 条件達成でアンロックされることを確認（12テスト）

### 4.4 デイリーチャレンジ
- [x] `core/daily-challenge.ts` 新規作成（シード生成・チャレンジ生成・結果保存）
- [x] 日付ベースのシード値生成（xorshift32 疑似乱数）
- [x] 特殊ルールのパターン定義（7パターン）
- [x] `components/DailyChallengeScreen.tsx` 新規作成（チャレンジ画面 UI）
- [x] `components/TitleScreen.tsx` に Daily ボタン追加
- [x] クリア結果の保存
- [x] `AirHockeyGame.tsx` にデイリーチャレンジフロー統合
- [x] テスト: 同一日付で同一チャレンジが生成されることを確認（13テスト）

---

## 横断タスク

### テスト全般
- [x] Phase 1 完了後: 既存テスト全パス確認（68テスト全パス）
- [x] Phase 2 完了後: 新アイテム・コンボのユニットテスト追加（31テスト、全96テストパス）
- [x] Phase 3 完了後: 実績・音量設定・チュートリアルのユニットテスト追加（29テスト、全128テストパス）
- [x] Phase 4 完了後: キーボード・難易度調整・アンロック・デイリーチャレンジのユニットテスト追加（51テスト、全176テストパス）
- [ ] 各 Phase 完了後: 手動での動作確認・プレイテスト

### ドキュメント
- [x] README.md の更新（新機能の説明追加）
- [ ] 各 Phase 完了時に CHANGELOG 記録
