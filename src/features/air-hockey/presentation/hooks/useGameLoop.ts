/**
 * プレゼンテーション層 ゲームループフック
 *
 * 22 個の個別パラメータを 5 つのグループに整理:
 *   screen, showHelp, config, refs, callbacks
 *
 * requestAnimationFrame の管理と React state の同期を担当する。
 * ゲームロジックの詳細は将来的に GameLoopUseCase に完全委譲する予定。
 */
import React, { useEffect } from 'react';
import { Physics, quickReject } from '../../core/physics';
import { CpuAI } from '../../core/ai';
import { readGamepad, applyNonLinearCurve, GAMEPAD_MOVE_SPEED, GAMEPAD_INDEX } from '../../core/gamepad';
import { AI_BEHAVIOR_PRESETS, buildFreeBattleAiConfig, buildAllyAiConfig, type AiBehaviorConfig } from '../../core/story-balance';
import { EntityFactory, moveMalletTo, resolveMalletPuckOverlap, resolveMalletMalletOverlaps } from '../../core/entities';
import { getAllMallets, updateExtraMalletAI } from '../../core/pair-match-logic';
import { applyItemEffect } from '../../core/items';
import { CONSTANTS, DEFAULT_PLAYER_MALLET_COLOR, DEFAULT_CPU_MALLET_COLOR, getPlayerZone, type GameConstants } from '../../core/constants';
import { ITEMS } from '../../core/config';
import { magnitude, randomRange, clamp } from '../../../../utils/math-utils';
import { Renderer } from '../../renderer';
import type {
  GameState,
  FieldConfig,
  Difficulty,
  SoundSystem,
  Item,
  Puck,
  Particle,
  GamePhase,
  ShakeState,
  MatchStats,
  HitStopState,
  SlowMotionState,
} from '../../core/types';
import { applyKeyboardMovement } from '../../hooks/useKeyboardInput';
import type { KeyboardState } from '../../core/keyboard';
import { calculateKeyboardMovement, KEYBOARD_MOVE_SPEED } from '../../core/keyboard';

// ランダム選択ヘルパー
const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// カウントダウン定数
const COUNTDOWN_DURATION = 3000;
const GO_DISPLAY_DURATION = 500;

// シェイク定数
const GOAL_SHAKE_INTENSITY = 8;
const GOAL_SHAKE_DURATION = 300;
const HIT_SHAKE_INTENSITY = 3;
const HIT_SHAKE_DURATION = 150;
const STRONG_HIT_SPEED_THRESHOLD = 8;

/** ゲーム設定グループ */
export type GameLoopConfig = {
  difficulty: Difficulty;
  field: FieldConfig;
  winScore: number;
  getSound: () => SoundSystem;
  bgmEnabled: boolean;
  gameMode?: 'free' | 'story' | '2p-local' | '2v2-local';
  /** ステージ固有の AI 設定（指定時は difficulty プリセットより優先） */
  aiConfig?: AiBehaviorConfig;
  /** プレイヤーマレットの色（2P 対戦時にキャラカラーを反映） */
  playerMalletColor?: string;
  /** CPU/2P マレットの色（2P 対戦時にキャラカラーを反映） */
  cpuMalletColor?: string;
  /** P2 の操作タイプ（2v2 時のみ使用） */
  allyControlType?: 'cpu' | 'human';
  /** 2v2 キャラ ID（キャラ別 AI プロファイル用） */
  allyCharacterId?: string;
  enemyCharacter1Id?: string;
  enemyCharacter2Id?: string;
  /** P3/P4 の操作タイプ（2v2 + Gamepad 時のみ使用） */
  enemy1ControlType?: 'cpu' | 'human';
  enemy2ControlType?: 'cpu' | 'human';
};

/** Ref グループ（ゲームループが参照・更新する ref） */
export type GameLoopRefs = {
  gameRef: React.RefObject<GameState | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  lastInputRef: React.MutableRefObject<number>;
  scoreRef: React.MutableRefObject<{ p: number; c: number }>;
  phaseRef: React.MutableRefObject<GamePhase>;
  countdownStartRef: React.MutableRefObject<number>;
  shakeRef: React.MutableRefObject<ShakeState | null>;
  statsRef: React.MutableRefObject<MatchStats>;
  matchStartRef: React.MutableRefObject<number>;
  keysRef?: React.MutableRefObject<KeyboardState>;
  /** マウス/タッチ入力の目標位置 Ref（フレーム同期用） */
  playerTargetRef?: React.MutableRefObject<import('../../hooks/useInput').PlayerTargetPosition>;
  player2KeysRef?: React.MutableRefObject<KeyboardState>;
  /** マルチタッチ状態の Ref（2P タッチ入力用） */
  multiTouchRef?: React.RefObject<import('../../core/multi-touch').MultiTouchState>;
};

/** React state 更新コールバックグループ */
export type GameLoopCallbacks = {
  setScores: (s: { p: number; c: number }) => void;
  setWinner: (w: string | null) => void;
  setScreen: (s: 'menu' | 'game' | 'result') => void;
  setShowHelp: (v: boolean) => void;
  setShake: (s: ShakeState | null) => void;
};

