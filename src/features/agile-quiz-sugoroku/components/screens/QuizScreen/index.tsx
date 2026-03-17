/**
 * クイズ画面コンポーネント（親コンポーネント）
 * TimerDisplay, OptionsPanel, QuizResult を組み合わせる
 */
import React, { useState } from 'react';
import { useQuizFeedback, useQuizKeys } from '../../../hooks';
import type { GameEvent, Question, GameStats } from '../../../domain/types';
import { CONFIG, PHASE_GENRE_MAP, EVENT_BACKGROUND_MAP } from '../../../constants';
import { AQS_IMAGES } from '../../../images';
import { SugorokuBoard } from '../../SugorokuBoard';
import { FlashOverlay } from '../../FlashOverlay';
import { ComboEffect } from '../../ComboEffect';
import { CharacterReaction } from '../../CharacterReaction';
import {
  PageWrapper,
  Panel,
  Scanlines,
  EventCard,
  EventIcon,
  EventInfo,
  EventName,
  EventDescription,
  EventCounter,
  EventCounterLabel,
  EventCounterValue,
  HeaderInfo,
  SprintLabel,
  HeaderRight,
  DebtIndicator,
  QuizQuestion,
  KeyboardHint,
} from '../../styles';
import { TimerDisplay } from './TimerDisplay';
import { OptionsPanel } from './OptionsPanel';
import { QuizResult } from './QuizResult';
import { PhaseGenreTags } from './PhaseGenreTags';
import { determineReaction } from './quiz-helpers';

interface QuizScreenProps {
  sprint: number;
  eventIndex: number;
  events: GameEvent[];
  quiz: Question;
  options: number[];
  selectedAnswer: number | null;
  stats: GameStats;
  timer: number;
  visible: boolean;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  quizIndex: number;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  sprint,
  eventIndex,
  events,
  quiz,
  options,
  selectedAnswer,
  stats,
  timer,
  visible,
  onAnswer,
  onNext,
  quizIndex: _quizIndex,
}) => {
  const [imgError, setImgError] = useState(false);
  const [bgError, setBgError] = useState(false);
  const event = events[eventIndex];

  const bgKey = EVENT_BACKGROUND_MAP[event.id] as keyof typeof AQS_IMAGES.backgrounds | undefined;
  const bgImage = bgKey ? AQS_IMAGES.backgrounds[bgKey] : undefined;
  const isEmergency = event.id === 'emergency';
  const answered = selectedAnswer !== null;

  const { feedback, isComboBreak } = useQuizFeedback({
    answered, selectedAnswer, correctAnswer: quiz.answer, combo: stats.combo,
  });

  const reactionSituation = determineReaction(
    answered, selectedAnswer, isEmergency, stats.combo, quiz.answer,
  );

  const phaseGenres = PHASE_GENRE_MAP[event.id] ?? [];

  // イベント画像のローカル変数化（型キャスト + non-null assertion 解消）
  const eventImgSrc = AQS_IMAGES.events[event.id as keyof typeof AQS_IMAGES.events];

  useQuizKeys({ answered, options, onAnswer, onNext });

  return (
    <PageWrapper>
      <FlashOverlay type={feedback.flashType} />
      {bgImage && !bgError && (
        <img
          src={bgImage} alt="" aria-hidden="true" onError={() => setBgError(true)}
          style={{
            position: 'fixed', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.15, transition: 'opacity 0.5s ease-in-out',
            zIndex: 0, pointerEvents: 'none',
          }}
        />
      )}
      <Scanlines />
      <Panel $visible={visible}>
        <HeaderInfo>
          <SprintLabel>Sprint {sprint + 1}/{CONFIG.sprintCount}</SprintLabel>
          <HeaderRight>
            {stats.debt > 0 && <DebtIndicator $severe={stats.debt > 20}>⚠ {stats.debt}pt</DebtIndicator>}
          </HeaderRight>
        </HeaderInfo>

        <SugorokuBoard events={events} currentIndex={eventIndex} comboActive={stats.combo >= 2} />

        <EventCard $isEmergency={isEmergency} $color={event.color}>
          {!imgError && eventImgSrc ? (
            <img
              src={eventImgSrc}
              alt={event.name} onError={() => setImgError(true)}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${event.color}` }}
            />
          ) : (
            <EventIcon>{event.icon}</EventIcon>
          )}
          <EventInfo>
            <EventName $isEmergency={isEmergency} $color={event.color}>{event.name}</EventName>
            <EventDescription>{event.description}</EventDescription>
          </EventInfo>
          <EventCounter>
            <EventCounterLabel>EVENT</EventCounterLabel>
            <EventCounterValue>{eventIndex + 1}/{events.length}</EventCounterValue>
          </EventCounter>
        </EventCard>

        <PhaseGenreTags tagIds={phaseGenres} />

        <TimerDisplay timer={timer} answered={answered} />
        <QuizQuestion>{quiz.question}</QuizQuestion>
        <OptionsPanel quiz={quiz} options={options} selectedAnswer={selectedAnswer} onAnswer={onAnswer} />

        {!answered && stats.combo >= 2 && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <ComboEffect combo={stats.combo} />
          </div>
        )}

        {answered && selectedAnswer !== null && (
          <QuizResult
            quiz={quiz}
            selectedAnswer={selectedAnswer}
            stats={stats}
            scoreText={feedback.scoreText}
            isComboBreak={isComboBreak}
            onNext={onNext}
            nextButtonLabel={eventIndex + 1 >= events.length ? '▶ Retrospective' : '▶ Next'}
          />
        )}

        {!answered && <KeyboardHint>⌨ A/B/C/D or 1/2/3/4</KeyboardHint>}
        <CharacterReaction situation={reactionSituation} timer={answered ? undefined : timer} quizTags={quiz.tags} />
      </Panel>
    </PageWrapper>
  );
};
