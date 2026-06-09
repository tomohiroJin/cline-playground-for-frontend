export const Config = {
  screen: { width: 400, height: 700 },
  player: { width: 24, height: 30, moveMargin: 25 },
  ramp: { height: 55, total: 100, transitionMargin: 30, startOffset: 45 },
  speed: { min: 3.5, max: 14, accelRate: 0.12, decelRate: 0.025 },
  physics: { gravity: 0.5, friction: 0.96, moveAccel: 0.6 },
  jump: { power: -8, forcedPower: -7, cooldown: 12, landingCooldown: 8 },
  effect: { duration: 180, forceJumpInterval: 55 },
  particle: { lifetime: 25, defaultCount: 6, jetSpeedThreshold: 5 },
  score: {
    rampBase: 100,
    item: 500,
    enemy: 300,
    speedBonusMid: 20,
    speedBonusHigh: 50,
    nearMiss: 150,
  },
  collision: { groundThreshold: 22, airThreshold: 18, airYThreshold: -18, nearMissThreshold: 40 },
  combo: { timeout: 120, maxMultiplier: 5 },
  combat: { enemyKillSlowdown: 2, bounceMultiplier: 0.4, bounceSpeed: 5 },
  camera: { followRate: 0.1, offsetDivisor: 3 },
  animation: { deathFrames: 40, clearPhase1Frames: 60, countdownInterval: 800, titleMelodyDelay: 500, gameOverScreenDelay: 300, shakeDecay: 0.88, deathAnimInterval: 35, clearAnimInterval: 30 },
  juice: {
    // ヒットストップ（完全停止）するフレーム数
    hitstop: { enemyKill: 4, item: 2, death: 3 },
    // スローモー: frames=持続 real-tick 数, factor=何 tick に1回 sim を進めるか
    slowMo: { nearMissFrames: 12, nearMissFactor: 3 },
  },
} as const;
