import { useCallback, type MutableRefObject } from 'react';
import type {
  GameState,
  LaneIndex,
  RuntimeStageConfig,
  ArtKey,
} from '../../types';
import {
  ROWS,
  LANES,
  LANE_LABELS,
  MODS,
} from '../../constants';
import { applyHitStateUpdate, applyDodgeStateUpdate } from '../resolve-helpers';
import { calcCycleTiming, pickFakeObstacle } from '../cycle-helpers';
import { renderCascadeFrame, renderFinalFrame } from '../cascade-renderer';
import { renderHitEffect, renderDodgeEffect, type RenderEffectContext } from '../render-effects';
import type { RenderState } from '../useGameEngine';
import { createGameState } from './create-game-state';
import {
  calcEffBf,
  computeStageBonus,
  buildSummary,
} from '../../utils';
import { judgeCycle } from '../../domain/judgment';
import { placeObstacles } from '../../domain/obstacle';
import { isStageCleared, createStageConfig } from '../../domain/stage-progress';
import type { AnnounceInfo } from '../useGameEngine';
import type { useStore } from '../useStore';
import type { useAudio } from '../useAudio';
import type { PhaseContext, PhaseCallbacks } from './types';

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

/** コンボ演出の最低コンボ数 */
const COMBO_THRESHOLD = 3;
/** ニアミス演出の最低回数 */
const NEAR_MISS_THRESHOLD = 3;

/** ステージクリア時の予告テキストを組み立てる */
function formatClearForecast(bonus: number, maxCombo: number, nearMiss: number): string {
  let text = '+' + bonus;
  if (maxCombo >= COMBO_THRESHOLD) text += ' COMBO!';
  if (nearMiss >= NEAR_MISS_THRESHOLD) text += ' NEAR×' + nearMiss;
  return text;
}

// ゲームモード
export type GameMode = 'normal' | 'daily' | 'practice';

