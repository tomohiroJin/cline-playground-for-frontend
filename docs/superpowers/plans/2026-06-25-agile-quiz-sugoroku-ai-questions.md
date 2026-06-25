# Agile Quiz Sugoroku AI クイズ追加 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agile Quiz Sugoroku に新タグ `ai`（AI活用）を追加し、AI支援開発と生成AI基礎を混在させた32問を既存8カテゴリへ文脈別に配置する。

**Architecture:** タグマスタ（`tag-master.ts`）を源泉に新ジャンルを1つ足すと、勉強会のジャンル選択UIと結果画面の正答率分析へ自動反映される。問題は工程別JSONへ分散追加し、TDDのRed（全タグ最低1問テスト）→Greenサイクルで安全に進める。最後に問数バランス契約・キャラ対応・ドキュメントを更新する。

**Tech Stack:** TypeScript / React 19 / Jest 30 / JSON データファイル

## Global Constraints

- 問題スキーマ厳守: `question`(string) / `options`(4要素 string配列) / `answer`(0-3 number) / `tags`(string配列, 1つ以上) / `explanation`(string 必須)
- `tags` の値は `tag-master.ts` の `VALID_TAG_IDS` に存在するもののみ
- `any` 型禁止（`unknown` + 型ガード）
- 編集方針: 概念ベースで書き陳腐化を避ける（製品バージョン番号・価格・最新モデル名を使わない）。正解位置を 0〜3 に散らす。誤答選択肢はもっともらしく作る
- 各タスク完了時にそのタスクのテストが緑であること。全完了後に `npm run ci` 通過
- コミットは Conventional Commits（`feat:` / `test:` / `docs:`）、本文は日本語、末尾に `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- 作業ブランチ: `feature/aqs-ai-questions`（設計書コミット済み）
- コマンドは feature ルート `/workspaces/claym/local/cline-playground-for-frontend` から実行

---

## ファイル構成

| ファイル | 役割 | 変更 |
|---|---|---|
| `src/features/agile-quiz-sugoroku/data/questions/tag-master.ts` | タグ定義の源泉 | `ai` タグ追加 |
| `.../data/questions/impl1.json` | 実装1問題 | AI問題6問追加 |
| `.../data/questions/impl2.json` | 実装2問題 | AI問題6問追加 |
| `.../data/questions/planning.json` | 計画問題 | AI問題3問追加 |
| `.../data/questions/refinement.json` | リファインメント問題 | AI問題3問追加 |
| `.../data/questions/test1.json` | テスト1問題 | AI問題3問追加 |
| `.../data/questions/test2.json` | テスト2問題 | AI問題3問追加 |
| `.../data/questions/review.json` | レビュー問題 | AI問題4問追加 |
| `.../data/questions/emergency.json` | 緊急対応問題 | AI問題4問追加 |
| `.../__tests__/questions.test.ts` | 問題データ品質契約 | `MIN_COUNT` に `ai: 30` 追加 |
| `.../domain/narrative/character-reactions.ts` | 正解時の反応キャラ判定 | `neko` に `ai` 追加 |
| `.../domain/narrative/character-genre-map.ts` | 勉強会ジャンル自動選択 | `neko` に `ai` 追加 |
| `.../doc/quiz-content.md` | コンテンツドキュメント | 問数・ジャンル数更新 |
| `.../README.md` | feature README | 問数・ジャンル数更新 |

> **JSON 追記方法（全 JSON 共通）:** 各ファイルは問題オブジェクトの配列 `[ {...}, {...} ]`。閉じ括弧 `]` の直前に、新しい問題オブジェクトをカンマ区切りで挿入する。直前の既存最終オブジェクトの後ろにカンマを補うこと。挿入後 `npx tsc --noEmit` ではなく後述のテストで JSON 妥当性を確認する（`index.ts` の `assertQuestionArray` が不正スキーマを実行時に弾く）。

---

### Task 1: `ai` タグ定義 + impl1 へAI問題6問（生成AI基礎）

このタスクで「全タグ最低1問」契約を満たすため、タグ定義とimpl1問題を同一コミットにまとめる。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/tag-master.ts`
- Modify: `src/features/agile-quiz-sugoroku/data/questions/impl1.json`
- Test: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts`（既存。新規記述なし）

**Interfaces:**
- Produces: タグID `ai`（`VALID_TAG_IDS` に追加され、以降の全タスクの問題が `tags: ["ai", ...]` で参照可能になる）

- [ ] **Step 1: タグを追加する前にテストが緑であることを確認**

Run: `npm test -- questions.test.ts`
Expected: PASS（既存445問・16タグの状態）

- [ ] **Step 2: `tag-master.ts` に `ai` タグを追加**

`TAG_MASTER` 配列の最後の要素（`{ id: 'team', ... }`）の後にカンマを補い、次を追加する:

```typescript
  { id: 'team', name: 'チーム・改善', description: 'レトロ・FB・心理的安全性', color: '#fb923c' },
  { id: 'ai', name: 'AI活用', description: 'LLM・生成AI・AIコーディング・プロンプト・AI倫理', color: '#e879f9' },
];
```

- [ ] **Step 3: テストが赤になることを確認（Red）**

Run: `npm test -- questions.test.ts`
Expected: FAIL — 「全タグが最低1問で使用されている」が `ai` 未使用で失敗する

- [ ] **Step 4: `impl1.json` の閉じ括弧 `]` の直前に6問を追加（Green 化）**

直前の既存最終オブジェクトの後にカンマを補い、以下を挿入する:

```json
  {
    "question": "LLMにおける「トークン」とは何を指すか？",
    "options": ["テキストを分割した処理単位", "APIの認証キー", "GPUのメモリ単位", "学習エポックの回数"],
    "answer": 0,
    "tags": ["ai", "programming"],
    "explanation": "LLMは文章を単語より細かいトークン単位に分割して処理する。"
  },
  {
    "question": "生成AIの「ハルシネーション」とは？",
    "options": ["事実と異なる内容をもっともらしく生成する現象", "応答が極端に遅くなる現象", "同じ回答を繰り返す現象", "入力を拒否する現象"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "ハルシネーションは誤った情報を自信ありげに出力する現象で、出力検証が重要。"
  },
  {
    "question": "LLMの「コンテキストウィンドウ」が表すものは？",
    "options": ["一度に扱えるトークンの最大量", "学習データの総量", "生成速度の上限", "同時接続数の上限"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "コンテキストウィンドウは入力＋出力で扱えるトークン上限を指す。"
  },
  {
    "question": "生成AIの出力をランダム性の強さで調整するパラメータは？",
    "options": ["temperature（温度）", "latency（遅延）", "throughput（スループット）", "checksum（チェックサム）"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "temperatureが高いほど多様で創造的、低いほど決定的な出力になる。"
  },
  {
    "question": "AIコード補完ツールを実装に使う際の最も適切な姿勢は？",
    "options": ["提案を理解しレビューした上で採用する", "提案をそのまま全て採用する", "提案は一切使わない", "テストを書かずに信頼する"],
    "answer": 0,
    "tags": ["ai", "code-quality"],
    "explanation": "AI提案は誤りを含み得るため、内容を理解しレビューして取り込むのが基本。"
  },
  {
    "question": "AIペアプログラミングの利点として最も適切なものは？",
    "options": ["定型コードの下書きを高速化できる", "設計判断を完全に自動化できる", "テストが不要になる", "仕様の正しさを保証できる"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "AIは雛形生成や定型処理の高速化に有効だが、設計判断や検証は人が担う。"
  }
];
```

- [ ] **Step 5: テストが緑に戻ることを確認**

Run: `npm test -- questions.test.ts`
Expected: PASS（`ai` タグが6問で使用され全契約を満たす）

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/tag-master.ts src/features/agile-quiz-sugoroku/data/questions/impl1.json
git commit -m "$(cat <<'EOF'
feat: AQS に AIタグと生成AI基礎の問題6問を追加(impl1)

- tag-master に ai(AI活用) タグを追加し17ジャンルに拡張
- impl1 にトークン/ハルシネーション/コンテキストウィンドウ等6問

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: impl2 へAI問題6問（RAG・プロンプト・ファインチューニング）

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/impl2.json`
- Test: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts`（既存）

**Interfaces:**
- Consumes: タグID `ai`（Task 1 で定義済み）

- [ ] **Step 1: `impl2.json` の `]` 直前に6問を追加**

直前の既存最終オブジェクトの後にカンマを補い、以下を挿入する:

```json
  {
    "question": "RAG（Retrieval-Augmented Generation）の説明として正しいものは？",
    "options": ["外部知識を検索して回答生成に活用する手法", "モデルを再学習する手法", "出力を要約する手法", "画像を生成する手法"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "RAGは検索した関連文書をプロンプトに与え、最新・固有情報に基づく回答を作る。"
  },
  {
    "question": "ファインチューニングとプロンプト調整の違いとして適切なものは？",
    "options": ["ファインチューニングはモデルの重みを更新する", "プロンプト調整はモデルを再学習する", "両者は同じ処理である", "ファインチューニングは入力文だけ変える"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "ファインチューニングは追加学習で重みを更新、プロンプト調整は入力の工夫で挙動を変える。"
  },
  {
    "question": "プロンプトに数例の入出力を示して期待動作を伝える手法は？",
    "options": ["Few-shot プロンプティング", "Zero-shot 学習", "バックプロパゲーション", "正則化"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "Few-shotは例示によりタスクの形式や期待を伝え、出力品質を高める。"
  },
  {
    "question": "テキストを意味的な数値ベクトルに変換したものを何と呼ぶか？",
    "options": ["埋め込み（embedding）", "ハッシュ値", "トランザクション", "コンパイル結果"],
    "answer": 0,
    "tags": ["ai", "data-structures"],
    "explanation": "埋め込みは意味の近さをベクトル距離で表し、検索や分類に使われる。"
  },
  {
    "question": "対話AIにおける「システムプロンプト」の役割は？",
    "options": ["AIの振る舞いや制約を事前に方向づける", "ユーザーの最後の発言を保存する", "応答速度を制御する", "課金額を決める"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "システムプロンプトは役割・トーン・制約を与え、応答全体の方針を定める。"
  },
  {
    "question": "複雑な問題で推論過程を順に出力させる手法は？",
    "options": ["Chain-of-Thought（思考の連鎖）", "ロードバランシング", "ガベージコレクション", "メモ化"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "Chain-of-Thoughtは途中の推論を明示させ、複雑なタスクの正答率を高める。"
  }
];
```

- [ ] **Step 2: テストが緑であることを確認**

Run: `npm test -- questions.test.ts`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/impl2.json
git commit -m "$(cat <<'EOF'
feat: AQS impl2 に生成AI応用の問題6問を追加

- RAG/ファインチューニング/Few-shot/埋め込み/システムプロンプト/CoT

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: planning + refinement へAI問題6問

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/planning.json`
- Modify: `src/features/agile-quiz-sugoroku/data/questions/refinement.json`
- Test: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts`（既存）

**Interfaces:**
- Consumes: タグID `ai`

- [ ] **Step 1: `planning.json` の `]` 直前に3問を追加**

```json
  {
    "question": "AIに見積もりを補助させる際の最も適切な使い方は？",
    "options": ["参考値として人の見積もりと突き合わせる", "AIの数値をそのまま採用する", "見積もりを完全に廃止する", "AIに全責任を負わせる"],
    "answer": 0,
    "tags": ["ai", "estimation"],
    "explanation": "AIの見積もりは参考。チームの合意とすり合わせる前提で使う。"
  },
  {
    "question": "AIでユーザーストーリーの草案を作るときの注意点は？",
    "options": ["内容の妥当性をPOやチームが検証する", "生成された文をそのまま確定する", "受け入れ条件は不要になる", "優先順位付けが自動で正しくなる"],
    "answer": 0,
    "tags": ["ai", "backlog"],
    "explanation": "AIは草案作成を加速するが、価値や受け入れ条件の妥当性は人が判断する。"
  },
  {
    "question": "プランニングでAIの提案を扱う際に避けるべき態度は？",
    "options": ["出力を検証せず鵜呑みにする", "前提や根拠を確認する", "複数案を比較する", "チームで議論の材料にする"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "AI出力は誤りや古い前提を含み得るため、鵜呑みにせず検証する。"
  }
];
```

- [ ] **Step 2: `refinement.json` の `]` 直前に3問を追加**

```json
  {
    "question": "AIのリファクタリング提案を取り込む際に必須なことは？",
    "options": ["既存テストで挙動が変わらないと確認する", "テストなしで即マージする", "提案を必ず全採用する", "レビューを省略する"],
    "answer": 0,
    "tags": ["ai", "refactoring"],
    "explanation": "リファクタリングは振る舞いを変えないことが要件。テストで保証してから取り込む。"
  },
  {
    "question": "AIによる技術的負債の検出を活用する適切な方法は？",
    "options": ["指摘を優先度付けの入力として使う", "指摘をすべて即時に直す", "指摘を無条件に無視する", "負債管理をAIに一任する"],
    "answer": 0,
    "tags": ["ai", "refactoring"],
    "explanation": "AIの指摘は気づきの材料。影響とコストを評価し優先順位を人が決める。"
  },
  {
    "question": "AIが生成したコードに対するリファインメント時の前提は？",
    "options": ["人によるレビューと理解が必要", "生成元が同じなら品質は均一", "レビュー不要で高品質", "テスト対象外にできる"],
    "answer": 0,
    "tags": ["ai", "code-quality"],
    "explanation": "AI生成コードも品質はばらつくため、理解とレビューを経て取り込む。"
  }
];
```

- [ ] **Step 3: テストが緑であることを確認**

Run: `npm test -- questions.test.ts`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/planning.json src/features/agile-quiz-sugoroku/data/questions/refinement.json
git commit -m "$(cat <<'EOF'
feat: AQS planning/refinement に AI活用の問題6問を追加

- 計画: AI見積もり補助/US草案/出力検証
- リファインメント: リファクタ提案/負債検出/生成コードの品質

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: test1 + test2 へAI問題6問

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/test1.json`
- Modify: `src/features/agile-quiz-sugoroku/data/questions/test2.json`
- Test: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts`（既存）

**Interfaces:**
- Consumes: タグID `ai`

- [ ] **Step 1: `test1.json` の `]` 直前に3問を追加**

```json
  {
    "question": "AIにテストケースを生成させる利点として適切なものは？",
    "options": ["観点の網羅やエッジケースの洗い出しを補助できる", "仕様の正しさを保証できる", "テスト設計が不要になる", "実行環境が自動構築される"],
    "answer": 0,
    "tags": ["ai", "testing"],
    "explanation": "AIは抜けやすいケースの提案に有効。仕様の正しさ自体は人が担保する。"
  },
  {
    "question": "AI生成テストの限界として正しいものは？",
    "options": ["仕様の意図を誤解したテストを作り得る", "常に100%のカバレッジになる", "必ずバグを検出できる", "保守が一切不要になる"],
    "answer": 0,
    "tags": ["ai", "testing"],
    "explanation": "AIはコードの見た目から推測するため、本来の意図と異なるテストになり得る。"
  },
  {
    "question": "AIでカバレッジを上げる際に陥りやすい誤りは？",
    "options": ["意味の薄いテストで数値だけ上げる", "境界値を意識する", "意図を確認する", "重複テストを整理する"],
    "answer": 0,
    "tags": ["ai", "testing"],
    "explanation": "カバレッジは手段。数値合わせの無意味なテスト量産は品質に寄与しない。"
  }
];
```

- [ ] **Step 2: `test2.json` の `]` 直前に3問を追加**

```json
  {
    "question": "AIコードレビューの適切な位置づけは？",
    "options": ["人のレビューを補助する一次チェック", "人のレビューを完全に置き換える", "マージ可否の最終決定者", "テストの代替"],
    "answer": 0,
    "tags": ["ai", "code-quality"],
    "explanation": "AIレビューは早期の気づきに有効だが、最終判断は人が行う補助手段。"
  },
  {
    "question": "静的解析にAIを組み合わせる利点として適切なものは？",
    "options": ["文脈を踏まえた指摘や説明を補える", "誤検知が必ずゼロになる", "ルール設定が不要になる", "実行時バグを完全に防げる"],
    "answer": 0,
    "tags": ["ai", "ci-cd"],
    "explanation": "AIは指摘の文脈説明や優先度付けを補助できるが、誤検知はなお発生する。"
  },
  {
    "question": "AIレビューと人間レビューの望ましい関係は？",
    "options": ["併用し役割を分担する", "どちらか一方だけにする", "AIの指摘は常に優先する", "人の指摘は記録しない"],
    "answer": 0,
    "tags": ["ai", "team"],
    "explanation": "機械的指摘はAI、設計意図やトレードオフは人、と補完的に使うのが効果的。"
  }
];
```

- [ ] **Step 3: テストが緑であることを確認**

Run: `npm test -- questions.test.ts`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/test1.json src/features/agile-quiz-sugoroku/data/questions/test2.json
git commit -m "$(cat <<'EOF'
feat: AQS test1/test2 に AIテスト活用の問題6問を追加

- test1: AIテスト生成の利点/限界/カバレッジの誤り
- test2: AIコードレビュー/静的解析併用/人との分担

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: review + emergency へAI問題8問

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/review.json`
- Modify: `src/features/agile-quiz-sugoroku/data/questions/emergency.json`
- Test: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts`（既存）

**Interfaces:**
- Consumes: タグID `ai`

- [ ] **Step 1: `review.json` の `]` 直前に4問を追加**

```json
  {
    "question": "AI生成コードをレビューする際に特に重視すべき観点は？",
    "options": ["正しさ・セキュリティ・意図との一致", "生成にかかった時間", "コメントの量だけ", "変数名の長さだけ"],
    "answer": 0,
    "tags": ["ai", "code-quality"],
    "explanation": "AI生成でも要件適合・安全性・意図整合を人が確認する必要がある。"
  },
  {
    "question": "AI生成物の利用で注意すべき法務・ライセンス上の論点は？",
    "options": ["著作権やライセンス条件の確認", "生成速度の上限", "GPUの種類", "プロンプトの長さ"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "学習データ由来の権利やライセンス整合は組織方針に沿って確認する。"
  },
  {
    "question": "AIの「バイアス」に関する説明として正しいものは？",
    "options": ["学習データの偏りが出力に反映され得る", "AIは常に中立で偏りはない", "バイアスは速度の指標である", "バイアスは暗号化の一種である"],
    "answer": 0,
    "tags": ["ai"],
    "explanation": "学習データの偏りは差別的・不公平な出力につながり得るため監視が必要。"
  },
  {
    "question": "AIを業務に活用する際の説明責任（アカウンタビリティ）の考え方は？",
    "options": ["最終的な意思決定と責任は人が負う", "責任はAI提供元のみにある", "出力は検証不要", "記録は残さない"],
    "answer": 0,
    "tags": ["ai", "team"],
    "explanation": "AIは支援であり、意思決定と結果への責任は利用する人・組織が負う。"
  }
];
```

- [ ] **Step 2: `emergency.json` の `]` 直前に4問を追加**

```json
  {
    "question": "AIOps の説明として最も適切なものは？",
    "options": ["AI/機械学習で運用・監視を高度化する取り組み", "AIを売買する市場", "AI専用のOS", "AIの倫理規定"],
    "answer": 0,
    "tags": ["ai", "sre"],
    "explanation": "AIOpsはログ・メトリクスをAIで分析し、検知や対応を効率化する。"
  },
  {
    "question": "AIによる異常検知の利点として適切なものは？",
    "options": ["大量メトリクスから予兆を早期に捉えやすい", "障害が必ずゼロになる", "監視設定が不要になる", "アラートが100%正確になる"],
    "answer": 0,
    "tags": ["ai", "sre"],
    "explanation": "AIは平常パターンからの逸脱検出に有効だが、誤検知の調整は必要。"
  },
  {
    "question": "インシデントのRCA（根本原因分析）でAIを使う適切な方法は？",
    "options": ["関連ログの相関や仮説出しを補助させる", "原因確定をAIに一任する", "再発防止策を省略する", "ポストモーテムを書かない"],
    "answer": 0,
    "tags": ["ai", "incident"],
    "explanation": "AIは相関発見や仮説生成の補助に有効。確定と対策は人が検証して決める。"
  },
  {
    "question": "AIアラートの誤検知（偽陽性）が多い場合の適切な対応は？",
    "options": ["閾値やモデルを継続的にチューニングする", "アラートを全て無効化する", "全アラートを手動確認し続ける", "監視自体をやめる"],
    "answer": 0,
    "tags": ["ai", "sre"],
    "explanation": "偽陽性はアラート疲れを招くため、閾値やモデルの調整で精度を保つ。"
  }
];
```

- [ ] **Step 3: テストが緑であることを確認（この時点で ai タグ32問）**

Run: `npm test -- questions.test.ts`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/review.json src/features/agile-quiz-sugoroku/data/questions/emergency.json
git commit -m "$(cat <<'EOF'
feat: AQS review/emergency に AI倫理・AIOpsの問題8問を追加

- review: 生成コードのレビュー観点/著作権/バイアス/説明責任
- emergency: AIOps/異常検知/RCA補助/誤検知対応
- これで ai タグは計32問

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 問数バランス契約（`MIN_COUNT`）に `ai` を追加

32問が揃ったので、将来の削減を防ぐ最低問数契約を追加する。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts:109-118`

