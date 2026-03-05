/**
 * 原始進化録 - PRIMAL PATH - ランダムイベント画面
 */
import React, { useRef, useEffect, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { RandomEventDef, EventChoice, SfxType, RunState } from '../types';
import { Screen, SubTitle, GamePanel, BiomeBg, WeatherParticles } from '../styles';
import { drawPlayer } from '../sprites';
import { getEffectHintColor, getEffectHintIcon } from '../game-logic';
import { renderParticles } from './shared';

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

const EventTitle = styled.div`
  font-size: 16px;
  color: #f0c040;
  text-shadow: 0 0 8px #f0c04040;
  text-align: center;
  margin-bottom: 6px;
`;

const EventDesc = styled.div`
  font-size: 11px;
  color: #c0b898;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 10px;
`;

const SituationText = styled.div`
  font-size: 13px;
  color: #e0d8c8;
  text-align: center;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 0 6px #f0c04030;
`;

/** リスクレベル別カラー */
const RISK_COLORS: Record<string, string> = {
  safe: '#50e090',
  risky: '#f0c040',
  dangerous: '#f05050',
};

const RISK_ICONS: Record<string, string> = {
  safe: '🟢',
  risky: '🟡',
  dangerous: '🔴',
};

const ChoiceBtn = styled.button<{ $risk: string; $disabled?: boolean }>`
  display: block;
  width: 100%;
  background: linear-gradient(180deg, #14141e, #0e0e16);
  border: 1px solid ${p => RISK_COLORS[p.$risk] ?? '#333'}40;
  color: #e0d8c8;
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  text-align: left;
  border-radius: 3px;
  transition: all 0.15s;
  user-select: none;

  &:hover {
    border-color: ${p => RISK_COLORS[p.$risk] ?? '#f0c040'};
    box-shadow: 0 0 8px ${p => (RISK_COLORS[p.$risk] ?? '#f0c040')}30;
  }
  &:active { transform: scale(0.97); }

  ${p => p.$disabled && css`
    opacity: 0.35;
    pointer-events: none;
  `}
`;

const ChoiceLabel = styled.div`
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const ChoiceHint = styled.div`
  font-size: 9px;
  color: #908870;
`;

const CostTag = styled.span`
  font-size: 9px;
  color: #e0c060;
  margin-left: 6px;
`;

const EffectHintBadge = styled.span<{ $color: string }>`
  font-size: 9px;
  color: ${p => p.$color};
  margin-left: 6px;
  opacity: 0.85;
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

  // バイオーム別のグローカラー
  const glowColor = EVENT_GLOW_COLORS[run.cBT as string];
  const handleChoose = (choice: EventChoice) => {
    playSfx('click');
    onChoose(choice);
  };

  /** コスト不足判定 */
  const canAfford = (choice: EventChoice): boolean => {
    if (!choice.cost) return true;
    if (choice.cost.type === 'bone') return run.bE >= choice.cost.amount;
    // hp_damage は常に選択可能（HP1以下にはならない）
    return true;
  };

  /** コスト表示テキスト */
  const costLabel = (choice: EventChoice): string => {
    if (!choice.cost) return '';
    if (choice.cost.type === 'bone') return `🦴${choice.cost.amount}`;
    if (choice.cost.type === 'hp_damage') return `❤️-${choice.cost.amount}`;
    return '';
  };

  return (
    <Screen $center>
      <BiomeBg $biome={biomeForBg} />
      <WeatherParticles $biome={biomeForBg}>
        {particles}
      </WeatherParticles>
      <SubTitle>🗺️ ランダムイベント</SubTitle>
      <EventPanel $glowColor={glowColor}>
        {/* プレイヤースプライト */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <canvas ref={canvasRef} aria-hidden="true" style={{
            width: 32, height: 44,
            imageRendering: 'pixelated',
          }} />
        </div>
        <EventTitle>{event.name}</EventTitle>
        <EventDesc>{event.description}</EventDesc>
        <SituationText>{event.situationText}</SituationText>

        {event.choices.map((choice) => {
          const affordable = canAfford(choice);
          return (
            <ChoiceBtn
              key={choice.label}
              $risk={choice.riskLevel}
              $disabled={!affordable}
              disabled={!affordable}
              onClick={() => handleChoose(choice)}
              style={{ borderLeftWidth: 3, borderLeftColor: `${getEffectHintColor(choice.effect)}60` }}
            >
              <ChoiceLabel>
                {RISK_ICONS[choice.riskLevel]} {choice.label}
                <EffectHintBadge $color={getEffectHintColor(choice.effect)}>
                  {getEffectHintIcon(choice.effect)}
                </EffectHintBadge>
                {choice.cost && (
                  <CostTag>
                    ({costLabel(choice)}{!affordable && ' 不足'})
                  </CostTag>
                )}
              </ChoiceLabel>
              <ChoiceHint>→ {choice.description}</ChoiceHint>
            </ChoiceBtn>
          );
        })}
      </EventPanel>
    </Screen>
  );
};
