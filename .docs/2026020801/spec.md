# Lintエラー修正 仕様

## 1. 入力
- コマンド: `npm run lint`
- 対象ルール群: `@typescript-eslint`, `react-hooks`, `prefer-const`

## 2. 対応対象の分類

### 2.1 未使用シンボル
- `@typescript-eslint/no-unused-vars` エラーを解消する。
- 方法: 不要なimport/変数の削除、または利用箇所追加。

### 2.2 型安全性
- `@typescript-eslint/no-explicit-any` エラーを解消する。
- 方法: 具体型へ置換。

### 2.3 変数宣言の最適化
- `prefer-const` エラーを解消する。
- 方法: 再代入が無い `let` を `const` に変更。

### 2.4 React Hooks関連
- `react-hooks/refs` と `react-hooks/purity` のエラーを解消する。
- 方法: render中のrefアクセスやimpure初期化を安全な形へ変更。

### 2.5 preserve-manual-memoization
- `react-hooks/preserve-manual-memoization` の扱いを統一。
- 方針: 現状コードの意図を維持しつつ、必要に応じてESLintルール設定を最小変更で調整。

## 3. 検証仕様
- lint再実行でエラー0 / warning0 を達成すること。
- 変更に伴う型エラー・構文エラーが発生しないこと。

## 4. システムテスト影響範囲

### 4.1 対象画面
- `src/pages/IpnePage.tsx`

### 4.2 確認シナリオ
1. ゲーム開始フロー（タイトル→職業選択→プロローグ→ゲーム）
2. 移動・攻撃・敵接触・壁発見の基本プレイ
3. レベルアップポイント獲得後のモーダル表示/消費
4. ゲームオーバー遷移とリトライ挙動
5. ゲームクリア遷移、タイマー/評価/記録の更新

## 5. 成果物
- lint修正済みコード
- `plan.md` / `spec.md` / `tasks.md`
