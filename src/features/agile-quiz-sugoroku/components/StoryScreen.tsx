/**
 * Agile Quiz Sugoroku - ストーリー画面
 *
 * ノベルゲーム風にストーリーテキストを1行ずつ表示する
 */
import React, { useState, useCallback, useEffect } from 'react';
import { StoryEntry } from '../types';
import { CHARACTER_PROFILES } from '../character-profiles';
import {
  StoryWrapper,
  StoryContent,
  StoryHeader,
  StorySprintLabel,
  StoryTitle,
  SkipButton,
  TextArea,
  TextLine,
  NarrationText,
  SpeakerLine,
  SpeakerName,
  SpeakerEmoji,
  SpeakerText,
  HintText,
} from './styles/story';

export interface StoryScreenProps {
  /** 現在のスプリント番号 */
  sprintNumber: number;
  /** ストーリーデータ */
  storyData: StoryEntry;
  /** ストーリー完了時のコールバック */
  onComplete: () => void;
  /** スキップ時のコールバック */
  onSkip: () => void;
}

/** キャラクターIDから名前を取得 */
function getCharacterName(characterId: string): string {
  const profile = CHARACTER_PROFILES.find((c) => c.id === characterId);
  return profile?.name ?? characterId;
}

/** キャラクターIDから絵文字を取得 */
function getCharacterEmoji(characterId: string): string {
  const profile = CHARACTER_PROFILES.find((c) => c.id === characterId);
  return profile?.emoji ?? '';
}

/**
 * ストーリー画面コンポーネント
 */
export const StoryScreen: React.FC<StoryScreenProps> = ({
  sprintNumber,
  storyData,
  onComplete,
  onSkip,
}) => {
  // 現在表示中の行インデックス（0始まり）
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // ストーリーデータが変わったらインデックスをリセット
  useEffect(() => {
    setCurrentLineIndex(0);
  }, [storyData]);

  /** 次の行へ進む or 完了 */
  const handleAdvance = useCallback(() => {
    if (currentLineIndex >= storyData.lines.length - 1) {
      // 全行表示済み → 完了
      onComplete();
    } else {
      setCurrentLineIndex((prev) => prev + 1);
    }
  }, [currentLineIndex, storyData.lines.length, onComplete]);

  /** キーボードイベント */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance, onSkip]);

  const currentLine = storyData.lines[currentLineIndex];

  return (
    <StoryWrapper>
      <StoryContent role="region" aria-label="ストーリー" onClick={handleAdvance}>
        <StoryHeader>
          <StorySprintLabel>Sprint {sprintNumber}</StorySprintLabel>
          <SkipButton
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
          >
            スキップ
          </SkipButton>
        </StoryHeader>

        <StoryTitle>{storyData.title}</StoryTitle>

        <TextArea>
          {currentLine && (
            <TextLine key={currentLineIndex}>
              {currentLine.speakerId ? (
                <SpeakerLine>
                  <SpeakerEmoji>
                    {getCharacterEmoji(currentLine.speakerId)}
                  </SpeakerEmoji>
                  <div>
                    <SpeakerName>
                      {getCharacterName(currentLine.speakerId)}
                    </SpeakerName>
                    <SpeakerText>{currentLine.text}</SpeakerText>
                  </div>
                </SpeakerLine>
              ) : (
                <NarrationText>{currentLine.text}</NarrationText>
              )}
            </TextLine>
          )}
        </TextArea>

        <HintText>
          {currentLineIndex < storyData.lines.length - 1
            ? 'Click / Enter / Space → 次へ | Escape → スキップ'
            : 'Click / Enter / Space → 続ける'}
        </HintText>
      </StoryContent>
    </StoryWrapper>
  );
};
