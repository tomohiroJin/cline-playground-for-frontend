// start-campaign-stage の単体テスト

import { getStage } from '../../domain/race/stage-catalog';
import { startCampaignStage } from './start-campaign-stage';

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
});
