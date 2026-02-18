/**
 * プロローグ画面コンポーネント
 */
import React, { useState, useEffect } from 'react';
import {
  Overlay,
  StoryText,
  SkipButton,
} from '../../../../pages/IpnePage.styles';
import { getPrologueStory } from '../../story';
import prologueBg from '../../../../assets/images/ipne_prologue_bg.webp';
import prologueBgMobile from '../../../../assets/images/ipne_prologue_bg_mobile.webp';

/**
 * プロローグ画面コンポーネント
 */
export const PrologueScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const [textIndex, setTextIndex] = useState(0);
  const prologueLines = getPrologueStory().lines;

  useEffect(() => {
    if (textIndex < prologueLines.length - 1) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // 最後のテキスト表示後、3秒待って自動遷移
      const autoSkipTimer = setTimeout(() => {
        onSkip();
      }, 3000);
      return () => clearTimeout(autoSkipTimer);
    }
  }, [textIndex, prologueLines.length, onSkip]);

  return (
    <Overlay $bgImage={prologueBg} $bgImageMobile={prologueBgMobile}>
      <div
        style={{
          width: '100%',
          maxWidth: '48rem',
          textAlign: 'center',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {prologueLines.slice(0, textIndex + 1).map((text, i) => (
          <StoryText key={i} $active={i === textIndex}>
            {text}
          </StoryText>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '2.5rem' }}>
        <SkipButton onClick={onSkip} aria-label="スキップ">
          スキップ
        </SkipButton>
      </div>
    </Overlay>
  );
};
