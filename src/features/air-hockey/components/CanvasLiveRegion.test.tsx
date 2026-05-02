/**
 * CanvasLiveRegion のテスト
 *
 * Canvas 描画内容をスクリーンリーダーに露出するため、
 * aria-live 属性で DOM に同期メッセージを出力する。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CanvasLiveRegion } from './CanvasLiveRegion';

describe('CanvasLiveRegion', () => {
  it('message を表示する', () => {
    render(<CanvasLiveRegion message="スコアが入りました" />);
    expect(screen.getByText('スコアが入りました')).toBeInTheDocument();
  });

  it('aria-live="polite" をデフォルトで付ける', () => {
    const { container } = render(<CanvasLiveRegion message="情報" />);
    const el = container.querySelector('[aria-live]');
    expect(el).not.toBeNull();
    expect(el!.getAttribute('aria-live')).toBe('polite');
  });

  it('politeness="assertive" を指定できる', () => {
    const { container } = render(<CanvasLiveRegion message="勝敗" politeness="assertive" />);
    const el = container.querySelector('[aria-live]');
    expect(el!.getAttribute('aria-live')).toBe('assertive');
  });

  it('aria-atomic="true" を付ける', () => {
    const { container } = render(<CanvasLiveRegion message="a" />);
    const el = container.querySelector('[aria-live]');
    expect(el!.getAttribute('aria-atomic')).toBe('true');
  });

  it('role 属性は付けない（Codex P2-5: role=status + assertive 不整合回避）', () => {
    const { container } = render(<CanvasLiveRegion message="a" politeness="assertive" />);
    const el = container.querySelector('[aria-live]');
    expect(el!.hasAttribute('role')).toBe(false);
  });

  it('視覚的に隠されている（visually-hidden 相当）', () => {
    const { container } = render(<CanvasLiveRegion message="hidden" />);
    const el = container.querySelector('[aria-live]') as HTMLElement;
    const style = getComputedStyle(el);
    // position: absolute + width/height 1px は最低限の隠蔽サイン
    expect(style.position).toBe('absolute');
  });
});
