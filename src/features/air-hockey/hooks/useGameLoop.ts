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
  ObstacleState,
} from '../core/types';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const { MALLET: MR, PUCK: BR, ITEM: IR } = CONSTANTS.SIZES;

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
  setShowHelp: (v: boolean) => void
) {
  useEffect(() => {
    if (screen !== 'game') return;

    const sound = getSound();
    const goalChecker = (x: number) =>
      x > W / 2 - field.goalSize / 2 && x < W / 2 + field.goalSize / 2;

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
          const power = Math.min(CONSTANTS.PHYSICS.MAX_POWER, 5 + speed * 1.2);

          obj = Physics.resolveCollision(obj, col, power, mallet.vx, mallet.vy, 0.4);

          if (isPuck && isPlayer && game.effects.player.invisible > 0) {
            (obj as Puck).visible = false;
            (obj as Puck).invisibleCount = 25;
            game.effects.player.invisible--;
          }
          sound.hit();
        }
      }

      for (let oi = 0; oi < field.obstacles.length; oi++) {
        const ob = field.obstacles[oi];
        const obState: ObstacleState | undefined = game.obstacleStates[oi];

        // 破壊済みの障害物はスキップ
        if (obState && obState.destroyedAt !== null) continue;

        const col = Physics.detectCollision(obj.x, obj.y, radius, ob.x, ob.y, ob.r);
        if (col) {
          obj = Physics.reflectOffSurface(obj, col);
          sound.wall();

          // 破壊可能障害物のHP減少処理
          if (isPuck && obState) {
            obState.hp--;
            if (obState.hp <= 0) {
              obState.destroyedAt = Date.now();
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

      // ゴールエフェクト表示中
      if (game.goalEffect && now - game.goalEffect.time < CONSTANTS.TIMING.GOAL_EFFECT) {
        Renderer.clear(ctx);
        Renderer.drawField(ctx, field, game.obstacleStates, now);
        Renderer.drawGoalEffect(ctx, game.goalEffect, now);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }
      game.goalEffect = null;

      // ヘルプ表示判定
      if (now - lastInputRef.current > CONSTANTS.TIMING.HELP_TIMEOUT && !showHelp) {
        setShowHelp(true);
      }

      // 破壊済み障害物の復活チェック
      const respawnMs = field.obstacleRespawnMs ?? CONSTANTS.TIMING.OBSTACLE_RESPAWN;
      for (const obState of game.obstacleStates) {
        if (obState.destroyedAt !== null && now - obState.destroyedAt >= respawnMs) {
          obState.hp = obState.maxHp;
          obState.destroyedAt = null;
        }
      }

      // CPU AI 更新
      const cpuUpdate = CpuAI.update(game, diff, now);
      if (cpuUpdate) {
        game.cpu = cpuUpdate.cpu;
        game.cpuTarget = cpuUpdate.cpuTarget;
        game.cpuTargetTime = cpuUpdate.cpuTargetTime;
        game.cpuStuckTimer = cpuUpdate.cpuStuckTimer;
      }

      // アイテム生成
      if (now - game.lastItemSpawn > CONSTANTS.TIMING.ITEM_SPAWN && game.items.length < 2) {
        game.items.push(EntityFactory.createItem(randomChoice(ITEMS), Math.random() > 0.5));
        game.lastItemSpawn = now;
      }

      // アイテムの物理演算と衝突処理
      for (let i = game.items.length - 1; i >= 0; i--) {
        let item = game.items[i];
        item.x += item.vx;
        item.y += item.vy;

        item = Physics.applyWallBounce(item, IR, goalChecker, sound.wall);
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

        puck.x += puck.vx * speedMultiplier;
        puck.y += puck.vy * speedMultiplier;

        if (!puck.visible) {
          puck.invisibleCount--;
          if (puck.invisibleCount <= 0) puck.visible = true;
        }

        puck = Physics.applyWallBounce(puck, BR, goalChecker, sound.wall);
        puck = processCollisions(puck, BR, game, true);
        puck = Physics.applyFriction(puck);
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
            scored === 'cpu' ? -1.5 : 1.5
          )
        );
      }

      // 描画
      Renderer.clear(ctx);
      Renderer.drawField(ctx, field, game.obstacleStates, now);
      Renderer.drawEffectZones(ctx, game.effects, now);
      game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now));
      game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck));
      Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false);
      Renderer.drawMallet(ctx, game.player, '#3498db', game.effects.player.invisible > 0);
      Renderer.drawHUD(ctx, game.effects, now);
      Renderer.drawFlash(ctx, game.flash, now);

      if (showHelp) {
        Renderer.drawHelp(ctx);
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

        if (scoreRef.current.p >= winScore) {
          setTimeout(() => {
            setWinner('player');
            setScreen('result');
          }, CONSTANTS.TIMING.GOAL_EFFECT);
          return;
        }
        if (scoreRef.current.c >= winScore) {
          setTimeout(() => {
            setWinner('cpu');
            setScreen('result');
          }, CONSTANTS.TIMING.GOAL_EFFECT);
          return;
        }
      }

      animationRef = requestAnimationFrame(gameLoop);
    };

    animationRef = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef);
  }, [screen, diff, field, winScore, showHelp, getSound,
      gameRef, canvasRef, lastInputRef, scoreRef,
      setScores, setWinner, setScreen, setShowHelp]);
}
