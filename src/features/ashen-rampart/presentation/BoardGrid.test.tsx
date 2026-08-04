/**
 * 盤面のテスト
 *
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを確認する
 * （S1 の教訓: aria-label だけを見るテストは描画の潰れを検出できなかった）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardGrid, MAX_CELL_MARKS } from './BoardGrid';
import { PLAINS_MAP, allPathCells, laneOf } from '../domain/board/stage-map';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';
import { createDeck } from '../domain/cards/deck';

const emptyState = createCombatState({ drawPile: [], hand: [], graveyard: [] }, PLAINS_WAVES);

const defaultProps = {
  map: PLAINS_MAP,
  state: emptyState,
  placeableCells: [],
  effects: [],
  onCellClick: jest.fn(),
};

describe('BoardGrid', () => {
  it('経路と設置スロットが読み取れるラベルを持つ', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[]}
        effects={[]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /0,2 経路/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1,1 設置可/ })).toBeInTheDocument();
  });

  it('高台と滞留が示される', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[]}
        effects={[]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /2,3 設置可 高台/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4,5 経路 滞留/ })).toBeInTheDocument();
  });

  it('配置可能なマスだけが「ここに置ける」と示される', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[{ x: 1, y: 1 }]}
        effects={[]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /1,1 設置可 ここに置ける/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /2,1 設置可 ここに置ける/ })).toBeNull();
  });

  it('セルをクリックすると座標が渡る', () => {
    const onCellClick = jest.fn();
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={emptyState}
        placeableCells={[{ x: 1, y: 1 }]}
        effects={[]}
        onCellClick={onCellClick}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /1,1 設置可 ここに置ける/ }));
    expect(onCellClick).toHaveBeenCalledWith({ x: 1, y: 1 });
  });

  it('設置済みのマスは役割と個体名を aria-label に持つ', () => {
    const withUnit = {
      ...emptyState,
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
    };
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={withUnit}
        placeableCells={[]}
        effects={[]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /1,1 設置可 攻撃塔 弓兵/ })).toBeInTheDocument();
  });

  it('設置済みのセルではレーン印と進行方向の矢印を隠す（情報量の上限）', () => {
    // レーン印・矢印はどちらも経路セル限定の表示。(1,1) は PLAINS_MAP では
    // 経路外（y=1 に経路は無い）のため検証にならず、実際に北レーンが通る
    // (1,2) に守り手を置いて確かめる。
    const withUnit = {
      ...emptyState,
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
    };
    render(<BoardGrid {...defaultProps} state={withUnit} />);
    const cell = screen.getByTestId('cell-1-2');
    expect(cell.querySelectorAll('[data-mark="lane"]')).toHaveLength(0);
    expect(cell.querySelectorAll('[data-mark="arrow"]')).toHaveLength(0);
  });

  it('設置済みセルに常時描く印は MAX_CELL_MARKS 以下である', () => {
    const withUnit = {
      ...emptyState,
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
    };
    render(<BoardGrid {...defaultProps} state={withUnit} />);
    // 1マスあたりの印を実際に数える:
    //   台座（文字はその子なので1つと数える）+ 状態バー + セル内に残った data-mark
    // レーン印と矢印の抑制が外れると 2 + 2 = 4 になり、この検証が落ちる。
    screen.getAllByTestId(/^unit-plate-/).forEach((plate) => {
      const pos = plate.getAttribute('data-testid')!.replace('unit-plate-', '');
      const [x, y] = pos.split('-');
      const cell = screen.getByTestId(`cell-${x}-${y}`);
      const markCount =
        1 +
        (screen.queryByTestId(`unit-status-${pos}`) ? 1 : 0) +
        cell.querySelectorAll('[data-mark]').length;
      expect(markCount).toBeLessThanOrEqual(MAX_CELL_MARKS);
    });
  });

  it('設置物のないセルではレーン印と矢印が残る（抑制は設置済みセル限定）', () => {
    // 上の検証が「常に data-mark が0」で通ってしまわないことの担保。
    // ブリーフは cell-2-1 を想定していたが、(2,1) も経路外のため印が出ない。
    // 経路上で設置物のない (2,2) を選ぶ。
    render(<BoardGrid {...defaultProps} />);
    const emptyPathCell = screen.getByTestId('cell-2-2');
    expect(emptyPathCell.querySelectorAll('[data-mark]').length).toBeGreaterThan(0);
  });

  it('敵は種別と体数が読めるマーカーとして描画される', () => {
    const withEnemies = {
      ...emptyState,
      enemies: [
        { id: 1, enemyId: 'swarm', hp: 8, maxHp: 8, progress: 1, spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0 },
        { id: 2, enemyId: 'swarm', hp: 8, maxHp: 8, progress: 1.2, spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0 },
      ],
    };
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={withEnemies}
        placeableCells={[]}
        effects={[]}
        onCellClick={jest.fn()}
      />
    );
    expect(screen.getByRole('img', { name: '群れ 2体' })).toBeInTheDocument();
  });

  it('エフェクトが盤面に描画される', () => {
    const effects = [
      {
        kind: 'shot' as const,
        id: 'a',
        from: { x: 1, y: 2 },
        to: { x: 1, y: 3 },
        untilTick: 10,
        wide: false,
        dashed: false,
      },
    ];
    const { container } = render(
      <BoardGrid
        map={PLAINS_MAP}
        state={createCombatState(createDeck(['reactor'], () => 0), PLAINS_WAVES)}
        placeableCells={[]}
        effects={effects}
        onCellClick={() => undefined}
      />
    );
    expect(container.querySelectorAll('[data-effect="shot"]')).toHaveLength(1);
  });

  it('経路外のマスはすべて設置可と読める（設置スロットの制約は反復3で廃止）', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={createCombatState(createDeck(['reactor'], () => 0), PLAINS_WAVES)}
        placeableCells={[]}
        effects={[]}
        onCellClick={() => undefined}
      />
    );
    // (0,0) はかつて設置スロットの制約（経路から距離1.5以内）で「城壁の外」だったが、
    // buildSlots 廃止により経路外は一律「設置可」になった
    expect(screen.getByLabelText(/^0,0 設置可/)).toBeInTheDocument();
  });
});

describe('2レーンの盤面', () => {
  it('両レーンの経路セルが経路として描かれる', () => {
    render(<BoardGrid {...defaultProps} />);
    allPathCells(PLAINS_MAP).forEach((c) => {
      expect(screen.getByTestId(`cell-${c.x}-${c.y}`)).toHaveAttribute('data-path', 'true');
    });
  });

  it('中央列は経路として描かれない（射手を置く場所）', () => {
    render(<BoardGrid {...defaultProps} />);
    expect(screen.getByTestId('cell-4-3')).toHaveAttribute('data-path', 'false');
  });

  it('レーンごとに区別できる属性を持つ（色だけに依存しない）', () => {
    render(<BoardGrid {...defaultProps} />);
    const north = laneOf(PLAINS_MAP, 0)[1]!;
    const south = laneOf(PLAINS_MAP, 1)[1]!;
    const northCell = screen.getByTestId(`cell-${north.x}-${north.y}`);
    const southCell = screen.getByTestId(`cell-${south.x}-${south.y}`);
    expect(northCell.getAttribute('data-lane')).not.toBe(southCell.getAttribute('data-lane'));
  });

  it('守り手の状態バーが表示される', () => {
    // 旧 UnitHpBar（unit-hp-x-y）は台座レイヤの PlacedStatusBar（unit-status-x-y）に
    // 置き換わった（Task 4・5）
    const units = [{ cardId: 'stone-wall', pos: { x: 3, y: 2 }, hp: 30, maxHp: 60, cooldownLeft: 0 }];
    render(<BoardGrid {...defaultProps} state={{ ...emptyState, units }} />);
    const bar = screen.getByTestId('unit-status-3-2');
    expect(bar).toHaveAttribute('role', 'progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemax', '60');
  });
});
