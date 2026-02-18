import React, { useRef, useEffect } from 'react';
import type { SaveData, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { bestDiffLabel } from '../game-logic';
import { drawTitle } from '../sprites';
import { Screen, Title, Divider, GameButton, Gc } from '../styles';

interface Props {
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const TitleScreen: React.FC<Props> = ({ save, dispatch, playSfx }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bd = bestDiffLabel(save);

  useEffect(() => {
    if (canvasRef.current) drawTitle(canvasRef.current);
  }, []);

  return (
    <Screen $center>
      <canvas ref={canvasRef} width={240} height={130} style={{ width: 360, height: 195, marginBottom: 4, imageRendering: 'pixelated' }} />
      <Title>原始進化録</Title>
      <div style={{ fontSize: 13, color: '#b89830', letterSpacing: 7, marginBottom: 2 }}>PRIMAL PATH</div>
      <Divider />
      <div style={{ fontSize: 10, color: '#605848', letterSpacing: 2 }}>文明を選ぶたびに、未来が変わる</div>
      {bd && <div style={{ fontSize: 9, color: '#f0c040', marginTop: 4 }}>🏆 {bd}</div>}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <GameButton style={{ minWidth: 210, fontSize: 13 }} onClick={() => { playSfx('click'); dispatch({ type: 'GO_DIFF' }); }}>
          ▶ はじめる
        </GameButton>
        <GameButton style={{ minWidth: 210 }} onClick={() => { playSfx('click'); dispatch({ type: 'GO_TREE' }); }}>
          🦴 文明ツリー <Gc>({save.bones}骨)</Gc>
        </GameButton>
        <GameButton style={{ minWidth: 210 }} onClick={() => { playSfx('click'); dispatch({ type: 'GO_HOW' }); }}>
          📜 あそびかた
        </GameButton>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 12, fontSize: 9, color: '#2a2a3a', paddingBottom: 4 }}>
        <span>クリア{save.clears}回</span>
        <span>ラン{save.runs}回</span>
        <span
          style={{ cursor: 'pointer', color: '#401020' }}
          onClick={() => {
            if (window.confirm('セーブデータを全てリセットしますか？')) {
              dispatch({ type: 'RESET_SAVE' });
            }
          }}
        >
          リセット
        </span>
      </div>
    </Screen>
  );
};
