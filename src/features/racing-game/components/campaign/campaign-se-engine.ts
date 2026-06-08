// キャンペーン用 SE トーンエンジン（spec §7.2.1 / S5）
//
// Web Audio API（OscillatorNode + ホワイトノイズ Buffer）で 7 種の SE を生成。
// ファイルレスでペイロード増加なし。

export type CampaignSeName =
  | 'info'           // ステージ選択時の確認音
  | 'warn-tick'      // TIME 残 10 秒以下の毎秒警告
  | 'bonus'          // チェックポイント時間延長
  | 'denied'         // ロックステージクリック
  | 'clear-fanfare'  // ステージクリア
  | 'game-over'      // 残機 0
  | 'lives-warn';    // 残機 1 になった瞬間

interface SeSpec {
  readonly type: 'tone' | 'noise' | 'sweep' | 'arpeggio';
  readonly freqHz?: number;
  /** sweep のみ。freqHz より大きい値 = 上昇スイープ、小さい値 = 下降スイープ */
  readonly freqEndHz?: number;
  readonly durationSec: number;
  readonly volumeDb: number;
}

const SE_TABLE: Record<CampaignSeName, SeSpec> = {
  info: { type: 'tone', freqHz: 800, durationSec: 0.05, volumeDb: -12 },
  'warn-tick': { type: 'tone', freqHz: 1200, durationSec: 0.1, volumeDb: -10 },
  bonus: { type: 'sweep', freqHz: 1500, freqEndHz: 1800, durationSec: 0.2, volumeDb: -8 },
  denied: { type: 'noise', durationSec: 0.05, volumeDb: -10 },
  'clear-fanfare': { type: 'arpeggio', durationSec: 2.0, volumeDb: -6 },
  // game-over は下降スイープとして表現（DRY: descending を sweep に統合）
  'game-over': { type: 'sweep', freqHz: 880, freqEndHz: 220, durationSec: 1.5, volumeDb: -8 },
  'lives-warn': { type: 'tone', freqHz: 600, durationSec: 0.6, volumeDb: -10 },
};

const dbToGain = (db: number): number => Math.pow(10, db / 20);

export interface CampaignSeEngine {
  play(name: CampaignSeName): void;
  setMasterVolume(value: number): void;
  cleanup(): void;
}

/**
 * 安全なエンジン作成。AudioContext が利用不可（テスト環境等）でも例外を出さず
 * no-op を返す。
 */
export const createCampaignSeEngine = (): CampaignSeEngine => {
  const AudioCtx =
    typeof window !== 'undefined'
      ? (window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;

  if (!AudioCtx) {
    return {
      play: () => {},
      setMasterVolume: () => {},
      cleanup: () => {},
    };
  }

  let ctx: AudioContext | null = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);

  const ensureContext = (): AudioContext | null => {
    if (!ctx) return null;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  };

  const playTone = (freq: number, durationSec: number, gain: number): void => {
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, c.currentTime);
    env.gain.linearRampToValueAtTime(gain, c.currentTime + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationSec);
    osc.connect(env);
    env.connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + durationSec);
  };

  const playSweep = (
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    gain: number,
  ): void => {
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freqStart, c.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + durationSec);
    env.gain.setValueAtTime(gain, c.currentTime);
    env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationSec);
    osc.connect(env);
    env.connect(masterGain);
    osc.start();
    osc.stop(c.currentTime + durationSec);
  };

  const playNoise = (durationSec: number, gain: number): void => {
    const c = ensureContext();
    if (!c) return;
    const bufferSize = Math.floor(c.sampleRate * durationSec);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const env = c.createGain();
    env.gain.value = gain;
    src.connect(env);
    env.connect(masterGain);
    src.start();
  };

  const playArpeggio = (durationSec: number, gain: number): void => {
    const c = ensureContext();
    if (!c) return;
    // ステージクリア音: C5, E5, G5, C6, E6 のアルペジオ
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const stepDur = durationSec / notes.length;
    notes.forEach((f, i) => {
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      const startTime = c.currentTime + i * stepDur;
      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(gain, startTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + stepDur);
      osc.connect(env);
      env.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + stepDur);
    });
  };

  const play = (name: CampaignSeName): void => {
    const spec = SE_TABLE[name];
    const gain = dbToGain(spec.volumeDb);

    switch (spec.type) {
      case 'tone':
        playTone(spec.freqHz!, spec.durationSec, gain);
        break;
      case 'sweep':
        playSweep(spec.freqHz!, spec.freqEndHz!, spec.durationSec, gain);
        break;
      case 'noise':
        playNoise(spec.durationSec, gain);
        break;
      case 'arpeggio':
        playArpeggio(spec.durationSec, gain);
        break;
    }
  };

  const setMasterVolume = (value: number): void => {
    masterGain.gain.value = Math.max(0, Math.min(1, value));
  };

  const cleanup = (): void => {
    if (ctx) {
      void ctx.close();
      ctx = null;
    }
  };

  return { play, setMasterVolume, cleanup };
};
