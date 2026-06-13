/**
 * OptionsPanel アクセシビリティテスト
 * radiogroup ロール・radio ロール・aria-live フィードバックを検証する
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OptionsPanel } from '../presentation/components/screens/QuizScreen/OptionsPanel';
import type { Question } from '../domain/types';

/** テスト用クイズデータ */
const mockQuiz: Question = {
  question: 'スクラムマスターの主な役割は？',
  options: ['プロジェクト管理', 'サーバント・リーダー', 'コード作成', '予算管理'],
  answer: 1,
};

/** 選択肢の並び順（0〜3のインデックス） */
const mockOptions = [0, 1, 2, 3];

describe('OptionsPanel アクセシビリティ', () => {
  it('選択肢グループが radiogroup ロールを持ち、選択肢が radio として公開される', () => {
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={null}
        onAnswer={jest.fn()}
      />
    );
    // radiogroup が存在すること
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    // 4つの radio ボタンが存在すること
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('各 radio ボタンに aria-label が設定される', () => {
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={null}
        onAnswer={jest.fn()}
      />
    );
    // 選択肢 A: プロジェクト管理
    expect(screen.getByRole('radio', { name: /選択肢 A: プロジェクト管理/ })).toBeInTheDocument();
    // 選択肢 B: サーバント・リーダー
    expect(screen.getByRole('radio', { name: /選択肢 B: サーバント・リーダー/ })).toBeInTheDocument();
  });

  it('未回答時は aria-checked がすべて false', () => {
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={null}
        onAnswer={jest.fn()}
      />
    );
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('回答選択後、選択した radio の aria-checked が true になる', () => {
    // selectedAnswer=1 （インデックス1のオプション、options[1]=1）
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={1}
        onAnswer={jest.fn()}
      />
    );
    // options[1] = 1 なので、2番目の radio が選択状態
    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('正解を選択後、aria-live リージョンに「正解です」が表示される', () => {
    // answer=1、selectedAnswer=1 → 正解
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={1}
        onAnswer={jest.fn()}
      />
    );
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('正解です');
  });

  it('不正解を選択後、aria-live リージョンに「不正解です」が表示される', () => {
    // answer=1、selectedAnswer=0 → 不正解
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={0}
        onAnswer={jest.fn()}
      />
    );
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('不正解です');
  });

  it('未回答時、aria-live リージョンは空', () => {
    render(
      <OptionsPanel
        quiz={mockQuiz}
        options={mockOptions}
        selectedAnswer={null}
        onAnswer={jest.fn()}
      />
    );
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent('');
  });
});
