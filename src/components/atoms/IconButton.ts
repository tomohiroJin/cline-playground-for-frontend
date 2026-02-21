import styled from 'styled-components';

/**
 * 丸型アイコンボタンの共通ベーススタイル
 */
const IconButton = styled.button`
  background-color: rgba(255, 255, 255, 0.7);
  color: #333;
  width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

export default IconButton;
