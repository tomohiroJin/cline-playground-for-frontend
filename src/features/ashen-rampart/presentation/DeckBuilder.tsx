/**
 * 灰燼の城壁 - デッキ構築（ブリーフィング）
 *
 * 構築で選べる13種（徴発は反復6で retired になり選べない）から12枚ちょうど、
 * 同名3枚まで。検証はドメインの validateDeck に委ね、
 * UI は結果を表示するだけにする（UI 側でだけ検証すると
 * 「テストは通るが UI で組めないデッキ」が生まれる）。
 *
 * **一覧に出すのは `BUILDABLE_CARD_IDS` に限る**（反復6 最終レビュー指摘 I6）。
 * `CARD_IDS`（retired も含む全種）を出すと、構築で選べないはずの徴発が
 * 一覧に表示され追加ボタンも押せてしまい、「開始」を押すまで理由が
 * 分からない体験になる。validateDeck が retired を弾くのは多層防御の
 * 内側であり、外側（UI で隠す）が実装されていて初めて機能する。
 *
 * 各カードに「効かない相手」を出すのは、読む量が多い画面で
 * 「何のために積むか」の手がかりを与えるため（設計書 §6.1）。
 *
 * 1行分の表示は DeckCardRow へ、シード欄は SeedField へ分割した
 * （反復7 段階1・反復1 から持ち越した「行数」minor の5回目）。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { BUILDABLE_CARD_IDS, DECK_SIZE, PRESET_DECKS } from '../domain/cards/card-pool';
import { countByCard, costCurve, validateDeck } from '../domain/cards/deck-builder';
import { DeckCardRow, Controls, StepButton } from './DeckCardRow';
import { SeedField } from './SeedField';
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
  /** 直前の遠征で実際に使ったシード。欄には入れず、明示操作でだけ入れる */
  lastSeed?: number;
}

export const DeckBuilder: React.FC<Props> = ({ onStart, initialCards, lastSeed }) => {
  const [cards, setCards] = useState<string[]>(() => (initialCards ? [...initialCards] : []));
  const [seedText, setSeedText] = useState('');

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
        {BUILDABLE_CARD_IDS.map((id) => (
          <DeckCardRow
            key={id}
            cardId={id}
            count={counts.get(id) ?? 0}
            onAdd={() => add(id)}
            onRemove={() => remove(id)}
          />
        ))}
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
        <SeedField value={seedText} onChange={setSeedText} lastSeed={lastSeed} />
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
