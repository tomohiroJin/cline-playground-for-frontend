/**
 * StageView（反復7 段階1）: 1ステージの戦闘と決着パネル
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { StageView, SETTLE_TO_OFFER_LABEL, SETTLE_TO_SUMMARY_LABEL } from './StageView';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { PRESET_DECKS, getCardDefinition } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { CombatState } from '../domain/combat/combat-state';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';

const expedition = startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);
const initial = startStage(expedition, createSeededRandom);

const renderStage = (initialState: CombatState, isFinalStage: boolean) => {
  const onSettled = jest.fn();
  render(
    <StageView
      cards={expedition.deckCards}
      seed={42}
      map={PLAINS_MAP}
      initialState={initialState}
      expeditionId="exp-test"
      stageIndex={0}
      isFinalStage={isFinalStage}
      banner={<p>帯のテスト</p>}
      onSettled={onSettled}
    />
  );
  return onSettled;
};

/** 1 tick 進めれば決着するよう、ライフ0・進行中の状態を作る（stepTick が敗北を確定させる） */
const aboutToLose = (): CombatState => ({ ...initial, life: 0 });

describe('StageView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  it('帯・盤面・手札が出て、決着パネルはまだ出ない', () => {
    renderStage(initial, false);

    expect(screen.getByText('帯のテスト')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '手札' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_SUMMARY_LABEL })).not.toBeInTheDocument();
  });

  it('敗北すると「遠征の結果へ」だけが出て、押すと残ライフつきで onSettled が呼ばれる', () => {
    const onSettled = renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    expect(screen.getByText('城壁は灰燼に帰した')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_OFFER_LABEL })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SETTLE_TO_SUMMARY_LABEL }));
    expect(onSettled).toHaveBeenCalledWith({ won: false, lifeLeft: 0 });
  });

  it('決着ボタンは押すと無効になり、もう一度押しても onSettled は再度呼ばれない（PR #211 Fix B）', () => {
    // 二重クリックで settleStage が再描画前に2回呼ばれる経路をUI側でも塞ぐ
    const onSettled = renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    const settleButton = screen.getByRole('button', { name: SETTLE_TO_SUMMARY_LABEL });
    fireEvent.click(settleButton);
    expect(settleButton).toBeDisabled();

    fireEvent.click(settleButton);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('決着パネルには勝敗理由の記録欄・再挑戦・ログコピーを出さない（遠征の結果画面へ移した）', () => {
    renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    expect(screen.queryByLabelText(/勝敗の理由を記録する/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '同じデッキで別のシードに挑む' })).not.toBeInTheDocument();
  });

  it('最終ステージでなければ、勝って決着した状態で開くと「獲得へ進む」が出て、押すと残ライフつきで onSettled が呼ばれる（Minor 1）', () => {
    // outcome を最初から 'won' にしておく。ゲームループは outcome !== 'playing' では
    // 回らない（useAshenRampartGame.ts）ため、tick を進めずとも決着パネルが即座に出る
    const wonState: CombatState = { ...initial, outcome: 'won' };
    const onSettled = renderStage(wonState, false);

    expect(screen.getByRole('button', { name: SETTLE_TO_OFFER_LABEL })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SETTLE_TO_OFFER_LABEL }));
    expect(onSettled).toHaveBeenCalledWith({ won: true, lifeLeft: wonState.life });
  });

  it('最終ステージで勝って決着した状態で開くと「遠征の結果へ」が出る（Minor 1）', () => {
    const wonState: CombatState = { ...initial, outcome: 'won' };
    renderStage(wonState, true);

    expect(screen.getByRole('button', { name: SETTLE_TO_SUMMARY_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_OFFER_LABEL })).not.toBeInTheDocument();
  });
});

describe('敵の能力表示の結線（反復7 段階2・§4.3 #4）', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  it('凡例の「盾衛 の能力を見る」を押すと、盤面の下の枠に盾衛の能力表示が出て、もう一度押すと閉じる', () => {
    renderStage(initial, false);
    const button = screen.getByRole('button', { name: '盾衛 の能力を見る' });

    fireEvent.click(button);

    const slot = screen.getByTestId('board-info-slot');
    expect(slot).toHaveTextContent('敵 盾衛');
    expect(slot).toHaveTextContent('装甲4');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);

    expect(screen.queryByTestId('enemy-inspect-panel')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('札を選んだまま再点火できる燠火をタップしても、能力表示に「クリックで再点火」は出ない（isDuringCardSelection の配線）', () => {
    // 選択中はタップが能力表示に回り再点火は起きない（interactCell の分岐）。BoardInfoSlot へ
    // isDuringCardSelection を渡す配線（StageView.tsx）が外れると、この能力表示に
    // 「クリックで再点火」が出てしまう（選択中はタップしても再点火しないので嘘になる）。
    // コントローラの指摘どおり、この配線だけを検査する（この配線を一時的に外すと本テストは赤になる）。
    const emberPos = { x: 1, y: 1 };
    const stateWithEmber: CombatState = {
      ...initial,
      embers: [{ pos: emberPos, cooldownLeft: 0 }],
    };
    renderStage(stateWithEmber, false);

    // 配置が要る札（placementKindOf が 'none' ではない）を、払えるものの中から選ぶ。
    // 'none' の札（呪文・徴発）は選んだ瞬間に即座に使われて選択が外れ、次のセルタップは
    // 「選択なし」の経路（再点火が優先）に落ちる。その経路では能力表示自体が開かないため、
    // 「クリックで再点火が無い」が isDuringCardSelection の配線を経由せずに空虚に成立してしまう
    // （修正ラウンド1・レビュー Minor 1）。選択を保つ札で検査することでこれを避ける。
    const placeableIndex = stateWithEmber.deck.hand.findIndex(
      (cardId) =>
        placementKindOf(getCardDefinition(cardId)) !== 'none' &&
        getCardDefinition(cardId).cost <= stateWithEmber.mana
    );
    expect(placeableIndex).toBeGreaterThanOrEqual(0);
    const cardButtons = screen.getAllByRole('button', { name: /コスト/ });
    const target = cardButtons[placeableIndex]!;
    expect(target).not.toBeDisabled();
    fireEvent.click(target);

    fireEvent.click(screen.getByTestId(`cell-${emberPos.x}-${emberPos.y}`));

    // 選択が保たれたまま能力表示が実際に開いたことを確かめる。開いていなければ
    // 「クリックで再点火が無い」は選択が外れて再点火経路に落ちただけの空虚な成功になる
    const slot = screen.getByTestId('board-info-slot');
    expect(within(slot).getByTestId('inspect-panel')).toBeInTheDocument();
    expect(within(slot).queryByText('クリックで再点火')).not.toBeInTheDocument();
  });
});
