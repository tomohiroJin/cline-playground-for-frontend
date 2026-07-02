/**
 * 視覚位置トラッカーのテスト
 */
import {
  VisualPositionTracker,
  MOVE_TWEEN_MS,
  SNAP_DISTANCE_TILES,
  easeOutQuad,
} from './visualPosition';

describe('easeOutQuad', () => {
  it('0 で 0、1 で 1 を返す', () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
  });

  it('中間点では線形より進んでいる（減速カーブ）', () => {
    expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
  });

  it('範囲外はクランプする', () => {
    expect(easeOutQuad(-1)).toBe(0);
    expect(easeOutQuad(2)).toBe(1);
  });
});

describe('VisualPositionTracker', () => {
  it('初回登録はスナップ（補間しない）', () => {
    const tracker = new VisualPositionTracker();
    const pos = tracker.resolve('player', { x: 5, y: 3 }, 1000);
    expect(pos).toEqual({ x: 5, y: 3 });
  });

  it('論理位置が1タイル動くと補間途中の位置を返す', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    // 移動発生
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    // 半分経過時点: 5 と 6 の間（ease-out なので 0.5 より先）
    const mid = tracker.resolve('player', { x: 6, y: 3 }, 1100 + MOVE_TWEEN_MS / 2);
    expect(mid.x).toBeGreaterThan(5.5);
    expect(mid.x).toBeLessThan(6);
    expect(mid.y).toBe(3);
  });

  it('補間時間経過後は目標位置に到達する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    const done = tracker.resolve('player', { x: 6, y: 3 }, 1100 + MOVE_TWEEN_MS);
    expect(done).toEqual({ x: 6, y: 3 });
  });

  it('補間中に次の移動が来たら現在の視覚位置から新目標へ補間する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    // 半分だけ進んだ時点で次の移動
    const halfway = tracker.resolve('player', { x: 6, y: 3 }, 1100 + MOVE_TWEEN_MS / 2);
    tracker.resolve('player', { x: 7, y: 3 }, 1100 + MOVE_TWEEN_MS / 2);
    // 直後の視覚位置は halfway 近傍（巻き戻らない）
    const justAfter = tracker.resolve('player', { x: 7, y: 3 }, 1101 + MOVE_TWEEN_MS / 2);
    expect(justAfter.x).toBeGreaterThanOrEqual(halfway.x);
    expect(justAfter.x).toBeLessThan(7);
  });

  it('SNAP_DISTANCE_TILES を超える跳躍は補間せず即スナップする', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    // テレポート（距離 > 1.5）
    const warped = tracker.resolve('player', { x: 10, y: 8 }, 1100);
    expect(warped).toEqual({ x: 10, y: 8 });
    expect(SNAP_DISTANCE_TILES).toBe(1.5);
  });

  it('エンティティごとに独立して追跡する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('enemy-a', { x: 1, y: 1 }, 1000);
    tracker.resolve('player', { x: 6, y: 3 }, 1100);
    const enemyPos = tracker.resolve('enemy-a', { x: 1, y: 1 }, 1100);
    expect(enemyPos).toEqual({ x: 1, y: 1 });
  });

  it('prune で消えたエンティティのエントリを掃除する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.resolve('enemy-a', { x: 1, y: 1 }, 1000);
    tracker.prune(new Set(['player']));
    expect(tracker.size()).toBe(1);
  });

  it('clear で全エントリを破棄する', () => {
    const tracker = new VisualPositionTracker();
    tracker.resolve('player', { x: 5, y: 3 }, 1000);
    tracker.clear();
    expect(tracker.size()).toBe(0);
  });
});
