/**
 * クイズ画面コンポーネント
 */
import React, { useState } from 'react';
import { useKeys } from '../hooks';
import { GameEvent, Question, GameStats } from '../types';
import { CONFIG, COLORS, OPTION_LABELS, EXPLANATIONS } from '../constants';
import {
  PageWrapper,
  Panel,
  Scanlines,
  TimelineContainer,
  TimelineItem,
  TimelinePulse,
  TimerContainer,
  TimerValue,
  TimerBar,
  TimerProgress,
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
  ComboGlow,
  DebtIndicator,
  QuizQuestion,
  OptionsContainer,
  OptionButton,
  OptionLabel,
  OptionText,
  OptionIcon,
  ResultBanner,
  BannerMessage,
  BannerSub,
  BannerExplain,
  Button,
  HotkeyHint,
  KeyboardHint,
} from './styles';

interface QuizScreenProps {
  /** スプリント番号（0始まり） */
  sprint: number;
  /** 現在のイベントインデックス */
  eventIndex: number;
  /** イベント一覧 */
  events: GameEvent[];
  /** 現在のクイズ */
  quiz: Question;
  /** 選択肢の並び順 */
  options: number[];
  /** 選択された回答（null=未回答） */
  selectedAnswer: number | null;
  /** ゲーム統計 */
  stats: GameStats;
  /** 残り時間 */
  timer: number;
  /** 表示状態 */
  visible: boolean;
  /** 回答時のコールバック */
  onAnswer: (optionIndex: number) => void;
  /** 次へ進む時のコールバック */
  onNext: () => void;
  /** 問題インデックス */
  quizIndex: number;
}

/**
 * クイズ画面
 */
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
  quizIndex,
}) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const event = events[eventIndex];
  const isEmergency = event.id === 'emergency';
  const answered = selectedAnswer !== null;
  const comboShow = stats.combo >= 2 && !answered;

  // 解説を取得
  const explanationMap = EXPLANATIONS[event.id];
  const explanation = answered && explanationMap ? explanationMap[quizIndex] : undefined;

  // タイマーの色
  const timerColor =
    timer <= 3 ? COLORS.red : timer <= 7 ? COLORS.yellow : COLORS.accent;

  // キーボード操作
  useKeys((e) => {
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') {
        onNext();
      }
      return;
    }

    const keyMap: { [key: string]: number } = {
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
      a: 0,
      b: 1,
      c: 2,
      d: 3,
    };
    const idx = keyMap[e.key.toLowerCase()];
    if (idx !== undefined && options[idx] !== undefined) {
      onAnswer(options[idx]);
    }
  });

  return (
    <PageWrapper>
      <Scanlines />
      <Panel $visible={visible}>
        {/* ヘッダー情報 */}
        <HeaderInfo>
          <SprintLabel>
            Sprint {sprint + 1}/{CONFIG.sprintCount}
          </SprintLabel>
          <HeaderRight>
            {comboShow && <ComboGlow>🔥 {stats.combo} COMBO</ComboGlow>}
            {stats.debt > 0 && (
              <DebtIndicator $severe={stats.debt > 20}>
                ⚠ {stats.debt}pt
              </DebtIndicator>
            )}
          </HeaderRight>
        </HeaderInfo>

        {/* タイムライン */}
        <TimelineContainer>
          {events.map((ev, i) => {
            const done = i < eventIndex;
            const active = i === eventIndex;
            const evIsEmergency = ev.id === 'emergency';
            return (
              <TimelineItem
                key={i}
                $done={done}
                $active={active}
                $isEmergency={evIsEmergency}
                $color={ev.color}
              >
                <div />
                {active && (
                  <TimelinePulse $isEmergency={evIsEmergency} $color={ev.color} />
                )}
              </TimelineItem>
            );
          })}
        </TimelineContainer>

        {/* イベント情報 */}
        <EventCard $isEmergency={isEmergency} $color={event.color}>
          <EventIcon>{event.ic}</EventIcon>
          <EventInfo>
            <EventName $isEmergency={isEmergency} $color={event.color}>
              {event.nm}
            </EventName>
            <EventDescription>{event.ds}</EventDescription>
          </EventInfo>
          <EventCounter>
            <EventCounterLabel>EVENT</EventCounterLabel>
            <EventCounterValue>
              {eventIndex + 1}/{events.length}
            </EventCounterValue>
          </EventCounter>
        </EventCard>

        {/* タイマー（回答前のみ） */}
        {!answered && (
          <TimerContainer>
            <TimerValue
              $color={timerColor}
              $pulse={timer <= 5 && timer > 0}
              $shake={timer <= 3 && timer > 0}
            >
              {timer}
            </TimerValue>
            <TimerBar>
              <TimerProgress $ratio={timer / CONFIG.timeLimit} $color={timerColor} />
            </TimerBar>
          </TimerContainer>
        )}

        {/* 問題文 */}
        <QuizQuestion>{quiz.q}</QuizQuestion>

        {/* 選択肢 */}
        <OptionsContainer>
          {options.map((optionIndex, i) => {
            const isCorrect = optionIndex === quiz.a;
            const isSelected = selectedAnswer === optionIndex;
            const hovered = hoveredOption === i;

            return (
              <OptionButton
                key={i}
                $answered={answered}
                $isCorrect={isCorrect}
                $isSelected={isSelected}
                $hovered={hovered}
                disabled={answered}
                onClick={() => onAnswer(optionIndex)}
                onMouseEnter={() => setHoveredOption(i)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <OptionLabel
                  $answered={answered}
                  $isCorrect={isCorrect}
                  $isSelected={isSelected}
                >
                  {OPTION_LABELS[i]}
                </OptionLabel>
                <OptionText>{quiz.o[optionIndex]}</OptionText>
                {answered && isCorrect && <OptionIcon>✓</OptionIcon>}
                {answered && isSelected && !isCorrect && <OptionIcon>✗</OptionIcon>}
              </OptionButton>
            );
          })}
        </OptionsContainer>

        {/* 結果表示 */}
        {answered && (
          <div>
            <ResultBanner $ok={selectedAnswer === quiz.a}>
              <BannerMessage>
                {selectedAnswer === -1
                  ? '⏱️ TIME UP'
                  : selectedAnswer === quiz.a
                  ? '✓ CORRECT'
                  : '✗ INCORRECT'}
              </BannerMessage>
              {stats.combo > 1 && (
                <BannerSub>
                  {selectedAnswer === quiz.a
                    ? `🔥 ${stats.combo} COMBO!`
                    : 'Combo Reset…'}
                </BannerSub>
              )}
              {explanation && (
                <BannerExplain
                  $color={selectedAnswer === quiz.a ? COLORS.green : COLORS.red}
                >
                  💡 {explanation}
                </BannerExplain>
              )}
            </ResultBanner>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={onNext}>
                {eventIndex + 1 >= events.length ? '▶ Retrospective' : '▶ Next'}
                <HotkeyHint>[Enter]</HotkeyHint>
              </Button>
            </div>
          </div>
        )}

        {/* キーボードヒント */}
        {!answered && <KeyboardHint>⌨ A/B/C/D or 1/2/3/4</KeyboardHint>}
      </Panel>
    </PageWrapper>
  );
};
