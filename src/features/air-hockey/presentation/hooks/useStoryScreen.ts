/**
 * ストーリーモード画面用の派生データ Hook
 *
 * ストーリーモード固有の useMemo を集約する。
 * AirHockeyGame.tsx から抽出（S8-1-2）。
 */
import { useMemo } from 'react';
import { findCharacterById, PLAYER_CHARACTER, BACKGROUND_MAP } from '../../core/characters';
import type { Character } from '../../core/types';
import type { StageDefinition } from '../../core/story';
import type { AiBehaviorConfig } from '../../core/story-balance';
import { getStoryStageBalance } from '../../core/story-balance';

export type UseStoryScreenReturn = {
  cpuCharacter: Character | undefined;
  storyCharacters: Record<string, Character>;
  stageBackgroundUrl: string | undefined;
  hasNextStage: boolean;
  storyAiConfig: AiBehaviorConfig | undefined;
};

type UseStoryScreenParams = {
  currentStage: StageDefinition | undefined;
  /** 全ステージ配列（Chapter 追加時にコンパイルエラーで渡し忘れを検出） */
  allStages: readonly StageDefinition[];
};

export const useStoryScreen = ({ currentStage, allStages }: UseStoryScreenParams): UseStoryScreenReturn => {
  const cpuCharacter = useMemo(
    () => currentStage ? findCharacterById(currentStage.characterId) : undefined,
    [currentStage]
  );

  const storyCharacters = useMemo(() => {
    if (!currentStage) return {};
    const chars: Record<string, typeof PLAYER_CHARACTER> = {};
    if (cpuCharacter) chars[currentStage.characterId] = cpuCharacter;
    chars['player'] = PLAYER_CHARACTER;
    return chars;
  }, [currentStage, cpuCharacter]);

  const stageBackgroundUrl = useMemo(
    () => currentStage?.backgroundId ? BACKGROUND_MAP[currentStage.backgroundId] : undefined,
    [currentStage]
  );

  const hasNextStage = useMemo(() => {
    if (!currentStage) return false;
    const idx = allStages.findIndex(s => s.id === currentStage.id);
    return idx < allStages.length - 1;
  }, [currentStage, allStages]);

  const storyAiConfig = useMemo(
    () => currentStage ? getStoryStageBalance(currentStage.id).ai : undefined,
    [currentStage]
  );

  return { cpuCharacter, storyCharacters, stageBackgroundUrl, hasNextStage, storyAiConfig };
};
