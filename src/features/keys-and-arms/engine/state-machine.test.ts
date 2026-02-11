import { createInitialState, reduceState } from './state-machine';

describe('state-machine', () => {
  it('初期状態を作成する', () => {
    const state = createInitialState(1200);
    expect(state.scene).toBe('title');
    expect(state.highScore).toBe(1200);
  });

  it('START_GAMEでcaveに遷移する', () => {
    const state = reduceState(createInitialState(), { type: 'START_GAME' });
    expect(state.scene).toBe('cave');
    expect(state.hp).toBe(3);
  });

  it('被弾でHP0になるとoverになる', () => {
    let state = reduceState(createInitialState(), { type: 'START_GAME' });
    state = { ...state, hp: 1 };
    state = reduceState(state, { type: 'DAMAGE' });
    expect(state.scene).toBe('over');
    expect(state.hp).toBe(0);
  });

  it('STAGE_CLEAR(cave)でtransitionに入る', () => {
    const state = reduceState(
      reduceState(createInitialState(), { type: 'START_GAME' }),
      { type: 'STAGE_CLEAR', stage: 'cave' }
    );
    expect(state.scene).toBe('transition');
    expect(state.transition?.label.startsWith('STAGE 2')).toBe(true);
  });
});
