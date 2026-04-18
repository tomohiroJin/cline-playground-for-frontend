/**
 * フリーバトル画面用の派生データ Hook
 *
 * フリーバトル固有の useMemo を集約する。
 * AirHockeyGame.tsx から抽出（S8-1-3）。
 */
import { useMemo } from 'react';
import { getCharacterByDifficulty, getBattleCharacters, findCharacterById } from '../../core/characters';
import type { Character, Difficulty } from '../../core/types';
import { buildFreeBattleAiConfig } from '../../core/story-balance';
import type { AiBehaviorConfig } from '../../core/story-balance';

export type UseFreeBattleScreenReturn = {
  freeBattleAiConfig: AiBehaviorConfig | undefined;
  freeBattleCpuCharacter: Character;
  allBattleCharacters: Character[];
  freeBattleSelectableCharacters: Character[];
};

type UseFreeBattleScreenParams = {
  difficulty: Difficulty;
  selectedCpuCharacter: Character | undefined;
  unlockedIds: string[];
};

export const useFreeBattleScreen = ({
  difficulty,
  selectedCpuCharacter,
  unlockedIds,
}: UseFreeBattleScreenParams): UseFreeBattleScreenReturn => {
  const freeBattleAiConfig = useMemo(
    () => selectedCpuCharacter
      ? buildFreeBattleAiConfig(difficulty, selectedCpuCharacter.id)
      : undefined,
    [difficulty, selectedCpuCharacter]
  );

  const freeBattleCpuCharacter = useMemo(
    () => getCharacterByDifficulty(difficulty),
    [difficulty]
  );

  // 基本キャラ + 図鑑解放済みストーリーキャラ（2P 対戦 / フリー対戦共通）
  const allBattleCharacters = useMemo(() => {
    const base = getBattleCharacters();
    const baseIds = new Set(base.map(c => c.id));
    const unlocked = unlockedIds
      .filter(id => !baseIds.has(id))
      .map(id => findCharacterById(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
    return [...base, ...unlocked];
  }, [unlockedIds]);

  // 自キャラ除外
  const freeBattleSelectableCharacters = useMemo(
    () => allBattleCharacters.filter(c => c.id !== 'player'),
    [allBattleCharacters]
  );

  return { freeBattleAiConfig, freeBattleCpuCharacter, allBattleCharacters, freeBattleSelectableCharacters };
};
