/**
 * 灰燼の城壁 - 途中でやめた遠征の記録（反復7 段階2・設計書 §4.0 c）
 *
 * 判定（設計書 §2）は、途中でやめた遠征を3遠征にも各項目の分母にも数えない。
 * そのためには「やめた」ことがログから読めなければならない。
 *
 * アンマウント時に記録すると StrictMode の二重実行で誤発火するので、
 * **次の遠征を始めるとき**にログを読み返し、`expedition_started` があって
 * `expedition_ended` も `expedition_abandoned` も無い遠征を閉じる。
 *
 * 置き場所を application にしたのは、入力が `PlayLogEvent`（ports の型）であり、
 * domain からは ports を import できないため。記録は PlayLogPort 経由の副作用
 * なので、presentation からはこのユースケースを呼ぶ（層の規則）。
 */
import type { PlayLogEvent, PlayLogPort } from '../ports/play-log-port';

/** ステージを1つも始めずにやめた遠征の lastStageIndex */
export const NO_STAGE_STARTED = -1;

export interface AbandonedExpedition {
  expeditionId: string;
  /** 最後に記録された stage_started.stageIndex。無ければ NO_STAGE_STARTED */
  lastStageIndex: number;
}

/**
 * 決着の無い遠征を開始順に返す（純粋）
 *
 * `currentExpeditionId` は必ず除く。StrictMode の再マウントでは、1回目の effect の
 * 後に今回の `expedition_started` が記録されてから2回目の走査が走るため、
 * 除かないと今回の遠征そのものを「放棄」と記録してしまう。
 */
export const findAbandonedExpeditions = (
  events: readonly PlayLogEvent[],
  currentExpeditionId: string
): AbandonedExpedition[] => {
  const startedIds: string[] = [];
  const closedIds = new Set<string>();
  const lastStageById = new Map<string, number>();
  events.forEach((event) => {
    if (event.kind === 'expedition_started') startedIds.push(event.expeditionId);
    if (event.kind === 'stage_started') lastStageById.set(event.expeditionId, event.stageIndex);
    if (event.kind === 'expedition_ended' || event.kind === 'expedition_abandoned') {
      closedIds.add(event.expeditionId);
    }
  });
  return [...new Set(startedIds)]
    .filter((id) => id !== currentExpeditionId && !closedIds.has(id))
    .map((expeditionId) => ({
      expeditionId,
      lastStageIndex: lastStageById.get(expeditionId) ?? NO_STAGE_STARTED,
    }));
};

/**
 * 決着の無い遠征を expedition_abandoned で閉じる
 *
 * 記録した放棄は次の exportAll に現れるため、二度呼んでも二重にならない。
 */
export const recordAbandonedExpeditions = (
  log: PlayLogPort,
  currentExpeditionId: string
): AbandonedExpedition[] => {
  const abandoned = findAbandonedExpeditions(log.exportAll().events, currentExpeditionId);
  abandoned.forEach(({ expeditionId, lastStageIndex }) =>
    log.record({ kind: 'expedition_abandoned', expeditionId, lastStageIndex })
  );
  return abandoned;
};
