/**
 * チャレンジモード結果画面コンポーネント
 */
import React, { useMemo } from 'react';
import { COLORS, FONTS } from '../constants';
import { ChallengeRepository } from '../infrastructure/storage/challenge-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Button,
  Scanlines,
} from './styles';

const challengeRepo = new ChallengeRepository(new LocalStorageAdapter());

interface ChallengeResultScreenProps {
  correctCount: number;
  maxCombo: number;
  onRetry: () => void;
  onBack: () => void;
}

export const ChallengeResultScreen: React.FC<ChallengeResultScreenProps> = ({
  correctCount,
  maxCombo,
  onRetry,
  onBack,
}) => {
  const highScore = useMemo(() => challengeRepo.loadHighScore(), []);
  const isNewRecord = correctCount >= highScore && correctCount > 0;

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />
      <Panel $fadeIn={false} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 10,
            color: COLORS.red,
            letterSpacing: 2,
            fontFamily: FONTS.mono,
            fontWeight: 700,
          }}>
            GAME OVER
          </div>
          <h2 style={{ fontSize: 22, color: COLORS.text2, margin: '8px 0' }}>
            チャレンジ終了
          </h2>
        </div>

        <SectionBox>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
              正解数
            </div>
            <div style={{
              fontSize: 48,
              fontWeight: 800,
              color: COLORS.accent,
              fontFamily: FONTS.mono,
              lineHeight: 1,
            }}>
              {correctCount}
            </div>
            {isNewRecord && (
              <div style={{
                fontSize: 12,
                color: COLORS.yellow,
                fontWeight: 700,
                marginTop: 4,
              }}>
                NEW RECORD!
              </div>
            )}
          </div>
        </SectionBox>

        <SectionBox>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: COLORS.muted }}>最大コンボ</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.orange, fontFamily: FONTS.mono }}>
                {maxCombo}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: COLORS.muted }}>ハイスコア</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.yellow, fontFamily: FONTS.mono }}>
                {Math.max(highScore, correctCount)}
              </div>
            </div>
          </div>
        </SectionBox>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Button $color={COLORS.green} onClick={onRetry} style={{ padding: '12px 40px', fontSize: 13 }}>
            もう一度挑戦
          </Button>
          <Button
            as="a"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `【アジャイル・クイズすごろく チャレンジ】\n正解数: ${correctCount} | 最大コンボ: ${maxCombo}\n#AgileQuizSugoroku`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            $color="#1d9bf0"
            style={{ padding: '10px 32px', fontSize: 12, textDecoration: 'none', display: 'inline-block' }}
          >
            X Share
          </Button>
          <Button $color={COLORS.muted} onClick={onBack} style={{ padding: '10px 32px', fontSize: 12 }}>
            タイトルに戻る
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
