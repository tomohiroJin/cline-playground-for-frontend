// start-campaign-stage の単体テスト

import { getStage } from '../../domain/race/stage-catalog';
import { startCampaignStage, resolveCourseIndex } from './start-campaign-stage';

describe('startCampaignStage', () => {
  it('cardsEnabled は常に false', () => {
    const result = startCampaignStage({
      stage: getStage(1),
      livesRemaining: 3,
      baseSpeed: 3.2,
    });
    expect(result.raceConfig.cardsEnabled).toBe(false);
  });

  it('campaignStage が RaceConfig に格納される', () => {
    const stage = getStage(1);
    const result = startCampaignStage({ stage, livesRemaining: 3, baseSpeed: 3.2 });
    expect(result.raceConfig.campaignStage).toBe(stage);
  });

  it('mode は常に solo', () => {
    const result = startCampaignStage({
      stage: getStage(1),
      livesRemaining: 3,
      baseSpeed: 3.2,
    });
    expect(result.raceConfig.mode).toBe('solo');
  });

  it('courseIndex はステージから引き継ぐ', () => {
    const result = startCampaignStage({
      stage: getStage(2),
      livesRemaining: 3,
      baseSpeed: 3.2,
    });
    expect(result.raceConfig.courseIndex).toBe(getStage(2).courseIndex);
  });

  it('maxLaps はステージの lapsToClear', () => {
    const result = startCampaignStage({
      stage: getStage(1),
      livesRemaining: 3,
      baseSpeed: 3.2,
    });
    expect(result.raceConfig.maxLaps).toBe(getStage(1).lapsToClear);
  });

  it('runtime にライフが反映される', () => {
    const result = startCampaignStage({
      stage: getStage(1),
      livesRemaining: 2,
      baseSpeed: 3.2,
    });
    expect(result.runtime.livesRemaining).toBe(2);
  });

  // F1 対応: 分岐ステージで Forest にフォールバックしていたバグの再発防止
  describe('分岐ステージのコース解決', () => {
    it('Stage 3 (分岐) の既定 a で City (index 1) になる', () => {
      const stage3 = getStage(3);
      const result = startCampaignStage({
        stage: stage3,
        livesRemaining: 3,
        baseSpeed: 3.2,
      });
      expect(result.raceConfig.courseIndex).toBe(stage3.branch!.a.courseIndex);
    });

    it('Stage 5 (分岐) の既定 a で Snow (index 5) になる', () => {
      const stage5 = getStage(5);
      const result = startCampaignStage({
        stage: stage5,
        livesRemaining: 3,
        baseSpeed: 3.2,
      });
      expect(result.raceConfig.courseIndex).toBe(stage5.branch!.a.courseIndex);
    });

    it('Stage 8 (分岐) で chosenBranch=b なら b 側のコース', () => {
      const stage8 = getStage(8);
      const result = startCampaignStage({
        stage: stage8,
        livesRemaining: 3,
        baseSpeed: 3.2,
        chosenBranch: 'b',
      });
      expect(result.raceConfig.courseIndex).toBe(stage8.branch!.b.courseIndex);
    });
  });
});

describe('resolveCourseIndex', () => {
  it('通常ステージ: courseIndex を返す', () => {
    expect(resolveCourseIndex(getStage(1))).toBe(0);
    expect(resolveCourseIndex(getStage(2))).toBe(3);
  });

  it('分岐ステージ + chosenBranch=a: branch.a を返す', () => {
    const stage3 = getStage(3);
    expect(resolveCourseIndex(stage3, 'a')).toBe(stage3.branch!.a.courseIndex);
  });

  it('分岐ステージ + chosenBranch=b: branch.b を返す', () => {
    const stage3 = getStage(3);
    expect(resolveCourseIndex(stage3, 'b')).toBe(stage3.branch!.b.courseIndex);
  });

  it('分岐ステージで chosenBranch 未指定なら a 既定', () => {
    const stage5 = getStage(5);
    expect(resolveCourseIndex(stage5)).toBe(stage5.branch!.a.courseIndex);
  });
});
