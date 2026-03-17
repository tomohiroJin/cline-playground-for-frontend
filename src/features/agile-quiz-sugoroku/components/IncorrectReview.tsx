/**
 * 不正解問題レビューコンポーネント
 */
import React from 'react';
import { AnswerResultWithDetail } from '../domain/types';
import { COLORS } from '../constants';
import { TAG_MAP } from '../questions/tag-master';
import { SectionBox, SectionTitle } from './styles';

interface IncorrectReviewProps {
  questions: AnswerResultWithDetail[];
}

/** 不正解問題のレビュー表示 */
export const IncorrectReview: React.FC<IncorrectReviewProps> = ({ questions }) => {
  if (questions.length === 0) return null;

  return (
    <SectionBox>
      <SectionTitle>INCORRECT REVIEW ({questions.length})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((q, i) => (
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
  );
};
