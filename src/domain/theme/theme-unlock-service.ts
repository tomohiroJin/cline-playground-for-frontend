/**
 * テーマアンロックサービス
 *
 * テーマのアンロック条件を評価するドメインサービス。
 * Strategy パターンで各条件の評価ロジックを分離する。
 */
import { UnlockCondition, PuzzleRecord, ThemeId } from '../../types/puzzle';

/** アンロック判定に必要なコンテキスト */
export interface UnlockContext {
  readonly totalClears: number;
  readonly records: readonly PuzzleRecord[];
  readonly themeImageIds: ReadonlyMap<ThemeId, readonly string[]>;
}

/** アンロック条件の評価戦略 */
interface UnlockStrategy {
  evaluate(condition: UnlockCondition, context: UnlockContext): boolean;
}

/** always: 常にアンロック */
const alwaysStrategy: UnlockStrategy = {
  evaluate: () => true,
};

/** clearCount: 累計クリア数で判定 */
const clearCountStrategy: UnlockStrategy = {
  evaluate: (condition, context) => {
    if (condition.type !== 'clearCount') return false;
    return context.totalClears >= condition.count;
  },
};

/** themesClear: 指定テーマのクリアで判定 */
const themesClearStrategy: UnlockStrategy = {
  evaluate: (condition, context) => {
    if (condition.type !== 'themesClear') return false;
    return condition.themeIds.every(themeId => {
      const imageIds = context.themeImageIds.get(themeId);
      if (!imageIds || imageIds.length === 0) return false;
      return imageIds.some(imgId =>
        context.records.some(r => r.imageId === imgId && r.clearCount > 0)
      );
    });
  },
};

/** 条件タイプと戦略のマッピング */
const strategies: Record<UnlockCondition['type'], UnlockStrategy> = {
  always: alwaysStrategy,
  clearCount: clearCountStrategy,
  themesClear: themesClearStrategy,
};

/**
 * テーマがアンロック済みか判定する
 */
export const isThemeUnlocked = (
  condition: UnlockCondition,
  context: UnlockContext
): boolean => {
  const strategy = strategies[condition.type];
  return strategy.evaluate(condition, context);
};
