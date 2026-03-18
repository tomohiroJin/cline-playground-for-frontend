/**
 * 振り返り画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { SprintSummary, GameStats } from '../domain/types';
import {
  CONFIG,
  COLORS,
  getColorByThreshold,
  getInverseColorByThreshold,
  getStrengthText,
  getChallengeText,
} from '../constants';
import { AQS_IMAGES } from '../images';
import { getNarrativeComment } from '../character-narrative';
import { ParticleEffect } from './ParticleEffect';
import { BarChart } from './BarChart';
import { CategoryBar } from './CategoryBar';
import { NarrativeComment } from './NarrativeComment';
import { SaveToast } from './SaveToast';
import {
  PageWrapper,
  Panel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
  StatsGrid,
  StatBox,
  StatLabel,
  StatValue,
  EmergencyMessage,
  SectionDivider,
  StrengthText,
  ChallengeText,
} from './styles';

interface RetrospectiveScreenProps {
  summary: SprintSummary;
  log: SprintSummary[];
  stats: GameStats;
  sprint: number;
  visible: boolean;
  onNext: () => void;
  onSave?: () => void;
  sprintCount?: number;
}

/** トースト表示の自動消滅時間（ms） */
const TOAST_DURATION = 2000;

export const RetrospectiveScreen: React.FC<RetrospectiveScreenProps> = ({
  summary, log, stats, sprint, visible, onNext, onSave, sprintCount,
}) => {
  const [showToast, setShowToast] = useState(false);
  const isLast = sprint + 1 >= (sprintCount ?? CONFIG.sprintCount);

  const narrative = useMemo(() => getNarrativeComment({
    sprintNumber: summary.sprintNumber,
    phase: 'retro',
    correctRate: summary.correctRate,
  }), [summary.sprintNumber, summary.correctRate]);

  const narrativeCharImg = AQS_IMAGES.characters[narrative.characterId as keyof typeof AQS_IMAGES.characters];

  const handleSave = () => {
    if (!onSave) return;
    onSave();
    setShowToast(true);
    setTimeout(() => setShowToast(false), TOAST_DURATION);
  };

  const emMessage = summary.hadEmergency
    ? `🚨 緊急対応 — ${summary.emergencySuccessCount > 0 ? '対応成功！' : '対応失敗…'}`
    : null;

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') onNext();
  });

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />

      {/* 背景画像レイヤー */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${AQS_IMAGES.retro})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.12, filter: 'blur(2px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Panel $visible={visible} style={{ position: 'relative', zIndex: 1 }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            fontSize: 10, color: COLORS.accent, letterSpacing: 3,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
          }}>
            RETROSPECTIVE
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text2, marginTop: 6 }}>
            Sprint {summary.sprintNumber} 振り返り
          </div>
        </div>

        {/* 統計 */}
        <SectionBox>
          <StatsGrid style={{ marginBottom: 16 }}>
            <StatBox $color={getColorByThreshold(summary.correctRate, 70, 50)}>
              <StatLabel>正答率</StatLabel>
              <StatValue $color={getColorByThreshold(summary.correctRate, 70, 50)}>
                {summary.correctRate}%
              </StatValue>
            </StatBox>
            <StatBox $color={getInverseColorByThreshold(summary.averageSpeed, 5, 10)}>
              <StatLabel>平均速度</StatLabel>
              <StatValue $color={getInverseColorByThreshold(summary.averageSpeed, 5, 10)}>
                {summary.averageSpeed.toFixed(1)}s
              </StatValue>
            </StatBox>
            <StatBox $color={getInverseColorByThreshold(summary.debt, 10, 25)}>
              <StatLabel>累積負債</StatLabel>
              <StatValue $color={getInverseColorByThreshold(summary.debt, 10, 25)}>
                {summary.debt}pt
              </StatValue>
            </StatBox>
          </StatsGrid>

          {emMessage && <EmergencyMessage>{emMessage}</EmergencyMessage>}

          {/* カテゴリ別 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 10, color: COLORS.accent, marginBottom: 8,
              letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            }}>
              CATEGORY
            </div>
            <CategoryBar cats={summary.categoryStats} />
          </div>

          <SectionDivider>
            <StrengthText>✓ 強み: {getStrengthText(summary.correctRate)}</StrengthText>
            <ChallengeText>
              △ 課題: {getChallengeText(stats.debt, summary.averageSpeed, summary.correctRate)}
            </ChallengeText>
          </SectionDivider>
        </SectionBox>

        {/* スプリントトレンド */}
        {log.length > 1 && (
          <SectionBox>
            <SectionTitle>SPRINT TREND</SectionTitle>
            <BarChart logs={log} />
          </SectionBox>
        )}

        {/* 総合スコア */}
        <div style={{
          textAlign: 'center', marginBottom: 14, fontSize: 12,
          color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace",
        }}>
          正解: {summary.correctCount}/{summary.totalCount}
        </div>

        <NarrativeComment characterImage={narrativeCharImg} text={narrative.text} />

        {/* ボタンエリア */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Button
            $color={isLast ? COLORS.green : COLORS.accent}
            onClick={onNext}
            style={{ padding: '14px 44px' }}
          >
            {isLast ? '▶ Release v1.0.0' : `▶ Sprint ${sprint + 2}`}
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
          {onSave && (
            <Button
              $color={COLORS.muted}
              onClick={handleSave}
              style={{ padding: '8px 24px', fontSize: 11 }}
            >
              💾 保存して中断
            </Button>
          )}
        </div>

        <SaveToast visible={showToast} />
      </Panel>
    </PageWrapper>
  );
};
