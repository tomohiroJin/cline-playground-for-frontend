/**
 * Agile Quiz Sugoroku - スタイル定義
 */
import styled, { keyframes, css } from 'styled-components';
import { COLORS, FONTS } from '../constants';

/* ================================
   アニメーション
   ================================ */

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const floatY = keyframes`
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-35px) translateX(12px);
  }
  50% {
    transform: translateY(-18px) translateX(-10px);
  }
  75% {
    transform: translateY(-45px) translateX(6px);
  }
`;

const comboGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.orange}44; }
  50% { text-shadow: 0 0 16px ${COLORS.orange}aa; }
`;

const popIn = keyframes`
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const titleGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.accent}22; }
  50% { text-shadow: 0 0 20px ${COLORS.accent}44; }
`;

const gradeReveal = keyframes`
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.15) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

const barGrow = keyframes`
  from { height: 0; }
`;

const radarFill = keyframes`
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

/* ================================
   共通コンポーネント
   ================================ */

/** ページラッパー */
export const PageWrapper = styled.div`
  min-height: 100vh;
  background: radial-gradient(ellipse at 25% 15%, ${COLORS.bg2} 0%, ${COLORS.bg} 65%);
  color: ${COLORS.text};
  font-family: ${FONTS.jp};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  position: relative;
  z-index: 1;
`;

/** パネル */
export const Panel = styled.div<{ $visible?: boolean; $fadeIn?: boolean }>`
  background: ${COLORS.glass};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${COLORS.glassBorder};
  border-radius: 18px;
  padding: 28px 24px;
  max-width: 560px;
  width: 100%;
  opacity: ${({ $fadeIn, $visible }) =>
    $fadeIn === false ? 1 : $visible ? 1 : 0};
  transform: ${({ $fadeIn, $visible }) =>
    $fadeIn === false
      ? 'none'
      : $visible
      ? 'translateY(0) scale(1)'
      : 'translateY(20px) scale(0.97)'};
  transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 ${COLORS.glassBorder};
`;

/** セクションボックス */
export const SectionBox = styled.div`
  background: ${COLORS.bg}99;
  border-radius: 12px;
  padding: 16px 14px;
  margin-bottom: 16px;
  border: 1px solid ${COLORS.border}33;
`;

/** セクションタイトル */
export const SectionTitle = styled.div`
  font-size: 10px;
  color: ${COLORS.accent};
  margin-bottom: 10px;
  letter-spacing: 2.5px;
  font-family: ${FONTS.mono};
  font-weight: 700;
  text-transform: uppercase;
`;

/** 統計ボックス */
export const StatBox = styled.div<{ $color?: string }>`
  background: ${COLORS.bg}dd;
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
  border: 1px solid ${({ $color }) => $color ?? COLORS.accent}18;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      ${({ $color }) => $color ?? COLORS.accent}55,
      transparent
    );
  }
`;

/** 統計ラベル */
export const StatLabel = styled.div`
  font-size: 9px;
  color: ${COLORS.muted};
  margin-bottom: 4px;
  letter-spacing: 0.5px;
  font-family: ${FONTS.mono};
  text-transform: uppercase;
`;

/** 統計値 */
export const StatValue = styled.div<{ $color?: string }>`
  font-size: 22px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? COLORS.accent};
  font-family: ${FONTS.mono};
  line-height: 1.2;
`;

/** 統計アイコン */
export const StatIcon = styled.div`
  font-size: 14px;
  margin-bottom: 2px;
`;

/** ボタン */
export const Button = styled.button<{ $color?: string; $disabled?: boolean }>`
  background: transparent;
  border: 1px solid ${({ $disabled, $color }) =>
    $disabled ? COLORS.border : $color ?? COLORS.accent};
  color: ${({ $disabled, $color }) =>
    $disabled ? COLORS.border : $color ?? COLORS.accent};
  padding: 12px 32px;
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  font-family: ${FONTS.mono};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: linear-gradient(
      135deg,
      ${({ $color }) => $color ?? COLORS.accent},
      ${({ $color }) => $color ?? COLORS.accent}cc
    );
    color: #000;
    box-shadow: 0 6px 24px ${({ $color }) => $color ?? COLORS.accent}33;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.accent};
    outline-offset: 2px;
  }
`;

/** ホットキーヒント */
export const HotkeyHint = styled.span`
  font-size: 9px;
  opacity: 0.5;
  font-weight: 400;
  margin-left: 4px;
`;

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
   選択肢ボタン
   ================================ */

export const OptionButton = styled.button<{
  $answered?: boolean;
  $isCorrect?: boolean;
  $isSelected?: boolean;
  $hovered?: boolean;
}>`
  background: ${({ $answered, $isCorrect, $isSelected }) =>
    $answered
      ? $isCorrect
        ? `${COLORS.green}12`
        : $isSelected
        ? `${COLORS.red}12`
        : 'transparent'
      : 'transparent'};
  border: 1.5px solid
    ${({ $answered, $isCorrect, $isSelected, $hovered }) =>
      $answered
        ? $isCorrect
          ? COLORS.green
          : $isSelected
          ? COLORS.red
          : `${COLORS.border}66`
        : $hovered
        ? COLORS.accent
        : `${COLORS.border}66`};
  color: ${({ $answered, $isCorrect, $isSelected }) =>
    $answered
      ? $isCorrect
        ? COLORS.green
        : $isSelected
        ? COLORS.red
        : COLORS.text
      : COLORS.text};
  padding: 14px 16px;
  border-radius: 10px;
  cursor: ${({ $answered }) => ($answered ? 'default' : 'pointer')};
  font-family: ${FONTS.jp};
  font-size: 13.5px;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: ${({ $answered, $isCorrect, $isSelected }) =>
    $answered && !$isCorrect && !$isSelected ? 0.2 : 1};
  line-height: 1.6;
  box-shadow: ${({ $answered, $isCorrect, $hovered }) =>
    $answered && $isCorrect
      ? `0 0 20px ${COLORS.green}18`
      : $hovered
      ? `0 0 16px ${COLORS.accent}0a`
      : 'none'};
  transform: ${({ $answered, $isCorrect, $isSelected, $hovered }) =>
    $answered && ($isCorrect || $isSelected)
      ? 'scale(1.01)'
      : $hovered && !$answered
      ? 'translateX(4px)'
      : 'none'};
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &:focus-visible {
    outline: 2px solid ${COLORS.accent};
    outline-offset: 2px;
  }
