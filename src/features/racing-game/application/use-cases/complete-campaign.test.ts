// complete-campaign の単体テスト

import { createInitialProgress, unlockNextStage, updateBestRecord } from '../../domain/race/campaign-progress';
import { completeCampaign } from './complete-campaign';

describe('completeCampaign', () => {
  it('未完了なら shouldShowEnding は false', () => {
    expect(completeCampaign(createInitialProgress()).shouldShowEnding).toBe(false);
  });

  it('全 8 ステージクリア後は shouldShowEnding が true', () => {
    let p = createInitialProgress();
    for (let i = 1; i <= 8; i++) {
      const id = i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      p = unlockNextStage(p, id);
      p = updateBestRecord(p, id, { bestTimeSec: 50, rank: 'GOLD' });
    }
    expect(completeCampaign(p).shouldShowEnding).toBe(true);
  });
});
