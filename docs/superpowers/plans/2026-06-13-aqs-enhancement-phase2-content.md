# AQS ブラッシュアップ Phase 2（コンテンツ）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** クイズの下位タグを底上げして出題バランスを是正し（約 +79 問）、解説に関連タグチップを表示して学習導線を強化する。

**Architecture:** 問題は既存 JSON（`data/questions/*.json`）へ追記。検証は既存 `__tests__/questions.test.ts` に「下位タグの最小問題数」テストを追加して TDD 化。関連タグチップは新規 presentation コンポーネントとして切り出し、既存の解説表示箇所へ差し込む。

**Tech Stack:** TypeScript / JSON / Jest 30 + @testing-library/react

**対象ディレクトリ:** `src/features/agile-quiz-sugoroku/`

**前提:** Phase 1 完了後のブランチから派生（`feature/aqs-content` 等）。Phase 1 未完でも問題追加（Task 1〜5）は独立して着手可能。Task 6 の関連タグチップは Phase 1 のトークンを使うと綺麗。

**タグ別の追加目標（合計 +79）:**

| タグ(id) | 現状 | 目標 | 追加 | 投入先 |
|----------|------|------|------|--------|
| design-patterns | 8 | 25 | +17 | impl1.json / impl2.json |
| agile | 10 | 25 | +15 | planning.json |
| ci-cd | 11 | 25 | +14 | test1.json / test2.json |
| data-structures | 14 | 24 | +10 | impl1.json / impl2.json |
| estimation | 15 | 24 | +9 | planning.json |
| programming | 17 | 24 | +7 | impl1.json / impl2.json |
| refactoring | 17 | 24 | +7 | refinement.json |

**問題フォーマット（厳守）:** `{ "question": string, "options": string[4], "answer": 0-3, "tags": string[], "explanation": string }`。`answer` は正解選択肢のインデックス。タグ id は `data/questions/tag-master.ts` の `VALID_TAG_IDS` のもの。

---

### Task 1: 下位タグ最小問題数の検証テストを追加（TDD の Red）

問題を足す前に「下位タグが目標数に達している」テストを追加し、失敗させる。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/__tests__/questions.test.ts`

- [ ] **Step 1: 失敗するテストを追記**

`questions.test.ts` の `describe('タグ検証', ...)` 内に追加:

```typescript
    it('下位タグが最小問題数を満たす（出題バランス）', () => {
      const MIN_COUNT: Record<string, number> = {
        'design-patterns': 25,
        agile: 25,
        'ci-cd': 25,
        'data-structures': 24,
        estimation: 24,
        programming: 24,
        refactoring: 24,
      };
      const counts: Record<string, number> = {};
      expectedCategories.forEach((category) => {
        QUESTIONS[category].forEach((q) => {
          q.tags?.forEach((tag) => {
            counts[tag] = (counts[tag] ?? 0) + 1;
          });
        });
      });
      Object.entries(MIN_COUNT).forEach(([tag, min]) => {
        expect(counts[tag] ?? 0).toBeGreaterThanOrEqual(min);
      });
    });
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- questions.test.ts`
Expected: FAIL（`design-patterns` などが目標未満）

- [ ] **Step 3: コミット（Red を記録）**

```bash
git add src/features/agile-quiz-sugoroku/__tests__/questions.test.ts
git commit -m "test: AQS 下位タグの最小問題数検証を追加（Red）"
```

---

### Task 2: agile / estimation を planning.json に追加（+24）

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/planning.json`

- [ ] **Step 1: agile タグ問題を +15 追加**

`planning.json` の配列末尾（最後の `}` の後、`]` の前）に追記。重複しない論点で 15 問。例（同じ形式で 15 問用意する）:

```json
  {
    "question": "アジャイルソフトウェア開発宣言が最も重視する価値はどれか？",
    "options": [
      "包括的なドキュメントよりも動くソフトウェア",
      "個人よりもプロセスとツール",
      "顧客との協調よりも契約交渉",
      "変化への対応よりも計画に従うこと"
    ],
    "answer": 0,
    "tags": ["agile"],
    "explanation": "アジャイル宣言は『動くソフトウェアを』『顧客との協調を』『変化への対応を』より価値あるものとする。左記の価値も認めつつ右記をより重視する。"
  },
  {
    "question": "アジャイルの『反復（イテレーション）』の主な狙いは？",
    "options": [
      "短い周期で動くものを作りフィードバックを得る",
      "一度の計画で全工程を確定する",
      "ドキュメントを完全にしてから実装する",
      "テストを最後にまとめて行う"
    ],
    "answer": 0,
    "tags": ["agile"],
    "explanation": "反復ごとに動作する成果物を作り、早期かつ頻繁なフィードバックで方向修正する。"
  }
```

