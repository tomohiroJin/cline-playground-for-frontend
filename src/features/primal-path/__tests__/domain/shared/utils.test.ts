/**
 * domain/shared/utils のテスト
 */
import { clamp, mkPopup, updatePopups, getSnap, applyStatFx, deepCloneRun } from '../../../domain/shared/utils';
import { makeRun } from '../../test-helpers';

describe('domain/shared/utils', () => {
  describe('clamp', () => {
    it('値が範囲内の場合そのまま返す', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('値が下限未満の場合下限を返す', () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });

    it('値が上限超過の場合上限を返す', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('mkPopup', () => {
    it('通常ダメージポップアップを生成する', () => {
      const p = mkPopup(10, false, false);
      expect(p.v).toBe(10);
      expect(p.cl).toBe('#ffffff');
      expect(p.fs).toBe(15);
    });

    it('クリティカルダメージポップアップを生成する', () => {
      const p = mkPopup(20, true, false);
      expect(p.cl).toBe('#ff3030');
      expect(p.fs).toBe(24);
    });

    it('回復ポップアップを生成する', () => {
      const p = mkPopup(15, false, true);
      expect(p.cl).toBe('#50ff90');
      expect(p.fs).toBe(16);
    });
  });

  describe('updatePopups', () => {
    it('空配列に対して空配列を返す', () => {
      expect(updatePopups([])).toEqual([]);
    });

    it('寿命が尽きたポップアップを除去する', () => {
      const popups = [mkPopup(10, false, false)];
      let result = popups;
      // 寿命分だけ更新すれば除去される
      for (let i = 0; i < 8; i++) result = updatePopups(result);
      expect(result).toEqual([]);
    });
  });

  describe('getSnap', () => {
    it('RunStateから8つのステータスキーを抽出する', () => {
      const run = makeRun({ atk: 10, mhp: 100, hp: 80, def: 5, cr: 0.1, aM: 1.5, burn: 1, bb: 3 });
      const snap = getSnap(run);
      expect(snap).toEqual({ atk: 10, mhp: 100, hp: 80, def: 5, cr: 0.1, aM: 1.5, burn: 1, bb: 3 });
    });
  });

  describe('applyStatFx', () => {
    it('ATK増加効果を適用する', () => {
      const snap = { atk: 10, mhp: 100, hp: 80, def: 5, cr: 0.1, aM: 1, burn: 0, bb: 0 };
      const result = applyStatFx(snap, { atk: 5 });
      expect(result.atk).toBe(15);
    });

    it('HP増加効果を適用する（HP/MHP両方増加）', () => {
      const snap = { atk: 10, mhp: 100, hp: 80, def: 5, cr: 0.1, aM: 1, burn: 0, bb: 0 };
      const result = applyStatFx(snap, { mhp: 20 });
      expect(result.mhp).toBe(120);
      expect(result.hp).toBe(100);
    });

    it('会心率は1を超えない', () => {
      const snap = { atk: 10, mhp: 100, hp: 80, def: 5, cr: 0.9, aM: 1, burn: 0, bb: 0 };
      const result = applyStatFx(snap, { cr: 0.5 });
      expect(result.cr).toBe(1);
    });
  });

  describe('deepCloneRun', () => {
    it('RunStateの深いコピーを作成し、元のオブジェクトと独立している', () => {
      const run = makeRun({ en: { n: 'test', hp: 10, mhp: 10, atk: 5, def: 0, bone: 1 } });
      const cloned = deepCloneRun(run);

      // 値が同一であること
      expect(cloned.hp).toBe(run.hp);
      expect(cloned.en?.n).toBe('test');

      // 参照が異なること
      expect(cloned).not.toBe(run);
      expect(cloned.al).not.toBe(run.al);
      expect(cloned.log).not.toBe(run.log);
      expect(cloned.en).not.toBe(run.en);
    });
  });
});
