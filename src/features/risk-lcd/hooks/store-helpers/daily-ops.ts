import type { SaveData, DailyData } from '../../types';
import { calculateDailyReward } from '../../domain/scoring';

// デイリースコアを記録し、更新後の SaveData と獲得報酬を返す
export function recordDaily(
  data: SaveData,
  score: number,
  today: string,
): { data: SaveData; reward: number } {
  const prev: DailyData =
    data.daily && data.daily.date === today
      ? { ...data.daily }
      : { date: today, played: false, bestScore: 0, firstPlayRewarded: false };

  const { reward } = calculateDailyReward({
    score,
    previousBest: prev.bestScore,
    isFirstPlay: !prev.firstPlayRewarded,
  });

  // デイリーデータ更新
  if (!prev.firstPlayRewarded) {
    prev.firstPlayRewarded = true;
  }
  if (score > prev.bestScore) {
    prev.bestScore = score;
  }
  prev.played = true;

  return {
    data: { ...data, daily: prev, pts: data.pts + reward },
    reward,
  };
}
