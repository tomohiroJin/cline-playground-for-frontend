import React from 'react';
import type { GameState } from '../types';
import { computeRank } from '../utils';
import {
  ResultLayer,
  ResultTitle,
  ResultRank,
  ResultComment,
  ResultStats,
  ResultRow,
  ResultPt,
  ResultPerks,
  ResultHint,
} from './styles';

interface Props {
  active: boolean;
  game: GameState | null;
  hasGold: boolean;
}

// リザルト画面（ランク/統計/PT獲得）
const ResultScreen: React.FC<Props> = ({ active, game, hasGold }) => {
  if (!game) return <ResultLayer $active={active} />;

  // ゲーム状態から拡張情報を取得
  const extra = game as GameState & {
    _cleared?: boolean;
    _rank?: { g: string; c: string };
    _earnedPt?: number;
  };
  const cleared = extra._cleared ?? false;
  const rank = extra._rank ?? computeRank(game.score, cleared, game.stage);
  const earnedPt = extra._earnedPt ?? Math.max(1, Math.floor(game.score * 0.1));

  const stats: [string, string | number][] = [
    ['SCORE', game.score],
    ['STAGE', `${game.stage + 1}/${game.maxStg + 1}`],
    ['CYCLES', game.total],
    ['MAX COMBO', game.maxCombo],
    ['NEAR MISS', game.nearMiss],
    ['SHELTER', game.shelterSaves],
    ['HIGH RISK', game.riskScore],
  ];

  return (
    <ResultLayer $active={active}>
      <ResultTitle>{cleared ? 'ALL CLEAR!' : 'GAME OVER'}</ResultTitle>
      <ResultRank>{rank.g}</ResultRank>
      <ResultComment>{rank.c}</ResultComment>
      <ResultStats>
        {stats.map(([label, value]) => (
          <ResultRow key={label}>
            <span>{label}</span>
            <span>{value}</span>
          </ResultRow>
        ))}
      </ResultStats>
      <ResultPt>
        +{earnedPt}PT{hasGold ? ' (×2)' : ''}
      </ResultPt>
      {game.perks.length > 0 && (
        <ResultPerks>
          BUILD: {game.perks.map((p) => p.ic + p.nm).join(' ')}
        </ResultPerks>
      )}
      <ResultHint>PRESS ANY BUTTON</ResultHint>
    </ResultLayer>
  );
};

export default ResultScreen;
