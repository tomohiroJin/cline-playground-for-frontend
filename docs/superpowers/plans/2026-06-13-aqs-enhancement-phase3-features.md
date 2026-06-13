# AQS ブラッシュアップ Phase 3（機能・演出）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 誤答・ブックマークを蓄積してタイマーなしで再出題する「復習モード」を新設し、主要画面のレスポンシブ対応と視覚的洗練を行う。

**Architecture:** 問題の同定は `id` 一括付与を避け、ドメインの `makeQuestionKey(question)`（問題文ベース）で行う。誤答/ブックマークは `WrongAnswerRepository` / `BookmarkRepository`（既存 `Repository + StoragePort` パターン）にスナップショットで永続化。復習出題は新規 `review-question-pool` で組み立て、UI は既存の勉強会モード（`StudyScreen`/`useStudy`）の仕組みを再利用する。`GamePhase` に `review-select`/`review` を追加。

**Tech Stack:** React 19 + TypeScript + Jotai / Jest 30 + @testing-library/react

**対象ディレクトリ:** `src/features/agile-quiz-sugoroku/`

**前提:** Phase 1・2 完了後のブランチから派生（`feature/aqs-review-mode` 等）。Task 1〜4（ドメイン/インフラ）は Phase 1・2 と独立に着手可能。

**重要な調査済み事実:**
- `GamePhase` 定義: `domain/types/game-types.ts:8`
- 画面分岐: `pages/AgileQuizSugorokuPage.tsx` の `game.phase === '...'` 群（`study-select` は 544 行付近）
- 勉強会フック: `presentation/hooks/useStudy.ts`（`init(selectedTags, limit)` で問題プールを受け取る形ではなく内部で `buildStudyPool` を呼ぶ → 復習では問題配列を直接渡せるよう拡張する）
- ナビゲーション: `presentation/components/TitleButtons.tsx` の `TitleNavigation`（optional コールバック群）

---

### Task 1: makeQuestionKey（問題の同定キー）

**Files:**
- Create: `src/features/agile-quiz-sugoroku/domain/quiz/question-key.ts`
- Modify: `src/features/agile-quiz-sugoroku/domain/quiz/index.ts`（再エクスポート）
- Test: `src/features/agile-quiz-sugoroku/__tests__/question-key.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/question-key.test.ts`:

```typescript
import { makeQuestionKey } from '../domain/quiz/question-key';
import type { Question } from '../domain/types';

const q = (question: string): Question => ({
  question,
  options: ['a', 'b', 'c', 'd'],
  answer: 0,
});

describe('makeQuestionKey', () => {
  it('同じ問題文には同じキーを返す', () => {
    expect(makeQuestionKey(q('テスト問題'))).toBe(makeQuestionKey(q('テスト問題')));
  });

  it('問題文が違えば異なるキーを返す', () => {
    expect(makeQuestionKey(q('問題A'))).not.toBe(makeQuestionKey(q('問題B')));
  });

  it('前後の空白に依存しない', () => {
    expect(makeQuestionKey(q('  問題  '))).toBe(makeQuestionKey(q('問題')));
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- question-key.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/features/agile-quiz-sugoroku/domain/quiz/question-key.ts`:

```typescript
/**
 * 問題の同定キー生成
 *
 * Question 型に id がないため、問題文を正規化したものを安定キーとする。
 * 将来 id 導入時はここだけ差し替えればよい。
 */
import type { Question } from '../types';

/** 問題から安定した同定キーを生成する */
export function makeQuestionKey(question: Question): string {
  return question.question.trim();
}
```

`domain/quiz/index.ts` に追記:

```typescript
export { makeQuestionKey } from './question-key';
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- question-key.test.ts`
Expected: PASS（3 件）

- [ ] **Step 5: コミット**

```bash
git add src/features/agile-quiz-sugoroku/domain/quiz/question-key.ts \
        src/features/agile-quiz-sugoroku/domain/quiz/index.ts \
        src/features/agile-quiz-sugoroku/__tests__/question-key.test.ts
git commit -m "feat: AQS 問題同定キー makeQuestionKey を追加"
```

---

### Task 2: 復習エントリ型 + WrongAnswerRepository

**Files:**
- Create: `src/features/agile-quiz-sugoroku/domain/types/review-types.ts`
- Modify: `src/features/agile-quiz-sugoroku/domain/types/index.ts`
- Create: `src/features/agile-quiz-sugoroku/infrastructure/storage/wrong-answer-repository.ts`
- Test: `src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/wrong-answer-repository.test.ts`

- [ ] **Step 1: 型を定義**

`src/features/agile-quiz-sugoroku/domain/types/review-types.ts`:

