import styled from 'styled-components';

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
  color: #333;
`;

export const SelectWrapper = styled.div`
  position: relative;
  width: 200px;
`;

export const StyledSelect = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4caf50;
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
  border-top: 5px solid #333;
  pointer-events: none;
`;

export const Description = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
  text-align: center;
`;
