import styled, { keyframes, css } from 'styled-components';

// アニメーション定義
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// ページコンテナ
export const PageContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  padding-top: 80px;
  box-sizing: border-box;
  height: 100dvh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
  font-family: sans-serif;
`;

// オーバーレイ（タイトル/プロローグ/クリア画面用）
export const Overlay = styled.div<{ $bgImage?: string; $bgImageMobile?: string }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  background: ${props =>
    props.$bgImage
      ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${props.$bgImage})`
      : 'rgba(0, 0, 0, 0.85)'};
  background-size: cover;
  background-position: center;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 480px) {
    background: ${props =>
      props.$bgImageMobile
        ? `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${props.$bgImageMobile})`
        : props.$bgImage
          ? `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${props.$bgImage})`
          : 'rgba(0, 0, 0, 0.85)'};
    background-size: cover;
    background-position: center;
  }
`;

// タイトル関連
export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const TitleMain = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
  background: linear-gradient(to right, #667eea, #764ba2);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(102, 126, 234, 0.5);

  @media (min-width: 480px) {
    font-size: 3rem;
  }

  @media (min-width: 768px) {
    font-size: 4rem;
  }
`;

export const TitleSub = styled.p`
  color: #9ca3af;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

export const StartButton = styled.button`
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(to right, #667eea, #764ba2);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &:active {
    transform: scale(0.98);
  }
`;

// プロローグ関連
export const StoryText = styled.p<{ $active: boolean }>`
  color: white;
  margin-bottom: 1rem;
  transition: all 0.7s;
  font-size: ${props => (props.$active ? '1.5rem' : '1.125rem')};
  opacity: ${props => (props.$active ? 1 : 0.3)};
  text-shadow: ${props => (props.$active ? '0 0 30px rgba(255,255,255,0.5)' : 'none')};
  text-align: center;
  width: 100%;
  padding: 0 1rem;

  @media (max-width: 480px) {
    font-size: ${props => (props.$active ? '1.125rem' : '0.875rem')};
    padding: 0 0.5rem;
  }
`;

export const SkipButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// ゲーム画面関連
export const GameRegion = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 1rem;
`;

export const Canvas = styled.canvas`
  display: block;
  max-width: 100%;
  max-height: 60vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
`;

// モバイル操作用コントロール
export const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
  padding: 0 1rem;
  flex-shrink: 0;
`;

export const ControlButton = styled.button<{ $position: 'left' | 'right' | 'up' | 'down' }>`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: all 0.1s;

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
`;

export const DPadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 4rem);
  grid-template-rows: repeat(3, 4rem);
  gap: 0.25rem;
`;

export const DPadButton = styled.button<{ $direction: 'up' | 'down' | 'left' | 'right' }>`
  width: 4rem;
  height: 4rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: all 0.1s;

  grid-column: ${props => {
    if (props.$direction === 'left') return 1;
    if (props.$direction === 'right') return 3;
    return 2;
  }};

  grid-row: ${props => {
    if (props.$direction === 'up') return 1;
    if (props.$direction === 'down') return 3;
    return 2;
  }};

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
`;

export const AttackButton = styled.button<{ $ready: boolean }>`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: ${props => (props.$ready ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)')};
  border: 2px solid rgba(255, 255, 255, 0.35);
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => (props.$ready ? 'pointer' : 'not-allowed')};
  user-select: none;
  touch-action: none;
  transition: all 0.1s;
  grid-column: 2;
  grid-row: 2;
  opacity: ${props => (props.$ready ? 1 : 0.5)};

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
`;

export const HPBarContainer = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 200px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  overflow: hidden;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 480px) {
    width: 120px;
    height: 20px;
  }
`;

export const HPBarFill = styled.div<{ $ratio: number; $color: string }>`
  width: ${props => `${Math.max(0, Math.min(1, props.$ratio)) * 100}%`};
  height: 100%;
  background: ${props => props.$color};
  transition: width 0.2s ease;
`;

export const HPBarText = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;

  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;

export const DamageOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  background: rgba(239, 68, 68, 0.35);
  opacity: ${props => (props.$visible ? 1 : 0)};
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 15;
`;

// クリア画面
export const ClearContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const ClearTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: bold;
  color: #fbbf24;
  margin-bottom: 1rem;
  text-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
`;

export const ClearMessage = styled.p`
  color: #e5e7eb;
  font-size: 1.125rem;
  margin-bottom: 2rem;
`;

// ゲームオーバー画面
export const GameOverContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const GameOverTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: bold;
  color: #ef4444;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
`;

