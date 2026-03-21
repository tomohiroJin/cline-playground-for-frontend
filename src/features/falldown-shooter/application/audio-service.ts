// AudioService インターフェース — 音声再生の抽象化

/** ゲーム音声サービスのインターフェース */
export interface IAudioService {
  shoot(): void;
  hit(): void;
  land(): void;
  line(): void;
  power(): void;
  bomb(): void;
  over(): void;
  win(): void;
  skill(): void;
  charge(): void;
}

/** Null Object パターン — サウンド無効時のアダプター */
export const NullAudioAdapter: IAudioService = {
  shoot: () => {},
  hit: () => {},
  land: () => {},
  line: () => {},
  power: () => {},
  bomb: () => {},
  over: () => {},
  win: () => {},
  skill: () => {},
  charge: () => {},
};
