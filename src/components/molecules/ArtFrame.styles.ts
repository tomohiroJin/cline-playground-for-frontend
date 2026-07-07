import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

/** 額縁（外枠＋影） */
export const FrameOuter = styled.div`
  background: ${galleryTokens.mat};
  padding: 10px;
  border: 1px solid ${galleryTokens.frameBorder};
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
`;

/**
 * 台紙（マット）。作品と額縁の間の余白。
 * 注意: line-height を 0 にしない。中身にテキストを含むブロック（例: 盤面の
 * ステータス表示 ⏱/👣）を額装した際、行ボックス高さが 0 になり文字が不可視化する
 * （E2E で検出済み）。直接インライン画像を入れる場合は img 側に display:block を付ける。
 */
export const FrameMat = styled.div`
  background: #ffffff;
  padding: 6px;
`;
