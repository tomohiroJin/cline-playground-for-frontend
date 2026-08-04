/**
 * 灰燼の城壁 - 支援技術への読み上げ内容の決定（純粋）
 *
 * **流す基準は要素名ではなく性質で決める**: 「頻度が低く、かつ
 * 取り返しがつかない」出来事のみ。具体的には漏れ・守り手の消滅
 * （unit-lost）・ウェーブ境界。撃破・射撃・被弾（unit-damaged）は
 * 攻撃間隔ごとに出る高頻度の出来事で、読み上げが詰まってかえって
 * 情報が失われる（BattleAnnouncer.tsx 冒頭コメント参照）。
 * 「unit-lost だから」ではなく「頻度が低く取り返しがつかないから」が
 * 基準であることに注意する（反復2 §14.1: 要素名で書くと、同じ性質を
 * 持つ将来のイベントに基準が伝播しない）。
 *
 * `useAshenRampartGame` から呼ばれ、結果と一緒に返す `wave` を
 * `lastAnnouncedWave` として次回の呼び出しに渡すガードにする
 * （`lastPreviewRef` と同じ「切り替わった tick でだけ発火する」形）。
 */
import type { CombatState, TickEvent } from '../domain/combat/combat-state';
import { getCardDefinition } from '../domain/cards/card-pool';

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
 * 漏れ・守り手の消滅・ウェーブ境界が同一 tick に重なった場合は
 * **漏れ > 守り手の消滅 > ウェーブ境界** の順で優先する。漏れはライフに
 * 直結し最も取り返しがつかないため最優先。守り手の消滅も取り返しは
 * つかないが、ライフそのものではなく盤面の防御力低下なので漏れの次にする。
 * このとき wave は毎回更新するが、取りこぼした低優先の読み上げを次 tick に
 * 持ち越して二重に出すことはしない（文言に出すのは1件だけ）。
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
  const unitLost = state.events.find(
    (e): e is Extract<TickEvent, { kind: 'unit-lost' }> => e.kind === 'unit-lost'
  );
  if (unitLost) {
    return { text: `${getCardDefinition(unitLost.cardId).name}が破壊されました`, wave };
  }
  if (wave > lastAnnouncedWave && wave > 0) {
    return { text: `第${wave}波が始まった`, wave };
  }
  return undefined;
};
