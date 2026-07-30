/**
 * カードの「効かない相手」文言のテスト
 *
 * 全カードに文言があることが要件。1つでも欠けると構築画面で
 * 「何のために積むか」の手がかりが失われる。
 */
import { weaknessTextOf } from './card-text';
import { CARD_IDS } from '../domain/cards/card-pool';

describe('weaknessTextOf', () => {
  it('全14種に文言がある（空文字でない）', () => {
    CARD_IDS.forEach((id) => {
      expect(weaknessTextOf(id).length).toBeGreaterThan(0);
    });
  });

  it('弓兵は飛行に当たらないことを示す', () => {
    expect(weaknessTextOf('arrow-tower')).toContain('飛行');
  });

  it('弩砲は効率の低さを示す（効かない相手が無い代わり）', () => {
    expect(weaknessTextOf('ballista')).toContain('効率');
  });

  it('徹甲弩は低HPへの非効率を示す', () => {
    expect(weaknessTextOf('piercer')).toContain('HP');
  });

  it('落網はダメージを与えないことを示す', () => {
    expect(weaknessTextOf('snare-net')).toContain('ダメージ');
  });

  it('未知のIDは契約違反として例外', () => {
    expect(() => weaknessTextOf('unknown')).toThrow('文言が未定義のカードIDです: unknown');
  });
});
