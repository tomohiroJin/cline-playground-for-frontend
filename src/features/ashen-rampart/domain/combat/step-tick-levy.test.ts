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

  it('選択待ち中でも塔・罠など徴発以外のカードは通常どおり配置できる（回帰）', () => {
    const state = stateWith(
      ['levy', 'reactor'],
      ['arrow-tower', 'ballista', 'reactor']
    );
    const opened = play(state, 0);
    expect(opened.levyOptions).toHaveLength(3);
    // levy を discard した後、hand[0] が reactor になる。配置クールダウンは
    // levy 自身の配置で消費済みのため、この検証と無関係な cooldown 拒否を避けて 0 に戻す
    const readyToPlace: CombatState = { ...opened, placeCooldown: 0 };
    const after = stepTick(
      readyToPlace,
      [{ kind: 'play-card', handIndex: 0, pos: { x: 1, y: 2 } }],
      PLAINS_MAP
    );
    expect(after.events).toContainEqual({ kind: 'played', cardId: 'reactor', pos: { x: 1, y: 2 } });
    expect(after.reactors).toHaveLength(1);
    // 選択待ちは引き続き残る（levy 実装が選択待ち以外のカードを巻き込んでいないことの確認）
    expect(after.levyOptions).toHaveLength(3);
  });

  it('手札が上限のときに選んだ札を選んでも手札は増えず、候補すべてが墓地へ行く', () => {
    const state = stateWith(
      ['levy', 'ballista', 'ballista', 'ballista', 'ballista'],
      ['arrow-tower', 'ballista', 'reactor']
    );
    const opened = play(state, 0);
    expect(opened.deck.hand).toHaveLength(4);
    // 手札を上限(5)まで人為的に埋める（通常ドロー等で埋まった状況を模す）
    const handFull: CombatState = {
      ...opened,
      deck: { ...opened.deck, hand: [...opened.deck.hand, 'ballista'] },
    };
    expect(handFull.deck.hand).toHaveLength(5);
    const after = stepTick(handFull, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(after.deck.hand).toEqual(handFull.deck.hand);
    expect(after.deck.hand).toHaveLength(5);
    expect(after.deck.graveyard).toEqual(['levy', 'arrow-tower', 'ballista', 'reactor']);
    expect(after.levyOptions).toEqual([]);
  });

  it('選択を保留したまま通常ドローが挟まり手札が上限まで戻っても、選択後に手札が上限を超えない', () => {
    // 徴発を出す→手札4枚。以後、選択せず放置しても tick は進み続け（設計どおり）、
    // 40tick 後に通常ドローが1回発生して手札が上限5枚まで戻る。
    // ここで choose-levy しても手札が6枚に溢れないことを確認する（レビュー指摘の欠陥そのもの）。
    const state = stateWith(
      ['levy', 'ballista', 'ballista', 'ballista', 'ballista'],
      ['arrow-tower', 'ballista', 'reactor', 'ballista']
    );
    const opened = play(state, 0); // tick=1。ticksToDraw は 40 → 39 に減るのみ（まだ引かない）
    expect(opened.deck.hand).toHaveLength(4);
    expect(opened.levyOptions).toHaveLength(3);

    // 選択せずに放置し、通常ドローが発生するまで tick を進める（合計 tick=40 で発火）
    let after = opened;
    for (let i = 0; i < 39; i++) {
      after = stepTick(after, [], PLAINS_MAP);
    }
    expect(after.tick).toBe(40);
    expect(after.deck.hand).toHaveLength(5); // 通常ドローで上限まで戻った
    expect(after.levyOptions).toHaveLength(3); // 選択は放置されたまま（ゲームは止まっていない）

    const chosen = stepTick(after, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(chosen.deck.hand).toHaveLength(5); // 6枚に溢れない
    expect(chosen.levyOptions).toEqual([]);
  });
});
