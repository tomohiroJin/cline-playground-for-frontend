import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useDocumentTitle } from './useDocumentTitle';

/** MemoryRouter でラップするヘルパー */
const renderWithRouter = (initialEntries: string[]) =>
  renderHook(() => useDocumentTitle(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
  });

describe('useDocumentTitle', () => {
  describe('正常系', () => {
    it('トップページでデフォルトタイトルを設定する', () => {
      renderWithRouter(['/']);
      expect(document.title).toBe('Game Platform');
    });

    it('ゲームページで対応するタイトルを設定する', () => {
      renderWithRouter(['/puzzle']);
      expect(document.title).toBe('Picture Puzzle | Game Platform');
    });

    it('IPNEページで正しいタイトルを設定する', () => {
      renderWithRouter(['/ipne']);
      expect(document.title).toBe('IPNE | Game Platform');
    });

    it('迷宮の残響ページで日本語タイトルを設定する', () => {
      renderWithRouter(['/labyrinth-echo']);
      expect(document.title).toBe('迷宮の残響 | Game Platform');
    });

    it('サイトについてページで正しいタイトルを設定する', () => {
      renderWithRouter(['/about']);
      expect(document.title).toBe('サイトについて | Game Platform');
    });

    it('プライバシーポリシーページで正しいタイトルを設定する', () => {
      renderWithRouter(['/privacy-policy']);
      expect(document.title).toBe('プライバシーポリシー | Game Platform');
    });

    it('利用規約ページで正しいタイトルを設定する', () => {
      renderWithRouter(['/terms']);
      expect(document.title).toBe('利用規約 | Game Platform');
    });

    it('お問い合わせページで正しいタイトルを設定する', () => {
      renderWithRouter(['/contact']);
      expect(document.title).toBe('お問い合わせ | Game Platform');
    });
  });

  describe('異常系', () => {
    it('未知のパスではデフォルトタイトルを設定する', () => {
      renderWithRouter(['/unknown-path']);
      expect(document.title).toBe('Game Platform');
    });
  });
});
