import React, { useState, useEffect, useRef, useCallback, memo, useReducer } from 'react';
import styled from 'styled-components';
import { PageContainer } from './DeepSeaShooterPage.styles';
import {
  clamp as baseClamp,
  randomRange,
  randomInt as baseRandomInt,
  distance as baseDistance,
} from '../utils/math-utils';
import { saveScore, getHighScore } from '../utils/score-storage';
import { ShareButton } from '../components/molecules/ShareButton';

// ============================================================================
// Styled Components (Containers & Static UI)
// ============================================================================

const StyledGameContainer = styled.div`
  width: 400px;
  height: 560px;
  background: #000;
  position: relative;
  overflow: hidden;
  font-family: sans-serif;
  box-shadow: 0 0 20px rgba(0, 100, 200, 0.3);
  user-select: none;
  touch-action: none;
`;

const FullScreenOverlay = styled.div<{ $bg: string }>`
  width: 100%;
  height: 100%;
  background: ${props => props.$bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6ac;
`;

const GameTitle = styled.h1`
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 0 20px #0af;
  margin: 0 0 6px;
`;

const GameSubTitle = styled.p`
  font-size: 11px;
  opacity: 0.7;
  margin: 0 0 30px;
`;

const InfoBox = styled.div`
  background: rgba(0, 30, 60, 0.6);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 10px;
  line-height: 1.8;
  width: 80%;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 40px;
  font-size: 14px;
  background: ${props => (props.$primary ? 'linear-gradient(180deg,#2a6a9a,#1a4a6a)' : '#633')};
  border: 2px solid ${props => (props.$primary ? '#4a9acf' : '#966')};
  border-radius: 25px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  margin-top: ${props => (props.$primary ? '0' : '15px')};
  &:hover {
    transform: scale(1.05);
  }
`;

// ============================================================================
// Types
// ============================================================================

interface Position {
  x: number;
  y: number;
}
interface BaseEntity extends Position {
  id: number;
  createdAt: number;
}
interface Bullet extends BaseEntity {
  type: 'bullet';
  charged: boolean;
  angle: number;
  speed: number;
  damage: number;
  size: number;
}
interface Enemy extends BaseEntity {
  type: 'enemy';
  enemyType: keyof typeof EnemyConfig;
  hp: number;
  maxHp: number;
  speed: number;
  points: number;
  size: number;
  canShoot: boolean;
  fireRate: number;
  lastShotAt: number;
  movementPattern: number;
  angle: number;
}
interface EnemyBullet extends BaseEntity {
  type: 'enemyBullet';
  vx: number;
  vy: number;
  size: number;
}
interface Item extends BaseEntity {
  type: 'item';
  itemType: keyof typeof ItemConfig;
  size: number;
  speed: number;
}
interface Particle extends BaseEntity {
  type: 'particle';
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}
interface Bubble extends BaseEntity {
  size: number;
  speed: number;
  opacity: number;
}

interface GameState {
  player: { x: number; y: number };
  bullets: Bullet[];
  enemies: Enemy[];
  enemyBullets: EnemyBullet[];
  items: Item[];
  particles: Particle[];
  bubbles: Bubble[];
  charging: boolean;
  chargeLevel: number;
  chargeStartTime: number;
  spawnTimer: number;
  bossDefeated: boolean;
  bossDefeatedTime: number;
  invincible: boolean;
  invincibleEndTime: number;
  input: { dx: number; dy: number };
  keys: Record<string, boolean>;
}

// ============================================================================
// Configuration
// ============================================================================
const Config = Object.freeze({
  canvas: { width: 400, height: 560 },
  player: { size: 20, speed: 4, hitboxRatio: 0.4, maxLives: 5, maxPower: 5 },
  bullet: {
    size: 6,
    speed: 11,
    chargedSize: 22,
    chargedSpeed: 9,
    chargedDamage: 5,
    chargeTime: 800,
  },
  enemy: { baseSize: 28, maxCount: (stage: number) => 10 + stage * 2 },
  timing: { invincibility: 2000, shield: 8000, spread: 10000 },
  spawn: { itemChance: 0.2, bossItemChance: 1, multiSpawnChance: 0.3 },
  limits: { maxBullets: 50, maxEnemyBullets: 100, maxParticles: 80, maxItems: 20, maxBubbles: 30 },
});

const StageConfig: Record<
  number,
  { name: string; bg: string; types: string[]; rate: number; bossScore: number }
> = Object.freeze({
  1: { name: '浅層海域', bg: '#0a1a2a', types: ['basic', 'fast'], rate: 800, bossScore: 3000 },
  2: {
    name: '深海防衛ライン',
    bg: '#050f1a',
    types: ['basic', 'shooter', 'fast', 'tank'],
    rate: 650,
    bossScore: 7000,
  },
  3: {
    name: '最深部',
    bg: '#020810',
    types: ['shooter', 'fast', 'tank'],
    rate: 500,
    bossScore: 12000,
  },
});

