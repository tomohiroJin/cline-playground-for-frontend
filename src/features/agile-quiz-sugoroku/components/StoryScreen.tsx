/**
 * Agile Quiz Sugoroku - ストーリー画面
 *
 * ノベルゲーム風にストーリーテキストを1行ずつ表示する
 */
import React, { useState, useCallback, useEffect } from 'react';
import { StoryEntry } from '../types';
import { CHARACTER_PROFILES } from '../character-profiles';
import { AQS_IMAGES } from '../images';
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
  /** ヘッダーラベルの上書き（エンディング等で使用） */
  headerLabel?: string;
}

/** imageKeyから対応する画像URLを取得 */
function getStoryImage(imageKey: string): string | undefined {
  // ストーリー画像（story_01〜story_08）
  if (imageKey in AQS_IMAGES.stories) {
    return AQS_IMAGES.stories[imageKey as keyof typeof AQS_IMAGES.stories];
  }
  // エンディング画像（ending_common, ending_epilogue）
  const endingKey = imageKey.replace('ending_', '');
  if (endingKey in AQS_IMAGES.endings) {
    return AQS_IMAGES.endings[endingKey as keyof typeof AQS_IMAGES.endings];
  }
  return undefined;
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
  headerLabel,
}) => {
  // 現在表示中の行インデックス（0始まり）
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [bgError, setBgError] = useState(false);

  // 背景画像の取得
  const bgImage = getStoryImage(storyData.imageKey);

  // ストーリーデータが変わったらインデックスとエラーをリセット
  useEffect(() => {
    setCurrentLineIndex(0);
    setBgError(false);
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
      {/* 背景イラスト（半透明オーバーレイ） */}
      {bgImage && !bgError && (
        <img
          src={bgImage}
          alt=""
          onError={() => setBgError(true)}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.12,
            transition: 'opacity 0.5s ease-in-out',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <StoryContent role="region" aria-label="ストーリー" onClick={handleAdvance}>
        <StoryHeader>
          <StorySprintLabel>{headerLabel ?? `Sprint ${sprintNumber}`}</StorySprintLabel>
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
