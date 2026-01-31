import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as S from './IpneMvp0Page.styles';
import { getNextPosition, isValidMove, checkGameStatus } from '../features/ipne-mvp0/logic';
import { FIXED_MAP } from '../features/ipne-mvp0/constants';
import { Position, Direction } from '../features/ipne-mvp0/types';
import titleBg from '../assets/images/ipne_mvp0_title_bg.webp';
import prologueBg from '../assets/images/ipne_mvp0_prologue_bg.webp';

type GameState = 'title' | 'prologue' | 'game' | 'cleared';

const TILE_SIZE = 32;
// Movement interval for continuous touch (ms)
const MOVE_INTERVAL = 150;

const IpneMvp0Page: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('title');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for continuous movement
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
  const lastMoveTime = useRef<number>(0);
  const isTouchActive = useRef<boolean>(false);

  const [position, setPosition] = useState<Position>(() => {
    for (let y = 0; y < FIXED_MAP.length; y++) {
      for (let x = 0; x < FIXED_MAP[y].length; x++) {
        if (FIXED_MAP[y][x] === 'Start') {
          return { x, y };
        }
      }
    }
    return { x: 1, y: 1 };
  });

  const performMove = useCallback((direction: Direction) => {
    setPosition(prevPos => {
      // Check cleared status on *current* position first? No, if already cleared, stop.
      if (checkGameStatus(prevPos, FIXED_MAP) === 'cleared') return prevPos;

      if (isValidMove(prevPos, FIXED_MAP)) {
        const nextPos = getNextPosition(prevPos, direction);
        if (isValidMove(nextPos, FIXED_MAP)) {
          const status = checkGameStatus(nextPos, FIXED_MAP);
          if (status === 'cleared') {
            setGameState('cleared');
          }
          return nextPos;
        }
      }
      return prevPos;
    });
  }, []);

  // Continuous Movement Loop (useEffect-based to avoid recursion issues)
  useEffect(() => {
    let animationFrameId: number;

    const loop = (time: number) => {
      if (activeDirection && gameState === 'game') {
        if (time - lastMoveTime.current > MOVE_INTERVAL) {
          performMove(activeDirection);
          lastMoveTime.current = time;
        }
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (activeDirection && gameState === 'game') {
      lastMoveTime.current = performance.now();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      performMove(activeDirection); // Immediate move
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activeDirection, gameState, performMove]);

  // Canvas Rendering
  useEffect(() => {
    if (gameState !== 'game') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let y = 0; y < FIXED_MAP.length; y++) {
      for (let x = 0; x < FIXED_MAP[y].length; x++) {
        const tile = FIXED_MAP[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === 'Wall') {
          ctx.fillStyle = '#444';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === 'Floor' || tile === 'Start') {
          ctx.fillStyle = '#222';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === 'Goal') {
          ctx.fillStyle = '#fa0';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw Player
    const pX = position.x * TILE_SIZE;
    const pY = position.y * TILE_SIZE;
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.arc(pX + TILE_SIZE / 2, pY + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
  }, [gameState, position]);

  // Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Priority Check: If touch is active, ignore keys
      if (isTouchActive.current) return;

      if (gameState === 'title') {
        setGameState('prologue');
      } else if (gameState === 'prologue') {
        setGameState('game');
      } else if (gameState === 'game') {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
            e.preventDefault();
            performMove('up');
            break;
          case 'ArrowDown':
          case 's':
            e.preventDefault();
            performMove('down');
            break;
          case 'ArrowLeft':
          case 'a':
            e.preventDefault();
            performMove('left');
            break;
          case 'ArrowRight':
          case 'd':
            e.preventDefault();
            performMove('right');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, performMove]);

  // Touch Logic: Strict 2x2 Rectangular Split (Quadrants)
  // TL=Up, TR=Right, BL=Left, BR=Down
  const getDirectionFromPoint = (clientX: number, clientY: number): Direction | null => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTop = clientY < height / 2;
    const isLeft = clientX < width / 2;

    if (isTop && isLeft) return 'up';
    if (isTop && !isLeft) return 'right';
    if (!isTop && isLeft) return 'left';
    return 'down';
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'game') return;
    isTouchActive.current = true;
    const dir = getDirectionFromPoint(e.clientX, e.clientY);
    setActiveDirection(dir);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDirection) return;
    if (gameState !== 'game') return;
    const dir = getDirectionFromPoint(e.clientX, e.clientY);
    if (dir !== activeDirection) {
      setActiveDirection(dir);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isTouchActive.current = false;
    setActiveDirection(null);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <S.Container>
      {gameState === 'title' && (
        <S.Overlay onClick={() => setGameState('prologue')} $bgImage={titleBg}>
          <h1>IPNE MVP0</h1>
          <p>Press Enter or Click to Start</p>
        </S.Overlay>
      )}

      {gameState === 'prologue' && (
        <S.Overlay onClick={() => setGameState('game')} $bgImage={prologueBg}>
          <p>暗い迷宮の入り口に立っている。</p>
          <p>足元には冷たい石畳が続いている。</p>
          <p>脱出するには、奥にある出口を見つけるしかないようだ……。</p>
          <br />
          <p>（キーボードまたは画面のタップで操作を開始）</p>
        </S.Overlay>
      )}

      {gameState === 'game' && (
        <>
          <div role="region" aria-label="Game World">
            <S.CanvasContainer
              ref={canvasRef}
              width={FIXED_MAP[0].length * TILE_SIZE}
              height={FIXED_MAP.length * TILE_SIZE}
              role="figure"
              aria-label="Game Canvas"
            />
          </div>

          <S.MobileTouchLayer
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={e => e.preventDefault()}
            data-testid="mobile-touch-layer"
          />
        </>
      )}

      {gameState === 'cleared' && (
        <S.Overlay>
          <h1>脱出成功！</h1>
          <p>迷宮からの脱出に成功した。</p>
          <p>しかし、これはまだ始まりに過ぎない……。</p>
          <br />
          <p>Thank you for playing MVP0!</p>
        </S.Overlay>
      )}
    </S.Container>
  );
};

export default IpneMvp0Page;
