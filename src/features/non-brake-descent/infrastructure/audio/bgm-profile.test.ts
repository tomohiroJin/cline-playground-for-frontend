import { selectBgmProfile, BgmNote, BgmProfile } from './bgm-profile';
import { SpeedRank } from '../../constants';

/**
 * bgm-profile モジュールのテスト
 *
 * 速度ランク（LOW/MID/HIGH）に応じた BGM プロファイルを返す純粋関数を検証する。
 */
describe('selectBgmProfile', () => {
  // --- 正常系: 各ランクで異なるプロファイルが返る ---

  describe('正常系: SpeedRank.LOW（ランク0）', () => {
    it('BgmProfile 型の値を返す', () => {
      // Arrange: LOW ランク
      const rank = SpeedRank.LOW;

      // Act: プロファイル取得
      const profile: BgmProfile = selectBgmProfile(rank);

      // Assert: 型が合っている（notes と interval を持つ）
      expect(Array.isArray(profile.notes)).toBe(true);
      expect(typeof profile.interval).toBe('number');
    });

    it('notes が空でない', () => {
      // Arrange / Act
      const profile = selectBgmProfile(SpeedRank.LOW);

      // Assert: 少なくとも1音以上定義されている
      expect(profile.notes.length).toBeGreaterThan(0);
    });

    it('notes の各要素が [number, number] タプルである', () => {
      // Arrange / Act
      const profile = selectBgmProfile(SpeedRank.LOW);

      // Assert: 各ノートが配列で2要素（周波数・長さ）を持つ
      profile.notes.forEach((note: BgmNote) => {
        expect(note).toHaveLength(2);
        expect(typeof note[0]).toBe('number');
        expect(typeof note[1]).toBe('number');
      });
    });

    it('interval が正の数値である', () => {
      // Arrange / Act
      const profile = selectBgmProfile(SpeedRank.LOW);

      // Assert: ループ間隔は正数
      expect(profile.interval).toBeGreaterThan(0);
    });
  });

  describe('正常系: SpeedRank.MID（ランク1）', () => {
    it('BgmProfile 型の値を返す', () => {
      const profile: BgmProfile = selectBgmProfile(SpeedRank.MID);
      expect(Array.isArray(profile.notes)).toBe(true);
      expect(typeof profile.interval).toBe('number');
    });

    it('notes が空でない', () => {
      const profile = selectBgmProfile(SpeedRank.MID);
      expect(profile.notes.length).toBeGreaterThan(0);
    });

    it('interval が正の数値である', () => {
      const profile = selectBgmProfile(SpeedRank.MID);
      expect(profile.interval).toBeGreaterThan(0);
    });
  });

  describe('正常系: SpeedRank.HIGH（ランク2）', () => {
    it('BgmProfile 型の値を返す', () => {
      const profile: BgmProfile = selectBgmProfile(SpeedRank.HIGH);
      expect(Array.isArray(profile.notes)).toBe(true);
      expect(typeof profile.interval).toBe('number');
    });

    it('notes が空でない', () => {
      const profile = selectBgmProfile(SpeedRank.HIGH);
      expect(profile.notes.length).toBeGreaterThan(0);
    });

    it('interval が正の数値である', () => {
      const profile = selectBgmProfile(SpeedRank.HIGH);
      expect(profile.interval).toBeGreaterThan(0);
    });
  });

  // --- 正常系: 各ランクで「異なる」プロファイルが返る ---

  describe('正常系: ランクによるプロファイルの差異', () => {
    it('LOW / MID / HIGH それぞれで異なる interval が返る', () => {
      // Arrange / Act
      const low = selectBgmProfile(SpeedRank.LOW);
      const mid = selectBgmProfile(SpeedRank.MID);
      const high = selectBgmProfile(SpeedRank.HIGH);

      // Assert: 全ランクの interval が異なる
      expect(low.interval).not.toBe(mid.interval);
      expect(mid.interval).not.toBe(high.interval);
      expect(low.interval).not.toBe(high.interval);
    });

    it('HIGH の interval が最も短い（最速テンポ）', () => {
      // Arrange / Act
      const low = selectBgmProfile(SpeedRank.LOW);
      const mid = selectBgmProfile(SpeedRank.MID);
      const high = selectBgmProfile(SpeedRank.HIGH);

      // Assert: HIGH < MID < LOW の順に間隔が短くなる
      expect(high.interval).toBeLessThan(mid.interval);
      expect(high.interval).toBeLessThan(low.interval);
    });

    it('MID の interval が LOW より短い', () => {
      const low = selectBgmProfile(SpeedRank.LOW);
      const mid = selectBgmProfile(SpeedRank.MID);

      expect(mid.interval).toBeLessThan(low.interval);
    });
  });

  // --- 境界値: 未知のランクは LOW にフォールバック ---

  describe('境界値: 未知の rank でのフォールバック', () => {
    it('rank -1 は LOW プロファイルと同じ結果を返す', () => {
      // Arrange
      const lowProfile = selectBgmProfile(SpeedRank.LOW);

      // Act: 範囲外（負値）
      const fallback = selectBgmProfile(-1);

      // Assert: LOW と同等のプロファイル
      expect(fallback.interval).toBe(lowProfile.interval);
      expect(fallback.notes).toEqual(lowProfile.notes);
    });

    it('rank 99 は LOW プロファイルと同じ結果を返す', () => {
      // Arrange
      const lowProfile = selectBgmProfile(SpeedRank.LOW);

      // Act: 範囲外（大きな正値）
      const fallback = selectBgmProfile(99);

      // Assert: LOW と同等のプロファイル
      expect(fallback.interval).toBe(lowProfile.interval);
      expect(fallback.notes).toEqual(lowProfile.notes);
    });

    it('rank 3 は LOW プロファイルと同じ結果を返す', () => {
      // Arrange
      const lowProfile = selectBgmProfile(SpeedRank.LOW);

      // Act: SpeedRank の最大値を1超えた値
      const fallback = selectBgmProfile(3);

      // Assert: LOW と同等のプロファイル
      expect(fallback.interval).toBe(lowProfile.interval);
      expect(fallback.notes).toEqual(lowProfile.notes);
    });
  });

  // --- 境界値: notes の音符値の妥当性 ---

  describe('境界値: notes の音符値', () => {
    it('全プロファイルの周波数は 0 以上である（0 は休符）', () => {
      // Arrange: 全ランクを検証
      const ranks = [SpeedRank.LOW, SpeedRank.MID, SpeedRank.HIGH];

      ranks.forEach((rank) => {
        // Act
        const profile = selectBgmProfile(rank);

        // Assert: 周波数は非負
        profile.notes.forEach((note: BgmNote) => {
          expect(note[0]).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('全プロファイルの音符長さは正の数である', () => {
      // Arrange: 全ランクを検証
      const ranks = [SpeedRank.LOW, SpeedRank.MID, SpeedRank.HIGH];

      ranks.forEach((rank) => {
        // Act
        const profile = selectBgmProfile(rank);

        // Assert: 音符の長さは正数
        profile.notes.forEach((note: BgmNote) => {
          expect(note[1]).toBeGreaterThan(0);
        });
      });
    });
  });
});
