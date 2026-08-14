/**
 * 次ウェーブ予告の文字列組み立てのテスト
 */
import { nextWavePreview } from './wave-preview';
import { PLAINS_WAVES } from '../domain/combat/waves';

describe('nextWavePreview', () => {
  it('tick 0 では最初の次ウェーブ（北 雑兵2 / 南 俊足2）がレーン付きで予告される', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 0 })).toBe('北 雑兵2 / 南 俊足2');
  });

  it('tick が進んでも次ウェーブ開始 tick を超えなければ予告は変わらない', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 259 })).toBe('北 雑兵2 / 南 俊足2');
  });

  it('次ウェーブ開始 tick に到達すると、その次のウェーブへ予告が切り替わる（南レーンのみなら南だけ出す）', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 260 })).toBe('南 群れ22');
  });

  it('同じレーンに複数エントリがあるウェーブは1つのレーン表記へ合流する', () => {
    // ウェーブ4: 北=重装+雑兵、南=鴉。北の2エントリが「北 重装4 雑兵4」に合流することを確認する
    // （体数は反復5 の較正で 2/2 → 4/4。waves.ts の docstring 参照）
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 540 })).toBe('北 重装4 雑兵4 / 南 鴉13');
  });

  it('最終ウェーブ開始後は固定文言になる', () => {
    expect(nextWavePreview({ waves: PLAINS_WAVES, tick: 820 })).toBe('これが最後の波');
  });
});
