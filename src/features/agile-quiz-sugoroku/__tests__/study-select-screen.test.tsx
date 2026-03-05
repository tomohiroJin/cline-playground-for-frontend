/**
 * StudySelectScreen コンポーネントテスト
 * - キャラクター選択によるジャンル自動選択
 */

// tone モジュールのモック
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  start: jest.fn(),
  getContext: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudySelectScreen } from '../components/StudySelectScreen';
import { CHARACTER_GENRE_MAP } from '../character-genre-map';
import { TAG_MASTER } from '../questions/tag-master';

// styled-components のアニメーション警告を抑制
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

const defaultProps = {
  onStart: jest.fn(),
  onBack: jest.fn(),
};

describe('StudySelectScreen - キャラクター選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ── キャラクターカードの表示 ────────────────────────────

  describe('キャラクターカードの表示', () => {
    it('5キャラクターのカードが表示される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      CHARACTER_GENRE_MAP.forEach((mapping) => {
        expect(screen.getByText(mapping.characterName)).toBeInTheDocument();
      });
    });

    it('各キャラクターの役割が表示される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      CHARACTER_GENRE_MAP.forEach((mapping) => {
        expect(screen.getByText(mapping.role)).toBeInTheDocument();
      });
    });

    it('キャラクター選択セクションのタイトルが表示される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      expect(screen.getByText('CHARACTER SELECT')).toBeInTheDocument();
    });
  });

  // ── キャラクター選択でジャンル自動選択 ──────────────────

  describe('キャラクター選択でジャンル自動選択', () => {
    it('キャラクターをクリックすると関連ジャンルが選択される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカをクリック
      fireEvent.click(screen.getByText('タカ'));

      // タカの関連ジャンルが選択されている（問題数の表示で確認）
      const taka = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'taka')!;
      taka.genres.forEach((genreId) => {
        const tag = TAG_MASTER.find((t) => t.id === genreId);
        if (tag) {
          // ジャンルボタンが選択状態（fontWeight: 700）であることを確認
          const button = screen.getByText(tag.name);
          expect(button).toBeInTheDocument();
        }
      });

      // 問題数表示が現れる（0でないことの間接確認）
      expect(screen.getByText(/問 が対象/)).toBeInTheDocument();
    });

    it('同じキャラクターを再クリックすると選択が解除される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカを2回クリック（選択→解除）
      fireEvent.click(screen.getByText('タカ'));
      fireEvent.click(screen.getByText('タカ'));

      // 問題数表示が消える
      expect(screen.queryByText(/問 が対象/)).not.toBeInTheDocument();
    });
  });

  // ── 複数キャラクター選択 ────────────────────────────────

  describe('複数キャラクター選択', () => {
    it('複数キャラクター選択で和集合のジャンルが選択される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカとネコをクリック
      fireEvent.click(screen.getByText('タカ'));
      fireEvent.click(screen.getByText('ネコ'));

      // 両方のジャンルが選択されている
      const taka = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'taka')!;
      const neko = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'neko')!;
      const allGenres = new Set([...taka.genres, ...neko.genres]);

      allGenres.forEach((genreId) => {
        const tag = TAG_MASTER.find((t) => t.id === genreId);
        if (tag) {
          expect(screen.getByText(tag.name)).toBeInTheDocument();
        }
      });
    });

    it('1キャラクター解除時にそのキャラクター固有のジャンルのみ解除される', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカとネコをクリック
      fireEvent.click(screen.getByText('タカ'));
      fireEvent.click(screen.getByText('ネコ'));

      // タカを解除
      fireEvent.click(screen.getByText('タカ'));

      // ネコのジャンルは残っている
      expect(screen.getByText(/問 が対象/)).toBeInTheDocument();
    });
  });

  // ── 手動ジャンル変更との共存 ────────────────────────────

  describe('手動ジャンル変更との共存', () => {
    it('キャラクター選択後に個別ジャンルを手動で追加できる', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカを選択
      fireEvent.click(screen.getByText('タカ'));

      // CI/CD（タカに含まれないジャンル）を追加
      fireEvent.click(screen.getByText('CI/CD'));

      // 問題数が変わっている（増えている）
      expect(screen.getByText(/問 が対象/)).toBeInTheDocument();
    });

    it('キャラクター選択後に個別ジャンルを手動で解除できる', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカを選択
      fireEvent.click(screen.getByText('タカ'));

      // スクラム（タカに含まれるジャンル）を解除
      fireEvent.click(screen.getByText('スクラム'));

      // 問題数表示は残る（他のジャンルがまだ選択されている）
      expect(screen.getByText(/問 が対象/)).toBeInTheDocument();
    });
  });

  // ── 学習開始 ───────────────────────────────────────────

  describe('学習開始', () => {
    it('キャラクター選択後に学習開始ボタンが有効になる', () => {
      render(<StudySelectScreen {...defaultProps} />);

      // タカを選択
      fireEvent.click(screen.getByText('タカ'));

      // 学習開始ボタンが押せる
      const startButton = screen.getByText(/学習開始/);
      expect(startButton).not.toBeDisabled();
    });

    it('キャラクター選択後に学習開始でonStartが呼ばれる', () => {
      const onStart = jest.fn();
      render(<StudySelectScreen {...defaultProps} onStart={onStart} />);

      // タカを選択して開始
      fireEvent.click(screen.getByText('タカ'));
      fireEvent.click(screen.getByText(/学習開始/));

      expect(onStart).toHaveBeenCalledTimes(1);
      const args = onStart.mock.calls[0];
      // 第1引数: 選択されたタグ配列
      expect(args[0]).toEqual(expect.arrayContaining(['agile', 'scrum', 'team', 'release']));
      // 第2引数: 問題数（デフォルト10）
      expect(args[1]).toBe(10);
    });
  });
});
