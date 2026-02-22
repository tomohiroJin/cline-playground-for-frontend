/**
 * Agile Quiz Sugoroku - 共通スタイル
 *
 * 複数の画面で共有されるベースコンポーネント
 */
import styled, { css } from 'styled-components';
import { COLORS, FONTS } from '../../constants';
import { floatY } from './animations';

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

/** グリッド */
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
`;

/** パーティクルコンテナ */
export const ParticlesContainer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

/** パーティクル */
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

/** スキャンライン */
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

/** ボタングループ */
export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

/** 警告ボックス */
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

/** 緊急対応メッセージ */
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

/** キーボードヒント */
export const KeyboardHint = styled.div`
  text-align: center;
  margin-top: 14px;
  font-size: 10px;
  color: ${COLORS.border2};
  font-family: ${FONTS.mono};
`;

/** サマリーテキスト */
export const SummaryText = styled.div`
  font-size: 13px;
  color: ${COLORS.text};
  line-height: 1.8;
`;

/** 区切り線 */
export const Divider = styled.div`
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, ${COLORS.accent}66, transparent);
  margin: 14px auto 0;
`;

/** セクション区切り */
export const SectionDivider = styled.div`
  border-top: 1px solid ${COLORS.border}33;
  padding-top: 14px;
`;

/** カスタムスクロールバー ミックスイン */
export const aqsScrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: ${COLORS.border2} transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border2};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${COLORS.accent}66;
  }
`;

/** スクロール可能パネル */
export const ScrollablePanel = styled(Panel)`
  overflow-y: auto;
  max-height: 90vh;
  ${aqsScrollbar}
`;