export const GameOverButton = styled.button`
  padding: 0.9rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.75rem;

  &:hover {
    transform: scale(1.03);
  }
`;

export const RetryButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(to right, #10b981, #059669);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

export const BackToTitleButton = styled.button`
  padding: 0.75rem 1.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #9ca3af;
  background: transparent;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(75, 85, 99, 0.3);
    color: white;
  }
`;

// マップ切替ボタン
export const MapToggleButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.5rem;
  color: white;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 480px) {
    top: 0.5rem;
    padding: 0.375rem;
    font-size: 1.25rem;
  }
`;

// ===== MVP3: 職業選択画面 =====

export const ClassSelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  padding-top: 5rem;

  @media (min-width: 480px) {
    padding-top: 2rem;
  }
`;

export const ClassSelectTitle = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  margin-bottom: 1rem;
`;

export const ClassCardsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

export const ClassCard = styled.button<{ $selected?: boolean; $classType: 'warrior' | 'thief' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  width: 180px;
  background: ${props =>
    props.$selected
      ? props.$classType === 'warrior'
        ? 'rgba(220, 38, 38, 0.3)'
        : 'rgba(34, 197, 94, 0.3)'
      : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props =>
    props.$selected
      ? props.$classType === 'warrior'
        ? '#dc2626'
        : '#22c55e'
      : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    background: ${props =>
      props.$classType === 'warrior'
        ? 'rgba(220, 38, 38, 0.25)'
        : 'rgba(34, 197, 94, 0.25)'};
  }
`;

export const ClassIcon = styled.div<{ $classType: 'warrior' | 'thief' }>`
  font-size: 3rem;
  margin-bottom: 0.5rem;
`;

export const ClassName = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
`;

export const ClassDescription = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  line-height: 1.4;
`;

export const ClassStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.75rem;
  font-size: 0.7rem;
  color: #d1d5db;
