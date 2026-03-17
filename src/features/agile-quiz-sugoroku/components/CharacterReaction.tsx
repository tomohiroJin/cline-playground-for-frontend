/**
 * Agile Quiz Sugoroku - キャラクターリアクション
 *
 * クイズ中に複数のキャラクターが常時表示され、状況やタイマーに応じたコメントを表示する。
 * 得意分野に応じたヒントも出す。
 */
import React, { useState } from 'react';
import { AQS_IMAGES } from '../images';
import { ReactionSituation, QUIZ_CHARACTERS } from '../character-reactions';
import { resolveTimerSituation, useCharacterComment } from './useCharacterComment';
import {
  Container,
  CharacterUnit,
  BubbleWrapper,
  Bubble,
  Avatar,
  AvatarImage,
} from './character-reaction-styles';

// ── キャラ画像マッピング ──────────────────────────────────────

const CHARACTER_IMAGE_MAP: Record<string, string | undefined> = {
  neko: AQS_IMAGES.characters.neko,
  inu: AQS_IMAGES.characters.inu,
  usagi: AQS_IMAGES.characters.usagi,
};

// ── Props 型定義 ─────────────────────────────────────────────

interface CharacterReactionProps {
  /** 表示するリアクションの状況 */
  situation?: ReactionSituation;
  /** 残り時間（秒） */
  timer?: number;
  /** クイズのタグ一覧（ヒント用） */
  quizTags?: string[];
}

// ── コンポーネント ───────────────────────────────────────────

export const CharacterReaction: React.FC<CharacterReactionProps> = ({
  situation,
  timer,
  quizTags = [],
}) => {
  const resolvedSituation = resolveTimerSituation(situation, timer);

  return (
    <Container data-testid="character-reaction">
      {QUIZ_CHARACTERS.map((character, index) => (
        <SingleCharacter
          key={character.id}
          characterId={character.id}
          emoji={character.emoji}
          situation={resolvedSituation}
          quizTags={quizTags}
          idleDelay={index * 1200}
        />
      ))}
    </Container>
  );
};

// ── 個別キャラコンポーネント ──────────────────────────────────

interface SingleCharacterProps {
  characterId: string;
  emoji: string;
  situation: ReactionSituation;
  quizTags: string[];
  idleDelay: number;
}

const SingleCharacter: React.FC<SingleCharacterProps> = ({
  characterId,
  emoji,
  situation,
  quizTags,
  idleDelay,
}) => {
  const { text, isHint } = useCharacterComment(characterId, situation, quizTags, idleDelay);
  const [imgError, setImgError] = useState(false);
  const imageSrc = CHARACTER_IMAGE_MAP[characterId];

  return (
    <CharacterUnit>
      <BubbleWrapper>
        {text && <Bubble key={`${text}-${isHint}`} $isHint={isHint}>{text}</Bubble>}
      </BubbleWrapper>
      <Avatar>
        {imageSrc && !imgError ? (
          <AvatarImage
            src={imageSrc}
            alt={characterId}
            onError={() => setImgError(true)}
          />
        ) : (
          emoji
        )}
      </Avatar>
    </CharacterUnit>
  );
};
