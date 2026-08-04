/**
 * 灰燼の城壁 - 能力チップ（盤面外）
 *
 * 盤面に数値を並べると煩雑になるため、要求時の詳細は盤面の外に出す
 * （設計書 §5.2）。盤面には射程リングだけが出る。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { getCardDefinition } from '../domain/cards/card-pool';
import { roleLabelOf } from './unit-visual';
import { COLORS } from './theme';

const Panel = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const Chip = styled.span`
  font-size: 11px;
  opacity: 0.9;
`;

const TICKS_PER_SECOND = 10;
const toSeconds = (ticks: number): number => Math.ceil(ticks / TICKS_PER_SECOND);

/** 役割ごとに出す能力を組み立てる（盤面に出さない詳細はすべてここへ集める） */
const chipsOf = (plate: PlateModel): string[] => {
  const card = getCardDefinition(plate.cardId);
  if (card.tower) {
    const t = card.tower;
    if (t.aura) {
      const parts: string[] = [];
      if (t.aura.towerDamageBonus) parts.push(`隣接の攻撃力 +${t.aura.towerDamageBonus * 100}%`);
      if (t.aura.towerRangeBonus) parts.push(`隣接の射程 +${t.aura.towerRangeBonus}`);
      return [...parts, `HP${t.hp}`];
    }
    if (t.damage === 0) return [`HP${t.hp}`, '攻撃しない'];
    return [
      `攻撃${t.damage}`,
      `射程${t.range}`,
      `間隔${toSeconds(t.cooldownTicks)}秒`,
      t.hitsFlying ? '飛行に当たる' : '飛行に当たらない',
      t.piercing ? '貫通' : t.splashRadius > 0 ? `範囲${t.splashRadius}` : '単体',
    ];
  }
  if (card.trap) {
    return [
      `ダメージ${card.trap.damage}`,
      `残り${plate.statusNow}回`,
      ...(card.trap.groundedTicks ? [`${toSeconds(card.trap.groundedTicks)}秒 地上化`] : []),
    ];
  }
  if (card.reactor) {
    return [`マナ+${card.reactor.manaPerTick}`, `${toSeconds(card.reactor.intervalTicks)}秒ごと`];
  }
  if (card.ember) {
    return [`ダメージ${card.ember.damage}`, `半径${card.ember.radius}`, 'クリックで再点火'];
  }
  return [];
};

interface Props {
  plate: PlateModel;
}

export const InspectPanel: React.FC<Props> = ({ plate }) => (
  <Panel data-testid="inspect-panel" role="status">
    <strong>
      {roleLabelOf(plate.visual.role)} {plate.visual.name}
    </strong>
    {chipsOf(plate).map((chip) => (
      <Chip key={chip}>{chip}</Chip>
    ))}
  </Panel>
);
