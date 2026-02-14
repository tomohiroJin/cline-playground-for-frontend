/**
 * Agile Quiz Sugoroku - クイズ関連スタイル
 *
 * クイズ画面の選択肢ボタン、結果バナー、問題テキスト等
 */
import styled from 'styled-components';
import { COLORS, FONTS } from '../../constants';
import { popIn, fadeSlideIn } from './animations';

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
   選択肢コンテナ
   ================================ */

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
