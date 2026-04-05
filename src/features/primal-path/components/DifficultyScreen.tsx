import React, { useState } from 'react';
import type { SaveData, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { DIFFS } from '../constants';
import { Screen, SubTitle, Divider, GameButton, Xc } from '../styles';

/** ステージ別テーマ説明 */
const STAGE_THEMES: readonly string[] = [
  '穏やかな原野を巡る入門の旅',
  '極寒が襲う。環境ダメージに注意',
  '天変地異の中を生き延びろ',
  '伝説の獣が待つ究極の試練',
];

interface Props {
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  onStart: (di: number, loopOverride: number) => void;
}

export const DifficultyScreen: React.FC<Props> = ({ save, dispatch, playSfx, onStart }) => {
  const [selectedLoop, setSelectedLoop] = useState(save.loopCount);

  return (
    <Screen>
      <div style={{ fontSize: 22, marginTop: 8 }}>⚔️</div>
      <SubTitle>ステージ選択</SubTitle>
      {save.loopCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 2px' }}>
          <GameButton
            style={{ padding: '2px 10px', fontSize: 14, minWidth: 0 }}
            $off={selectedLoop <= 0}
            onClick={() => {
              if (selectedLoop > 0) {
                playSfx('click');
                setSelectedLoop(selectedLoop - 1);
              }
            }}
          >
            ◀
          </GameButton>
          <span style={{ color: '#f0c040', fontSize: 13, minWidth: 60, textAlign: 'center' }}>
            {selectedLoop + 1}周目
          </span>
          <GameButton
            style={{ padding: '2px 10px', fontSize: 14, minWidth: 0 }}
            $off={selectedLoop >= save.loopCount}
            onClick={() => {
              if (selectedLoop < save.loopCount) {
                playSfx('click');
                setSelectedLoop(selectedLoop + 1);
              }
            }}
          >
            ▶
          </GameButton>
        </div>
      )}
      <Divider />
      {DIFFS.map((d, i) => {
        const locked = save.clears < d.ul;
        return (
          <GameButton
            key={i}
            $off={locked}
            style={{ width: '94%', textAlign: 'left', padding: '10px 14px' }}
            onClick={() => { playSfx('click'); onStart(i, selectedLoop); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#f0c040', fontSize: 12 }}>
                {d.ic} {d.n}{save.best?.[i] ? ' 🏆' : ''}
              </span>
              {i > 0 && <span style={{ fontSize: 11, color: '#988070' }}>骨×{d.bm}</span>}
            </div>
            <div style={{ color: '#908070', fontSize: 11, marginTop: 2 }}>
              {STAGE_THEMES[i]}
            </div>
            <div style={{ color: '#988070', fontSize: 13, marginTop: 2 }}>
              {d.d}{d.bb > 1 && ` 最終ボス${d.bb}連戦`}{locked && <Xc> (クリア{d.ul}回で解放)</Xc>}
            </div>
          </GameButton>
        );
      })}
      <GameButton style={{ marginTop: 10 }} onClick={() => { playSfx('click'); dispatch({ type: 'RETURN_TO_TITLE' }); }}>
        ◀ もどる
      </GameButton>
    </Screen>
  );
};
