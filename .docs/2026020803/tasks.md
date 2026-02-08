# RISK LCD タスクリスト

## Phase 1: 基盤準備

- [x] フィーチャーディレクトリ `src/features/risk-lcd/` 構造を作成
- [x] `types.ts` 作成 - ゲーム状態、画面種別、レーン、パーク、スタイル、ショップアイテム等の型定義
- [x] `constants/game-config.ts` 作成 - STG/PERKS/SHP/STY/MODS/RANK_TABLE/HELP_SECTIONS 等の定数
- [x] `constants/ascii-art.ts` 作成 - ART オブジェクト（idle/walk/danger/combo/shield/dead/ghost/safe）
- [x] `constants/emotion-art.ts` 作成 - EMO オブジェクト（idle/walk/danger/combo/safe/shield/dead）
- [x] `utils/random.ts` 作成 - Rand（int/pick/chance/shuffle）ユーティリティ
- [x] `utils/game-logic.ts` 作成 - computeRank/comboMult/calcEffBf/visLabel/mergeStyles 等の純粋関数
- [x] `constants/index.ts` / `utils/index.ts` - barrel export

## Phase 2: UI コンポーネント（静的表示）

- [x] `components/styles.ts` 作成 - LCD筐体/画面/ボタン/レーン等のstyled-components
- [x] `components/DeviceFrame.tsx` 作成 - ゲーム機筐体（ベゼル/ブランドロゴ/画面枠）
- [x] `components/ControlButtons.tsx` 作成 - LEFT/ACTION/RIGHT 3ボタンUI
- [x] `components/LcdScreen.tsx` 作成 - LCD画面コンテナ（スキャンライン/反射効果）
- [x] `components/ListPanel.tsx` 作成 - 共通リストパネル（スタイル/ショップ/ヘルプで共有）
- [x] `components/CharacterArt.tsx` 作成 - ASCIIアート表示コンポーネント
- [x] `components/EmotionPanel.tsx` 作成 - エモーションパネル表示コンポーネント

## Phase 3: メニュー画面群

- [x] `components/TitleScreen.tsx` 作成 - タイトル画面（GAME START/PLAY STYLE/UNLOCK/HELP メニュー）
- [x] `components/StyleListScreen.tsx` 作成 - プレイスタイル選択/装備画面
- [x] `components/UnlockShopScreen.tsx` 作成 - PTでアンロック購入するショップ画面
- [x] `components/HelpScreen.tsx` 作成 - カテゴリ別ヘルプ表示画面

## Phase 4: ゲームエンジン

- [x] `hooks/useStore.ts` 作成 - localStorage永続化（PT/購入済み/装備/ベストスコア）
- [x] `hooks/useAudio.ts` 作成 - Web Audio API でのビープ音/SE生成
- [x] `hooks/useInput.ts` 作成 - キーボード/タッチ入力のイベント管理とディスパッチ
- [x] `hooks/useGameEngine.ts` 作成 - メインゲームループ
  - [x] ステージ初期化（倍率配置/予告段数配置/モディファイア抽選）
  - [x] サイクル進行（タイマーベースのビート制御）
  - [x] 障害配置ロジック（同時障害/フェイク障害）
  - [x] 予告表示システム（段階的な警告表示）
  - [x] 衝突判定（プレイヤー位置 vs 障害レーン）
  - [x] コンボ/ニアミス判定
  - [x] シールド消費/復活処理
  - [x] パーク効果の適用
  - [x] ステージクリア/ゲームオーバー判定

## Phase 5: ゲームプレイ画面

- [x] `components/GameHud.tsx` 作成 - スコア/ステージ/サイクル/コンボ/シールド表示
- [x] `components/LaneGrid.tsx` 作成 - 3レーン×8セグメントのグリッド表示（倍率/予告/障害/安全表示）
- [x] `components/GameScreen.tsx` 作成 - ゲーム画面統合（HUD + レーン + キャラ + エモーション）
- [x] `components/PerkSelectScreen.tsx` 作成 - ステージ間パーク選択（3〜4択）
- [x] `components/ResultScreen.tsx` 作成 - リザルト（ランク/統計/PT獲得）

## Phase 6: 統合・仕上げ

- [x] `components/RiskLcdGame.tsx` 作成 - 全画面を統合するメインコンポーネント（画面ルーティング）
- [x] `index.ts` 作成 - barrel export
- [x] `src/pages/RiskLcdPage.tsx` 作成 - ページラッパーコンポーネント
- [x] `src/App.tsx` 編集 - lazy import と Route 追加（`/risk-lcd`）
- [x] `src/pages/GameListPage.tsx` 編集 - ゲームカード追加
- [x] カード画像 `src/assets/images/risk_lcd_card_bg.webp` の作成・配置
- [x] Web Fonts（Silkscreen/Orbitron）を `public/index.html` に追加
- [x] `README.md` 作成 - ゲーム説明・操作方法・技術詳細

## Phase 7: テスト・品質保証

- [x] `utils/game-logic.test.ts` - computeRank/comboMult/calcEffBf/mergeStyles のユニットテスト
- [x] `utils/random.test.ts` - Rand ユーティリティのユニットテスト
- [x] `hooks/useStore.test.ts` - localStorage 永続化のテスト
- [x] コンポーネントの基本レンダリングテスト（RiskLcdGame/TitleScreen/ResultScreen）
- [x] `npm run build` でビルドエラーがないことを確認
- [ ] ブラウザでの動作確認（全画面遷移/ゲームプレイ/セーブ）

## 完了状況

**全タスク**: 43/43 (カード画像・README は後日対応)
