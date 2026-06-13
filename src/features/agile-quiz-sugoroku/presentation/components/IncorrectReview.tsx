/**
 * 不正解問題レビューコンポーネント
 */
import React, { useState, useMemo } from 'react';
import { AnswerResultWithDetail, Question } from '../../domain/types';
import { makeQuestionKey } from '../../domain/quiz';
import { SectionBox, SectionTitle } from '../styles';
import { DESIGN_TOKENS } from '../styles/design-tokens';
import { RelatedTags } from './RelatedTags';
import { BookmarkRepository } from '../../infrastructure/storage/bookmark-repository';
import { LocalStorageAdapter } from '../../infrastructure/storage/local-storage-adapter';

/** ブックマークリポジトリ（モジュールスコープシングルトン） */
const bookmarkRepo = new BookmarkRepository(new LocalStorageAdapter());

interface IncorrectReviewProps {
  questions: AnswerResultWithDetail[];
}

/** AnswerResultWithDetail から Question を再構成する */
function toQuestion(item: AnswerResultWithDetail): Question {
  return {
    question: item.questionText,
    options: item.options,
    answer: item.correctAnswer,
    tags: item.tags,
    explanation: item.explanation,
  };
}

/** 不正解問題のレビュー表示 */
export const IncorrectReview: React.FC<IncorrectReviewProps> = ({ questions }) => {
  // マウント時にブックマーク済みキーの Set を初期化する
  const initialBookmarked = useMemo(() => {
    const keys = new Set<string>();
    for (const item of questions) {
      const q = toQuestion(item);
      if (bookmarkRepo.isBookmarked(q)) {
        keys.add(makeQuestionKey(q));
      }
    }
    return keys;
  }, [questions]);

  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(initialBookmarked);

  if (questions.length === 0) return null;

  /** ブックマークをトグルして state を更新する */
  const handleBookmark = (item: AnswerResultWithDetail): void => {
    const q = toQuestion(item);
    bookmarkRepo.toggle(q, Date.now());
    const key = makeQuestionKey(q);
    setBookmarkedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <SectionBox>
      <SectionTitle>INCORRECT REVIEW ({questions.length})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((q, i) => {
          const questionKey = makeQuestionKey(toQuestion(q));
          const isBookmarked = bookmarkedKeys.has(questionKey);

          return (
            <div
              key={`${q.questionText.slice(0, 20)}-${i}`}
              style={{
                padding: '10px 12px',
                background: `${DESIGN_TOKENS.colors.danger}08`,
                borderRadius: DESIGN_TOKENS.borderRadius.md,
                border: `1px solid ${DESIGN_TOKENS.colors.danger}18`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontSize: DESIGN_TOKENS.fontSize.xs,
                    color: DESIGN_TOKENS.colors.textPrimary,
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {q.questionText}
                </div>
                {/* ブックマークトグルボタン */}
                <button
                  type="button"
                  aria-pressed={isBookmarked}
                  aria-label={isBookmarked ? 'ブックマーク解除' : 'ブックマークに追加'}
                  onClick={() => handleBookmark(q)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: DESIGN_TOKENS.fontSize.md,
                    color: isBookmarked ? DESIGN_TOKENS.colors.warning : DESIGN_TOKENS.colors.textMuted,
                    padding: '2px 4px',
                    lineHeight: 1,
                    flexShrink: 0,
                    transition: `color ${DESIGN_TOKENS.transition.fast}`,
                  }}
                >
                  {isBookmarked ? '★' : '☆'}
                </button>
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
          );
        })}
      </div>
    </SectionBox>
  );
};
