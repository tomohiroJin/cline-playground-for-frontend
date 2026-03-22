/**
 * プレイ画面コンポーネント
 *
 * SVG 描画、HUD、エフェクトを含むゲームプレイ画面。
 */
import React from 'react';
import { Config } from '../../config';
import { GameState } from '../../constants';
import { GeometryDomain } from '../../domains/geometry-domain';
import {
  BuildingRenderer,
  CloudRenderer,
  CountdownOverlay,
  DangerVignette,
  NearMissRenderer,
  ParticlesRenderer,
  PlayerRenderer,
  RampRenderer,
  ScorePopupsRenderer,
  UIOverlay,
} from '../../renderers';
import type {
  Building,
  Cloud,
  DeathState,
  EffectState,
  GameStateValue,
  NearMissEffect,
  Particle,
  Player,
  Ramp,
  ScorePopup,
} from '../../types';

interface PlayScreenProps {
  readonly state: GameStateValue;
  readonly player: Player;
  readonly ramps: readonly Ramp[];
  readonly camY: number;
  readonly speed: number;
  readonly score: number;
  readonly effect: EffectState;
  readonly speedBonus: number;
  readonly combo: number;
  readonly comboTimer: number;
  readonly nearMissCount: number;
  readonly dangerLevel: number;
  readonly death: DeathState | undefined;
  readonly particles: Particle[];
  readonly jetParticles: Particle[];
  readonly scorePopups: ScorePopup[];
  readonly nearMissEffects: NearMissEffect[];
  readonly clouds: Cloud[];
  readonly buildings: Building[];
  readonly transitionEffect: number;
  readonly countdown: number;
  readonly frameCount: number;
}

/** プレイ画面（SVG 描画 + HUD） */
export const PlayScreen: React.FC<PlayScreenProps> = ({
  state,
  player,
  ramps,
  camY,
  speed,
  score,
  effect,
  speedBonus,
  combo,
  comboTimer,
  nearMissCount,
  dangerLevel,
  death,
  particles,
  jetParticles,
  scorePopups,
  nearMissEffects,
  clouds,
  buildings,
  transitionEffect,
  countdown,
  frameCount,
}) => {
  const { width: W, height: H } = Config.screen;
  const { total: TOTAL, height: RAMP_H } = Config.ramp;
  const currentRamp = ramps[player.ramp] as Ramp | undefined;

  return (
    <>
      {state === GameState.COUNTDOWN ? <CountdownOverlay count={countdown} /> : undefined}
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="jetGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="30%" stopColor="#ffaa00" />
            <stop offset="100%" stopColor="#ff4400" stopOpacity="0" />
          </linearGradient>
        </defs>
        <BuildingRenderer buildings={buildings} camY={camY} />
        <CloudRenderer clouds={clouds} />
        {ramps.reduce<React.ReactElement[]>((acc, ramp, index) => {
          const ry = index * RAMP_H - camY;
          if (GeometryDomain.isInViewport(ry, RAMP_H, H)) {
            acc.push(
              <RampRenderer
                key={index}
                ramp={ramp}
                index={index}
                camY={camY}
                frame={frameCount}
                width={W}
                height={RAMP_H}
                transitionEffect={index === player.ramp ? transitionEffect : 0}
              />
            );
          }
          return acc;
        }, [])}
        <PlayerRenderer
          player={player}
          ramp={currentRamp}
          camY={camY}
          speed={speed}
          death={death}
          width={W}
          height={RAMP_H}
          jetParticles={jetParticles}
          dangerLevel={dangerLevel}
        />
        <ParticlesRenderer particles={particles} />
        <ScorePopupsRenderer popups={scorePopups} />
        <NearMissRenderer effects={nearMissEffects} />
      </svg>
      {state === GameState.PLAY ? (
        <>
          <UIOverlay
            score={score}
            speed={speed}
            player={player}
            effect={effect}
            total={TOTAL}
            speedBonus={speedBonus}
            combo={combo}
            comboTimer={comboTimer}
            nearMissCount={nearMissCount}
          />
          <DangerVignette level={dangerLevel} />
        </>
      ) : undefined}
    </>
  );
};
