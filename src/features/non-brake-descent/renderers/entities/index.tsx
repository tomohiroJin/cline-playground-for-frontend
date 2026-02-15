import React from 'react';
import { Config } from '../../config';
import { RampType, ObstacleType } from '../../constants';
import { CollisionDomain } from '../../domains/collision-domain';
import { GeometryDomain } from '../../domains/geometry-domain';
import { SpeedDomain } from '../../domains/speed-domain';
import {
  DeathState,
  Obstacle,
  Particle,
  Player,
  Ramp,
} from '../../types';

// 障害物の個別レンダラー
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

// 障害物の描画コンポーネント
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

// ランプの描画コンポーネント
export const RampRenderer: React.FC<{
  ramp: Ramp;
  index: number;
  camY: number;
  frame: number;
  width: number;
  height: number;
  transitionEffect: number;
}> = React.memo(({ ramp, index, camY, frame, width, height, transitionEffect }) => {
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
}) as React.FC<{
  ramp: Ramp;
  index: number;
  camY: number;
  frame: number;
  width: number;
  height: number;
  transitionEffect: number;
}>;

// プレイヤーの描画コンポーネント
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
