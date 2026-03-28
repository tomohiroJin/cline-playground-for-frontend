/**
 * キーボード入力のコアロジックテスト
 * 1P（矢印キー）と 2P（WASD）の独立動作を検証する
 */
import {
  createKeyboardState,
  updateKeyboardState,
  calculateKeyboardMovement,
  KEYBOARD_MOVE_SPEED,
  PLAYER1_KEY_MAP,
  PLAYER2_KEY_MAP,
  updateKeyboardStateForPlayer,
} from './keyboard';
import { CONSTANTS } from './constants';

describe('createKeyboardState', () => {
  it('全方向が false の初期状態を生成する', () => {
    const state = createKeyboardState();
    expect(state).toEqual({ up: false, down: false, left: false, right: false });
  });
});

describe('updateKeyboardState', () => {
  it('矢印キーで状態を更新する（後方互換）', () => {
    const state = createKeyboardState();
    const updated = updateKeyboardState(state, 'ArrowUp', true);
    expect(updated.up).toBe(true);
  });

  it('WASD キーで状態を更新する（後方互換）', () => {
    const state = createKeyboardState();
    const updated = updateKeyboardState(state, 'w', true);
    expect(updated.up).toBe(true);
  });

  it('関係ないキーでは元の状態をそのまま返す', () => {
    const state = createKeyboardState();
    const updated = updateKeyboardState(state, 'x', true);
    expect(updated).toBe(state);
  });
});

describe('PLAYER1_KEY_MAP', () => {
  it('矢印キーのみが含まれる', () => {
    expect(PLAYER1_KEY_MAP['ArrowUp']).toBe('up');
    expect(PLAYER1_KEY_MAP['ArrowDown']).toBe('down');
    expect(PLAYER1_KEY_MAP['ArrowLeft']).toBe('left');
    expect(PLAYER1_KEY_MAP['ArrowRight']).toBe('right');
  });

  it('WASD キーは含まれない', () => {
    expect(PLAYER1_KEY_MAP['w']).toBeUndefined();
    expect(PLAYER1_KEY_MAP['a']).toBeUndefined();
    expect(PLAYER1_KEY_MAP['s']).toBeUndefined();
    expect(PLAYER1_KEY_MAP['d']).toBeUndefined();
  });
});

describe('PLAYER2_KEY_MAP', () => {
  it('WASD キーのみが含まれる', () => {
    expect(PLAYER2_KEY_MAP['w']).toBe('up');
    expect(PLAYER2_KEY_MAP['W']).toBe('up');
    expect(PLAYER2_KEY_MAP['a']).toBe('left');
    expect(PLAYER2_KEY_MAP['A']).toBe('left');
    expect(PLAYER2_KEY_MAP['s']).toBe('down');
    expect(PLAYER2_KEY_MAP['S']).toBe('down');
    expect(PLAYER2_KEY_MAP['d']).toBe('right');
    expect(PLAYER2_KEY_MAP['D']).toBe('right');
  });

  it('矢印キーは含まれない', () => {
    expect(PLAYER2_KEY_MAP['ArrowUp']).toBeUndefined();
    expect(PLAYER2_KEY_MAP['ArrowDown']).toBeUndefined();
    expect(PLAYER2_KEY_MAP['ArrowLeft']).toBeUndefined();
    expect(PLAYER2_KEY_MAP['ArrowRight']).toBeUndefined();
  });
});

describe('updateKeyboardStateForPlayer', () => {
  describe('player1（矢印キー）', () => {
    it('ArrowUp で up が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'ArrowUp', true, 'player1');
      expect(updated.up).toBe(true);
    });

    it('ArrowDown で down が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'ArrowDown', true, 'player1');
      expect(updated.down).toBe(true);
    });

    it('ArrowLeft で left が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'ArrowLeft', true, 'player1');
      expect(updated.left).toBe(true);
    });

    it('ArrowRight で right が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'ArrowRight', true, 'player1');
      expect(updated.right).toBe(true);
    });

    it('WASD キーは無視される', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'w', true, 'player1');
      expect(updated).toBe(state);
    });
  });

  describe('player2（WASD）', () => {
    it('W キーで up が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'w', true, 'player2');
      expect(updated.up).toBe(true);
    });

    it('S キーで down が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 's', true, 'player2');
      expect(updated.down).toBe(true);
    });

    it('A キーで left が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'a', true, 'player2');
      expect(updated.left).toBe(true);
    });

    it('D キーで right が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'd', true, 'player2');
      expect(updated.right).toBe(true);
    });

    it('矢印キーは無視される', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'ArrowUp', true, 'player2');
      expect(updated).toBe(state);
    });

    it('大文字 WASD でも動作する', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardStateForPlayer(state, 'W', true, 'player2');
      expect(updated.up).toBe(true);
    });
  });

  describe('1P と 2P の独立性', () => {
    it('1P の矢印キー入力は 2P の状態に影響しない', () => {
      const p1State = createKeyboardState();
      const p2State = createKeyboardState();

      const p1Updated = updateKeyboardStateForPlayer(p1State, 'ArrowUp', true, 'player1');
      const p2Updated = updateKeyboardStateForPlayer(p2State, 'ArrowUp', true, 'player2');

      expect(p1Updated.up).toBe(true);
      expect(p2Updated).toBe(p2State); // 変更なし
    });

    it('2P の WASD 入力は 1P の状態に影響しない', () => {
      const p1State = createKeyboardState();
      const p2State = createKeyboardState();

      const p1Updated = updateKeyboardStateForPlayer(p1State, 'w', true, 'player1');
      const p2Updated = updateKeyboardStateForPlayer(p2State, 'w', true, 'player2');

      expect(p1Updated).toBe(p1State); // 変更なし
      expect(p2Updated.up).toBe(true);
    });
  });
});