```typescript
/**
 * 復習機能に関するドメイン型定義
 */
import type { Question } from './quiz-types';

/**
 * 復習エントリ（問題のスナップショット）。
 * 問題データの後日改変に影響されないよう参照ではなくコピーで保持する。
 */
export interface ReviewEntry {
  /** 同定キー（makeQuestionKey の結果） */
  key: string;
  /** 問題のスナップショット */
  question: Question;
  /** 記録時刻（ミリ秒。テスト容易性のため呼び出し側から渡す） */
  recordedAt: number;
}
```

`domain/types/index.ts` に追記:

```typescript
export * from './review-types';
```

- [ ] **Step 2: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/wrong-answer-repository.test.ts`:

```typescript
import { WrongAnswerRepository } from '../wrong-answer-repository';
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter';
import type { Question } from '../../../domain/types';

const q = (text: string): Question => ({
  question: text,
  options: ['a', 'b', 'c', 'd'],
  answer: 0,
  tags: ['scrum'],
});

describe('WrongAnswerRepository', () => {
  it('誤答を記録して読み出せる', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q('問題A'), 1000);
    const all = repo.loadAll();
    expect(all).toHaveLength(1);
    expect(all[0].question.question).toBe('問題A');
  });

  it('同じ問題を複数回記録しても重複しない（キーで一意）', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q('問題A'), 1000);
    repo.record(q('問題A'), 2000);
    expect(repo.loadAll()).toHaveLength(1);
  });

  it('正解したら誤答リストから除去できる', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q('問題A'), 1000);
    repo.remove(q('問題A'));
    expect(repo.loadAll()).toHaveLength(0);
  });

  it('上限件数を超えたら古いものから削除する', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    for (let i = 0; i < 60; i++) repo.record(q(`問題${i}`), i);
    expect(repo.loadAll().length).toBeLessThanOrEqual(50);
    // 最新が残る
    expect(repo.loadAll().some((e) => e.question.question === '問題59')).toBe(true);
  });
});
```

- [ ] **Step 3: テストを実行して失敗を確認**

Run: `npm test -- wrong-answer-repository.test.ts`
Expected: FAIL（モジュール未作成）

- [ ] **Step 4: 実装**

`src/features/agile-quiz-sugoroku/infrastructure/storage/wrong-answer-repository.ts`:

```typescript
/**
 * 誤答リポジトリ
 *
 * 復習モード用に、誤答した問題のスナップショットを永続化する。
 * 問題同定は makeQuestionKey（問題文ベース）。正解で除去する。
 */
import type { Question, ReviewEntry } from '../../domain/types';
import { makeQuestionKey } from '../../domain/quiz';
import { StoragePort } from './storage-port';

const WRONG_KEY = 'aqs_wrong_answers';

/** 保持する最大件数 */
export const MAX_WRONG_COUNT = 50;

export class WrongAnswerRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 全件読み込む */
  loadAll(): ReviewEntry[] {
    const data = this.storage.get<ReviewEntry[]>(WRONG_KEY);
    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  /** 誤答を記録する（同一キーは最新で上書き、上限超過で古いものを削除） */
  record(question: Question, recordedAt: number): void {
    const key = makeQuestionKey(question);
    const list = this.loadAll().filter((e) => e.key !== key);
    list.push({ key, question, recordedAt });
    while (list.length > MAX_WRONG_COUNT) list.shift();
    this.storage.set(WRONG_KEY, list);
  }

  /** 正解した問題を誤答リストから除去する */
  remove(question: Question): void {
    const key = makeQuestionKey(question);
    this.storage.set(WRONG_KEY, this.loadAll().filter((e) => e.key !== key));
  }

  /** 全削除 */
  clear(): void {
    this.storage.remove(WRONG_KEY);
  }
}
```

- [ ] **Step 5: テストを実行して成功を確認**

Run: `npm test -- wrong-answer-repository.test.ts`
Expected: PASS（4 件）

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/domain/types/review-types.ts \
        src/features/agile-quiz-sugoroku/domain/types/index.ts \
        src/features/agile-quiz-sugoroku/infrastructure/storage/wrong-answer-repository.ts \
        src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/wrong-answer-repository.test.ts
git commit -m "feat: AQS 誤答リポジトリ（WrongAnswerRepository）と復習エントリ型を追加"
```

---

### Task 3: BookmarkRepository

**Files:**
- Create: `src/features/agile-quiz-sugoroku/infrastructure/storage/bookmark-repository.ts`
- Test: `src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/bookmark-repository.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/bookmark-repository.test.ts`:

