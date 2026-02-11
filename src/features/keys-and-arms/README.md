# KEYS & ARMS

## 概要

元ファイル `keys-and-arms.html` をそのまま実行する忠実移植版です。
ゲームロジックの再実装は行わず、原本HTMLを `public/` 配下へ配置し iframe で表示します。

## 配置構成

```text
public/games/keys-and-arms/index.html   # 元HTML本体（原本移植）
src/pages/KeysAndArmsPage.tsx            # iframeラッパーページ
src/features/keys-and-arms/README.md     # このドキュメント
```

## 実装方針

- プラットフォーム統合（ゲーム一覧・ルーティング）は React 側で担当
- ゲーム本体の見た目・操作・進行は原本HTMLの挙動を維持

## 起動URL

- `/keys-and-arms`
- ページ内部で `/games/keys-and-arms/index.html` を読み込みます
