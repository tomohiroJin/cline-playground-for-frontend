import React from 'react';
import type { SaveData, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { DIFFS } from '../constants';
import { Screen, SubTitle, Divider, GameButton, Xc } from '../styles';

interface Props {
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  onStart: (di: number) => void;
}

export const DifficultyScreen: React.FC<Props> = ({ save, dispatch, playSfx, onStart }) => (
  <Screen>
    <div style={{ fontSize: 22, marginTop: 8 }}>⚔️</div>
    <SubTitle>難易度選択</SubTitle>
    <Divider />
    {DIFFS.map((d, i) => {
      const locked = save.clears < d.ul;
      return (
        <GameButton
          key={i}
          $off={locked}
          style={{ width: '94%', textAlign: 'left', padding: '10px 14px' }}
          onClick={() => { playSfx('click'); onStart(i); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f0c040', fontSize: 12 }}>
              {d.ic} {d.n}{save.best?.[i] ? ' 🏆' : ''}
            </span>
            {i > 0 && <span style={{ fontSize: 9, color: '#605848' }}>骨×{d.bm}</span>}
          </div>
          <div style={{ color: '#605848', fontSize: 10, marginTop: 3 }}>
            {d.d}{locked && <Xc> (クリア{d.ul}回で解放)</Xc>}
          </div>
        </GameButton>
      );
    })}
    <GameButton style={{ marginTop: 10 }} onClick={() => { playSfx('click'); dispatch({ type: 'RETURN_TO_TITLE' }); }}>
      ◀ もどる
    </GameButton>
  </Screen>
);
