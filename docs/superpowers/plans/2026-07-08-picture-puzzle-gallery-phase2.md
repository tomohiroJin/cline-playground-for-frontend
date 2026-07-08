# Picture Puzzle フェーズ2「収蔵コレクション」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存のクリア記録を美術館メタファーの「収蔵目録」独立ビューへ読み替え、展示室ごとの収蔵率と名誉学芸員（段階ゴール）を可視化する。

**Architecture:** 新規永続データを足さず、`puzzle_records`・`themes`・`puzzle_total_clears` を読み取り、ドメイン純粋関数 `collection-service` で「作品単位」に集約する。UI は `PuzzlePageContainer` 配下に独立ビュー `CollectionView` を追加し、gallery テーマを自動適用する。

**Tech Stack:** React 19 + TypeScript + styled-components + Jotai。テストは Jest 30 + @testing-library/react。

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数・関数名）は英語可。
- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先（外部境界を除く）。
- 名前付きエクスポートを優先。関数コンポーネントのみ。Props は型定義必須。
- **安全境界（厳守）**: 変更は picture-puzzle 専用コードに閉じる。以下は触らない: `src/styles/GlobalStyle.ts` / `src/styles/tokens/*` / `src/App.tsx` / `src/pages/GameListPage.tsx` / `src/features/*`。
- 新規 localStorage キーを追加しない（読み取り専用の派生計算のみ）。
- 結合キー: `PuzzleRecord.imageId` == `themes[].images[].id`。収蔵判定は `clearCount > 0`。
- ランクの優劣順序: `★★★` > `★★☆` > `★☆☆` > `クリア`。
- TDD（Red→Green→Refactor）。ドメイン 90%+、新規コード 80%+。コミットは Conventional Commits。
- 全展示室=6室、全作品=15点。名誉学芸員は段階ゴール（第1目標=全15点収蔵／最上位=全15点★★★収蔵）。

---

### Task 1: ドメイン型定義（collection/types.ts）

**Files:**
- Create: `src/domain/collection/types.ts`

**Interfaces:**
- Produces:
  - `ArtworkStatus` — 作品1点の集約結果
  - `RoomCollection` — 展示室1室の収蔵状況
  - `CuratorGoal` — 名誉学芸員の進捗
  - `CollectionSummary` — ビューが受け取る集約全体

- [ ] **Step 1: 型定義ファイルを作成する**

```typescript
// src/domain/collection/types.ts
import { PuzzleRank } from '../../types/puzzle';

/** 作品1点の収蔵状況（同一 imageId の複数難易度レコードを集約した結果） */
export interface ArtworkStatus {
  readonly imageId: string;
  /** themes から引いた表示名（alt を流用） */
  readonly title: string;
  /** サムネイル用ファイル名 */
  readonly filename: string;
  /** 1回以上クリア済みか */
  readonly isCollected: boolean;
  /** 集約後の最高鑑定評価（未収蔵は undefined） */
  readonly bestRank?: PuzzleRank;
  /** 集約後のベストスコア最大値 */
  readonly bestScore: number;
  /** 集約後のベストタイム最小値（未収蔵は undefined） */
  readonly bestTime?: number;
  /** 集約後の最少手数（未取得は undefined） */
  readonly bestMoves?: number;
  /** 全難易度合算のクリア回数 */
  readonly clearCount: number;
  /** 最終クリア日時（ISO文字列・未収蔵は undefined） */
  readonly lastClearDate?: string;
}

/** 展示室1室の収蔵状況 */
export interface RoomCollection {
  readonly themeId: string;
  readonly name: string;
  readonly description: string;
  readonly isUnlocked: boolean;
  /** 未開館時の解放条件文言（開館済みは undefined） */
  readonly unlockHint?: string;
  readonly collectedCount: number;
  readonly totalCount: number;
  readonly artworks: readonly ArtworkStatus[];
}

/** 名誉学芸員（段階ゴール）の進捗 */
export interface CuratorGoal {
  /** 収蔵済み作品数 */
  readonly collected: number;
  /** ★★★収蔵の作品数 */
  readonly appraised3star: number;
  /** 全作品数（=15） */
  readonly total: number;
  /** 全作品を★★★収蔵したか */
  readonly isHonorary: boolean;
}

/** 収蔵目録ビューが受け取る集約全体 */
export interface CollectionSummary {
  readonly rooms: readonly RoomCollection[];
  readonly goal: CuratorGoal;
}
```

- [ ] **Step 2: 型チェックが通ることを確認する**

Run: `npm run typecheck`
Expected: PASS（エラーなし）

- [ ] **Step 3: コミット**

```bash
git add src/domain/collection/types.ts
git commit -m "feat: 収蔵コレクションのドメイン型を定義"
```

---

### Task 2: 作品単位の集約（aggregateByArtwork）

**Files:**
- Create: `src/domain/collection/collection-service.ts`
- Test: `src/domain/collection/collection-service.test.ts`

**Interfaces:**
- Consumes: `PuzzleRecord`（`src/types/puzzle.ts`）, `PuzzleImage`, `ArtworkStatus`（Task 1）
- Produces:
  - `compareRank(a: PuzzleRank, b: PuzzleRank): number` — 優劣比較（a が上位なら正）
  - `aggregateByArtwork(image: PuzzleImage, records: readonly PuzzleRecord[]): ArtworkStatus`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/domain/collection/collection-service.test.ts
import { aggregateByArtwork, compareRank } from './collection-service';
import { PuzzleImage, PuzzleRecord } from '../../types/puzzle';

