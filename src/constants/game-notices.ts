/** ゲーム固有の注意事項 */
export interface GameNoticeInfo {
  /** ゲーム名 */
  readonly name: string;
  /** 音声を使用するか */
  readonly hasAudio: boolean;
  /** 点滅エフェクトを含むか */
  readonly hasFlashing: boolean;
  /** 推奨デバイス */
  readonly recommendedDevice: 'pc' | 'both';
}

/** ルートパスをキーとしたゲーム注意事項マップ */
export const GAME_NOTICES: Readonly<Record<string, GameNoticeInfo>> = {
  '/puzzle': {
    name: 'Picture Puzzle',
    hasAudio: false,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/air-hockey': {
    name: 'Air Hockey',
    hasAudio: true,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/racing': {
    name: 'Racing Game',
    hasAudio: false,
    hasFlashing: false,
    recommendedDevice: 'pc',
  },
  '/falling-shooter': {
    name: 'Falldown Shooter',
    hasAudio: false,
    hasFlashing: true,
    recommendedDevice: 'both',
  },
  '/maze-horror': {
    name: 'Labyrinth of Shadows',
    hasAudio: true,
    hasFlashing: true,
    recommendedDevice: 'pc',
  },
  '/non-brake-descent': {
    name: 'Non-Brake Descent',
    hasAudio: false,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/deep-sea-shooter': {
    name: 'Deep Sea Interceptor',
    hasAudio: false,
    hasFlashing: true,
    recommendedDevice: 'both',
  },
  '/ipne': {
    name: 'IPNE',
    hasAudio: true,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/agile-quiz-sugoroku': {
    name: 'Agile Quiz Sugoroku',
    hasAudio: true,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/labyrinth-echo': {
    name: '迷宮の残響',
    hasAudio: false,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/risk-lcd': {
    name: 'RISK LCD',
    hasAudio: true,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
  '/keys-and-arms': {
    name: 'KEYS & ARMS',
    hasAudio: true,
    hasFlashing: true,
    recommendedDevice: 'both',
  },
  '/primal-path': {
    name: '原始進化録 - PRIMAL PATH',
    hasAudio: true,
    hasFlashing: false,
    recommendedDevice: 'both',
  },
};
