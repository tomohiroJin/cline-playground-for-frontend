// Racing Game メインコンポーネント

import React, { useEffect, useRef, useState } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import {
  PageContainer,
  GameContainer,
  Title,
  SubTitle,
  CanvasContainer,
  Canvas,
  Overlay,
  ResultTitle,
  ActionButton,
  Button,
  MobileControls,
  TouchButton,
} from '../../pages/RacingGamePage.styles';

import type { Particle, Spark, Confetti, DeckState, HighlightEvent, HighlightType } from './types';
import { Config, Colors, Options, Courses } from './constants';
import { Utils } from './utils';
import { SoundEngine } from './audio';
import { Entity } from './entities';
import { Track } from './track';
import { Render, renderDecos } from './renderer';
import { Logic } from './game-logic';
import { Heat } from './heat';
import { CourseEffects } from './course-effects';
import { DraftCards } from './draft-cards';
import { Highlight } from './highlight';
import type { HighlightTracker } from './highlight';
import { computeAllCardEffects } from './card-effects';
import { collectPlayerInputs, updateParticles, updateSparks, updateConfetti } from './game-update';
import { drawHUD, drawCountdown, drawCpuNotification } from './game-draw';
import {
  initDraftState,
  updateDraftTimer,
  moveDraftCursor,
  mapDraftInput,
  clearDraftKeys,
  switchToPlayer2,
  switchToCpuSelection,
  applyDraftResults,
} from './draft-ui-logic';
import type { DraftState } from './draft-ui-logic';
import { useInput, useIdle } from './hooks';
import { VolumeCtrl } from './components/VolumeControl';
import { MenuPanel } from './components/MenuPanel';
import { ResultPanel } from './components/ResultPanel';

