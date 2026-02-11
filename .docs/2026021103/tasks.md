# KEYS & ARMS 移植タスク

## Phase 0: ドキュメント
- [x] plan.md 作成
- [x] spec.md 作成
- [x] tasks.md 作成

## Phase 1: コード移植
- [x] styles.ts 作成（元CSS → styled-components）
- [x] engine.ts 作成（createEngine クロージャ + 全ゲームコード）
- [x] KeysAndArmsGame.tsx 作成（Canvas + 仮想パッド + engine起動）
- [x] KeysAndArmsPage.tsx 書き換え（iframe → コンポーネント）

## Phase 2: テスト・ビルド
- [x] KeysAndArmsPage.test.tsx 更新（Canvas テスト）
- [x] npm test 成功
- [x] npm run build 成功

## Phase 3: 検証
- [x] タイトル画面表示
- [x] ゲーム開始〜エンディング通しプレイ
- [x] タッチ操作確認
- [x] RST ボタン動作確認
- [x] リサイズ動作確認

## Phase 4: クリーンアップ
- [x] レスポンシブ修正（engine.ts resize関数: parent.clientWidth → window.innerWidth*0.94）
- [x] 旧 index.html 削除（public/games/keys-and-arms/index.html）
- [x] README 更新（iframe記述の削除）
