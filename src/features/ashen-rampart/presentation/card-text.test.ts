/**
 * カードの「効かない相手」文言のテスト
 *
 * 全カードに文言があることが要件。1つでも欠けると構築画面で
 * 「何のために積むか」の手がかりが失われる。
 */
import { weaknessTextOf, MISSING_WEAKNESS_IDS } from './card-text';
import { CARD_IDS } from '../domain/cards/card-pool';

describe('weaknessTextOf', () => {
  it('全14種に文言がある（空文字でない）', () => {
    CARD_IDS.forEach((id) => {
      expect(weaknessTextOf(id).length).toBeGreaterThan(0);
    });
  });

  it('欠落カードが無い（開発時の取り漏れ検出）', () => {
    expect(MISSING_WEAKNESS_IDS).toEqual([]);
  });

  it('弓兵は飛行に当たらないことを示す', () => {
    expect(weaknessTextOf('arrow-tower')).toContain('飛行');
  });

  it('弩砲は効かない相手がないことと制約を示す', () => {
    expect(weaknessTextOf('ballista')).toContain('効かない相手はない');
    expect(weaknessTextOf('ballista')).toContain('コスト');
  });

  it('徹甲弩は一直線に並んでいないと恩恵がないことを示す', () => {
    expect(weaknessTextOf('piercer')).toContain('一直線');
  });

  it('篝火と鍛冶場は常に0ダメージを示す', () => {
    expect(weaknessTextOf('beacon')).toContain('0ダメージ');
    expect(weaknessTextOf('forge')).toContain('0ダメージ');
  });

  it('落網はダメージを与えないことを示す', () => {
    expect(weaknessTextOf('snare-net')).toContain('ダメージ');
  });

  it('未知のIDは契約違反として例外', () => {
    expect(() => weaknessTextOf('unknown')).toThrow('文言が未定義のカードIDです: unknown');
  });
});
