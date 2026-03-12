// パワーアップ管理フック

import { useState, useCallback } from 'react';
import type { PowerType, Powers, ExplosionData } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { Audio } from '../audio';
import { GameLogic } from '../game-logic';
import { uid } from '../utils';
import { useSafeTimeout } from './use-safe-timeout';

const { width: W, height: H } = CONFIG.grid;

export interface UsePowerUpParams {
  gameState: UseGameStateReturn;
  soundEnabled: boolean;
  onBomb?: () => void;
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
  onBomb,
}: UsePowerUpParams): UsePowerUpReturn => {
  const [powers, setPowers] = useState<Powers>({
    triple: false,
    pierce: false,
    slow: false,
    downshot: false,
  });
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const { setSafeTimeout } = useSafeTimeout();

  const handlePowerExpire = useCallback((type: PowerType) => {
    setPowers(p => ({ ...p, [type]: false }));
  }, []);

  const handlePowerUp = useCallback(
    (type: PowerType, x: number, y: number) => {
      if (type === 'bomb') {
        if (soundEnabled) Audio.bomb();
        if (onBomb) onBomb();
        setExplosions(e => [...e, { id: uid(), x, y }]);
        // アンマウント安全なタイマーで爆発処理を遅延実行
        setSafeTimeout(() => {
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
        setSafeTimeout(() => handlePowerExpire(type), CONFIG.powerUp.duration[type]);
      }
    },
    [soundEnabled, gameState, handlePowerExpire, onBomb, setSafeTimeout]
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
