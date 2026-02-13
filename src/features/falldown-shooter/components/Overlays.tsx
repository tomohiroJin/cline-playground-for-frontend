// オーバーレイ画面コンポーネント群

import React, { useState, useEffect, ReactNode } from 'react';
import { ShareButton } from '../../../components/molecules/ShareButton';
import type { ParticleData } from '../types';
import { CONFIG, DEMO_SLIDES } from '../constants';
import { uid, pick } from '../utils';
import {
  OverlayContainer,
  OverlayContent,
  OverlayTitle,
  OverlayText,
  Button,
  DemoContainer,
  DemoContent,
  DemoTitle,
  DemoDot,
} from '../../../pages/FallingShooterPage.styles';

const OverlayComponent: React.FC<{ children: ReactNode }> = ({ children }) => (
  <OverlayContainer>
    <OverlayContent>{children}</OverlayContent>
  </OverlayContainer>
);

export const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <OverlayComponent>
    <OverlayTitle $color="#22d3ee">落ち物シューティング</OverlayTitle>
    <OverlayText>← → Space</OverlayText>
    <Button onClick={onStart}>Start</Button>
  </OverlayComponent>
);

export const ClearScreen: React.FC<{ stage: number; onNext: () => void }> = ({
  stage,
  onNext,
}) => (
  <OverlayComponent>
    <OverlayTitle $color="#4ade80">🎉 Stage {stage} Clear!</OverlayTitle>
    <Button onClick={onNext}>Next</Button>
  </OverlayComponent>
);

export const GameOverScreen: React.FC<{
  score: number;
  onRetry: () => void;
  onTitle: () => void;
}> = ({ score, onRetry, onTitle }) => (
  <OverlayComponent>
    <OverlayTitle $color="#ef4444">Game Over</OverlayTitle>
    <OverlayText $color="white">Score: {score}</OverlayText>
    <div style={{ marginBottom: '1rem' }}>
      <ShareButton
        text={`Falling Shooterで${score}点を獲得しました！`}
        hashtags={['FallingShooter', 'GamePlatform']}
      />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      <Button onClick={onRetry}>Retry</Button>
      <Button onClick={onTitle} $variant="secondary">
        Title
      </Button>
    </div>
  </OverlayComponent>
);

export const Fireworks: React.FC = () => {
  const [particles, setParticles] = useState<ParticleData[]>(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFEAA7', '#FFD700'];
    return Array(5)
      .fill(0)
      .flatMap(() => {
        const cx = 30 + Math.random() * 40;
        const cy = 25 + Math.random() * 20;
        return Array(12)
          .fill(0)
          .map((_, i) => {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 1.5 + Math.random();
            return {
              id: uid(),
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: pick(colors),
              life: 1,
            };
          });
      });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(p =>
        p
          .map(pt => ({
            ...pt,
            x: pt.x + pt.vx * 0.4,
            y: pt.y + pt.vy * 0.4,
            vy: pt.vy + 0.06,
            life: pt.life - 0.02,
          }))
          .filter(pt => pt.life > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            borderRadius: '9999px',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 5,
            height: 5,
            backgroundColor: p.color,
            opacity: p.life,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

export const EndingScreen: React.FC<{
  score: number;
  onRetry: () => void;
  onTitle: () => void;
}> = ({ score, onRetry, onTitle }) => (
  <OverlayComponent>
    <Fireworks />
    <OverlayTitle $color="#facc15">🎊 Clear! 🎊</OverlayTitle>
    <OverlayText $color="#67e8f9">Score: {score}</OverlayText>
    <div style={{ marginBottom: '1rem' }}>
      <ShareButton
        text={`Falling Shooterをクリア！スコア: ${score}点`}
        hashtags={['FallingShooter', 'GamePlatform']}
      />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      <Button onClick={onRetry}>Again</Button>
      <Button onClick={onTitle} $variant="secondary">
        Title
      </Button>
    </div>
  </OverlayComponent>
);

export const DemoScreen: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex(i => (i + 1) % DEMO_SLIDES.length),
      CONFIG.demo.slideInterval
    );
    return () => clearInterval(id);
  }, []);

  const slide = DEMO_SLIDES[index];

  return (
    <DemoContainer onClick={onDismiss} onMouseMove={onDismiss} onTouchStart={onDismiss}>
      <DemoContent>
        <DemoTitle>{slide.title}</DemoTitle>
        <div style={{ marginBottom: '1.5rem' }}>
          {slide.content.map((line, i) => (
            <p key={i} style={{ color: 'white', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {line}
            </p>
          ))}
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
        >
          {DEMO_SLIDES.map((_, i) => (
            <DemoDot key={i} $active={i === index} />
          ))}
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>タップまたはマウス移動で戻る</p>
      </DemoContent>
    </DemoContainer>
  );
};
