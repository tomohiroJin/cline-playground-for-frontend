import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

export const BannerContainer = styled.section`
  background: ${galleryTokens.mat};
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 4px;
  padding: 16px 20px;
  margin: 0 auto 24px;
  max-width: 560px;
`;

export const BannerTitle = styled.h2`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 1.1rem;
  color: ${galleryTokens.ink};
  margin: 0 0 12px;
  text-align: center;
`;

export const GoalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
`;

export const GoalLabel = styled.span`
  flex: 0 0 8.5em;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: ${galleryTokens.sub};
`;

export const Track = styled.div`
  flex: 1;
  height: 8px;
  background: ${galleryTokens.cream};
  border-radius: 4px;
  overflow: hidden;
`;

export const Fill = styled.div<{ $percent: number; $gold?: boolean }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ $gold }) => ($gold ? galleryTokens.gold : galleryTokens.sage)};
  transition: width 300ms ease;
`;

export const GoalCount = styled.span`
  flex: 0 0 3.5em;
  text-align: right;
  font-size: 0.74rem;
  color: ${galleryTokens.ink};
`;

export const Honor = styled.p`
  margin: 12px 0 0;
  text-align: center;
  color: ${galleryTokens.gold};
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
`;
