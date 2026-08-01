/**
 * 灰燼の城壁 - ゲーム画面の統合テスト
 *
 * フックの戻り値（noteRun / exportLogJson / chooseLevy / restart 等）が実際に UI から
 * 到達できることを、ここでは実物のコンポーネントツリーを描画して検証する。
 * 前バージョンで「事前登録した記録項目を実際には収集できなかった」失敗があったため、
 * 「値を返すだけで配線されていない」状態を作らないことがこのテストの目的。
 *
 * Task 14 で画面が「構築 → 説明 → ラン」の3段階に変わったため、決着画面へ
 * 到達するテストはすべて `startRunning` で構築・説明を通過させてからランを進める。
 *
 * レビュー指摘2の再発防止: 「〜から選べる」と主張するテストは、実際に選択して
 * 結果（手札の増減など）が変わることまで検証する。「今は出ていない」の確認だけで
 * テスト名に「選べる」と書かない。
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
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
const startRunning = (presetLabel: RegExp = /速攻型 を読み込む/, seedText?: string): void => {
  fireEvent.click(screen.getByRole('button', { name: presetLabel }));
  if (seedText !== undefined) {
    fireEvent.change(screen.getByLabelText('シード（空欄なら毎回ランダム）'), {
      target: { value: seedText },
    });
  }
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

/** 手札グループ内で「徴発」のカードボタンを探す（HandArea に role="group" aria-label="手札" を追加済み） */
const findLevyHandButton = (): HTMLElement | null =>
  within(screen.getByRole('group', { name: '手札' })).queryByRole('button', {
    name: /^徴発 コスト/,
  });

/**
 * 徴発カードが手札に来て(かつマナで支払えて)プレイできるまで tick を進め、プレイする
 *
 * seed:1・swift プリセットでの到達順序はフック側テスト（useAshenRampartGame.test.ts の
 * 「徴発を出すと候補が出て、選ぶと手札に入る」）で確認済みのため、上限に大きな余裕を持たせている。
 */
const MAX_LEVY_SEARCH_TICKS = 2000;
const LEVY_SEARCH_STEP_TICKS = 40;

