---
trigger: always_on
---

# TypeScript Workspace Guidelines

## 1. Type Safety & Strictness
- **NO `any`:** `any` 型の使用は禁止です。型が不明な場合は `unknown` を使用し、必ず Type Guard (型ガード) や Zod などのバリデーションを経て型を確定させてください。
- **NO `enum`:** TypeScript の `enum` は使用しないでください（Nominal Typing の問題やバンドルサイズ増加のため）。
    - 代わりに **Union Types** (`type State = 'pending' | 'done'`) または **Object Literal with `as const`** を使用してください。
- **Strict Null Checks:** `null` は使用せず、`undefined` を使用してください。API の戻り値などで `null` が混入する場合は、境界（Repository層など）で排除または変換してください。

## 2. Functional & Immutable Style
- **Immutability by Default:**
    - 変数は `let` ではなく `const` を使用してください。
    - 配列は `Array<T>` ではなく `ReadonlyArray<T>` または `readonly T[]` をデフォルトとしてください。
    - オブジェクトのプロパティには可能な限り `readonly` 修飾子をつけてください。
- **Pure Functions:** 副作用のある関数と純粋関数を明確に分離してください。ロジックは純粋関数に集約し、副作用はアーキテクチャの外殻（Controller/Driver）に寄せてください。
- **Expressions over Statements:** `if` 文や `switch` 文よりも、三項演算子やオブジェクトマッピング、即時関数などの「式」として評価できる記述を優先してください。

## 3. DDD & Modeling Patterns
- **Branded Types (Opaque Types):** ID や特定の値を表すプリミティブ型には、単純な `string` や `number` を使わず、Branded Types を使用して型安全性を確保してください。（例: `type UserId = string & { __brand: 'UserId' }`）
- **Discriminated Unions:** 状態遷移やポリモーフィズムを表現する場合は、クラスの継承よりも「判別可能な Union 型 (Discriminated Unions)」を使用し、`switch (item.kind)` 等で網羅性チェックを行ってください。
- **Error Handling:** 例外 (`throw`) を投げず、**Result 型** (`Ok / Err`) を返却するパターン（Railway Oriented Programming）を推奨します。

## 4. Testing (TDD)
- テストファイルでは、`describe` / `it` の構造を使い、ドキュメントとして読めるように「振る舞い」を記述してください。
- テスト内での型アサーション (`as`) は、テストデータの作成時以外は避けてください。