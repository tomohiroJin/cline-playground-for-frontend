# KEYS & ARMS 移植タスク

## Phase 0: ドキュメント
- [x] plan.md 作成
- [x] spec.md 作成
- [x] tasks.md 作成

## Phase 1: コード移植
- [ ] styles.ts 作成（元CSS → styled-components）
- [ ] engine.ts 作成（createEngine クロージャ + 全ゲームコード）
- [ ] KeysAndArmsGame.tsx 作成（Canvas + 仮想パッド + engine起動）
- [ ] KeysAndArmsPage.tsx 書き換え（iframe → コンポーネント）

## Phase 2: テスト・ビルド
- [ ] KeysAndArmsPage.test.tsx 更新（Canvas テスト）
- [ ] npm test 成功
- [ ] npm run build 成功

## Phase 3: 検証
- [ ] タイトル画面表示
- [ ] ゲーム開始〜エンディング通しプレイ
- [ ] タッチ操作確認
- [ ] RST ボタン動作確認
- [ ] リサイズ動作確認
