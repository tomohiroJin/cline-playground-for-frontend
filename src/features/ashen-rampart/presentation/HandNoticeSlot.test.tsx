/**
 * 手札の上の通知の枠（反復7 段階2・設計書 §4.0 a）
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HandNoticeSlot, OVERFLOW_WARNING_TEXT } from './HandNoticeSlot';
import { appliedValueOf } from './applied-css';
import { HAND_NOTICE_LINE_PX, HAND_NOTICE_MAX_LINES } from './layout-constants';

describe('HandNoticeSlot', () => {
  it('通知が無くても2行ぶんの高さを占める', () => {
    render(<HandNoticeSlot willOverflow={false} maxShortage={0} />);
    const slot = screen.getByTestId('hand-notice-slot');

    expect(slot).toBeEmptyDOMElement();
    expect(appliedValueOf(slot, 'height')).toBe(`${HAND_NOTICE_LINE_PX * HAND_NOTICE_MAX_LINES}px`);
  });

  it('溢れて失った札・溢れそう・マナ不足をそれぞれ文で出す', () => {
    const { rerender } = render(<HandNoticeSlot overflowNotice="火砲台" willOverflow={false} maxShortage={0} />);
    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();

    rerender(<HandNoticeSlot willOverflow maxShortage={0} />);
    expect(screen.getByText(OVERFLOW_WARNING_TEXT)).toBeInTheDocument();

    rerender(<HandNoticeSlot willOverflow={false} maxShortage={2} />);
    expect(screen.getByText('マナが2足りません')).toBeInTheDocument();
  });

  it('3つ同時なら、優先順（失った > 溢れそう > マナ不足）の上位2つだけを出す', () => {
    render(<HandNoticeSlot overflowNotice="火砲台" willOverflow maxShortage={2} />);

    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();
    expect(screen.getByText(OVERFLOW_WARNING_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('マナが2足りません')).not.toBeInTheDocument();
  });

  it('溢れそうの文言は「あふれ」と「ライフ」を含み、360px で1行に収まる長さ', () => {
    expect(OVERFLOW_WARNING_TEXT).toMatch(/あふれ/);
    expect(OVERFLOW_WARNING_TEXT).toMatch(/ライフ/);
    expect(OVERFLOW_WARNING_TEXT.length).toBeLessThanOrEqual(24);
  });
});
