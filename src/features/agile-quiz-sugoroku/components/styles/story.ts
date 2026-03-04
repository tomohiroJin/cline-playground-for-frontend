/**
 * Agile Quiz Sugoroku - ストーリー画面スタイル
 */
import styled, { keyframes } from 'styled-components';
import { COLORS, FONTS } from '../../constants';

/** テキストのフェードインアニメーション */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/** ストーリー画面のラッパー */
export const StoryWrapper = styled.div`
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
  cursor: pointer;
  user-select: none;
`;

/** ストーリーコンテンツ */
export const StoryContent = styled.div`
  background: ${COLORS.glass};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${COLORS.glassBorder};
  border-radius: 18px;
  padding: 28px 24px;
  max-width: 560px;
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 ${COLORS.glassBorder};
`;

/** ストーリーヘッダー */
export const StoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

/** ストーリー画面のスプリント表示 */
export const StorySprintLabel = styled.div`
  font-size: 10px;
  color: ${COLORS.accent};
  font-family: ${FONTS.mono};
  font-weight: 700;
  letter-spacing: 2px;
`;

/** ストーリータイトル */
export const StoryTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${COLORS.text2};
  margin: 0 0 20px 0;
  text-align: center;
  font-family: ${FONTS.jp};
`;

/** スキップボタン */
export const SkipButton = styled.button`
  background: transparent;
  border: 1px solid ${COLORS.border2};
  color: ${COLORS.muted};
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-family: ${FONTS.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.accent};
    color: ${COLORS.accent};
  }
`;

/** テキスト表示エリア */
export const TextArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
`;

/** テキスト行（フェードインアニメーション付き） */
export const TextLine = styled.div`
  animation: ${fadeIn} 0.4s ease-out;
  line-height: 1.8;
`;

/** ナレーションテキスト */
export const NarrationText = styled.p`
  font-size: 14px;
  color: ${COLORS.text};
  text-align: center;
  font-style: italic;
  margin: 0;
  line-height: 1.8;
  opacity: 0.9;
`;

/** キャラクター発言の行 */
export const SpeakerLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

/** キャラクター名 */
export const SpeakerName = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${COLORS.accent};
  font-family: ${FONTS.mono};
  white-space: nowrap;
  min-width: 50px;
`;

/** キャラクターの絵文字 */
export const SpeakerEmoji = styled.span`
  font-size: 18px;
`;

/** 発言テキスト */
export const SpeakerText = styled.p`
  font-size: 14px;
  color: ${COLORS.text2};
  margin: 0;
  line-height: 1.8;
`;

/** 操作ヒント */
export const HintText = styled.div`
  text-align: center;
  margin-top: 16px;
  font-size: 10px;
  color: ${COLORS.border2};
  font-family: ${FONTS.mono};
  letter-spacing: 0.5px;
`;
