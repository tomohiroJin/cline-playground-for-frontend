/**
 * 画像プリロードフック
 * P1-03: 画像プリロード基盤
 *
 * urls 配列の画像を並列でプリロードし、進捗を追跡する
 */
import { useState, useEffect, useMemo } from 'react';

type PreloaderState = {
  isLoaded: boolean;
  progress: number;
  errors: string[];
};

/**
 * 指定されたURL群の画像をプリロードする
 * - 空配列の場合は即座に isLoaded: true
 * - エラーが発生してもロード完了とみなす（フォールバック表示のため）
 * - アンマウント時にクリーンアップ
 */
export function useImagePreloader(urls: string[]): PreloaderState {
  const [state, setState] = useState<PreloaderState>(() => ({
    isLoaded: urls.length === 0,
    progress: urls.length === 0 ? 1 : 0,
    errors: [],
  }));

  // urls の内容が変わったときのみ再実行するためのキー
  const urlsKey = useMemo(() => urls.join(','), [urls]);

  useEffect(() => {
    // 空配列の場合は即座に完了
    if (urls.length === 0) {
      setState({ isLoaded: true, progress: 1, errors: [] });
      return;
    }

    // 新しいロード開始時に状態リセット
    setState({ isLoaded: false, progress: 0, errors: [] });

    let cancelled = false;
    const total = urls.length;
    let loadedCount = 0;
    const errorUrls: string[] = [];

    const updateState = () => {
      if (cancelled) return;
      const progress = loadedCount / total;
      setState({
        isLoaded: loadedCount >= total,
        progress,
        errors: [...errorUrls],
      });
    };

    const images = urls.map((url) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        updateState();
      };
      img.onerror = () => {
        loadedCount++;
        errorUrls.push(url);
        updateState();
      };
      img.src = url;
      return img;
    });

    return () => {
      cancelled = true;
      // クリーンアップ: イベントハンドラを無効化
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [urlsKey]);  // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
