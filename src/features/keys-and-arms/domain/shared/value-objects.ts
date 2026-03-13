/**
 * ドメイン バリューオブジェクト
 *
 * 不変のドメイン値を表現する。
 * 制約条件は DbC アサーションで保証する。
 */
import { assert, assertRange } from '../contracts/assertions';

/** HP 上限 */
const MAX_HP = 99;

/** HP バリューオブジェクト */
export class HP {
  private constructor(private readonly value: number) {}

  static create(value: number): HP {
    assertRange(value, 0, MAX_HP, 'HP');
    return new HP(value);
  }

  get current(): number { return this.value; }
  get isDead(): boolean { return this.value <= 0; }

  damage(amount: number): HP {
    assert(amount >= 0, 'ダメージ量は 0 以上');
    return HP.create(Math.max(0, this.value - amount));
  }

  heal(amount: number): HP {
    assert(amount >= 0, '回復量は 0 以上');
    return HP.create(Math.min(MAX_HP, this.value + amount));
  }
}

/** スコア バリューオブジェクト */
export class Score {
  private constructor(private readonly value: number) {}

  static create(value: number): Score {
    assert(value >= 0, 'スコアは 0 以上');
    return new Score(value);
  }

  get current(): number { return this.value; }

  add(points: number): Score {
    assert(points >= 0, '加算ポイントは 0 以上');
    return Score.create(this.value + points);
  }
}

/** ビートカウンター バリューオブジェクト */
export class BeatCounter {
  private constructor(
    private readonly count: number,
    private readonly period: number,
  ) {}

  static create(period: number): BeatCounter {
    assert(period > 0, 'ビート周期は 1 以上');
    return new BeatCounter(0, period);
  }

  get current(): number { return this.count; }
  get isOnBeat(): boolean { return this.count === 0; }

  tick(): BeatCounter {
    const next = (this.count + 1) % this.period;
    return new BeatCounter(next, this.period);
  }
}
