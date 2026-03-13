import type { GameState, RuntimeStageConfig, ArtKey } from '../types';
import type { CycleJudgment } from '../domain/judgment';
import type { HitOutcome } from './resolve-helpers';
import type { RenderState } from './useGameEngine';

/** 描画エフェクトが必要とするコンテキスト */
export interface RenderEffectContext {
  gRef: { current: GameState | null };
  patch: (partial: Partial<RenderState>) => void;
  syncGame: () => void;
  updArt: () => void;
  setArtTemp: (state: ArtKey, ms: number) => void;
  showPop: (lane: number, text: string) => void;
  clearSegs: () => void;
  addTimer: (fn: () => void, ms: number) => unknown;
  laneMultiplier: (lane: number) => number;
  audio: {
    sh: () => void;
    die: () => void;
    ok: (mult: number) => void;
    combo: (count: number) => void;
    near: () => void;
  };
  cont: (cfg: RuntimeStageConfig) => void;
  endGame: (cleared: boolean) => void;
}

/** renderHitEffect のパラメータ */
export interface HitEffectParams {
  ctx: RenderEffectContext;
  game: GameState;
  outcome: HitOutcome;
  cfg: RuntimeStageConfig;
  pause: number;
}

/** renderDodgeEffect のパラメータ */
export interface DodgeEffectParams {
  ctx: RenderEffectContext;
  game: GameState;
  judgment: CycleJudgment;
  obstacles: readonly number[];
  cfg: RuntimeStageConfig;
  pause: number;
}

/**
 * 被弾時の UI 描画（副作用）
 */
export function renderHitEffect(params: HitEffectParams): void {
  const { ctx, game: g, outcome, cfg, pause } = params;
  const { patch, updArt, addTimer, syncGame, clearSegs, setArtTemp, audio, showPop, gRef, cont, endGame } = ctx;

  patch({ shaking: true, flash: true });
  updArt();
  addTimer(() => patch({ shaking: false }), 300);
  addTimer(() => patch({ flash: false }), 550);

  if (outcome === 'shield') {
    audio.sh();
    showPop(g.lane, '◆SHIELD');
    updArt();
    syncGame();
    clearSegs();
    addTimer(() => {
      if (!gRef.current?.alive) return;
      setArtTemp('idle', 0);
      cont(cfg);
    }, Math.min(pause, 400));
    return;
  }

  if (outcome === 'revive') {
    audio.sh();
    showPop(g.lane, '♥REVIVE');
    syncGame();
    clearSegs();
    addTimer(() => {
      if (!gRef.current?.alive) return;
      setArtTemp('idle', 0);
      cont(cfg);
    }, Math.min(pause, 500));
    return;
  }

  // 死亡
  audio.die();
  updArt();
  syncGame();
  addTimer(() => {
    patch({ flash: false });
    endGame(false);
  }, 700);
}

/**
 * 回避時の UI 描画（副作用）
 */
export function renderDodgeEffect(params: DodgeEffectParams): void {
  const { ctx, game: g, judgment, obstacles: obs, cfg, pause } = params;
  const { setArtTemp, showPop, audio, laneMultiplier, syncGame, addTimer, clearSegs, gRef, cont } = ctx;

  // シェルター吸収の表示
  const isShelterAbsorbed = judgment.sheltered && obs.includes(g.lane);
  if (isShelterAbsorbed) {
    showPop(g.lane, '◇SHELTER◇');
    audio.sh();
    setArtTemp('safe', 400);
  } else {
    setArtTemp('safe', 300);
  }

  // ポップテキスト
  if (judgment.frozen) {
    showPop(g.lane, 'FROZEN');
  } else if (judgment.zeroed) {
    if (!isShelterAbsorbed) {
      showPop(g.lane, judgment.sheltered ? '×0 避難' : '×0');
    }
  } else {
    audio.ok(laneMultiplier(g.lane));
    if (g.comboCount >= 3) audio.combo(g.comboCount);
    showPop(g.lane, judgment.nearMiss ? '+' + judgment.scoreGained + '!' : '+' + judgment.scoreGained);
    if (judgment.nearMiss) audio.near();
  }

  syncGame();
  addTimer(() => {
    clearSegs();
    if (gRef.current?.alive) cont(cfg);
  }, pause);
}
