// レンダラー定数（インフラストラクチャ層）

export const CANVAS = Object.freeze({
  WIDTH: 900,
  HEIGHT: 700,
});

export const COLORS = Object.freeze({
  car: ['#E60012', '#0066FF', '#00AA00', '#FF6600', '#AA00AA', '#FFCC00'],
  particle: ['#ff0', '#f80', '#f00'],
  confetti: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'],
  firework: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'],
});

export const RENDER = Object.freeze({
  startLine: { width: 12, squares: 6 },
  sparkThreshold: 1.5,
  particleCount: 8,
  decoCount: 35,
  confettiCount: 100,
  maxParticles: 200,
  maxSparks: 100,
});
