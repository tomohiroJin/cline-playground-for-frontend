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
  describe('フルスクリーンルート', () => {
    it('/ipne はフルスクリーンと判定する', () => {
      const { result } = renderWithRouter(['/ipne']);
      expect(result.current).toBe(true);
    });

    it('/risk-lcd はフルスクリーンと判定する', () => {
      const { result } = renderWithRouter(['/risk-lcd']);
      expect(result.current).toBe(true);
    });

    it('/maze-horror はフルスクリーンと判定する', () => {
      const { result } = renderWithRouter(['/maze-horror']);
      expect(result.current).toBe(true);
    });

    it('/primal-path はフルスクリーンと判定する', () => {
      const { result } = renderWithRouter(['/primal-path']);
      expect(result.current).toBe(true);
    });
  });

  describe('通常ルート', () => {
    it('/ は通常ルートと判定する', () => {
      const { result } = renderWithRouter(['/']);
      expect(result.current).toBe(false);
    });

    it('/puzzle は通常ルートと判定する', () => {
      const { result } = renderWithRouter(['/puzzle']);
      expect(result.current).toBe(false);
    });

    it('/air-hockey は通常ルートと判定する', () => {
      const { result } = renderWithRouter(['/air-hockey']);
      expect(result.current).toBe(false);
    });
  });
});
