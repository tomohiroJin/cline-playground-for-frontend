import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { CANVAS_HEIGHT, CANVAS_WIDTH, TICK_MS } from './constants';
import { createInputController } from './input';
import { createAudioController } from './audio';
import { createInitialState, reduceState } from './engine/state-machine';
import { loadHighScore, saveHighScore, shouldUpdateHighScore } from './storage';
import { scoreForEvent } from './engine/scoring';
import { renderFrame } from './render/renderer';
import { Popup, updatePopups } from './render/effects';

const Wrapper = styled.section`
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 12px;
`;

const Shell = styled.div`
  background: linear-gradient(165deg, #a89068, #887050, #685838);
  border-radius: 24px;
  padding: 12px 16px 10px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.08);
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2px;
`;

const Label = styled.div`
  margin-bottom: 0;
  font-size: 7px;
  color: #d0c0a0;
  letter-spacing: 4px;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
`;

const Bezel = styled.div`
  background: #1a1a14;
  border-radius: 6px;
  padding: 4px;
  box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.85);
`;

const Canvas = styled.canvas`
  display: block;
  border-radius: 3px;
  width: min(92vw, 720px);
  height: auto;
  image-rendering: pixelated;
`;

const Buttons = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const Dpad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 42px);
  grid-template-rows: repeat(3, 42px);
  gap: 2px;
`;

const ActionArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Btn = styled.button<{ $act?: boolean }>`
  width: ${({ $act }) => ($act ? '52px' : '42px')};
  height: ${({ $act }) => ($act ? '52px' : '42px')};
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: ${({ $act }) => ($act ? '8px' : '10px')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $act }) => ($act ? '#faa' : '#777')};
  background: ${({ $act }) =>
    $act ? 'linear-gradient(155deg,#cc2828,#881414)' : 'linear-gradient(155deg,#333,#1a1a1a)'};
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;

  &:active {
    transform: translateY(2px);
  }
`;

const Spacer = styled.div`
  width: 42px;
  height: 42px;
`;

const Info = styled.div`
  text-align: center;
  font-size: 11px;
  color: #7a7a7a;
