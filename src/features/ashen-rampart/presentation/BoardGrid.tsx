/**
 * 灰燼の城壁 - 盤面
 *
 * 経路（2レーン）・地形・設置物・敵を1つの視覚野にまとめる。
 * カード選択中は「置けるマスだけ」を琥珀でハイライトし、選択空間を
 * 60通りから数個に落とす（設計書 §9.7）。
 *
 * z 順序: セル(0・非配置) < エフェクト(1) < 守り手のHPバー(2) < 敵マーカー(3)。
 * 敵マーカーの HP バーをエフェクトが覆ってはならない（反復2）のと同じ理由で、
 * 守り手の HP バーもエフェクトの下に隠れてはならない（反復3）。
 */
import React from 'react';
import styled from 'styled-components';
import type { CellPos, PathDirection, StageMap } from '../domain/board/stage-map';
import { isHighGround, isSlowCell, isPathCell, laneOf, pathDirectionAt } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { stackEnemies } from './enemy-stack';
import { EnemyMarker } from './EnemyMarker';
import { UnitHpBar } from './UnitHpBar';
import { BoardEffectLayer } from './BoardEffectLayer';
import type { Effect } from './combat-effects';
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
  /* EnemyMarker・守り手HPバーが cqw 単位で盤面幅に追従できるようにコンテナ化する
     （設計書 §9.7 最小対応幅 360px でも符号の比率が崩れない） */
  container-type: inline-size;
`;

const Cell = styled.button<{ $kind: string; $highlighted: boolean }>`
  position: relative;
  border: 1px solid ${COLORS.grid};
  background: ${({ $kind }) => ($kind === 'path' ? '#2a2320' : '#211c19')};
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

/**
 * レーンの識別印（経路セルの左上に置く）
 *
 * data-lane 属性だけでは目に見えないため、レーンごとに形を変えて
 * グレースケールでも判別できるようにする（enemy-visual.ts と同じ方針。
 * 色だけに情報を載せない）。新しい色は増やさず、既存の secondary を使う。
 */
const LaneMark = styled.span<{ $shape: 'circle' | 'square' }>`
  position: absolute;
  top: 2px;
  left: 2px;
  width: 5px;
  height: 5px;
  background: ${COLORS.secondary};
  opacity: 0.6;
  border-radius: ${({ $shape }) => ($shape === 'circle' ? '50%' : '1px')};
  pointer-events: none;
`;

/** 経路の進行方向（レーンごとに算出）。ラベル・占有アイコンと排他にしない */
const CellArrow = styled.span`
  position: absolute;
  right: 2px;
  bottom: 1px;
  font-size: 10px;
  color: ${COLORS.secondary};
  opacity: 0.7;
  pointer-events: none;
`;

const ARROW_GLYPH: Record<PathDirection, string> = {
  right: '→',
  left: '←',
  up: '↑',
  down: '↓',
};

interface Props {
  map: StageMap;
  state: CombatState;
  /** 配置可能なマス（カード選択中のみ非空） */
  placeableCells: readonly CellPos[];
  effects: readonly Effect[];
  onCellClick: (pos: CellPos) => void;
}

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** セル座標("x,y") → 所属レーン番号。砦は全レーン共通のため先に見つかった方を採る */
const buildLaneIndexByCell = (map: StageMap): Map<string, number> => {
  const result = new Map<string, number>();
  map.lanes.forEach((lane, laneIndex) => {
    lane.forEach((c) => {
      const key = `${c.x},${c.y}`;
      if (!result.has(key)) result.set(key, laneIndex);
    });
  });
  return result;
};

export const BoardGrid: React.FC<Props> = ({
  map,
  state,
  placeableCells,
  effects,
  onCellClick,
}) => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) cells.push({ x, y });
  }
  // 敵は自身の laneIndex を持つため、map をそのまま渡してレーンごとに座標を解決させる
  const stacks = stackEnemies(state.enemies, map);
  const laneIndexByCell = buildLaneIndexByCell(map);

  const occupantLabel = (pos: CellPos): { text: string; ready: boolean } | undefined => {
    const unit = state.units.find((u) => samePos(u.pos, pos));
    if (unit) return { text: unit.cardId === 'beacon' ? '篝' : '塔', ready: false };
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
        const isPath = isPathCell(map, pos);
        const laneIndex = laneIndexByCell.get(`${pos.x},${pos.y}`);
        const direction =
          laneIndex !== undefined ? pathDirectionAt(laneOf(map, laneIndex), pos) : undefined;
        const highlighted = placeableCells.some((c) => samePos(c, pos));
        const occupant = occupantLabel(pos);
        const terrain = isHighGround(map, pos) ? '高台' : isSlowCell(map, pos) ? '滞留' : '';
        const label = [
          `${pos.x},${pos.y}`,
          isPath ? '経路' : '設置可',
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
            data-testid={`cell-${pos.x}-${pos.y}`}
            data-path={isPath ? 'true' : 'false'}
            data-lane={laneIndex}
            $kind={isPath ? 'path' : 'slot'}
            $highlighted={highlighted}
            aria-label={label}
            onClick={() => onCellClick(pos)}
          >
            {occupant && <Occupant $ready={occupant.ready}>{occupant.text}</Occupant>}
            {laneIndex !== undefined && (
              <LaneMark aria-hidden="true" $shape={laneIndex % 2 === 0 ? 'circle' : 'square'} />
            )}
            {direction && <CellArrow aria-hidden="true">{ARROW_GLYPH[direction]}</CellArrow>}
          </Cell>
        );
      })}
      <BoardEffectLayer effects={effects} map={map} />
      {state.units.map((unit) => (
        <UnitHpBar
          key={`${unit.pos.x},${unit.pos.y}`}
          unit={unit}
          columns={map.width}
          rows={map.height}
        />
      ))}
      {stacks.map((stack) => (
        <EnemyMarker key={stack.id} stack={stack} columns={map.width} rows={map.height} />
      ))}
    </Frame>
  );
};
