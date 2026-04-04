/**
 * 原始進化録 - PRIMAL PATH - ランダムイベント画面
 * サブコンポーネントを統合するオーケストレータ
 */
import React, { useRef, useEffect, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { RandomEventDef, EventChoice, SfxType, RunState } from '../types';
import { Screen, SubTitle, GamePanel, BiomeBg, WeatherParticles } from '../styles';
import { drawPlayer } from '../sprites';
import { renderParticles } from './shared';
import { EventCard } from './event/EventCard';
import { EventChoices } from './event/EventChoices';

/* ===== Props ===== */

interface Props {
  event: RandomEventDef;
  run: RunState;
  onChoose: (choice: EventChoice) => void;
  playSfx: (t: SfxType) => void;
}

/* ===== スタイル ===== */

/** バイオーム別イベントグローカラー */
const EVENT_GLOW_COLORS: Record<string, string> = {
  grassland: '#50e090',
  glacier: '#50c8e8',
  volcano: '#f08050',
};

const eventGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px #f0c04010; }
  50% { box-shadow: 0 0 20px #f0c04030, 0 0 30px #f0c04015; }
`;

const EventPanel = styled(GamePanel)<{ $glowColor?: string }>`
  animation: ${eventGlow} 3s infinite;
  border-color: ${p => p.$glowColor ? `${p.$glowColor}40` : '#f0c04040'};
  max-width: 380px;
  ${p => p.$glowColor && css`
    box-shadow: 0 0 12px ${p.$glowColor}15;
  `}
`;

/* ===== コンポーネント ===== */

export const EventScreen: React.FC<Props> = ({ event, run, onChoose, playSfx }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const biomeForBg = run.cBT as string;
  const particles = useMemo(() => renderParticles(biomeForBg), [biomeForBg]);

  // プレイヤースプライト描画
  useEffect(() => {
    if (canvasRef.current) drawPlayer(canvasRef.current, 2, run.fe, run.awoken);
  }, [run.fe, run.awoken]);

  const glowColor = EVENT_GLOW_COLORS[run.cBT as string];

  const handleChoose = (choice: EventChoice) => {
    playSfx('click');
    onChoose(choice);
  };

  return (
    <Screen $center>
      <BiomeBg $biome={biomeForBg} />
      <WeatherParticles $biome={biomeForBg}>{particles}</WeatherParticles>
      <SubTitle>🗺️ ランダムイベント</SubTitle>
      <EventPanel $glowColor={glowColor}>
        {/* プレイヤースプライト */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <canvas ref={canvasRef} aria-hidden="true" style={{
            width: 48, height: 66,
            imageRendering: 'pixelated',
          }} />
        </div>
        <EventCard
          name={event.name}
          description={event.description}
          situationText={event.situationText}
        />
        <EventChoices
          choices={event.choices}
          currentBones={run.bE}
          onChoose={handleChoose}
        />
      </EventPanel>
    </Screen>
  );
};
