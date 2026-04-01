import { readGamepad, isGamepadSupported, applyNonLinearCurve, DEADZONE, GAMEPAD_MOVE_SPEED } from './gamepad';

describe('isGamepadSupported', () => {
  it('navigator.getGamepads が存在する場合に true を返す', () => {
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [null, null, null, null],
      configurable: true,
    });
    expect(isGamepadSupported()).toBe(true);
  });
});

describe('readGamepad', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [null, null, null, null],
      configurable: true,
    });
  });

  const mockGetGamepads = (gamepads: (Gamepad | null)[]) => {
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => gamepads,
      configurable: true,
    });
  };

  it('接続されていないインデックスで null を返す', () => {
    mockGetGamepads([null, null, null, null]);
    expect(readGamepad(0)).toBeNull();
  });

  it('接続されたゲームパッドの状態を返す', () => {
    const mockGamepad = {
      axes: [0.5, -0.8, 0, 0],
      buttons: [{ pressed: false, touched: false, value: 0 }],
    } as unknown as Gamepad;
    mockGetGamepads([mockGamepad]);

    const state = readGamepad(0);
    expect(state).not.toBeNull();
    expect(state!.connected).toBe(true);
    expect(state!.axisX).toBe(0.5);
    expect(state!.axisY).toBe(-0.8);
  });

  it('デッドゾーン内の値は 0 に丸める', () => {
    const mockGamepad = {
      axes: [0.1, -0.05, 0, 0],
      buttons: [{ pressed: false, touched: false, value: 0 }],
    } as unknown as Gamepad;
    mockGetGamepads([mockGamepad]);

    const state = readGamepad(0);
    expect(state!.axisX).toBe(0); // 0.1 < DEADZONE(0.15)
    expect(state!.axisY).toBe(0); // 0.05 < DEADZONE(0.15)
  });

  it('デッドゾーン外の値はそのまま返す', () => {
    const mockGamepad = {
      axes: [0.2, -0.3, 0, 0],
      buttons: [{ pressed: false, touched: false, value: 0 }],
    } as unknown as Gamepad;
    mockGetGamepads([mockGamepad]);

    const state = readGamepad(0);
    expect(state!.axisX).toBe(0.2);
    expect(state!.axisY).toBe(-0.3);
  });

  it('ボタンの状態を読み取る', () => {
    const mockGamepad = {
      axes: [0, 0, 0, 0],
      buttons: [{ pressed: true, touched: true, value: 1 }],
    } as unknown as Gamepad;
    mockGetGamepads([mockGamepad]);

    const state = readGamepad(0);
    expect(state!.buttonA).toBe(true);
  });
});

describe('applyNonLinearCurve（S-2）', () => {
  it('入力 0 で出力 0', () => {
    expect(applyNonLinearCurve(0)).toBe(0);
  });

  it('入力 1.0 で出力 1.0（フルチルト）', () => {
    expect(applyNonLinearCurve(1.0)).toBe(1.0);
  });

  it('入力 -1.0 で出力 -1.0', () => {
    expect(applyNonLinearCurve(-1.0)).toBe(-1.0);
  });

  it('中間値で二乗カーブが効く（0.5 → 0.25）', () => {
    expect(applyNonLinearCurve(0.5)).toBeCloseTo(0.25);
  });

  it('負の中間値でも符号が維持される（-0.5 → -0.25）', () => {
    expect(applyNonLinearCurve(-0.5)).toBeCloseTo(-0.25);
  });
});

describe('定数', () => {
  it('DEADZONE が 0.15', () => {
    expect(DEADZONE).toBe(0.15);
  });

  it('GAMEPAD_MOVE_SPEED が定義されている', () => {
    expect(GAMEPAD_MOVE_SPEED).toBeGreaterThan(0);
  });
});
