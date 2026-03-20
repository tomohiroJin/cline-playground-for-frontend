// AudioPort の Web Audio API 実装（既存 SoundEngine のアダプター）

import type { AudioPort, SfxType, WallStage } from '../../application/ports/audio-port';
import { SoundEngine } from '../../audio';

/** SfxType → SoundEngine メソッドのマッピング */
const SFX_MAP: Record<SfxType, () => void> = {
  collision: () => SoundEngine.collision(),
  lap: () => SoundEngine.lap(),
  countdown: () => SoundEngine.countdown(),
  go: () => SoundEngine.go(),
  finish: () => SoundEngine.finish(),
  finalLap: () => SoundEngine.finalLap(),
  checkpoint: () => SoundEngine.checkpoint(),
  driftStart: () => SoundEngine.driftStart(),
  driftBoost: () => SoundEngine.driftBoost(),
  heatMax: () => SoundEngine.heatMax(),
  heatBoost: () => SoundEngine.heatBoost(),
  cardSelect: () => {}, // 旧コードにはカード選択音がないため no-op
};

/** 既存 SoundEngine を AudioPort として公開するアダプター */
export const createWebAudioEngine = (): AudioPort => ({
  startEngine: () => SoundEngine.startEngine(),
  updateEngine: (speed: number) => SoundEngine.updateEngine(speed),
  stopEngine: () => SoundEngine.stopEngine(),
  playSfx: (type: SfxType) => SFX_MAP[type](),
  playWallHit: (stage: WallStage) => SoundEngine.wallStaged(stage),
  cleanup: () => SoundEngine.cleanup(),
});
