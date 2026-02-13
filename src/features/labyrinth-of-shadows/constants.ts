// ==================== CONFIG ====================
export const CONFIG = {
  render: { fov: Math.PI / 3, rayCount: 100, maxDepth: 18, width: 900, height: 560 },
  player: { rotSpeed: 0.003, moveSpeed: 0.0024, radius: 0.2, sprintMult: 1.5 },
  hiding: { drainRate: 0.02, rechargeRate: 0.016, minEnergy: 5 },
  stamina: { drainRate: 0.022, rechargeRate: 0.014 },
  enemy: { chaseRange: 8, minSpawnDist: 5 },
  timing: { invinceDuration: 2500, msgDuration: 2000, trapPenalty: 12000 },
  score: { keyBase: 100, victoryBonus: 500, damagePenalty: 50 },
  difficulties: {
    EASY: {
      size: 9,
      keys: 2,
      traps: 1,
      time: 200,
      enemySpeed: 0.006,
      enemyCount: 1,
      lives: 5,
      label: '初級',
      gradient: 'easy',
    },
    NORMAL: {
      size: 11,
      keys: 3,
      traps: 2,
      time: 170,
      enemySpeed: 0.009,
      enemyCount: 2,
      lives: 3,
      label: '中級',
      gradient: 'normal',
    },
    HARD: {
      size: 14,
      keys: 4,
      traps: 3,
      time: 140,
      enemySpeed: 0.012,
      enemyCount: 3,
      lives: 2,
      label: '上級',
      gradient: 'hard',
    },
  },
} as const;

// ==================== CONTENT ====================
export const CONTENT = {
  stories: {
    intro: [
      'ここは...どこだ...',
      '気がつくと、暗い迷宮の中にいた。',
      '「鍵」を見つけて脱出しろ。',
      '奴らに捕まるな...',
    ],
    victory: ['光が差し込む...脱出成功だ！', 'だが、迷宮は次の犠牲者を待っている...'],
    gameover: ['冷たい手に捕まった...', '意識が闇に飲まれる...', '【 GAME OVER 】'],
    timeout: ['時間切れだ...', '迷宮が崩れ落ちる...', '【 GAME OVER 】'],
  },
  items: {
    key: { emoji: '🔑', name: '鍵', color: '#ffdd00', bgColor: '#4a3800' },
    trap: { emoji: '📦', name: '？箱', color: '#ff8844', bgColor: '#4a2200' },
    exit: { emoji: '🚪', name: '出口', color: '#44ff88', bgColor: '#003a00' },
    exitLocked: { emoji: '🔒', name: '施錠中', color: '#888888', bgColor: '#333333' },
    enemy: { emoji: '👹', name: '敵', color: '#ff0044', bgColor: '#4a0020' },
  },
  sounds: {
    footstep: [90, 'triangle', 0.06],
    sprint: [120, 'triangle', 0.05],
    enemy: [42, 'sawtooth', 0.15],
    key: [988, 'sine', 0.3],
    trap: [110, 'square', 0.35],
    door: [660, 'sine', 0.25],
    hurt: [70, 'sawtooth', 0.45],
    heartbeat: [55, 'sine', 0.2],
  },
  demo: [
    {
      title: '🎯 ゲームの目的',
      items: ['鍵を全て集める', '出口から脱出する', '制限時間内にクリア'],
      icon: '🏆',
    },
    {
      title: '🔑 アイテム',
      items: ['🔑 鍵：出口を開ける', '📦 ？箱：罠かも...', '🚪 出口：脱出口'],
      icon: '📦',
    },
    {
      title: '👹 敵について',
      items: ['プレイヤーを追跡する', '触れるとダメージ', '⚠️で接近を察知'],
      icon: '⚠️',
    },
    {
      title: '🙈 隠れる',
      items: ['Spaceで隠れる', '敵に見つからない', '動けずゲージ消費'],
      icon: '👁️',
    },
    {
      title: '🏃 ダッシュ',
      items: ['Shiftで高速移動', '逃げる時に有効', 'スタミナ消費'],
      icon: '💨',
    },
  ],
} as const;
