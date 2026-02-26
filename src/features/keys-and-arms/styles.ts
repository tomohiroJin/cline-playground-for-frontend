import styled from 'styled-components';

/* ゲームボーイ風シェルのスタイル（元CSSから移植） */

export const Shell = styled.div`
  background: linear-gradient(165deg, #a89068, #887050, #685838);
  border-radius: 24px;
  padding: 12px 16px 10px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.08);
`;

export const ShellHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2px;
`;

export const Label = styled.div`
  text-align: center;
  font-size: 7px;
  color: #d0c0a0;
  letter-spacing: 5px;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
  font-family: 'Press Start 2P', monospace;
`;

export const Bezel = styled.div`
  background: #1a1a14;
  border-radius: 6px;
  padding: 4px;
  box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.85);
`;

export const Canvas = styled.canvas`
  display: block;
  border-radius: 3px;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
`;

export const DPad = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
`;

export const DPadRow = styled.div`
  display: flex;
  gap: 1px;
`;

export const DPadSpacer = styled.div`
  width: 42px;
`;

const BaseButton = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
  font-family: 'Press Start 2P', monospace;
`;

export const DirButton = styled(BaseButton)`
  background: linear-gradient(155deg, #333, #1a1a1a);
  color: #777;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  &:active {
    transform: translateY(2px);
  }
`;

export const ActButton = styled(BaseButton)`
  background: linear-gradient(155deg, #cc2828, #881414);
  color: #faa;
  width: 52px;
  height: 52px;
  font-size: 7px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 180, 180, 0.12);
  &:active {
    transform: translateY(2px);
  }
`;

export const PauseButton = styled(BaseButton)`
  width: 44px;
  height: 20px;
  border-radius: 10px;
  font-size: 4px;
  background: linear-gradient(155deg, #333, #1a1a1a);
  color: #777;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  &:active {
    transform: translateY(2px);
  }
`;

export const RstButton = styled(BaseButton)`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  font-size: 5px;
  background: linear-gradient(155deg, #333, #1a1a1a);
  color: #777;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  &:active {
    transform: translateY(2px);
  }
`;

export const InfoText = styled.div`
  text-align: center;
  font-size: 6px;
  color: #555;
  margin-top: 2px;
  font-family: 'Press Start 2P', monospace;
`;

export const PageWrap = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background: #181818;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Press Start 2P', monospace;
`;
