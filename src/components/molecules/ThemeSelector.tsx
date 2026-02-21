import React, { useState, useMemo } from 'react';
import { getImageSize } from '../../utils/puzzle-utils';
import { Theme, ThemeId, PuzzleImage, PuzzleRecord } from '../../types/puzzle';
import { isThemeUnlocked } from '../../utils/score-utils';
import {
  SelectorContainer,
  Title,
  ThemeTabs,
  ThemeTab,
  ThemeDescription,
  UnlockHint,
  ProgressBar,
  ProgressFill,
  ImagesGrid,
  ImageItem,
  ThemeImage,
  SelectedIndicator,
  RankBadge,
} from './ThemeSelector.styles';

export interface ThemeSelectorProps {
  themes: Theme[];
  records: PuzzleRecord[];
  totalClears: number;
  onImageSelect: (url: string, width: number, height: number) => void;
}

const getUnlockHintText = (theme: Theme, totalClears: number): string => {
  const cond = theme.unlockCondition;
  if (cond.type === 'clearCount') {
    return `${cond.count}回クリアで解放（現在 ${totalClears}回）`;
  }
  if (cond.type === 'themesClear') {
    return '全テーマで1回以上クリアすると解放';
  }
  return '';
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themes,
  records,
  totalClears,
  onImageSelect,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(themes[0]?.id ?? 'illustration-gallery');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const themeImageIds = useMemo(() => {
    const map = new Map<ThemeId, string[]>();
    for (const theme of themes) {
      map.set(theme.id, theme.images.map(img => img.id));
    }
    return map;
  }, [themes]);

  const unlockedThemes = useMemo(() => {
    const set = new Set<ThemeId>();
    for (const theme of themes) {
      if (isThemeUnlocked(theme.unlockCondition, totalClears, records, themeImageIds)) {
        set.add(theme.id);
      }
    }
    return set;
  }, [themes, totalClears, records, themeImageIds]);

  const selectedTheme = themes.find(t => t.id === selectedThemeId) ?? themes[0];
  const isUnlocked = unlockedThemes.has(selectedThemeId);

  const clearProgress = useMemo(() => {
    if (!selectedTheme) return { cleared: 0, total: 0 };
    const imageIds = selectedTheme.images.map(img => img.id);
    const cleared = imageIds.filter(imgId =>
      records.some(r => r.imageId === imgId && r.clearCount > 0)
    ).length;
    return { cleared, total: imageIds.length };
  }, [selectedTheme, records]);

  const handleThemeClick = (themeId: ThemeId) => {
    if (!unlockedThemes.has(themeId)) return;
    setSelectedThemeId(themeId);
    setSelectedImageId(null);
  };

  const handleImageSelect = async (image: PuzzleImage) => {
    setSelectedImageId(image.id);
    try {
      const fullPath = `${window.location.origin}/images/default/${image.filename}`;
      const { width, height } = await getImageSize(fullPath);
      onImageSelect(fullPath, width, height);
    } catch (err) {
      console.error('画像の読み込みに失敗しました:', err);
    }
  };

  const getBestRank = (imageId: string): string | null => {
    const record = records.find(r => r.imageId === imageId && r.clearCount > 0);
    return record ? record.bestRank : null;
  };

  return (
    <SelectorContainer>
      <Title>テーマから画像を選択</Title>
      <ThemeTabs>
        {themes.map(theme => {
          const locked = !unlockedThemes.has(theme.id);
          return (
            <ThemeTab
              key={theme.id}
              $active={theme.id === selectedThemeId}
              $locked={locked}
              onClick={() => handleThemeClick(theme.id)}
              title={locked ? getUnlockHintText(theme, totalClears) : theme.description}
            >
              {locked ? '🔒 ' : ''}
              {theme.name}
            </ThemeTab>
          );
        })}
      </ThemeTabs>

      {selectedTheme && (
        <>
          <ThemeDescription>{selectedTheme.description}</ThemeDescription>
          {!isUnlocked && (
            <UnlockHint>{getUnlockHintText(selectedTheme, totalClears)}</UnlockHint>
          )}
          {isUnlocked && (
            <>
              <ProgressBar>
                <ProgressFill
                  $percent={
                    clearProgress.total > 0
                      ? (clearProgress.cleared / clearProgress.total) * 100
                      : 0
                  }
                />
              </ProgressBar>
              <ImagesGrid>
                {selectedTheme.images.map(image => {
                  const rank = getBestRank(image.id);
                  return (
                    <ImageItem
                      key={image.id}
                      $isSelected={selectedImageId === image.id}
                      onClick={() => handleImageSelect(image)}
                    >
                      <ThemeImage
                        src={`/images/default/${image.filename}`}
                        alt={image.alt}
                      />
                      {selectedImageId === image.id && (
                        <SelectedIndicator>✓</SelectedIndicator>
                      )}
                      {rank && <RankBadge>{rank}</RankBadge>}
                    </ImageItem>
                  );
                })}
              </ImagesGrid>
            </>
          )}
        </>
      )}
    </SelectorContainer>
  );
};

export default ThemeSelector;
