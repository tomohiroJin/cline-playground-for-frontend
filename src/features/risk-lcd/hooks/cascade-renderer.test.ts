import { renderCascadeFrame, renderFinalFrame } from './cascade-renderer';
import { ROWS } from '../constants';

describe('renderCascadeFrame', () => {
  // ヘルパー: bf 計算関数のモック
  const calcBf = (_l: number) => 3; // 全レーン bf=3

  it('bf 以降の行に障害物セグメントを配置する', () => {
    const result = renderCascadeFrame({
      row: 5,
      obstacles: [1],
      fakeIdx: -1,
      calcBf,
      shelterLanes: [],
    });

    // row=5, bf=3 → row >= bf なので segs[1][5] に 'warn' が入る
    expect(result.segs[1][5]).toBe('warn');
    // bf=3 から row=5 の手前(3,4)は 'danger'
    expect(result.segs[1][3]).toBe('danger');
    expect(result.segs[1][4]).toBe('danger');
  });

  it('bf より前の行は影響なし', () => {
    const result = renderCascadeFrame({
      row: 2,
      obstacles: [1],
      fakeIdx: -1,
      calcBf: () => 3,
      shelterLanes: [],
    });

    // row=2 < bf=3 → 何も配置されない
    expect(result.segs[1][2]).toBeNull();
  });

  it('フェイク障害物が SAFE? で表示される', () => {
    const result = renderCascadeFrame({
      row: 4,
      obstacles: [1],
      fakeIdx: 1,
      calcBf,
      shelterLanes: [],
    });

    // row=4 < ROWS-2=6 かつ l===fakeIdx → fake
    expect(result.segs[1][4]).toBe('fake');
    expect(result.texts[1][4]).toBe('SAFE?');
  });

  it('避難所レーンの障害物は shieldWarn で表示される', () => {
    const result = renderCascadeFrame({
      row: 5,
      obstacles: [0],
      fakeIdx: -1,
      calcBf,
      shelterLanes: [0],
    });

    expect(result.segs[0][5]).toBe('shieldWarn');
  });

  it('接近時（ROWS-3 以降）に危険レーンを返す', () => {
    const result = renderCascadeFrame({
      row: ROWS - 2,
      obstacles: [1],
      fakeIdx: -1,
      calcBf,
      shelterLanes: [],
    });

    expect(result.dangerLanes).toContain(1);
  });
});

describe('renderFinalFrame', () => {
  it('障害物レーンが全行 danger になる', () => {
    const result = renderFinalFrame({
      obstacles: [1],
      shelterLanes: [],
      restrictedLanes: [],
    });

    for (let r = 0; r < ROWS - 1; r++) {
      expect(result.segs[1][r]).toBe('danger');
    }
    // 最終行は impact
    expect(result.segs[1][ROWS - 1]).toBe('impact');
  });

  it('安全レーンに SAFE 表示が入る', () => {
    const result = renderFinalFrame({
      obstacles: [1],
      shelterLanes: [],
      restrictedLanes: [],
    });

    const mid = Math.floor(ROWS / 2);
    // レーン0とレーン2は安全
    expect(result.segs[0][mid]).toBe('safe');
    expect(result.texts[0][mid]).toBe('─SAFE─');
    expect(result.segs[2][mid]).toBe('safe');
  });

  it('避難所レーンに SHELTER 表示が入る', () => {
    const result = renderFinalFrame({
      obstacles: [1],
      shelterLanes: [0],
      restrictedLanes: [],
    });

    const mid = Math.floor(ROWS / 2);
    expect(result.segs[0][mid]).toBe('safe');
    expect(result.texts[0][mid]).toBe('SHELTER');
  });

  it('制限レーンには SAFE 表示が入らない', () => {
    const result = renderFinalFrame({
      obstacles: [1],
      shelterLanes: [],
      restrictedLanes: [0],
    });

    const mid = Math.floor(ROWS / 2);
    // レーン0 は制限 → safe にならない
    expect(result.segs[0][mid]).not.toBe('safe');
  });
});
