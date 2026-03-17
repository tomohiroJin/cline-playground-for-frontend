/**
 * 統計パネルコンポーネント
 * チームタイプ、レーダーチャート、統計グリッド、スプリント履歴
 */
import React, { useState, useMemo } from 'react';
import type { DerivedStats, GameStats, SprintSummary, RadarDataPoint, TagStats, AnswerResultWithDetail } from '../../../domain/types';
import { clamp } from '../../../../../utils/math-utils';
import {
  COLORS,
  FONTS,
  getColorByThreshold,
  getInverseColorByThreshold,
} from '../../../constants';
import { classifyTeamType } from '../../../team-classifier';
import { getComboColor } from '../../../domain/quiz';
import { AQS_IMAGES } from '../../../images';
import { RadarChart } from '../../RadarChart';
import { BarChart } from '../../BarChart';
import {
  SectionBox,
  SectionTitle,
  StatsGrid,
  StatBox,
  StatLabel,
  StatValue,
  TypeCard,
  TypeEmoji,
  TypeLabel,
  TypeName,
  TypeDescription,
} from '../../styles';
import { GenreAnalysis } from './GenreAnalysis';

interface StatsPanelProps {
  derived: DerivedStats;
  stats: GameStats;
  log: SprintSummary[];
  tagStats?: TagStats;
  incorrectQuestions?: AnswerResultWithDetail[];
  sprintCount?: number;
}

/**
 * 結果画面の統計パネル
 */
export const StatsPanel: React.FC<StatsPanelProps> = ({
  derived,
  stats,
  log,
  tagStats,
  incorrectQuestions,
  sprintCount,
}) => {
  const [typeImgError, setTypeImgError] = useState(false);

  // チームタイプを判定
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

  // レーダーチャートデータ
  const radarData: RadarDataPoint[] = useMemo(() => {
    return [
      { label: 'チーム知識力', value: clamp(derived.correctRate / 100, 0, 1) },
      { label: '意思決定速度', value: clamp(1 - derived.averageSpeed / 15, 0, 1) },
      { label: 'プロセス安定性', value: clamp(derived.stability / 100, 0, 1) },
      { label: 'チーム連携力', value: clamp(stats.maxCombo / 7, 0, 1) },
      { label: '技術健全性', value: clamp(1 - stats.debt / 50, 0, 1) },
    ];
  }, [derived, stats]);

  return (
    <>
      {/* チームの成熟度 */}
      <TypeCard $color={teamType.color}>
        {(() => {
          const imgSrc = AQS_IMAGES.types[teamType.id as keyof typeof AQS_IMAGES.types];
          return !typeImgError && imgSrc ? (
            <img
              src={imgSrc}
              alt={teamType.name}
            onError={() => setTypeImgError(true)}
            style={{
              width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
              border: `3px solid ${teamType.color}`, marginBottom: 12,
            }}
          />
          ) : (
            <TypeEmoji>{teamType.emoji}</TypeEmoji>
          );
        })()}
        <TypeLabel>TEAM MATURITY</TypeLabel>
        <TypeName $color={teamType.color}>{teamType.name}</TypeName>
        <TypeDescription>{teamType.description}</TypeDescription>
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: `${teamType.color}08`, borderRadius: 6,
          border: `1px solid ${teamType.color}15`,
          fontSize: 11.5, color: COLORS.text, lineHeight: 1.6,
        }}>
          {teamType.feedback}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>
          📌 {teamType.nextStep}
        </div>
      </TypeCard>

      {/* スキルレーダー */}
      <SectionBox>
        <SectionTitle>SKILL RADAR</SectionTitle>
        <RadarChart data={radarData} size={220} />
      </SectionBox>

      {/* 統計グリッド */}
      <StatsGrid style={{ marginBottom: 18 }}>
        <StatBox $color={getColorByThreshold(derived.correctRate, 70, 50)}>
          <StatLabel>正答率</StatLabel>
          <StatValue $color={getColorByThreshold(derived.correctRate, 70, 50)}>
            {derived.correctRate}%
          </StatValue>
        </StatBox>
        <StatBox $color={getInverseColorByThreshold(derived.averageSpeed, 5, 10)}>
          <StatLabel>速度</StatLabel>
          <StatValue $color={getInverseColorByThreshold(derived.averageSpeed, 5, 10)}>
            {derived.averageSpeed.toFixed(1)}s
          </StatValue>
        </StatBox>
        <StatBox $color={getColorByThreshold(derived.stability, 70, 40)}>
          <StatLabel>安定度</StatLabel>
          <StatValue $color={getColorByThreshold(derived.stability, 70, 40)}>
            {Math.round(derived.stability)}%
          </StatValue>
        </StatBox>
        <StatBox $color={getInverseColorByThreshold(stats.debt, 10, 25)}>
          <StatLabel>負債</StatLabel>
          <StatValue $color={getInverseColorByThreshold(stats.debt, 10, 25)}>
            {stats.debt}pt
          </StatValue>
        </StatBox>
        <StatBox $color={getComboColor(stats.maxCombo)}>
          <StatLabel>Combo</StatLabel>
          <StatValue $color={getComboColor(stats.maxCombo)}>
            {stats.maxCombo}
          </StatValue>
        </StatBox>
        <StatBox $color={COLORS.accent}>
          <StatLabel>回答数</StatLabel>
          <StatValue $color={COLORS.accent}>{stats.totalQuestions}</StatValue>
        </StatBox>
      </StatsGrid>

      {/* スプリント履歴 */}
      <SectionBox>
        <SectionTitle>SPRINT HISTORY</SectionTitle>
        <BarChart logs={log} />
      </SectionBox>

      {/* 総合スコア */}
      <SectionBox>
        <SectionTitle>TOTAL SCORE</SectionTitle>
        <div style={{ textAlign: 'center', fontSize: 14, color: COLORS.text, fontFamily: FONTS.mono }}>
          {stats.totalCorrect} / {stats.totalQuestions} 問正解
        </div>
      </SectionBox>

      {/* ジャンル分析 + 不正解レビュー + サマリー */}
      <GenreAnalysis
        derived={derived}
        stats={stats}
        tagStats={tagStats}
        incorrectQuestions={incorrectQuestions}
        sprintCount={sprintCount}
      />
    </>
  );
};
