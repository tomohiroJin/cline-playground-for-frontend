import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { CANVAS_HEIGHT, CANVAS_WIDTH, TICK_MS } from './constants';
import { createInputController } from './input';
import { createAudioController } from './audio';
import { createInitialState, reduceState } from './engine/state-machine';
import { buildStageDifficulty } from './engine/difficulty';
import { loadHighScore, saveHighScore, shouldUpdateHighScore } from './storage';
import { scoreForEvent } from './engine/scoring';
import { renderFrame } from './render/renderer';
import { Popup, updatePopups } from './render/effects';
import { SceneState } from './types';

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

type VirtualAction = 'up' | 'down' | 'left' | 'right' | 'act' | 'reset';
type PlayingScene = 'cave' | 'grass' | 'boss';

interface Hazard {
  lane: number;
  row: number;
}

interface StageRuntime {
  playerLane: number;
  progress: number;
  target: number;
  spawnTicks: number;
  advanceTicks: number;
  spawnInterval: number;
  advanceInterval: number;
  hazards: Hazard[];
  invulnTicks: number;
}

const PLAYER_LANES = 3;
const PLAYER_ROW = 5;

const STAGE_SETTINGS: Record<PlayingScene, {
  targetBase: number;
  spawnBase: number;
  advanceBase: number;
  hitEvent: 'cave-key' | 'grass-slash' | 'boss-counter';
  clearEvent: 'cave-clear' | 'grass-clear' | 'boss-clear';
}> = {
  cave: {
    targetBase: 7,
    spawnBase: 48,
    advanceBase: 10,
    hitEvent: 'cave-key',
    clearEvent: 'cave-clear',
  },
  grass: {
    targetBase: 10,
    spawnBase: 40,
    advanceBase: 8,
    hitEvent: 'grass-slash',
    clearEvent: 'grass-clear',
  },
  boss: {
    targetBase: 12,
    spawnBase: 34,
    advanceBase: 7,
    hitEvent: 'boss-counter',
    clearEvent: 'boss-clear',
  },
};

function isPlayingScene(scene: SceneState): scene is PlayingScene {
  return scene === 'cave' || scene === 'grass' || scene === 'boss';
}

function createStageRuntime(scene: PlayingScene, loop: number): StageRuntime {
  const cfg = STAGE_SETTINGS[scene];
  const diff = buildStageDifficulty(loop);
  const spawnInterval = Math.max(10, cfg.spawnBase - (loop - 1) * 3 - Math.floor(diff.hazardCycle / 2));
  const advanceInterval = Math.max(
    3,
    cfg.advanceBase - Math.floor((loop - 1) / 2) - Math.floor((12 - diff.moveWindow) / 3)
  );

  return {
    playerLane: 1,
    progress: 0,
    target: cfg.targetBase + (loop - 1) * 2,
    spawnTicks: spawnInterval,
    advanceTicks: advanceInterval,
    spawnInterval,
    advanceInterval,
    hazards: [],
    invulnTicks: 0,
  };
}

function spawnHazard(runtime: StageRuntime): StageRuntime {
  const lane = Math.floor(Math.random() * PLAYER_LANES);
  return {
    ...runtime,
    spawnTicks: runtime.spawnInterval,
    hazards: [...runtime.hazards, { lane, row: 0 }],
  };
}

function clampLane(lane: number): number {
  return Math.max(0, Math.min(PLAYER_LANES - 1, lane));
}

