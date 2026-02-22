/**
 * 結果画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { DerivedStats, GameStats, SprintSummary, RadarDataPoint } from '../types';
import { clamp } from '../../../utils/math-utils';
import {
  COLORS,
  getGrade,
  getSummaryText,
  getColorByThreshold,
  getInverseColorByThreshold,
} from '../constants';
import { classifyEngineerType } from '../engineer-classifier';
import { getComboColor } from '../combo-color';
import { AQS_IMAGES } from '../images';
import { ParticleEffect } from './ParticleEffect';
import { RadarChart } from './RadarChart';
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
  GradeCircle,
  GradeLabel,
  BuildSuccess,
  ReleaseVersion,
  TypeCard,
  TypeEmoji,
  TypeLabel,
  TypeName,
  TypeDescription,
  ButtonGroup,
  SummaryText,
} from './styles';
interface ResultScreenProps {
  /** 派生統計 */
  derived: DerivedStats;
  /** ゲーム統計 */
  stats: GameStats;
  /** スプリントログ */
  log: SprintSummary[];
  /** リプレイ時のコールバック */
  onReplay: () => void;
}

/**
 * 結果画面
 */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  derived,
  stats,
  log,
  onReplay,
}) => {
  const [copied, setCopied] = useState(false);
  const [typeImgError, setTypeImgError] = useState(false);

  // エンジニアタイプを判定
  const engineerType = useMemo(() => {
    return classifyEngineerType({
      stab: derived.stability,
      debt: stats.debt,
      emSuc: stats.emergencySuccess,
      sc: derived.sprintCorrectRates,
      tp: derived.correctRate,
      spd: derived.averageSpeed,
    });
  }, [derived, stats]);

  // グレードを計算
  const grade = useMemo(() => {
    return getGrade(derived.correctRate, derived.stability, derived.averageSpeed);
  }, [derived]);

  // レーダーチャートデータ
  const radarData: RadarDataPoint[] = useMemo(() => {
    return [
      { label: '正答率', value: clamp(derived.correctRate / 100, 0, 1) },
      { label: '速度', value: clamp(1 - derived.averageSpeed / 15, 0, 1) },
      { label: '安定度', value: clamp(derived.stability / 100, 0, 1) },
      { label: 'コンボ', value: clamp(stats.maxCombo / 7, 0, 1) },
      { label: '負債管理', value: clamp(1 - stats.debt / 50, 0, 1) },
    ];
  }, [derived, stats]);

  // シェアテキスト
  const shareText = `【アジャイル・クイズすごろく】
${engineerType.emoji} ${engineerType.name}
正答率: ${derived.correctRate}% | 負債: ${stats.debt}pt
Combo: ${stats.maxCombo} | 安定度: ${Math.round(derived.stability)}%`;

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

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onReplay();
    }
  });

  return (
    <PageWrapper>
      <ParticleEffect count={30} />
      <Scanlines />
      <Panel $fadeIn={false} style={{ maxWidth: 580 }}>
        {/* グレード表示 */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={AQS_IMAGES.gradeCelebration}
              alt=""
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              style={{
                position: 'absolute',
                inset: -20,
                width: 'calc(100% + 40px)',
                height: 'calc(100% + 40px)',
                objectFit: 'contain',
                opacity: 0.3,
                pointerEvents: 'none',
              }}
            />
            <GradeCircle $color={grade.color}>{grade.grade}</GradeCircle>
          </div>
          <GradeLabel $color={grade.color}>{grade.label}</GradeLabel>
          <img
            src={AQS_IMAGES.buildSuccess}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{
              width: '100%',
              height: 60,
              objectFit: 'cover',
              opacity: 0.2,
              borderRadius: 4,
              marginBottom: 4,
            }}
          />
          <BuildSuccess>BUILD SUCCESS</BuildSuccess>
          <ReleaseVersion>Release v1.0.0</ReleaseVersion>
        </div>

        {/* エンジニアタイプ */}
        <TypeCard $color={engineerType.color}>
          {!typeImgError && AQS_IMAGES.types[engineerType.id as keyof typeof AQS_IMAGES.types] ? (
            <img
              src={AQS_IMAGES.types[engineerType.id as keyof typeof AQS_IMAGES.types]!}
              alt={engineerType.name}
              onError={() => setTypeImgError(true)}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${engineerType.color}`,
                marginBottom: 12,
              }}
            />
          ) : (
            <TypeEmoji>{engineerType.emoji}</TypeEmoji>
          )}
          <TypeLabel>YOUR ENGINEER TYPE</TypeLabel>
          <TypeName $color={engineerType.color}>{engineerType.name}</TypeName>
          <TypeDescription>{engineerType.description}</TypeDescription>
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

        {/* サマリー */}
        <SectionBox style={{ marginBottom: 16 }}>
          <SectionTitle>SUMMARY</SectionTitle>
          <SummaryText>
            {getSummaryText(derived.correctRate, derived.averageSpeed, stats.debt, stats.emergencySuccess)}
          </SummaryText>
        </SectionBox>

        {/* ボタン */}
        <ButtonGroup>
          <Button onClick={onReplay}>
            ▶ Play Again
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
          <Button $color={COLORS.muted} onClick={handleCopyShare}>
            {copied ? '✓ Copied!' : '📋 Share'}
          </Button>
        </ButtonGroup>
      </Panel>
    </PageWrapper>
  );
};
