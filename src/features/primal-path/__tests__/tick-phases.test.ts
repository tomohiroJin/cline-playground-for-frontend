/**
 * tick-phases — 棘の守護の反射キル同tick確定のテスト
 */
import { tick } from '../game-logic';
import { makeRun } from './test-helpers';

describe('tick — 棘の守護の反射キル（同tick確定）', () => {
  it('反射ダメージで敵が倒れたら、その tick 内で撃破が確定する', () => {
    // プレイヤー攻撃では敵を倒せない（敵DEF高く dm=1）が、反射で倒れる状況を作る
    //   player atk=8, en.def=1000 → 通常攻撃 dm = max(1, 8-1000)=1 → en.hp 2→1
    //   en.atk=100, player def=0 → 被ダメ 100、反射 = floor(100×0.3)=30 → en.hp 1-30=-29
    //   rng=0.99 で会心なし・追撃なし
    const r = makeRun({
      keystones: ['thorn_guard'],
      atk: 8, def: 0, hp: 1000, mhp: 1000, cr: 0, kills: 0,
      en: { n: '岩亀', hp: 2, mhp: 100, atk: 100, def: 1000, bone: 3 },
    });
    const res = tick(r, false, () => 0.99);
    expect(res.nextRun.kills).toBe(1);
    expect(res.events.some(ev => ev.type === 'enemy_killed')).toBe(true);
    expect(res.nextRun.en!.hp).toBe(0);
  });
});
