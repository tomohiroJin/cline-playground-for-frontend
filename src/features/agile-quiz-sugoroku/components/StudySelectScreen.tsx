/**
 * 勉強会モード - ジャンル選択画面
 */
import React, { useState, useMemo } from 'react';
import { TAG_MASTER } from '../questions/tag-master';
import { PHASE_GENRE_MAP, COLORS, FONTS } from '../constants';
import { TagStats } from '../types';
import { getTagColor } from '../tag-stats';
import { countStudyQuestions } from '../study-question-pool';
import { loadGameResult } from '../result-storage';
import {
  PageWrapper,
  Panel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
  Divider,
} from './styles';

interface StudySelectScreenProps {
  onStart: (selectedTags: string[], limit: number) => void;
  onBack: () => void;
}

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

const LIMIT_OPTIONS = [
  { value: 10, label: '10問' },
  { value: 20, label: '20問' },
  { value: 0, label: '全問' },
];

export const StudySelectScreen: React.FC<StudySelectScreenProps> = ({ onStart, onBack }) => {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(10);

  // 前回結果から苦手ジャンルを取得
  const weakGenreIds = useMemo(() => {
    const result = loadGameResult();
    if (!result?.tagStats) return [];
    return Object.entries(result.tagStats)
      .filter(([, v]) => v.total > 0 && (v.correct / v.total) * 100 <= 50)
      .map(([id]) => id);
  }, []);

  const questionCount = useMemo(() => {
    if (selectedTags.size === 0) return 0;
    return countStudyQuestions([...selectedTags]);
  }, [selectedTags]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const selectPhaseGroup = (phases: string[]) => {
    const tags = new Set<string>();
    for (const phase of phases) {
      const phaseTags = PHASE_GENRE_MAP[phase] ?? [];
      for (const t of phaseTags) tags.add(t);
    }
    setSelectedTags((prev) => {
      const allSelected = [...tags].every((t) => prev.has(t));
      const next = new Set(prev);
      if (allSelected) {
        for (const t of tags) next.delete(t);
      } else {
        for (const t of tags) next.add(t);
      }
      return next;
    });
  };

  const selectWeak = () => {
    setSelectedTags(new Set(weakGenreIds));
  };

  const handleStart = () => {
    if (selectedTags.size === 0) return;
    onStart([...selectedTags], limit);
  };

  return (
    <PageWrapper>
      <Scanlines />
      <Panel $fadeIn={false} style={{ maxWidth: 580 }}>
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
            STUDY MODE
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.text2,
              marginTop: 6,
            }}
          >
            勉強会モード
          </div>
          <Divider />
        </div>

        {/* 工程別クイック選択 */}
        <SectionBox>
          <SectionTitle>SPRINT PHASE SELECT</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {PHASE_GROUPS.map((group) => {
              const phaseTags = group.phases.flatMap((p) => PHASE_GENRE_MAP[p] ?? []);
              const allSelected = phaseTags.every((t) => selectedTags.has(t));
              return (
                <button
                  key={group.key}
                  onClick={() => selectPhaseGroup(group.phases)}
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
                onClick={selectWeak}
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

        {/* 個別ジャンル選択 */}
        <SectionBox>
          <SectionTitle>GENRE SELECT</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAG_MASTER.map((tag) => {
              const isSelected = selectedTags.has(tag.id);
              const isWeak = weakGenreIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
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
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
              }}
            >
              {questionCount}問 が対象
            </div>
          )}
        </SectionBox>

        {/* 問題数選択 */}
        <SectionBox>
          <SectionTitle>QUESTION COUNT</SectionTitle>
          <div style={{ display: 'flex', gap: 8 }}>
            {LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLimit(opt.value)}
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

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 4 }}>
          <Button $color={COLORS.muted} onClick={onBack}>
            ← 戻る
          </Button>
          <Button
            $color={COLORS.green}
            $disabled={selectedTags.size === 0}
            disabled={selectedTags.size === 0}
            onClick={handleStart}
            style={{ opacity: selectedTags.size === 0 ? 0.5 : 1 }}
          >
            ▶ 学習開始
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
