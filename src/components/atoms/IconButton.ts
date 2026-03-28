import styled from 'styled-components';

/**
 * 丸型アイコンボタンの共通ベーススタイル
 */
const IconButton = styled.button`
  background-color: var(--color-interactive-bg);
  color: var(--color-text-primary);
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-interactive-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    background-color: var(--color-interactive-bg-hover);
  }
`;

export default IconButton;
