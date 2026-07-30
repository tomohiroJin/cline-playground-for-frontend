/**
 * カウントダウンのテスト
 *
 * 新しい state を増やさず、ウェーブの startTick をずらすことで実現する。
 * spawnAt / isCleared の fencepost 論理に手を入れないための設計。
 */
import { createCombatState, COUNTDOWN_TICKS, countdownLeftAt } from './combat-state';
import { stepTick } from './step-tick';
import type { CombatState } from './combat-state';
import { PLAINS_WAVES } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('countdownLeftAt', () => {
  it('開始時は COUNTDOWN_TICKS ぶん残っている', () => {
    expect(countdownLeftAt(0)).toBe(COUNTDOWN_TICKS);
  });

  it('tick が進むと減る', () => {
    expect(countdownLeftAt(30)).toBe(COUNTDOWN_TICKS - 30);
  });

  it('カウントダウン後は 0 で止まる', () => {
    expect(countdownLeftAt(COUNTDOWN_TICKS)).toBe(0);
    expect(countdownLeftAt(COUNTDOWN_TICKS + 100)).toBe(0);
  });
});

describe('createCombatState のウェーブシフト', () => {
  it('ウェーブの startTick が COUNTDOWN_TICKS ぶんずれる', () => {
    const state = createCombatState(emptyDeck, PLAINS_WAVES);
    const original = PLAINS_WAVES.map((w) => w.startTick);
    expect(state.waves.map((w) => w.startTick)).toEqual(
      original.map((t) => t + COUNTDOWN_TICKS)
    );
  });

  it('エントリの内容は変わらない', () => {
    const state = createCombatState(emptyDeck, PLAINS_WAVES);
    expect(state.waves[0]?.entries).toEqual(PLAINS_WAVES[0]?.entries);
  });
});

describe('カウントダウン中の振る舞い', () => {
  it('敵は出現しない', () => {
    const after = advance(createCombatState(emptyDeck, PLAINS_WAVES), COUNTDOWN_TICKS);
    expect(after.enemies).toHaveLength(0);
  });

  it('カウントダウン明けに敵が出現する', () => {
    const after = advance(createCombatState(emptyDeck, PLAINS_WAVES), COUNTDOWN_TICKS + 1);
    expect(after.enemies.filter((e) => e.alive).length).toBeGreaterThan(0);
  });

  it('敵が0体でも勝利判定にならない（カウントダウン中）', () => {
    const after = advance(createCombatState(emptyDeck, PLAINS_WAVES), COUNTDOWN_TICKS - 1);
    expect(after.outcome).toBe('playing');
  });

  it('マナ生成は動く（魔力炉があれば増える）', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, PLAINS_WAVES),
      reactors: [{ pos: { x: 1, y: 2 }, ticksToMana: 60 }],
    };
    const after = advance(state, COUNTDOWN_TICKS);
    expect(after.mana).toBeGreaterThan(state.mana);
  });

  it('ドローは動く', () => {
    const state = createCombatState(
      { drawPile: ['arrow-tower', 'ballista'], hand: [], graveyard: [] },
      PLAINS_WAVES
    );
    const after = advance(state, COUNTDOWN_TICKS);
    expect(after.deck.hand.length).toBeGreaterThan(0);
  });

  it('配置できる', () => {
    const state = createCombatState(
      { drawPile: [], hand: ['reactor'], graveyard: [] },
      PLAINS_WAVES
    );
    const after = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: { x: 1, y: 2 } }], PLAINS_MAP);
    expect(after.reactors).toHaveLength(1);
  });
});
