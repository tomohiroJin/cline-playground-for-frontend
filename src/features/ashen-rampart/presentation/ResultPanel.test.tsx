/**
 * リザルトパネルのテスト
 *
 * 勝敗理由の任意入力（run_note）とログコピーの動作を検証する。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResultPanel } from './ResultPanel';
import { startRun } from '../application/use-cases/start-run';
import { SeededRandom } from '../infrastructure/random/seeded-random';

const makeRun = () => ({ ...startRun(new SeededRandom(1)), phase: 'result' as const });

describe('ResultPanel 勝敗理由とログ', () => {
  it('理由を入力して記録ボタンで onNote が呼ばれ、入力欄が閉じる', () => {
    const onNote = jest.fn();
    render(
      <ResultPanel
        run={makeRun()}
        onRestart={jest.fn()}
        onNote={onNote}
        exportLogJson={() => '{}'}
      />
    );
    fireEvent.change(screen.getByLabelText('勝敗の理由（ひと言）'), {
      target: { value: '弓兵を入口に固めたので漏れなかった' },
    });
    fireEvent.click(screen.getByRole('button', { name: '理由を記録' }));
    expect(onNote).toHaveBeenCalledWith('弓兵を入口に固めたので漏れなかった');
    expect(screen.getByText('記録しました')).toBeInTheDocument();
  });

  it('空欄のまま記録ボタンを押しても onNote は呼ばれない', () => {
    const onNote = jest.fn();
    render(
      <ResultPanel
        run={makeRun()}
        onRestart={jest.fn()}
        onNote={onNote}
        exportLogJson={() => '{}'}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '理由を記録' }));
    expect(onNote).not.toHaveBeenCalled();
  });

  it('計測ログをコピーで exportLogJson の内容がクリップボードに渡る', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ResultPanel
        run={makeRun()}
        onRestart={jest.fn()}
        onNote={jest.fn()}
        exportLogJson={() => '{"version":1}'}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '計測ログをコピー' }));
    // コピー処理は非同期のため、state 更新が act() でラップされるまで待つ
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('{"version":1}'));
    await screen.findByText('コピーしました');
  });
});