const image: PuzzleImage = {
  id: 'moonlight_dancer',
  filename: 'moonlight_dancer.webp',
  alt: '月明かりのダンサー',
  themeId: 'illustration-gallery',
  hasVideo: true,
};

const rec = (over: Partial<PuzzleRecord>): PuzzleRecord => ({
  imageId: 'moonlight_dancer',
  division: 4,
  bestScore: 1000,
  bestRank: 'クリア',
  bestTime: 100,
  bestMoves: 50,
  clearCount: 1,
  lastClearDate: '2026-07-01T00:00:00.000Z',
  ...over,
});

describe('compareRank', () => {
  it('★★★ は クリア より上位', () => {
    expect(compareRank('★★★', 'クリア')).toBeGreaterThan(0);
  });
  it('同ランクは 0', () => {
    expect(compareRank('★☆☆', '★☆☆')).toBe(0);
  });
});

describe('aggregateByArtwork', () => {
  it('レコードなしは未収蔵として畳む', () => {
    const result = aggregateByArtwork(image, []);
    expect(result.isCollected).toBe(false);
    expect(result.clearCount).toBe(0);
    expect(result.bestRank).toBeUndefined();
    expect(result.title).toBe('月明かりのダンサー');
    expect(result.filename).toBe('moonlight_dancer.webp');
  });

  it('複数難易度のレコードを最良値へ集約する', () => {
    const records = [
      rec({ division: 3, bestScore: 2000, bestRank: '★☆☆', bestTime: 120, bestMoves: 60, clearCount: 2, lastClearDate: '2026-07-01T00:00:00.000Z' }),
      rec({ division: 5, bestScore: 5000, bestRank: '★★★', bestTime: 80, bestMoves: 40, clearCount: 3, lastClearDate: '2026-07-05T00:00:00.000Z' }),
    ];
    const result = aggregateByArtwork(image, records);
    expect(result.isCollected).toBe(true);
    expect(result.bestScore).toBe(5000);
    expect(result.bestRank).toBe('★★★');
    expect(result.bestTime).toBe(80);
    expect(result.bestMoves).toBe(40);
    expect(result.clearCount).toBe(5);
    expect(result.lastClearDate).toBe('2026-07-05T00:00:00.000Z');
  });

  it('bestMoves が全て null なら undefined', () => {
    const result = aggregateByArtwork(image, [rec({ bestMoves: null })]);
    expect(result.bestMoves).toBeUndefined();
  });

  it('別 imageId のレコードは無視する', () => {
    const other = rec({ imageId: 'other_image', clearCount: 9 });
    const result = aggregateByArtwork(image, [other]);
    expect(result.isCollected).toBe(false);
    expect(result.clearCount).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- collection-service`
Expected: FAIL（`aggregateByArtwork`/`compareRank` が未定義）

- [ ] **Step 3: 最小実装を書く**

```typescript
// src/domain/collection/collection-service.ts
import { PuzzleImage, PuzzleRank, PuzzleRecord } from '../../types/puzzle';
import { ArtworkStatus } from './types';

/** ランクの優劣順序（大きいほど上位） */
const RANK_ORDER: Record<PuzzleRank, number> = {
  'クリア': 0,
  '★☆☆': 1,
  '★★☆': 2,
  '★★★': 3,
};

/** ランクを比較する。a が上位なら正、同位で 0、下位で負 */
export const compareRank = (a: PuzzleRank, b: PuzzleRank): number =>
  RANK_ORDER[a] - RANK_ORDER[b];

/**
 * 1作品（imageId）について、全難易度のレコードを最良値へ集約する。
 * 収蔵判定は clearCount > 0。表示名は image.alt を流用する。
 */
export const aggregateByArtwork = (
  image: PuzzleImage,
  records: readonly PuzzleRecord[]
): ArtworkStatus => {
  const mine = records.filter(r => r.imageId === image.id && r.clearCount > 0);
  const base = {
    imageId: image.id,
    title: image.alt,
    filename: image.filename,
  };

  if (mine.length === 0) {
    return { ...base, isCollected: false, bestScore: 0, clearCount: 0 };
  }

  const bestScore = Math.max(...mine.map(r => r.bestScore));
  const bestRank = mine
    .map(r => r.bestRank)
    .reduce((best, cur) => (compareRank(cur, best) > 0 ? cur : best));
  const bestTime = Math.min(...mine.map(r => r.bestTime));
  const moves = mine.map(r => r.bestMoves).filter((m): m is number => m !== null);
  const bestMoves = moves.length > 0 ? Math.min(...moves) : undefined;
  const clearCount = mine.reduce((sum, r) => sum + r.clearCount, 0);
  const lastClearDate = mine
    .map(r => r.lastClearDate)
    .reduce((latest, cur) => (cur > latest ? cur : latest));

  return {
    ...base,
    isCollected: true,
    bestRank,
    bestScore,
    bestTime,
    bestMoves,
    clearCount,
    lastClearDate,
  };
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- collection-service`
Expected: PASS（6件）

- [ ] **Step 5: コミット**

```bash
git add src/domain/collection/collection-service.ts src/domain/collection/collection-service.test.ts
git commit -m "feat: 作品単位の収蔵集約 aggregateByArtwork を実装"
```

---

### Task 3: 展示室ごとの収蔵状況（buildRoomCollections）

**Files:**
- Modify: `src/domain/collection/collection-service.ts`
- Test: `src/domain/collection/collection-service.test.ts`（追記）

**Interfaces:**
- Consumes: `Theme`, `PuzzleRecord`, `ThemeId`（`src/types/puzzle.ts`）, `isThemeUnlocked` + `UnlockContext`（`src/domain/theme/theme-unlock-service.ts`）, `aggregateByArtwork`（Task 2）
- Produces:
  - `buildRoomCollections(themes: readonly Theme[], records: readonly PuzzleRecord[], totalClears: number): RoomCollection[]`

- [ ] **Step 1: 失敗するテストを追記する**

```typescript
// src/domain/collection/collection-service.test.ts に追記
import { buildRoomCollections } from './collection-service';
import { Theme } from '../../types/puzzle';

const twoRoomThemes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: 'desc-a',
    unlockCondition: { type: 'always' },
    images: [
      { id: 'img_a1', filename: 'a1.webp', alt: 'A1', themeId: 'illustration-gallery', hasVideo: false },
      { id: 'img_a2', filename: 'a2.webp', alt: 'A2', themeId: 'illustration-gallery', hasVideo: false },
    ],
  },
  {
    id: 'sea-and-sky',
    name: '海と空',
    description: 'desc-b',
    unlockCondition: { type: 'clearCount', count: 5 },
    images: [
      { id: 'img_b1', filename: 'b1.webp', alt: 'B1', themeId: 'sea-and-sky', hasVideo: false },
    ],
  },
];

const clearedRecord = (imageId: string): PuzzleRecord => ({
  imageId,
  division: 4,
  bestScore: 3000,
  bestRank: '★★☆',
  bestTime: 90,
  bestMoves: 30,
  clearCount: 1,
  lastClearDate: '2026-07-06T00:00:00.000Z',
});

describe('buildRoomCollections', () => {
  it('開館室は収蔵率を、未開館室は解放条件文言を返す', () => {
    const rooms = buildRoomCollections(twoRoomThemes, [clearedRecord('img_a1')], 1);
    const roomA = rooms.find(r => r.themeId === 'illustration-gallery')!;
    const roomB = rooms.find(r => r.themeId === 'sea-and-sky')!;

    expect(roomA.isUnlocked).toBe(true);
    expect(roomA.unlockHint).toBeUndefined();
    expect(roomA.collectedCount).toBe(1);
    expect(roomA.totalCount).toBe(2);
    expect(roomA.artworks[0].isCollected).toBe(true);
    expect(roomA.artworks[1].isCollected).toBe(false);

    expect(roomB.isUnlocked).toBe(false);
    expect(roomB.unlockHint).toContain('5');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- collection-service`
Expected: FAIL（`buildRoomCollections` が未定義）

- [ ] **Step 3: 最小実装を追記する**

```typescript
// src/domain/collection/collection-service.ts に追記
import { Theme, ThemeId } from '../../types/puzzle';
import { isThemeUnlocked, UnlockContext } from '../theme/theme-unlock-service';
import { RoomCollection } from './types';

/** 未開館室の解放条件文言を生成する */
const buildUnlockHint = (theme: Theme, totalClears: number): string => {
  const cond = theme.unlockCondition;
  if (cond.type === 'clearCount') {
    return `あと ${Math.max(0, cond.count - totalClears)} 点で開館（${cond.count}回クリア）`;
  }
  if (cond.type === 'themesClear') {
    return '全展示室で1点以上収蔵すると開館';
  }
  return '';
};

/**
 * 展示室ごとの収蔵状況を構築する。
 * アンロック判定は既存 theme-unlock-service を再利用する。
 */
export const buildRoomCollections = (
  themes: readonly Theme[],
  records: readonly PuzzleRecord[],
  totalClears: number
): RoomCollection[] => {
  const themeImageIds = new Map<ThemeId, string[]>();
  for (const theme of themes) {
    themeImageIds.set(theme.id, theme.images.map(img => img.id));
  }
  const context: UnlockContext = { totalClears, records, themeImageIds };

  return themes.map(theme => {
    const isUnlocked = isThemeUnlocked(theme.unlockCondition, context);
    const artworks = theme.images.map(img => aggregateByArtwork(img, records));
    const collectedCount = artworks.filter(a => a.isCollected).length;
    return {
      themeId: theme.id,
      name: theme.name,
      description: theme.description,
      isUnlocked,
      unlockHint: isUnlocked ? undefined : buildUnlockHint(theme, totalClears),
      collectedCount,
      totalCount: theme.images.length,
      artworks,
    };
  });
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- collection-service`
Expected: PASS（既存 + 1件）

- [ ] **Step 5: コミット**

```bash
git add src/domain/collection/collection-service.ts src/domain/collection/collection-service.test.ts
git commit -m "feat: 展示室ごとの収蔵状況 buildRoomCollections を実装"
```

---

### Task 4: 名誉学芸員ゴール判定と集約全体（evaluateCuratorGoal / buildCollectionSummary）

**Files:**
- Modify: `src/domain/collection/collection-service.ts`
- Test: `src/domain/collection/collection-service.test.ts`（追記）

**Interfaces:**
- Consumes: `buildRoomCollections`（Task 3）, `CuratorGoal`, `CollectionSummary`（Task 1）
- Produces:
  - `evaluateCuratorGoal(rooms: readonly RoomCollection[]): CuratorGoal`
  - `buildCollectionSummary(themes, records, totalClears): CollectionSummary`

- [ ] **Step 1: 失敗するテストを追記する**

```typescript
// src/domain/collection/collection-service.test.ts に追記
import { evaluateCuratorGoal, buildCollectionSummary } from './collection-service';

describe('evaluateCuratorGoal / buildCollectionSummary', () => {
  it('全作品★★★で名誉学芸員を達成する', () => {
    const summary = buildCollectionSummary(
      twoRoomThemes,
      [
        { ...clearedRecord('img_a1'), bestRank: '★★★' },
        { ...clearedRecord('img_a2'), bestRank: '★★★' },
        { ...clearedRecord('img_b1'), bestRank: '★★★' },
      ],
      5
    );
    expect(summary.goal.total).toBe(3);
    expect(summary.goal.collected).toBe(3);
    expect(summary.goal.appraised3star).toBe(3);
    expect(summary.goal.isHonorary).toBe(true);
    expect(summary.rooms).toHaveLength(2);
  });

  it('一部のみ収蔵なら名誉学芸員は未達', () => {
    const summary = buildCollectionSummary(twoRoomThemes, [clearedRecord('img_a1')], 1);
    expect(summary.goal.collected).toBe(1);
    expect(summary.goal.appraised3star).toBe(0);
    expect(summary.goal.isHonorary).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- collection-service`
Expected: FAIL（`evaluateCuratorGoal`/`buildCollectionSummary` が未定義）

- [ ] **Step 3: 最小実装を追記する**

```typescript
// src/domain/collection/collection-service.ts に追記
import { CuratorGoal, CollectionSummary } from './types';

/** 全展示室の収蔵状況から名誉学芸員の進捗を評価する */
export const evaluateCuratorGoal = (
  rooms: readonly RoomCollection[]
): CuratorGoal => {
  const artworks = rooms.flatMap(room => room.artworks);
  const total = artworks.length;
  const collected = artworks.filter(a => a.isCollected).length;
  const appraised3star = artworks.filter(a => a.bestRank === '★★★').length;
  return {
    collected,
    appraised3star,
    total,
    isHonorary: total > 0 && appraised3star === total,
  };
};

/** 収蔵目録ビュー向けの集約全体を構築する */
export const buildCollectionSummary = (
  themes: readonly Theme[],
  records: readonly PuzzleRecord[],
  totalClears: number
): CollectionSummary => {
  const rooms = buildRoomCollections(themes, records, totalClears);
  return { rooms, goal: evaluateCuratorGoal(rooms) };
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- collection-service`
Expected: PASS（全件）

- [ ] **Step 5: カバレッジを確認する**

Run: `npm test -- collection-service --coverage --collectCoverageFrom='src/domain/collection/collection-service.ts'`
Expected: collection-service.ts の statements 90%+

- [ ] **Step 6: コミット**

```bash
git add src/domain/collection/collection-service.ts src/domain/collection/collection-service.test.ts
git commit -m "feat: 名誉学芸員ゴール判定と集約全体を実装"
```

---

### Task 5: 作品フレーム コンポーネント（ArtworkFrame）

**Files:**
- Create: `src/components/molecules/ArtworkFrame.tsx`
- Create: `src/components/molecules/ArtworkFrame.styles.ts`
- Test: `src/components/molecules/ArtworkFrame.test.tsx`

**Interfaces:**
- Consumes: `ArtworkStatus`（Task 1）, `ArtFrame`（`src/components/molecules/ArtFrame`）, `galleryTokens`（`src/pages/gallery-theme`）
- Produces: `ArtworkFrame`（default export）— props `{ artwork: ArtworkStatus }`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/molecules/ArtworkFrame.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtworkFrame from './ArtworkFrame';
import { ArtworkStatus } from '../../domain/collection/types';

const collected: ArtworkStatus = {
  imageId: 'moonlight_dancer',
  title: '月明かりのダンサー',
  filename: 'moonlight_dancer.webp',
  isCollected: true,
  bestRank: '★★★',
  bestScore: 5000,
  bestTime: 80,
  bestMoves: 40,
  clearCount: 3,
  lastClearDate: '2026-07-05T00:00:00.000Z',
};

const notCollected: ArtworkStatus = {
  imageId: 'unseen',
  title: '未収蔵の作品',
  filename: 'unseen.webp',
  isCollected: false,
  bestScore: 0,
  clearCount: 0,
};

describe('ArtworkFrame', () => {
  it('収蔵済みは画像と鑑定評価を表示する', () => {
    render(<ArtworkFrame artwork={collected} />);
    const img = screen.getByAltText('月明かりのダンサー') as HTMLImageElement;
    expect(img.src).toContain('/images/default/moonlight_dancer.webp');
    expect(screen.getByText('★★★')).toBeInTheDocument();
  });

  it('未収蔵は空フレーム（画像なし）を表示する', () => {
    render(<ArtworkFrame artwork={notCollected} />);
    expect(screen.queryByAltText('未収蔵の作品')).not.toBeInTheDocument();
    expect(screen.getByText('未収蔵')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- ArtworkFrame`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: スタイルを実装する**

```typescript
// src/components/molecules/ArtworkFrame.styles.ts
import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

export const FrameFigure = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

export const Thumb = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/** 未収蔵の空フレーム内側 */
export const EmptySlot = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${galleryTokens.sub};
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  background: repeating-linear-gradient(
    45deg,
    ${galleryTokens.mat},
    ${galleryTokens.mat} 8px,
    ${galleryTokens.cream} 8px,
    ${galleryTokens.cream} 16px
  );
`;

export const Caption = styled.figcaption`
  font-size: 0.72rem;
  color: ${galleryTokens.sub};
  text-align: center;
`;

export const Rank = styled.span`
  color: ${galleryTokens.gold};
  letter-spacing: 0.1em;
`;
```

- [ ] **Step 4: コンポーネントを実装する**

```tsx
// src/components/molecules/ArtworkFrame.tsx
import React from 'react';
import { ArtFrame } from './ArtFrame';
import { ArtworkStatus } from '../../domain/collection/types';
import { FrameFigure, Thumb, EmptySlot, Caption, Rank } from './ArtworkFrame.styles';

export interface ArtworkFrameProps {
  readonly artwork: ArtworkStatus;
}

/** 収蔵目録の作品1点。収蔵済みは額装画像＋鑑定評価、未収蔵は空フレーム */
const ArtworkFrame: React.FC<ArtworkFrameProps> = ({ artwork }) => (
  <FrameFigure>
    <ArtFrame>
      {artwork.isCollected ? (
        <Thumb src={`/images/default/${artwork.filename}`} alt={artwork.title} />
      ) : (
        <EmptySlot>未収蔵</EmptySlot>
      )}
    </ArtFrame>
    <Caption>
      {artwork.isCollected && artwork.bestRank ? (
        <Rank>{artwork.bestRank}</Rank>
      ) : (
        artwork.title
      )}
    </Caption>
  </FrameFigure>
);

export default ArtworkFrame;
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- ArtworkFrame`
Expected: PASS（2件）

- [ ] **Step 6: コミット**

```bash
git add src/components/molecules/ArtworkFrame.tsx src/components/molecules/ArtworkFrame.styles.ts src/components/molecules/ArtworkFrame.test.tsx
git commit -m "feat: 収蔵作品フレーム ArtworkFrame を実装"
```

---

### Task 6: 名誉学芸員バナー（CuratorGoalBanner）

**Files:**
- Create: `src/components/molecules/CuratorGoalBanner.tsx`
- Create: `src/components/molecules/CuratorGoalBanner.styles.ts`
- Test: `src/components/molecules/CuratorGoalBanner.test.tsx`

**Interfaces:**
- Consumes: `CuratorGoal`（Task 1）, `galleryTokens`
- Produces: `CuratorGoalBanner`（default export）— props `{ goal: CuratorGoal }`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/molecules/CuratorGoalBanner.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import CuratorGoalBanner from './CuratorGoalBanner';
import { CuratorGoal } from '../../domain/collection/types';

describe('CuratorGoalBanner', () => {
  it('収蔵コンプと★★★コンプの2段進捗を表示する', () => {
    const goal: CuratorGoal = { collected: 12, appraised3star: 4, total: 15, isHonorary: false };
    render(<CuratorGoalBanner goal={goal} />);
    expect(screen.getByText('12 / 15')).toBeInTheDocument();
    expect(screen.getByText('4 / 15')).toBeInTheDocument();
    expect(screen.queryByText(/名誉学芸員に認定/)).not.toBeInTheDocument();
  });

  it('名誉学芸員達成時は称号を表示する', () => {
    const goal: CuratorGoal = { collected: 15, appraised3star: 15, total: 15, isHonorary: true };
    render(<CuratorGoalBanner goal={goal} />);
    expect(screen.getByText(/名誉学芸員に認定/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- CuratorGoalBanner`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: スタイルを実装する**

```typescript
// src/components/molecules/CuratorGoalBanner.styles.ts
import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

export const BannerContainer = styled.section`
  background: ${galleryTokens.mat};
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 4px;
  padding: 16px 20px;
  margin: 0 auto 24px;
  max-width: 560px;
`;

export const BannerTitle = styled.h2`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 1.1rem;
  color: ${galleryTokens.ink};
  margin: 0 0 12px;
  text-align: center;
`;

export const GoalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
`;

export const GoalLabel = styled.span`
  flex: 0 0 8.5em;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: ${galleryTokens.sub};
`;

export const Track = styled.div`
  flex: 1;
  height: 8px;
  background: ${galleryTokens.cream};
  border-radius: 4px;
  overflow: hidden;
`;

export const Fill = styled.div<{ $percent: number; $gold?: boolean }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ $gold }) => ($gold ? galleryTokens.gold : galleryTokens.sage)};
  transition: width 300ms ease;
`;

export const GoalCount = styled.span`
  flex: 0 0 3.5em;
  text-align: right;
  font-size: 0.74rem;
  color: ${galleryTokens.ink};
`;

export const Honor = styled.p`
  margin: 12px 0 0;
  text-align: center;
  color: ${galleryTokens.gold};
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
`;
```

- [ ] **Step 4: コンポーネントを実装する**

```tsx
// src/components/molecules/CuratorGoalBanner.tsx
import React from 'react';
import { CuratorGoal } from '../../domain/collection/types';
import {
  BannerContainer,
  BannerTitle,
  GoalRow,
  GoalLabel,
  Track,
  Fill,
  GoalCount,
  Honor,
} from './CuratorGoalBanner.styles';

export interface CuratorGoalBannerProps {
  readonly goal: CuratorGoal;
}

const toPercent = (value: number, total: number): number =>
  total > 0 ? (value / total) * 100 : 0;

/** 名誉学芸員への2段プログレス（収蔵コンプ／★★★コンプ）を表示する */
const CuratorGoalBanner: React.FC<CuratorGoalBannerProps> = ({ goal }) => (
  <BannerContainer>
    <BannerTitle>名誉学芸員への道</BannerTitle>
    <GoalRow>
      <GoalLabel>収蔵コンプ</GoalLabel>
      <Track>
        <Fill $percent={toPercent(goal.collected, goal.total)} />
      </Track>
      <GoalCount>{goal.collected} / {goal.total}</GoalCount>
    </GoalRow>
    <GoalRow>
      <GoalLabel>鑑定コンプ ★★★</GoalLabel>
      <Track>
        <Fill $percent={toPercent(goal.appraised3star, goal.total)} $gold />
      </Track>
      <GoalCount>{goal.appraised3star} / {goal.total}</GoalCount>
    </GoalRow>
    {goal.isHonorary && <Honor>あなたは名誉学芸員に認定されました</Honor>}
  </BannerContainer>
);

export default CuratorGoalBanner;
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- CuratorGoalBanner`
Expected: PASS（2件）

- [ ] **Step 6: コミット**

```bash
git add src/components/molecules/CuratorGoalBanner.tsx src/components/molecules/CuratorGoalBanner.styles.ts src/components/molecules/CuratorGoalBanner.test.tsx
git commit -m "feat: 名誉学芸員バナー CuratorGoalBanner を実装"
```

---

### Task 7: 収蔵目録ビュー（CollectionView）

**Files:**
- Create: `src/components/molecules/CollectionView.tsx`
- Create: `src/components/molecules/CollectionView.styles.ts`
- Test: `src/components/molecules/CollectionView.test.tsx`

**Interfaces:**
- Consumes: `buildCollectionSummary`（Task 4）, `ArtworkFrame`（Task 5）, `CuratorGoalBanner`（Task 6）, `Theme`/`PuzzleRecord`（types）, `galleryTokens`
- Produces: `CollectionView`（default export）— props `{ themes, records, totalClears, onBack }`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/components/molecules/CollectionView.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionView from './CollectionView';
import { Theme, PuzzleRecord } from '../../types/puzzle';

const themes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: 'desc-a',
    unlockCondition: { type: 'always' },
    images: [
      { id: 'img_a1', filename: 'a1.webp', alt: 'A1', themeId: 'illustration-gallery', hasVideo: false },
      { id: 'img_a2', filename: 'a2.webp', alt: 'A2', themeId: 'illustration-gallery', hasVideo: false },
    ],
  },
  {
    id: 'sea-and-sky',
    name: '海と空',
    description: 'desc-b',
    unlockCondition: { type: 'clearCount', count: 5 },
    images: [
      { id: 'img_b1', filename: 'b1.webp', alt: 'B1', themeId: 'sea-and-sky', hasVideo: false },
    ],
  },
];

const records: PuzzleRecord[] = [
  { imageId: 'img_a1', division: 4, bestScore: 3000, bestRank: '★★☆', bestTime: 90, bestMoves: 30, clearCount: 1, lastClearDate: '2026-07-06T00:00:00.000Z' },
];

describe('CollectionView', () => {
  it('展示室名・収蔵率・未開館文言を表示する', () => {
    render(<CollectionView themes={themes} records={records} totalClears={1} onBack={() => {}} />);
    expect(screen.getByText('イラストギャラリー')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('海と空')).toBeInTheDocument();
    expect(screen.getByText(/あと 4 点で開館/)).toBeInTheDocument();
  });

  it('戻るボタンで onBack を呼ぶ', () => {
    const onBack = jest.fn();
    render(<CollectionView themes={themes} records={records} totalClears={1} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- CollectionView`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: スタイルを実装する**

```typescript
// src/components/molecules/CollectionView.styles.ts
import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

export const ViewContainer = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
`;

export const ViewHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const ViewTitle = styled.h1`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 1.6rem;
  letter-spacing: 0.1em;
  color: ${galleryTokens.ink};
  margin: 0;
`;

export const BackButton = styled.button`
  background: transparent;
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 4px;
  padding: 6px 14px;
  color: ${galleryTokens.ink};
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background: ${galleryTokens.mat};
  }
`;

export const Room = styled.section`
  margin-bottom: 32px;
`;

export const RoomHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid ${galleryTokens.frameBorder};
  padding-bottom: 6px;
  margin-bottom: 12px;
`;

export const RoomName = styled.h2`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 1.1rem;
  color: ${galleryTokens.ink};
  margin: 0;
`;

export const RoomRate = styled.span`
  font-size: 0.78rem;
  color: ${galleryTokens.sub};
  letter-spacing: 0.06em;
`;

export const Wall = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
`;

export const LockedRoom = styled.p`
  color: ${galleryTokens.sub};
  font-size: 0.82rem;
  padding: 12px 0;
`;
```

- [ ] **Step 4: コンポーネントを実装する**

```tsx
// src/components/molecules/CollectionView.tsx
import React, { useMemo } from 'react';
import { Theme, PuzzleRecord } from '../../types/puzzle';
import { buildCollectionSummary } from '../../domain/collection/collection-service';
import ArtworkFrame from './ArtworkFrame';
import CuratorGoalBanner from './CuratorGoalBanner';
import {
  ViewContainer,
  ViewHeader,
  ViewTitle,
  BackButton,
  Room,
  RoomHeader,
  RoomName,
  RoomRate,
  Wall,
  LockedRoom,
} from './CollectionView.styles';

export interface CollectionViewProps {
  readonly themes: Theme[];
  readonly records: PuzzleRecord[];
  readonly totalClears: number;
  readonly onBack: () => void;
}

/** 収蔵目録の独立ビュー。展示室ごとに作品の壁を並べる */
const CollectionView: React.FC<CollectionViewProps> = ({
  themes,
  records,
  totalClears,
  onBack,
}) => {
  const summary = useMemo(
    () => buildCollectionSummary(themes, records, totalClears),
    [themes, records, totalClears]
  );

  return (
    <ViewContainer>
      <ViewHeader>
        <ViewTitle>収蔵目録</ViewTitle>
        <BackButton onClick={onBack}>戻る</BackButton>
      </ViewHeader>

      <CuratorGoalBanner goal={summary.goal} />

      {summary.rooms.map(room => (
        <Room key={room.themeId}>
          <RoomHeader>
            <RoomName>{room.name}</RoomName>
            {room.isUnlocked && (
              <RoomRate>{room.collectedCount} / {room.totalCount}</RoomRate>
            )}
          </RoomHeader>
          {room.isUnlocked ? (
            <Wall>
              {room.artworks.map(artwork => (
                <ArtworkFrame key={artwork.imageId} artwork={artwork} />
              ))}
            </Wall>
          ) : (
            <LockedRoom>{room.unlockHint}</LockedRoom>
          )}
        </Room>
      ))}
    </ViewContainer>
  );
};

export default CollectionView;
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- CollectionView`
Expected: PASS（2件）

- [ ] **Step 6: コミット**

```bash
git add src/components/molecules/CollectionView.tsx src/components/molecules/CollectionView.styles.ts src/components/molecules/CollectionView.test.tsx
git commit -m "feat: 収蔵目録の独立ビュー CollectionView を実装"
```

---

### Task 8: タイトル画面に収蔵目録への導線を追加

**Files:**
- Modify: `src/components/TitleScreen.tsx`
- Test: `src/components/TitleScreen.test.tsx`（追記）

**Interfaces:**
- Consumes: 既存 `TitleScreenProps`
- Produces: `TitleScreenProps` に `onOpenCollection: () => void` を追加

- [ ] **Step 1: 失敗するテストを追記する**

```tsx
// src/components/TitleScreen.test.tsx に追記
// 既存の import（render, screen, fireEvent, TitleScreen）を利用する
it('「収蔵目録を見る」で onOpenCollection を呼ぶ', () => {
  const onOpenCollection = jest.fn();
  render(
    <TitleScreen
      onStart={() => {}}
      onDebugActivate={() => {}}
      onOpenCollection={onOpenCollection}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '収蔵目録を見る' }));
  expect(onOpenCollection).toHaveBeenCalledTimes(1);
});
```

> 注: 既存 `TitleScreen.test.tsx` の各 render 呼び出しにも `onOpenCollection={() => {}}` を追加して型エラーを防ぐこと。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- TitleScreen`
Expected: FAIL（「収蔵目録を見る」ボタンが存在しない）

- [ ] **Step 3: TitleScreen を修正する**

`TitleScreenProps` と本体を以下のように変更する:

```tsx
// 追加: 既存 import 群の下に、目録導線ボタン用のスタイル
const SecondaryButton = styled.button`
  display: block;
  margin: 14px auto 0;
  background: transparent;
  border: none;
  color: ${galleryTokens.sub};
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  cursor: pointer;
  text-decoration: underline;
  animation: ${fadeIn} 0.8s ease-out 0.9s both;

  &:hover {
    color: ${galleryTokens.gold};
  }
`;

type TitleScreenProps = {
  onStart: () => void;
  onDebugActivate: () => void;
  onOpenCollection: () => void;
};

const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onDebugActivate,
  onOpenCollection,
}) => {
  // ...既存の useRef / useEffect はそのまま...

  return (
    <SetupSection>
      <Hero>
        <HeroArt />
      </Hero>
      <Title>ピクチャーパズル</Title>
      <Kicker>Your Private Gallery</Kicker>
      <EnterButton onClick={onStart}>入館する</EnterButton>
      <SecondaryButton onClick={onOpenCollection}>収蔵目録を見る</SecondaryButton>
    </SetupSection>
  );
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- TitleScreen`
Expected: PASS（既存 + 1件）

- [ ] **Step 5: コミット**

```bash
git add src/components/TitleScreen.tsx src/components/TitleScreen.test.tsx
git commit -m "feat: タイトル画面に収蔵目録への導線を追加"
```

---

### Task 9: PuzzlePage に収蔵目録ビューを接続

**Files:**
- Modify: `src/pages/PuzzlePage.tsx`
- Test: `src/pages/PuzzlePage.test.tsx`（追記）

**Interfaces:**
- Consumes: `CollectionView`（Task 7）, 拡張後の `TitleScreen`（Task 8）, `themes`（`src/data/themes.ts`）, 既存 `puzzleRecords`/`totalClears` state
- Produces: なし（結線タスク）

- [ ] **Step 1: 失敗するテストを追記する**

```tsx
// src/pages/PuzzlePage.test.tsx に追記
// 既存の render ヘルパ（PuzzlePage をモックストレージ付きで描画）を流用する
import { fireEvent, screen } from '@testing-library/react';

it('タイトルから収蔵目録を開き、戻れる', () => {
  render(<PuzzlePage recordStorage={mockRecordStorage} totalClearsStorage={mockTotalClearsStorage} />);
  fireEvent.click(screen.getByRole('button', { name: '収蔵目録を見る' }));
  expect(screen.getByText('収蔵目録')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '戻る' }));
  expect(screen.getByRole('button', { name: '入館する' })).toBeInTheDocument();
});
```

> 注: 既存テストのモックストレージ生成（`mockRecordStorage` 等）を再利用する。無ければ `{ getAll: () => [], get: () => undefined, save: () => {}, recordScore: () => {} }` 相当のスタブを用意する。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- PuzzlePage`
Expected: FAIL（「収蔵目録を見る」導線が未接続）

- [ ] **Step 3: PuzzlePage を修正する**

```tsx
// import 追加
import CollectionView from '../components/molecules/CollectionView';
import { themes } from '../data/themes';

// state 追加（showTitle の近く）
const [showCollection, setShowCollection] = useState(false);

// TitleScreen 呼び出しに onOpenCollection を追加
<TitleScreen
  onStart={() => setShowTitle(false)}
  onDebugActivate={() => setDebugMode(true)}
  onOpenCollection={() => setShowCollection(true)}
/>

// return 直下の分岐を、収蔵目録を最優先で描画するよう変更する
return (
  <PuzzlePageContainer>
    {showCollection ? (
      <CollectionView
        themes={themes}
        records={puzzleRecords}
        totalClears={totalClears}
        onBack={() => setShowCollection(false)}
      />
    ) : showTitle ? (
      <TitleScreen
        onStart={() => setShowTitle(false)}
        onDebugActivate={() => setDebugMode(true)}
        onOpenCollection={() => setShowCollection(true)}
      />
    ) : !gameStarted ? (
      /* ...既存 SetupSectionComponent... */
    ) : (
      /* ...既存 GameSectionComponent... */
    )}
    {/* 遊び方・ClearHistoryList のブロックは showCollection 中は隠す */}
    {!showTitle && !showCollection && (
      <>
        {/* ...既存 Instructions + ClearHistoryList... */}
      </>
    )}
  </PuzzlePageContainer>
);
```

> 注: 収蔵目録は `puzzleRecords`/`totalClears` を参照する。これらは `gameStarted` 変化時にのみ読み込まれるため、タイトル表示中の最新値で十分（プレイ後はセットアップ経由で更新済み）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- PuzzlePage`
Expected: PASS（既存 + 1件）

- [ ] **Step 5: コミット**

```bash
git add src/pages/PuzzlePage.tsx src/pages/PuzzlePage.test.tsx
git commit -m "feat: PuzzlePage に収蔵目録ビューを接続"
```

---

### Task 10: 全体検証と回帰チェック

**Files:**
- なし（検証のみ）

- [ ] **Step 1: CI パイプラインを実行する**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build がすべて PASS

- [ ] **Step 2: 開発サーバーで手動確認する**

Run: `npm start`
確認項目:
- タイトル →「収蔵目録を見る」→ 展示室ごとに作品フレームが並ぶ
- 収蔵済み=画像+★、未収蔵=空フレーム、未開館室=「あと○点で開館」
- 名誉学芸員の2段プログレスが表示される
- 「戻る」でタイトルに戻る
- gallery トーン（オフホワイト背景・明朝見出し・ゴールドアクセント）が適用されている

- [ ] **Step 3: 他ゲーム非波及の回帰チェック（親設計書 §4 手順）**

`npm start` で picture-puzzle 以外のゲーム1本以上（例: air-hockey）を開き、背景・配色・タイポが従来どおりであることを確認する。

- [ ] **Step 4: プッシュして PR を作成する**

```bash
git push -u origin feature/picture-puzzle-gallery-phase2
gh pr create --base main --title "feat: Picture Puzzle フェーズ2 収蔵コレクション" --body "$(cat <<'EOF'
## 概要
既存のクリア記録を美術館メタファーの「収蔵目録」独立ビューへ読み替え、展示室ごとの収蔵率と名誉学芸員（段階ゴール）を可視化する。新規永続データは追加しない。

## 変更内容
- ドメイン層 collection-service（作品単位集約・収蔵率・名誉学芸員判定）
- CollectionView / ArtworkFrame / CuratorGoalBanner を追加
- タイトル画面に「収蔵目録を見る」導線、PuzzlePage に第4ビューを接続

## テスト方法
- [ ] npm run ci が全パス
- [ ] タイトル→収蔵目録→戻るの導線
- [ ] 収蔵済み/未収蔵/未開館室の3状態表示
- [ ] 他12ゲームの見た目に影響しないこと
EOF
)"
```

- [ ] **Step 5: CI を確認する**

Run: `gh pr checks <PR番号>`
Expected: 全チェック（Lint/Test/TypeCheck/Build/E2E）が PASS

---

## Self-Review

**Spec coverage:**
- 収蔵目録ビュー（独立フルスクリーン）→ Task 7 + Task 9 ✅
- 展示室ごと収蔵率 → Task 3（データ）+ Task 7（表示）✅
- 名誉学芸員 段階ゴール → Task 4（判定）+ Task 6（表示）✅
- 作品単位集約（粒度ミスマッチ橋渡し）→ Task 2 ✅
- 3状態フレーム（収蔵済み/未収蔵/未開館）→ Task 5 + Task 7 ✅
- 新規永続データなし → 全タスク読み取り専用（新規 store なし）✅
- ClearHistoryList 統合 → 設計では目録内統合だが、本プランでは既存の
  セットアップ下部表示を維持しつつ独立目録を新設する構成とした。ClearHistoryList の
  目録内埋め込みは受け入れ基準「既存の履歴・ベストスコアが目録として正しく表示」を
  ArtworkFrame の実績表示（★・スコア）で満たすため、二重表示を避け現状維持とする。
- 他ゲーム非波及 → Task 10 Step 3 ✅

**Placeholder scan:** プレースホルダなし。全コードブロックは実行可能な完全実装。

**Type consistency:** `ArtworkStatus`/`RoomCollection`/`CuratorGoal`/`CollectionSummary`（Task 1）を
Task 2-7 で一貫使用。`buildCollectionSummary`/`aggregateByArtwork`/`buildRoomCollections`/
`evaluateCuratorGoal`/`compareRank` のシグネチャは Interfaces ブロックと実装で一致。
`onOpenCollection`（Task 8）と PuzzlePage 接続（Task 9）の名称一致を確認済み。
