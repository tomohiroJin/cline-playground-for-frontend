import { createSegments, createSegTexts } from './segment-helpers';
import { LANES, ROWS } from '../constants';

describe('createSegments', () => {
  it('避難所なしの場合、全セグメントが null になる', () => {
    const segs = createSegments([]);

    expect(segs).toHaveLength(LANES.length);
    segs.forEach((lane) => {
      expect(lane).toHaveLength(ROWS);
      lane.forEach((seg) => {
        expect(seg).toBeNull();
      });
    });
  });

  it('避難所レーンのセグメントが shield になる', () => {
    const shelterLanes = [0, 2];
    const segs = createSegments(shelterLanes);

    // レーン0: 避難所 → shield
    segs[0].forEach((seg) => {
      expect(seg).toBe('shield');
    });
    // レーン1: 通常 → null
    segs[1].forEach((seg) => {
      expect(seg).toBeNull();
    });
    // レーン2: 避難所 → shield
    segs[2].forEach((seg) => {
      expect(seg).toBe('shield');
    });
  });

  it('毎回新しい配列インスタンスを返す', () => {
    const a = createSegments([]);
    const b = createSegments([]);

    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});

describe('createSegTexts', () => {
  it('避難所なしの場合、全テキストが ╳ になる', () => {
    const texts = createSegTexts([]);

    expect(texts).toHaveLength(LANES.length);
    texts.forEach((lane) => {
      expect(lane).toHaveLength(ROWS);
      lane.forEach((text) => {
        expect(text).toBe('╳');
      });
    });
  });

  it('避難所レーンのテキストが ─ になる', () => {
    const shelterLanes = [1];
    const texts = createSegTexts(shelterLanes);

    // レーン0: 通常 → ╳
    texts[0].forEach((text) => {
      expect(text).toBe('╳');
    });
    // レーン1: 避難所 → ─
    texts[1].forEach((text) => {
      expect(text).toBe('─');
    });
    // レーン2: 通常 → ╳
    texts[2].forEach((text) => {
      expect(text).toBe('╳');
    });
  });

  it('毎回新しい配列インスタンスを返す', () => {
    const a = createSegTexts([]);
    const b = createSegTexts([]);

    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});
