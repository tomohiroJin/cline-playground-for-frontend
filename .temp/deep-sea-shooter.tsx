import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// ============================================================================
// Type Definitions (Contract)
// ============================================================================
const EntityType = { PLAYER: 'player', BULLET: 'bullet', ENEMY: 'enemy', ITEM: 'item', PARTICLE: 'particle' };
const GameState = { TITLE: 'title', PLAYING: 'playing', GAMEOVER: 'gameover', ENDING: 'ending' };

// ============================================================================
// Configuration (Single Source of Truth)
// ============================================================================
const Config = Object.freeze({
  canvas: { width: 400, height: 560 },
  player: { size: 20, speed: 4, hitboxRatio: 0.4, maxLives: 5, maxPower: 5 },
  bullet: { size: 6, speed: 11, chargedSize: 22, chargedSpeed: 9, chargedDamage: 5, chargeTime: 800 },
  enemy: { baseSize: 28, maxCount: stage => 10 + stage * 2 },
  timing: { invincibility: 2000, shield: 8000, spread: 10000 },
  spawn: { itemChance: 0.2, bossItemChance: 1, multiSpawnChance: 0.3 },
  limits: { maxBullets: 50, maxEnemyBullets: 100, maxParticles: 80, maxItems: 20, maxBubbles: 30 },
});

const StageConfig = Object.freeze({
  1: { name: "浅層海域", bg: '#0a1a2a', types: ['basic', 'fast'], rate: 800, bossScore: 3000 },
  2: { name: "深海防衛ライン", bg: '#050f1a', types: ['basic', 'shooter', 'fast', 'tank'], rate: 650, bossScore: 7000 },
  3: { name: "最深部", bg: '#020810', types: ['shooter', 'fast', 'tank'], rate: 500, bossScore: 12000 },
});

const EnemyConfig = Object.freeze({
  basic:   { hp: 1, speed: 1.8, points: 100, sizeRatio: 1.0, canShoot: false, fireRate: 0 },
  fast:    { hp: 1, speed: 3.2, points: 150, sizeRatio: 0.9, canShoot: false, fireRate: 0 },
  shooter: { hp: 2, speed: 1.2, points: 200, sizeRatio: 1.1, canShoot: true,  fireRate: 2000 },
  tank:    { hp: 5, speed: 0.8, points: 300, sizeRatio: 1.4, canShoot: false, fireRate: 0 },
  boss:    { hp: 40, speed: 0.5, points: 2000, sizeRatio: 3.5, canShoot: true, fireRate: 800 },
});

const ItemConfig = Object.freeze({
  power:  { color: '#ff6644', label: 'P', description: 'パワーアップ' },
  speed:  { color: '#44ff66', label: 'S', description: 'スピードアップ' },
  shield: { color: '#4466ff', label: 'B', description: 'バリア' },
  spread: { color: '#ffff44', label: 'W', description: '3WAY' },
  bomb:   { color: '#ff44ff', label: '★', description: '全滅' },
  life:   { color: '#ff4444', label: '♥', description: 'ライフ+1' },
});

const ColorPalette = Object.freeze({
  enemy: { basic: '#3a8a5a', fast: '#5a5a8a', shooter: '#8a3a5a', tank: '#8a6a3a', boss: '#4a4a8a' },
  ui: { primary: '#6ac', danger: '#f66', success: '#6f8', warning: '#fa0' },
  particle: { hit: '#88ffaa', charged: '#64c8ff', death: '#aaffcc', damage: '#ff6666', bomb: '#ffff88' },
});

// ============================================================================
// Pure Utility Functions (No Side Effects)
// ============================================================================
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const identity = x => x;
const always = x => () => x;

const clamp = (min, max) => value => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const normalize = ({ x, y }) => { const m = Math.hypot(x, y); return m === 0 ? { x: 0, y: 0 } : { x: x/m, y: y/m }; };

const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(randomFloat(min, max + 1));
const randomChoice = arr => arr[randomInt(0, arr.length - 1)];
const randomChance = probability => Math.random() < probability;

const uniqueId = (() => { let id = 0; return () => ++id + Math.random(); })();

// ============================================================================
// Validation (Design by Contract - Preconditions)
// ============================================================================
const Validators = {
  isPositive: n => n > 0,
  isInRange: (min, max) => n => n >= min && n <= max,
  isValidPosition: ({ x, y }) => typeof x === 'number' && typeof y === 'number',
  isValidEntity: e => e && typeof e.id !== 'undefined' && Validators.isValidPosition(e),
};

const assert = (condition, message) => { if (!condition) console.warn(`Assertion failed: ${message}`); return condition; };

// ============================================================================
// Entity Factory (Single Responsibility + Open/Closed)
// ============================================================================
const createBaseEntity = (x, y, props = {}) => ({
  id: uniqueId(),
  x, y,
  createdAt: Date.now(),
  ...props,
});

