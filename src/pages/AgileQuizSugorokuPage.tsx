/**
 * Agile Quiz Sugoroku ゲームページ
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  useGame,
  useCountdown,
  useFade,
  useStudy,
  TitleScreen,
  SprintStartScreen,
  QuizScreen,
  RetrospectiveScreen,
  ResultScreen,
  StudySelectScreen,
  StudyScreen,
  StudyResultScreen,
  GuideScreen,
  CONFIG,
} from '../features/agile-quiz-sugoroku';
import { createDefaultAudioActions } from '../features/agile-quiz-sugoroku/audio/audio-actions';
import { SprintSummary, GamePhase } from '../features/agile-quiz-sugoroku/types';
import { saveGameResult } from '../features/agile-quiz-sugoroku/result-storage';
import { getGrade } from '../features/agile-quiz-sugoroku/constants';
import { classifyEngineerType } from '../features/agile-quiz-sugoroku/engineer-classifier';

const audio = createDefaultAudioActions();

/**
 * Agile Quiz Sugoroku ゲームコンポーネント
 */
const AgileQuizSugorokuPage: React.FC = () => {
  const game = useGame(audio);
  const fade = useFade();
  const study = useStudy();

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

  // スプリント数（タイトル画面で選択、デフォルトはCONFIG.sprintCount）
  const [sprintCount, setSprintCount] = useState<number>(CONFIG.sprintCount);

  // 勉強会モード用の選択済みタグを保持
  const [studySelectedTags, setStudySelectedTags] = useState<string[]>([]);
  const [studyLimit, setStudyLimit] = useState(10);

  /** ゲーム開始 */
  const handleStart = (selectedSprintCount: number) => {
    setSprintCount(selectedSprintCount);
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
    if (nextSprint >= sprintCount) {
      audio.onResult();
      // ゲーム結果を保存
      const grade = getGrade(game.derived.correctRate, game.derived.stability, game.derived.averageSpeed);
      const engineerType = classifyEngineerType({
        stab: game.derived.stability,
        debt: game.stats.debt,
        emSuc: game.stats.emergencySuccess,
        sc: game.derived.sprintCorrectRates,
        tp: game.derived.correctRate,
        spd: game.derived.averageSpeed,
      });
      saveGameResult({
        totalCorrect: game.stats.totalCorrect,
        totalQuestions: game.stats.totalQuestions,
        correctRate: game.derived.correctRate,
        averageSpeed: game.derived.averageSpeed,
        stability: game.derived.stability,
        debt: game.stats.debt,
        maxCombo: game.stats.maxCombo,
        tagStats: game.tagStats,
        incorrectQuestions: game.incorrectQuestions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          selectedAnswer: q.selectedAnswer,
          correctAnswer: q.correctAnswer,
          tags: q.tags,
          explanation: q.explanation,
        })),
        sprintLog: game.log,
        grade: grade.grade,
        gradeLabel: grade.label,
        engineerTypeId: engineerType.id,
        engineerTypeName: engineerType.name,
        timestamp: Date.now(),
      });
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

  /** 勉強会モード画面へ */
  const handleStudyMode = () => {
    game.setPhase('study-select');
  };

  /** ガイド画面へ */
  const handleGuide = () => {
    game.setPhase('guide');
  };

  /** BGM不要の画面からタイトルに戻る */
  const handleBackToTitle = () => {
    game.setPhase('title');
    fade.trigger();
  };

  /** 勉強会モード開始 */
  const handleStudyStart = (selectedTags: string[], limit: number) => {
    setStudySelectedTags(selectedTags);
    setStudyLimit(limit);
    study.init(selectedTags, limit);
    game.setPhase('study');
  };

  /** 勉強会モード回答 */
  const handleStudyAnswer = (optionIndex: number) => {
    study.answer(optionIndex);
  };

  /** 勉強会モード次へ */
  const handleStudyNext = () => {
    study.next();
  };

  /** 勉強会モード終了 */
  const handleStudyFinish = () => {
    study.finish();
  };

  /** 勉強会モードもう一度 */
  const handleStudyRetry = () => {
    study.init(studySelectedTags, studyLimit);
  };

  // 結果画面用のデータ
  const resultData = useMemo(() => {
    if (game.phase !== 'result') return null;
    return {
      derived: game.derived,
      stats: game.stats,
      log: game.log,
      tagStats: game.tagStats,
      incorrectQuestions: game.incorrectQuestions,
    };
  }, [game.phase, game.derived, game.stats, game.log, game.tagStats, game.incorrectQuestions]);

  return (
    <div>
      {game.phase === 'title' && (
        <TitleScreen
          onStart={handleStart}
          onStudy={handleStudyMode}
          onGuide={handleGuide}
        />
      )}

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
          tagStats={resultData.tagStats}
          incorrectQuestions={resultData.incorrectQuestions}
          sprintCount={sprintCount}
        />
      )}

      {game.phase === 'guide' && (
        <GuideScreen onBack={handleBackToTitle} />
      )}

      {game.phase === 'study-select' && (
        <StudySelectScreen
          onStart={handleStudyStart}
          onBack={handleBackToTitle}
        />
      )}

      {game.phase === 'study' && !study.finished && study.currentQuestion && (
        <StudyScreen
          question={study.currentQuestion}
          currentIndex={study.currentIndex}
          totalCount={study.questions.length}
          selectedAnswer={study.selectedAnswer}
          answered={study.answered}
          onAnswer={handleStudyAnswer}
          onNext={handleStudyNext}
          onFinish={handleStudyFinish}
        />
      )}

      {game.phase === 'study' && study.finished && (
        <StudyResultScreen
          tagStats={study.tagStats}
          incorrectQuestions={study.incorrectQuestions}
          totalCorrect={study.totalCorrect}
          totalAnswered={study.totalAnswered}
          onRetry={handleStudyRetry}
          onBack={handleBackToTitle}
        />
      )}
    </div>
  );
};

export default AgileQuizSugorokuPage;
