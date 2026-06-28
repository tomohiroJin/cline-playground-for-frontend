/**
 * 迷宮の残響 - 終章フロー 純粋合成仕様テスト
 *
 * 終章の victory コミットが「決断×昇格条件」で正しい真ENDを選ぶことを固定する。
 * （commitVictory の実配線は use-game-actions.ts、回帰は use-game で担保）
 */
import { determineTrueEnding } from '../../../domain/services/finale-service';
import { determineEnding } from '../../../domain/services/ending-service';

describe('終章 victory の真END選択', () => {
  it('継ぐ×圧6 → 真・継承者、断つ×継承なし圧0 → 解放者', () => {
    expect(determineTrueEnding('inherit', 6, null).id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 0, null).id).toBe('te_liberator');
  });

  it('通常 determineEnding は真END id を返さない（経路分離）', () => {
    const p = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] } as never;
    expect(determineEnding(p, [], { id: 'normal' }).id.startsWith('te_')).toBe(false);
  });
});
