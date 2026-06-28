import { mergeLegacyIntoFx, getLegacyById } from '../../../domain/services/legacy-service';
import { computeFx, createNewPlayer } from '../../../domain/services/unlock-service';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';

/**
 * selectDiff が「圧→実効難易度」と「レガシー→実効fx」を合成して
 * 初期プレイヤーを作る計算を、純粋関数の組み合わせとして固定する。
 */
describe('残響継承の実効fx適用', () => {
  it('lg_lian の infoBonus が初期情報に乗る', () => {
    const base = computeFx([]);
    const fx = mergeLegacyIntoFx(base, getLegacyById('lg_lian'));
    const normal = DIFFICULTY.find(d => d.id === 'normal')!;
    const player = createNewPlayer(normal, fx);
    // BASE_INF(5) + infoBonus(8) = 13
    expect(player.inf).toBe(13);
  });

  it('lg_twins の負の初期値が初期HP/精神を下げる', () => {
    const base = computeFx([]);
    const fx = mergeLegacyIntoFx(base, getLegacyById('lg_twins'));
    const normal = DIFFICULTY.find(d => d.id === 'normal')!;
    const player = createNewPlayer(normal, fx);
    // BASE_HP(52) + hpBonus(-10) = 42、BASE_MN(33) + mentalBonus(-8) = 25
    expect(player.hp).toBe(42);
    expect(player.mn).toBe(25);
  });
});
