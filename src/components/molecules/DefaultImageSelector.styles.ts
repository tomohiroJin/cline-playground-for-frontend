import styled from 'styled-components';

export const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
`;

export const Title = styled.h3`
  margin-bottom: 10px;
  font-size: 1.2rem;
  color: #333;
`;

export const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 500px;
`;

export const ImageItem = styled.div<{ $isSelected: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid ${props => (props.$isSelected ? '#4caf50' : 'transparent')};
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const DefaultImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
`;

export const SelectedIndicator = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;