// ランニングフェーズ：ゲームサイクル・被弾判定・アナウンス・移動・開始
export function useRunningPhase(
  ctx: PhaseContext,
  store: StoreApi,
  audio: AudioApi,
  callbacksRef: MutableRefObject<PhaseCallbacks>,
  ghostPlayerRef: MutableRefObject<import('../../utils/ghost').GhostPlayer | null>,
) {
  const {
    gRef,
    rng: rngRef,
    addTimer,
    patch,
    syncGame,
    updArt,
    setArtTemp,
    showPop,
    clearSegs,
    isRestricted,
    isShelter,
    laneMultiplier,
    resolveArtKey,
    resolveEmoKey,
  } = ctx;

  // 障害配置（domain/obstacle.ts の純粋関数に委譲）
  const pickObs = useCallback(
    (cfg: RuntimeStageConfig): number[] => {
      const g = gRef.current!;
      return placeObstacles({
        rng: rngRef.current,
        stageConfig: cfg,
        stage: g.stage,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ステージ継続 / クリア判定（domain/stage-progress.ts の純粋関数を使用）
  const cont = useCallback(
    (cfg: RuntimeStageConfig) => {
      const g = gRef.current;
      if (!g?.alive) return;
      if (isStageCleared(g.cycle, cfg)) {
        // ステージクリア
        audio.clr();
        const bn = computeStageBonus(
          g.stage,
          g.st.cb,
          g.scoreMult,
          g.maxCombo,
          g.nearMiss,
        );
        g.score += bn;
        syncGame();

        // クリア演出
        const annInfo: AnnounceInfo = {
          stage: g.stage,
          cycles: cfg.cy,
          mod: null,
          forecast: formatClearForecast(bn, g.maxCombo, g.nearMiss),
          buildSummary: '',
        };
        patch({ announce: annInfo });
        g.nearMiss = 0;

        addTimer(() => {
          patch({ announce: null });
          if (g.stage >= g.maxStg) {
            callbacksRef.current.endGame(true);
          } else {
            callbacksRef.current.showPerks();
          }
        }, 1600);
      } else {
        nextCycle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 描画エフェクト用コンテキスト（resolve / cont の副作用を外部モジュールに委譲）
  // ref 経由で最新のコールバックを参照するため、ラッパー関数で間接参照する
  const effectCtx: RenderEffectContext = {
    gRef,
    patch: (partial: Partial<RenderState>) => patch(partial),
    syncGame,
    updArt,
    setArtTemp,
    showPop,
    clearSegs,
    addTimer,
    laneMultiplier,
    audio,
    cont: (cfg) => cont(cfg),
    endGame: (cleared) => callbacksRef.current.endGame(cleared),
  };

  // 解決：被弾/生存判定（domain/judgment.ts の純粋関数に委譲）
  const resolve = useCallback(
    (obs: number[], cfg: RuntimeStageConfig, pause: number) => {
      const g = gRef.current;
      if (!g?.alive) return;

      // ゴースト記録
      g.ghostLog.push(g.lane);

      // ゴースト再生：デイリーモードのみ位置を更新
      if (ghostPlayerRef.current && g.dailyMode) {
        const ghostLane = ghostPlayerRef.current.getPosition(g.total);
        ctx.patch({ ghostLane });
      }

      // 1. ドメインロジック（純粋関数呼び出し）
      const judgment = judgeCycle({
        playerLane: g.lane,
        obstacles: obs,
        shields: g.shields,
        shelterLanes: g.st.sf,
        restrictedLanes: g.st.rs,
        laneMultiplier: laneMultiplier(g.lane),
        comboCount: g.comboCount,
        comboBonus: g.comboBonus,
        scoreMult: g.scoreMult,
        stageScoreMod: cfg._scoreMod || 1,
        baseBonus: g.baseBonus,
        frozen: g.frozen,
        revive: g.revive,
        maxCombo: g.maxCombo,
      });

      // 2. 被弾処理
      if (judgment.hit) {
        const outcome = applyHitStateUpdate(g, judgment);
        renderHitEffect({ ctx: effectCtx, game: g, outcome, cfg, pause });
        return;
      }

      // 3. 回避処理
      applyDodgeStateUpdate(g, judgment, obs);
      renderDodgeEffect({ ctx: effectCtx, game: g, judgment, obstacles: obs, cfg, pause });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // サイクル進行
  const nextCycle = useCallback(() => {
    const g = gRef.current;
    if (!g?.alive) return;
    const cfg = g.curStgCfg!;
    const rng = rngRef.current;
    g.cycle++;
    g.total++;

    const obs = pickObs(cfg);
    g.curObs = obs;
    g.phase = 'warn';
    g.artState = 'idle';
    g.walkFrame = 0;
    syncGame();
    updArt();

    const { step } = calcCycleTiming({ cfg, wm: g.st.wm || 0, speedMod: g.speedMod, slowMod: g.slowMod, cycle: g.cycle });
    const fakeIdx = pickFakeObstacle(cfg, obs, rng);
    const fog = cfg._fogShift || 0;

    // ビートアニメーション開始
    patch({ beatAnimating: true });
    addTimer(() => patch({ beatAnimating: false }), step * ROWS + 50);

    // カスケードアニメーション
    for (let row = 0; row < ROWS; row++) {
      addTimer(() => {
        const g2 = gRef.current;
        if (!g2?.alive) return;

        const calcBf = (l: number) =>
          calcEffBf(g2.curBf0, l, g2.bfAdj, g2.bfAdj_lane, g2.bfAdj_extra, fog);

        const { segs, texts, dangerLanes } = renderCascadeFrame({
          row, obstacles: obs, fakeIdx, calcBf, isShelter, shelterLanes: g2.st.sf,
        });

        // サウンド
        if (row < 4) audio.tick();
        else audio.fall(row);

        // 歩行アニメーション
        if (row % 2 === 0) {
          g2.artState = g2.walkFrame % 2 === 0 ? 'walk' : 'idle';
          g2.walkFrame++;
        }
        if (row >= ROWS - 3 && obs.includes(g2.lane) && !isShelter(g2.lane)) {
          g2.artState = 'danger';
        }

        patch({
          segments: segs,
          segTexts: texts,
          laneArt: LANES.map((l) => {
            if (dangerLanes.includes(l) && l !== g2.lane) return 'danger' as ArtKey;
            return resolveArtKey(l);
          }) as ArtKey[],
          emoKey: resolveEmoKey(g2),
        });
      }, step * row);
    }

    // ファイナル表示
    addTimer(() => {
      const g2 = gRef.current;
      if (!g2?.alive) return;

      const { segs, texts } = renderFinalFrame({
        obstacles: obs, isShelter, isRestricted, shelterLanes: g2.st.sf,
      });

      audio.wr();
      g2.phase = 'judge';
      g2.artState =
        obs.includes(g2.lane) && !isShelter(g2.lane) ? 'danger' : 'idle';

      patch({
        segments: segs,
        segTexts: texts,
        laneArt: LANES.map((l) => resolveArtKey(l)) as ArtKey[],
        emoKey: resolveEmoKey(g2),
      });
    }, step * ROWS);

    // 解決
    addTimer(() => {
      if (gRef.current?.alive) resolve(obs, cfg, step * 0.9);
    }, step * (ROWS + 0.8));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // アナウンス（ステージ開始）
  const announce = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    const rng = rngRef.current;
    g.phase = 'announce';
    g.cycle = 0;
    if (g.stage === 0) g.shields = g.st.sh;
    g.frozen = 0;
    g.comboCount = 0;
    setArtTemp('idle', 0);

    g.curBf0 = rng.shuffle(g.st.bfSet);
    // モディファイア選択
    g.stageMod = null;
    if (g.stage >= 1 && rng.chance(0.6)) {
      g.stageMod = rng.pick(MODS);
    }
    // ステージ設定生成（domain/stage-progress.ts の純粋関数を使用）
    const cfg = createStageConfig({
      stageIndex: g.stage,
      modifier: g.stageMod ?? undefined,
    });
    g.curStgCfg = cfg;
    syncGame();

    const forecast = g.curBf0
      .map((_, i) => {
        const v =
          ROWS -
          calcEffBf(g.curBf0, i, g.bfAdj, g.bfAdj_lane, g.bfAdj_extra, 0);
        return LANE_LABELS[i] + ':' + v + '段';
      })
      .join(' / ');

    const info: AnnounceInfo = {
      stage: g.stage,
      cycles: cfg.cy,
      mod: g.stageMod,
      forecast: '予告 ' + forecast,
      buildSummary: buildSummary(g),
    };
    patch({ announce: info });
    clearSegs();
    audio.ss();
    if (g.stageMod) addTimer(audio.mod, 300);

    addTimer(() => {
      patch({ announce: null });
      g.phase = 'idle';
      nextCycle();
    }, g.stageMod ? 2200 : 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ゲーム開始
  const startGame = useCallback((mode: GameMode = 'normal') => {
    ctx.clearTimers();
    const rng = rngRef.current;
    const d = store.data;
    const eq = d.eq.filter((id: string) => d.sty.includes(id));
    if (!eq.length) eq.push('standard');
    const g = createGameState(eq, store, mode);
    // autoBlock の避難所設定（RNG 使用）
    if (g.st.autoBlock) {
      const av = ([0, 2] as number[]).filter(
        (l) => !g.st.sf.includes(l),
      );
      if (av.length > 0) g.st.sf.push(rng.pick(av));
    }
    if (store.hasUnlock('start_shield')) g.st.sh++;
    gRef.current = g;
    g.curBf0 = rng.shuffle(g.st.bfSet);
    syncGame();
    patch({ screen: 'G', flash: false, shaking: false, popText: null, ghostLane: undefined });
    announce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // プレイヤー移動
  const movePlayer = useCallback(
    (dir: -1 | 1) => {
      const g = gRef.current;
      if (
        !g?.alive ||
        g.phase === 'announce' ||
        !g.moveOk
      )
        return;
      const n = g.lane + dir;
      if (n < 0 || n > 2) return;
      if (isRestricted(n)) {
        audio.er();
        return;
      }
      g.lane = n as LaneIndex;
      g.moveOk = false;
      if (isShelter(n)) audio.sel();
      else audio.mv();
      updArt();
      syncGame();
      addTimer(() => {
        if (gRef.current) gRef.current.moveOk = true;
      }, g.moveCd);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { nextCycle, resolve, cont, announce, startGame, movePlayer, pickObs };
}