/** useGameLoop のパラメータ（5 フィールド） */
export type UseGameLoopParams = {
  screen: string;
  showHelp: boolean;
  config: GameLoopConfig;
  refs: GameLoopRefs;
  callbacks: GameLoopCallbacks;
};

/** ゲームパッド入力をマレットに適用するヘルパー（RC-1: 重複コード解消） */
function applyGamepadToMallet(
  mallet: { x: number; y: number; vx: number; vy: number },
  gamepadIndex: number,
  playerSlot: 'player3' | 'player4',
  consts: GameConstants
): void {
  const gp = readGamepad(gamepadIndex);
  if (!gp) return;
  const zone = getPlayerZone(playerSlot, consts);
  const dx = applyNonLinearCurve(gp.axisX) * GAMEPAD_MOVE_SPEED;
  const dy = applyNonLinearCurve(gp.axisY) * GAMEPAD_MOVE_SPEED;
  moveMalletTo(mallet, clamp(mallet.x + dx, zone.minX, zone.maxX), clamp(mallet.y + dy, zone.minY, zone.maxY));
}

/**
 * ゲームループを管理するカスタムフック（プレゼンテーション層）
 *
 * パラメータを 5 つのグループに整理:
 * - screen: 現在の画面状態
 * - showHelp: ヘルプ表示状態
 * - config: ゲーム設定（難易度・フィールド・勝利スコア・サウンド・BGM）
 * - refs: ゲームループが参照・更新する React ref
 * - callbacks: React state 更新コールバック
 */
