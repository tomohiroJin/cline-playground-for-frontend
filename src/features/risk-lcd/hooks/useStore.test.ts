import { renderHook, act } from '@testing-library/react';
import { useStore } from './useStore';
import { SAVE_KEY } from '../constants';

describe('useStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('デフォルト値で初期化される', () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.data.pts).toBe(0);
    expect(result.current.data.plays).toBe(0);
    expect(result.current.data.best).toBe(0);
    expect(result.current.data.sty).toEqual(['standard']);
    expect(result.current.data.eq).toEqual(['standard']);
  });

  it('localStorageから読み込む', () => {
    const saved = {
      pts: 100,
      plays: 5,
      best: 500,
      bestSt: 3,
      sty: ['standard', 'aggressive'],
      ui: ['slot2'],
      eq: ['aggressive'],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useStore());
    expect(result.current.data.pts).toBe(100);
    expect(result.current.data.sty).toContain('aggressive');
  });

  it('addPtsでPTが追加される', () => {
    const { result } = renderHook(() => useStore());
    act(() => result.current.addPts(50));
    expect(result.current.data.pts).toBe(50);
  });

  it('spendでPTが消費される', () => {
    const { result } = renderHook(() => useStore());
    act(() => result.current.addPts(100));
    let success: boolean;
    act(() => { success = result.current.spend(30); });
    expect(success!).toBe(true);
    expect(result.current.data.pts).toBe(70);
  });

  it('spend失敗で残高不足', () => {
    const { result } = renderHook(() => useStore());
    let success: boolean;
    act(() => { success = result.current.spend(100); });
    expect(success!).toBe(false);
    expect(result.current.data.pts).toBe(0);
  });

  it('hasStyleで所持判定', () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.hasStyle('standard')).toBe(true);
    expect(result.current.hasStyle('aggressive')).toBe(false);
  });

  it('ownStyleでスタイル追加', () => {
    const { result } = renderHook(() => useStore());
    act(() => result.current.ownStyle('aggressive'));
    expect(result.current.data.sty).toContain('aggressive');
  });

  it('toggleEqで装備をトグル', () => {
    const { result } = renderHook(() => useStore());
    // standard は最初から装備されている
    expect(result.current.isEq('standard')).toBe(true);

    // 未所持スタイルは装備できない
    let ok: boolean;
    act(() => { ok = result.current.toggleEq('aggressive'); });
    expect(ok!).toBe(false);

    // スタイルを購入して装備
    act(() => result.current.ownStyle('aggressive'));
    act(() => { ok = result.current.toggleEq('aggressive'); });
    expect(ok!).toBe(true);
    expect(result.current.isEq('aggressive')).toBe(true);
  });

  it('maxSlotsでスロット数を取得', () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.maxSlots()).toBe(1);
    act(() => result.current.ownUnlock('slot2'));
    expect(result.current.maxSlots()).toBe(2);
  });

  it('updateBestでベスト更新', () => {
    const { result } = renderHook(() => useStore());
    act(() => result.current.updateBest(500, 3));
    expect(result.current.data.best).toBe(500);
    expect(result.current.data.bestSt).toBe(3);
    expect(result.current.data.plays).toBe(1);
  });
});
