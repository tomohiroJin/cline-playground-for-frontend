/**
 * クイズ画面コンポーネント
 */
import React, { useState } from 'react';
import { useKeys } from '../hooks';
import { GameEvent, Question, GameStats } from '../types';
import { CONFIG, COLORS, OPTION_LABELS, PHASE_GENRE_MAP, EVENT_BACKGROUND_MAP } from '../constants';
import { TAG_MAP } from '../questions/tag-master';
import { AQS_IMAGES } from '../images';
import type { ReactionSituation } from '../character-reactions';
import { SugorokuBoard } from './SugorokuBoard';
import { FlashOverlay } from './FlashOverlay';
import { ScoreFloat } from './ScoreFloat';
import { ComboEffect } from './ComboEffect';
import { CharacterReaction } from './CharacterReaction';
import {
  PageWrapper,
  Panel,
  Scanlines,
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
  DebtIndicator,
  QuizQuestion,
  OptionsContainer,
  OptionButton,
  OptionLabel,
  OptionText,
  OptionIcon,
  ResultBanner,
  BannerMessage,
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
  quizIndex: _quizIndex,
}) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [flashType, setFlashType] = useState<'correct' | 'incorrect' | 'timeup' | undefined>();
  const [scoreText, setScoreText] = useState('');
  const [prevCombo, setPrevCombo] = useState(0);
  const event = events[eventIndex];

  // 背景画像の取得
  const bgKey = EVENT_BACKGROUND_MAP[event.id] as keyof typeof AQS_IMAGES.backgrounds | undefined;
  const bgImage = bgKey ? AQS_IMAGES.backgrounds[bgKey] : undefined;
  const isEmergency = event.id === 'emergency';
  const answered = selectedAnswer !== null;

  // リアクションの状況を判定（タイマー段階は CharacterReaction 側で解決）
  const reactionSituation: ReactionSituation = (() => {
    if (isEmergency && !answered) return 'emergency';
    if (!answered) return 'idle';
    if (selectedAnswer === -1) return 'idle';
    if (selectedAnswer === quiz.answer) {
      return stats.combo >= 3 ? 'combo' : 'correct';
    }
    return 'incorrect';
  })();

  // コンボ途切れ判定
  const isComboBreak = answered && prevCombo >= 2 && stats.combo === 0;

  // 解説を取得（quiz.explanation 直接参照）
  const explanation = answered ? quiz.explanation : undefined;

  // 現在の工程に関連するジャンルタグ
  const phaseGenres = PHASE_GENRE_MAP[event.id] ?? [];

  // タイマーの色（段階的な緊迫感）
  const timerColor =
    timer <= 2 ? COLORS.red : timer <= 4 ? COLORS.red2 : timer <= 7 ? COLORS.yellow : COLORS.accent;

  // 回答時のフラッシュとスコア表示
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
    // フラッシュを自動解除
    const tid = setTimeout(() => setFlashType(undefined), 600);
    return () => clearTimeout(tid);
  }, [answered]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* フラッシュオーバーレイ */}
      <FlashOverlay type={flashType} />

      {/* タイマー緊迫オーバーレイ */}
      {!answered && timer <= 2 && timer > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: COLORS.red,
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 50,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* 背景画像 */}
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
            opacity: 0.15,
            transition: 'opacity 0.5s ease-in-out',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <Scanlines />
      <Panel $visible={visible}>
        {/* ヘッダー情報 */}
        <HeaderInfo>
          <SprintLabel>
            Sprint {sprint + 1}/{CONFIG.sprintCount}
          </SprintLabel>
          <HeaderRight>
            {stats.debt > 0 && (
              <DebtIndicator $severe={stats.debt > 20}>
                ⚠ {stats.debt}pt
              </DebtIndicator>
            )}
          </HeaderRight>
        </HeaderInfo>

        {/* すごろくボード */}
        <SugorokuBoard
          events={events}
          currentIndex={eventIndex}
          comboActive={stats.combo >= 2}
        />

        {/* イベント情報 */}
        <EventCard $isEmergency={isEmergency} $color={event.color}>
          {!imgError && AQS_IMAGES.events[event.id as keyof typeof AQS_IMAGES.events] ? (
            <img
              src={AQS_IMAGES.events[event.id as keyof typeof AQS_IMAGES.events]!}
              alt={event.name}
              onError={() => setImgError(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `2px solid ${event.color}`,
              }}
            />
          ) : (
            <EventIcon>{event.icon}</EventIcon>
          )}
          <EventInfo>
            <EventName $isEmergency={isEmergency} $color={event.color}>
              {event.name}
            </EventName>
            <EventDescription>{event.description}</EventDescription>
          </EventInfo>
          <EventCounter>
            <EventCounterLabel>EVENT</EventCounterLabel>
            <EventCounterValue>
              {eventIndex + 1}/{events.length}
            </EventCounterValue>
          </EventCounter>
        </EventCard>

        {/* ジャンルタグ */}
        {phaseGenres.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {phaseGenres.map((tagId) => {
              const tag = TAG_MAP.get(tagId);
              return (
                <span
                  key={tagId}
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: `${tag?.color ?? COLORS.accent}10`,
                    border: `1px solid ${tag?.color ?? COLORS.accent}22`,
                    color: tag?.color ?? COLORS.accent,
                    fontWeight: 500,
                  }}
                >
                  {tag?.name ?? tagId}
                </span>
              );
            })}
          </div>
        )}

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
        <QuizQuestion>{quiz.question}</QuizQuestion>

        {/* 選択肢 */}
        <OptionsContainer>
          {options.map((optionIndex, i) => {
            const isCorrect = optionIndex === quiz.answer;
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
                <OptionText>{quiz.options[optionIndex]}</OptionText>
                {answered && isCorrect && <OptionIcon>✓</OptionIcon>}
                {answered && isSelected && !isCorrect && <OptionIcon>✗</OptionIcon>}
              </OptionButton>
            );
          })}
        </OptionsContainer>

        {/* コンボエフェクト（回答前） */}
        {!answered && stats.combo >= 2 && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <ComboEffect combo={stats.combo} />
          </div>
        )}

        {/* 結果表示 */}
        {answered && (
          <div>
            <ResultBanner $ok={selectedAnswer === quiz.answer}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={selectedAnswer === -1
                    ? AQS_IMAGES.feedback.timeup
                    : selectedAnswer === quiz.answer
                      ? AQS_IMAGES.feedback.correct
                      : AQS_IMAGES.feedback.incorrect}
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginBottom: 8,
                    border: '2px solid white',
                  }}
                />
                {/* スコアフロート */}
                {scoreText && selectedAnswer === quiz.answer && (
                  <ScoreFloat text={scoreText} color={COLORS.green} />
                )}
              </div>
              <BannerMessage>
                {selectedAnswer === -1
                  ? '⏱️ TIME UP'
                  : selectedAnswer === quiz.answer
                  ? '✓ CORRECT'
                  : '✗ INCORRECT'}
              </BannerMessage>
              {/* コンボ or コンボ途切れ */}
              {selectedAnswer === quiz.answer && stats.combo >= 2 && (
                <div style={{ marginTop: 6 }}>
                  <ComboEffect combo={stats.combo} />
                </div>
              )}
              {isComboBreak && (
                <div style={{ marginTop: 6 }}>
                  <ComboEffect combo={0} isBreak />
                </div>
              )}
              {explanation && (
                <BannerExplain
                  $color={selectedAnswer === quiz.answer ? COLORS.green : COLORS.red}
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

        {/* キャラクターリアクション（常時表示・フロー内配置） */}
        <CharacterReaction
          situation={reactionSituation}
          timer={answered ? undefined : timer}
          quizTags={quiz.tags}
        />
      </Panel>
    </PageWrapper>
  );
};
