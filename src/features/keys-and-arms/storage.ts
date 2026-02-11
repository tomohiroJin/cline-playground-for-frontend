import { LEGACY_STORAGE_KEY, STORAGE_KEY } from './constants';

const parseScore = (raw: string | null): number => {
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export const loadHiScore = (): number => {
  const currentScore = parseScore(window.localStorage.getItem(STORAGE_KEY));
  if (currentScore > 0) {
    return currentScore;
  }

  const legacyScore = parseScore(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacyScore > 0) {
    window.localStorage.setItem(STORAGE_KEY, String(legacyScore));
  }
  return legacyScore;
};

export const saveHiScore = (score: number): void => {
  const safeScore = Math.max(0, Math.floor(score));
  window.localStorage.setItem(STORAGE_KEY, String(safeScore));
};
