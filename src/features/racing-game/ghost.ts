// ゴーストシステム（記録・再生・保存）

import type { Player, GhostFrame, GhostData } from './types';
import { Utils } from './utils';

// === T-106: ゴースト記録モジュール ===

/** ゴーストレコーダーの型 */
export interface GhostRecorder {
  frames: GhostFrame[];
  frameCount: number;
  recording: boolean;
}

/** 記録インスタンス生成 */
export const createGhostRecorder = (): GhostRecorder => ({
  frames: [],
  frameCount: 0,
  recording: true,
});

/** フレーム記録（3フレームに1回） */
export const recordFrame = (
  recorder: GhostRecorder,
  player: Player,
  time: number
): GhostRecorder => {
  if (!recorder.recording) return recorder;

  const newCount = recorder.frameCount + 1;

  // 3フレームに1回記録
  if (newCount % 3 !== 0) {
    return { ...recorder, frameCount: newCount };
  }

  const frame: GhostFrame = {
    x: player.x,
    y: player.y,
    angle: player.angle,
    speed: player.speed,
    lap: player.lap,
    t: time,
  };

  return {
    frames: [...recorder.frames, frame],
    frameCount: newCount,
    recording: true,
  };
};

/** 記録の一時停止（draft状態中） */
export const pauseRecording = (recorder: GhostRecorder): GhostRecorder => ({
  ...recorder,
  recording: false,
});

/** 記録の再開 */
export const resumeRecording = (recorder: GhostRecorder): GhostRecorder => ({
  ...recorder,
  recording: true,
});

/** 記録完了・GhostData 生成（空フレームの場合は null を返却） */
export const finalizeRecording = (
  recorder: GhostRecorder,
  courseIndex: number,
  laps: number,
  playerName: string
): GhostData | null => {
  const frames = recorder.frames;
  if (frames.length === 0) return null;

  const totalTime = frames[frames.length - 1].t;

  return {
    frames,
    totalTime,
    course: courseIndex,
    laps,
    date: new Date().toISOString(),
    playerName,
  };
};

// === T-107: ゴースト再生・補間 ===

/** ゴーストプレイヤーの型 */
export interface GhostPlayer {
  data: GhostData;
  currentIndex: number;
}

/** 再生インスタンス生成 */
export const createGhostPlayer = (data: GhostData): GhostPlayer => ({
  data,
  currentIndex: 0,
});

/** 補間付き位置取得（二分探索） */
export const getGhostPosition = (
  player: GhostPlayer,
  time: number
): GhostFrame | null => {
  const { frames } = player.data;
  if (frames.length === 0) return null;

  // データ範囲外
  if (time <= frames[0].t) return frames[0];
  if (time >= frames[frames.length - 1].t) return frames[frames.length - 1];

  // 二分探索で前後のフレームを見つける
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (frames[mid].t <= time) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const f1 = frames[lo];
  const f2 = frames[hi];
  const dt = f2.t - f1.t;
  if (dt === 0) return f1;

  // 線形補間
  const ratio = (time - f1.t) / dt;
  return {
    x: f1.x + (f2.x - f1.x) * ratio,
    y: f1.y + (f2.y - f1.y) * ratio,
    angle: Utils.normalizeAngle(f1.angle + Utils.normalizeAngle(f2.angle - f1.angle) * ratio),
    speed: f1.speed + (f2.speed - f1.speed) * ratio,
    lap: f1.lap,
    t: time,
  };
};

// === T-108: ゴースト保存・読込（localStorage） ===

/** localStorage キー生成（全モード共有） */
const ghostKey = (courseIndex: number): string =>
  `ghost_${courseIndex}`;

/** localStorage への保存 */
export const saveGhost = (data: GhostData): boolean => {
  try {
    const key = ghostKey(data.course);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    // localStorage 容量超過時のエラーハンドリング
    return false;
  }
};

/** localStorage からの読込（旧キーのフォールバック付き） */
export const loadGhost = (courseIndex: number): GhostData | null => {
  try {
    // 新キーで検索
    const key = ghostKey(courseIndex);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as GhostData;

    // 旧キーのフォールバック（_cpu, _2p）
    for (const oldMode of ['cpu', '2p']) {
      const oldRaw = localStorage.getItem(`ghost_${courseIndex}_${oldMode}`);
      if (oldRaw) return JSON.parse(oldRaw) as GhostData;
    }
    return null;
  } catch {
    return null;
  }
};

/** ベスト更新判定 */
export const shouldUpdateGhost = (
  newData: GhostData,
  existingData: GhostData | null
): boolean => {
  if (!existingData) return true;
  return newData.totalTime < existingData.totalTime;
};

export const Ghost = {
  createRecorder: createGhostRecorder,
  recordFrame,
  pauseRecording,
  resumeRecording,
  finalizeRecording,
  createPlayer: createGhostPlayer,
  getPosition: getGhostPosition,
  save: saveGhost,
  load: loadGhost,
  shouldUpdate: shouldUpdateGhost,
};
