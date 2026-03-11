/**
 * domain/shared/civ-utils のテスト
 */
import { civLvs, civMin, civLv, dominantCiv } from '../../../domain/shared/civ-utils';
import { makeRun } from '../../test-helpers';

describe('domain/shared/civ-utils', () => {
  describe('civLvs', () => {
    it('3文明のレベルをオブジェクトとして返す', () => {
      const run = makeRun({ cT: 3, cL: 2, cR: 1 });
      expect(civLvs(run)).toEqual({ tech: 3, life: 2, rit: 1 });
    });
  });

  describe('civMin', () => {
    it('最小の文明レベルを返す', () => {
      const run = makeRun({ cT: 3, cL: 2, cR: 5 });
      expect(civMin(run)).toBe(2);
    });

    it('全文明が同じレベルの場合その値を返す', () => {
      const run = makeRun({ cT: 4, cL: 4, cR: 4 });
      expect(civMin(run)).toBe(4);
    });
  });

  describe('civLv', () => {
    it('tech文明のレベルを返す', () => {
      const run = makeRun({ cT: 5 });
      expect(civLv(run, 'tech')).toBe(5);
    });

    it('life文明のレベルを返す', () => {
      const run = makeRun({ cL: 3 });
      expect(civLv(run, 'life')).toBe(3);
    });

    it('rit文明のレベルを返す', () => {
      const run = makeRun({ cR: 7 });
      expect(civLv(run, 'rit')).toBe(7);
    });
  });

  describe('dominantCiv', () => {
    it('techが最も高い場合techを返す', () => {
      const run = makeRun({ cT: 5, cL: 3, cR: 2 });
      expect(dominantCiv(run)).toBe('tech');
    });

    it('lifeが最も高い場合lifeを返す', () => {
      const run = makeRun({ cT: 2, cL: 5, cR: 3 });
      expect(dominantCiv(run)).toBe('life');
    });

    it('ritが最も高い場合ritを返す', () => {
      const run = makeRun({ cT: 1, cL: 2, cR: 5 });
      expect(dominantCiv(run)).toBe('rit');
    });

    it('同点の場合techを優先する', () => {
      const run = makeRun({ cT: 3, cL: 3, cR: 3 });
      expect(dominantCiv(run)).toBe('tech');
    });
  });
});
