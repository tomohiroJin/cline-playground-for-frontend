/**
 * Agile Quiz Sugoroku ゲームページ
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  useGame,
  useCountdown,
  useFade,
  TitleScreen,
  SprintStartScreen,
  QuizScreen,
  RetrospectiveScreen,
  ResultScreen,
  CONFIG,
} from '../features/agile-quiz-sugoroku';
import { createDefaultAudioActions } from '../features/agile-quiz-sugoroku/audio/audio-actions';
import { SprintSummary } from '../features/agile-quiz-sugoroku/types';

const audio = createDefaultAudioActions();

/**
 * Agile Quiz Sugoroku ゲームコンポーネント
 */
const AgileQuizSugorokuPage: React.FC = () => {
  const game = useGame(audio);
  const fade = useFade();

  // アンマウント時にBGMを停止
  useEffect(() => {
    return () => {
      audio.onBgmStop();
    };
  }, []);
  const countdown = useCountdown(CONFIG.timeLimit, {
    onExpire: () => game.answer(-1),
    onTick: audio.onTick,
  });
  const [retrospective, setRetrospective] = useState<SprintSummary | null>(null);

  /** ゲーム開始 */
  const handleStart = () => {
    audio.onInit();
    audio.onStart();
    game.init();
    game.setPhase('sprint-start');
    fade.trigger();
  };

  /** スプリント開始 */
  const handleBegin = () => {
    game.begin(game.sprint, game.stats, game.usedQuestions);
    game.setPhase('game');
    countdown.start();
    audio.onBgmStart();
    fade.trigger();
  };

  /** 回答 */
  const handleAnswer = (optionIndex: number) => {
    const result = game.answer(optionIndex);
    if (result) {
      countdown.stop();
      // コンボ効果音
      if (result.correct && game.stats.combo >= 3) {
        setTimeout(() => audio.onCombo(), 200);
      }
    }
  };

  /** 次へ */
  const handleNext = () => {
    if (game.advance()) {
      countdown.start();
      fade.trigger();
    } else {
      audio.onBgmStop();
      setRetrospective(game.finish());
      game.setPhase('retro');
      fade.trigger();
    }
  };

  /** 振り返り後 */
  const handleAfterRetro = () => {
    const nextSprint = game.sprint + 1;
    if (nextSprint >= CONFIG.sprintCount) {
      audio.onResult();
      game.setPhase('result');
      fade.trigger();
    } else {
      game.setSprint(nextSprint);
      game.setPhase('sprint-start');
      fade.trigger();
    }
  };

  /** リプレイ */
  const handleReplay = () => {
    audio.onBgmStop();
    game.setPhase('title');
    fade.trigger();
  };

  // 結果画面用のデータ
  const resultData = useMemo(() => {
    if (game.phase !== 'result') return null;
    return {
      derived: game.derived,
      stats: game.stats,
      log: game.log,
    };
  }, [game.phase, game.derived, game.stats, game.log]);

  return (
    <div>
      {game.phase === 'title' && <TitleScreen onStart={handleStart} />}

      {game.phase === 'sprint-start' && (
        <SprintStartScreen
          sprint={game.sprint}
          stats={game.stats}
          derived={game.derived}
          visible={fade.visible}
          onBegin={handleBegin}
        />
      )}

      {game.phase === 'game' && game.quiz && (
        <QuizScreen
          sprint={game.sprint}
          eventIndex={game.eventIndex}
          events={game.events}
          quiz={game.quiz}
          options={game.options}
          selectedAnswer={game.selectedAnswer}
          stats={game.stats}
          timer={countdown.time}
          visible={fade.visible}
          onAnswer={handleAnswer}
          onNext={handleNext}
          quizIndex={game.quizIndex}
        />
      )}

      {game.phase === 'retro' && retrospective && (
        <RetrospectiveScreen
          summary={retrospective}
          log={game.log}
          stats={game.stats}
          sprint={game.sprint}
          visible={fade.visible}
          onNext={handleAfterRetro}
        />
      )}

      {game.phase === 'result' && resultData && (
        <ResultScreen
          derived={resultData.derived}
          stats={resultData.stats}
          log={resultData.log}
          onReplay={handleReplay}
        />
      )}
    </div>
  );
};

export default AgileQuizSugorokuPage;
