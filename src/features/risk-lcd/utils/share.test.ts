import { encodeShareUrl, decodeShareUrl, encodeBuild, decodeBuild } from './share';
import { PERKS } from '../constants/game-config';

describe('encodeShareUrl / decodeShareUrl', () => {
  it('エンコード→デコードで元データと一致する', () => {
    const params = {
      score: 3456,
      build: 's:HR_p:Gk.Ss',
      daily: '2026-02-17',
    };
    const url = encodeShareUrl(params);
    expect(url).toContain('rlcd=1');
    expect(url).toContain('score=3456');
    expect(url).toContain('daily=2026-02-17');

    // URLからクエリ部分を抽出
    const search = url.includes('?') ? url.split('?')[1] : url;
    const decoded = decodeShareUrl(search);
    expect(decoded).not.toBeNull();
    expect(decoded!.score).toBe(3456);
    expect(decoded!.build).toBe('s:HR_p:Gk.Ss');
    expect(decoded!.daily).toBe('2026-02-17');
  });

  it('ゴーストデータ付きでも往復可能', () => {
    const params = {
      score: 1000,
      build: 's:St_p:Vu',
      ghost: 'abc123',
    };
    const url = encodeShareUrl(params);
    const search = url.includes('?') ? url.split('?')[1] : url;
    const decoded = decodeShareUrl(search);
    expect(decoded!.ghost).toBe('abc123');
  });

  it('rlcd パラメータがない場合は null を返す', () => {
    expect(decodeShareUrl('score=100&build=x')).toBeNull();
  });

  it('score がない場合は null を返す', () => {
    expect(decodeShareUrl('rlcd=1&build=x')).toBeNull();
  });

  it('build がない場合は null を返す', () => {
    expect(decodeShareUrl('rlcd=1&score=100')).toBeNull();
  });

  it('不正な score は null を返す', () => {
    expect(decodeShareUrl('rlcd=1&score=abc&build=x')).toBeNull();
  });
});

describe('encodeBuild / decodeBuild', () => {
  it('ビルドコードの往復テスト', () => {
    const gamble = PERKS.find(p => p.id === 'gamble')!;
    const speedScore = PERKS.find(p => p.id === 'speed_score')!;
    const code = encodeBuild(['highrisk'], [gamble, speedScore]);
    expect(code).toBe('s:HR_p:Gk.Ss');

    const decoded = decodeBuild(code);
    expect(decoded.styles).toContain('ハイリスク信者');
    expect(decoded.perks).toContain('ギャンブラー');
    expect(decoded.perks).toContain('加速報酬');
  });

  it('複数スタイルのエンコード', () => {
    const shield = PERKS.find(p => p.id === 'shield')!;
    const code = encodeBuild(['standard', 'cautious'], [shield]);
    expect(code).toBe('s:St.Ca_p:Sh');
  });

  it('パークなしのエンコード', () => {
    const code = encodeBuild(['standard'], []);
    expect(code).toBe('s:St_p:');
  });

  it('不正なコードでも空配列を返す', () => {
    const decoded = decodeBuild('invalid');
    expect(decoded.styles).toEqual([]);
    expect(decoded.perks).toEqual([]);
  });
});
