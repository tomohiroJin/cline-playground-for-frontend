/**
 * 結果画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { EngineerType, DerivedStats, GameStats, SprintSummary, RadarDataPoint } from '../types';
import { clamp } from '../../../utils/math-utils';
import {
  COLORS,
  ENGINEER_TYPES,
  getGrade,
  getSummaryText,
  getColorByThreshold,
  getInverseColorByThreshold,
} from '../constants';
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
import { ClassifyStats } from '../types';

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

/** エンジニアタイプを判定 */
function classifyEngineerType(data: ClassifyStats): EngineerType {
  return ENGINEER_TYPES.find((t) => t.c(data)) ?? ENGINEER_TYPES[ENGINEER_TYPES.length - 1];
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

  // エンジニアタイプを判定
  const engineerType = useMemo(() => {
    return classifyEngineerType({
      stab: derived.stab,
      debt: stats.debt,
      emSuc: stats.emS,
      sc: derived.sc,
      tp: derived.tp,
      spd: derived.spd,
    });
  }, [derived, stats]);

  // グレードを計算
  const grade = useMemo(() => {
    return getGrade(derived.tp, derived.stab, derived.spd);
  }, [derived]);

  // レーダーチャートデータ
  const radarData: RadarDataPoint[] = useMemo(() => {
    return [
      { label: '正答率', value: clamp(derived.tp / 100, 0, 1) },
      { label: '速度', value: clamp(1 - derived.spd / 15, 0, 1) },
      { label: '安定度', value: clamp(derived.stab / 100, 0, 1) },
      { label: 'コンボ', value: clamp(stats.maxCombo / 7, 0, 1) },
      { label: '負債管理', value: clamp(1 - stats.debt / 50, 0, 1) },
    ];
  }, [derived, stats]);

  // シェアテキスト
  const shareText = `【アジャイル・クイズすごろく】
${engineerType.em} ${engineerType.n}
正答率: ${derived.tp}% | 負債: ${stats.debt}pt
Combo: ${stats.maxCombo} | 安定度: ${Math.round(derived.stab)}%`;

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
          <GradeCircle $color={grade.c}>{grade.g}</GradeCircle>
          <GradeLabel $color={grade.c}>{grade.label}</GradeLabel>
          <BuildSuccess>BUILD SUCCESS</BuildSuccess>
          <ReleaseVersion>Release v1.0.0</ReleaseVersion>
        </div>

        {/* エンジニアタイプ */}
        <TypeCard $color={engineerType.co}>
          <TypeEmoji>{engineerType.em}</TypeEmoji>
          <TypeLabel>YOUR ENGINEER TYPE</TypeLabel>
          <TypeName $color={engineerType.co}>{engineerType.n}</TypeName>
          <TypeDescription>{engineerType.d}</TypeDescription>
        </TypeCard>

        {/* スキルレーダー */}
        <SectionBox>
          <SectionTitle>SKILL RADAR</SectionTitle>
          <RadarChart data={radarData} size={220} />
        </SectionBox>

        {/* 統計グリッド */}
        <StatsGrid style={{ marginBottom: 18 }}>
          <StatBox $color={getColorByThreshold(derived.tp, 70, 50)}>
            <StatLabel>正答率</StatLabel>
            <StatValue $color={getColorByThreshold(derived.tp, 70, 50)}>
              {derived.tp}%
            </StatValue>
          </StatBox>
          <StatBox $color={getInverseColorByThreshold(derived.spd, 5, 10)}>
            <StatLabel>速度</StatLabel>
            <StatValue $color={getInverseColorByThreshold(derived.spd, 5, 10)}>
              {derived.spd.toFixed(1)}s
            </StatValue>
          </StatBox>
          <StatBox $color={getColorByThreshold(derived.stab, 70, 40)}>
            <StatLabel>安定度</StatLabel>
            <StatValue $color={getColorByThreshold(derived.stab, 70, 40)}>
              {Math.round(derived.stab)}%
            </StatValue>
          </StatBox>
          <StatBox $color={getInverseColorByThreshold(stats.debt, 10, 25)}>
            <StatLabel>負債</StatLabel>
            <StatValue $color={getInverseColorByThreshold(stats.debt, 10, 25)}>
              {stats.debt}pt
            </StatValue>
          </StatBox>
          <StatBox
            $color={
              stats.maxCombo >= 5
                ? COLORS.orange
                : stats.maxCombo >= 3
                ? COLORS.yellow
                : COLORS.muted
            }
          >
            <StatLabel>Combo</StatLabel>
            <StatValue
              $color={
                stats.maxCombo >= 5
                  ? COLORS.orange
                  : stats.maxCombo >= 3
                  ? COLORS.yellow
                  : COLORS.muted
              }
            >
              {stats.maxCombo}
            </StatValue>
          </StatBox>
          <StatBox $color={COLORS.accent}>
            <StatLabel>回答数</StatLabel>
            <StatValue $color={COLORS.accent}>{stats.tq}</StatValue>
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
            {getSummaryText(derived.tp, derived.spd, stats.debt, stats.emS)}
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
