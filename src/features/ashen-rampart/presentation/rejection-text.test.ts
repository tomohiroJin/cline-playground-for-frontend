/**
 * 灰燼の城壁 - 拒否理由の文言
 *
 * cooldown のみ残り秒数を含める。「あと何秒か分からない」ことが
 * 不満の本体であるため（設計書 §5.2）。
 */
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import { rejectionText } from './rejection-text';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const base = (over: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  ...over,
});

describe('rejectionText', () => {
  it('cooldown は残り秒数を含む', () => {
    expect(rejectionText('cooldown', base({ placeCooldown: 25 }))).toBe(
      '次の設置まで あと 2.5 秒'
    );
  });

  it('mana は不足量ではなく現在のマナを示す', () => {
    expect(rejectionText('mana', base({ mana: 1 }))).toBe('マナが足りない（現在 1）');
  });

  it('target / occupied / pending はそれぞれ固有の文言になる', () => {
    expect(rejectionText('target', base())).toBe('そこには置けない');
    expect(rejectionText('occupied', base())).toBe('すでに何かが置かれている');
    expect(rejectionText('pending', base())).toBe('徴発の選択が先');
  });
});
