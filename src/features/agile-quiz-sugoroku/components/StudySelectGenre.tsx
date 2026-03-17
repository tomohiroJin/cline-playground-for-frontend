/**
 * 勉強会モード - ジャンル選択・問題数選択セクション
 */
import React from 'react';
import { TAG_MASTER } from '../questions/tag-master';
import { COLORS, FONTS } from '../constants';
import { SectionBox, SectionTitle } from './styles';

/** 問題数の選択肢 */
const LIMIT_OPTIONS = [
  { value: 10, label: '10問' },
  { value: 20, label: '20問' },
  { value: 50, label: '50問' },
];

// ── 個別ジャンル選択セクション ──────────────────────────

interface GenreSelectSectionProps {
  selectedTags: Set<string>;
  weakGenreIds: string[];
  questionCount: number;
  onToggleTag: (tagId: string) => void;
}

export const GenreSelectSection: React.FC<GenreSelectSectionProps> = ({
  selectedTags, weakGenreIds, questionCount, onToggleTag,
}) => (
  <SectionBox>
    <SectionTitle>GENRE SELECT</SectionTitle>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {TAG_MASTER.map((tag) => {
        const isSelected = selectedTags.has(tag.id);
        const isWeak = weakGenreIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            style={{
              background: isSelected ? `${tag.color}22` : `${COLORS.bg}dd`,
              border: `1px solid ${isSelected ? tag.color : isWeak ? `${COLORS.red}44` : COLORS.border}`,
              color: isSelected ? tag.color : isWeak ? COLORS.red : COLORS.muted,
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: isSelected ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {tag.name}
            {isWeak && ' !'}
          </button>
        );
      })}
    </div>
    {selectedTags.size > 0 && (
      <div style={{
        marginTop: 10, fontSize: 11, color: COLORS.muted, fontFamily: FONTS.mono,
      }}>
        {questionCount}問 が対象
      </div>
    )}
  </SectionBox>
);

// ── 問題数選択セクション ──────────────────────────

interface QuestionCountSectionProps {
  limit: number;
  onChangeLimit: (value: number) => void;
}

export const QuestionCountSection: React.FC<QuestionCountSectionProps> = ({
  limit, onChangeLimit,
}) => (
  <SectionBox>
    <SectionTitle>QUESTION COUNT</SectionTitle>
    <div style={{ display: 'flex', gap: 8 }}>
      {LIMIT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChangeLimit(opt.value)}
          style={{
            background: limit === opt.value ? `${COLORS.accent}22` : `${COLORS.bg}dd`,
            border: `1px solid ${limit === opt.value ? COLORS.accent : COLORS.border}`,
            color: limit === opt.value ? COLORS.accent : COLORS.muted,
            padding: '8px 20px',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: limit === opt.value ? 700 : 400,
            fontFamily: FONTS.mono,
            transition: 'all 0.2s',
            flex: 1,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </SectionBox>
);
