/**
 * フェードアニメーション用フック
 */
import { useState, useCallback } from 'react';

interface UseFadeReturn {
  /** フェード表示状態 */
  visible: boolean;
  /** フェードアニメーションをトリガー */
  trigger: () => void;
}

/**
 * フェードイン/アウトアニメーション管理
 */
export function useFade(): UseFadeReturn {
  const [visible, setVisible] = useState(false);

  const trigger = useCallback(() => {
    // 一度非表示にしてからフェードイン
    setVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
      });
    });
  }, []);

  return { visible, trigger };
}