export const KeysAndArmsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [highScore, setHighScore] = useState<number>(() => loadHighScore());

  const stateRef = useRef(createInitialState(highScore));
  const popupRef = useRef<Popup[]>([]);
  const runtimeRef = useRef<StageRuntime>(createStageRuntime('cave', 1));
  const prevSceneRef = useRef<SceneState>('title');

  const input = useMemo(() => createInputController(window), []);
  const audio = useMemo(() => createAudioController(true), []);

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

    const onStageClear = (scene: PlayingScene): void => {
      const clearEvent = STAGE_SETTINGS[scene].clearEvent;
      addScore(scoreForEvent(clearEvent, stateRef.current.loop), 'CLEAR');
      stateRef.current = reduceState(stateRef.current, { type: 'STAGE_CLEAR', stage: scene });
      audio.clear();
      updateHighScore();
    };

    const update = (): void => {
      const pressed = input.consumePressed();
      const held = input.getHeld();

      if (pressed.reset && stateRef.current.scene !== 'title') {
        updateHighScore();
        stateRef.current = reduceState(stateRef.current, { type: 'BACK_TO_TITLE' });
      }

      if (stateRef.current.scene === 'title') {
        if (pressed.act) {
          audio.unlock();
          stateRef.current = reduceState(stateRef.current, { type: 'START_GAME' });
        }
      } else if (stateRef.current.scene === 'over') {
        if (pressed.act) {
          audio.unlock();
          stateRef.current = reduceState(stateRef.current, { type: 'START_GAME' });
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
      } else if (stateRef.current.scene === 'transition') {
        stateRef.current = reduceState(stateRef.current, { type: 'TICK' });
      } else if (isPlayingScene(stateRef.current.scene)) {
        const scene = stateRef.current.scene;
        const cfg = STAGE_SETTINGS[scene];
        let runtime = runtimeRef.current;

        if (runtime.invulnTicks > 0) {
          runtime = { ...runtime, invulnTicks: runtime.invulnTicks - 1 };
        }

        if (pressed.left || pressed.up) {
          runtime = { ...runtime, playerLane: clampLane(runtime.playerLane - 1) };
        }
        if (pressed.right || pressed.down) {
          runtime = { ...runtime, playerLane: clampLane(runtime.playerLane + 1) };
        }

        if (pressed.act) {
          audio.tick();
          const hitIndex = runtime.hazards.findIndex(
            hazard => hazard.lane === runtime.playerLane && hazard.row >= PLAYER_ROW - 1
          );
          if (hitIndex >= 0) {
            const hitEvent = cfg.hitEvent;
            addScore(scoreForEvent(hitEvent, stateRef.current.loop), 'HIT');
            runtime = {
              ...runtime,
              progress: runtime.progress + 1,
              hazards: runtime.hazards.filter((_, index) => index !== hitIndex),
            };
          }
        }

        runtime = { ...runtime, spawnTicks: runtime.spawnTicks - 1, advanceTicks: runtime.advanceTicks - 1 };

        if (runtime.spawnTicks <= 0) {
          runtime = spawnHazard(runtime);
        }

        if (runtime.advanceTicks <= 0) {
          const nextHazards: Hazard[] = [];
          let damaged = false;
          runtime.hazards.forEach(hazard => {
            const nextRow = hazard.row + 1;
            if (
              nextRow >= PLAYER_ROW &&
              hazard.lane === runtime.playerLane &&
              runtime.invulnTicks <= 0 &&
              !damaged
            ) {
              damaged = true;
              return;
            }
            if (nextRow <= PLAYER_ROW) {
              nextHazards.push({ ...hazard, row: nextRow });
            }
          });

          runtime = {
            ...runtime,
            hazards: nextHazards,
            advanceTicks: runtime.advanceInterval,
          };

          if (damaged) {
            stateRef.current = reduceState(stateRef.current, { type: 'DAMAGE' });
            audio.hit();
            if (stateRef.current.scene === 'over') {
              updateHighScore();
            } else {
              runtime = { ...runtime, invulnTicks: 18 };
            }
          }
        }

        runtimeRef.current = runtime;

        if (runtime.progress >= runtime.target && isPlayingScene(stateRef.current.scene)) {
          onStageClear(scene);
        }

        if (held.left || held.right || held.up || held.down) {
          addScore(stateRef.current.loop, 'MOVE');
        }
      }

      if (isPlayingScene(stateRef.current.scene) && prevSceneRef.current !== stateRef.current.scene) {
        runtimeRef.current = createStageRuntime(stateRef.current.scene, stateRef.current.loop);
      }
      if (!isPlayingScene(stateRef.current.scene)) {
        runtimeRef.current = createStageRuntime('cave', stateRef.current.loop);
      }
      prevSceneRef.current = stateRef.current.scene;

      popupRef.current = updatePopups(popupRef.current);
    };

    const draw = (): void => {
      const runtime = runtimeRef.current;
      renderFrame(ctx, stateRef.current, {
        actPressed: input.getHeld().act,
        popups: popupRef.current,
        playerLane: runtime.playerLane,
        hazardRows: runtime.hazards,
        progress: runtime.progress,
        target: runtime.target,
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
    onTouchCancel: (event: React.TouchEvent) => {
      event.preventDefault();
      onRelease(action);
    },
  });

  return (
    <Wrapper role="region" aria-label="KEYS & ARMS ゲーム画面">
      <Shell>
        <LabelRow>
          <Label>◆ KEYS & ARMS ◆</Label>
          <Btn
            {...holdEvents('reset')}
            aria-label="リセット"
            style={{ width: 36, height: 20, borderRadius: 10 }}
          >
            RST
          </Btn>
        </LabelRow>
        <Bezel>
          <Canvas ref={canvasRef} />
        </Bezel>

        <Buttons>
          <Dpad>
            <Spacer />
            <Btn {...holdEvents('up')} aria-label="上">
              ▲
            </Btn>
            <Spacer />
            <Btn {...holdEvents('left')} aria-label="左">
              ◀
            </Btn>
            <Spacer />
            <Btn {...holdEvents('right')} aria-label="右">
              ▶
            </Btn>
            <Spacer />
            <Btn {...holdEvents('down')} aria-label="下">
              ▼
            </Btn>
            <Spacer />
          </Dpad>

          <ActionArea>
            <Btn $act {...holdEvents('act')} aria-label="アクション">
              ACT
            </Btn>
          </ActionArea>
        </Buttons>
      </Shell>
      <Info>HIGH SCORE: {highScore}</Info>
    </Wrapper>
  );
};

export default KeysAndArmsGame;
