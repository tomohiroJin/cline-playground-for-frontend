/**
 * renderGameFrame 特性化テスト（Phase D-1 一時安全網）
 *
 * 記録 ctx＋記録 SpriteRenderer で renderGameFrame の描画コマンド列を baseline に固定する。
 * 層分割（Task 4〜8）の前後で records が変化しないことを保証する。
 * NOTE: Phase D-1 完了（Task 10）後に本ファイルとスナップショットを削除する。
 */
import { renderGameFrame } from './renderGameFrame';
import { createRecordingCtx, createRecordingSpriteRenderer } from './__mockCtx';
import type { DrawCall } from './__mockCtx';
import type { RenderContext } from './renderContext';
import { createTestMap } from '../../../__tests__/testUtils';
import { createPlayer } from '../../../domain/entities/player';
import { PlayerClass, ExplorationState } from '../../../types';
import { EffectManager, resetEffectIdCounter } from '../../effects/effectManager';
import { DeathEffect } from '../../effects/deathEffect';
import { createBossWarningState } from '../../effects/bossEffects';
import { AfterImageManager, getActiveRewardEffects } from '../../effects/stageVisual';
import { INITIAL_MOVEMENT_STATE } from '../../../index';

/**
 * RenderContext を構築するヘルパー
 *
 * stageStartTimeRef.current = 0 かつ now = 5000 で stageIntroElapsed >= 1500 → 'done' になり
 * 演出描画をスキップするため、タイルとプレイヤーのみの決定的なシーケンスが得られる。
 */
function buildRc(records: DrawCall[], overrides: Partial<RenderContext> = {}): RenderContext {
  const map = createTestMap(7, 7);
  const player = createPlayer(1, 1, PlayerClass.WARRIOR);
  const mapState = {
    exploration: Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => ExplorationState.UNEXPLORED)),
    isMapVisible: false,
    isFullScreen: false,
  };
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 528;

  return {
    ctx: overrides.ctx as CanvasRenderingContext2D,
    canvas,
    canvasWrapperRef: { current: null },
    now: 5000,
    map,
    player,
    enemies: [],
    items: [],
    traps: [],
    walls: [],
    mapState,
    goalPos: { x: 5, y: 5 },
    debugState: {
      enabled: false,
      showPanel: false,
      showFullMap: false,
      showPath: false,
      showCoordinates: false,
    },
    attackEffect: undefined,
    lastDamageAt: 0,
    isDying: false,
    currentStage: undefined,
    maxLevel: 10,
    rewardEffects: getActiveRewardEffects([]),
    spriteRenderer: createRecordingSpriteRenderer(records),
    movementStateRef: { current: INITIAL_MOVEMENT_STATE },
    effectManagerRef: { current: new EffectManager() },
    deathEffectRef: { current: new DeathEffect() },
    bossWarningRef: { current: createBossWarningState() },
    afterImageManagerRef: { current: new AfterImageManager() },
    stageStartTimeRef: { current: 0 },
    dyingStartTimeRef: { current: 0 },
    playerAttackUntilRef: { current: 0 },
    playerDamageUntilRef: { current: 0 },
    lastAttackEffectKeyRef: { current: null },
    lastDamageAtRef: { current: 0 },
    floatingTextManagerRef: undefined,
    comboStateRef: undefined,
    effectQueueRef: undefined,
    ...overrides,
  } as RenderContext;
}

beforeEach(() => {
  // effectIdCounter をリセットして決定的なシーケンスを保証する
  resetEffectIdCounter();
});

describe('renderGameFrame 特性化（Phase D-1・完了後削除）', () => {
  it('通常状態の描画コマンド列が変化しないこと', () => {
    const { ctx, records } = createRecordingCtx();
    renderGameFrame(buildRc(records, { ctx }));
    expect(records).toMatchSnapshot();
  });

  it('デバッグ有効時の描画コマンド列が変化しないこと', () => {
    const { ctx, records } = createRecordingCtx();
    const debugState = {
      enabled: true,
      showPanel: true,
      showFullMap: false,
      showPath: false,
      showCoordinates: true,
    };
    renderGameFrame(buildRc(records, { ctx, debugState }));
    expect(records).toMatchSnapshot();
  });
});
