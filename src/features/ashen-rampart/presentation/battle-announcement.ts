/**
 * 灰燼の城壁 - 支援技術への読み上げ内容の決定（純粋）
 *
 * **流す基準は要素名ではなく性質で決める**: 「頻度が低く、かつ
 * 取り返しがつかない」出来事のみ。具体的には漏れとウェーブ境界。
 * 撃破・射撃は頻度が高く、読み上げが詰まってかえって情報が失われる
 * （BattleAnnouncer.tsx 冒頭コメント参照）。
 *
 * `useAshenRampartGame` から呼ばれ、結果と一緒に返す `wave` を
 * `lastAnnouncedWave` として次回の呼び出しに渡すガードにする
 * （`lastPreviewRef` と同じ「切り替わった tick でだけ発火する」形）。
 */
import type { CombatState } from '../domain/combat/combat-state';

/** その tick 時点で開始済みのウェーブ数（1 = ウェーブ1が始まっている） */
export const currentWaveNumber = (state: Pick<CombatState, 'waves' | 'tick'>): number =>
  state.waves.filter((w) => w.startTick <= state.tick).length;

export interface AnnouncementDecision {
  /** 読み上げる文言 */
  text: string;
  /** 次回 lastAnnouncedWave として渡す値 */
  wave: number;
}

/**
 * この tick に読み上げるべき内容を決める
 *
 * 漏れとウェーブ境界が同一 tick に重なった場合は**漏れを優先する**。
 * 漏れは「取り返しがつかない」出来事で、ウェーブ境界より優先度が高い
 * （このとき wave は更新するが文言には出さない。取りこぼしたウェーブ境界の
 * 読み上げを次 tick に持ち越して二重に出すことはしない）。
 */
export const decideBattleAnnouncement = (
  state: Pick<CombatState, 'events' | 'tick' | 'life' | 'waves'>,
  lastAnnouncedWave: number
): AnnouncementDecision | undefined => {
  const wave = currentWaveNumber(state);
  const leaks = state.events.filter((e) => e.kind === 'leak').length;
  if (leaks > 0) {
    return { text: `${leaks}体が砦に到達。残りライフ ${state.life}`, wave };
  }
  if (wave > lastAnnouncedWave && wave > 0) {
    return { text: `第${wave}波が始まった`, wave };
  }
  return undefined;
};
