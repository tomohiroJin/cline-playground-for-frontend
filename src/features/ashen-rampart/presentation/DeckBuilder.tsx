/**
 * 灰燼の城壁 - デッキ構築（ブリーフィング）
 *
 * 14種から20枚ちょうど、同名3枚まで。検証はドメインの validateDeck に委ね、
 * UI は結果を表示するだけにする（UI 側でだけ検証すると
 * 「テストは通るが UI で組めないデッキ」が生まれる）。
 *
 * 各カードに「効かない相手」を出すのは、読む量が多い画面で
 * 「何のために積むか」の手がかりを与えるため（設計書 §6.1）。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import {
  CARD_IDS,
  DECK_SIZE,
  PRESET_DECKS,
  getCardDefinition,
  maxCopiesOf,
} from '../domain/cards/card-pool';
import { countByCard, costCurve, validateDeck } from '../domain/cards/deck-builder';
import { weaknessTextOf, towerStatsTextOf } from './card-text';
import { COLORS } from './theme';
import { HEADER_CLEARANCE } from './layout-constants';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  padding-top: ${HEADER_CLEARANCE};
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  min-height: 70vh;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
`;

const CardRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepButton = styled.button`
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

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  position: sticky;
  bottom: 0;
  padding: 12px 0;
  background: ${COLORS.dominant};
  border-top: 1px solid ${COLORS.grid};
`;

const StartButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: ${COLORS.opportunity};
  color: ${COLORS.dominant};
  border: none;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Errors = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: ${COLORS.dangerText};
  font-size: 12px;
`;

const CurveList = styled.ul`
  display: flex;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
`;

interface Props {
  onStart: (cards: string[], seed?: number) => void;
  /** 直前に組んだデッキ（再挑戦時に空から組み直させない。指摘4） */
  initialCards?: readonly string[];
  /** 直前に入力したシード文字列 */
  initialSeedText?: string;
}

export const DeckBuilder: React.FC<Props> = ({ onStart, initialCards, initialSeedText }) => {
  const [cards, setCards] = useState<string[]>(() => (initialCards ? [...initialCards] : []));
  const [seedText, setSeedText] = useState(initialSeedText ?? '');

  const counts = countByCard(cards);
  const validation = validateDeck(cards);
  const curve = costCurve(cards);

  const add = (id: string) => setCards((current) => [...current, id]);
  const remove = (id: string) =>
    setCards((current) => {
      const index = current.lastIndexOf(id);
      return index < 0 ? current : current.filter((_, i) => i !== index);
    });

  const start = () => {
    const parsed = Number.parseInt(seedText, 10);
    onStart(cards, Number.isNaN(parsed) ? undefined : parsed);
  };

  return (
    <Layout data-testid="ashen-rampart-deckbuilder-layout" data-header-clearance={HEADER_CLEARANCE}>
      <h2>デッキを組む</h2>
      <Controls>
        {Object.values(PRESET_DECKS).map((preset) => (
          <StepButton key={preset.id} type="button" onClick={() => setCards([...preset.cards])}>
            {preset.name} を読み込む
          </StepButton>
        ))}
      </Controls>

      <Cards>
        {CARD_IDS.map((id) => {
          const card = getCardDefinition(id);
          const count = counts.get(id) ?? 0;
          return (
            <CardRow key={id} role="group" aria-label={`${card.name} コスト${card.cost}`}>
              <strong>
                {card.name}（コスト{card.cost}）
              </strong>
              <span>{card.description}</span>
              {towerStatsTextOf(id) && <Stats>{towerStatsTextOf(id)}</Stats>}
              <Weakness>{weaknessTextOf(id)}</Weakness>
              <Controls>
                <StepButton
                  type="button"
                  aria-label={`${card.name} を1枚減らす`}
                  disabled={count === 0}
                  onClick={() => remove(id)}
                >
                  −
                </StepButton>
                <span>{count}</span>
                <StepButton
                  type="button"
                  aria-label={`${card.name} を1枚増やす`}
                  disabled={count >= maxCopiesOf(id)}
                  onClick={() => add(id)}
                >
                  ＋
                </StepButton>
              </Controls>
            </CardRow>
          );
        })}
      </Cards>

      <Footer>
        <strong>
          {cards.length} / {DECK_SIZE}
        </strong>
        <CurveList aria-label="コスト曲線">
          {[...curve.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([cost, n]) => (
              <li key={cost}>
                コスト{cost}: {n}枚
              </li>
            ))}
        </CurveList>
        <label htmlFor="ashen-rampart-seed">シード（空欄なら毎回ランダム）</label>
        <input
          id="ashen-rampart-seed"
          value={seedText}
          inputMode="numeric"
          onChange={(e) => setSeedText(e.target.value)}
        />
        <StartButton type="button" disabled={!validation.isValid} onClick={start}>
          この構成で始める
        </StartButton>
      </Footer>

      {validation.errors.length > 0 && (
        <Errors>
          {validation.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </Errors>
      )}
    </Layout>
  );
};
