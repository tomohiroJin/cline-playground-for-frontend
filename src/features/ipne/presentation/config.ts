/**
 * IPNE ゲーム画面設定・定数
 */

// 描画設定
export const CONFIG = {
  playerColor: '#667eea',
  wallColor: '#374151',
  floorColor: '#1f2937',
  goalColor: '#10b981',
  startColor: '#3b82f6',
  enemyColors: {
    patrol: '#6b21a8',
    charge: '#991b1b',
    ranged: '#c2410c',
    specimen: '#1e3a5f',
    boss: '#7c2d12',
  },
  itemColors: {
    health_small: '#22c55e',
    health_large: '#ef4444',
    health_full: '#fbbf24',
    level_up: '#f0abfc',
    map_reveal: '#a16207',
    key: '#fcd34d',
  },
  // MVP3追加
  trapColors: {
    damage: '#dc2626',
    slow: '#3b82f6',
    alert: '#f59e0b',
  },
  wallColors: {
    breakable: '#78350f',
    passable: '#166534',
    invisible: '#4c1d95',
  },
};

// プロローグテキスト
export const PROLOGUE_TEXTS = [
  '古代遺跡の調査中、突如として通路が崩落した。',
  '閉じ込められたあなたは、唯一の脱出口を探す。',
  'デジタルマップを頼りに、迷宮を進め。',
];
