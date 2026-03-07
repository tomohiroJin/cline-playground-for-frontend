/**
 * 履歴・成長グラフ画面コンポーネント
 */
import React, { useMemo } from 'react';
import { COLORS, FONTS } from '../constants';
import { loadHistory } from '../history-storage';
import { LineChart } from './LineChart';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Button,
  Scanlines,
} from './styles';

interface HistoryScreenProps {
  onBack: () => void;
}

/** 日付をフォーマット */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const history = useMemo(() => loadHistory(), []);

  // 最高グレード
  const bestGrade = useMemo(() => {
    if (history.length === 0) return '-';
    const gradeOrder = ['D', 'C', 'B', 'A', 'S'];
    let best = 'D';
    for (const entry of history) {
      if (gradeOrder.indexOf(entry.grade) > gradeOrder.indexOf(best)) {
        best = entry.grade;
      }
    }
    return best;
  }, [history]);

  // グラフデータ
  const correctRates = history.map(h => h.correctRate);
  const speeds = history.map(h => h.averageSpeed);
  const labels = history.map(h => formatDate(h.timestamp));

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />
      <Panel $fadeIn={false} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            fontSize: 10,
            color: COLORS.muted,
            letterSpacing: 2,
            fontFamily: FONTS.mono,
            fontWeight: 700,
          }}>
            HISTORY
          </div>
          <h2 style={{ fontSize: 20, color: COLORS.text2, margin: '4px 0 8px' }}>
            プレイ履歴
          </h2>
          {history.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
              fontSize: 12,
              color: COLORS.muted,
            }}>
              <span>プレイ回数: <span style={{ color: COLORS.text, fontWeight: 700 }}>{history.length}</span></span>
              <span>最高グレード: <span style={{ color: COLORS.accent, fontWeight: 700 }}>{bestGrade}</span></span>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <SectionBox>
            <div style={{ textAlign: 'center', padding: 20, color: COLORS.muted, fontSize: 13 }}>
              まだプレイ履歴がありません
            </div>
          </SectionBox>
        ) : (
          <>
            {/* 正答率推移グラフ */}
            <SectionBox>
              <div style={{
                fontSize: 11,
                color: COLORS.muted,
                fontWeight: 700,
                marginBottom: 8,
                fontFamily: FONTS.mono,
                letterSpacing: 1,
              }}>
                正答率の推移
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <LineChart
                  data={correctRates}
                  labels={labels}
                  color={COLORS.green}
                  yLabel="%"
                  width={360}
                  height={180}
                />
              </div>
            </SectionBox>

            {/* 平均速度推移グラフ */}
            <SectionBox>
              <div style={{
                fontSize: 11,
                color: COLORS.muted,
                fontWeight: 700,
                marginBottom: 8,
                fontFamily: FONTS.mono,
                letterSpacing: 1,
              }}>
                平均回答速度の推移
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <LineChart
                  data={speeds}
                  labels={labels}
                  color={COLORS.cyan}
                  yLabel="秒"
                  maxValue={20}
                  width={360}
                  height={180}
                />
              </div>
            </SectionBox>

            {/* 履歴一覧 */}
            <SectionBox style={{ maxHeight: '30vh', overflowY: 'auto' }}>
              <div style={{
                fontSize: 11,
                color: COLORS.muted,
                fontWeight: 700,
                marginBottom: 8,
                fontFamily: FONTS.mono,
                letterSpacing: 1,
              }}>
                直近の結果
              </div>
              {[...history].reverse().map((entry, i) => (
                <div
                  key={entry.timestamp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: i === 0 ? `${COLORS.accent}08` : 'transparent',
                    border: `1px solid ${i === 0 ? `${COLORS.accent}15` : COLORS.border}`,
                    marginBottom: 4,
                    fontSize: 11,
                  }}
                >
                  <span style={{
                    fontFamily: FONTS.mono,
                    color: COLORS.muted,
                    minWidth: 44,
                  }}>
                    {formatDate(entry.timestamp)}
                  </span>
                  <span style={{
                    fontFamily: FONTS.mono,
                    fontWeight: 700,
                    color: COLORS.accent,
                    minWidth: 24,
                  }}>
                    {entry.grade}
                  </span>
                  <span style={{ color: COLORS.text }}>
                    正答率 {entry.correctRate}%
                  </span>
                  <span style={{ color: COLORS.muted, marginLeft: 'auto' }}>
                    {entry.teamTypeName}
                  </span>
                </div>
              ))}
            </SectionBox>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button $color={COLORS.muted} onClick={onBack} style={{ padding: '10px 32px', fontSize: 12 }}>
            戻る
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
