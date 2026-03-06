# Agile Quiz Sugoroku ブラッシュアップ タスクチェックリスト

## フェーズ1: 演出強化

### 1.1 すごろくボードビジュアル
- [ ] すごろく経路UIコンポーネント設計（マス配置・レイアウト）
- [ ] `BoardPath` styled-component 作成（横長経路、各マスのスタイル）
- [ ] `BoardPiece` コンポーネント作成（キャラアイコンのコマ）
- [ ] コマ移動スライドアニメーション実装（CSS transition 300ms）
- [ ] 完了マスのチェックマーク表示 + 色変化
- [ ] 緊急対応マスの赤点滅アニメーション
- [ ] `QuizScreen.tsx` のタイムライン部分を新ボードUIに差し替え
- [ ] モバイル対応: 横スクロール + 現在マス中央自動スクロール
- [ ] 既存テスト（components.test.tsx）の更新

### 1.2 正解/不正解アニメーション強化
- [ ] `animations.ts` にフラッシュアニメーション定義（greenFlash, redFlash, grayOut）
- [ ] `animations.ts` にバウンスアニメーション定義（bounceIn, shakeX）
- [ ] `animations.ts` にフロートアニメーション定義（floatUp）
- [ ] スコア加算フロートテキストコンポーネント作成
- [ ] `QuizScreen.tsx` に正解時フラッシュ + バウンス実装
- [ ] `QuizScreen.tsx` に不正解時フラッシュ + シェイク実装
- [ ] `QuizScreen.tsx` にタイムアップ時グレーアウト実装
- [ ] 正解アイコン回転出現アニメーション実装

### 1.3 コンボ演出強化
- [ ] コンボ段階定数定義（2-3: 炎, 4-5: 稲妻, 6-7: 虹, 8+: LEGENDARY）
- [ ] `ComboEffect` コンポーネント作成（段階別エフェクト表示）
- [ ] コンボ段階別 CSS アニメーション定義
- [ ] コンボ中のコマオーラエフェクト
- [ ] コンボ切れ「Combo Break」表示 + アニメーション
- [ ] `sound.ts` にコンボ切れ効果音追加
- [ ] `QuizScreen.tsx` にコンボ演出統合

### 1.4 タイマー緊迫演出
- [ ] `TimerContainer` に残り時間帯別の背景色変化追加
- [ ] 残り5秒: パネル枠の脈動エフェクト
- [ ] 残り3秒: 画面赤みがかりオーバーレイ
- [ ] 残り1-2秒: タイマー激しい振動
- [ ] `sound.ts` のティック音にピッチ変化対応（残り時間に応じて）
- [ ] `prefers-reduced-motion` 対応（アニメーション無効化）

### 1.5 グレード発表演出
- [ ] 結果画面の演出シーケンス設計（ステップ定義 + タイミング）
- [ ] ステップ1: 暗転 → 「BUILD SUCCESS」タイプライター表示
- [ ] ステップ2: ドラムロール効果音（`sound.ts` に追加）
- [ ] ステップ3: グレードサークルのバウンス表示アニメーション
- [ ] ステップ4: グレード色パーティクル放射エフェクト
- [ ] ステップ5: Sランク特別エフェクト + ファンファーレ音
- [ ] ステップ6: エンジニアタイプカードのスライドイン
- [ ] クリック/Enter による演出スキップ機能
- [ ] `ResultScreen.tsx` に演出シーケンス統合

### 1.6 キャラクターリアクション
- [ ] `character-reactions.ts` 作成（状況別コメントデータ定義）
- [ ] `CharacterReaction.tsx` コンポーネント作成（アバター + 吹き出し）
- [ ] 正解/不正解/コンボ/タイマー警告/緊急対応の各トリガー実装
- [ ] 吹き出し表示→1.5秒後自動消去のアニメーション
- [ ] `QuizScreen.tsx` に CharacterReaction 組み込み
- [ ] キャラクターコメントの単体テスト

### フェーズ1 検証
- [ ] 全画面フローの通しプレイテスト
- [ ] モバイル表示確認
- [ ] `prefers-reduced-motion` 有効時の動作確認
- [ ] 既存テストが全て通ることの確認（`npm test`）
- [ ] パフォーマンス確認（アニメーション中のフレームレート）

---

## フェーズ2: ゲーミフィケーション

### 2.1 実績システム
- [ ] `types.ts` に実績関連の型定義追加（Achievement, AchievementProgress）
- [ ] `achievements.ts` 作成（15個の実績定義 + 判定ロジック）
- [ ] `achievement-storage.ts` 作成（localStorage 保存・読込）
- [ ] 実績判定ロジックの単体テスト
- [ ] `AchievementScreen.tsx` 作成（実績一覧表示、獲得済み/未獲得の区別）
- [ ] `AchievementToast.tsx` 作成（獲得時のトースト通知）
- [ ] 実績獲得効果音追加（`sound.ts`）
- [ ] `TitleScreen.tsx` に実績ボタン追加
- [ ] `useGame.ts` にゲーム終了時の実績判定統合
- [ ] `AgileQuizSugorokuPage.tsx` に実績画面フェーズ追加
- [ ] `GamePhase` 型に `'achievements'` 追加
- [ ] 実績コンポーネントのテスト