```typescript
import { BookmarkRepository } from '../bookmark-repository';
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter';
import type { Question } from '../../../domain/types';

const q = (text: string): Question => ({ question: text, options: ['a','b','c','d'], answer: 0, tags: ['scrum'] });

describe('BookmarkRepository', () => {
  it('toggle で追加・削除を切り替える', () => {
    const repo = new BookmarkRepository(new InMemoryStorageAdapter());
    expect(repo.isBookmarked(q('問題A'))).toBe(false);
    repo.toggle(q('問題A'), 1000);
    expect(repo.isBookmarked(q('問題A'))).toBe(true);
    repo.toggle(q('問題A'), 2000);
    expect(repo.isBookmarked(q('問題A'))).toBe(false);
  });

  it('loadAll でブックマーク済みを返す', () => {
    const repo = new BookmarkRepository(new InMemoryStorageAdapter());
    repo.toggle(q('問題A'), 1000);
    expect(repo.loadAll()).toHaveLength(1);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- bookmark-repository.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/features/agile-quiz-sugoroku/infrastructure/storage/bookmark-repository.ts`:

```typescript
/**
 * ブックマークリポジトリ
 *
 * 復習モード用に、ブックマークした問題のスナップショットを永続化する。
 */
import type { Question, ReviewEntry } from '../../domain/types';
import { makeQuestionKey } from '../../domain/quiz';
import { StoragePort } from './storage-port';

const BOOKMARK_KEY = 'aqs_bookmarks';

export class BookmarkRepository {
  constructor(private readonly storage: StoragePort) {}

  loadAll(): ReviewEntry[] {
    const data = this.storage.get<ReviewEntry[]>(BOOKMARK_KEY);
    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  isBookmarked(question: Question): boolean {
    const key = makeQuestionKey(question);
    return this.loadAll().some((e) => e.key === key);
  }

  /** ブックマークを切り替える（なければ追加、あれば削除） */
  toggle(question: Question, recordedAt: number): void {
    const key = makeQuestionKey(question);
    const list = this.loadAll();
    const exists = list.some((e) => e.key === key);
    const next = exists
      ? list.filter((e) => e.key !== key)
      : [...list, { key, question, recordedAt }];
    this.storage.set(BOOKMARK_KEY, next);
  }

  clear(): void {
    this.storage.remove(BOOKMARK_KEY);
  }
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- bookmark-repository.test.ts`
Expected: PASS（2 件）

- [ ] **Step 5: コミット**

```bash
git add src/features/agile-quiz-sugoroku/infrastructure/storage/bookmark-repository.ts \
        src/features/agile-quiz-sugoroku/infrastructure/storage/__tests__/bookmark-repository.test.ts
git commit -m "feat: AQS ブックマークリポジトリ（BookmarkRepository）を追加"
```

---

### Task 4: review-question-pool（復習出題プール）

誤答/ブックマーク/タグ別 の 3 ソースから復習問題配列を組み立てる。

**Files:**
- Create: `src/features/agile-quiz-sugoroku/domain/quiz/review-question-pool.ts`
- Modify: `src/features/agile-quiz-sugoroku/domain/quiz/index.ts`
- Test: `src/features/agile-quiz-sugoroku/__tests__/review-question-pool.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/review-question-pool.test.ts`:

```typescript
import { buildReviewPool } from '../domain/quiz/review-question-pool';
import type { Question, ReviewEntry } from '../domain/types';

const q = (text: string, tags: string[]): Question => ({ question: text, options: ['a','b','c','d'], answer: 0, tags });
const entry = (text: string, tags: string[]): ReviewEntry => ({ key: text, question: q(text, tags), recordedAt: 0 });

describe('buildReviewPool', () => {
  it('source=wrong は誤答エントリの問題を返す', () => {
    const pool = buildReviewPool({ source: 'wrong', wrong: [entry('A', ['scrum'])], bookmarks: [], allByTag: {} });
    expect(pool.map((p) => p.question)).toEqual(['A']);
  });

  it('source=bookmark はブックマークの問題を返す', () => {
    const pool = buildReviewPool({ source: 'bookmark', wrong: [], bookmarks: [entry('B', ['agile'])], allByTag: {} });
    expect(pool.map((p) => p.question)).toEqual(['B']);
  });

  it('source=tag は指定タグの全問題を返す', () => {
    const allByTag = { scrum: [q('C', ['scrum']), q('D', ['scrum'])] };
    const pool = buildReviewPool({ source: 'tag', tagId: 'scrum', wrong: [], bookmarks: [], allByTag });
    expect(pool.map((p) => p.question).sort()).toEqual(['C', 'D']);
  });

  it('該当なしなら空配列', () => {
    expect(buildReviewPool({ source: 'wrong', wrong: [], bookmarks: [], allByTag: {} })).toEqual([]);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- review-question-pool.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/features/agile-quiz-sugoroku/domain/quiz/review-question-pool.ts`:

