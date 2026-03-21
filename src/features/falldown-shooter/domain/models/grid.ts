// Grid 値オブジェクト — ゲーム盤面のセル状態を管理する不変オブジェクト

/** Grid 値オブジェクト */
export class GridModel {
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<ReadonlyArray<string | null>>;

  private constructor(cells: ReadonlyArray<ReadonlyArray<string | null>>) {
    this.height = cells.length;
    this.width = cells.length > 0 ? cells[0].length : 0;
    this.cells = cells;
  }

  /** 空のグリッドを作成する */
  static create(width: number, height: number): GridModel {
    const cells = Array.from({ length: height }, () =>
      Array<string | null>(width).fill(null)
    );
    return new GridModel(cells);
  }

  /** 2次元配列から GridModel を生成する */
  static fromRawGrid(raw: (string | null)[][]): GridModel {
    const cells = raw.map(row => [...row]);
    return new GridModel(cells);
  }

  /** 指定座標のセル値を返す（範囲外は undefined） */
  getCell(x: number, y: number): string | null | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined;
    }
    return this.cells[y][x];
  }

  /** 指定行が全セル埋まっているか判定する */
  isRowFull(y: number): boolean {
    if (y < 0 || y >= this.height) return false;
    return this.cells[y].every(c => c !== null);
  }

  /** セルが存在する最も上の行を返す（空なら height を返す） */
  findHighestRow(): number {
    const idx = this.cells.findIndex(row => row.some(c => c !== null));
    return idx < 0 ? this.height : idx;
  }

  /** グリッドが空かどうか判定する */
  isEmpty(): boolean {
    return this.cells.every(row => row.every(c => c === null));
  }

  /** 指定座標にセルを設定し、新しいインスタンスを返す */
  setCell(x: number, y: number, value: string | null): GridModel {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return this;
    }
    const newCells = this.cells.map(row => [...row]);
    newCells[y][x] = value;
    return new GridModel(newCells);
  }

  /** 指定行を消去して上に空行を追加し、新しいインスタンスを返す */
  clearRow(y: number): GridModel {
    const newCells = this.cells.map(row => [...row]);
    newCells.splice(y, 1);
    newCells.unshift(Array<string | null>(this.width).fill(null));
    return new GridModel(newCells);
  }

  /** 全て埋まった行を消去し、消去数とともに新しいインスタンスを返す */
  clearFullLines(): { grid: GridModel; clearedCount: number } {
    const remaining = this.cells.filter(row => !row.every(c => c !== null));
    const clearedCount = this.height - remaining.length;
    const empty = Array.from({ length: clearedCount }, () =>
      Array<string | null>(this.width).fill(null)
    );
    const newCells = [...empty, ...remaining.map(row => [...row])];
    return { grid: new GridModel(newCells), clearedCount };
  }

  /** 指定列のセルを消去し、消去数とともに新しいインスタンスを返す */
  clearColumn(colX: number): { grid: GridModel; clearedCount: number } {
    const newCells = this.cells.map(row => [...row]);
    let clearedCount = 0;
    for (let y = 0; y < this.height; y++) {
      if (newCells[y][colX] !== null) {
        newCells[y][colX] = null;
        clearedCount++;
      }
    }
    return { grid: new GridModel(newCells), clearedCount };
  }

  /** 旧コードとの互換性のため、ミュータブルな2次元配列に変換する */
  toRawGrid(): (string | null)[][] {
    return this.cells.map(row => [...row]);
  }
}
