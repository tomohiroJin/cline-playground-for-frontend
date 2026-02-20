import { bgmTracks } from './bgm-data';

describe('bgm-data', () => {
  it('4トラックが定義されていること', () => {
    expect(bgmTracks).toHaveLength(4);
  });

  it('各トラックに必要なプロパティがあること', () => {
    for (const track of bgmTracks) {
      expect(track.id).toBeDefined();
      expect(track.name).toBeDefined();
      expect(track.bpm).toBeGreaterThan(0);
      expect(track.bars).toBe(8);
      expect(track.melody).toHaveLength(32);
      expect(track.bass).toHaveLength(32);
      expect(track.melodyGain).toBeGreaterThan(0);
      expect(track.bassGain).toBeGreaterThan(0);
    }
  });

  it('トラックIDが一意であること', () => {
    const ids = bgmTracks.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('calm-waterがデフォルトトラックとして存在すること', () => {
    const calmWater = bgmTracks.find(t => t.id === 'calm-water');
    expect(calmWater).toBeDefined();
    expect(calmWater!.bpm).toBe(72);
    expect(calmWater!.melodyWaveform).toBe('sine');
  });
});
