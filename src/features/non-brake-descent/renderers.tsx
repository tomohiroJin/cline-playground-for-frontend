import React from 'react';
import { Config } from './config';
import { GameState, RampType, ObstacleType } from './constants';
import { CollisionDomain } from './domains/collision-domain';
import { GeometryDomain } from './domains/geometry-domain';
import { MathUtils } from './domains/math-utils';
import { ScoringDomain } from './domains/scoring-domain';
import { SpeedDomain } from './domains/speed-domain';
import {
  Building,
  ClearAnim,
  Cloud,
  DeathState,
  EffectState,
  GameStateValue,
  NearMissEffect,
  Obstacle,
  Particle,
  Player,
  Ramp,
  ScorePopup,
  TouchKeys,
} from './types';

export const CloudRenderer: React.FC<{ clouds: Cloud[] }> = ({ clouds }) => (
  <g>
    {clouds.map((cloud, index) => (
      <g key={index} opacity={cloud.opacity}>
        <ellipse cx={cloud.x} cy={cloud.y} rx={cloud.size} ry={cloud.size * 0.5} fill="#fff" />
        <ellipse
          cx={cloud.x - cloud.size * 0.4}
          cy={cloud.y + 5}
          rx={cloud.size * 0.6}
          ry={cloud.size * 0.35}
          fill="#fff"
        />
        <ellipse
          cx={cloud.x + cloud.size * 0.4}
          cy={cloud.y + 3}
          rx={cloud.size * 0.5}
          ry={cloud.size * 0.3}
          fill="#fff"
        />
      </g>
    ))}
  </g>
);

export const BuildingRenderer: React.FC<{ buildings: Building[]; camY: number }> = ({ buildings, camY }) => (
  <g>
    {buildings.map((building, index) => {
      const by = Config.screen.height - building.height + (camY * 0.1) % 50;
      return (
        <g key={index}>
          <rect x={building.x} y={by} width={building.width} height={building.height + 100} fill={building.color} />
          {Array.from({ length: building.windows }, (_, wi) =>
            Array.from({ length: Math.floor(building.width / 12) }, (_, wj) => (
              <rect
                key={`${wi}-${wj}`}
                x={building.x + 4 + wj * 12}
                y={by + 10 + wi * 25}
                width={6}
                height={12}
                fill={MathUtils.randomBool(0.7) ? '#ffee88' : '#334'}
                opacity={0.8}
              />
            ))
          )}
        </g>
      );
    })}
  </g>
);

