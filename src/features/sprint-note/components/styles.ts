import styled, { keyframes, css } from 'styled-components';

// カラーパレット
export const SN_COLORS = {
  bg: '#0f1117',
  text: '#e0e0e0',
  subText: '#888888',
  accent: '#4a9eff',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  border: '#2a2d35',
} as const;

// フェードインアニメーション
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ゲーム全体コンテナ
export const GameContainer = styled.div`
  max-width: 672px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: ${SN_COLORS.text};
  font-family: 'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif;
  line-height: 1.8;
  font-size: 15px;

  @media (max-width: 480px) {
    padding: 16px 12px;
    font-size: 14px;
  }
`;

// フェーズヘッダー
export const PhaseHeader = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: ${SN_COLORS.subText};
  letter-spacing: 0.05em;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid ${SN_COLORS.border};
`;

// コンテンツエリア
export const ContentArea = styled.div`
  flex: 1;
  margin-bottom: 32px;
`;

// 選択肢エリア
export const ChoiceArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  animation: ${fadeIn} 0.3s ease-out;
`;

// タイトル（大きいテキスト）
export const GameTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${SN_COLORS.text};
  margin: 0 0 4px 0;
  letter-spacing: 0.02em;
`;

// サブタイトル
export const GameSubtitle = styled.p`
  font-size: 14px;
  color: ${SN_COLORS.subText};
  margin: 0 0 40px 0;
`;

// パラグラフ（段階表示用）
export const Paragraph = styled.p<{ $visible: boolean; $delay: number }>`
  margin: 0 0 16px 0;
  opacity: ${p => (p.$visible ? 1 : 0)};
  transform: translateY(${p => (p.$visible ? 0 : 8)}px);
  transition: opacity 0.3s ease-out ${p => p.$delay}ms,
    transform 0.3s ease-out ${p => p.$delay}ms;
  white-space: pre-wrap;
`;

// 選択肢ボタン
export const ChoiceButton = styled.button<{
  $selected?: boolean;
  $disabled?: boolean;
}>`
  display: block;
  width: 100%;
  padding: 14px 18px;
  background: ${p =>
    p.$selected ? SN_COLORS.accent + '20' : 'transparent'};
  border: 1px solid
    ${p =>
      p.$selected
        ? SN_COLORS.accent
        : p.$disabled
          ? SN_COLORS.border
          : SN_COLORS.border};
  border-radius: 8px;
  color: ${p => (p.$disabled ? SN_COLORS.subText : SN_COLORS.text)};
  font-size: 15px;
  text-align: left;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  transition: all 0.15s ease-out;
  line-height: 1.6;
  opacity: ${p => (p.$disabled && !p.$selected ? 0.4 : 1)};

  &:hover:not(:disabled) {
    ${p =>
      !p.$disabled &&
      !p.$selected &&
      css`
        border-color: ${SN_COLORS.accent};
        background: ${SN_COLORS.accent}10;
      `}
  }

  &:active:not(:disabled) {
    ${p =>
      !p.$disabled &&
      !p.$selected &&
      css`
        transform: scale(0.98);
      `}
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
    font-size: 14px;
  }
`;

// 「次へ」ボタン（シンプル版）
export const NextButton = styled.button<{ $disabled?: boolean }>`
  display: inline-block;
  padding: 12px 32px;
  background: transparent;
  border: 1px solid ${SN_COLORS.accent};
  border-radius: 8px;
  color: ${SN_COLORS.accent};
  font-size: 15px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  transition: all 0.15s ease-out;
  opacity: ${p => (p.$disabled ? 0.4 : 1)};
  margin-top: 24px;

  &:hover:not(:disabled) {
    background: ${SN_COLORS.accent}15;
  }

  @media (max-width: 480px) {
    width: 100%;
    text-align: center;
  }
`;

// ゴール選択カード
export const GoalCard = styled.button<{
  $selected?: boolean;
  $disabled?: boolean;
}>`
  display: block;
  width: 100%;
  padding: 16px 18px;
  background: ${p =>
    p.$selected ? SN_COLORS.accent + '15' : 'transparent'};
  border: 1px solid
    ${p => (p.$selected ? SN_COLORS.accent : SN_COLORS.border)};
  border-radius: 8px;
  color: ${p => (p.$disabled ? SN_COLORS.subText : SN_COLORS.text)};
  font-size: 15px;
  text-align: left;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  transition: all 0.15s ease-out;
  line-height: 1.6;
  opacity: ${p => (p.$disabled && !p.$selected ? 0.4 : 1)};

  &:hover:not(:disabled) {
    ${p =>
      !p.$disabled &&
      !p.$selected &&
      css`
        border-color: ${SN_COLORS.accent};
        background: ${SN_COLORS.accent}08;
      `}
  }
`;

// ゴール名
export const GoalName = styled.span`
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
`;

// ゴール説明
export const GoalDescription = styled.span`
  font-size: 13px;
  color: ${SN_COLORS.subText};
  display: block;
`;

// セクション区切り線
export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${SN_COLORS.border};
  margin: 24px 0;
`;

// リザルトランク表示
export const RankDisplay = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${SN_COLORS.accent};
  margin: 8px 0 24px 0;
`;

// 引用風テキスト（PM 台詞など）
export const QuoteText = styled.div`
  padding-left: 16px;
  border-left: 3px solid ${SN_COLORS.border};
  color: ${SN_COLORS.text};
  margin: 16px 0;
  white-space: pre-wrap;
  line-height: 1.8;
`;

// タスクリスト表示
export const TaskItem = styled.div`
  padding: 8px 0;
  color: ${SN_COLORS.subText};
  font-size: 14px;

  &::before {
    content: '▸ ';
    color: ${SN_COLORS.accent};
  }
`;

// フレーバーテキスト（斜体風）
export const FlavorText = styled.p`
  color: ${SN_COLORS.subText};
  font-size: 14px;
  margin: 16px 0;
  font-style: italic;
`;

// エンディングテキスト
export const EndingText = styled.p`
  color: ${SN_COLORS.subText};
  font-size: 14px;
  margin: 24px 0;
  text-align: center;
  white-space: pre-wrap;
  line-height: 2;
`;
