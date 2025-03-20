import styled from 'styled-components';

// ...既存のimportや他のコード...（必要に応じて追加）

export const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

export const UploadButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 10px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.p`
  color: #f44336;
  font-size: 0.9rem;
  margin-top: 5px;
`;

export const ImagePreview = styled.div<{ hasImage: boolean }>`
  width: 300px;
  height: 200px;
  border: 2px dashed ${props => (props.hasImage ? '#4caf50' : '#cccccc')};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  overflow: hidden;
`;

export const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

export const UploadText = styled.p`
  color: #666;
  font-size: 1rem;
`;
