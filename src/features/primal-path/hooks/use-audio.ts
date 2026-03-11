/**
 * 原始進化録 - PRIMAL PATH - useAudio フック
 *
 * AudioEngine + BgmEngine のライフサイクル管理
 */
import { useRef, useCallback } from 'react';
import type { SfxType, BgmType } from '../types';
import { AudioEngine, BgmEngine } from '../audio';

/** オーディオ管理フック */
export function useAudio() {
  const initialized = useRef(false);

  const init = useCallback(() => {
    if (!initialized.current) {
      AudioEngine.init();
      initialized.current = true;
    }
  }, []);

  const playSfx = useCallback((type: SfxType) => {
    AudioEngine.play(type);
  }, []);

  const playBgm = useCallback((type: BgmType) => {
    BgmEngine.play(type);
  }, []);

  const stopBgm = useCallback(() => {
    BgmEngine.stop();
  }, []);

  const setBgmVolume = useCallback((v: number) => {
    BgmEngine.setVolume(v);
  }, []);

  const setSfxVolume = useCallback((v: number) => {
    AudioEngine.setSfxVolume(v);
  }, []);

  const cleanup = useCallback(() => {
    AudioEngine.cleanup();
  }, []);

  return { init, playSfx, playBgm, stopBgm, setBgmVolume, setSfxVolume, cleanup };
}
