// useCampaignSession の単体テスト

import { renderHook, act } from '@testing-library/react';
import type { CampaignProgressPort } from '../../application/ports/campaign-progress-port';
import { createInitialProgress } from '../../domain/race/campaign-progress';
import { getStage } from '../../domain/race/stage-catalog';
import { useCampaignSession } from './useCampaignSession';

const createInMemoryPort = (): CampaignProgressPort & { _saved: ReturnType<typeof createInitialProgress> | null } => {
  let stored: ReturnType<typeof createInitialProgress> = createInitialProgress();
  return {
    _saved: null,
    load: () => stored,
    save: (p) => { stored = p; },
    clear: () => { stored = createInitialProgress(); },
  };
};

describe('useCampaignSession', () => {
  it('初期 phase は menu, lives は 3', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    expect(result.current.phase).toBe('menu');
    expect(result.current.livesRemaining).toBe(3);
  });

  it('enterStageSelect で stage_select へ。lives は 3 にリセット', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    expect(result.current.phase).toBe('stage_select');
    expect(result.current.livesRemaining).toBe(3);
  });

  it('selectStage で racing に遷移、currentStage が設定される', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    const stage = getStage(1);
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(stage));
    expect(result.current.phase).toBe('racing');
    expect(result.current.currentStage).toBe(stage);
  });

  it('handleClear で進捗が保存され stage_clear へ', () => {
    const port = createInMemoryPort();
    const { result } = renderHook(() => useCampaignSession(port));
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(getStage(1)));
    act(() => result.current.handleClear(50, 'GOLD'));
    expect(result.current.phase).toBe('stage_clear');
    expect(result.current.progress.records[1].rank).toBe('GOLD');
    expect(result.current.progress.highestUnlocked).toBe(2);
    expect(port.load().records[1].rank).toBe('GOLD');  // 永続化
  });

  it('handleTimeUp で lives 減少。残あれば retry（リトライ確認）へ', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(getStage(1)));
    act(() => result.current.handleTimeUp());
    expect(result.current.livesRemaining).toBe(2);
    expect(result.current.phase).toBe('retry');  // spec §2.4: 残機 > 0 はリトライ確認へ
  });

  it('retry から retryStage で同ステージへ復帰（racing）。lives は維持される', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(getStage(1)));
    act(() => result.current.handleTimeUp());
    expect(result.current.phase).toBe('retry');
    act(() => result.current.retryStage());
    expect(result.current.phase).toBe('racing');
    expect(result.current.livesRemaining).toBe(2);  // STAGE SELECT を経由しないのでリセットされない
  });

  it('lives 0 で game_over へ', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(getStage(1)));
    act(() => result.current.handleTimeUp());
    act(() => result.current.handleTimeUp());
    act(() => result.current.handleTimeUp());
    expect(result.current.livesRemaining).toBe(0);
    expect(result.current.phase).toBe('game_over');
  });

  it('全 8 ステージクリア → continueAfterClear で ending へ', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    for (let i = 1; i <= 8; i++) {
      const id = i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      act(() => result.current.selectStage(getStage(id)));
      act(() => result.current.handleClear(50, 'GOLD'));
    }
    act(() => result.current.continueAfterClear());
    expect(result.current.phase).toBe('ending');
    expect(result.current.canReplayEnding).toBe(true);
  });

  it('未完了状態では continueAfterClear で stage_select に戻る', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(getStage(1)));
    act(() => result.current.handleClear(50, 'GOLD'));
    act(() => result.current.continueAfterClear());
    expect(result.current.phase).toBe('stage_select');
  });

  it('resetAllProgress で進捗が初期化される', () => {
    const { result } = renderHook(() => useCampaignSession(createInMemoryPort()));
    act(() => result.current.enterStageSelect());
    act(() => result.current.selectStage(getStage(1)));
    act(() => result.current.handleClear(50, 'GOLD'));
    act(() => result.current.resetAllProgress());
    expect(result.current.progress.records[1].rank).toBe('NONE');
    expect(result.current.progress.highestUnlocked).toBe(1);
  });
});
