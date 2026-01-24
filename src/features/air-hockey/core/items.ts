const magnitude = (vx: number, vy: number) => Math.sqrt(vx ** 2 + vy ** 2);

export const ItemEffects = {
  split: (game: any) => {
    if (game.pucks.length !== 1) return;
    const p = game.pucks[0];
    const speed = magnitude(p.vx, p.vy) || 3;
    const angle = Math.atan2(p.vy, p.vx);
    game.pucks = [
      { ...p },
      { ...p, x: p.x - 20, vx: Math.cos(angle - 0.5) * speed, vy: Math.sin(angle - 0.5) * speed },
      { ...p, x: p.x + 20, vx: Math.cos(angle + 0.5) * speed, vy: Math.sin(angle + 0.5) * speed },
    ];
  },
  speed: (game: any, target: string) => {
    game.effects[target].speed = { start: Date.now(), duration: 8000 };
  },
  invisible: (game: any, target: string) => {
    game.effects[target].invisible = 5;
  },
};

export const applyItemEffect = (game: any, item: any, target: string, now: number) => {
  game.flash = { type: item.id, time: now };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ItemEffects[item.id]?.(game, target);
};