const ObstacleRenderers: Record<Obstacle['t'], React.FC<{ ox: number; oy: number; frame: number; obs: Obstacle }>> = {
  [ObstacleType.HOLE_S]: ({ ox, oy }) => (
    <g>
      <ellipse cx={ox} cy={oy + 2} rx="28" ry="8" fill="#000" />
      <ellipse
        cx={ox}
        cy={oy}
        rx="26"
        ry="7"
        fill="none"
        stroke="#ff6666"
        strokeWidth="2"
        strokeDasharray="4,2"
      />
    </g>
  ),
  [ObstacleType.HOLE_L]: ({ ox, oy }) => (
    <g>
      <ellipse cx={ox} cy={oy + 2} rx="50" ry="10" fill="#000" />
      <ellipse cx={ox} cy={oy} rx="48" ry="9" fill="none" stroke="#ff2222" strokeWidth="3" />
      <text x={ox} y={oy + 4} textAnchor="middle" fill="#ff4444" fontSize="8" fontWeight="bold">
        DANGER
      </text>
    </g>
  ),
  [ObstacleType.ROCK]: ({ ox, oy }) => (
    <g>
      <polygon
        points={`${ox},${oy - 22} ${ox + 16},${oy + 4} ${ox - 16},${oy + 4}`}
        fill="#445"
        stroke="#778"
        strokeWidth="2"
      />
      <line x1={ox - 8} y1={oy - 8} x2={ox + 8} y2={oy + 2} stroke="#ff4444" strokeWidth="2" />
      <line x1={ox + 8} y1={oy - 8} x2={ox - 8} y2={oy + 2} stroke="#ff4444" strokeWidth="2" />
    </g>
  ),
  [ObstacleType.ENEMY]: ({ ox, oy, frame, obs }) => {
    const bounce = Math.sin(frame * 0.15 + (obs.phase ?? 0)) * 2;
    const walk = Math.sin(frame * 0.05 + (obs.walkPos ?? 0)) * 25 * (obs.moveDir ?? 1);
    return (
      <g transform={`translate(${walk}, ${bounce})`}>
        <ellipse cx={ox} cy={oy - 8} rx="16" ry="14" fill="#ee4444" stroke="#ffaaaa" strokeWidth="2" />
        <circle cx={ox - 5} cy={oy - 11} r="4" fill="#fff" />
        <circle cx={ox + 5} cy={oy - 11} r="4" fill="#fff" />
        <circle cx={ox - 4} cy={oy - 10} r="2" fill="#222" />
        <circle cx={ox + 6} cy={oy - 10} r="2" fill="#222" />
      </g>
    );
  },
  [ObstacleType.ENEMY_V]: ({ ox, oy, frame, obs }) => {
    const v = Math.sin(frame * (obs.vSpeed ?? 0.1)) * 20;
    const wing = Math.sin(frame * 0.4) * 10;
    return (
      <g transform={`translate(0, ${v})`}>
        <ellipse cx={ox} cy={oy - 12} rx="14" ry="12" fill="#8844ee" stroke="#bbaaff" strokeWidth="2" />
        <polygon
          points={`${ox - 20},${oy - 12} ${ox - 8},${oy - 8} ${ox - 8},${oy - 16}`}
          fill="#6622cc"
          transform={`rotate(${wing}, ${ox - 8}, ${oy - 12})`}
        />
        <polygon
          points={`${ox + 20},${oy - 12} ${ox + 8},${oy - 8} ${ox + 8},${oy - 16}`}
          fill="#6622cc"
          transform={`rotate(${-wing}, ${ox + 8}, ${oy - 12})`}
        />
        <circle cx={ox - 4} cy={oy - 14} r="3" fill="#fff" />
        <circle cx={ox + 4} cy={oy - 14} r="3" fill="#fff" />
      </g>
    );
  },
  [ObstacleType.SCORE]: ({ ox, oy, frame }) => {
    const pulse = 1 + Math.sin(frame * 0.2) * 0.12;
    return (
      <g transform={`translate(${ox}, ${oy - 10}) scale(${pulse})`}>
        <circle cx={0} cy={0} r="12" fill="#ffcc00" stroke="#fff" strokeWidth="2" />
        <text x={0} y={5} textAnchor="middle" fill="#885500" fontSize="14" fontWeight="bold">
          $
        </text>
      </g>
    );
  },
  [ObstacleType.REVERSE]: ({ ox, oy }) => (
    <g>
      <rect x={ox - 11} y={oy - 22} width="22" height="22" fill="#9944ff" stroke="#ddaaff" strokeWidth="2" rx="4" />
      <text x={ox} y={oy - 7} textAnchor="middle" fill="#fff" fontSize="14">
        ↺
      </text>
    </g>
  ),
  [ObstacleType.FORCE_JUMP]: ({ ox, oy }) => (
    <g>
      <rect x={ox - 11} y={oy - 22} width="22" height="22" fill="#4499ff" stroke="#aaddff" strokeWidth="2" rx="4" />
      <text x={ox} y={oy - 6} textAnchor="middle" fill="#fff" fontSize="16">
        ⇡
      </text>
    </g>
  ),
  [ObstacleType.TAKEN]: () => <></>,
  [ObstacleType.DEAD]: () => <></>,
};

export const ObstacleRenderer: React.FC<{ obs: Obstacle; ox: number; oy: number; frame: number }> = ({
  obs,
  ox,
  oy,
  frame,
}) => {
  if (!CollisionDomain.isActive(obs)) return <></>;
  const Renderer = ObstacleRenderers[obs.t];
  if (!Renderer) return <></>;
  return <Renderer ox={ox} oy={oy} frame={frame} obs={obs} />;
};

