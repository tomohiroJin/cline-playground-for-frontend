/**
 * Agile Quiz Sugoroku - キャラクターリアクション
 *
 * クイズ中に複数のキャラクターが常時表示され、状況やタイマーに応じたコメントを表示する。
 * 得意分野に応じたヒントも出す。
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { COLORS, FONTS } from '../constants';
import { AQS_IMAGES } from '../images';
import { bubbleFadeIn } from './styles';
import {
  ReactionSituation,
  QUIZ_CHARACTERS,
  getRandomReaction,
  getHintForTags,
} from '../character-reactions';

// ── 定数 ─────────────────────────────────────────────────────

/** idle コメントの切り替え間隔（ms） */
const IDLE_INTERVAL = 5000;
/** 状況コメントの表示時間（ms） */
const SITUATION_DISPLAY_TIME = 2500;

// ── Props 型定義 ─────────────────────────────────────────────

interface CharacterReactionProps {
  /** 表示するリアクションの状況 */
  situation?: ReactionSituation;
  /** 残り時間（秒） */
  timer?: number;
  /** クイズのタグ一覧（ヒント用） */
  quizTags?: string[];
}

// ── キャラ画像マッピング ──────────────────────────────────────

const CHARACTER_IMAGE_MAP: Record<string, string | undefined> = {
  neko: AQS_IMAGES.characters.neko,
  inu: AQS_IMAGES.characters.inu,
  usagi: AQS_IMAGES.characters.usagi,
};

// ── styled-components ────────────────────────────────────────

const Container = styled.div`
  display: flex;
  gap: 4px;
  align-items: flex-end;
  margin-top: 12px;
  padding: 0 4px;
`;

const CharacterUnit = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
`;

const BubbleWrapper = styled.div`
  height: 36px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
`;

const Bubble = styled.div<{ $isHint?: boolean }>`
  background: ${({ $isHint }) => $isHint ? `${COLORS.yellow}18` : COLORS.glass};
  border: 1px solid ${({ $isHint }) => $isHint ? `${COLORS.yellow}44` : COLORS.glassBorder};
  border-radius: 8px 8px 8px 2px;
  padding: 3px 6px;
  font-size: 10px;
  font-family: ${FONTS.jp};
  color: ${({ $isHint }) => $isHint ? COLORS.yellow : COLORS.text};
  text-align: center;
  animation: ${bubbleFadeIn} 0.3s ease-out;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${COLORS.card};
  border: 2px solid ${COLORS.border2};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

// ── タイマーから状況を決定 ───────────────────────────────────

/** タイマー値からリアクション状況を判定する */
const resolveTimerSituation = (
  baseSituation: ReactionSituation | undefined,
  timer: number | undefined,
): ReactionSituation => {
  // 回答後・緊急対応など明示的な状況はそのまま
  if (baseSituation && baseSituation !== 'idle') return baseSituation;

  if (timer === undefined) return 'idle';
  if (timer <= 3 && timer > 0) return 'timeWarning';
  if (timer <= 7 && timer > 0) return 'timeMild';
  return 'idle';
};

// ── 個別キャラフック ─────────────────────────────────────────

interface CharacterState {
  text: string;
  isHint: boolean;
}

const useCharacterComment = (
  characterId: string,
  situation: ReactionSituation,
  quizTags: string[],
  idleDelay: number,
): CharacterState => {
  const [state, setState] = useState<CharacterState>({ text: '', isHint: false });
  const idleTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const prevSituationRef = useRef<ReactionSituation>('idle');
  const hintShownRef = useRef(false);

  const updateIdleComment = useCallback(() => {
    const reaction = getRandomReaction('idle', characterId);
    setState({ text: reaction.text, isHint: false });
  }, [characterId]);

  useEffect(() => {
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
    }

    // 同じ状況の連続更新をスキップ（ガタつき防止）
    if (situation === prevSituationRef.current && state.text) {
      // ただし timeMild でヒントを未表示なら表示する
      if (situation === 'timeMild' && !hintShownRef.current && quizTags.length > 0) {
        const hint = getHintForTags(quizTags, characterId);
        if (hint.characterId === characterId) {
          setState({ text: hint.text, isHint: true });
          hintShownRef.current = true;
        }
      }
      return;
    }
    prevSituationRef.current = situation;

    if (situation === 'idle') {
      // idle: 初回遅延 + 定期更新
      const initialTimeout = setTimeout(updateIdleComment, idleDelay);
      idleTimerRef.current = setInterval(updateIdleComment, IDLE_INTERVAL);
      hintShownRef.current = false;

      return () => {
        clearTimeout(initialTimeout);
        if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      };
    }

    if (situation === 'timeMild') {
      // 残り7秒: 得意キャラはヒント、それ以外は timeMild コメント
      if (quizTags.length > 0 && !hintShownRef.current) {
        const hint = getHintForTags(quizTags, characterId);
        if (hint.characterId === characterId) {
          setState({ text: hint.text, isHint: true });
          hintShownRef.current = true;
          return;
        }
      }
      const reaction = getRandomReaction('timeMild', characterId);
      setState({ text: reaction.text, isHint: false });
      return;
    }

    // その他の状況コメント
    const reaction = getRandomReaction(situation, characterId);
    setState({ text: reaction.text, isHint: false });
    hintShownRef.current = false;

    // 回答後の状況（correct/incorrect/combo）はコメントを固定表示
    const isPostAnswer = situation === 'correct' || situation === 'incorrect' || situation === 'combo';
    if (isPostAnswer) {
      return;
    }

    // それ以外（emergency/timeWarning）は一定時間後に idle に戻す
    const timeout = setTimeout(() => {
      updateIdleComment();
      idleTimerRef.current = setInterval(updateIdleComment, IDLE_INTERVAL);
    }, SITUATION_DISPLAY_TIME);

    return () => {
      clearTimeout(timeout);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [situation, characterId, quizTags, updateIdleComment, idleDelay]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
};

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
