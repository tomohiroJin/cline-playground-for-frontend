// パワーアップ管理フック

import { useState, useCallback } from 'react';
import type { PowerType, Powers, ExplosionData } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { Audio } from '../audio';
import { GameLogic } from '../game-logic';
import { uid } from '../utils';

const { width: W, height: H } = CONFIG.grid;

export interface UsePowerUpParams {
  gameState: UseGameStateReturn;
  soundEnabled: boolean;
}

export interface UsePowerUpReturn {
  powers: Powers;
  setPowers: (p: Powers | ((prev: Powers) => Powers)) => void;
  explosions: ExplosionData[];
  setExplosions: (e: React.SetStateAction<ExplosionData[]>) => void;
  handlePowerUp: (type: PowerType, x: number, y: number) => void;
  handlePowerExpire: (type: PowerType) => void;
}

export const usePowerUp = ({
  gameState,
  soundEnabled,
}: UsePowerUpParams): UsePowerUpReturn => {
  const [powers, setPowers] = useState<Powers>({
    triple: false,
    pierce: false,
    slow: false,
    downshot: false,
  });
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);

  const handlePowerExpire = useCallback((type: PowerType) => {
    setPowers(p => ({ ...p, [type]: false }));
  }, []);

  const handlePowerUp = useCallback(
    (type: PowerType, x: number, y: number) => {
      if (type === 'bomb') {
        if (soundEnabled) Audio.bomb();
        setExplosions(e => [...e, { id: uid(), x, y }]);
        setTimeout(() => {
          const st = gameState.stateRef.current;
          const result = GameLogic.applyExplosion(x, y, st.blocks, st.grid, W, H);
          gameState.updateState({
            blocks: result.blocks,
            grid: result.grid,
            score: st.score + result.score,
          });
        }, 0);
      } else {
        if (soundEnabled) Audio.power();
        setPowers(p => ({ ...p, [type]: true }));
        setTimeout(() => handlePowerExpire(type), CONFIG.powerUp.duration[type]);
      }
    },
    [soundEnabled, gameState, handlePowerExpire]
  );

  return {
    powers,
    setPowers,
    explosions,
    setExplosions,
    handlePowerUp,
    handlePowerExpire,
  };
};
