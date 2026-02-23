# ゲームプラットフォーム ブラッシュアップ計画

## 背景

Game Platform（React 19 + TypeScript + styled-components）には13種類のブラウザゲームが収録されている。
以下の課題に対応し、ゲーム本体のコードに影響を与えずに共通レイアウト層で改善を行う。

## 課題

1. **SEO**: meta タグが古い（「6種類」）。OGP 未設定。robots.txt / sitemap.xml なし
2. **コピーライト**: `© 2025 Game Platform` のまま、niku9.click ドメイン未対応
3. **ヘッダー/フッター**: フルスクリーンゲーム4つが z-index: 50 で表示し、ヘッダー（z-index: 100）と干渉
4. **注意書き**: ゲームへの共通注意書きがない

## フェーズ構成

| フェーズ | 内容 | 影響範囲 |
|---------|------|---------|
| 1 | ドキュメント作成 | .docs/ のみ |
| 2 | SEO 対策 | public/index.html, 新規ファイル, src/hooks, src/App.tsx |
| 3 | コピーライト更新 | src/App.tsx |
| 4 | ヘッダー/フッター重なり対策 | src/hooks, src/App.tsx |
| 5 | 注意書き追加 | src/constants, src/components, src/App.tsx |
| 6 | テスト・検証 | テストファイル新規作成 |

## 制約

- ゲーム本体のコードは変更しない
- 既存テストを壊さない
- ビルドサイズ 400KB 制限内に収める
