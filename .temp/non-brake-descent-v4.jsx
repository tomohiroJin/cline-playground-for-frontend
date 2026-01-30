import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============================================================================
// [1] DOMAIN TYPES - 不変の型定義（Single Source of Truth）
// ============================================================================
const GameState = Object.freeze({
  TITLE: 'title', COUNTDOWN: 'countdown', PLAY: 'play',
  DYING: 'dying', OVER: 'over', CLEAR: 'clear'
});

const ObstacleType = Object.freeze({
  HOLE_S: 'holeS', HOLE_L: 'holeL', ROCK: 'rock',
  ENEMY: 'enemy', ENEMY_V: 'enemyV', SCORE: 'score',
  REVERSE: 'reverse', FORCE_JUMP: 'forceJ',
  TAKEN: 'taken', DEAD: 'dead'
});

const RampType = Object.freeze({
  NORMAL: 'normal', STEEP: 'steep', GENTLE: 'gentle', V_SHAPE: 'vshape'
});

const SpeedRank = Object.freeze({ LOW: 0, MID: 1, HIGH: 2 });

// ============================================================================
// [2] CONFIGURATION - 設定の一元管理（Open/Closed Principle）
// ============================================================================
const Config = Object.freeze({
  screen: { width: 400, height: 700 },
  player: { width: 24, height: 30 },
  ramp: { height: 55, total: 100 },
  speed: { min: 3.5, max: 14, accelRate: 0.12, decelRate: 0.025 },
  physics: { gravity: 0.5, friction: 0.96, moveAccel: 0.6 },
  jump: { power: -8, forcedPower: -7, cooldown: 12, landingCooldown: 8 },
  effect: { duration: 180, forceJumpInterval: 55 },
  particle: { lifetime: 25, defaultCount: 6 },
  score: { rampBase: 100, item: 500, enemy: 300, speedBonusMid: 20, speedBonusHigh: 50, nearMiss: 150 },
  collision: { groundThreshold: 22, airThreshold: 18, airYThreshold: -18, nearMissThreshold: 40 },
  combo: { timeout: 120, maxMultiplier: 5 },
  animation: { deathFrames: 40, clearPhase1Frames: 60, countdownInterval: 800 }
});

const RampColors = Object.freeze([
  { base: ['#4466aa', '#223366'], stroke: '#6688cc', bg: '#1a2244' },
  { base: ['#aa6644', '#663322'], stroke: '#cc8866', bg: '#2a1a11' },
  { base: ['#44aa66', '#226633'], stroke: '#66cc88', bg: '#112a1a' },
  { base: ['#aa44aa', '#662266'], stroke: '#cc66cc', bg: '#2a112a' },
  { base: ['#aaaa44', '#666622'], stroke: '#cccc66', bg: '#2a2a11' },
  { base: ['#44aaaa', '#226666'], stroke: '#66cccc', bg: '#112a2a' }
]);

const Ranks = Object.freeze([
  { rank: 'S', minScore: 50000, color: '#ffdd00', message: 'PERFECT!' },
  { rank: 'A', minScore: 30000, color: '#44ffaa', message: 'EXCELLENT!' },
  { rank: 'B', minScore: 15000, color: '#44aaff', message: 'GREAT!' },
  { rank: 'C', minScore: 5000, color: '#aaaaaa', message: 'GOOD' },
  { rank: 'D', minScore: 0, color: '#aa6666', message: 'TRY AGAIN' }
]);

// ============================================================================
// [3] PURE UTILITY FUNCTIONS - 副作用なし、テスト容易
// ============================================================================
const MathUtils = Object.freeze({
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  randomRange: (min, max) => min + Math.random() * (max - min),
  randomBool: (p = 0.5) => Math.random() < p,
  normalize: (v, min, max) => (v - min) / (max - min)
});

const FnUtils = Object.freeze({
  identity: x => x,
  pipe: (...fns) => x => fns.reduce((v, f) => f(v), x)
});

// ============================================================================
// [4] DOMAIN LOGIC - ビジネスロジック（Pure Functions）
// ============================================================================
const SpeedDomain = Object.freeze({
  getRank: speed => speed < 6 ? SpeedRank.LOW : speed < 10 ? SpeedRank.MID : SpeedRank.HIGH,
  getColor: speed => ['#00ff88', '#ffcc00', '#ff3344'][SpeedDomain.getRank(speed)],
  getMultiplier: speed => [1, 2, 3][SpeedDomain.getRank(speed)],
  accelerate: (speed, accel) => MathUtils.clamp(speed + (accel ? Config.speed.accelRate : -Config.speed.decelRate), Config.speed.min, Config.speed.max),
  getBonus: speed => ({ [SpeedRank.HIGH]: Config.score.speedBonusHigh, [SpeedRank.MID]: Config.score.speedBonusMid })[SpeedDomain.getRank(speed)] || 0,
  getNormalized: speed => MathUtils.normalize(speed, Config.speed.min, Config.speed.max)
});

const GeometryDomain = Object.freeze({
  getRampGeometry: (ramp, width, height) => {
    const margin = 20, lx = ramp.dir === 1 ? margin : margin + 10, rx = ramp.dir === 1 ? width - margin - 10 : width - margin;
    const slopes = {
      [RampType.STEEP]: { ty: ramp.dir === 1 ? 0 : height * 0.75, by: ramp.dir === 1 ? height * 0.75 : 0, midY: null },
      [RampType.GENTLE]: { ty: ramp.dir === 1 ? height * 0.25 : height * 0.45, by: ramp.dir === 1 ? height * 0.45 : height * 0.25, midY: null },
      [RampType.V_SHAPE]: { ty: height * 0.15, by: height * 0.15, midY: height * 0.55 },
      [RampType.NORMAL]: { ty: ramp.dir === 1 ? height * 0.1 : height * 0.55, by: ramp.dir === 1 ? height * 0.55 : height * 0.1, midY: null }
    };
    return { lx, rx, ...slopes[ramp.type] || slopes[RampType.NORMAL] };
  },
  getSlopeY: (x, geo, type) => {
    const t = MathUtils.clamp((x - geo.lx) / (geo.rx - geo.lx), 0, 1);
    return type === RampType.V_SHAPE && geo.midY !== null
      ? (t < 0.5 ? MathUtils.lerp(geo.ty, geo.midY, t * 2) : MathUtils.lerp(geo.midY, geo.by, (t - 0.5) * 2))
      : MathUtils.lerp(geo.ty, geo.by, t);
  },
  getObstacleX: (obs, ramp, width) => ramp.dir === 1 ? 40 + obs.pos * (width - 80) : width - 40 - obs.pos * (width - 80),
  getRampColor: index => RampColors[Math.floor(index / 15) % RampColors.length],
  isInViewport: (ry, rampH, screenH) => ry > -rampH - 20 && ry < screenH + 20
});

const CollisionDomain = Object.freeze({
  check: (px, ox, jumping, jumpY) => {
    const dist = Math.abs(px - ox), { groundThreshold: gt, airThreshold: at, airYThreshold: ayt, nearMissThreshold: nmt } = Config.collision;
    const ground = dist < gt && !jumping, air = dist < at && jumping && jumpY > ayt, nearMiss = dist < nmt && dist >= gt && !jumping;
    return { ground, air, hit: ground || air, nearMiss, dist };
  },
  isDangerous: t => [ObstacleType.HOLE_S, ObstacleType.HOLE_L, ObstacleType.ROCK, ObstacleType.ENEMY, ObstacleType.ENEMY_V].includes(t),
  isActive: obs => obs.t !== ObstacleType.TAKEN && obs.t !== ObstacleType.DEAD
});

const ScoringDomain = Object.freeze({
  getRankData: score => Ranks.find(r => score >= r.minScore) || Ranks[Ranks.length - 1],
  calcRampScore: (speed, combo) => { const base = Config.score.rampBase * SpeedDomain.getMultiplier(speed); return { base, bonus: combo > 1 ? Math.floor(base * (combo - 1) * 0.5) : 0 }; },
  calcTimeBonus: (elapsed, max = 300) => Math.max(0, Math.floor((max - elapsed) * 10)),
  calcFinal: (score, speedBonus, timeBonus = 0) => score + speedBonus + timeBonus
});

