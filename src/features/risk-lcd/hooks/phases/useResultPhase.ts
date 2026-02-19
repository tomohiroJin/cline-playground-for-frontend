import { useCallback } from 'react';
import { computeRank, GhostRecorder } from '../../utils';
import type { useStore } from '../useStore';
import type { useAudio } from '../useAudio';
import type { PhaseContext } from './types';
import { initRender } from '../useGameEngine';

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

// リザルトフェーズ：ゲーム終了・結果表示・タイトル復帰
export function useResultPhase(
  ctx: PhaseContext,
  store: StoreApi,
  _audio: AudioApi,
) {
  const { gRef, rsRef, clearTimers, patch, syncGame, addTimer } = ctx;

  // ゲーム終了
  const endGame = useCallback(
    (cleared: boolean) => {
      const g = gRef.current;
      if (!g) return;
      clearTimers();
      g.phase = 'done';

      // ゴーストデータ圧縮
      const rec = new GhostRecorder();
      g.ghostLog.forEach(lane => rec.record(lane as 0 | 1 | 2));
      const ghostData = rec.compress();

      // 練習モード: PT なし、ベスト更新なし
      if (g.practiceMode) {
        const rk = computeRank(g.score, cleared, g.stage);
        Object.assign(g, { _cleared: cleared, _rank: rk, _earnedPt: 0, _ghostData: ghostData });
        syncGame();
        addTimer(() => patch({ screen: 'R' }), 350);
        return;
      }

      // デイリーモード: デイリー報酬を計算
      if (g.dailyMode) {
        const dailyReward = store.recordDailyPlay(g.score);
        let ep = Math.floor(g.score * 0.1);
        if (!cleared && g.st.db > 0) ep = Math.floor(ep * (1 + g.st.db));
        ep = Math.max(ep, 1);
        if (store.hasUnlock('gold')) ep *= 2;
        // デイリー報酬を加算（recordDailyPlay で既にPT加算済み）
        store.addPts(ep);
        store.updateBest(g.score, g.stage + 1);
        const rk = computeRank(g.score, cleared, g.stage);
        Object.assign(g, {
          _cleared: cleared,
          _rank: rk,
          _earnedPt: ep + dailyReward,
          _dailyReward: dailyReward,
          _ghostData: ghostData,
        });
        syncGame();
        addTimer(() => patch({ screen: 'R' }), 350);
        return;
      }

      // 通常モード
      let ep = Math.floor(g.score * 0.1);
      if (!cleared && g.st.db > 0) ep = Math.floor(ep * (1 + g.st.db));
      ep = Math.max(ep, 1);
      if (store.hasUnlock('gold')) ep *= 2;

      store.addPts(ep);
      store.updateBest(g.score, g.stage + 1);
      const rk = computeRank(g.score, cleared, g.stage);

      Object.assign(g, { _cleared: cleared, _rank: rk, _earnedPt: ep, _ghostData: ghostData });
      syncGame();
      addTimer(() => patch({ screen: 'R' }), 350);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // タイトルに戻る
  const goTitle = useCallback(() => {
    clearTimers();
    gRef.current = null;
    patch({
      ...initRender(),
      menuIndex: rsRef.current.menuIndex,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { endGame, goTitle };
}
