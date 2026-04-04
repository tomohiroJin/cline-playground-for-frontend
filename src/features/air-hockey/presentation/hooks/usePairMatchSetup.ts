/**
 * ペアマッチ（2v2）のデフォルトキャラ算出 Hook
 *
 * 2v2 モードのキャラ選択とリザルト画面用のキャラ解決を行う。
 * AirHockeyGame.tsx から抽出（S8-1-4）。
 */
import { useMemo } from 'react';
import { PLAYER_CHARACTER } from '../../core/characters';
import type { Character, GameMode } from '../../core/types';

export type UsePairMatchSetupReturn = {
  pairAlly: Character;
  pairEnemy1: Character;
  pairEnemy2: Character;
  resultPlayerCharacter: Character | undefined;
  resultOpponentCharacter: Character | undefined;
  currentCpuName: string;
};

type UsePairMatchSetupParams = {
  gameMode: GameMode;
  allyCharacter: Character | undefined;
  enemyCharacter1: Character | undefined;
  enemyCharacter2: Character | undefined;
  player1Character: Character | undefined;
  player2Character: Character | undefined;
  selectedCpuCharacter: Character | undefined;
  cpuCharacter: Character | undefined;
  freeBattleCpuCharacter: Character;
  freeBattleSelectableCharacters: Character[];
};

export const usePairMatchSetup = ({
  gameMode,
  allyCharacter,
  enemyCharacter1,
  enemyCharacter2,
  player1Character,
  player2Character,
  selectedCpuCharacter,
  cpuCharacter,
  freeBattleCpuCharacter,
  freeBattleSelectableCharacters,
}: UsePairMatchSetupParams): UsePairMatchSetupReturn => {
  const is2PMode = gameMode === '2p-local';
  const is2v2Mode = gameMode === '2v2-local';

  const pairAlly = useMemo(
    () => allyCharacter ?? freeBattleSelectableCharacters[0],
    [allyCharacter, freeBattleSelectableCharacters]
  );

  const pairEnemy1 = useMemo(
    () => enemyCharacter1 ?? freeBattleSelectableCharacters[1] ?? freeBattleSelectableCharacters[0],
    [enemyCharacter1, freeBattleSelectableCharacters]
  );

  const pairEnemy2 = useMemo(
    () => enemyCharacter2 ?? freeBattleSelectableCharacters[2] ?? freeBattleSelectableCharacters[0],
    [enemyCharacter2, freeBattleSelectableCharacters]
  );

  const resultPlayerCharacter = gameMode === 'story' ? PLAYER_CHARACTER
    : is2PMode ? player1Character
    : PLAYER_CHARACTER;

  const resultOpponentCharacter = gameMode === 'story' ? cpuCharacter
    : is2PMode ? player2Character
    : is2v2Mode ? freeBattleCpuCharacter
    : selectedCpuCharacter ?? freeBattleCpuCharacter;

  const currentCpuName = useMemo(
    () => gameMode === 'story' && cpuCharacter
      ? cpuCharacter.name
      : (selectedCpuCharacter ?? freeBattleCpuCharacter).name,
    [gameMode, cpuCharacter, selectedCpuCharacter, freeBattleCpuCharacter]
  );

  return { pairAlly, pairEnemy1, pairEnemy2, resultPlayerCharacter, resultOpponentCharacter, currentCpuName };
};
