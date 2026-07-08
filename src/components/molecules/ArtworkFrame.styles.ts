import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

export const FrameFigure = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

export const Thumb = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/** 未収蔵の空フレーム内側 */
export const EmptySlot = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${galleryTokens.sub};
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  background: repeating-linear-gradient(
    45deg,
    ${galleryTokens.mat},
    ${galleryTokens.mat} 8px,
    ${galleryTokens.cream} 8px,
    ${galleryTokens.cream} 16px
  );
`;

export const Caption = styled.figcaption`
  font-size: 0.72rem;
  color: ${galleryTokens.sub};
  text-align: center;
`;

export const Rank = styled.span`
  color: ${galleryTokens.gold};
  letter-spacing: 0.1em;
`;
