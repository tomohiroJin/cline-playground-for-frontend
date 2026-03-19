/**
 * Tone.js オーディオアダプター
 *
 * AudioPort インターフェースを Tone.js で実装する。
 * 既存の audio/sound.ts の機能を委譲する。
 */
import { AudioPort } from './audio-port';
import {
  initAudio,
  playBgm,
  stopBgm,
  playSfxCorrect,
  playSfxIncorrect,
  playSfxTick,
  playSfxTickUrgent,
  playSfxCombo,
  playSfxComboBreak,
  playSfxDrumroll,
  playSfxFanfare,
  playSfxAchievement,
  playSfxStart,
  playSfxResult,
} from '../../audio/sound';

export class ToneAudioAdapter implements AudioPort {
  initialize(): void { initAudio(); }
  playBgm(): void { playBgm(); }
  stopBgm(): void { stopBgm(); }
  playSfxCorrect(): void { playSfxCorrect(); }
  playSfxIncorrect(): void { playSfxIncorrect(); }
  playSfxTick(): void { playSfxTick(); }
  playSfxTickUrgent(remaining: number): void { playSfxTickUrgent(remaining); }
  playSfxCombo(): void { playSfxCombo(); }
  playSfxComboBreak(): void { playSfxComboBreak(); }
  playSfxDrumroll(): void { playSfxDrumroll(); }
  playSfxFanfare(): void { playSfxFanfare(); }
  playSfxAchievement(): void { playSfxAchievement(); }
  playSfxStart(): void { playSfxStart(); }
  playSfxResult(): void { playSfxResult(); }
}
