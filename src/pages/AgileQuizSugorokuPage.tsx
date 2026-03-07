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
  StoryScreen,
  AchievementScreen,
  AchievementToast,
  HistoryScreen,
  ChallengeResultScreen,
  DailyQuizScreen,
  CONFIG,
} from '../features/agile-quiz-sugoroku';
import { createDefaultAudioActions } from '../features/agile-quiz-sugoroku/audio/audio-actions';
import { SprintSummary, SaveState, StoryEntry, EndingEntry, Difficulty, AchievementDefinition } from '../features/agile-quiz-sugoroku/types';
import { saveGameResult } from '../features/agile-quiz-sugoroku/result-storage';
import { saveGameState } from '../features/agile-quiz-sugoroku/save-manager';
import { classifyTeamType } from '../features/agile-quiz-sugoroku/team-classifier';
import { getStoriesForSprintCount } from '../features/agile-quiz-sugoroku/story-data';
import { getEndingStories } from '../features/agile-quiz-sugoroku/ending-data';
import { getDifficultyConfig, calculateGradeWithDifficulty } from '../features/agile-quiz-sugoroku/difficulty';
import { checkAchievements } from '../features/agile-quiz-sugoroku/achievements';
import { getUnlockedIds, saveAchievementUnlock } from '../features/agile-quiz-sugoroku/achievement-storage';
import { saveHistory, toHistoryEntry, migrateLastResultToHistory, loadHistory } from '../features/agile-quiz-sugoroku/history-storage';
import { useChallenge } from '../features/agile-quiz-sugoroku/hooks/useChallenge';
import { saveHighScore } from '../features/agile-quiz-sugoroku/challenge-storage';

const audio = createDefaultAudioActions();

/**
 * Agile Quiz Sugoroku ゲームコンポーネント
 */
