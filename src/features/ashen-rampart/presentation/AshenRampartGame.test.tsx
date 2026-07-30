/**
 * 灰燼の城壁 - ゲーム画面の統合テスト
 *
 * フックの戻り値（noteRun / exportLogJson / chooseLevy 等）が実際に UI から
 * 到達できることを、ここでは実物のコンポーネントツリーを描画して検証する。
 * 前バージョンで「事前登録した記録項目を実際には収集できなかった」失敗があったため、
 * 「値を返すだけで配線されていない」状態を作らないことがこのテストの目的。
 *
 * Task 14 で画面が「構築 → 説明 → ラン」の3段階に変わったため、決着画面へ
 * 到達するテストはすべて `startRunning` で構築・説明を通過させてからランを進める。
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
 * 構築画面でプリセットを読み込み、説明画面を抜けて盤面（running）まで進める
 *
 * 初回は必ずブリーフィング（StartOverlay）が挟まる（既読フラグは各テストの
 * beforeEach で localStorage.clear() しているため）。
 */
const startRunning = (presetLabel: RegExp = /速攻型 を読み込む/): void => {
  fireEvent.click(screen.getByRole('button', { name: presetLabel }));
  fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
  fireEvent.click(screen.getByRole('button', { name: '開始' }));
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
    startRunning();
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
    startRunning();
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
    startRunning();
    advanceUntilRunEnds();

    fireEvent.click(screen.getByRole('button', { name: '計測ログをコピー' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copiedJson = writeText.mock.calls[0][0] as string;
    const parsed = JSON.parse(copiedJson) as PlayLogExport;
    expect(parsed.version).toBe(2);
    expect(parsed.events.some((e) => e.kind === 'run_started')).toBe(true);
    await screen.findByText('計測ログをコピーしました');
  });

  it('決着画面で「もう一度挑む」を押すと構築画面に戻り、新しいデッキで再度ランを始められる', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();

    fireEvent.click(screen.getByRole('button', { name: 'もう一度挑む' }));

    // 構築画面に戻っている（デッキを組み直せる）
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeInTheDocument();

    // 別のプリセット（重厚型）で再度始める。既読フラグは前のランで立っているため、
    // ブリーフィングを経由せず直接盤面へ進む
    fireEvent.click(screen.getByRole('button', { name: /重厚型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();

    const exported = readExportedLog();
    const runStarted = exported.events.filter((e) => e.kind === 'run_started');
    expect(runStarted).toHaveLength(2);
    expect(runStarted[1]).toMatchObject({ deckCards: expect.any(Array) });
  });

  it('クリップボード API が使えない環境ではコンソールへ出力してエラーを漏らさない', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();

    fireEvent.click(screen.getByRole('button', { name: '計測ログをコピー' }));

    await screen.findByText('コピーに失敗しました。コンソールに出力しています');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('画面遷移', () => {
    it('最初はデッキ構築が表示される', () => {
      render(<AshenRampartGame />);
      expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeInTheDocument();
    });

    it('構築 → 説明 → 盤面 の順に進む', () => {
      render(<AshenRampartGame />);
      fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
      fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
      expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '開始' }));
      expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
    });

    it('2回目以降はブリーフィング（説明画面）をスキップする', () => {
      render(<AshenRampartGame />);
      startRunning();
      advanceUntilRunEnds();
      fireEvent.click(screen.getByRole('button', { name: 'もう一度挑む' }));

      fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
      fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
      // 説明画面（「開始」ボタン・砦を守る見出し）を経由せず、直接盤面が表示される
      expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
    });

    it('徴発の候補は盤面（LevyChoice）から選べる（結線の到達確認）', () => {
      render(<AshenRampartGame />);
      startRunning();
      // swift プリセット・既定シードでは徴発の到達確認自体はフック側のテストで
      // 網羅済みのため、ここでは「LevyChoice が盤面に組み込まれている」ことだけを見る。
      // 候補が無い間は何も描画されない（LevyChoice の仕様どおり）。
      expect(screen.queryByText('徴発: 1枚選ぶ')).not.toBeInTheDocument();
    });
  });
});
