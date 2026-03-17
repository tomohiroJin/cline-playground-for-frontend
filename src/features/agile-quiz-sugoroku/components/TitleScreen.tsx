/**
 * タイトル画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { CONFIG, COLORS, FONTS } from '../constants';
import { AQS_IMAGES } from '../images';
import { GameResultRepository } from '../infrastructure/storage/game-repository';
import { SaveRepository } from '../infrastructure/storage/save-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';
import type { SaveState, Difficulty } from '../domain/types';
import { ParticleEffect } from './ParticleEffect';
import { DifficultySelector } from './DifficultySelector';
import { SprintCountSelector } from './screens/SprintCountSelector';
import { OverwriteConfirmDialog } from './screens/OverwriteConfirmDialog';
import { TitleButtons } from './TitleButtons';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Scanlines,
  TitleGlow,
  FeatureItem,
  FeatureIcon,
  FeatureHighlight,
  FeatureText,
  Divider,
} from './styles';

const gameResultRepo = new GameResultRepository(new LocalStorageAdapter());
const saveRepo = new SaveRepository(new LocalStorageAdapter());

interface TitleScreenProps {
  onStart: (sprintCount: number, difficulty?: string) => void;
  onResume?: (saveState: SaveState) => void;
  onStudy?: () => void;
  onGuide?: () => void;
  onAchievements?: () => void;
  onHistory?: () => void;
  onChallenge?: () => void;
  onDailyQuiz?: () => void;
}

/** 機能紹介リスト（スプリント数は動的） */
const makeFeatures = (sprintCount: number) => [
  ['📋', `${sprintCount}スプリント`, 'を走破せよ'],
  ['⏱️', `制限時間${CONFIG.timeLimit}秒`, 'の4択クイズ'],
  ['🚨', '技術的負債', 'が溜まると緊急対応発生'],
  ['🏷️', 'チームタイプ', 'を診断'],
  ['🔥', 'コンボボーナス', 'で連続正解を狙え'],
  ['💡', '解説付き', 'で知識を定着'],
];

/** セーブ日時をフォーマット */
function formatSaveDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart, onResume, onStudy, onGuide, onAchievements, onHistory, onChallenge, onDailyQuiz,
}) => {
  const [sprintCount, setSprintCount] = useState<number>(CONFIG.sprintCount);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const lastResult = useMemo(() => gameResultRepo.load(), []);
  const saveState = useMemo(() => saveRepo.load(), []);
  const features = useMemo(() => makeFeatures(sprintCount), [sprintCount]);

  const handleResume = () => {
    if (saveState && onResume) {
      onResume(saveState);
      saveRepo.delete();
    }
  };

  const handleNewGame = () => {
    if (saveState) {
      setShowOverwriteConfirm(true);
    } else {
      onStart(sprintCount, difficulty);
    }
  };

  const handleConfirmOverwrite = () => {
    saveRepo.delete();
    setShowOverwriteConfirm(false);
    onStart(sprintCount, difficulty);
  };

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') handleNewGame();
  });

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${AQS_IMAGES.title})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.15, filter: 'blur(2px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Panel $fadeIn={false} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <TitleGlow>AGILE QUIZ SUGOROKU</TitleGlow>
          <h1 style={{
            fontSize: 26, color: '#e8edf4', margin: '0 0 6px 0',
            fontWeight: 800, letterSpacing: 2,
          }}>
            アジャイル・クイズすごろく
          </h1>
          <div style={{
            fontSize: 11, color: '#5e6e8a',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
          }}>
            Sprint-Driven Engineer Assessment
          </div>
          <Divider />
        </div>

        {lastResult && (
          <div style={{
            background: `${COLORS.accent}0a`, border: `1px solid ${COLORS.accent}18`,
            borderRadius: 8, padding: '8px 12px', marginBottom: 14,
            fontSize: 11, color: COLORS.muted,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.accent }}>前回:</span>
            <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.text }}>
              {lastResult.grade} rank
            </span>
            <span>正答率 {lastResult.correctRate}%</span>
            <span style={{ color: COLORS.text }}>{lastResult.teamTypeName ?? lastResult.engineerTypeName}</span>
          </div>
        )}

        <SectionBox>
          {features.map((feature, i) => (
            <FeatureItem key={i}>
              <FeatureIcon>{feature[0]}</FeatureIcon>
              <span>
                <FeatureHighlight>{feature[1]}</FeatureHighlight>
                <FeatureText>{feature[2]}</FeatureText>
              </span>
            </FeatureItem>
          ))}
        </SectionBox>

        <SprintCountSelector value={sprintCount} onChange={setSprintCount} />
        <DifficultySelector value={difficulty} onChange={setDifficulty} />

        <TitleButtons
          saveState={saveState}
          onNewGame={handleNewGame}
          formatSaveDate={formatSaveDate}
          navigation={{
            onResume: saveState && onResume ? handleResume : undefined,
            onStudy,
            onGuide,
            onAchievements,
            onHistory,
            onChallenge,
            onDailyQuiz,
          }}
        />

        {showOverwriteConfirm && (
          <OverwriteConfirmDialog
            onConfirm={handleConfirmOverwrite}
            onCancel={() => setShowOverwriteConfirm(false)}
          />
        )}
      </Panel>
    </PageWrapper>
  );
};
