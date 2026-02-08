import { useState, useCallback, useRef } from 'react';
import type {
  ScreenId,
  GameState,
  LaneIndex,
  ArtKey,
  EmoKey,
  InputAction,
  RuntimeStageConfig,
  PerkDef,
  ModDef,
} from '../types';
import {
  ROWS,
  LANES,
  LANE_LABELS,
  STG,
  STY_KEYS,
  SHP,
  MODS,
  PERKS,
  STACKABLE_PERKS,
  MENUS,
} from '../constants';
import {
  Rand,
  mergeStyles,
  computeRank,
  comboMult,
  calcEffBf,
  visLabel,
  wPick,
  computePoints,
  computeStageBonus,
  buildSummary,
  isAdjacentTo,
} from '../utils';
import type { useStore } from './useStore';
import type { useAudio } from './useAudio';

// ── セグメント表示状態 ──
export type SegState =
  | 'ghost'
  | 'warn'
  | 'danger'
  | 'impact'
  | 'safe'
  | 'near'
  | 'fake'
  | 'shield'
  | 'shieldWarn';

// ── アナウンス表示データ ──
export interface AnnounceInfo {
  stage: number;
  cycles: number;
  mod: ModDef | null;
  forecast: string;
  buildSummary: string;
}

// ── レンダリング用の状態 ──
export interface RenderState {
  screen: ScreenId;
  game: GameState | null;
  menuIndex: number;
  listIndex: number;
  perkIndex: number;
  announce: AnnounceInfo | null;
  segments: (SegState | null)[][];
  segTexts: string[][];
  beatAnimating: boolean;
  flash: boolean;
  shaking: boolean;
  popText: { lane: number; text: string; id: number } | null;
  laneArt: ArtKey[];
  emoKey: EmoKey;
}

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

// 初期レンダリング状態
function initRender(): RenderState {
  const segs: (SegState | null)[][] = LANES.map(() =>
    Array(ROWS).fill(null),
  );
  const texts: string[][] = LANES.map(() => Array(ROWS).fill('╳'));
  return {
    screen: 'T',
    game: null,
    menuIndex: 0,
    listIndex: 0,
    perkIndex: 0,
    announce: null,
    segments: segs,
    segTexts: texts,
    beatAnimating: false,
    flash: false,
    shaking: false,
    popText: null,
    laneArt: ['ghost', 'idle', 'ghost'],
    emoKey: 'idle',
  };
}