**Interfaces:**
- Consumes: `ai` タグ付き32問（Task 1〜5）

- [ ] **Step 1: `MIN_COUNT` に `ai: 30` を追加**

`questions.test.ts` の `MIN_COUNT` オブジェクトを次に変更する:

```typescript
      const MIN_COUNT: Record<string, number> = {
        'design-patterns': 25,
        agile: 25,
        'ci-cd': 25,
        'data-structures': 24,
        estimation: 24,
        programming: 24,
        refactoring: 24,
        ai: 30,
      };
```

- [ ] **Step 2: テストが緑であることを確認（ai 32問 ≥ 30）**

Run: `npm test -- questions.test.ts`
Expected: PASS

- [ ] **Step 3: 検証 — `MIN_COUNT` が機能するか確認（Red を一時確認）**

`ai: 30` を一時的に `ai: 40` に書き換えて実行する:

Run: `npm test -- questions.test.ts`
Expected: FAIL（`ai` が32問で40に満たず失敗 → 契約が効いていることを確認）

確認後 `ai: 30` に戻す。

- [ ] **Step 4: 戻したことを確認**

Run: `npm test -- questions.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/agile-quiz-sugoroku/__tests__/questions.test.ts
git commit -m "$(cat <<'EOF'
test: AQS の問数バランス契約に ai:30 を追加

- AIジャンルが将来削られないよう最低問数を契約化

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: キャラクター対応（ネコ／Dev に `ai` を紐づけ）

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/domain/narrative/character-reactions.ts:44-48`
- Modify: `src/features/agile-quiz-sugoroku/domain/narrative/character-genre-map.ts:39-44`
- Test: `src/features/agile-quiz-sugoroku/__tests__/character-genre-map.test.ts` および `character-reactions.test.ts`（既存）

