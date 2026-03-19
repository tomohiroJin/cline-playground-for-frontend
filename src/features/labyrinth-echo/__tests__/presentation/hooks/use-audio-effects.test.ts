/**
 * 迷宮の残響 - useAudioEffects テスト
 *
 * ChoiceFeedback に応じた音声再生とフェーズ変更時の BGM 制御をテストする。
 */
import { renderHook } from '@testing-library/react';
import { useAudioEffects } from '../../../presentation/hooks/use-audio-effects';
import type { ChoiceFeedback } from '../../../presentation/hooks/use-audio-effects';

describe('useAudioEffects', () => {
  let mockAudioEngine: {
    init: jest.Mock;
    resume: jest.Mock;
    sfx: Record<string, jest.Mock>;
    bgm: {
      startFloorBgm: jest.Mock;
      stopBgm: jest.Mock;
      setEventMood: jest.Mock;
      updateCrisis: jest.Mock;
      setBgmVolume: jest.Mock;
    };
  };

  beforeEach(() => {
    mockAudioEngine = {
      init: jest.fn(),
      resume: jest.fn(),
      sfx: {
        tick: jest.fn(),
        hit: jest.fn(),
        bigHit: jest.fn(),
        heal: jest.fn(),
        status: jest.fn(),
        clear: jest.fn(),
        floor: jest.fn(),
        over: jest.fn(),
        victory: jest.fn(),
        choice: jest.fn(),
        drain: jest.fn(),
        levelUp: jest.fn(),
        ambient: jest.fn(),
        secondLife: jest.fn(),
      },
      bgm: {
        startFloorBgm: jest.fn(),
        stopBgm: jest.fn(),
        setEventMood: jest.fn(),
        updateCrisis: jest.fn(),
        setBgmVolume: jest.fn(),
      },
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createFeedback = (overrides: Partial<ChoiceFeedback> = {}): ChoiceFeedback => ({
    impact: null,
    statChanges: { hp: 0, mn: 0, inf: 0 },
    drain: null,
    statusAdded: null,
    statusRemoved: null,
    secondLifeActivated: false,
    chainTriggered: false,
    resultText: 'テスト結果',
    ...overrides,
  });

  describe('BGM 制御', () => {
    it('タイトル画面で BGM を停止する', () => {
      // Arrange & Act
      renderHook(() =>
        useAudioEffects({
          phase: 'title',
          floor: 1,
          event: null,
          player: null,
          feedback: null,
          sfxEnabled: true,
          bgmEnabled: true,
          bgmVolume: 0.5,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.bgm.stopBgm).toHaveBeenCalled();
    });

    it('floor_intro でフロア BGM を開始する', () => {
      // Arrange & Act
      renderHook(() =>
        useAudioEffects({
          phase: 'floor_intro',
          floor: 2,
          event: null,
          player: null,
          feedback: null,
          sfxEnabled: true,
          bgmEnabled: true,
          bgmVolume: 0.5,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.bgm.startFloorBgm).toHaveBeenCalledWith(2);
      expect(mockAudioEngine.bgm.setEventMood).toHaveBeenCalledWith('exploration');
    });

    it('BGM 無効時は BGM を停止する', () => {
      // Arrange & Act
      renderHook(() =>
        useAudioEffects({
          phase: 'floor_intro',
          floor: 1,
          event: null,
          player: null,
          feedback: null,
          sfxEnabled: true,
          bgmEnabled: false,
          bgmVolume: 0.5,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.bgm.stopBgm).toHaveBeenCalled();
      expect(mockAudioEngine.bgm.startFloorBgm).not.toHaveBeenCalled();
    });
  });

  describe('ChoiceFeedback に応じた SFX', () => {
    it('大ダメージ時に bigHit 効果音を再生する', () => {
      // Arrange
      const feedback = createFeedback({ impact: 'bigDmg' });

      // Act
      renderHook(() =>
        useAudioEffects({
          phase: 'result',
          floor: 1,
          event: null,
          player: null,
          feedback,
          sfxEnabled: true,
          bgmEnabled: false,
          bgmVolume: 0,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.sfx.bigHit).toHaveBeenCalled();
    });

    it('通常ダメージ時に hit 効果音を再生する', () => {
      // Arrange
      const feedback = createFeedback({ impact: 'dmg' });

      // Act
      renderHook(() =>
        useAudioEffects({
          phase: 'result',
          floor: 1,
          event: null,
          player: null,
          feedback,
          sfxEnabled: true,
          bgmEnabled: false,
          bgmVolume: 0,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.sfx.hit).toHaveBeenCalled();
    });

    it('回復時に heal 効果音を再生する', () => {
      // Arrange
      const feedback = createFeedback({ impact: 'heal' });

      // Act
      renderHook(() =>
        useAudioEffects({
          phase: 'result',
          floor: 1,
          event: null,
          player: null,
          feedback,
          sfxEnabled: true,
          bgmEnabled: false,
          bgmVolume: 0,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.sfx.heal).toHaveBeenCalled();
    });

    it('ステータス追加時に status 効果音を再生する', () => {
      // Arrange
      const feedback = createFeedback({ statusAdded: '負傷' });

      // Act
      renderHook(() =>
        useAudioEffects({
          phase: 'result',
          floor: 1,
          event: null,
          player: null,
          feedback,
          sfxEnabled: true,
          bgmEnabled: false,
          bgmVolume: 0,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      jest.advanceTimersByTime(300);
      expect(mockAudioEngine.sfx.status).toHaveBeenCalled();
    });

    it('ステータス除去時に clear 効果音を再生する', () => {
      // Arrange
      const feedback = createFeedback({ statusRemoved: '負傷' });

      // Act
      renderHook(() =>
        useAudioEffects({
          phase: 'result',
          floor: 1,
          event: null,
          player: null,
          feedback,
          sfxEnabled: true,
          bgmEnabled: false,
          bgmVolume: 0,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      jest.advanceTimersByTime(300);
      expect(mockAudioEngine.sfx.clear).toHaveBeenCalled();
    });

    it('同じ内容の feedback が新しいオブジェクト参照で渡されても SFX を再再生しない', () => {
      // Arrange: 同じ resultText を持つ2つの異なるオブジェクト参照
      const feedback1 = createFeedback({ impact: 'bigDmg', resultText: '同じ結果テキスト' });
      const feedback2 = createFeedback({ impact: 'bigDmg', resultText: '同じ結果テキスト' });
      // 参照が異なることを確認
      expect(feedback1).not.toBe(feedback2);

      const baseProps = {
        phase: 'result' as const,
        floor: 1,
        event: null,
        player: null,
        sfxEnabled: true,
        bgmEnabled: false,
        bgmVolume: 0,
        audioEngine: mockAudioEngine,
      };

      // Act: feedback1 で初回レンダリング
      const { rerender } = renderHook(
        (props: { feedback: ChoiceFeedback }) =>
          useAudioEffects({ ...baseProps, feedback: props.feedback }),
        { initialProps: { feedback: feedback1 } },
      );

      expect(mockAudioEngine.sfx.bigHit).toHaveBeenCalledTimes(1);

      // Act: 同じ内容だが新しいオブジェクト参照の feedback2 で再レンダリング
      rerender({ feedback: feedback2 });

      // Assert: 値ベースの比較により、再再生されないこと
      expect(mockAudioEngine.sfx.bigHit).toHaveBeenCalledTimes(1);
    });

    it('SFX 無効時は効果音を再生しない', () => {
      // Arrange
      const feedback = createFeedback({ impact: 'bigDmg' });

      // Act
      renderHook(() =>
        useAudioEffects({
          phase: 'result',
          floor: 1,
          event: null,
          player: null,
          feedback,
          sfxEnabled: false,
          bgmEnabled: false,
          bgmVolume: 0,
          audioEngine: mockAudioEngine,
        }),
      );

      // Assert
      expect(mockAudioEngine.sfx.bigHit).not.toHaveBeenCalled();
    });
  });
});
