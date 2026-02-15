import styled from 'styled-components';
import { GlassCard } from '../../components/atoms/GlassCard';

// ページ全体のレイアウト
export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-gradient);
  padding: 20px;
  touch-action: none;
`;

// ゲームタイトル
export const GameTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent-color);
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
`;

// メニュー / リザルトカード
export const MenuCard = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  max-width: 500px;
  width: 100%;
`;

// オプション選択エリア
export const OptionContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  width: 100%;
`;

export const OptionTitle = styled.p`
  color: var(--text-primary);
  font-size: 0.9rem;
  margin-bottom: 10px;
  text-align: center;
  font-weight: 600;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const ModeButton = styled.button<{ $selected?: boolean }>`
  flex: 1 1 calc(33.33% - 10px);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${props => (props.$selected ? 'var(--accent-color)' : 'transparent')};
  background: ${props => (props.$selected ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)')};
  color: ${props => (props.$selected ? 'var(--accent-color)' : 'var(--text-secondary)')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 210, 255, 0.1);
  }
`;

// 開始ボタン
export const StartButton = styled.button`
  background: linear-gradient(135deg, var(--accent-color), #3a7bd5);
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
  padding: 15px 60px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 210, 255, 0.5);
  }
`;

// スコアボード
export const ScoreBoardContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  margin-bottom: 10px;
`;

export const ScoreText = styled.span<{ $color: string }>`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${props => props.$color};
  text-shadow: 0 0 10px ${props => props.$color};
`;

// ゲームキャンバス
export const GameCanvas = styled.canvas`
  border-radius: 12px;
  border: 2px solid var(--glass-border);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  background: #0d1117;
  max-width: 100%;
  max-height: calc(100vh - 100px);
  touch-action: none;
`;

// メニューボタン
export const MenuButton = styled.button`
  background: none;
  border: 1px solid var(--text-secondary);
  color: var(--text-secondary);
  padding: 5px 15px;
  border-radius: 20px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
`;
