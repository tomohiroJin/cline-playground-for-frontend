/**
 * タイトル画面コンポーネント
 */
import React from 'react';
import { useKeys } from '../hooks';
import { CONFIG } from '../constants';
import { AQS_IMAGES } from '../images';
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
  onStart: () => void;
}

/** 機能紹介リスト */
const FEATURES = [
  ['📋', `${CONFIG.sprintCount}スプリント`, 'を走破せよ'],
  ['⏱️', `制限時間${CONFIG.timeLimit}秒`, 'の4択クイズ'],
  ['🚨', '技術的負債', 'が溜まると緊急対応発生'],
  ['🏷️', 'エンジニアタイプ', 'を診断'],
  ['🔥', 'コンボボーナス', 'で連続正解を狙え'],
  ['💡', '解説付き', 'で知識を定着'],
];

/**
 * タイトル画面
 */
export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onStart();
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

        <SectionBox>
          {FEATURES.map((feature, i) => (
            <FeatureItem key={i}>
              <FeatureIcon>{feature[0]}</FeatureIcon>
              <span>
                <FeatureHighlight>{feature[1]}</FeatureHighlight>
                <FeatureText>{feature[2]}</FeatureText>
              </span>
            </FeatureItem>
          ))}
        </SectionBox>

        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <Button
            $color="#34d399"
            onClick={onStart}
            style={{ padding: '14px 52px', fontSize: 14 }}
          >
            ▶ Sprint Start
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