export const RampRenderer: React.FC<{
  ramp: Ramp;
  index: number;
  camY: number;
  frame: number;
  width: number;
  height: number;
  transitionEffect: number;
}> = ({ ramp, index, camY, frame, width, height, transitionEffect }) => {
  const ry = index * Config.ramp.height - camY;
  if (!GeometryDomain.isInViewport(ry, Config.ramp.height, Config.screen.height)) return <></>;
  const geo = GeometryDomain.getRampGeometry(ramp, width, height);
  const { lx, rx, ty, by, midY } = geo;
  const colors = GeometryDomain.getRampColor(index);
  const gradId = `rg${index}`;
  const flash = transitionEffect > 0 ? transitionEffect * 0.3 : 0;
  const pts =
    ramp.type === RampType.V_SHAPE
      ? `${lx},${ry + ty} ${(lx + rx) / 2},${ry + (midY ?? 0)} ${rx},${ry + by} ${rx},${
          ry + height + 5
        } ${lx},${ry + height + 5}`
      : `${lx},${ry + ty} ${rx},${ry + by} ${rx},${ry + height + 5} ${lx},${ry + height + 5}`;
  const line =
    ramp.type === RampType.V_SHAPE
      ? `M${lx},${ry + ty} L${(lx + rx) / 2},${ry + (midY ?? 0)} L${rx},${ry + by}`
      : `M${lx},${ry + ty} L${rx},${ry + by}`;
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={ramp.isGoal ? '#22ff88' : colors.base[0]} />
          <stop offset="100%" stopColor={ramp.isGoal ? '#118844' : colors.base[1]} />
        </linearGradient>
      </defs>
      <polygon points={pts} fill={`url(#${gradId})`} />
      {flash > 0 ? <polygon points={pts} fill="#fff" opacity={flash} /> : undefined}
      <path
        d={line}
        fill="none"
        stroke={ramp.isGoal ? '#88ffbb' : colors.stroke}
        strokeWidth="3"
      />
      {ramp.obs.map((obstacle, obsIndex) => {
        const ox = GeometryDomain.getObstacleX(obstacle, ramp, width);
        const oy = ry + GeometryDomain.getSlopeY(ox, geo, ramp.type);
        return <ObstacleRenderer key={obsIndex} obs={obstacle} ox={ox} oy={oy} frame={frame} />;
      })}
      {ramp.isGoal ? (
        <g>
          <rect
            x={width / 2 - 50}
            y={ry + height / 2 - 15}
            width="100"
            height="30"
            fill="rgba(0,255,100,0.4)"
            rx="6"
            stroke="#fff"
            strokeWidth="2"
          />
          <text x={width / 2} y={ry + height / 2 + 6} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">
            GOAL
          </text>
        </g>
      ) : undefined}
    </g>
  );
};

export const PlayerRenderer: React.FC<{
  player: Player;
  ramp: Ramp | undefined;
  camY: number;
  speed: number;
  death: DeathState | undefined;
  width: number;
  height: number;
  jetParticles: Particle[];
  dangerLevel: number;
}> = ({ player, ramp, camY, speed, death, width, height, jetParticles, dangerLevel }) => {
  if (!ramp) return <></>;
  const { width: PW, height: PH } = Config.player;
  const ry = player.ramp * Config.ramp.height - camY;
  const geo = GeometryDomain.getRampGeometry(ramp, width, height);
  const slopeY = GeometryDomain.getSlopeY(player.x, geo, ramp.type);
  const py = ry + slopeY + player.y - PH;
  const px = player.x;
  const color = SpeedDomain.getColor(speed);
  if (death) {
    const { frame: df, fast, type } = death;
    const dy = type === 'fall' ? df * 10 : -df * 4;
    const rot = df * (fast ? 35 : 12);
    const sc = Math.max(0.2, 1 - df * 0.025);
    return (
      <g
        transform={`translate(${px}, ${py + PH / 2 + dy}) rotate(${rot}) scale(${sc})`}
        opacity={Math.max(0, 1 - df * 0.025)}
      >
        <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} fill="#ff4444" rx="4" />
      </g>
    );
  }
  const tilt = ramp.dir * 15 + player.vx * 3;
  const jet = SpeedDomain.getNormalized(speed);
  const scared = dangerLevel > 0.7;
  return (
    <g transform={`translate(${px}, ${py + PH / 2}) rotate(${tilt})`}>
      {speed > 4 ? (
        <>
          <ellipse cx={-ramp.dir * 18} cy={6} rx={8 + jet * 25} ry={3 + jet * 3} fill="url(#jetGrad)" />
          <ellipse cx={-ramp.dir * 14} cy={6} rx={4 + jet * 8} ry={2} fill="#fff" opacity={0.8} />
          {jetParticles.map((particle, index) => (
            <circle
              key={index}
              cx={particle.x - px}
              cy={particle.y - (py + PH / 2)}
              r={2}
              fill={particle.color}
              opacity={particle.life / 25}
            />
          ))}
        </>
      ) : undefined}
      {speed > 8 ? (
        <g opacity={0.5}>
          {[0, 1, 2].map(index => (
            <line
              key={index}
              x1={-ramp.dir * (30 + index * 15)}
              y1={-5 + index * 5}
              x2={-ramp.dir * (50 + index * 15 + speed * 2)}
              y2={-5 + index * 5}
              stroke={color}
              strokeWidth={2 - index * 0.5}
            />
          ))}
        </g>
      ) : undefined}
      <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH * 0.65} fill={color} stroke="#fff" strokeWidth="1.5" rx="4" />
      <rect
        x={-PW / 2 + 3}
        y={-PH / 2 + 3}
        width={PW - 6}
        height={PH * 0.2}
        fill="rgba(255,255,255,0.35)"
        rx="2"
      />
      <g transform={`scale(${scared ? 1.3 : 1})`}>
        <circle cx={-4} cy={-PH / 4 + 1} r="3.5" fill="#fff" />
        <circle cx={5} cy={-PH / 4 + 1} r="3.5" fill="#fff" />
        <circle cx={scared ? -5 : -3.5} cy={-PH / 4 + 2} r="1.5" fill="#222" />
        <circle cx={scared ? 3 : 5.5} cy={-PH / 4 + 2} r="1.5" fill="#222" />
      </g>
      {scared ? <ellipse cx={0} cy={-PH / 4 + 8} rx="3" ry="2" fill="#222" /> : undefined}
      <rect x={-PW / 2 - 2} y={PH * 0.15} width={PW + 4} height="7" fill="#333" rx="2" />
      <circle cx={-7} cy={PH * 0.25} r="5" fill="#222" stroke="#555" strokeWidth="1.5" />
      <circle cx={7} cy={PH * 0.25} r="5" fill="#222" stroke="#555" strokeWidth="1.5" />
    </g>
  );
};

