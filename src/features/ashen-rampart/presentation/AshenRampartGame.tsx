/**
 * 灰燼の城壁 - ゲーム画面
 *
 * 三層レイアウト（上部=ラン状態 / 中央=盤面 / 下部=手札と資源）。
 * 同時に走査する枠を7以内に収める（設計書 §9.1）。
 */
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { useAshenRampartGame } from './useAshenRampartGame';
import { RunStatusBar } from './RunStatusBar';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { EnemyLegend } from './EnemyLegend';
import { COLORS } from './theme';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
`;

const Center = styled.div`
  flex: 1;
  padding: 12px;
`;

const Result = styled.div`
  text-align: center;
  padding: 16px;
`;

const RestartButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

export const AshenRampartGame: React.FC = () => {
  const game = useAshenRampartGame();

  // スペースキーで一時停止（設計書 §9.6）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      game.togglePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  return (
    <Layout>
      <RunStatusBar
        state={game.state}
        isPaused={game.isPaused}
        onTogglePause={game.togglePause}
      />
      <Center>
        <BoardGrid
          map={PLAINS_MAP}
          state={game.state}
          placeableCells={game.placeableCells}
          onCellClick={game.clickCell}
        />
        <EnemyLegend />
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <RestartButton type="button" onClick={game.restart}>
              もう一度挑む
            </RestartButton>
          </Result>
        )}
      </Center>
      <HandArea
        state={game.state}
        selectedIndex={game.selectedIndex}
        onSelect={game.selectCard}
        overflowNotice={game.overflowNotice}
      />
    </Layout>
  );
};