const playLevyCardWhenDrawn = (): void => {
  for (let advanced = 0; advanced < MAX_LEVY_SEARCH_TICKS; advanced += LEVY_SEARCH_STEP_TICKS) {
    const levyButton = findLevyHandButton();
    if (levyButton && !(levyButton as HTMLButtonElement).disabled) {
      fireEvent.click(levyButton);
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      return;
    }
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * LEVY_SEARCH_STEP_TICKS);
    });
  }
  throw new Error(`徴発カードが ${MAX_LEVY_SEARCH_TICKS} tick 進めても手札に来ませんでした`);
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

  it('決着画面で「同じデッキで別のシードに挑む」を押すと、盤面に留まったまま新しいシードでランが始まる（指摘3の結線）', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();

    const seedBefore = (screen.getByLabelText('シード') as HTMLInputElement).value;

    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));

    // 構築画面へは戻らず、盤面に留まったままランが再開している
    expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
    const seedAfter = (screen.getByLabelText('シード') as HTMLInputElement).value;
    expect(seedAfter).not.toBe(seedBefore);

    const exported = readExportedLog();
    const runStarted = exported.events.filter((e) => e.kind === 'run_started');
    expect(runStarted).toHaveLength(2);
    expect(runStarted[1]).toMatchObject({ seed: Number(seedAfter) });
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

    it('構築 → 説明 → 盤面 の順に進み、開始直後はカウントダウンとシードが盤面に表示される（指摘A・指摘1）', () => {
      render(<AshenRampartGame />);
      fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
      fireEvent.change(screen.getByLabelText('シード（空欄なら毎回ランダム）'), {
        target: { value: '123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
      expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '開始' }));
      expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();

      // カウントダウン（CountdownDisplay）の結線: 開始直後（tick 0）は「3」と操作可能の案内が出る
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/置けます/)).toBeInTheDocument();

      // シード表示（RunStatusBar）の結線: 構築画面で入力した値がそのまま常時表示される
      expect((screen.getByLabelText('シード') as HTMLInputElement).value).toBe('123');
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

    it('もう一度挑む で構築画面に戻ると、直前のデッキとシードが引き継がれている（指摘4）', () => {
      render(<AshenRampartGame />);
      startRunning(/速攻型 を読み込む/, '321');
      advanceUntilRunEnds();

      fireEvent.click(screen.getByRole('button', { name: 'もう一度挑む' }));

      // カードを1枚も選び直さなくても既に20枚組まれており、開始できる
      expect(screen.getByText('20 / 20')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeEnabled();
      expect(
        (screen.getByLabelText('シード（空欄なら毎回ランダム）') as HTMLInputElement).value
      ).toBe('321');
    });

    it('徴発の候補は盤面（LevyChoice）から実際に選べ、選ぶと手札が1枚増える（結線の到達確認）', () => {
      render(<AshenRampartGame />);
      startRunning(/速攻型 を読み込む/, '1');

      // 徴発カードが手札に来るまで進めてプレイする（山札を1枚peekして候補を出す）
      playLevyCardWhenDrawn();
      expect(screen.getByText('徴発: 1枚選ぶ')).toBeInTheDocument();

      const handBefore = within(screen.getByRole('group', { name: '手札' })).getAllByRole(
        'button'
      ).length;
      const levyOption = within(screen.getByRole('group', { name: '徴発の候補' })).getAllByRole(
        'button'
      )[0];
      expect(levyOption).toBeDefined();

      fireEvent.click(levyOption!);
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      expect(screen.queryByText('徴発: 1枚選ぶ')).not.toBeInTheDocument();
      const handAfter = within(screen.getByRole('group', { name: '手札' })).getAllByRole(
        'button'
      ).length;
      expect(handAfter).toBe(handBefore + 1);
    });

    it('一時停止中は徴発の候補ボタンが無効化され、押しても反応しない（指摘B）', () => {
      render(<AshenRampartGame />);
      startRunning(/速攻型 を読み込む/, '1');

      playLevyCardWhenDrawn();
      expect(screen.getByText('徴発: 1枚選ぶ')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '一時停止' }));
      const levyOption = within(screen.getByRole('group', { name: '徴発の候補' })).getAllByRole(
        'button'
      )[0];
      expect(levyOption).toBeDisabled();

      // 無効化されたボタンをクリックしても候補は消えない（無反応であることの確認）
      fireEvent.click(levyOption!);
      expect(screen.getByText('徴発: 1枚選ぶ')).toBeInTheDocument();
    });
  });

  // 指摘C（対応不要・記録のみ）: ブリーフィング（StartOverlay）を再表示する手段が
  // UI に無い（既読フラグは localStorage を消さない限り解除されない）。次の反復で扱う。

  it('置けないセルをクリックすると理由が盤面直下に出る', async () => {
    render(<AshenRampartGame />);
    startRunning(/速攻型 を読み込む/, '1');

    // 速攻型・seed:1 の初期手札3枚はいずれもコスト2以上（マナ2では払えない）か
    // 即時発動の術で盤面クリックを伴わないため、コスト0の魔力炉が手札に来るまで進める
    const hand = screen.getByRole('group', { name: '手札' });
    let reactorCard: HTMLElement | null = null;
    for (let advanced = 0; advanced < 300 && !reactorCard; advanced += 1) {
      reactorCard = within(hand).queryByRole('button', { name: /^魔力炉/ });
      if (reactorCard) break;
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
    }
    expect(reactorCard).not.toBeNull();

    fireEvent.click(reactorCard!);
    // 経路セル（魔力炉は設置スロットにしか置けない）をクリックする
    fireEvent.click(screen.getByLabelText(/^0,3 経路/));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    const notice = await screen.findByText(/そこには置けない|次の設置まで|マナが足りない/);
    expect(notice).toBeVisible();

    // 拒否は「不便」であって砦が削られる「危険」ではないため、危険専用の色(danger系)を
    // 使ってはいけない。data-tone は AshenRampartGame.tsx の REJECTION_NOTICE_TONE
    // 定数から色（color）と同時に導出されているため、この属性が 'opportunity' から
    // 'dangerText'/'danger' 系のトークン名に変わったときは、実際の色も同時に
    // danger 系へ変わっている（色だけを変えることは構造的にできない）。
    expect(notice).toHaveAttribute('data-tone', 'opportunity');
    expect(notice.getAttribute('data-tone')).not.toBe('danger');
    expect(notice.getAttribute('data-tone')).not.toBe('dangerText');
  });
});
