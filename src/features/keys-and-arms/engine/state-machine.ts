import { DEFAULT_HP, TRANSITION_DURATION_TICKS } from '../constants';
import { CoreGameState, DamageResult, SceneState, StageId } from '../types';
import { isTrueEnding } from './difficulty';

export type StateEvent =
  | { type: 'START_GAME'; cheatMode?: boolean }
  | { type: 'DAMAGE' }
  | { type: 'STAGE_CLEAR'; stage: StageId }
  | { type: 'BACK_TO_TITLE' }
  | { type: 'TICK' };

export function createInitialState(highScore = 0): CoreGameState {
  return {
    scene: 'title',
    loop: 1,
    score: 0,
    displayedScore: 0,
    hp: DEFAULT_HP,
    maxHp: DEFAULT_HP,
    highScore,
    noDamageRun: true,
    transition: null,
    progress: {
      caveCleared: false,
      grassCleared: false,
      bossCleared: false,
    },
  };
}

function stageToScene(stage: StageId): SceneState {
  return stage;
}

function withTransition(state: CoreGameState, label: string, sceneAfter: SceneState): CoreGameState {
  return {
    ...state,
    scene: 'transition',
    transition: {
      label: `${label}:${sceneAfter}`,
      timer: TRANSITION_DURATION_TICKS,
    },
  };
}

export function applyDamage(state: CoreGameState): DamageResult {
  const nextHp = state.hp - 1;
  const didDie = nextHp <= 0;

  if (didDie) {
    return {
      didDie: true,
      nextState: {
        ...state,
        hp: 0,
        noDamageRun: false,
        scene: 'over',
      },
    };
  }

  return {
    didDie: false,
    nextState: {
      ...state,
      hp: nextHp,
      noDamageRun: false,
    },
  };
}

function markCleared(state: CoreGameState, stage: StageId): CoreGameState {
  if (stage === 'cave') {
    return { ...state, progress: { ...state.progress, caveCleared: true } };
  }
  if (stage === 'grass') {
    return { ...state, progress: { ...state.progress, grassCleared: true } };
  }
  return { ...state, progress: { ...state.progress, bossCleared: true } };
}

function resolveBossClear(state: CoreGameState): CoreGameState {
  if (state.loop === 1) {
    return { ...state, scene: 'ending1' };
  }
  if (isTrueEnding(state.loop, state.score)) {
    return { ...state, scene: 'trueEnd' };
  }

  const nextLoop = state.loop + 1;
  return withTransition(
    {
      ...state,
      loop: nextLoop,
      noDamageRun: true,
      progress: {
        caveCleared: false,
        grassCleared: false,
        bossCleared: false,
      },
    },
    `LOOP ${nextLoop}`,
    'cave'
  );
}

function tickTransition(state: CoreGameState): CoreGameState {
  if (state.scene !== 'transition' || !state.transition) {
    return state;
  }

  const nextTimer = state.transition.timer - 1;
  if (nextTimer > 0) {
    return {
      ...state,
      transition: {
        ...state.transition,
        timer: nextTimer,
      },
    };
  }

  const [, nextSceneLabel] = state.transition.label.split(':');
  const nextScene = (nextSceneLabel as SceneState | undefined) ?? 'cave';

  return {
    ...state,
    scene: nextScene,
    transition: null,
  };
}

export function reduceState(state: CoreGameState, event: StateEvent): CoreGameState {
  switch (event.type) {
    case 'START_GAME': {
      const hp = event.cheatMode ? 20 : DEFAULT_HP;
      return {
        ...state,
        scene: stageToScene('cave'),
        loop: 1,
        score: 0,
        displayedScore: 0,
        hp,
        maxHp: hp,
        noDamageRun: true,
        transition: null,
        progress: {
          caveCleared: false,
          grassCleared: false,
          bossCleared: false,
        },
      };
    }
    case 'DAMAGE':
      return applyDamage(state).nextState;
    case 'STAGE_CLEAR': {
      const marked = markCleared(state, event.stage);
      if (event.stage === 'cave') {
        return withTransition(marked, 'STAGE 2', 'grass');
      }
      if (event.stage === 'grass') {
        return withTransition(marked, 'STAGE 3', 'boss');
      }
      return resolveBossClear(marked);
    }
    case 'BACK_TO_TITLE':
      return {
        ...state,
        scene: 'title',
        transition: null,
      };
    case 'TICK':
      return tickTransition(state);
    default:
      return state;
  }
}
