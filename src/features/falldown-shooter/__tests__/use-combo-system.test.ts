// コンボシステムフックのユニットテスト

import { renderHook, act } from '@testing-library/react';
import { useComboSystem } from '../hooks/use-combo-system';
import { COMBO_CONFIG } from '../constants';

describe('COMBO_CONFIG', () => {
  it('コンボ設定定数が正しく定義されている', () => {
    expect(COMBO_CONFIG.windowMs).toBe(2000);
    expect(COMBO_CONFIG.maxMultiplier).toBe(5.0);
    expect(COMBO_CONFIG.skillBonusInterval).toBe(5);
    expect(COMBO_CONFIG.skillBonusAmount).toBe(10);
  });

  it('コンボ倍率テーブルが正しく定義されている', () => {
    expect(COMBO_CONFIG.multiplierTable).toEqual([
      { minCombo: 0, multiplier: 1.0 },
      { minCombo: 2, multiplier: 1.5 },
      { minCombo: 3, multiplier: 2.0 },
      { minCombo: 5, multiplier: 3.0 },
      { minCombo: 8, multiplier: 4.5 },
      { minCombo: 10, multiplier: 5.0 },
    ]);
  });
});

describe('useComboSystem', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('初期状態', () => {
    it('初期状態ではコンボが0で非アクティブ', () => {
      const { result } = renderHook(() => useComboSystem());
      expect(result.current.comboState.count).toBe(0);
      expect(result.current.comboState.multiplier).toBe(1.0);
      expect(result.current.comboState.isActive).toBe(false);
    });
  });

  describe('コンボカウント', () => {
    it('ヒット登録でコンボカウントが増加する', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.registerHit();
      });
      expect(result.current.comboState.count).toBe(1);

      act(() => {
        result.current.registerHit();
      });
      expect(result.current.comboState.count).toBe(2);
    });

    it('ヒットするとコンボがアクティブになる', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.registerHit();
      });
      expect(result.current.comboState.isActive).toBe(true);
    });
  });

  describe('コンボ倍率', () => {
    it('コンボ1では倍率1.0', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        result.current.registerHit();
      });
      expect(result.current.comboState.multiplier).toBe(1.0);
    });

    it('コンボ2では倍率1.5', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        result.current.registerHit();
        result.current.registerHit();
      });
      expect(result.current.comboState.multiplier).toBe(1.5);
    });

    it('コンボ3では倍率2.0', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 3; i++) result.current.registerHit();
      });
      expect(result.current.comboState.multiplier).toBe(2.0);
    });

    it('コンボ5では倍率3.0', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 5; i++) result.current.registerHit();
      });
      expect(result.current.comboState.multiplier).toBe(3.0);
    });

    it('コンボ8では倍率4.5', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 8; i++) result.current.registerHit();
      });
      expect(result.current.comboState.multiplier).toBe(4.5);
    });

    it('コンボ10以上では最大倍率5.0', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 12; i++) result.current.registerHit();
      });
      expect(result.current.comboState.multiplier).toBe(5.0);
    });
  });

  describe('コンボタイマー', () => {
    it('2秒経過でコンボがリセットされる', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.registerHit();
        result.current.registerHit();
      });
      expect(result.current.comboState.count).toBe(2);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.comboState.count).toBe(0);
      expect(result.current.comboState.isActive).toBe(false);
      expect(result.current.comboState.multiplier).toBe(1.0);
    });

    it('連続ヒットでタイマーがリセットされる', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.registerHit();
      });

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      act(() => {
        result.current.registerHit();
      });
      // タイマーリセットされたのでまだアクティブ
      expect(result.current.comboState.count).toBe(2);
      expect(result.current.comboState.isActive).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1500);
      });
      // 最後のヒットから1.5秒 → まだアクティブ
      expect(result.current.comboState.isActive).toBe(true);

      act(() => {
        jest.advanceTimersByTime(500);
      });
      // 最後のヒットから2秒 → リセット
      expect(result.current.comboState.count).toBe(0);
      expect(result.current.comboState.isActive).toBe(false);
    });
  });

  describe('スキルゲージボーナス', () => {
    it('5コンボごとにスキルゲージボーナスを返す', () => {
      const { result } = renderHook(() => useComboSystem());

      // 5回ヒット
      act(() => {
        for (let i = 0; i < 4; i++) result.current.registerHit();
      });
      expect(result.current.comboState.skillBonus).toBe(0);

      let hitResult: { skillBonus: number } = { skillBonus: 0 };
      act(() => {
        hitResult = result.current.registerHit();
      });
      expect(hitResult.skillBonus).toBe(10);
    });

    it('10コンボで2回目のスキルゲージボーナスを返す', () => {
      const { result } = renderHook(() => useComboSystem());

      let hitResult: { skillBonus: number } = { skillBonus: 0 };
      act(() => {
        for (let i = 0; i < 9; i++) result.current.registerHit();
        hitResult = result.current.registerHit();
      });
      expect(hitResult.skillBonus).toBe(10);
    });
  });

  describe('リセット', () => {
    it('resetComboでコンボを手動リセットできる', () => {
      const { result } = renderHook(() => useComboSystem());

      act(() => {
        result.current.registerHit();
        result.current.registerHit();
      });
      expect(result.current.comboState.count).toBe(2);

      act(() => {
        result.current.resetCombo();
      });
      expect(result.current.comboState.count).toBe(0);
      expect(result.current.comboState.isActive).toBe(false);
      expect(result.current.comboState.multiplier).toBe(1.0);
    });
  });

  describe('コンボ表示テキスト', () => {
    it('コンボ0-1では表示テキストが空', () => {
      const { result } = renderHook(() => useComboSystem());
      expect(result.current.comboState.displayText).toBe('');

      act(() => {
        result.current.registerHit();
      });
      expect(result.current.comboState.displayText).toBe('');
    });

    it('コンボ2では "2 COMBO!" を返す', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 2; i++) result.current.registerHit();
      });
      expect(result.current.comboState.displayText).toBe('2 COMBO!');
    });

    it('コンボ3では "3 COMBO!!" を返す', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 3; i++) result.current.registerHit();
      });
      expect(result.current.comboState.displayText).toBe('3 COMBO!!');
    });

    it('コンボ10以上では "MAX COMBO!!!!!" を返す', () => {
      const { result } = renderHook(() => useComboSystem());
      act(() => {
        for (let i = 0; i < 10; i++) result.current.registerHit();
      });
      expect(result.current.comboState.displayText).toBe('MAX COMBO!!!!!');
    });
  });
});
