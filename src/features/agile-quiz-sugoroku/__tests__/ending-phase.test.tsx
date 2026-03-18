/**
 * エンディングフェーズ遷移テスト
 *
 * StoryScreen をエンディングストーリーで再利用できること、
 * エンディングの共通パート→エピローグ→結果画面への遷移を検証
 */

// tone モジュールのモック
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  start: jest.fn(),
  getContext: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryScreen } from '../components/StoryScreen';
import { StoryEntry, EndingEntry } from '../domain/types';
import { getEndingStories, ENDING_COMMON, ENDING_EPILOGUES } from '../ending-data';

// styled-components のアニメーション警告を抑制
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

/** EndingEntry → StoryEntry 変換（ページコンポーネントと同じロジック） */
function endingToStoryEntry(entry: EndingEntry): StoryEntry {
  return {
    sprintNumber: 0,
    title: entry.title,
    narratorId: 'taka',
    lines: entry.lines,
    imageKey: entry.imageKey,
  };
}

describe('StoryScreen でのエンディング表示', () => {
  it('エンディング用の headerLabel が表示される', () => {
    const storyData = endingToStoryEntry(ENDING_COMMON);
    render(
      <StoryScreen
        sprintNumber={5}
        storyData={storyData}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
        headerLabel="Ending"
      />
    );
    expect(screen.getByText('Ending')).toBeInTheDocument();
    // "Sprint 5" は表示されないこと
    expect(screen.queryByText('Sprint 5')).not.toBeInTheDocument();
  });

  it('エンディングのタイトルが表示される', () => {
    const storyData = endingToStoryEntry(ENDING_COMMON);
    render(
      <StoryScreen
        sprintNumber={5}
        storyData={storyData}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
        headerLabel="Ending"
      />
    );
    expect(screen.getByText(ENDING_COMMON.title)).toBeInTheDocument();
  });

  it('headerLabel 未指定時はデフォルトの Sprint ラベルが表示される', () => {
    const storyData = endingToStoryEntry(ENDING_COMMON);
    render(
      <StoryScreen
        sprintNumber={3}
        storyData={storyData}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );
    expect(screen.getByText('Sprint 3')).toBeInTheDocument();
  });

  it('エンディングストーリーのテキストが順次表示される', () => {
    const storyData = endingToStoryEntry(ENDING_COMMON);
    const onComplete = jest.fn();
    render(
      <StoryScreen
        sprintNumber={5}
        storyData={storyData}
        onComplete={onComplete}
        onSkip={jest.fn()}
        headerLabel="Ending"
      />
    );

    // 最初の行が表示される
    expect(screen.getByText(ENDING_COMMON.lines[0].text)).toBeInTheDocument();

    // クリックで次の行へ
    fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));
    expect(screen.getByText(ENDING_COMMON.lines[1].text)).toBeInTheDocument();
  });

  it('スキップボタンで onSkip が呼ばれる', () => {
    const storyData = endingToStoryEntry(ENDING_COMMON);
    const onSkip = jest.fn();
    render(
      <StoryScreen
        sprintNumber={5}
        storyData={storyData}
        onComplete={jest.fn()}
        onSkip={onSkip}
        headerLabel="Ending"
      />
    );

    fireEvent.click(screen.getByText('スキップ'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('全行表示後にクリックで onComplete が呼ばれる', () => {
    const epilogue = ENDING_EPILOGUES[0];
    const storyData = endingToStoryEntry(epilogue);
    const onComplete = jest.fn();
    render(
      <StoryScreen
        sprintNumber={5}
        storyData={storyData}
        onComplete={onComplete}
        onSkip={jest.fn()}
        headerLabel="Ending"
      />
    );

    // 全行分クリック
    for (let i = 0; i < epilogue.lines.length; i++) {
      fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('エンディングフェーズの遷移ロジック', () => {
  it('getEndingStories で共通パート→エピローグの順に取得できる', () => {
    const stories = getEndingStories('synergy');
    expect(stories).toHaveLength(2);
    expect(stories[0]).toBe(ENDING_COMMON);
    expect(stories[1].phase).toBe('epilogue');
    expect(stories[1].teamTypeId).toBe('synergy');
  });

  it('共通パート完了後にエピローグへ遷移するフローをシミュレートできる', () => {
    const stories = getEndingStories('resilient');

    // currentEndingIndex: 0 → 共通パート
    expect(stories[0].phase).toBe('common');

    // currentEndingIndex: 1 → エピローグ
    expect(stories[1].phase).toBe('epilogue');
    expect(stories[1].title).toBe('嵐の後の虹');

    // currentEndingIndex: 2 → 範囲外 → 結果画面へ遷移
    expect(stories[2]).toBeUndefined();
  });

  it('各チームタイプのエピローグが StoryScreen で表示可能な形式に変換できる', () => {
    for (const teamType of ['synergy', 'resilient', 'evolving', 'agile', 'struggling', 'forming']) {
      const stories = getEndingStories(teamType);
      for (const entry of stories) {
        const storyEntry = endingToStoryEntry(entry);
        expect(storyEntry.title).toBeTruthy();
        expect(storyEntry.lines.length).toBeGreaterThan(0);
        expect(storyEntry.narratorId).toBeTruthy();
      }
    }
  });
});
