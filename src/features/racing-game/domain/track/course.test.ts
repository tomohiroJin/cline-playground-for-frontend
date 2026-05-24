// COURSES データの不変条件テスト。
//
// 新規コース追加時にレイアウトの破綻（コースが閉じない、CP が範囲外、
// 座標がキャンバス外）を検出する。全コースに対して forEach で適用するため、
// 今後コースを追加しても自動的に検証対象になる。

import { COURSES } from './course';
import { CANVAS } from '../../infrastructure/renderer/constants';

/** 始点と終点が「閉ループ」とみなせる最大距離（px） */
const CLOSED_LOOP_MAX_GAP = 200;
/** コースを成立させる最低点数 */
const MIN_POINTS = 12;

const dist = (a: [number, number], b: [number, number]): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('COURSES の不変条件', () => {
  it('8 コース定義されている', () => {
    expect(COURSES).toHaveLength(8);
  });

  COURSES.forEach((course, idx) => {
    describe(`コース[${idx}] ${course.name}`, () => {
      it(`点数が ${MIN_POINTS} 以上`, () => {
        expect(course.pts.length).toBeGreaterThanOrEqual(MIN_POINTS);
      });

      it('始点と終点が近接し閉ループを成す', () => {
        const first = course.pts[0];
        const last = course.pts[course.pts.length - 1];
        expect(dist(first, last)).toBeLessThanOrEqual(CLOSED_LOOP_MAX_GAP);
      });

      it('全座標がキャンバス範囲内（0..WIDTH / 0..HEIGHT）', () => {
        course.pts.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(CANVAS.WIDTH);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(CANVAS.HEIGHT);
        });
      });

      it('checkpoints は pts のインデックス範囲内で重複なし、かつ index 0 を含む', () => {
        const { checkpoints, pts } = course;
        expect(checkpoints).toContain(0);
        expect(new Set(checkpoints).size).toBe(checkpoints.length);
        checkpoints.forEach((cpIdx) => {
          expect(cpIdx).toBeGreaterThanOrEqual(0);
          expect(cpIdx).toBeLessThan(pts.length);
        });
      });

      it('points / checkpointCoords が pts から正しく導出されている', () => {
        expect(course.points).toHaveLength(course.pts.length);
        expect(course.checkpointCoords).toHaveLength(course.checkpoints.length);
        course.checkpointCoords.forEach((cp, i) => {
          const srcIdx = course.checkpoints[i];
          expect(cp.x).toBe(course.pts[srcIdx][0]);
          expect(cp.y).toBe(course.pts[srcIdx][1]);
        });
      });
    });
  });
});
