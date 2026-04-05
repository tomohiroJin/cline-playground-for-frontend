import React from 'react';
import type { RunState, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { allyReviveCost, deadAllies } from '../game-logic';
import { TC } from '../constants';
import { Screen, SubTitle, Divider, GameButton, GamePanel, Gc, BiomeBg } from '../styles';

interface Props {
  run: RunState;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  showOverlay: (icon: string, text: string, ms?: number) => Promise<void>;
}

export const AllyReviveScreen: React.FC<Props> = ({ run, dispatch, playSfx, showOverlay }) => {
  const dead = deadAllies(run.al);
  const cost50 = allyReviveCost(run);
  const cost100 = Math.floor(cost50 * 1.8);

  const handleRevive = async (allyIndex: number, pct: number) => {
    const target = dead[allyIndex];
    if (!target) return;
    playSfx('heal');
    await showOverlay('✨', target.n + 'が蘇った！', 800);
    dispatch({ type: 'REVIVE_ALLY', allyIndex, pct });
  };

  return (
    <Screen $center>
      <BiomeBg $biome={run.cBT as string} />
      <div style={{ fontSize: 30, filter: 'drop-shadow(0 0 12px #d060ff40)' }}>✨</div>
      <SubTitle style={{ letterSpacing: 2 }}>仲間復活の儀</SubTitle>
      <Divider />
      <div style={{ fontSize: 13, color: '#908870', marginBottom: 6 }}>所持骨: <Gc>{run.bE}</Gc></div>

      {dead.map((a, i) => {
        const canHalf = run.bE >= cost50;
        const canFull = run.bE >= cost100;
        return (
          <GamePanel key={i} style={{ padding: 10, textAlign: 'center', margin: '4px 0' }}>
            <div style={{ fontSize: 12, color: TC[a.t], marginBottom: 4 }}>💀 {a.n}</div>
            <div style={{ fontSize: 11, color: '#988070', marginBottom: 6 }}>
              HP {a.mhp} / ATK {a.atk}{a.tk ? ' (盾役)' : a.h ? ' (回復役)' : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <GameButton $off={!canHalf} style={{ fontSize: 13, minWidth: 100 }}
                onClick={() => canHalf && handleRevive(i, 50)}>
                HP50%復活<br />
                <span style={{ fontSize: 11, color: canHalf ? '#f0c040' : '#f05050' }}>🦴{cost50}</span>
              </GameButton>
              <GameButton $off={!canFull} style={{ fontSize: 13, minWidth: 100 }}
                onClick={() => canFull && handleRevive(i, 100)}>
                HP100%復活<br />
                <span style={{ fontSize: 11, color: canFull ? '#f0c040' : '#f05050' }}>🦴{cost100}</span>
              </GameButton>
            </div>
          </GamePanel>
        );
      })}

      <GameButton style={{ marginTop: 6, color: '#988070' }} onClick={() => { playSfx('click'); dispatch({ type: 'SKIP_REVIVE' }); }}>
        ▶ スキップ
      </GameButton>
    </Screen>
  );
};
