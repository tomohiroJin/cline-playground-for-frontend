/**
 * 灰燼の城壁 - 獲得の3択（反復7 段階1・設計書 §3.2）
 *
 * **辞退ボタンは出さない。** `declineOffer` は較正で「獲得しない腕」を回すための
 * 遷移で、UI には出さない契約になっている（expedition-state.ts）。
 * 候補が0枚のときは useExpedition が自動で辞退するので、ここへは来ない。
 */
import React, { useState } from 'react';
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
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const offerButtonLabel = (cardId: string): string => `${getCardDefinition(cardId).name} を加える`;

export const OfferChoice: React.FC<{ offer: readonly string[]; onChoose: (cardId: string) => void }> = ({
  offer,
  onChoose,
}) => {
  // 1枚選んだ後は全ボタンを無効にする（PR #211 Fix A）。二重クリックで
  // acquire が再描画前に2回呼ばれると card_acquired の記録・chooseAcquisition が
  // 二重に走るため、LevyChoice と同じ考え方でUI側からも二重送信の経路を断つ
  const [isChosen, setIsChosen] = useState(false);

  return (
    <Panel aria-labelledby="ashen-rampart-offer-heading">
      <h2 id="ashen-rampart-offer-heading">札を1枚選んでデッキに加える</h2>
      <Choices>
        {offer.map((cardId) => {
          const card = getCardDefinition(cardId);
          return (
            <Choice
              key={cardId}
              type="button"
              aria-label={offerButtonLabel(cardId)}
              disabled={isChosen}
              onClick={() => {
                setIsChosen(true);
                onChoose(cardId);
              }}
            >
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
};
