/**
 * constants/index.ts barrel export のテスト
 * 全定数が barrel 経由でアクセスできることを検証
 */
import * as constants from '../../constants';

describe('constants/index（barrel export）', () => {
  it('戦闘定数がエクスポートされている', () => {
    expect(constants.ENM).toBeDefined();
    expect(constants.BOSS).toBeDefined();
    expect(constants.BOSS_CHAIN_SCALE).toBeDefined();
    expect(constants.FINAL_BOSS_ORDER).toBeDefined();
    expect(constants.SPEED_OPTS).toBeDefined();
    expect(constants.WAVES_PER_BIOME).toBeDefined();
    expect(constants.ENEMY_COLORS).toBeDefined();
    expect(constants.ENEMY_DETAILS).toBeDefined();
    expect(constants.ENEMY_SMALL_DETAILS).toBeDefined();
  });

  it('進化定数がエクスポートされている', () => {
    expect(constants.EVOS).toBeDefined();
    expect(constants.SYNERGY_BONUSES).toBeDefined();
    expect(constants.SYNERGY_TAG_INFO).toBeDefined();
  });

  it('バイオーム定数がエクスポートされている', () => {
    expect(constants.BIO).toBeDefined();
    expect(constants.BIOME_COUNT).toBeDefined();
    expect(constants.BIOME_AFFINITY).toBeDefined();
    expect(constants.ENV_DMG).toBeDefined();
  });

  it('難易度定数がエクスポートされている', () => {
    expect(constants.DIFFS).toBeDefined();
  });

  it('スキル定数がエクスポートされている', () => {
    expect(constants.A_SKILLS).toBeDefined();
    expect(constants.SFX_DEFS).toBeDefined();
  });

  it('イベント定数がエクスポートされている', () => {
    expect(constants.RANDOM_EVENTS).toBeDefined();
    expect(constants.EVENT_CHANCE).toBeDefined();
    expect(constants.EVENT_MIN_BATTLES).toBeDefined();
  });

  it('ツリー定数がエクスポートされている', () => {
    expect(constants.TREE).toBeDefined();
    expect(constants.TIER_UNLOCK).toBeDefined();
    expect(constants.TIER_NAMES).toBeDefined();
  });

  it('実績・チャレンジ定数がエクスポートされている', () => {
    expect(constants.ACHIEVEMENTS).toBeDefined();
    expect(constants.CHALLENGES).toBeDefined();
  });

  it('覚醒定数がエクスポートされている', () => {
    expect(constants.AWK_SA).toBeDefined();
    expect(constants.AWK_FA).toBeDefined();
  });

  it('味方定数がエクスポートされている', () => {
    expect(constants.ALT).toBeDefined();
  });

  it('UI定数がエクスポートされている', () => {
    expect(constants.CIV_TYPES).toBeDefined();
    expect(constants.CIV_KEYS).toBeDefined();
    expect(constants.TC).toBeDefined();
    expect(constants.TN).toBeDefined();
    expect(constants.CAT_CL).toBeDefined();
    expect(constants.LOG_COLORS).toBeDefined();
    expect(constants.TB_SUMMARY).toBeDefined();
    expect(constants.TB_DEFAULTS).toBeDefined();
    expect(constants.TB_KEY_COLOR).toBeDefined();
  });

  it('セーブ定数がエクスポートされている', () => {
    expect(constants.FRESH_SAVE).toBeDefined();
    expect(constants.SAVE_KEY).toBeDefined();
    expect(constants.STATS_KEY).toBeDefined();
    expect(constants.ACHIEVEMENTS_KEY).toBeDefined();
    expect(constants.AGGREGATE_KEY).toBeDefined();
    expect(constants.MAX_RUN_STATS).toBeDefined();
  });

  it('スケーリング定数がエクスポートされている', () => {
    expect(constants.LOOP_SCALE_FACTOR).toBeDefined();
    expect(constants.ENDLESS_LINEAR_SCALE).toBeDefined();
    expect(constants.ENDLESS_EXP_BASE).toBeDefined();
    expect(constants.ENDLESS_AM_REFLECT_RATIO).toBeDefined();
  });

  it('オーディオ定数がエクスポートされている', () => {
    expect(constants.BGM_PATTERNS).toBeDefined();
    expect(constants.VOLUME_KEY).toBeDefined();
  });
});
