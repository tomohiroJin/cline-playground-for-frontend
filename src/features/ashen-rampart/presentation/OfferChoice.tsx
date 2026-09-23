/**
 * 灰燼の城壁 - 獲得の3択（反復7 段階1・設計書 §3.2）
 *
 * **辞退ボタンは出さない。** `declineOffer` は較正で「獲得しない腕」を回すための
 * 遷移で、UI には出さない契約になっている（expedition-state.ts）。
 * 候補が0枚のときは useExpedition が自動で辞退するので、ここへは来ない。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { cardStatsOf } from './card-text';
import { CardGlyph } from './CardGlyph';
import { COLORS } from './theme';

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
`;

const Choices = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
`;

const Choice = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 44px;
  padding: 12px;
  text-align: left;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

export const offerButtonLabel = (cardId: string): string => `${getCardDefinition(cardId).name} を加える`;

export const OfferChoice: React.FC<{ offer: readonly string[]; onChoose: (cardId: string) => void }> = ({
  offer,
  onChoose,
}) => (
  <Panel aria-labelledby="ashen-rampart-offer-heading">
    <h2 id="ashen-rampart-offer-heading">札を1枚選んでデッキに加える</h2>
    <Choices>
      {offer.map((cardId) => {
        const card = getCardDefinition(cardId);
        return (
          <Choice key={cardId} type="button" aria-label={offerButtonLabel(cardId)} onClick={() => onChoose(cardId)}>
            <span>
              <CardGlyph cardId={cardId} /> <strong>{card.name}</strong> コスト{card.cost}
            </span>
            <span>{card.description}</span>
            <span>{cardStatsOf(cardId).join(' ／ ')}</span>
          </Choice>
        );
      })}
    </Choices>
  </Panel>
);
