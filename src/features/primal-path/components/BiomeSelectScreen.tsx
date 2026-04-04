import React from 'react';
import type { RunState, BiomeId, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { BIO } from '../constants';
import { civLvs, biomeBonus, calcEnvDmg } from '../game-logic';
import { ProgressBar } from './shared';
import { Screen, SubTitle, Divider, GameButton } from '../styles';

interface Props {
  run: RunState;
  options: BiomeId[];
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  showOverlay: (icon: string, text: string, ms?: number) => Promise<void>;
}

export const BiomeSelectScreen: React.FC<Props> = ({ run, options, dispatch, playSfx, showOverlay }) => {
  const lvs = civLvs(run);

  const handlePick = async (b: BiomeId) => {
    playSfx('click');
    const info = BIO[b];
    await showOverlay(info.ic, info.nm + 'に突入！', 900);
    dispatch({ type: 'PICK_BIOME', biome: b });
  };

  return (
    <Screen $center>
      <div style={{ fontSize: 22 }}>🗺️</div>
      <SubTitle>次のバイオームを選べ</SubTitle>
      <ProgressBar current={run.bc} max={3} label="踏破進捗" />
      <Divider />
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map(b => {
          const m = BIO[b];
          const afn = biomeBonus(b, lvs);
          const envD = calcEnvDmg(b, run.dd.env, run.tb, run.fe);
          return (
            <GameButton key={b} style={{ width: 140, padding: '14px 10px' }} onClick={() => handlePick(b)}>
              <div style={{ fontSize: 28 }}>{m.ic}</div>
              <div style={{ fontSize: 13, color: '#f0c040', margin: '4px 0' }}>{m.nm}</div>
              <div style={{ fontSize: 11, color: '#605848' }}>{m.ds}</div>
              {afn > 1 && <div style={{ fontSize: 11, color: '#50e090', marginTop: 3 }}>✦ 相性◎ ATK×{afn}</div>}
              {envD > 0 && (
                <div style={{ fontSize: 11, color: envD >= 4 ? '#f05050' : '#e0a040', marginTop: 2 }}>
                  {b === 'glacier' ? '❄' : '🌋'} 毎T -{envD}
                </div>
              )}
            </GameButton>
          );
        })}
      </div>
    </Screen>
  );
};