**Interfaces:**
- Consumes: タグID `ai`、キャラID `neko`

- [ ] **Step 1: `character-reactions.ts` の `CHARACTER_TAG_MAP` の `neko` に `ai` を追加**

```typescript
export const CHARACTER_TAG_MAP: Record<string, string[]> = {
  neko: ['design-principles', 'design-patterns', 'programming', 'code-quality', 'refactoring', 'ai'],
  inu: ['scrum', 'agile', 'estimation', 'backlog', 'team'],
  usagi: ['testing', 'ci-cd', 'sre', 'incident', 'release'],
};
```

- [ ] **Step 2: `character-genre-map.ts` の `neko` エントリの `genres` に `ai` を追加**

```typescript
  {
    characterId: 'neko',
    characterName: 'ネコ',
    emoji: '🐱',
    role: 'Dev',
    genres: ['design-principles', 'design-patterns', 'programming', 'data-structures', 'refactoring', 'ai'],
  },
```

- [ ] **Step 3: 関連テストが緑であることを確認**

Run: `npm test -- character-genre-map.test.ts character-reactions.test.ts`
Expected: PASS（既存テストが新ジャンル追加で壊れないこと。壊れる場合は期待値が `ai` を含むよう既存テストを更新する）

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/domain/narrative/character-reactions.ts src/features/agile-quiz-sugoroku/domain/narrative/character-genre-map.ts
git commit -m "$(cat <<'EOF'
feat: AQS でネコ(Dev)に ai ジャンルを紐づけ