export const ParticlesRenderer: React.FC<{ particles: Particle[] }> = ({ particles }) => (
  <>
    {particles.map((particle, index) => (
      <circle
        key={index}
        cx={particle.x}
        cy={particle.y}
        r={2.5}
        fill={particle.color}
        opacity={particle.life / Config.particle.lifetime}
      />
    ))}
  </>
);

export const ScorePopupsRenderer: React.FC<{ popups: ScorePopup[] }> = ({ popups }) => (
  <>
    {popups.map((popup, index) => (
      <text
        key={index}
        x={popup.x}
        y={popup.y}
        textAnchor="middle"
        fill={popup.color}
        fontSize="14"
        fontWeight="bold"
        opacity={popup.life / 60}
      >
        {popup.text}
      </text>
    ))}
  </>
);

export const NearMissRenderer: React.FC<{ effects: NearMissEffect[] }> = ({ effects }) => (
  <>
    {effects.map((effect, index) => (
      <g key={index} opacity={effect.life / 30}>
        <circle cx={effect.x} cy={effect.y} r={20 * effect.scale} fill="none" stroke="#44ffaa" strokeWidth="3" />
        <text x={effect.x} y={effect.y - 30} textAnchor="middle" fill="#44ffaa" fontSize="12" fontWeight="bold">
          NEAR MISS!
        </text>
      </g>
    ))}
  </>
);

