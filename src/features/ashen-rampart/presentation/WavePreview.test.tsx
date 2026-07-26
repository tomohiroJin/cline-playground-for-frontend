import React from 'react';
import { render, screen } from '@testing-library/react';
import { WavePreview } from './WavePreview';

describe('WavePreview', () => {
  describe('正常系', () => {
    it('次ウェーブの敵構成を種別と数で表示する', () => {
      render(<WavePreview waveIndex={1} />);

      // ウェーブ2 は 雑兵×6 ＋ 俊足×4
      expect(screen.getByText('雑兵 ×6')).toBeInTheDocument();
      expect(screen.getByText('俊足 ×4')).toBeInTheDocument();
    });

    it('何ウェーブ目かを表示する', () => {
      render(<WavePreview waveIndex={0} />);

      expect(screen.getByText(/次のウェーブ 1\/3/)).toBeInTheDocument();
    });

    it('重装を含むウェーブでも構成を表示する', () => {
      render(<WavePreview waveIndex={2} />);

      expect(screen.getByText('重装 ×2')).toBeInTheDocument();
    });
  });

  describe('異常系', () => {
    it('存在しないウェーブ添字では何も描画しない', () => {
      const { container } = render(<WavePreview waveIndex={99} />);

      expect(container).toBeEmptyDOMElement();
    });
  });
});
