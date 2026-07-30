/**
 * 盤面のテスト
 *
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを確認する
 * （S1 の教訓: aria-label だけを見るテストは描画の潰れを検出できなかった）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardGrid } from './BoardGrid';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';

const emptyState = createCombatState({ drawPile: [], hand: [], graveyard: [] }, PLAINS_WAVES);

describe('BoardGrid', () => {
  it('経路と設置スロットが読み取れるラベルを持つ', () => {
    render(
      <BoardGrid map={PLAINS_MAP} state={emptyState} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /0,3 経路/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1,2 設置可/ })).toBeInTheDocument();
  });

  it('高台と滞留が示される', () => {
    render(
      <BoardGrid map={PLAINS_MAP} state={emptyState} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /3,4 設置可 高台/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4,3 経路 滞留/ })).toBeInTheDocument();
  });

  it('配置可能なマスだけが「ここに置ける」と示される', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[{ x: 1, y: 2 }]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /1,2 設置可 ここに置ける/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /2,2 設置可 ここに置ける/ })).toBeNull();
  });

  it('セルをクリックすると座標が渡る', () => {
    const onCellClick = jest.fn();
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[{ x: 1, y: 2 }]}
        onCellClick={onCellClick}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /1,2 設置可 ここに置ける/ }));
    expect(onCellClick).toHaveBeenCalledWith({ x: 1, y: 2 });
  });

  it('設置物がセルに描画される', () => {
    const withTower = {
      ...emptyState,
      towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
    };
    render(
      <BoardGrid map={PLAINS_MAP} state={withTower} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /1,2 設置可 塔/ })).toBeInTheDocument();
  });

  it('敵は種別と体数が読めるマーカーとして描画される', () => {
    const withEnemies = {
      ...emptyState,
      enemies: [
        { id: 1, enemyId: 'swarm', hp: 8, maxHp: 8, progress: 1, spawnTick: 0, spawnPathIndex: 0, alive: true, leaked: false, groundedUntilTick: 0, stunnedUntilTick: 0 },
        { id: 2, enemyId: 'swarm', hp: 8, maxHp: 8, progress: 1.2, spawnTick: 0, spawnPathIndex: 0, alive: true, leaked: false, groundedUntilTick: 0, stunnedUntilTick: 0 },
      ],
    };
    render(
      <BoardGrid map={PLAINS_MAP} state={withEnemies} placeableCells={[]} onCellClick={jest.fn()} />
    );
    expect(screen.getByRole('img', { name: '群れ 2体' })).toBeInTheDocument();
  });
});
