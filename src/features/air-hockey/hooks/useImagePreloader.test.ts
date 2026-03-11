/**
 * useImagePreloader フックのテスト
 * 画像のプリロード処理を管理するフック
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImagePreloader } from './useImagePreloader';

// Image オブジェクトのモック
type MockImage = {
  src: string;
  onload: (() => void) | null;
  onerror: ((err: Event) => void) | null;
};

const mockImages: MockImage[] = [];

beforeEach(() => {
  mockImages.length = 0;
  // グローバル Image コンストラクタをモック
  global.Image = jest.fn().mockImplementation(() => {
    const img: MockImage = {
      src: '',
      onload: null,
      onerror: null,
    };
    mockImages.push(img);
    return img;
  }) as unknown as typeof Image;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useImagePreloader', () => {
  describe('空配列', () => {
    it('空配列の場合は即座に isLoaded: true を返す', () => {
      const { result } = renderHook(() => useImagePreloader([]));
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.progress).toBe(1);
      expect(result.current.errors).toEqual([]);
    });
  });

  describe('正常ロード', () => {
    it('画像が全てロードされたら isLoaded: true になる', async () => {
      const urls = ['/img/a.png', '/img/b.png'];
      const { result } = renderHook(() => useImagePreloader(urls));

      // 初期状態はロード中
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.progress).toBe(0);

      // 全画像のロード完了をシミュレート
      act(() => {
        mockImages.forEach(img => img.onload?.());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
      expect(result.current.progress).toBe(1);
      expect(result.current.errors).toEqual([]);
    });

    it('ロード進捗が正しく更新される', async () => {
      const urls = ['/img/a.png', '/img/b.png', '/img/c.png'];
      const { result } = renderHook(() => useImagePreloader(urls));

      // 1枚目ロード完了
      act(() => {
        mockImages[0].onload?.();
      });

      await waitFor(() => {
        expect(result.current.progress).toBeCloseTo(1 / 3);
      });
      expect(result.current.isLoaded).toBe(false);

      // 2枚目ロード完了
      act(() => {
        mockImages[1].onload?.();
      });

      await waitFor(() => {
        expect(result.current.progress).toBeCloseTo(2 / 3);
      });

      // 3枚目ロード完了
      act(() => {
        mockImages[2].onload?.();
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
        expect(result.current.progress).toBe(1);
      });
    });

    it('Image オブジェクトに正しい src が設定される', () => {
      const urls = ['/img/a.png', '/img/b.png'];
      renderHook(() => useImagePreloader(urls));

      expect(mockImages).toHaveLength(2);
      expect(mockImages[0].src).toBe('/img/a.png');
      expect(mockImages[1].src).toBe('/img/b.png');
    });
  });

  describe('エラーハンドリング', () => {
    it('ロードエラーが発生しても isLoaded: true になる', async () => {
      const urls = ['/img/a.png', '/img/b.png'];
      const { result } = renderHook(() => useImagePreloader(urls));

      // 1枚目成功、2枚目エラー
      act(() => {
        mockImages[0].onload?.();
        mockImages[1].onerror?.(new Event('error'));
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
      expect(result.current.progress).toBe(1);
      expect(result.current.errors).toEqual(['/img/b.png']);
    });

    it('全てエラーでも isLoaded: true になる', async () => {
      const urls = ['/img/a.png', '/img/b.png'];
      const { result } = renderHook(() => useImagePreloader(urls));

      act(() => {
        mockImages.forEach(img => img.onerror?.(new Event('error')));
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
      expect(result.current.errors).toHaveLength(2);
    });
  });

  describe('URL変更時の再ロード', () => {
    it('urls が変更されたときにプリロードを再開する', async () => {
      const { result, rerender } = renderHook(
        ({ urls }) => useImagePreloader(urls),
        { initialProps: { urls: ['/img/a.png'] } }
      );

      // 最初のロード完了
      act(() => {
        mockImages[0].onload?.();
      });
      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      // URL変更
      rerender({ urls: ['/img/x.png', '/img/y.png'] });

      // 新しいロードが開始される
      expect(result.current.isLoaded).toBe(false);

      // 新しい画像のロード完了
      act(() => {
        // 新しく作られた Image オブジェクトの onload を呼ぶ
        mockImages.slice(1).forEach(img => img.onload?.());
      });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にイベントハンドラがクリーンアップされる', () => {
      const urls = ['/img/a.png'];
      const { unmount } = renderHook(() => useImagePreloader(urls));

      unmount();

      // アンマウント後にロード完了しても状態更新されない（エラーにならない）
      act(() => {
        mockImages[0].onload?.();
      });
      // エラーが発生しなければ成功
    });
  });
});