const EnemyConfig: Record<
  string,
  {
    hp: number;
    speed: number;
    points: number;
    sizeRatio: number;
    canShoot: boolean;
    fireRate: number;
  }
> = Object.freeze({
  basic: { hp: 1, speed: 1.8, points: 100, sizeRatio: 1.0, canShoot: false, fireRate: 0 },
  fast: { hp: 1, speed: 3.2, points: 150, sizeRatio: 0.9, canShoot: false, fireRate: 0 },
  shooter: { hp: 2, speed: 1.2, points: 200, sizeRatio: 1.1, canShoot: true, fireRate: 2000 },
  tank: { hp: 5, speed: 0.8, points: 300, sizeRatio: 1.4, canShoot: false, fireRate: 0 },
  boss: { hp: 40, speed: 0.5, points: 2000, sizeRatio: 3.5, canShoot: true, fireRate: 800 },
});

const ItemConfig: Record<string, { color: string; label: string; description: string }> =
  Object.freeze({
    power: { color: '#ff6644', label: 'P', description: 'パワーアップ' },
    speed: { color: '#44ff66', label: 'S', description: 'スピードアップ' },
    shield: { color: '#4466ff', label: 'B', description: 'バリア' },
    spread: { color: '#ffff44', label: 'W', description: '3WAY' },
    bomb: { color: '#ff44ff', label: '★', description: '全滅' },
    life: { color: '#ff4444', label: '♥', description: 'ライフ+1' },
  });

const ColorPalette: {
  enemy: Record<string, string>;
  ui: Record<string, string>;
  particle: Record<string, string>;
} = Object.freeze({
  enemy: {
    basic: '#3a8a5a',
    fast: '#5a5a8a',
    shooter: '#8a3a5a',
    tank: '#8a6a3a',
    boss: '#4a4a8a',
  },
  ui: { primary: '#6ac', danger: '#f66', success: '#6f8', warning: '#fa0' },
  particle: {
    hit: '#88ffaa',
    charged: '#64c8ff',
    death: '#aaffcc',
    damage: '#ff6666',
    bomb: '#ffff88',
  },
});

// ============================================================================
// Logic Helpers
// ============================================================================

// math-utils をラップ（このモジュール固有のシグネチャを維持）
const clamp = (min: number, max: number) => (value: number) => baseClamp(value, min, max);
const randomFloat = randomRange;
const randomInt = baseRandomInt;
function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}
const uniqueId = (() => {
  let id = 0;
  return () => ++id + Math.random();
})();
const distance = (a: Position, b: Position) => baseDistance(a.x, a.y, b.x, b.y);
const normalize = ({ x, y }: Position) => {
  const m = Math.hypot(x, y);
  return m === 0 ? { x: 0, y: 0 } : { x: x / m, y: y / m };
};

const EntityFactory = {
  bullet: (x: number, y: number, { charged = false, angle = -Math.PI / 2 } = {}): Bullet => {
    const cfg = Config.bullet;
    return {
      id: uniqueId(),
      x,
      y,
      createdAt: Date.now(),
      type: 'bullet',
      charged,
      angle,
      speed: charged ? cfg.chargedSpeed : cfg.speed,
      damage: charged ? cfg.chargedDamage : 1,
      size: charged ? cfg.chargedSize : cfg.size,
    };
  },
  enemy: (type: string, x: number, y: number, stage = 1): Enemy => {
    const cfg = EnemyConfig[type];
    if (!cfg) throw new Error(`Invalid enemy type: ${type}`);
    const hp = type === 'boss' ? cfg.hp + stage * 15 : cfg.hp;
    return {
      id: uniqueId(),
      x,
      y,
      createdAt: Date.now(),
      type: 'enemy',
      enemyType: type,
      hp,
      maxHp: hp,
      speed: cfg.speed,
      points: cfg.points,
      size: Config.enemy.baseSize * cfg.sizeRatio,
      canShoot: cfg.canShoot,
      fireRate: cfg.fireRate,
      lastShotAt: 0,
      movementPattern: randomInt(0, 2),
      angle: 0,
    };
  },
  enemyBullet: (x: number, y: number, velocity: Position): EnemyBullet => ({
    id: uniqueId(),
    x,
    y,
    createdAt: Date.now(),
    type: 'enemyBullet',
    vx: velocity.x,
    vy: velocity.y,
    size: 8,
  }),
  item: (x: number, y: number, itemType: keyof typeof ItemConfig): Item => ({
    id: uniqueId(),
    x,
    y,
    createdAt: Date.now(),
    type: 'item',
    itemType,
    size: 24,
    speed: 1.5,
  }),
  particle: (
    x: number,
    y: number,
    {
      color,
      life = 15,
      velocity = null,
    }: { color: string; life?: number; velocity?: Position | null } = { color: '#fff' }
  ): Particle => ({
    id: uniqueId(),
    x,
    y,
    createdAt: Date.now(),
    type: 'particle',
    color,
    vx: velocity?.x ?? randomFloat(-3, 3),
    vy: velocity?.y ?? randomFloat(-3, 3),
    life,
    maxLife: life,
    size: randomFloat(2, 5),
  }),
  bubble: (): Bubble => ({
    id: uniqueId(),
    x: randomFloat(0, Config.canvas.width),
    y: Config.canvas.height + 5,
    createdAt: Date.now(),
    size: randomFloat(2, 7),
    speed: randomFloat(0.3, 0.9),
    opacity: randomFloat(0.1, 0.3),
  }),
};