`;

export const ClassSelectButton = styled.button<{ $disabled?: boolean }>`
  padding: 1rem 3rem;
  font-size: 1.125rem;
  font-weight: bold;
  color: white;
  background: ${props =>
    props.$disabled
      ? 'rgba(107, 114, 128, 0.5)'
      : 'linear-gradient(to right, #667eea, #764ba2)'};
  border: none;
  border-radius: 0.75rem;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
  box-shadow: ${props =>
    props.$disabled ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'};

  &:hover {
    transform: ${props => (props.$disabled ? 'none' : 'scale(1.05)')};
  }
`;

// ===== MVP3: レベルアップオーバーレイ =====

export const LevelUpOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  animation: ${fadeIn} 0.3s ease-out;
`;

export const LevelUpTitle = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  color: #fbbf24;
  text-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
  margin-bottom: 0.5rem;
`;

export const LevelUpSubtitle = styled.p`
  color: #9ca3af;
  font-size: 1rem;
  margin-bottom: 1.5rem;
`;

export const LevelUpChoicesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 320px;
  padding: 0 1rem;
`;

export const LevelUpChoice = styled.button<{ $disabled?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: ${props =>
    props.$disabled ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props =>
    props.$disabled ? 'rgba(107, 114, 128, 0.5)' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 0.5rem;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
  opacity: ${props => (props.$disabled ? 0.5 : 1)};

  &:hover {
    background: ${props =>
      props.$disabled ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
    transform: ${props => (props.$disabled ? 'none' : 'translateX(4px)')};
  }
`;

export const LevelUpChoiceLabel = styled.span`
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
`;

export const LevelUpChoiceValue = styled.span<{ $disabled?: boolean }>`
  color: ${props => (props.$disabled ? '#6b7280' : '#22c55e')};
  font-size: 0.85rem;
`;

// ===== MVP3: ステータス表示 =====

export const StatsDisplay = styled.div`
  position: absolute;
  top: 3rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  z-index: 20;

  @media (max-width: 480px) {
    top: 2.75rem;
    padding: 0.375rem 0.5rem;
    gap: 0.125rem;
  }
`;

export const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.7rem;
  color: #d1d5db;

  @media (max-width: 480px) {
    font-size: 0.6rem;
    gap: 0.5rem;
  }
`;

export const StatLabel = styled.span`
  color: #9ca3af;
`;

export const StatValue = styled.span`
  color: white;
  font-weight: bold;
`;

export const ExperienceBar = styled.div`
  position: absolute;
  top: 2.5rem;
  left: 1rem;
  width: 200px;
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  overflow: hidden;
  z-index: 20;

  @media (max-width: 480px) {
    top: 2.25rem;
    width: 120px;
    height: 6px;
  }
`;

export const ExperienceBarFill = styled.div<{ $ratio: number }>`
  width: ${props => `${Math.max(0, Math.min(1, props.$ratio)) * 100}%`};
  height: 100%;
  background: linear-gradient(to right, #a855f7, #ec4899);
  transition: width 0.3s ease;
`;

export const LevelBadge = styled.div`
  position: absolute;
  top: 1rem;
  left: 210px;
  background: linear-gradient(to right, #a855f7, #ec4899);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  z-index: 20;

  @media (max-width: 480px) {
    left: 130px;
    font-size: 0.65rem;
    padding: 0.2rem 0.4rem;
  }
`;

// ===== MVP4: ヘルプUI =====

export const HelpButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 5rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: bold;
  color: white;
  transition: all 0.2s;
  z-index: 20;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  @media (max-width: 480px) {
    top: 0.5rem;
    right: 3.5rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }
`;

export const HelpOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  z-index: 200;
  animation: ${fadeIn} 0.2s ease-out;
  padding: 2rem;
  overflow-y: auto;
`;

export const HelpContainer = styled.div`
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const HelpTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: bold;
  color: #fbbf24;
  text-align: center;
  margin-bottom: 0.5rem;
`;

export const HelpSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
`;

export const HelpSectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  color: #60a5fa;
  margin-bottom: 0.75rem;
`;

export const HelpKeyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const HelpKeyItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const HelpKey = styled.kbd`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
  color: white;
`;

export const HelpKeyDescription = styled.span`
  color: #d1d5db;
  font-size: 0.875rem;
`;

export const HelpCloseButton = styled.button`
  padding: 0.75rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  align-self: center;
  margin-top: 1rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const HelpHint = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.5rem;
`;

// ===== MVP4: タイマー表示 =====

export const TimerDisplay = styled.div`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  z-index: 20;
  font-family: monospace;
  font-size: 1.25rem;
  font-weight: bold;
  color: white;

  @media (max-width: 480px) {
    top: 0.5rem;
    font-size: 1rem;
    padding: 0.375rem 0.75rem;
  }
`;

// ===== MVP4: リザルト画面 =====

export const ResultContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 500px;
  padding: 2rem;

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 1rem;
    padding-top: 1rem;
    gap: 0.5rem;
  }
`;

export const ResultRating = styled.div<{ $color: string }>`
  font-size: 5rem;
  font-weight: bold;
  color: ${props => props.$color};
  text-shadow: 0 0 40px ${props => props.$color}80;
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 3rem;
  }
`;

export const ResultTime = styled.div`
  font-family: monospace;
  font-size: 2rem;
  color: white;
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

export const ResultEpilogueTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  color: #fbbf24;
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    font-size: 1.125rem;
  }
`;

export const ResultEpilogueText = styled.p`
  color: #d1d5db;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 0.875rem;
    line-height: 1.4;
  }
`;

export const ResultImage = styled.img`
  max-width: 300px;
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);

  @media (max-width: 480px) {
    max-width: 200px;
    margin-bottom: 0.5rem;
  }
`;

export const ResultVideo = styled.video`
  max-width: 300px;
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);

  @media (max-width: 480px) {
    max-width: 200px;
    margin-bottom: 0.5rem;
  }
`;

export const NewBestBadge = styled.div`
  background: linear-gradient(to right, #fbbf24, #f59e0b);
  color: #1a1a2e;
  font-size: 0.875rem;
  font-weight: bold;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  animation: ${pulse} 1.5s ease-in-out infinite;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
  }
`;

// Sランク動画再生ボタン
export const VideoPlayButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(to right, #fbbf24, #f59e0b);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(251, 191, 36, 0.6);
  }

  &:active {
    transform: scale(0.98);
  }
`;

// ===== MVP4: チュートリアル表示 =====

export const TutorialOverlay = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  max-width: 400px;
  z-index: 30;
  animation: ${fadeIn} 0.3s ease-out;
`;

export const TutorialTitle = styled.h4`
  font-size: 1rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

export const TutorialText = styled.p`
  color: #e5e7eb;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
`;

export const TutorialActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const TutorialProgress = styled.span`
  color: #6b7280;
  font-size: 0.75rem;
`;

export const TutorialButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.5);
  }
`;

export const TutorialSkipButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    color: #9ca3af;
  }
`;

// ===== MVP5 音声設定UI =====

// 音声設定ボタン（タイトル画面用）
export const AudioSettingsButton = styled.button`
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 60;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

// 音声設定パネル
export const AudioSettingsPanel = styled.div`
  position: fixed;
  top: 4rem;
  right: 1rem;
  width: 250px;
  background: rgba(15, 15, 35, 0.95);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  z-index: 60;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

