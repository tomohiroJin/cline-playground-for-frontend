/**
 * キーボード入力を処理し、プレイヤーのマレット位置を更新するフック
 */
import { useEffect, useRef, RefObject } from 'react';
import { GameState } from '../core/types';
import { CONSTANTS } from '../core/constants';
import {
  createKeyboardState,
  updateKeyboardState,
  calculateKeyboardMovement,
  KeyboardState,
} from '../core/keyboard';

export function useKeyboardInput(
  gameRef: RefObject<GameState | null>,
  lastInputRef: React.MutableRefObject<number>,
  screen: string,
  showHelp: boolean,
  setShowHelp: (v: boolean) => void
) {
  const keysRef = useRef<KeyboardState>(createKeyboardState());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game') return;
      // ポーズ・ヘルプ系のキーは既存ハンドラに任せる
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') return;

      if (showHelp) {
        setShowHelp(false);
        return;
      }

      const updated = updateKeyboardState(keysRef.current, e.key, true);
      if (updated !== keysRef.current) {
        keysRef.current = updated;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const updated = updateKeyboardState(keysRef.current, e.key, false);
      if (updated !== keysRef.current) {
        keysRef.current = updated;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, showHelp, setShowHelp]);

  // 画面遷移時にキー状態をリセット
  useEffect(() => {
    if (screen !== 'game') {
      keysRef.current = createKeyboardState();
    }
  }, [screen]);

  return keysRef;
}

/**
 * ゲームループ内で呼び出してキーボード移動を適用する
 */
export function applyKeyboardMovement(
  game: GameState,
  keysRef: React.MutableRefObject<KeyboardState>,
  lastInputRef: React.MutableRefObject<number>
): void {
  const keys = keysRef.current;
  const hasInput = keys.up || keys.down || keys.left || keys.right;
  if (!hasInput) return;

  lastInputRef.current = Date.now();

  const result = calculateKeyboardMovement(
    keys,
    { x: game.player.x, y: game.player.y },
    CONSTANTS
  );

  game.player.vx = result.vx;
  game.player.vy = result.vy;
  game.player.x = result.x;
  game.player.y = result.y;
}
