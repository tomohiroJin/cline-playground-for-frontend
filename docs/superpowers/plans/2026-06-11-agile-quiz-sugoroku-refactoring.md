# Agile Quiz Sugoroku 構造統一リファクタリング 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移行途中で止まった agile-quiz-sugoroku Feature の構造を 3 層(domain / infrastructure / presentation)+ data/ に統一し、公開 API を index.ts に一本化する(挙動変更なし)。

**Architecture:** ファサード先行方式。PR1 で公開 API を凍結して外部境界を固定し、PR2〜4 は Feature 内部だけで完結するファイル移動とインポートパス書き換えを行う。既存テスト 26 本(ロジック不変)と CI が安全網。

**Tech Stack:** React 19 + TypeScript + Jest 30 + Playwright。検証コマンドは `npm run ci`(lint:ci → typecheck → test → build)と `npm run test:e2e`。

**スペック:** `docs/superpowers/specs/2026-06-11-agile-quiz-sugoroku-refactoring-design.md`

---

## 前提・共通ルール

- リポジトリルート: `/workspaces/claym/local/cline-playground-for-frontend`(以下、コマンドはここで実行。`FEATURE=src/features/agile-quiz-sugoroku` と読み替える)
- **テストファイルはインポートパスのみ変更可。テストロジック(describe/it/expect の中身)は一切変更しない**
- **挙動変更禁止**。関数の中身・シグネチャ・エクスポート名は変えない(移動と分割のみ)
- 4 つの PR は順番に実施する。**各 PR はマージされてから次の PR のブランチを main から切る**
- 各 PR の最終ステップで `npm run ci` と `npm run test:e2e` の全パスを確認する
- `main` への直接コミット禁止。コミットメッセージは Conventional Commits(日本語)

### 検証コマンド(全 PR 共通)

```bash
npm run ci          # lint:ci → typecheck → test → build
npm run test:e2e    # Playwright E2E
```

---

# PR1: 公開 API の確立とインポート一本化

ブランチ: `refactor/aqs-facade`

## Task 1: ブランチ作成

- [ ] **Step 1: main を最新化してブランチを切る**

```bash
git checkout main && git pull
git checkout -b refactor/aqs-facade
```

## Task 2: index.ts を公開 API に書き換える

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/index.ts`(全文置き換え)

**背景:** 現在の index.ts は `export *` を多用し、外部が使わないもの(QUESTIONS, math-utils 再エクスポート等)まで公開している。外部利用者は `pages/AgileQuizSugorokuPage.tsx` のみで、しかも index.ts を経由していない(深いパスを直接インポート)。index.ts を「Page が実際に使うシンボルだけの名前付きエクスポート」に置き換える。

- [ ] **Step 1: index.ts を以下の内容に全文置き換える**

```typescript
/**
 * Agile Quiz Sugoroku - 公開 API
 *
 * 外部(pages 等)はこのファイル経由でのみインポートする。
 * Feature 内部のモジュール間参照は各モジュールを直接参照する(このファイルを経由しない)。
 */

// 型定義
export type {
  SprintSummary,
  SaveState,
  StoryEntry,
  EndingEntry,
  Difficulty,
  AchievementDefinition,
} from './domain/types';

// 定数
export { CONFIG } from './constants';

// ドメインロジック
export { getDifficultyConfig, calculateGradeWithDifficulty } from './domain/scoring';
export { checkAchievements } from './domain/achievement';
export { classifyTeamType } from './team-classifier';

// 静的データ
export { getStoriesForSprintCount } from './story-data';
export { getEndingStories } from './ending-data';

// 音声
export { createDefaultAudioActions } from './audio/audio-actions';

// フック
export { useGame, useCountdown, useFade, useStudy, useChallenge } from './hooks';

