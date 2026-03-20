import { DOMAIN_AI_BEHAVIOR_PRESETS } from './ai-presets';

describe('AI プリセット定数', () => {
  it('easy/normal/hard の3つのプリセットが定義されている', () => {
    expect(DOMAIN_AI_BEHAVIOR_PRESETS.easy).toBeDefined();
    expect(DOMAIN_AI_BEHAVIOR_PRESETS.normal).toBeDefined();
    expect(DOMAIN_AI_BEHAVIOR_PRESETS.hard).toBeDefined();
  });

  it('easy は hard より maxSpeed が低い', () => {
    expect(DOMAIN_AI_BEHAVIOR_PRESETS.easy.maxSpeed)
      .toBeLessThan(DOMAIN_AI_BEHAVIOR_PRESETS.hard.maxSpeed);
  });

  it('hard は壁バウンス予測が有効である', () => {
    expect(DOMAIN_AI_BEHAVIOR_PRESETS.hard.wallBounce).toBe(true);
  });

  it('easy は壁バウンス予測が無効である', () => {
    expect(DOMAIN_AI_BEHAVIOR_PRESETS.easy.wallBounce).toBe(false);
  });
});
