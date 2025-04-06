import { renderHook, act } from '@testing-library/react';
import { useVideoPlayback } from './useVideoPlayback';
import { Provider } from 'jotai';

describe('useVideoPlayback', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>;

  it('初期状態では動画再生モードが無効であること', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });
    expect(result.current.videoPlaybackEnabled).toBe(false);
    expect(result.current.videoUrl).toBeNull();
  });

  it('enableVideoPlayback を呼び出すと動画再生モードが有効になること', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    act(() => {
      result.current.enableVideoPlayback();
    });

    expect(result.current.videoPlaybackEnabled).toBe(true);
  });

  it('disableVideoPlayback を呼び出すと動画再生モードが無効になり、URLがクリアされること', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    act(() => {
      result.current.setVideo('/videos/test.mp4');
    });

    expect(result.current.videoPlaybackEnabled).toBe(true);
    expect(result.current.videoUrl).toBe('/videos/test.mp4');

    act(() => {
      result.current.disableVideoPlayback();
    });

    expect(result.current.videoPlaybackEnabled).toBe(false);
    expect(result.current.videoUrl).toBeNull();
  });

  it('toggleVideoPlayback を呼び出すと動画再生モードが切り替わること', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    expect(result.current.videoPlaybackEnabled).toBe(false);

    act(() => {
      result.current.toggleVideoPlayback();
    });

    expect(result.current.videoPlaybackEnabled).toBe(true);

    act(() => {
      result.current.toggleVideoPlayback();
    });

    expect(result.current.videoPlaybackEnabled).toBe(false);
  });

  it('setVideo を呼び出すと動画URLが設定され、再生モードが有効になること', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    act(() => {
      result.current.setVideo('/videos/test.mp4');
    });

    expect(result.current.videoUrl).toBe('/videos/test.mp4');
    expect(result.current.videoPlaybackEnabled).toBe(true);
  });

  it('getVideoUrlFromImage が画像URLから正しい動画URLを生成すること', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    const imageUrl = '/images/default/camel_in_the_desert.png';
    const expectedVideoUrl = '/videos/default/camel_in_the_desert.mp4';

    expect(result.current.getVideoUrlFromImage(imageUrl)).toBe(expectedVideoUrl);
  });

  it('getVideoUrlFromImage が無効な画像URLに対してnullを返すこと', () => {
    const { result } = renderHook(() => useVideoPlayback(), { wrapper });

    expect(result.current.getVideoUrlFromImage('')).toBeNull();
    expect(result.current.getVideoUrlFromImage('invalid-url')).toBeNull();
  });
});
