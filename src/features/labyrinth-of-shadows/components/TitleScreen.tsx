import React, { useState, useEffect, useCallback } from 'react';
import { CONFIG, CONTENT } from '../constants';
import type { Difficulty } from '../types';
import {
  PageContainer,
  Overlay,
  TitleContainer,
  TitleMain,
  TitleSub,
  TitleJapanese,
  MenuContainer,
  DiffButton,
  ButtonContent,
  ButtonInfo,
  ModalContent,
  DemoDots,
  DemoDot,
  HelpPanel,
  HelpGrid,
  KeyHelp,
} from '../../../pages/MazeHorrorPage.styles';

interface TitleScreenProps {
  onStart: (d: Difficulty) => void;
  highScores: Record<string, number>;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, highScores }) => {
  const [demoIdx, setDemoIdx] = useState(-1);
  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDemoActive(true);
      setDemoIdx(0);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!demoActive || demoIdx < 0) return;
    const t = setTimeout(() => setDemoIdx((demoIdx + 1) % CONTENT.demo.length), 4500);
    return () => clearTimeout(t);
  }, [demoActive, demoIdx]);

  const closeDemo = useCallback(() => {
    if (demoActive) {
      setDemoActive(false);
      setDemoIdx(-1);
    }
  }, [demoActive]);

  useEffect(() => {
    ['keydown', 'mousedown', 'touchstart'].forEach(e => window.addEventListener(e, closeDemo));
    return () =>
      ['keydown', 'mousedown', 'touchstart'].forEach(e => window.removeEventListener(e, closeDemo));
  }, [closeDemo]);

  const currentSlide = demoActive && demoIdx >= 0 ? CONTENT.demo[demoIdx] : null;

  return (
    <PageContainer>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '16rem',
            height: '16rem',
            background: 'red',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>

      {currentSlide && (
        <Overlay>
          <ModalContent>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentSlide.icon}</div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#facc15',
                marginBottom: '1.5rem',
              }}
            >
              {currentSlide.title}
            </h2>
            <ul style={{ width: '100%', marginBottom: '2rem' }}>
              {currentSlide.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    fontSize: '1.125rem',
                  }}
                >
                  <span style={{ color: '#4ade80' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}
            >
              <DemoDots>
                {CONTENT.demo.map((_, i) => (
                  <DemoDot key={i} $active={i === demoIdx} />
                ))}
              </DemoDots>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>クリックで閉じる</span>
            </div>
          </ModalContent>
        </Overlay>
      )}

      <TitleContainer>
        <TitleMain>LABYRINTH</TitleMain>
        <TitleSub>OF SHADOWS</TitleSub>
        <TitleJapanese>〜 影の迷宮 〜</TitleJapanese>

        <MenuContainer>
          {(
            Object.entries(CONFIG.difficulties) as [
              Difficulty,
              { label: string; size: number; time: number; lives: number; gradient: string },
            ][]
          ).map(([key, cfg]) => (
            <DiffButton key={key} onClick={() => onStart(key)} $gradientClass={cfg.gradient}>
              <ButtonContent>
                <div>{cfg.label}</div>
                <ButtonInfo>
                  <div>
                    {cfg.size}×{cfg.size}
                  </div>
                  <div>
                    {cfg.time}秒 | ❤️×{cfg.lives}
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: '0.75rem' }}>
                    HI: {highScores[key] || 0}
                  </div>
                </ButtonInfo>
              </ButtonContent>
            </DiffButton>
          ))}
        </MenuContainer>

        <HelpPanel>
          <HelpGrid>
            {[
              ['W A S D', '移動'],
              ['Space', '隠れる'],
              ['Shift', 'ダッシュ'],
              ['矢印キー', '移動'],
            ].map(([key, desc]) => (
              <KeyHelp key={key}>
                <span style={{ color: '#d1d5db' }}>{key}</span>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{desc}</div>
              </KeyHelp>
            ))}
          </HelpGrid>
          {!demoActive && (
            <div style={{ color: '#6b7280', fontSize: '0.75rem', animation: 'pulse 2s infinite' }}>
              💡 待つと詳しい説明が表示されます
            </div>
          )}
        </HelpPanel>
      </TitleContainer>
    </PageContainer>
  );
};
