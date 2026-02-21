import styled from 'styled-components';

export const PuzzlePageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  width: 100%;
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
  background: linear-gradient(135deg, var(--accent-color), #3a7bd5);
  color: white;
  padding: 14px 32px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 800;
  margin-top: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4);
    filter: brightness(1.1);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