```typescript
/**
 * 復習出題プールの組み立て
 *
 * 誤答 / ブックマーク / タグ別 の 3 ソースから復習問題配列を作る。
 */
import type { Question, ReviewEntry } from '../types';

/** 復習ソース種別 */
export type ReviewSource = 'wrong' | 'bookmark' | 'tag';

/** buildReviewPool の入力 */
export interface ReviewPoolInput {
  source: ReviewSource;
  /** source=tag のときの対象タグ */
  tagId?: string;
  wrong: ReviewEntry[];
  bookmarks: ReviewEntry[];
  /** タグ id → そのタグを含む全問題 */
  allByTag: Record<string, Question[]>;
}

/** 復習問題プールを組み立てる */
export function buildReviewPool(input: ReviewPoolInput): Question[] {
  switch (input.source) {
    case 'wrong':
      return input.wrong.map((e) => e.question);
    case 'bookmark':
      return input.bookmarks.map((e) => e.question);
    case 'tag':
      return input.tagId ? input.allByTag[input.tagId] ?? [] : [];
    default:
      return [];
  }
}
```

`domain/quiz/index.ts` に追記:

```typescript
export { buildReviewPool } from './review-question-pool';
export type { ReviewSource, ReviewPoolInput } from './review-question-pool';
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- review-question-pool.test.ts`
Expected: PASS（4 件）

- [ ] **Step 5: コミット**

```bash
git add src/features/agile-quiz-sugoroku/domain/quiz/review-question-pool.ts \
        src/features/agile-quiz-sugoroku/domain/quiz/index.ts \
        src/features/agile-quiz-sugoroku/__tests__/review-question-pool.test.ts
git commit -m "feat: AQS 復習出題プール buildReviewPool を追加"
```

---

### Task 5: GamePhase 追加 + ReviewSelectScreen

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/domain/types/game-types.ts:8`（GamePhase 拡張）
- Create: `src/features/agile-quiz-sugoroku/presentation/components/screens/ReviewSelectScreen.tsx`
- Test: `src/features/agile-quiz-sugoroku/__tests__/review-select-screen.test.tsx`
- Modify: `src/features/agile-quiz-sugoroku/__tests__/architecture.test.ts`（presentation 許可リストに新パスを追記。必要時のみ）

- [ ] **Step 1: GamePhase を拡張**

`domain/types/game-types.ts:8` の `GamePhase` union に追加:

```typescript
export type GamePhase = 'title' | 'story' | 'sprint-start' | 'game' | 'retro' | 'ending' | 'result' | 'guide' | 'study-select' | 'study' | 'achievements' | 'history' | 'challenge' | 'challenge-result' | 'daily-quiz' | 'review-select' | 'review';
```

- [ ] **Step 2: 失敗するテストを書く**

`src/features/agile-quiz-sugoroku/__tests__/review-select-screen.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSelectScreen } from '../presentation/components/screens/ReviewSelectScreen';

describe('ReviewSelectScreen', () => {
  it('誤答件数とブックマーク件数を表示し、各ソースを選べる', () => {
    const onSelect = jest.fn();
    render(
      <ReviewSelectScreen
        wrongCount={3}
        bookmarkCount={2}
        onSelectSource={onSelect}
        onBack={() => undefined}
      />
    );
    expect(screen.getByText(/誤答から復習/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /誤答から復習/ }));
    expect(onSelect).toHaveBeenCalledWith('wrong');
  });

  it('誤答が0件のとき誤答ボタンは無効', () => {
    render(
      <ReviewSelectScreen wrongCount={0} bookmarkCount={0} onSelectSource={() => undefined} onBack={() => undefined} />
    );
    expect(screen.getByRole('button', { name: /誤答から復習/ })).toBeDisabled();
  });
});
```

- [ ] **Step 3: テストを実行して失敗を確認**

Run: `npm test -- review-select-screen.test.tsx`
Expected: FAIL

- [ ] **Step 4: ReviewSelectScreen を実装**

`src/features/agile-quiz-sugoroku/presentation/components/screens/ReviewSelectScreen.tsx`:

```tsx
/**
 * 復習選択画面
 *
 * 誤答 / ブックマーク から復習を開始する入口。タグ別はタグチップ経由で開始する。
 */
import React from 'react';
import { ReviewSource } from '../../../domain/quiz';
import { DESIGN_TOKENS } from '../../styles/design-tokens';
import { Button } from '../../styles';

interface ReviewSelectScreenProps {
  wrongCount: number;
  bookmarkCount: number;
  onSelectSource: (source: ReviewSource) => void;
  onBack: () => void;
}