const EntityFactory = {
  bullet: (x, y, { charged = false, angle = -Math.PI / 2 } = {}) => {
    const cfg = Config.bullet;
    return createBaseEntity(x, y, {
      type: EntityType.BULLET,
      charged,
      angle,
      speed: charged ? cfg.chargedSpeed : cfg.speed,
      damage: charged ? cfg.chargedDamage : 1,
      size: charged ? cfg.chargedSize : cfg.size,
    });
  },

  enemy: (type, x, y, stage = 1) => {
    const cfg = EnemyConfig[type];
    if (!assert(cfg, `Invalid enemy type: ${type}`)) return null;
    
    const hp = type === 'boss' ? cfg.hp + stage * 15 : cfg.hp;
    return createBaseEntity(x, y, {
      type: EntityType.ENEMY,
      enemyType: type,
      hp, maxHp: hp,
      speed: cfg.speed,
      points: cfg.points,
      size: Config.enemy.baseSize * cfg.sizeRatio,
      canShoot: cfg.canShoot,
      fireRate: cfg.fireRate,
      lastShotAt: 0,
      movementPattern: randomInt(0, 2),
      angle: 0,
    });
  },

  enemyBullet: (x, y, velocity) => createBaseEntity(x, y, { type: 'enemyBullet', vx: velocity.x, vy: velocity.y, size: 8 }),

  item: (x, y, itemType) => {
    if (!assert(ItemConfig[itemType], `Invalid item type: ${itemType}`)) return null;
    return createBaseEntity(x, y, { type: EntityType.ITEM, itemType, size: 24, speed: 1.5 });
  },

  particle: (x, y, { color, life = 15, velocity = null } = {}) => createBaseEntity(x, y, {
    type: EntityType.PARTICLE,
    color,
    vx: velocity?.x ?? randomFloat(-3, 3),
    vy: velocity?.y ?? randomFloat(-3, 3),
    life, maxLife: life,
    size: randomFloat(2, 5),
  }),

  bubble: () => createBaseEntity(randomFloat(0, Config.canvas.width), Config.canvas.height + 5, {
    size: randomFloat(2, 7),
    speed: randomFloat(0.3, 0.9),
    opacity: randomFloat(0.1, 0.3),
  }),
};

// ============================================================================
// Movement Strategies (Strategy Pattern + Open/Closed)
// ============================================================================
const MovementStrategies = {
  straight: (entity) => ({ ...entity, y: entity.y + entity.speed }),
  
  sine: (entity) => ({
    ...entity,
    y: entity.y + entity.speed,
    x: entity.x + Math.sin(entity.y / 20) * 2,
  }),
  
  drift: (entity) => ({
    ...entity,
    y: entity.y + entity.speed,
    x: entity.x + (entity.x < Config.canvas.width / 2 ? 0.5 : -0.5),
  }),
  
  boss: (entity) => ({
    ...entity,
    y: Math.min(90, entity.y + entity.speed),
    x: Config.canvas.width / 2 + Math.sin(entity.angle) * 80,
    angle: entity.angle + 0.015,
  }),

  bullet: (entity) => ({
    ...entity,
    x: entity.x + Math.cos(entity.angle) * entity.speed,
    y: entity.y + Math.sin(entity.angle) * entity.speed,
  }),

  enemyBullet: (entity) => ({ ...entity, x: entity.x + entity.vx, y: entity.y + entity.vy }),
  
  item: (entity) => ({ ...entity, y: entity.y + entity.speed }),
  
  particle: (entity) => ({ ...entity, x: entity.x + entity.vx, y: entity.y + entity.vy, life: entity.life - 1 }),
  
  bubble: (entity) => ({ ...entity, y: entity.y - entity.speed, opacity: entity.opacity - 0.003 }),
};

const getEnemyMovement = (enemy) => {
  if (enemy.enemyType === 'boss') return MovementStrategies.boss;
  return [MovementStrategies.straight, MovementStrategies.sine, MovementStrategies.drift][enemy.movementPattern] || MovementStrategies.straight;
};

// ============================================================================
// Boundary Predicates (Single Responsibility)
// ============================================================================
const BoundaryPredicates = {
  bullet: b => b.y > -20 && b.y < Config.canvas.height + 20 && b.x > -20 && b.x < Config.canvas.width + 20,
  enemyBullet: b => b.y < Config.canvas.height + 15 && b.y > -15 && b.x > -15 && b.x < Config.canvas.width + 15,
  enemy: e => e.y < Config.canvas.height + 50,
  item: i => i.y < Config.canvas.height + 30,
  particle: p => p.life > 0,
  bubble: b => b.y > -10 && b.opacity > 0,
};

// ============================================================================
// Collision Detection (Single Responsibility)
// ============================================================================
const Collision = {
  circle: (a, b, radiusA, radiusB) => distance(a, b) < radiusA + radiusB,
  
  bulletEnemy: (bullet, enemy) => Collision.circle(bullet, enemy, bullet.size / 2, enemy.size / 2),
  
  playerItem: (player, item) => Collision.circle(player, item, 15, item.size / 2),
  
  playerEnemyBullet: (player, bullet) => Collision.circle(player, bullet, Config.player.size * Config.player.hitboxRatio, 4),
  
  playerEnemy: (player, enemy) => Collision.circle(player, enemy, Config.player.size * Config.player.hitboxRatio, enemy.size / 2),
};

// ============================================================================
// Particle Generators (Factory Pattern)
// ============================================================================
const ParticleGenerators = {
  hit: (x, y, charged) => Array.from(
    { length: charged ? 5 : 2 },
    () => EntityFactory.particle(x, y, { color: charged ? ColorPalette.particle.charged : ColorPalette.particle.hit, life: 12 })
  ),
  
  death: (x, y) => Array.from(
    { length: 10 },
    () => EntityFactory.particle(x, y, { color: ColorPalette.particle.death, life: 20 })
  ),
  
  damage: (x, y) => Array.from(
    { length: 5 },
    () => EntityFactory.particle(x, y, { color: ColorPalette.particle.damage, life: 15 })
  ),
  
  bomb: () => Array.from(
    { length: 30 },
    () => EntityFactory.particle(randomFloat(0, Config.canvas.width), randomFloat(0, Config.canvas.height), { color: ColorPalette.particle.bomb, life: 25 })
  ),
};

