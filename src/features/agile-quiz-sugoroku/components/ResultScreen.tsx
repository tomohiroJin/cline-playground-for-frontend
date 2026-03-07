/**
 * 結果画面コンポーネント
 * グレード発表シーケンスアニメーション付き
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { classifyTeamType } from '../team-classifier';
import { getComboColor } from '../combo-color';
import { AQS_IMAGES } from '../images';
import { ParticleEffect } from './ParticleEffect';
import { RadarChart } from './RadarChart';
import { BarChart } from './BarChart';
import {
  PageWrapper,
  ScrollablePanel,
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
  const [copied, setCopied] = useState(false);
  const [typeImgError, setTypeImgError] = useState(false);
  const [takaImgError, setTakaImgError] = useState(false);

  // 演出シーケンスのステップ管理
  const [sequenceStep, setSequenceStep] = useState(0);
  const isSequenceComplete = sequenceStep >= 3;

  // 演出シーケンス: 0=暗転 → 1=BUILD SUCCESS → 2=グレード表示 → 3=全体表示
  useEffect(() => {
    const delays = [800, 1500, 1000];
    if (sequenceStep < 3) {
      const tid = setTimeout(() => setSequenceStep((s) => s + 1), delays[sequenceStep]);
      return () => clearTimeout(tid);
    }
  }, [sequenceStep]);

  // クリック/Enter で演出スキップ
  const skipSequence = useCallback(() => {
    if (!isSequenceComplete) {
      setSequenceStep(3);
    }
  }, [isSequenceComplete]);

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

  // グレードを計算
  const grade = useMemo(() => {
    return getGrade(derived.correctRate, derived.stability, derived.averageSpeed);
  }, [derived]);

  // レーダーチャートデータ（チーム指標）
  const radarData: RadarDataPoint[] = useMemo(() => {
    return [
      { label: 'チーム知識力', value: clamp(derived.correctRate / 100, 0, 1) },
      { label: '意思決定速度', value: clamp(1 - derived.averageSpeed / 15, 0, 1) },
      { label: 'プロセス安定性', value: clamp(derived.stability / 100, 0, 1) },
      { label: 'チーム連携力', value: clamp(stats.maxCombo / 7, 0, 1) },
      { label: '技術健全性', value: clamp(1 - stats.debt / 50, 0, 1) },
    ];
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

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!isSequenceComplete) {
        skipSequence();
      } else {
        onReplay();
      }
    }
  });

  return (
    <PageWrapper onClick={skipSequence}>
      <ParticleEffect count={30} />
      <Scanlines />

      {/* 演出シーケンス: ステップ0 - 暗転 */}
      {sequenceStep === 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <div style={{
            color: COLORS.muted,
            fontSize: 11,
            fontFamily: FONTS.mono,
            letterSpacing: 2,
            opacity: 0.5,
          }}>
            CALCULATING...
          </div>
        </div>
      )}

      {/* 演出シーケンス: ステップ1 - BUILD SUCCESS タイプライター */}
      {sequenceStep === 1 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: COLORS.bg,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <BuildSuccess style={{ fontSize: 18, letterSpacing: 5 }}>
            BUILD SUCCESS
          </BuildSuccess>
          <ReleaseVersion style={{ marginTop: 8 }}>Release v1.0.0</ReleaseVersion>
        </div>
      )}

      {/* 演出シーケンス: ステップ2 - グレード発表 */}
      {sequenceStep === 2 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: COLORS.bg,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <GradeCircle $color={grade.color}>{grade.grade}</GradeCircle>
          <GradeLabel $color={grade.color}>{grade.label}</GradeLabel>
        </div>
      )}

      <ScrollablePanel $fadeIn={false} style={{
        maxWidth: 580,
        opacity: isSequenceComplete ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
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
              height: 80,
              objectFit: 'contain',
              opacity: 0.2,
              borderRadius: 4,
              marginBottom: 4,
            }}
          />
          <BuildSuccess>BUILD SUCCESS</BuildSuccess>
          <ReleaseVersion>Release v1.0.0</ReleaseVersion>
        </div>

        {/* チームの成熟度 */}
        <TypeCard $color={teamType.color}>
          {!typeImgError && AQS_IMAGES.types[teamType.id as keyof typeof AQS_IMAGES.types] ? (
            <img
              src={AQS_IMAGES.types[teamType.id as keyof typeof AQS_IMAGES.types]!}
              alt={teamType.name}
              onError={() => setTypeImgError(true)}
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${teamType.color}`,
                marginBottom: 12,
              }}
            />
          ) : (
            <TypeEmoji>{teamType.emoji}</TypeEmoji>
          )}
          <TypeLabel>TEAM MATURITY</TypeLabel>
          <TypeName $color={teamType.color}>{teamType.name}</TypeName>
          <TypeDescription>{teamType.description}</TypeDescription>
          {/* チーム向けフィードバック */}
          <div style={{
            marginTop: 10,
            padding: '8px 10px',
            background: `${teamType.color}08`,
            borderRadius: 6,
            border: `1px solid ${teamType.color}15`,
            fontSize: 11.5,
            color: COLORS.text,
            lineHeight: 1.6,
          }}>
            {teamType.feedback}
          </div>
          <div style={{
            marginTop: 6,
            fontSize: 11,
            color: COLORS.muted,
            lineHeight: 1.5,
          }}>
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

        {/* サマリー（タカ / ビジネスオーナーからの総評） */}
        <SectionBox style={{ marginBottom: 16 }}>
          <SectionTitle>SUMMARY</SectionTitle>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* タカのアバター */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              {!takaImgError && AQS_IMAGES.characters.taka ? (
                <img
                  src={AQS_IMAGES.characters.taka}
                  alt="タカ"
                  onError={() => setTakaImgError(true)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${COLORS.yellow}`,
                  }}
                />
              ) : (
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: `${COLORS.yellow}15`,
                  border: `2px solid ${COLORS.yellow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}>
                  🦅
                </div>
              )}
              <div style={{
                fontSize: 10,
                color: COLORS.yellow,
                fontWeight: 700,
                marginTop: 4,
              }}>
                タカ
              </div>
              <div style={{
                fontSize: 8,
                color: COLORS.muted,
              }}>
                ビジネスオーナー
              </div>
            </div>
            {/* 吹き出し */}
            <div style={{
              flex: 1,
              position: 'relative',
              background: `${COLORS.yellow}08`,
              border: `1px solid ${COLORS.yellow}22`,
              borderRadius: '4px 12px 12px 12px',
              padding: '12px 14px',
            }}>
              <SummaryText>
                {getSummaryText(derived.correctRate, derived.averageSpeed, stats.debt, stats.emergencySuccess, sprintCount)}
              </SummaryText>
            </div>
          </div>
        </SectionBox>

        {/* ボタン */}
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
      </ScrollablePanel>
    </PageWrapper>
  );
};
