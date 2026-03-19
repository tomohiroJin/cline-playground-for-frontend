/**
 * Agile Quiz Sugoroku - すごろくボードUIコンポーネント
 *
 * スプリント内の各イベントマスを横並びで表示し、
 * 現在位置・完了済み・緊急対応を視覚的に区別する
 */
import React, { useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { COLORS, FONTS } from '../constants';
import { GameEvent } from '../domain/types';
import { slideMove, emergencyBlink } from './styles';

// ── Props 型定義 ─────────────────────────────────────────────

interface SugorokuBoardProps {
  /** スプリント内のイベント一覧 */
  events: GameEvent[];
  /** 現在のイベントインデックス */
  currentIndex: number;
  /** コンボ演出中フラグ */
  comboActive?: boolean;
}

// ── styled-components ────────────────────────────────────────

const BoardContainer = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: ${COLORS.border2} transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border2};
    border-radius: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    scroll-behavior: auto;
  }
`;

const BoardCell = styled.div<{
  $done?: boolean;
  $active?: boolean;
  $isEmergency?: boolean;
  $color?: string;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.card};
  transition: background 0.2s, border-color 0.2s;
  flex-shrink: 0;

  ${({ $done }) =>
    $done &&
    css`
      opacity: 0.6;
      background: ${COLORS.bg2};
    `}

  ${({ $active, $color }) =>
    $active &&
    css`
      border-color: ${$color ?? COLORS.accent};
      box-shadow: 0 0 8px ${$color ?? COLORS.accent}44;
    `}

  ${({ $isEmergency }) =>
    $isEmergency &&
    css`
      border-color: ${COLORS.red};
      animation: ${emergencyBlink} 1.2s ease-in-out infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`;

const BoardCellIcon = styled.div`
  font-size: 20px;
  line-height: 1;
  margin-bottom: 2px;
`;

const BoardCellName = styled.div`
  font-family: ${FONTS.jp};
  font-size: 10px;
  color: ${COLORS.muted};
  white-space: nowrap;
  text-align: center;
`;

const BoardCheckmark = styled.div`
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: ${COLORS.green};
  font-weight: bold;
`;

const BoardPiece = styled.div`
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${COLORS.accent};
  border: 2px solid ${COLORS.text2};
  box-shadow: 0 0 6px ${COLORS.accent}66;
  animation: ${slideMove} 0.4s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ── コンポーネント ───────────────────────────────────────────

export const SugorokuBoard: React.FC<SugorokuBoardProps> = ({
  events,
  currentIndex,
}) => {
  const activeCellRef = useRef<HTMLDivElement>(null);

  // 現在のマスを中央にスクロール
  useEffect(() => {
    if (activeCellRef.current) {
      activeCellRef.current.scrollIntoView({
        inline: 'center',
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  return (
    <BoardContainer>
      {events.map((event, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isEmergency = event.id === 'emergency';

        return (
          <BoardCell
            key={`${event.id}-${index}`}
            ref={isActive ? activeCellRef : undefined}
            $done={isDone}
            $active={isActive}
            $isEmergency={isEmergency}
            $color={event.color}
          >
            <BoardCellIcon>{event.icon}</BoardCellIcon>
            <BoardCellName>{event.name}</BoardCellName>
            {isDone && <BoardCheckmark>✓</BoardCheckmark>}
            {isActive && <BoardPiece data-testid="board-piece" />}
          </BoardCell>
        );
      })}
    </BoardContainer>
  );
};
