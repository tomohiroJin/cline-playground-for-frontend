import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

/** 額縁（外枠＋影） */
export const FrameOuter = styled.div`
  background: ${galleryTokens.mat};
  padding: 10px;
  border: 1px solid ${galleryTokens.frameBorder};
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
`;

/** 台紙（マット）。作品と額縁の間の余白 */
export const FrameMat = styled.div`
  background: #ffffff;
  padding: 6px;
  line-height: 0;
`;
