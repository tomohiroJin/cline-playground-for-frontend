import React from 'react';
import { render, screen } from '@testing-library/react';
import KeysAndArmsPage from './KeysAndArmsPage';

// Canvas の getContext をモック
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  quadraticCurveTo: jest.fn(),
  setLineDash: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  ellipse: jest.fn(),
  clearRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  shadowColor: '',
  shadowBlur: 0,
  lineDashOffset: 0,
  setValueAtTime: jest.fn(),
  exponentialRampToValueAtTime: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

// requestAnimationFrame をモック
jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
  return 1;
});

describe('KeysAndArmsPage', () => {
  it('Canvas 要素を含むゲーム画面を表示する', () => {
    const { container } = render(<KeysAndArmsPage />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('iframe を使用していない', () => {
    const { container } = render(<KeysAndArmsPage />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeNull();
  });

  it('仮想パッドボタンが表示される', () => {
    render(<KeysAndArmsPage />);
    expect(screen.getByText('ACT')).toBeInTheDocument();
    expect(screen.getByText('RST')).toBeInTheDocument();
  });
});
