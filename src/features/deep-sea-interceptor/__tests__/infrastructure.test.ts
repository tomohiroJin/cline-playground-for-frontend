// ============================================================================
// Deep Sea Interceptor - インフラ層のテスト
// ============================================================================

import { createNullAudioSystem } from '../infrastructure/audio/audio-system';
import { createLocalScoreRepository } from '../infrastructure/storage/score-repository';
import { createEmptyInputState } from '../infrastructure/input/input-handler';

describe('NullAudioSystem', () => {
  it('init を呼んでもエラーにならないこと', () => {
    // Arrange
    const audio = createNullAudioSystem();

    // Act & Assert
    expect(() => audio.init()).not.toThrow();
  });

  it('play を呼んでもエラーにならないこと', () => {
    // Arrange
    const audio = createNullAudioSystem();

    // Act & Assert
    expect(() => audio.play('shot')).not.toThrow();
  });
});

describe('LocalScoreRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存されたハイスコアを取得できること', () => {
    // Arrange
    const repo = createLocalScoreRepository();
    repo.saveScore('test_highscore', 5000);

    // Act
    const score = repo.getHighScore('test_highscore');

    // Assert
    expect(score).toBe(5000);
  });

  it('保存データがない場合は0を返すこと', () => {
    // Arrange
    const repo = createLocalScoreRepository();

    // Act
    const score = repo.getHighScore('nonexistent');

    // Assert
    expect(score).toBe(0);
  });
});

describe('InputState', () => {
  it('初期入力状態が全てゼロ/falseであること', () => {
    // Act
    const state = createEmptyInputState();

    // Assert
    expect(state.dx).toBe(0);
    expect(state.dy).toBe(0);
    expect(state.shoot).toBe(false);
    expect(state.chargeStart).toBe(false);
    expect(state.chargeEnd).toBe(false);
  });
});