`;

export const OptionLabel = styled.span<{
  $answered?: boolean;
  $isCorrect?: boolean;
  $isSelected?: boolean;
}>`
  color: ${({ $answered, $isCorrect, $isSelected }) =>
    $answered
      ? $isCorrect
        ? COLORS.green
        : $isSelected
        ? COLORS.red
        : COLORS.muted
      : COLORS.muted};
  font-size: 10px;
  font-weight: 700;
  font-family: ${FONTS.mono};
  background: ${({ $answered, $isCorrect, $isSelected }) =>
    $answered && $isCorrect
      ? `${COLORS.green}20`
      : $answered && $isSelected
      ? `${COLORS.red}20`
      : `${COLORS.border}44`};
  padding: 3px 7px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 1px;
  min-width: 22px;
  text-align: center;
`;

export const OptionText = styled.span`
  flex: 1;
`;

export const OptionIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;
  animation: ${popIn} 0.3s ease;
`;

/* ================================
   結果バナー
   ================================ */

export const ResultBanner = styled.div<{ $ok?: boolean }>`
  font-size: 14px;
  font-weight: 700;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  margin-top: 14px;
  background: linear-gradient(
    135deg,
    ${({ $ok }) => ($ok ? COLORS.green : COLORS.red)}15,
    ${({ $ok }) => ($ok ? COLORS.green : COLORS.red)}05
  );
  border: 1.5px solid ${({ $ok }) => ($ok ? COLORS.green : COLORS.red)}33;
  color: ${({ $ok }) => ($ok ? COLORS.green : COLORS.red)};
  text-align: center;
  letter-spacing: 1.5px;
  font-family: ${FONTS.mono};
  box-shadow: 0 4px 20px ${({ $ok }) => ($ok ? COLORS.green : COLORS.red)}12;
  animation: ${fadeSlideIn} 0.4s cubic-bezier(0.22, 1, 0.36, 1);
`;

export const BannerMessage = styled.div`
  font-size: 16px;
`;

export const BannerSub = styled.div`
  font-size: 13px;
  margin-top: 6px;
  opacity: 0.85;
`;

export const BannerExplain = styled.div<{ $color?: string }>`
  font-size: 11px;
  margin-top: 10px;
  color: ${COLORS.muted};
  font-family: ${FONTS.jp};
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.6;
  border-top: 1px solid ${({ $color }) => $color ?? COLORS.green}22;
  padding-top: 8px;
`;

/* ================================
   グリッド
   ================================ */

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`;

/* ================================
   パーティクル
   ================================ */

export const ParticlesContainer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

export const Particle = styled.div<{
  $x: number;
  $y: number;
  $size: number;
  $duration: number;
  $delay: number;
  $opacity: number;
}>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${COLORS.accent};
  opacity: ${({ $opacity }) => $opacity};
  animation: ${floatY} ${({ $duration }) => $duration}s ease-in-out
    ${({ $delay }) => $delay}s infinite;
`;

/* ================================
   スキャンライン
   ================================ */

export const Scanlines = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  opacity: 0.03;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.015) 2px,
    rgba(255, 255, 255, 0.015) 4px
  );
`;

/* ================================
   タイトル
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
   警告メッセージ
   ================================ */

export const WarningBox = styled.div`
  margin-top: 12px;
  font-size: 12px;
  color: ${COLORS.yellow};
  background: ${COLORS.yellow}0a;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${COLORS.yellow}18;
  line-height: 1.7;
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
   結果ボタングループ
   ================================ */

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
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
   緊急対応メッセージ
   ================================ */

export const EmergencyMessage = styled.div`
  font-size: 12px;
  color: ${COLORS.orange};
  padding: 8px 12px;
  background: ${COLORS.orange}0a;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid ${COLORS.orange}18;
  line-height: 1.7;
`;

/* ================================
   キーボードヒント
   ================================ */

export const KeyboardHint = styled.div`
  text-align: center;
  margin-top: 14px;
  font-size: 10px;
  color: ${COLORS.border2};
  font-family: ${FONTS.mono};
`;

/* ================================
   クイズ問題テキスト
   ================================ */

export const QuizQuestion = styled.div`
  font-size: 15px;
  line-height: 1.9;
  margin-bottom: 20px;
  color: ${COLORS.text2};
  font-weight: 500;
`;

/* ================================
   選択肢コンテナ
   ================================ */

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
   サマリー
   ================================ */

export const SummaryText = styled.div`
  font-size: 13px;
  color: ${COLORS.text};
  line-height: 1.8;
`;

/* ================================
   区切り線
   ================================ */

export const Divider = styled.div`
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${COLORS.accent}66, transparent);
  margin: 14px auto 0;
`;

export const SectionDivider = styled.div`
  border-top: 1px solid ${COLORS.border}33;
  padding-top: 14px;
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
