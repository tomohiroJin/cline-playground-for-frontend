/**
 * 灰燼の城壁 - 盤面グリッド
 *
 * 敵の通り道・向かう先・置ける場所が一目で読めることを最優先にする。
 * セルの意味づけは cell-descriptor（純粋）に切り出し、ここは描画に徹する。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import type { BoardState } from '../domain/board/board-state';
import { canPlaceTower, canPlaceTrap } from '../domain/board/board-state';
import type { CellPos } from '../domain/board/stage-map';
import {
  coveredPathCells,
  remainingPathCells,
} from '../domain/board/stage-map';
import type { EnemySnapshot } from '../domain/combat/simulate-wave';
import { describeCell, type CellDescriptor } from './cell-descriptor';
import { EnemyMarker } from './EnemyMarker';

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

/** セル背景。経路は明るい土色、設置スロットは寒色で明確に系統を分ける */
const backgroundOf = (cell: CellDescriptor): string => {
  if (cell.terrain === 'highground') return '#4a6b2c';
  if (cell.terrain === 'slow') return '#3d5a7a';
  if (cell.kind === 'path') return '#7a5f4a';
  if (cell.kind === 'slot') return '#243450';
  return '#171215';
};

const Cell = styled.button<{
  $bg: string;
  $slot: boolean;
  $placeable: boolean;
  $covered: boolean;
  $fortress: boolean;
  $hasTower: boolean;
}>`
  border-radius: 4px;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${({ $bg }) => $bg};
  border: ${({ $slot, $fortress, $hasTower }) =>
    $fortress
      ? '2px solid #e8b04b'
      : $hasTower
        ? '2px solid #7fb069'
        : $slot
          ? '2px dashed #5b7099'
          : '2px solid transparent'};
  outline: ${({ $placeable, $covered }) =>
    $placeable ? '2px solid #7fb069' : $covered ? '2px solid #e8b04b' : 'none'};
  cursor: ${({ $placeable }) => ($placeable ? 'pointer' : 'default')};
`;

/**
 * 地形・砦・入口の名前。記号は誤読されるためテキストで示す
 *
 * 敵マーカーと HP バーはセル中央付近に描かれるため、
 * ラベルは左上に寄せて重なりを避ける（1周目の観察で「入口」が
 * 敵に隠れて「入」までしか読めない事例が出た）。
 */
const CellLabel = styled.span`
  position: absolute;
  top: 2px;
  left: 2px;
  padding: 0 2px;
  font-size: 10px;
  line-height: 1.3;
  color: #f4ece0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 2px;
  pointer-events: none;
`;

/**
 * 経路の進行方向
 *
 * ラベル（滞留・砦・入口）やタワーのアイコンと排他にしない。
 * 滞留セルは経路が折れる区間にあり、方向表示が最も必要な場所であるため、
 * ラベルがあっても矢印を消してはならない。
 * アイコンがあるセルでは中央を譲り、右下の隅に小さく描く。
 */
const CellArrow = styled.span<{ $corner: boolean }>`
  font-size: ${({ $corner }) => ($corner ? '11px' : '16px')};
  color: #f5ead8;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
  ${({ $corner }) =>
    $corner
      ? `
    position: absolute;
    right: 2px;
    bottom: 0;
  `
      : ''}
`;

const CellIcon = styled.span`
  font-size: 18px;
  pointer-events: none;
`;

interface Props {
  board: BoardState;
  enemies: EnemySnapshot[];
  /** 選択中カードの種別（配置可能マスのハイライト用）。null = 未選択 */
  placingType: 'tower' | 'trap' | null;
  /** 選択中タワーカードの射程（オーバーレイ用）。未選択/非タワーは undefined */
  placingRange?: number;
  /** 砦の残ライフ。砦セルに表示する */
  life?: number;
  onCellClick: (pos: CellPos) => void;
}

export const BoardGrid: React.FC<Props> = ({
  board,
  enemies,
  placingType,
  placingRange,
  life,
  onCellClick,
}) => {
  const { width, height } = board.map;
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
      const pos = { x, y };
      const cell = describeCell(board, pos, life);
      const placeable =
        (placingType === 'tower' && canPlaceTower(board, pos)) ||
        (placingType === 'trap' && canPlaceTrap(board, pos));
      cells.push(
        <Cell
          key={`${x}-${y}`}
          $bg={backgroundOf(cell)}
          $slot={cell.kind === 'slot'}
          $placeable={placeable}
          $covered={coveredKeys.has(`${x}-${y}`)}
          $fortress={cell.isFortress}
          $hasTower={cell.icon !== ''}
          onClick={() => onCellClick(pos)}
          onMouseEnter={() => setHovered(pos)}
          onMouseLeave={() => setHovered(null)}
          aria-label={cell.ariaLabel}
        >
          {cell.label && <CellLabel>{cell.label}</CellLabel>}
          {cell.icon && <CellIcon>{cell.icon}</CellIcon>}
          {cell.arrow && (
            <CellArrow $corner={cell.icon !== ''}>{cell.arrow}</CellArrow>
          )}
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
        <EnemyMarker
          key={e.index}
          enemy={e}
          boardWidth={width}
          boardHeight={height}
          cellsToFortress={remainingPathCells(board.map, e)}
        />
      ))}
    </Wrapper>
  );
};
