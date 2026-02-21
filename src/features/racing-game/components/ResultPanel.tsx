// リザルト画面 コンポーネント

import React from 'react';
import { ShareButton } from '../../../components/molecules/ShareButton';
import {
  Overlay,
  ResultCard,
  ResultTitle,
  ResultRow,
  ActionButton,
} from '../../../pages/RacingGamePage.styles';
import { Utils } from '../utils';
import { Highlight } from '../highlight';
import type { HighlightType } from '../types';

export interface ResultPanelProps {
  mode: string;
  results: {
    winnerName: string;
    winnerColor: string;
    times: { p1: number; p2: number };
    fastest: number;
    lapTimes?: number[];
  };
  highlightSummary: { type: HighlightType; count: number; totalScore: number }[];
  bestTime: string;
  onReset: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  mode, results, highlightSummary, bestTime, onReset,
}) => (
  <Overlay>
    <div style={{ fontSize: '1.5rem' }}>{mode === 'solo' ? '🏁' : '🏆👑🏆'}</div>
    <ResultTitle>{mode === 'solo' ? 'FINISH!' : `${results.winnerName} Wins!`}</ResultTitle>
    {mode !== 'solo' && (
      <div
        style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: results.winnerColor,
        }}
      >
        {results.winnerName}
      </div>
    )}
    <ResultCard>
      <ResultRow>
        <span>Total Time:</span> <span>{Utils.formatTime(results.times.p1)}</span>
      </ResultRow>
      <ResultRow>
        <span>Fastest Lap:</span> <span>{Utils.formatTime(results.fastest)}</span>
      </ResultRow>
    </ResultCard>

    {results.lapTimes && results.lapTimes.length > 0 && (
      <ResultCard>
        <div style={{ color: '#a5b4fc', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          ─── ラップタイム ───
        </div>
        {results.lapTimes.map((lt, i) => {
          const isFastest = lt === results.fastest;
          return (
            <ResultRow key={i}>
              <span>{isFastest ? '★ ' : ''}Lap {i + 1}:</span>
              <span style={isFastest ? { color: '#fbbf24', fontWeight: 'bold' } : {}}>
                {Utils.formatTime(lt)}
              </span>
            </ResultRow>
          );
        })}
      </ResultCard>
    )}

    {highlightSummary.length > 0 && (
      <ResultCard>
        <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          ─── ハイライト ───
        </div>
        {highlightSummary.map((s, i) => (
          <ResultRow key={i}>
            <span>{Highlight.LABELS[s.type]} × {s.count}</span>
            <span>+{s.totalScore}pt</span>
          </ResultRow>
        ))}
        <div style={{ color: '#ffeb3b', fontWeight: 'bold', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          合計: {highlightSummary.reduce((a, s) => a + s.totalScore, 0).toLocaleString()}pt
        </div>
      </ResultCard>
    )}

    <div style={{ color: '#fbbf24', fontSize: '1rem' }}>
      Best: {bestTime}
    </div>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ShareButton
        text={`Racing Gameで${Utils.formatTime(results.times.p1)}のタイムを出しました！`}
        hashtags={['RacingGame', 'GamePlatform']}
      />
    </div>
    <div style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>
      <ActionButton
        onClick={onReset}
        style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)' }}
      >
        🔄 もういちど
      </ActionButton>
    </div>
  </Overlay>
);