const ComboDomain = Object.freeze({
  shouldActivate: (speed, min = 8) => speed >= min,
  increment: (combo, timer) => ({ combo: timer > 0 ? Math.min(combo + 1, Config.combo.maxMultiplier) : 1, timer: Config.combo.timeout }),
  reset: () => ({ combo: 0, timer: 0 }),
  tick: t => Math.max(0, t - 1)
});

const DangerDomain = Object.freeze({
  calcLevel: (obs, px, dir, speed, W) => obs.reduce((max, o) => {
    if (!CollisionDomain.isActive(o) || o.t === ObstacleType.SCORE) return max;
    const ox = GeometryDomain.getObstacleX(o, { dir }, W), dist = dir === 1 ? ox - px : px - ox;
    return dist > 0 && dist < 100 ? Math.max(max, (1 - dist / 100) * SpeedDomain.getNormalized(speed)) : max;
  }, 0)
});

// ============================================================================
// [5] ENTITY FACTORIES - エンティティ生成（Factory Pattern）
// ============================================================================
const EntityFactory = Object.freeze({
  createPlayer: () => ({ x: 60, y: 0, ramp: 0, vx: 0, vy: 0, jumping: false, jumpCD: 0, onGround: true }),
  createParticle: (x, y, color, lifetime = Config.particle.lifetime) => ({ x, y, color, vx: MathUtils.randomRange(-3, 3), vy: -Math.random() * 5, life: lifetime }),
  createParticles: (x, y, color, count = Config.particle.defaultCount) => Array.from({ length: count }, () => EntityFactory.createParticle(x, y, color)),
  createJetParticle: (x, y, dir) => ({ x: x - dir * 10 + MathUtils.randomRange(-4, 4), y: y + 5, color: MathUtils.randomBool() ? '#ff6600' : '#ffaa00', vx: -dir * MathUtils.randomRange(2, 5), vy: MathUtils.randomRange(-1, 1), life: MathUtils.randomRange(15, 25) }),
  createScorePopup: (x, y, text, color = '#fff') => ({ x, y, text, color, life: 60, vy: -2 }),
  createNearMissEffect: (x, y) => ({ x, y, life: 30, scale: 1 }),
  createObstacle: (type, pos, extras = {}) => ({ t: type, pos, passed: false, ...extras }),
  createRamp: (dir, obs, type, isGoal) => ({ dir, obs, type, isGoal }),
  createCloud: () => ({ x: Config.screen.width + MathUtils.randomRange(0, 100), y: MathUtils.randomRange(0, Config.screen.height * 0.4), size: MathUtils.randomRange(30, 80), speed: MathUtils.randomRange(0.3, 0.8), opacity: MathUtils.randomRange(0.1, 0.3) }),
  createBuilding: x => ({ x, width: MathUtils.randomRange(30, 90), height: MathUtils.randomRange(100, 300), windows: Math.floor(MathUtils.randomRange(3, 8)), color: `hsl(${MathUtils.randomRange(200, 240)}, 30%, ${MathUtils.randomRange(15, 25)}%)` })
});

// ============================================================================
// [6] GENERATORS - 生成ロジック
// ============================================================================
const ObstacleGen = Object.freeze({
  table: [
    { maxProb: 0.10, type: ObstacleType.HOLE_S },
    { maxProb: 0.18, type: ObstacleType.HOLE_L },
    { maxProb: 0.28, type: ObstacleType.ROCK },
    { maxProb: 0.40, type: ObstacleType.ENEMY, extras: () => ({ phase: MathUtils.randomRange(0, Math.PI * 2), moveDir: MathUtils.randomBool() ? 1 : -1, walkPos: MathUtils.randomRange(0, 100) }) },
    { maxProb: 0.48, type: ObstacleType.ENEMY_V, extras: () => ({ phase: MathUtils.randomRange(0, Math.PI * 2), vSpeed: MathUtils.randomRange(0.1, 0.2) }) },
    { maxProb: 0.62, type: ObstacleType.SCORE },
    { maxProb: 0.72, type: ObstacleType.REVERSE },
    { maxProb: 0.80, type: ObstacleType.FORCE_JUMP }
  ],
  generate: pos => { const e = ObstacleGen.table.find(t => Math.random() < t.maxProb); return e ? EntityFactory.createObstacle(e.type, pos, e.extras?.() || {}) : null; }
});

const RampGen = Object.freeze({
  genObs: (i, total) => {
    if (i <= 2 || i >= total - 2) return [];
    const diff = Math.min(1, i / 60), count = MathUtils.randomBool(0.2 + diff * 0.2) ? 2 : 1;
    return (count === 2 ? [MathUtils.randomRange(0.2, 0.4), MathUtils.randomRange(0.6, 0.8)] : [MathUtils.randomRange(0.3, 0.7)]).map(ObstacleGen.generate).filter(Boolean);
  },
  selectType: i => i <= 5 || !MathUtils.randomBool(0.25) ? RampType.NORMAL : [RampType.STEEP, RampType.GENTLE, RampType.V_SHAPE][Math.floor(Math.random() * 3)],
  generate: total => { let dir = 1; return Array.from({ length: total }, (_, i) => { const r = EntityFactory.createRamp(dir, RampGen.genObs(i, total), RampGen.selectType(i), i === total - 1); dir *= -1; return r; }); }
});

const BackgroundGen = Object.freeze({
  initBuildings: () => { const b = []; for (let x = 0; x < Config.screen.width + 200; x += MathUtils.randomRange(50, 90)) b.push(EntityFactory.createBuilding(x)); return b; },
  initClouds: (n = 6) => Array.from({ length: n }, EntityFactory.createCloud)
});

// ============================================================================
// [7] PHYSICS SYSTEM - 物理演算（Pure Functions）
// ============================================================================
const Physics = Object.freeze({
  applyMovement: (p, input, speed, dir) => {
    let vx = p.vx + (input.left ? -Config.physics.moveAccel : 0) + (input.right ? Config.physics.moveAccel : 0);
    vx *= Config.physics.friction;
    return { ...p, x: MathUtils.clamp(p.x + dir * speed * 1.2 + vx, 25, Config.screen.width - 25), vx };
  },
  applyJump: (p, input, effType, effTimer) => {
    let { y, vy, jumping, jumpCD, onGround } = p, didJump = false;
    const forceJ = effType === 'forceJ' && effTimer % Config.effect.forceJumpInterval === 0 && onGround && jumpCD <= 0;
    if ((forceJ || (input.jump && onGround && jumpCD <= 0))) { jumping = true; vy = forceJ ? Config.jump.forcedPower : Config.jump.power; onGround = false; jumpCD = Config.jump.cooldown; didJump = true; }
    if (jumping) { vy += Config.physics.gravity; y += vy; if (y >= 0) { y = vy = 0; jumping = false; jumpCD = Config.jump.landingCooldown; } }
    if (jumpCD > 0) jumpCD--;
    if (jumpCD <= 0 && !jumping) onGround = true;
    return { player: { ...p, y, vy, jumping, jumpCD, onGround }, didJump };
  },
  checkTransition: (p, ramps, W) => {
    const ramp = ramps[p.ramp];
    if (!ramp || p.jumping) return { transitioned: false, player: p };
    const atEnd = (ramp.dir === 1 && p.x >= W - 30) || (ramp.dir === -1 && p.x <= 30);
    if (!atEnd) return { transitioned: false, player: p };
    const next = p.ramp + 1;
    if (next >= ramps.length) return { transitioned: false, player: p, isGoal: true };
    return { transitioned: true, player: { ...p, ramp: next, x: ramps[next].dir === 1 ? 45 : W - 45, y: 0 } };
  }
});

