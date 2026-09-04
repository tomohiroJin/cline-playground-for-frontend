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
import { AshenRampartGame, HEADER_CLEARANCE } from './AshenRampartGame';
import { PLAY_LOG_STORAGE_KEY } from '../infrastructure/play-log/local-storage-play-log';
import type { PlayLogExport } from '../application/ports/play-log-port';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';
import { PLAINS_MAP, laneOf } from '../domain/board/stage-map';
import { DECK_SIZE } from '../domain/cards/card-pool';

/** 判定用ログのコピー操作ボタン名。文言が長いため定数に切り出す（反復4で文言変更） */
const COPY_BUTTON_NAME = '判定用の記録をコピー（3ラン分まとまっています）';

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

/**
 * 「魔力炉」3枚＋「石壁」3枚＋「弓兵」3枚＋「弩砲」3枚のカスタムデッキで盤面まで進める
 *
 * 既存プリセット（速攻型・重厚型）はどちらも石壁を含まないため、経路セルへの
 * 守り手配置や射程リングの表示を検証するにはデッキ構築画面でカードを直接組む
 * 必要がある。反復6 で魔力炉の同名上限の例外が外れたため（もう17枚は積めない）、
 * 4種を3枚ずつの DECK_SIZE 枚に組み直した。この枚数構成・並び順・シード2の
 * 組み合わせでは、シャッフル結果として石壁と弓兵の両方が初期手札3枚のうちに
 * 入ることを事前に確認済み（createDeck を直接呼ぶスクリプトで検証）。
 * ドローを待つ必要がない。
 */
const CUSTOM_DECK_SEED = '2';

const buildCustomDeck = (): void => {
  fireEvent.click(screen.getByRole('button', { name: '魔力炉 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '魔力炉 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '魔力炉 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '石壁 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '石壁 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '石壁 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '弓兵 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '弓兵 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '弓兵 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '弩砲 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '弩砲 を1枚増やす' }));
  fireEvent.click(screen.getByRole('button', { name: '弩砲 を1枚増やす' }));
  fireEvent.change(screen.getByLabelText('シード（空欄なら毎回ランダム）'), {
    target: { value: CUSTOM_DECK_SEED },
  });
  fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
  fireEvent.click(screen.getByRole('button', { name: '開始' }));
};

/** 経路セルへの守り手配置を検証する（石壁が初期手札にある） */
const startRunningWithStoneWallDeck = buildCustomDeck;

/**
 * 能力表示（射程リング）を実画面で確かめる（弓兵が初期手札にある）
 *
 * 石壁（射程0・オーラなし）ではリングが描かれず検証にならないため、
 * 射程を持つ弓兵を使う。
 */
const startRunningWithArrowTowerDeck = buildCustomDeck;

/**
 * 決着画面で勝敗の理由を記録する（Task 12: 集計・再挑戦・ログコピーは記録後にだけ開くため、
 * それらのボタンへ到達する既存テストはすべて先にこれを呼ぶ必要がある）
 */
const submitRunNote = (text = 'テスト用の記録'): void => {
  fireEvent.change(screen.getByLabelText(/勝敗の理由を記録する/), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: '記録する' }));
};

/**
 * 「カード名 コスト」の手札ボタンを判定するマッチャーを組み立てる
 *
 * Task 7 で aria-label が「[役割 ]カード名 コスト…」になった（役割名とカード名が
 * 一致するとき役割は前置されない。例: 「徴発 コスト1」「壁 石壁 コスト1」）。
 * カード名を主語にし、直前が先頭か空白であることを要求することで、将来
 * 他カードの役割ラベルが今回のカード名を部分文字列として含んでいても
 * 誤って一致しないようにする（役割名の一致に依存した部分一致は避ける）。
 * カード名は常にこのファイル内のリテラルから渡すため、動的な RegExp 構築
 * （security/detect-non-literal-regexp）を避けて文字列操作で判定する。
 */
const isHandButtonNameFor =
  (cardName: string) =>
  (accessibleName: string): boolean =>
    accessibleName.startsWith(`${cardName} コスト`) ||
    accessibleName.includes(` ${cardName} コスト`);

// 反復6 で徴発（levy）が構築規則違反になり、ランに持ち込めなくなったため
// （下の「徴発を加えると開始ボタンが無効になり…」テストを参照）、徴発を
// 手札に引くまで tick を進めてプレイする旧ヘルパーは使い道がなくなった。

