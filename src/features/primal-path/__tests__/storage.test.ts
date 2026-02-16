/**
 * 原始進化録 - PRIMAL PATH - Storage テスト
 */
import { Storage } from '../storage';
import { SAVE_KEY } from '../constants';
import type { SaveData } from '../types';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save/loadのラウンドトリップが正しく動作する', () => {
    const data: SaveData = { bones: 100, tree: { atk1: 1 }, clears: 2, runs: 5, best: { 0: 1 } };
    Storage.save(data);
    const loaded = Storage.load();
    expect(loaded).toEqual(data);
  });

  it('データがない場合nullを返す', () => {
    expect(Storage.load()).toBeNull();
  });

  it('正しいキーで保存する', () => {
    const data: SaveData = { bones: 0, tree: {}, clears: 0, runs: 0, best: {} };
    Storage.save(data);
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('fresh()は新しいセーブデータを返す', () => {
    const f = Storage.fresh();
    expect(f.bones).toBe(0);
    expect(f.clears).toBe(0);
  });

  it('不正なJSONでもnullを返す', () => {
    localStorage.setItem(SAVE_KEY, '{invalid json');
    expect(Storage.load()).toBeNull();
  });
});
