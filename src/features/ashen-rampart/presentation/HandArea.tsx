/**
 * 灰燼の城壁 - 手札と資源（下部固定）
 *
 * 手札・マナ・墓地・統合タイマーを1つのグループにまとめ、
 * 同時に走査する枠を減らす（設計書 §9.1）。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { CombatState } from '../domain/combat/combat-state';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from '../domain/combat/combat-state';
import { COLORS } from './theme';

const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border-top: 1px solid ${COLORS.grid};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Track = styled.div`
  position: relative;
  flex: 1;
  min-width: 160px;
  height: 6px;
  background: ${COLORS.grid};
`;

const Marker = styled.div<{ $ratio: number; $color: string }>`
  position: absolute;
  top: -2px;
  left: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  width: 3px;
  height: 10px;
  background: ${({ $color }) => $color};
`;

const Cards = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Card = styled.button<{ $selected: boolean }>`
  min-width: 92px;
  min-height: 44px;
  padding: 6px 8px;
  text-align: left;
  background: ${({ $selected }) => ($selected ? COLORS.opportunity : 'transparent')};
  color: ${({ $selected }) => ($selected ? COLORS.dominant : COLORS.secondary)};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Notice = styled.p`
  margin: 0;
  color: ${COLORS.opportunity};
`;

const toSeconds = (ticks: number): number => Math.ceil(ticks / 10);

interface Props {
  state: CombatState;
  selectedIndex: number | null;
  onSelect: (handIndex: number) => void;
  /** 溢れて失った札の名前。表示は呼び出し側が一定時間で消す */
  overflowNotice?: string;
}

export const HandArea: React.FC<Props> = ({
  state,
  selectedIndex,
  onSelect,
  overflowNotice,
}) => {
  const shortage = state.deck.hand
    .map((id) => getCardDefinition(id).cost - state.mana)
    .filter((diff) => diff > 0);
  const maxShortage = shortage.length > 0 ? Math.max(...shortage) : 0;

  return (
    <Bar>
      <Row>
        <span>マナ {state.mana}</span>
        <span>墓地 {state.deck.graveyard.length}</span>
        <Track>
          <Marker
            $ratio={1 - state.placeCooldown / PLACE_COOLDOWN_TICKS}
            $color={COLORS.opportunity}
            aria-label={`次に置けるまで ${toSeconds(state.placeCooldown)}秒`}
          />
          <Marker
            $ratio={1 - state.ticksToDraw / DRAW_INTERVAL_TICKS}
            $color={COLORS.secondary}
            aria-label={`次のドローまで ${toSeconds(state.ticksToDraw)}秒`}
          />
        </Track>
      </Row>
      {overflowNotice && <Notice>{overflowNotice} を手札に持てず失いました</Notice>}
      {maxShortage > 0 && <p>マナが{maxShortage}足りません</p>}
      <Cards role="group" aria-label="手札">
        {state.deck.hand.map((cardId, index) => {
          const card = getCardDefinition(cardId);
          const affordable = card.cost <= state.mana;
          return (
            <Card
              key={`${cardId}-${index}`}
              type="button"
              $selected={selectedIndex === index}
              aria-pressed={selectedIndex === index}
              aria-label={`${card.name} コスト${card.cost}`}
              disabled={!affordable}
              onClick={() => onSelect(index)}
            >
              {card.name}
              <br />
              コスト{card.cost}
            </Card>
          );
        })}
      </Cards>
    </Bar>
  );
};
