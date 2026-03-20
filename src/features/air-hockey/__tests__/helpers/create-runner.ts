/**
 * テスト用 GameRunner ファクトリ
 * - 統合テスト間で共通の GameRunner 生成ロジックを集約
 */
import { GameRunner } from './game-runner';
import { TestFactory } from './factories';

/** テスト用の GameRunner を生成する */
export const createRunner = (
  initialState?: Parameters<typeof TestFactory.createTestGameState>[0]
): GameRunner => {
  const field = TestFactory.createTestFieldConfig();
  const aiConfig = TestFactory.createTestAiConfig();
  const state = initialState ? TestFactory.createTestGameState(initialState) : undefined;
  return new GameRunner(field, aiConfig, state);
};