export default function RacingGame() {
  const [mode, setMode] = useState('2p');
  const [course, setCourse] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cpu, setCpu] = useState(1);
  const [laps, setLaps] = useState(3);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(1);

  const [state, setState] = useState('menu');
  const [, setWinner] = useState<string | null>(null);
  const [results, setResults] = useState<{
    winnerName: string;
    winnerColor: string;
    times: { p1: number; p2: number };
    fastest: number;
    lapTimes?: number[];
  } | null>(null);
  const [highlightSummary, setHighlightSummary] = useState<
    { type: HighlightType; count: number; totalScore: number }[]
  >([]);

  const [bests, setBests] = useState<Record<string, number>>({});
  const [paused, setPaused] = useState(false);
  const [vol, setVol] = useState(Config.audio.defaultVolume);
  const [muted, setMuted] = useState(false);
  const [cardsEnabled, setCardsEnabled] = useState(true);
  const cardsEnabledRef = useRef(true);
  const [gameKey, setGameKey] = useState(0);

  const gamePhaseRef = useRef<string>('menu');
  const pausedRef = useRef(false);
  const winnerRef = useRef<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch, setTouch, onKeyDown } = useInput();
  const [demo, setDemo] = useIdle(state === 'menu', Config.timing.idle);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { cardsEnabledRef.current = cardsEnabled; }, [cardsEnabled]);

  // P/ESC キーハンドリング
  useEffect(() => {
    onKeyDown.current = (key: string) => {
      const phase = gamePhaseRef.current;
      if (key === 'p' || key === 'P') {
        if (phase === 'race' || phase === 'draft' || phase === 'countdown') {
          setPaused(prev => !prev);
        }
      } else if (key === 'Escape') {
        if (phase === 'result') {
          reset();
        } else if (pausedRef.current) {
          reset();
        } else if (phase === 'race' || phase === 'draft' || phase === 'countdown') {
          setPaused(true);
        }
      }
    };
    return () => { onKeyDown.current = null; };
  });

  // Sound Cleanup & Best Time Loading
  useEffect(() => {
    const loadBests = async () => {
      const newBests: Record<string, number> = {};
      for (let c = 0; c < Courses.length; c++) {
        for (const l of Options.laps) {
          const key = `c${c}-l${l}`;
          const time = await getHighScore('racing', key, 'asc');
          if (time > 0) newBests[key] = time;
        }
      }
      setBests(newBests);
    };
    loadBests();
    return () => SoundEngine.cleanup();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = Config.canvas;
    canvas.width = width;
    canvas.height = height;

    const setPhase = (phase: string) => {
      gamePhaseRef.current = phase;
      setState(phase);
    };

    const cIdx = demo ? Utils.randInt(Courses.length) : Utils.clamp(course, 0, Courses.length - 1);
    const cur = Courses[cIdx] || Courses[0];
    if (!cur) return;
    const pts = cur.points;
    const cpCoords = cur.checkpointCoords;
    const baseSpd = Utils.safeIndex(Options.speed, speed, Options.speed[1]).value;
    const cpuCfg = Utils.safeIndex(Options.cpu, cpu, Options.cpu[1]);
    const maxLaps = laps;
    const sl = Track.startLine(pts);

    const sAngle = pts.length >= 2 ? Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) : 0;
    const pAngle = sAngle + Math.PI / 2;
    const col1 = Colors.car[demo ? Utils.randInt(6) : Utils.clamp(c1, 0, 5)];
    const col2 = Colors.car[demo ? Utils.randInt(6) : Utils.clamp(c2, 0, 5)];

    let players = mode === 'solo' && !demo
      ? [Entity.player(pts[0].x, pts[0].y - 30, sAngle, col1, 'P1', false)]
      : [
          Entity.player(pts[0].x + Math.cos(pAngle) * 18, pts[0].y + Math.sin(pAngle) * 18 - 30, sAngle, col1, 'P1', demo),
          Entity.player(pts[0].x - Math.cos(pAngle) * 18, pts[0].y - Math.sin(pAngle) * 18 - 30, sAngle, col2, demo || mode === 'cpu' ? 'CPU' : 'P2', demo || mode === 'cpu'),
        ];

    const cdStart = Date.now();
    let raceStart = 0;
    let particles: Particle[] = [];
    let sparks: Spark[] = [];
    const confetti: Confetti[] = [];
    let shake = 0;
    let lapAnn: string | null = null;
    let lapAnnT = 0;
    let lastCd = 4;
    let engineOn = false;
    let isRunning = true;
    const demoStart = demo ? Date.now() : 0;

    // ドラフトカード状態
    let cpuDraftTimer1: number | undefined;
    let cpuDraftTimer2: number | undefined;
    let decks: DeckState[] = [DraftCards.createDeck(), DraftCards.createDeck()];
    let draftSt: DraftState = {
      active: false, currentPlayer: 0, selectedIndex: 0, confirmed: false,
      timer: 15, lastTick: 0, animStart: 0, completedLap: 0, pendingResume: false,
    };
    const draftedLaps = new Set<string>();
    let draftTriggerKey = '';

    // ハイライト状態
    let hlTracker: HighlightTracker = Highlight.createTracker(players.length);
    const hlNotifications: (HighlightEvent & { displayTime: number; startTime: number })[] = [];
    const MAX_NOTIFICATIONS = 1;

    // CPU カード選択通知
    let cpuCardNotification: { cardName: string; cardIcon: string; startTime: number } | null = null;

    // デコレーション
    const decos: { x: number; y: number; variant: number }[] = [];
    for (let i = 0; i < Config.game.decoCount; i++) {
      let x = 0, y = 0, ok = false, att = 0;
      while (!ok && att++ < 50) {
        x = Math.random() * 860 + 20;
        y = Math.random() * 660 + 20;
        ok = Track.getInfo(x, y, pts).dist > Config.game.trackWidth + 30;
      }
      if (ok) decos.push(Entity.decoration(x, y));
    }

    const addParts = (x: number, y: number) => {
      for (let i = 0; i < Config.game.particleCount; i++) particles.push(Entity.particle(x, y, i));
      particles = particles.slice(-Config.game.maxParticles);
      shake = 5;
    };

    const pushNotification = (event: HighlightEvent) => {
      if (hlNotifications.length >= MAX_NOTIFICATIONS) hlNotifications.shift();
      hlNotifications.push({ ...event, displayTime: 0, startTime: Date.now() });
    };

    /** ドラフト開始処理 */
    const startDraft = (completedLap: number) => {
      draftedLaps.add(draftTriggerKey);
      decks = decks.map(d => DraftCards.drawCards(d, 3));
      draftSt = initDraftState(completedLap, Date.now());
      SoundEngine.stopEngine();
      engineOn = false;
      setPhase('draft');
    };

    /** ドラフト確定処理 */
    const confirmDraftSelection = () => {
      if (draftSt.confirmed) return;
      const pi = draftSt.currentPlayer;
      const hand = decks[pi].hand;
      if (hand.length === 0) return;

      const selectedCard = hand[draftSt.selectedIndex] || hand[0];
      decks[pi] = DraftCards.selectCard(decks[pi], selectedCard.id);
      draftSt.confirmed = true;

      if (mode === '2p' && pi === 0) {
        setTimeout(() => { draftSt = switchToPlayer2(draftSt, Date.now()); }, 500);
        return;
      }

      if (mode === 'cpu' && pi === 0) {
        draftSt = switchToCpuSelection(draftSt, Date.now());
        cpuDraftTimer1 = window.setTimeout(() => {
          decks[1] = DraftCards.cpuSelectCard(decks[1], cpuCfg.skill);
          const sc = decks[1].history[decks[1].history.length - 1];
          const si = decks[1].hand.findIndex(c => c.id === sc?.id);
          draftSt.selectedIndex = si >= 0 ? si : 0;
          draftSt.confirmed = true;
          if (sc) cpuCardNotification = { cardName: sc.name, cardIcon: sc.icon, startTime: Date.now() };
          cpuDraftTimer2 = window.setTimeout(() => {
            players = applyDraftResults(players, decks);
            players = players.map(p => ({ ...p, lapStart: Date.now() }));
            draftSt.active = false;
            draftSt.pendingResume = false;
            setPhase('race');
          }, 800);
        }, 1200);
        return;
      }

      setTimeout(() => {
        players = applyDraftResults(players, decks);
        players = players.map(p => ({ ...p, lapStart: Date.now() }));
        draftSt.active = false;
        draftSt.pendingResume = false;
        setPhase('race');
      }, 500);
    };

    const update = () => {
      if (pausedRef.current || !isRunning) return;
      if (demo && Date.now() - demoStart > Config.timing.demo) {
        setDemo(false);
        return;
      }

      // ドラフト状態の更新
      if (gamePhaseRef.current === 'draft' && draftSt.active) {
        draftSt = updateDraftTimer(draftSt, Date.now());

        if (draftSt.timer <= 0 && !draftSt.confirmed) {
          confirmDraftSelection();
          return;
        }

        const pi = draftSt.currentPlayer;
        const hand = decks[pi].hand;

        if (!draftSt.confirmed && hand.length > 0) {
          const input = mapDraftInput(keys.current, pi, mode);
          if (input.left) {
            draftSt.selectedIndex = moveDraftCursor(draftSt.selectedIndex, 'left', hand.length);
            clearDraftKeys(keys.current, pi, mode, 'left');
          }
          if (input.right) {
            draftSt.selectedIndex = moveDraftCursor(draftSt.selectedIndex, 'right', hand.length);
            clearDraftKeys(keys.current, pi, mode, 'right');
          }
          if (input.confirm) {
            confirmDraftSelection();
            clearDraftKeys(keys.current, pi, mode, 'confirm');
          }
        }
        return;
      }

      // カウントダウン → レース遷移
      if (gamePhaseRef.current === 'countdown' && !demo) {
        const el = Date.now() - cdStart;
        if (el >= Config.timing.countdown && raceStart === 0) {
          raceStart = Date.now();
          setPhase('race');
          SoundEngine.go();
          players = players.map(p => ({ ...p, lapStart: Date.now() }));
        }
        return; // カウントダウン中はレースロジックを実行しない
      }

      // プレイヤー入力収集
      const playerInputs = collectPlayerInputs(
        players, keys.current, touch.current, mode, demo, cpuCfg.skill, cpuCfg.miss, pts
      );

      players = players.map((p, i) => ({
        ...p,
        angle: p.angle + playerInputs[i].turnRate,
      }));

      let finished = false;
      let triggerDraft = false;
      let draftLap = 0;
      const raceTime = raceStart > 0 ? Date.now() - raceStart : 0;

      if (gamePhaseRef.current === 'race' || demo) {
        if (!demo && !engineOn) {
          SoundEngine.startEngine();
          engineOn = true;
        }
        if (!demo) {
          const avgSpeed = players.length >= 2
            ? (players[0].speed + players[1].speed) / 2
            : players[0].speed;
          SoundEngine.updateEngine(avgSpeed);
        }

        const courseEffect = CourseEffects.getEffect(cur.deco);

        players = players.map((p, i) => {
          const trackInfo = Track.getInfo(p.x, p.y, pts);
          const friction = CourseEffects.getFriction(
            courseEffect, trackInfo.seg, pts.length, trackInfo.dist, Config.game.trackWidth
          );
          const spdMod = CourseEffects.getSpeedModifier(courseEffect, trackInfo.seg, pts.length);

          // カード効果一括計算
          const ce = computeAllCardEffects(p.activeCards);
          const effectiveBaseSpd = (baseSpd * friction + spdMod) * ce.speedMul;

          const input = playerInputs[i];
          // eslint-disable-next-line prefer-const
          let { p: np, info, hit, wallStage } = Logic.movePlayer(
            p, effectiveBaseSpd, pts, input.handbrake, input.rot, ce.accelMul, ce.driftBoostMul
          );

          if (hit) {
            if (!demo) SoundEngine.wallStaged(wallStage);
            addParts(np.x, np.y);
            shake = wallStage === 1 ? 1 : wallStage === 2 ? 2 : 4;
          }

          // ドリフトスモーク
          if (np.drift.active) {
            for (let s = 0; s < 2; s++) {
              particles.push(Entity.driftSmoke(np.x, np.y, np.angle));
            }
            particles = particles.slice(-Config.game.maxParticles);
          }

          // HEAT 計算
          const otherPlayer = players.length >= 2 ? players[1 - i] : undefined;
          const carDist = otherPlayer ? Utils.dist(np.x, np.y, otherPlayer.x, otherPlayer.y) : Infinity;
          const newHeat = Heat.update(np.heat, info.dist, carDist, 1 / 60, ce.heatGainMul);

          const heatBoost = Heat.getBoost(newHeat);
          if (heatBoost > 0) {
            np = { ...np, speed: Math.min(1, np.speed + heatBoost * 0.1) };
          }
          np = { ...np, heat: newHeat };

          // ハイライト検出
          if (!demo) {
            const driftResult = Highlight.checkDriftBonus(hlTracker, np.drift, i, np.lap, raceTime);
            hlTracker = driftResult.tracker;
            if (driftResult.event) pushNotification(driftResult.event);

            const heatResult = Highlight.checkHeatBoost(hlTracker, np.heat, i, np.lap, raceTime);
            hlTracker = heatResult.tracker;
            if (heatResult.event) pushNotification(heatResult.event);

            const nearResult = Highlight.checkNearMiss(
              hlTracker, info.dist, Config.game.trackWidth, 1 / 60, i, np.lap, raceTime
            );
            hlTracker = nearResult.tracker;
            if (nearResult.event) pushNotification(nearResult.event);
          }

          // チェックポイント判定
          np = Logic.updateCheckpoints(np, cpCoords, !p.isCpu && !demo ? SoundEngine.checkpoint : undefined);

          // 周回・進行度
          if (info.seg !== p.lastSeg) {
            if (
              info.seg === 0 &&
              p.lastSeg > pts.length - 5 &&
              Logic.allCheckpointsPassed(p.checkpointFlags, cpCoords.length)
            ) {
              if (!demo && !p.isCpu) {
                SoundEngine.lap();
                lapAnn = 'LAP ' + (p.lap + 1);
                lapAnnT = Date.now();
              }
              const lapTime = p.lapStart > 0 ? Date.now() - p.lapStart : 0;
              np.lap++;
              np.checkpointFlags = 0;
              np.lapTimes.push(lapTime);
              np.lapStart = Date.now();

              if (!demo) {
                const flResult = Highlight.checkFastestLap(hlTracker, lapTime, i, np.lap - 1, raceTime);
                hlTracker = flResult.tracker;
                if (flResult.event) pushNotification(flResult.event);
              }

              decks[i] = DraftCards.clearActiveEffects(decks[i]);
              np = { ...np, activeCards: [], shieldCount: 0 };

              if (np.lap > maxLaps) {
                if (!demo && !winnerRef.current) {
                  winnerRef.current = p.name;
                  setWinner(p.name);
                  finished = true;
                  SoundEngine.stopEngine();
                  SoundEngine.finish();
                }
                return np;
              }

              const draftKey = `p${i}_lap${np.lap - 1}`;
              if (!demo && np.lap <= maxLaps && maxLaps > 1 && !triggerDraft && cardsEnabledRef.current && mode !== 'solo' && !draftedLaps.has(draftKey)) {
                triggerDraft = true;
                draftLap = np.lap - 1;
                draftTriggerKey = draftKey;
              }

              if (np.lap === maxLaps && !demo && !p.isCpu) SoundEngine.finalLap();
            }
            np.lastSeg = info.seg;
          }
          np.progress = (np.lap - 1) * pts.length + info.seg;
          return np;
        });

        // 逆転検出
        if (!demo && players.length >= 2) {
          const positions = players.map(p => p.progress);
          for (let i = 0; i < 2; i++) {
            const otResult = Highlight.checkOvertake(hlTracker, positions, i, players[i].lap, raceTime);
            hlTracker = otResult.tracker;
            if (otResult.event) pushNotification(otResult.event);
          }
        }

        // 衝突判定
        if ((gamePhaseRef.current === 'race' || demo) && players.length >= 2) {
          const col = Logic.handleCollision(players[0], players[1]);
          if (col) {
            if (!demo) SoundEngine.collision();
            players[0] = col.p1;
            players[1] = col.p2;
            sparks.push(
              Entity.spark(col.pt.x, col.pt.y, Math.atan2(players[1].y - players[0].y, players[1].x - players[0].x), '#fff')
            );
            addParts(col.pt.x, col.pt.y);
          }
        }
      }

      // エフェクト更新
      particles = updateParticles(particles);
      sparks = updateSparks(sparks);
      updateConfetti(confetti, height);

      // 通知の表示時間更新
      const now = Date.now();
      for (let n = hlNotifications.length - 1; n >= 0; n--) {
        hlNotifications[n].displayTime = now - hlNotifications[n].startTime;
        if (hlNotifications[n].displayTime > 1200) {
          hlNotifications.splice(n, 1);
        }
      }

      // ドラフト遷移
      if (triggerDraft && !finished) {
        startDraft(draftLap);
        return;
      }

      if (finished && !demo) {
        setPhase('result');
        const winName = players.find(p => p.lap > maxLaps)?.name || 'Unknown';
        const p1Time = players[0].lapTimes.reduce((a, b) => a + b, 0);
        const p2Time = players.length >= 2 ? players[1].lapTimes.reduce((a, b) => a + b, 0) : 0;

        if (players.length >= 2 && players[0].lapTimes.length > 0 && players[1].lapTimes.length > 0) {
          const pfResult = Highlight.checkPhotoFinish(hlTracker, [p1Time, p2Time], maxLaps, raceTime);
          hlTracker = pfResult.tracker;
          if (pfResult.event) pushNotification(pfResult.event);
        }

        setHighlightSummary(Highlight.getSummary(hlTracker));

        const allLapTimes = players.length >= 2
          ? [...players[0].lapTimes, ...players[1].lapTimes]
          : [...players[0].lapTimes];

        const winner = players.find(p => p.lap > maxLaps);
        setResults({
          winnerName: winName,
          winnerColor: players.find(p => p.name === winName)?.color || '#fff',
          times: { p1: p1Time, p2: p2Time },
          fastest: Utils.min(allLapTimes),
          lapTimes: winner ? [...winner.lapTimes] : [...players[0].lapTimes],
        });

        if (players[0].lap === maxLaps + 1) {
          const key = `c${course}-l${laps}`;
          saveScore('racing', p1Time, key).then(() => {
            getHighScore('racing', key, 'asc').then(t => {
              setBests(prev => ({ ...prev, [key]: t }));
            });
          });
        }

        isRunning = false;
      }
    };

    const draw = () => {
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      if (shake > 0) shake *= 0.9;

      ctx.save();
      ctx.translate(sx, sy);

      Render.background(ctx, cur);
      renderDecos(ctx, decos, cur.deco);
      Render.track(ctx, pts);

      const courseVisual = CourseEffects.getEffect(cur.deco).visualEffect;
      if (courseVisual !== 'none') Render.courseEffect(ctx, courseVisual, Date.now());
      Render.startLine(ctx, sl);
      Render.checkpoints(ctx, cpCoords);
      Render.particles(ctx, particles, sparks);

      players.slice().sort((a, b) => a.y - b.y).forEach(p => Render.kart(ctx, p));

      // カウントダウン
      if (gamePhaseRef.current === 'countdown' && !demo) {
        const el = Date.now() - cdStart;
        const count = Math.ceil((Config.timing.countdown - el) / 1000);
        if (count !== lastCd && count > 0 && count <= 3) {
          SoundEngine.countdown();
          lastCd = count;
        }
        drawCountdown(ctx, el, width, height);
        // 状態遷移は update() 側で処理
      }

      // GO! 表示
      if ((gamePhaseRef.current === 'race' || demo) && raceStart !== 0 && Date.now() - raceStart < 1000) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO!', width / 2, height / 2);
      }

      // ドラフトUI
      if (gamePhaseRef.current === 'draft' && draftSt.active) {
        const pi = draftSt.currentPlayer;
        const hand = decks[pi].hand;
        const animProgress = Math.min(1, (Date.now() - draftSt.animStart) / 800);
        Render.draftUI(ctx, hand, draftSt.selectedIndex, draftSt.timer, 15, players[pi].name, draftSt.completedLap, draftSt.confirmed, animProgress);
      }

      if (gamePhaseRef.current === 'result') {
        Render.confetti(ctx, confetti);
        Render.fireworks(ctx, Date.now());
      }

      // HUD
      if (gamePhaseRef.current === 'race' || gamePhaseRef.current === 'draft' || demo) {
        drawHUD(ctx, players, cur.name, maxLaps, raceStart);

        if (lapAnn && Date.now() - lapAnnT < Config.timing.lapAnnounce) {
          ctx.fillStyle = '#ffeb3b';
          ctx.font = 'bold 60px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lapAnn, width / 2, 200);
        }
      }

      // ハイライト通知バナー
      if (gamePhaseRef.current === 'race' || gamePhaseRef.current === 'draft') {
        hlNotifications.forEach((notif, index) => {
          Render.highlightBanner(ctx, notif, Highlight.COLORS, index);
        });
      }

      // CPU カード選択通知バナー
      if (cpuCardNotification) {
        if (!drawCpuNotification(ctx, cpuCardNotification, width, height)) {
          cpuCardNotification = null;
        }
      }

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      if (isRunning) requestAnimationFrame(loop);
    };

    if (state === 'result') {
      for (let i = 0; i < Config.game.confettiCount; i++) confetti.push(Entity.confetti());
    }

    try {
      loop();
    } catch (e) {
      console.error('Game Loop Error:', e);
    }
    return () => {
      isRunning = false;
      SoundEngine.stopEngine();
      SoundEngine.cleanup();
      if (cpuDraftTimer1) clearTimeout(cpuDraftTimer1);
      if (cpuDraftTimer2) clearTimeout(cpuDraftTimer2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, course, speed, cpu, laps, c1, c2, gameKey, demo]);

  const reset = () => {
    gamePhaseRef.current = 'menu';
    winnerRef.current = null;
    setState('menu');
    setWinner(null);
    setResults(null);
    setHighlightSummary([]);
    setPaused(false);
    setGameKey(prev => prev + 1);
  };

  const startGame = () => {
    gamePhaseRef.current = 'countdown';
    winnerRef.current = null;
    setState('countdown');
    setGameKey(prev => prev + 1);
    setDemo(false);
  };

  const bestTimeStr = bests[`c${course}-l${laps}`]
    ? Utils.formatTime(bests[`c${course}-l${laps}`])
    : '--:--.-';

  return (
    <PageContainer>
      <GameContainer>
        <div style={{ textAlign: 'center' }}>
          <Title>Racing Game</Title>
          <SubTitle>{Courses[Utils.clamp(course, 0, Courses.length - 1)]?.name || ''}</SubTitle>
          <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '0.5rem' }}>
            Best: {bestTimeStr}
          </div>
        </div>

        <CanvasContainer>
          <Canvas ref={canvasRef} role="img" aria-label="レーシングゲーム画面" tabIndex={0} />

          {state === 'menu' && (
            <MenuPanel
              mode={mode} setMode={setMode}
              course={course} setCourse={setCourse}
              speed={speed} setSpeed={setSpeed}
              cpu={cpu} setCpu={setCpu}
              laps={laps} setLaps={setLaps}
              c1={c1} setC1={setC1}
              c2={c2} setC2={setC2}
              cardsEnabled={cardsEnabled} setCardsEnabled={setCardsEnabled}
              onStart={startGame}
            />
          )}

          {state === 'result' && results && (
            <ResultPanel
              mode={mode}
              results={results}
              highlightSummary={highlightSummary}
              bestTime={bestTimeStr}
              onReset={reset}
            />
          )}

          {paused && (
            <Overlay>
              <ResultTitle>PAUSED</ResultTitle>
              <ActionButton onClick={() => setPaused(false)}>Resume</ActionButton>
              <Button onClick={reset} style={{ marginTop: '1rem' }}>
                Exit
              </Button>
              <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                P: 再開 / ESC: メニューへ戻る
              </p>
            </Overlay>
          )}
        </CanvasContainer>

        <MobileControls>
          <TouchButton
            onTouchStart={() => setTouch('L', true)}
            onTouchEnd={() => setTouch('L', false)}
          >
            ◀
          </TouchButton>
          <TouchButton
            onTouchStart={() => setTouch('R', true)}
            onTouchEnd={() => setTouch('R', false)}
          >
            ▶
          </TouchButton>
        </MobileControls>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} />
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            P1:A/D P2:←/→ P:ポーズ ESC:終了
          </p>
        </div>
      </GameContainer>
    </PageContainer>
  );
}
