/**
 * Math.random アダプター
 *
 * RandomPort インターフェースを Math.random で実装する。
 * 本番環境用。
 */
import { AbstractRandomAdapter } from './abstract-random-adapter';

export class MathRandomAdapter extends AbstractRandomAdapter {
  /** 0以上1未満の乱数を返す */
  random(): number {
    return Math.random();
  }
}
