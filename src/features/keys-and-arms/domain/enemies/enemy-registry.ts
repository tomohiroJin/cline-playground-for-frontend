/**
 * 敵行動レジストリ（Strategy パターン）
 *
 * 敵タイプごとの行動を登録・取得する。
 * 新しい敵タイプの追加が容易（OCP 準拠）。
 */

/** 敵行動インターフェース */
export interface EnemyBehavior<TState, TContext> {
  /** 敵の更新処理 */
  update(state: TState, context: TContext): TState;
}

/** 敵行動レジストリ */
export class EnemyBehaviorRegistry<TState extends { beh: string }, TContext> {
  private readonly behaviors = new Map<string, EnemyBehavior<TState, TContext>>();

  register(type: string, behavior: EnemyBehavior<TState, TContext>): void {
    this.behaviors.set(type, behavior);
  }

  getBehavior(type: string): EnemyBehavior<TState, TContext> {
    const behavior = this.behaviors.get(type);
    if (!behavior) {
      throw new Error(`[EnemyRegistry] 未登録の敵タイプ: ${type}`);
    }
    return behavior;
  }

  update(enemy: TState, context: TContext): TState {
    return this.getBehavior(enemy.beh).update(enemy, context);
  }
}
