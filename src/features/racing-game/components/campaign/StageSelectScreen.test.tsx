// StageSelectScreen のテスト

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { getAllStages } from '../../domain/race/stage-catalog';
import {
  createInitialProgress,
  unlockNextStage,
  updateBestRecord,
} from '../../domain/race/campaign-progress';
import { StageSelectScreen } from './StageSelectScreen';

const stages = getAllStages();

const defaultProps = {
  stages,
  progress: createInitialProgress(),
  onSelectStage: jest.fn(),
  onBackToMenu: jest.fn(),
  onOpenOptions: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('StageSelectScreen', () => {
  it('STAGE SELECT タイトルとグリッドを表示', () => {
    render(<StageSelectScreen {...defaultProps} />);
    expect(screen.getByText('STAGE SELECT')).toBeTruthy();
    expect(screen.getByLabelText('ステージグリッド')).toBeTruthy();
  });

  it('全 8 ステージのカードが描画される', () => {
    render(<StageSelectScreen {...defaultProps} />);
    expect(screen.getAllByRole('grid').length).toBe(1);
    // 各ステージカードは aria-label 付き button
    expect(screen.getAllByRole('button', { name: /STAGE \d+/ }).length).toBe(8);
  });

  it('未解放ステージ（id > highestUnlocked）はロック表示', () => {
    render(<StageSelectScreen {...defaultProps} />);
    // ステージ 1 のみアンロック → 2〜8 はロック
    const stage2 = screen.getByLabelText(/STAGE 2.*locked/);
    expect(stage2).toBeTruthy();
  });

  it('解放済みステージのクリックで onSelectStage が呼ばれる', () => {
    const onSelect = jest.fn();
    render(<StageSelectScreen {...defaultProps} onSelectStage={onSelect} />);
    fireEvent.click(screen.getByLabelText(/STAGE 1 FOREST/));
    expect(onSelect).toHaveBeenCalledWith(stages[0]);
  });

  it('ロック中ステージのクリックでトーストが出て onSelectStage は呼ばれない', () => {
    const onSelect = jest.fn();
    const onPlay = jest.fn();
    render(<StageSelectScreen {...defaultProps} onSelectStage={onSelect} onPlayDeniedSe={onPlay} />);
    fireEvent.click(screen.getByLabelText(/STAGE 5/));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/STAGE LOCKED/)).toBeTruthy();
  });

  it('1.5 秒後にロックトーストが消える', () => {
    render(<StageSelectScreen {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/STAGE 5/));
    expect(screen.getByText(/STAGE LOCKED/)).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByText(/STAGE LOCKED/)).toBeNull();
  });

  it('ロックを連続クリックすると消去タイマーは最後のクリック基準でリセットされる', () => {
    render(<StageSelectScreen {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/STAGE 5/));
    act(() => {
      jest.advanceTimersByTime(1000);  // 1 回目クリックから 1.0 秒
    });
    fireEvent.click(screen.getByLabelText(/STAGE 6/));  // 2 回目クリックでタイマー再設定
    act(() => {
      jest.advanceTimersByTime(1000);  // 1 回目から 2.0 秒（旧実装ならここで消えてしまう）
    });
    // 2 回目クリックから 1.0 秒しか経っていないので、まだトーストは残っているべき
    expect(screen.queryByText(/STAGE LOCKED/)).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(600);  // 2 回目から 1.6 秒 → 1.5 秒超で消える
    });
    expect(screen.queryByText(/STAGE LOCKED/)).toBeNull();
  });

  it('OPTIONS ボタンで onOpenOptions が呼ばれる', () => {
    const onOpen = jest.fn();
    render(<StageSelectScreen {...defaultProps} onOpenOptions={onOpen} />);
    fireEvent.click(screen.getByLabelText('OPTIONS'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('BACK TO MENU で onBackToMenu が呼ばれる', () => {
    const onBack = jest.fn();
    render(<StageSelectScreen {...defaultProps} onBackToMenu={onBack} />);
    fireEvent.click(screen.getByText('BACK TO MENU'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('全クリア時に ALL CLEAR! リボンが出る', () => {
    let progress = createInitialProgress();
    for (let i = 1; i <= 8; i++) {
      const id = i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      progress = unlockNextStage(progress, id);
      progress = updateBestRecord(progress, id, { bestTimeSec: 50, rank: 'GOLD' });
    }
    render(<StageSelectScreen {...defaultProps} progress={progress} />);
    expect(screen.getByText('ALL CLEAR!')).toBeTruthy();
  });

  it('ベストタイムがあれば M:SS 形式で表示', () => {
    let progress = createInitialProgress();
    progress = updateBestRecord(progress, 1, { bestTimeSec: 50, rank: 'GOLD' });
    render(<StageSelectScreen {...defaultProps} progress={progress} />);
    expect(screen.getByText('0:50')).toBeTruthy();
  });

  it('未クリアなら --:-- 表示', () => {
    render(<StageSelectScreen {...defaultProps} />);
    // ステージ 1 (アンロック) のタイム表示が --:-- であること
    expect(screen.getAllByText('--:--').length).toBeGreaterThan(0);
  });

  it('LAST 表示が記録ありのステージで出る', () => {
    render(
      <StageSelectScreen
        {...defaultProps}
        lastPlayedById={{ 1: '5/8' }}
      />,
    );
    expect(screen.getByText('LAST: 5/8')).toBeTruthy();
  });

  it('Esc キーで onBackToMenu が呼ばれる', () => {
    const onBack = jest.fn();
    const { container } = render(<StageSelectScreen {...defaultProps} onBackToMenu={onBack} />);
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Enter キーでフォーカスしているステージが選択される', () => {
    const onSelect = jest.fn();
    const { container } = render(<StageSelectScreen {...defaultProps} onSelectStage={onSelect} />);
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(stages[0]);
  });
});