> 実行者向け: 残り 13 問も同形式で作成。論点候補（重複回避の観点）: 自己組織化チーム / 持続可能なペース / YAGNI とアジャイルの関係 / カンバンとの違い / インクリメンタル開発 / 経験主義 / フィードバックループ / ふりかえりの目的 / MVP / 適応的計画 / アジャイルメトリクス（ベロシティの正しい使い方）/ アジャイルにおける失敗の扱い / スウォーミング。各問 `tags: ["agile"]`、解説は「なぜ正解か」を 1〜2 文。

- [ ] **Step 2: estimation タグ問題を +9 追加**

同じく `planning.json` 末尾に 9 問。例:

```json
  {
    "question": "プランニングポーカーで見積もりが大きく割れたとき、まず行うべきは？",
    "options": [
      "高い人と低い人の認識の違いを議論する",
      "平均値を採用する",
      "最も高い見積もりを採用する",
      "多数決で決める"
    ],
    "answer": 0,
    "tags": ["estimation"],
    "explanation": "数値の差は理解の差。議論で前提のズレを解消することが見積もりの本質的価値。"
  }
```

> 実行者向け: 残り 8 問。論点候補: ストーリーポイントと工数の違い / 相対見積もり / 三点見積もり / プランニングポーカーの目的 / ベロシティによる予測 / 見積もりの不確実性コーン / Tシャツサイズ見積もり / アフィニティ見積もり / #NoEstimates の考え方。各問 `tags: ["estimation"]`。

- [ ] **Step 3: JSON 妥当性と問題テストを実行**

Run: `npm test -- questions.test.ts`
Expected: agile/estimation 部分は改善（まだ他タグ未達で全体は FAIL のまま）。少なくとも JSON パースエラーがないこと、スキーマ・answer 範囲テストが PASS することを確認。

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/planning.json
git commit -m "feat: AQS planning に agile/estimation 問題を追加（+24）"
```

---

### Task 3: design-patterns / data-structures / programming を impl1・impl2 に追加（+34）

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/impl1.json`
- Modify: `src/features/agile-quiz-sugoroku/data/questions/impl2.json`

配分目安: impl1 と impl2 におおよそ半分ずつ振り分ける（各ファイルが極端に偏らないように）。

- [ ] **Step 1: design-patterns を +17 追加（impl1 に 9・impl2 に 8）**

例:

```json
  {
    "question": "Strategy パターンの主な目的は？",
    "options": [
      "アルゴリズムを交換可能にしてクライアントから独立させる",
      "オブジェクト生成をサブクラスに委ねる",
      "1つのインスタンスのみ存在を保証する",
      "オブジェクトに責務を動的に追加する"
    ],
    "answer": 0,
    "tags": ["design-patterns"],
    "explanation": "Strategy は振る舞い（アルゴリズム）をカプセル化し実行時に差し替え可能にする。"
  }
```

> 論点候補: Singleton / Factory Method / Observer / Decorator / Adapter / Facade / Template Method / Command / State / Strategy / Composite / Proxy / Builder / Iterator / DI / Null Object / Repository。各問 `tags: ["design-patterns"]`。

- [ ] **Step 2: data-structures を +10 追加（impl1 に 5・impl2 に 5）**

例:

```json
  {
    "question": "ハッシュテーブルの平均的な検索計算量は？",
    "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    "answer": 0,
    "tags": ["data-structures"],
    "explanation": "衝突が少なければハッシュテーブルの検索・挿入・削除は平均 O(1)。"
  }
```

> 論点候補: 配列 vs 連結リスト / スタックとキュー / 二分探索木 / ハッシュ衝突 / ヒープ / 計算量の比較 / 集合(Set) / 木の走査 / グラフ表現 / 動的配列の償却計算量。各問 `tags: ["data-structures"]`。

- [ ] **Step 3: programming を +7 追加（impl1 に 4・impl2 に 3）**

例:

```json
  {
    "question": "純粋関数（pure function）の特徴として正しいのは？",
    "options": [
      "同じ入力に対し常に同じ出力を返し副作用がない",
      "グローバル変数を変更する",
      "実行ごとに異なる結果を返す",
      "必ず非同期で実行される"
    ],
    "answer": 0,
    "tags": ["programming"],
    "explanation": "純粋関数は参照透過性を持ち、副作用がないためテスト・推論が容易。"
  }
```

> 論点候補: 純粋関数 / イミュータビリティ / 再帰 / 例外処理 / 早期 return / ガード節 / 短絡評価 / null 安全 / 型システムの利点。各問 `tags: ["programming"]`。

- [ ] **Step 4: 問題テストを実行**

Run: `npm test -- questions.test.ts`
Expected: design-patterns/data-structures/programming が目標到達。JSON パース・スキーマ PASS。

- [ ] **Step 5: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/impl1.json \
        src/features/agile-quiz-sugoroku/data/questions/impl2.json
