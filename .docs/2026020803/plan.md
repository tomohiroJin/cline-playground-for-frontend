# RISK LCD 実装計画

## プロジェクト概要

元となる単一HTMLファイル（`risk-lcd.html`）を React + TypeScript のゲームプラットフォームに統合する。
LCD ゲーム機風ビジュアルのレーン回避ゲームで、パーク選択によるローグライトビルド要素を持つ。

### 技術スタック
- TypeScript / React 19
- styled-components（スタイリング）
- カスタムフック（状態管理）
- Web Audio API（音声）
- localStorage（セーブデータ）

### 変換方針
- 元HTMLの `<script>` 内ロジックを React コンポーネント + カスタムフックに分解
- グローバル変数をReact状態管理（useState / useReducer）に変換
- DOM操作をReact宣言的UIに変換
- CSS をstyled-componentsに変換
- ASCII アートデータは定数ファイルに分離

## ファイル構成

```
src/features/risk-lcd/
├── index.ts                      # barrel export
├── README.md                     # ゲーム説明
├── types.ts                      # 型定義
├── constants/
│   ├── index.ts                  # 定数エクスポート
│   ├── game-config.ts            # ステージ/パーク/スタイル等の設定
│   ├── ascii-art.ts              # キャラクターASCIIアート
│   └── emotion-art.ts            # エモーションパネルASCIIアート
├── hooks/
│   ├── index.ts
│   ├── useGameEngine.ts          # ゲームエンジン（メインループ）
│   ├── useInput.ts               # 入力管理（キーボード/タッチ）
│   ├── useStore.ts               # セーブデータ永続化
│   └── useAudio.ts               # 音声管理
├── components/
│   ├── index.ts
│   ├── styles.ts                 # styled-components定義
│   ├── RiskLcdGame.tsx           # メインゲームコンポーネント
│   ├── DeviceFrame.tsx           # LCD筐体フレーム
│   ├── LcdScreen.tsx             # LCD画面
│   ├── TitleScreen.tsx           # タイトル画面
│   ├── GameScreen.tsx            # ゲームプレイ画面
│   ├── GameHud.tsx               # スコア/ステージ表示HUD
│   ├── LaneGrid.tsx              # 3レーン表示グリッド
│   ├── CharacterArt.tsx          # キャラクターASCIIアート表示
│   ├── EmotionPanel.tsx          # エモーションパネル
│   ├── PerkSelectScreen.tsx      # パーク選択画面
│   ├── ResultScreen.tsx          # リザルト画面
│   ├── StyleListScreen.tsx       # プレイスタイル選択画面
│   ├── UnlockShopScreen.tsx      # アンロックショップ画面
│   ├── HelpScreen.tsx            # ヘルプ画面
│   ├── ListPanel.tsx             # 共通リストパネル（DRY）
│   └── ControlButtons.tsx        # 3ボタンUI
└── utils/
    ├── index.ts
    ├── random.ts                 # 乱数ユーティリティ
    └── game-logic.ts             # 純粋計算ロジック

src/pages/RiskLcdPage.tsx          # ページコンポーネント
src/assets/images/risk_lcd_card_bg.webp  # カード画像
```

## 実装フェーズ

### Phase 1: 基盤準備
- [ ] フィーチャーディレクトリ構造の作成
- [ ] `types.ts` - ゲーム状態・設定の型定義
- [ ] `constants/game-config.ts` - ステージ/パーク/スタイル/ショップ等の定数
- [ ] `constants/ascii-art.ts` - キャラクターASCIIアートデータ
- [ ] `constants/emotion-art.ts` - エモーションパネルASCIIアートデータ
- [ ] `utils/random.ts` - 乱数ユーティリティ
- [ ] `utils/game-logic.ts` - ランク計算、コンボ倍率計算等の純粋関数

### Phase 2: UI コンポーネント（静的表示）
- [ ] `components/styles.ts` - LCD風styled-components定義
- [ ] `components/DeviceFrame.tsx` - ゲーム機筐体フレーム
- [ ] `components/ControlButtons.tsx` - 3ボタンUI
- [ ] `components/LcdScreen.tsx` - LCD画面コンテナ
- [ ] `components/ListPanel.tsx` - 共通リストパネル
- [ ] `components/CharacterArt.tsx` - ASCIIアート表示
- [ ] `components/EmotionPanel.tsx` - エモーションパネル

### Phase 3: メニュー画面群
- [ ] `components/TitleScreen.tsx` - タイトル画面（メニュー選択）
- [ ] `components/StyleListScreen.tsx` - プレイスタイル選択
- [ ] `components/UnlockShopScreen.tsx` - アンロックショップ
- [ ] `components/HelpScreen.tsx` - ヘルプ画面

### Phase 4: ゲームエンジン
- [ ] `hooks/useStore.ts` - localStorage永続化
- [ ] `hooks/useAudio.ts` - Web Audio API音声
- [ ] `hooks/useInput.ts` - キーボード/タッチ入力管理
- [ ] `hooks/useGameEngine.ts` - メインゲームループ
  - ステージ生成/進行
  - 障害配置ロジック
  - 予告システム
  - 衝突判定
  - コンボ/ニアミス判定
  - シールド/復活処理
  - パーク効果適用
  - ステージ修飾（モディファイア）

### Phase 5: ゲームプレイ画面
- [ ] `components/GameHud.tsx` - HUD（スコア/ステージ/コンボ等）
- [ ] `components/LaneGrid.tsx` - 3レーンのセグメント表示
- [ ] `components/GameScreen.tsx` - ゲーム画面統合
- [ ] `components/PerkSelectScreen.tsx` - パーク選択
- [ ] `components/ResultScreen.tsx` - リザルト画面

### Phase 6: 統合・仕上げ
- [ ] `components/RiskLcdGame.tsx` - メインコンポーネント統合
- [ ] `index.ts` - barrel export
- [ ] `src/pages/RiskLcdPage.tsx` - ページコンポーネント
- [ ] `src/App.tsx` - ルーティング追加（lazy import + Route）
- [ ] `src/pages/GameListPage.tsx` - ゲームカード追加
- [ ] カード画像の作成・配置
- [ ] `README.md` - ゲーム説明ドキュメント

### Phase 7: テスト・品質保証
- [ ] 純粋関数のユニットテスト（game-logic, random）
- [ ] カスタムフックのテスト
- [ ] コンポーネントの基本レンダリングテスト
- [ ] ビルド確認（webpack）
- [ ] 動作確認（ブラウザ）

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| 元HTMLが巨大（1200行超） | 変換工数大 | Phase分割で段階的に実装 |
| ASCII アートデータ量が膨大 | ファイルサイズ増大 | 定数ファイルに分離、コード分割で遅延読み込み |
| グローバル状態の複雑さ | バグ混入リスク | useReducerで状態遷移を明確化 |
| タイマーベースのゲームループ | React再レンダリングとの競合 | useRefでタイマー管理、useCallbackで安定化 |
| Web Fonts（Silkscreen/Orbitron） | 読み込み遅延 | public/index.htmlでプリロード |
| タッチ操作の互換性 | モバイル対応 | 元HTMLのタッチハンドラを移植 |

## 完了基準

- [ ] 全6ステージ（裏ステージ含む）のゲームプレイが正常動作
- [ ] パーク選択・プレイスタイル選択が正常動作
- [ ] アンロックショップでの購入・永続化が正常動作
- [ ] キーボード/タッチ操作の両方で操作可能
- [ ] ゲームリストからの起動・ルーティングが正常動作
- [ ] ビルドエラーなし
- [ ] 基本テストの通過