`;

const STAGE_DURATION_TICKS = 220;

type VirtualAction = 'up' | 'down' | 'left' | 'right' | 'act' | 'reset';

export const KeysAndArmsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [highScore, setHighScore] = useState<number>(() => loadHighScore());

  const stateRef = useRef(createInitialState(highScore));
  const popupRef = useRef<Popup[]>([]);
  const tickRef = useRef(0);
  const stageTickRef = useRef(0);

  const input = useMemo(() => createInputController(window), []);
  const audio = useMemo(() => createAudioController(true), []);

  useEffect(() => {
    stateRef.current = createInitialState(highScore);
  }, [highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return () => undefined;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => undefined;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    let rafId = 0;
    let last = performance.now();
    let acc = 0;

    const addScore = (value: number, label = ''): void => {
      if (value <= 0) {
        return;
      }
      stateRef.current = {
        ...stateRef.current,
        score: stateRef.current.score + value,
      };
      popupRef.current.push({
        x: CANVAS_WIDTH / 2,
        y: 120,
        text: label ? `${label} +${value}` : `+${value}`,
        life: 35,
      });
    };

    const updateHighScore = (): void => {
      const current = stateRef.current;
      if (shouldUpdateHighScore(current.score, current.highScore)) {
        saveHighScore(current.score);
        setHighScore(current.score);
        stateRef.current = { ...current, highScore: current.score };
      }
    };

    const onStageClear = (): void => {
      const scene = stateRef.current.scene;
      if (scene === 'cave') {
        addScore(scoreForEvent('cave-clear', stateRef.current.loop), 'CLEAR');
        stateRef.current = reduceState(stateRef.current, { type: 'STAGE_CLEAR', stage: 'cave' });
      } else if (scene === 'grass') {
        addScore(scoreForEvent('grass-clear', stateRef.current.loop), 'CLEAR');
        stateRef.current = reduceState(stateRef.current, { type: 'STAGE_CLEAR', stage: 'grass' });
      } else if (scene === 'boss') {
        addScore(scoreForEvent('boss-clear', stateRef.current.loop), 'CLEAR');
        stateRef.current = reduceState(stateRef.current, { type: 'STAGE_CLEAR', stage: 'boss' });
      }
      stageTickRef.current = 0;
      audio.clear();
      updateHighScore();
    };

    const update = (): void => {
      tickRef.current += 1;
      const pressed = input.consumePressed();
      const held = input.getHeld();

      if (pressed.reset) {
        stateRef.current = reduceState(stateRef.current, { type: 'BACK_TO_TITLE' });
        stageTickRef.current = 0;
      }

      if (stateRef.current.scene === 'title') {
        if (pressed.act) {
          audio.unlock();
          stateRef.current = reduceState(stateRef.current, { type: 'START_GAME' });
          stageTickRef.current = 0;
        }
      } else if (stateRef.current.scene === 'over') {
        if (pressed.act) {
          audio.unlock();
          stateRef.current = reduceState(stateRef.current, { type: 'START_GAME' });
          stageTickRef.current = 0;
        }
      } else if (stateRef.current.scene === 'ending1' || stateRef.current.scene === 'trueEnd') {
        if (pressed.act) {
          audio.unlock();
          stateRef.current = {
            ...stateRef.current,
            loop: stateRef.current.loop + 1,
            scene: 'transition',
            transition: { label: `LOOP ${stateRef.current.loop + 1}:cave`, timer: 45 },
            noDamageRun: true,
          };
        }
      } else {
        if (stateRef.current.scene === 'transition') {
          stateRef.current = reduceState(stateRef.current, { type: 'TICK' });
        } else {
          stageTickRef.current += 1;

          if (pressed.act) {
            audio.tick();
            if (stateRef.current.scene === 'cave') {
              addScore(scoreForEvent('cave-key', stateRef.current.loop), 'KEY');
            } else if (stateRef.current.scene === 'grass') {
              addScore(scoreForEvent('grass-slash', stateRef.current.loop), 'HIT');
            } else {
              addScore(scoreForEvent('boss-counter', stateRef.current.loop), 'COUNTER');
            }
          }

          if (held.left || held.right || held.up || held.down) {
            if (tickRef.current % 15 === 0) {
              addScore(5 * stateRef.current.loop, 'MOVE');
            }
          }

          if (tickRef.current % 120 === 0) {
            stateRef.current = reduceState(stateRef.current, { type: 'DAMAGE' });
            audio.hit();
            if (stateRef.current.scene === 'over') {
              updateHighScore();
              stageTickRef.current = 0;
            }
          }

          if (stageTickRef.current >= STAGE_DURATION_TICKS && stateRef.current.scene !== 'over') {
            onStageClear();
          }
        }
      }

      popupRef.current = updatePopups(popupRef.current);
    };

    const draw = (): void => {
      renderFrame(ctx, stateRef.current, {
        actPressed: input.getHeld().act,
        popups: popupRef.current,
      });
    };

    const frame = (now: number): void => {
      const dt = Math.min(100, now - last);
      last = now;
      acc += dt;

      while (acc >= TICK_MS) {
        update();
        acc -= TICK_MS;
      }

      draw();
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [audio, input]);

  useEffect(
    () => () => {
      input.destroy();
      audio.destroy();
    },
    [audio, input]
  );

  const onPress = (action: VirtualAction) => {
    audio.unlock();
    input.pressVirtual(action);
  };

  const onRelease = (action: VirtualAction) => {
    input.releaseVirtual(action);
  };

  const holdEvents = (action: VirtualAction) => ({
    onMouseDown: () => onPress(action),
    onMouseUp: () => onRelease(action),
    onMouseLeave: () => onRelease(action),
    onTouchStart: (event: React.TouchEvent) => {
      event.preventDefault();
      onPress(action);
    },
    onTouchEnd: (event: React.TouchEvent) => {
      event.preventDefault();
      onRelease(action);
    },
  });

  return (
    <Wrapper role="region" aria-label="KEYS & ARMS ゲーム画面">
      <Shell>
        <LabelRow>
          <Label>◆ KEYS & ARMS ◆</Label>
          <Btn {...holdEvents('reset')} aria-label="リセット" style={{ width: 36, height: 20, borderRadius: 10 }}>
            RST
          </Btn>
        </LabelRow>
        <Bezel>
          <Canvas ref={canvasRef} />
        </Bezel>

        <Buttons>
          <Dpad>
            <Spacer />
            <Btn {...holdEvents('up')} aria-label="上">▲</Btn>
            <Spacer />
            <Btn {...holdEvents('left')} aria-label="左">◀</Btn>
            <Spacer />
            <Btn {...holdEvents('right')} aria-label="右">▶</Btn>
            <Spacer />
            <Btn {...holdEvents('down')} aria-label="下">▼</Btn>
            <Spacer />
          </Dpad>

          <ActionArea>
            <Btn $act {...holdEvents('act')} aria-label="アクション">ACT</Btn>
          </ActionArea>
        </Buttons>
      </Shell>
      <Info>HIGH SCORE: {highScore}</Info>
    </Wrapper>
  );
};

export default KeysAndArmsGame;
