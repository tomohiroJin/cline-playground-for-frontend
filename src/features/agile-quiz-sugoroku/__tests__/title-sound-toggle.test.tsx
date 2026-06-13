/**
 * TitleScreen サウンドトグル機能のテスト
 *
 * タイトル画面にサウンド ON/OFF ボタンが表示され、
 * 押すたびに設定が反転して LocalStorage に永続化されることを検証する。
 */

// tone モジュールのモック（ESM パッケージのため Jest で変換できない）
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  Loop: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Transport: {
    bpm: { value: 120 },
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
  },
  start: jest.fn(),
  now: jest.fn().mockReturnValue(0),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from '../presentation/components/screens/TitleScreen';
import { SettingsRepository } from '../infrastructure/storage/settings-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';

/** TitleScreen を必須 props のみで描画するヘルパー */
function renderTitle(overrides: Partial<React.ComponentProps<typeof TitleScreen>> = {}) {
  return render(
    <TitleScreen
      onStart={jest.fn()}
      {...overrides}
    />,
  );
}

describe('TitleScreen サウンドトグル', () => {
  beforeEach(() => localStorage.clear());

  it('サウンドトグルボタンが表示される', () => {
    renderTitle();
    const toggle = screen.getByRole('button', { name: /サウンド/ });
    expect(toggle).toBeInTheDocument();
  });

  it('サウンドトグルボタンを押すと設定が反転する（オン→オフ）', () => {
    renderTitle();
    const toggle = screen.getByRole('button', { name: /サウンド/ });
    // 初期値は soundEnabled: true
    fireEvent.click(toggle);
    const repo = new SettingsRepository(new LocalStorageAdapter());
    expect(repo.load().soundEnabled).toBe(false);
  });

  it('サウンドトグルボタンを2回押すと設定が元に戻る（オフ→オン）', () => {
    renderTitle();
    const toggle = screen.getByRole('button', { name: /サウンド/ });
    fireEvent.click(toggle); // オン→オフ
    fireEvent.click(toggle); // オフ→オン
    const repo = new SettingsRepository(new LocalStorageAdapter());
    expect(repo.load().soundEnabled).toBe(true);
  });
});
