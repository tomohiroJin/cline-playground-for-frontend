import React, { useEffect } from 'react';
import { Physics } from '../core/physics';
import { CpuAI } from '../core/ai';
import { EntityFactory } from '../core/entities';
import { applyItemEffect } from '../core/items';
import { CONSTANTS } from '../core/constants';
import { ITEMS } from '../core/config';
import { magnitude, randomRange } from '../../../utils/math-utils';
import { Renderer } from '../renderer';
import {
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
} from '../core/types';
import { applyKeyboardMovement } from './useKeyboardInput';
import { KeyboardState } from '../core/keyboard';

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

/**
 * ゲームループを管理するカスタムフック
 */
export function useGameLoop(
  screen: string,
  diff: Difficulty,
  field: FieldConfig,
  winScore: number,
  showHelp: boolean,
  getSound: () => SoundSystem,
  gameRef: React.RefObject<GameState | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  lastInputRef: React.MutableRefObject<number>,
  scoreRef: React.MutableRefObject<{ p: number; c: number }>,
  setScores: (s: { p: number; c: number }) => void,
  setWinner: (w: string | null) => void,
  setScreen: (s: 'menu' | 'game' | 'result') => void,
  setShowHelp: (v: boolean) => void,
  phaseRef: React.MutableRefObject<GamePhase>,
  countdownStartRef: React.MutableRefObject<number>,
  shakeRef: React.MutableRefObject<ShakeState | null>,
  setShake: (s: ShakeState | null) => void,
  bgmEnabled: boolean,
  statsRef: React.MutableRefObject<MatchStats>,
  matchStartRef: React.MutableRefObject<number>,
  keysRef?: React.MutableRefObject<KeyboardState>
) {
  useEffect(() => {
    if (screen !== 'game') return;

    const consts = CONSTANTS;
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { MALLET: MR, PUCK: BR, ITEM: IR } = consts.SIZES;

    const sound = getSound();

    // BGM: playing 中かつ bgmEnabled なら開始（二重起動はbgmStart内で防止済み）
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

    // 障害物座標は config.ts で 450x900 解像度基準で定義済み
    const obstacles = field.obstacles;

    // シェイクをトリガーするヘルパー
    const triggerShake = (intensity: number, duration: number) => {
      const newShake: ShakeState = { intensity, duration, startTime: Date.now() };
      shakeRef.current = newShake;
      setShake(newShake);
    };

    const processCollisions = <T extends Puck | Item>(
      obj: T,
      radius: number,
      game: GameState,
      isPuck = false,
      now = Date.now()
    ): T => {
      const mallets = [
        { mallet: game.player, isPlayer: true },
        { mallet: game.cpu, isPlayer: false },
      ];

      for (const { mallet, isPlayer } of mallets) {
        // Big エフェクトによるマレット半径拡大
        const side = isPlayer ? 'player' : 'cpu';
        const bigEffect = game.effects[side].big;
        const bigScale = bigEffect && now - bigEffect.start < bigEffect.duration ? bigEffect.scale : 1;

        // カムバックによるマレット半径拡大
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

          if (isPuck && isPlayer && game.effects.player.invisible > 0) {
            (obj as Puck).visible = false;
            (obj as Puck).invisibleCount = 25;
            game.effects.player.invisible--;
          }

          // 速度に応じたサウンド
          sound.hit(speed);

          // 統計: ヒット数カウント
          if (isPuck) {
            if (isPlayer) {
              statsRef.current.playerHits++;
              // セーブ判定: ゴールライン付近（下端100px以内）
              if (obj.y > H - 100) {
                statsRef.current.playerSaves++;
              }
            } else {
              statsRef.current.cpuHits++;
              // セーブ判定: ゴールライン付近（上端100px以内）
              if (obj.y < 100) {
                statsRef.current.cpuSaves++;
              }
            }
          }

          // 強打時のシェイク
          if (isPuck && speed > STRONG_HIT_SPEED_THRESHOLD) {
            triggerShake(HIT_SHAKE_INTENSITY, HIT_SHAKE_DURATION);
          }
        }
      }

      for (let oi = 0; oi < obstacles.length; oi++) {
        const ob = obstacles[oi];
        const obState = game.obstacleStates[oi];

        // 破壊済みの障害物はスキップ
        if (obState?.destroyed) continue;

        // HP に応じて障害物の衝突半径を縮小
        const hpRatio = obState ? obState.hp / obState.maxHp : 1;
        const effectiveR = ob.r * (0.5 + 0.5 * hpRatio);

        const col = Physics.detectCollision(obj.x, obj.y, radius, ob.x, ob.y, effectiveR);
        if (col) {
          obj = Physics.reflectOffSurface(obj, col);
          sound.wall();

          // パックが破壊可能障害物に衝突した場合、HP を減少
          if (isPuck && obState) {
            obState.hp--;
            if (obState.hp <= 0) {
              obState.destroyed = true;
              obState.destroyedAt = Date.now();
              // 破壊パーティクル生成
              for (let pi = 0; pi < 12; pi++) {
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
    // カウントダウンで最後に鳴らした数
    let lastCountdownSound = -1;

    const gameLoop = () => {
      const game = gameRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!game || !ctx) {
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();

      // カウントダウンフェーズの処理
      if (phaseRef.current === 'countdown') {
        const elapsed = now - countdownStartRef.current;

        // フィールド背景を描画
        Renderer.clear(ctx, consts, now);
        Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
        Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false, consts);
        Renderer.drawMallet(ctx, game.player, '#3498db', false, consts);

        if (elapsed < COUNTDOWN_DURATION) {
          // 3, 2, 1
          const countdownValue = 3 - Math.floor(elapsed / 1000);
          Renderer.drawCountdown(ctx, countdownValue, elapsed, consts);

          // カウントダウン音
          if (countdownValue !== lastCountdownSound) {
            lastCountdownSound = countdownValue;
            sound.countdown();
          }
        } else if (elapsed < COUNTDOWN_DURATION + GO_DISPLAY_DURATION) {
          // GO!
          Renderer.drawCountdown(ctx, 0, elapsed, consts);
          if (lastCountdownSound !== 0) {
            lastCountdownSound = 0;
            sound.go();
          }
        } else {
          // カウントダウン完了、プレイ開始
          phaseRef.current = 'playing';
          if (bgmEnabled) {
            sound.bgmStart();
          }
        }

        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      // ポーズフェーズの処理
      if (phaseRef.current === 'paused') {
        Renderer.clear(ctx, consts, now);
        Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
        Renderer.drawEffectZones(ctx, game.effects, now, consts);
        game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now, consts));
        game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck, consts));
        Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false, consts);
        Renderer.drawMallet(ctx, game.player, '#3498db', game.effects.player.invisible > 0, consts);
        Renderer.drawPauseOverlay(ctx, consts);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      // パーティクル更新
      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // 重力
        p.life--;
        if (p.life <= 0) game.particles.splice(i, 1);
      }

      // 破壊された障害物の復活チェック
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

      // ヘルプ表示判定
      if (now - lastInputRef.current > consts.TIMING.HELP_TIMEOUT && !showHelp) {
        setShowHelp(true);
      }

      // キーボード入力の適用
      if (keysRef) {
        applyKeyboardMovement(game, keysRef, lastInputRef);
      }

      // CPU AI 更新
      const cpuUpdate = CpuAI.update(game, diff, now, consts);
      if (cpuUpdate) {
        game.cpu = cpuUpdate.cpu;
        game.cpuTarget = cpuUpdate.cpuTarget;
        game.cpuTargetTime = cpuUpdate.cpuTargetTime;
        game.cpuStuckTimer = cpuUpdate.cpuStuckTimer;
      }

      // フィーバー判定
      if (!game.fever.active && now - game.fever.lastGoalTime >= consts.TIMING.FEVER_TRIGGER) {
        game.fever.active = true;
        game.fever.extraPucks = 0;
        game.pucks.push(
          EntityFactory.createPuck(W / 2, H / 2, randomRange(-1, 1), randomRange(-2, 2) || 1.5)
        );
        game.fever.extraPucks++;

        // フィーバー時のBGMテンポアップ
        if (bgmEnabled) {
          sound.bgmSetTempo(1.3);
        }
      }

      // フィーバー中の追加パック生成（10秒ごと）
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
          sound.item();
          game.items.splice(i, 1);
          // 統計: アイテム取得数
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

        // トレイル記録
        if (!puck.trail) puck.trail = [];
        puck.trail.push({ x: puck.x, y: puck.y });
        if (puck.trail.length > 16) puck.trail.shift();

        puck.x += puck.vx * speedMultiplier;
        puck.y += puck.vy * speedMultiplier;

        // マグネットの引力処理
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
        applyMagnet(game.player, game.effects.player);
        applyMagnet(game.cpu, game.effects.cpu);

        if (!puck.visible) {
          puck.invisibleCount--;
          if (puck.invisibleCount <= 0) puck.visible = true;
        }

        puck = Physics.applyWallBounce(puck, BR, goalChecker, sound.wall, consts);
        puck = processCollisions(puck, BR, game, true, now);
        puck = Physics.applyFriction(puck, consts);
        game.pucks[i] = puck;

        // 統計: 最高パック速度を更新
        const puckSpeed = magnitude(puck.vx, puck.vy);
        statsRef.current.maxPuckSpeed = Math.max(statsRef.current.maxPuckSpeed, puckSpeed);

        if (scored === null) {
          if (puck.y < 5 && goalCheckerWithSide(puck.x, 'cpu')) {
            // CPU 側シールドチェック
            if (game.effects.cpu.shield) {
              game.effects.cpu.shield = false;
              puck.vy = Math.abs(puck.vy) * 0.8;
              puck.y = 15;
              game.pucks[i] = puck;
              // バリア破壊パーティクル
              for (let pi = 0; pi < 8; pi++) {
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
            // プレイヤー側シールドチェック
            if (game.effects.player.shield) {
              game.effects.player.shield = false;
              puck.vy = -Math.abs(puck.vy) * 0.8;
              puck.y = H - 15;
              game.pucks[i] = puck;
              for (let pi = 0; pi < 8; pi++) {
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
            W / 2,
            H / 2,
            randomRange(-0.5, 0.5),
            scored === 'cpu' ? -1.5 : 1.5
          )
        );
      }

      // Big / カムバックによるマレットサイズスケール計算
      const getMalletScale = (side: 'player' | 'cpu'): number => {
        let scale = 1;
        const bigEff = game.effects[side].big;
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

      // 描画
      Renderer.clear(ctx, consts, now);
      Renderer.drawField(ctx, field, consts, game.obstacleStates, now);
      Renderer.drawEffectZones(ctx, game.effects, now, consts);
      game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now, consts));
      game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck, consts));
      Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false, consts, getMalletScale('cpu'));
      Renderer.drawMallet(ctx, game.player, '#3498db', game.effects.player.invisible > 0, consts, getMalletScale('player'));
      Renderer.drawParticles(ctx, game.particles);
      Renderer.drawHUD(ctx, game.effects, now, consts);
      Renderer.drawFlash(ctx, game.flash, now, consts);
      Renderer.drawFeverEffect(ctx, game.fever.active, now, consts);
      Renderer.drawCombo(ctx, game.combo, now, consts);

      // シールドバリア描画
      if (game.effects.player.shield) Renderer.drawShield(ctx, true, baseGoalSize, consts);
      if (game.effects.cpu.shield) Renderer.drawShield(ctx, false, baseGoalSize, consts);

      // マグネットエフェクト描画
      if (game.effects.player.magnet && now - game.effects.player.magnet.start < game.effects.player.magnet.duration) {
        Renderer.drawMagnetEffect(ctx, game.player, now);
      }
      if (game.effects.cpu.magnet && now - game.effects.cpu.magnet.start < game.effects.cpu.magnet.duration) {
        Renderer.drawMagnetEffect(ctx, game.cpu, now);
      }

      if (showHelp) {
        Renderer.drawHelp(ctx, consts, field);
      }

      // ゴール判定とスコア更新
      if (scored) {
        const key = scored === 'cpu' ? 'p' : 'c';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        scoreRef.current[key]++;
        setScores({ ...scoreRef.current });

        if (scored === 'cpu') {
          sound.goal();
        } else {
          sound.lose();
        }
        game.goalEffect = { scorer: scored, time: now };

        // コンボシステム: 同じプレイヤーの連続得点でカウント増加
        const scorerSide = scored === 'cpu' ? 'player' : 'cpu';
        if (game.combo.lastScorer === scorerSide) {
          game.combo.count++;
        } else {
          game.combo.count = 1;
          game.combo.lastScorer = scorerSide;
        }

        // ゴール時のシェイク
        triggerShake(GOAL_SHAKE_INTENSITY, GOAL_SHAKE_DURATION);

        // フィーバーリセット
        game.fever = { active: false, lastGoalTime: now, extraPucks: 0 };
        // BGMテンポを戻す
        if (bgmEnabled) {
          sound.bgmSetTempo(1.0);
        }

        // ゴールパーティクル生成
        const goalY = scored === 'cpu' ? 5 : H - 5;
        const particleColor = scored === 'cpu' ? 'rgb(0, 255, 255)' : 'rgb(255, 68, 68)';
        for (let pi = 0; pi < 20; pi++) {
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
          setTimeout(() => {
            setWinner('player');
            setScreen('result');
            sound.bgmStop();
          }, consts.TIMING.GOAL_EFFECT);
          return;
        }
        if (scoreRef.current.c >= winScore) {
          statsRef.current.matchDuration = now - matchStartRef.current;
          setTimeout(() => {
            setWinner('cpu');
            setScreen('result');
            sound.bgmStop();
          }, consts.TIMING.GOAL_EFFECT);
          return;
        }
      }

      animationRef = requestAnimationFrame(gameLoop);
    };

    animationRef = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationRef);
    };
  }, [screen, diff, field, winScore, showHelp, getSound,
      gameRef, canvasRef, lastInputRef, scoreRef,
      setScores, setWinner, setScreen, setShowHelp,
      phaseRef, countdownStartRef, shakeRef, setShake, bgmEnabled,
      statsRef, matchStartRef, keysRef]);
}
