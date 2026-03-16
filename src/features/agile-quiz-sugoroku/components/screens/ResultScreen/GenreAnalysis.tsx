/**
 * ジャンル分析・不正解レビュー・サマリーコンポーネント
 */
import React, { useState, useMemo } from 'react';
import type { DerivedStats, GameStats, TagStats, AnswerResultWithDetail } from '../../../types';
import { COLORS, FONTS, getSummaryText } from '../../../constants';
import { computeTagStatEntries, getWeakGenres } from '../../../tag-stats';
import type { TagStatEntry } from '../../../tag-stats';
import { TAG_MAP } from '../../../questions/tag-master';
import { AQS_IMAGES } from '../../../images';
import {
  SectionBox,
  SectionTitle,
  SummaryText,
} from '../../styles';

/** ジャンル別正答率セクション */
const GenreStatsSection: React.FC<{ tagStats: TagStats }> = ({ tagStats }) => {
  const entries = useMemo(() => computeTagStatEntries(tagStats), [tagStats]);
  const weak = useMemo(() => getWeakGenres(tagStats), [tagStats]);

  return (
    <SectionBox>
      <SectionTitle>GENRE ANALYSIS</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map((entry: TagStatEntry) => (
          <div
            key={entry.tagId}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 8px', background: `${entry.color}08`,
              borderRadius: 6, border: `1px solid ${entry.color}18`,
            }}
          >
            <span style={{ fontSize: 11, color: COLORS.muted, flex: 1 }}>{entry.tagName}</span>
            <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: FONTS.mono }}>
              {entry.correct}/{entry.total}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700, color: entry.color,
              fontFamily: FONTS.mono, minWidth: 40, textAlign: 'right',
            }}>
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
};

interface GenreAnalysisProps {
  derived: DerivedStats;
  stats: GameStats;
  tagStats?: TagStats;
  incorrectQuestions?: AnswerResultWithDetail[];
  sprintCount?: number;
}

/**
 * ジャンル分析 + 不正解レビュー + サマリー
 */
export const GenreAnalysis: React.FC<GenreAnalysisProps> = ({
  derived,
  stats,
  tagStats,
  incorrectQuestions,
  sprintCount,
}) => {
  const [takaImgError, setTakaImgError] = useState(false);

  return (
    <>
      {/* ジャンル別正答率 */}
      {tagStats && Object.keys(tagStats).length > 0 && (
        <GenreStatsSection tagStats={tagStats} />
      )}

      {/* 不正解問題レビュー */}
      {incorrectQuestions && incorrectQuestions.length > 0 && (
        <SectionBox>
          <SectionTitle>INCORRECT REVIEW ({incorrectQuestions.length})</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {incorrectQuestions.map((q, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 10px', background: `${COLORS.red}08`,
                  borderRadius: 6, border: `1px solid ${COLORS.red}15`,
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
                            fontSize: 9, padding: '1px 5px', borderRadius: 3,
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            {!takaImgError && AQS_IMAGES.characters.taka ? (
              <img
                src={AQS_IMAGES.characters.taka}
                alt="タカ"
                onError={() => setTakaImgError(true)}
                style={{
                  width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
                  border: `2px solid ${COLORS.yellow}`,
                }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: `${COLORS.yellow}15`, border: `2px solid ${COLORS.yellow}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>
                🦅
              </div>
            )}
            <div style={{ fontSize: 10, color: COLORS.yellow, fontWeight: 700, marginTop: 4 }}>タカ</div>
            <div style={{ fontSize: 8, color: COLORS.muted }}>ビジネスオーナー</div>
          </div>
          <div style={{
            flex: 1, position: 'relative',
            background: `${COLORS.yellow}08`, border: `1px solid ${COLORS.yellow}22`,
            borderRadius: '4px 12px 12px 12px', padding: '12px 14px',
          }}>
            <SummaryText>
              {getSummaryText(derived.correctRate, derived.averageSpeed, stats.debt, stats.emergencySuccess, sprintCount)}
            </SummaryText>
          </div>
        </div>
      </SectionBox>
    </>
  );
};