const AgileQuizSugorokuPage: React.FC = () => {
  const game = useGame(audio);
  const fade = useFade();
  const study = useStudy();
  const challenge = useChallenge();

  // 初回ロード時にマイグレーション実行
  useEffect(() => {
    migrateLastResultToHistory();
  }, []);

  // アンマウント時にBGMを停止
  useEffect(() => {
    return () => {
      audio.onBgmStop();
    };
  }, []);

  // 難易度
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // 難易度に応じた制限時間
  const difficultyConfig = useMemo(() => getDifficultyConfig(difficulty), [difficulty]);

  const countdown = useCountdown(difficultyConfig.timeLimit, {
    onExpire: () => game.answer(-1),
    onTick: audio.onTick,
  });

  // チャレンジモード用タイマー
  const challengeCountdown = useCountdown(CONFIG.timeLimit, {
    onExpire: () => challenge.answer(-1),
    onTick: audio.onTick,
  });

  const [retrospective, setRetrospective] = useState<SprintSummary | null>(null);

  // 実績トースト
  const [newAchievements, setNewAchievements] = useState<AchievementDefinition[]>([]);

  // スプリント数（タイトル画面で選択、デフォルトはCONFIG.sprintCount）
  const [sprintCount, setSprintCount] = useState<number>(CONFIG.sprintCount);

  // ストーリー関連の状態
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryEntry | null>(null);

  // エンディング関連の状態
  const [endingStories, setEndingStories] = useState<EndingEntry[]>([]);
  const [currentEndingIndex, setCurrentEndingIndex] = useState(0);

  // 勉強会モード用の選択済みタグを保持
  const [studySelectedTags, setStudySelectedTags] = useState<string[]>([]);
  const [studyLimit, setStudyLimit] = useState(10);

  /** スプリント番号に対応するストーリーがあればストーリーフェーズへ遷移 */
  const transitionToStoryOrSprint = (sprintIndex: number, storyList: StoryEntry[]) => {
    const story = storyList[sprintIndex];
    if (story) {
      setCurrentStory(story);
      game.setPhase('story');
    } else {
      game.setPhase('sprint-start');
    }
    fade.trigger();
  };

  /** ゲーム開始 */
  const handleStart = (selectedSprintCount: number, selectedDifficulty?: string) => {
    setSprintCount(selectedSprintCount);
    if (selectedDifficulty) {
      setDifficulty(selectedDifficulty as Difficulty);
    }
    const storyList = getStoriesForSprintCount(selectedSprintCount);
    setStories(storyList);
    audio.onInit();
    audio.onStart();
    game.init();
    transitionToStoryOrSprint(0, storyList);
  };

  /** ストーリー完了/スキップ → スプリント開始画面へ */
  const handleStoryComplete = () => {
    setCurrentStory(null);
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

  // エンディング完了後に結果保存で再利用するため、判定済みチームタイプを保持
  const [classifiedTeamType, setClassifiedTeamType] = useState<ReturnType<typeof classifyTeamType> | null>(null);

  /** 現在のゲーム状態からチームタイプを判定 */
  const buildClassifyStats = () => ({
    stab: game.derived.stability,
    debt: game.stats.debt,
    emSuc: game.stats.emergencySuccess,
    sc: game.derived.sprintCorrectRates,
    tp: game.derived.correctRate,
    spd: game.derived.averageSpeed,
  });

  /** ゲーム結果を保存して結果画面へ遷移 */
  const transitionToResult = () => {
    audio.onResult();
    const grade = calculateGradeWithDifficulty(
      game.derived.correctRate,
      game.derived.stability,
      game.derived.averageSpeed,
      difficulty,
    );
    // エンディングで判定済みのチームタイプを再利用
    const teamType = classifiedTeamType ?? classifyTeamType(buildClassifyStats());
    const resultData = {
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
      teamTypeId: teamType.id,
      teamTypeName: teamType.name,
      timestamp: Date.now(),
    };
    saveGameResult(resultData);

    // 履歴に保存
    saveHistory(toHistoryEntry(resultData));

    // 実績判定
    const unlockedIds = getUnlockedIds();
    const history = loadHistory();
    const newlyUnlocked = checkAchievements({
      result: resultData,
      sprintCorrectRates: game.derived.sprintCorrectRates,
      unlockedIds,
      history,
      now: new Date(),
    });
    // 実績をストレージに保存
    const now = Date.now();
    newlyUnlocked.forEach(a => saveAchievementUnlock(a.id, now));
    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked);
    }

    game.setPhase('result');
    fade.trigger();
  };

  /** 振り返り後 */
  const handleAfterRetro = () => {
    const nextSprint = game.sprint + 1;
    if (nextSprint >= sprintCount) {
      // チームタイプを判定してエンディングストーリーを設定
      const teamType = classifyTeamType(buildClassifyStats());
      setClassifiedTeamType(teamType);
      const endings = getEndingStories(teamType.id);
      setEndingStories(endings);
      setCurrentEndingIndex(0);
      game.setPhase('ending');
      fade.trigger();
    } else {
      game.setSprint(nextSprint);
      transitionToStoryOrSprint(nextSprint, stories);
    }
  };

  /** エンディングストーリー完了 → 次のエンディングまたは結果画面へ */
  const handleEndingComplete = () => {
    const nextIndex = currentEndingIndex + 1;
    if (nextIndex < endingStories.length) {
      // 次のエンディングストーリー（共通→エピローグ）
      setCurrentEndingIndex(nextIndex);
      fade.trigger();
    } else {
      // 全エンディング完了 → 結果画面へ
      transitionToResult();
    }
  };

  /** エンディングスキップ → 結果画面へ */
  const handleEndingSkip = () => {
    transitionToResult();
  };

  /** セーブデータから再開 */
  const handleResume = (saveState: SaveState) => {
    setSprintCount(saveState.sprintCount);
    const storyList = getStoriesForSprintCount(saveState.sprintCount);
    setStories(storyList);
    game.restoreFromSave(saveState);
    // セーブデータ復元時はストーリーをスキップしてスプリント開始画面へ
    game.setPhase('sprint-start');
    fade.trigger();
  };

  /** 振り返り画面で保存して中断 */
  const handleSave = () => {
    const saveState = game.buildSaveState(sprintCount);
    saveGameState(saveState);
    // タイトル画面に戻る（少し遅延して遷移）
    setTimeout(() => {
      audio.onBgmStop();
      game.setPhase('title');
      fade.trigger();
    }, 500);
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

  /** 実績画面へ */
  const handleAchievements = () => {
    game.setPhase('achievements');
  };

  /** 履歴画面へ */
  const handleHistory = () => {
    game.setPhase('history');
  };

  /** デイリークイズ画面へ */
  const handleDailyQuiz = () => {
    game.setPhase('daily-quiz');
  };

  /** チャレンジモード開始 */
  const handleChallenge = () => {
    audio.onInit();
    challenge.init();
    game.setPhase('challenge');
  };

  /** チャレンジモード回答 */
  const handleChallengeAnswer = (optionIndex: number) => {
    const result = challenge.answer(optionIndex);
    if (result) {
      challengeCountdown.stop();
      if (result.correct && challenge.combo >= 3) {
        setTimeout(() => audio.onCombo(), 200);
      }
    }
  };

  /** チャレンジモード次へ */
  const handleChallengeNext = () => {
    if (challenge.isGameOver) {
      saveHighScore(challenge.correctCount);
      game.setPhase('challenge-result');
    } else {
      challenge.next();
      challengeCountdown.start();
    }
  };

  /** チャレンジモードリトライ */
  const handleChallengeRetry = () => {
    challenge.init();
    challengeCountdown.start();
    game.setPhase('challenge');
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

  /** EndingEntry を StoryScreen 用の StoryEntry に変換 */
  const currentEndingAsStory = useMemo((): StoryEntry | undefined => {
    if (game.phase !== 'ending' || endingStories.length === 0) return undefined;
    const entry = endingStories[currentEndingIndex];
    if (!entry) return undefined;
    return {
      sprintNumber: 0,
      title: entry.title,
      narratorId: 'taka',
      lines: entry.lines,
      imageKey: entry.imageKey,
    };
  }, [game.phase, endingStories, currentEndingIndex]);

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
          onResume={handleResume}
          onStudy={handleStudyMode}
          onGuide={handleGuide}
          onAchievements={handleAchievements}
          onHistory={handleHistory}
          onChallenge={handleChallenge}
          onDailyQuiz={handleDailyQuiz}
        />
      )}

      {game.phase === 'story' && currentStory && (
        <StoryScreen
          sprintNumber={game.sprint + 1}
          storyData={currentStory}
          onComplete={handleStoryComplete}
          onSkip={handleStoryComplete}
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
          onSave={handleSave}
          sprintCount={sprintCount}
        />
      )}

      {game.phase === 'ending' && currentEndingAsStory && (
        <StoryScreen
          sprintNumber={sprintCount}
          storyData={currentEndingAsStory}
          onComplete={handleEndingComplete}
          onSkip={handleEndingSkip}
          headerLabel="Ending"
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

      {game.phase === 'achievements' && (
        <AchievementScreen onBack={handleBackToTitle} />
      )}

      {game.phase === 'history' && (
        <HistoryScreen onBack={handleBackToTitle} />
      )}

      {game.phase === 'challenge' && challenge.quiz && (
        <QuizScreen
          sprint={0}
          eventIndex={0}
          events={[{ id: 'challenge', name: 'チャレンジ', icon: '\u{1F525}', description: 'サバイバル', color: '#f06070' }]}
          quiz={challenge.quiz}
          options={challenge.options}
          selectedAnswer={challenge.selectedAnswer}
          stats={{
            totalCorrect: challenge.correctCount,
            totalQuestions: challenge.correctCount + (challenge.isGameOver ? 1 : 0),
            speeds: [],
            debt: 0,
            emergencyCount: 0,
            emergencySuccess: 0,
            combo: challenge.combo,
            maxCombo: challenge.maxCombo,
          }}
          timer={challengeCountdown.time}
          visible={true}
          onAnswer={handleChallengeAnswer}
          onNext={handleChallengeNext}
          quizIndex={0}
        />
      )}

      {game.phase === 'daily-quiz' && (
        <DailyQuizScreen onBack={handleBackToTitle} />
      )}

      {game.phase === 'challenge-result' && (
        <ChallengeResultScreen
          correctCount={challenge.correctCount}
          maxCombo={challenge.maxCombo}
          onRetry={handleChallengeRetry}
          onBack={handleBackToTitle}
        />
      )}

      {/* 実績トースト */}
      <AchievementToast
        achievements={newAchievements}
        onComplete={() => setNewAchievements([])}
      />
    </div>
  );
};

export default AgileQuizSugorokuPage;
