/**
 * 敵へのダメージの一本化（反復7 段階2・設計書 §4.2 (1)）
 *
 * 装甲は1ヒットごとに引き（最低0）、実際に削ったときだけ撃破源を書き換える。
 */
import { applyDamage, canTowerHit, hitOn, type DamageDraft } from './damage';
import type { ActiveEnemy, DefeatSource } from './combat-state';

const enemy = (overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1,
  enemyId: 'grunt',
  hp: 20,
  maxHp: 20,
  progress: 1,
  spawnTick: 0,
  laneIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  ...overrides,
});

const draftOf = (target: ActiveEnemy): DamageDraft => ({
  hpById: new Map([[target.id, target.hp]]),
  sourceById: new Map(),
  events: [],
});

const UNIT: DefeatSource = { kind: 'unit', index: 0 };
const TRAP: DefeatSource = { kind: 'trap', index: 0 };

describe('applyDamage', () => {
  it('装甲の無い敵は素のダメージだけ削られ、撃破源が書かれる', () => {
    const target = enemy();
    const draft = draftOf(target);

    const dealt = applyDamage(draft, hitOn(target, 7, UNIT));

    expect(dealt).toBe(7);
    expect(draft.hpById.get(1)).toBe(13);
    expect(draft.sourceById.get(1)).toEqual(UNIT);
  });

  it('装甲は1ヒットごとに引き、最低0 にする', () => {
    const target = enemy();
    const draft = draftOf(target);

    expect(applyDamage(draft, { enemy: target, raw: 4, source: UNIT, armor: 4 })).toBe(0);
    expect(applyDamage(draft, { enemy: target, raw: 3, source: UNIT, armor: 4 })).toBe(0);
    expect(applyDamage(draft, { enemy: target, raw: 5, source: UNIT, armor: 4 })).toBe(1);
    expect(draft.hpById.get(1)).toBe(19);
  });

  it('装甲で 0 に抑えられた命中は撃破源を書き換えない（最後に「削った」者に帰属する）', () => {
    const target = enemy({ hp: 1 });
    const draft = draftOf(target);
    applyDamage(draft, { enemy: target, raw: 5, source: TRAP, armor: 4 });

    applyDamage(draft, { enemy: target, raw: 3, source: UNIT, armor: 4 });

    expect(draft.hpById.get(1)).toBe(0);
    expect(draft.sourceById.get(1)).toEqual(TRAP);
  });

  it('ダメージ0 の命中（落網）は何もせず、イベントも積まない', () => {
    const target = enemy();
    const draft = draftOf(target);

    expect(applyDamage(draft, { enemy: target, raw: 0, source: TRAP, armor: 4 })).toBe(0);

    expect(draft.hpById.get(1)).toBe(20);
    expect(draft.sourceById.has(1)).toBe(false);
    expect(draft.events).toEqual([]);
  });

  it('装甲を持つ敵への命中は、軽減0 でも armor-hit を1件積む', () => {
    const target = enemy();
    const draft = draftOf(target);

    applyDamage(draft, { enemy: target, raw: 4, source: UNIT, armor: 4 });
    applyDamage(draft, { enemy: target, raw: 6, source: UNIT, armor: 4 });

    expect(draft.events).toEqual([
      { kind: 'armor-hit', enemyId: 1, raw: 4, dealt: 0, armor: 4 },
      { kind: 'armor-hit', enemyId: 1, raw: 6, dealt: 2, armor: 4 },
    ]);
  });

  it('装甲の無い敵への命中は armor-hit を積まない', () => {
    const target = enemy();
    const draft = draftOf(target);

    applyDamage(draft, hitOn(target, 4, UNIT));

    expect(draft.events).toEqual([]);
  });

  it('hitOn は敵定義の装甲を引く（現行の雑兵は0）', () => {
    expect(hitOn(enemy(), 4, UNIT).armor).toBe(0);
  });
});

describe('canTowerHit', () => {
  const raven = (groundedUntilTick = 0): ActiveEnemy => enemy({ enemyId: 'raven', groundedUntilTick });

  it('対空の塔は飛行に当たり、対空でない塔は飛行に当たらない', () => {
    expect(canTowerHit({ hitsFlying: true }, raven(), 10)).toBe(true);
    expect(canTowerHit({ hitsFlying: false }, raven(), 10)).toBe(false);
  });

  it('地上化している鴉には対空でない塔も当たる', () => {
    expect(canTowerHit({ hitsFlying: false }, raven(20), 10)).toBe(true);
  });

  it('地上の敵にはどの塔も当たる', () => {
    expect(canTowerHit({ hitsFlying: false }, enemy(), 10)).toBe(true);
  });
});