export const DangerVignette: React.FC<{ level: number }> = ({ level }) =>
  level < 0.3 ? (
    <></>
  ) : (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(255,0,0,${
          (level - 0.3) * 0.5
        }) 100%)`,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    />
  );

const ComboDisplay: React.FC<{ combo: number; timer: number }> = ({ combo, timer }) =>
  combo <= 1 || timer <= 0 ? (
    <></>
  ) : (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: '50%',
        transform: `translateX(-50%) scale(${1 + Math.sin(timer * 0.2) * 0.1})`,
        color: ['#fff', '#ffcc00', '#ff8800', '#ff4400', '#ff00ff'][Math.min(combo - 1, 4)],
        fontSize: 20,
        fontWeight: 'bold',
        textShadow: '0 0 10px currentColor',
      }}
    >
      {combo}x COMBO!
    </div>
  );

const StageIndicator: React.FC<{ rampIndex: number; total: number }> = ({ rampIndex, total }) => {
  const progress = rampIndex / total;
  const cfg =
    progress < 0.33
      ? { z: 'ZONE 1', c: '#44aaff' }
      : progress < 0.66
        ? { z: 'ZONE 2', c: '#ffaa44' }
        : { z: 'FINAL ZONE', c: '#ff4444' };
  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 10,
        color: cfg.c,
        fontSize: 10,
        fontWeight: 'bold',
        opacity: 0.8,
      }}
    >
      {cfg.z}
    </div>
  );
};

const SpeedMeter: React.FC<{ speed: number }> = ({ speed }) => {
  const col = SpeedDomain.getColor(speed);
  const pct = SpeedDomain.getNormalized(speed) * 100;
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#aaa', fontSize: 10 }}>SPEED</span>
      <div style={{ width: 60, height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, #00aa44, ${col})`,
            transition: 'all 0.1s',
          }}
        />
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 12,
      left: 10,
      width: 90,
      height: 6,
      background: '#222',
      borderRadius: 3,
    }}
  >
    <div
      style={{
        width: `${(current / total) * 100}%`,
        height: '100%',
        background: 'linear-gradient(90deg, #00ddff, #44ffaa)',
        borderRadius: 3,
      }}
    />
  </div>
);

export const UIOverlay: React.FC<{
  score: number;
  speed: number;
  player: Player;
  effect: EffectState;
  total: number;
  speedBonus: number;
  combo: number;
  comboTimer: number;
  nearMissCount: number;
}> = ({ score, speed, player, effect, total, speedBonus, combo, comboTimer, nearMissCount }) => (
  <>
    <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontSize: 15, fontWeight: 'bold', textShadow: '0 0 8px #000' }}>
      SCORE: {score}
    </div>
    {speedBonus > 0 ? (
      <div style={{ position: 'absolute', top: 28, left: 10, color: '#ffaa00', fontSize: 11 }}>
        SPEED BONUS: +{speedBonus}
      </div>
    ) : undefined}
    {nearMissCount > 0 ? (
      <div style={{ position: 'absolute', top: 42, left: 10, color: '#44ffaa', fontSize: 10 }}>
        NEAR MISS: x{nearMissCount}
      </div>
    ) : undefined}
    <ComboDisplay combo={combo} timer={comboTimer} />
    <StageIndicator rampIndex={player.ramp} total={total} />
    <SpeedMeter speed={speed} />
    <div style={{ position: 'absolute', top: 32, right: 10, color: '#888', fontSize: 11 }}>
      {player.ramp + 1} / {total}
    </div>
    <ProgressBar current={player.ramp} total={total} />
    {effect.type ? (
      <div
        style={{
          position: 'absolute',
          top: 65,
          right: 10,
          padding: '3px 8px',
          background: effect.type === 'reverse' ? 'rgba(150,50,255,0.85)' : 'rgba(50,130,255,0.85)',
          borderRadius: 4,
          color: '#fff',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      >
        {effect.type === 'reverse' ? '↺ REVERSE!' : '⇡ AUTO-JUMP!'}
      </div>
    ) : undefined}
  </>
);

export const CountdownOverlay: React.FC<{ count: number }> = ({ count }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 30,
    }}
  >
    <div
      style={{
        fontSize: 80,
        color: count === 0 ? '#44ffaa' : '#fff',
        fontWeight: 'bold',
        textShadow: `0 0 30px ${count === 0 ? '#44ffaa' : '#00eeff'}`,
      }}
    >
      {count === 0 ? 'GO!' : count}
    </div>
  </div>
);

const RankDisplay: React.FC<{ score: number; frame: number }> = ({ score, frame }) => {
  const rank = ScoringDomain.getRankData(score);
  const pulse = 1 + Math.sin(frame * 0.1) * 0.05;
  return (
    <div style={{ marginBottom: 15, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#aaa', marginBottom: 5 }}>{rank.message}</div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 'bold',
          color: rank.color,
          textShadow: `0 0 20px ${rank.color}`,
          transform: `scale(${pulse})`,
        }}
      >
        {rank.rank}
      </div>
    </div>
  );
};

