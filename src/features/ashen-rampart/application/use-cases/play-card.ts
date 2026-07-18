/**
 * 灰燼の城壁 - ユースケース: カード使用
 *
 * タワー/罠は盤面への永続投資（デッキから除外）、
 * スペルは捨札へ（再循環する）、戦術は永続効果でデッキから除外。
 */
import { getCardDefinition } from '../../domain/cards/card-pool';
import { placeTower, placeTrap } from '../../domain/board/board-state';
import type { CellPos } from '../../domain/board/stage-map';
import type { RunState } from '../../domain/run/run-state';

export const playCard = (
  state: RunState,
  handIndex: number,
  target?: CellPos
): RunState => {
  if (state.phase !== 'preparation') {
    throw new Error('準備フェーズ以外ではカードを使用できません');
  }
  const cardId = state.deck.hand[handIndex];
  if (cardId === undefined) {
    throw new Error(`手札のインデックスが不正です: ${handIndex}`);
  }
  const card = getCardDefinition(cardId);
  if (card.cost > state.mana) {
    throw new Error(`マナが不足しています: 必要${card.cost} / 所持${state.mana}`);
  }

  const hand = state.deck.hand.filter((_, i) => i !== handIndex);
  let mana = state.mana - card.cost;
  let board = state.board;
  let discardPile = state.deck.discardPile;
  let pendingModifiers = state.pendingModifiers;

  switch (card.type) {
    case 'tower': {
      if (!target) throw new Error('タワーには設置先の指定が必要です');
      board = placeTower(board, cardId, target);
      break;
    }
    case 'trap': {
      if (!target) throw new Error('罠には設置先の指定が必要です');
      board = placeTrap(board, cardId, target);
      break;
    }
    case 'spell': {
      const spell = card.spell ?? {};
      mana += spell.gainMana ?? 0;
      pendingModifiers = {
        openingDamage: pendingModifiers.openingDamage + (spell.openingDamage ?? 0),
        speedMultiplier:
          pendingModifiers.speedMultiplier * (spell.speedMultiplier ?? 1),
      };
      discardPile = [...discardPile, cardId];
      break;
    }
    case 'tactic': {
      const tactic = card.tactic ?? {};
      board = {
        ...board,
        towerAttackMultiplier:
          board.towerAttackMultiplier + (tactic.towerAttackBonus ?? 0),
      };
      break;
    }
  }

  return {
    ...state,
    mana,
    board,
    pendingModifiers,
    deck: { ...state.deck, hand, discardPile },
  };
};
