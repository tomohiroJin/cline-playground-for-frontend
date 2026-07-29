/**
 * 灰燼の城壁 - 盤面
 *
 * 経路・設置スロット・地形・設置物・敵を1つの視覚野にまとめる。
 * カード選択中は「置けるマスだけ」を琥珀でハイライトし、選択空間を
 * 60通りから数個に落とす（設計書 §9.7）。
 */
import React from 'react';
import styled from 'styled-components';
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { isHighGround, isSlowCell } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { stackEnemies } from './enemy-stack';
import { EnemyMarker } from './EnemyMarker';
import { COLORS } from './theme';

const Frame = styled.div<{ $columns: number; $rows: number }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  grid-template-rows: repeat(${({ $rows }) => $rows}, 1fr);
  aspect-ratio: ${({ $columns, $rows }) => `${$columns} / ${$rows}`};
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  background: ${COLORS.dominant};
  border: 1px solid ${COLORS.grid};
`;

const Cell = styled.button<{ $kind: string; $highlighted: boolean }>`
  border: 1px solid ${COLORS.grid};
  background: ${({ $kind }) =>
    $kind === 'path' ? '#2a2320' : $kind === 'slot' ? '#211c19' : 'transparent'};
  outline: ${({ $highlighted }) =>
    $highlighted ? `2px solid ${COLORS.opportunity}` : 'none'};
  outline-offset: -2px;
  cursor: ${({ $highlighted }) => ($highlighted ? 'pointer' : 'default')};
  color: ${COLORS.secondary};
  font-size: 11px;
  padding: 0;
  /* ハイライト中はタッチ対象を 44px 以上に広げる（視覚サイズは変えない） */
  ${({ $highlighted }) =>
    $highlighted
      ? `
    position: relative;
    &::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      width: max(44px, 100%);
      height: max(44px, 100%);
      transform: translate(-50%, -50%);
    }
  `
      : ''}
`;

const Occupant = styled.span<{ $ready: boolean }>`
  color: ${({ $ready }) => ($ready ? COLORS.opportunity : COLORS.secondary)};
  font-weight: ${({ $ready }) => ($ready ? 700 : 400)};
`;

interface Props {
  map: StageMap;
  state: CombatState;
  /** 配置可能なマス（カード選択中のみ非空） */
  placeableCells: readonly CellPos[];
  onCellClick: (pos: CellPos) => void;
}

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

export const BoardGrid: React.FC<Props> = ({ map, state, placeableCells, onCellClick }) => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) cells.push({ x, y });
  }
  const stacks = stackEnemies(state.enemies, map.path);

  const occupantLabel = (pos: CellPos): { text: string; ready: boolean } | undefined => {
    const tower = state.towers.find((t) => samePos(t.pos, pos));
    if (tower) return { text: tower.cardId === 'beacon' ? '篝' : '塔', ready: false };
    const reactor = state.reactors.find((r) => samePos(r.pos, pos));
    if (reactor) return { text: '炉', ready: false };
    const ember = state.embers.find((e) => samePos(e.pos, pos));
    if (ember) return { text: '燠', ready: ember.cooldownLeft === 0 };
    const trap = state.traps.find((t) => samePos(t.pos, pos));
    if (trap) return { text: '罠', ready: false };
    return undefined;
  };

  return (
    <Frame $columns={map.width} $rows={map.height}>
      {cells.map((pos) => {
        const isPath = map.path.some((c) => samePos(c, pos));
        const isSlot = map.buildSlots.some((c) => samePos(c, pos));
        const highlighted = placeableCells.some((c) => samePos(c, pos));
        const occupant = occupantLabel(pos);
        const terrain = isHighGround(map, pos) ? '高台' : isSlowCell(map, pos) ? '滞留' : '';
        const label = [
          `${pos.x},${pos.y}`,
          isPath ? '経路' : isSlot ? '設置可' : '',
          terrain,
          occupant?.text,
          highlighted ? 'ここに置ける' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <Cell
            key={`${pos.x},${pos.y}`}
            type="button"
            $kind={isPath ? 'path' : isSlot ? 'slot' : 'empty'}
            $highlighted={highlighted}
            aria-label={label}
            onClick={() => onCellClick(pos)}
          >
            {occupant && <Occupant $ready={occupant.ready}>{occupant.text}</Occupant>}
          </Cell>
        );
      })}
      {stacks.map((stack) => (
        <EnemyMarker
          key={stack.id}
          stack={stack}
          columns={map.width}
          rows={map.height}
          boardWidth={720}
        />
      ))}
    </Frame>
  );
};
