import {
  PLAINS_MAP,
  isHighGround,
  isSlowCell,
  coveredPathCells,
  entranceCell,
  fortressCell,
  pathDirectionAt,
  remainingPathCells,
  laneOf,
  allPathCells,
  isPathCell,
  offPathCells,
} from './stage-map';

describe('stage-map 地形述語', () => {
  it('高台セルは isHighGround が真になる', () => {
    expect(isHighGround(PLAINS_MAP, { x: 2, y: 3 })).toBe(true);
    expect(isHighGround(PLAINS_MAP, { x: 6, y: 3 })).toBe(true);
  });

  it('高台でないスロットは isHighGround が偽になる', () => {
    expect(isHighGround(PLAINS_MAP, { x: 1, y: 1 })).toBe(false);
  });

  it('滞留セルは isSlowCell が真になる', () => {
    expect(isSlowCell(PLAINS_MAP, { x: 4, y: 5 })).toBe(true);
  });

  it('滞留でない経路セルは isSlowCell が偽になる', () => {
    expect(isSlowCell(PLAINS_MAP, { x: 0, y: 2 })).toBe(false);
  });
});

describe('coveredPathCells', () => {
  it('射程内の経路セルだけを返す', () => {
    // (2,1) から range 1.6: (2,2)=1.0, (1,2)=1.41, (3,2)=1.41 は含む。
    // (4,2)=2.24 は含まない。
    const covered = coveredPathCells(PLAINS_MAP, { x: 2, y: 1 }, 1.6);
    const has = (x: number, y: number) =>
      covered.some((c) => c.x === x && c.y === y);
    expect(has(2, 2)).toBe(true);
    expect(has(3, 2)).toBe(true);
    expect(has(4, 2)).toBe(false);
  });

  it('射程0ならどの経路セルも覆わない', () => {
    expect(coveredPathCells(PLAINS_MAP, { x: 2, y: 1 }, 0)).toEqual([]);
  });
});

describe('入口と砦', () => {
  it('入口は経路の始端を返す', () => {
    expect(entranceCell(PLAINS_MAP, 0)).toEqual({ x: 0, y: 2 });
  });

  it('砦は経路の終端を返す', () => {
    expect(fortressCell(PLAINS_MAP)).toEqual({ x: 8, y: 3 });
  });

  it('経路が空なら入口も砦も undefined を返す', () => {
    const emptyMap = { ...PLAINS_MAP, lanes: [] };
    expect(entranceCell(emptyMap, 0)).toBeUndefined();
    expect(fortressCell(emptyMap)).toBeUndefined();
  });
});

describe('pathDirectionAt', () => {
  const northLane = laneOf(PLAINS_MAP, 0);
  const southLane = laneOf(PLAINS_MAP, 1);

  it('横に進む経路セルは right を返す', () => {
    // (0,2) → (1,2)
    expect(pathDirectionAt(northLane, { x: 0, y: 2 })).toBe('right');
  });

  it('上に折れる経路セルは up を返す', () => {
    // 南レーン (6,5) → (6,4)
    expect(pathDirectionAt(southLane, { x: 6, y: 5 })).toBe('up');
  });

  it('終端セルは進行方向を持たない', () => {
    expect(pathDirectionAt(northLane, { x: 8, y: 3 })).toBeUndefined();
  });

  it('経路外のセルは undefined を返す', () => {
    expect(pathDirectionAt(northLane, { x: 0, y: 0 })).toBeUndefined();
  });
});

describe('remainingPathCells', () => {
  const lane = laneOf(PLAINS_MAP, 0);

  it('入口にいる敵は経路長-1 の残りセル数を持つ', () => {
    // 北レーンは10セルなので入口からは残り9
    expect(remainingPathCells(lane, { x: 0, y: 2 })).toBe(9);
  });

  it('砦に到達した敵は残り0になる', () => {
    expect(remainingPathCells(lane, { x: 8, y: 3 })).toBe(0);
  });

  it('セル間の補間座標でも最も近い経路セルから概算する', () => {
    // (1.4, 2) は経路セル (1,2)（index 1）に最も近い → 残り8
    expect(remainingPathCells(lane, { x: 1.4, y: 2 })).toBe(8);
  });

  it('経路が空なら0を返す', () => {
    expect(remainingPathCells([], { x: 0, y: 0 })).toBe(0);
  });
});

describe('レーン構造', () => {
  it('lanes は1本以上のレーンを持ち、laneOf でセル列を取得できる', () => {
    expect(PLAINS_MAP.lanes.length).toBeGreaterThanOrEqual(1);
    expect(laneOf(PLAINS_MAP, 0).length).toBeGreaterThan(0);
  });

  it('allPathCells は全レーンのセルを重複なく返す', () => {
    const cells = allPathCells(PLAINS_MAP);
    const keys = cells.map((c) => `${c.x},${c.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('isPathCell は経路セルにだけ true を返す', () => {
    const first = laneOf(PLAINS_MAP, 0)[0];
    expect(first).toBeDefined();
    expect(isPathCell(PLAINS_MAP, first!)).toBe(true);
    expect(isPathCell(PLAINS_MAP, { x: 0, y: 0 })).toBe(false);
  });

  it('fortressCell は全レーンで共通の終端セルを返す', () => {
    const fortress = fortressCell(PLAINS_MAP);
    expect(fortress).toBeDefined();
    PLAINS_MAP.lanes.forEach((lane) => {
      expect(lane[lane.length - 1]).toEqual(fortress);
    });
  });
});

describe('2レーンの平原', () => {
  it('レーンが2本ある', () => {
    expect(PLAINS_MAP.lanes).toHaveLength(2);
  });

  it('砦セル以外を共有しない（共有セルがあると壁1枚で両方塞げてしまう）', () => {
    const [north, south] = PLAINS_MAP.lanes;
    expect(north).toBeDefined();
    expect(south).toBeDefined();
    const fortress = fortressCell(PLAINS_MAP);
    const southKeys = new Set(south!.map((c) => `${c.x},${c.y}`));
    const shared = north!.filter((c) => southKeys.has(`${c.x},${c.y}`));
    expect(shared).toEqual([fortress]);
  });

  it('2レーンは非対称である（対称だと半分ずつが自明解になる）', () => {
    const [north, south] = PLAINS_MAP.lanes;
    expect(north!.length).not.toBe(south!.length);
  });

  it('経路外に、両レーンへ射程1.5で届くセルが存在する', () => {
    const [north, south] = PLAINS_MAP.lanes;
    const reaches = (cell: { x: number; y: number }, lane: readonly { x: number; y: number }[]) =>
      lane.some((c) => Math.hypot(c.x - cell.x, c.y - cell.y) <= 1.5);
    const both = offPathCells(PLAINS_MAP).filter(
      (c) => reaches(c, north!) && reaches(c, south!)
    );
    expect(both.length).toBeGreaterThan(0);
  });

  it('各レーンは隣接セルの連結列である', () => {
    PLAINS_MAP.lanes.forEach((lane) => {
      lane.slice(1).forEach((cell, i) => {
        const prev = lane[i]!;
        expect(Math.abs(cell.x - prev.x) + Math.abs(cell.y - prev.y)).toBe(1);
      });
    });
  });

  it('全レーンのセルが盤面の内側にある', () => {
    allPathCells(PLAINS_MAP).forEach((c) => {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThan(PLAINS_MAP.width);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThan(PLAINS_MAP.height);
    });
  });
});