/** 復習ソースを選ぶ画面 */
export const ReviewSelectScreen: React.FC<ReviewSelectScreenProps> = ({
  wrongCount, bookmarkCount, onSelectSource, onBack,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: DESIGN_TOKENS.spacing.md, padding: DESIGN_TOKENS.spacing.lg }}>
    <h2 style={{ color: DESIGN_TOKENS.colors.textPrimary, fontSize: DESIGN_TOKENS.fontSize.xl }}>復習モード</h2>
    <Button $color={DESIGN_TOKENS.colors.danger} onClick={() => onSelectSource('wrong')} disabled={wrongCount === 0}>
      誤答から復習（{wrongCount}）
    </Button>
    <Button $color={DESIGN_TOKENS.colors.warning} onClick={() => onSelectSource('bookmark')} disabled={bookmarkCount === 0}>
      ブックマークから復習（{bookmarkCount}）
    </Button>
    <Button $color={DESIGN_TOKENS.colors.textMuted} onClick={onBack}>タイトルへ戻る</Button>
  </div>
);
```

> 注: `Button` の props（`$color`/`disabled`）は `presentation/styles` の実体に合わせる。`disabled` 非対応なら styled に追加するか `aria-disabled` + ガードで代替。

- [ ] **Step 5: テストを実行して成功を確認**

Run: `npm test -- review-select-screen.test.tsx`
Expected: PASS（2 件）

- [ ] **Step 6: アーキテクチャテストの回帰確認**

Run: `npm test -- architecture.test.ts`
Expected: PASS（新パスが許可リストで弾かれる場合のみ `architecture.test.ts` の presentation 許可リストへ追記して再実行）

- [ ] **Step 7: コミット**

```bash
git add src/features/agile-quiz-sugoroku/domain/types/game-types.ts \
        src/features/agile-quiz-sugoroku/presentation/components/screens/ReviewSelectScreen.tsx \
        src/features/agile-quiz-sugoroku/__tests__/review-select-screen.test.tsx \
        src/features/agile-quiz-sugoroku/__tests__/architecture.test.ts
git commit -m "feat: AQS 復習選択画面と review-select/review フェーズを追加"
```

---

### Task 6: useStudy を任意問題プール対応に拡張 + 復習画面の結線

復習は勉強会 UI（`StudyScreen`）を再利用する。`useStudy` を「問題配列を直接受け取れる」よう拡張する。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/presentation/hooks/useStudy.ts`
- Modify: `src/features/agile-quiz-sugoroku/pages/AgileQuizSugorokuPage.tsx`
- Test: `src/features/agile-quiz-sugoroku/__tests__/useStudy.test.ts`（既存に追記）

> **調査メモ:** 実装前に `useStudy.ts` の `init(selectedTags, limit)` 実装を読む。内部で `buildStudyPool(selectedTags, limit)` を呼んでいる。これに加えて `initWithQuestions(questions: Question[])` を追加し、外部プール（復習）をそのまま使えるようにする。

- [ ] **Step 1: 失敗するテストを追記**

`useStudy.test.ts` に追加:

```typescript
  it('initWithQuestions で外部の問題配列をそのまま使う', () => {
    const { result } = renderHook(() => useStudy());
    const questions = [
      { question: 'Q1', options: ['a','b','c','d'], answer: 0, tags: ['scrum'] },
    ];
    act(() => result.current.initWithQuestions(questions));
    expect(result.current.questions).toHaveLength(1);
    expect(result.current.currentQuestion?.question).toBe('Q1');
  });
```

> `renderHook`/`act` の import は既存テスト冒頭に合わせる。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- useStudy.test.ts`
Expected: FAIL（`initWithQuestions` がない）

- [ ] **Step 3: useStudy に initWithQuestions を追加**

`UseStudyReturn` インターフェースに追加:

```typescript
  /** 外部の問題配列で学習を初期化（復習モード用） */
  initWithQuestions: (questions: Question[]) => void;
```

フック本体で、既存 `init` と同様に状態を初期化する関数を追加（`buildStudyPool` を通さず受け取った配列をそのまま `setQuestions`）:

```typescript
  const initWithQuestions = useCallback((qs: Question[]) => {
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setTagStats({});
    setIncorrectQuestions([]);
    setTotalCorrect(0);
    setTotalAnswered(0);
    setFinished(false);
  }, []);
```

return オブジェクトに `initWithQuestions` を追加。

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test -- useStudy.test.ts`
Expected: PASS

- [ ] **Step 5: Page に復習フローを結線**

`pages/AgileQuizSugorokuPage.tsx` に以下を追加する。

(a) リポジトリ生成（ファイル上部の他 repo 生成の隣、なければコンポーネント外）:

```typescript
import { WrongAnswerRepository } from '../features/agile-quiz-sugoroku/infrastructure/storage/wrong-answer-repository';
import { BookmarkRepository } from '../features/agile-quiz-sugoroku/infrastructure/storage/bookmark-repository';
import { buildReviewPool, ReviewSource } from '../features/agile-quiz-sugoroku/domain/quiz';
import { ReviewSelectScreen } from '../features/agile-quiz-sugoroku/presentation/components/screens/ReviewSelectScreen';
```

