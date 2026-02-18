import React from 'react';
import type { RunState, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { aliveAllies } from '../game-logic';
import { StatLine, CivLevelsDisplay, AwakeningBadges, AllyList } from './shared';
import { Screen, SubTitle, Divider, GameButton, GamePanel, StatText, Gc } from '../styles';

interface Props {
  run: RunState;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const PreFinalScreen: React.FC<Props> = ({ run, dispatch, playSfx }) => {
  const aliveA = aliveAllies(run.al).length;
  return (
    <Screen $center>
      <div style={{ fontSize: 26 }}>⚡</div>
      <SubTitle>全バイオーム踏破！</SubTitle>
      <Divider />
      <GamePanel style={{ textAlign: 'center', padding: 14 }}>
        <div style={{ fontSize: 15, color: '#f0c040', marginBottom: 10, letterSpacing: 1 }}>最終決戦の準備</div>
        <StatText style={{ fontSize: 11 }}>
          <StatLine run={run} /> 会心 <Gc>{(run.cr * 100).toFixed(0)}%</Gc>
        </StatText>
        <StatText>🦴 {run.bE} <CivLevelsDisplay run={run} /> 👥 仲間{aliveA}体</StatText>
        {run.awoken.length > 0 && (
          <StatText style={{ marginTop: 4 }}><AwakeningBadges awoken={run.awoken} /></StatText>
        )}
        {run.burn > 0 && <StatText style={{ marginTop: 2, color: '#f08050' }}>🔥 火傷付与中</StatText>}
      </GamePanel>
      <AllyList allies={run.al} mode="evo" />
      <GameButton
        style={{ marginTop: 10, minWidth: 190, borderColor: '#f0c04060', color: '#f0c040', fontSize: 13 }}
        onClick={() => { playSfx('boss'); dispatch({ type: 'GO_FINAL_BOSS' }); }}
      >
        ⚡ 最終決戦へ
      </GameButton>
    </Screen>
  );
};
