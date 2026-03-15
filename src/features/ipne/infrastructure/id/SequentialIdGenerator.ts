/**
 * 連番ID生成器
 * domain/ports/IdGenerator の実装
 */
import { IdGenerator } from '../../domain/ports';

export class SequentialIdGenerator implements IdGenerator {
  private counters: Record<string, number> = {};

  private next(prefix: string): string {
    this.counters[prefix] = (this.counters[prefix] ?? 0) + 1;
    return `${prefix}-${this.counters[prefix]}`;
  }

  generateEnemyId(): string {
    return this.next('enemy');
  }

  generateTrapId(): string {
    return this.next('trap');
  }

  generateItemId(): string {
    return this.next('item');
  }

  generateFeedbackId(): string {
    return this.next('feedback');
  }

  /** カウンタをリセットする */
  reset(): void {
    this.counters = {};
  }
}
