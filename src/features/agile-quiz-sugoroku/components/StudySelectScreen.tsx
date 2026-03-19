/**
 * 勉強会モード - ジャンル選択画面
 */
import React, { useState, useMemo, useCallback } from 'react';
import { PHASE_GENRE_MAP, COLORS, FONTS } from '../constants';
import { countStudyQuestions } from '../domain/quiz';
import { GameResultRepository } from '../infrastructure/storage/game-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';
import { getGenresForCharacters } from '../character-genre-map';
import {
  PageWrapper,
  Panel,
  Button,
  Scanlines,
  Divider,
} from './styles';
import {
  CharacterSelectSection,
  PhaseSelectSection,
  GenreSelectSection,
  QuestionCountSection,
} from './StudySelectParts';

interface StudySelectScreenProps {
  onStart: (selectedTags: string[], limit: number) => void;
  onBack: () => void;
}

const gameResultRepo = new GameResultRepository(new LocalStorageAdapter());

export const StudySelectScreen: React.FC<StudySelectScreenProps> = ({ onStart, onBack }) => {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(10);

  // 前回結果から苦手ジャンルを取得
  const weakGenreIds = useMemo(() => {
    const result = gameResultRepo.load();
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
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const toggleCharacter = useCallback((characterId: string) => {
    setSelectedCharacters((prev) => {
      const next = new Set(prev);
      if (next.has(characterId)) next.delete(characterId);
      else next.add(characterId);
      const genres = getGenresForCharacters([...next]);
      setSelectedTags(new Set(genres));
      return next;
    });
  }, []);

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
    setSelectedCharacters(new Set());
  };

  const selectWeak = () => {
    setSelectedTags(new Set(weakGenreIds));
    setSelectedCharacters(new Set());
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
          <div style={{
            fontSize: 10, color: COLORS.accent, letterSpacing: 3,
            fontFamily: FONTS.mono, fontWeight: 700,
          }}>
            STUDY MODE
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text2, marginTop: 6 }}>
            勉強会モード
          </div>
          <Divider />
        </div>

        <CharacterSelectSection
          selectedCharacters={selectedCharacters}
          onToggle={toggleCharacter}
        />
        <PhaseSelectSection
          selectedTags={selectedTags}
          weakGenreIds={weakGenreIds}
          onSelectPhaseGroup={selectPhaseGroup}
          onSelectWeak={selectWeak}
        />
        <GenreSelectSection
          selectedTags={selectedTags}
          weakGenreIds={weakGenreIds}
          questionCount={questionCount}
          onToggleTag={toggleTag}
        />
        <QuestionCountSection limit={limit} onChangeLimit={setLimit} />

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
