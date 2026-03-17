/**
 * CharacterReaction 用 styled-components
 */
import styled from 'styled-components';
import { COLORS, FONTS } from '../constants';
import { bubbleFadeIn } from './styles';

export const Container = styled.div`
  display: flex;
  gap: 4px;
  align-items: flex-end;
  margin-top: 12px;
  padding: 0 4px;
`;

export const CharacterUnit = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
`;

export const BubbleWrapper = styled.div`
  height: 36px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
`;

export const Bubble = styled.div<{ $isHint?: boolean }>`
  background: ${({ $isHint }) => $isHint ? `${COLORS.yellow}18` : COLORS.glass};
  border: 1px solid ${({ $isHint }) => $isHint ? `${COLORS.yellow}44` : COLORS.glassBorder};
  border-radius: 8px 8px 8px 2px;
  padding: 3px 6px;
  font-size: 10px;
  font-family: ${FONTS.jp};
  color: ${({ $isHint }) => $isHint ? COLORS.yellow : COLORS.text};
  text-align: center;
  animation: ${bubbleFadeIn} 0.3s ease-out;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${COLORS.card};
  border: 2px solid ${COLORS.border2};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
