/**
 * 結果画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { DerivedStats, GameStats, SprintSummary, RadarDataPoint, TagStats, AnswerResultWithDetail } from '../types';
import { clamp } from '../../../utils/math-utils';
import {
  COLORS,
  FONTS,
  getGrade,
  getSummaryText,
  getColorByThreshold,
  getInverseColorByThreshold,
} from '../constants';
import { computeTagStatEntries, getWeakGenres } from '../tag-stats';
import { TAG_MAP } from '../questions/tag-master';
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
  /** ジャンル別統計 */
  tagStats?: TagStats;
  /** 不正解問題リスト */
  incorrectQuestions?: AnswerResultWithDetail[];
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

        {/* 総合スコア */}
        <SectionBox>
          <SectionTitle>TOTAL SCORE</SectionTitle>
          <div style={{ textAlign: 'center', fontSize: 14, color: COLORS.text, fontFamily: FONTS.mono }}>
            {stats.totalCorrect} / {stats.totalQuestions} 問正解
          </div>
        </SectionBox>

        {/* ジャンル別正答率 */}
        {tagStats && Object.keys(tagStats).length > 0 && (() => {
          const entries = computeTagStatEntries(tagStats);
          const weak = getWeakGenres(tagStats);
          return (
            <SectionBox>
              <SectionTitle>GENRE ANALYSIS</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {entries.map((entry) => (
                  <div
                    key={entry.tagId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 8px',
                      background: `${entry.color}08`,
                      borderRadius: 6,
                      border: `1px solid ${entry.color}18`,
                    }}
                  >
                    <span style={{ fontSize: 11, color: COLORS.muted, flex: 1 }}>{entry.tagName}</span>
                    <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: FONTS.mono }}>
                      {entry.correct}/{entry.total}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: entry.color,
                        fontFamily: FONTS.mono,
                        minWidth: 40,
                        textAlign: 'right',
                      }}
                    >
                      {entry.rate}%
                    </span>
                  </div>
                ))}
              </div>
              {weak.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: COLORS.yellow, lineHeight: 1.8 }}>
                  {weak.map((g) => (
                    <div key={g.tagId}>
                      💡 {g.tagName}が苦手そうです。もう一度挑戦してみましょう！
                    </div>
                  ))}
                </div>
              )}
            </SectionBox>
          );
        })()}

        {/* 不正解問題レビュー */}
        {incorrectQuestions && incorrectQuestions.length > 0 && (
          <SectionBox>
            <SectionTitle>INCORRECT REVIEW ({incorrectQuestions.length})</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {incorrectQuestions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    background: `${COLORS.red}08`,
                    borderRadius: 6,
                    border: `1px solid ${COLORS.red}15`,
                  }}
                >
                  <div style={{ fontSize: 11.5, color: COLORS.text, marginBottom: 4, lineHeight: 1.5 }}>
                    {q.questionText}
                  </div>
                  <div style={{ fontSize: 10.5, color: COLORS.red, marginBottom: 2 }}>
                    ✗ {q.options[q.selectedAnswer] ?? 'TIME UP'}
                  </div>
                  <div style={{ fontSize: 10.5, color: COLORS.green, marginBottom: 3 }}>
                    ✓ {q.options[q.correctAnswer]}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: 10.5, color: COLORS.muted, lineHeight: 1.5 }}>
                      💡 {q.explanation}
                    </div>
                  )}
                  {q.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                      {q.tags.map((tagId) => {
                        const tag = TAG_MAP.get(tagId);
                        return (
                          <span
                            key={tagId}
                            style={{
                              fontSize: 9,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: `${tag?.color ?? COLORS.accent}12`,
                              color: tag?.color ?? COLORS.accent,
                            }}
                          >
                            {tag?.name ?? tagId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionBox>
        )}

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
