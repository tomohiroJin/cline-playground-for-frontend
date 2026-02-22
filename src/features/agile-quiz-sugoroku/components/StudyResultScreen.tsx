/**
 * 勉強会モード - 学習結果画面
 */
import React from 'react';
import { useKeys } from '../hooks';
import { TagStats, AnswerResultWithDetail } from '../types';
import { COLORS, FONTS } from '../constants';
import { TAG_MAP } from '../questions/tag-master';
import { computeTagStatEntries, getWeakGenres, getTagColor } from '../tag-stats';
import {
  PageWrapper,
  ScrollablePanel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
  Divider,
} from './styles';

interface StudyResultScreenProps {
  tagStats: TagStats;
  incorrectQuestions: AnswerResultWithDetail[];
  totalCorrect: number;
  totalAnswered: number;
  onRetry: () => void;
  onBack: () => void;
}

export const StudyResultScreen: React.FC<StudyResultScreenProps> = ({
  tagStats,
  incorrectQuestions,
  totalCorrect,
  totalAnswered,
  onRetry,
  onBack,
}) => {
  const entries = computeTagStatEntries(tagStats);
  const weakGenres = getWeakGenres(tagStats);
  const overallRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const overallColor = getTagColor(overallRate);

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onBack();
    }
  });

  return (
    <PageWrapper>
      <Scanlines />
      <ScrollablePanel $fadeIn={false} style={{ maxWidth: 580 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.accent,
              letterSpacing: 3,
              fontFamily: FONTS.mono,
              fontWeight: 700,
            }}
          >
            STUDY RESULT
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.text2,
              marginTop: 6,
            }}
          >
            学習結果
          </div>
          <Divider />
        </div>

        {/* 全体正答率 */}
        <SectionBox>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, fontFamily: FONTS.mono }}>
              OVERALL ACCURACY
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: overallColor, fontFamily: FONTS.mono }}>
              {overallRate}%
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
              {totalCorrect} / {totalAnswered} 問正解
            </div>
          </div>
        </SectionBox>

        {/* ジャンル別正答率 */}
        {entries.length > 0 && (
          <SectionBox>
            <SectionTitle>GENRE ANALYSIS</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map((entry) => (
                <div
                  key={entry.tagId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
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
          </SectionBox>
        )}

        {/* 苦手メッセージ */}
        {weakGenres.length > 0 && (
          <SectionBox>
            <div style={{ fontSize: 12, color: COLORS.yellow, lineHeight: 1.8 }}>
              {weakGenres.map((g) => (
                <div key={g.tagId}>
                  💡 {g.tagName}が苦手そうです。もう一度挑戦してみましょう！
                </div>
              ))}
            </div>
          </SectionBox>
        )}

        {/* 不正解問題レビュー */}
        {incorrectQuestions.length > 0 && (
          <SectionBox>
            <SectionTitle>INCORRECT REVIEW ({incorrectQuestions.length})</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incorrectQuestions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: `${COLORS.red}08`,
                    borderRadius: 8,
                    border: `1px solid ${COLORS.red}18`,
                  }}
                >
                  <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 6, lineHeight: 1.6 }}>
                    {q.questionText}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.red, marginBottom: 2 }}>
                    ✗ あなたの回答: {q.options[q.selectedAnswer] ?? 'TIME UP'}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.green, marginBottom: 4 }}>
                    ✓ 正解: {q.options[q.correctAnswer]}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6 }}>
                      💡 {q.explanation}
                    </div>
                  )}
                  {q.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {q.tags.map((tagId) => {
                        const tag = TAG_MAP.get(tagId);
                        return (
                          <span
                            key={tagId}
                            style={{
                              fontSize: 9,
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: `${tag?.color ?? COLORS.accent}15`,
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

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button $color={COLORS.accent} onClick={onRetry}>
            もう一度
          </Button>
          <Button $color={COLORS.green} onClick={onBack}>
            タイトルに戻る
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
        </div>
      </ScrollablePanel>
    </PageWrapper>
  );
};
