import React from 'react';
import styled from 'styled-components';

export interface ShareButtonProps {
  text: string;
  url?: string;
  hashtags?: string[];
  className?: string;
}

const StyledButton = styled.button`
  background: #000;
  color: #fff;
  border: 1px solid #333;
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  &:hover {
    background: #111;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const ShareButton: React.FC<ShareButtonProps> = ({
  text,
  url = typeof window !== 'undefined' ? window.location.href : '',
  hashtags = ['GamePlatform'],
  className,
}) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Game Platform',
          text: `${text}\n#${hashtags.join(' #')}`,
          url,
        });
        return;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        // Fallback to Twitter if sharing fails (but not if cancelled)
        if ((error as Error).name === 'AbortError') return;
      }
    }

    const shareUrl = new URL('https://twitter.com/intent/tweet');
    shareUrl.searchParams.set('text', text);
    shareUrl.searchParams.set('url', url);
    if (hashtags.length > 0) {
      shareUrl.searchParams.set('hashtags', hashtags.join(','));
    }

    window.open(shareUrl.toString(), '_blank', 'width=550,height=420');
  };

  return (
    <StyledButton onClick={handleShare} className={className} aria-label="シェアする">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      共有する
    </StyledButton>
  );
};
