/**
 * 灰燼の城壁 - 戦闘コントロール
 *
 * 戦闘リプレイの再生速度切替とスキップ。反復0では計測装置を兼ねる
 * （スキップ・早送りの使用率が「観戦が退屈か」の判定項目になる）。
 * ラベルは絵文字に意味を託さず日本語テキストで示す（S1 の表現方針）。
 */
import React from 'react';
import styled from 'styled-components';
import type { BattleSpeed } from '../application/ports/play-log-port';

const Bar = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #8b2635;
  background: ${({ $active }) => ($active ? '#8b2635' : 'transparent')};
  color: #e8ded2;
  cursor: pointer;
`;

const SPEED_LABELS: { value: BattleSpeed; label: string }[] = [
  { value: 1, label: '等速' },
  { value: 2, label: '2倍速' },
  { value: 4, label: '4倍速' },
];

interface Props {
  speed: BattleSpeed;
  onChangeSpeed: (speed: BattleSpeed) => void;
  onSkip: () => void;
}

export const BattleControls: React.FC<Props> = ({ speed, onChangeSpeed, onSkip }) => (
  <Bar>
    {SPEED_LABELS.map(({ value, label }) => (
      <ControlButton
        key={value}
        $active={speed === value}
        aria-pressed={speed === value}
        onClick={() => onChangeSpeed(value)}
      >
        {label}
      </ControlButton>
    ))}
    <ControlButton onClick={onSkip}>スキップ</ControlButton>
  </Bar>
);