git commit -m "feat: AQS impl1/impl2 に design-patterns/data-structures/programming 問題を追加（+34）"
```

---

### Task 4: ci-cd を test1・test2 に追加（+14）

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/test1.json`
- Modify: `src/features/agile-quiz-sugoroku/data/questions/test2.json`

- [ ] **Step 1: ci-cd を +14 追加（test1 に 7・test2 に 7）**

例:

```json
  {
    "question": "継続的インテグレーション（CI）の最も重要な実践は？",
    "options": [
      "頻繁にメインブランチへ統合し自動ビルド・テストを回す",
      "リリース直前にまとめて統合する",
      "手動でビルドを確認する",
      "テストは週次でまとめて実行する"
    ],
    "answer": 0,
    "tags": ["ci-cd"],
    "explanation": "CI は小さな変更を頻繁に統合し自動テストで早期に問題を検出する。"
  }
```

> 論点候補: CI と CD の違い / 継続的デプロイ vs 継続的デリバリー / パイプライン / ビルドの再現性 / フィーチャーフラグ / ブルーグリーンデプロイ / カナリアリリース / アーティファクト / 自動ロールバック / デプロイ頻度（DORA メトリクス）/ trunk-based development / 環境のコード化(IaC) / シークレット管理 / ビルド時間短縮。各問 `tags: ["ci-cd"]`。

- [ ] **Step 2: 問題テストを実行**

Run: `npm test -- questions.test.ts`
Expected: ci-cd が目標到達。

- [ ] **Step 3: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/test1.json \
        src/features/agile-quiz-sugoroku/data/questions/test2.json
git commit -m "feat: AQS test1/test2 に ci-cd 問題を追加（+14）"
```

---

### Task 5: refactoring を refinement.json に追加（+7）+ Green 確認

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/data/questions/refinement.json`

- [ ] **Step 1: refactoring を +7 追加**

例:

```json
  {
    "question": "リファクタリングの定義として最も正しいのは？",
    "options": [
      "外部から見た振る舞いを変えずに内部構造を改善する",
      "新機能を追加する",
      "バグを修正する",
      "パフォーマンスのために仕様を変更する"
    ],
    "answer": 0,
    "tags": ["refactoring"],
    "explanation": "リファクタリングは振る舞いを保ったままコードの内部品質を高める作業。"
  }
```

> 論点候補: リファクタリングの定義 / コードの臭い（重複・長いメソッド・大きなクラス）/ メソッド抽出 / 名前の改善 / リファクタリング前のテスト整備 / ボーイスカウトルール / 技術的負債との関係 / 小さなステップ。各問 `tags: ["refactoring"]`。

- [ ] **Step 2: 問題テスト（Task 1 のテストが Green になる）**

Run: `npm test -- questions.test.ts`
Expected: PASS（「下位タグの最小問題数」含む全テスト）

- [ ] **Step 3: 全タグ分布を再集計して確認**

Run:
```bash
cd src/features/agile-quiz-sugoroku
cat data/questions/*.json | grep -o '"[a-z-]*"' | grep -E 'design-patterns|agile|ci-cd|data-structures|estimation|programming|refactoring' | sort | uniq -c
```
Expected: 各タグが目標数以上。

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/data/questions/refinement.json
git commit -m "feat: AQS refinement に refactoring 問題を追加（+7）— 下位タグ底上げ完了"
```

---

### Task 6: 関連タグチップコンポーネント（解説の充実）

解説の下にその問題の `tags` をチップ表示する。外部 URL は追加しない。

**Files:**
- Create: `src/features/agile-quiz-sugoroku/presentation/components/RelatedTags.tsx`
- Test: `src/features/agile-quiz-sugoroku/__tests__/related-tags.test.tsx`
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/IncorrectReview.tsx`（チップを差し込む）
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/index.ts`（エクスポート追加）

> **調査メモ:** `data/questions/tag-master.ts` の `TAG_MAP` がタグ id → 表示名を持つ（`IncorrectReview` で import 済み）。表示名はこれを使う。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/related-tags.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RelatedTags } from '../presentation/components/RelatedTags';

describe('RelatedTags', () => {
  it('タグの表示名をチップとして描画する', () => {
    render(<RelatedTags tags={['scrum', 'agile']} />);
    // TAG_MAP に基づく表示名（例: 'スクラム'）が出る
    expect(screen.getByText('スクラム')).toBeInTheDocument();
    expect(screen.getByText('アジャイル')).toBeInTheDocument();
  });

  it('タグが空なら何も描画しない', () => {
    const { container } = render(<RelatedTags tags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('onTagClick が指定されるとチップがボタンになり、クリックで id を返す', () => {
    const handler = jest.fn();
    render(<RelatedTags tags={['scrum']} onTagClick={handler} />);
    screen.getByRole('button', { name: /スクラム/ }).click();
    expect(handler).toHaveBeenCalledWith('scrum');
  });
});
```

