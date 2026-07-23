import React from 'react';
import { render, screen } from '@testing-library/react';
import { BoardGrid } from './BoardGrid';
import { createBoard } from '../domain/board/board-state';
import { PLAINS_MAP } from '../domain/board/stage-map';

describe('BoardGrid 地形タイル', () => {
  const board = createBoard(PLAINS_MAP);

  it('高台セルは aria-label に「高台」を含む', () => {
    render(
      <BoardGrid
        board={board}
        enemies={[]}
        placingType={null}
        onCellClick={() => undefined}
      />
    );
    // 高台は (3,4)
    expect(
      screen.getByRole('button', { name: /マス \(3, 4\).*高台/ })
    ).toBeInTheDocument();
  });

  it('滞留セルは aria-label に「滞留」を含む', () => {
    render(
      <BoardGrid
        board={board}
        enemies={[]}
        placingType={null}
        onCellClick={() => undefined}
      />
    );
    // 滞留は (4,2)
    expect(
      screen.getByRole('button', { name: /マス \(4, 2\).*滞留/ })
    ).toBeInTheDocument();
  });
});
