import React, { useEffect } from 'react';
import { Physics } from '../core/physics';
import { CpuAI } from '../core/ai';
import { EntityFactory } from '../core/entities';
import { applyItemEffect } from '../core/items';
import { getConstants } from '../core/constants';
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
  CanvasSize,
} from '../core/types';

// ランダム選択ヘルパー
const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

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
  canvasSize: CanvasSize = 'standard'
) {
  useEffect(() => {
    if (screen !== 'game') return;

    const consts = getConstants(canvasSize);
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { MALLET: MR, PUCK: BR, ITEM: IR } = consts.SIZES;
    const scale = W / 300;

    const sound = getSound();
    const goalSize = field.goalSize * scale;
    const goalChecker = (x: number) =>
      x > W / 2 - goalSize / 2 && x < W / 2 + goalSize / 2;

    // 障害物をスケーリング
    const scaledObstacles = field.obstacles.map(ob => ({
      x: ob.x * scale,
      y: ob.y * scale,
      r: ob.r * scale,
    }));

    const processCollisions = <T extends Puck | Item>(
      obj: T,
      radius: number,
      game: GameState,
      isPuck = false
    ): T => {
      const mallets = [
        { mallet: game.player, isPlayer: true },
        { mallet: game.cpu, isPlayer: false },
      ];

      for (const { mallet, isPlayer } of mallets) {
        const col = Physics.detectCollision(obj.x, obj.y, radius, mallet.x, mallet.y, MR);
        if (col) {
          const speed = magnitude(mallet.vx, mallet.vy);
          const power = Math.min(consts.PHYSICS.MAX_POWER, 5 + speed * 1.2);

          obj = Physics.resolveCollision(obj, col, power, mallet.vx, mallet.vy, 0.4);

          if (isPuck && isPlayer && game.effects.player.invisible > 0) {
            (obj as Puck).visible = false;
            (obj as Puck).invisibleCount = 25;
            game.effects.player.invisible--;
          }
          sound.hit();
        }
      }

      for (let oi = 0; oi < scaledObstacles.length; oi++) {
        const ob = scaledObstacles[oi];
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
    const gameLoop = () => {
      const game = gameRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!game || !ctx) {
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();

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
        // フィーバー開始時にパック追加
        game.pucks.push(
          EntityFactory.createPuck(W / 2, H / 2, randomRange(-1, 1), randomRange(-2, 2) || 1.5)
        );
        game.fever.extraPucks++;
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
        item = processCollisions(item, IR, game, false);
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
        if (puck.trail.length > 8) puck.trail.shift();

        puck.x += puck.vx * speedMultiplier;
        puck.y += puck.vy * speedMultiplier;

        if (!puck.visible) {
          puck.invisibleCount--;
          if (puck.invisibleCount <= 0) puck.visible = true;
        }

        puck = Physics.applyWallBounce(puck, BR, goalChecker, sound.wall, consts);
        puck = processCollisions(puck, BR, game, true);
        puck = Physics.applyFriction(puck, consts);
        game.pucks[i] = puck;

        if (scored === null) {
          if (puck.y < 5 && goalChecker(puck.x)) {
            scored = 'cpu';
            scoredIndex = i;
          } else if (puck.y > H - 5 && goalChecker(puck.x)) {
            scored = 'player';
            scoredIndex = i;
          }
        }
      }

      if (scoredIndex >= 0) {
        game.pucks.splice(scoredIndex, 1);
      }

      // パックがなくなったら新規生成
      // 得点した側がサーブ（パックが相手方向に飛ぶ）
      if (game.pucks.length === 0) {
        game.pucks.push(
          EntityFactory.createPuck(
            W / 2,
            H / 2,
            randomRange(-0.5, 0.5),
            // 失点した側へパックが流れる（CPU失点→上方向、プレイヤー失点→下方向）
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
      Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false, consts);
      Renderer.drawMallet(ctx, game.player, '#3498db', game.effects.player.invisible > 0, consts);
      Renderer.drawParticles(ctx, game.particles);
      Renderer.drawHUD(ctx, game.effects, now, consts);
      Renderer.drawFlash(ctx, game.flash, now, consts);
      Renderer.drawFeverEffect(ctx, game.fever.active, now, consts);

      if (showHelp) {
        Renderer.drawHelp(ctx, consts);
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
        // フィーバーリセット
        game.fever = { active: false, lastGoalTime: now, extraPucks: 0 };

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
          setTimeout(() => {
            setWinner('player');
            setScreen('result');
          }, consts.TIMING.GOAL_EFFECT);
          return;
        }
        if (scoreRef.current.c >= winScore) {
          setTimeout(() => {
            setWinner('cpu');
            setScreen('result');
          }, consts.TIMING.GOAL_EFFECT);
          return;
        }
      }

      animationRef = requestAnimationFrame(gameLoop);
    };

    animationRef = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef);
  }, [screen, diff, field, winScore, showHelp, getSound,
      gameRef, canvasRef, lastInputRef, scoreRef,
      setScores, setWinner, setScreen, setShowHelp, canvasSize]);
}