> 注: 当ページの既存 import 形式（`index.ts` 経由か深いパスか）に合わせる。AQS は公開 API を `index.ts` に集約しているため、`ReviewSelectScreen`/`buildReviewPool`/各 Repository を `src/features/agile-quiz-sugoroku/index.ts` から re-export し、ページはそこから import するのが規約に沿う（Task 8 で index.ts 更新）。

(b) ハンドラ:

```typescript
  const wrongRepo = useMemo(() => new WrongAnswerRepository(new LocalStorageAdapter()), []);
  const bookmarkRepo = useMemo(() => new BookmarkRepository(new LocalStorageAdapter()), []);

  const handleStartReview = useCallback((source: ReviewSource) => {
    const pool = buildReviewPool({
      source,
      wrong: wrongRepo.loadAll(),
      bookmarks: bookmarkRepo.loadAll(),
      allByTag: {}, // タグ別は Task 7 のタグチップ経由で別途渡す
    });
    study.initWithQuestions(pool);
    game.setPhase('review');
  }, [study, game, wrongRepo, bookmarkRepo]);
```

(c) フェーズ分岐（`study-select` 分岐の近く）に追加:

```tsx
      {game.phase === 'review-select' && (
        <ReviewSelectScreen
          wrongCount={wrongRepo.loadAll().length}
          bookmarkCount={bookmarkRepo.loadAll().length}
          onSelectSource={handleStartReview}
          onBack={() => game.setPhase('title')}
        />
      )}
      {game.phase === 'review' && !study.finished && study.currentQuestion && (
        /* StudyScreen を再利用。study-select→study と同じ props 構成に合わせる */
        <StudyScreen /* 既存 study 画面と同じ props */ />
      )}
      {game.phase === 'review' && study.finished && (
        <StudyResultScreen /* 既存 study 結果と同じ props。戻り先は title */ />
      )}
```

> 注: `StudyScreen`/`StudyResultScreen` の props は既存 `study` フェーズの描画箇所（551・564 行付近）をコピーして合わせる。`review` は `study` とほぼ同一描画で、戻り先のみ `title` にする。

(d) TitleButtons へ復習導線（`TitleNavigation` に `onReview?` を追加し、TitleScreen 経由で `() => game.setPhase('review-select')` を渡す）。`TitleButtons.tsx` の `TitleNavigation` に `onReview?: () => void;` を追加し、ボタンを 1 つ描画。

- [ ] **Step 6: 型チェック + 関連テスト**

Run: `npm run typecheck && npm test -- useStudy.test.ts review-select-screen.test.ts`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/hooks/useStudy.ts \
        src/features/agile-quiz-sugoroku/presentation/components/TitleButtons.tsx \
        src/features/agile-quiz-sugoroku/pages/AgileQuizSugorokuPage.tsx \
        src/features/agile-quiz-sugoroku/__tests__/useStudy.test.ts
git commit -m "feat: AQS 復習モードの画面遷移を結線（useStudy 拡張 + Page/Title 導線）"
```

> ※ `pages/` は AQS feature 外の可能性あり。実体パスは `git status` で確認し、コミット対象に含める。

---

### Task 7: 誤答記録フック + ブックマークボタン + タグ別復習

クイズ回答時に誤答を記録し、結果画面・クイズ画面でブックマークを切り替え、関連タグチップから「タグ別復習」を開始する。

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/presentation/hooks/useGame.ts` または回答評価箇所（誤答記録）
- Modify: `src/features/agile-quiz-sugoroku/presentation/components/IncorrectReview.tsx`（ブックマークボタン + タグチップを `onTagClick` 付きに）
- Test: `src/features/agile-quiz-sugoroku/__tests__/wrong-answer-recording.test.ts`

> **調査メモ:** 回答の正誤確定箇所を特定する（`useGame.ts` の answer 処理、または `domain/quiz/answer-evaluator.ts` 呼び出し元）。誤答時に `wrongRepo.record(question, Date.now())`、正解時に `wrongRepo.remove(question)` を呼ぶ。`Date.now()` は呼び出し側（presentation）で取得して渡す（ドメインは時刻を持たない）。

- [ ] **Step 1: 失敗するテストを書く（記録ロジックの単体化）**

誤答記録は副作用を伴うため、純粋な「記録すべきか」の判定をドメイン関数に切り出してテストする。
`src/features/agile-quiz-sugoroku/__tests__/wrong-answer-recording.test.ts`:

