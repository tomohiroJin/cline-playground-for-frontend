import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from './audio';
import { Config } from './config';
import { EffectType, GameState, ObstacleType, SpeedRank } from './constants';
import { CollisionDomain } from './domains/collision-domain';
import { ComboDomain } from './domains/combo-domain';
import { DangerDomain } from './domains/danger-domain';
import { GeometryDomain } from './domains/geometry-domain';
import { ScoringDomain } from './domains/scoring-domain';
import { SpeedDomain } from './domains/speed-domain';
import { MathUtils } from './domains/math-utils';
import { EntityFactory } from './entities';
import { BackgroundGen, RampGen } from './generators';
import { useCheatCode, useIsMobile } from './hooks';
import { ParticleSys } from './particles';
import { Physics } from './physics';
import {
  ClearAnim,
  DeathState,
  EffectState,
  GameStateValue,
  InputState,
  NearMissEffect,
  Particle,
  Player,
  Ramp,
  ScorePopup,
  TouchKeys,
} from './types';
import {
  BuildingRenderer,
  CloudRenderer,
  CountdownOverlay,
  DangerVignette,
  MobileControls,
  NearMissRenderer,
  ParticlesRenderer,
  PlayerRenderer,
  RampRenderer,
  ScorePopupsRenderer,
  ScreenOverlay,
  UIOverlay,
} from './renderers';
import { getHighScore, saveScore } from '../../utils/score-storage';

const SCORE_KEY = 'non_brake_descent';

type CollisionHandlerResult = boolean | 'slow';

type CollisionCallbacks = {
  onDie: (type: DeathState['type']) => void;
  onScore: (ox: number) => void;
  onEffect: (type: EffectState['type']) => void;
  onEnemyKill: (ox: number) => void;
  onBounce: (vx: number) => void;
};

const createCollisionHandlers = (
  rank: typeof SpeedRank[keyof typeof SpeedRank],
  cb: CollisionCallbacks,
  godMode: boolean
): Partial<
  Record<
    (typeof ObstacleType)[keyof typeof ObstacleType],
    (col: ReturnType<typeof CollisionDomain.check>, obs: Ramp['obs'][number], ox: number, px: number) => CollisionHandlerResult
  >
> => {
  const { onDie, onScore, onEffect, onEnemyKill, onBounce } = cb;
  const die = godMode ? (() => {}) : onDie;
  const bounce = godMode ? (() => {}) : onBounce;
  const handleEnemy = (col: ReturnType<typeof CollisionDomain.check>, obs: Ramp['obs'][number], ox: number, px: number) => {
    if (!col.hit) return false;
    if (rank === SpeedRank.HIGH) {
      die('enemy');
      return true;
    }
    if (rank === SpeedRank.MID) {
      obs.t = ObstacleType.DEAD;
      onEnemyKill(ox);
      return 'slow';
    }
    bounce(px < ox ? -5 : 5);
    return false;
  };
  return {
    [ObstacleType.HOLE_S]: col => (col.ground && rank === SpeedRank.LOW ? (die('fall'), true) : false),
    [ObstacleType.HOLE_L]: col => (col.ground ? (die('fall'), true) : false),
    [ObstacleType.ROCK]: col => (col.hit ? (die('rock'), true) : false),
    [ObstacleType.ENEMY]: handleEnemy,
    [ObstacleType.ENEMY_V]: handleEnemy,
    [ObstacleType.SCORE]: (col, obs, ox) => (col.hit ? ((obs.t = ObstacleType.TAKEN), onScore(ox), false) : false),
    [ObstacleType.REVERSE]: (col, obs) => (col.hit ? ((obs.t = ObstacleType.TAKEN), onEffect('reverse'), false) : false),
    [ObstacleType.FORCE_JUMP]: (col, obs) => (col.hit ? ((obs.t = ObstacleType.TAKEN), onEffect('forceJ'), false) : false),
  };
};