export const ScreenOverlay: React.FC<{
  type: GameStateValue;
  score: number;
  hiScore: number;
  reachedRamp: number;
  totalRamps: number;
  isNewHighScore: boolean;
  clearAnim: ClearAnim;
  isMobile: boolean;
}> = ({ type, score, hiScore, reachedRamp, totalRamps, isNewHighScore, clearAnim, isMobile }) => {
  const frame = clearAnim.frame;
  const phase = clearAnim.phase;
  const base = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  } as const;
  const style = (bg: string) => ({ ...base, background: bg });
  if (type === GameState.TITLE)
    return (
      <div style={style('radial-gradient(ellipse at center, rgba(20,40,80,0.95) 0%, rgba(5,5,20,0.99) 100%)')}>
        <div
          style={{
            fontSize: isMobile ? 24 : 28,
            color: '#00eeff',
            textShadow: '0 0 25px #00eeff',
            marginBottom: 6,
            fontWeight: 'bold',
            letterSpacing: 3,
          }}
        >
          NON-BRAKE
        </div>
        <div
          style={{
            fontSize: isMobile ? 20 : 24,
            color: '#00eeff',
            textShadow: '0 0 25px #00eeff',
            marginBottom: 20,
            fontWeight: 'bold',
            letterSpacing: 3,
          }}
        >
          DESCENT
        </div>
        <div style={{ fontSize: isMobile ? 11 : 13, color: '#99bbdd', marginBottom: 25 }}>「止まるために、走り続けろ。」</div>
        {!isMobile ? (
          <div
            style={{
              background: 'rgba(0,150,200,0.12)',
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid rgba(0,200,255,0.25)',
              marginBottom: 20,
              fontSize: 12,
              color: '#aaccdd',
            }}
          >
            ← → 移動 / Z 加速 / X ジャンプ
          </div>
        ) : undefined}
        {!isMobile ? <div style={{ fontSize: 16, color: '#44ffaa' }}>PRESS SPACE</div> : undefined}
        {hiScore > 0 ? <div style={{ marginTop: 15, color: '#ffdd44', fontSize: 14 }}>HIGH SCORE: {hiScore}</div> : undefined}
      </div>
    );
  if (type === GameState.OVER)
    return (
      <div style={style('radial-gradient(ellipse at center, rgba(80,20,20,0.95) 0%, rgba(10,0,0,0.99) 100%)')}>
        <div
          style={{
            fontSize: isMobile ? 28 : 32,
            color: '#ff4444',
            textShadow: '0 0 25px #ff4444',
            marginBottom: 15,
            fontWeight: 'bold',
          }}
        >
          GAME OVER
        </div>
        <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8 }}>
          STAGE: {reachedRamp} / {totalRamps}
        </div>
        <RankDisplay score={score} frame={frame} />
        <div style={{ fontSize: 20, color: '#fff', marginBottom: 12 }}>SCORE: {score}</div>
        {isNewHighScore ? (
          <div
            style={{
              fontSize: 18,
              color: `hsl(${(frame * 5) % 360}, 100%, 60%)`,
              marginBottom: 20,
              textShadow: '0 0 20px currentColor',
              fontWeight: 'bold',
            }}
          >
            ★ NEW HIGH SCORE! ★
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#ffdd44', marginBottom: 20 }}>HIGH SCORE: {hiScore}</div>
        )}
        {!isMobile ? (
          <>
            <div style={{ fontSize: 14, color: '#44ffaa', marginBottom: 8 }}>SPACE: リトライ</div>
            <div style={{ fontSize: 12, color: '#888' }}>T: タイトルへ</div>
          </>
        ) : undefined}
      </div>
    );
  if (type === GameState.CLEAR) {
    if (phase === 1)
      return (
        <div
          style={{
            ...style('linear-gradient(180deg, rgba(20,80,50,0.3) 0%, rgba(0,30,15,0.5) 100%)'),
            justifyContent: 'flex-start',
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 700" style={{ position: 'absolute', top: 0, left: 0 }}>
            {Array.from({ length: 15 }, (_, index) => (
              <line
                key={index}
                x1={400}
                y1={50 + index * 40}
                x2={400 - frame * 20 - index * 25}
                y2={50 + index * 40}
                stroke={`rgba(0, 255, 150, ${0.4 - index * 0.02})`}
                strokeWidth="3"
              />
            ))}
            <g transform={`translate(${200 + frame * 10}, ${300 + Math.sin(frame * 0.5) * 5})`}>
              <ellipse cx={-frame * 3} cy={0} rx={Math.min(frame * 4, 100)} ry={5} fill="#00ff88" opacity="0.6" />
              <rect x={-12} y={-15} width={24} height={20} fill="#00ff88" stroke="#fff" strokeWidth="2" rx="4" />
              <circle cx={-4} cy={-8} r="3" fill="#fff" />
              <circle cx={6} cy={-8} r="3" fill="#fff" />
            </g>
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 28,
              color: '#44ffaa',
              textShadow: '0 0 30px #44ffaa',
              fontWeight: 'bold',
              opacity: Math.min(1, frame / 20),
            }}
          >
            ESCAPE SUCCESS!
          </div>
        </div>
      );
    return (
      <div style={style('radial-gradient(ellipse at center, rgba(20,80,50,0.95) 0%, rgba(0,10,5,0.99) 100%)')}>
        <div
          style={{
            fontSize: 32,
            color: '#44ffaa',
            textShadow: '0 0 30px #44ffaa',
            marginBottom: 15,
            fontWeight: 'bold',
          }}
        >
          ★ ESCAPE SUCCESS! ★
        </div>
        <RankDisplay score={score} frame={frame} />
        <div style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>FINAL SCORE</div>
        <div style={{ fontSize: 36, color: '#fff', marginBottom: 15, textShadow: '0 0 20px #44ffaa' }}>{score}</div>
        {isNewHighScore ? (
          <div
            style={{
              fontSize: 18,
              color: `hsl(${(frame * 5) % 360}, 100%, 60%)`,
              marginBottom: 20,
              fontWeight: 'bold',
            }}
          >
            ★ NEW HIGH SCORE! ★
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#ffdd44', marginBottom: 20 }}>HIGH SCORE: {hiScore}</div>
        )}
        {!isMobile ? (
          <>
            <div style={{ fontSize: 14, color: '#44ffaa', marginBottom: 8 }}>SPACE: もう一度プレイ</div>
            <div style={{ fontSize: 12, color: '#888' }}>T: タイトルへ</div>
          </>
        ) : undefined}
      </div>
    );
  }
  return <></>;
};