```typescript
import { WrongAnswerRepository } from '../infrastructure/storage/wrong-answer-repository';
import { InMemoryStorageAdapter } from '../infrastructure/storage/in-memory-storage-adapter';
import type { Question } from '../domain/types';

const q: Question = { question: '記録対象', options: ['a','b','c','d'], answer: 0, tags: ['scrum'] };

describe('誤答記録の振る舞い', () => {
  it('誤答 record→正解 remove で誤答リストが空になる', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q, 1000);
    expect(repo.loadAll()).toHaveLength(1);
    repo.remove(q);
    expect(repo.loadAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: テストを実行して確認**

Run: `npm test -- wrong-answer-recording.test.ts`
Expected: PASS（Task 2 の実装で既に通る。記録/除去の契約を固定する回帰テスト）

- [ ] **Step 3: 回答評価箇所に誤答記録を結線**

回答確定処理（`useGame.ts` の answer 系コールバック、またはクイズ画面の確定ハンドラ）に、`WrongAnswerRepository` をモジュールスコープで生成し:

```typescript
import { WrongAnswerRepository } from '../../infrastructure/storage/wrong-answer-repository';
import { LocalStorageAdapter } from '../../infrastructure/storage/local-storage-adapter';
const wrongRepo = new WrongAnswerRepository(new LocalStorageAdapter());
```

正誤確定時に:

```typescript
if (isCorrect) {
  wrongRepo.remove(currentQuestion);
} else {
  wrongRepo.record(currentQuestion, Date.now());
}
```

> 通常/チャレンジ/デイリーの各回答箇所に同様に差し込む（重複を避けるため、共通の `useQuizFeedback` 等があればそこに 1 箇所で実装）。

- [ ] **Step 4: ブックマークボタンを IncorrectReview に追加**

`IncorrectReview.tsx` の各問題ブロックに、`BookmarkRepository` を使ったトグルボタンを追加:

```tsx
<button
  type="button"
  aria-pressed={bookmarked}
  aria-label={bookmarked ? 'ブックマーク解除' : 'ブックマークに追加'}
  onClick={() => { bookmarkRepo.toggle(reconstructedQuestion, Date.now()); /* 再描画用 state 更新 */ }}
  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: DESIGN_TOKENS.fontSize.md }}
>
  {bookmarked ? '★' : '☆'}
</button>
```

> `IncorrectReview` が持つのは `AnswerResultWithDetail`（`questionText`/`options`/`tags` 等）。`Question` 形へ再構成（`{ question: q.questionText, options: q.options, answer: q.correctAnswer, tags: q.tags, explanation: q.explanation }`）してから repo に渡す。`bookmarked` 状態はマウント時に `bookmarkRepo.isBookmarked` で初期化し、ローカル state で管理。

- [ ] **Step 5: タグ別復習を RelatedTags の onTagClick に結線**

`IncorrectReview` の `<RelatedTags tags={q.tags} />`（Phase 2 Task 6 で追加）に `onTagClick` を渡し、Page 側で `allByTag` を構築して `buildReviewPool({ source: 'tag', tagId, ... })` → `study.initWithQuestions` → `review` フェーズへ。`allByTag` は全 `QUESTIONS` を走査してタグ→問題配列に集約するヘルパー（`domain/quiz` に `groupQuestionsByTag(QUESTIONS)` を追加してもよい）。

> このステップは結線が深いので、最小実装として「結果画面のタグチップは表示のみ（onTagClick なし）」に留め、タグ別復習は復習選択画面の拡張として後続課題にしてもよい（YAGNI 判断可）。実装するかは実行時に判断し、しない場合は plan のこの Step を skip としてログに残す。

- [ ] **Step 6: 回帰テスト + Lint**

Run: `npm test -- IncorrectReview wrong-answer related-tags && npm run lint`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add -A src/features/agile-quiz-sugoroku/
git commit -m "feat: AQS 誤答自動記録とブックマーク機能を追加"
```

---

### Task 8: 公開 API（index.ts）更新

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/index.ts`

- [ ] **Step 1: 新規シンボルを公開**

`index.ts` に、ページから参照する新規シンボルを名前付きエクスポートで追加:

```typescript
export { ReviewSelectScreen } from './presentation/components/screens/ReviewSelectScreen';
export { WrongAnswerRepository } from './infrastructure/storage/wrong-answer-repository';
export { BookmarkRepository } from './infrastructure/storage/bookmark-repository';
export { SettingsRepository } from './infrastructure/storage/settings-repository';
export { buildReviewPool, makeQuestionKey } from './domain/quiz';
export type { ReviewSource } from './domain/quiz';
```

> 既存のエクスポート様式（グルーピング・コメント）に合わせる。Page 側の import を `index.ts` 経由に統一し、深いインポート禁止ガード（`architecture.test.ts`）に適合させる。

- [ ] **Step 2: 型チェック + アーキテクチャテスト**

Run: `npm run typecheck && npm test -- architecture.test.ts`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src/features/agile-quiz-sugoroku/index.ts
git commit -m "feat: AQS 復習・設定関連シンボルを公開 API に追加"
```

---

### Task 9: レスポンシブ / モバイル対応

**Files:**
- Modify: 主要画面コンポーネント（Title / Quiz / Result / Story）
- Test: 視覚回帰は既存テストで担保（新規テスト不要）

- [ ] **Step 1: 現状のブレークポイント方針を確認**