// ============================================================================
// [8] PARTICLE SYSTEMS - パーティクル更新
// ============================================================================
const ParticleSys = Object.freeze({
  updateParticle: p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.25, life: p.life - 1 }),
  updatePopup: p => ({ ...p, y: p.y + p.vy, life: p.life - 1 }),
  updateNearMiss: e => ({ ...e, life: e.life - 1, scale: e.scale + 0.1 }),
  updateCloud: (c, speed) => ({ ...c, x: c.x - c.speed * (1 + speed * 0.1) }),
  updateAndFilter: (items, fn, pred = i => i.life > 0) => items.map(fn).filter(pred),
  updateClouds: (clouds, speed, max = 8) => { let u = clouds.map(c => ParticleSys.updateCloud(c, speed)).filter(c => c.x > -c.size); if (u.length < max && MathUtils.randomBool(0.02)) u.push(EntityFactory.createCloud()); return u; }
});

// ============================================================================
// [9] AUDIO SYSTEM - 音声システム（Singleton）
// ============================================================================
const Audio = (() => {
  let ctx = null, bgmIv = null;
  const sounds = { jump: { freq: 440, type: 'square', dur: 0.1, gain: 0.15 }, score: { freq: 880, type: 'sine', dur: 0.15, gain: 0.12 }, hit: { freq: 220, type: 'sawtooth', dur: 0.2, gain: 0.15 }, death: { freq: 150, type: 'sawtooth', dur: 0.4, gain: 0.2, sweep: 50 }, enemyKill: { freq: 660, type: 'square', dur: 0.12, gain: 0.1 }, rampChange: { freq: 330, type: 'triangle', dur: 0.08, gain: 0.08 }, countdown: { freq: 440, type: 'square', dur: 0.15, gain: 0.12 }, countdownGo: { freq: 880, type: 'square', dur: 0.3, gain: 0.15 }, nearMiss: { freq: 1200, type: 'sine', dur: 0.08, gain: 0.1 } };
  const melodies = {
    clear: [[523,.15],[587,.15],[659,.15],[698,.15],[784,.2],[0,.1],[784,.15],[880,.15],[988,.15],[1047,.4],[0,.1],[1047,.15],[988,.15],[1047,.5]],
    gameOver: [[494,.25],[466,.25],[440,.25],[392,.35],[0,.15],[330,.2],[294,.2],[262,.3],[0,.1],[196,.15],[0,.05],[196,.15],[0,.1],[131,.6]],
    gameOverScreen: [[262,.4],[247,.4],[220,.4],[196,.6],[0,.2],[131,.3],[165,.3],[131,.8]],
    title: [[523,.12],[0,.03],[523,.12],[0,.1],[523,.12],[0,.1],[415,.12],[523,.25],[0,.1],[659,.35]],
    start: [[523,.1],[659,.1],[784,.1],[1047,.2]],
    rankReveal: [[392,.1],[0,.05],[494,.1],[0,.05],[587,.1],[0,.05],[784,.3]]
  };
  const bgm = [[131,.12],[0,.13],[165,.12],[0,.13],[196,.12],[0,.13],[165,.12],[0,.13]];
  const getCtx = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; };
  const playNote = (c, freq, type, dur, gain, t) => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = type; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9); o.start(t); o.stop(t + dur); };
  return Object.freeze({
    init: getCtx,
    play: type => { try { const c = getCtx(), s = sounds[type] || sounds.hit, o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = s.type; o.frequency.setValueAtTime(s.freq, c.currentTime); if (s.sweep) o.frequency.exponentialRampToValueAtTime(s.sweep, c.currentTime + s.dur); g.gain.setValueAtTime(s.gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + s.dur); o.start(c.currentTime); o.stop(c.currentTime + s.dur); } catch(e){} },
    playMelody: name => { try { const c = getCtx(), m = melodies[name]; if (!m) return; let t = c.currentTime; m.forEach(([n, d]) => { if (n > 0) playNote(c, n, 'square', d, 0.12, t); t += d; }); } catch(e){} },
    playCombo: lv => { try { const c = getCtx(), f = 440 + lv * 100; [0, 0.08].forEach((d, i) => playNote(c, f + i * 200, 'square', 0.12, 0.1, c.currentTime + d)); } catch(e){} },
    startBGM: () => { try { const c = getCtx(); Audio.stopBGM(); const beat = () => { let t = c.currentTime; bgm.forEach(([n, d]) => { if (n > 0) playNote(c, n, 'triangle', d, 0.05, t); t += d; }); }; beat(); bgmIv = setInterval(beat, 1000); } catch(e){} },
    stopBGM: () => { if (bgmIv) { clearInterval(bgmIv); bgmIv = null; } }
  });
})();

// ============================================================================
// [10] COLLISION HANDLERS - 衝突ハンドラ（Strategy Pattern）
// ============================================================================
const createCollisionHandlers = (rank, cb, godMode) => {
  const { onDie, onScore, onEffect, onEnemyKill, onBounce } = cb;
  const die = godMode ? FnUtils.identity : onDie, bounce = godMode ? FnUtils.identity : onBounce;
  const handleEnemy = (col, obs, ox, px) => { if (!col.hit) return false; if (rank === SpeedRank.HIGH) return (die('enemy'), true); if (rank === SpeedRank.MID) { obs.t = ObstacleType.DEAD; onEnemyKill(ox); return 'slow'; } bounce(px < ox ? -5 : 5); return false; };
  return {
    [ObstacleType.HOLE_S]: col => col.ground && rank === SpeedRank.LOW ? (die('fall'), true) : false,
    [ObstacleType.HOLE_L]: col => col.ground ? (die('fall'), true) : false,
    [ObstacleType.ROCK]: col => col.hit ? (die('rock'), true) : false,
    [ObstacleType.ENEMY]: handleEnemy, [ObstacleType.ENEMY_V]: handleEnemy,
    [ObstacleType.SCORE]: (col, obs, ox) => col.hit ? (obs.t = ObstacleType.TAKEN, onScore(ox), false) : false,
    [ObstacleType.REVERSE]: (col, obs) => col.hit ? (obs.t = ObstacleType.TAKEN, onEffect('reverse'), false) : false,
    [ObstacleType.FORCE_JUMP]: (col, obs) => col.hit ? (obs.t = ObstacleType.TAKEN, onEffect('forceJ'), false) : false
  };
};

// ============================================================================
// [11] REACT COMPONENTS - SVG Renderers
// ============================================================================
const CloudRenderer = ({ clouds }) => <g>{clouds.map((c, i) => <g key={i} opacity={c.opacity}><ellipse cx={c.x} cy={c.y} rx={c.size} ry={c.size * 0.5} fill="#fff" /><ellipse cx={c.x - c.size * 0.4} cy={c.y + 5} rx={c.size * 0.6} ry={c.size * 0.35} fill="#fff" /><ellipse cx={c.x + c.size * 0.4} cy={c.y + 3} rx={c.size * 0.5} ry={c.size * 0.3} fill="#fff" /></g>)}</g>;

const BuildingRenderer = ({ buildings, camY }) => <g>{buildings.map((b, i) => { const by = Config.screen.height - b.height + (camY * 0.1) % 50; return <g key={i}><rect x={b.x} y={by} width={b.width} height={b.height + 100} fill={b.color} />{Array.from({ length: b.windows }, (_, wi) => Array.from({ length: Math.floor(b.width / 12) }, (_, wj) => <rect key={`${wi}-${wj}`} x={b.x + 4 + wj * 12} y={by + 10 + wi * 25} width={6} height={12} fill={MathUtils.randomBool(0.7) ? '#ffee88' : '#334'} opacity={0.8} />))}</g>; })}</g>;

