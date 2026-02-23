# タスクチェックリスト

## フェーズ 1: ドキュメント
- [x] plan.md 作成
- [x] spec.md 作成
- [x] tasks.md 作成

## フェーズ 2: SEO
- [x] 2-1: meta タグ更新（public/index.html）
- [x] 2-2: robots.txt 作成（public/robots.txt）
- [x] 2-3: sitemap.xml 作成（public/sitemap.xml）
- [x] 2-4: manifest.json 作成（public/manifest.json）
- [x] 2-5: useDocumentTitle フック作成（src/hooks/useDocumentTitle.ts）
- [x] 2-6: App.tsx にフック組み込み
- [x] 2-7: 構造化データ追加（public/index.html）

## フェーズ 3: コピーライト
- [x] 3-1: フッター表記変更（src/App.tsx）
- [x] 3-2: フッターリンクスタイル

## フェーズ 4: ヘッダー/フッター
- [x] 4-1: useFullScreenRoute フック作成（src/hooks/useFullScreenRoute.ts）
- [x] 4-2: ヘッダー/フッター条件分岐（src/App.tsx）
- [x] 4-3: フローティングホームボタン（src/App.tsx）

## フェーズ 5: 注意書き
- [x] 5-1: ゲーム注意事項定数（src/constants/game-notices.ts）
- [x] 5-2: 注意書きコンポーネント（src/components/molecules/GameNotice.tsx）
- [x] 5-3: ゲームページラッパー（src/components/organisms/GamePageWrapper.tsx）
- [x] 5-4: ルーティング更新（src/App.tsx）

## フェーズ 6: テスト
- [x] 6-1: useDocumentTitle テスト
- [x] 6-2: useFullScreenRoute テスト
- [x] 6-3: GameNotice テスト
- [x] 6-4: GamePageWrapper テスト
- [x] 6-5: 既存テスト確認（npm test） — 137 suites, 1777 tests 全パス
- [x] 6-6: ビルド確認（npm run build） — 正常完了、エントリーポイント 287 KiB