### 2.2 履歴・成長グラフ
- [ ] `types.ts` に履歴関連の型定義追加（GameHistory）
- [ ] `result-storage.ts` 拡張: 最大10件保存対応（`aqs_history` キー）
- [ ] 既存 `aqs_last_result` との互換性維持（マイグレーション処理）
- [ ] `LineChart.tsx` 作成（SVG ベース折れ線グラフ）
- [ ] `HistoryScreen.tsx` 作成（履歴一覧 + 推移グラフ）
- [ ] `TitleScreen.tsx` の前回結果表示を拡張（「履歴を見る」リンク）
- [ ] `GamePhase` 型に `'history'` 追加
- [ ] `AgileQuizSugorokuPage.tsx` に履歴画面フェーズ追加
- [ ] 履歴保存ロジックの単体テスト
- [ ] LineChart コンポーネントのテスト

### 2.3 難易度選択
- [ ] `types.ts` に難易度型追加（Difficulty: 'easy' | 'normal' | 'hard' | 'extreme'）
- [ ] `constants.ts` に難易度設定定数追加（DIFFICULTY_CONFIGS）
- [ ] `DifficultySelector` コンポーネント作成（4択ボタン）
- [ ] `TitleScreen.tsx` に難易度セレクター組み込み
- [ ] `useGame.ts` に難易度パラメータ対応（制限時間・負債倍率）
- [ ] Easy モードのヒント機能（50:50）UI実装
- [ ] `QuizScreen.tsx` にヒントボタン追加（Easy モード時のみ）
- [ ] 難易度別グレード計算ボーナス係数の実装
- [ ] `AgileQuizSugorokuPage.tsx` に難易度 state 追加
- [ ] 難易度ロジックの単体テスト

### 2.4 チャレンジモード（サバイバル）
- [ ] `types.ts` にチャレンジモード関連型追加
- [ ] `hooks/useChallenge.ts` 作成（1ミス即終了ロジック）
- [ ] `ChallengeScreen.tsx` 作成（サバイバルクイズ画面）
- [ ] `ChallengeResultScreen.tsx` 作成（ゲームオーバー + 記録表示）
- [ ] ハイスコア保存ロジック（localStorage）
- [ ] `TitleScreen.tsx` に「Challenge」ボタン追加
- [ ] `GamePhase` 型に `'challenge'` 追加
- [ ] `AgileQuizSugorokuPage.tsx` にチャレンジモード遷移追加
- [ ] チャレンジモードロジックの単体テスト

### フェーズ2 検証
- [ ] 実績が正しく判定・保存されることの確認
- [ ] 履歴が10件まで正しく保存されることの確認
- [ ] 各難易度でゲームバランスが適切かの確認
- [ ] チャレンジモードの通しプレイテスト
- [ ] 全テスト通過確認（`npm test`）

---

## フェーズ3: コンテンツ・ソーシャル拡充

### 3.1 キャラクターナラティブ
- [ ] ナラティブデータ定義（状況別 × キャラ別セリフ、各3-5バリエーション）
- [ ] `SprintStartScreen.tsx` にキャラ会話表示追加
- [ ] `RetrospectiveScreen.tsx` にキャラ会話表示追加
- [ ] 会話表示のフェードイン/アウトアニメーション
- [ ] ナラティブデータの単体テスト

### 3.2 デイリークイズ
- [ ] 日付ベースのシード付きランダム関数実装
- [ ] デイリークイズ5問選出ロジック
- [ ] `DailyQuizScreen.tsx` 作成
- [ ] 日別結果保存ロジック（`aqs_daily` キー）
- [ ] ストリーク（連続参加日数）計算ロジック
- [ ] カレンダー表示コンポーネント
- [ ] `TitleScreen.tsx` にデイリークイズボタン追加
- [ ] デイリークイズロジックの単体テスト

### 3.3 SNSシェア強化
- [ ] X(Twitter) シェアボタン追加（intent URL 生成）
- [ ] シェアテキストにハッシュタグ追加（`#AgileQuizSugoroku`）
- [ ] `ResultScreen.tsx` にシェアボタン追加

### フェーズ3 検証
- [ ] ナラティブの表示タイミングと内容の確認
- [ ] デイリークイズが同じ日に同じ問題が出ることの確認
- [ ] SNSシェアリンクが正しく機能することの確認
- [ ] 全テスト通過確認（`npm test`）

---

## 横断タスク

### ドキュメント更新
- [ ] `README.md` に新機能の記載追加
- [ ] `character-profiles.ts` にリアクションコメント追加の記載

### リファクタリング（必要に応じて）
- [ ] `GamePhase` 型の拡張に伴う分岐整理
- [ ] `AgileQuizSugorokuPage.tsx` が肥大化した場合のコンポーネント分割
- [ ] アニメーション定義ファイルの整理

### 最終検証
- [ ] 全フェーズ完了後の通しプレイテスト
- [ ] 全テスト通過確認
- [ ] バンドルサイズ確認（+50KB 以内）
- [ ] Lighthouse パフォーマンススコア確認
