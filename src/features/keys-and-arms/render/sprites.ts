import type { GameState } from '../types';

const COLORS = {
  bg: '#b0bc98',
  dark: '#1a2810',
  mid: 'rgba(26,40,16,0.45)',
  light: 'rgba(176,188,152,0.7)',
};

const KNIGHT = [
  [0, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 1],
];

const KEY = [
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [0, 0, 1, 0],
  [0, 1, 1, 1],
  [0, 0, 1, 0],
];

const GEM = [
  [0, 1, 0],
  [1, 1, 1],
  [1, 0, 1],
  [0, 1, 0],
];

const BOSS_FACE = [
  [0, 1, 1, 1, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1],
  [1, 0, 1, 1, 0, 1],
  [1, 1, 0, 0, 1, 1],
  [0, 1, 1, 1, 1, 0],
];

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: number[][],
  x: number,
  y: number,
  scale: number,
  color = COLORS.dark
): void => {
  ctx.fillStyle = color;
  sprite.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) {
        return;
      }
      ctx.fillRect(x + colIndex * scale, y + rowIndex * scale, scale, scale);
    });
  });
};

const drawKnight = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  const bob = Math.sin(state.tick / 12) * 2;
  let x = 208;
  let y = 220;

  if (state.stage === 'cave') {
    x = 60 + ((state.stageTick % 280) / 280) * 300;
    y = 224 + bob;
  }

  if (state.stage === 'grass') {
    const lane = state.stageTick % 3;
    y = [98, 158, 218][lane] + bob;
    x = 46;
  }

  if (state.stage === 'boss') {
    x = state.bossHasGem ? 214 : 184 + ((state.stageTick / 18) % 6) * 18;
    y = 244 + bob;
  }

  drawSprite(ctx, KNIGHT, x, y, 4);
};

const drawCave = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  ctx.fillStyle = COLORS.mid;
  ctx.fillRect(0, 40, 440, 250);
  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(0, 88, 440, 8);
  ctx.fillRect(0, 158, 440, 8);
  ctx.fillRect(0, 228, 440, 8);

  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(212, 90, 16, 140);
  ctx.fillRect(200, 118, 40, 4);
  ctx.fillRect(200, 148, 40, 4);
  ctx.fillRect(200, 178, 40, 4);
  ctx.fillRect(200, 208, 40, 4);

  for (let index = 0; index < 3; index += 1) {
    const slotX = 152 + index * 48;
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(slotX, 44, 28, 20);
    if (state.cavePlaced > index) {
      drawSprite(ctx, KEY, slotX + 8, 47, 3);
    }
  }

  if (state.caveKeys > state.cavePlaced) {
    const blink = Math.floor(state.tick / 8) % 2 === 0;
    if (blink) {
      drawSprite(ctx, KEY, 274, 214, 3);
    }
  }
};

const drawGrass = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  const lanes = [98, 158, 218];
  ctx.fillStyle = 'rgba(26,40,16,0.2)';
  ctx.fillRect(0, 72, 440, 200);

  lanes.forEach((laneY) => {
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(20, laneY + 30, 400, 3);
    for (let x = 26; x < 412; x += 18) {
      ctx.fillRect(x, laneY + 34, 2, 6);
    }
  });

  const remaining = Math.max(0, state.grassGoal - state.grassKills);
  const enemyCount = Math.min(3, remaining);
  for (let index = 0; index < enemyCount; index += 1) {
    const laneY = lanes[index % lanes.length];
    const travel = ((state.stageTick * (index + 1) * 3) % 320) / 320;
    const enemyX = 360 - travel * 260;
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(enemyX, laneY + 8, 20, 20);
    ctx.fillStyle = COLORS.light;
    ctx.fillRect(enemyX + 4, laneY + 12, 4, 4);
    ctx.fillRect(enemyX + 12, laneY + 12, 4, 4);
  }

  ctx.fillStyle = COLORS.dark;
  ctx.fillRect(30, 88, 10, 160);
  ctx.fillRect(30, 120, 22, 4);
  ctx.fillRect(30, 180, 22, 4);
};

const drawBoss = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  const centerX = 220;
  const centerY = 150;

  ctx.fillStyle = 'rgba(26,40,16,0.15)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 118, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 94, 0, Math.PI * 2);
  ctx.stroke();

  drawSprite(ctx, BOSS_FACE, centerX - 24, centerY - 18, 8);

  for (let index = 0; index < 6; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 3;
    const px = centerX + Math.cos(angle) * 86;
    const py = centerY + Math.sin(angle) * 86;
    ctx.fillStyle = COLORS.dark;
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();

    if (state.bossPedestals > index) {
      drawSprite(ctx, GEM, px - 6, py - 8, 4);
    }
  }

  if (!state.bossHasGem) {
    drawSprite(ctx, GEM, 206, 252, 4);
  }
};

export const drawSprites = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, 440, 340);

  if (state.stage === 'cave') {
    drawCave(ctx, state);
  }
  if (state.stage === 'grass') {
    drawGrass(ctx, state);
  }
  if (state.stage === 'boss') {
    drawBoss(ctx, state);
  }

  drawKnight(ctx, state);
};
