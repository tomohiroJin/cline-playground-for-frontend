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
  color: var(--text-primary);
`;

export const ThemeTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  justify-content: center;
  width: 100%;
  max-width: 600px;
`;

export const ThemeTab = styled.button<{ $active: boolean; $locked: boolean }>`
  padding: 6px 14px;
  border: 1px solid ${props => (props.$active ? 'var(--accent-color)' : 'var(--glass-border)')};
  border-radius: 20px;
  background-color: ${props =>
    props.$locked ? 'rgba(255, 255, 255, 0.03)' : props.$active ? 'var(--accent-color)' : 'var(--glass-bg)'};
  color: ${props =>
    props.$locked ? 'var(--text-secondary)' : props.$active ? '#fff' : 'var(--text-primary)'};
  cursor: ${props => (props.$locked ? 'default' : 'pointer')};
  font-size: 0.85rem;
  transition: all 0.2s;
  opacity: ${props => (props.$locked ? 0.5 : 1)};

  &:hover {
    ${props =>
      !props.$locked &&
      !props.$active &&
      `
      border-color: var(--accent-color);
      background-color: rgba(255, 255, 255, 0.1);
    `}
  }
`;

export const ThemeDescription = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-align: center;
`;

export const UnlockHint = styled.p`
  font-size: 0.8rem;
  color: #f57c00;
  margin-bottom: 12px;
  text-align: center;
`;

export const ProgressBar = styled.div`
  width: 100%;
  max-width: 600px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin-bottom: 12px;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background-color: var(--success-color);
  transition: width 0.3s ease;
`;

export const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 600px;
`;

export const ImageItem = styled.div<{ $isSelected: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid ${props => (props.$isSelected ? 'var(--success-color)' : 'transparent')};
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const ThemeImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
`;

export const SelectedIndicator = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: var(--success-color);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

export const RankBadge = styled.div`
  position: absolute;
  bottom: 4px;
  left: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffd700;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
`;
