import {
  createExpedition, currentStage, completeStage, presentOffer, chooseAcquisition,
} from './expedition-state';
import { PROVISIONAL_STAGES } from './stage-pool';
import { LIFE_INITIAL, STAGE_CLEAR_HEAL } from '../combat/combat-state';

const stages = [PROVISIONAL_STAGES[0]!, PROVISIONAL_STAGES[2]!, PROVISIONAL_STAGES[4]!];
const deck12 = [
  'reactor','reactor','reactor','stone-wall','stone-wall','arrow-tower',
  'arrow-tower','ballista','ballista','cannon-tower','spike-trap','piercer',
];
const start = () => createExpedition(1234, deck12, stages);

describe('遠征の開始', () => {
  it('層1 のステージから始まる', () => {
    const exp = start();
    expect(exp.stageIndex).toBe(0);
    expect(exp.phase).toBe('stage');
    expect(exp.outcome).toBe('running');
    expect(currentStage(exp)?.id).toBe(stages[0]!.id);
  });

  it('ライフは LIFE_INITIAL、デッキは渡したもの、獲得は空', () => {
    const exp = start();
    expect(exp.life).toBe(LIFE_INITIAL);
    expect(exp.deckCards).toEqual(deck12);
    expect(exp.initialDeckCards).toEqual(deck12);
    expect(exp.acquired).toEqual([]);
    expect(exp.offer).toEqual([]);
  });

  it('獲得しても initialDeckCards は変わらない（シャッフルの基底）', () => {
    let exp = completeStage(start(), { won: true, lifeLeft: 8 });
    exp = chooseAcquisition(presentOffer(exp, ['beacon']), 'beacon');
    expect(exp.initialDeckCards).toEqual(deck12);
    expect(exp.deckCards).toHaveLength(deck12.length + 1);
  });
});

describe('ステージの決着', () => {
  it('勝つと offer フェーズへ進み、ライフが持ち越されて回復する', () => {
    const after = completeStage(start(), { won: true, lifeLeft: 8 });
    expect(after.phase).toBe('offer');
    expect(after.stageIndex).toBe(1);
    expect(after.life).toBe(8 + STAGE_CLEAR_HEAL);
  });

  it('回復は LIFE_INITIAL を超えない（際限なく増えない）', () => {
    const after = completeStage(start(), { won: true, lifeLeft: LIFE_INITIAL });
    expect(after.life).toBe(LIFE_INITIAL);
  });

  it('負けると遠征が終わる（outcome: failed）', () => {
    const after = completeStage(start(), { won: false, lifeLeft: 0 });
    expect(after.phase).toBe('ended');
    expect(after.outcome).toBe('failed');
  });

  it('最終ステージに勝つと踏破（outcome: cleared・獲得の提示は無い）', () => {
    let exp = start();
    exp = completeStage(exp, { won: true, lifeLeft: 9 });
    exp = chooseAcquisition(presentOffer(exp, ['beacon']), 'beacon');
    exp = completeStage(exp, { won: true, lifeLeft: 6 });
    exp = chooseAcquisition(presentOffer(exp, ['forge']), 'forge');
    exp = completeStage(exp, { won: true, lifeLeft: 4 });
    expect(exp.phase).toBe('ended');
    expect(exp.outcome).toBe('cleared');
    expect(exp.deckCards).toHaveLength(deck12.length + 2);
  });

  it('終わった遠征をさらに進めようとすると契約違反', () => {
    const ended = completeStage(start(), { won: false, lifeLeft: 0 });
    expect(() => completeStage(ended, { won: true, lifeLeft: 5 })).toThrow('遠征は既に終了しています');
  });

  it('終了した遠征に提示しようとすると契約違反（復活させない）', () => {
    const ended = completeStage(start(), { won: false, lifeLeft: 0 });
    expect(() => presentOffer(ended, ['beacon'])).toThrow('獲得の提示中ではありません');
  });

  it('獲得の選択待ちの最中にステージを決着させようとすると契約違反', () => {
    const offered = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon']);
    expect(() => completeStage(offered, { won: true, lifeLeft: 6 })).toThrow();
  });
});

describe('獲得', () => {
  it('提示を受け取ると offer に載る', () => {
    const exp = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon', 'forge', 'catapult']);
    expect(exp.offer).toEqual(['beacon', 'forge', 'catapult']);
    expect(exp.phase).toBe('offer');
  });

  it('選ぶとデッキが1枚増え、stage フェーズへ戻り、offer が空になる', () => {
    let exp = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon', 'forge', 'catapult']);
    exp = chooseAcquisition(exp, 'forge');
    expect(exp.deckCards).toHaveLength(deck12.length + 1);
    expect(exp.deckCards[exp.deckCards.length - 1]).toBe('forge');
    expect(exp.acquired).toEqual(['forge']);
    expect(exp.phase).toBe('stage');
    expect(exp.offer).toEqual([]);
  });

  it('stage フェーズで獲得しようとすると契約違反', () => {
    expect(() => chooseAcquisition(start(), 'forge')).toThrow('獲得の提示中ではありません');
  });

  it('提示に無い札を選ぶと契約違反', () => {
    const exp = presentOffer(completeStage(start(), { won: true, lifeLeft: 8 }), ['beacon']);
    expect(() => chooseAcquisition(exp, 'catapult')).toThrow('提示されていないカードです');
  });
});
