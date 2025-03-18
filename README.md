# devcontainer-typescript

このリポジトリは、TypeScript の開発環境を VS Code の Dev Container 上に構築するサンプルを提供します。  
Docker コンテナ上で安定した Node.js + TypeScript 環境が用意されるため、ホスト OS に依存しない再現性の高い開発が可能になります。

## 特徴

- **Node.js 環境**：Dev Container 内で Node.js (LTS) を利用できるため、ローカル環境の汚染なしに開発できます。
- **TypeScript 対応**：`typescript` やサンプルの `tsconfig.json` をあらかじめ用意しています。
- **VS Code 拡張機能同梱**：`.devcontainer/devcontainer.json` で VS Code の拡張機能がプリインストールされるため、豊富な補完やデバッグ、リンティング体験がコンテナ内で完結します。

## 必要要件

- [Docker](https://www.docker.com/) がインストールされていること
- [Visual Studio Code](https://code.visualstudio.com/)
- [Remote Development 拡張機能パック](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)（特に「Remote - Containers」）

## 開発環境のセットアップ

1. **リポジトリをクローン**  

   ```bash
   git clone https://github.com/tomohiroJin/devcontainer-typescript.git
   cd devcontainer-typescript
   ```

2. **VS Code でフォルダを開く**  
   VS Code でこのディレクトリを開きます。

3. **Dev Container で開く**  
   コマンドパレット (`F1` または `Ctrl+Shift+P`) から `Remote-Containers: Open Folder in Container...` を選択し、このプロジェクトフォルダを指定します。VS Code は自動的にコンテナをビルド・起動し、開発環境が整います。

## プロジェクトの利用方法

- **ビルド**：  

  ```bash
  npm run build
  ```

  `dist` ディレクトリにトランスパイル後の JavaScript ファイルが出力されます。

- **テスト**：  
  テストスクリプトを `package.json` に定義している場合、以下で実行可能です。

  ```bash
  npm test
  ```

- **ESLint / Prettier の実行**：  
  コード整形や静的解析は次のコマンドで可能です（`npm scripts` に応じて調整してください）。

  ```bash
  npm run lint
  npm run format
  ```

## カスタマイズ

- **パッケージ追加**：  
  必要な NPM パッケージは、コンテナ内ターミナルで `npm install <package>` を実行して追加します。

- **Dev Container 設定の変更**：  
  `.devcontainer/devcontainer.json` を編集することで、インストールする拡張機能や Node.js のバージョン、コンテナ設定をカスタマイズできます。

- **ESLint / Prettier のルール調整**：  
  `.eslintrc.js` や `.prettierrc` ファイルを編集して、コーディング規約や整形ルールをプロジェクトに合わせて変更可能です。

## ライセンス

このプロジェクトは [MIT License](./LICENSE) の下でライセンスされています。自由にご利用・改変いただけます。

---

このリポジトリを活用することで、VS Code と Docker による再現性・移植性の高い TypeScript 開発環境を手軽に構築できます。是非活用してみてください。