// ── メインゲームエンジンフック ──
export function useGameEngine(store: StoreApi, audio: AudioApi) {
  const [rs, setRs] = useState<RenderState>(initRender);

  // ゲーム状態（ミュータブル、高速アクセス用）
  const gRef = useRef<GameState | null>(null);
  const rsRef = useRef(rs);
  rsRef.current = rs;

  // タイマー管理
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const popIdRef = useRef(0);

  // タイマー追加
  const addTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  // 全タイマークリア
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // レンダリング状態を部分更新
  const patch = useCallback((partial: Partial<RenderState>) => {
    setRs((prev) => {
      const next = { ...prev, ...partial };
      rsRef.current = next;
      return next;
    });
  }, []);

  // ゲーム状態をレンダリングに反映
  const syncGame = useCallback(() => {
    const g = gRef.current;
    if (g) patch({ game: { ...g } });
  }, [patch]);

  // ── ヘルパー関数 ──
  const isRestricted = (lane: number): boolean =>
    gRef.current?.st.rs.includes(lane) ?? false;
  const isShelter = (lane: number): boolean =>
    gRef.current?.st.sf.includes(lane) ?? false;
  const laneMultiplier = (lane: number): number =>
    gRef.current?.st.mu[lane] ?? 1;

  // セグメント状態をクリア
  const clearSegs = useCallback(() => {
    const g = gRef.current;
    const segs: (SegState | null)[][] = LANES.map((l) =>
      Array(ROWS).fill(isShelter(l) ? 'shield' : null),
    );
    const texts: string[][] = LANES.map((l) =>
      Array(ROWS).fill(isShelter(l) ? '─' : '╳'),
    );
    patch({
      segments: segs,
      segTexts: texts,
      shaking: false,
      laneArt: LANES.map((l) => resolveArtKey(l)) as ArtKey[],
      emoKey: resolveEmoKey(g),
    });
  }, [patch]);

  // アート状態の解決
  const resolveArtKey = (lane: number): ArtKey => {
    const g = gRef.current;
    if (!g || lane !== g.lane) return 'ghost';
    if (!g.alive) return 'dead';
    if (g.shields > 0 && store.hasUnlock('ui_art')) return 'shield';
    if (g.comboCount >= 4 && store.hasUnlock('ui_art')) return 'combo';
    if (g.artState === 'danger') return 'danger';
    if (g.artState === 'walk') return 'walk';
    if (g.artState === 'safe') return 'safe';
    return 'idle';
  };

  const resolveEmoKey = (g: GameState | null): EmoKey => {
    if (!g) return 'idle';
    if (!g.alive) return 'dead';
    const art = resolveArtKey(g.lane);
    if (art === 'ghost' || art === 'idle') return 'idle';
    return art as EmoKey;
  };

  // アート状態の更新とレンダリング
  const updArt = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    g.artFrame = (g.artFrame || 0) + 1;
    patch({
      laneArt: LANES.map((l) => resolveArtKey(l)) as ArtKey[],
      emoKey: resolveEmoKey(g),
    });
  }, [patch, store]);

  // 一時的なアート状態変更
  const setArtTemp = useCallback(
    (state: ArtKey, ms: number) => {
      const g = gRef.current;
      if (!g) return;
      g.artState = state;
      updArt();
      if (ms > 0)
        addTimer(() => {
          if (gRef.current?.alive) {
            gRef.current.artState = 'idle';
            updArt();
          }
        }, ms);
    },
    [updArt, addTimer],
  );

  // ポップテキスト表示
  const showPop = useCallback(
    (lane: number, text: string) => {
      const id = ++popIdRef.current;
      patch({ popText: { lane, text, id } });
      addTimer(() => {
        setRs((prev) =>
          prev.popText?.id === id ? { ...prev, popText: null } : prev,
        );
      }, 600);
    },
    [patch, addTimer],
  );

  // ── ゲーム状態ファクトリ ──
  const createGameState = useCallback(
    (eq: string[]): GameState => {
      const base = mergeStyles(eq);
      const mx = store.hasUnlock('stage6') ? 5 : 4;
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
      };
      if (base.autoBlock) {
        const av = ([0, 2] as number[]).filter(
          (l) => !state.st.sf.includes(l),
        );
        if (av.length > 0) state.st.sf.push(Rand.pick(av));
      }
      if (store.hasUnlock('start_shield')) state.st.sh++;
      return state;
    },
    [store],
  );

  // ── 障害配置 ──
  const pickObs = useCallback(
    (cfg: RuntimeStageConfig): number[] => {
      const g = gRef.current!;
      const w = [0.28, 0.36, 0.36];
      const first = wPick(w, []);
      const obs = [first];
      if (
        cfg.si >= 2 &&
        Rand.chance(0.2 + g.stage * 0.06 + (cfg._dblChance || 0))
      ) {
        const second = wPick(w, obs);
        if (second >= 0) obs.push(second);
      }
      return obs;
    },
    [],
  );

  // ── ステージ継続 / クリア判定 ──
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
            endGame(true);
          } else {
            showPerks();
          }
        }, 1600);
      } else {
        nextCycle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── 解決：被弾/生存判定 ──
  const resolve = useCallback(
    (obs: number[], cfg: RuntimeStageConfig, pause: number) => {
      const g = gRef.current;
      if (!g?.alive) return;

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
        // 被弾エフェクト
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
          endGame(false);
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

  // ── サイクル進行 ──
  const nextCycle = useCallback(() => {
    const g = gRef.current;
    if (!g?.alive) return;
    const cfg = g.curStgCfg!;
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
    if (cfg.fk && obs.length > 0 && Rand.chance(0.2))
      fakeIdx = Rand.pick(obs);
    const fog = cfg._fogShift || 0;

    // ビートアニメーション開始
    patch({ beatAnimating: true });
    addTimer(() => patch({ beatAnimating: false }), step * ROWS + 50);

    // カスケードアニメーション
    for (let row = 0; row < ROWS; row++) {
      addTimer(() => {
        const g2 = gRef.current;
        if (!g2?.alive) return;

        // セグメント状態を構築
        const segs: (SegState | null)[][] = LANES.map((l) =>
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

      const segs: (SegState | null)[][] = LANES.map((l) =>
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

  // ── アナウンス（ステージ開始） ──
  const announce = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    g.phase = 'announce';
    g.cycle = 0;
    if (g.stage === 0) g.shields = g.st.sh;
    g.frozen = 0;
    g.comboCount = 0;
    setArtTemp('idle', 0);

    g.curBf0 = Rand.shuffle(g.st.bfSet);
    const cfg: RuntimeStageConfig = {
      ...STG[Math.min(g.stage, STG.length - 1)],
    };
    g.stageMod = null;
    if (g.stage >= 1 && Rand.chance(0.6)) {
      g.stageMod = Rand.pick(MODS);
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

  // ── パーク選択画面 ──
  const showPerks = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    g.phase = 'perks';

    const pool = PERKS.filter(
      (p) => !g.perks.find((x) => x.id === p.id) || STACKABLE_PERKS.has(p.id),
    );
    const shuffled = Rand.shuffle(pool);
    const numP = store.hasUnlock('perk4') ? 4 : 3;
    const risks = shuffled.filter((p) => p.tp === 'risk');
    const buffs = shuffled.filter((p) => p.tp === 'buff');

    let picks: PerkDef[];
    if (risks.length > 0 && buffs.length >= numP - 1) {
      picks = [...buffs.slice(0, numP - 1), risks[0]];
    } else {
      picks = shuffled.slice(0, numP);
    }
    picks = Rand.shuffle(picks);
    g.perkChoices = picks;
    syncGame();
    patch({ perkIndex: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // パーク選択実行
  const selectPerk = useCallback(() => {
    const g = gRef.current;
    if (!g?.perkChoices) return;
    const pk = g.perkChoices[rsRef.current.perkIndex];
    if (!pk) return;
    audio.pk();
    pk.fn(g);
    g.perks.push(pk);
    g.perkChoices = null;
    g.phase = 'idle';
    g.stage++;
    g.maxCombo = 0;
    g.nearMiss = 0;
    syncGame();
    announce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ゲーム終了 ──
  const endGame = useCallback(
    (cleared: boolean) => {
      const g = gRef.current;
      if (!g) return;
      clearTimers();
      g.phase = 'done';

      let ep = Math.floor(g.score * 0.1);
      if (!cleared && g.st.db > 0) ep = Math.floor(ep * (1 + g.st.db));
      ep = Math.max(ep, 1);
      if (store.hasUnlock('gold')) ep *= 2;

      store.addPts(ep);
      store.updateBest(g.score, g.stage + 1);
      const rk = computeRank(g.score, cleared, g.stage);

      // リザルトデータをゲーム状態に追加で保持
      Object.assign(g, { _cleared: cleared, _rank: rk, _earnedPt: ep });
      syncGame();
      addTimer(() => patch({ screen: 'R' }), 350);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── ゲーム開始 ──
  const startGame = useCallback(() => {
    clearTimers();
    const d = store.data;
    const eq = d.eq.filter((id) => d.sty.includes(id));
    if (!eq.length) eq.push('standard');
    const g = createGameState(eq);
    gRef.current = g;
    g.curBf0 = Rand.shuffle(g.st.bfSet);
    syncGame();
    patch({ screen: 'G', flash: false, shaking: false, popText: null });
    announce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── プレイヤー移動 ──
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

  // ── タイトルに戻る ──
  const goTitle = useCallback(() => {
    clearTimers();
    gRef.current = null;
    patch({
      ...initRender(),
      menuIndex: rsRef.current.menuIndex,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 入力ディスパッチ ──
  const dispatch = useCallback(
    (action: InputAction) => {
      const r = rsRef.current;
      const g = gRef.current;
      const screen = r.screen;

      // ゲーム中パーク選択画面
      if (screen === 'G' && g?.phase === 'perks') {
        const maxP = g.perkChoices?.length || 3;
        if (action === 'up') {
          patch({ perkIndex: Math.max(0, r.perkIndex - 1) });
          audio.mv();
        } else if (action === 'down') {
          patch({ perkIndex: Math.min(maxP - 1, r.perkIndex + 1) });
          audio.mv();
        } else if (action === 'act') {
          selectPerk();
        }
        return;
      }

      // ゲーム中の左右移動
      if (screen === 'G' && (action === 'left' || action === 'right')) {
        movePlayer(action === 'left' ? -1 : 1);
        return;
      }

      // 各画面の入力処理
      switch (screen) {
        case 'T':
          if (action === 'up') {
            patch({ menuIndex: Math.max(0, r.menuIndex - 1) });
            audio.mv();
          } else if (action === 'down') {
            patch({
              menuIndex: Math.min(MENUS.length - 1, r.menuIndex + 1),
            });
            audio.mv();
          } else if (action === 'act') {
            audio.sel();
            switch (r.menuIndex) {
              case 0:
                startGame();
                break;
              case 1:
                patch({ screen: 'Y', listIndex: 0 });
                break;
              case 2:
                patch({ screen: 'H', listIndex: 0 });
                break;
              case 3:
                patch({ screen: 'HP', listIndex: 0 });
                break;
            }
          }
          break;

        case 'Y': {
          // スタイル画面
          const max = STY_KEYS.length;
          if (action === 'up') {
            patch({ listIndex: Math.max(0, r.listIndex - 1) });
            audio.mv();
          } else if (action === 'down') {
            patch({ listIndex: Math.min(max - 1, r.listIndex + 1) });
            audio.mv();
          } else if (action === 'act') {
            const id = STY_KEYS[r.listIndex];
            if (!store.hasStyle(id)) {
              audio.er();
            } else if (store.toggleEq(id)) {
              audio.sel();
            } else {
              audio.er();
            }
          } else if (action === 'left' || action === 'back') {
            audio.sel();
            goTitle();
          }
          break;
        }

        case 'H': {
          // ショップ画面
          const maxShop = SHP.length;
          if (action === 'up') {
            patch({ listIndex: Math.max(0, r.listIndex - 1) });
            audio.mv();
          } else if (action === 'down') {
            patch({ listIndex: Math.min(maxShop - 1, r.listIndex + 1) });
            audio.mv();
          } else if (action === 'act') {
            const item = SHP[r.listIndex];
            const owned =
              item.tp === 's'
                ? store.hasStyle(item.id)
                : store.hasUnlock(item.id);
            if (owned) {
              audio.er();
            } else if (store.spend(item.co)) {
              if (item.tp === 's') store.ownStyle(item.id);
              else store.ownUnlock(item.id);
              audio.ul();
            } else {
              audio.er();
            }
          } else if (action === 'left' || action === 'back') {
            audio.sel();
            goTitle();
          }
          break;
        }

        case 'HP':
          // ヘルプ画面
          if (action === 'act' || action === 'left' || action === 'back') {
            audio.sel();
            goTitle();
          }
          break;

        case 'R':
          // リザルト画面
          if (action === 'act' || action === 'back') {
            goTitle();
          }
          break;

        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ゲーム状態からレーン情報を導出
  const getLaneInfo = useCallback(
    (lane: number) => {
      const g = gRef.current;
      if (!g) return { mult: 1, restricted: false, shelter: false, forecast: '' };
      const restricted = g.st.rs.includes(lane);
      const shelter = g.st.sf.includes(lane);
      const mult = g.st.mu[lane];
      const bf = calcEffBf(
        g.curBf0,
        lane,
        g.bfAdj,
        g.bfAdj_lane,
        g.bfAdj_extra,
        0,
      );
      const vis = ROWS - bf;
      return {
        mult,
        restricted,
        shelter,
        forecast: visLabel(vis),
      };
    },
    [],
  );

  return {
    state: rs,
    dispatch,
    getLaneInfo,
  };
}