const ObstacleRenderers = {
  [ObstacleType.HOLE_S]: ({ ox, oy }) => <g><ellipse cx={ox} cy={oy + 2} rx="28" ry="8" fill="#000" /><ellipse cx={ox} cy={oy} rx="26" ry="7" fill="none" stroke="#ff6666" strokeWidth="2" strokeDasharray="4,2" /></g>,
  [ObstacleType.HOLE_L]: ({ ox, oy }) => <g><ellipse cx={ox} cy={oy + 2} rx="50" ry="10" fill="#000" /><ellipse cx={ox} cy={oy} rx="48" ry="9" fill="none" stroke="#ff2222" strokeWidth="3" /><text x={ox} y={oy + 4} textAnchor="middle" fill="#ff4444" fontSize="8" fontWeight="bold">DANGER</text></g>,
  [ObstacleType.ROCK]: ({ ox, oy }) => <g><polygon points={`${ox},${oy - 22} ${ox + 16},${oy + 4} ${ox - 16},${oy + 4}`} fill="#445" stroke="#778" strokeWidth="2" /><line x1={ox - 8} y1={oy - 8} x2={ox + 8} y2={oy + 2} stroke="#ff4444" strokeWidth="2" /><line x1={ox + 8} y1={oy - 8} x2={ox - 8} y2={oy + 2} stroke="#ff4444" strokeWidth="2" /></g>,
  [ObstacleType.ENEMY]: ({ ox, oy, frame, obs }) => { const b = Math.sin(frame * 0.15 + obs.phase) * 2, w = Math.sin(frame * 0.05 + (obs.walkPos || 0)) * 25 * (obs.moveDir || 1); return <g transform={`translate(${w}, ${b})`}><ellipse cx={ox} cy={oy - 8} rx="16" ry="14" fill="#ee4444" stroke="#ffaaaa" strokeWidth="2" /><circle cx={ox - 5} cy={oy - 11} r="4" fill="#fff" /><circle cx={ox + 5} cy={oy - 11} r="4" fill="#fff" /><circle cx={ox - 4} cy={oy - 10} r="2" fill="#222" /><circle cx={ox + 6} cy={oy - 10} r="2" fill="#222" /></g>; },
  [ObstacleType.ENEMY_V]: ({ ox, oy, frame, obs }) => { const v = Math.sin(frame * (obs.vSpeed || 0.1)) * 20, wing = Math.sin(frame * 0.4) * 10; return <g transform={`translate(0, ${v})`}><ellipse cx={ox} cy={oy - 12} rx="14" ry="12" fill="#8844ee" stroke="#bbaaff" strokeWidth="2" /><polygon points={`${ox - 20},${oy - 12} ${ox - 8},${oy - 8} ${ox - 8},${oy - 16}`} fill="#6622cc" transform={`rotate(${wing}, ${ox - 8}, ${oy - 12})`} /><polygon points={`${ox + 20},${oy - 12} ${ox + 8},${oy - 8} ${ox + 8},${oy - 16}`} fill="#6622cc" transform={`rotate(${-wing}, ${ox + 8}, ${oy - 12})`} /><circle cx={ox - 4} cy={oy - 14} r="3" fill="#fff" /><circle cx={ox + 4} cy={oy - 14} r="3" fill="#fff" /></g>; },
  [ObstacleType.SCORE]: ({ ox, oy, frame }) => { const p = 1 + Math.sin(frame * 0.2) * 0.12; return <g transform={`translate(${ox}, ${oy - 10}) scale(${p})`}><circle cx={0} cy={0} r="12" fill="#ffcc00" stroke="#fff" strokeWidth="2" /><text x={0} y={5} textAnchor="middle" fill="#885500" fontSize="14" fontWeight="bold">$</text></g>; },
  [ObstacleType.REVERSE]: ({ ox, oy }) => <g><rect x={ox - 11} y={oy - 22} width="22" height="22" fill="#9944ff" stroke="#ddaaff" strokeWidth="2" rx="4" /><text x={ox} y={oy - 7} textAnchor="middle" fill="#fff" fontSize="14">↺</text></g>,
  [ObstacleType.FORCE_JUMP]: ({ ox, oy }) => <g><rect x={ox - 11} y={oy - 22} width="22" height="22" fill="#4499ff" stroke="#aaddff" strokeWidth="2" rx="4" /><text x={ox} y={oy - 6} textAnchor="middle" fill="#fff" fontSize="16">⇡</text></g>
};

const ObstacleRenderer = ({ obs, ox, oy, frame }) => { if (!CollisionDomain.isActive(obs)) return null; const R = ObstacleRenderers[obs.t]; return R ? <R ox={ox} oy={oy} frame={frame} obs={obs} /> : null; };

const RampRenderer = ({ ramp, index, camY, frame, W, H, transitionEffect }) => {
  const ry = index * Config.ramp.height - camY;
  if (!GeometryDomain.isInViewport(ry, Config.ramp.height, Config.screen.height)) return null;
  const geo = GeometryDomain.getRampGeometry(ramp, W, H), { lx, rx, ty, by, midY } = geo, colors = GeometryDomain.getRampColor(index), gradId = `rg${index}`, flash = transitionEffect > 0 ? transitionEffect * 0.3 : 0;
  const pts = ramp.type === RampType.V_SHAPE ? `${lx},${ry + ty} ${(lx + rx) / 2},${ry + midY} ${rx},${ry + by} ${rx},${ry + H + 5} ${lx},${ry + H + 5}` : `${lx},${ry + ty} ${rx},${ry + by} ${rx},${ry + H + 5} ${lx},${ry + H + 5}`;
  const line = ramp.type === RampType.V_SHAPE ? `M${lx},${ry + ty} L${(lx + rx) / 2},${ry + midY} L${rx},${ry + by}` : `M${lx},${ry + ty} L${rx},${ry + by}`;
  return <g><defs><linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={ramp.isGoal ? '#22ff88' : colors.base[0]} /><stop offset="100%" stopColor={ramp.isGoal ? '#118844' : colors.base[1]} /></linearGradient></defs><polygon points={pts} fill={`url(#${gradId})`} />{flash > 0 && <polygon points={pts} fill="#fff" opacity={flash} />}<path d={line} fill="none" stroke={ramp.isGoal ? '#88ffbb' : colors.stroke} strokeWidth="3" />{ramp.obs.map((o, i) => { const ox = GeometryDomain.getObstacleX(o, ramp, W), oy = ry + GeometryDomain.getSlopeY(ox, geo, ramp.type); return <ObstacleRenderer key={i} obs={o} ox={ox} oy={oy} frame={frame} />; })}{ramp.isGoal && <g><rect x={W / 2 - 50} y={ry + H / 2 - 15} width="100" height="30" fill="rgba(0,255,100,0.4)" rx="6" stroke="#fff" strokeWidth="2" /><text x={W / 2} y={ry + H / 2 + 6} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">GOAL</text></g>}</g>;
};

const PlayerRenderer = ({ player, ramp, camY, speed, death, W, H, jetParticles, dangerLevel }) => {
  if (!ramp) return null;
  const { width: PW, height: PH } = Config.player, ry = player.ramp * Config.ramp.height - camY, geo = GeometryDomain.getRampGeometry(ramp, W, H), slopeY = GeometryDomain.getSlopeY(player.x, geo, ramp.type), py = ry + slopeY + player.y - PH, px = player.x, col = SpeedDomain.getColor(speed);
  if (death) { const { frame: df, fast, type } = death, dy = type === 'fall' ? df * 10 : -df * 4, rot = df * (fast ? 35 : 12), sc = Math.max(0.2, 1 - df * 0.025); return <g transform={`translate(${px}, ${py + PH / 2 + dy}) rotate(${rot}) scale(${sc})`} opacity={Math.max(0, 1 - df * 0.025)}><rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} fill="#ff4444" rx="4" /></g>; }
  const tilt = ramp.dir * 15 + player.vx * 3, jet = SpeedDomain.getNormalized(speed), scared = dangerLevel > 0.7;
  return <g transform={`translate(${px}, ${py + PH / 2}) rotate(${tilt})`}>{speed > 4 && <><ellipse cx={-ramp.dir * 18} cy={6} rx={8 + jet * 25} ry={3 + jet * 3} fill="url(#jetGrad)" /><ellipse cx={-ramp.dir * 14} cy={6} rx={4 + jet * 8} ry={2} fill="#fff" opacity={0.8} />{jetParticles.map((p, i) => <circle key={i} cx={p.x - px} cy={p.y - (py + PH / 2)} r={2} fill={p.color} opacity={p.life / 25} />)}</>}{speed > 8 && <g opacity={0.5}>{[0, 1, 2].map(i => <line key={i} x1={-ramp.dir * (30 + i * 15)} y1={-5 + i * 5} x2={-ramp.dir * (50 + i * 15 + speed * 2)} y2={-5 + i * 5} stroke={col} strokeWidth={2 - i * 0.5} />)}</g>}<rect x={-PW / 2} y={-PH / 2} width={PW} height={PH * 0.65} fill={col} stroke="#fff" strokeWidth="1.5" rx="4" /><rect x={-PW / 2 + 3} y={-PH / 2 + 3} width={PW - 6} height={PH * 0.2} fill="rgba(255,255,255,0.35)" rx="2" /><g transform={`scale(${scared ? 1.3 : 1})`}><circle cx={-4} cy={-PH / 4 + 1} r="3.5" fill="#fff" /><circle cx={5} cy={-PH / 4 + 1} r="3.5" fill="#fff" /><circle cx={scared ? -5 : -3.5} cy={-PH / 4 + 2} r="1.5" fill="#222" /><circle cx={scared ? 3 : 5.5} cy={-PH / 4 + 2} r="1.5" fill="#222" /></g>{scared && <ellipse cx={0} cy={-PH / 4 + 8} rx="3" ry="2" fill="#222" />}<rect x={-PW / 2 - 2} y={PH * 0.15} width={PW + 4} height="7" fill="#333" rx="2" /><circle cx={-7} cy={PH * 0.25} r="5" fill="#222" stroke="#555" strokeWidth="1.5" /><circle cx={7} cy={PH * 0.25} r="5" fill="#222" stroke="#555" strokeWidth="1.5" /></g>;
};