type MovableEntity = Position & { speed: number };
type AngleEntity = Position & { angle: number; speed: number };
type VelocityEntity = Position & { vx: number; vy: number };

const MovementStrategies = {
  straight: <T extends MovableEntity>(e: T): T => ({ ...e, y: e.y + e.speed }),
  sine: <T extends MovableEntity>(e: T): T => ({
    ...e,
    y: e.y + e.speed,
    x: e.x + Math.sin(e.y / 20) * 2,
  }),
  drift: <T extends MovableEntity>(e: T): T => ({
    ...e,
    y: e.y + e.speed,
    x: e.x + (e.x < Config.canvas.width / 2 ? 0.5 : -0.5),
  }),
  boss: <T extends AngleEntity>(e: T): T => ({
    ...e,
    y: Math.min(90, e.y + e.speed),
    x: Config.canvas.width / 2 + Math.sin(e.angle) * 80,
    angle: e.angle + 0.015,
  }),
  bullet: <T extends AngleEntity>(e: T): T => ({
    ...e,
    x: e.x + Math.cos(e.angle) * e.speed,
    y: e.y + Math.sin(e.angle) * e.speed,
  }),
  enemyBullet: <T extends VelocityEntity>(e: T): T => ({ ...e, x: e.x + e.vx, y: e.y + e.vy }),
  item: <T extends MovableEntity>(e: T): T => ({ ...e, y: e.y + e.speed }),
  particle: <T extends VelocityEntity & { life: number }>(e: T): T => ({
    ...e,
    x: e.x + e.vx,
    y: e.y + e.vy,
    life: e.life - 1,
  }),
  bubble: <T extends MovableEntity & { opacity: number }>(e: T): T => ({
    ...e,
    y: e.y - e.speed,
    opacity: e.opacity - 0.003,
  }),
};

const Collision = {
  circle: (a: Position, b: Position, rA: number, rB: number) => distance(a, b) < rA + rB,
  bulletEnemy: (b: Bullet, e: Enemy) => Collision.circle(b, e, b.size / 2, e.size / 2),
  playerItem: (p: Position, i: Item) => Collision.circle(p, i, 15, i.size / 2),
  playerEnemyBullet: (p: Position, b: EnemyBullet) =>
    Collision.circle(p, b, Config.player.size * Config.player.hitboxRatio, 4),
  playerEnemy: (p: Position, e: Enemy) =>
    Collision.circle(p, e, Config.player.size * Config.player.hitboxRatio, e.size / 2),
};

const EnemyAI = {
  shouldShoot: (e: Enemy, now: number) => e.canShoot && e.y > 0 && now - e.lastShotAt > e.fireRate,
  createBullets: (e: Enemy, target: Position) => {
    const dir = normalize({ x: target.x - e.x, y: target.y - e.y });
    const speed = 3.5;
    const baseVel = { x: dir.x * speed, y: dir.y * speed };
    const bullets = [EntityFactory.enemyBullet(e.x, e.y, baseVel)];
    if (e.enemyType === 'boss') {
      return [
        ...bullets,
        EntityFactory.enemyBullet(e.x, e.y, { x: baseVel.x - 1, y: baseVel.y }),
        EntityFactory.enemyBullet(e.x, e.y, { x: baseVel.x + 1, y: baseVel.y }),
        EntityFactory.enemyBullet(e.x - 20, e.y, { x: 0, y: 4 }),
        EntityFactory.enemyBullet(e.x + 20, e.y, { x: 0, y: 4 }),
      ];
    }
    return bullets;
  },
};

interface SoundDef {
  f: number;
  w: OscillatorType;
  g: number;
  d: number;
  ef?: number;
}

