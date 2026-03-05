import React from 'react';
import { render, screen } from '@testing-library/react';
import { FaqAccordion } from './FaqAccordion';

const mockItems = [
  { question: 'Game Platform は無料ですか？', answer: 'はい、完全無料です。' },
  { question: 'ユーザー登録は必要ですか？', answer: 'いいえ、不要です。' },
  { question: 'どのブラウザで遊べますか？', answer: 'Chrome を推奨しています。' },
];

describe('FaqAccordion', () => {
  describe('基本レンダリング', () => {
    it('全ての質問が表示されること', () => {
      render(<FaqAccordion items={mockItems} />);
      for (const item of mockItems) {
        expect(screen.getByText(item.question)).toBeInTheDocument();
      }
    });

    it('details/summary 要素でレンダリングされること', () => {
      const { container } = render(<FaqAccordion items={mockItems} />);
      const details = container.querySelectorAll('details');
      const summaries = container.querySelectorAll('summary');
      expect(details).toHaveLength(3);
      expect(summaries).toHaveLength(3);
    });
  });

  describe('開閉動作', () => {
    it('初期状態で全項目が閉じていること', () => {
      const { container } = render(<FaqAccordion items={mockItems} />);
      const details = container.querySelectorAll('details');
      details.forEach((detail) => {
        expect(detail).not.toHaveAttribute('open');
      });
    });

    it('回答テキストが DOM に存在すること（details 展開時に表示される）', () => {
      render(<FaqAccordion items={mockItems} />);
      // details 内に回答テキストが存在する（ブラウザが details の開閉を制御する）
      expect(screen.getByText('はい、完全無料です。')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('details/summary がネイティブでアクセシブルであること', () => {
      const { container } = render(<FaqAccordion items={mockItems} />);
      // summary 要素はネイティブで操作可能
      const summaries = container.querySelectorAll('summary');
      expect(summaries).toHaveLength(3);
      summaries.forEach((summary) => {
        expect(summary).toBeInTheDocument();
      });
    });
  });
});
