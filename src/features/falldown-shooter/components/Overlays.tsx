// オーバーレイ画面コンポーネント群

import React, { useState, useEffect, ReactNode } from 'react';
import { ShareButton } from '../../../components/molecules/ShareButton';
import type { ParticleData, Difficulty } from '../types';
import { CONFIG, EFFECT, DEMO_SLIDES } from '../constants';
import { uid, pick } from '../utils';
import { DifficultySelector } from './DifficultySelector';
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

/** スコア表示 + シェア + ボタン群の共通部分 */
const ScoreOverlay: React.FC<{
  title: string;
  titleColor: string;
  score: number;
  shareText: string;
  primaryLabel: string;
  onPrimary: () => void;
  onTitle: () => void;
  onRanking?: () => void;
  children?: ReactNode;
}> = ({ title, titleColor, score, shareText, primaryLabel, onPrimary, onTitle, onRanking, children }) => (
  <OverlayComponent>
    {children}
    <OverlayTitle $color={titleColor}>{title}</OverlayTitle>
    <OverlayText $color="white">Score: {score}</OverlayText>
    <div style={{ marginBottom: '1rem' }}>
      <ShareButton
        text={shareText}
        hashtags={['FallingShooter', 'GamePlatform']}
      />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Button onClick={onPrimary}>{primaryLabel}</Button>
      <Button onClick={onTitle} $variant="secondary">
        Title
      </Button>
      {onRanking && (
        <Button onClick={onRanking} $variant="secondary">
          🏆
        </Button>
      )}
    </div>
  </OverlayComponent>
);

export const StartScreen: React.FC<{
  onStart: () => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onRanking: () => void;
}> = ({ onStart, difficulty, onDifficultyChange, onRanking }) => (
  <OverlayComponent>
    <OverlayTitle $color="#22d3ee">落ち物シューティング</OverlayTitle>
    <OverlayText>← → Space</OverlayText>
    <DifficultySelector selected={difficulty} onSelect={onDifficultyChange} />
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      <Button onClick={onStart}>Start</Button>
      <Button onClick={onRanking} $variant="secondary">
        🏆
      </Button>
    </div>
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
  onRanking?: () => void;
}> = ({ score, onRetry, onTitle, onRanking }) => (
  <ScoreOverlay
    title="Game Over"
    titleColor="#ef4444"
    score={score}
    shareText={`Falling Shooterで${score}点を獲得しました！`}
    primaryLabel="Retry"
    onPrimary={onRetry}
    onTitle={onTitle}
    onRanking={onRanking}
  />
);

export const Fireworks: React.FC = () => {
  const fw = EFFECT.fireworks;
  const [particles, setParticles] = useState<ParticleData[]>(() => {
    return Array(fw.count)
      .fill(0)
      .flatMap(() => {
        const cx = 30 + Math.random() * 40;
        const cy = 25 + Math.random() * 20;
        return Array(fw.particlesPerBurst)
          .fill(0)
          .map((_, i) => {
            const angle = (Math.PI * 2 * i) / fw.particlesPerBurst;
            const speed = 1.5 + Math.random();
            return {
              id: uid(),
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: pick([...fw.colors]),
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
            x: pt.x + pt.vx * fw.velocityScale,
            y: pt.y + pt.vy * fw.velocityScale,
            vy: pt.vy + fw.gravity,
            life: pt.life - fw.lifeLoss,
          }))
          .filter(pt => pt.life > 0)
      );
    }, fw.updateInterval);

    return () => clearInterval(interval);
  }, [fw]);

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
  onRanking?: () => void;
}> = ({ score, onRetry, onTitle, onRanking }) => (
  <ScoreOverlay
    title="🎊 Clear! 🎊"
    titleColor="#facc15"
    score={score}
    shareText={`Falling Shooterをクリア！スコア: ${score}点`}
    primaryLabel="Again"
    onPrimary={onRetry}
    onTitle={onTitle}
    onRanking={onRanking}
  >
    <Fireworks />
  </ScoreOverlay>
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
