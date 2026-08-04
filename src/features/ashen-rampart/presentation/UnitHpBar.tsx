/**
 * 灰燼の城壁 - 守り手のHPバー
 *
 * S1 の教訓（相対スケールは敵ごとに基準が変わって読めない）を踏まえ、
 * 幅は EnemyMarker と同じ getHpBarWidthPct（盤面に登場する最大HP=60を
 * 基準にした絶対スケール）を流用する。石壁（HP60）と敵の見え方の基準を
 * 分けないことで、守り手側だけ別の尺度を新設せずに済む。
 *
 * z 順序: セル(0) < エフェクト(1) < 守り手のHPバー(2) < 敵マーカー(3)。
 * エフェクト（BoardEffectLayer, z-index:1）がHPバーを覆わないよう、
 * これより高い z-index を持たせる。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlacedUnit } from '../domain/combat/combat-state';
import { getCardDefinition } from '../domain/cards/card-pool';
import { getHpBarWidthPct, HP_BAR_COLOR } from './enemy-visual';
import { COLORS } from './theme';

const Track = styled.div<{ $left: number; $top: number; $widthPct: number }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  width: ${({ $widthPct }) => $widthPct}cqw;
  height: 3px;
  transform: translate(-50%, -50%);
  background: ${COLORS.grid};
  z-index: 2;
  pointer-events: none;
`;

const Fill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  background: ${HP_BAR_COLOR};
`;

interface Props {
  unit: PlacedUnit;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
}

export const UnitHpBar: React.FC<Props> = ({ unit, columns, rows }) => (
  <Track
    data-testid={`unit-hp-${unit.pos.x}-${unit.pos.y}`}
    role="progressbar"
    aria-valuenow={unit.hp}
    aria-valuemin={0}
    aria-valuemax={unit.maxHp}
    aria-label={`${getCardDefinition(unit.cardId).name} の耐久`}
    $left={((unit.pos.x + 0.5) / columns) * 100}
    // セル中央より少し下へ寄せ、占有アイコン（塔・篝等のテキスト）と
    // 完全には重ねない
    $top={((unit.pos.y + 0.78) / rows) * 100}
    $widthPct={getHpBarWidthPct(unit.maxHp)}
  >
    <Fill $ratio={unit.maxHp === 0 ? 0 : unit.hp / unit.maxHp} />
  </Track>
);
