import { render, screen } from '@testing-library/react';
import { GameRouter } from '../../../presentation/components/GameRouter';
import type { GameRouterProps } from '../../../presentation/components/GameRouter';
import { createMetaState } from '../../../domain/models/meta-state';
import { FLOOR_META } from '../../../domain/constants/floor-meta';

// 最小限の props を組み立てるヘルパー（archive 表示の確認のみ）
const baseProps = (): GameRouterProps => ({
  phase: 'archive',
  game: {
    player: null, diff: null, event: null, floor: 1, step: 0, ending: null,
    isNewEnding: false, isNewDiffClear: false, usedSecondLife: false, chainNext: null,
    log: [], resTxt: '', resChg: null, drainInfo: null, legacyId: null,
  },
  derived: {
    meta: createMetaState({ echoDepth: 1, fragments: ['f_lian_1'] }),
    fx: {} as GameRouterProps['derived']['fx'],
    progressPct: 0, floorMeta: FLOOR_META[1], floorColor: '#60a5fa',
    vignette: {}, lowMental: false,
  },
  ui: {
    showLog: false, audioSettings: { sfxEnabled: false } as GameRouterProps['ui']['audioSettings'],
    lastBought: null, shake: false, overlay: null, revealed: '', done: true, ready: true,
  },
  handlers: {
    startRun: () => undefined, enableAudio: () => undefined, selectDiff: () => undefined,
    enterFloor: () => undefined, handleChoice: () => undefined, proceed: () => undefined,
    doUnlock: () => undefined, toggleAudio: () => undefined, setShowLog: () => undefined,
    setPhase: () => undefined, updateMeta: () => undefined, resetMeta: async () => undefined,
    handleAudioSettingsChange: () => undefined, skip: () => undefined,
  },
  Particles: null,
  eventCount: 196,
});

describe('GameRouter archive フェーズ', () => {
  it('phase=archive で残響書庫を描画する', () => {
    render(<GameRouter {...baseProps()} />);
    expect(screen.getByText('残響書庫')).toBeInTheDocument();
  });
});
