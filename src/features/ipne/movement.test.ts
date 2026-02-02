/**
 * 連続移動機能のテスト
 */
import {
  DEFAULT_MOVEMENT_CONFIG,
  INITIAL_MOVEMENT_STATE,
  getDirectionFromKey,
  isMovementKey,
  startMovement,
  stopMovement,
  updateMovement,
} from './movement';

describe('movement', () => {
  describe('DEFAULT_MOVEMENT_CONFIG', () => {
    it('デフォルト設定が正しく定義されている', () => {
      expect(DEFAULT_MOVEMENT_CONFIG.moveInterval).toBe(140);
      expect(DEFAULT_MOVEMENT_CONFIG.initialDelay).toBe(180);
    });
  });

  describe('INITIAL_MOVEMENT_STATE', () => {
    it('初期状態が正しく定義されている', () => {
      expect(INITIAL_MOVEMENT_STATE.activeDirection).toBeNull();
      expect(INITIAL_MOVEMENT_STATE.pressStartTime).toBe(0);
      expect(INITIAL_MOVEMENT_STATE.lastMoveTime).toBe(0);
      expect(INITIAL_MOVEMENT_STATE.isRepeating).toBe(false);
    });
  });

  describe('getDirectionFromKey', () => {
    it('矢印キーから方向を取得する', () => {
      expect(getDirectionFromKey('ArrowUp')).toBe('up');
      expect(getDirectionFromKey('ArrowDown')).toBe('down');
      expect(getDirectionFromKey('ArrowLeft')).toBe('left');
      expect(getDirectionFromKey('ArrowRight')).toBe('right');
    });

    it('WASDキーから方向を取得する', () => {
      expect(getDirectionFromKey('w')).toBe('up');
      expect(getDirectionFromKey('s')).toBe('down');
      expect(getDirectionFromKey('a')).toBe('left');
      expect(getDirectionFromKey('d')).toBe('right');
    });

    it('大文字小文字を区別しない', () => {
      expect(getDirectionFromKey('W')).toBe('up');
      expect(getDirectionFromKey('S')).toBe('down');
      expect(getDirectionFromKey('A')).toBe('left');
      expect(getDirectionFromKey('D')).toBe('right');
    });

    it('移動キー以外はnullを返す', () => {
      expect(getDirectionFromKey('Enter')).toBeNull();
      expect(getDirectionFromKey('Space')).toBeNull();
      expect(getDirectionFromKey('m')).toBeNull();
      expect(getDirectionFromKey('Escape')).toBeNull();
    });
  });

  describe('isMovementKey', () => {
    it('移動キーはtrueを返す', () => {
      expect(isMovementKey('ArrowUp')).toBe(true);
      expect(isMovementKey('w')).toBe(true);
      expect(isMovementKey('ArrowDown')).toBe(true);
      expect(isMovementKey('s')).toBe(true);
    });

    it('移動キー以外はfalseを返す', () => {
      expect(isMovementKey('Enter')).toBe(false);
      expect(isMovementKey('m')).toBe(false);
    });
  });

  describe('startMovement', () => {
    it('キー押下開始時に状態を更新する', () => {
      const currentTime = 1000;
      const newState = startMovement(INITIAL_MOVEMENT_STATE, 'up', currentTime);

      expect(newState.activeDirection).toBe('up');
      expect(newState.pressStartTime).toBe(currentTime);
      expect(newState.lastMoveTime).toBe(currentTime);
      expect(newState.isRepeating).toBe(false);
    });

    it('同じキーが既に押されている場合は状態を変更しない', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1000,
        isRepeating: true,
      };
      const newState = startMovement(state, 'up', 2000);

      expect(newState).toBe(state); // 同じオブジェクト
    });

    it('異なるキーが押された場合は新しい状態に更新する', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1000,
        isRepeating: true,
      };
      const newState = startMovement(state, 'down', 2000);

      expect(newState.activeDirection).toBe('down');
      expect(newState.pressStartTime).toBe(2000);
      expect(newState.isRepeating).toBe(false);
    });
  });

  describe('stopMovement', () => {
    it('押下中のキーを離すと初期状態に戻る', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1500,
        isRepeating: true,
      };
      const newState = stopMovement(state, 'up');

      expect(newState).toEqual(INITIAL_MOVEMENT_STATE);
    });

    it('異なるキーを離しても状態は変わらない', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1500,
        isRepeating: true,
      };
      const newState = stopMovement(state, 'down');

      expect(newState).toBe(state);
    });
  });

  describe('updateMovement', () => {
    const config = {
      moveInterval: 100,
      initialDelay: 150,
    };

    it('キーが押されていない場合は移動しない', () => {
      const result = updateMovement(INITIAL_MOVEMENT_STATE, 1000, config);

      expect(result.shouldMove).toBe(false);
      expect(result.newState).toBe(INITIAL_MOVEMENT_STATE);
    });

    it('初回遅延中は移動しない', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1000,
        isRepeating: false,
      };
      const result = updateMovement(state, 1100, config); // 100ms経過（まだ150ms未満）

      expect(result.shouldMove).toBe(false);
      expect(result.newState.isRepeating).toBe(false);
    });

    it('初回遅延後に連続移動が開始される', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1000,
        isRepeating: false,
      };
      const result = updateMovement(state, 1160, config); // 160ms経過（150ms以上）

      expect(result.shouldMove).toBe(true);
      expect(result.newState.isRepeating).toBe(true);
      expect(result.newState.lastMoveTime).toBe(1160);
    });

    it('移動間隔内は移動しない', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1200,
        isRepeating: true,
      };
      const result = updateMovement(state, 1250, config); // 50ms経過（100ms未満）

      expect(result.shouldMove).toBe(false);
    });

    it('移動間隔後に移動する', () => {
      const state = {
        activeDirection: 'up' as const,
        pressStartTime: 1000,
        lastMoveTime: 1200,
        isRepeating: true,
      };
      const result = updateMovement(state, 1310, config); // 110ms経過（100ms以上）

      expect(result.shouldMove).toBe(true);
      expect(result.newState.lastMoveTime).toBe(1310);
    });
  });
});
