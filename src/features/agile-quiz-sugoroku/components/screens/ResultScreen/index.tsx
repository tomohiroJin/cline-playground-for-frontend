/**
 * 結果画面コンポーネント（親コンポーネント）
 * GradeDisplay, StatsPanel, ResultActions を組み合わせる
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useKeys } from '../../../hooks';
import type { DerivedStats, GameStats, SprintSummary, TagStats, AnswerResultWithDetail } from '../../../domain/types';
import { getGrade } from '../../../constants';
import { ParticleEffect } from '../../ParticleEffect';
import {
  PageWrapper,
  ScrollablePanel,
  Scanlines,
} from '../../styles';
import { GradeDisplay } from './GradeDisplay';
import { StatsPanel } from './StatsPanel';
import { ResultActions } from './ResultActions';

interface ResultScreenProps {
  /** 派生統計 */
  derived: DerivedStats;
  /** ゲーム統計 */
  stats: GameStats;
  /** スプリントログ */
  log: SprintSummary[];
  /** リプレイ時のコールバック */
  onReplay: () => void;
  /** ジャンル別統計 */
  tagStats?: TagStats;
  /** 不正解問題リスト */
  incorrectQuestions?: AnswerResultWithDetail[];
  /** スプリント数 */
  sprintCount?: number;
}

/**
 * 結果画面
 */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  derived,
  stats,
  log,
  onReplay,
  tagStats,
  incorrectQuestions,
  sprintCount,
}) => {
  const [isSequenceComplete, setIsSequenceComplete] = useState(false);

  // グレードを計算
  const grade = useMemo(() => {
    return getGrade(derived.correctRate, derived.stability, derived.averageSpeed);
  }, [derived]);

  const handleSequenceComplete = useCallback(() => {
    setIsSequenceComplete(true);
  }, []);

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (isSequenceComplete) {
        onReplay();
      }
    }
  });

  return (
    <PageWrapper>
      <ParticleEffect count={30} />
      <Scanlines />

      <GradeDisplay
        grade={grade}
        onSequenceComplete={handleSequenceComplete}
      />

      <ScrollablePanel $fadeIn={false} style={{
        maxWidth: 580,
        opacity: isSequenceComplete ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <StatsPanel
          derived={derived}
          stats={stats}
          log={log}
          tagStats={tagStats}
          incorrectQuestions={incorrectQuestions}
          sprintCount={sprintCount}
        />

        <ResultActions
          derived={derived}
          stats={stats}
          onReplay={onReplay}
        />
      </ScrollablePanel>
    </PageWrapper>
  );
};
