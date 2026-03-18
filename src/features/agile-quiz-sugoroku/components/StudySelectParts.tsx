/**
 * 勉強会モード - キャラクター・工程選択セクション
 */
import React from 'react';
import { PHASE_GENRE_MAP, COLORS } from '../constants';
import { CHARACTER_GENRE_MAP } from '../character-genre-map';
import { SectionBox, SectionTitle } from './styles';

// ジャンル選択・問題数選択セクションは別ファイルで定義
export { GenreSelectSection, QuestionCountSection } from './StudySelectGenre';

// ── 定数 ──────────────────────────────────────────────

const PHASE_LABELS: { [key: string]: string } = {
  planning: '計画',
  'impl1+impl2': '実装',
  'test1+test2': 'テスト',
  refinement: 'リファインメント',
  review: 'レビュー',
  emergency: '緊急対応',
};

const PHASE_GROUPS = [
  { key: 'planning', phases: ['planning'] },
  { key: 'impl1+impl2', phases: ['impl1'] },
  { key: 'test1+test2', phases: ['test1'] },
  { key: 'refinement', phases: ['refinement'] },
  { key: 'review', phases: ['review'] },
  { key: 'emergency', phases: ['emergency'] },
];

// ── キャラクター選択セクション ──────────────────────────

interface CharacterSelectSectionProps {
  selectedCharacters: Set<string>;
  onToggle: (characterId: string) => void;
}

export const CharacterSelectSection: React.FC<CharacterSelectSectionProps> = ({
  selectedCharacters, onToggle,
}) => (
  <SectionBox>
    <SectionTitle>CHARACTER SELECT</SectionTitle>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
      {CHARACTER_GENRE_MAP.map((mapping) => {
        const isSelected = selectedCharacters.has(mapping.characterId);
        return (
          <button
            key={mapping.characterId}
            onClick={() => onToggle(mapping.characterId)}
            style={{
              background: isSelected ? `${COLORS.accent}22` : `${COLORS.bg}dd`,
              border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}`,
              color: isSelected ? COLORS.accent : COLORS.muted,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: isSelected ? 700 : 400,
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: 2,
              minWidth: 64,
            }}
          >
            <span style={{ fontSize: 20 }}>{mapping.emoji}</span>
            <span>{mapping.characterName}</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>{mapping.role}</span>
          </button>
        );
      })}
    </div>
  </SectionBox>
);

// ── 工程別クイック選択セクション ──────────────────────────

interface PhaseSelectSectionProps {
  selectedTags: Set<string>;
  weakGenreIds: string[];
  onSelectPhaseGroup: (phases: string[]) => void;
  onSelectWeak: () => void;
}

export const PhaseSelectSection: React.FC<PhaseSelectSectionProps> = ({
  selectedTags, weakGenreIds, onSelectPhaseGroup, onSelectWeak,
}) => (
  <SectionBox>
    <SectionTitle>SPRINT PHASE SELECT</SectionTitle>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {PHASE_GROUPS.map((group) => {
        const phaseTags = group.phases.flatMap((p) => PHASE_GENRE_MAP[p] ?? []);
        const allSelected = phaseTags.every((t) => selectedTags.has(t));
        return (
          <button
            key={group.key}
            onClick={() => onSelectPhaseGroup(group.phases)}
            style={{
              background: allSelected ? `${COLORS.accent}22` : `${COLORS.bg}dd`,
              border: `1px solid ${allSelected ? COLORS.accent : COLORS.border}`,
              color: allSelected ? COLORS.accent : COLORS.muted,
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: allSelected ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {PHASE_LABELS[group.key]}
          </button>
        );
      })}
      {weakGenreIds.length > 0 && (
        <button
          onClick={onSelectWeak}
          style={{
            background: `${COLORS.red}15`,
            border: `1px solid ${COLORS.red}44`,
            color: COLORS.red,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 700,
            transition: 'all 0.2s',
          }}
        >
          苦手克服
        </button>
      )}
    </div>
  </SectionBox>
);
