/**
 * 画像 + 絵文字フォールバックコンポーネント
 */
import React, { useState } from 'react';

/** 画像 + 絵文字フォールバック（React 制御） */
export const ImageWithFallback: React.FC<{
  src: string | undefined;
  alt: string;
  emoji: string;
  size: number;
  borderColor: string;
}> = ({ src, alt, emoji, size, borderColor }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div style={{ fontSize: size * 0.6, minWidth: size, textAlign: 'center', flexShrink: 0 }}>
        {emoji}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        border: `2px solid ${borderColor}`, flexShrink: 0,
      }}
    />
  );
};
