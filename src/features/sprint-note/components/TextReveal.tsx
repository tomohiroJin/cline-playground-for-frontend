import React, { useState, useEffect, useCallback } from 'react';
import { Paragraph } from './styles';

type TextRevealProps = {
  paragraphs: string[];
  onComplete: () => void;
};

// 段階的テキスト表示コンポーネント
const TextReveal: React.FC<TextRevealProps> = ({ paragraphs, onComplete }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= paragraphs.length) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [visibleCount, paragraphs.length, onComplete]);

  // クリック/タップで即時全表示
  const handleSkip = useCallback(() => {
    if (visibleCount < paragraphs.length) {
      setVisibleCount(paragraphs.length);
    }
  }, [visibleCount, paragraphs.length]);

  // paragraphs が変わったらリセット
  useEffect(() => {
    setVisibleCount(0);
  }, [paragraphs]);

  return (
    <div onClick={handleSkip} style={{ cursor: 'pointer' }}>
      {paragraphs.map((text, i) => (
        <Paragraph key={i} $visible={i < visibleCount} $delay={0}>
          {text}
        </Paragraph>
      ))}
    </div>
  );
};

export default TextReveal;