type NonBrakeDescentGameProps = {
  onScoreChange?: (score: number) => void;
};

export const NonBrakeDescentGame: React.FC<NonBrakeDescentGameProps> = ({ onScoreChange }) => {
  const { width: W, height: H } = Config.screen;
  const { total: TOTAL, height: RAMP_H } = Config.ramp;
  const { min: MIN_SPD } = Config.speed;

  const [state, setState] = useState<GameStateValue>(GameState.TITLE);
  const [countdown, setCountdown] = useState(3);
  const [player, setPlayer] = useState<Player>(EntityFactory.createPlayer);
  const [speed, setSpeed] = useState<number>(MIN_SPD);
  const [camY, setCamY] = useState(0);
  const [ramps, setRamps] = useState<Ramp[]>([]);
  const [score, setScore] = useState(0);
  const [hiScore, setHiScore] = useState(0);
  const [lastRamp, setLastRamp] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [effect, setEffect] = useState<EffectState>({ type: undefined, timer: 0 });
  const [death, setDeath] = useState<DeathState | undefined>(undefined);
  const [shake, setShake] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [jetParticles, setJetParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [nearMissEffects, setNearMissEffects] = useState<NearMissEffect[]>([]);
  const [nearMissCount, setNearMissCount] = useState(0);
  const [clearAnim, setClearAnim] = useState<ClearAnim>({ phase: 0, frame: 0 });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [transitionEffect, setTransitionEffect] = useState(0);
  const [clouds, setClouds] = useState(BackgroundGen.initClouds());
  const [buildings] = useState(BackgroundGen.initBuildings);
  const [dangerLevel, setDangerLevel] = useState(0);

  const frameRef = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const touchKeys = useRef<TouchKeys>({ left: false, right: false, accel: false, jump: false });
  const passedObs = useRef<Set<string>>(new Set());

  const isMobile = useIsMobile();
  const handleCheat = useCheatCode('jinjinjin', () => {
    setGodMode(current => {
      Audio.init();
      Audio.play(!current ? 'score' : 'death');
      return !current;
    });
  });

  const addParticles = useCallback((x: number, y: number, color: string, count: number) => {
    setParticles(prev => [...prev, ...EntityFactory.createParticles(x, y, color, count)]);
  }, []);

  const addScorePopup = useCallback((x: number, y: number, text: string, color: string) => {
    setScorePopups(prev => [...prev, EntityFactory.createScorePopup(x, y, text, color)]);
  }, []);

  const resetGameState = useCallback(() => {
    setPlayer(EntityFactory.createPlayer());
    setSpeed(MIN_SPD);
    setCamY(0);
    setScore(0);
    setLastRamp(0);
    setSpeedBonus(0);
    setStartTime(Date.now());
    setEffect({ type: undefined, timer: 0 });
    setDeath(undefined);
    setParticles([]);
    setJetParticles([]);
    setScorePopups([]);
    setNearMissEffects([]);
    setNearMissCount(0);
    setClearAnim({ phase: 0, frame: 0 });
    setIsNewHighScore(false);
    setCombo(0);
    setComboTimer(0);
    setTransitionEffect(0);
    setDangerLevel(0);
    setClouds(BackgroundGen.initClouds());
    passedObs.current = new Set();
    frameRef.current = 0;
  }, [MIN_SPD]);

  const startCountdown = useCallback(() => {
    Audio.init();
    setRamps(RampGen.generate(TOTAL));
    resetGameState();
    setCountdown(3);
    setState(GameState.COUNTDOWN);
    Audio.playMelody('start');
  }, [TOTAL, resetGameState]);

  const startGame = useCallback(() => {
    setState(GameState.PLAY);
    setStartTime(Date.now());
    Audio.startBGM();
  }, []);

  const goToTitle = useCallback(() => {
    setState(GameState.TITLE);
    setClearAnim({ phase: 0, frame: 0 });
    setIsNewHighScore(false);
    Audio.stopBGM();
    Audio.playMelody('title');
  }, []);

  const commitScore = useCallback(
    (finalScore: number) => {
      setScore(finalScore);
      setHiScore(prev => {
        if (finalScore > prev) {
          setIsNewHighScore(true);
          return finalScore;
        }
        return prev;
      });
      void saveScore(SCORE_KEY, finalScore);
    },
    []
  );

  const handleDeath = useCallback(
    (type: DeathState['type']) => {
      Audio.stopBGM();
      Audio.playMelody('gameOver');
      const rank = SpeedDomain.getRank(speed);
      const finalScore = ScoringDomain.calcFinal(score, speedBonus);
      commitScore(finalScore);
      setDeath({ type, frame: 0, fast: rank === SpeedRank.HIGH });
      setShake(rank === SpeedRank.HIGH ? 18 : 6);
      addParticles(player.x, player.ramp * RAMP_H - camY + 30, '#ff4444', rank === SpeedRank.HIGH ? 15 : 8);
      setState(GameState.DYING);
    },
    [speed, score, speedBonus, player, camY, RAMP_H, addParticles, commitScore]
  );

  const handleClear = useCallback(() => {
    Audio.stopBGM();
    const elapsed = (Date.now() - startTime) / 1000;
    const timeBonus = ScoringDomain.calcTimeBonus(elapsed);
    const finalScore = ScoringDomain.calcFinal(score, speedBonus, timeBonus);
    commitScore(finalScore);
    setClearAnim({ phase: 1, frame: 0 });
    setState(GameState.CLEAR);
    Audio.playMelody('clear');
  }, [score, speedBonus, startTime, commitScore]);

  const handleTouch = useCallback(
    (key: keyof TouchKeys, value: boolean) =>
      (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        touchKeys.current[key] = value;
      },
    []
  );

  const handleTap = useCallback(() => {
    if (state === GameState.TITLE || state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2)) {
      startCountdown();
    }
  }, [state, clearAnim.phase, startCountdown]);

  useEffect(() => {
    let mounted = true;
    void getHighScore(SCORE_KEY).then(stored => {
      if (mounted) setHiScore(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (state !== GameState.COUNTDOWN) return;
    const iv = window.setInterval(() =>
      setCountdown(current => {
        if (current <= 1) {
          Audio.play('countdownGo');
          startGame();
          return 0;
        }
        Audio.play('countdown');
        return current - 1;
      }),
      Config.animation.countdownInterval
    );
    return () => window.clearInterval(iv);
  }, [state, startGame]);

  useEffect(() => {
    if (state !== GameState.DYING) return;
    const iv = window.setInterval(() => {
      setDeath(current => {
        if (!current) return current;
        if (current.frame >= Config.animation.deathFrames) {
          setState(GameState.OVER);
          window.setTimeout(() => {
            Audio.playMelody('gameOverScreen');
            Audio.playMelody('rankReveal');
          }, 300);
          return current;
        }
        return { ...current, frame: current.frame + 1 };
      });
      setShake(current => Math.max(0, current * 0.88));
    }, 35);
    return () => window.clearInterval(iv);
  }, [state]);

  useEffect(() => {
    if (!onScoreChange) return;
    onScoreChange(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    if (state !== GameState.CLEAR) return;
    const iv = window.setInterval(
      () =>
        setClearAnim(current => {
          if (current.phase === 1 && current.frame >= Config.animation.clearPhase1Frames) {
            Audio.playMelody('rankReveal');
            return { phase: 2, frame: 0 };
          }
          return { ...current, frame: current.frame + 1 };
        }),
      30
    );
    return () => window.clearInterval(iv);
  }, [state]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
      if (state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2)) {
        if (event.code === 'Space') startCountdown();
        else if (event.code === 'Escape' || event.code === 'KeyT') goToTitle();
      } else if (state === GameState.TITLE) {
        if (event.code === 'Space') startCountdown();
        handleCheat(event.key);
      }
      event.preventDefault();
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [state, clearAnim.phase, startCountdown, goToTitle, handleCheat]);

  useEffect(() => {
    if (state === GameState.TITLE) {
      const t = window.setTimeout(() => Audio.playMelody('title'), 500);
      return () => window.clearTimeout(t);
    }
    return;
  }, [state]);

  useEffect(() => {
    if (state !== GameState.PLAY) return;
    const loop = window.setInterval(() => {
      frameRef.current++;
      const keyState = keys.current;
      const touchState = touchKeys.current;
      const reverse = effect.type === EffectType.REVERSE;
      const input: InputState = {
        left: reverse ? keyState.ArrowRight || touchState.right : keyState.ArrowLeft || touchState.left,
        right: reverse ? keyState.ArrowLeft || touchState.left : keyState.ArrowRight || touchState.right,
        accel: keyState.KeyZ || touchState.accel,
        jump: keyState.KeyX || touchState.jump,
      };
      setEffect(current =>
        current.timer <= 0 ? { type: undefined, timer: 0 } : { ...current, timer: current.timer - 1 }
      );
      setSpeed(current => SpeedDomain.accelerate(current, input.accel));
      setParticles(current => ParticleSys.updateAndFilter(current, ParticleSys.updateParticle));
      setScorePopups(current => ParticleSys.updateAndFilter(current, ParticleSys.updatePopup));
      setNearMissEffects(current => ParticleSys.updateAndFilter(current, ParticleSys.updateNearMiss));
      setComboTimer(ComboDomain.tick);
      setTransitionEffect(current => Math.max(0, current - 0.1));
      setClouds(current => ParticleSys.updateClouds(current, speed));
      setJetParticles(prev => {
        let updated = ParticleSys.updateAndFilter(prev, ParticleSys.updateParticle);
        if (speed > 5 && frameRef.current % 2 === 0) {
          const ramp = ramps[player.ramp];
          if (ramp) {
            const geo = GeometryDomain.getRampGeometry(ramp, W, RAMP_H);
            const slopeY = GeometryDomain.getSlopeY(player.x, geo, ramp.type);
            updated = [...updated, EntityFactory.createJetParticle(player.x, player.ramp * RAMP_H - camY + slopeY, ramp.dir)];
          }
        }
        return updated;
      });
      const currentRampInLoop = ramps[player.ramp];
      if (currentRampInLoop) {
        setDangerLevel(DangerDomain.calcLevel(currentRampInLoop.obs, player.x, currentRampInLoop.dir, speed, W));
      }
      setPlayer(prev => {
        const ramp = ramps[prev.ramp];
        if (!ramp) return prev;
        let updated = Physics.applyMovement(prev, input, speed, ramp.dir);
        const jumpResult = Physics.applyJump(updated, input, effect.type, effect.timer);
        updated = jumpResult.player;
        if (jumpResult.didJump) Audio.play('jump');
        const transition = Physics.checkTransition(updated, ramps, W);
        if (transition.isGoal) {
          handleClear();
          return prev;
        }
        if (transition.transitioned) {
          Audio.play('rampChange');
          if (transition.player.ramp > lastRamp) {
            setLastRamp(transition.player.ramp);
            const scoreResult = ScoringDomain.calcRampScore(speed, comboTimer > 0 ? combo : 0);
            if (ComboDomain.shouldActivate(speed)) {
              const comboResult = ComboDomain.increment(combo, comboTimer);
              setCombo(comboResult.combo);
              setComboTimer(comboResult.timer);
              if (comboResult.combo > 1) {
                const comboScore = ScoringDomain.calcRampScore(speed, comboResult.combo);
                setScore(current => current + comboScore.base + comboScore.bonus);
                Audio.playCombo(comboResult.combo);
                addScorePopup(W / 2, 120, `+${comboScore.base + comboScore.bonus} (${comboResult.combo}x)`, '#ffaa00');
              } else {
                setScore(current => current + scoreResult.base);
              }
            } else {
              const reset = ComboDomain.reset();
              setCombo(reset.combo);
              setComboTimer(reset.timer);
              setScore(current => current + scoreResult.base);
            }
            setSpeedBonus(current => current + SpeedDomain.getBonus(speed));
            setTransitionEffect(1);
          }
          return transition.player;
        }
        return updated;
      });
      setPlayer(prev => {
        const ramp = ramps[prev.ramp];
        if (!ramp) return prev;
        const handlers = createCollisionHandlers(
          SpeedDomain.getRank(speed),
          {
            onDie: handleDeath,
            onScore: ox => {
              Audio.play('score');
              setScore(current => current + Config.score.item);
              addParticles(ox, prev.ramp * RAMP_H - camY + 25, '#ffdd00', 6);
              addScorePopup(ox, prev.ramp * RAMP_H - camY, `+${Config.score.item}`, '#ffdd00');
            },
            onEffect: type => {
              if (!type) return;
              Audio.play('hit');
              setEffect({ type, timer: Config.effect.duration });
            },
            onEnemyKill: ox => {
              Audio.play('enemyKill');
              setScore(current => current + Config.score.enemy);
              setSpeed(current => Math.max(MIN_SPD, current - 2));
              addParticles(ox, prev.ramp * RAMP_H - camY + 25, '#ff8800', 10);
              addScorePopup(ox, prev.ramp * RAMP_H - camY, `+${Config.score.enemy}`, '#ff8800');
            },
            onBounce: vx => {
              Audio.play('hit');
              setPlayer(current => ({ ...current, vx }));
            },
          },
          godMode
        );
        for (const obstacle of ramp.obs) {
          if (!CollisionDomain.isActive(obstacle)) continue;
          const ox = GeometryDomain.getObstacleX(obstacle, ramp, W);
          const col = CollisionDomain.check(prev.x, ox, prev.jumping, prev.y);
          const obsId = `${prev.ramp}-${obstacle.pos}`;
          if (CollisionDomain.isDangerous(obstacle.t) && col.nearMiss && !passedObs.current.has(obsId)) {
            passedObs.current.add(obsId);
            Audio.play('nearMiss');
            setNearMissCount(current => current + 1);
            setScore(current => current + Config.score.nearMiss);
            setNearMissEffects(current => [
              ...current,
              EntityFactory.createNearMissEffect(ox, prev.ramp * RAMP_H - camY + 25),
            ]);
            addScorePopup(ox, prev.ramp * RAMP_H - camY - 20, `NEAR MISS +${Config.score.nearMiss}`, '#44ffaa');
          }
          const handler = handlers[obstacle.t];
          if (handler) {
            const result = handler(col, obstacle, ox, prev.x);
            if (result === true) return prev;
            if (result === 'slow') return { ...prev, vx: -prev.vx * 0.4 };
          }
        }
        return prev;
      });
      setCamY(current => MathUtils.lerp(current, player.ramp * RAMP_H - H / 3, 0.1));
    }, 1000 / 60);
    return () => window.clearInterval(loop);
  }, [state, W, H, MIN_SPD, RAMP_H, addParticles, addScorePopup,
      speed, player, ramps, camY, effect, combo, comboTimer,
      lastRamp, godMode, handleDeath, handleClear]);

  useEffect(() => () => Audio.cleanup(), []);

  const currentRamp = ramps[player.ramp];
  const shakeOff = shake
    ? { x: MathUtils.randomRange(-0.5, 0.5) * shake, y: MathUtils.randomRange(-0.5, 0.5) * shake }
    : { x: 0, y: 0 };
  const bgColor = currentRamp ? GeometryDomain.getRampColor(player.ramp).bg : '#0a0a1a';
  const isPlaying = state === GameState.PLAY || state === GameState.DYING || state === GameState.COUNTDOWN;
  const showTap =
    isMobile && (state === GameState.TITLE || state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2));

  const title = useMemo(() => 'NON-BRAKE DESCENT', []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #050510 0%, #101025 100%)',
        padding: isMobile ? 5 : 10,
        fontFamily: 'monospace',
        touchAction: 'none',
        userSelect: 'none',
        width: '100%',
      }}
    >
      <h1 style={{ color: '#00eeff', fontSize: isMobile ? 16 : 18, margin: '5px 0', textShadow: '0 0 15px #00eeff', letterSpacing: 3 }}>
        {title}
      </h1>
      <div
        onClick={isMobile ? handleTap : undefined}
        style={{
          position: 'relative',
          width: isMobile ? Math.min(W, window.innerWidth - 10) : W,
          height: isMobile ? Math.min(H, window.innerHeight - 180) : H,
          background: `linear-gradient(180deg, ${bgColor} 0%, #0a0a15 100%)`,
          border: '2px solid #00ccff',
          borderRadius: 6,
          overflow: 'hidden',
          transform: `translate(${shakeOff.x}px, ${shakeOff.y}px)`,
          boxShadow: '0 0 25px rgba(0,200,255,0.25)',
        }}
      >
        <ScreenOverlay
          type={state}
          score={score}
          hiScore={hiScore}
          reachedRamp={player.ramp + 1}
          totalRamps={TOTAL}
          isNewHighScore={isNewHighScore}
          clearAnim={clearAnim}
          isMobile={isMobile}
        />
        {state === GameState.COUNTDOWN ? <CountdownOverlay count={countdown} /> : undefined}
        {isPlaying ? (
          <>
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <linearGradient id="jetGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="30%" stopColor="#ffaa00" />
                  <stop offset="100%" stopColor="#ff4400" stopOpacity="0" />
                </linearGradient>
              </defs>
              <BuildingRenderer buildings={buildings} camY={camY} />
              <CloudRenderer clouds={clouds} />
              {ramps.reduce<React.ReactElement[]>((acc, ramp, index) => {
                const ry = index * RAMP_H - camY;
                if (GeometryDomain.isInViewport(ry, RAMP_H, H)) {
                  acc.push(
                    <RampRenderer
                      key={index}
                      ramp={ramp}
                      index={index}
                      camY={camY}
                      frame={frameRef.current}
                      width={W}
                      height={RAMP_H}
                      transitionEffect={index === player.ramp ? transitionEffect : 0}
                    />
                  );
                }
                return acc;
              }, [])}
              <PlayerRenderer
                player={player}
                ramp={currentRamp}
                camY={camY}
                speed={speed}
                death={death}
                width={W}
                height={RAMP_H}
                jetParticles={jetParticles}
                dangerLevel={dangerLevel}
              />
              <ParticlesRenderer particles={particles} />
              <ScorePopupsRenderer popups={scorePopups} />
              <NearMissRenderer effects={nearMissEffects} />
            </svg>
            {state === GameState.PLAY ? (
              <>
                <UIOverlay
                  score={score}
                  speed={speed}
                  player={player}
                  effect={effect}
                  total={TOTAL}
                  speedBonus={speedBonus}
                  combo={combo}
                  comboTimer={comboTimer}
                  nearMissCount={nearMissCount}
                />
                <DangerVignette level={dangerLevel} />
              </>
            ) : undefined}
          </>
        ) : undefined}
      </div>
      {isMobile && (state === GameState.PLAY || state === GameState.COUNTDOWN) ? (
        <MobileControls touchKeys={touchKeys} onTouch={handleTouch} />
      ) : undefined}
      {!isMobile ? <div style={{ marginTop: 8, color: '#556', fontSize: 10 }}>← → 移動 / Z 加速 / X ジャンプ / SPACE 開始</div> : undefined}
      {showTap ? <div style={{ marginTop: 15, color: '#44ffaa', fontSize: 14 }}>タップしてスタート</div> : undefined}
    </div>
  );
};
