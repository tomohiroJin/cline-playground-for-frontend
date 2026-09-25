/**
 * 盤面の下の拒否理由と能力表示の枠（反復7 段階2・設計書 §4.0 a）
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BoardInfoSlot, INSPECT_HINT_TEXT } from './BoardInfoSlot';
import { buildPlates, type PlateModel } from './board-plates';
import { appliedValueOf } from './applied-css';
import { BOARD_INFO_SLOT_HEIGHT_PX, INSPECT_ROW_HEIGHT_PX } from './layout-constants';
import { createCombatState } from '../domain/combat/combat-state';

const arrowPlate = (): PlateModel => {
  const state = {
    ...createCombatState({ drawPile: [], hand: [], graveyard: [] }, []),
    units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 0 }],
  };
  const plate = buildPlates(state)[0];
  if (!plate) throw new Error('前提が壊れています: 弓兵の台座がありません');
  return plate;
};

describe('BoardInfoSlot', () => {
  it('何も出ていないときも同じ高さを占め、能力表示の導線を出す', () => {
    render(<BoardInfoSlot />);
    const slot = screen.getByTestId('board-info-slot');

    expect(appliedValueOf(slot, 'height')).toBe(`${BOARD_INFO_SLOT_HEIGHT_PX}px`);
    expect(screen.getByTestId('rejection-line')).toBeEmptyDOMElement();
    expect(screen.getByTestId('inspect-hint')).toHaveTextContent(INSPECT_HINT_TEXT);
    // 置いた札は選択中でも開けること、敵と凡例からも開けることを導線で伝える（反復7 段階2・§4.3 #4）
    expect(INSPECT_HINT_TEXT).toMatch(/選択中も可/);
    expect(INSPECT_HINT_TEXT).toMatch(/敵/);
    expect(INSPECT_HINT_TEXT).toMatch(/凡例/);
  });

  it('拒否理由と能力表示が同時に出ても、同じ枠の中に収まる', () => {
    render(<BoardInfoSlot rejectionNotice="そこには置けない" inspectedPlate={arrowPlate()} />);
    const slot = screen.getByTestId('board-info-slot');

    expect(within(slot).getByText('そこには置けない')).toHaveAttribute('data-tone', 'opportunity');
    expect(within(slot).getByTestId('inspect-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('inspect-hint')).not.toBeInTheDocument();
  });

  it('能力表示は1行の高さに固定し、チップは折り返さない', () => {
    render(<BoardInfoSlot inspectedPlate={arrowPlate()} />);
    const panel = screen.getByTestId('inspect-panel');

    expect(appliedValueOf(panel, 'height')).toBe(`${INSPECT_ROW_HEIGHT_PX}px`);
    expect(appliedValueOf(panel, 'flex-wrap')).toBe('nowrap');
  });
});

describe('敵の能力表示の行（反復7 段階2・§4.3 #4）', () => {
  it('敵の種類を渡すと、導線の代わりに同じ1行で敵の能力表示を出し、枠の高さは変わらない', () => {
    render(<BoardInfoSlot inspectedEnemyId="warden" />);
    const slot = screen.getByTestId('board-info-slot');

    expect(within(slot).getByTestId('enemy-inspect-panel')).toHaveTextContent('装甲4');
    expect(appliedValueOf(within(slot).getByTestId('enemy-inspect-panel'), 'height')).toBe(
      `${INSPECT_ROW_HEIGHT_PX}px`
    );
    expect(appliedValueOf(slot, 'height')).toBe(`${BOARD_INFO_SLOT_HEIGHT_PX}px`);
    expect(screen.queryByTestId('inspect-hint')).not.toBeInTheDocument();
  });

  it('設置物と敵が両方渡っても、1行に出すのは設置物だけ（行を2つにしない）', () => {
    render(<BoardInfoSlot inspectedPlate={arrowPlate()} inspectedEnemyId="warden" />);

    expect(screen.getByTestId('inspect-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('enemy-inspect-panel')).not.toBeInTheDocument();
  });
});
