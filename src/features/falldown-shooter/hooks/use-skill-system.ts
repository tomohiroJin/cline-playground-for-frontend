// スキルシステム管理フック

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SkillType } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { Audio } from '../audio';
import { GameLogic } from '../game-logic';

export interface UseSkillSystemParams {
  gameState: UseGameStateReturn;
  playerX: number;
  isPlaying: boolean;
  soundEnabled: boolean;
  skillChargeMultiplier: number;
}

export interface UseSkillSystemReturn {
  skillCharge: number;
  setSkillCharge: (c: number | ((prev: number) => number)) => void;
  activateSkill: (skill: SkillType) => void;
  laserX: number | null;
  setLaserX: (x: number | null) => void;
  showBlast: boolean;
  setShowBlast: (v: boolean) => void;
}

export const useSkillSystem = ({
  gameState,
  playerX,
  isPlaying,
  soundEnabled,
  skillChargeMultiplier,
}: UseSkillSystemParams): UseSkillSystemReturn => {
  const [skillCharge, setSkillCharge] = useState<number>(0);
  const [laserX, setLaserX] = useState<number | null>(null);
  const [showBlast, setShowBlast] = useState<boolean>(false);
  const prevScoreRef = useRef<number>(0);

  // スキルチャージエフェクト
  useEffect(() => {
    if (!isPlaying) return;
    const state = gameState.stateRef.current;
    const scoreDiff = state.score - prevScoreRef.current;
    if (scoreDiff > 0) {
      const chargeGain = (scoreDiff / CONFIG.skill.chargeRate) * 100 * skillChargeMultiplier;
      setSkillCharge(c => {
        const newCharge = Math.min(CONFIG.skill.maxCharge, c + chargeGain);
        if (c < 100 && newCharge >= 100 && soundEnabled) Audio.charge();
        return newCharge;
      });
    }
    prevScoreRef.current = state.score;
  }, [gameState.stateRef.current.score, isPlaying, soundEnabled, gameState.stateRef, skillChargeMultiplier]);

  const activateSkill = useCallback(
    (skillType: SkillType) => {
      if (skillCharge < CONFIG.skill.maxCharge) return;

      if (soundEnabled) Audio.skill();
      setSkillCharge(0);

      const st = gameState.stateRef.current;

      switch (skillType) {
        case 'laser': {
          setLaserX(playerX);
          setTimeout(() => setLaserX(null), 300);
          const result = GameLogic.applyLaserColumn(playerX, st.blocks, st.grid);
          gameState.updateState({
            blocks: result.blocks,
            grid: result.grid,
            score: st.score + result.score,
          });
          break;
        }
        case 'blast': {
          setShowBlast(true);
          setTimeout(() => setShowBlast(false), 400);
          const result = GameLogic.applyBlastAll(st.blocks);
          gameState.updateState({
            blocks: result.blocks,
            score: st.score + result.score,
          });
          break;
        }
        case 'clear': {
          const result = GameLogic.applyClearBottom(st.grid);
          if (result.cleared) {
            const newPlayerY = GameLogic.calculatePlayerY(result.grid);
            gameState.updateState({
              grid: result.grid,
              score: st.score + result.score,
              playerY: newPlayerY,
            });
          }
          break;
        }
      }
    },
    [skillCharge, playerX, soundEnabled, gameState]
  );

  return {
    skillCharge,
    setSkillCharge,
    activateSkill,
    laserX,
    setLaserX,
    showBlast,
    setShowBlast,
  };
};
