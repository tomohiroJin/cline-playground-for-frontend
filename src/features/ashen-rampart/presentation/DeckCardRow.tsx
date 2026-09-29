/**
 * 灰燼の城壁 - 構築画面の1行（反復7 段階1 で DeckBuilder から分割）
 *
 * DeckBuilder が284行あり、反復1 から「行数」を minor として持ち越していた（5回目）。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition, maxCopiesOf } from '../domain/cards/card-pool';
import { cardBadgesOf, weaknessTextOf, towerStatsTextOf } from './card-text';
import { CardBadge } from './CardBadge';
import { CardGlyph } from './CardGlyph';
import { getUnitVisual, roleLabelOf } from './unit-visual';
import { COLORS } from './theme';

const CardRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const RowHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RoleTag = styled.span`
  font-size: 11px;
  opacity: 0.75;
`;

/**
 * 札の値段（設計書 §6.1「形アイコン・名前・コストは削らない。」）
 *
 * 下部の「コスト曲線」は既にデッキへ入れた札の分布であり、
 * いま検討している札の値段は読めない。行そのものに出す必要がある。
 * 読み上げラベル（CardRow の aria-label）にしか無い状態は、目で読む
 * プレイヤーにとって「消えている」のと同じ。
 */
const Cost = styled.span`
  font-size: 12px;
  opacity: 0.9;
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StepButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Weakness = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${COLORS.opportunity};
`;

/**
 * 守り手のHP・攻撃力の表示（指摘5）
 *
 * HPと攻撃力の逆相関（石壁60/0 → 弓兵8/4）は本反復で「カードが似ている」を
 * 解く唯一の新しい軸だが、盤面のHPバーでしか読めなかった。守り手でないカード
 * （魔力炉・罠・呪文・徴発）には表示しないため、Weakness と同じ色にはせず
 * 控えめな secondary + 低opacityで縁の下の情報として置く。
 */
const Stats = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${COLORS.secondary};
  opacity: 0.75;
`;

export const DeckCardRow: React.FC<{ cardId: string; count: number; onAdd: () => void; onRemove: () => void }> = ({
  cardId,
  count,
  onAdd,
  onRemove,
}) => {
  const card = getCardDefinition(cardId);
  return (
    <CardRow role="group" aria-label={`${card.name} コスト${card.cost}`}>
      <RowHead>
        <CardGlyph cardId={cardId} />
        <strong>{card.name}</strong>
        <Cost>コスト{card.cost}</Cost>
        <RoleTag>{roleLabelOf(getUnitVisual(cardId).role)}</RoleTag>
        {cardBadgesOf(cardId).map((badge) => (
          <CardBadge key={badge}>{badge}</CardBadge>
        ))}
      </RowHead>
      <span>{card.description}</span>
      {towerStatsTextOf(cardId) && <Stats>{towerStatsTextOf(cardId)}</Stats>}
      <Weakness>{weaknessTextOf(cardId)}</Weakness>
      <Controls>
        <StepButton type="button" aria-label={`${card.name} を1枚減らす`} disabled={count === 0} onClick={onRemove}>
          −
        </StepButton>
        <span>{count}</span>
        <StepButton
          type="button"
          aria-label={`${card.name} を1枚増やす`}
          disabled={count >= maxCopiesOf(cardId)}
          onClick={onAdd}
        >
          ＋
        </StepButton>
      </Controls>
    </CardRow>
  );
};
