/**
 * IncorrectReview コンポーネントのテスト
 *
 * ブックマークボタンのトグル動作と LocalStorage への永続化を検証する。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncorrectReview } from '../presentation/components/IncorrectReview';
import { BookmarkRepository } from '../infrastructure/storage/bookmark-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';
import type { AnswerResultWithDetail, Question } from '../domain/types';

/** テスト用の不正解問題データ */
const sampleItem: AnswerResultWithDetail = {
  questionText: 'スクラムのタイムボックス単位はどれか？',
  options: ['スプリント', 'カンバン', 'ウォーターフォール', 'V字モデル'],
  selectedAnswer: 1,
  correctAnswer: 0,
  correct: false,
  tags: ['scrum'],
  explanation: 'スクラムでは Sprint をタイムボックスの単位とする。',
  eventId: 'planning',
};

/** sampleItem に対応する Question（記録検証用） */
const sampleQuestion: Question = {
  question: sampleItem.questionText,
  options: sampleItem.options,
  answer: sampleItem.correctAnswer,
  tags: sampleItem.tags,
  explanation: sampleItem.explanation,
};

describe('IncorrectReview', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('問題が 0 件のとき何も描画しない', () => {
    const { container } = render(<IncorrectReview questions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('不正解問題が描画される', () => {
    render(<IncorrectReview questions={[sampleItem]} />);
    expect(screen.getByText(sampleItem.questionText)).toBeInTheDocument();
    expect(screen.getByText(/あなたの回答:/)).toBeInTheDocument();
    expect(screen.getByText(/正解:/)).toBeInTheDocument();
  });

  describe('ブックマークボタン', () => {
    it('初期状態でブックマーク未設定のとき ☆ アイコンを表示する', () => {
      render(<IncorrectReview questions={[sampleItem]} />);
      const btn = screen.getByRole('button', { name: 'ブックマークに追加' });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      expect(btn.textContent).toBe('☆');
    });

    it('ブックマークボタンをクリックすると ★ に変わる', () => {
      render(<IncorrectReview questions={[sampleItem]} />);
      const btn = screen.getByRole('button', { name: 'ブックマークに追加' });

      fireEvent.click(btn);

      expect(screen.getByRole('button', { name: 'ブックマーク解除' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ブックマーク解除' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'ブックマーク解除' }).textContent).toBe('★');
    });

    it('ブックマーク後に再クリックすると ☆ に戻る', () => {
      render(<IncorrectReview questions={[sampleItem]} />);
      const btn = screen.getByRole('button', { name: 'ブックマークに追加' });

      fireEvent.click(btn);
      fireEvent.click(screen.getByRole('button', { name: 'ブックマーク解除' }));

      expect(screen.getByRole('button', { name: 'ブックマークに追加' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ブックマークに追加' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('ブックマークボタンをクリックすると LocalStorage に保存される', () => {
      render(<IncorrectReview questions={[sampleItem]} />);
      const btn = screen.getByRole('button', { name: 'ブックマークに追加' });

      fireEvent.click(btn);

      const repo = new BookmarkRepository(new LocalStorageAdapter());
      expect(repo.isBookmarked(sampleQuestion)).toBe(true);
    });

    it('再クリックで LocalStorage からブックマークが削除される', () => {
      render(<IncorrectReview questions={[sampleItem]} />);
      const btn = screen.getByRole('button', { name: 'ブックマークに追加' });

      fireEvent.click(btn);
      fireEvent.click(screen.getByRole('button', { name: 'ブックマーク解除' }));

      const repo = new BookmarkRepository(new LocalStorageAdapter());
      expect(repo.isBookmarked(sampleQuestion)).toBe(false);
    });

    it('LocalStorage にブックマーク済みの場合は初期状態で ★ を表示する', () => {
      // 事前にブックマークを設定
      const repo = new BookmarkRepository(new LocalStorageAdapter());
      repo.toggle(sampleQuestion, Date.now());

      render(<IncorrectReview questions={[sampleItem]} />);

      expect(screen.getByRole('button', { name: 'ブックマーク解除' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ブックマーク解除' }).textContent).toBe('★');
    });
  });
});
