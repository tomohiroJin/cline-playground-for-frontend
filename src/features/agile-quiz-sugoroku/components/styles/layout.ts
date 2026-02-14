/**
 * Agile Quiz Sugoroku - レイアウトスタイル
 *
 * タイムライン、タイマー、ヘッダー、イベント、特徴リスト等のレイアウト系コンポーネント
 */
import styled, { css } from 'styled-components';
import { COLORS, FONTS } from '../../constants';
import { pulse, shake, titleGlow, comboGlow } from './animations';

/* ================================
   タイムライン
   ================================ */

export const TimelineContainer = styled.div`
  display: flex;
  gap: 3px;
  margin-bottom: 16px;
  padding: 0 2px;
`;

export const TimelineItem = styled.div<{
  $done?: boolean;
  $active?: boolean;
  $isEmergency?: boolean;
  $color?: string;
}>`
  flex: 1;
  position: relative;

  & > div:first-child {
    height: 5px;
    border-radius: 3px;
    background: ${({ $done, $active, $isEmergency, $color }) =>
      $done
        ? COLORS.green
        : $active
        ? $isEmergency
          ? COLORS.red
          : $color ?? COLORS.accent
        : `${COLORS.border}55`};
    box-shadow: ${({ $active, $isEmergency, $color }) =>
      $active
        ? `0 0 12px ${$isEmergency ? COLORS.red : $color ?? COLORS.accent}55`
        : 'none'};
    transition: all 0.4s;
  }
`;

export const TimelinePulse = styled.div<{ $isEmergency?: boolean; $color?: string }>`
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 11px;
  border-radius: 6px;
  background: ${({ $isEmergency, $color }) =>
    `${$isEmergency ? COLORS.red : $color ?? COLORS.accent}15`};
  animation: ${pulse} 2s ease-in-out infinite;
`;

/* ================================
   タイマー
   ================================ */

export const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const TimerValue = styled.div<{ $color?: string; $pulse?: boolean; $shake?: boolean }>`
  font-size: 34px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? COLORS.accent};
  font-family: ${FONTS.mono};
  min-width: 48px;
  text-align: right;
  line-height: 1;
  text-shadow: ${({ $color }) =>
    $color === COLORS.red || $color === COLORS.yellow
      ? `0 0 16px ${$color}66`
      : 'none'};
  ${({ $pulse }) =>
    $pulse &&
    css`
      animation: ${pulse} 0.7s ease-in-out infinite;
    `}
  ${({ $shake }) =>
    $shake &&
    css`
      animation: ${shake} 0.15s ease-in-out infinite;
    `}
`;

export const TimerBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${COLORS.border}55;
  border-radius: 4px;
  overflow: hidden;
`;

export const TimerProgress = styled.div<{ $ratio: number; $color?: string }>`
  height: 100%;
  width: ${({ $ratio }) => Math.round($ratio * 100)}%;
  background: linear-gradient(
    90deg,
    ${({ $color }) => $color ?? COLORS.accent}cc,
    ${({ $color }) => $color ?? COLORS.accent}
  );
  border-radius: 4px;
  transition: width 0.3s linear, background 0.5s;
  box-shadow: 0 0 10px ${({ $color }) => $color ?? COLORS.accent}44,
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
`;

/* ================================
   タイトル・スプリント
   ================================ */

export const TitleGlow = styled.div`
  font-size: 10px;
  color: ${COLORS.accent};
  letter-spacing: 5px;
  margin-bottom: 10px;
  font-family: ${FONTS.mono};
  font-weight: 700;
  animation: ${titleGlow} 3s ease-in-out infinite;
`;

export const SprintNumber = styled.div`
  font-size: 64px;
  font-weight: 900;
  color: ${COLORS.accent};
  line-height: 1;
  font-family: ${FONTS.mono};
  text-shadow: 0 0 40px ${COLORS.accent}28;
`;

/* ================================
   コンボ
   ================================ */

export const ComboGlow = styled.span`
  color: ${COLORS.orange};
  font-weight: 800;
  font-size: 12px;
  animation: ${comboGlow} 1.2s ease-in-out infinite;
`;

/* ================================
   イベントカード
   ================================ */

export const EventCard = styled.div<{ $isEmergency?: boolean; $color?: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ $isEmergency, $color }) =>
    $isEmergency ? `${COLORS.red}0a` : `${$color ?? COLORS.accent}06`};
  border: 1px solid
    ${({ $isEmergency, $color }) =>
      $isEmergency ? `${COLORS.red}28` : `${$color ?? COLORS.accent}20`};
`;

export const EventIcon = styled.span`
  font-size: 26px;
`;

export const EventInfo = styled.div`
  flex: 1;
`;

export const EventName = styled.div<{ $isEmergency?: boolean; $color?: string }>`
  font-size: 14.5px;
  font-weight: 700;
  color: ${({ $isEmergency, $color }) =>
    $isEmergency ? COLORS.red : $color ?? COLORS.accent};
`;

export const EventDescription = styled.div`
  font-size: 11px;
  color: ${COLORS.muted};
`;

export const EventCounter = styled.div`
  text-align: right;
`;

export const EventCounterLabel = styled.span`
  font-size: 9px;
  color: ${COLORS.muted};
  font-family: ${FONTS.mono};
`;

export const EventCounterValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${COLORS.muted};
  font-family: ${FONTS.mono};
`;

/* ================================
   イベントリスト
   ================================ */

export const EventListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 4px;
  font-size: 12.5px;
  border-radius: 6px;
`;

export const EventListIcon = styled.span`
  width: 18px;
  text-align: center;
  font-size: 14px;
`;

export const EventListName = styled.span`
  color: ${COLORS.text};
  font-weight: 500;
`;

export const EventListDescription = styled.span`
  margin-left: auto;
  font-size: 9px;
  color: ${COLORS.border2};
  font-family: ${FONTS.mono};
`;

/* ================================
   ヘッダー情報
   ================================ */

export const HeaderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 11px;
  font-family: ${FONTS.mono};
`;

export const SprintLabel = styled.span`
  color: ${COLORS.muted};
`;

export const HeaderRight = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const DebtIndicator = styled.span<{ $severe?: boolean }>`
  color: ${({ $severe }) => ($severe ? COLORS.red : COLORS.yellow)};
  font-size: 11px;
`;

/* ================================
   特徴リスト
   ================================ */

export const FeatureItem = styled.div`
  font-size: 13px;
  margin-bottom: 10px;
  line-height: 1.7;
  display: flex;
  align-items: center;
  gap: 10px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const FeatureIcon = styled.span`
  font-size: 15px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
`;

export const FeatureHighlight = styled.span`
  color: ${COLORS.accent};
  font-weight: 600;
`;

export const FeatureText = styled.span`
  color: ${COLORS.muted};
`;
