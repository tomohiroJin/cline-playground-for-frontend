// handle-game-over の単体テスト

import { handleGameOver } from './handle-game-over';

describe('handleGameOver', () => {
  it('STAGE SELECT に戻る遷移先を返す', () => {
    expect(handleGameOver()).toBe('stage_select');
  });
});
