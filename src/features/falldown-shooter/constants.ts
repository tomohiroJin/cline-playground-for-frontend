// 落ち物シューティング 定数定義

import type { Config, PowerType, PowerTypeInfo, SkillType, SkillInfo, DemoSlide } from './types';

export const CONFIG: Config = {
  grid: { width: 12, height: 18, cellSize: 30 },
  timing: {
    spawn: { base: 2500, min: 800, decay: 30, stageMult: 200 },
    fall: { base: 450, min: 150, decay: 5, stageMult: 30 },
    bullet: { speed: 30, cooldown: 180 },
  },
  score: { block: 10, line: 100 },
  stages: [1, 2, 4, 8],
  powerUp: {
    chance: 0.15,
    duration: { triple: 8000, pierce: 6000, slow: 5000, downshot: 7000 },
  },
  skill: { chargeRate: 500, maxCharge: 100 },
  dangerLine: 2,
  demo: { idleTimeout: 8000, slideInterval: 5000 },
  spawn: { safeZone: 4, maxAttempts: 20 },
};

export const BLOCK_COLORS: string[] = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
];

export const BLOCK_SHAPES: number[][][] = [
  [[1, 1]],
  [[1], [1]],
  [
    [1, 1],
    [1, 1],
  ],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [
    [1, 1],
    [0, 1],
  ],
  [
    [1, 0],
    [1, 1],
  ],
];

export const POWER_TYPES: Record<PowerType, PowerTypeInfo> = {
  triple: { color: '#FF69B4', icon: '🔱', name: '3-Way Shot', desc: '3方向に弾を発射' },
  pierce: { color: '#00FF00', icon: '🔫', name: '貫通弾', desc: 'ブロックを貫通' },
  bomb: { color: '#FF4500', icon: '💣', name: '爆弾', desc: '周囲3x3を爆破' },
  slow: { color: '#87CEEB', icon: '⏱️', name: 'スロー', desc: '落下速度ダウン' },
  downshot: { color: '#9932CC', icon: '⬇️', name: '下方射撃', desc: '下にも弾を発射' },
};

export const SKILLS: Record<SkillType, SkillInfo> = {
  laser: { icon: '⚡', name: '縦レーザー', desc: '縦一列を全消去', color: '#FFD700', key: '1' },
  blast: {
    icon: '💥',
    name: '全画面爆破',
    desc: '落下中ブロック全破壊',
    color: '#FF6347',
    key: '2',
  },
  clear: { icon: '✨', name: 'ライン消去', desc: '最下段を消去', color: '#00CED1', key: '3' },
};

export const DEMO_SLIDES: DemoSlide[] = [
  {
    title: '🎮 遊び方',
    content: ['← → キーで移動', 'スペースキーで発射', 'ブロックを撃って破壊！'],
  },
  {
    title: '🎯 クリア条件',
    content: [
      'ラインを揃えて消そう！',
      ...CONFIG.stages.map((n, i) => `Stage ${i + 1}: ${n}ライン`),
    ],
  },
  {
    title: '⚡ パワーアップ',
    content: Object.values(POWER_TYPES).map(p => `${p.icon} ${p.name}: ${p.desc}`),
  },
  {
    title: '🌟 必殺技',
    content: [
      'ゲージ100%で発動可能！',
      ...Object.values(SKILLS).map(s => `${s.key}キー: ${s.icon}${s.name}`),
    ],
  },
  {
    title: '💡 コツ',
    content: [
      '光るブロックでパワーアップ！',
      'ピンチ時は必殺技で打開！',
      '赤線を超えるとゲームオーバー',
    ],
  },
];
