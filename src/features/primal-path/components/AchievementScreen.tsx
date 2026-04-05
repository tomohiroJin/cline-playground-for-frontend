/**
 * 原始進化録 - PRIMAL PATH - 実績画面
 */
import React from 'react';
import type { AchievementState, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { ACHIEVEMENTS } from '../constants';
import { Screen, SubTitle, Divider, GameButton, GamePanel } from '../styles';

interface Props {
  achievementStates: AchievementState[];
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const AchievementScreen: React.FC<Props> = ({ achievementStates, dispatch, playSfx }) => {
  const stateMap = React.useMemo(() => {
    const m = new Map<string, AchievementState>();
    for (const s of achievementStates) m.set(s.id, s);
    return m;
  }, [achievementStates]);
  const unlockedCount = achievementStates.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <Screen $center>
      <SubTitle>🏆 実績</SubTitle>
      <div style={{ fontSize: 13, color: '#908870', marginBottom: 4 }}>
        解除: {unlockedCount} / {totalCount}
      </div>
      <Divider />

      <GamePanel style={{ padding: '8px 10px', maxHeight: 480, overflowY: 'auto' }}>
        {ACHIEVEMENTS.map(ach => {
          const st = stateMap.get(ach.id);
          const isUnlocked = st?.unlocked ?? false;

          return (
            <div key={ach.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 4px',
              borderBottom: '1px solid #1a1a22',
              opacity: isUnlocked ? 1 : 0.35,
            }}>
              <span style={{ fontSize: 18, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                {ach.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: isUnlocked ? '#f0c040' : '#988070' }}>
                  {ach.name}
                </div>
                <div style={{ fontSize: 11, color: '#988070' }}>
                  {ach.description}
                </div>
                {isUnlocked && st?.unlockedDate && (
                  <div style={{ fontSize: 11, color: '#403828', marginTop: 1 }}>
                    {st.unlockedDate.slice(0, 10)}
                  </div>
                )}
              </div>
              {isUnlocked && (
                <span style={{ fontSize: 13, color: '#50e090' }}>✅</span>
              )}
            </div>
          );
        })}
      </GamePanel>

      <GameButton style={{ marginTop: 8, minWidth: 190 }}
        onClick={() => { playSfx('click'); dispatch({ type: 'SET_PHASE', phase: 'title' }); }}>
        🔙 戻る
      </GameButton>
    </Screen>
  );
};
