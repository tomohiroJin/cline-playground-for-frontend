import styled from 'styled-components';

export const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SetupSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
`;

export const StartButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

export const GameSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

export const Instructions = styled.div`
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f8f8;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
  width: 100%;
  max-width: 600px;
`;

export const InstructionsTitle = styled.h3`
  margin-top: 0;
  color: #333;
`;

export const InstructionsList = styled.ul`
  margin: 10px 0 0;
  padding-left: 20px;
  color: #555;
`;
