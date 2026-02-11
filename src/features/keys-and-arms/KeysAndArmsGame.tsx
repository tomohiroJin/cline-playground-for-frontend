import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { KeysAndArmsAudio } from './audio';
import { BOSS_PEDESTAL_TARGET, CANVAS_HEIGHT, CANVAS_WIDTH, INITIAL_HP } from './constants';
import { updateGameState } from './engine/update';
import { InputController } from './input';
import { renderGame } from './render/renderer';
import { loadHiScore, saveHiScore } from './storage';
import type { GameState, VirtualKey } from './types';

const Shell = styled.div`
  background: linear-gradient(165deg, #a89068, #887050, #685838);
  border-radius: 24px;
  padding: 12px 16px 10px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.08);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2px;
  margin-bottom: 6px;
`;

const Label = styled.div`
  margin-bottom: 0;
  text-align: center;
  font-size: 7px;
  color: #d0c0a0;
  letter-spacing: 5px;
`;

const CanvasBox = styled.div`
  background: #1a1a14;
  border-radius: 6px;
  padding: 4px;
  box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.85);
`;

const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
`;

const DPad = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
`;

const DPadHorizontal = styled.div`
  display: flex;
  gap: 1px;
`;

const Button = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: manipulation;
  color: #777;
  background: linear-gradient(155deg, #333, #1a1a1a);
`;

const ActionButton = styled(Button)`
  width: 52px;
  height: 52px;
  font-size: 7px;
  color: #faa;
  background: linear-gradient(155deg, #cc2828, #881414);
`;

const ResetButton = styled(Button)`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  font-size: 5px;
`;

const Info = styled.div`
  text-align: center;
  font-size: 6px;
  color: #555;
  margin-top: 4px;
`;

const GameCanvas = styled.canvas`
  display: block;
  border-radius: 3px;
  width: min(100%, 980px);
  height: auto;
  max-height: calc(100vh - 180px);
  aspect-ratio: 440 / 340;
`;

const createInitialState = (): GameState => ({
  scene: 'title',
  stage: 'cave',
  score: 0,
  hiScore: loadHiScore(),
  hp: INITIAL_HP,
  maxHp: INITIAL_HP,
  loop: 1,
  tick: 0,
  stageTick: 0,
  endedByNoDamage: true,
  caveKeys: 0,
  cavePlaced: 0,
  grassKills: 0,
  grassGoal: 14,
  grassCombo: 0,
  beatCounter: 0,
  beatNum: 0,
  noDamage: true,
  cavePos: 0,
  caveDir: 1,
  caveKeyOwned: [false, false, false],
  caveCarrying: false,
  caveTrapOn: false,
  caveTrapBeat: 0,
  caveBatPhase: 0,
  caveBatBeat: 0,
  caveMimicOpen: false,
  caveMimicBeat: 0,
  cavePryCount: 0,
  caveSpiderY: 0,
  caveSpiderBeat: 0,
  caveHurtCd: 0,
  caveWon: false,
  caveWonTick: 0,
  caveCageProgress: 0,
  grassMaxSpawn: 26,
  grassSpawned: 0,
  grassGuards: 3,
  grassAttackCd: 0,
  grassHurtCd: 0,
  grassWon: false,
  grassWonTick: 0,
  grassSweepReady: false,
  grassNextShieldAt: 5,
  grassEnemies: [],
  earnedShields: 0,
  bossPos: 0,
  bossPedestals: 0,
  bossHasGem: true,
  bossPedestalState: [0, 0, 0, 0, 0, 0],
  bossShields: 1,
  bossWon: false,
  bossWonTick: 0,
});

interface KeyButtonConfig {
  key: VirtualKey;
  label: string;
  ref: React.RefObject<HTMLButtonElement | null>;
}

const KeysAndArmsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const upRef = useRef<HTMLButtonElement | null>(null);
  const downRef = useRef<HTMLButtonElement | null>(null);
  const leftRef = useRef<HTMLButtonElement | null>(null);
  const rightRef = useRef<HTMLButtonElement | null>(null);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const resetRef = useRef<HTMLButtonElement | null>(null);

  const inputController = useMemo(() => new InputController(), []);
  const audioController = useMemo(() => new KeysAndArmsAudio(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return () => undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return () => undefined;
    }

    let state = createInitialState();
    let frameHandle = 0;

    const buttonConfigs: KeyButtonConfig[] = [
      { key: 'arrowup', label: '▲', ref: upRef },
      { key: 'arrowdown', label: '▼', ref: downRef },
      { key: 'arrowleft', label: '◀', ref: leftRef },
      { key: 'arrowright', label: '▶', ref: rightRef },
      { key: 'z', label: 'ACT', ref: actionRef },
      { key: 'escape', label: 'RST', ref: resetRef },
    ];

    const bindings = buttonConfigs.reduce<Array<{ key: VirtualKey; element: HTMLElement }>>(
      (accumulator, { key, ref }) => {
        if (ref.current) {
          accumulator.push({
            key,
            element: ref.current,
          });
        }
        return accumulator;
      },
      []
    );

    inputController.attach(bindings);

    const loop = (): void => {
      const actionPressed =
        inputController.isJustPressed('z') ||
        inputController.isJustPressed(' ') ||
        inputController.isJustPressed('enter');
      const resetPressed = inputController.isJustPressed('escape');

      if (actionPressed || resetPressed) {
        void audioController.ensureStarted();
      }

      const previousScene = state.scene;
      const previousStage = state.stage;
      const previousHp = state.hp;
      state = updateGameState(state, {
        isActionJustPressed: actionPressed,
        isActionPressed: inputController.isPressed('z') || inputController.isPressed(' '),
        isResetJustPressed: resetPressed,
        isLeftJustPressed: inputController.isJustPressed('arrowleft'),
        isRightJustPressed: inputController.isJustPressed('arrowright'),
        isUpJustPressed: inputController.isJustPressed('arrowup'),
        isDownJustPressed: inputController.isJustPressed('arrowdown'),
      });

      if (state.score > state.hiScore) {
        state = {
          ...state,
          hiScore: state.score,
        };
        saveHiScore(state.hiScore);
      }

      if (previousScene === 'title' && state.scene === 'play') {
        audioController.playStart();
      }
      if (state.hp < previousHp || (previousScene === 'play' && state.scene === 'over')) {
        audioController.playHit();
      }
      if (previousScene === 'play' && state.scene === 'play' && previousStage !== state.stage) {
        audioController.playClear();
        audioController.resetBgmBeat();
      }
      if (previousScene === 'play' && (state.scene === 'ending1' || state.scene === 'trueEnd')) {
        audioController.playClear();
      }
      if (state.scene === 'play') {
        const beatLength = audioController.getBeatLength(state.loop);
        if (state.tick % beatLength === 0) {
          const isVictory =
            state.stage === 'boss' && state.bossPedestals >= BOSS_PEDESTAL_TARGET;
          audioController.playBgmTick(state.stage, isVictory);
        }
      }

      renderGame(context, state);
      inputController.consumeJustPressed();
      frameHandle = window.requestAnimationFrame(loop);
    };

    renderGame(context, state);
    frameHandle = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frameHandle);
      inputController.detach();
    };
  }, [audioController, inputController]);

  return (
    <Shell>
      <Header>
        <Label>◆ KEYS &amp; ARMS ◆</Label>
        <ResetButton ref={resetRef} type="button" aria-label="リセット">
          RST
        </ResetButton>
      </Header>
      <CanvasBox>
        <GameCanvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="KEYS & ARMS"
        />
      </CanvasBox>
      <ControlRow>
        <DPad>
          <Button ref={upRef} type="button" aria-label="上">
            ▲
          </Button>
          <DPadHorizontal>
            <Button ref={leftRef} type="button" aria-label="左">
              ◀
            </Button>
            <div style={{ width: '42px' }} />
            <Button ref={rightRef} type="button" aria-label="右">
              ▶
            </Button>
          </DPadHorizontal>
          <Button ref={downRef} type="button" aria-label="下">
            ▼
          </Button>
        </DPad>
        <ActionButton ref={actionRef} type="button" aria-label="アクション">
          ACT
        </ActionButton>
      </ControlRow>
      <Info>D-PAD + ACT</Info>
    </Shell>
  );
};

export default KeysAndArmsGame;
