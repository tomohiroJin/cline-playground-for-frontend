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
import { toSeconds } from './card-text';
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

/**
 * 支援塔のオーラが届くマス数（チェビシェフ距離1の 3×3 から自分のセルを除く）
 *
 * 盤面には RangeOverlay が同じ範囲を枠で描く。数字と枠が食い違わないよう
 * 「隣接8マス」という同じ意味をここでも明示する。
 */
const AURA_CELL_COUNT = 8;

/** 役割ごとに出す能力を組み立てる（盤面に出さない詳細はすべてここへ集める） */
const chipsOf = (plate: PlateModel): string[] => {
  const card = getCardDefinition(plate.cardId);
  if (card.tower) {
    const t = card.tower;
    if (t.aura) {
      // 設計書 §5.2 の表は支援塔に「強化内容 / 効果範囲」を求めている。
      // HP は支援塔の判断材料にならない（攻撃されにくい後方に置く札のため）
      const parts: string[] = [];
      if (t.aura.towerDamageBonus) parts.push(`隣接の攻撃力 +${t.aura.towerDamageBonus * 100}%`);
      if (t.aura.towerRangeBonus) parts.push(`隣接の射程 +${t.aura.towerRangeBonus}`);
      return [...parts, `効果範囲 隣接${AURA_CELL_COUNT}マス`];
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
    // 状態バーの分子分母（board-plates.ts）から残りクールダウンを戻す。
    // PlacedEmber そのものは PlateModel に載らないため、ここが唯一の経路。
    const cooldownLeftTicks = plate.statusMax - plate.statusNow;
    return [
      `ダメージ${card.ember.damage}`,
      `半径${card.ember.radius}`,
      `クールダウン${toSeconds(card.ember.cooldownTicks)}秒`,
      // 設計書 §5.2 の優先順位により、再点火できる燠火はタップが再点火に
      // 横取りされてこのパネルが開かない。つまり「クリックで再点火」を
      // 固定で出すと、**それができない時にしか表示されない**嘘になる。
      cooldownLeftTicks > 0 ? `再点火まで${toSeconds(cooldownLeftTicks)}秒` : 'クリックで再点火',
    ];
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
