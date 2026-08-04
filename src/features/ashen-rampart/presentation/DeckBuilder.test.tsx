/**
 * デッキ構築 UI のテスト
 *
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを検証する。
 * 検証ロジックはドメインの validateDeck を使うため、ここでは
 * 「UI が検証結果を正しく反映するか」を見る。
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DeckBuilder } from './DeckBuilder';
import { cardBadgesOf } from './card-text';
import { getUnitVisual, roleLabelOf } from './unit-visual';
import { CARD_IDS, DECK_SIZE, PRESET_DECKS, getCardDefinition } from '../domain/cards/card-pool';
import { HEADER_CLEARANCE } from './layout-constants';

describe('DeckBuilder', () => {
  it('画面上端にフローティングホームボタンぶんの余白がある', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    // フローティングホームボタン（App.tsx, position: fixed）は常に画面左上に
    // 重なるため、共通側を変更せずこちら側で余白を確保して吸収する
    expect(screen.getByTestId('ashen-rampart-deckbuilder-layout')).toHaveAttribute(
      'data-header-clearance',
      HEADER_CLEARANCE
    );
  });

  it('14種すべてが名前とコスト付きで並ぶ', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    CARD_IDS.forEach((id) => {
      const card = getCardDefinition(id);
      // eslint-disable-next-line security/detect-non-literal-regexp
      expect(screen.getByRole('group', { name: new RegExp(card.name) })).toBeInTheDocument();
    });
  });

  it('各カードに「効かない相手」が表示される', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getByText('飛行に当たらない')).toBeInTheDocument();
  });

  it('指摘5: 守り手にはHPと攻撃力が表示される（石壁60/0と弓兵8/4の逆相関が読める）', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getByText('HP60 / 攻撃0')).toBeInTheDocument();
    expect(screen.getByText('HP8 / 攻撃4')).toBeInTheDocument();
  });

  it('指摘5: 守り手でないカード（魔力炉）にはHP表示が無い', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    const reactorRow = screen.getByRole('group', { name: /魔力炉/ });
    expect(within(reactorRow).queryByText(/^HP/)).not.toBeInTheDocument();
  });

  it('初期状態では0枚で、開始できない', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getByText(`0 / ${DECK_SIZE}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeDisabled();
  });

  it('カードを足すと枚数が増える', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '弓兵 を1枚増やす' }));
    expect(screen.getByText(`1 / ${DECK_SIZE}`)).toBeInTheDocument();
  });

  it('同名の上限に達すると増やすボタンが無効になる', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    const add = screen.getByRole('button', { name: '弓兵 を1枚増やす' });
    fireEvent.click(add);
    fireEvent.click(add);
    fireEvent.click(add);
    expect(add).toBeDisabled();
  });

  it('魔力炉は4枚以上でも追加できる', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    const addReactor = screen.getByRole('button', { name: '魔力炉 を1枚増やす' });
    for (let i = 0; i < 6; i++) fireEvent.click(addReactor);
    expect(addReactor).not.toBeDisabled();
  });

  it('減らすボタンで枚数が減り、0枚では無効', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    const remove = screen.getByRole('button', { name: '弓兵 を1枚減らす' });
    expect(remove).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '弓兵 を1枚増やす' }));
    expect(remove).toBeEnabled();
    fireEvent.click(remove);
    expect(screen.getByText(`0 / ${DECK_SIZE}`)).toBeInTheDocument();
  });

  it('プリセットを読み込むと20枚になり開始できる', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    expect(screen.getByText(`${DECK_SIZE} / ${DECK_SIZE}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeEnabled();
  });

  it('開始すると組んだカード配列が渡る', () => {
    const onStart = jest.fn();
    render(<DeckBuilder onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    const [cards] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(cards).toHaveLength(DECK_SIZE);
    expect([...cards].sort()).toEqual([...PRESET_DECKS.swift!.cards].sort());
  });

  it('シードを入力すると開始時に渡る', () => {
    const onStart = jest.fn();
    render(<DeckBuilder onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.change(screen.getByLabelText('シード（空欄なら毎回ランダム）'), {
      target: { value: '4242' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    const [, seed] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(seed).toBe(4242);
  });

  it('シードが空欄なら undefined が渡る（毎回ランダム）', () => {
    const onStart = jest.fn();
    render(<DeckBuilder onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    const [, seed] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(seed).toBeUndefined();
  });

  it('20枚に足りないと理由が表示される', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '弓兵 を1枚増やす' }));
    expect(screen.getByText(/20枚ちょうどにしてください/)).toBeInTheDocument();
  });

  it('コスト曲線が表示される', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    expect(screen.getByRole('list', { name: 'コスト曲線' })).toBeInTheDocument();
  });

  it('initialCards を渡すと、そのデッキ枚数から始まる（指摘4: 再挑戦のたびに組み直させない）', () => {
    render(<DeckBuilder onStart={jest.fn()} initialCards={PRESET_DECKS.heavy!.cards} />);
    expect(screen.getByText(`${DECK_SIZE} / ${DECK_SIZE}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeEnabled();
  });

  it('initialSeedText を渡すと、シード欄がその値で始まる', () => {
    const onStart = jest.fn();
    render(
      <DeckBuilder
        onStart={onStart}
        initialCards={PRESET_DECKS.swift!.cards}
        initialSeedText="777"
      />
    );
    const seedInput = screen.getByLabelText('シード（空欄なら毎回ランダム）') as HTMLInputElement;
    expect(seedInput.value).toBe('777');
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    const [, seed] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(seed).toBe(777);
  });

  it('14種すべてのカードに形アイコンが出る', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    CARD_IDS.forEach((id) => {
      expect(screen.getByTestId(`card-glyph-${id}`)).toBeInTheDocument();
    });
  });

  it('14種すべてのカードに役割名が出る', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    CARD_IDS.forEach((id) => {
      const roleLabel = roleLabelOf(getUnitVisual(id).role);
      expect(screen.getAllByText(roleLabel).length).toBeGreaterThan(0);
    });
  });

  it('属性バッジを持つカードにバッジが出る', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    // 各カードのバッジが画面に出ていることを確認
    // getAllByText を使って複数ヒットに対応
    const collectedBadges = new Set<string>();
    CARD_IDS.forEach((id) => {
      const badges = cardBadgesOf(id);
      badges.forEach((badge) => {
        collectedBadges.add(badge);
      });
    });
    collectedBadges.forEach((badge) => {
      expect(screen.getAllByText(badge).length).toBeGreaterThan(0);
    });
  });
});