// 音声設定タイトル
export const AudioSettingsTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

// 音量スライダーコンテナ
export const VolumeSliderContainer = styled.div`
  margin-bottom: 1rem;
`;

// 音量ラベル
export const VolumeLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

// 音量名
export const VolumeName = styled.span`
  color: #e5e7eb;
  font-size: 0.875rem;
`;

// 音量値
export const VolumeValue = styled.span`
  color: #9ca3af;
  font-size: 0.75rem;
`;

// スライダー
export const VolumeSlider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
    transition: background 0.2s;
  }

  &::-webkit-slider-thumb:hover {
    background: #764ba2;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #667eea;
    cursor: pointer;
  }
`;

// ミュートボタン
export const MuteButton = styled.button<{ $muted: boolean }>`
  width: 100%;
  padding: 0.75rem;
  background: ${props => props.$muted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'};
  border: 1px solid ${props => props.$muted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'};
  border-radius: 0.5rem;
  color: ${props => props.$muted ? '#ef4444' : '#22c55e'};
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$muted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
  }
`;

// タップして開始メッセージ（iOS対応）
export const TapToStartMessage = styled.div`
  position: absolute;
  bottom: 8rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 0.5rem;
  color: #e5e7eb;
  font-size: 1rem;
  text-align: center;
  animation: ${pulse} 2s ease-in-out infinite;
  z-index: 55;
`;

// ===== MVP6: 鍵システムUI =====

// 鍵インジケータ
export const KeyIndicator = styled.div<{ $hasKey: boolean }>`
  position: absolute;
  top: 1rem;
  right: 8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid ${props => props.$hasKey ? '#fcd34d' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 0.5rem;
  padding: 0.375rem 0.5rem;
  z-index: 20;
  opacity: ${props => props.$hasKey ? 1 : 0.5};
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    top: 0.5rem;
    right: 6rem;
    padding: 0.25rem 0.375rem;
  }
`;

// 鍵アイコン
export const KeyIcon = styled.span<{ $hasKey: boolean }>`
  font-size: 1.25rem;
  filter: ${props => props.$hasKey ? 'none' : 'grayscale(100%)'};

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

// 鍵が必要ですメッセージ
export const KeyRequiredMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #fcd34d;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  color: #fcd34d;
  font-size: 1.25rem;
  font-weight: bold;
  text-align: center;
  z-index: 100;
  animation: ${fadeIn} 0.2s ease-out;

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }
`;

// 職業選択画面の画像
export const ClassImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 0.5rem;
  border-radius: 0.5rem;

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
  }
`;

// ===== レベルアップポイント制UI =====

// 未割り振りポイントバッジ
export const PendingPointsBadge = styled.button<{ $hasPoints: boolean }>`
  position: absolute;
  top: 8.5rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.$hasPoints
    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3))'
    : 'rgba(0, 0, 0, 0.5)'};
  border: 2px solid ${props => props.$hasPoints ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: ${props => props.$hasPoints ? 'pointer' : 'default'};
  z-index: 20;
  transition: all 0.3s ease;
  animation: ${props => props.$hasPoints ? css`${pulse} 2s ease-in-out infinite` : 'none'};

  &:hover {
    ${props => props.$hasPoints && `
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(245, 158, 11, 0.4));
      transform: scale(1.05);
    `}
  }

  &:active {
    ${props => props.$hasPoints && `
      transform: scale(0.98);
    `}
  }

  @media (max-width: 480px) {
    top: 7.5rem;
    padding: 0.375rem 0.5rem;
    gap: 0.375rem;
  }
`;

// 未割り振りポイント数表示
export const PendingPointsCount = styled.span<{ $hasPoints: boolean }>`
  font-size: 0.875rem;
  font-weight: bold;
  color: ${props => props.$hasPoints ? '#fbbf24' : '#6b7280'};

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

// 強化ボタンテキスト
export const EnhanceButtonText = styled.span<{ $hasPoints: boolean }>`
  font-size: 0.75rem;
  font-weight: bold;
  color: ${props => props.$hasPoints ? '#fbbf24' : '#6b7280'};

  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;

// レベルアップオーバーレイの閉じるボタン
export const LevelUpCloseButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: rgba(107, 114, 128, 0.3);
  border: 1px solid rgba(107, 114, 128, 0.5);
  border-radius: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(107, 114, 128, 0.4);
    color: white;
  }
`;

// 残りポイント表示
export const RemainingPointsText = styled.p`
  color: #fbbf24;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;
