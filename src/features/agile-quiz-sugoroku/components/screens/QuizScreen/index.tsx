/**
 * クイズ画面コンポーネント（親コンポーネント）
 * TimerDisplay, OptionsPanel, QuizResult を組み合わせる
 */
import React, { useState } from 'react';
import { useKeys } from '../../../hooks';
import type { GameEvent, Question, GameStats } from '../../../types';
import { CONFIG, COLORS, PHASE_GENRE_MAP, EVENT_BACKGROUND_MAP } from '../../../constants';
import { TAG_MAP } from '../../../questions/tag-master';
import { AQS_IMAGES } from '../../../images';
import type { ReactionSituation } from '../../../character-reactions';
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
  const [flashType, setFlashType] = useState<'correct' | 'incorrect' | 'timeup' | undefined>();
  const [scoreText, setScoreText] = useState('');
  const [prevCombo, setPrevCombo] = useState(0);
  const event = events[eventIndex];

  const bgKey = EVENT_BACKGROUND_MAP[event.id] as keyof typeof AQS_IMAGES.backgrounds | undefined;
  const bgImage = bgKey ? AQS_IMAGES.backgrounds[bgKey] : undefined;
  const isEmergency = event.id === 'emergency';
  const answered = selectedAnswer !== null;

  const reactionSituation: ReactionSituation = (() => {
    if (isEmergency && !answered) return 'emergency';
    if (!answered) return 'idle';
    if (selectedAnswer === -1) return 'idle';
    if (selectedAnswer === quiz.answer) {
      return stats.combo >= 3 ? 'combo' : 'correct';
    }
    return 'incorrect';
  })();

  const isComboBreak = answered && prevCombo >= 2 && stats.combo === 0;
  const phaseGenres = PHASE_GENRE_MAP[event.id] ?? [];

  React.useEffect(() => {
    if (!answered) {
      setFlashType(undefined);
      setScoreText('');
      return;
    }
    if (selectedAnswer === -1) {
      setFlashType('timeup');
    } else if (selectedAnswer === quiz.answer) {
      setFlashType('correct');
      setScoreText('+10pt');
    } else {
      setFlashType('incorrect');
    }
    setPrevCombo(stats.combo);
    const tid = setTimeout(() => setFlashType(undefined), 600);
    return () => clearTimeout(tid);
  // 意図的に answered のみを依存配列にしている:
  // フラッシュ・スコア表示は「回答した瞬間」にのみトリガーする。
  // selectedAnswer, quiz.answer 等を含めると再実行が過剰になる。
  }, [answered]); // eslint-disable-line react-hooks/exhaustive-deps

  useKeys((e) => {
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') onNext();
      return;
    }
    const keyMap: { [key: string]: number } = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    const idx = keyMap[e.key.toLowerCase()];
    if (idx !== undefined && options[idx] !== undefined) onAnswer(options[idx]);
  });

  return (
    <PageWrapper>
      <FlashOverlay type={flashType} />
      {bgImage && !bgError && (
        <img
          src={bgImage} alt="" onError={() => setBgError(true)}
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
          {!imgError && AQS_IMAGES.events[event.id as keyof typeof AQS_IMAGES.events] ? (
            <img
              src={AQS_IMAGES.events[event.id as keyof typeof AQS_IMAGES.events]!}
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

        {phaseGenres.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {phaseGenres.map((tagId) => {
              const tag = TAG_MAP.get(tagId);
              return (
                <span key={tagId} style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 3,
                  background: `${tag?.color ?? COLORS.accent}10`,
                  border: `1px solid ${tag?.color ?? COLORS.accent}22`,
                  color: tag?.color ?? COLORS.accent, fontWeight: 500,
                }}>{tag?.name ?? tagId}</span>
              );
            })}
          </div>
        )}

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
            eventIndex={eventIndex}
            eventsLength={events.length}
            scoreText={scoreText}
            isComboBreak={isComboBreak}
            onNext={onNext}
          />
        )}

        {!answered && <KeyboardHint>⌨ A/B/C/D or 1/2/3/4</KeyboardHint>}
        <CharacterReaction situation={reactionSituation} timer={answered ? undefined : timer} quizTags={quiz.tags} />
      </Panel>
    </PageWrapper>
  );
};