// ============================================================================
// Enemy AI (Single Responsibility)
// ============================================================================
const EnemyAI = {
  shouldShoot: (enemy, now) => enemy.canShoot && enemy.y > 0 && now - enemy.lastShotAt > enemy.fireRate,
  
  calculateAimVelocity: (from, to, speed = 3.5) => {
    const dir = normalize({ x: to.x - from.x, y: to.y - from.y });
    return { x: dir.x * speed, y: dir.y * speed };
  },
  
  createBullets: (enemy, targetPos) => {
    const baseVel = EnemyAI.calculateAimVelocity(enemy, targetPos);
    const bullets = [EntityFactory.enemyBullet(enemy.x, enemy.y, baseVel)];
    
    if (enemy.enemyType !== 'boss') return bullets;
    
    return [
      ...bullets,
      EntityFactory.enemyBullet(enemy.x, enemy.y, { x: baseVel.x - 1, y: baseVel.y }),
      EntityFactory.enemyBullet(enemy.x, enemy.y, { x: baseVel.x + 1, y: baseVel.y }),
      EntityFactory.enemyBullet(enemy.x - 20, enemy.y, { x: 0, y: 4 }),
      EntityFactory.enemyBullet(enemy.x + 20, enemy.y, { x: 0, y: 4 }),
    ];
  },
};

// ============================================================================
// Audio System (Single Responsibility + Dependency Inversion)
// ============================================================================
const createAudioSystem = () => {
  let context = null;
  
  const SoundDefinitions = {
    shot:    { frequency: 80,  waveform: 'sine',     gain: 0.08, duration: 0.06 },
    charged: { frequency: 60,  waveform: 'triangle', gain: 0.12, duration: 0.2 },
    destroy: { frequency: 120, waveform: 'sawtooth', gain: 0.07, duration: 0.12, endFreq: 30 },
    hit:     { frequency: 100, waveform: 'square',   gain: 0.1,  duration: 0.08 },
    item:    { frequency: 440, waveform: 'sine',     gain: 0.1,  duration: 0.15 },
    bomb:    { frequency: 60,  waveform: 'sawtooth', gain: 0.15, duration: 0.4, endFreq: 20 },
  };

  const initialize = () => {
    if (context) return context;
    if (typeof window === 'undefined' || !window.AudioContext) return null;
    context = new AudioContext();
    return context;
  };

  const play = (soundName) => {
    if (!context) return;
    
    const def = SoundDefinitions[soundName];
    if (!def) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const filter = context.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      
      const now = context.currentTime;
      oscillator.frequency.value = def.frequency;
      oscillator.type = def.waveform;
      gainNode.gain.setValueAtTime(def.gain, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + def.duration);
      
      if (def.endFreq) {
        oscillator.frequency.exponentialRampToValueAtTime(def.endFreq, now + def.duration);
      }
      
      oscillator.start(now);
      oscillator.stop(now + def.duration);
    } catch (e) { /* Audio errors are non-critical */ }
  };

  return { initialize, play };
};

// ============================================================================
// Item Effect Handlers (Strategy Pattern + Open/Closed)
// ============================================================================
const ItemEffectHandlers = {
  power:  (state) => ({ ...state, power: Math.min(Config.player.maxPower, state.power + 1) }),
  speed:  (state, now, gameData) => ({ ...state, speedMultiplier: Math.min(2, state.speedMultiplier + 0.3) }),
  shield: (state, now) => ({ ...state, shield: true, shieldEndTime: now + Config.timing.shield }),
  spread: (state, now) => ({ ...state, spreadEndTime: now + Config.timing.spread }),
  bomb:   (state, now, gameData, audio) => {
    audio.play('bomb');
    gameData.enemies = gameData.enemies.filter(e => e.enemyType === 'boss');
    gameData.enemyBullets = [];
    gameData.particles = [...gameData.particles, ...ParticleGenerators.bomb()].slice(-Config.limits.maxParticles);
    return { ...state, score: state.score + 500 };
  },
  life: (state) => ({ ...state, lives: Math.min(Config.player.maxLives, state.lives + 1) }),
};

const applyItemEffect = (itemType, state, gameData, audio, now) => {
  const handler = ItemEffectHandlers[itemType];
  if (!handler) return state;
  
  audio.play('item');
  return handler(state, now, gameData, audio);
};

// ============================================================================
// Game State Management (Immutable Updates)
// ============================================================================
const createInitialGameData = () => ({
  player: { x: Config.canvas.width / 2, y: Config.canvas.height - 80 },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  items: [],
  particles: [],
  bubbles: [],
  charging: false,
  chargeLevel: 0,
  chargeStartTime: 0,
  spawnTimer: 0,
  bossDefeated: false,
  bossDefeatedTime: 0,
  invincible: false,
  invincibleEndTime: 0,
  input: { dx: 0, dy: 0 },
  keys: {},
});

const createInitialState = () => ({
  gameState: GameState.TITLE,
  stage: 1,
  score: 0,
  lives: 3,
  highScore: 0,
  power: 1,
  shield: false,
  shieldEndTime: 0,
  spreadEndTime: 0,
  speedMultiplier: 1,
});

// ============================================================================
// Update Pipeline (Functional Composition)
// ============================================================================
const updateEntities = (entities, updateFn, boundaryPredicate) =>
  entities.map(updateFn).filter(boundaryPredicate);

const spawnBubbles = (bubbles, spawnChance = 0.07, maxCount = 35) =>
  randomChance(spawnChance) && bubbles.length < maxCount
    ? [...bubbles, EntityFactory.bubble()]
    : bubbles;

