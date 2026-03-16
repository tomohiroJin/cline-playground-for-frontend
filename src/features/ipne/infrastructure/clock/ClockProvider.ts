/**
 * Date.now ベースの時計プロバイダー
 * domain/ports/ClockProvider の実装
 */
import { ClockProvider } from '../../domain/ports';

export class DateClockProvider implements ClockProvider {
  now(): number {
    return Date.now();
  }
}