> 注: `TAG_MAP` のキー名・表示名は `tag-master.ts` を読んで実値に合わせる（'スクラム' 等が違えば修正）。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- related-tags.test.tsx`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: RelatedTags を実装**

`src/features/agile-quiz-sugoroku/presentation/components/RelatedTags.tsx`:

```tsx
/**
 * 関連タグチップ
 *
 * 問題の tags を表示名チップで表示する。onTagClick 指定時はクリック可能。
 */
import React from 'react';
import { TAG_MAP } from '../../data/questions/tag-master';
import { DESIGN_TOKENS } from '../styles/design-tokens';

interface RelatedTagsProps {
  tags: string[];
  /** チップクリック時に tag id を返す（指定時のみクリック可能） */
  onTagClick?: (tagId: string) => void;
}

/** 問題の関連タグをチップ表示する */
export const RelatedTags: React.FC<RelatedTagsProps> = ({ tags, onTagClick }) => {
  if (tags.length === 0) return null;

  const chipStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: `2px ${DESIGN_TOKENS.spacing.sm}`,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    background: `${DESIGN_TOKENS.colors.primary}1A`,
    color: DESIGN_TOKENS.colors.primary,
    fontSize: DESIGN_TOKENS.fontSize.xs,
    border: 'none',
    cursor: onTagClick ? 'pointer' : 'default',
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: DESIGN_TOKENS.spacing.xs, marginTop: DESIGN_TOKENS.spacing.xs }}>
      {tags.map((tagId) => {
        const label = TAG_MAP[tagId]?.name ?? tagId;
        return onTagClick ? (
          <button key={tagId} type="button" style={chipStyle} onClick={() => onTagClick(tagId)}>
            #{label}
          </button>
        ) : (
          <span key={tagId} style={chipStyle}>#{label}</span>
        );
      })}
    </div>
  );
};
```

> 注: `TAG_MAP[tagId]?.name` の構造は `tag-master.ts` の実体に合わせる（`.label` 等なら修正）。

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- related-tags.test.tsx`
Expected: PASS（3 件）

- [ ] **Step 5: IncorrectReview に差し込み + エクスポート**

`IncorrectReview.tsx` の各問題ブロック内、解説テキストの直後に追加:

```tsx
import { RelatedTags } from './RelatedTags';
// ...解説表示の直後
<RelatedTags tags={q.tags} />
```

`presentation/components/index.ts` に追加:

```typescript
export { RelatedTags } from './RelatedTags';
```

- [ ] **Step 6: 回帰テスト**

Run: `npm test -- related-tags.test.tsx components.test.tsx`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/components/RelatedTags.tsx \
        src/features/agile-quiz-sugoroku/presentation/components/IncorrectReview.tsx \
        src/features/agile-quiz-sugoroku/presentation/components/index.ts \
        src/features/agile-quiz-sugoroku/__tests__/related-tags.test.tsx
git commit -m "feat: AQS 解説に関連タグチップ（RelatedTags）を追加"
```

---

### Task 7: ドキュメント更新 + Phase 2 全体検証

- [ ] **Step 1: quiz-content.md の数値を更新**

`src/features/agile-quiz-sugoroku/doc/quiz-content.md` の「全306問」と「カテゴリ別問題数」テーブル、各タグ問題数を実数に更新する。実数は次で取得:

```bash
cd src/features/agile-quiz-sugoroku
for f in data/questions/*.json; do echo -n "$(basename $f): "; grep -c '"question"' "$f"; done
echo -n "合計: "; cat data/questions/*.json | grep -c '"question"'
```

- [ ] **Step 2: 全 CI を実行**

Run: `npm run ci`
Expected: 全 PASS

- [ ] **Step 3: コミット**

```bash
git add src/features/agile-quiz-sugoroku/doc/quiz-content.md
git commit -m "docs: AQS 問題総数・タグ別問題数を実数に更新"
```

---

## Self-Review チェック（Phase 2）

- **Spec coverage:** 2-A 問題追加（Task 2〜5、合計 15+9+17+10+7+14+7 = 79）✅ / 2-B 関連タグ表示（Task 6）✅ / 解説本文補強は新規 79 問で「なぜ」を必須化（各 Task の品質基準）✅
- **TDD:** Task 1 で先に検証テストを Red にし、Task 5 で Green にする ✅
- **型整合:** `RelatedTags` の props（`tags`/`onTagClick`）は Phase 3 のタグ別復習で再利用 ✅
- **プレースホルダ:** 問題文は代表例 + 論点リストで提示（実際の 79 問は実行時に作成）。`TAG_MAP` 構造の実体確認を明示 ✅
