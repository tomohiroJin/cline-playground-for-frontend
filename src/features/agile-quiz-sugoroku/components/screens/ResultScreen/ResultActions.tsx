/**
 * 結果画面のアクションボタンコンポーネント
 * リプレイ、コピー、シェアボタン
 */
import React, { useState, useMemo } from 'react';
import type { DerivedStats, GameStats } from '../../../types';
import { COLORS } from '../../../constants';
import { classifyTeamType } from '../../../team-classifier';
import {
  Button,
  HotkeyHint,
  ButtonGroup,
} from '../../styles';

interface ResultActionsProps {
  derived: DerivedStats;
  stats: GameStats;
  onReplay: () => void;
}

/**
 * 結果画面のアクションボタン群
 */
export const ResultActions: React.FC<ResultActionsProps> = ({ derived, stats, onReplay }) => {
  const [copied, setCopied] = useState(false);

  // チームタイプを判定（シェアテキスト用）
  const teamType = useMemo(() => {
    return classifyTeamType({
      stab: derived.stability,
      debt: stats.debt,
      emSuc: stats.emergencySuccess,
      sc: derived.sprintCorrectRates,
      tp: derived.correctRate,
      spd: derived.averageSpeed,
    });
  }, [derived, stats]);

  // シェアテキスト
  const shareText = `【アジャイル・クイズすごろく】
${teamType.emoji} ${teamType.name}
正答率: ${derived.correctRate}% | 負債: ${stats.debt}pt
Combo: ${stats.maxCombo} | 安定度: ${Math.round(derived.stability)}%
#AgileQuizSugoroku`;

  // X(Twitter) シェア用の intent URL
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  // コピー処理
  const handleCopyShare = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareText;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // コピー失敗時は何もしない
    }
  };

  return (
    <ButtonGroup>
      <Button onClick={onReplay}>
        ▶ Play Again
        <HotkeyHint>[Enter]</HotkeyHint>
      </Button>
      <Button $color={COLORS.muted} onClick={handleCopyShare}>
        {copied ? '✓ Copied!' : '📋 Copy'}
      </Button>
      <Button
        as="a"
        href={twitterShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        $color="#1d9bf0"
        style={{ textDecoration: 'none', display: 'inline-block' }}
      >
        X Share
      </Button>
    </ButtonGroup>
  );
};