- 正解時の反応キャラ判定(CHARACTER_TAG_MAP)に ai を追加
- 勉強会のジャンル自動選択(CHARACTER_GENRE_MAP)に ai を追加

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: ドキュメント更新（問数・ジャンル数）

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/doc/quiz-content.md`
- Modify: `src/features/agile-quiz-sugoroku/README.md`

**Interfaces:** なし（ドキュメントのみ）

- [ ] **Step 1: 実際のカテゴリ別問数を確認**

Run: `for f in planning impl1 impl2 test1 test2 refinement review emergency; do printf "%s: " "$f"; node -e "console.log(require('./src/features/agile-quiz-sugoroku/data/questions/'+process.argv[1]+'.json').length)" "$f"; done`
Expected: 各カテゴリ数を出力（planning 77 / impl1 73 / impl2 68 / test1 55 / test2 55 / refinement 55 / review 47 / emergency 47 を想定。合計477）

> 実出力が想定とずれた場合は、以下のドキュメント記載をその実数に合わせる。

- [ ] **Step 2: `quiz-content.md` を更新**

- 冒頭「全445問」→「全477問」
- 「16ジャンルのタグシステム」→「17ジャンルのタグシステム」
- 「カテゴリ別問題数」表を Step 1 の実数に更新（合計 477問）
- 「16ジャンル（タグ）一覧」表の見出しを「17ジャンル」にし、末尾に行を追加:

```markdown
| 17 | AI活用 | `ai` | 32問 |
```

- [ ] **Step 3: `README.md` を更新**

- 「全306問」→「全477問」（既存記載が陳腐化しているため新総数へ統一）
- 「16ジャンルのタグシステム」→「17ジャンルのタグシステム」
- ドキュメント参照表の「16ジャンル一覧」→「17ジャンル一覧」

- [ ] **Step 4: CI 全パイプラインで最終確認**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build がすべて PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/agile-quiz-sugoroku/doc/quiz-content.md src/features/agile-quiz-sugoroku/README.md
git commit -m "$(cat <<'EOF'
docs: AQS のクイズ問数・ジャンル数を更新(477問/17ジャンル)

- AIタグ32問の追加を反映
- README の陳腐化した問数(306)を新総数に統一

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**1. Spec coverage:**
- §3 タグ設計 → Task 1（`ai` タグ定義）✓
- §4 配置設計（32問を8カテゴリへ）→ Task 1〜5（6+6+6+6+8=32）✓
- §5 品質契約 → Global Constraints + 既存 `questions.test.ts` が自動検証 ✓
- §6 必須変更 → Task 1〜6 ✓ / キャラ対応 → Task 7 ✓ / ドキュメント → Task 8 ✓
- §7 実装順序（Red→Green→MIN_COUNT→キャラ→docs→ci）→ Task 1〜8 が同順 ✓
- §8 スコープ外（新カテゴリ・複数タグ・既存改変なし）→ 計画に含めず ✓

**2. Placeholder scan:** 全問題に実コンテンツ・選択肢・answer・explanation を記載。「適切なエラー処理を追加」等の曖昧指示なし。Task 8 Step 1 の問数は想定値を示しつつ実数確認の手順を明記。✓

**3. Type consistency:** タグID `ai` は全タスクで一貫。キャラID `neko`、`MIN_COUNT` キー名（`ai`）、関数 `getGenresForCharacters`/`getExpertCharacterForTags` は既存定義どおり。問題スキーマのキー名（question/options/answer/tags/explanation）は全32問で一致。✓

**配置確認:** 各カテゴリの追加問数 — planning:3, impl1:6, impl2:6, test1:3, test2:3, refinement:3, review:4, emergency:4 = 合計32。ai タグ付与は全32問 → `MIN_COUNT ai:30` を満たす。✓
