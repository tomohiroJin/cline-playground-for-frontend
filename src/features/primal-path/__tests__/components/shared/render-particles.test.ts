/**
 * renderParticles ユーティリティテスト
 */
import { renderParticles } from '../../../components/shared/render-particles';

describe('renderParticles', () => {
  it('glacier バイオームでパーティクルが生成される', () => {
    // Arrange & Act
    const result = renderParticles('glacier');

    // Assert
    expect(result.length).toBe(24);
  });

  it('volcano バイオームでパーティクルが生成される', () => {
    // Arrange & Act
    const result = renderParticles('volcano');

    // Assert
    expect(result.length).toBe(24);
  });

  it('grassland バイオームでパーティクルが生成される', () => {
    // Arrange & Act
    const result = renderParticles('grassland');

    // Assert
    expect(result.length).toBe(24);
  });

  it('未知のバイオームでは空配列を返す', () => {
    // Arrange & Act
    const result = renderParticles('final');

    // Assert
    expect(result.length).toBe(0);
  });

  it('カスタムカウントでパーティクル数を指定できる', () => {
    // Arrange & Act
    const result = renderParticles('glacier', 10);

    // Assert
    expect(result.length).toBe(10);
  });
});
