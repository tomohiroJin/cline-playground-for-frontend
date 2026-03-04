/**
 * 振り返り画面コンポーネント
 */
import React, { useState } from 'react';
import { useKeys } from '../hooks';
import { SprintSummary, GameStats, CategoryStats } from '../types';
import {
  CONFIG,
  COLORS,
  CATEGORY_NAMES,
  getColorByThreshold,
  getInverseColorByThreshold,
  getStrengthText,
  getChallengeText,
} from '../constants';
import { AQS_IMAGES } from '../images';
import { ParticleEffect } from './ParticleEffect';
import { BarChart } from './BarChart';
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
  CategoryBarContainer,
  CategoryBadge,
  CategoryName,
  CategoryValue,
  SectionDivider,
  StrengthText,
  ChallengeText,
} from './styles';

interface RetrospectiveScreenProps {
  /** スプリント集計 */
  summary: SprintSummary;
  /** スプリントログ */
  log: SprintSummary[];
  /** ゲーム統計 */
  stats: GameStats;
  /** スプリント番号（0始まり） */
  sprint: number;
  /** 表示状態 */
  visible: boolean;
  /** 次へ進む時のコールバック */
  onNext: () => void;
  /** 保存して中断する時のコールバック */
  onSave?: () => void;
  /** スプリント数 */
  sprintCount?: number;
}

interface CategoryBarProps {
  cats: CategoryStats;
}

/** カテゴリバー */
const CategoryBar: React.FC<CategoryBarProps> = ({ cats }) => {
  const keys = Object.keys(cats);
  if (!keys.length) return null;

  return (
    <CategoryBarContainer>
      {keys.map((k) => {
        const c = cats[k];
        const rate = c.total ? Math.round((c.correct / c.total) * 100) : 0;
        const color = getColorByThreshold(rate, 70, 50);
        return (
          <CategoryBadge key={k} $color={color}>
            <CategoryName>{CATEGORY_NAMES[k] ?? k} </CategoryName>
            <CategoryValue $color={color}>{rate}%</CategoryValue>
          </CategoryBadge>
        );
      })}
    </CategoryBarContainer>
  );
};

/**
 * 振り返り画面
 */
/** トースト表示の自動消滅時間（ms） */
const TOAST_DURATION = 2000;

export const RetrospectiveScreen: React.FC<RetrospectiveScreenProps> = ({
  summary,
  log,
  stats,
  sprint,
  visible,
  onNext,
  onSave,
  sprintCount,
}) => {
  const [showToast, setShowToast] = useState(false);
  const isLast = sprint + 1 >= (sprintCount ?? CONFIG.sprintCount);

  /** 保存して中断 */
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
    if (e.key === 'Enter' || e.key === ' ') {
      onNext();
    }
  });

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />
      
      {/* Background Image Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${AQS_IMAGES.retro})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.12,
        filter: 'blur(2px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <Panel $visible={visible} style={{ position: 'relative', zIndex: 1 }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.accent,
              letterSpacing: 3,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
            }}
          >
            RETROSPECTIVE
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.text2,
              marginTop: 6,
            }}
          >
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

          {/* 緊急対応メッセージ */}
          {emMessage && <EmergencyMessage>{emMessage}</EmergencyMessage>}

          {/* カテゴリ別 */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                color: COLORS.accent,
                marginBottom: 8,
                letterSpacing: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
            >
              CATEGORY
            </div>
            <CategoryBar cats={summary.categoryStats} />
          </div>

          {/* 強み・課題 */}
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
          textAlign: 'center',
          marginBottom: 14,
          fontSize: 12,
          color: COLORS.muted,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          正解: {summary.correctCount}/{summary.totalCount}
        </div>

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

        {/* 保存完了トースト */}
        {showToast && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: COLORS.green,
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            ✓ 保存しました
          </div>
        )}
      </Panel>
    </PageWrapper>
  );
};
