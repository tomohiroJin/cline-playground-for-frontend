/**
 * 灰燼の城壁 - 盤面グリッド（P1 プレースホルダ描画）
 *
 * 敵は tick スナップショットの補間座標を % 配置し、
 * CSS transition で滑らかに見せる。ロジックは持たない。
 */
import React from 'react';
import styled from 'styled-components';
import type { BoardState } from '../domain/board/board-state';
import type { CellPos } from '../domain/board/stage-map';
import type { EnemySnapshot } from '../domain/combat/simulate-wave';
import { getCardDefinition } from '../domain/cards/card-pool';

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
`;

const Grid = styled.div<{ $cols: number; $rows: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
  grid-template-rows: repeat(${({ $rows }) => $rows}, 1fr);
  gap: 2px;
  aspect-ratio: ${({ $cols, $rows }) => `${$cols} / ${$rows}`};
  background: #161114;
  padding: 4px;
  border-radius: 8px;
`;

const Cell = styled.button<{ $kind: 'path' | 'slot' | 'empty'; $placeable: boolean }>`
  border: none;
  border-radius: 4px;
  font-size: 16px;
  padding: 0;
  background: ${({ $kind }) =>
    $kind === 'path' ? '#3d3230' : $kind === 'slot' ? '#222b3a' : '#1a1418'};
  outline: ${({ $placeable }) => ($placeable ? '2px solid #7fb069' : 'none')};
  cursor: ${({ $placeable }) => ($placeable ? 'pointer' : 'default')};
`;

const EnemyDot = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  width: 5%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #c0392b;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  transition: left 0.1s linear, top 0.1s linear;
  pointer-events: none;
`;

const HpBar = styled.div<{ $ratio: number }>`
  position: absolute;
  top: -4px;
  left: 0;
  height: 3px;
  width: ${({ $ratio }) => Math.max(0, $ratio * 100)}%;
  background: #7fb069;
`;

interface Props {
  board: BoardState;
  enemies: EnemySnapshot[];
  /** 選択中カードの種別（配置可能マスのハイライト用）。null = 未選択 */
  placingType: 'tower' | 'trap' | null;
  onCellClick: (pos: CellPos) => void;
}

export const BoardGrid: React.FC<Props> = ({
  board,
  enemies,
  placingType,
  onCellClick,
}) => {
  const { width, height, path, buildSlots } = board.map;
  const cells: React.ReactElement[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isPath = path.some((p) => p.x === x && p.y === y);
      const isSlot = buildSlots.some((s) => s.x === x && s.y === y);
      const tower = board.towers.find((t) => t.pos.x === x && t.pos.y === y);
      const trap = board.traps.find((t) => t.pos.x === x && t.pos.y === y);
      const placeable =
        (placingType === 'tower' && isSlot && !tower) ||
        (placingType === 'trap' && isPath && !trap);
      const icon = tower
        ? getCardDefinition(tower.cardId).tower?.splashRadius
          ? '💣'
          : '🏹'
        : trap
          ? '🕳'
          : '';
      cells.push(
        <Cell
          key={`${x}-${y}`}
          $kind={isPath ? 'path' : isSlot ? 'slot' : 'empty'}
          $placeable={placeable}
          onClick={() => onCellClick({ x, y })}
          aria-label={`マス (${x}, ${y})`}
        >
          {icon}
        </Cell>
      );
    }
  }
  return (
    <Wrapper>
      <Grid $cols={width} $rows={height}>
        {cells}
      </Grid>
      {enemies.map((e) => (
        <EnemyDot
          key={e.index}
          $x={((e.x + 0.5) / width) * 100}
          $y={((e.y + 0.5) / height) * 100}
        >
          <HpBar $ratio={e.hp / e.maxHp} />
        </EnemyDot>
      ))}
    </Wrapper>
  );
};
