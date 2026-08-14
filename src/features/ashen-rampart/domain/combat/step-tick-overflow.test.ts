/**
 * 溢れのライフ対価（反復5・設計書 §5）
 *
 * 「抱える」と「出す」の両方に痛みを置くための中核。
 * マナ源には一切触らないので、ここが原因で詰むことはない。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck, HAND_LIMIT } from '../cards/deck';
import { createCombatState, LIFE_INITIAL, DRAW_INTERVAL_TICKS, type CombatState } from './combat-state';
import { stepTick } from './step-tick';

/** 手札を上限まで埋め、次の tick でドローが起きる状態を作る */
const stateWithFullHand = (drawPile: readonly string[]): CombatState => {
  const base = createCombatState(createDeck([], () => 0), []);
  return {
    ...base,
    ticksToDraw: 1,
    deck: {
      hand: Array.from({ length: HAND_LIMIT }, () => 'arrow-tower'),
      drawPile: [...drawPile],
      graveyard: [],
    },
  };
};

describe('溢れのライフ対価', () => {
  it('溢れ1枚につきライフを1点失う', () => {
    const next = stepTick(stateWithFullHand(['ballista']), [], PLAINS_MAP);
    expect(next.events).toContainEqual({ kind: 'overflow', cardId: 'ballista' });
    expect(next.life).toBe(LIFE_INITIAL - 1);
  });

  it('溢れなければライフは減らない', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      ticksToDraw: 1,
      deck: { hand: ['arrow-tower'], drawPile: ['ballista'], graveyard: [] },
    };
    const next = stepTick(state, [], PLAINS_MAP);
    expect(next.events).toContainEqual({ kind: 'draw', cardId: 'ballista' });
    expect(next.life).toBe(LIFE_INITIAL);
  });

  it('溢れでライフが0以下になればラン敗北になる', () => {
    const state: CombatState = { ...stateWithFullHand(['ballista']), life: 1 };
    const next = stepTick(state, [], PLAINS_MAP);
    expect(next.life).toBe(0);
    expect(next.outcome).toBe('lost');
  });

  it('手動で捨てても対価はない', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      // ドローが起きない tick にして、捨札だけを見る
      ticksToDraw: DRAW_INTERVAL_TICKS,
      deck: { hand: ['arrow-tower', 'ballista'], drawPile: [], graveyard: [] },
    };
    const next = stepTick(state, [{ kind: 'discard', handIndex: 0 }], PLAINS_MAP);
    expect(next.deck.hand).toEqual(['ballista']);
    expect(next.life).toBe(LIFE_INITIAL);
  });

  it('徴発で選んだ札が手札上限で入らなければ、溢れとして対価を払う', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      ticksToDraw: DRAW_INTERVAL_TICKS,
      levyOptions: ['catapult', 'ballista', 'forge'],
      deck: {
        hand: Array.from({ length: HAND_LIMIT }, () => 'arrow-tower'),
        drawPile: [],
        graveyard: [],
      },
    };
    const next = stepTick(state, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(next.events).toContainEqual({ kind: 'overflow', cardId: 'catapult' });
    // 選ばなかった2枚は徴発そのものの代償であって溢れではない。1点だけ
    expect(next.life).toBe(LIFE_INITIAL - 1);
  });

  it('徴発で選んだ札が手札に入るなら対価はない', () => {
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      ticksToDraw: DRAW_INTERVAL_TICKS,
      levyOptions: ['catapult', 'ballista', 'forge'],
      deck: { hand: ['arrow-tower'], drawPile: [], graveyard: [] },
    };
    const next = stepTick(state, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(next.deck.hand).toContain('catapult');
    expect(next.life).toBe(LIFE_INITIAL);
  });
});