// インフラストラクチャ(ストレージ)
export { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
export { GameResultRepository } from './infrastructure/storage/game-repository';
export { SaveRepository } from './infrastructure/storage/save-repository';
export { AchievementRepository } from './infrastructure/storage/achievement-repository';
export { HistoryRepository } from './infrastructure/storage/history-repository';
export { ChallengeRepository } from './infrastructure/storage/challenge-repository';

// UI コンポーネント
export {
  TitleScreen,
  SprintStartScreen,
  QuizScreen,
  RetrospectiveScreen,
  ResultScreen,
  StudySelectScreen,
  StudyScreen,
  StudyResultScreen,
  GuideScreen,
  StoryScreen,
  AchievementScreen,
  AchievementToast,
  HistoryScreen,
  ChallengeQuizScreen,
  ChallengeResultScreen,
  DailyQuizScreen,
} from './components';
```

> 注: `./team-classifier`, `./story-data`, `./ending-data`, `./audio/audio-actions`,
> `./components`, `./hooks` のパスは PR2〜4 でファイル移動に合わせて更新される。

- [ ] **Step 2: 型チェックを実行して通ることを確認**

```bash
npm run typecheck
```

Expected: エラーなし(Feature 内部に index.ts を参照するファイルはないため、エクスポート削減の影響は出ない)

## Task 3: Page のインポートを一本化する

**Files:**
- Modify: `src/pages/AgileQuizSugorokuPage.tsx:1-52`(インポートブロックのみ)

- [ ] **Step 1: 1〜52 行目のインポートブロックを以下に置き換える**

55 行目以降(`/** 有効な難易度値 */` 以降)は一切変更しない。

```typescript
/**
 * Agile Quiz Sugoroku ゲームページ
 */
import React, { useState, useMemo, useEffect } from 'react';

import type {
  SprintSummary,
  SaveState,
  StoryEntry,
  EndingEntry,
  Difficulty,
  AchievementDefinition,
} from '../features/agile-quiz-sugoroku';
import {
  CONFIG,
  getDifficultyConfig,
  calculateGradeWithDifficulty,
  checkAchievements,
  classifyTeamType,
  getStoriesForSprintCount,
  getEndingStories,
  createDefaultAudioActions,
  useGame,
  useCountdown,
  useFade,
  useStudy,
  useChallenge,
  LocalStorageAdapter,
  GameResultRepository,
  SaveRepository,
  AchievementRepository,
  HistoryRepository,
  ChallengeRepository,
  TitleScreen,
  SprintStartScreen,
  QuizScreen,
  RetrospectiveScreen,
  ResultScreen,
  StudySelectScreen,
  StudyScreen,
  StudyResultScreen,
  GuideScreen,
  StoryScreen,
  AchievementScreen,
  AchievementToast,
  HistoryScreen,
  ChallengeQuizScreen,
  ChallengeResultScreen,
  DailyQuizScreen,
} from '../features/agile-quiz-sugoroku';
```

- [ ] **Step 2: 深いインポートが残っていないことを確認**

```bash
grep -c "features/agile-quiz-sugoroku/" src/pages/AgileQuizSugorokuPage.tsx
```

Expected: `0`

- [ ] **Step 3: CI を実行**

```bash
npm run ci && npm run test:e2e
```

Expected: 全パス

- [ ] **Step 4: コミット**

```bash
git add src/features/agile-quiz-sugoroku/index.ts src/pages/AgileQuizSugorokuPage.tsx
git commit -m "refactor: agile-quiz-sugoroku の公開 API を確立しインポートを一本化

- index.ts を外部が実際に使うシンボルのみの名前付きエクスポートに整理
- AgileQuizSugorokuPage の深いインポート 17 箇所を index.ts 経由に集約
- math-utils 再エクスポート等の外部未使用エクスポートを公開 API から削除"
```

- [ ] **Step 5: プッシュして PR 作成**

```bash
git push -u origin refactor/aqs-facade
gh pr create --title "refactor: agile-quiz-sugoroku の公開 API を確立しインポートを一本化" --body "## 概要
agile-quiz-sugoroku の構造統一リファクタリング(全 4 PR)の 1 本目。公開 API を index.ts に確立し、外部境界を凍結する。
スペック: docs/superpowers/specs/2026-06-11-agile-quiz-sugoroku-refactoring-design.md

## 変更内容
- index.ts を名前付きエクスポートのみの公開 API に整理
- AgileQuizSugorokuPage の深いインポート 17 箇所を index.ts 経由に一本化

## テスト方法
- [ ] npm run ci(lint:ci / typecheck / test / build)
- [ ] npm run test:e2e

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

# PR2: data/ の抽出

ブランチ: `refactor/aqs-data-layer`(PR1 マージ後に main から作成)

## Task 4: 静的データを data/ へ移動

**Files:**
- Move: `story-data.ts`, `ending-data.ts`, `character-profiles.ts`, `images.ts`, `questions/` → `data/` 配下
- Modify: 移動ファイル自身のインポート + 参照元(下記マッピング表)

- [ ] **Step 1: ブランチ作成**

```bash
git checkout main && git pull
git checkout -b refactor/aqs-data-layer
```

- [ ] **Step 2: git mv で移動**

```bash
cd src/features/agile-quiz-sugoroku
mkdir data
git mv story-data.ts data/story-data.ts
git mv ending-data.ts data/ending-data.ts
git mv character-profiles.ts data/character-profiles.ts
git mv images.ts data/images.ts
git mv questions data/questions
```

- [ ] **Step 3: 移動したファイル自身のインポートを修正**

| ファイル | 旧 | 新 |
|---|---|---|
| `data/story-data.ts` | `'./domain/types'` | `'../domain/types'` |
| `data/ending-data.ts` | `'./domain/types'` | `'../domain/types'` |
| `data/character-profiles.ts` | `'./constants'` | `'../constants'` |
| `data/images.ts` | `'../../assets/images/...'`(複数行) | `'../../../assets/images/...'` |
| `data/questions/index.ts` | `'../domain/types'` | `'../../domain/types'` |

```bash
sed -i "s|'\./domain/types'|'../domain/types'|" data/story-data.ts data/ending-data.ts
sed -i "s|'\./constants'|'../constants'|" data/character-profiles.ts
sed -i "s|'\.\./\.\./assets/|'../../../assets/|g" data/images.ts
sed -i "s|'\.\./domain/types'|'../../domain/types'|" data/questions/index.ts
```

- [ ] **Step 4: 参照元のインポートパスを更新**

参照元一覧(調査済み・これで全部):

| モジュール | 参照元 |
|---|---|
| story-data | `index.ts`, `__tests__/story-data.test.ts` |
| ending-data | `index.ts`, `__tests__/ending-data.test.ts`, `__tests__/ending-phase.test.tsx` |
| character-profiles | `components/StoryScreen.tsx`, `components/screens/GuideScreen/GuideSectionTeam.tsx`, `__tests__/character-genre-map.test.ts`, `__tests__/character-profiles.test.ts`, `__tests__/ending-data.test.ts`, `__tests__/story-data.test.ts` |
| images | `components/` 直下 5 ファイル + `components/screens/` 配下 6 ファイル + `__tests__/character-profiles.test.ts` |
| questions | `daily-quiz.ts`, `domain/quiz/study-question-pool.ts`, `domain/quiz/__tests__/question-picker.test.ts`, `hooks/useGame.ts`, `hooks/useChallenge.ts`, `__tests__/questions.test.ts`, ほか `'../questions/tag-master'` のサブパス参照(`components/StudyResultScreen.tsx` 等) |

> 注: PR1 後の index.ts は questions を参照しない(QUESTIONS は公開 API から削除済み)。

パスの `<モジュール名>` 直前に `data/` を挿入する。`/story-data'` のような
「セグメント末尾」パターンはどの深さ(`./` `../` `../../../`)でも同一に機能する。
`data/` 配下自身は除外する(prune)。

```bash
find . -path ./data -prune -o \( -name '*.ts' -o -name '*.tsx' \) -print | xargs sed -i \
  -e "s|/story-data'|/data/story-data'|g" \
  -e "s|/ending-data'|/data/ending-data'|g" \
  -e "s|/character-profiles'|/data/character-profiles'|g" \
  -e "s|/images'|/data/images'|g" \
  -e "s|/questions'|/data/questions'|g" \
  -e "s|/questions/|/data/questions/|g"
```

- [ ] **Step 5: 旧パスの残存参照がゼロであることを確認**

```bash
grep -rn "from '[^']*/\(story-data\|ending-data\|character-profiles\|images\|questions\)['/]" \
  . --include='*.ts*' | grep -v "/data/"
```

Expected: 出力なし

- [ ] **Step 6: CI 実行**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
npm run ci && npm run test:e2e
```

Expected: 全パス(失敗した場合は typecheck のエラーメッセージが指すファイルのパスをマッピング表に従って修正)

- [ ] **Step 7: コミット・プッシュ・PR 作成**

```bash
git add -A src/features/agile-quiz-sugoroku
git commit -m "refactor: agile-quiz-sugoroku の静的データを data/ に集約

- story-data, ending-data, character-profiles, images, questions/ を data/ へ移設
- 参照元のインポートパスを更新(外部は index.ts 経由のため影響なし)"
git push -u origin refactor/aqs-data-layer
gh pr create --title "refactor: agile-quiz-sugoroku の静的データを data/ に集約" --body "## 概要
構造統一リファクタリング(全 4 PR)の 2 本目。静的データを data/ 配下に集約する。

## 変更内容
- story-data.ts / ending-data.ts / character-profiles.ts / images.ts / questions/ を data/ へ git mv
- Feature 内部の参照パスを更新(挙動変更なし)

## テスト方法
- [ ] npm run ci
- [ ] npm run test:e2e

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

# PR3: domain/ への収容と二重存在解消

ブランチ: `refactor/aqs-domain`(PR2 マージ後に main から作成)

## Task 5: team-classifier の実体を domain/team/ へ

**Files:**
- Delete: `domain/team/team-classifier.ts`(コメントのみのプレースホルダ)
- Move: `team-classifier.ts` → `domain/team/team-classifier.ts`
- Modify: `domain/team/index.ts`, 参照元 6 ファイル

**背景:** 現在は実体がルートにあり、`domain/team/team-classifier.ts` と `domain/team/index.ts` はコメントだけの空ファイル(逆転シム)。実体を domain 側へ移し、ルートを削除する。

- [ ] **Step 1: ブランチ作成**

```bash
git checkout main && git pull
git checkout -b refactor/aqs-domain
cd src/features/agile-quiz-sugoroku
```

- [ ] **Step 2: プレースホルダを削除して実体を移動**

```bash
git rm domain/team/team-classifier.ts
git mv team-classifier.ts domain/team/team-classifier.ts
```

- [ ] **Step 3: 移動したファイル自身のインポートを修正**

```bash
sed -i -e "s|'\./domain/types'|'../types'|" -e "s|'\./constants'|'../../constants'|" \
  domain/team/team-classifier.ts
```

- [ ] **Step 4: domain/team/index.ts を以下の内容に全文置き換える**

```typescript
/**
 * team サブドメイン - 再エクスポート
 */
export { classifyTeamType, TEAM_TYPES } from './team-classifier';
```

- [ ] **Step 5: 参照元 6 ファイルを更新**

```bash
sed -i "s|'\./team-classifier'|'./domain/team'|" index.ts
sed -i "s|'\.\./team-classifier'|'../domain/team'|" __tests__/ending-data.test.ts
sed -i "s|'\.\./\.\./\.\./team-classifier'|'../team-classifier'|" \
  domain/team/__tests__/team-classifier.test.ts
grep -rl "'\.\./\.\./\.\./team-classifier'" components/screens --include='*.ts*' | xargs sed -i \
  "s|'\.\./\.\./\.\./team-classifier'|'../../../domain/team'|"
```

対象(これで全部): `index.ts`, `__tests__/ending-data.test.ts`, `domain/team/__tests__/team-classifier.test.ts`, `components/screens/GuideScreen/GuideSectionTeam.tsx`, `components/screens/ResultScreen/ResultActions.tsx`, `components/screens/ResultScreen/StatsPanel.tsx`

## Task 6: character-* を domain/narrative/ へ

**Files:**
- Move: `character-narrative.ts`, `character-reactions.ts`, `character-genre-map.ts` → `domain/narrative/`
- Modify: 参照元(下記)

- [ ] **Step 1: 移動**

```bash
mkdir domain/narrative
git mv character-narrative.ts domain/narrative/character-narrative.ts
git mv character-reactions.ts domain/narrative/character-reactions.ts
git mv character-genre-map.ts domain/narrative/character-genre-map.ts
```

> `character-narrative.ts` の `'./character-reactions'` 参照は同一ディレクトリ内移動のため修正不要。
> `character-reactions.ts` と `character-genre-map.ts` にはインポートがない(確認済み)。

- [ ] **Step 2: 参照元を更新**

```bash
# components/ 直下(SprintStartScreen, RetrospectiveScreen, CharacterReaction,
#   useCharacterComment, StudySelectParts, StudySelectScreen)と __tests__/
grep -rl "'\.\./character-narrative'\|'\.\./character-reactions'\|'\.\./character-genre-map'" \
  components __tests__ --include='*.ts*' | xargs sed -i \
  -e "s|'\.\./character-narrative'|'../domain/narrative/character-narrative'|" \
  -e "s|'\.\./character-reactions'|'../domain/narrative/character-reactions'|" \
  -e "s|'\.\./character-genre-map'|'../domain/narrative/character-genre-map'|"

# components/screens/QuizScreen/quiz-helpers.ts(3 階層下)
sed -i "s|'\.\./\.\./\.\./character-reactions'|'../../../domain/narrative/character-reactions'|" \
  components/screens/QuizScreen/quiz-helpers.ts
```

> 補足: PR1 後の index.ts は character-narrative を公開していないため index.ts の修正は不要。

## Task 7: daily-quiz.ts を domain と infrastructure に分割

**Files:**
- Create: `domain/quiz/daily-quiz.ts`
- Create: `infrastructure/storage/daily-quiz-service.ts`
- Delete: `daily-quiz.ts`(ルート)
- Modify: `domain/quiz/index.ts`, `components/DailyQuizScreen.tsx`, `components/DailyQuizResult.tsx`, `__tests__/daily-quiz.test.ts`

**背景:** ルートの `daily-quiz.ts` は純ロジック(dateSeed / seededRandom / getDailyQuestions)と localStorage 委譲(saveDailyResult / getDailyResult / getDailyStreak)の混在。そのまま domain/ に移すと domain → infrastructure 参照の禁止ルールに違反するため分割する。**関数の中身は 1 文字も変えない。**

- [ ] **Step 1: domain/quiz/daily-quiz.ts を作成**

```typescript
/**
 * Agile Quiz Sugoroku - デイリークイズ選出ロジック
 *
 * 日付シードに基づき決定論的に 5 問を選出する。
 * ストレージ処理は infrastructure/storage/daily-quiz-service.ts を参照。
 */
import { Question } from '../types';
import { QUESTIONS } from '../../data/questions';

// ── シード付きランダム ────────────────────────────────────

/**
 * 日付からシード値を生成する
 */
export const dateSeed = (date: Date): number => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
};

/**
 * シード付き疑似乱数生成器(xorshift32)
 */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed | 0;
  if (state === 0) state = 1;
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
};

// ── 問題選出 ──────────────────────────────────────────────

/** 全カテゴリの問題をフラットにまとめる */
const getAllQuestions = (): Question[] => {
  return Object.values(QUESTIONS).flat();
};

/** 日付に基づいて5問を選出する */
export const getDailyQuestions = (date: Date): Question[] => {
  const seed = dateSeed(date);
  const rng = seededRandom(seed);
  const all = getAllQuestions();

  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 5);
};
```

- [ ] **Step 2: infrastructure/storage/daily-quiz-service.ts を作成**

```typescript
/**
 * Agile Quiz Sugoroku - デイリークイズストレージサービス
 *
 * DailyQuizRepository のシングルトンに委譲する薄いラッパー。
 * 問題選出ロジックは domain/quiz/daily-quiz.ts を参照。
 */
import { LocalStorageAdapter } from './local-storage-adapter';
import { DailyQuizRepository, formatDateKey } from './daily-quiz-repository';
import type { DailyResult } from './daily-quiz-repository';

// 型・ユーティリティの再エクスポート
export type { DailyResult };
export { formatDateKey };

const repository = new DailyQuizRepository(new LocalStorageAdapter());

/** デイリー結果を保存する */
export const saveDailyResult = (result: DailyResult): void => {
  repository.saveResult(result);
};

/** 指定日のデイリー結果を取得する */
export const getDailyResult = (dateKey: string): DailyResult | undefined => {
  return repository.getResult(dateKey);
};

/** 連続参加日数(ストリーク)を計算する */
export const getDailyStreak = (today: Date): number => {
  return repository.getStreak(today);
};
```

- [ ] **Step 3: ルートの daily-quiz.ts を削除**

```bash
git rm daily-quiz.ts
```

- [ ] **Step 4: domain/quiz/index.ts に選出ロジックのエクスポートを追記**

ファイル末尾に追加:

```typescript
export { dateSeed, seededRandom, getDailyQuestions } from './daily-quiz';
```

- [ ] **Step 5: 参照元 3 ファイルを更新**

`components/DailyQuizScreen.tsx` — 旧:

```typescript
import {
  getDailyQuestions,
  saveDailyResult,
  getDailyResult,
  getDailyStreak,
  formatDateKey,
  DailyResult,
} from '../daily-quiz';
```

新:

```typescript
import { getDailyQuestions } from '../domain/quiz';
import {
  saveDailyResult,
  getDailyResult,
  getDailyStreak,
  formatDateKey,
} from '../infrastructure/storage/daily-quiz-service';
import type { DailyResult } from '../infrastructure/storage/daily-quiz-service';
```

`components/DailyQuizResult.tsx` — 旧:

```typescript
import type { DailyResult } from '../daily-quiz';
```

新:

```typescript
import type { DailyResult } from '../infrastructure/storage/daily-quiz-service';
```

`__tests__/daily-quiz.test.ts` — 旧:

```typescript
import {
  getDailyQuestions,
  seededRandom,
  dateSeed,
  getDailyResult,
  saveDailyResult,
  getDailyStreak,
  DailyResult,
} from '../daily-quiz';
```

新:

```typescript
import { getDailyQuestions, seededRandom, dateSeed } from '../domain/quiz';
import {
  saveDailyResult,
  getDailyResult,
  getDailyStreak,
} from '../infrastructure/storage/daily-quiz-service';
import type { DailyResult } from '../infrastructure/storage/daily-quiz-service';
```

## Task 8: audio/ を infrastructure/audio/ へ統合

**Files:**
- Move: `audio/sound.ts`, `audio/audio-actions.ts` → `infrastructure/audio/`
- Modify: `infrastructure/audio/tone-audio-adapter.ts`, `hooks/useGame.ts`, `__tests__/sound-extensions.test.ts`, `index.ts`

- [ ] **Step 1: 移動**

```bash
git mv audio/sound.ts infrastructure/audio/sound.ts
git mv audio/audio-actions.ts infrastructure/audio/audio-actions.ts
```

> `audio-actions.ts` の `'./sound'` 参照は同一ディレクトリ内移動のため修正不要。
> `sound.ts` のインポートは `'tone'` のみで修正不要。

- [ ] **Step 2: 参照元を更新**

```bash
sed -i "s|'\.\./\.\./audio/sound'|'./sound'|" infrastructure/audio/tone-audio-adapter.ts
sed -i "s|'\.\./audio/audio-actions'|'../infrastructure/audio/audio-actions'|" hooks/useGame.ts
sed -i "s|'\.\./audio/sound'|'../infrastructure/audio/sound'|" __tests__/sound-extensions.test.ts
sed -i "s|'\./audio/audio-actions'|'./infrastructure/audio/audio-actions'|" index.ts
```

## Task 9: PR3 の検証とコミット

- [ ] **Step 1: ルート直下が整理されたことを確認**

```bash
ls src/features/agile-quiz-sugoroku
```

Expected: `__tests__ components constants data doc domain hooks index.ts infrastructure presentation README.md` のみ(`audio/`, `character-*.ts`, `daily-quiz.ts`, `team-classifier.ts`, `story-data.ts` 等が消えている)

- [ ] **Step 2: CI 実行**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
npm run ci && npm run test:e2e
```

Expected: 全パス(アーキテクチャテストの「domain/ に localStorage 直接参照がないこと」も、分割により新規違反なしで通る)

- [ ] **Step 3: コミット・プッシュ・PR 作成**

```bash
git add -A src/features/agile-quiz-sugoroku
git commit -m "refactor: agile-quiz-sugoroku のルート直下ロジックを domain/infrastructure に収容

- team-classifier の実体を domain/team/ へ移設(逆転シムを解消)
- character-narrative / character-reactions / character-genre-map を domain/narrative/ へ移設
- daily-quiz を選出ロジック(domain/quiz)とストレージ委譲(infrastructure/storage)に分割
- audio/ を infrastructure/audio/ に統合"
git push -u origin refactor/aqs-domain
gh pr create --title "refactor: agile-quiz-sugoroku のルートロジックを domain/infrastructure に収容" --body "## 概要
構造統一リファクタリング(全 4 PR)の 3 本目。ルート直下のロジックを層に収容し、二重存在を解消する。

## 変更内容
- team-classifier の実体を domain/team/ へ(シム逆転の解消)
- character-* 3 ファイルを domain/narrative/ へ
- daily-quiz.ts を domain(選出ロジック)と infrastructure(ストレージ委譲)に分割
- audio/ を infrastructure/audio/ に統合

## テスト方法
- [ ] npm run ci
- [ ] npm run test:e2e

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

# PR4: presentation/ への移設とシム全廃

ブランチ: `refactor/aqs-presentation`(PR3 マージ後に main から作成)

## Task 10: シムの削除と画面コンポーネントの screens/ 統一

**Files:**
- Delete: `presentation/`(シム 4 ファイル), `components/QuizScreen.tsx`, `components/ResultScreen.tsx`, `components/GuideScreen.tsx`(後方互換シム)
- Move: フラットな画面コンポーネント 11 ファイル → `components/screens/`
- Move: `components/useCharacterComment.ts` → `hooks/`
- Modify: `components/index.ts`, 移動ファイルのインポート, `__tests__/`

- [ ] **Step 1: ブランチ作成**

```bash
git checkout main && git pull
git checkout -b refactor/aqs-presentation
cd src/features/agile-quiz-sugoroku
```

- [ ] **Step 2: シムを削除**

```bash
git rm -r presentation
git rm components/QuizScreen.tsx components/ResultScreen.tsx components/GuideScreen.tsx
```

> `components/{QuizScreen,ResultScreen,GuideScreen}.tsx` は `screens/` 配下の実体への
> 再エクスポートシム(各 6 行・確認済み)。

- [ ] **Step 3: components/index.ts のシム経由エクスポートを実体に向ける**

```bash
sed -i -e "s|'\./QuizScreen'|'./screens/QuizScreen'|" \
       -e "s|'\./ResultScreen'|'./screens/ResultScreen'|" \
       -e "s|'\./GuideScreen'|'./screens/GuideScreen'|" components/index.ts
```

- [ ] **Step 4: フラットな画面コンポーネント 11 ファイルを screens/ へ移動**

```bash
for s in TitleScreen SprintStartScreen RetrospectiveScreen StoryScreen \
         StudySelectScreen StudyScreen StudyResultScreen AchievementScreen \
         HistoryScreen ChallengeResultScreen DailyQuizScreen; do
  git mv "components/$s.tsx" "components/screens/$s.tsx"
done
```

> パーツ類(ParticleEffect, RadarChart, BarChart, LineChart, CategoryBar, ComboEffect,
> FlashOverlay, ScoreFloat, SaveToast, AchievementToast, CharacterReaction,
> NarrativeComment, IncorrectReview, DifficultySelector, DailyQuizQuestion,
> DailyQuizResult, HistoryList, SugorokuBoard, TitleButtons, StudySelectGenre,
> StudySelectParts, character-reaction-styles)は `components/` 直下に残す。

- [ ] **Step 5: 移動した 11 ファイルの相対インポートを 1 階層深くする**

ルール: 兄弟参照 `'./X'` → `'../X'`、Feature ルート方向(`domain` / `data` /
`infrastructure` / `constants` / `hooks`)と共通 utils は深さ +1、
`'./screens/X'`(SprintCountSelector 等)は同一ディレクトリになるため `'./X'`。

```bash
for s in TitleScreen SprintStartScreen RetrospectiveScreen StoryScreen \
         StudySelectScreen StudyScreen StudyResultScreen AchievementScreen \
         HistoryScreen ChallengeResultScreen DailyQuizScreen; do
  sed -i -e "s|from '\./|from '../|g" \
         -e "s|\.\./domain|../../domain|g" \
         -e "s|\.\./data|../../data|g" \
         -e "s|\.\./infrastructure|../../infrastructure|g" \
         -e "s|\.\./constants|../../constants|g" \
         -e "s|\.\./hooks|../../hooks|g" \
         -e "s|\.\./utils|../../utils|g" \
         -e "s|from '\.\./screens/|from './|g" \
         "components/screens/$s.tsx"
done
```

> 置換は記載順に適用される。1 つ目で `'./styles'` → `'../styles'`、
> `'./TitleButtons'` → `'../TitleButtons'`、`'./screens/SprintCountSelector'` →
> `'../screens/SprintCountSelector'` となり、最後の置換で `'./SprintCountSelector'`
> に正規化される。`\.\./domain` 等のパターンは `'../../../utils'` のような深いパス
> でも「最後のセグメント」に 1 回だけマッチするため、どの深さでも一様に +1 される
> (TitleScreen の `'../../../utils/math-utils'` → `'../../../../utils/math-utils'`)。
> `'../hooks'`(useKeys)は `'../../hooks'` になる。

- [ ] **Step 6: components/index.ts と __tests__ の参照を screens/ に向ける**

```bash
for s in TitleScreen SprintStartScreen RetrospectiveScreen StoryScreen \
         StudySelectScreen StudyScreen StudyResultScreen AchievementScreen \
         HistoryScreen ChallengeResultScreen DailyQuizScreen; do
  sed -i "s|'\./$s'|'./screens/$s'|" components/index.ts
  sed -i "s|'\.\./components/$s'|'../components/screens/$s'|g" __tests__/*.ts __tests__/*.tsx
done
```

- [ ] **Step 7: useCharacterComment を hooks/ へ移動**

```bash
git mv components/useCharacterComment.ts hooks/useCharacterComment.ts
sed -i "s|'\./useCharacterComment'|'../hooks/useCharacterComment'|" components/CharacterReaction.tsx
grep -rl "components/useCharacterComment" __tests__ --include='*.ts*' | xargs -r sed -i \
  "s|'\.\./components/useCharacterComment'|'../hooks/useCharacterComment'|"
```

> 注: 移動するファイル自身の `'../domain/narrative/character-reactions'` 参照
> (PR3 で設定済み)は、`components/` も `hooks/` も Feature ルートから同じ深さの
> ため**修正不要**。

- [ ] **Step 8: 中間検証**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
npm run typecheck && npm test
```

Expected: 全パス。失敗時はエラーが指すファイルの相対パス深度を上記ルールで修正

## Task 11: components/hooks/styles を presentation/ へ移設

**Files:**
- Move: `components/` → `presentation/components/`、`hooks/` → `presentation/hooks/`、`components/styles/` → `presentation/styles/`
- Modify: 移設ツリー内の Feature ルート方向参照(+1 階層)、`index.ts`、`__tests__/`

- [ ] **Step 1: ディレクトリ移動**

```bash
cd src/features/agile-quiz-sugoroku
mkdir presentation
git mv components presentation/components
git mv hooks presentation/hooks
git mv presentation/components/styles presentation/styles
```

- [ ] **Step 2: 移設ツリー内のインポートを一括調整**

ルール:
1. `styles` への参照: 深さ +1(`'./styles'` は components 直下 → `'../styles'`)
2. Feature ルート方向(`domain` / `data` / `infrastructure` / `constants`)と
   共通 `utils`: 深さ +1
3. `presentation/components` ⇄ `presentation/hooks` 間の参照(`'../hooks/...'`,
   screens からの `'../../hooks'`)は両者が一緒に移動するため**深さ不変**(hooks の
   置換ルールを入れない)

```bash
cd presentation
find components hooks \( -name '*.ts' -o -name '*.tsx' \) -type f | xargs sed -i \
  -e "s|\.\./styles|../../styles|g" \
  -e "s|'\./styles|'../styles|g" \
  -e "s|\.\./domain|../../domain|g" \
  -e "s|\.\./data|../../data|g" \
  -e "s|\.\./infrastructure|../../infrastructure|g" \
  -e "s|\.\./constants|../../constants|g" \
  -e "s|\.\./utils|../../utils|g"
cd ..
```

> styles の 2 つの置換は順序が重要: 先に `'../styles'` 系を +1 し、その後で
> `'./styles'`(components 直下のみの形)を `'../styles'` に変える。
> `\.\./domain` 等のパターンは深いパスでも「最後のセグメント」に 1 回だけ
> マッチするため、すべての深さで一様に +1 される。sed は置換結果を再走査
> しないため二重適用は起きない。

- [ ] **Step 3: index.ts の参照を presentation/ に向ける**

```bash
sed -i -e "s|'\./hooks'|'./presentation/hooks'|" \
       -e "s|'\./components'|'./presentation/components'|" index.ts
```

- [ ] **Step 4: __tests__ の参照を presentation/ に向ける**

```bash
sed -i -e "s|'\.\./components/styles|'../presentation/styles|g" \
       -e "s|'\.\./components|'../presentation/components|g" \
       -e "s|'\.\./hooks|'../presentation/hooks|g" __tests__/*.ts __tests__/*.tsx
```

> 順序が重要: `components/styles` の置換を `components` より先に実行する。

- [ ] **Step 5: 旧パスの残存参照がゼロであることを確認**

```bash
grep -rn "'[./]*/components\b\|'[./]*/hooks\b" . --include='*.ts*' | grep -v presentation | grep -v node_modules
```

Expected: 出力なし(`presentation/components`, `presentation/hooks` 経由のみ)

- [ ] **Step 6: 中間検証**

```bash
cd /workspaces/claym/local/cline-playground-for-frontend
npm run typecheck && npm test
```

Expected: 全パス

## Task 12: 逆行防止のアーキテクチャテストを追加

**Files:**
- Modify: `src/features/agile-quiz-sugoroku/__tests__/architecture.test.ts`(describe ブロック追加)

- [ ] **Step 1: 以下の describe ブロックをファイル末尾に追加**

既存のヘルパー(`getAllSourceFiles`, `extractImportPaths`, `FEATURE_ROOT`)をそのまま利用する。

```typescript
describe('アーキテクチャ: 構造統一(2026-06 リファクタリング)', () => {
  it('Feature 直下に index.ts と README.md 以外のファイルが存在しないこと', () => {
    const ALLOWED_FILES = ['index.ts', 'README.md'];
    const ALLOWED_DIRS = [
      '__tests__',
      'constants',
      'data',
      'doc',
      'domain',
      'infrastructure',
      'presentation',
    ];
    const violations: string[] = [];
    for (const entry of fs.readdirSync(FEATURE_ROOT, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ALLOWED_DIRS.includes(entry.name)) violations.push(`${entry.name}/`);
      } else if (!ALLOWED_FILES.includes(entry.name)) {
        violations.push(entry.name);
      }
    }
    expect(violations).toEqual([]);
  });

  it('廃止済みの旧配置パスへのインポートが存在しないこと', () => {
    // 構造統一前のルート直下モジュール(移設済み)
    const REMOVED_ROOT_MODULES = [
      'components',
      'hooks',
      'audio',
      'questions',
      'story-data',
      'ending-data',
      'character-profiles',
      'character-narrative',
      'character-reactions',
      'character-genre-map',
      'daily-quiz',
      'team-classifier',
      'images',
    ];
    const removedAbsolute = REMOVED_ROOT_MODULES.map((m) => path.join(FEATURE_ROOT, m));
    const allFiles = getAllSourceFiles(FEATURE_ROOT)
      .filter((f) => !f.endsWith('architecture.test.ts'));
    const violations: string[] = [];
    for (const file of allFiles) {
      const imports = extractImportPaths(file);
      for (const { line, importPath } of imports) {
        if (!importPath.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(file), importPath);
        if (removedAbsolute.includes(resolved)) {
          violations.push(`${path.relative(FEATURE_ROOT, file)}:${line} → ${importPath}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('ページから Feature 内部への深いインポートが存在しないこと', () => {
    const pagePath = path.resolve(FEATURE_ROOT, '../../pages/AgileQuizSugorokuPage.tsx');
    const violations = extractImportPaths(pagePath)
      .filter(({ importPath }) => importPath.includes('features/agile-quiz-sugoroku/'))
      .map(({ line, importPath }) => `${line}: ${importPath}`);
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: アーキテクチャテストを実行して通ることを確認**

```bash
npx jest src/features/agile-quiz-sugoroku/__tests__/architecture.test.ts
```

Expected: PASS(新規 3 テスト含む)

## Task 13: PR4 の最終検証とコミット

- [ ] **Step 1: CI 実行**

```bash
npm run ci && npm run test:e2e
```

Expected: 全パス

- [ ] **Step 2: 最終構成を確認**

```bash
ls src/features/agile-quiz-sugoroku
ls src/features/agile-quiz-sugoroku/presentation
```

Expected: ルート = `__tests__ constants data doc domain index.ts infrastructure presentation README.md`、presentation = `components hooks styles`

- [ ] **Step 3: コミット・プッシュ・PR 作成**

```bash
git add -A src/features/agile-quiz-sugoroku
git commit -m "refactor: agile-quiz-sugoroku の UI 実体を presentation/ に移設しシムを全廃

- components/hooks/styles の実体を presentation/ 配下へ移設
- 画面コンポーネントを screens/ 配下に統一、後方互換シムを削除
- useCharacterComment を hooks/ へ移動
- 逆行防止のアーキテクチャテストを追加(ルート直下禁止・旧パス禁止・深いインポート禁止)"
git push -u origin refactor/aqs-presentation
gh pr create --title "refactor: agile-quiz-sugoroku の UI を presentation/ に移設しシムを全廃" --body "## 概要
構造統一リファクタリング(全 4 PR)の最終 PR。UI 実体を presentation/ に移設し、再エクスポートシムを全廃。逆行防止のアーキテクチャテストを追加する。

## 変更内容
- components/ hooks/ styles/ を presentation/ 配下へ移設
- 全画面コンポーネントを screens/ 配下に統一、後方互換シム削除
- architecture.test.ts に逆行防止ルール 3 件を追加

## テスト方法
- [ ] npm run ci
- [ ] npm run test:e2e
- [ ] アーキテクチャテスト新規 3 件のパス

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## 補足: トラブルシューティング

- **typecheck が「Cannot find module」で失敗する** — エラーが指すファイルの相対パス深度が移動量と合っていない。各タスクのマッピング表(旧→新)と「深さ +1」ルールに従って手で修正する。sed の一括置換が想定外のパターンを書き換えた可能性もあるため、`git diff <ファイル>` で置換結果を確認する
- **Jest が画像インポートで失敗する** — `__mocks__/` の画像モックは拡張子ベースのため移動の影響を受けない。失敗する場合はパス書き換えの誤りを疑う
- **E2E が失敗する** — 挙動変更が混入した可能性が高い。`git diff main --stat` で意図しないファイル(ロジック行)の変更がないか確認する
- **sed 一括置換に不安がある場合** — 各 sed の前に `grep -rn '<旧パターン>' <対象>` で対象行を列挙し、置換後に同じ grep が 0 件になることを確認する
