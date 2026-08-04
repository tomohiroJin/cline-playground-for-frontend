/**
 * 灰燼の城壁 - 盤面
 *
 * 経路（2レーン）・地形・設置物・敵を1つの視覚野にまとめる。
 * カード選択中は「置けるマスだけ」を琥珀でハイライトし、選択空間を
 * 60通りから数個に落とす（設計書 §9.7）。
 *
 * z 順序: セル(0) < 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
 * 台座は BoardEffectLayer より前に置き、攻撃エフェクトが台座の上に乗る
 * ようにする。状態バーは反復2・3 と同じ理由で BoardEffectLayer より後に置き、
 * エフェクトが状態バーを覆わないようにする。
 */
import React from 'react';
import styled from 'styled-components';
import type { CellPos, PathDirection, StageMap } from '../domain/board/stage-map';
import { isHighGround, isSlowCell, isPathCell, laneOf, pathDirectionAt } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import { stackEnemies } from './enemy-stack';
import { EnemyMarker } from './EnemyMarker';
import { buildPlates, plateKeyOf } from './board-plates';
import { UnitPlate } from './UnitPlate';
import { PlacedStatusBar } from './PlacedStatusBar';
import { roleLabelOf } from './unit-visual';
import { BoardEffectLayer } from './BoardEffectLayer';
import type { Effect } from './combat-effects';
import { COLORS } from './theme';

/**
 * 設置済みセルに常時描く印の上限（台座・文字・状態バー）
 *
 * 反復2 の MAX_CONCURRENT_EFFECTS と同じ考え方。情報を足すほど盤面は
 * 読めなくなるため、上限を定数で持ち、テストで機械的に守る（設計書 §4.6）。
 */
export const MAX_CELL_MARKS = 3;

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
  /* EnemyMarker・台座・状態バーが cqw 単位で盤面幅に追従できるようにコンテナ化する
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
      const key = plateKeyOf(c);
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
  const plates = buildPlates(state);
  const plateByCell = new Map(plates.map((plate) => [plate.key, plate]));

  return (
    <Frame $columns={map.width} $rows={map.height}>
      {cells.map((pos) => {
        const isPath = isPathCell(map, pos);
        const laneIndex = laneIndexByCell.get(plateKeyOf(pos));
        const direction =
          laneIndex !== undefined ? pathDirectionAt(laneOf(map, laneIndex), pos) : undefined;
        const highlighted = placeableCells.some((c) => samePos(c, pos));
        const plate = plateByCell.get(plateKeyOf(pos));
        const terrain = isHighGround(map, pos) ? '高台' : isSlowCell(map, pos) ? '滞留' : '';
        const occupantText = plate
          ? `${roleLabelOf(plate.visual.role)} ${plate.visual.name}`
          : undefined;
        const label = [
          `${pos.x},${pos.y}`,
          isPath ? '経路' : '設置可',
          terrain,
          occupantText,
          highlighted ? 'ここに置ける' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <Cell
            key={plateKeyOf(pos)}
            type="button"
            data-testid={`cell-${pos.x}-${pos.y}`}
            data-path={isPath ? 'true' : 'false'}
            data-lane={laneIndex}
            $kind={isPath ? 'path' : 'slot'}
            $highlighted={highlighted}
            aria-label={label}
            onClick={() => onCellClick(pos)}
          >
            {/* 設置物が乗ったマスではレーン印と矢印を隠す。配置時点で判断済みの
                情報であり、上限3を守るために優先度が最も低い（設計書 §4.6） */}
            {!plate && laneIndex !== undefined && (
              <LaneMark data-mark="lane" aria-hidden="true" $shape={laneIndex % 2 === 0 ? 'circle' : 'square'} />
            )}
            {!plate && direction && (
              <CellArrow data-mark="arrow" aria-hidden="true">{ARROW_GLYPH[direction]}</CellArrow>
            )}
          </Cell>
        );
      })}
      {plates.map((plate) => (
        <UnitPlate key={plate.key} plate={plate} columns={map.width} rows={map.height} />
      ))}
      <BoardEffectLayer effects={effects} map={map} />
      {plates.map((plate) => (
        <PlacedStatusBar key={plate.key} plate={plate} columns={map.width} rows={map.height} />
      ))}
      {stacks.map((stack) => (
        <EnemyMarker key={stack.id} stack={stack} columns={map.width} rows={map.height} />
      ))}
    </Frame>
  );
};