Run:
```bash
cd src/features/agile-quiz-sugoroku
grep -rn "@media" presentation/styles presentation/components | grep -v prefers-reduced-motion | head
```
Expected: 既存のビューポート系メディアクエリの有無と書式を把握。なければ新規にブレークポイント定数（例 480px）を `presentation/styles/design-tokens.ts` に追加:

```typescript
  /** ブレークポイント */
  breakpoints: Object.freeze({
    mobile: '480px',
  }),
```

- [ ] **Step 2: TitleScreen をモバイル対応**

ボタン群（`TitleButtons`）のタップ領域を最低 44px に。`@media (max-width: 480px)` でフォントサイズ・padding・ボタン折り返しを調整。`flex-wrap: wrap` は既存にあるため、はみ出しと文字潰れを中心に修正。

- [ ] **Step 3: QuizScreen をモバイル対応**

選択肢ボタンを縦積み・タップ領域 44px 以上に。すごろくボード（`SugorokuBoard`）の縮尺を `@media` で縮小。タイマー・スコアの配置崩れを修正。

- [ ] **Step 4: ResultScreen / StoryScreen をモバイル対応**

チャート類（`RadarChart`/`BarChart`/`LineChart`）の幅を `max-width: 100%` に。Story のテキストボックスを画面幅に追従させる。

- [ ] **Step 5: 視覚回帰テスト + ビルド**

Run: `npm test -- components.test.tsx phase1-components.test.tsx phase2-components.test.tsx && npm run build`
Expected: PASS（DOM 不変のため通る。ビルドも成功）

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/presentation/
git commit -m "feat: AQS 主要画面のレスポンシブ/モバイル対応を追加"
```

---

### Task 10: 視覚的洗練 + Phase 3 全体検証 + ドキュメント

**Files:**
- Modify: 各 presentation コンポーネント・styles
- Modify: `src/features/agile-quiz-sugoroku/doc/game-design.md`, `doc/effects-and-ui.md`, `README.md`

- [ ] **Step 1: 余白・タイポをトークンに統一（残り）**

Phase 1 Task 6 で残したインライン style を `spacing`/`fontSize` トークンへ寄せる。grep で残箇所を確認:

```bash
cd src/features/agile-quiz-sugoroku
grep -rln "style={{" presentation/components | xargs grep -L "DESIGN_TOKENS" 2>/dev/null
```

- [ ] **Step 2: ホバー/遷移マイクロインタラクションを磨く**

`Button` 等の `:hover` に `transition: DESIGN_TOKENS.transition.fast` と軽い `transform`/`opacity` 変化を追加。`@media (prefers-reduced-motion: reduce)` で動きを無効化（既存方針を踏襲）。

- [ ] **Step 3: 配色 60-30-10 点検**

主要画面で背景(60)/サーフェス(30)/アクセント(10)の比率を点検し、アクセント過多な箇所をトーンダウン。コントラスト比 4.5:1 以上を確認（Phase 1 の a11y とあわせて）。

- [ ] **Step 4: ドキュメント更新**

- `doc/game-design.md`: モード一覧に「復習モード」追加、`GamePhase` 表に `review-select`/`review` 追加、サウンド設定を追記
- `doc/effects-and-ui.md`: レスポンシブ方針・マイクロインタラクション方針を追記
- `README.md`: モード一覧を更新

- [ ] **Step 5: Phase 3 全体 CI**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build が全 PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/agile-quiz-sugoroku/
git commit -m "feat: AQS 視覚的洗練（マイクロインタラクション/配色点検）とドキュメント更新"
```

---

## Self-Review チェック（Phase 3）

- **Spec coverage:** 3-A 復習モード（Task 1〜8）/ 3-B レスポンシブ（Task 9）/ 3-C 視覚的洗練（Task 10）を網羅 ✅
- **型整合:** `ReviewEntry`（Task 2）→ `WrongAnswerRepository`/`BookmarkRepository`（Task 2,3）→ `buildReviewPool`（Task 4）→ Page 結線（Task 6）で型名・シグネチャ一貫 ✅。`ReviewSource` を ReviewSelectScreen/buildReviewPool/Page で統一 ✅。`makeQuestionKey`（Task 1）を両 Repository が使用 ✅
- **同定キー設計:** spec 2.2（問題文ベース・スナップショット保持）に準拠 ✅
- **プレースホルダ:** StudyScreen 再利用の props は「既存 study フェーズからコピー」と明示。深い結線（タグ別復習 Task7 Step5）は YAGNI 判断可と明記 ✅
- **アーキテクチャ規約:** 新規シンボルを index.ts 公開（Task 8）、深いインポート禁止ガードに適合 ✅
- **時刻の扱い:** `Date.now()` は presentation 側で取得しドメイン/repo に引数で渡す（ドメインは時刻非依存）✅
