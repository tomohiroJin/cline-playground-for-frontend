import React, { useMemo } from 'react';
import { ConfettiContainer, ConfettiPiece } from './PuzzleBoard.styles';

const CONFETTI_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb', '#a66cff'];

const generateConfettiPieces = () =>
  Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 6,
  }));

type ConfettiOverlayProps = {
  completed: boolean;
};

const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({ completed }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const confettiPieces = useMemo(() => (completed ? generateConfettiPieces() : []), [completed]);

  if (!completed) return null;

  return (
    <ConfettiContainer>
      {confettiPieces.map(c => (
        <ConfettiPiece
          key={c.id}
          $left={c.left}
          $delay={c.delay}
          $duration={c.duration}
          $color={c.color}
          $size={c.size}
        />
      ))}
    </ConfettiContainer>
  );
};

export default ConfettiOverlay;
