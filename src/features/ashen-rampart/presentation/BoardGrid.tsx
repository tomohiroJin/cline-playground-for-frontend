/**
 * 灰燼の城壁 - 盤面グリッド（P1 プレースホルダ描画）
 *
 * 敵は tick スナップショットの補間座標を % 配置し、
 * CSS transition で滑らかに見せる。ロジックは持たない。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import type { BoardState } from '../domain/board/board-state';
import { canPlaceTower, canPlaceTrap } from '../domain/board/board-state';
import type { CellPos } from '../domain/board/stage-map';
import {
  isHighGround,
  isSlowCell,
  coveredPathCells,
} from '../domain/board/stage-map';
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

const Cell = styled.button<{
  $kind: 'path' | 'slot' | 'empty';
  $placeable: boolean;
  $terrain: 'highground' | 'slow' | 'none';
  $covered: boolean;
}>`
  border: none;
  border-radius: 4px;
  font-size: 16px;
  padding: 0;
  position: relative;
  background: ${({ $kind, $terrain }) =>
    $terrain === 'highground'
      ? '#3a4a2a'
      : $terrain === 'slow'
        ? '#2a3348'
        : $kind === 'path'
          ? '#3d3230'
          : $kind === 'slot'
            ? '#222b3a'
            : '#1a1418'};
  outline: ${({ $placeable, $covered }) =>
    $placeable ? '2px solid #7fb069' : $covered ? '2px solid #e8b04b' : 'none'};
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
  /** 選択中タワーカードの射程（オーバーレイ用）。未選択/非タワーは undefined */
  placingRange?: number;
  onCellClick: (pos: CellPos) => void;
}

export const BoardGrid: React.FC<Props> = ({
  board,
  enemies,
  placingType,
  placingRange,
  onCellClick,
}) => {
  const { width, height, path, buildSlots } = board.map;
  const [hovered, setHovered] = useState<CellPos | null>(null);

  // 選択中タワーをホバーセルに置いた場合に覆う経路セル
  const coveredKeys = new Set<string>();
  if (placingType === 'tower' && placingRange !== undefined && hovered) {
    for (const c of coveredPathCells(board.map, hovered, placingRange)) {
      coveredKeys.add(`${c.x}-${c.y}`);
    }
  }

  const cells: React.ReactElement[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isPath = path.some((p) => p.x === x && p.y === y);
      const isSlot = buildSlots.some((s) => s.x === x && s.y === y);
      const tower = board.towers.find((t) => t.pos.x === x && t.pos.y === y);
      const trap = board.traps.find((t) => t.pos.x === x && t.pos.y === y);
      const pos = { x, y };
      const placeable =
        (placingType === 'tower' && canPlaceTower(board, pos)) ||
        (placingType === 'trap' && canPlaceTrap(board, pos));
      const towerSpec = tower ? getCardDefinition(tower.cardId).tower : undefined;
      const icon = towerSpec
        ? towerSpec.aura
          ? '🔥'
          : towerSpec.splashRadius
            ? '💣'
            : '🏹'
        : trap
          ? '🕳'
          : '';
      const terrain: 'highground' | 'slow' | 'none' = isHighGround(board.map, pos)
        ? 'highground'
        : isSlowCell(board.map, pos)
          ? 'slow'
          : 'none';
      const terrainLabel =
        terrain === 'highground' ? '・高台' : terrain === 'slow' ? '・滞留' : '';
      const marker = terrain === 'highground' ? '⛰' : terrain === 'slow' ? '🌫' : '';
      const covered = coveredKeys.has(`${x}-${y}`);
      cells.push(
        <Cell
          key={`${x}-${y}`}
          $kind={isPath ? 'path' : isSlot ? 'slot' : 'empty'}
          $placeable={placeable}
          $terrain={terrain}
          $covered={covered}
          onClick={() => onCellClick({ x, y })}
          onMouseEnter={() => setHovered({ x, y })}
          onMouseLeave={() => setHovered(null)}
          aria-label={`マス (${x}, ${y})${terrainLabel}`}
        >
          {icon || marker}
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
