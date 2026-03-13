/**
 * 画像プリロードフック
 * P1-03: 画像プリロード基盤
 *
 * urls 配列の画像を並列でプリロードし、進捗を追跡する
 */
import { useState, useEffect, useRef } from 'react';

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
  // urls の内容が変わったときのみ参照を更新（参照安定化）
  const urlsKey = urls.join(',');
  const prevKeyRef = useRef(urlsKey);
  const stableUrlsRef = useRef(urls);
  if (prevKeyRef.current !== urlsKey) {
    prevKeyRef.current = urlsKey;
    stableUrlsRef.current = urls;
  }
  const stableUrls = stableUrlsRef.current;

  const [state, setState] = useState<PreloaderState>(() => ({
    isLoaded: stableUrls.length === 0,
    progress: stableUrls.length === 0 ? 1 : 0,
    errors: [],
  }));

  useEffect(() => {
    // 空配列の場合は即座に完了
    if (stableUrls.length === 0) {
      setState({ isLoaded: true, progress: 1, errors: [] });
      return;
    }

    // 新しいロード開始時に状態リセット
    setState({ isLoaded: false, progress: 0, errors: [] });

    let cancelled = false;
    const total = stableUrls.length;
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

    const images = stableUrls.map((url) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        updateState();
      };
      img.onerror = () => {
        console.warn(`[useImagePreloader] 画像の読み込みに失敗: ${url}`);
        loadedCount++;
        errorUrls.push(url);
        updateState();
      };
      img.src = url;
      return img;
    });

    return () => {
      cancelled = true;
      // クリーンアップ: イベントハンドラを無効化し、リソースを解放
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      });
    };
  }, [stableUrls]);

  return state;
}
