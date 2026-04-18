/**
 * キャラクター AI プロファイルのテスト
 */
import { CHARACTER_AI_PROFILES, DEFAULT_PLAY_STYLE, getCharacterAiProfile } from './character-ai-profiles';

describe('DEFAULT_PLAY_STYLE', () => {
  it('デフォルト値が正しい', () => {
    expect(DEFAULT_PLAY_STYLE.sidePreference).toBe(0);
    expect(DEFAULT_PLAY_STYLE.lateralOscillation).toBe(0);
    expect(DEFAULT_PLAY_STYLE.lateralPeriod).toBe(0);
    expect(DEFAULT_PLAY_STYLE.aggressiveness).toBe(0.5);
    expect(DEFAULT_PLAY_STYLE.adaptability).toBe(0);
  });
});

describe('CHARACTER_AI_PROFILES', () => {
  it('全キャラクターの AI プロファイルが定義されている', () => {
    const expectedCharacters = ['hiro', 'misaki', 'takuma', 'yuu', 'rookie', 'regular', 'ace'];
    for (const charId of expectedCharacters) {
      expect(CHARACTER_AI_PROFILES[charId]).toBeDefined();
    }
  });

  describe('パラメータの有効範囲', () => {
    it('全キャラの lateralOscillation が 0 以上', () => {
      for (const [, profile] of Object.entries(CHARACTER_AI_PROFILES)) {
        expect(profile.lateralOscillation).toBeGreaterThanOrEqual(0);
      }
    });

    it('全キャラの aggressiveness が 0-1 の範囲内', () => {
      for (const [, profile] of Object.entries(CHARACTER_AI_PROFILES)) {
        expect(profile.aggressiveness).toBeGreaterThanOrEqual(0);
        expect(profile.aggressiveness).toBeLessThanOrEqual(1);
      }
    });

    it('全キャラの adaptability が 0-1 の範囲内', () => {
      for (const [, profile] of Object.entries(CHARACTER_AI_PROFILES)) {
        expect(profile.adaptability).toBeGreaterThanOrEqual(0);
        expect(profile.adaptability).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('キャラクター固有の特性', () => {
    it('ヒロは揺さぶりなし（lateralOscillation === 0）', () => {
      expect(CHARACTER_AI_PROFILES['hiro'].lateralOscillation).toBe(0);
    });

    it('ミサキは大きな揺さぶり（lateralOscillation > 20）', () => {
      expect(CHARACTER_AI_PROFILES['misaki'].lateralOscillation).toBeGreaterThan(20);
    });

    it('タクマは守備的（aggressiveness < 0.3）', () => {
      expect(CHARACTER_AI_PROFILES['takuma'].aggressiveness).toBeLessThan(0.3);
    });

    it('ユウは高適応（adaptability > 0.5）', () => {
      expect(CHARACTER_AI_PROFILES['yuu'].adaptability).toBeGreaterThan(0.5);
    });
  });
});

describe('getCharacterAiProfile', () => {
  it('既知のキャラ ID でプロファイルを返す', () => {
    const profile = getCharacterAiProfile('hiro');
    expect(profile).toBe(CHARACTER_AI_PROFILES['hiro']);
  });

  it('未知のキャラ ID で DEFAULT_PLAY_STYLE を返す', () => {
    const profile = getCharacterAiProfile('unknown');
    expect(profile).toBe(DEFAULT_PLAY_STYLE);
  });
});

// ── Phase S6-3a: 新フィールド追加テスト ──────────────

describe('S6-3a: AiPlayStyle 新フィールド', () => {
  it('DEFAULT_PLAY_STYLE に新フィールドのデフォルト値が設定されている', () => {
    expect(DEFAULT_PLAY_STYLE.defenseStyle).toBe('center');
    expect(DEFAULT_PLAY_STYLE.deflectionBias).toBe(0);
    expect(DEFAULT_PLAY_STYLE.reactionDelay).toBe(100);
    expect(DEFAULT_PLAY_STYLE.teamRole).toBe('balanced');
  });

  describe('全キャラに新フィールドが定義されている', () => {
    const expectedCharacters = ['hiro', 'misaki', 'takuma', 'yuu', 'rookie', 'regular', 'ace'];

    it('defenseStyle が有効な値', () => {
      for (const charId of expectedCharacters) {
        const profile = CHARACTER_AI_PROFILES[charId];
        expect(['center', 'wide', 'aggressive']).toContain(profile.defenseStyle);
      }
    });

    it('deflectionBias が -1〜1 の範囲', () => {
      for (const charId of expectedCharacters) {
        const profile = CHARACTER_AI_PROFILES[charId];
        expect(profile.deflectionBias).toBeGreaterThanOrEqual(-1);
        expect(profile.deflectionBias).toBeLessThanOrEqual(1);
      }
    });

    it('reactionDelay が 0 以上', () => {
      for (const charId of expectedCharacters) {
        const profile = CHARACTER_AI_PROFILES[charId];
        expect(profile.reactionDelay).toBeGreaterThanOrEqual(0);
      }
    });

    it('teamRole が有効な値', () => {
      for (const charId of expectedCharacters) {
        const profile = CHARACTER_AI_PROFILES[charId];
        expect(['attacker', 'defender', 'balanced']).toContain(profile.teamRole);
      }
    });
  });

  describe('キャラ固有の新パラメータ（spec §3.8 準拠）', () => {
    it('ヒロ: aggressive / ストレート / attacker', () => {
      const p = CHARACTER_AI_PROFILES['hiro'];
      expect(p.defenseStyle).toBe('aggressive');
      expect(p.deflectionBias).toBe(-0.3);
      expect(p.reactionDelay).toBe(50);
      expect(p.teamRole).toBe('attacker');
    });

    it('タクマ: center / ストレート / defender — 鉄壁の守護神', () => {
      const p = CHARACTER_AI_PROFILES['takuma'];
      expect(p.defenseStyle).toBe('center');
      expect(p.deflectionBias).toBe(-0.5);
      expect(p.reactionDelay).toBe(30);
      expect(p.teamRole).toBe('defender');
    });

    it('ミサキ: wide / バウンス / balanced', () => {
      const p = CHARACTER_AI_PROFILES['misaki'];
      expect(p.defenseStyle).toBe('wide');
      expect(p.deflectionBias).toBe(0.5);
      expect(p.reactionDelay).toBe(80);
      expect(p.teamRole).toBe('balanced');
    });

    it('ソウタ: center / 反応遅い（200ms）', () => {
      const p = CHARACTER_AI_PROFILES['rookie'];
      expect(p.defenseStyle).toBe('center');
      expect(p.reactionDelay).toBe(200);
    });
  });
});
