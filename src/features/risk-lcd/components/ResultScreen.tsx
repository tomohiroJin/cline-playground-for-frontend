import React, { useState, useCallback } from 'react';
import type { GameState } from '../types';
import { computeRank } from '../utils';
import { encodeShareUrl, encodeBuild } from '../utils/share';
import { getDailyId } from '../utils/seeded-random';
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
  ShareRow,
  ShareButton,
} from './styles';

interface Props {
  active: boolean;
  game: GameState | null;
  hasGold: boolean;
  equippedStyles?: string[];
}

// リザルト画面（ランク/統計/PT獲得/共有）
const ResultScreen: React.FC<Props> = ({ active, game, hasGold, equippedStyles }) => {
  const [copyText, setCopyText] = useState('COPY');

  // 共有URL生成
  const buildShareUrl = useCallback(() => {
    if (!game) return '';
    const build = encodeBuild(equippedStyles ?? ['standard'], game.perks);
    return encodeShareUrl({
      score: game.score,
      build,
      daily: game.dailyMode ? getDailyId() : undefined,
    });
  }, [game, equippedStyles]);

  // 共有テキスト生成
  const buildShareText = useCallback(() => {
    if (!game) return '';
    const lines: string[] = [];
    if (game.dailyMode) {
      lines.push(`RISK LCD Daily ${getDailyId()}`);
    } else {
      lines.push('RISK LCD');
    }
    const r = (game as GameState & { _rank?: { g: string } })._rank ?? computeRank(game.score, (game as GameState & { _cleared?: boolean })._cleared ?? false, game.stage);
    lines.push(`Score: ${game.score} | Rank: ${r.g}`);
    if (game.perks.length > 0) {
      lines.push(`Build: ${game.perks.map(p => p.nm).join(', ')}`);
    }
    lines.push(buildShareUrl());
    return lines.join('\n');
  }, [game, buildShareUrl]);

  // 共有ボタン処理
  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: 'RISK LCD',
        text: buildShareText(),
        url: buildShareUrl(),
      });
    } catch {
      // ユーザーがキャンセルした場合は何もしない
    }
  }, [buildShareText, buildShareUrl]);

  // コピーボタン処理
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setCopyText('COPIED!');
      setTimeout(() => setCopyText('COPY'), 2000);
    } catch {
      // フォールバック: テキスト選択
    }
  }, [buildShareUrl]);

  if (!game) return <ResultLayer $active={active} />;

  // ゲーム状態から拡張情報を取得
  const extra = game as GameState & {
    _cleared?: boolean;
    _rank?: { g: string; c: string };
    _earnedPt?: number;
    _dailyReward?: number;
  };
  const cleared = extra._cleared ?? false;
  const rank = extra._rank ?? computeRank(game.score, cleared, game.stage);
  const earnedPt = extra._earnedPt ?? Math.max(1, Math.floor(game.score * 0.1));
  const dailyReward = extra._dailyReward ?? 0;

  // 練習モードの判定
  const isPractice = game.practiceMode;
  const isDaily = game.dailyMode;

  // タイトル決定
  let title: string;
  if (isPractice) {
    title = cleared ? 'PRACTICE CLEAR!' : 'PRACTICE OVER';
  } else if (isDaily) {
    title = cleared ? 'DAILY CLEAR!' : 'DAILY OVER';
  } else {
    title = cleared ? 'ALL CLEAR!' : 'GAME OVER';
  }

  const stats: [string, string | number][] = [
    ['SCORE', game.score],
    ['STAGE', `${game.stage + 1}/${game.maxStg + 1}`],
    ['CYCLES', game.total],
    ['MAX COMBO', game.maxCombo],
    ['NEAR MISS', game.nearMiss],
    ['SHELTER', game.shelterSaves],
    ['HIGH RISK', game.riskScore],
  ];

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <ResultLayer $active={active}>
      <ResultTitle>{title}</ResultTitle>
      <ResultRank>{rank.g}</ResultRank>
      <ResultComment>
        {isPractice ? '練習モードです。' : rank.c}
      </ResultComment>
      <ResultStats>
        {stats.map(([label, value]) => (
          <ResultRow key={label}>
            <span>{label}</span>
            <span>{value}</span>
          </ResultRow>
        ))}
      </ResultStats>
      <ResultPt>
        {isPractice ? (
          'PT獲得なし'
        ) : (
          <>
            +{earnedPt}PT{hasGold ? ' (×2)' : ''}
            {dailyReward > 0 && ` (DAILY+${dailyReward})`}
          </>
        )}
      </ResultPt>
      {game.perks.length > 0 && (
        <ResultPerks>
          BUILD: {game.perks.map((p) => p.ic + p.nm).join(' ')}
        </ResultPerks>
      )}
      {!isPractice && (
        <ShareRow>
          {canShare && (
            <ShareButton onClick={handleShare}>SHARE</ShareButton>
          )}
          <ShareButton onClick={handleCopy}>{copyText}</ShareButton>
        </ShareRow>
      )}
      <ResultHint>PRESS ANY BUTTON</ResultHint>
    </ResultLayer>
  );
};

export default ResultScreen;
