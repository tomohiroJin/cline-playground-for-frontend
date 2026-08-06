/**
 * 灰燼の城壁 - 手札と資源（下部固定）
 *
 * 手札・マナ・墓地・統合タイマーを1つのグループにまとめ、
 * 同時に走査する枠を減らす（設計書 §9.1）。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { HAND_LIMIT } from '../domain/cards/deck';
import type { CombatState } from '../domain/combat/combat-state';
import { DRAW_INTERVAL_TICKS, PLACE_COOLDOWN_TICKS } from '../domain/combat/combat-state';
import { CardBadge } from './CardBadge';
import { COLORS } from './theme';
import { CardGlyph } from './CardGlyph';
import { cardBadgesOf, cardStatsOf, toSeconds } from './card-text';
import { getUnitVisual, roleLabelOf } from './unit-visual';

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

const Marker = styled.div<{ $ratio: number; $color: string; $warning?: boolean }>`
  position: absolute;
  top: -2px;
  left: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  width: ${({ $warning }) => ($warning ? '6px' : '3px')};
  height: 10px;
  background: ${({ $warning, $color }) => ($warning ? COLORS.danger : $color)};
`;

/**
 * 手札が上限のときの警告文言
 *
 * 色（Marker の危険色）だけに頼らず、文言でも「あふれる」と伝える
 * （.claude/rules/design-ui-ux-principles.md「色だけに依存しない情報伝達」）。
 */
const OverflowWarning = styled.span`
  /* COLORS.danger は背景とのコントラスト比が低くテキストに使えない（theme.ts 参照）。
     文字色には dangerText を使う */
  color: ${COLORS.dangerText};
`;

const Cards = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Card = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 112px;
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

const CardHead = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatRow = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11px;
  opacity: 0.85;
`;

const CardSlot = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 2px;
`;

/**
 * 魔力炉専用のクールダウンゲージ
 *
 * クールダウンは魔力炉だけに課されるため、ゲージも魔力炉の札にだけ出す。
 * 他の札は常に置けるので、ゲージを出すとかえって誤解を招く。
 */
const CooldownBar = styled.div<{ $ratio: number }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 3px;
  background: ${COLORS.grid};

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
    background: ${COLORS.opportunity};
  }
`;

/**
 * 捨札ボタン
 *
 * Card は disabled={!affordable} のため、内側に置くと払えない札を捨てられない。
 * 兄弟要素にする（ボタンの入れ子は HTML としても不正）。
 */
const DiscardButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
  cursor: pointer;
`;

const Notice = styled.p`
  margin: 0;
  color: ${COLORS.opportunity};
`;

interface Props {
  state: CombatState;
  selectedIndex: number | null;
  onSelect: (handIndex: number) => void;
  /** 手札から1枚捨てる。マナが足りない札にも到達できる唯一の手段 */
  onDiscard: (handIndex: number) => void;
  /** 溢れて失った札の名前。表示は呼び出し側が一定時間で消す */
  overflowNotice?: string;
}

export const HandArea: React.FC<Props> = ({
  state,
  selectedIndex,
  onSelect,
  onDiscard,
  overflowNotice,
}) => {
  const shortage = state.deck.hand
    .map((id) => getCardDefinition(id).cost - state.mana)
    .filter((diff) => diff > 0);
  const maxShortage = shortage.length > 0 ? Math.max(...shortage) : 0;
  const isHandFull = state.deck.hand.length >= HAND_LIMIT;

  return (
    <Bar>
      <Row>
        <span>マナ {state.mana}</span>
        <span>墓地 {state.deck.graveyard.length}</span>
        <Track>
          <Marker
            $ratio={1 - state.ticksToDraw / DRAW_INTERVAL_TICKS}
            $color={COLORS.secondary}
            $warning={isHandFull}
            aria-label={
              isHandFull
                ? `手札がいっぱいです。次のドローまで ${toSeconds(state.ticksToDraw)}秒。このままだとあふれてライフを1失います`
                : `次のドローまで ${toSeconds(state.ticksToDraw)}秒`
            }
          />
        </Track>
        {isHandFull && <OverflowWarning>手札がいっぱいです。このままだとあふれてライフを失います</OverflowWarning>}
      </Row>
      {overflowNotice && <Notice>{overflowNotice} を手札に持てず失いました</Notice>}
      {maxShortage > 0 && <p>マナが{maxShortage}足りません</p>}
      <Cards role="group" aria-label="手札">
        {state.deck.hand.map((cardId, index) => {
          const card = getCardDefinition(cardId);
          const affordable = card.cost <= state.mana;
          const roleLabel = roleLabelOf(getUnitVisual(cardId).role);
          // 魔力炉・徴発は役割名とカード名が同じ文字列になる（例:「魔力炉」）。
          // その場合まで前置すると「魔力炉 魔力炉」と同じ語を2回読み上げてしまうため省く。
          const cardLabel = roleLabel === card.name ? card.name : `${roleLabel} ${card.name}`;
          return (
            <CardSlot key={`${cardId}-${index}`}>
              <Card
                type="button"
                $selected={selectedIndex === index}
                aria-pressed={selectedIndex === index}
                aria-label={`${cardLabel} コスト${card.cost}`}
                disabled={!affordable}
                onClick={() => onSelect(index)}
              >
                <CardHead>
                  <CardGlyph cardId={cardId} />
                  {card.name}
                </CardHead>
                <StatRow>
                  <span>コスト{card.cost}</span>
                  {cardStatsOf(cardId).map((stat) => (
                    <span key={stat}>{stat}</span>
                  ))}
                  {cardBadgesOf(cardId).map((badge) => (
                    <CardBadge key={badge}>{badge}</CardBadge>
                  ))}
                </StatRow>
              </Card>
              <DiscardButton
                type="button"
                aria-label={`${card.name}を捨てる`}
                onClick={() => onDiscard(index)}
              >
                ×
              </DiscardButton>
              {card.type === 'reactor' && (
                <CooldownBar
                  $ratio={1 - state.placeCooldown / PLACE_COOLDOWN_TICKS}
                  aria-label={`次に置けるまで ${toSeconds(state.placeCooldown)}秒`}
                />
              )}
            </CardSlot>
          );
        })}
      </Cards>
    </Bar>
  );
};
