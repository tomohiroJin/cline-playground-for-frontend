export const addScore = (score: number, delta: number): number => Math.max(0, score + delta);

export const clampHp = (hp: number, maxHp: number): number => Math.max(0, Math.min(maxHp, hp));
