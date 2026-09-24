/**
 * 灰燼の城壁 - 遠征の組み立て（反復7 段階1・設計書 §3.2）
 *
 * 遠征の状態遷移はドメインとユースケースが持っている（反復6）。ここは
 * それを React の状態に載せ、遠征単位のログ（スキーマ v6）を記録するだけにする。
 *
 * **ログの記録は effect か、イベントハンドラの本体で行う。** 状態更新関数の中で
 * 記録すると StrictMode の二重呼び出しで2件になる（useAshenRampartGame と同じ方針）。
 * 記録済みかどうかは ref の Set で判定する。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CombatState } from '../domain/combat/combat-state';
import {
  chooseAcquisition,
  currentStage,
  declineOffer,
  type ExpeditionState,
  type StageResult,
} from '../domain/expedition/expedition-state';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { advanceStage } from '../application/use-cases/advance-stage';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import { LocalStoragePlayLog } from '../infrastructure/play-log/local-storage-play-log';
import {
  CURRENT_ITERATION,
  createExpeditionId,
  type PlayLogPort,
} from '../application/ports/play-log-port';

const TIER3 = 3;

export interface UseExpeditionOptions {
  cards: readonly string[];
  seed: number;
  playLog?: PlayLogPort;
}

/**
 * 候補0枚の提示を自動で辞退する
 *
 * 全獲得札が同名上限に達すると `buildOffer` は空を返し、遠征は `'offer'` のまま
 * 進めなくなる。辞退ボタンは UI に出さない契約（`declineOffer` の docstring）なので、
 * ここで機械的に辞退する——選べる札が無いのだから、プレイヤーの選択ではない。
 */
export const resolveEmptyOffer = (exp: ExpeditionState): ExpeditionState =>
  exp.phase === 'offer' && exp.offer.length === 0 ? declineOffer(exp) : exp;

/** 敗北した遠征でも、挑んだステージが層3 なら到達とみなす（反復7の判定項目7） */
const reachedTier3 = (exp: ExpeditionState): boolean =>
  exp.outcome === 'cleared' || currentStage(exp)?.tier === TIER3;

/** 勝ち抜いたステージ数。敗北では `stageIndex` が負けたステージを指したまま */
const stagesCleared = (exp: ExpeditionState): number =>
  exp.outcome === 'cleared' ? exp.stages.length : exp.stageIndex;

export const useExpedition = ({ cards, seed, playLog }: UseExpeditionOptions) => {
  const logRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [expeditionId] = useState(() => createExpeditionId());
  const [expedition, setExpedition] = useState<ExpeditionState>(() =>
    startExpedition(cards, seed, createSeededRandom)
  );
  const loggedRef = useRef<Set<string>>(new Set());

  /** key ごとに1回だけ記録する（StrictMode の二重実行対策） */
  const recordOnce = useCallback((key: string, record: () => void) => {
    if (loggedRef.current.has(key)) return;
    loggedRef.current.add(key);
    record();
  }, []);

  useEffect(() => {
    recordOnce('expedition_started', () =>
      logRef.current.record({
        kind: 'expedition_started',
        expeditionId,
        iteration: CURRENT_ITERATION,
        seed: expedition.seed,
        stageIds: expedition.stages.map((s) => s.id),
        initialDeckCards: [...expedition.initialDeckCards],
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  useEffect(() => {
    const stage = currentStage(expedition);
    if (expedition.phase !== 'stage' || !stage) return;
    recordOnce(`stage_started:${expedition.stageIndex}`, () =>
      logRef.current.record({
        kind: 'stage_started',
        expeditionId,
        stageIndex: expedition.stageIndex,
        stageId: stage.id,
        tier: stage.tier,
        life: expedition.life,
        deckCards: [...expedition.deckCards],
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  useEffect(() => {
    if (expedition.phase !== 'offer' || expedition.offer.length === 0) return;
    const offerIndex = expedition.stageIndex - 1;
    recordOnce(`card_offered:${offerIndex}`, () =>
      logRef.current.record({
        kind: 'card_offered',
        expeditionId,
        offerIndex,
        offered: [...expedition.offer],
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  useEffect(() => {
    if (expedition.phase !== 'ended' || expedition.outcome === 'running') return;
    const outcome = expedition.outcome;
    recordOnce('expedition_ended', () =>
      logRef.current.record({
        kind: 'expedition_ended',
        expeditionId,
        outcome,
        stagesCleared: stagesCleared(expedition),
        reachedTier3: reachedTier3(expedition),
        acquired: [...expedition.acquired],
        life: expedition.life,
      })
    );
  }, [recordOnce, expeditionId, expedition]);

  // ステージの初期状態は遠征の状態から決定的に作れる（派生シード）。
  // 'stage' 以外で startStage を呼ぶと契約違反で例外になるため、ここで絞る
  const stageCombat: CombatState | undefined = useMemo(
    () => (expedition.phase === 'stage' ? startStage(expedition, createSeededRandom) : undefined),
    [expedition]
  );

  /**
   * 決着を1つの act（再描画前）で2回呼んでも例外にしない（PR #211 Fix B）
   *
   * 決着ボタンの二重クリック等で `setExpedition` の更新関数が再描画前に
   * 2回積まれると、2回目は既に 'stage' でなくなった状態に対して
   * `advanceStage` の `completeStage` が呼ばれ例外になる。'stage' 以外では
   * 何もせず現在の状態を返すことで、2回目以降を無害化する
   */
  const settleStage = useCallback((result: StageResult) => {
    setExpedition((current) =>
      current.phase === 'stage' ? resolveEmptyOffer(advanceStage(current, result, createSeededRandom)) : current
    );
  }, []);

  const acquire = useCallback(
    (cardId: string) => {
      const offerIndex = expedition.stageIndex - 1;
      // 記録は recordOnce で提示回ごとに1回へ絞る（PR #211 Fix A）。
      // 二重クリック等で acquire が再描画前に2回呼ばれると、閉じ込めた
      // expedition はどちらの呼び出しでも同じ提示回を指すため、記録だけを
      // 見るとログが2件になっていた
      recordOnce(`card_acquired:${offerIndex}`, () =>
        logRef.current.record({
          kind: 'card_acquired',
          expeditionId,
          offerIndex,
          cardId,
          offered: [...expedition.offer],
        })
      );
      // 更新関数側でも 'offer' 以外・未提示の cardId を弾く。2回目の呼び出しが
      // 再描画前に積まれると、1回目の chooseAcquisition で phase が
      // 'stage' へ進んだ後の状態に対して2回目が実行され、契約違反で例外になる
      setExpedition((current) =>
        current.phase === 'offer' && current.offer.includes(cardId) ? chooseAcquisition(current, cardId) : current
      );
    },
    [expedition, expeditionId, recordOnce]
  );

  const noteExpedition = useCallback(
    (text: string) => {
      logRef.current.record({ kind: 'expedition_note', expeditionId, text });
    },
    [expeditionId]
  );

  const exportLogJson = useCallback(() => JSON.stringify(logRef.current.exportAll(), null, 2), []);

  return { expeditionId, expedition, stageCombat, settleStage, acquire, noteExpedition, exportLogJson };
};
