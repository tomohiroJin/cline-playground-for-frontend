/**
 * Agile Quiz Sugoroku - リザルト画面スタイル
 *
 * グレード表示、エンジニアタイプ、チャート、カテゴリ等のリザルト関連コンポーネント
 */
import styled from 'styled-components';
import { COLORS, FONTS } from '../../constants';
import { gradeReveal, barGrow, radarFill } from './animations';

/* ================================
   グレード
   ================================ */

export const GradeCircle = styled.div<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid ${({ $color }) => $color ?? COLORS.accent};
  background: ${({ $color }) => $color ?? COLORS.accent}15;
  font-size: 32px;
  font-weight: 900;
  color: ${({ $color }) => $color ?? COLORS.accent};
  font-family: ${FONTS.mono};
  box-shadow: 0 0 30px ${({ $color }) => $color ?? COLORS.accent}22;
  margin-bottom: 6px;
  animation: ${gradeReveal} 0.6s cubic-bezier(0.22, 1, 0.36, 1);
`;

export const GradeLabel = styled.div<{ $color?: string }>`
  font-size: 11px;
  color: ${({ $color }) => $color ?? COLORS.accent};
  font-family: ${FONTS.mono};
  font-weight: 600;
  letter-spacing: 2px;
`;

/* ================================
   エンジニアタイプ
   ================================ */

export const TypeCard = styled.div<{ $color?: string }>`
  background: linear-gradient(135deg, ${({ $color }) => $color ?? COLORS.accent}08, ${COLORS.bg}88);
  border-radius: 14px;
  padding: 24px 20px;
  margin: 16px 0;
  text-align: center;
  border: 1.5px solid ${({ $color }) => $color ?? COLORS.accent}28;
  box-shadow: 0 8px 32px ${({ $color }) => $color ?? COLORS.accent}0a;
`;

export const TypeEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
`;

export const TypeLabel = styled.div`
  font-size: 9px;
  color: ${COLORS.muted};
  letter-spacing: 2px;
  margin-bottom: 6px;
  font-family: ${FONTS.mono};
`;

export const TypeName = styled.div<{ $color?: string }>`
  font-size: 21px;
  color: ${({ $color }) => $color ?? COLORS.accent};
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
`;

export const TypeDescription = styled.div`
  font-size: 12.5px;
  color: ${COLORS.muted};
  line-height: 1.8;
  max-width: 340px;
  margin: 0 auto;
`;

/* ================================
   バーチャート
   ================================ */

export const BarChartContainer = styled.div`
  display: flex;
  gap: 10px;
`;

export const BarChartItem = styled.div`
  flex: 1;
  text-align: center;
`;

export const BarChartLabel = styled.div`
  font-size: 10px;
  color: ${COLORS.muted};
  margin-bottom: 6px;
  font-family: ${FONTS.mono};
`;

export const BarChartTrack = styled.div`
  height: 72px;
  background: ${COLORS.bg}88;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 0 4px 0;
  border: 1px solid ${COLORS.border}22;
`;

export const BarChartBar = styled.div<{ $height: number; $color?: string }>`
  width: 48%;
  height: ${({ $height }) => Math.max(8, $height * 0.62)}px;
  background: linear-gradient(
    180deg,
    ${({ $color }) => $color ?? COLORS.accent},
    ${({ $color }) => $color ?? COLORS.accent}66
  );
  border-radius: 4px 4px 0 0;
  box-shadow: 0 0 10px ${({ $color }) => $color ?? COLORS.accent}22,
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: ${barGrow} 0.6s cubic-bezier(0.22, 1, 0.36, 1);
`;

export const BarChartValue = styled.div<{ $color?: string }>`
  font-size: 15px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? COLORS.accent};
  margin-top: 6px;
  font-family: ${FONTS.mono};
`;

export const BarChartSub = styled.div`
  font-size: 9px;
  color: ${COLORS.muted};
  margin-top: 2px;
  font-family: ${FONTS.mono};
`;

/* ================================
   カテゴリバー
   ================================ */

export const CategoryBarContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const CategoryBadge = styled.div<{ $color?: string }>`
  background: ${({ $color }) => $color ?? COLORS.accent}0d;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11px;
  border: 1px solid ${({ $color }) => $color ?? COLORS.accent}18;
`;

export const CategoryName = styled.span`
  color: ${COLORS.muted};
`;

export const CategoryValue = styled.span<{ $color?: string }>`
  color: ${({ $color }) => $color ?? COLORS.accent};
  font-weight: 700;
  font-family: ${FONTS.mono};
`;

/* ================================
   レーダーチャート
   ================================ */

export const RadarPolygon = styled.polygon`
  animation: ${radarFill} 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center;
`;

/* ================================
   強み・課題
   ================================ */

export const StrengthText = styled.div`
  font-size: 12.5px;
  color: ${COLORS.green};
  margin-bottom: 8px;
  line-height: 1.7;
`;

export const ChallengeText = styled.div`
  font-size: 12.5px;
  color: ${COLORS.yellow};
  line-height: 1.7;
`;

/* ================================
   ビルド成功
   ================================ */

export const BuildSuccess = styled.div`
  font-size: 12px;
  color: ${COLORS.green};
  letter-spacing: 3px;
  font-weight: 700;
  font-family: ${FONTS.mono};
  margin-top: 8px;
`;

export const ReleaseVersion = styled.div`
  font-size: 10px;
  color: ${COLORS.muted};
  margin-top: 2px;
  font-family: ${FONTS.mono};
`;
