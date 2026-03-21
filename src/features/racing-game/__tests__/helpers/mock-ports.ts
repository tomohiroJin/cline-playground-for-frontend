// テスト用モック Port

import type { RendererPort } from '../../application/ports/renderer-port';
import type { AudioPort, SfxType, WallStage } from '../../application/ports/audio-port';
import type { StoragePort } from '../../application/ports/storage-port';
import type { InputPort, InputState, DraftInput } from '../../application/ports/input-port';

/** 描画の呼び出しを記録するモック Renderer */
export const createMockRenderer = (): RendererPort & { calls: string[] } => {
  const calls: string[] = [];
  const noop = (name: string) => (..._args: unknown[]) => { calls.push(name); };
  return {
    calls,
    renderBackground: noop('renderBackground'),
    renderTrack: noop('renderTrack'),
    renderKart: noop('renderKart'),
    renderHud: noop('renderHud'),
    renderEffects: noop('renderEffects'),
    renderDraftUI: noop('renderDraftUI'),
    renderHighlightBanner: noop('renderHighlightBanner'),
    renderCountdown: noop('renderCountdown'),
    renderResult: noop('renderResult'),
    beginFrame: noop('beginFrame'),
    endFrame: noop('endFrame'),
  };
};

/** 効果音の呼び出しを記録するモック Audio */
export const createMockAudio = (): AudioPort & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    startEngine: () => { calls.push('startEngine'); },
    updateEngine: () => { calls.push('updateEngine'); },
    stopEngine: () => { calls.push('stopEngine'); },
    playSfx: (type: SfxType) => { calls.push(`playSfx:${type}`); },
    playWallHit: (stage: WallStage) => { calls.push(`playWallHit:${stage}`); },
    cleanup: () => { calls.push('cleanup'); },
  };
};

/** インメモリのモック Storage */
export const createMockStorage = (): StoragePort & { data: Record<string, number> } => {
  const data: Record<string, number> = {};
  return {
    data,
    async saveScore(gameId: string, score: number, key: string) {
      const k = `${gameId}:${key}`;
      data[k] = score;
    },
    async getHighScore(gameId: string, key: string, order: 'asc' | 'desc') {
      const k = `${gameId}:${key}`;
      return data[k] ?? (order === 'asc' ? Infinity : 0);
    },
  };
};

/** プログラマブルなモック Input */
export const createMockInput = (
  inputs?: Record<number, InputState>,
): InputPort => {
  const defaultInput: InputState = { left: false, right: false, handbrake: false };
  const defaultDraft: DraftInput = { left: false, right: false, confirm: false };
  return {
    getPlayerInput(playerIndex: number): InputState {
      return inputs?.[playerIndex] ?? defaultInput;
    },
    getDraftInput(): DraftInput {
      return defaultDraft;
    },
    clearDraftInput(): void {
      // no-op
    },
  };
};
