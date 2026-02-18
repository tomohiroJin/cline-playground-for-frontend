/**
 * 原始進化録 - PRIMAL PATH - localStorage ラッパー
 */
import type { SaveData } from './types';
import { SAVE_KEY, FRESH_SAVE } from './constants';

export const Storage = Object.freeze({
  save: (data: SaveData): void => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e: unknown) {
      console.error('[Storage.save]', e instanceof Error ? e.message : String(e));
    }
  },
  load: (): SaveData | null => {
    try {
      const r = localStorage.getItem(SAVE_KEY);
      return r ? (JSON.parse(r) as SaveData) : null;
    } catch (e: unknown) {
      console.error('[Storage.load]', e instanceof Error ? e.message : String(e));
      return null;
    }
  },
  fresh: (): SaveData => JSON.parse(JSON.stringify(FRESH_SAVE)),
});
