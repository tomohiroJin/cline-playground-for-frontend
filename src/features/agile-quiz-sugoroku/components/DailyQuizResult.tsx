/**
 * デイリークイズ結果画面コンポーネント
 */
import React from 'react';
import { COLORS, FONTS } from '../constants';
import type { DailyResult } from '../daily-quiz';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
} from './styles';

interface DailyQuizResultProps {
  result: DailyResult;
  dateKey: string;
  streak: number;
  onBack: () => void;
}

export const DailyQuizResult: React.FC<DailyQuizResultProps> = ({
  result,
  dateKey,
  streak,
  onBack,
}) => (
  <PageWrapper>
    <ParticleEffect />
    <Scanlines />
    <Panel $visible={true} style={{ maxWidth: 480 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          fontSize: 10, color: COLORS.accent, letterSpacing: 3,
          fontFamily: FONTS.mono, fontWeight: 700,
        }}>
          DAILY QUIZ
        </div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: COLORS.text2, marginTop: 6,
        }}>
          {dateKey}
        </div>
      </div>

      <SectionBox>
        <SectionTitle>RESULT</SectionTitle>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 36, fontWeight: 800,
            color: result.correctCount >= 4 ? COLORS.green : result.correctCount >= 2 ? COLORS.yellow : COLORS.red,
            fontFamily: FONTS.mono,
          }}>
            {result.correctCount} / {result.totalCount}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
            正解数
          </div>
        </div>
      </SectionBox>

      {streak > 0 && (
        <SectionBox>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: COLORS.yellow, fontWeight: 700 }}>
              {streak} 日連続参加中！
            </div>
          </div>
        </SectionBox>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button onClick={onBack}>
          タイトルに戻る
          <HotkeyHint>[Enter]</HotkeyHint>
        </Button>
      </div>
    </Panel>
  </PageWrapper>
);
