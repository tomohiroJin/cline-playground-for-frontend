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
  STG,
  MODS,
} from '../../constants';
import {
  mergeStyles,
  wPick,
  calcEffBf,
  computePoints,
  comboMult,
  isAdjacentTo,
  computeStageBonus,
  buildSummary,
} from '../../utils';
import type { AnnounceInfo } from '../useGameEngine';
import type { useStore } from '../useStore';
import type { useAudio } from '../useAudio';
import type { PhaseContext } from './types';

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

// ゲームモード
export type GameMode = 'normal' | 'daily' | 'practice';

// ランニングフェーズ：ゲームサイクル・被弾判定・アナウンス・移動・開始
export function useRunningPhase(
  ctx: PhaseContext,
  store: StoreApi,
  audio: AudioApi,
  endGameRef: MutableRefObject<(cleared: boolean) => void>,
  showPerksRef: MutableRefObject<() => void>,
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

  // 障害配置
  const pickObs = useCallback(
    (cfg: RuntimeStageConfig): number[] => {
      const g = gRef.current!;
      const rng = rngRef.current;
      const w = [0.28, 0.36, 0.36];
      const first = wPick(w, [], rng.random.bind(rng));
      const obs = [first];
      if (
        cfg.si >= 2 &&
        rng.chance(0.2 + g.stage * 0.06 + (cfg._dblChance || 0))
      ) {
        const second = wPick(w, obs, rng.random.bind(rng));
        if (second >= 0) obs.push(second);
      }
      return obs;
    },
    [],
  );

  // ステージ継続 / クリア判定
  const cont = useCallback(
    (cfg: RuntimeStageConfig) => {
      const g = gRef.current;
      if (!g?.alive) return;
      if (g.cycle >= cfg.cy) {
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
          forecast: '+' + bn + (g.maxCombo >= 3 ? ' COMBO!' : '') + (g.nearMiss >= 3 ? ' NEAR×' + g.nearMiss : ''),
          buildSummary: '',
        };
        patch({ announce: annInfo });
        g.nearMiss = 0;

        addTimer(() => {
          patch({ announce: null });
          if (g.stage >= g.maxStg) {
            endGameRef.current(true);
          } else {
            showPerksRef.current();
          }
        }, 1600);
      } else {
        nextCycle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 解決：被弾/生存判定
  const resolve = useCallback(
    (obs: number[], cfg: RuntimeStageConfig, pause: number) => {
      const g = gRef.current;
      if (!g?.alive) return;

      // ゴースト記録
      g.ghostLog.push(g.lane);

      // ゴースト再生：デイリーモードのみ位置を更新（patch で React state に反映）
      if (ghostPlayerRef.current && g.dailyMode) {
        const ghostLane = ghostPlayerRef.current.getPosition(g.total);
        ctx.patch({ ghostLane });
      }

      const sheltered = isShelter(g.lane);
      const hit = obs.includes(g.lane) && !sheltered;

      // シェルター吸収
      if (sheltered && obs.includes(g.lane)) {
        g.shelterSaves++;
        showPop(g.lane, '◇SHELTER◇');
        audio.sh();
        setArtTemp('safe', 400);
      }

      // 被弾処理
      if (hit) {
        patch({ shaking: true, flash: true });
        g.artState = 'danger';
        updArt();
        addTimer(() => patch({ shaking: false }), 300);
        addTimer(() => patch({ flash: false }), 550);

        // シールドブロック
        if (g.shields > 0) {
          g.shields--;
          g.frozen = g.st.sp;
          audio.sh();
          showPop(g.lane, '◆SHIELD');
          g.artState = 'shield';
          updArt();
          g.comboCount = 0;
          syncGame();
          clearSegs();
          addTimer(() => {
            if (!gRef.current?.alive) return;
            setArtTemp('idle', 0);
            cont(cfg);
          }, Math.min(pause, 400));
          return;
        }

        // リバイブ
        if (g.revive > 0) {
          g.revive--;
          audio.sh();
          showPop(g.lane, '♥REVIVE');
          g.comboCount = 0;
          syncGame();
          clearSegs();
          addTimer(() => {
            if (!gRef.current?.alive) return;
            setArtTemp('idle', 0);
            cont(cfg);
          }, Math.min(pause, 500));
          return;
        }

        // 死亡
        g.alive = false;
        audio.die();
        g.comboCount = 0;
        updArt();
        syncGame();
        addTimer(() => {
          patch({ flash: false });
          endGameRef.current(false);
        }, 700);
        return;
      }

      // 生存処理
      setArtTemp('safe', 300);
      const adj = isAdjacentTo(obs, g.lane);
      if (adj) g.nearMiss++;

      const mu = laneMultiplier(g.lane);
      const sm = cfg._scoreMod || 1;

      if (g.lane === 2 || mu >= 4) g.riskScore++;
      g.comboCount++;
      if (g.comboCount > g.maxCombo) g.maxCombo = g.comboCount;
      const cm = comboMult(g.comboCount, g.comboBonus);

      let pts: number;
      if (g.frozen > 0) {
        g.frozen--;
        pts = 0;
        showPop(g.lane, 'FROZEN');
      } else if (mu === 0 || isRestricted(g.lane) || sheltered) {
        pts = 0;
        if (sheltered) {
          g.comboCount = 0;
        }
        if (!(sheltered && obs.includes(g.lane))) {
          showPop(g.lane, sheltered ? '×0 避難' : '×0');
        }
      } else {
        pts = computePoints(mu, cm, g.scoreMult, sm, g.baseBonus);
        g.score += pts;
        audio.ok(mu);
        if (g.comboCount >= 3) audio.combo(g.comboCount);
        showPop(g.lane, adj ? '+' + pts + '!' : '+' + pts);
        if (adj) audio.near();
      }

      syncGame();
      addTimer(() => {
        clearSegs();
        if (gRef.current?.alive) cont(cfg);
      }, pause);
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

    let sm = 1;
    if (cfg._calm && g.cycle > cfg.cy * 0.7) sm = 0.7;
    const totalDur =
      cfg.spd * (1 + (g.st.wm || 0) + g.speedMod) * (1 + g.slowMod) * sm;
    const step = totalDur / (ROWS + 1.8);

    let fakeIdx = -1;
    if (cfg.fk && obs.length > 0 && rng.chance(0.2))
      fakeIdx = rng.pick(obs);
    const fog = cfg._fogShift || 0;

    // ビートアニメーション開始
    patch({ beatAnimating: true });
    addTimer(() => patch({ beatAnimating: false }), step * ROWS + 50);

    // カスケードアニメーション
    for (let row = 0; row < ROWS; row++) {
      addTimer(() => {
        const g2 = gRef.current;
        if (!g2?.alive) return;

        const segs = LANES.map((l) =>
          Array(ROWS).fill(isShelter(l) ? 'shield' : null),
        );
        const texts: string[][] = LANES.map((l) =>
          Array(ROWS).fill(isShelter(l) ? '─' : '╳'),
        );

        obs.forEach((l) => {
          const bf = calcEffBf(
            g2.curBf0,
            l,
            g2.bfAdj,
            g2.bfAdj_lane,
            g2.bfAdj_extra,
            fog,
          );
          const shl = isShelter(l);

          if (row >= bf) {
            if (l === fakeIdx && row < ROWS - 2) {
              segs[l][row] = 'fake';
              texts[l][row] = 'SAFE?';
            } else if (shl) {
              segs[l][row] = 'shieldWarn';
              texts[l][row] = '╳';
            } else {
              segs[l][row] = 'warn';
              texts[l][row] = '╳';
            }
          }
          for (let pr = bf; pr < row; pr++) {
            if (segs[l][pr] !== 'danger') {
              segs[l][pr] = shl ? 'shield' : 'danger';
              texts[l][pr] = shl ? '─' : '╳';
            }
          }
        });

        // 接近時の危険ハイライト
        const dangerLanes = row >= ROWS - 3
          ? obs.filter(
              (l) =>
                !isShelter(l) &&
                row >=
                  calcEffBf(g2.curBf0, l, g2.bfAdj, g2.bfAdj_lane, g2.bfAdj_extra, fog),
            )
          : [];

        // サウンド
        if (row < 4) audio.tick();
        else audio.fall(row);

        // 歩行アニメーション
        if (row % 2 === 0) {
          g2.artState = g2.walkFrame % 2 === 0 ? 'walk' : 'idle';
          g2.walkFrame++;
        }
        // 接近警告
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

      const segs = LANES.map((l) =>
        Array(ROWS).fill(isShelter(l) ? 'shield' : null),
      );
      const texts: string[][] = LANES.map((l) =>
        Array(ROWS).fill(isShelter(l) ? '─' : '╳'),
      );

      obs.forEach((l) => {
        const shl = isShelter(l);
        for (let r = 0; r < ROWS; r++) {
          segs[l][r] = shl ? 'shield' : 'danger';
          texts[l][r] = shl ? '─' : '╳';
        }
        if (!shl) {
          segs[l][ROWS - 1] = 'impact';
          texts[l][ROWS - 1] = '╳';
        }
      });

      // 安全レーン表示
      LANES.filter(
        (l) => (!obs.includes(l) && !isRestricted(l)) || isShelter(l),
      ).forEach((l) => {
        const mid = Math.floor(ROWS / 2);
        segs[l][mid] = 'safe';
        texts[l][mid] = isShelter(l) ? 'SHELTER' : '─SAFE─';
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
    const cfg: RuntimeStageConfig = {
      ...STG[Math.min(g.stage, STG.length - 1)],
    };
    g.stageMod = null;
    if (g.stage >= 1 && rng.chance(0.6)) {
      g.stageMod = rng.pick(MODS);
      g.stageMod.fn(cfg);
    }
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
    if (g.stageMod) setTimeout(audio.mod, 300);

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
      setTimeout(() => {
        if (gRef.current) gRef.current.moveOk = true;
      }, g.moveCd);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { nextCycle, resolve, cont, announce, startGame, movePlayer, pickObs };
}

// ゲーム状態ファクトリ
function createGameState(
  eq: string[],
  store: ReturnType<typeof useStore>,
  mode: GameMode = 'normal',
): GameState {
  const base = mergeStyles(eq);
  let mx = store.hasUnlock('stage6') ? 5 : 4;
  if (mode === 'practice') mx = 0; // 練習モード: ステージ1のみ
  const initShields = base.sh + (store.hasUnlock('start_shield') ? 1 : 0);
  const state: GameState = {
    st: {
      mu: [...base.mu],
      rs: [...base.rs],
      sf: [],
      wm: base.wm,
      cm: base.cm,
      sh: base.sh,
      sp: base.sp,
      db: base.db,
      cb: base.cb,
      bfSet: [...base.bfSet],
      autoBlock: base.autoBlock,
    },
    score: 0,
    stage: 0,
    cycle: 0,
    lane: 1 as LaneIndex,
    alive: true,
    phase: 'idle',
    shields: initShields,
    frozen: 0,
    moveOk: true,
    moveCd: Math.max(40, 120 * (1 + base.cm)),
    comboCount: 0,
    maxCombo: 0,
    riskScore: 0,
    total: 0,
    nearMiss: 0,
    scoreMult: 1,
    comboBonus: 0,
    slowMod: 0,
    speedMod: 0,
    revive: 0,
    bfAdj: store.hasUnlock('oracle') ? -2 : 0,
    bfAdj_lane: -1,
    bfAdj_extra: 0,
    baseBonus: store.hasUnlock('score_base') ? 5 : 0,
    perks: [],
    perkChoices: null,
    stageMod: null,
    curStgCfg: null,
    curBf0: [0, 4, 6],
    artState: 'idle',
    maxStg: mx,
    walkFrame: 0,
    artFrame: 0,
    shelterSaves: 0,
    dailyMode: mode === 'daily',
    practiceMode: mode === 'practice',
    ghostLog: [],
  };
  return state;
}
