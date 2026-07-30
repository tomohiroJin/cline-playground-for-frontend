/**
 * 灰燼の城壁 - ゲーム画面の統合テスト
 *
 * フックの戻り値（noteRun / exportLogJson）が実際に UI から到達できることを、
 * ここでは実物のコンポーネントツリーを描画して検証する。
 * 前バージョンで「事前登録した記録項目を実際には収集できなかった」失敗があったため、
 * 「値を返すだけで配線されていない」状態を作らないことがこのテストの目的。
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AshenRampartGame } from './AshenRampartGame';
import { PLAY_LOG_STORAGE_KEY } from '../infrastructure/play-log/local-storage-play-log';
import type { PlayLogExport } from '../application/ports/play-log-port';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';

const readExportedLog = (): PlayLogExport => {
  const raw = localStorage.getItem(PLAY_LOG_STORAGE_KEY);
  expect(raw).not.toBeNull();
  return JSON.parse(raw as string) as PlayLogExport;
};

/**
 * 何も配置せずに tick を進め、決着（この preset・シードでは敗北）まで到達させる
 *
 * 固定 tick 数で待つと、開始カウントダウン（COUNTDOWN_TICKS）の追加やウェーブの
 * 較正（敵数変更）でラン長が変わるたびに壊れる。決着画面の文言が現れるまで
 * 少しずつ進めることで「何 tick で決着するか」に依存しないようにする。
 * 上限（MAX_ADVANCE_TICKS）は現状のラン長（無配置・swift・seed1で700tick）に
 * 十分な余裕を持たせた値。到達しなければテスト自体を失敗させる。
 */
const MAX_ADVANCE_TICKS = 1200;
const ADVANCE_STEP_TICKS = 50;

const isRunOver = (): boolean =>
  screen.queryByText('砦は守られた') !== null || screen.queryByText('城壁は灰燼に帰した') !== null;

const advanceUntilRunEnds = (): void => {
  for (let advanced = 0; advanced < MAX_ADVANCE_TICKS; advanced += ADVANCE_STEP_TICKS) {
    if (isRunOver()) return;
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * ADVANCE_STEP_TICKS);
    });
  }
  if (!isRunOver()) {
    throw new Error(
      `ランが ${MAX_ADVANCE_TICKS} tick 進めても決着しませんでした（ラン長の較正を確認すること）`
    );
  }
};

describe('AshenRampartGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('決着後に勝敗理由を入力して記録すると run_note が保存される', () => {
    render(<AshenRampartGame />);
    advanceUntilRunEnds();

    const textarea = screen.getByLabelText('勝敗の理由を記録する');
    fireEvent.change(textarea, { target: { value: '弓兵に頼りすぎて鴉に抜けられた' } });
    fireEvent.click(screen.getByRole('button', { name: '記録する' }));

    expect(screen.getByText('記録しました')).toBeInTheDocument();
    const exported = readExportedLog();
    const notes = exported.events.filter((e) => e.kind === 'run_note');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ text: '弓兵に頼りすぎて鴉に抜けられた' });
  });

  it('空欄のまま記録しても run_note は保存されない', () => {
    render(<AshenRampartGame />);
    advanceUntilRunEnds();

    const textarea = screen.getByLabelText('勝敗の理由を記録する');
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '記録する' }));

    expect(screen.queryByText('記録しました')).not.toBeInTheDocument();
    const exported = readExportedLog();
    expect(exported.events.filter((e) => e.kind === 'run_note')).toHaveLength(0);
  });

  it('「計測ログをコピー」でクリップボードに exportLogJson の内容が渡る', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<AshenRampartGame />);
    advanceUntilRunEnds();

    fireEvent.click(screen.getByRole('button', { name: '計測ログをコピー' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copiedJson = writeText.mock.calls[0][0] as string;
    const parsed = JSON.parse(copiedJson) as PlayLogExport;
    expect(parsed.version).toBe(2);
    expect(parsed.events.some((e) => e.kind === 'run_started')).toBe(true);
    await screen.findByText('計測ログをコピーしました');
  });

  it('決着画面でシードとプリセットを変更して「もう一度挑む」を押すと、その値で新しいランが始まる（指摘6の回帰）', () => {
    render(<AshenRampartGame />);
    advanceUntilRunEnds();

    const seedInput = screen.getByLabelText('次のランのシード') as HTMLInputElement;
    fireEvent.change(seedInput, { target: { value: '99' } });
    const presetSelect = screen.getByLabelText('次のランのプリセット') as HTMLSelectElement;
    fireEvent.change(presetSelect, { target: { value: 'heavy' } });

    fireEvent.click(screen.getByRole('button', { name: 'もう一度挑む' }));

    const exported = readExportedLog();
    const runStarted = exported.events.filter((e) => e.kind === 'run_started');
    expect(runStarted).toHaveLength(2);
    expect(runStarted[1]).toMatchObject({ seed: 99, presetId: 'heavy' });
  });

  it('クリップボード API が使えない環境ではコンソールへ出力してエラーを漏らさない', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<AshenRampartGame />);
    advanceUntilRunEnds();

    fireEvent.click(screen.getByRole('button', { name: '計測ログをコピー' }));

    await screen.findByText('コピーに失敗しました。コンソールに出力しています');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
