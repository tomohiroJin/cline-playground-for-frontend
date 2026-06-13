# 演出・UI・実績

## すごろくボード

クイズ画面にすごろく風の経路UIを表示。各マスにイベントアイコンと名前を表示し、キャラクターアイコン（コマ）がスライドアニメーションで移動。完了マスはチェックマーク表示、緊急対応マスは赤く点滅。モバイルでは横スクロール対応。

## コンボ演出

| コンボ数 | 演出 |
|----------|------|
| 2-3 | 炎エフェクト、テキストがオレンジに光る |
| 4-5 | 稲妻エフェクト、テキストが紫に光る |
| 6-7 | 虹色エフェクト、テキストが虹色グラデーション |
| 8+ | 金色エフェクト、「LEGENDARY COMBO」テキスト |

コンボ切れ時に「Combo Break...」テキスト + 効果音。

## グレード発表シーケンス

1. 暗転 → 「BUILD SUCCESS」タイプライター表示
2. ドラムロール効果音
3. グレードサークルのバウンス表示
4. Sランク時はファンファーレ効果音

クリック/Enter で演出スキップ可能。

## 実績システム

条件クリアでバッジを獲得（全20種類）。獲得時にトースト通知 + 効果音。

| ID | 名前 | 条件 | レア度 |
|----|------|------|--------|
| first-clear | はじめの一歩 | 初回クリア | Bronze |
| perfect-sprint | パーフェクトスプリント | 1スプリント全問正解 | Silver |
| all-correct | 完璧主義者 | 全問正解でクリア | Gold |
| combo-5 | コンボマスター | 5コンボ達成 | Bronze |
| combo-10 | コンボレジェンド | 10コンボ達成 | Gold |
| speed-demon | 高速回答 | 平均回答時間3秒以内 | Silver |
| firefighter | 火消しの達人 | 緊急対応3回成功 | Silver |
| zero-debt | クリーンコード | 負債0でクリア | Gold |
| grade-s | Sランカー | Sグレード獲得 | Gold |
| all-types | タイプコレクター | 全6チームタイプ獲得 | Platinum |
| study-100 | 学習の鬼 | 勉強会モードで累計100問回答 | Silver |
| genre-master | ジャンルマスター | 任意のジャンルで正答率100% | Gold |
| sprint-8 | マラソンランナー | 8スプリントモードクリア | Silver |
| comeback | 逆転劇 | 前半50%未満→最終70%以上 | Gold |
| night-owl | 深夜のエンジニア | 深夜0-5時にプレイ | Bronze |
| play-3 | リピーター | 3回プレイ | Bronze |
| play-10 | 常連プレイヤー | 10回プレイ | Silver |
| total-correct-100 | 百問道場 | 累計100問正解 | Silver |
| total-correct-500 | 知識の泉 | 累計500問正解 | Gold |
| improving | 成長の証 | 過去3回の平均より正答率10%以上向上 | Silver |

## Phase 1 追加機能

### サウンド設定

タイトル画面に「サウンド ON/OFF」トグルボタンを追加。設定は `SettingsRepository`（`infrastructure/settings-repository.ts`）が `localStorage` の `aqs_settings` キーに永続化し、起動時に `useGame` フックが読み込んで復元する。

サウンドの有効/無効は `presentation/sounds/sound.ts` のミュートゲートで制御する。`setSoundEnabled(false)` を呼ぶと内部フラグがオフになり、以降すべての再生関数（SE・BGM）が呼び出しをスキップする。`isSoundEnabled()` で現在の状態を参照できる。

### アクセシビリティ（a11y）

クイズ選択肢のセマンティクスを強化した。

- 選択肢コンテナに `role="radiogroup"`、各選択肢に `role="radio"` + `aria-checked` + `aria-label` を付与
- 回答後に `aria-live` 領域で正解/不正解フィードバックをスクリーンリーダーに通知
- タイマー表示に `role="timer"` を設定し、残り 10 秒・5 秒・0 秒の閾値でスクリーンリーダー向けの残り時間通知を行う
- `Button` コンポーネントに `:focus-visible` フォーカスリングを追加（マウス操作では非表示、キーボード操作時のみ表示）
- 視覚的に隠しつつスクリーンリーダーには読ませる共通スタイル `SR_ONLY_STYLE` を `presentation/styles/sr-only.ts` に定義。各コンポーネントで再利用する

### デザイントークン統一

インライン `style` に散在していた色・余白・角丸・フォントサイズの生値を `DESIGN_TOKENS`（`presentation/styles/design-tokens.ts` の `colors` / `spacing` / `borderRadius` / `fontSize`）へ置き換えた。

置き換えの方針: トークン値と生値が 1:1 で一致するもののみ機械的に置換し、視覚的な変化はゼロに保つ。対応する値がないもの（中間サイズ等）は据え置きとし、段階的に移行する。
