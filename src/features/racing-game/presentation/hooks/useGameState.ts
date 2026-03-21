// ゲーム設定ステート管理フック

import { useState, useCallback } from 'react';

/** ゲーム設定 */
export interface GameConfig {
  readonly mode: string;
  readonly course: number;
  readonly speed: number;
  readonly cpu: number;
  readonly laps: number;
  readonly color1: number;
  readonly color2: number;
  readonly cardsEnabled: boolean;
}

/** ゲーム設定の初期値 */
const DEFAULT_CONFIG: GameConfig = {
  mode: 'cpu',
  course: 0,
  speed: 1,
  cpu: 1,
  laps: 3,
  color1: 0,
  color2: 1,
  cardsEnabled: true,
};

export interface UseGameStateResult {
  readonly config: GameConfig;
  readonly setMode: (mode: string) => void;
  readonly setCourse: (course: number) => void;
  readonly setSpeed: (speed: number) => void;
  readonly setCpu: (cpu: number) => void;
  readonly setLaps: (laps: number) => void;
  readonly setColor1: (color: number) => void;
  readonly setColor2: (color: number) => void;
  readonly setCardsEnabled: (enabled: boolean) => void;
  readonly bests: Record<string, number>;
  readonly setBests: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export const useGameState = (): UseGameStateResult => {
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [bests, setBests] = useState<Record<string, number>>({});

  const updateConfig = useCallback((partial: Partial<GameConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    config,
    setMode: useCallback((mode: string) => updateConfig({ mode }), [updateConfig]),
    setCourse: useCallback((course: number) => updateConfig({ course }), [updateConfig]),
    setSpeed: useCallback((speed: number) => updateConfig({ speed }), [updateConfig]),
    setCpu: useCallback((cpu: number) => updateConfig({ cpu }), [updateConfig]),
    setLaps: useCallback((laps: number) => updateConfig({ laps }), [updateConfig]),
    setColor1: useCallback((color1: number) => updateConfig({ color1 }), [updateConfig]),
    setColor2: useCallback((color2: number) => updateConfig({ color2 }), [updateConfig]),
    setCardsEnabled: useCallback((cardsEnabled: boolean) => updateConfig({ cardsEnabled }), [updateConfig]),
    bests,
    setBests,
  };
};
