import type { GameState } from '../types';
import { drawEffects } from './effects';
import { drawSprites } from './sprites';

const drawHud = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  ctx.fillStyle = '#1a2810';
  ctx.font = '10px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE ${String(state.score).padStart(7, '0')}`, 8, 8);
  ctx.fillText(`HP ${state.hp}/${state.maxHp}`, 8, 22);
  ctx.fillText(`LOOP ${state.loop}`, 8, 36);
  ctx.fillText(`STAGE ${state.stage.toUpperCase()}`, 300, 8);
  ctx.fillText(`SCENE ${state.scene.toUpperCase()}`, 300, 22);
  if (state.stage === 'cave') {
    ctx.fillText(`KEY ${state.cavePlaced}/${3}`, 300, 36);
  }
  if (state.stage === 'grass') {
    ctx.fillText(`KILL ${state.grassKills}/${state.grassGoal}`, 280, 36);
  }
  if (state.stage === 'boss') {
    ctx.fillText(`SEAL ${state.bossPedestals}/${6}`, 300, 36);
  }
};

const drawTitle = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = '#1a2810';
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KEYS & ARMS', 220, 120);
  ctx.font = '10px monospace';
  ctx.fillText('PRESS ACT OR ENTER', 220, 165);
};

const drawEnding = (ctx: CanvasRenderingContext2D, text: string): void => {
  ctx.fillStyle = '#1a2810';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 220, 140);
};

export const renderGame = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  ctx.clearRect(0, 0, 440, 340);
  ctx.fillStyle = '#b0bc98';
  ctx.fillRect(0, 0, 440, 340);

  if (state.scene === 'title') {
    drawTitle(ctx);
    drawHud(ctx, state);
    return;
  }

  drawSprites(ctx, state);
  drawEffects(ctx, state);
  drawHud(ctx, state);

  if (state.scene === 'over') {
    drawEnding(ctx, 'GAME OVER');
  }
  if (state.scene === 'ending1') {
    drawEnding(ctx, 'ENDING 1');
  }
  if (state.scene === 'trueEnd') {
    drawEnding(ctx, 'TRUE END');
  }
};
