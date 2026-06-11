/**
 * AudioActions インターフェース + ファクトリ
 *
 * 後方互換用。
 * 新規コードは infrastructure/audio/ を直接使用してください。
 */
import {
  initAudio,
  playBgm,
  stopBgm,
  playSfxCorrect,
  playSfxIncorrect,
  playSfxTick,
  playSfxStart,
  playSfxResult,
  playSfxCombo,
} from './sound';

export interface AudioActions {
  onCorrectAnswer: () => void;
  onIncorrectAnswer: () => void;
  onTick: () => void;
  onCombo: () => void;
  onStart: () => void;
  onResult: () => void;
  onBgmStart: () => void;
  onBgmStop: () => void;
  onInit: () => void;
}

/** デフォルトの音声アクション（実際の音声を再生） */
export function createDefaultAudioActions(): AudioActions {
  return {
    onCorrectAnswer: playSfxCorrect,
    onIncorrectAnswer: playSfxIncorrect,
    onTick: playSfxTick,
    onCombo: playSfxCombo,
    onStart: playSfxStart,
    onResult: playSfxResult,
    onBgmStart: playBgm,
    onBgmStop: stopBgm,
    onInit: initAudio,
  };
}

/** テスト用の無音アクション */
export function createSilentAudioActions(): AudioActions {
  return {
    onCorrectAnswer: () => {},
    onIncorrectAnswer: () => {},
    onTick: () => {},
    onCombo: () => {},
    onStart: () => {},
    onResult: () => {},
    onBgmStart: () => {},
    onBgmStop: () => {},
    onInit: () => {},
  };
}