export function useGameLoop({ screen, showHelp, config, refs, callbacks }: UseGameLoopParams): void {
  const { difficulty: diff, field, winScore, getSound, bgmEnabled, gameMode, aiConfig, playerMalletColor, cpuMalletColor, allyControlType, allyCharacterId, enemyCharacter1Id, enemyCharacter2Id, enemy1ControlType, enemy2ControlType } = config;
  const pColor = playerMalletColor ?? DEFAULT_PLAYER_MALLET_COLOR;
  const cColor = cpuMalletColor ?? DEFAULT_CPU_MALLET_COLOR;
  const {
    gameRef, canvasRef, lastInputRef, scoreRef,
    phaseRef, countdownStartRef, shakeRef,
    statsRef, matchStartRef, keysRef, playerTargetRef, player2KeysRef, multiTouchRef,
  } = refs;
  const is2PMode = gameMode === '2p-local';
  const is2v2Mode = gameMode === '2v2-local';
  const { setScores, setWinner, setScreen, setShowHelp, setShake } = callbacks;

  // パックスタック検出用カウンター（useEffect 再実行でもリセットされない）
  const puckStuckCountersRef = React.useRef<number[]>([]);

  useEffect(() => {
    if (screen !== 'game') return;

    const consts = CONSTANTS;
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { MALLET: MR, PUCK: BR, ITEM: IR } = consts.SIZES;

    const PUCK_STUCK_THRESHOLD = 30; // 約0.5秒
    const puckStuckCounters = puckStuckCountersRef.current;

    // パーティクル生成の定数
    const OBSTACLE_PARTICLE_COUNT = 12;
    const SHIELD_PARTICLE_COUNT = 8;
    const GOAL_PARTICLE_COUNT = 20;

    const sound = getSound();

    // BGM: playing 中かつ bgmEnabled なら開始
    if (bgmEnabled && phaseRef.current === 'playing') {
      sound.bgmStart();
    }

    const baseGoalSize = field.goalSize;

    // カムバック補正を反映したゴールサイズ計算
    const getEffectiveGoalSize = (side: 'player' | 'cpu'): number => {
      const pScore = scoreRef.current.p;
      const cScore = scoreRef.current.c;
      const scoreDiffForGoal = side === 'player' ? cScore - pScore : pScore - cScore;
      if (scoreDiffForGoal >= consts.COMEBACK.THRESHOLD) {
        return baseGoalSize * (1 - consts.COMEBACK.GOAL_REDUCTION);
      }
      return baseGoalSize;
    };

    // ゴールチェック（カムバック時はゴールサイズ縮小）
    const goalCheckerWithSide = (x: number, side: 'player' | 'cpu') => {
      const gs = getEffectiveGoalSize(side);
      return x > W / 2 - gs / 2 && x < W / 2 + gs / 2;
    };

    // アイテム用はベースサイズでチェック
    const goalChecker = (x: number) =>
      x > W / 2 - baseGoalSize / 2 && x < W / 2 + baseGoalSize / 2;

    const obstacles = field.obstacles;

    // シェイクをトリガーするヘルパー
    const triggerShake = (intensity: number, duration: number) => {
      const newShake: ShakeState = { intensity, duration, startTime: Date.now() };
      shakeRef.current = newShake;
      setShake(newShake);
    };

    // ヒットストップ状態（US-1.4）
    const hitStop: HitStopState = {
      active: false,
      framesRemaining: 0,
      impactX: 0,
      impactY: 0,
      shockwaveRadius: 0,
      shockwaveMaxRadius: 80,
    };

    // スローモーション状態（US-1.5）
    const slowMo: SlowMotionState = {
      active: false,
      startTime: 0,
      duration: 400,
    };

    // スローモーション倍率を取得
    const getTimeScale = (now: number): number => {
      if (!slowMo.active) return 1;
      const elapsed = now - slowMo.startTime;
      if (elapsed >= slowMo.duration) {
        slowMo.active = false;
        return 1;
      }
      return 0.3;
    };

    const processCollisions = <T extends Puck | Item>(
      obj: T,
      radius: number,
      game: GameState,
      isPuck = false,
      now = Date.now()
    ): T => {
      const mallets = getAllMallets(game);

      for (const { mallet, isPlayer, side } of mallets) {
        const effectState = game.effects[side];
        if (!effectState) continue;
        const bigEffect = effectState.big;
        const bigScale = bigEffect && now - bigEffect.start < bigEffect.duration ? bigEffect.scale : 1;

        const pScore = scoreRef.current.p;
        const cScore = scoreRef.current.c;
        const scoreDiff = isPlayer ? cScore - pScore : pScore - cScore;
        const comebackScale = scoreDiff >= consts.COMEBACK.THRESHOLD ? 1 + consts.COMEBACK.MALLET_BONUS : 1;

        const effectiveMR = MR * bigScale * comebackScale;
        const col = Physics.detectCollision(obj.x, obj.y, radius, mallet.x, mallet.y, effectiveMR);
        if (col) {
          const speed = magnitude(mallet.vx, mallet.vy);
          const power = Math.min(consts.PHYSICS.MAX_POWER, 5 + speed * 1.2);

          obj = Physics.resolveCollision(obj, col, power, mallet.vx, mallet.vy, 0.4);

          if (isPuck && isPlayer && effectState.invisible > 0) {
            (obj as Puck).visible = false;
            (obj as Puck).invisibleCount = 25;
            effectState.invisible--;
          }

          sound.hit(speed);

          if (isPuck) {
            if (isPlayer) {
              statsRef.current.playerHits++;
              if (obj.y > H - 100) {
                statsRef.current.playerSaves++;
              }
            } else {
              statsRef.current.cpuHits++;
              if (obj.y < 100) {
                statsRef.current.cpuSaves++;
              }
            }
          }

          if (isPuck && speed > STRONG_HIT_SPEED_THRESHOLD) {
            triggerShake(HIT_SHAKE_INTENSITY, HIT_SHAKE_DURATION);
            const postSpeed = magnitude(obj.vx, obj.vy);
            if (postSpeed > STRONG_HIT_SPEED_THRESHOLD && !hitStop.active) {
              hitStop.active = true;
              hitStop.framesRemaining = 3;
              hitStop.impactX = obj.x;
              hitStop.impactY = obj.y;
              hitStop.shockwaveRadius = 0;
              hitStop.shockwaveMaxRadius = 80;
            }
          }
        }
      }

      for (let oi = 0; oi < obstacles.length; oi++) {
        const ob = obstacles[oi];
        const obState = game.obstacleStates[oi];

        if (obState?.destroyed) continue;

        const hpRatio = obState ? obState.hp / obState.maxHp : 1;
        const effectiveR = ob.r * (0.5 + 0.5 * hpRatio);

        const col = Physics.detectCollision(obj.x, obj.y, radius, ob.x, ob.y, effectiveR);
        if (col) {
          obj = Physics.reflectOffSurface(obj, col);
          sound.wall();

          if (isPuck && obState) {
            obState.hp--;
            if (obState.hp <= 0) {
              obState.destroyed = true;
              obState.destroyedAt = Date.now();
              for (let pi = 0; pi < OBSTACLE_PARTICLE_COUNT; pi++) {
                game.particles.push({
                  x: ob.x + randomRange(-5, 5),
                  y: ob.y + randomRange(-5, 5),
                  vx: randomRange(-3, 3),
                  vy: randomRange(-3, 3),
                  life: 30,
                  maxLife: 30,
                  color: field.color,
                  size: randomRange(2, 5),
                });
              }
            }
          }
        }
      }

      return obj;
    };

    let animationRef: number;
    let lastCountdownSound = -1;
    // 勝利判定後の遅延遷移タイマー（クリーンアップ用に追跡）
    let resultTimerId: ReturnType<typeof setTimeout> | null = null;

    // R-5: パフォーマンス計測基盤（開発モードのみ）
    const PERF_ENABLED = process.env.NODE_ENV === 'development';
    let fpsFrameCount = 0;
    let fpsLastTime = performance.now();
    let currentFps = 0;

    const gameLoop = () => {
      const game = gameRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!game || !ctx) {
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      /** 全マレットを描画順序（奥→手前）で描画するヘルパー */
      const drawAllMallets = (
        scaleFn?: (side: 'player' | 'cpu' | 'ally' | 'enemy') => number
      ): void => {
        const s = (side: 'player' | 'cpu' | 'ally' | 'enemy') => scaleFn ? scaleFn(side) : undefined;
        Renderer.drawMallet(ctx, game.cpu, cColor, false, consts, s('cpu'));
        if (game.enemy) Renderer.drawMallet(ctx, game.enemy, cColor, false, consts, s('enemy'));
        if (game.ally) Renderer.drawMallet(ctx, game.ally, pColor, game.effects.ally?.invisible ? game.effects.ally.invisible > 0 : false, consts, s('ally'));
        Renderer.drawMallet(ctx, game.player, pColor, game.effects.player.invisible > 0, consts, s('player'));
      };

      const now = Date.now();

      // カウントダウンフェーズ
      if (phaseRef.current === 'countdown') {
        const elapsed = now - countdownStartRef.current;

        Renderer.clear(ctx, consts, now);
        Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
        drawAllMallets();

        if (elapsed < COUNTDOWN_DURATION) {
          const countdownValue = 3 - Math.floor(elapsed / 1000);
          Renderer.drawCountdown(ctx, countdownValue, elapsed, consts);

          if (countdownValue !== lastCountdownSound) {
            lastCountdownSound = countdownValue;
            sound.countdown();
          }
        } else if (elapsed < COUNTDOWN_DURATION + GO_DISPLAY_DURATION) {
          Renderer.drawCountdown(ctx, 0, elapsed, consts);
          if (lastCountdownSound !== 0) {
            lastCountdownSound = 0;
            sound.go();
          }
        } else {
          phaseRef.current = 'playing';
          if (bgmEnabled) {
            sound.bgmStart();
          }
        }

        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      // ポーズフェーズ
      if (phaseRef.current === 'paused') {
        Renderer.clear(ctx, consts, now);
        Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
        Renderer.drawEffectZones(ctx, game.effects, now, consts);
        game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now, consts));
        game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck, consts));
        drawAllMallets();
        Renderer.drawPauseOverlay(ctx, consts);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      // マレットサイズスケール計算
      const getMalletScale = (side: 'player' | 'cpu' | 'ally' | 'enemy'): number => {
        let scale = 1;
        const sideEffects = game.effects[side];
        if (!sideEffects) return scale;
        const bigEff = sideEffects.big;
        if (bigEff && now - bigEff.start < bigEff.duration) {
          scale *= bigEff.scale;
        }
        const pScore = scoreRef.current.p;
        const cScore = scoreRef.current.c;
        const scoreDiff2 = side === 'player' ? cScore - pScore : pScore - cScore;
        if (scoreDiff2 >= consts.COMEBACK.THRESHOLD) {
          scale *= 1 + consts.COMEBACK.MALLET_BONUS;
        }
        return scale;
      };

      // ヒットストップ中は物理更新をスキップ（US-1.4）
      if (hitStop.active) {
        hitStop.framesRemaining--;
        hitStop.shockwaveRadius += 20;
        if (hitStop.framesRemaining <= 0) {
          hitStop.active = false;
        }
        Renderer.clear(ctx, consts, now);
        Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
        Renderer.drawEffectZones(ctx, game.effects, now, consts);
        game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now, consts));
        game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck, consts));
        drawAllMallets(getMalletScale);
        Renderer.drawParticles(ctx, game.particles);
        Renderer.drawShockwave(ctx, hitStop);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      // パーティクル更新
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        if (p.life <= 0) game.particles.splice(i, 1);
      }

      // 障害物復活チェック
      const respawnMs = field.obstacleRespawnMs ?? consts.TIMING.OBSTACLE_RESPAWN;
      for (const obState of game.obstacleStates) {
        if (obState.destroyed && now - obState.destroyedAt >= respawnMs) {
          obState.destroyed = false;
          obState.hp = obState.maxHp;
          obState.destroyedAt = 0;
        }
      }

      // ゴールエフェクト表示中
      if (game.goalEffect && now - game.goalEffect.time < consts.TIMING.GOAL_EFFECT) {
        Renderer.clear(ctx, consts, now);
        Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
        Renderer.drawParticles(ctx, game.particles);
        Renderer.drawGoalEffect(ctx, game.goalEffect, now, consts);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }
      game.goalEffect = null;

      // ヘルプ自動表示は無効化（タイトル画面の手動ヘルプのみ維持）

      // マウス/タッチ入力（フレーム同期: ref から目標位置を読み取り適用）
      // 2v2 モードでもマウスのフォールバックとして有効（マルチタッチ時は後続で上書き）
      if (playerTargetRef?.current) {
        moveMalletTo(game.player, playerTargetRef.current.x, playerTargetRef.current.y);
        playerTargetRef.current = null;
      }

      // キーボード入力（P1: 矢印キー）
      if (keysRef) {
        applyKeyboardMovement(game, keysRef, lastInputRef);
      }

      if (is2v2Mode) {
        // ── 2v2 モード入力 ──
        const isAllyHuman = allyControlType === 'human';

        // マルチタッチ: player1 → game.player、player2 → game.ally（人間操作時のみ）
        if (multiTouchRef?.current) {
          const touchState = multiTouchRef.current;
          if (touchState.player1Position) {
            moveMalletTo(game.player, touchState.player1Position.x, touchState.player1Position.y);
            lastInputRef.current = Date.now();
          }
          if (isAllyHuman && touchState.player2Position && game.ally) {
            moveMalletTo(game.ally, touchState.player2Position.x, touchState.player2Position.y);
          }
        }

        // WASD → game.ally（人間操作時のみ）
        if (isAllyHuman && player2KeysRef && game.ally) {
          const keys2 = player2KeysRef.current;
          const hasInput = keys2.up || keys2.down || keys2.left || keys2.right;
          if (hasInput) {
            const zone = getPlayerZone('player2', consts);
            let dx = 0, dy = 0;
            if (keys2.left) dx -= KEYBOARD_MOVE_SPEED;
            if (keys2.right) dx += KEYBOARD_MOVE_SPEED;
            if (keys2.up) dy -= KEYBOARD_MOVE_SPEED;
            if (keys2.down) dy += KEYBOARD_MOVE_SPEED;
            const newX = clamp(game.ally.x + dx, zone.minX, zone.maxX);
            const newY = clamp(game.ally.y + dy, zone.minY, zone.maxY);
            moveMalletTo(game.ally, newX, newY);
          }
        }

        // CPU（P3）: Gamepad 人間操作 or CPU AI
        const scoreDiff = Math.max(0, scoreRef.current.p - scoreRef.current.c);
        const cpuAiConfig = aiConfig ?? (enemyCharacter1Id ? buildFreeBattleAiConfig(diff, enemyCharacter1Id) : AI_BEHAVIOR_PRESETS[diff]);
        const isEnemy1Human = enemy1ControlType === 'human';
        if (isEnemy1Human) {
          applyGamepadToMallet(game.cpu, GAMEPAD_INDEX.P3, 'player3', consts);
        } else {
          const cpuUpdate = CpuAI.updateWithBehavior(game, cpuAiConfig, now, consts, scoreDiff);
          if (cpuUpdate) {
            game.cpu = cpuUpdate.cpu;
            game.cpuTarget = cpuUpdate.cpuTarget;
            game.cpuTargetTime = cpuUpdate.cpuTargetTime;
            game.cpuStuckTimer = cpuUpdate.cpuStuckTimer;
          }
        }

        // ally（P2）: CPU 操作時のみ AI で制御（座標反転で下半分に対応）
        if (!isAllyHuman && game.ally) {
          const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
          const allyAiConfig = allyCharacterId ? buildAllyAiConfig(diff, allyCharacterId) : cpuAiConfig;
          const allyResult = updateExtraMalletAI(
            game, game.ally,
            { target: game.allyTarget ?? null, targetTime: game.allyTargetTime ?? 0, stuckTimer: game.allyStuckTimer ?? 0 },
            { updateFn, config: allyAiConfig, now, consts, scoreDiff, team: 'player' }
          );
          if (allyResult) {
            game.ally = allyResult.mallet;
            game.allyTarget = allyResult.aiState.target;
            game.allyTargetTime = allyResult.aiState.targetTime;
            game.allyStuckTimer = allyResult.aiState.stuckTimer;
          }
        }

        // enemy（P4）: Gamepad 人間操作 or CPU AI（上半分）
        if (game.enemy) {
          const isEnemyHuman = enemy2ControlType === 'human';
          if (isEnemyHuman) {
            applyGamepadToMallet(game.enemy, GAMEPAD_INDEX.P4, 'player4', consts);
          } else {
            const updateFn = CpuAI.updateWithBehavior.bind(CpuAI);
            const enemyAiConfig = enemyCharacter2Id ? buildFreeBattleAiConfig(diff, enemyCharacter2Id) : cpuAiConfig;
            const result = updateExtraMalletAI(
              game, game.enemy,
              { target: game.enemyTarget ?? null, targetTime: game.enemyTargetTime ?? 0, stuckTimer: game.enemyStuckTimer ?? 0 },
              { updateFn, config: enemyAiConfig, now, consts, scoreDiff, team: 'cpu' }
            );
            if (result) {
              game.enemy = result.mallet;
              game.enemyTarget = result.aiState.target;
              game.enemyTargetTime = result.aiState.targetTime;
              game.enemyStuckTimer = result.aiState.stuckTimer;
            }
          }
        }

        // マレット間衝突解消（全ペア判定 + ゾーン再クランプ）
        const allMallets = getAllMallets(game);
        const malletZones = allMallets.map(m => {
          const slot = m.side === 'player' ? 'player1' : m.side === 'ally' ? 'player2' : m.side === 'cpu' ? 'player3' : 'player4';
          return getPlayerZone(slot, consts);
        });
        resolveMalletMalletOverlaps(allMallets, consts.SIZES.MALLET, malletZones);
      } else if (is2PMode) {
        // ── 2P モード入力 ──
        if (multiTouchRef?.current) {
          const touchState = multiTouchRef.current;
          if (touchState.player1Position) {
            moveMalletTo(game.player, touchState.player1Position.x, touchState.player1Position.y);
            lastInputRef.current = Date.now();
          }
          if (touchState.player2Position) {
            moveMalletTo(game.cpu, touchState.player2Position.x, touchState.player2Position.y);
          }
        }

        if (player2KeysRef) {
          const keys2 = player2KeysRef.current;
          const hasInput = keys2.up || keys2.down || keys2.left || keys2.right;
          if (hasInput) {
            const result = calculateKeyboardMovement(keys2, { x: game.cpu.x, y: game.cpu.y }, consts, 'player2');
            moveMalletTo(game.cpu, result.x, result.y);
          }
        }
      } else {
        // ── 1P モード: CPU AI ──
        const scoreDiff = Math.max(0, scoreRef.current.p - scoreRef.current.c);
        const effectiveAiConfig = aiConfig ?? AI_BEHAVIOR_PRESETS[diff];
        const cpuUpdate = CpuAI.updateWithBehavior(game, effectiveAiConfig, now, consts, scoreDiff);
        if (cpuUpdate) {
          game.cpu = cpuUpdate.cpu;
          game.cpuTarget = cpuUpdate.cpuTarget;
          game.cpuTargetTime = cpuUpdate.cpuTargetTime;
          game.cpuStuckTimer = cpuUpdate.cpuStuckTimer;
        }
      }

      // マレット移動後、衝突処理前にパックとの食い込みを解消（パックを弾く）
      // effectiveMR を使い、processCollisions との二重衝突を防止
      // S6-4-6: quickReject で遠いペアをスキップ
      for (const { mallet, side } of getAllMallets(game)) {
        const mr = MR * getMalletScale(side);
        const maxDist = mr + BR;
        const nearPucks = game.pucks.filter(p => !quickReject(mallet, p, maxDist));
        if (nearPucks.length > 0) {
          resolveMalletPuckOverlap(mallet, nearPucks, mr, BR, consts.PHYSICS.MAX_POWER);
        }
      }

      // フィーバー判定
      if (!game.fever.active && now - game.fever.lastGoalTime >= consts.TIMING.FEVER_TRIGGER) {
        game.fever.active = true;
        game.fever.extraPucks = 0;
        game.pucks.push(
          EntityFactory.createPuck(W / 2, H / 2, randomRange(-1, 1), randomRange(-2, 2) || 1.5)
        );
        game.fever.extraPucks++;
        if (bgmEnabled) {
          sound.bgmSetTempo(1.3);
        }
      }

      // フィーバー中の追加パック生成
      if (game.fever.active && game.fever.extraPucks < consts.FEVER.MAX_EXTRA_PUCKS) {
        const feverElapsed = now - game.fever.lastGoalTime - consts.TIMING.FEVER_TRIGGER;
        const expectedPucks = Math.min(
          Math.floor(feverElapsed / consts.TIMING.FEVER_INTERVAL) + 1,
          consts.FEVER.MAX_EXTRA_PUCKS
        );
        while (game.fever.extraPucks < expectedPucks) {
          game.pucks.push(
            EntityFactory.createPuck(W / 2, H / 2, randomRange(-1, 1), randomRange(-2, 2) || 1.5)
          );
          game.fever.extraPucks++;
        }
      }

      // アイテム生成
      if (now - game.lastItemSpawn > consts.TIMING.ITEM_SPAWN && game.items.length < 2) {
        game.items.push(EntityFactory.createItem(randomChoice(ITEMS), Math.random() > 0.5, consts));
        game.lastItemSpawn = now;
      }

      // アイテムの物理演算と衝突処理
      for (let i = game.items.length - 1; i >= 0; i--) {
        let item = game.items[i];
        item.x += item.vx;
        item.y += item.vy;

        item = Physics.applyWallBounce(item, IR, goalChecker, sound.wall, consts);
        item = processCollisions(item, IR, game, false, now);
        game.items[i] = item;

        const scoredTarget =
          item.y < 5 && goalChecker(item.x)
            ? 'cpu'
            : item.y > H - 5 && goalChecker(item.x)
              ? 'player'
              : null;

        if (scoredTarget) {
          const itemEffect = applyItemEffect(game, item, scoredTarget, now);
          if (itemEffect.pucks) game.pucks = itemEffect.pucks;
          if (itemEffect.effects) game.effects = itemEffect.effects;
          if (itemEffect.flash) game.flash = itemEffect.flash;
          // 2v2 モード: チームメイトにも同じエフェクトを適用
          // ※ game.effects は上で代入済みのため、applyItemEffect は更新後の effects をベースにスプレッドする
          //   → 1回目の target エフェクトが失われることはない（不変更新パターン）
          if (is2v2Mode) {
            const teammate = scoredTarget === 'player' ? 'ally' : 'enemy';
            const hasMate = teammate === 'ally' ? game.ally : game.enemy;
            if (hasMate) {
              const teamEffect = applyItemEffect(game, item, teammate, now);
              if (teamEffect.effects) game.effects = teamEffect.effects;
              if (teamEffect.flash) game.flash = teamEffect.flash;
            }
          }
          sound.item();
          game.items.splice(i, 1);
          if (scoredTarget === 'player') {
            statsRef.current.playerItemsCollected++;
          } else {
            statsRef.current.cpuItemsCollected++;
          }
        }
      }

      // パックの物理演算と衝突処理
      let scored: 'player' | 'cpu' | null = null;
      let scoredIndex = -1;

      for (let i = 0; i < game.pucks.length; i++) {
        let puck = game.pucks[i];
        const playerSpeedActive =
          game.effects.player.speed &&
          now - game.effects.player.speed.start < game.effects.player.speed.duration;
        const cpuSpeedActive =
          game.effects.cpu.speed &&
          now - game.effects.cpu.speed.start < game.effects.cpu.speed.duration;

        let speedMultiplier = 1;
        if (playerSpeedActive) speedMultiplier = puck.y > H / 2 ? 0.5 : 1.5;
        if (cpuSpeedActive) speedMultiplier = puck.y < H / 2 ? 0.5 : 1.5;

        const timeScale = getTimeScale(now);
        speedMultiplier *= timeScale;

        if (!puck.trail) puck.trail = [];
        puck.trail.push({ x: puck.x, y: puck.y });
        if (puck.trail.length > 16) puck.trail.shift();

        puck.x += puck.vx * speedMultiplier;
        puck.y += puck.vy * speedMultiplier;

        // マグネット引力
        const applyMagnet = (mallet: { x: number; y: number }, effect: typeof game.effects.player) => {
          if (effect.magnet && now - effect.magnet.start < effect.magnet.duration) {
            const dx = mallet.x - puck.x;
            const dy = mallet.y - puck.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0 && dist < 150) {
              const force = 0.3 / Math.max(dist / 50, 1);
              puck.vx += (dx / dist) * force;
              puck.vy += (dy / dist) * force;
            }
          }
        };
        for (const { mallet: m, side } of getAllMallets(game)) {
          const eff = game.effects[side];
          if (eff) applyMagnet(m, eff);
        }

        if (!puck.visible) {
          puck.invisibleCount--;
          if (puck.invisibleCount <= 0) puck.visible = true;
        }

        puck = Physics.applyWallBounce(puck, BR, goalChecker, sound.wall, consts);
        puck = processCollisions(puck, BR, game, true, now);
        puck = Physics.applyFriction(puck, consts);
        game.pucks[i] = puck;

        const puckSpeed = magnitude(puck.vx, puck.vy);
        statsRef.current.maxPuckSpeed = Math.max(statsRef.current.maxPuckSpeed, puckSpeed);

        // パックスタック検出: 低速が一定フレーム継続 → フィールド中央方向に脱出
        if (puckStuckCounters[i] === undefined) puckStuckCounters[i] = 0;
        if (puckSpeed < consts.PHYSICS.MIN_SPEED * 0.5) {
          puckStuckCounters[i]++;
          if (puckStuckCounters[i] >= PUCK_STUCK_THRESHOLD) {
            const cx = W / 2;
            const cy = H / 2;
            const dx = cx - puck.x;
            const dy = cy - puck.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const escapeSpeed = consts.PHYSICS.MIN_SPEED * 2;
            if (dist > 1) {
              puck.vx = (dx / dist) * escapeSpeed;
              puck.vy = (dy / dist) * escapeSpeed;
            } else {
              puck.vx = escapeSpeed;
              puck.vy = 0;
            }
            puckStuckCounters[i] = 0;
            game.pucks[i] = puck;
          }
        } else {
          puckStuckCounters[i] = 0;
        }

        if (scored === null) {
          if (puck.y < 5 && goalCheckerWithSide(puck.x, 'cpu')) {
            // チーム2側（cpu/enemy）のシールドをチェック
            const cpuTeamHasShield = game.effects.cpu.shield || (game.effects.enemy?.shield ?? false);
            if (cpuTeamHasShield) {
              // enemy のシールドを優先消費、なければ cpu のシールドを消費
              if (game.effects.enemy?.shield) {
                game.effects.enemy.shield = false;
              } else {
                game.effects.cpu.shield = false;
              }
              puck.vy = Math.abs(puck.vy) * 0.8;
              puck.y = 15;
              game.pucks[i] = puck;
              for (let pi = 0; pi < SHIELD_PARTICLE_COUNT; pi++) {
                game.particles.push({
                  x: puck.x + randomRange(-10, 10), y: 8,
                  vx: randomRange(-2, 2), vy: randomRange(1, 3),
                  life: 20, maxLife: 20, color: 'rgb(255, 215, 0)', size: randomRange(2, 4),
                });
              }
              sound.wall();
            } else {
              scored = 'cpu';
              scoredIndex = i;
            }
          } else if (puck.y > H - 5 && goalCheckerWithSide(puck.x, 'player')) {
            // チーム1側（player/ally）のシールドをチェック
            const playerTeamHasShield = game.effects.player.shield || (game.effects.ally?.shield ?? false);
            if (playerTeamHasShield) {
              // ally のシールドを優先消費、なければ player のシールドを消費
              if (game.effects.ally?.shield) {
                game.effects.ally.shield = false;
              } else {
                game.effects.player.shield = false;
              }
              puck.vy = -Math.abs(puck.vy) * 0.8;
              puck.y = H - 15;
              game.pucks[i] = puck;
              for (let pi = 0; pi < SHIELD_PARTICLE_COUNT; pi++) {
                game.particles.push({
                  x: puck.x + randomRange(-10, 10), y: H - 8,
                  vx: randomRange(-2, 2), vy: randomRange(-3, -1),
                  life: 20, maxLife: 20, color: 'rgb(255, 215, 0)', size: randomRange(2, 4),
                });
              }
              sound.wall();
            } else {
              scored = 'player';
              scoredIndex = i;
            }
          }
        }
      }

      if (scoredIndex >= 0) {
        game.pucks.splice(scoredIndex, 1);
      }

      // パックがなくなったら新規生成
      if (game.pucks.length === 0) {
        game.pucks.push(
          EntityFactory.createPuck(
            W / 2, H / 2,
            randomRange(-0.5, 0.5),
            scored === 'cpu' ? -1.5 : 1.5
          )
        );
      }

      // 描画
      Renderer.clear(ctx, consts, now);
      Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
      Renderer.drawEffectZones(ctx, game.effects, now, consts);
      game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now, consts));
      game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck, consts));
      drawAllMallets(getMalletScale);
      Renderer.drawParticles(ctx, game.particles);
      Renderer.drawHUD(ctx, game.effects, now, consts);
      Renderer.drawFlash(ctx, game.flash, now, consts);
      Renderer.drawFeverEffect(ctx, game.fever.active, now, consts);
      Renderer.drawCombo(ctx, game.combo, now, consts);

      if (game.effects.player.shield || game.effects.ally?.shield) Renderer.drawShield(ctx, true, baseGoalSize, consts);
      if (game.effects.cpu.shield || game.effects.enemy?.shield) Renderer.drawShield(ctx, false, baseGoalSize, consts);

      for (const { mallet: m, side } of getAllMallets(game)) {
        const eff = game.effects[side];
        if (eff?.magnet && now - eff.magnet.start < eff.magnet.duration) {
          Renderer.drawMagnetEffect(ctx, m, now);
        }
      }

      if (slowMo.active) {
        Renderer.drawVignette(ctx, consts, 0.5);
      }

      Renderer.drawShockwave(ctx, hitStop);

      if (showHelp) {
        Renderer.drawHelp(ctx, consts, field);
      }

      // ゴール判定とスコア更新
      if (scored) {
        if (!slowMo.active) {
          slowMo.active = true;
          slowMo.startTime = now;
          slowMo.duration = 400;
        }

        if (scored === 'cpu') {
          scoreRef.current.p++;
        } else {
          scoreRef.current.c++;
        }
        setScores({ ...scoreRef.current });

        if (scored === 'cpu') {
          sound.goal();
        } else {
          sound.lose();
        }
        game.goalEffect = { scorer: scored, time: now };

        // コンボシステム
        const scorerSide = scored === 'cpu' ? 'player' : 'cpu';
        if (game.combo.lastScorer === scorerSide) {
          game.combo.count++;
        } else {
          game.combo.count = 1;
          game.combo.lastScorer = scorerSide;
        }

        triggerShake(GOAL_SHAKE_INTENSITY, GOAL_SHAKE_DURATION);

        game.fever = { active: false, lastGoalTime: now, extraPucks: 0 };
        if (bgmEnabled) {
          sound.bgmSetTempo(1.0);
        }

        // ゴールパーティクル
        const goalY = scored === 'cpu' ? 5 : H - 5;
        const particleColor = scored === 'cpu' ? 'rgb(0, 255, 255)' : 'rgb(255, 68, 68)';
        for (let pi = 0; pi < GOAL_PARTICLE_COUNT; pi++) {
          const particle: Particle = {
            x: W / 2 + randomRange(-30, 30),
            y: goalY,
            vx: randomRange(-3, 3),
            vy: randomRange(-4, 0) * (scored === 'cpu' ? 1 : -1),
            life: 40,
            maxLife: 40,
            color: particleColor,
            size: randomRange(2, 6),
          };
          game.particles.push(particle);
        }

        if (scoreRef.current.p >= winScore) {
          statsRef.current.matchDuration = now - matchStartRef.current;
          resultTimerId = setTimeout(() => {
            setWinner('player');
            setScreen('result');
            sound.bgmStop();
            resultTimerId = null;
          }, consts.TIMING.GOAL_EFFECT);
          return;
        }
        if (scoreRef.current.c >= winScore) {
          statsRef.current.matchDuration = now - matchStartRef.current;
          resultTimerId = setTimeout(() => {
            setWinner('cpu');
            setScreen('result');
            sound.bgmStop();
            resultTimerId = null;
          }, consts.TIMING.GOAL_EFFECT);
          return;
        }
      }

      // R-5: FPS 計測（開発モードのみ）
      if (PERF_ENABLED && ctx) {
        fpsFrameCount++;
        const fpsNow = performance.now();
        if (fpsNow - fpsLastTime >= 1000) {
          currentFps = fpsFrameCount;
          fpsFrameCount = 0;
          fpsLastTime = fpsNow;
        }
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${currentFps}`, 8, 16);
        ctx.restore();
      }

      animationRef = requestAnimationFrame(gameLoop);
    };

    animationRef = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationRef);
      if (resultTimerId !== null) {
        clearTimeout(resultTimerId);
      }
    };
  }, [screen, diff, field, winScore, showHelp, getSound,
      gameRef, canvasRef, lastInputRef, scoreRef,
      setScores, setWinner, setScreen, setShowHelp,
      phaseRef, countdownStartRef, shakeRef, setShake, bgmEnabled,
      statsRef, matchStartRef, keysRef,
      is2PMode, is2v2Mode, pColor, cColor, playerTargetRef, player2KeysRef, multiTouchRef, aiConfig,
      allyControlType, allyCharacterId, enemyCharacter1Id, enemyCharacter2Id, enemy1ControlType, enemy2ControlType]);
}
