/**
 * useStoryScreen のテスト
 */
import { renderHook } from '@testing-library/react';
import { useStoryScreen } from './useStoryScreen';
import { CHAPTER_1_STAGES, ALL_STAGES } from '../../core/dialogue-data';
import { CHAPTER_2_STAGES } from '../../core/chapter2-dialogue-data';

describe('useStoryScreen', () => {
  describe('storyCharacters', () => {
    it('currentStage が undefined のとき空オブジェクトを返す', () => {
      const { result } = renderHook(() =>
        useStoryScreen({ currentStage: undefined, allStages: ALL_STAGES })
      );
      expect(result.current.storyCharacters).toEqual({});
    });

    it('対戦相手と player を含む', () => {
      const stage = CHAPTER_1_STAGES[0]; // Stage 1-1: hiro
      const { result } = renderHook(() =>
        useStoryScreen({ currentStage: stage, allStages: ALL_STAGES })
      );
      expect(result.current.storyCharacters['player']).toBeDefined();
      expect(result.current.storyCharacters['hiro']).toBeDefined();
    });

    it('Stage 2-2 のダイアログに登場する全話者（hiro/misaki/yuu/regular/player）を含む', () => {
      const stage22 = CHAPTER_2_STAGES.find(s => s.id === '2-2')!;
      const { result } = renderHook(() =>
        useStoryScreen({ currentStage: stage22, allStages: ALL_STAGES })
      );
      const ids = Object.keys(result.current.storyCharacters);
      expect(ids).toContain('player');
      expect(ids).toContain('regular');
      expect(ids).toContain('hiro');
      expect(ids).toContain('misaki');
      expect(ids).toContain('yuu');
    });

    it('Stage 2-4 のダイアログに登場する全話者（takuma/hiro/misaki/yuu/ace/shion/player）を含む', () => {
      const stage24 = CHAPTER_2_STAGES.find(s => s.id === '2-4')!;
      const { result } = renderHook(() =>
        useStoryScreen({ currentStage: stage24, allStages: ALL_STAGES })
      );
      const ids = Object.keys(result.current.storyCharacters);
      expect(ids).toContain('player');
      expect(ids).toContain('ace');
      expect(ids).toContain('takuma');
      expect(ids).toContain('hiro');
      expect(ids).toContain('misaki');
      expect(ids).toContain('yuu');
      expect(ids).toContain('shion');
    });
  });

  describe('hasNextStage', () => {
    it('最終ステージでない場合 true', () => {
      const stage = ALL_STAGES[0];
      const { result } = renderHook(() =>
        useStoryScreen({ currentStage: stage, allStages: ALL_STAGES })
      );
      expect(result.current.hasNextStage).toBe(true);
    });

    it('最終ステージで false', () => {
      const lastStage = ALL_STAGES[ALL_STAGES.length - 1];
      const { result } = renderHook(() =>
        useStoryScreen({ currentStage: lastStage, allStages: ALL_STAGES })
      );
      expect(result.current.hasNextStage).toBe(false);
    });
  });
});
