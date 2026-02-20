// Racing Game メインコンポーネント

import React, { useEffect, useRef, useState } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { ShareButton } from '../../components/molecules/ShareButton';
import {
  PageContainer,
  GameContainer,
  Title,
  SubTitle,
  CanvasContainer,
  Canvas,
  ControlGroup,
  Label,
  Button,
  Overlay,
  ResultCard,
  ResultTitle,
  ResultRow,
  ActionButton,
  MobileControls,
  TouchButton,
  Btn,
  ColorBtn,
} from '../../pages/RacingGamePage.styles';

import type { Particle, Spark, Confetti, Card, DeckState, HighlightEvent, HighlightType } from './types';
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
import { Ghost } from './ghost';
import type { GhostRecorder, GhostPlayer } from './ghost';
import { Highlight } from './highlight';
import type { HighlightTracker } from './highlight';
import { useInput, useIdle } from './hooks';
import { VolumeCtrl } from './components/VolumeControl';

export default function RacingGame() {
  const [mode, setMode] = useState('2p');
  const [course, setCourse] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cpu, setCpu] = useState(1);
  const [laps, setLaps] = useState(3);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(1);

  // 'menu' | 'countdown' | 'race' | 'draft' | 'result'
  const [state, setState] = useState('menu');
  const [winner, setWinner] = useState<string | null>(null);
  const [results, setResults] = useState<{
    winnerName: string;
    winnerColor: string;
    times: { p1: number; p2: number };
    fastest: number;
  } | null>(null);
  const [highlightSummary, setHighlightSummary] = useState<
    { type: HighlightType; count: number; totalScore: number }[]
  >([]);

  const [bests, setBests] = useState<Record<string, number>>({});
  const [paused, setPaused] = useState(false);
  const [vol, setVol] = useState(Config.audio.defaultVolume);
  const [muted, setMuted] = useState(false);
  const [ghostEnabled, setGhostEnabled] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch, setTouch } = useInput();
  const [demo, setDemo] = useIdle(state === 'menu', Config.timing.idle);

  // Sound Cleanup
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

    let players = [
      Entity.player(
        pts[0].x + Math.cos(pAngle) * 18,
        pts[0].y + Math.sin(pAngle) * 18 - 30,
        sAngle,
        col1,
        'P1',
        demo
      ),
      Entity.player(
        pts[0].x - Math.cos(pAngle) * 18,
        pts[0].y - Math.sin(pAngle) * 18 - 30,
        sAngle,
        col2,
        demo || mode === 'cpu' ? 'CPU' : 'P2',
        demo || mode === 'cpu'
      ),
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

    // === ドラフトカード状態 ===
    let decks: DeckState[] = [DraftCards.createDeck(), DraftCards.createDeck()];
    let draftState = {
      active: false,
      currentPlayer: 0,    // 現在選択中のプレイヤー（0 or 1）
      selectedIndex: 0,     // カーソル位置
      confirmed: false,     // 確定済みか
      timer: 15,            // 残り秒数
      lastTick: 0,          // 最後のタイマー更新
      animStart: 0,         // アニメーション開始時間
      completedLap: 0,      // ドラフト発生ラップ番号
      pendingResume: false,  // レース再開待ち
    };

    // === ゴースト状態 ===
    let ghostRecorder: GhostRecorder = Ghost.createRecorder();
    let ghostPlayer: GhostPlayer | null = null;
    if (ghostEnabled && !demo) {
      const ghostData = Ghost.load(cIdx, mode);
      if (ghostData) {
        ghostPlayer = Ghost.createPlayer(ghostData);
      }
    }

    // === ハイライト状態 ===
    let hlTracker: HighlightTracker = Highlight.createTracker(2);
    const hlNotifications: (HighlightEvent & { displayTime: number; startTime: number })[] = [];
    const MAX_NOTIFICATIONS = 3;

    // デコレーション
    const decos: { x: number; y: number; variant: number }[] = [];
    for (let i = 0; i < Config.game.decoCount; i++) {
      let x = 0,
        y = 0,
        ok = false,
        att = 0;
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

    /** ハイライトイベントを通知キューに追加 */
    const pushNotification = (event: HighlightEvent) => {
      if (hlNotifications.length >= MAX_NOTIFICATIONS) {
        hlNotifications.shift();
      }
      hlNotifications.push({ ...event, displayTime: 0, startTime: Date.now() });
    };

    /** ドラフト開始処理 */
    const startDraft = (completedLap: number) => {
      // 各プレイヤーのデッキから3枚ドロー
      decks = decks.map(d => DraftCards.drawCards(d, 3));

      draftState = {
        active: true,
        currentPlayer: 0,
        selectedIndex: 1,
        confirmed: false,
        timer: 15,
        lastTick: Date.now(),
        animStart: Date.now(),
        completedLap,
        pendingResume: false,
      };

      // ゴースト記録一時停止
      ghostRecorder = Ghost.pauseRecording(ghostRecorder);

      SoundEngine.stopEngine();
      engineOn = false;
      setState('draft');
    };

    /** ドラフト確定処理 */
    const confirmDraftSelection = () => {
      const pi = draftState.currentPlayer;
      const hand = decks[pi].hand;
      if (hand.length === 0) return;

      const selectedCard = hand[draftState.selectedIndex] || hand[0];
      decks[pi] = DraftCards.selectCard(decks[pi], selectedCard.id);
      draftState.confirmed = true;

      // 2P モードで P1 完了後 → P2 の選択へ
      if (mode === '2p' && pi === 0) {
        setTimeout(() => {
          draftState = {
            ...draftState,
            currentPlayer: 1,
            selectedIndex: 1,
            confirmed: false,
            timer: 15,
            lastTick: Date.now(),
            animStart: Date.now(),
          };
        }, 500);
        return;
      }

      // CPU モード → CPU は自動選択
      if (mode === 'cpu' && pi === 0) {
        decks[1] = DraftCards.cpuSelectCard(decks[1], cpuCfg.skill);
      }

      // 全プレイヤー選択完了 → カード効果適用してレース再開
      setTimeout(() => {
        // カード効果を各プレイヤーの activeCards に適用
        players = players.map((p, i) => {
          const effects = DraftCards.getActiveEffects(decks[i]);
          return {
            ...p,
            activeCards: decks[i].active,
            shieldCount: p.shieldCount + (effects.shieldCount ?? 0),
          };
        });

        draftState.active = false;
        draftState.pendingResume = false;

        // ゴースト記録再開
        ghostRecorder = Ghost.resumeRecording(ghostRecorder);

        setState('race');
      }, 500);
    };

    const update = () => {
      if (paused || !isRunning) return;
      if (demo && Date.now() - demoStart > Config.timing.demo) {
        setDemo(false);
        return;
      }

      // === ドラフト状態の更新 ===
      if (state === 'draft' && draftState.active) {
        const now = Date.now();
        const elapsed = (now - draftState.lastTick) / 1000;
        draftState.timer -= elapsed;
        draftState.lastTick = now;

        // タイムアウト → ランダム選択
        if (draftState.timer <= 0 && !draftState.confirmed) {
          confirmDraftSelection();
          return;
        }

        // キー入力処理（ドラフト中）
        const pi = draftState.currentPlayer;
        const isP1 = pi === 0;
        const hand = decks[pi].hand;

        if (!draftState.confirmed && hand.length > 0) {
          // 左右選択
          if (isP1) {
            // P1: A/D or ←→（CPU対戦時）
            if (keys.current.a || keys.current.A || (mode === 'cpu' && keys.current.ArrowLeft)) {
              draftState.selectedIndex = Math.max(0, draftState.selectedIndex - 1);
              keys.current.a = false;
              keys.current.A = false;
              keys.current.ArrowLeft = false;
            }
            if (keys.current.d || keys.current.D || (mode === 'cpu' && keys.current.ArrowRight)) {
              draftState.selectedIndex = Math.min(hand.length - 1, draftState.selectedIndex + 1);
              keys.current.d = false;
              keys.current.D = false;
              keys.current.ArrowRight = false;
            }
            // 決定
            if (keys.current.w || keys.current.W || (mode === 'cpu' && (keys.current.Enter || keys.current[' ']))) {
              confirmDraftSelection();
              keys.current.w = false;
              keys.current.W = false;
              keys.current.Enter = false;
              keys.current[' '] = false;
            }
          } else {
            // P2: ←→ で選択、Enter で決定
            if (keys.current.ArrowLeft) {
              draftState.selectedIndex = Math.max(0, draftState.selectedIndex - 1);
              keys.current.ArrowLeft = false;
            }
            if (keys.current.ArrowRight) {
              draftState.selectedIndex = Math.min(hand.length - 1, draftState.selectedIndex + 1);
              keys.current.ArrowRight = false;
            }
            if (keys.current.Enter) {
              confirmDraftSelection();
              keys.current.Enter = false;
            }
          }
        }

        return; // ドラフト中はレース更新しない
      }

      // 各プレイヤーの操作入力を収集
      const playerInputs = players.map((p, i) => {
        let rot = 0;
        let handbrake = false;
        if (demo || p.isCpu) {
          rot = Logic.cpuTurn(p, pts, demo ? 0.7 : cpuCfg.skill, demo ? 0.03 : cpuCfg.miss);
          if (!demo && Logic.cpuShouldDrift(p, pts, cpuCfg.skill)) {
            handbrake = true;
          }
        } else if (i === 0) {
          if (keys.current.a || keys.current.A || touch.current.L) rot = -Config.game.turnRate;
          if (keys.current.d || keys.current.D || touch.current.R) rot = Config.game.turnRate;
          handbrake = mode === '2p' ? !!keys.current['code:ShiftLeft'] : !!keys.current[' '];
        } else {
          if (keys.current.ArrowLeft) rot = -Config.game.turnRate;
          if (keys.current.ArrowRight) rot = Config.game.turnRate;
          handbrake = !!keys.current['code:ShiftRight'] || !!keys.current.Enter;
        }
        // ドリフト中は旋回速度を増幅
        const turnRate = p.drift.active && rot !== 0
          ? Math.sign(rot) * (Config.game.turnRate * 1.8)
          : rot;
        return { rot, turnRate, handbrake };
      });

      players = players.map((p, i) => ({
        ...p,
        angle: p.angle + playerInputs[i].turnRate,
      }));

      let finished = false;
      let triggerDraft = false;
      let draftLap = 0;
      const raceTime = raceStart > 0 ? Date.now() - raceStart : 0;

      if (state === 'race' || demo) {
        if (!demo && !engineOn) {
          SoundEngine.startEngine();
          engineOn = true;
        }
        if (!demo) SoundEngine.updateEngine((players[0].speed + players[1].speed) / 2);

        // コース環境効果
        const courseEffect = CourseEffects.getEffect(cur.deco);

        players = players.map((p, i) => {
          // コース効果
          const trackInfo = Track.getInfo(p.x, p.y, pts);
          const friction = CourseEffects.getFriction(
            courseEffect,
            trackInfo.seg,
            pts.length,
            trackInfo.dist,
            Config.game.trackWidth
          );
          const spdMod = CourseEffects.getSpeedModifier(courseEffect, trackInfo.seg, pts.length);
          const effectiveBaseSpd = baseSpd * friction + spdMod;

          // 移動
          const input = playerInputs[i];
          // eslint-disable-next-line prefer-const
          let { p: np, info, hit, wallStage } = Logic.movePlayer(p, effectiveBaseSpd, pts, input.handbrake, input.rot);

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
          const otherPlayer = players[1 - i];
          const carDist = Utils.dist(np.x, np.y, otherPlayer.x, otherPlayer.y);
          const heatGainMul = np.activeCards.reduce(
            (acc, c) => acc * (c.heatGainMultiplier ?? 1),
            1
          );
          const newHeat = Heat.update(np.heat, info.dist, carDist, 1 / 60, heatGainMul);

          // HEAT ブースト適用
          const heatBoost = Heat.getBoost(newHeat);
          if (heatBoost > 0) {
            np = { ...np, speed: Math.min(1, np.speed + heatBoost * 0.1) };
          }
          np = { ...np, heat: newHeat };

          // === ハイライト検出 ===
          if (!demo) {
            // ドリフトボーナス
            const driftResult = Highlight.checkDriftBonus(hlTracker, np.drift, i, np.lap, raceTime);
            hlTracker = driftResult.tracker;
            if (driftResult.event) pushNotification(driftResult.event);

            // HEAT ブースト
            const heatResult = Highlight.checkHeatBoost(hlTracker, np.heat, i, np.lap, raceTime);
            hlTracker = heatResult.tracker;
            if (heatResult.event) pushNotification(heatResult.event);

            // ニアミス
            const nearResult = Highlight.checkNearMiss(
              hlTracker, info.dist, Config.game.trackWidth, 1 / 60, i, np.lap, raceTime
            );
            hlTracker = nearResult.tracker;
            if (nearResult.event) pushNotification(nearResult.event);
          }

          // チェックポイント判定
          const newCp = Logic.updateCheckpoints(
            np,
            cpCoords,
            !p.isCpu && !demo ? SoundEngine.checkpoint : undefined
          );
          np = newCp;

          // 周回・進行度
          if (info.seg !== p.lastSeg) {
            if (
              info.seg === 0 &&
              p.lastSeg > pts.length - 5 &&
              Logic.allCheckpointsPassed(p.checkpointFlags, cpCoords.length)
            ) {
              // 周回完了
              if (!demo && !p.isCpu) {
                SoundEngine.lap();
                lapAnn = 'LAP ' + (p.lap + 1);
                lapAnnT = Date.now();
              }
              const lapTime = Date.now() - p.lapStart;
              np.lap++;
              np.checkpointFlags = 0;
              np.lapTimes.push(lapTime);
              np.lapStart = Date.now();

              // ファステストラップ検出
              if (!demo) {
                const flResult = Highlight.checkFastestLap(hlTracker, lapTime, i, np.lap - 1, raceTime);
                hlTracker = flResult.tracker;
                if (flResult.event) pushNotification(flResult.event);
              }

              // ラップ終了時のカード効果クリア
              decks[i] = DraftCards.clearActiveEffects(decks[i]);
              np = { ...np, activeCards: [], shieldCount: 0 };

              if (np.lap > maxLaps) {
                if (!demo && !winner) {
                  const winName = p.name;
                  setWinner(winName);
                  finished = true;
                  SoundEngine.stopEngine();
                  SoundEngine.finish();
                }
                return np;
              }

              // ドラフト発動判定（最終ラップでなく、laps > 1）
              if (!demo && np.lap <= maxLaps && maxLaps > 1 && !triggerDraft) {
                triggerDraft = true;
                draftLap = np.lap - 1;
              }

              if (np.lap === maxLaps && !demo && !p.isCpu) SoundEngine.finalLap();
            }
            np.lastSeg = info.seg;
          }
          np.progress = (np.lap - 1) * pts.length + info.seg;
          return np;
        });

        // 逆転検出
        if (!demo) {
          const positions = players.map(p => p.progress);
          for (let i = 0; i < 2; i++) {
            const otResult = Highlight.checkOvertake(hlTracker, positions, i, players[i].lap, raceTime);
            hlTracker = otResult.tracker;
            if (otResult.event) pushNotification(otResult.event);
          }
        }

        // 衝突判定
        if (state === 'race' || demo) {
          const col = Logic.handleCollision(players[0], players[1]);
          if (col) {
            if (!demo) SoundEngine.collision();
            players[0] = col.p1;
            players[1] = col.p2;
            sparks.push(
              Entity.spark(
                col.pt.x,
                col.pt.y,
                Math.atan2(players[1].y - players[0].y, players[1].x - players[0].x),
                '#fff'
              )
            );
            addParts(col.pt.x, col.pt.y);
          }
        }

        // ゴースト記録（P1のみ、race中）
        if (!demo && state === 'race' && raceStart > 0) {
          ghostRecorder = Ghost.recordFrame(ghostRecorder, players[0], raceTime);
        }
      }

      // エフェクト更新
      particles = particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
        .filter(p => p.life > 0);
      sparks = sparks
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
        .filter(p => p.life > 0);
      confetti.forEach(i => {
        i.y += i.vy;
        i.rot += i.rotSpd;
        if (i.y > height) i.y = -20;
      });

      // 通知の表示時間更新
      const now = Date.now();
      for (let n = hlNotifications.length - 1; n >= 0; n--) {
        hlNotifications[n].displayTime = now - hlNotifications[n].startTime;
        if (hlNotifications[n].displayTime > 2000) {
          hlNotifications.splice(n, 1);
        }
      }

      // ドラフト遷移
      if (triggerDraft && !finished) {
        startDraft(draftLap);
        return;
      }

      if (finished && !demo) {
        setState('result');
        const winName = players.find(p => p.lap > maxLaps)?.name || 'Unknown';
        const p1Time = players[0].lapTimes.reduce((a, b) => a + b, 0);
        const p2Time = players[1].lapTimes.reduce((a, b) => a + b, 0);

        // フォトフィニッシュ検出
        if (players[0].lapTimes.length > 0 && players[1].lapTimes.length > 0) {
          const pfResult = Highlight.checkPhotoFinish(
            hlTracker,
            [p1Time, p2Time],
            maxLaps,
            raceTime
          );
          hlTracker = pfResult.tracker;
          if (pfResult.event) pushNotification(pfResult.event);
        }

        // ハイライトサマリー保存
        const summary = Highlight.getSummary(hlTracker);
        setHighlightSummary(summary);

        setResults({
          winnerName: winName,
          winnerColor: players.find(p => p.name === winName)?.color || '#fff',
          times: { p1: p1Time, p2: p2Time },
          fastest: Utils.min([...players[0].lapTimes, ...players[1].lapTimes]),
        });

        // ゴースト保存
        if (players[0].lap > maxLaps) {
          const ghostData = Ghost.finalizeRecording(ghostRecorder, cIdx, maxLaps, 'P1');
          const existingGhost = Ghost.load(cIdx, mode);
          if (Ghost.shouldUpdate(ghostData, existingGhost)) {
            Ghost.save(ghostData, mode);
          }
        }

        // スコア保存
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

      // コース環境ビジュアルエフェクト
      const courseVisual = CourseEffects.getEffect(cur.deco).visualEffect;
      if (courseVisual !== 'none') {
        Render.courseEffect(ctx, courseVisual, Date.now());
      }
      Render.startLine(ctx, sl);
      Render.checkpoints(ctx, cpCoords);
      Render.particles(ctx, particles, sparks);

      // ゴースト描画
      if (ghostPlayer && ghostEnabled && !demo && raceStart > 0) {
        const raceTime = Date.now() - raceStart;
        const ghostPos = Ghost.getPosition(ghostPlayer, raceTime);
        if (ghostPos) {
          Render.ghostKart(ctx, ghostPos.x, ghostPos.y, ghostPos.angle, col1);
        }
      }

      players
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach(p => Render.kart(ctx, p));

      if (state === 'countdown' && !demo) {
        const el = Date.now() - cdStart;
        const count = Math.ceil((Config.timing.countdown - el) / 1000);
        if (count !== lastCd && count > 0 && count <= 3) {
          SoundEngine.countdown();
          lastCd = count;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (el < Config.timing.countdown) {
          ctx.fillText(String(count), width / 2, height / 2);
        } else {
          if (raceStart === 0) {
            raceStart = Date.now();
            setState('race');
            SoundEngine.go();
            players.forEach(p => (p.lapStart = Date.now()));
          }
        }
      }

      if ((state === 'race' || demo) && raceStart !== 0 && raceStart - Date.now() < 1000) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO!', width / 2, height / 2);
      }

      // ドラフトUI描画
      if (state === 'draft' && draftState.active) {
        const pi = draftState.currentPlayer;
        const hand = decks[pi].hand;
        const animProgress = Math.min(1, (Date.now() - draftState.animStart) / 800);

        Render.draftUI(
          ctx,
          hand,
          draftState.selectedIndex,
          draftState.timer,
          15,
          players[pi].name,
          draftState.completedLap,
          draftState.confirmed,
          animProgress
        );
      }

      if (state === 'result') {
        Render.confetti(ctx, confetti);
        Render.fireworks(ctx, Date.now());
      }

      // HUD
      if (state === 'race' || state === 'draft' || demo) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(cur.name, 20, 20);

        players.forEach((p, i) => {
          const y = 50 + i * 30;
          ctx.fillStyle = p.color;
          ctx.fillText(`${p.name}: LAP ${Math.min(p.lap, maxLaps)}/${maxLaps}`, 20, y);

          // HEAT ゲージ
          Render.heatGauge(ctx, p.heat, 250, y + 2);

          // ドリフトインジケータ
          Render.driftIndicator(ctx, p);
        });

        if (lapAnn && Date.now() - lapAnnT < Config.timing.lapAnnounce) {
          ctx.fillStyle = '#ffeb3b';
          ctx.font = 'bold 60px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lapAnn, width / 2, 200);
        }
      }

      // ハイライト通知バナー
      if (state === 'race' || state === 'draft') {
        for (const notif of hlNotifications) {
          Render.highlightBanner(ctx, notif, Highlight.COLORS);
        }
      }

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      if (isRunning) requestAnimationFrame(loop);
    };

    // Confetti init for result
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, course, speed, cpu, laps, c1, c2, state, paused, demo, winner, ghostEnabled]);

  const reset = () => {
    setState('menu');
    setWinner(null);
    setResults(null);
    setHighlightSummary([]);
    setPaused(false);
  };

  const startGame = () => {
    setState('countdown');
    setDemo(false);
  };

  // ゴーストデータの有無チェック
  const hasGhostData = (() => {
    try {
      const cIdx = Utils.clamp(course, 0, Courses.length - 1);
      return Ghost.load(cIdx, mode) !== null;
    } catch {
      return false;
    }
  })();

  return (
    <PageContainer>
      <GameContainer>
        <div style={{ textAlign: 'center' }}>
          <Title>Racing Game</Title>
          <SubTitle>{Courses[Utils.clamp(course, 0, Courses.length - 1)]?.name || ''}</SubTitle>
          <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '0.5rem' }}>
            Best:{' '}
            {bests[`c${course}-l${laps}`]
              ? Utils.formatTime(bests[`c${course}-l${laps}`])
              : '--:--.-'}
          </div>
        </div>

        <CanvasContainer>
          <Canvas ref={canvasRef} role="img" aria-label="レーシングゲーム画面" tabIndex={0} />

          {state === 'menu' && (
            <Overlay>
              <ResultTitle style={{ marginBottom: '0.5rem', color: '#fbbf24', fontSize: '1.5rem' }}>
                🏎️ レースゲーム
              </ResultTitle>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Mode</Label>
                <Btn $sel={mode === '2p'} onClick={() => setMode('2p')} $color="#10b981">
                  👫2人
                </Btn>
                <Btn $sel={mode === 'cpu'} onClick={() => setMode('cpu')} $color="#a855f7">
                  🤖CPU
                </Btn>
              </ControlGroup>

              {mode === 'cpu' && (
                <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                  <Label style={{ fontSize: '0.8rem' }}>CPU Level</Label>
                  {Options.cpu.map((c, i) => (
                    <Btn key={i} $sel={cpu === i} onClick={() => setCpu(i)} $color="#f97316">
                      {c.label.split(' ')[0]}
                    </Btn>
                  ))}
                </ControlGroup>
              )}

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>P1 Color</Label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Colors.car.map((c, i) => (
                    <ColorBtn
                      key={i}
                      $color={c}
                      $sel={c1 === i}
                      onClick={() => setC1(i)}
                      label={`P1 Color ${i + 1}`}
                    />
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>{mode === 'cpu' ? 'CPU' : 'P2'} Color</Label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Colors.car.map((c, i) => (
                    <ColorBtn
                      key={i}
                      $color={c}
                      $sel={c2 === i}
                      onClick={() => setC2(i)}
                      label={`P2 Color ${i + 1}`}
                    />
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup
                style={{
                  padding: '0.25rem 0.5rem',
                  maxWidth: '800px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Label style={{ fontSize: '0.8rem' }}>Course</Label>
                {Courses.map((c, i) => (
                  <Button
                    key={i}
                    $active={course === i}
                    onClick={() => setCourse(i)}
                    $color="#eab308"
                    style={{
                      color: '#000',
                      marginRight: '2px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    {c.name}
                  </Button>
                ))}
              </ControlGroup>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Speed</Label>
                {Options.speed.map((s, i) => (
                  <Btn key={i} $sel={speed === i} onClick={() => setSpeed(i)} $color="#3b82f6">
                    {s.label.split(' ')[0]}
                  </Btn>
                ))}
              </ControlGroup>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Laps</Label>
                {Options.laps.map(l => (
                  <Btn key={l} $sel={laps === l} onClick={() => setLaps(l)} $color="#ec4899">
                    {l}周
                  </Btn>
                ))}
              </ControlGroup>

              {/* ゴーストトグル */}
              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Ghost</Label>
                <Btn
                  $sel={ghostEnabled}
                  onClick={() => hasGhostData && setGhostEnabled(!ghostEnabled)}
                  $color={hasGhostData ? '#8b5cf6' : '#4b5563'}
                  style={{ opacity: hasGhostData ? 1 : 0.4 }}
                >
                  {ghostEnabled ? '👻ON' : '👻OFF'}
                </Btn>
              </ControlGroup>

              <ActionButton
                onClick={startGame}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 2rem',
                  background: 'linear-gradient(to right, #4ade80, #facc15)',
                  color: '#000',
                  fontSize: '1rem',
                }}
              >
                🏁 スタート!
              </ActionButton>
            </Overlay>
          )}

          {state === 'result' && results && (
            <Overlay>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆👑🏆</div>
              <ResultTitle>{results.winnerName} Wins!</ResultTitle>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: results.winnerColor,
                }}
              >
                {results.winnerName}
              </div>
              <ResultCard>
                <ResultRow>
                  <span>Total Time:</span> <span>{Utils.formatTime(results.times.p1)}</span>
                </ResultRow>
                <ResultRow>
                  <span>Fastest Lap:</span> <span>{Utils.formatTime(results.fastest)}</span>
                </ResultRow>
              </ResultCard>

              {/* ハイライトサマリー */}
              {highlightSummary.length > 0 && (
                <ResultCard style={{ marginTop: '0.5rem' }}>
                  <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    ─── ハイライト ───
                  </div>
                  {highlightSummary.map((s, i) => (
                    <ResultRow key={i}>
                      <span>{Highlight.LABELS[s.type]} × {s.count}</span>
                      <span>+{s.totalScore}pt</span>
                    </ResultRow>
                  ))}
                  <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    合計: {highlightSummary.reduce((a, s) => a + s.totalScore, 0).toLocaleString()}pt
                  </div>
                </ResultCard>
              )}

              <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginTop: '1rem' }}>
                Best:{' '}
                {bests[`c${course}-l${laps}`]
                  ? Utils.formatTime(bests[`c${course}-l${laps}`])
                  : '--:--.-'}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <ShareButton
                  text={`Racing Gameで${Utils.formatTime(results.times.p1)}のタイムを出しました！`}
                  hashtags={['RacingGame', 'GamePlatform']}
                />
              </div>
              <div style={{ marginTop: '2rem' }}>
                <ActionButton
                  onClick={reset}
                  style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)' }}
                >
                  🔄 もういちど
                </ActionButton>
              </div>
            </Overlay>
          )}

          {paused && (
            <Overlay>
              <ResultTitle>PAUSED</ResultTitle>
              <ActionButton onClick={() => setPaused(false)}>Resume</ActionButton>
              <Button onClick={reset} style={{ marginTop: '1rem' }}>
                Exit
              </Button>
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
          <p
            style={{
              color: '#9ca3af',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            P1:A/D P2:←/→ P:ポーズ ESC:終了
          </p>
        </div>
      </GameContainer>
    </PageContainer>
  );
}
