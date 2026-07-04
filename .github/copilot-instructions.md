# GitHub Copilot 用指示書

React 19 + TypeScript + Jotai の Web ブラウザゲームプラットフォーム（13タイトル）。
設計原則: Clean Architecture, DDD, TDD, SOLID, DRY, DbC。

## 言語

- 応答・コメント・テストタイトル・ドキュメントは日本語。コード（変数名・関数名）は英語可。

## アーキテクチャ（依存方向: 外→内）

- `src/domain/` → 外部依存なし。`application/` → `domain/` のみ参照（外部依存は `ports/` で抽象化）。
  `infrastructure/` → ports を実装。`presentation/` → use-cases を呼び出す。
- 各ゲームは `src/features/<game-name>/` 配下に独自の Clean Architecture 層を持つ。
- `features/X/` → `shared/`, `types/` は参照可。他の `features/Y/` への参照は禁止。

## TDD

- テストを先に書く（Red → Green → Refactor）。テストは対象と同じディレクトリに `*.test.ts(x)`。
- テストは振る舞いベースで1テスト1挙動。カバレッジ目標: 新規コード 80%+、ビジネスロジック 90%+。

## コーディングルール

- `any` 禁止（`unknown` + 型ガード）。`const` 優先、`var` 禁止。
- 1関数1責務・30行以内目安。早期リターンでネストを浅く。パラメータ3個以内。
- マジックナンバーは名前付き定数へ。ブール変数は `is`/`has`/`can`/`should` 接頭辞。
- 関数コンポーネントのみ。Props は型定義必須。状態管理ロジックはカスタムフックへ分離。
- `dangerouslySetInnerHTML` 禁止。機密情報のハードコード禁止。

## 検証コマンド

```bash
npm run ci   # lint:ci + typecheck + test + build（コミット前に実行）
```