const createAudioSystem = () => {
  let ctx: AudioContext | null = null;
  const init = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
    return ctx;
  };
  const play = (name: string) => {
    if (!ctx) return;
    const defs: Record<string, SoundDef> = {
      shot: { f: 80, w: 'sine', g: 0.08, d: 0.06 },
      charged: { f: 60, w: 'triangle', g: 0.12, d: 0.2 },
      destroy: { f: 120, w: 'sawtooth', g: 0.07, d: 0.12, ef: 30 },
      hit: { f: 100, w: 'square', g: 0.1, d: 0.08 },
      item: { f: 440, w: 'sine', g: 0.1, d: 0.15 },
      bomb: { f: 60, w: 'sawtooth', g: 0.15, d: 0.4, ef: 20 },
    };
    const d = defs[name];
    if (!d) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime;
      o.frequency.value = d.f;
      o.type = d.w;
      g.gain.setValueAtTime(d.g, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + d.d);
      if (d.ef) o.frequency.exponentialRampToValueAtTime(d.ef, t + d.d);
      o.start(t);
      o.stop(t + d.d);
    } catch {}
  };
  return { init, play };
};

// ============================================================================
// Render Components
// ============================================================================

interface PlayerSpriteProps {
  x: number;
  y: number;
  opacity: number;
  shield: boolean;
}

const PlayerSprite = memo(function PlayerSprite({ x, y, opacity, shield }: PlayerSpriteProps) {
  return (
    <>
      {shield && (
        <div
          style={{
            position: 'absolute',
            left: x - 20,
            top: y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid #4af',
            opacity: 0.5,
            animation: 'pulse 0.5s infinite',
          }}
        />
      )}
      <svg
        style={{ position: 'absolute', left: x - 10, top: y - 10, opacity }}
        width={20}
        height={26}
        viewBox="0 0 24 32"
      >
        <defs>
          <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#1a3a5c" />
            <stop offset="50%" stopColor="#2d5a87" />
            <stop offset="100%" stopColor="#1a3a5c" />
          </linearGradient>
        </defs>
        <ellipse
          cx="12"
          cy="17"
          rx="8"
          ry="11"
          fill="url(#subGrad)"
          stroke="#4a8ac7"
          strokeWidth="0.7"
        />
        <ellipse
          cx="12"
          cy="13"
          rx="4"
          ry="2.5"
          fill="#0a1520"
          stroke="#4a8ac7"
          strokeWidth="0.3"
        />
        <rect x="10" y="3" width="4" height="5" fill="#3a6a9c" />
        <rect x="9" y="1" width="6" height="2" fill="#4a8ac7" rx="0.5" />
        <path d="M4 18 L2 22 L7 20 Z" fill="#2d5a87" />
        <path d="M20 18 L22 22 L17 20 Z" fill="#2d5a87" />
        <ellipse cx="12" cy="29" rx="3" ry="1.5" fill="rgba(100,200,255,0.4)" />
      </svg>
    </>
  );
});

const EnemySprite = memo(function EnemySprite({ enemy }: { enemy: Enemy }) {
  const color = ColorPalette.enemy[enemy.enemyType];
  const isBoss = enemy.enemyType === 'boss';
  return (
    <div
      style={{
        position: 'absolute',
        left: enemy.x - enemy.size / 2,
        top: enemy.y - enemy.size / 2,
      }}
    >
      <svg width={enemy.size} height={enemy.size} viewBox="0 0 40 40">
        <ellipse
          cx="20"
          cy="20"
          rx={isBoss ? 18 : 16}
          ry={isBoss ? 16 : 14}
          fill={color}
          opacity="0.9"
        />
        {isBoss && <ellipse cx="20" cy="20" rx="12" ry="10" fill="rgba(0,0,0,0.4)" />}
        <circle cx="13" cy="15" r={isBoss ? 4 : 3} fill="#f66" opacity="0.8" />
        <circle cx="27" cy="15" r={isBoss ? 4 : 3} fill="#f66" opacity="0.8" />
        {isBoss &&
          [0, 1, 2, 3].map(i => (
            <path
              key={i}
              d={`M${8 + i * 8} 34 Q${10 + i * 8} 42 ${6 + i * 9} 48`}
              stroke={color}
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />
          ))}
      </svg>
    </div>
  );
});

const BulletSprite = memo(function BulletSprite({ bullet }: { bullet: Bullet }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: bullet.x - bullet.size / 2,
        top: bullet.y - bullet.size / 2,
        width: bullet.size,
        height: bullet.size,
        borderRadius: '50%',
        background: bullet.charged
          ? 'radial-gradient(circle,#fff,#64c8ff,#06c)'
          : 'radial-gradient(circle,#fff,#64c8ff)',
        boxShadow: bullet.charged ? '0 0 15px #64c8ff' : '0 0 6px #64c8ff',
      }}
    />
  );
});

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onShoot: () => void;
  onCharge: (e: { type: string }) => void;
  charging: boolean;
}

