import styled from 'styled-components';

export const BgmContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  margin-top: 8px;
  padding: 8px 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
`;

export const BgmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TrackName = styled.span`
  font-size: 0.85rem;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const BgmButton = styled.button`
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #333;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e8e8e8;
  }
`;

export const VolumeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const VolumeLabel = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

export const VolumeSlider = styled.input`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #ccc;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: #4caf50;
    border-radius: 50%;
    cursor: pointer;
  }
`;

export const VolumeValue = styled.span`
  font-size: 0.8rem;
  color: #666;
  min-width: 32px;
  text-align: right;
`;
