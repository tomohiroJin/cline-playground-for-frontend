/**
 * 原始進化録 - PRIMAL PATH - アクティブスキルテスト
 */
import {
  calcAvlSkills, applySkill, tickBuffs, decSkillCds,
} from '../game-logic';
import type { RunState, SkillSt } from '../types';
import { makeRun } from './test-helpers';

/* ===== calcAvlSkills ===== */

describe('calcAvlSkills', () => {
  it('レベルが低い場合は空配列を返す', () => {
    // Arrange
    const run = makeRun({ cT: 1, cL: 1, cR: 1 });

    // Act
    const result = calcAvlSkills(run);

    // Assert
    expect(result).toEqual([]);
  });

  it('tech Lv3で炎の爆発(fB)が解放される', () => {
    // Arrange
    const run = makeRun({ cT: 3, cL: 0, cR: 0 });

    // Act
    const result = calcAvlSkills(run);

    // Assert
    expect(result).toContain('fB');
  });

  it('life Lv3で自然の癒し(nH)が解放される', () => {
    // Arrange
    const run = makeRun({ cT: 0, cL: 3, cR: 0 });

    // Act
    const result = calcAvlSkills(run);

    // Assert
    expect(result).toContain('nH');
  });

  it('rit Lv3で血の狂乱(bR)が解放される', () => {
    // Arrange
    const run = makeRun({ cT: 0, cL: 0, cR: 3 });

    // Act
    const result = calcAvlSkills(run);

    // Assert
    expect(result).toContain('bR');
  });

  it('全Lv4で盾の壁(sW)が解放される', () => {
    // Arrange
    const run = makeRun({ cT: 4, cL: 4, cR: 4 });

    // Act
    const result = calcAvlSkills(run);

    // Assert
    expect(result).toContain('sW');
    // 他のスキルも全て解放
    expect(result).toContain('fB');
    expect(result).toContain('nH');
    expect(result).toContain('bR');
  });
});

/* ===== applySkill ===== */

describe('applySkill', () => {
  it('炎の爆発(fB)で敵にダメージを与える', () => {
    // Arrange
    const run = makeRun({
      cT: 3,
      en: { n: 'テスト', hp: 100, mhp: 100, atk: 5, def: 0, bone: 1 },
    });

    // Act
    const { nextRun, events } = applySkill(run, 'fB');

    // Assert
    expect(nextRun.en!.hp).toBe(55); // 100 - 45
    expect(nextRun.dmgDealt).toBe(45);
    expect(events.some(e => e.type === 'sfx' && e.sfx === 'skFire')).toBe(true);
  });

  it('自然の癒し(nH)でHPが回復する', () => {
    // Arrange
    const run = makeRun({ cL: 3, hp: 40 });

    // Act
    const { nextRun, events } = applySkill(run, 'nH');

    // Assert
    expect(nextRun.hp).toBe(80); // 40 + 40
    expect(events.some(e => e.type === 'sfx' && e.sfx === 'skHeal')).toBe(true);
  });

  it('血の狂乱(bR)でバフが追加されHPが消費される', () => {
    // Arrange
    const run = makeRun({ cR: 3, hp: 80 });

    // Act
    const { nextRun } = applySkill(run, 'bR');

    // Assert
    expect(nextRun.hp).toBe(60); // 80 - 20
    expect(nextRun.sk.bfs.length).toBe(1);
    expect(nextRun.sk.bfs[0].sid).toBe('bR');
    expect(nextRun.sk.bfs[0].rT).toBe(3);
  });

  it('盾の壁(sW)でシールドバフが追加される', () => {
    // Arrange
    const run = makeRun({ cT: 4, cL: 4, cR: 4 });

    // Act
    const { nextRun } = applySkill(run, 'sW');

    // Assert
    expect(nextRun.sk.bfs.length).toBe(1);
    expect(nextRun.sk.bfs[0].sid).toBe('sW');
    expect(nextRun.sk.bfs[0].rT).toBe(2);
  });

  it('クールダウン中はスキルが不発になる', () => {
    // Arrange
    const run = makeRun({
      cT: 3,
      sk: { avl: [], cds: { fB: 2 }, bfs: [] },
      en: { n: 'テスト', hp: 100, mhp: 100, atk: 5, def: 0, bone: 1 },
    });

    // Act
    const { nextRun, events } = applySkill(run, 'fB');

    // Assert
    expect(nextRun.en!.hp).toBe(100); // ダメージなし
    expect(events.length).toBe(0);
  });
});

/* ===== tickBuffs ===== */

describe('tickBuffs', () => {
  it('バフのターン数をデクリメントする', () => {
    // Arrange
    const sk: SkillSt = {
      avl: [], cds: {},
      bfs: [{ sid: 'bR', rT: 3, fx: { t: 'buffAtk', aM: 2, hC: 20, dur: 3 } }],
    };

    // Act
    const result = tickBuffs(sk);

    // Assert
    expect(result.bfs[0].rT).toBe(2);
  });

  it('ターン0のバフを除去する', () => {
    // Arrange
    const sk: SkillSt = {
      avl: [], cds: {},
      bfs: [{ sid: 'bR', rT: 1, fx: { t: 'buffAtk', aM: 2, hC: 20, dur: 3 } }],
    };

    // Act
    const result = tickBuffs(sk);

    // Assert
    expect(result.bfs.length).toBe(0);
  });
});

/* ===== decSkillCds ===== */

describe('decSkillCds', () => {
  it('クールダウンをデクリメントする', () => {
    // Arrange
    const sk: SkillSt = {
      avl: [], cds: { fB: 2, nH: 1 }, bfs: [],
    };

    // Act
    const result = decSkillCds(sk);

    // Assert
    expect(result.cds.fB).toBe(1);
    expect(result.cds.nH).toBeUndefined(); // 0以下は削除
  });

  it('CD0のスキルを削除する', () => {
    // Arrange
    const sk: SkillSt = {
      avl: [], cds: { fB: 1 }, bfs: [],
    };

    // Act
    const result = decSkillCds(sk);

    // Assert
    expect(result.cds.fB).toBeUndefined();
  });
});
