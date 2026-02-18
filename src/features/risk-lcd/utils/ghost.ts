// ゴーストデータの記録・圧縮・展開

import type { LaneIndex } from '../types';

/**
 * ランレングス圧縮
 * 各ペア (lane, count) を1バイトにパック: 上位2bit=lane, 下位6bit=count
 */
function rleEncode(log: number[]): Uint8Array {
  if (log.length === 0) return new Uint8Array(0);

  const pairs: [number, number][] = [];
  let cur = log[0];
  let cnt = 1;

  for (let i = 1; i < log.length; i++) {
    if (log[i] === cur && cnt < 63) {
      cnt++;
    } else {
      pairs.push([cur, cnt]);
      cur = log[i];
      cnt = 1;
    }
  }
  pairs.push([cur, cnt]);

  const bytes = new Uint8Array(pairs.length);
  for (let i = 0; i < pairs.length; i++) {
    bytes[i] = ((pairs[i][0] & 0x3) << 6) | (pairs[i][1] & 0x3f);
  }
  return bytes;
}

/**
 * ランレングス展開
 */
function rleDecode(data: Uint8Array): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const lane = (data[i] >> 6) & 0x3;
    const count = data[i] & 0x3f;
    for (let j = 0; j < count; j++) {
      result.push(lane);
    }
  }
  return result;
}

/**
 * Base64url エンコード（パディングなし）
 */
function toBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64url デコード
 */
function fromBase64url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * ゴーストデータ記録クラス
 */
export class GhostRecorder {
  private log: number[] = [];

  /** サイクルのレーン位置を記録 */
  record(lane: LaneIndex): void {
    this.log.push(lane);
  }

  /** 圧縮文字列を生成 */
  compress(): string {
    if (this.log.length === 0) return '';
    const encoded = rleEncode(this.log);
    return toBase64url(encoded);
  }

  /** ログをリセット */
  reset(): void {
    this.log = [];
  }
}

/**
 * ゴーストデータ再生クラス
 */
export class GhostPlayer {
  private positions: number[];

  constructor(compressed: string) {
    if (!compressed) {
      this.positions = [];
      return;
    }
    try {
      const bytes = fromBase64url(compressed);
      this.positions = rleDecode(bytes);
    } catch {
      this.positions = [];
    }
  }

  /** 指定 tick（0-indexed）のレーン位置を取得 */
  getPosition(tick: number): LaneIndex {
    if (this.positions.length === 0) return 1 as LaneIndex;
    const idx = Math.min(tick, this.positions.length - 1);
    return this.positions[Math.max(0, idx)] as LaneIndex;
  }

  /** 総 tick 数 */
  get length(): number {
    return this.positions.length;
  }
}
