import styled from 'styled-components';
import { galleryTokens } from '../../pages/gallery-theme';

// スタイル付きコンポーネント
export const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

export const Label = styled.label`
  font-size: 1rem;
  margin-bottom: 10px;
  color: ${galleryTokens.ink};
`;

export const SelectWrapper = styled.div`
  position: relative;
  width: 200px;
`;

export const StyledSelect = styled.select`
  width: 100%;
  padding: 10px;
  min-height: 44px;
  box-sizing: border-box;
  /* 額縁のサイズ選択。非選択時は控えめな縁取りのみ */
  border: 1px solid ${galleryTokens.frameBorder};
  border-radius: 2px;
  background-color: ${galleryTokens.cream};
  color: ${galleryTokens.ink};
  font-size: 1rem;
  appearance: none;
  cursor: pointer;

  &:focus-visible {
    /* キーボード操作時は額のサイズを選んでいる状態としてフォーカスリングで強調する */
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
    border-color: ${galleryTokens.ink};
    background: ${galleryTokens.mat};
  }

  option {
    background-color: ${galleryTokens.cream};
    color: ${galleryTokens.ink};
  }
`;

export const SelectArrow = styled.div`
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid ${galleryTokens.sub};
  pointer-events: none;
`;

export const Description = styled.p`
  font-size: 0.9rem;
  color: ${galleryTokens.sub};
  margin-top: 5px;
  text-align: center;
`;
