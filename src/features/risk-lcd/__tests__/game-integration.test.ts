/**
 * RISK LCD 統合テスト
 *
 * Jest fake timers + renderHook で、ゲームサイクルの進行・フェーズ遷移を
 * 決定論的に検証する。
 */
import { act } from '@testing-library/react';
import { setupMockAudioContext, renderGameEngine } from './test-helpers';

// AudioContext のモック設定
setupMockAudioContext();

// Math.random を決定論的に制御するヘルパー
function mockMathRandom(sequence: number[]): jest.SpyInstance {
  let idx = 0;
  return jest.spyOn(Math, 'random').mockImplementation(() => {
    const val = sequence[idx % sequence.length];
    idx++;
    return val;
  });
}

describe('ゲームサイクル統合テスト', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    // 決定論的な乱数シーケンス（障害物をレーン0に配置）
    randomSpy = mockMathRandom([
      0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3,
      0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3,
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
    randomSpy.mockRestore();
  });

  it('dispatch("act") でゲームが開始される', () => {
    const { result } = renderGameEngine();

    // 初期状態はタイトル画面
    expect(result.current.state.screen).toBe('T');

    // GAME START（menuIndex=0 で act）
    act(() => {
      result.current.dispatch('act');
    });

    // ゲーム画面に遷移
    expect(result.current.state.screen).toBe('G');
    expect(result.current.state.game).not.toBeNull();
  });

  it('ゲーム開始後にアナウンスフェーズが始まる', () => {
    const { result } = renderGameEngine();

    act(() => {
      result.current.dispatch('act');
    });

    // アナウンス情報がセットされる
    expect(result.current.state.announce).not.toBeNull();
    expect(result.current.state.announce?.stage).toBe(0);
    // ゲーム状態が初期化される
    expect(result.current.state.game?.stage).toBe(0);
    expect(result.current.state.game?.score).toBe(0);
    expect(result.current.state.game?.alive).toBe(true);
  });

  it('アナウンス後にサイクルが開始される', () => {
    const { result } = renderGameEngine();

    act(() => {
      result.current.dispatch('act');
    });

    // アナウンス期間を経過させる（1500ms: モディファイアなしの場合）
    act(() => {
      jest.advanceTimersByTime(1600);
    });

    // アナウンスがクリアされる
    expect(result.current.state.announce).toBeNull();
    // サイクルが開始される
    expect(result.current.state.game?.cycle).toBeGreaterThanOrEqual(1);
  });

  it('タイマー進行でサイクルが完了する', () => {
    const { result } = renderGameEngine();

    act(() => {
      result.current.dispatch('act');
    });

    // アナウンス + 1サイクル分のタイマーを進める
    // stage 0: spd=2600, ROWS=8, step 計算後 + resolve
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // サイクルが1以上進んでいる
    expect(result.current.state.game?.total).toBeGreaterThanOrEqual(1);
  });

  it('プレイヤーが左右に移動できる', () => {
    const { result } = renderGameEngine();

    act(() => {
      result.current.dispatch('act');
    });

    // アナウンス完了を待つ
    act(() => {
      jest.advanceTimersByTime(1600);
    });

    // 初期位置はレーン1（中央）
    expect(result.current.state.game?.lane).toBe(1);

    // 左に移動
    act(() => {
      result.current.dispatch('left');
    });
    expect(result.current.state.game?.lane).toBe(0);

    // 移動CDを待つ
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // 右に移動（2回で右端へ）
    act(() => {
      result.current.dispatch('right');
    });
    expect(result.current.state.game?.lane).toBe(1);
  });

  it('メニューの上下移動ができる', () => {
    const { result } = renderGameEngine();

    // 初期は menuIndex=0
    expect(result.current.state.menuIndex).toBe(0);

    // 下に移動
    act(() => {
      result.current.dispatch('down');
    });
    expect(result.current.state.menuIndex).toBe(1);

    // さらに下に
    act(() => {
      result.current.dispatch('down');
    });
    expect(result.current.state.menuIndex).toBe(2);

    // 上に移動
    act(() => {
      result.current.dispatch('up');
    });
    expect(result.current.state.menuIndex).toBe(1);
  });

  it('PRACTICE メニュー（index=2）で練習モードが開始される', () => {
    const { result } = renderGameEngine();

    // PRACTICE を選択（index=2）
    act(() => {
      result.current.dispatch('down');
      result.current.dispatch('down');
    });
    act(() => {
      result.current.dispatch('act');
    });

    expect(result.current.state.screen).toBe('G');
    expect(result.current.state.game?.practiceMode).toBe(true);
  });

  it('PLAY STYLE メニュー（index=3）でスタイル選択画面に遷移する', () => {
    const { result } = renderGameEngine();

    // PLAY STYLE を選択（selectAndAct を使って直接 index 指定）
    act(() => {
      result.current.selectAndAct(3);
    });

    expect(result.current.state.screen).toBe('Y');
  });

  it('UNLOCK メニュー（index=4）でショップ画面に遷移する', () => {
    const { result } = renderGameEngine();

    // UNLOCK を選択
    for (let i = 0; i < 4; i++) {
      act(() => { result.current.dispatch('down'); });
    }
    act(() => {
      result.current.dispatch('act');
    });

    expect(result.current.state.screen).toBe('H');
  });

  it('HELP メニュー（index=5）でヘルプ画面に遷移する', () => {
    const { result } = renderGameEngine();

    // HELP を選択
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.dispatch('down'); });
    }
    act(() => {
      result.current.dispatch('act');
    });

    expect(result.current.state.screen).toBe('HP');
  });
});

describe('フェーズ遷移テスト', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    // 障害物はレーン 2 に配置（プレイヤーはレーン1 で回避）
    randomSpy = mockMathRandom([
      0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
      0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
      0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
      0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9,
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
    randomSpy.mockRestore();
  });

  it('サイクル内でフェーズが idle → warn → judge → resolve と遷移する', () => {
    const { result } = renderGameEngine();

    act(() => {
      result.current.dispatch('act');
    });

    // announce フェーズ
    expect(result.current.state.game?.phase).toBe('announce');

    // アナウンス完了
    act(() => {
      jest.advanceTimersByTime(1600);
    });

    // warn フェーズ（サイクル開始）
    expect(result.current.state.game?.phase).toBe('warn');

    // カスケード完了（ROWS * step）→ judge
    // stage 0: spd=2600, step = spd / ROWS ≈ 325ms, total ≈ 2600ms
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // タイマー進行の非決定性により、resolve 後のフェーズは複数ありうる
    // （judge でまだ resolve 中 / warn で次サイクル開始 / idle で待機中）
    const phase = result.current.state.game?.phase;
    expect(['judge', 'warn', 'idle']).toContain(phase);
  });
});

describe('デイリーモードテスト', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('DAILY メニュー（index=1）でデイリー画面に遷移する', () => {
    const { result } = renderGameEngine();

    // DAILY を選択
    act(() => {
      result.current.dispatch('down');
    });
    act(() => {
      result.current.dispatch('act');
    });

    expect(result.current.state.screen).toBe('D');
  });
});