describe('calculateKeyboardMovement', () => {
  const centerPos = { x: 225, y: 700 };

  it('左キーで x が減少する', () => {
    const state = { ...createKeyboardState(), left: true };
    const result = calculateKeyboardMovement(state, centerPos, CONSTANTS);
    expect(result.x).toBe(centerPos.x - KEYBOARD_MOVE_SPEED);
  });

  it('右キーで x が増加する', () => {
    const state = { ...createKeyboardState(), right: true };
    const result = calculateKeyboardMovement(state, centerPos, CONSTANTS);
    expect(result.x).toBe(centerPos.x + KEYBOARD_MOVE_SPEED);
  });

  it('上キーで y が減少する', () => {
    const state = { ...createKeyboardState(), up: true };
    const result = calculateKeyboardMovement(state, centerPos, CONSTANTS);
    expect(result.y).toBe(centerPos.y - KEYBOARD_MOVE_SPEED);
  });

  it('下キーで y が増加する', () => {
    const state = { ...createKeyboardState(), down: true };
    const result = calculateKeyboardMovement(state, centerPos, CONSTANTS);
    expect(result.y).toBe(centerPos.y + KEYBOARD_MOVE_SPEED);
  });

  it('入力なしの場合は位置が変わらない', () => {
    const state = createKeyboardState();
    const result = calculateKeyboardMovement(state, centerPos, CONSTANTS);
    expect(result.x).toBe(centerPos.x);
    expect(result.y).toBe(centerPos.y);
    expect(result.vx).toBe(0);
    expect(result.vy).toBe(0);
  });

  it('プレイヤー側半面にクランプされる', () => {
    const edgePos = { x: 225, y: 895 };
    const state = { ...createKeyboardState(), down: true };
    const result = calculateKeyboardMovement(state, edgePos, CONSTANTS);
    // 下側の境界を超えないことを確認
    const maxY = CONSTANTS.CANVAS.HEIGHT - CONSTANTS.SIZES.MALLET - 5;
    expect(result.y).toBeLessThanOrEqual(maxY);
  });
});

describe('calculateKeyboardMovement（2P: 上半分クランプ）', () => {
  const centerPos = { x: 225, y: 200 };

  it('2P モードで上半分にクランプされる', () => {
    const state = { ...createKeyboardState(), down: true };
    const result = calculateKeyboardMovement(state, centerPos, CONSTANTS, 'player2');
    const maxY = CONSTANTS.CANVAS.HEIGHT / 2 - CONSTANTS.SIZES.MALLET - 10;
    expect(result.y).toBeLessThanOrEqual(maxY);
  });

  it('2P モードで上端を超えない', () => {
    const topPos = { x: 225, y: 10 };
    const state = { ...createKeyboardState(), up: true };
    const result = calculateKeyboardMovement(state, topPos, CONSTANTS, 'player2');
    const minY = CONSTANTS.SIZES.MALLET + 5;
    expect(result.y).toBeGreaterThanOrEqual(minY);
  });

  it('player1 指定で下半分にクランプされる（デフォルトと同じ）', () => {
    const playerPos = { x: 225, y: 700 };
    const state = { ...createKeyboardState(), up: true };
    const resultDefault = calculateKeyboardMovement(state, playerPos, CONSTANTS);
    const resultP1 = calculateKeyboardMovement(state, playerPos, CONSTANTS, 'player1');
    expect(resultP1).toEqual(resultDefault);
  });
});

describe('GP-3: 2v2 モードでのキーマッピング分離', () => {
  it('updateKeyboardState は WASD を受け付ける（1v1 後方互換）', () => {
    let state = createKeyboardState();
    state = updateKeyboardState(state, 'w', true);
    expect(state.up).toBe(true);
  });

  it('updateKeyboardStateForPlayer(player1) は WASD を無視する', () => {
    let state = createKeyboardState();
    state = updateKeyboardStateForPlayer(state, 'w', true, 'player1');
    expect(state.up).toBe(false);
  });

  it('updateKeyboardStateForPlayer(player1) は矢印キーを受け付ける', () => {
    let state = createKeyboardState();
    state = updateKeyboardStateForPlayer(state, 'ArrowUp', true, 'player1');
    expect(state.up).toBe(true);
  });

  it('updateKeyboardStateForPlayer(player2) は WASD を受け付ける', () => {
    let state = createKeyboardState();
    state = updateKeyboardStateForPlayer(state, 'w', true, 'player2');
    expect(state.up).toBe(true);
  });

  it('updateKeyboardStateForPlayer(player2) は矢印キーを無視する', () => {
    let state = createKeyboardState();
    state = updateKeyboardStateForPlayer(state, 'ArrowUp', true, 'player2');
    expect(state.up).toBe(false);
  });
});
