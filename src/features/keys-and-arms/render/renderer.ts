import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';
import { CoreGameState, SceneState } from '../types';
import { HERO_ACT, HERO_IDLE, ENEMY, SpriteMatrix } from './sprites';
import { Popup } from './effects';

const LCD_BG = '#b0bc98';
const LCD_ON = '#1a2810';
const LCD_GHOST = 'rgba(80,92,64,0.18)';

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteMatrix,
  x: number,
  y: number,
  scale = 4
): void {
  ctx.fillStyle = LCD_ON;
  sprite.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        return;
      }
      ctx.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
}

function drawScanline(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(145,158,125,0.1)';
  for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  }
}

function drawHud(ctx: CanvasRenderingContext2D, state: CoreGameState): void {
  ctx.fillStyle = LCD_ON;
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${String(state.score).padStart(6, '0')}`, 12, 18);
  ctx.fillText(`HP ${state.hp}/${state.maxHp}`, 12, 34);
  ctx.fillText(`LOOP ${state.loop}`, 12, 50);
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, scene: SceneState): void {
  ctx.fillStyle = LCD_ON;
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.fillText(`SCENE: ${scene.toUpperCase()}`, CANVAS_WIDTH / 2, 80);
}

function drawPopups(ctx: CanvasRenderingContext2D, popups: Popup[]): void {
  ctx.font = "8px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  popups.forEach(popup => {
    ctx.globalAlpha = Math.min(1, popup.life / 20);
    ctx.fillStyle = LCD_ON;
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.globalAlpha = 1;
  });
}

function drawPlayField(ctx: CanvasRenderingContext2D, scene: SceneState, actPressed: boolean): void {
  ctx.strokeStyle = LCD_GHOST;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 96, CANVAS_WIDTH - 48, 200);

  for (let i = 1; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(24, 96 + i * 66);
    ctx.lineTo(CANVAS_WIDTH - 24, 96 + i * 66);
    ctx.stroke();
  }

  drawSprite(ctx, actPressed ? HERO_ACT : HERO_IDLE, 72, 220, 6);
  drawSprite(ctx, ENEMY, 280, 150, 6);

  ctx.fillStyle = LCD_ON;
  ctx.font = "9px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  if (scene === 'cave') {
    ctx.fillText('FIND KEYS', CANVAS_WIDTH / 2, 128);
  } else if (scene === 'grass') {
    ctx.fillText('DEFEND LANES', CANVAS_WIDTH / 2, 128);
  } else if (scene === 'boss') {
    ctx.fillText('BREAK ARMS', CANVAS_WIDTH / 2, 128);
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: CoreGameState,
  options: { actPressed: boolean; popups: Popup[] }
): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = LCD_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawScanline(ctx);

  drawHud(ctx, state);

  if (state.scene === 'title') {
    ctx.fillStyle = LCD_ON;
    ctx.font = "18px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('KEYS & ARMS', CANVAS_WIDTH / 2, 138);
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText('PRESS ACT TO START', CANVAS_WIDTH / 2, 192);
    return;
  }

  if (state.scene === 'over') {
    ctx.fillStyle = LCD_ON;
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 160);
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText('ACT: RETRY / ESC: TITLE', CANVAS_WIDTH / 2, 206);
    return;
  }

  if (state.scene === 'ending1' || state.scene === 'trueEnd') {
    ctx.fillStyle = LCD_ON;
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(state.scene === 'trueEnd' ? 'TRUE END' : 'ENDING', CANVAS_WIDTH / 2, 140);
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText('ACT: NEXT LOOP / ESC: TITLE', CANVAS_WIDTH / 2, 188);
    return;
  }

  if (state.scene === 'transition' && state.transition) {
    ctx.fillStyle = LCD_ON;
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(state.transition.label.split(':')[0], CANVAS_WIDTH / 2, 170);
    return;
  }

  drawSceneLabel(ctx, state.scene);
  drawPlayField(ctx, state.scene, options.actPressed);
  drawPopups(ctx, options.popups);
}
