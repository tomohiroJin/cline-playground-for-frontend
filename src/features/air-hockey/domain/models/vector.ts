/**
 * 2D ベクトル値オブジェクト（不変）
 * - すべての演算は新しい Vector を返す
 * - 等値比較は値ベース
 */
export class Vector {
  readonly x: number;
  readonly y: number;

  private constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  /** 指定座標で Vector を生成する */
  static create(x: number, y: number): Vector {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Vector の座標は有限数である必要があります: (${x}, ${y})`);
    }
    return new Vector(x, y);
  }

  /** ゼロベクトルを生成する */
  static zero(): Vector {
    return new Vector(0, 0);
  }

  /** ベクトルを加算する */
  add(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  /** ベクトルを減算する */
  subtract(other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  /** スカラー倍する */
  multiply(scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  /** 単位ベクトルを返す */
  normalize(): Vector {
    const mag = this.magnitude();
    if (mag === 0) return Vector.zero();
    return new Vector(this.x / mag, this.y / mag);
  }

  /** ベクトルの大きさを返す */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** 大きさの2乗を返す */
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** 2点間の距離を返す */
  distanceTo(other: Vector): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** 値ベースの等値比較 */
  equals(other: Vector): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
