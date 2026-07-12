import { tryUseSpeedCharge } from '../services/speed';
import { GameStateBuilder } from '../../__tests__/helpers/game-state-builder';

describe('tryUseSpeedCharge', () => {
  test('チャージがあれば消費して speedBoost が設定される', () => {
    const g = GameStateBuilder.create('EASY').build();
    g.speedCharges = 2;
    expect(tryUseSpeedCharge(g)).toBe(true);
    expect(g.speedCharges).toBe(1);
    expect(g.speedBoost).toBe(10000);
  });

  test('チャージ0では発動できない', () => {
    const g = GameStateBuilder.create('EASY').build();
    g.speedCharges = 0;
    expect(tryUseSpeedCharge(g)).toBe(false);
    expect(g.speedBoost).toBe(0);
  });

  test('隠れ中は発動できない', () => {
    const g = GameStateBuilder.create('EASY').build();
    g.speedCharges = 1;
    g.hiding = true;
    expect(tryUseSpeedCharge(g)).toBe(false);
    expect(g.speedCharges).toBe(1);
  });

  test('加速効果中は再発動できない（無駄撃ち防止）', () => {
    const g = GameStateBuilder.create('EASY').build();
    g.speedCharges = 2;
    g.speedBoost = 5000;
    expect(tryUseSpeedCharge(g)).toBe(false);
    expect(g.speedCharges).toBe(2);
  });
});
