// ゲーム操作管理フック

import { useState, useCallback } from 'react';
import type { BulletData, Powers } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { Audio } from '../audio';
import { Bullet } from '../bullet';
import { clamp } from '../../../utils/math-utils';

const { width: W } = CONFIG.grid;

export interface UseGameControlsParams {
  gameState: UseGameStateReturn;
  powers: Powers;
  soundEnabled: boolean;
}

export interface UseGameControlsReturn {
  playerX: number;
  setPlayerX: (x: number | ((prev: number) => number)) => void;
  canFire: boolean;
  setCanFire: (v: boolean) => void;
  moveLeft: () => void;
  moveRight: () => void;
  fire: () => void;
}

export const useGameControls = ({
  gameState,
  powers,
  soundEnabled,
}: UseGameControlsParams): UseGameControlsReturn => {
  const [playerX, setPlayerX] = useState<number>(Math.floor(W / 2));
  const [canFire, setCanFire] = useState<boolean>(true);

  const moveLeft = useCallback(() => setPlayerX(x => clamp(x - 1, 0, W - 1)), []);
  const moveRight = useCallback(() => setPlayerX(x => clamp(x + 1, 0, W - 1)), []);

  const fire = useCallback(() => {
    if (!canFire) return;
    if (soundEnabled) Audio.shoot();
    const y = gameState.stateRef.current.playerY - 1;

    let newBullets: BulletData[];
    if (powers.triple && powers.downshot) {
      newBullets = Bullet.createSpreadWithDownshot(playerX, y, powers.pierce);
    } else if (powers.triple) {
      newBullets = Bullet.createSpread(playerX, y, powers.pierce);
    } else if (powers.downshot) {
      newBullets = Bullet.createWithDownshot(playerX, y, powers.pierce);
    } else {
      newBullets = [Bullet.create(playerX, y, 0, -1, powers.pierce)];
    }

    gameState.updateState({
      bullets: [...gameState.stateRef.current.bullets, ...newBullets],
    });
    setCanFire(false);
    setTimeout(() => setCanFire(true), CONFIG.timing.bullet.cooldown);
  }, [canFire, playerX, powers, soundEnabled, gameState]);

  return {
    playerX,
    setPlayerX,
    canFire,
    setCanFire,
    moveLeft,
    moveRight,
    fire,
  };
};
