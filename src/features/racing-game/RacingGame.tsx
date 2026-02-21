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

  // ゲームループ内部で使用する ref（依存配列による再初期化を防止）
  const gamePhaseRef = useRef<string>('menu');
  const pausedRef = useRef(false);
  const winnerRef = useRef<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch, setTouch, onKeyDown } = useInput();
  const [demo, setDemo] = useIdle(state === 'menu', Config.timing.idle);

  // ref とReact state の同期
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { cardsEnabledRef.current = cardsEnabled; }, [cardsEnabled]);

  // P/ESC キーハンドリング
  useEffect(() => {
    onKeyDown.current = (key: string) => {
      const phase = gamePhaseRef.current;
      if (key === 'p' || key === 'P') {
        // race/draft/countdown でポーズトグル
        if (phase === 'race' || phase === 'draft' || phase === 'countdown') {
          setPaused(prev => !prev);
        }
      } else if (key === 'Escape') {
        if (phase === 'result') {
          // リザルト画面では即メニューへ
          reset();
        } else if (pausedRef.current) {
          // ポーズ中の ESC でメニューへ戻る
          reset();
        } else if (phase === 'race' || phase === 'draft' || phase === 'countdown') {
          // ゲーム中の ESC でまずポーズ
          setPaused(true);
        }
      }
    };
    return () => { onKeyDown.current = null; };
  });

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

    // ゲームフェーズ更新ヘルパー（ref + React state を同時更新）
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
      ? [
          Entity.player(
            pts[0].x,
            pts[0].y - 30,
            sAngle,
            col1,
            'P1',
            false
          ),
        ]
      : [
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
    let cpuDraftTimer1: number | undefined;
    let cpuDraftTimer2: number | undefined;
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
    // ドラフト済みラップ追跡（同一ラップでの二重発動防止）
    const draftedLaps = new Set<number>();

    // === ハイライト状態 ===
    let hlTracker: HighlightTracker = Highlight.createTracker(players.length);
    const hlNotifications: (HighlightEvent & { displayTime: number; startTime: number })[] = [];
    const MAX_NOTIFICATIONS = 1;

    // === CPU カード選択通知 ===
    let cpuCardNotification: { cardName: string; cardIcon: string; startTime: number } | null = null;

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
      draftedLaps.add(completedLap);
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

      SoundEngine.stopEngine();
      engineOn = false;
      setPhase('draft');
    };

    /** ドラフト確定処理 */
    const confirmDraftSelection = () => {
      if (draftState.confirmed) return;
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

      // CPU モード → CPU の手札を表示してから選択
      if (mode === 'cpu' && pi === 0) {
        // P1 確定後、CPU の手札画面に切り替え
        draftState = {
          ...draftState,
          currentPlayer: 1,
          selectedIndex: -1, // まだ未選択
          confirmed: false,
          animStart: Date.now(),
        };
        // 1.2秒後に CPU がカードを選択
        cpuDraftTimer1 = window.setTimeout(() => {
          decks[1] = DraftCards.cpuSelectCard(decks[1], cpuCfg.skill);
          // 選択されたカードのインデックスを表示
          const selectedCard = decks[1].history[decks[1].history.length - 1];
          const selectedIdx = decks[1].hand.findIndex(c => c.id === selectedCard?.id);
          draftState.selectedIndex = selectedIdx >= 0 ? selectedIdx : 0;
          draftState.confirmed = true;

          // CPU選択カード通知
          if (selectedCard) {
            cpuCardNotification = {
              cardName: selectedCard.name,
              cardIcon: selectedCard.icon,
              startTime: Date.now(),
            };
          }

          // さらに 0.8秒後にレース再開
          cpuDraftTimer2 = window.setTimeout(() => {
            players = players.map((p, idx) => {
              const effects = DraftCards.getActiveEffects(decks[idx]);
              return {
                ...p,
                activeCards: decks[idx].active,
                shieldCount: p.shieldCount + (effects.shieldCount ?? 0),
              };
            });
            draftState.active = false;
            draftState.pendingResume = false;
            setPhase('race');
          }, 800);
        }, 1200);
        return;
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

        setPhase('race');
      }, 500);
    };

    const update = () => {
      if (pausedRef.current || !isRunning) return;
      if (demo && Date.now() - demoStart > Config.timing.demo) {
        setDemo(false);
        return;
      }

      // === ドラフト状態の更新 ===
      if (gamePhaseRef.current === 'draft' && draftState.active) {
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
        // カード効果: 旋回速度倍率
        const turnMul = p.activeCards.reduce(
          (acc, c) => acc * (c.turnMultiplier ?? 1), 1
        );
        // ドリフト中は旋回速度を増幅
        const turnRate = p.drift.active && rot !== 0
          ? Math.sign(rot) * (Config.game.turnRate * 1.8 * turnMul)
          : rot * turnMul;
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
          // カード効果: 最高速度倍率
          const speedMul = p.activeCards.reduce(
            (acc, c) => acc * (c.speedMultiplier ?? 1), 1
          );
          const effectiveBaseSpd = (baseSpd * friction + spdMod) * speedMul;

          // カード効果: 加速力倍率・ドリフトブースト倍率
          const accelMul = p.activeCards.reduce((acc, c) => acc * (c.accelMultiplier ?? 1), 1);
          const driftBoostMul = p.activeCards.reduce((acc, c) => acc * (c.driftBoostMultiplier ?? 1), 1);

          // 移動
          const input = playerInputs[i];
          // eslint-disable-next-line prefer-const
          let { p: np, info, hit, wallStage } = Logic.movePlayer(p, effectiveBaseSpd, pts, input.handbrake, input.rot, accelMul, driftBoostMul);

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
              const lapTime = p.lapStart > 0 ? Date.now() - p.lapStart : 0;
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
                if (!demo && !winnerRef.current) {
                  const winName = p.name;
                  winnerRef.current = winName;
                  setWinner(winName);
                  finished = true;
                  SoundEngine.stopEngine();
                  SoundEngine.finish();
                }
                return np;
              }

              // ドラフト発動判定（CPUモードではP1のみ、2Pモードではどちらでもドラフト発動）
              if (!demo && (i === 0 || mode === '2p') && np.lap <= maxLaps && maxLaps > 1 && !triggerDraft && cardsEnabledRef.current && mode !== 'solo' && !draftedLaps.has(np.lap - 1)) {
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

        // 逆転検出（2人以上のみ）
        if (!demo && players.length >= 2) {
          const positions = players.map(p => p.progress);
          for (let i = 0; i < 2; i++) {
            const otResult = Highlight.checkOvertake(hlTracker, positions, i, players[i].lap, raceTime);
            hlTracker = otResult.tracker;
            if (otResult.event) pushNotification(otResult.event);
          }
        }

        // 衝突判定（2人以上のみ）
        if ((gamePhaseRef.current === 'race' || demo) && players.length >= 2) {
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

        // フォトフィニッシュ検出（2人以上のみ）
        if (players.length >= 2 && players[0].lapTimes.length > 0 && players[1].lapTimes.length > 0) {
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

      players
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach(p => Render.kart(ctx, p));

      if (gamePhaseRef.current === 'countdown' && !demo) {
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
            setPhase('race');
            SoundEngine.go();
            players = players.map(p => ({ ...p, lapStart: Date.now() }));
          }
        }
      }

      if ((gamePhaseRef.current === 'race' || demo) && raceStart !== 0 && Date.now() - raceStart < 1000) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO!', width / 2, height / 2);
      }

      // ドラフトUI描画
      if (gamePhaseRef.current === 'draft' && draftState.active) {
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

      if (gamePhaseRef.current === 'result') {
        Render.confetti(ctx, confetti);
        Render.fireworks(ctx, Date.now());
      }

      // HUD
      if (gamePhaseRef.current === 'race' || gamePhaseRef.current === 'draft' || demo) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(cur.name, 20, 20);

        players.forEach((p, i) => {
          const y = 50 + i * 55;
          ctx.fillStyle = p.color;
          ctx.fillText(`${p.name}: LAP ${Math.min(p.lap, maxLaps)}/${maxLaps}`, 20, y);

          // HEAT ゲージ
          Render.heatGauge(ctx, p.heat, 250, y + 2);

          // ドリフトインジケータ
          Render.driftIndicator(ctx, p);

          // ラップタイム表示
          if (raceStart > 0) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ccc';
            // 現在ラップ経過時間
            const currentLapTime = Date.now() - p.lapStart;
            ctx.fillText(`⏱ ${Utils.formatTime(currentLapTime)}`, 20, y + 24);
            // 直前ラップタイム
            if (p.lapTimes.length > 0) {
              const lastLap = p.lapTimes[p.lapTimes.length - 1];
              ctx.fillStyle = '#999';
              ctx.fillText(`前: ${Utils.formatTime(lastLap)}`, 150, y + 24);
            }
            ctx.font = 'bold 20px Arial';
          }
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
      if (gamePhaseRef.current === 'race' || gamePhaseRef.current === 'draft') {
        hlNotifications.forEach((notif, index) => {
          Render.highlightBanner(ctx, notif, Highlight.COLORS, index);
        });
      }

      // CPU カード選択通知バナー
      if (cpuCardNotification) {
        const elapsed = Date.now() - cpuCardNotification.startTime;
        const displayDuration = 3000;
        if (elapsed < displayDuration) {
          const fadeIn = Math.min(1, elapsed / 200);
          const fadeOut = elapsed > displayDuration - 500 ? (displayDuration - elapsed) / 500 : 1;
          ctx.globalAlpha = Math.min(fadeIn, fadeOut) * 0.85;
          const bannerW = 280;
          const bannerH = 36;
          const bx = (width - bannerW) / 2;
          const by = height - 70;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(bx, by, bannerW, bannerH, 8);
          ctx.fill();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bannerW, bannerH, 8);
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `CPU: ${cpuCardNotification.cardIcon} ${cpuCardNotification.cardName}`,
            width / 2, by + bannerH / 2
          );
          ctx.globalAlpha = 1;
          ctx.textBaseline = 'alphabetic';
        } else {
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
                <Btn $sel={mode === 'solo'} onClick={() => setMode('solo')} $color="#3b82f6">
                  🏃ソロ
                </Btn>
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

              {/* P1 Color は常に表示 */}

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

              {mode !== 'solo' && (
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
              )}

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

              {/* カードトグル（ソロモード以外で表示） */}
              {mode !== 'solo' && (
                <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                  <Label style={{ fontSize: '0.8rem' }}>Cards</Label>
                  <Btn
                    $sel={cardsEnabled}
                    onClick={() => setCardsEnabled(true)}
                    $color="#10b981"
                  >
                    ON
                  </Btn>
                  <Btn
                    $sel={!cardsEnabled}
                    onClick={() => setCardsEnabled(false)}
                    $color="#ef4444"
                  >
                    OFF
                  </Btn>
                </ControlGroup>
              )}

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
              <div style={{ fontSize: '1.5rem' }}>{mode === 'solo' ? '🏁' : '🏆👑🏆'}</div>
              <ResultTitle>{mode === 'solo' ? 'FINISH!' : `${results.winnerName} Wins!`}</ResultTitle>
              {mode !== 'solo' && (
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: results.winnerColor,
                  }}
                >
                  {results.winnerName}
                </div>
              )}
              <ResultCard>
                <ResultRow>
                  <span>Total Time:</span> <span>{Utils.formatTime(results.times.p1)}</span>
                </ResultRow>
                <ResultRow>
                  <span>Fastest Lap:</span> <span>{Utils.formatTime(results.fastest)}</span>
                </ResultRow>
              </ResultCard>

              {/* ラップ別タイム */}
              {results.lapTimes && results.lapTimes.length > 0 && (
                <ResultCard>
                  <div style={{ color: '#a5b4fc', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    ─── ラップタイム ───
                  </div>
                  {results.lapTimes.map((lt, i) => {
                    const isFastest = lt === results.fastest;
                    return (
                      <ResultRow key={i}>
                        <span>{isFastest ? '★ ' : ''}Lap {i + 1}:</span>
                        <span style={isFastest ? { color: '#fbbf24', fontWeight: 'bold' } : {}}>
                          {Utils.formatTime(lt)}
                        </span>
                      </ResultRow>
                    );
                  })}
                </ResultCard>
              )}

              {/* ハイライトサマリー */}
              {highlightSummary.length > 0 && (
                <ResultCard>
                  <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    ─── ハイライト ───
                  </div>
                  {highlightSummary.map((s, i) => (
                    <ResultRow key={i}>
                      <span>{Highlight.LABELS[s.type]} × {s.count}</span>
                      <span>+{s.totalScore}pt</span>
                    </ResultRow>
                  ))}
                  <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                    合計: {highlightSummary.reduce((a, s) => a + s.totalScore, 0).toLocaleString()}pt
                  </div>
                </ResultCard>
              )}

              <div style={{ color: '#fbbf24', fontSize: '1rem' }}>
                Best:{' '}
                {bests[`c${course}-l${laps}`]
                  ? Utils.formatTime(bests[`c${course}-l${laps}`])
                  : '--:--.-'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ShareButton
                  text={`Racing Gameで${Utils.formatTime(results.times.p1)}のタイムを出しました！`}
                  hashtags={['RacingGame', 'GamePlatform']}
                />
              </div>
              <div style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>
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
