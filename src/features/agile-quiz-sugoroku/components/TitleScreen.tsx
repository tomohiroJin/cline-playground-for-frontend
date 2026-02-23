/**
 * タイトル画面コンポーネント
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { CONFIG, COLORS, FONTS, SPRINT_OPTIONS } from '../constants';
import { AQS_IMAGES } from '../images';
import { loadGameResult } from '../result-storage';
import { ParticleEffect } from './ParticleEffect';
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
  onStart: (sprintCount: number) => void;
  /** 勉強会モード開始時のコールバック */
  onStudy?: () => void;
  /** ガイド画面表示時のコールバック */
  onGuide?: () => void;
}

/** 機能紹介リスト（スプリント数は動的） */
const makeFeatures = (sprintCount: number) => [
  ['📋', `${sprintCount}スプリント`, 'を走破せよ'],
  ['⏱️', `制限時間${CONFIG.timeLimit}秒`, 'の4択クイズ'],
  ['🚨', '技術的負債', 'が溜まると緊急対応発生'],
  ['🏷️', 'エンジニアタイプ', 'を診断'],
  ['🔥', 'コンボボーナス', 'で連続正解を狙え'],
  ['💡', '解説付き', 'で知識を定着'],
];

/**
 * タイトル画面
 */
export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onStudy, onGuide }) => {
  const [sprintCount, setSprintCount] = useState<number>(CONFIG.sprintCount);

  // 前回結果
  const lastResult = useMemo(() => loadGameResult(), []);

  // 機能紹介リスト（スプリント数に連動）
  const features = useMemo(() => makeFeatures(sprintCount), [sprintCount]);

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onStart(sprintCount);
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
            <span style={{ color: COLORS.text }}>{lastResult.engineerTypeName}</span>
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <Button
            $color="#34d399"
            onClick={() => onStart(sprintCount)}
            style={{ padding: '14px 52px', fontSize: 14 }}
          >
            ▶ Sprint Start
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {onStudy && (
              <Button $color={COLORS.accent} onClick={onStudy} style={{ padding: '10px 20px', fontSize: 12 }}>
                📚 勉強会モード
              </Button>
            )}
            {onGuide && (
              <Button $color={COLORS.muted} onClick={onGuide} style={{ padding: '10px 20px', fontSize: 12 }}>
                📖 遊び方 & チーム紹介
              </Button>
            )}
          </div>
        </div>
      </Panel>
    </PageWrapper>
  );
};
