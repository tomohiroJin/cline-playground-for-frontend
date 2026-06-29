/**
 * 迷宮の残響 - シミュレーション選択ポリシー
 *
 * 1イベントに対する選択方針を集約する。RunPolicy の実装群。
 */
import { processChoice } from '../events/event-utils';
import type { RunPolicy } from './run-simulator';

/** 慎重ポリシー: 解決後 hp+mn 最良の選択肢を貪欲選択（脱出を最優先） */
export const CAREFUL_POLICY: RunPolicy = {
  choose(event, player, fx, diff) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < event.ch.length; i++) {
      const res = processChoice({ event, choiceIdx: i, player, fx, diff });
      const score = res.outcome.fl === 'escape'
        ? Number.POSITIVE_INFINITY
        : res.drained.hp + res.drained.mn;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  },
};

/** 無策ポリシー: 一様ランダム選択 */
export const RANDOM_POLICY: RunPolicy = {
  choose(event, _player, _fx, _diff, rng) {
    return Math.floor(rng.random() * event.ch.length);
  },
};

/** ロアハンター: 読み解き選択肢(fl:"frag:")があれば必ず読む。なければ careful。 */
export const LORE_POLICY: RunPolicy = {
  choose(event, player, fx, diff, rng) {
    const fragIdx = event.ch.findIndex(c => c.o?.some(o => typeof o.fl === 'string' && o.fl.startsWith('frag:')));
    if (fragIdx >= 0) return fragIdx;
    return CAREFUL_POLICY.choose(event, player, fx, diff, rng);
  },
};
