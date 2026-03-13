/**
 * KEYS & ARMS — オーディオ API の型定義
 */

/** 効果音一覧 */
export interface SoundEffects {
  tick(): void;
  move(): void;
  grab(): void;
  hit(): void;
  kill(): void;
  pry(): void;
  guard(): void;
  clear(): void;
  over(): void;
  start(): void;
  warn(): void;
  steal(): void;
  shieldBreak(): void;
  gem(): void;
  zap(): void;
  set(): void;
  step(): void;
  ladder(): void;
  safe(): void;
  drip(): void;
  combo(n: number): void;
  bossDie(): void;
}

/** オーディオモジュール（createAudio の戻り値型） */
export interface AudioModule {
  ea(): void;
  tn(f: number, d: number, tp?: OscillatorType, v?: number): void;
  noise(d: number, v?: number): void;
  bgmTick(): void;
  S: SoundEffects;
}