const ParticlesRenderer = ({ particles }) => <>{particles.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={p.color} opacity={p.life / Config.particle.lifetime} />)}</>;
const ScorePopupsRenderer = ({ popups }) => <>{popups.map((p, i) => <text key={i} x={p.x} y={p.y} textAnchor="middle" fill={p.color} fontSize="14" fontWeight="bold" opacity={p.life / 60}>{p.text}</text>)}</>;
const NearMissRenderer = ({ effects }) => <>{effects.map((e, i) => <g key={i} opacity={e.life / 30}><circle cx={e.x} cy={e.y} r={20 * e.scale} fill="none" stroke="#44ffaa" strokeWidth="3" /><text x={e.x} y={e.y - 30} textAnchor="middle" fill="#44ffaa" fontSize="12" fontWeight="bold">NEAR MISS!</text></g>)}</>;

// ============================================================================
// [12] UI COMPONENTS
// ============================================================================
const DangerVignette = ({ level }) => level < 0.3 ? null : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 50%, rgba(255,0,0,${(level - 0.3) * 0.5}) 100%)`, pointerEvents: 'none', zIndex: 20 }} />;
const ComboDisplay = ({ combo, timer }) => combo <= 1 || timer <= 0 ? null : <div style={{ position: 'absolute', top: 70, left: '50%', transform: `translateX(-50%) scale(${1 + Math.sin(timer * 0.2) * 0.1})`, color: ['#fff', '#ffcc00', '#ff8800', '#ff4400', '#ff00ff'][Math.min(combo - 1, 4)], fontSize: 20, fontWeight: 'bold', textShadow: '0 0 10px currentColor' }}>{combo}x COMBO!</div>;
const StageIndicator = ({ rampIndex, total }) => { const p = rampIndex / total, cfg = p < 0.33 ? { z: 'ZONE 1', c: '#44aaff' } : p < 0.66 ? { z: 'ZONE 2', c: '#ffaa44' } : { z: 'FINAL ZONE', c: '#ff4444' }; return <div style={{ position: 'absolute', top: 50, left: 10, color: cfg.c, fontSize: 10, fontWeight: 'bold', opacity: 0.8 }}>{cfg.z}</div>; };
const SpeedMeter = ({ speed }) => { const col = SpeedDomain.getColor(speed), pct = SpeedDomain.getNormalized(speed) * 100; return <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#aaa', fontSize: 10 }}>SPEED</span><div style={{ width: 60, height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, #00aa44, ${col})`, transition: 'all 0.1s' }} /></div></div>; };
const ProgressBar = ({ current, total }) => <div style={{ position: 'absolute', bottom: 12, left: 10, width: 90, height: 6, background: '#222', borderRadius: 3 }}><div style={{ width: `${(current / total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #00ddff, #44ffaa)', borderRadius: 3 }} /></div>;

const UIOverlay = ({ score, speed, player, effect, total, speedBonus, combo, comboTimer, nearMissCount }) => <>
  <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontSize: 15, fontWeight: 'bold', textShadow: '0 0 8px #000' }}>SCORE: {score}</div>
  {speedBonus > 0 && <div style={{ position: 'absolute', top: 28, left: 10, color: '#ffaa00', fontSize: 11 }}>SPEED BONUS: +{speedBonus}</div>}
  {nearMissCount > 0 && <div style={{ position: 'absolute', top: 42, left: 10, color: '#44ffaa', fontSize: 10 }}>NEAR MISS: x{nearMissCount}</div>}
  <ComboDisplay combo={combo} timer={comboTimer} /><StageIndicator rampIndex={player.ramp} total={total} /><SpeedMeter speed={speed} />
  <div style={{ position: 'absolute', top: 32, right: 10, color: '#888', fontSize: 11 }}>{player.ramp + 1} / {total}</div>
  <ProgressBar current={player.ramp} total={total} />
  {effect.type && <div style={{ position: 'absolute', top: 65, right: 10, padding: '3px 8px', background: effect.type === 'reverse' ? 'rgba(150,50,255,0.85)' : 'rgba(50,130,255,0.85)', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{effect.type === 'reverse' ? '↺ REVERSE!' : '⇡ AUTO-JUMP!'}</div>}
</>;

const CountdownOverlay = ({ count }) => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 30 }}><div style={{ fontSize: 80, color: count === 0 ? '#44ffaa' : '#fff', fontWeight: 'bold', textShadow: `0 0 30px ${count === 0 ? '#44ffaa' : '#00eeff'}` }}>{count === 0 ? 'GO!' : count}</div></div>;
const RankDisplay = ({ score, frame }) => { const r = ScoringDomain.getRankData(score), p = 1 + Math.sin(frame * 0.1) * 0.05; return <div style={{ marginBottom: 15, textAlign: 'center' }}><div style={{ fontSize: 14, color: '#aaa', marginBottom: 5 }}>{r.message}</div><div style={{ fontSize: 64, fontWeight: 'bold', color: r.color, textShadow: `0 0 20px ${r.color}`, transform: `scale(${p})` }}>{r.rank}</div></div>; };

const ScreenOverlay = ({ type, score, hiScore, reachedRamp, totalRamps, isNewHighScore, clearAnim, isMobile }) => {
  const frame = clearAnim?.frame || 0, phase = clearAnim?.phase || 0;
  const base = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30 };
  const style = bg => ({ ...base, background: bg });
  if (type === GameState.TITLE) return <div style={style('radial-gradient(ellipse at center, rgba(20,40,80,0.95) 0%, rgba(5,5,20,0.99) 100%)')}><div style={{ fontSize: isMobile ? 24 : 28, color: '#00eeff', textShadow: '0 0 25px #00eeff', marginBottom: 6, fontWeight: 'bold', letterSpacing: 3 }}>NON-BRAKE</div><div style={{ fontSize: isMobile ? 20 : 24, color: '#00eeff', textShadow: '0 0 25px #00eeff', marginBottom: 20, fontWeight: 'bold', letterSpacing: 3 }}>DESCENT</div><div style={{ fontSize: isMobile ? 11 : 13, color: '#99bbdd', marginBottom: 25 }}>「止まるために、走り続けろ。」</div>{!isMobile && <div style={{ background: 'rgba(0,150,200,0.12)', padding: '12px 20px', borderRadius: 8, border: '1px solid rgba(0,200,255,0.25)', marginBottom: 20, fontSize: 12, color: '#aaccdd' }}>← → 移動 / Z 加速 / X ジャンプ</div>}{!isMobile && <div style={{ fontSize: 16, color: '#44ffaa' }}>PRESS SPACE</div>}{hiScore > 0 && <div style={{ marginTop: 15, color: '#ffdd44', fontSize: 14 }}>HIGH SCORE: {hiScore}</div>}</div>;
  if (type === GameState.OVER) return <div style={style('radial-gradient(ellipse at center, rgba(80,20,20,0.95) 0%, rgba(10,0,0,0.99) 100%)')}><div style={{ fontSize: isMobile ? 28 : 32, color: '#ff4444', textShadow: '0 0 25px #ff4444', marginBottom: 15, fontWeight: 'bold' }}>GAME OVER</div><div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>STAGE: {reachedRamp} / {totalRamps}</div><RankDisplay score={score} frame={frame} /><div style={{ fontSize: 20, color: '#fff', marginBottom: 12 }}>SCORE: {score}</div>{isNewHighScore ? <div style={{ fontSize: 18, color: `hsl(${(frame * 5) % 360}, 100%, 60%)`, marginBottom: 20, textShadow: '0 0 20px currentColor', fontWeight: 'bold' }}>★ NEW HIGH SCORE! ★</div> : <div style={{ fontSize: 14, color: '#ffdd44', marginBottom: 20 }}>HIGH SCORE: {hiScore}</div>}{!isMobile && <><div style={{ fontSize: 14, color: '#44ffaa', marginBottom: 8 }}>SPACE: リトライ</div><div style={{ fontSize: 12, color: '#888' }}>T: タイトルへ</div></>}</div>;
  if (type === GameState.CLEAR) { if (phase === 1) return <div style={{ ...style('linear-gradient(180deg, rgba(20,80,50,0.3) 0%, rgba(0,30,15,0.5) 100%)'), justifyContent: 'flex-start' }}><svg width="100%" height="100%" viewBox="0 0 400 700" style={{ position: 'absolute', top: 0, left: 0 }}>{Array.from({ length: 15 }, (_, i) => <line key={i} x1={400} y1={50 + i * 40} x2={400 - frame * 20 - i * 25} y2={50 + i * 40} stroke={`rgba(0, 255, 150, ${0.4 - i * 0.02})`} strokeWidth="3" />)}<g transform={`translate(${200 + frame * 10}, ${300 + Math.sin(frame * 0.5) * 5})`}><ellipse cx={-frame * 3} cy={0} rx={Math.min(frame * 4, 100)} ry={5} fill="#00ff88" opacity="0.6" /><rect x={-12} y={-15} width={24} height={20} fill="#00ff88" stroke="#fff" strokeWidth="2" rx="4" /><circle cx={-4} cy={-8} r="3" fill="#fff" /><circle cx={6} cy={-8} r="3" fill="#fff" /></g></svg><div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', fontSize: 28, color: '#44ffaa', textShadow: '0 0 30px #44ffaa', fontWeight: 'bold', opacity: Math.min(1, frame / 20) }}>ESCAPE SUCCESS!</div></div>; return <div style={style('radial-gradient(ellipse at center, rgba(20,80,50,0.95) 0%, rgba(0,10,5,0.99) 100%)')}><div style={{ fontSize: 32, color: '#44ffaa', textShadow: '0 0 30px #44ffaa', marginBottom: 15, fontWeight: 'bold' }}>★ ESCAPE SUCCESS! ★</div><RankDisplay score={score} frame={frame} /><div style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>FINAL SCORE</div><div style={{ fontSize: 36, color: '#fff', marginBottom: 15, textShadow: '0 0 20px #44ffaa' }}>{score}</div>{isNewHighScore ? <div style={{ fontSize: 18, color: `hsl(${(frame * 5) % 360}, 100%, 60%)`, marginBottom: 20, fontWeight: 'bold' }}>★ NEW HIGH SCORE! ★</div> : <div style={{ fontSize: 14, color: '#ffdd44', marginBottom: 20 }}>HIGH SCORE: {hiScore}</div>}{!isMobile && <><div style={{ fontSize: 14, color: '#44ffaa', marginBottom: 8 }}>SPACE: もう一度プレイ</div><div style={{ fontSize: 12, color: '#888' }}>T: タイトルへ</div></>}</div>; }
  return null;
};

const TouchButton = ({ onTouchStart, onTouchEnd, style, children }) => <button onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseDown={onTouchStart} onMouseUp={onTouchEnd} onMouseLeave={onTouchEnd} style={style}>{children}</button>;
const MobileControls = ({ touchKeys, onTouch }) => { const base = (a, c) => ({ width: 65, height: 65, borderRadius: 12, background: a ? '#00aaff' : `linear-gradient(180deg, ${c.bg} 0%, #222 100%)`, border: `2px solid ${c.border}`, color: '#fff', fontSize: 24, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'pointer' }); return <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 400, marginTop: 10, padding: '0 10px', boxSizing: 'border-box' }}><div style={{ display: 'flex', gap: 8 }}><TouchButton onTouchStart={onTouch('left', true)} onTouchEnd={onTouch('left', false)} style={base(touchKeys.current.left, { bg: '#334', border: '#556' })}>◀</TouchButton><TouchButton onTouchStart={onTouch('right', true)} onTouchEnd={onTouch('right', false)} style={base(touchKeys.current.right, { bg: '#334', border: '#556' })}>▶</TouchButton></div><div style={{ display: 'flex', gap: 8 }}><TouchButton onTouchStart={onTouch('jump', true)} onTouchEnd={onTouch('jump', false)} style={{ ...base(touchKeys.current.jump, { bg: '#363', border: '#4a4' }), borderRadius: '50%', fontSize: 12 }}>JUMP</TouchButton><TouchButton onTouchStart={onTouch('accel', true)} onTouchEnd={onTouch('accel', false)} style={{ ...base(touchKeys.current.accel, { bg: '#643', border: '#a64' }), borderRadius: '50%', fontSize: 11 }}>ACCEL</TouchButton></div></div>; };

// ============================================================================
// [13] CUSTOM HOOKS
// ============================================================================
const useIsMobile = () => { const [m, setM] = useState(false); useEffect(() => { const c = () => setM('ontouchstart' in window || navigator.maxTouchPoints > 0); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c); }, []); return m; };
const useCheatCode = (code, fn) => { const buf = useRef(''); return useCallback(k => { if (k.length !== 1) return; buf.current = (buf.current + k.toLowerCase()).slice(-code.length); if (buf.current === code) { fn(); buf.current = ''; } }, [code, fn]); };

// ============================================================================
// [14] MAIN GAME COMPONENT
// ============================================================================
export default function Game() {
  const { width: W, height: H } = Config.screen, { total: TOTAL, height: RAMP_H } = Config.ramp, { min: MIN_SPD } = Config.speed;
  const [state, setState] = useState(GameState.TITLE), [countdown, setCountdown] = useState(3), [player, setPlayer] = useState(EntityFactory.createPlayer), [speed, setSpeed] = useState(MIN_SPD), [camY, setCamY] = useState(0), [ramps, setRamps] = useState([]), [score, setScore] = useState(0), [hiScore, setHiScore] = useState(0), [lastRamp, setLastRamp] = useState(0), [speedBonus, setSpeedBonus] = useState(0), [startTime, setStartTime] = useState(0), [effect, setEffect] = useState({ type: null, timer: 0 }), [death, setDeath] = useState(null), [shake, setShake] = useState(0), [particles, setParticles] = useState([]), [jetParticles, setJetParticles] = useState([]), [scorePopups, setScorePopups] = useState([]), [nearMissEffects, setNearMissEffects] = useState([]), [nearMissCount, setNearMissCount] = useState(0), [clearAnim, setClearAnim] = useState({ phase: 0, frame: 0 }), [isNewHighScore, setIsNewHighScore] = useState(false), [godMode, setGodMode] = useState(false), [combo, setCombo] = useState(0), [comboTimer, setComboTimer] = useState(0), [transitionEffect, setTransitionEffect] = useState(0), [clouds, setClouds] = useState([]), [buildings] = useState(BackgroundGen.initBuildings), [dangerLevel, setDangerLevel] = useState(0);
  const frameRef = useRef(0), keys = useRef({}), touchKeys = useRef({ left: false, right: false, accel: false, jump: false }), passedObs = useRef(new Set());
  const isMobile = useIsMobile(), handleCheat = useCheatCode('jinjinjin', () => { setGodMode(g => { Audio.init(); Audio.play(!g ? 'score' : 'death'); return !g; }); });
  const addParticles = useCallback((x, y, color, count) => setParticles(p => [...p, ...EntityFactory.createParticles(x, y, color, count)]), []);
  const addScorePopup = useCallback((x, y, text, color) => setScorePopups(p => [...p, EntityFactory.createScorePopup(x, y, text, color)]), []);
  const resetGameState = useCallback(() => { setPlayer(EntityFactory.createPlayer()); setSpeed(MIN_SPD); setCamY(0); setScore(0); setLastRamp(0); setSpeedBonus(0); setStartTime(Date.now()); setEffect({ type: null, timer: 0 }); setDeath(null); setParticles([]); setJetParticles([]); setScorePopups([]); setNearMissEffects([]); setNearMissCount(0); setClearAnim({ phase: 0, frame: 0 }); setIsNewHighScore(false); setCombo(0); setComboTimer(0); setTransitionEffect(0); setDangerLevel(0); setClouds(BackgroundGen.initClouds()); passedObs.current = new Set(); frameRef.current = 0; }, [MIN_SPD]);
  const startCountdown = useCallback(() => { Audio.init(); setRamps(RampGen.generate(TOTAL)); resetGameState(); setCountdown(3); setState(GameState.COUNTDOWN); Audio.playMelody('start'); }, [TOTAL, resetGameState]);
  const startGame = useCallback(() => { setState(GameState.PLAY); setStartTime(Date.now()); Audio.startBGM(); }, []);
  const goToTitle = useCallback(() => { setState(GameState.TITLE); setClearAnim({ phase: 0, frame: 0 }); setIsNewHighScore(false); Audio.stopBGM(); Audio.playMelody('title'); }, []);
  const updateHighScore = useCallback(s => { if (s > hiScore) { setHiScore(s); setIsNewHighScore(true); } }, [hiScore]);
  const handleDeath = useCallback(type => { Audio.stopBGM(); Audio.playMelody('gameOver'); const rank = SpeedDomain.getRank(speed), final = ScoringDomain.calcFinal(score, speedBonus); setScore(final); updateHighScore(final); setDeath({ type, frame: 0, fast: rank === SpeedRank.HIGH }); setShake(rank === SpeedRank.HIGH ? 18 : 6); addParticles(player.x, player.ramp * RAMP_H - camY + 30, '#ff4444', rank === SpeedRank.HIGH ? 15 : 8); setState(GameState.DYING); }, [speed, score, speedBonus, player, camY, RAMP_H, addParticles, updateHighScore]);
  const handleClear = useCallback(() => { Audio.stopBGM(); const elapsed = (Date.now() - startTime) / 1000, timeBonus = ScoringDomain.calcTimeBonus(elapsed), final = ScoringDomain.calcFinal(score, speedBonus, timeBonus); setScore(final); updateHighScore(final); setClearAnim({ phase: 1, frame: 0 }); setState(GameState.CLEAR); Audio.playMelody('clear'); }, [score, speedBonus, startTime, updateHighScore]);
  const handleTouch = useCallback((k, v) => e => { e.preventDefault(); touchKeys.current[k] = v; }, []);
  const handleTap = useCallback(() => { if (state === GameState.TITLE || state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2)) startCountdown(); }, [state, clearAnim.phase, startCountdown]);

  useEffect(() => { if (state !== GameState.COUNTDOWN) return; const iv = setInterval(() => setCountdown(c => { if (c <= 1) { Audio.play('countdownGo'); startGame(); return 0; } Audio.play('countdown'); return c - 1; }), Config.animation.countdownInterval); return () => clearInterval(iv); }, [state, startGame]);
  useEffect(() => { if (state !== GameState.DYING) return; const iv = setInterval(() => { setDeath(d => { if (d.frame >= Config.animation.deathFrames) { setState(GameState.OVER); setTimeout(() => { Audio.playMelody('gameOverScreen'); Audio.playMelody('rankReveal'); }, 300); return d; } return { ...d, frame: d.frame + 1 }; }); setShake(s => Math.max(0, s * 0.88)); }, 35); return () => clearInterval(iv); }, [state]);
  useEffect(() => { if (state !== GameState.CLEAR) return; const iv = setInterval(() => setClearAnim(a => { if (a.phase === 1 && a.frame >= Config.animation.clearPhase1Frames) { Audio.playMelody('rankReveal'); return { phase: 2, frame: 0 }; } return { ...a, frame: a.frame + 1 }; }), 30); return () => clearInterval(iv); }, [state]);
  useEffect(() => { const down = e => { keys.current[e.code] = true; if (state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2)) { if (e.code === 'Space') startCountdown(); else if (e.code === 'Escape' || e.code === 'KeyT') goToTitle(); } else if (state === GameState.TITLE) { if (e.code === 'Space') startCountdown(); handleCheat(e.key); } e.preventDefault(); }, up = e => { keys.current[e.code] = false; }; window.addEventListener('keydown', down); window.addEventListener('keyup', up); return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }; }, [state, clearAnim.phase, startCountdown, goToTitle, handleCheat]);
  useEffect(() => { if (state === GameState.TITLE) { const t = setTimeout(() => Audio.playMelody('title'), 500); return () => clearTimeout(t); } }, [state]);

  useEffect(() => {
    if (state !== GameState.PLAY) return;
    const loop = setInterval(() => {
      frameRef.current++;
      const k = keys.current, tk = touchKeys.current, rev = effect.type === 'reverse';
      const input = { left: rev ? (k.ArrowRight || tk.right) : (k.ArrowLeft || tk.left), right: rev ? (k.ArrowLeft || tk.left) : (k.ArrowRight || tk.right), accel: k.KeyZ || tk.accel, jump: k.KeyX || tk.jump };
      setEffect(e => e.timer <= 0 ? { type: null, timer: 0 } : { ...e, timer: e.timer - 1 });
      setSpeed(s => SpeedDomain.accelerate(s, input.accel));
      setParticles(p => ParticleSys.updateAndFilter(p, ParticleSys.updateParticle));
      setScorePopups(p => ParticleSys.updateAndFilter(p, ParticleSys.updatePopup));
      setNearMissEffects(e => ParticleSys.updateAndFilter(e, ParticleSys.updateNearMiss));
      setComboTimer(ComboDomain.tick);
      setTransitionEffect(t => Math.max(0, t - 0.1));
      setClouds(c => ParticleSys.updateClouds(c, speed));
      setJetParticles(prev => { let u = ParticleSys.updateAndFilter(prev, ParticleSys.updateParticle); if (speed > 5 && frameRef.current % 2 === 0) { const ramp = ramps[player.ramp]; if (ramp) { const geo = GeometryDomain.getRampGeometry(ramp, W, RAMP_H), slopeY = GeometryDomain.getSlopeY(player.x, geo, ramp.type); u.push(EntityFactory.createJetParticle(player.x, player.ramp * RAMP_H - camY + slopeY, ramp.dir)); } } return u; });
      const currentRamp = ramps[player.ramp]; if (currentRamp) setDangerLevel(DangerDomain.calcLevel(currentRamp.obs, player.x, currentRamp.dir, speed, W));
      setPlayer(p => { const ramp = ramps[p.ramp]; if (!ramp) return p; let u = Physics.applyMovement(p, input, speed, ramp.dir); const jr = Physics.applyJump(u, input, effect.type, effect.timer); u = jr.player; if (jr.didJump) Audio.play('jump'); const tr = Physics.checkTransition(u, ramps, W); if (tr.isGoal) { handleClear(); return p; } if (tr.transitioned) { Audio.play('rampChange'); if (tr.player.ramp > lastRamp) { setLastRamp(tr.player.ramp); const sr = ScoringDomain.calcRampScore(speed, comboTimer > 0 ? combo : 0); if (ComboDomain.shouldActivate(speed)) { const cr = ComboDomain.increment(combo, comboTimer); setCombo(cr.combo); setComboTimer(cr.timer); if (cr.combo > 1) { const cs = ScoringDomain.calcRampScore(speed, cr.combo); setScore(s => s + cs.base + cs.bonus); Audio.playCombo(cr.combo); addScorePopup(W / 2, 120, `+${cs.base + cs.bonus} (${cr.combo}x)`, '#ffaa00'); } else setScore(s => s + sr.base); } else { const r = ComboDomain.reset(); setCombo(r.combo); setComboTimer(r.timer); setScore(s => s + sr.base); } setSpeedBonus(b => b + SpeedDomain.getBonus(speed)); setTransitionEffect(1); } return tr.player; } return u; });
      setPlayer(p => { const ramp = ramps[p.ramp]; if (!ramp) return p; const handlers = createCollisionHandlers(SpeedDomain.getRank(speed), { onDie: handleDeath, onScore: ox => { Audio.play('score'); setScore(s => s + Config.score.item); addParticles(ox, p.ramp * RAMP_H - camY + 25, '#ffdd00', 6); addScorePopup(ox, p.ramp * RAMP_H - camY, `+${Config.score.item}`, '#ffdd00'); }, onEffect: type => { Audio.play('hit'); setEffect({ type, timer: Config.effect.duration }); }, onEnemyKill: ox => { Audio.play('enemyKill'); setScore(s => s + Config.score.enemy); setSpeed(s => Math.max(MIN_SPD, s - 2)); addParticles(ox, p.ramp * RAMP_H - camY + 25, '#ff8800', 10); addScorePopup(ox, p.ramp * RAMP_H - camY, `+${Config.score.enemy}`, '#ff8800'); }, onBounce: vx => { Audio.play('hit'); setPlayer(prev => ({ ...prev, vx })); } }, godMode); for (const obs of ramp.obs) { if (!CollisionDomain.isActive(obs)) continue; const ox = GeometryDomain.getObstacleX(obs, ramp, W), col = CollisionDomain.check(p.x, ox, p.jumping, p.y), obsId = `${p.ramp}-${obs.pos}`; if (CollisionDomain.isDangerous(obs.t) && col.nearMiss && !passedObs.current.has(obsId)) { passedObs.current.add(obsId); Audio.play('nearMiss'); setNearMissCount(c => c + 1); setScore(s => s + Config.score.nearMiss); setNearMissEffects(prev => [...prev, EntityFactory.createNearMissEffect(ox, p.ramp * RAMP_H - camY + 25)]); addScorePopup(ox, p.ramp * RAMP_H - camY - 20, `NEAR MISS +${Config.score.nearMiss}`, '#44ffaa'); } const h = handlers[obs.t]; if (h) { const r = h(col, obs, ox, p.x); if (r === true) return p; if (r === 'slow') return { ...p, vx: -p.vx * 0.4 }; } } return p; });
      setCamY(cy => MathUtils.lerp(cy, player.ramp * RAMP_H - H / 3, 0.1));
    }, 1000 / 60);
    return () => clearInterval(loop);
  }, [state, speed, effect, ramps, player, camY, W, H, MIN_SPD, RAMP_H, lastRamp, godMode, combo, comboTimer, handleDeath, handleClear, addParticles, addScorePopup]);

  useEffect(() => () => Audio.stopBGM(), []);

  const currentRamp = ramps[player.ramp], shakeOff = shake ? { x: MathUtils.randomRange(-0.5, 0.5) * shake, y: MathUtils.randomRange(-0.5, 0.5) * shake } : { x: 0, y: 0 }, bgColor = currentRamp ? GeometryDomain.getRampColor(player.ramp).bg : '#0a0a1a', isPlaying = state === GameState.PLAY || state === GameState.DYING || state === GameState.COUNTDOWN, showTap = isMobile && (state === GameState.TITLE || state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2));

  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, #050510 0%, #101025 100%)', minHeight: '100vh', padding: isMobile ? 5 : 10, fontFamily: 'monospace', touchAction: 'none', userSelect: 'none' }}><h1 style={{ color: '#00eeff', fontSize: isMobile ? 16 : 18, margin: '5px 0', textShadow: '0 0 15px #00eeff', letterSpacing: 3 }}>NON-BRAKE DESCENT</h1><div onClick={isMobile ? handleTap : undefined} style={{ position: 'relative', width: isMobile ? Math.min(W, window.innerWidth - 10) : W, height: isMobile ? Math.min(H, window.innerHeight - 180) : H, background: `linear-gradient(180deg, ${bgColor} 0%, #0a0a15 100%)`, border: '2px solid #00ccff', borderRadius: 6, overflow: 'hidden', transform: `translate(${shakeOff.x}px, ${shakeOff.y}px)`, boxShadow: '0 0 25px rgba(0,200,255,0.25)' }}><ScreenOverlay type={state} score={score} hiScore={hiScore} reachedRamp={player.ramp + 1} totalRamps={TOTAL} isNewHighScore={isNewHighScore} clearAnim={clearAnim} isMobile={isMobile} />{state === GameState.COUNTDOWN && <CountdownOverlay count={countdown} />}{isPlaying && <><svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 0, left: 0 }}><defs><linearGradient id="jetGrad" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stopColor="#fff" /><stop offset="30%" stopColor="#ffaa00" /><stop offset="100%" stopColor="#ff4400" stopOpacity="0" /></linearGradient></defs><BuildingRenderer buildings={buildings} camY={camY} /><CloudRenderer clouds={clouds} />{ramps.map((r, i) => <RampRenderer key={i} ramp={r} index={i} camY={camY} frame={frameRef.current} W={W} H={RAMP_H} transitionEffect={i === player.ramp ? transitionEffect : 0} />)}<PlayerRenderer player={player} ramp={currentRamp} camY={camY} speed={speed} death={death} W={W} H={RAMP_H} jetParticles={jetParticles} dangerLevel={dangerLevel} /><ParticlesRenderer particles={particles} /><ScorePopupsRenderer popups={scorePopups} /><NearMissRenderer effects={nearMissEffects} /></svg>{state === GameState.PLAY && <><UIOverlay score={score} speed={speed} player={player} effect={effect} total={TOTAL} speedBonus={speedBonus} combo={combo} comboTimer={comboTimer} nearMissCount={nearMissCount} /><DangerVignette level={dangerLevel} /></>}</>}</div>{isMobile && (state === GameState.PLAY || state === GameState.COUNTDOWN) && <MobileControls touchKeys={touchKeys} onTouch={handleTouch} />}{!isMobile && <div style={{ marginTop: 8, color: '#556', fontSize: 10 }}>← → 移動 / Z 加速 / X ジャンプ / SPACE 開始</div>}{showTap && <div style={{ marginTop: 15, color: '#44ffaa', fontSize: 14 }}>タップしてスタート</div>}</div>;
}
