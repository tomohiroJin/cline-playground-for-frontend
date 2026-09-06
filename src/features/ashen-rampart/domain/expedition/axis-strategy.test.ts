import { PLAINS_MAP } from '../board/stage-map';
import { createCombatState } from '../combat/combat-state';
import { createDeck } from '../cards/deck';
import { axesOf } from './stage-definition';
import { withoutAxisStrategy } from './axis-strategy';

describe('withoutAxisStrategy（指定した軸を持つ札を置かない戦略）', () => {
  it('block を落とした戦略は、block を持つ札を一度も置かない', () => {
    // 石壁を多く含むデッキ。block 軸を持つ札が確実に手札へ来る
    const cards = [
      'stone-wall', 'stone-wall', 'stone-wall',
      'reactor', 'reactor', 'reactor',
      'arrow-tower', 'arrow-tower', 'arrow-tower',
      'ballista', 'ballista', 'ballista',
    ];
    const deck = createDeck(cards, () => 0.5);
    const state = createCombatState(deck, []);
    const strategy = withoutAxisStrategy('block');

    // 手札のどの札を選んでも、block を持つ札の play アクションは出ない
    const actions = strategy(state, PLAINS_MAP);
    const played = actions.filter((a) => a.kind === 'play-card');
    played.forEach((a) => {
      if (a.kind !== 'play-card') return;
      const cardId = state.deck.hand[a.handIndex];
      expect(cardId).toBeDefined();
      expect(axesOf(cardId as string)).not.toContain('block');
    });
  });

  it('魔力炉は どの軸を落としても許可される（軸を1つも持たないため）', () => {
    // 魔力炉を止めるとマナ不足で自明に負け、「軸が要るか」ではなく
    // 「マナが足りるか」を測ってしまう（noPureGroundAttackStrategy と同じ理由）
    expect(axesOf('reactor')).toEqual([]);
  });

  it('4つの軸すべてについて戦略を作れる', () => {
    (['block', 'anti-air', 'mass-answer', 'heavy-hit'] as const).forEach((axis) => {
      expect(typeof withoutAxisStrategy(axis)).toBe('function');
    });
  });
});
