/**
 * 次ウェーブ予告の文字列組み立てのテスト
 */
import { nextWavePreview } from './wave-preview';
import { PLAINS_WAVES } from '../domain/combat/waves';

describe('nextWavePreview', () => {
  it('tick 0 では最初の次ウェーブ（雑兵2 俊足2）が予告される', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 0 })).toBe('雑兵2 俊足2');
  });

  it('tick が進んでも次ウェーブ開始 tick を超えなければ予告は変わらない', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 259 })).toBe('雑兵2 俊足2');
  });

  it('次ウェーブ開始 tick に到達すると、その次のウェーブへ予告が切り替わる', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 260 })).toBe('群れ22');
  });

  it('最終ウェーブ開始後は固定文言になる', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 820 })).toBe('これが最後の波');
  });
});
