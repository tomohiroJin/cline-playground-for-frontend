import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import PuzzlePage from './PuzzlePage';
import { PuzzleRecordStorage, TotalClearsStorage } from '../application/ports/storage-port';

// タイトル画面と収蔵目録は実コンポーネントで描画し、
// キーボード（Enter）だけで主要導線が完結することを検証する回帰テスト。

/** テスト用の記録ストレージスタブ（呼び出されない想定の最小実装） */
const emptyRecordStorage: PuzzleRecordStorage = {
  getAll: () => [],
  get: () => undefined,
  save: () => {},
  recordScore: () => ({ isBestScore: false }),
};

/** テスト用の累計クリア数ストレージスタブ */
const zeroTotalClears: TotalClearsStorage = {
  get: () => 0,
  increment: () => 0,
};

describe('PuzzlePage キーボード操作', () => {
  it('収蔵目録の導線と戻るがキーボード（Enter）で完結する', async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <PuzzlePage recordStorage={emptyRecordStorage} totalClearsStorage={zeroTotalClears} />
      </Provider>
    );

    // タイトルの「収蔵目録を見る」を Enter で開く
    const openButton = screen.getByRole('button', { name: '収蔵目録を見る' });
    openButton.focus();
    expect(openButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('収蔵目録')).toBeInTheDocument();

    // 「戻る」を Enter でタイトルへ戻る
    const backButton = screen.getByRole('button', { name: '戻る' });
    backButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '入館する' })).toBeInTheDocument();
  });
});