const updatePlayerPosition = (player, input, keys, speed) => {
  let dx = input.dx, dy = input.dy;
  
  // Check arrow keys and WASD (both cases)
  const left = keys['ArrowLeft'] || keys['a'] || keys['A'];
  const right = keys['ArrowRight'] || keys['d'] || keys['D'];
  const up = keys['ArrowUp'] || keys['w'] || keys['W'];
  const down = keys['ArrowDown'] || keys['s'] || keys['S'];
  
  if (left) dx = -1;
  if (right) dx = 1;
  if (up) dy = -1;
  if (down) dy = 1;
  
  return {
    x: clamp(15, Config.canvas.width - 15)(player.x + dx * speed),
    y: clamp(15, Config.canvas.height - 50)(player.y + dy * speed),
  };
};

// ============================================================================
// Memoized Components (Performance Optimization)
// ============================================================================
const PlayerSprite = memo(({ x, y, opacity, shield }) => (
  <>
    {shield && (
      <div style={{
        position: 'absolute', left: x - 20, top: y - 20, width: 40, height: 40,
        borderRadius: '50%', border: '2px solid #4af', opacity: 0.5,
        animation: 'pulse 0.5s infinite',
      }} />
    )}
    <svg style={{ position: 'absolute', left: x - 10, top: y - 10, opacity }} width={20} height={26} viewBox="0 0 24 32">
      <defs>
        <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%">
          <stop offset="0%" stopColor="#1a3a5c" />
          <stop offset="50%" stopColor="#2d5a87" />
          <stop offset="100%" stopColor="#1a3a5c" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="17" rx="8" ry="11" fill="url(#subGrad)" stroke="#4a8ac7" strokeWidth="0.7" />
      <ellipse cx="12" cy="13" rx="4" ry="2.5" fill="#0a1520" stroke="#4a8ac7" strokeWidth="0.3" />
      <rect x="10" y="3" width="4" height="5" fill="#3a6a9c" />
      <rect x="9" y="1" width="6" height="2" fill="#4a8ac7" rx="0.5" />
      <path d="M4 18 L2 22 L7 20 Z" fill="#2d5a87" />
      <path d="M20 18 L22 22 L17 20 Z" fill="#2d5a87" />
      <ellipse cx="12" cy="29" rx="3" ry="1.5" fill="rgba(100,200,255,0.4)" />
    </svg>
  </>
));

const BulletSprite = memo(({ bullet }) => (
  <div style={{
    position: 'absolute',
    left: bullet.x - bullet.size / 2,
    top: bullet.y - bullet.size / 2,
    width: bullet.size,
    height: bullet.size,
    borderRadius: '50%',
    background: bullet.charged ? 'radial-gradient(circle,#fff,#64c8ff,#06c)' : 'radial-gradient(circle,#fff,#64c8ff)',
    boxShadow: bullet.charged ? '0 0 15px #64c8ff' : '0 0 6px #64c8ff',
  }} />
));

const EnemySprite = memo(({ enemy }) => {
  const color = ColorPalette.enemy[enemy.enemyType];
  const isBoss = enemy.enemyType === 'boss';
  const showHealthBar = isBoss || enemy.enemyType === 'tank';
  const healthPercent = enemy.hp / enemy.maxHp;
  
  return (
    <div style={{ position: 'absolute', left: enemy.x - enemy.size / 2, top: enemy.y - enemy.size / 2 }}>
      <svg width={enemy.size} height={enemy.size} viewBox="0 0 40 40">
        <ellipse cx="20" cy="20" rx={isBoss ? 18 : 16} ry={isBoss ? 16 : 14} fill={color} opacity="0.9" />
        {isBoss && <ellipse cx="20" cy="20" rx="12" ry="10" fill="rgba(0,0,0,0.4)" />}
        <circle cx="13" cy="15" r={isBoss ? 4 : 3} fill="#f66" opacity="0.8" />
        <circle cx="27" cy="15" r={isBoss ? 4 : 3} fill="#f66" opacity="0.8" />
        <ellipse cx="20" cy="26" rx="6" ry="3" fill="rgba(0,0,0,0.3)" />
        {isBoss && [0, 1, 2, 3].map(i => (
          <path key={i} d={`M${8 + i * 8} 34 Q${10 + i * 8} 42 ${6 + i * 9} 48`} stroke={color} strokeWidth="2.5" fill="none" opacity="0.6" />
        ))}
      </svg>
      {showHealthBar && (
        <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: enemy.size * 0.8, height: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 2 }}>
          <div style={{
            width: `${healthPercent * 100}%`, height: '100%', borderRadius: 2,
            background: healthPercent > 0.5 ? '#4a8' : healthPercent > 0.25 ? '#a84' : '#a44',
          }} />
        </div>
      )}
    </div>
  );
});

const EnemyBulletSprite = memo(({ bullet }) => (
  <div style={{
    position: 'absolute', left: bullet.x - 4, top: bullet.y - 4,
    width: 8, height: 8, borderRadius: '50%',
    background: 'radial-gradient(circle,#f66,#a33)', boxShadow: '0 0 6px #f33',
  }} />
));

