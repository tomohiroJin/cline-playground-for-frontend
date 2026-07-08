import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

export const ViewContainer = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
`;

export const ViewHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const ViewTitle = styled.h1`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 1.6rem;
  letter-spacing: 0.1em;
  color: ${galleryTokens.ink};
  margin: 0;
`;

export const BackButton = styled.button`
  background: transparent;
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 4px;
  padding: 6px 14px;
  min-height: 44px;
  box-sizing: border-box;
  color: ${galleryTokens.ink};
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background: ${galleryTokens.mat};
  }

  &:focus-visible {
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
  }
`;

export const Room = styled.section`
  margin-bottom: 32px;
`;

export const RoomHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px solid ${galleryTokens.frameBorder};
  padding-bottom: 6px;
  margin-bottom: 12px;
`;

export const RoomName = styled.h2`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 1.1rem;
  color: ${galleryTokens.ink};
  margin: 0;
`;

export const RoomRate = styled.span`
  font-size: 0.78rem;
  color: ${galleryTokens.sub};
  letter-spacing: 0.06em;
`;

export const Wall = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
`;

export const LockedRoom = styled.p`
  color: ${galleryTokens.sub};
  font-size: 0.82rem;
  padding: 12px 0;
`;
