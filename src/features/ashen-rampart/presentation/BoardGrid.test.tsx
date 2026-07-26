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

describe('BoardGrid 経路と目的地の可読性', () => {
  const board = createBoard(PLAINS_MAP);

  const renderBoard = (life?: number) =>
    render(
      <BoardGrid
        board={board}
        enemies={[]}
        placingType={null}
        life={life}
        onCellClick={() => undefined}
      />
    );

  it('砦セルは残ライフとともに示される', () => {
    renderBoard(4);

    expect(
      screen.getByRole('button', { name: /マス \(8, 1\).*砦・残りライフ4/ })
    ).toBeInTheDocument();
  });

  it('入口セルは敵の出現地点として示される', () => {
    renderBoard();

    expect(
      screen.getByRole('button', { name: /マス \(0, 3\).*敵の入口/ })
    ).toBeInTheDocument();
  });

  it('経路セルと設置スロットが aria-label で区別できる', () => {
    renderBoard();

    expect(
      screen.getByRole('button', { name: /マス \(1, 3\).*経路/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /マス \(1, 2\).*設置可能/ })
    ).toBeInTheDocument();
  });
});

describe('BoardGrid 敵の描き分け', () => {
  const board = createBoard(PLAINS_MAP);

  const enemies = [
    { index: 0, enemyId: 'grunt', hp: 20, maxHp: 20, x: 1, y: 3 },
    { index: 1, enemyId: 'runner', hp: 6, maxHp: 12, x: 2, y: 3 },
    { index: 2, enemyId: 'brute', hp: 60, maxHp: 60, x: 3, y: 3 },
  ];

  it('敵種ごとに名前と HP を読み取れる', () => {
    render(
      <BoardGrid
        board={board}
        enemies={enemies}
        placingType={null}
        onCellClick={() => undefined}
      />
    );

    expect(screen.getByRole('img', { name: /雑兵 HP 20\/20/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /俊足 HP 6\/12/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /重装 HP 60\/60/ })).toBeInTheDocument();
  });

  it('敵は砦までの残りマス数を持つ', () => {
    render(
      <BoardGrid
        board={board}
        enemies={enemies}
        placingType={null}
        onCellClick={() => undefined}
      />
    );

    // (1,3) は経路の index 1。全11セルなので残り9
    expect(
      screen.getByRole('img', { name: /雑兵.*砦まで残り9マス/ })
    ).toBeInTheDocument();
  });
});