const ItemSprite = memo(({ item }) => {
  const cfg = ItemConfig[item.itemType];
  return (
    <div style={{
      position: 'absolute', left: item.x - item.size / 2, top: item.y - item.size / 2,
      width: item.size, height: item.size, borderRadius: '50%',
      background: `radial-gradient(circle, ${cfg.color}, ${cfg.color}88)`,
      boxShadow: `0 0 10px ${cfg.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 12, fontWeight: 'bold', textShadow: '0 0 3px #000',
    }}>
      {cfg.label}
    </div>
  );
});

const ParticleSprite = memo(({ particle }) => (
  <div style={{
    position: 'absolute', left: particle.x, top: particle.y,
    width: particle.size, height: particle.size, borderRadius: '50%',
    background: particle.color, opacity: particle.life / particle.maxLife,
  }} />
));

const BubbleSprite = memo(({ bubble }) => (
  <div style={{
    position: 'absolute', left: bubble.x, top: bubble.y,
    width: bubble.size, height: bubble.size, borderRadius: '50%',
    border: `1px solid rgba(100,170,200,${bubble.opacity})`, pointerEvents: 'none',
  }} />
));

const ChargeIndicator = memo(({ x, y, level }) => (
  <>
    <div style={{ position: 'absolute', left: x - 20, top: y + 22, width: 40, height: 5, background: 'rgba(0,0,0,0.6)', borderRadius: 2 }}>
      <div style={{ width: `${level * 100}%`, height: '100%', background: level >= 0.8 ? '#6cf' : '#48a', borderRadius: 2 }} />
    </div>
    {level > 0.3 && (
      <div style={{
        position: 'absolute', left: x - 18 - level * 15, top: y - 18 - level * 15,
        width: 36 + level * 30, height: 36 + level * 30, borderRadius: '50%',
        background: `radial-gradient(circle,rgba(100,200,255,${0.2 + level * 0.25}),transparent)`,
        pointerEvents: 'none',
      }} />
    )}
  </>
));

const GameUI = memo(({ stage, stageName, score, lives, power, spreadTime }) => (
  <>
    <div style={{ position: 'absolute', top: 8, left: 8, color: '#6ac', fontSize: 10, opacity: 0.9 }}>
      STAGE {stage}: {stageName}
    </div>
    <div style={{ position: 'absolute', top: 8, right: 8, color: '#6ac', fontSize: 10 }}>SCORE: {score}</div>
    <div style={{ position: 'absolute', top: 22, right: 8, color: '#f66', fontSize: 12 }}>{'♥'.repeat(Math.max(0, lives))}</div>
    <div style={{ position: 'absolute', top: 36, right: 8, color: '#fa6', fontSize: 9 }}>
      POW: {power} {spreadTime > 0 && `| 3WAY: ${Math.ceil(spreadTime / 1000)}s`}
    </div>
  </>
));

const TouchControls = memo(({ onMove, onShoot, onCharge, charging }) => {
  const directions = [
    { label: '↑', left: 36, top: 5, dx: 0, dy: -1 },
    { label: '↓', left: 36, top: 65, dx: 0, dy: 1 },
    { label: '←', left: 5, top: 35, dx: -1, dy: 0 },
    { label: '→', left: 67, top: 35, dx: 1, dy: 0 },
  ];

  const buttonStyle = {
    position: 'absolute', width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(100,150,200,0.5)', border: 'none', color: '#fff',
    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const actionButtonStyle = (isCharging) => ({
    width: 55, height: 55, borderRadius: '50%',
    background: isCharging ? 'rgba(255,200,100,0.8)' : 'rgba(100,200,255,0.6)',
    border: `2px solid ${isCharging ? '#fa6' : '#6cf'}`,
    color: '#fff', fontSize: 10, fontWeight: 'bold',
  });

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, display: 'flex', justifyContent: 'space-between', padding: 10, pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: 100, height: 100, pointerEvents: 'auto' }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(100,150,200,0.2)', border: '2px solid rgba(100,150,200,0.4)' }} />
        {directions.map(({ label, left, top, dx, dy }) => (
          <button
            key={label}
            style={{ ...buttonStyle, left, top }}
            onTouchStart={() => onMove(dx, dy)}
            onTouchEnd={() => onMove(0, 0)}
            onMouseDown={() => onMove(dx, dy)}
            onMouseUp={() => onMove(0, 0)}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 15, alignItems: 'center', pointerEvents: 'auto' }}>
        <button style={actionButtonStyle(false)} onTouchStart={onShoot} onMouseDown={onShoot}>SHOT</button>
        <button
          style={actionButtonStyle(charging)}
          onTouchStart={onCharge}
          onTouchEnd={onCharge}
          onMouseDown={onCharge}
          onMouseUp={onCharge}
        >
          {charging ? 'チャージ' : 'CHARGE'}
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Screen Components (Single Responsibility)
// ============================================================================
const TitleScreen = memo(({ onStart }) => (
  <div style={{ width: Config.canvas.width, height: Config.canvas.height, background: 'linear-gradient(180deg,#0a1a2a,#020810)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#6ac' }}>
    <h1 style={{ fontSize: 28, fontWeight: 'bold', textShadow: '0 0 20px #0af', margin: '0 0 6px' }}>深海迎撃</h1>
    <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 30px' }}>DEEP SEA INTERCEPTOR</p>
    
    <div style={{ background: 'rgba(0,30,60,0.6)', padding: 15, borderRadius: 8, marginBottom: 20, fontSize: 10, lineHeight: 1.8 }}>
      <p style={{ color: '#8cf', marginBottom: 8, fontWeight: 'bold' }}>【操作方法】</p>
      <p>🎮 PC: 矢印/WASD=移動, Z=ショット, X=タメ撃ち</p>
      <p>📱 スマホ: 画面下のボタンで操作</p>
      <p style={{ color: '#fa6', marginTop: 8 }}>💡 タメ撃ちは長押しで強力な一撃！</p>
    </div>
    
    <div style={{ background: 'rgba(0,30,60,0.6)', padding: 12, borderRadius: 8, marginBottom: 25, fontSize: 9 }}>
      <p style={{ color: '#8cf', marginBottom: 6, fontWeight: 'bold' }}>【アイテム】</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {Object.entries(ItemConfig).map(([key, { color, label, description }]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color, fontWeight: 'bold' }}>{label}</span>
            <span style={{ opacity: 0.8 }}>{description}</span>
          </div>
        ))}
      </div>
    </div>
    
    <button
      onClick={onStart}
      onTouchStart={onStart}
      style={{ padding: '12px 40px', fontSize: 14, background: 'linear-gradient(180deg,#2a6a9a,#1a4a6a)', border: '2px solid #4a9acf', borderRadius: 25, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
    >
      START
    </button>
  </div>
));

const GameOverScreen = memo(({ score, stage, stageName, onRetry }) => (
  <div style={{ width: Config.canvas.width, height: Config.canvas.height, background: 'linear-gradient(180deg,#1a0a0a,#0a0505)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#a66' }}>
    <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>MISSION FAILED</h1>
    <p style={{ fontSize: 14, marginBottom: 8 }}>SCORE: {score}</p>
    <p style={{ fontSize: 11, marginBottom: 30, opacity: 0.7 }}>STAGE {stage}: {stageName}</p>
    <button onClick={onRetry} onTouchStart={onRetry} style={{ padding: '10px 30px', fontSize: 12, background: '#633', border: '2px solid #966', borderRadius: 20, color: '#fff', cursor: 'pointer' }}>
      RETRY
    </button>
  </div>
));

const EndingScreen = memo(({ score, highScore, onRetry }) => (
  <div style={{ width: Config.canvas.width, height: Config.canvas.height, background: 'linear-gradient(180deg,#0a1a2a,#020810)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#6ac' }}>
    <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>MISSION COMPLETE</h1>
    <p style={{ fontSize: 11, marginBottom: 8, opacity: 0.8 }}>脅威は一時的に沈静化した</p>
    <p style={{ fontSize: 10, marginBottom: 20, opacity: 0.6 }}>深海はまだ未知だが、人類は一歩踏み込んだ</p>
    <p style={{ fontSize: 16, marginBottom: 8 }}>FINAL SCORE: {score}</p>
    {score >= highScore && score > 0 && <p style={{ fontSize: 11, color: '#fa0', marginBottom: 20 }}>NEW HIGH SCORE!</p>}
    <button onClick={onRetry} onTouchStart={onRetry} style={{ padding: '10px 30px', fontSize: 12, background: 'linear-gradient(180deg,#2a6a9a,#1a4a6a)', border: '2px solid #4a9acf', borderRadius: 20, color: '#fff', cursor: 'pointer', marginTop: 15 }}>
      TITLE
    </button>
  </div>
));

// ============================================================================
// Main Game Component
// ============================================================================
export default function DeepSeaShooter() {
  const [state, setState] = useState(createInitialState);
  const [, forceRender] = useState(0);

  const gameDataRef = useRef(createInitialGameData());
  const audioRef = useRef(createAudioSystem());
  const frameRef = useRef(null);

  const stageConfig = useMemo(() => StageConfig[state.stage] || StageConfig[1], [state.stage]);

  // Reset game state
  const resetGame = useCallback(() => {
    gameDataRef.current = createInitialGameData();
    setState(createInitialState());
  }, []);

  // Start game
  const startGame = useCallback(() => {
    audioRef.current.initialize();
    resetGame();
    setState(prev => ({ ...prev, gameState: GameState.PLAYING }));
  }, [resetGame]);

  // Return to title
  const returnToTitle = useCallback(() => {
    resetGame();
    setState(prev => ({ ...prev, gameState: GameState.TITLE }));
  }, [resetGame]);

  // Handle movement input
  const handleMove = useCallback((dx, dy) => {
    gameDataRef.current.input = { dx, dy };
  }, []);

  // Handle shoot
  const handleShoot = useCallback(() => {
    const data = gameDataRef.current;
    const audio = audioRef.current;
    
    const hasSpread = state.spreadEndTime > Date.now();
    const hasPowerShot = state.power >= 3;
    
    const angles = hasSpread 
      ? [-0.25, 0, 0.25] 
      : hasPowerShot 
        ? [-0.1, 0.1] 
        : [0];
    
    angles.forEach(angle => {
      data.bullets.push(EntityFactory.bullet(data.player.x, data.player.y - 12, { angle: -Math.PI / 2 + angle }));
    });
    
    audio.play('shot');
  }, [state.spreadEndTime, state.power]);

  // Handle charge
  const handleCharge = useCallback((event) => {
    const data = gameDataRef.current;
    const audio = audioRef.current;
    const isStart = event.type === 'touchstart' || event.type === 'mousedown';

    if (isStart) {
      data.charging = true;
      data.chargeStartTime = Date.now();
      return;
    }

    // Release charge
    if (!data.charging) return;
    
    if (data.chargeLevel >= 0.8) {
      data.bullets.push(EntityFactory.bullet(data.player.x, data.player.y - 12, { charged: true }));
      audio.play('charged');
    }
    
    data.charging = false;
    data.chargeLevel = 0;
  }, []);

  // Keyboard input - separate from game state
  useEffect(() => {
    const handleKeyDown = (event) => {
      const data = gameDataRef.current;
      const key = event.key;
      
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'z', 'x', 'Z', 'X', ' '].includes(key)) {
        event.preventDefault();
      }
      
      // Store key state
      data.keys[key] = true;
      
      // Handle shooting
      if (key === 'z' || key === 'Z') {
        handleShoot();
      }
      
      // Handle charge start
      if ((key === 'x' || key === 'X') && !data.charging) {
        data.charging = true;
        data.chargeStartTime = Date.now();
      }
    };

    const handleKeyUp = (event) => {
      const data = gameDataRef.current;
      const key = event.key;
      
      // Clear key state
      data.keys[key] = false;
      
      // Handle charge release
      if ((key === 'x' || key === 'X') && data.charging) {
        if (data.chargeLevel >= 0.8) {
          data.bullets.push(EntityFactory.bullet(data.player.x, data.player.y - 12, { charged: true }));
          audioRef.current.play('charged');
        }
        data.charging = false;
        data.chargeLevel = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleShoot]);

  // Main game loop
  useEffect(() => {
    if (state.gameState !== GameState.PLAYING) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const audio = audioRef.current;
    // Use ref to track mutable local state that syncs with React state
    const localStateRef = { current: { ...state } };

    const gameLoop = () => {
      // Always get fresh reference to gameData
      const data = gameDataRef.current;
      const now = Date.now();
      
      // Use localStateRef.current for reading/writing within the loop
      let ls = localStateRef.current;

      // Update bubbles
      data.bubbles = pipe(
        bubbles => updateEntities(bubbles, MovementStrategies.bubble, BoundaryPredicates.bubble),
        bubbles => spawnBubbles(bubbles, 0.07, Config.limits.maxBubbles)
      )(data.bubbles);

      // Update player position - read keys directly from ref
      const currentKeys = gameDataRef.current.keys;
      const currentInput = gameDataRef.current.input;
      const playerSpeed = Config.player.speed * ls.speedMultiplier;
      data.player = updatePlayerPosition(data.player, currentInput, currentKeys, playerSpeed);

      // Update charge level
      if (data.charging) {
        data.chargeLevel = Math.min(1, (now - data.chargeStartTime) / Config.bullet.chargeTime);
      }

      // Check timed powerups
      if (ls.shieldEndTime > 0 && now > ls.shieldEndTime) {
        ls = { ...ls, shield: false, shieldEndTime: 0 };
        localStateRef.current = ls;
        setState(prev => ({ ...prev, shield: false, shieldEndTime: 0 }));
      }

      if (ls.spreadEndTime > 0 && now > ls.spreadEndTime) {
        ls = { ...ls, spreadEndTime: 0 };
        localStateRef.current = ls;
        setState(prev => ({ ...prev, spreadEndTime: 0 }));
      }

      // Update entities with limits
      data.bullets = updateEntities(data.bullets, MovementStrategies.bullet, BoundaryPredicates.bullet)
        .slice(-Config.limits.maxBullets);
      data.enemyBullets = updateEntities(data.enemyBullets, MovementStrategies.enemyBullet, BoundaryPredicates.enemyBullet)
        .slice(-Config.limits.maxEnemyBullets);
      data.items = updateEntities(data.items, MovementStrategies.item, BoundaryPredicates.item)
        .slice(-Config.limits.maxItems);
      data.particles = updateEntities(data.particles, MovementStrategies.particle, BoundaryPredicates.particle)
        .slice(-Config.limits.maxParticles);

      // Update enemies with shooting
      data.enemies = data.enemies
        .map(enemy => {
          const updated = getEnemyMovement(enemy)(enemy);
          
          if (EnemyAI.shouldShoot(updated, now)) {
            data.enemyBullets.push(...EnemyAI.createBullets(updated, data.player));
            updated.lastShotAt = now;
          }
          
          return updated;
        })
        .filter(BoundaryPredicates.enemy);

      // Spawn enemies
      if (!data.bossDefeated) {
        data.spawnTimer += 16;
        const maxEnemies = Config.enemy.maxCount(ls.stage);
        const hasBoss = data.enemies.some(e => e.enemyType === 'boss');

        if (data.spawnTimer > stageConfig.rate && data.enemies.length < maxEnemies && !hasBoss) {
          const spawnCount = randomChance(Config.spawn.multiSpawnChance) ? 2 : 1;
          
          for (let i = 0; i < spawnCount && data.enemies.length < maxEnemies; i++) {
            const enemyType = randomChoice(stageConfig.types);
            const x = randomFloat(30, Config.canvas.width - 30);
            const y = randomFloat(-40, -20);
            data.enemies.push(EntityFactory.enemy(enemyType, x, y, ls.stage));
          }
          data.spawnTimer = 0;
        }

        // Spawn boss
        if (ls.score >= stageConfig.bossScore && !hasBoss) {
          data.enemies.push(EntityFactory.enemy('boss', Config.canvas.width / 2, -60, ls.stage));
        }
      }

      // Bullet-Enemy collision
      data.bullets = data.bullets.filter(bullet => {
        let bulletHit = false;

        data.enemies = data.enemies.filter(enemy => {
          if (!Collision.bulletEnemy(bullet, enemy)) return true;

          bulletHit = true;
          enemy.hp -= bullet.damage * ls.power;
          data.particles.push(...ParticleGenerators.hit(bullet.x, bullet.y, bullet.charged));

          if (enemy.hp > 0) return true;

          // Enemy destroyed
          audio.play('destroy');
          ls = { ...ls, score: ls.score + enemy.points };
          localStateRef.current = ls;
          setState(prev => ({ ...prev, score: ls.score }));
          data.particles.push(...ParticleGenerators.death(enemy.x, enemy.y));

          // Drop item
          const dropChance = enemy.enemyType === 'boss' ? Config.spawn.bossItemChance : Config.spawn.itemChance;
          if (randomChance(dropChance)) {
            const itemType = randomChoice(Object.keys(ItemConfig));
            data.items.push(EntityFactory.item(enemy.x, enemy.y, itemType));
          }

          // Boss defeated - set timestamp instead of using setTimeout
          if (enemy.enemyType === 'boss' && !data.bossDefeated) {
            data.bossDefeated = true;
            data.bossDefeatedTime = now;
          }

          return false;
        });

        return !bulletHit || bullet.charged;
      });

      // Handle boss transition (2 seconds after defeat)
      if (data.bossDefeated && now - data.bossDefeatedTime > 2000) {
        if (ls.stage < 3) {
          // Next stage
          ls = { ...ls, stage: ls.stage + 1 };
          localStateRef.current = ls;
          setState(prev => ({ ...prev, stage: ls.stage }));
          data.enemies = [];
          data.enemyBullets = [];
          data.bossDefeated = false;
          data.bossDefeatedTime = 0;
          data.spawnTimer = 0;
        } else {
          // Game complete
          setState(prev => ({
            ...prev,
            gameState: GameState.ENDING,
            highScore: Math.max(prev.highScore, ls.score),
          }));
          return; // Stop the loop
        }
      }

      // Player-Item collision
      data.items = data.items.filter(item => {
        if (!Collision.playerItem(data.player, item)) return true;

        const handler = ItemEffectHandlers[item.itemType];
        if (handler) {
          audio.play('item');
          ls = handler(ls, now, data, audio);
          localStateRef.current = ls;
          setState(prev => ({ ...prev, ...ls }));
        }
        return false;
      });

      // Invincibility check
      if (data.invincible && now > data.invincibleEndTime) {
        data.invincible = false;
      }

      // Player-EnemyBullet collision
      if (!data.invincible) {
        if (ls.shield) {
          data.enemyBullets = data.enemyBullets.filter(bullet => !Collision.playerEnemyBullet(data.player, bullet));
        } else {
          // Check enemy bullets
          data.enemyBullets = data.enemyBullets.filter(bullet => {
            if (!Collision.playerEnemyBullet(data.player, bullet)) return true;

            audio.play('hit');
            ls = { ...ls, lives: ls.lives - 1 };
            localStateRef.current = ls;
            setState(prev => ({ ...prev, lives: ls.lives }));

            if (ls.lives <= 0) {
              setState(prev => ({ ...prev, gameState: GameState.GAMEOVER }));
              return false;
            }

            data.invincible = true;
            data.invincibleEndTime = now + Config.timing.invincibility;
            data.particles.push(...ParticleGenerators.damage(data.player.x, data.player.y));

            return false;
          });

          // Check enemy collision (direct contact)
          const collidedEnemy = data.enemies.find(enemy => Collision.playerEnemy(data.player, enemy));
          if (collidedEnemy) {
            audio.play('hit');
            ls = { ...ls, lives: ls.lives - 1 };
            localStateRef.current = ls;
            setState(prev => ({ ...prev, lives: ls.lives }));

            if (ls.lives <= 0) {
              setState(prev => ({ ...prev, gameState: GameState.GAMEOVER }));
            } else {
              data.invincible = true;
              data.invincibleEndTime = now + Config.timing.invincibility;
              data.particles.push(...ParticleGenerators.damage(data.player.x, data.player.y));
            }
          }
        }
      }

      forceRender(n => n + 1);
      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [state.gameState, state.stage, stageConfig, state.power, state.shield, state.shieldEndTime, state.spreadEndTime, state.speedMultiplier]);

  // Render based on game state
  const data = gameDataRef.current;
  const spreadTimeRemaining = Math.max(0, state.spreadEndTime - Date.now());

  switch (state.gameState) {
    case GameState.TITLE:
      return <TitleScreen onStart={startGame} />;
    
    case GameState.GAMEOVER:
      return <GameOverScreen score={state.score} stage={state.stage} stageName={stageConfig.name} onRetry={returnToTitle} />;
    
    case GameState.ENDING:
      return <EndingScreen score={state.score} highScore={state.highScore} onRetry={returnToTitle} />;
    
    default:
      return (
        <div style={{ width: Config.canvas.width, height: Config.canvas.height, background: `linear-gradient(180deg,${stageConfig.bg},#010408)`, position: 'relative', overflow: 'hidden', fontFamily: 'sans-serif', touchAction: 'none' }}>
          {data.bubbles.map(b => <BubbleSprite key={b.id} bubble={b} />)}
          
          <GameUI stage={state.stage} stageName={stageConfig.name} score={state.score} lives={state.lives} power={state.power} spreadTime={spreadTimeRemaining} />
          
          {data.charging && <ChargeIndicator x={data.player.x} y={data.player.y} level={data.chargeLevel} />}
          
          <PlayerSprite x={data.player.x} y={data.player.y} opacity={data.invincible ? 0.4 : 1} shield={state.shield} />
          
          {data.bullets.map(b => <BulletSprite key={b.id} bullet={b} />)}
          {data.enemies.map(e => <EnemySprite key={e.id} enemy={e} />)}
          {data.enemyBullets.map(b => <EnemyBulletSprite key={b.id} bullet={b} />)}
          {data.items.map(i => <ItemSprite key={i.id} item={i} />)}
          {data.particles.map(p => <ParticleSprite key={p.id} particle={p} />)}
          
          {data.bossDefeated && (
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', color: '#6f8', fontSize: 15, fontWeight: 'bold', textShadow: '0 0 15px #0f0' }}>
              {state.stage < 3 ? 'BOSS DEFEATED!' : 'FINAL BOSS DEFEATED!'}
            </div>
          )}
          
          <TouchControls onMove={handleMove} onShoot={handleShoot} onCharge={handleCharge} charging={data.charging} />
          
          <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.1);opacity:0.3}}`}</style>
        </div>
      );
  }
}