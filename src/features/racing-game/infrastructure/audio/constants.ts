// オーディオ定数（インフラストラクチャ層）

export const AUDIO = Object.freeze({
  defaultVolume: 0.5 as number,
  minVolume: 0 as number,
  maxVolume: 1 as number,
  freq: {
    collision: [200, 150],
    wall: [100, 80],
    lap: [523, 659, 784],
    finalLap: [784, 988, 1175],
    countdown: [440],
    go: [880, 1760],
    finish: [523, 659, 784, 1047],
    engine: [80, 100],
    checkpoint: [660, 880],
  },
});
