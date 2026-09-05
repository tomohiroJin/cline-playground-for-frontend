import { advanceStage } from './advance-stage';
import { startExpedition } from './start-expedition';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { OFFER_SIZE } from '../../domain/expedition/acquisition';
import { chooseAcquisition } from '../../domain/expedition/expedition-state';

const preset = PRESET_DECKS.swift.cards;

describe('advanceStage', () => {
  it('勝つと3択が提示される', () => {
    const after = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    expect(after.phase).toBe('offer');
    expect(after.offer).toHaveLength(OFFER_SIZE);
  });

  it('負けると提示は無く遠征が終わる', () => {
    const after = advanceStage(startExpedition(preset, 7), { won: false, lifeLeft: 0 });
    expect(after.phase).toBe('ended');
    expect(after.offer).toEqual([]);
  });

  it('最終ステージに勝つと踏破で、提示は無い', () => {
    let exp = startExpedition(preset, 7);
    exp = advanceStage(exp, { won: true, lifeLeft: 9 });
    // 実際の獲得経路（chooseAcquisition）を通す。手組みで acquired を
    // 伸ばすと applyAcquisition の提示メンバーシップ検査を迂回してしまい、
    // 「獲得の実経路を通したときに acquired が伸びる」契約を検査できない
    // （レビュー指摘・過去に acquired 更新忘れで偽 RED を起こした形の再発防止）。
    exp = chooseAcquisition(exp, exp.offer[0]!);
    exp = advanceStage(exp, { won: true, lifeLeft: 7 });
    exp = chooseAcquisition(exp, exp.offer[0]!);
    exp = advanceStage(exp, { won: true, lifeLeft: 5 });
    expect(exp.outcome).toBe('cleared');
    expect(exp.offer).toEqual([]);
  });

  it('同じ遠征・同じ回の提示は毎回同じ（決定的）', () => {
    const a = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    const b = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    expect(a.offer).toEqual(b.offer);
  });

  it('1回目と2回目の提示は独立（同じ添字の派生シードを使い回していない）', () => {
    let exp = advanceStage(startExpedition(preset, 7), { won: true, lifeLeft: 9 });
    const first = exp.offer;
    // chooseAcquisition を通すと acquired が伸び、次の offerIndex が進む。
    exp = chooseAcquisition(exp, first[0]!);
    const second = advanceStage(exp, { won: true, lifeLeft: 7 }).offer;
    expect(second).not.toEqual(first);
  });
});