export const TouchButton: React.FC<{
  onTouchStart: (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
  onTouchEnd: (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
  style: React.CSSProperties;
  children: React.ReactNode;
}> = ({ onTouchStart, onTouchEnd, style, children }) => (
  <button
    onTouchStart={onTouchStart}
    onTouchEnd={onTouchEnd}
    onMouseDown={onTouchStart}
    onMouseUp={onTouchEnd}
    onMouseLeave={onTouchEnd}
    style={style}
  >
    {children}
  </button>
);

export const MobileControls: React.FC<{
  touchKeys: React.MutableRefObject<TouchKeys>;
  onTouch: (key: keyof TouchKeys, value: boolean) => (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ touchKeys, onTouch }) => {
  const base = (active: boolean, colors: { bg: string; border: string }): React.CSSProperties => ({
    width: 65,
    height: 65,
    borderRadius: 12,
    background: active ? '#00aaff' : `linear-gradient(180deg, ${colors.bg} 0%, #222 100%)`,
    border: `2px solid ${colors.border}`,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    cursor: 'pointer',
  });
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 400,
        marginTop: 10,
        padding: '0 10px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <TouchButton
          onTouchStart={onTouch('left', true)}
          onTouchEnd={onTouch('left', false)}
          style={base(touchKeys.current.left, { bg: '#334', border: '#556' })}
        >
          ◀
        </TouchButton>
        <TouchButton
          onTouchStart={onTouch('right', true)}
          onTouchEnd={onTouch('right', false)}
          style={base(touchKeys.current.right, { bg: '#334', border: '#556' })}
        >
          ▶
        </TouchButton>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <TouchButton
          onTouchStart={onTouch('jump', true)}
          onTouchEnd={onTouch('jump', false)}
          style={{ ...base(touchKeys.current.jump, { bg: '#363', border: '#4a4' }), borderRadius: '50%', fontSize: 12 }}
        >
          JUMP
        </TouchButton>
        <TouchButton
          onTouchStart={onTouch('accel', true)}
          onTouchEnd={onTouch('accel', false)}
          style={{ ...base(touchKeys.current.accel, { bg: '#643', border: '#a64' }), borderRadius: '50%', fontSize: 11 }}
        >
          ACCEL
        </TouchButton>
      </div>
    </div>
  );
};
