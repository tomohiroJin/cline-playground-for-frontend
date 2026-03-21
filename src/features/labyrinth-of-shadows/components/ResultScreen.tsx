import React, { useState, useEffect } from 'react';
import { CONTENT } from '../constants';
import { ShareButton } from '../../../components/molecules/ShareButton';
import {
  Overlay,
  StoryText,
  ModalContent,
  ControlBtn,
} from '../presentation/styles/game.styles';

interface ResultScreenProps {
  type: keyof typeof CONTENT.stories;
  onDone: () => void;
  score?: number;
  time?: number;
  highScore?: number;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  type,
  onDone,
  score,
  time,
  highScore,
}) => {
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const lines = CONTENT.stories[type] || CONTENT.stories.intro;

  useEffect(() => {
    const t = setTimeout(
      () => (idx < lines.length - 1 ? setIdx(i => i + 1) : setReady(true)),
      1800
    );
    return () => clearTimeout(t);
  }, [idx, lines.length]);

  return (
    <Overlay>
      <div style={{ maxWidth: '36rem', textAlign: 'center', padding: '0 2rem' }}>
        {lines.slice(0, idx + 1).map((text, i) => (
          <StoryText key={i} $active={i === idx}>
            {text}
          </StoryText>
        ))}
      </div>

      {type !== 'intro' && ready && (
        <ModalContent style={{ marginTop: '1.5rem', width: '100%', maxWidth: '32rem' }}>
          <h3
            style={{
              color: type === 'victory' ? '#facc15' : '#ef4444',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            {type === 'victory' ? '🏆 クリア結果' : '💀 結果'}
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              color: 'white',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  color: type === 'victory' ? '#facc15' : 'white',
                }}
              >
                {(score || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>スコア</div>
            </div>
            {type === 'victory' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#22d3ee' }}>
                  {time || 0}秒
                </div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>クリアタイム</div>
              </div>
            )}
          </div>
          {highScore !== undefined && (
            <div style={{ color: '#fbbf24', fontSize: '1rem', marginBottom: '1rem' }}>
              HIGH SCORE: {highScore.toLocaleString()}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ShareButton
              text={`Maze Horrorを${type === 'victory' ? 'クリア！' : 'プレイ！'} スコア: ${score}点`}
              hashtags={['MazeHorror', 'GamePlatform']}
            />
          </div>
        </ModalContent>
      )}

      <div style={{ position: 'absolute', bottom: '2.5rem', display: 'flex', gap: '1rem' }}>
        <ControlBtn onClick={onDone} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
          スキップ
        </ControlBtn>
        {ready && (
          <ControlBtn
            onClick={onDone}
            style={{
              width: 'auto',
              padding: '0.75rem 2rem',
              backgroundColor: '#b91c1c',
              borderColor: '#ef4444',
            }}
          >
            {type === 'intro' ? '🎮 ゲーム開始' : '🏠 タイトルへ'}
          </ControlBtn>
        )}
      </div>
    </Overlay>
  );
};
