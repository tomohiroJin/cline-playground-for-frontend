/**
 * キャラクターコメント管理フック
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactionSituation,
  getRandomReaction,
  getHintForTags,
} from '../character-reactions';

/** idle コメントの切り替え間隔（ms） */
const IDLE_INTERVAL = 5000;
/** 状況コメントの表示時間（ms） */
const SITUATION_DISPLAY_TIME = 2500;

export interface CharacterState {
  text: string;
  isHint: boolean;
}

/** タイマー値からリアクション状況を判定する */
export const resolveTimerSituation = (
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

export const useCharacterComment = (
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
