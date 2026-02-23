import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useFullScreenRoute } from './useFullScreenRoute';

/** MemoryRouter でラップするヘルパー */
const renderWithRouter = (initialEntries: string[]) =>
  renderHook(() => useFullScreenRoute(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
  });

describe('useFullScreenRoute', () => {
  describe('トップページ', () => {
    it('/ はヘッダー表示（false）と判定する', () => {
      const { result } = renderWithRouter(['/']);
      expect(result.current).toBe(false);
    });
  });

  describe('ゲームルート', () => {
    it('/puzzle はヘッダー非表示（true）と判定する', () => {
      const { result } = renderWithRouter(['/puzzle']);
      expect(result.current).toBe(true);
    });

    it('/air-hockey はヘッダー非表示（true）と判定する', () => {
      const { result } = renderWithRouter(['/air-hockey']);
      expect(result.current).toBe(true);
    });

    it('/ipne はヘッダー非表示（true）と判定する', () => {
      const { result } = renderWithRouter(['/ipne']);
      expect(result.current).toBe(true);
    });

    it('/risk-lcd はヘッダー非表示（true）と判定する', () => {
      const { result } = renderWithRouter(['/risk-lcd']);
      expect(result.current).toBe(true);
    });

    it('/maze-horror はヘッダー非表示（true）と判定する', () => {
      const { result } = renderWithRouter(['/maze-horror']);
      expect(result.current).toBe(true);
    });

    it('/primal-path はヘッダー非表示（true）と判定する', () => {
      const { result } = renderWithRouter(['/primal-path']);
      expect(result.current).toBe(true);
    });
  });
});
