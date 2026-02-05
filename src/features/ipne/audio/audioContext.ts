/**
 * IPNE AudioContext管理モジュール
 *
 * Web Audio APIのAudioContextを管理し、iOS等の自動再生制限に対応
 */

/** Safari対応のWindow型 */
type WebkitWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

/** AudioContext取得用コンストラクタ */
const getAudioContextConstructor = (): typeof AudioContext | undefined => {
  const w = window as WebkitWindow;
  return w.AudioContext ?? w.webkitAudioContext;
};

/** 共有AudioContextインスタンス */
let audioContext: AudioContext | undefined;

/** 音声が有効化されているかどうか */
let isAudioEnabled = false;

/**
 * AudioContextを取得する
 * @returns AudioContextインスタンス、またはundefined
 */
export function getAudioContext(): AudioContext | undefined {
  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) return undefined;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

/**
 * 音声を有効化する（ユーザー操作後に呼び出す）
 * iOSの自動再生制限に対応するため、タップ等のユーザー操作後に呼び出す必要がある
 * @returns 成功した場合true
 */
export async function enableAudio(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    // suspended状態の場合はresumeする
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    isAudioEnabled = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * 音声が有効化されているかどうかを取得する
 * @returns 有効化されている場合true
 */
export function isAudioInitialized(): boolean {
  return isAudioEnabled && audioContext !== undefined && audioContext.state === 'running';
}

/**
 * AudioContextの状態をリセットする（主にテスト用）
 */
export function resetAudioContext(): void {
  if (audioContext) {
    audioContext.close();
    audioContext = undefined;
  }
  isAudioEnabled = false;
}
