/**
 * 不正解問題レビューコンポーネント
 */
import React from 'react';
import { AnswerResultWithDetail } from '../../domain/types';
import { SectionBox, SectionTitle } from '../styles';
import { DESIGN_TOKENS } from '../styles/design-tokens';
import { RelatedTags } from './RelatedTags';

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
            key={`${q.questionText.slice(0, 20)}-${i}`}
            style={{
              padding: '10px 12px',
              background: `${DESIGN_TOKENS.colors.danger}08`,
              borderRadius: DESIGN_TOKENS.borderRadius.md,
              border: `1px solid ${DESIGN_TOKENS.colors.danger}18`,
            }}
          >
            <div style={{ fontSize: DESIGN_TOKENS.fontSize.xs, color: DESIGN_TOKENS.colors.textPrimary, marginBottom: 6, lineHeight: 1.6 }}>
              {q.questionText}
            </div>
            <div style={{ fontSize: 11, color: DESIGN_TOKENS.colors.danger, marginBottom: 2 }}>
              ✗ あなたの回答: {q.options[q.selectedAnswer] ?? 'TIME UP'}
            </div>
            <div style={{ fontSize: 11, color: DESIGN_TOKENS.colors.secondary, marginBottom: 4 }}>
              ✓ 正解: {q.options[q.correctAnswer]}
            </div>
            {q.explanation && (
              <div style={{ fontSize: 11, color: DESIGN_TOKENS.colors.textMuted, lineHeight: 1.6 }}>
                💡 {q.explanation}
              </div>
            )}
            <RelatedTags tags={q.tags} />
          </div>
        ))}
      </div>
    </SectionBox>
  );
};
