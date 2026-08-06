/**
 * ライフが減った理由の判定のテスト
 *
 * 溢れ・漏れ・両方同時・どちらも無しの4分岐を直接叩く。
 * 「両方同時」は RunStatusBar 側のテストからは見えなくなったため
 * （持続表示の修正で理由の導出をこのモジュールへ切り出した）、ここで確実に押さえる。
 */
import { lifeLossReason } from './life-loss-reason';
import type { TickEvent } from '../domain/combat/combat-state';

describe('lifeLossReason', () => {
  it('溢れイベントのみのとき、手札が原因だと分かる文言を返す', () => {
    const events: TickEvent[] = [{ kind: 'overflow', cardId: 'ballista' }];
    expect(lifeLossReason(events)).toBe('手札があふれました');
  });

  it('漏れイベントのみのとき、敵が原因だと分かる文言を返す', () => {
    const events: TickEvent[] = [{ kind: 'leak', enemyId: 1 }];
    expect(lifeLossReason(events)).toBe('敵が砦に到達しました');
  });

  it('溢れと漏れが同じ tick に同時発生したとき、両方を伝える結合文言を返す', () => {
    const events: TickEvent[] = [
      { kind: 'overflow', cardId: 'ballista' },
      { kind: 'leak', enemyId: 1 },
    ];
    expect(lifeLossReason(events)).toBe('手札があふれ、敵が砦に到達しました');
  });

  it('どちらも起きていないとき、undefined を返す', () => {
    expect(lifeLossReason([])).toBeUndefined();
  });
});
