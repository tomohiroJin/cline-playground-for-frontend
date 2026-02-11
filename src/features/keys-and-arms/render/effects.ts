import type { GameState } from '../types';

const drawStageMessage = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  let text = '';
  if (state.stage === 'cave' && state.caveKeys > state.cavePlaced) {
    text = 'CARRY KEY TO DOOR';
  }
  if (state.stage === 'grass' && state.grassCombo >= 2) {
    text = `COMBO x${state.grassCombo}`;
  }
  if (state.stage === 'boss' && !state.bossHasGem) {
    text = 'PLACE GEM ON SEAL';
  }

  if (!text) {
    return;
  }

  const blink = Math.floor(state.tick / 12) % 2 === 0;
  if (!blink) {
    return;
  }

  ctx.fillStyle = 'rgba(26,40,16,0.8)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, 220, 52);
};

export const drawEffects = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  if (state.scene !== 'play') {
    return;
  }

  const pulse = 0.04 + (Math.sin(state.tick / 5) + 1) * 0.03;
  ctx.fillStyle = `rgba(26,40,16,${pulse})`;
  ctx.fillRect(0, 0, 440, 340);

  if (state.hp === 1) {
    const critical = 0.05 + (Math.sin(state.tick / 2) + 1) * 0.05;
    ctx.fillStyle = `rgba(80,12,10,${critical})`;
    ctx.fillRect(0, 0, 440, 340);
  }

  for (let index = 0; index < 6; index += 1) {
    const sparkleX = (state.tick * (index + 1) * 3 + index * 57) % 440;
    const sparkleY = 76 + ((index * 39 + state.tick * 2) % 220);
    ctx.fillStyle = 'rgba(26,40,16,0.24)';
    ctx.fillRect(sparkleX, sparkleY, 2, 2);
  }

  drawStageMessage(ctx, state);
};