const TouchControls = memo(function TouchControls({
  onMove,
  onShoot,
  onCharge,
  charging,
}: TouchControlsProps) {
  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(100,150,200,0.5)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const actStyle = (c: boolean): React.CSSProperties => ({
    width: 55,
    height: 55,
    borderRadius: '50%',
    background: c ? 'rgba(255,200,100,0.8)' : 'rgba(100,200,255,0.6)',
    border: `2px solid ${c ? '#fa6' : '#6cf'}`,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        display: 'flex',
        justifyContent: 'space-between',
        padding: 10,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative', width: 100, height: 100, pointerEvents: 'auto' }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(100,150,200,0.1)',
            border: '2px solid rgba(100,150,200,0.2)',
          }}
        />
        {[
          { l: '↑', t: 5, x: 36 },
          { l: '↓', t: 65, x: 36 },
          { l: '←', t: 35, x: 5 },
          { l: '→', t: 35, x: 67 },
        ].map((d, i) => (
          <button
            key={i}
            style={{ ...btnStyle, top: d.t, left: d.x }}
            onTouchStart={() =>
              onMove(d.l === '←' ? -1 : d.l === '→' ? 1 : 0, d.l === '↑' ? -1 : d.l === '↓' ? 1 : 0)
            }
            onTouchEnd={() => onMove(0, 0)}
            onMouseDown={() =>
              onMove(d.l === '←' ? -1 : d.l === '→' ? 1 : 0, d.l === '↑' ? -1 : d.l === '↓' ? 1 : 0)
            }
            onMouseUp={() => onMove(0, 0)}
          >
            {d.l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 15, alignItems: 'center', pointerEvents: 'auto' }}>
        <button style={actStyle(false)} onTouchStart={onShoot} onMouseDown={onShoot}>
          SHOT
        </button>
        <button
          style={actStyle(charging)}
          onTouchStart={onCharge}
          onTouchEnd={onCharge}
          onMouseDown={onCharge}
          onMouseUp={onCharge}
        >
          {charging ? 'CHARGE' : 'CHARGE'}
        </button>
      </div>
    </div>
  );
});

// Main component export
export default function DeepSeaShooterPage() {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'gameover' | 'ending'>('title');
  const [uiState, setUiState] = useState({
    stage: 1,
    score: 0,
    lives: 3,
    highScore: 0,
    power: 1,
    spreadTime: 0,
    shieldEndTime: 0,
    speedLevel: 0,
  });
  const [, forceRender] = useReducer(x => x + 1, 0) as [number, () => void];

  const gameData = useRef<GameState>({
    player: { x: 200, y: 480 },
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

  const audio = useRef(createAudioSystem());
  const raf = useRef<number | null>(null);

  useEffect(() => {
    getHighScore('deep_sea_shooter').then(h => {
      setUiState(prev => ({ ...prev, highScore: h }));
    });
  }, []);

  const startGame = useCallback(() => {
    audio.current.init();
    gameData.current = {
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
    };
    setUiState(p => ({
      ...p,
      score: 0,
      lives: 3,
      power: 1,
      stage: 1,
      shieldEndTime: 0,
      speedLevel: 0,
      spreadTime: 0,
    }));
    // Start game with loaded high score
    getHighScore('deep_sea_shooter').then(highScore => {
      setUiState(p => ({ ...p, highScore }));
    });
    setGameState('playing');
  }, []);

  const handleCharge = useCallback((e: { type: string }) => {
    const gd = gameData.current;
    if (e.type === 'touchstart' || e.type === 'mousedown') {
      gd.charging = true;
      gd.chargeStartTime = Date.now();
    } else if (gd.charging) {
      if (gd.chargeLevel >= 0.8) {
        gd.bullets.push(EntityFactory.bullet(gd.player.x, gd.player.y - 12, { charged: true }));
        audio.current.play('charged');
      }
      gd.charging = false;
      gd.chargeLevel = 0;
    }
  }, []);

  const handleInput = useCallback(
    (e: KeyboardEvent) => {
      const k = e.key;
      const isDown = e.type === 'keydown';
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'w',
          'a',
          's',
          'd',
          'z',
          'x',
          ' ',
        ].includes(k)
      ) {
        if (e.preventDefault) e.preventDefault();
        gameData.current.keys[k] = isDown;

        if (isDown && (k === 'z' || k === 'Z') && gameState === 'playing') {
          // Shoot logic
          const gd = gameData.current;
          const hasSpread = uiState.spreadTime > Date.now();
          const angles = hasSpread ? [-0.25, 0, 0.25] : uiState.power >= 3 ? [-0.1, 0.1] : [0];
          angles.forEach(a =>
            gd.bullets.push(
              EntityFactory.bullet(gd.player.x, gd.player.y - 12, { angle: -Math.PI / 2 + a })
            )
          );
          audio.current.play('shot');
        }
        if ((k === 'x' || k === 'X') && gameState === 'playing') {
          if (isDown && !gameData.current.charging) {
            gameData.current.charging = true;
            gameData.current.chargeStartTime = Date.now();
          } else if (!isDown && gameData.current.charging) {
            handleCharge({ type: 'mouseup' });
          }
        }
      }
    },
    [gameState, uiState.power, uiState.spreadTime, handleCharge]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleInput);
    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('keyup', handleInput);
    };
  }, [handleInput]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    // We need a ref to access the latest UI state inside the loop without re-binding the loop
    const uiStateRef = { current: uiState };
    const loop = () => {
      const gd = gameData.current;
      const now = Date.now();
      const stg = StageConfig[uiStateRef.current.stage];

      // Update Bubbles
      if (Math.random() < 0.07 && gd.bubbles.length < 35) gd.bubbles.push(EntityFactory.bubble());
      gd.bubbles = gd.bubbles
        .map(MovementStrategies.bubble)
        .filter(b => b.y > -10 && b.opacity > 0);

      // Player Move
      const k = gd.keys;
      let dx = gd.input.dx,
        dy = gd.input.dy;
      if (k['ArrowLeft'] || k['a']) dx = -1;
      if (k['ArrowRight'] || k['d']) dx = 1;
      if (k['ArrowUp'] || k['w']) dy = -1;
      if (k['ArrowDown'] || k['s']) dy = 1;
      const speed = Config.player.speed + (uiStateRef.current.speedLevel || 0);
      gd.player.x = clamp(15, Config.canvas.width - 15)(gd.player.x + dx * speed);
      gd.player.y = clamp(15, Config.canvas.height - 50)(gd.player.y + dy * speed);

      // Charge
      if (gd.charging) gd.chargeLevel = Math.min(1, (now - gd.chargeStartTime) / 800);

      // Spawning
      if (!gd.bossDefeated) {
        gd.spawnTimer += 16;
        if (
          gd.spawnTimer > stg.rate &&
          gd.enemies.length < Config.enemy.maxCount(uiStateRef.current.stage)
        ) {
          gd.enemies.push(
            EntityFactory.enemy(
              randomChoice(stg.types),
              randomFloat(30, 370),
              -40,
              uiStateRef.current.stage
            )
          );
          gd.spawnTimer = 0;
        }
        if (
          uiStateRef.current.score >= stg.bossScore &&
          !gd.enemies.some(e => e.enemyType === 'boss')
        ) {
          gd.enemies.push(EntityFactory.enemy('boss', 200, -60, uiStateRef.current.stage));
        }
      }

      // Update Entities
      gd.bullets = gd.bullets.map(MovementStrategies.bullet).filter(b => b.y > -20 && b.y < 580);
      gd.enemyBullets = gd.enemyBullets
        .map(MovementStrategies.enemyBullet)
        .filter(b => b.y < 575 && b.x > -15 && b.x < 415);
      gd.particles = gd.particles.map(MovementStrategies.particle).filter(p => p.life > 0);
      gd.items = gd.items.map(MovementStrategies.item).filter(i => i.y < 590);

      gd.enemies = gd.enemies
        .map(e => {
          const moveFn =
            e.enemyType === 'boss'
              ? MovementStrategies.boss
              : (['straight', 'sine', 'drift'] as const)[e.movementPattern] === 'straight'
                ? MovementStrategies.straight
                : (['straight', 'sine', 'drift'] as const)[e.movementPattern] === 'sine'
                  ? MovementStrategies.sine
                  : MovementStrategies.drift;
          const next = moveFn(e);
          if (e.canShoot && now - e.lastShotAt > e.fireRate && e.y > 0) {
            next.lastShotAt = now;
            gd.enemyBullets.push(...EnemyAI.createBullets(next, gd.player));
          }
          return next;
        })
        .filter(e => e.y < 600);

      // Collision: Bullet -> Enemy
      gd.bullets = gd.bullets.filter(b => {
        let hit = false;
        gd.enemies.forEach(e => {
          if (e.hp > 0 && Collision.bulletEnemy(b, e)) {
            hit = true;
            e.hp -= b.damage;
            if (e.hp <= 0) {
              audio.current.play('destroy');
              uiStateRef.current = {
                ...uiStateRef.current,
                score: uiStateRef.current.score + e.points,
              };
              setUiState(uiStateRef.current);
              if (e.enemyType === 'boss') {
                gd.bossDefeated = true;
                gd.bossDefeatedTime = now;
                gd.items.push(EntityFactory.item(e.x, e.y, 'bomb'));
              } else if (Math.random() < 0.2)
                gd.items.push(EntityFactory.item(e.x, e.y, randomChoice(Object.keys(ItemConfig))));
            } else {
              audio.current.play('hit');
            }
          }
        });
        return !hit || b.charged;
      });
      gd.enemies = gd.enemies.filter(e => e.hp > 0);

      // Collision: Player -> Item
      gd.items = gd.items.filter(i => {
        if (Collision.playerItem(gd.player, i)) {
          // Apply item effect
          audio.current.play('item');
          if (i.itemType === 'power') uiStateRef.current.power++;
          if (i.itemType === 'shield') uiStateRef.current.shieldEndTime = now + 8000;
          if (i.itemType === 'speed')
            uiStateRef.current.speedLevel = Math.min(3, (uiStateRef.current.speedLevel || 0) + 1);
          if (i.itemType === 'life')
            uiStateRef.current.lives = Math.min(
              Config.player.maxLives,
              uiStateRef.current.lives + 1
            );
          if (i.itemType === 'spread') uiStateRef.current.spreadTime = now + 10000;
          if (i.itemType === 'bomb') {
            gd.enemies.forEach(e => {
              if (e.enemyType !== 'boss') e.hp = 0;
            });
            gd.enemyBullets = [];
            uiStateRef.current.score += 500;
          }
          setUiState({ ...uiStateRef.current });
          return false;
        }
        return true;
      });

      // Collision: Player -> Enemy/Bullet
      if (!gd.invincible && now > (uiStateRef.current.shieldEndTime || 0)) {
        let hit = false;
        if (gd.enemies.some(e => Collision.playerEnemy(gd.player, e))) hit = true;
        if (gd.enemyBullets.some(b => Collision.playerEnemyBullet(gd.player, b))) hit = true;

        if (hit) {
          audio.current.play('destroy');
          uiStateRef.current.lives--;
          setUiState({ ...uiStateRef.current });
          if (uiStateRef.current.lives <= 0) {
            setGameState('gameover');
            saveScore('deep_sea_shooter', uiStateRef.current.score);
            // Update local high score if beaten
            if (uiStateRef.current.score > uiStateRef.current.highScore) {
              setUiState({ ...uiStateRef.current, highScore: uiStateRef.current.score });
            }
          } else {
            gd.invincible = true;
            gd.invincibleEndTime = now + 2000;
          }
        }
      }
      if (gd.invincible && now > gd.invincibleEndTime) gd.invincible = false;

      // Stage Clear
      if (gd.bossDefeated && now - gd.bossDefeatedTime > 2000) {
        if (uiStateRef.current.stage < 3) {
          uiStateRef.current.stage++;
          gd.bossDefeated = false;
          gd.enemies = [];
          gd.enemyBullets = [];
          setUiState({ ...uiStateRef.current });
        } else {
          setGameState('ending');
          saveScore('deep_sea_shooter', uiStateRef.current.score);
          if (uiStateRef.current.score > uiStateRef.current.highScore) {
            setUiState({ ...uiStateRef.current, highScore: uiStateRef.current.score });
          }
        }
      }

      forceRender();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _uiStateUsed = uiState; // uiStateはuiStateRefを通じて更新され、forceRenderで反映される

  const gd = gameData.current;
  const cfg = StageConfig[uiState.stage];

  if (gameState === 'title')
    return (
      <PageContainer>
        <StyledGameContainer role="region" aria-label="深海シューティングゲーム画面" tabIndex={0}>
          <FullScreenOverlay $bg="linear-gradient(180deg,#0a1a2a,#020810)">
            <GameTitle>深海迎撃</GameTitle>
            <GameSubTitle>DEEP SEA INTERCEPTOR</GameSubTitle>
            <InfoBox>
              <p>移動: 矢印キー</p>
              <p>ショット: Z</p>
              <p>チャージ: X</p>
            </InfoBox>
            <Button $primary onClick={startGame}>
              START GAME
            </Button>
            <div style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>
              HIGH SCORE: {uiState.highScore}
            </div>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );

  if (gameState === 'gameover')
    return (
      <PageContainer>
        <StyledGameContainer>
          <FullScreenOverlay $bg="#1a0a0a">
            <h1 style={{ color: '#f66' }}>MISSION FAILED</h1>
            <p>SCORE: {uiState.score}</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>HIGH SCORE: {uiState.highScore}</p>
            <div style={{ margin: '15px 0' }}>
              <ShareButton
                text={`Deep Sea Shooterで${uiState.score}点を獲得しました！`}
                hashtags={['DeepSeaShooter', 'GamePlatform']}
              />
            </div>
            <Button onClick={startGame}>RETRY</Button>
            <Button onClick={() => setGameState('title')}>TITLE</Button>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );

  if (gameState === 'ending')
    return (
      <PageContainer>
        <StyledGameContainer>
          <FullScreenOverlay $bg="#0a1a2a">
            <h1 style={{ color: '#6ac' }}>MISSION COMPLETE</h1>
            <p>FINAL SCORE: {uiState.score}</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>HIGH SCORE: {uiState.highScore}</p>
            <div style={{ margin: '15px 0' }}>
              <ShareButton
                text={`Deep Sea Shooterをクリア！スコア: ${uiState.score}点`}
                hashtags={['DeepSeaShooter', 'GamePlatform']}
              />
            </div>
            <Button $primary onClick={() => setGameState('title')}>
              RETURN TO TITLE
            </Button>
          </FullScreenOverlay>
        </StyledGameContainer>
      </PageContainer>
    );

  return (
    <PageContainer>
      <StyledGameContainer
        style={{ background: `linear-gradient(180deg,${cfg.bg},#010408)` }}
        role="region"
        aria-label="深海シューティングゲーム画面"
      >
        {gd.bubbles.map(b => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              border: `1px solid rgba(100,170,200,${b.opacity})`,
            }}
          />
        ))}

        {/* HUD */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            color: '#6ac',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          STAGE {uiState.stage}: {cfg.name}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#fff',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          SCORE: {uiState.score}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 120,
            color: '#aaa',
            fontSize: 10,
            fontWeight: 'bold',
          }}
        >
          HI: {uiState.highScore}
        </div>
        <div style={{ position: 'absolute', top: 22, right: 8, color: '#f66', fontSize: 12 }}>
          {'♥'.repeat(Math.max(0, uiState.lives))}
        </div>
        <div style={{ position: 'absolute', top: 36, right: 8, color: '#fa6', fontSize: 9 }}>
          {/* eslint-disable-next-line */}
          POW: {uiState.power} {uiState.spreadTime > Date.now() ? '| 3WAY' : ''}
        </div>

        {/* Entities */}
        <PlayerSprite
          x={gd.player.x}
          y={gd.player.y}
          // eslint-disable-next-line
          opacity={gd.invincible && Math.floor(Date.now() / 100) % 2 === 0 ? 0.5 : 1}
          // eslint-disable-next-line
          shield={Date.now() < uiState.shieldEndTime}
        />
        {gd.bullets.map(b => (
          <BulletSprite key={b.id} bullet={b} />
        ))}
        {gd.enemies.map(e => (
          <EnemySprite key={e.id} enemy={e} />
        ))}
        {gd.enemyBullets.map(b => (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: b.x - 4,
              top: b.y - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'radial-gradient(circle,#f66,#a33)',
              boxShadow: '0 0 6px #f33',
            }}
          />
        ))}
        {gd.items.map(i => {
          const ic = ItemConfig[i.itemType];
          return (
            <div
              key={i.id}
              style={{
                position: 'absolute',
                left: i.x - i.size / 2,
                top: i.y - i.size / 2,
                width: i.size,
                height: i.size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ic.color}, ${ic.color}88)`,
                boxShadow: `0 0 10px ${ic.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              {ic.label}
            </div>
          );
        })}
        {gd.particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              opacity: p.life / p.maxLife,
            }}
          />
        ))}

        {gd.charging && (
          <div
            style={{
              position: 'absolute',
              left: gd.player.x - 20,
              top: gd.player.y + 22,
              width: 40,
              height: 5,
              background: 'rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                width: `${gd.chargeLevel * 100}%`,
                height: '100%',
                background: gd.chargeLevel >= 0.8 ? '#6cf' : '#48a',
              }}
            />
          </div>
        )}

        <TouchControls
          onMove={(dx: number, dy: number) => {
            gd.input = { dx, dy };
          }}
          onShoot={() => {
            const gd = gameData.current;
            gd.bullets.push(EntityFactory.bullet(gd.player.x, gd.player.y - 12));
            audio.current.play('shot');
          }}
          onCharge={handleCharge}
          charging={gd.charging}
        />

        {gd.bossDefeated && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              color: '#6f8',
              fontSize: 15,
              fontWeight: 'bold',
              textShadow: '0 0 15px #0f0',
            }}
          >
            BOSS DEFEATED!
          </div>
        )}
      </StyledGameContainer>
    </PageContainer>
  );
}
