// コントローラーUIのテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChevronLeftIcon, ChevronRightIcon, CrosshairIcon } from '../../components/ControllerIcons';
import { GameController } from '../../components/GameController';

describe('ControllerIcons', () => {
  describe('ChevronLeftIcon', () => {
    it('SVG要素をレンダリングする', () => {
      const { container } = render(<ChevronLeftIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('左向きシェブロンのpolylineを含む', () => {
      const { container } = render(<ChevronLeftIcon />);
      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
      expect(polyline?.getAttribute('points')).toBe('15,18 9,12 15,6');
    });
  });

  describe('ChevronRightIcon', () => {
    it('SVG要素をレンダリングする', () => {
      const { container } = render(<ChevronRightIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('右向きシェブロンのpolylineを含む', () => {
      const { container } = render(<ChevronRightIcon />);
      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
      expect(polyline?.getAttribute('points')).toBe('9,6 15,12 9,18');
    });
  });

  describe('CrosshairIcon', () => {
    it('SVG要素をレンダリングする', () => {
      const { container } = render(<CrosshairIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('照準の円を含む', () => {
      const { container } = render(<CrosshairIcon />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('十字線を含む（4本のline要素）', () => {
      const { container } = render(<CrosshairIcon />);
      const lines = container.querySelectorAll('line');
      expect(lines).toHaveLength(4);
    });
  });
});

describe('GameController', () => {
  const mockMoveLeft = jest.fn();
  const mockMoveRight = jest.fn();
  const mockFire = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('3つのボタンをレンダリングする', () => {
    render(
      <GameController
        onMoveLeft={mockMoveLeft}
        onMoveRight={mockMoveRight}
        onFire={mockFire}
      />
    );
    expect(screen.getByLabelText('左に移動')).toBeInTheDocument();
    expect(screen.getByLabelText('射撃')).toBeInTheDocument();
    expect(screen.getByLabelText('右に移動')).toBeInTheDocument();
  });

  it('左ボタンクリックでonMoveLeftが呼ばれる', () => {
    render(
      <GameController
        onMoveLeft={mockMoveLeft}
        onMoveRight={mockMoveRight}
        onFire={mockFire}
      />
    );
    fireEvent.click(screen.getByLabelText('左に移動'));
    expect(mockMoveLeft).toHaveBeenCalledTimes(1);
  });

  it('右ボタンクリックでonMoveRightが呼ばれる', () => {
    render(
      <GameController
        onMoveLeft={mockMoveLeft}
        onMoveRight={mockMoveRight}
        onFire={mockFire}
      />
    );
    fireEvent.click(screen.getByLabelText('右に移動'));
    expect(mockMoveRight).toHaveBeenCalledTimes(1);
  });

  it('射撃ボタンクリックでonFireが呼ばれる', () => {
    render(
      <GameController
        onMoveLeft={mockMoveLeft}
        onMoveRight={mockMoveRight}
        onFire={mockFire}
      />
    );
    fireEvent.click(screen.getByLabelText('射撃'));
    expect(mockFire).toHaveBeenCalledTimes(1);
  });

  it('SVGアイコンを使用している（テキスト記号ではない）', () => {
    render(
      <GameController
        onMoveLeft={mockMoveLeft}
        onMoveRight={mockMoveRight}
        onFire={mockFire}
      />
    );
    // 矢印テキストや絵文字が含まれないことを確認
    expect(screen.queryByText('←')).not.toBeInTheDocument();
    expect(screen.queryByText('→')).not.toBeInTheDocument();
    expect(screen.queryByText('🎯')).not.toBeInTheDocument();
  });
});
