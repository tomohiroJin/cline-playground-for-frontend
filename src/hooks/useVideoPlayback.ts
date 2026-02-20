import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { videoPlaybackEnabledAtom, videoUrlAtom } from '../store/atoms';

/**
 * 動画再生の状態と操作を管理するカスタムフック
 */
export const useVideoPlayback = () => {
  // 状態
  const [videoPlaybackEnabled, setVideoPlaybackEnabled] = useAtom(videoPlaybackEnabledAtom);
  const [videoUrl, setVideoUrl] = useAtom(videoUrlAtom);

  /**
   * 動画再生モードのトグル
   */
  const toggleVideoPlayback = useCallback(() => {
    setVideoPlaybackEnabled(prev => !prev);
  }, [setVideoPlaybackEnabled]);

  /**
   * 動画再生モードを有効にする
   */
  const enableVideoPlayback = useCallback(() => {
    setVideoPlaybackEnabled(true);
  }, [setVideoPlaybackEnabled]);

  /**
   * 動画再生モードを無効にする
   */
  const disableVideoPlayback = useCallback(() => {
    setVideoPlaybackEnabled(false);
    setVideoUrl(null);
  }, [setVideoPlaybackEnabled, setVideoUrl]);

  /**
   * 再生する動画のURLを設定する
   *
   * @param url 動画のURL
   */
  const setVideo = useCallback(
    (url: string) => {
      setVideoUrl(url);
      enableVideoPlayback();
    },
    [setVideoUrl, enableVideoPlayback]
  );

  /**
   * 画像URLから対応する動画URLを生成する
   *
   * @param imageUrl 画像のURL
   * @returns 対応する動画のURL、無効なURLの場合はnull
   */
  const getVideoUrlFromImage = useCallback((imageUrl: string) => {
    if (!imageUrl) return null;

    // 画像ファイル名を抽出
    const imageFilename = imageUrl.split('/').pop();
    if (!imageFilename) return null;

    // 拡張子を除いたファイル名を取得
    const baseFilename = imageFilename.split('.')[0];

    // 有効なファイル名かチェック（デフォルト画像のファイル名のみ許可）
    const validFilenames = [
      'camel_in_the_desert',
      'chalk_drawing_kids',
      'snowy_mountain_ukiyoe',
      'midnight_neon_street',
      'moonlight_dancer',
      'sunset_candy_shop',
    ];

    if (!validFilenames.includes(baseFilename)) return null;

    // 対応する動画のURLを生成
    return `/videos/default/${baseFilename}.mp4`;
  }, []);

  return {
    videoPlaybackEnabled,
    videoUrl,
    toggleVideoPlayback,
    enableVideoPlayback,
    disableVideoPlayback,
    setVideo,
    getVideoUrlFromImage,
  };
};
