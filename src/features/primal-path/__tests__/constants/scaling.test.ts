/**
 * constants/scaling.ts のテスト
 */
import {
  LOOP_SCALE_FACTOR, ENDLESS_LINEAR_SCALE, ENDLESS_EXP_BASE, ENDLESS_AM_REFLECT_RATIO,
} from '../../constants/scaling';

describe('constants/scaling', () => {
  it('LOOP_SCALE_FACTORが0.5である', () => {
    expect(LOOP_SCALE_FACTOR).toBe(0.5);
  });

  it('ENDLESS_LINEAR_SCALEが0.18である', () => {
    expect(ENDLESS_LINEAR_SCALE).toBe(0.18);
  });

  it('ENDLESS_EXP_BASEが1.15である', () => {
    expect(ENDLESS_EXP_BASE).toBe(1.15);
  });

  it('ENDLESS_AM_REFLECT_RATIOが0.5である', () => {
    expect(ENDLESS_AM_REFLECT_RATIO).toBe(0.5);
  });
});
