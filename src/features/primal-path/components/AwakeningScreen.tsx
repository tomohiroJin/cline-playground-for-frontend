import React from 'react';
import type { RunState, CivTypeExt, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { AWK_SA, AWK_FA } from '../constants';
import { StatLine } from './shared';
import { Screen, SubTitle, Divider, GameButton, GamePanel, StatText } from '../styles';

interface Props {
  run: RunState;
  awkId: string;
  awkType: CivTypeExt;
  awkTier: number;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  showOverlay: (icon: string, text: string, ms?: number) => Promise<void>;
}

export const AwakeningScreen: React.FC<Props> = ({ run, awkId, awkType, awkTier, dispatch, playSfx, showOverlay }) => {
  const info = awkTier === 1 ? AWK_SA[awkType] : AWK_FA[awkType];
  const isFinal = awkTier === 2;
  const icon = isFinal ? '⚡' : '🔥';

  const handleAwaken = async () => {
    playSfx('win');
    await showOverlay(icon, info.nm + 'に覚醒！', 1300);
    dispatch({ type: 'PROCEED_TO_BATTLE' });
  };

  return (
    <Screen $center>
      <div style={{ fontSize: 36, filter: `drop-shadow(0 0 16px ${info.cl}60)` }}>{icon}</div>
      <SubTitle style={{ textShadow: '0 0 16px #f0c04060', letterSpacing: 2 }}>
        {isFinal ? '大覚醒' : '小覚醒'}
      </SubTitle>
      <Divider />
      <GamePanel style={{ textAlign: 'center', padding: 16 }}>
        <div style={{ fontSize: 18, color: info.cl, marginBottom: 8, textShadow: `0 0 14px ${info.cl}50`, letterSpacing: 1 }}>
          {icon} {info.nm}
        </div>
        <div style={{ color: '#a09878', lineHeight: 1.6, marginBottom: 10, fontSize: 10 }}>{info.ds}</div>
        {info.bn && (
          <div style={{
            color: '#f0c040', fontSize: 10, background: '#f0c04010',
            padding: '6px 10px', border: '1px solid #f0c04025', borderRadius: 3,
            display: 'inline-block', lineHeight: 1.4,
          }}>
            {info.bn}
          </div>
        )}
        <StatText style={{ marginTop: 8, fontSize: 9 }}>現在: <StatLine run={run} /></StatText>
      </GamePanel>
      <GameButton
        style={{ marginTop: 10, borderColor: info.cl + '60', color: info.cl, minWidth: 190, fontSize: 13 }}
        onClick={handleAwaken}
      >
        {icon} 覚醒する
      </GameButton>
    </Screen>
  );
};
