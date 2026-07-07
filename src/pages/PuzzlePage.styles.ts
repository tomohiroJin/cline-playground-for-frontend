import styled from 'styled-components';
import { galleryThemeVars, galleryTokens } from './gallery-theme';

export const PuzzlePageContainer = styled.div`
  ${galleryThemeVars}
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  width: 100%;
  min-height: 100vh;
  /* 美術館の壁。グローバル背景グラデを覆い、配下だけをギャラリー色にする */
  background: ${galleryTokens.cream};
  color: var(--text-primary);
`;

export const SetupSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding: 30px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: var(--glass-shadow);
  width: 100%;
  max-width: 700px;
  color: var(--text-primary);
`;

export const StartButton = styled.button`
  background: ${galleryTokens.ink};
  color: ${galleryTokens.cream};
  padding: 13px 34px;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  margin-top: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.15);
  }

  &:disabled {
    background: #b8b0a2;
    cursor: not-allowed;
    transform: none;
  }
`;

export const GameSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  max-width: 900px;
`;

export const Instructions = styled.div`
  margin: 40px 0;
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-left: 4px solid var(--accent-color);
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
`;

export const InstructionsTitle = styled.h3`
  margin-top: 0;
  color: var(--text-primary);
  margin-bottom: 16px;
`;

export const InstructionsList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  line-height: 1.8;

  li {
    margin-bottom: 8px;
  }
`;
