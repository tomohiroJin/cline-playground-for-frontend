/**
 * タイトル画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { CONFIG, COLORS, FONTS, SPRINT_OPTIONS } from '../constants';
import { AQS_IMAGES } from '../images';
import { loadGameResult } from '../result-storage';
import { loadGameState, deleteSaveState } from '../save-manager';
import { SaveState } from '../types';
import { Difficulty } from '../types';
import { ParticleEffect } from './ParticleEffect';
import { DifficultySelector } from './DifficultySelector';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Button,
  HotkeyHint,
  Scanlines,
  TitleGlow,
  FeatureItem,
  FeatureIcon,
  FeatureHighlight,
  FeatureText,
  Divider,
} from './styles';

interface TitleScreenProps {
  /** ゲーム開始時のコールバック */
  onStart: (sprintCount: number, difficulty?: string) => void;
  /** セーブデータからの復元時のコールバック */
  onResume?: (saveState: SaveState) => void;
  /** 勉強会モード開始時のコールバック */
  onStudy?: () => void;
  /** ガイド画面表示時のコールバック */
  onGuide?: () => void;
  /** 実績画面表示時のコールバック */
  onAchievements?: () => void;
  /** 履歴画面表示時のコールバック */
  onHistory?: () => void;
  /** チャレンジモード開始時のコールバック */
  onChallenge?: () => void;
  /** デイリークイズ開始時のコールバック */
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

/**
 * タイトル画面
 */
/** セーブ日時をフォーマット */
function formatSaveDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onResume, onStudy, onGuide, onAchievements, onHistory, onChallenge, onDailyQuiz }) => {
  const [sprintCount, setSprintCount] = useState<number>(CONFIG.sprintCount);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  // 前回結果
  const lastResult = useMemo(() => loadGameResult(), []);

  // セーブデータ
  const saveState = useMemo(() => loadGameState(), []);

  // 機能紹介リスト（スプリント数に連動）
  const features = useMemo(() => makeFeatures(sprintCount), [sprintCount]);

  /** 「続きから」ボタン */
  const handleResume = () => {
    if (saveState && onResume) {
      onResume(saveState);
      deleteSaveState();
    }
  };

  /** 新しいゲーム開始（セーブデータ上書き確認付き） */
  const handleNewGame = () => {
    if (saveState) {
      setShowOverwriteConfirm(true);
    } else {
      onStart(sprintCount, difficulty);
    }
  };

  /** 上書き確認OK */
  const handleConfirmOverwrite = () => {
    deleteSaveState();
    setShowOverwriteConfirm(false);
    onStart(sprintCount, difficulty);
  };

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleNewGame();
    }
  });

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />

      {/* Background Image Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${AQS_IMAGES.title})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        filter: 'blur(2px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <Panel $fadeIn={false} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <TitleGlow>AGILE QUIZ SUGOROKU</TitleGlow>
          <h1
            style={{
              fontSize: 26,
              color: '#e8edf4',
              margin: '0 0 6px 0',
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            アジャイル・クイズすごろく
          </h1>
          <div
            style={{
              fontSize: 11,
              color: '#5e6e8a',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1,
            }}
          >
            Sprint-Driven Engineer Assessment
          </div>
          <Divider />
        </div>

        {/* 前回結果サマリー */}
        {lastResult && (
          <div
            style={{
              background: `${COLORS.accent}0a`,
              border: `1px solid ${COLORS.accent}18`,
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 14,
              fontSize: 11,
              color: COLORS.muted,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.accent }}>
              前回:
            </span>
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

        {/* スプリント数選択 */}
        <SectionBox>
          <div style={{
            fontSize: 10,
            color: COLORS.muted,
            letterSpacing: 2,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            SPRINT COUNT
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {SPRINT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setSprintCount(n)}
                style={{
                  background: sprintCount === n ? `${COLORS.accent}22` : `${COLORS.bg}dd`,
                  border: `1px solid ${sprintCount === n ? COLORS.accent : COLORS.border}`,
                  color: sprintCount === n ? COLORS.accent : COLORS.muted,
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: sprintCount === n ? 700 : 400,
                  fontFamily: FONTS.mono,
                  transition: 'all 0.2s',
                  minWidth: 44,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </SectionBox>

        {/* 難易度選択 */}
        <DifficultySelector value={difficulty} onChange={setDifficulty} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 4 }}>
          {/* 「続きから」ボタン */}
          {saveState && onResume && (
            <Button
              $color={COLORS.yellow}
              onClick={handleResume}
              style={{ padding: '12px 44px', fontSize: 13 }}
            >
              ▶ 続きから（スプリント {saveState.currentSprint + 1}/{saveState.sprintCount} - {formatSaveDate(saveState.timestamp)}）
            </Button>
          )}

          <Button
            $color="#34d399"
            onClick={handleNewGame}
            style={{ padding: '14px 52px', fontSize: 14 }}
          >
            ▶ Sprint Start
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {onChallenge && (
              <Button $color={COLORS.red} onClick={onChallenge} style={{ padding: '10px 32px', fontSize: 12 }}>
                Challenge
              </Button>
            )}
            {onDailyQuiz && (
              <Button $color={COLORS.green} onClick={onDailyQuiz} style={{ padding: '10px 32px', fontSize: 12 }}>
                Daily Quiz
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {onStudy && (
              <Button $color={COLORS.accent} onClick={onStudy} style={{ padding: '10px 20px', fontSize: 12 }}>
                勉強会モード
              </Button>
            )}
            {onAchievements && (
              <Button $color={COLORS.yellow} onClick={onAchievements} style={{ padding: '10px 20px', fontSize: 12 }}>
                実績
              </Button>
            )}
            {onHistory && (
              <Button $color={COLORS.cyan} onClick={onHistory} style={{ padding: '10px 20px', fontSize: 12 }}>
                履歴
              </Button>
            )}
            {onGuide && (
              <Button $color={COLORS.muted} onClick={onGuide} style={{ padding: '10px 20px', fontSize: 12 }}>
                遊び方
              </Button>
            )}
          </div>
        </div>

        {/* セーブデータ上書き確認ダイアログ */}
        {showOverwriteConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border2}`,
              borderRadius: 12,
              padding: '24px 32px',
              maxWidth: 360,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, color: COLORS.text, marginBottom: 16 }}>
                セーブデータがあります。新しいゲームを開始すると上書きされます。
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Button $color={COLORS.red} onClick={handleConfirmOverwrite} style={{ padding: '10px 20px', fontSize: 12 }}>
                  上書きして開始
                </Button>
                <Button $color={COLORS.muted} onClick={() => setShowOverwriteConfirm(false)} style={{ padding: '10px 20px', fontSize: 12 }}>
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </PageWrapper>
  );
};
