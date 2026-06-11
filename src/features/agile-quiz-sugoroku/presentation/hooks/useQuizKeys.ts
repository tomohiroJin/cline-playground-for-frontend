/**
 * クイズ画面キーボード入力フック
 * 回答選択（A/B/C/D, 1/2/3/4）と次へ進む（Enter/Space）を管理する
 */
import { useKeys } from './useKeys';

interface UseQuizKeysParams {
  answered: boolean;
  options: number[];
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
}

/**
 * クイズ画面のキーボード操作を管理する
 * - 未回答時: A/B/C/D または 1/2/3/4 キーで選択肢を選択
 * - 回答済み: Enter または Space で次へ進む
 */
export function useQuizKeys({
  answered,
  options,
  onAnswer,
  onNext,
}: UseQuizKeysParams): void {
  useKeys((e) => {
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') onNext();
      return;
    }
    const keyMap: { [key: string]: number } = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    const idx = keyMap[e.key.toLowerCase()];
    if (idx !== undefined && options[idx] !== undefined) onAnswer(options[idx]);
  });
}