describe('AshenRampartGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ラン画面の上端にフローティングホームボタンぶんの余白がある', () => {
    render(<AshenRampartGame />);
    startRunning();
    // フローティングホームボタン（App.tsx, position: fixed）は常に画面左上に
    // 重なるため、共通側を変更せずこちら側で余白を確保して吸収する
    expect(screen.getByTestId('ashen-rampart-layout')).toHaveAttribute(
      'data-header-clearance',
      HEADER_CLEARANCE
    );
  });

  it('決着後に勝敗理由を入力して記録すると run_note が保存される', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();

    const textarea = screen.getByLabelText(/勝敗の理由を記録する/);
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

    const textarea = screen.getByLabelText(/勝敗の理由を記録する/);
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '記録する' }));

    expect(screen.queryByText('記録しました')).not.toBeInTheDocument();
    const exported = readExportedLog();
    expect(exported.events.filter((e) => e.kind === 'run_note')).toHaveLength(0);
  });

  it(`「${COPY_BUTTON_NAME}」でクリップボードに exportLogJson の内容が渡る`, async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();
    submitRunNote();

    fireEvent.click(screen.getByRole('button', { name: COPY_BUTTON_NAME }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copiedJson = writeText.mock.calls[0][0] as string;
    const parsed = JSON.parse(copiedJson) as PlayLogExport;
    expect(parsed.version).toBe(4);
    expect(parsed.events.some((e) => e.kind === 'run_started')).toBe(true);
    await screen.findByText('判定用の記録をコピーしました');
  });

  it('決着画面で「もう一度挑む」を押すと構築画面に戻り、新しいデッキで再度ランを始められる', () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();
    submitRunNote();

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
    submitRunNote();

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
    submitRunNote();

    fireEvent.click(screen.getByRole('button', { name: COPY_BUTTON_NAME }));

    await screen.findByText('コピーに失敗しました。コンソールに出力しています');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('捨札ボタンを押すと手札が1枚減る', async () => {
    render(<AshenRampartGame />);
    startRunning();

    const hand = screen.getByRole('group', { name: '手札' });
    const before = within(hand).getAllByRole('button', { name: /を捨てる$/ }).length;
    fireEvent.click(within(hand).getAllByRole('button', { name: /を捨てる$/ })[0]);

    // discardCard は pendingRef に積むだけで、実際の反映は次 tick の stepTick で確定する
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    await waitFor(() => {
      const after = within(screen.getByRole('group', { name: '手札' })).getAllByRole('button', {
        name: /を捨てる$/,
      }).length;
      expect(after).toBe(before - 1);
    });
  });

  it('手札の守り手を選んで経路セルをクリックすると、そこに置かれる（結線の到達確認）', () => {
    render(<AshenRampartGame />);
    startRunningWithStoneWallDeck();

    // aria-label は Task 7 で「[役割 ]カード名 コスト…」（例: 「壁 石壁 コスト1」）になったため
    // カード名を主語にした isHandButtonNameFor で探す
    fireEvent.click(screen.getByRole('button', { name: isHandButtonNameFor('石壁') }));
    const pathCell = laneOf(PLAINS_MAP, 0)[3]!;
    fireEvent.click(screen.getByTestId(`cell-${pathCell.x}-${pathCell.y}`));
    // 配置操作は pendingRef に積まれるだけで、次 tick の stepTick で確定する
    // （捨札と同じ非同期反映。「置ける」に見えて実際は置かれない欠陥を防ぐ）
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    // 旧 UnitHpBar（unit-hp-x-y）は台座レイヤの UnitPlate（unit-plate-x-y）に
    // 置き換わった（Task 5）
    expect(screen.getByTestId(`unit-plate-${pathCell.x}-${pathCell.y}`)).toBeInTheDocument();
  });

  it('設置物をカード未選択でタップすると、射程リングと能力チップが実画面に出て再タップで消える（結線の到達確認）', () => {
    // フック側テストは inspectedPlate が「返る」ことしか見ていない。
    // AshenRampartGame から `inspectedPlate={game.inspectedPlate}` を外しても、
    // あるいは `{game.inspectedPlate && <InspectPanel .../>}` を消しても、
    // prop が optional なので型は通りテストも落ちなかった（最終レビュー指摘F）。
    // ここは実物のツリーを描いて、その2本の結線を同時に守る。
    render(<AshenRampartGame />);
    startRunningWithArrowTowerDeck();

    fireEvent.click(screen.getByRole('button', { name: isHandButtonNameFor('弓兵') }));
    const pathCell = laneOf(PLAINS_MAP, 0)[3]!;
    const cellTestId = `cell-${pathCell.x}-${pathCell.y}`;
    fireEvent.click(screen.getByTestId(cellTestId));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    expect(screen.getByTestId(`unit-plate-${pathCell.x}-${pathCell.y}`)).toBeInTheDocument();

    // 置いた直後は選択が解除されているので、同じマスのタップは能力表示になる
    fireEvent.click(screen.getByTestId(cellTestId));
    expect(
      screen.getByTestId(`range-overlay-${pathCell.x}-${pathCell.y}`)
    ).toBeInTheDocument();
    expect(screen.getByTestId('inspect-panel')).toBeInTheDocument();
    expect(within(screen.getByTestId('inspect-panel')).getByText('攻撃塔 弓兵')).toBeInTheDocument();

    // 同じマスの再タップで閉じる
    fireEvent.click(screen.getByTestId(cellTestId));
    expect(
      screen.queryByTestId(`range-overlay-${pathCell.x}-${pathCell.y}`)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('inspect-panel')).not.toBeInTheDocument();
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
      submitRunNote();
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
      submitRunNote();

      fireEvent.click(screen.getByRole('button', { name: 'もう一度挑む' }));

      // カードを1枚も選び直さなくても既に DECK_SIZE 枚組まれており、開始できる
      expect(screen.getByText(`${DECK_SIZE} / ${DECK_SIZE}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeEnabled();
      expect(
        (screen.getByLabelText('シード（空欄なら毎回ランダム）') as HTMLInputElement).value
      ).toBe('321');
    });

    // 反復6 で徴発（levy）は構築・獲得の両プールから retired にした
    // （card-pool.ts・設計書 §4.6）。validateDeck が入手経路も検査するように
    // なったため（deck-builder.ts）、徴発を含むデッキは開始ボタンが無効化され、
    // もうランに持ち込めない。「徴発の候補を盤面から選べる」「一時停止中は
    // 候補ボタンが無効になる」という旧テストは、両プリセットから徴発が抜けた
    // ことでいずれも到達できないシナリオを検査していたため、この構築規則の
    // 結線（DeckBuilder → validateDeck → StartButton）を確かめるテストへ
    // 置き換える。徴発が実際に発動する挙動（山札の上3枚を見て1枚選ぶ）と、
    // その選択UI・一時停止中の無効化は、それぞれ
    // domain/combat/step-tick-levy.test.ts と presentation/LevyChoice.test.tsx が
    // 直接検証しており、こちらの置き換えによる影響を受けない。
    it('徴発を加えると開始ボタンが無効になり、理由が表示される（入手経路チェック・反復6・結線の到達確認）', () => {
      render(<AshenRampartGame />);
      fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
      expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeEnabled();

      fireEvent.click(screen.getByRole('button', { name: '徴発 を1枚増やす' }));

      expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeDisabled();
      expect(screen.getByText(/徴発は現在デッキに入れられません/)).toBeInTheDocument();
    });
  });

  it('勝敗の理由を記録するまで集計は表示されない（Task 12: 判定汚染防止のための表示順序）', async () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();

    // 決着直後は「記録する」欄だけで、集計・再挑戦・ログコピーはまだ出ない
    expect(screen.queryByText(/レーンへの配分/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'もう一度挑む' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '同じデッキで別のシードに挑む' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COPY_BUTTON_NAME })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/勝敗の理由を記録する/), {
      target: { value: '鴉を落とせなかった' },
    });
    fireEvent.click(screen.getByRole('button', { name: '記録する' }));

    // 記録した後にだけ集計・各ボタンが開く
    expect(await screen.findByText(/レーンへの配分/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'もう一度挑む' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY_BUTTON_NAME })).toBeInTheDocument();
  });

  it('restart（同じデッキで別のシードに挑む）すると集計の鍵と記録欄が次のランへ持ち越されない', async () => {
    render(<AshenRampartGame />);
    startRunning();
    advanceUntilRunEnds();
    submitRunNote('1回目の記録');
    expect(await screen.findByText(/レーンへの配分/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));

    // 盤面に留まったまま新しいランが始まり、記録前の状態（集計非表示・欄が空）に戻っている
    expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
    advanceUntilRunEnds();
    expect(screen.queryByText(/レーンへの配分/)).not.toBeInTheDocument();
    expect((screen.getByLabelText(/勝敗の理由を記録する/) as HTMLTextAreaElement).value).toBe('');
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
      // 反復2 で魔力炉が8枚になり、手札に同時に複数枚並ぶため先頭を取る
      // aria-label は Task 7 で「[役割 ]カード名 コスト…」になったため isHandButtonNameFor で探す
      reactorCard = within(hand).queryAllByRole('button', { name: isHandButtonNameFor('魔力炉') })[0] ?? null;
      if (reactorCard) break;
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
    }
    expect(reactorCard).not.toBeNull();

    fireEvent.click(reactorCard!);
    // 経路セル（魔力炉は経路外にしか置けない。§7.5）をクリックする。(0,2) は北レーンの入口
    fireEvent.click(screen.getByLabelText(/^0,2 経路/));
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
