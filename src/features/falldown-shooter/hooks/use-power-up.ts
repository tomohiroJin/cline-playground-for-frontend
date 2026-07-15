// パワーアップ管理フック

import { useState, useCallback } from 'react';
import type { PowerType, Powers, ExplosionData } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG, EFFECT } from '../constants';
import { Audio } from '../audio';
import { GameLogic } from '../game-logic';
import { uid } from '../utils';
import { useSafeTimeout } from './use-safe-timeout';
import { applyChain } from './apply-chain';

const { width: W, height: H } = CONFIG.grid;

export interface UsePowerUpParams {
  gameState: UseGameStateReturn;
  soundEnabled: boolean;
  onBomb?: () => void;
  scoreMultiplier?: number;
  comboMultiplier?: number;
  onLineClear?: (lines: number) => void;
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
  scoreMultiplier,
  comboMultiplier,
  onLineClear,
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
        const explosionId = uid();
        setExplosions(e => [...e, { id: explosionId, x, y }]);
        // 爆発アニメーション終了後に配列から除去する（単調増加によるリーク防止）
        setSafeTimeout(() => {
          setExplosions(e => e.filter(ex => ex.id !== explosionId));
        }, EFFECT.explosion.duration);
        // アンマウント安全なタイマーで爆発処理を遅延実行
        setSafeTimeout(() => {
          const st = gameState.stateRef.current;
          const result = GameLogic.applyExplosion(x, y, st.blocks, st.grid, W, H);
          // 爆弾でグリッドのセルが消えるため連鎖を適用する
          const chain = applyChain(result.grid, { stage: st.stage }, {
            scoreMultiplier: scoreMultiplier ?? 1,
            comboMult: comboMultiplier ?? 1,
            onLineClear,
          });
          gameState.updateState({
            blocks: result.blocks,
            grid: chain.grid,
            score: st.score + result.score + chain.addedScore,
            lines: st.lines + chain.addedLines,
          });
        }, 0);
      } else {
        if (soundEnabled) Audio.power();
        setPowers(p => ({ ...p, [type]: true }));
        setSafeTimeout(() => handlePowerExpire(type), CONFIG.powerUp.duration[type]);
      }
    },
    [soundEnabled, gameState, handlePowerExpire, onBomb, setSafeTimeout, scoreMultiplier, comboMultiplier, onLineClear]
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
