/**
 * 徴発のテスト
 *
 * 選択中もゲームは止まらない（止めると一時停止でマナを稼げる抜け道になる）。
 * 徴発自身が手札から墓地へ移るため、選んだ札は必ず手札に入る。
 */
import { createCombatState } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const noWave: WaveDefinition[] = [{ startTick: 99999, entries: [] }];

const stateWith = (hand: string[], drawPile: string[]): CombatState =>
  createCombatState({ drawPile, hand, graveyard: [] }, noWave);

const play = (state: CombatState, handIndex: number) =>
  stepTick(state, [{ kind: 'play-card', handIndex }], PLAINS_MAP);

describe('徴発の発動', () => {
  it('山札の上3枚が候補になり、山札から除かれる', () => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor', 'beacon']);
    const after = play(state, 0);
    expect(after.levyOptions).toEqual(['arrow-tower', 'ballista', 'reactor']);
    expect(after.deck.drawPile).toEqual(['beacon']);
  });

  it('徴発自身は墓地へ行き、マナを1消費する', () => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor']);
    const after = play(state, 0);
    expect(after.deck.graveyard).toEqual(['levy']);
    expect(after.mana).toBe(1); // 初期2 - コスト1
  });

  it('配置クールダウンを消費する（他の札と同じ扱い）', () => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor']);
    const after = play(state, 0);
    expect(after.placeCooldown).toBeGreaterThan(0);
  });

  it('山札が空なら候補は空で、効果なしで墓地へ', () => {
    const state = stateWith(['levy'], []);
    const after = play(state, 0);
    expect(after.levyOptions).toEqual([]);
    expect(after.deck.graveyard).toEqual(['levy']);
  });
});

describe('徴発の選択', () => {
  const openLevy = (): CombatState => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor']);
    const after = play(state, 0);
    expect(after.levyOptions).toHaveLength(3);
    return after;
  };

  it('選んだ札が手札に入り、残りは墓地へ', () => {
    const opened = openLevy();
    const after = stepTick(opened, [{ kind: 'choose-levy', optionIndex: 1 }], PLAINS_MAP);
    expect(after.deck.hand).toEqual(['ballista']);
    expect(after.deck.graveyard).toEqual(['levy', 'arrow-tower', 'reactor']);
    expect(after.levyOptions).toEqual([]);
  });

  it('選択中もゲームは進む（tick が止まらない）', () => {
    const opened = openLevy();
    const after = stepTick(opened, [], PLAINS_MAP);
    expect(after.tick).toBe(opened.tick + 1);
    expect(after.levyOptions).toHaveLength(3);
  });

  it('選択待ち中に徴発を出そうとしても拒否される', () => {
    const opened = openLevy();
    const withAnotherLevy: CombatState = {
      ...opened,
      deck: { ...opened.deck, hand: ['levy'] },
      mana: 5,
      placeCooldown: 0,
    };
    const after = play(withAnotherLevy, 0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'pending' });
    expect(after.levyOptions).toHaveLength(3);
    expect(after.deck.hand).toEqual(['levy']);
  });

  it('選択待ちが無いときに choose-levy を送っても何も起きない', () => {
    const state = stateWith([], []);
    const after = stepTick(state, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(after.deck.hand).toEqual([]);
    expect(after.deck.graveyard).toEqual([]);
  });
});
