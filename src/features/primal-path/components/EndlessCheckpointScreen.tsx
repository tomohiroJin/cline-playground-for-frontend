import React from 'react';
import type { RunState, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { calcEndlessScaleWithAM } from '../game-logic';
import { Screen, SubTitle, Divider, GameButton, GamePanel, RunStatRow, Gc } from '../styles';

interface Props {
  run: RunState;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const EndlessCheckpointScreen: React.FC<Props> = ({ run, dispatch, playSfx }) => {
  const nextWave = (run.endlessWave ?? 0) + 1;
  const nextScale = calcEndlessScaleWithAM(nextWave, run.aM);

  return (
    <Screen>
      <SubTitle style={{ fontSize: 18, color: '#f0c040' }}>
        ♾️ ウェーブ {run.endlessWave} クリア！
      </SubTitle>
      <Divider />

      <GamePanel style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#f0c040', marginBottom: 4, textAlign: 'center' }}>── 現在の戦績 ──</div>
        <RunStatRow><span>到達ウェーブ</span><span><Gc>{run.endlessWave}</Gc></span></RunStatRow>
        <RunStatRow><span>撃破数</span><span><Gc>{run.kills}</Gc></span></RunStatRow>
        <RunStatRow><span>獲得骨</span><span><Gc>🦴 {run.bE + run.bb}</Gc></span></RunStatRow>
      </GamePanel>

      <GamePanel style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#f08050', marginBottom: 4, textAlign: 'center' }}>── 次のウェーブ ──</div>
        <RunStatRow><span>ウェーブ</span><span>{nextWave}</span></RunStatRow>
        <RunStatRow>
          <span>敵強化倍率</span>
          <span style={{ color: nextScale > 3 ? '#f05050' : '#f0c040' }}>
            ×{nextScale.toFixed(1)}
          </span>
        </RunStatRow>
      </GamePanel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <GameButton
          style={{ minWidth: 190, fontSize: 12 }}
          onClick={() => { playSfx('click'); dispatch({ type: 'ENDLESS_CONTINUE' }); }}
        >
          ⚔️ 続行する
        </GameButton>
        <GameButton
          style={{ minWidth: 190, fontSize: 11, opacity: 0.85 }}
          onClick={() => { playSfx('click'); dispatch({ type: 'ENDLESS_RETIRE' }); }}
        >
          🏠 ここで終了する
        </GameButton>
      </div>
    </Screen>
  );
};
