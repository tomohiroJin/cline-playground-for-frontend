/**
 * KEYS & ARMS — ProgrammaticInputHandler（テスト用）
 * プログラムから入力をシミュレートするための InputHandler 実装。
 * 既存の createInputHandler を再エクスポートし、テスト用のヘルパーを追加する。
 */
import { createInputHandler } from '../core/input';
import type { InputHandler } from '../core/input';

/** テスト用に拡張された入力ハンドラー */
export interface ProgrammaticInputHandler extends InputHandler {
  /** キーを押して即離す（jp は残る） */
  pressAndRelease(key: string): void;
  /** 複数キーを同時に押す */
  pressKeys(keys: string[]): void;
}

/** テスト用入力ハンドラーを生成 */
export function createProgrammaticInputHandler(): ProgrammaticInputHandler {
  const base = createInputHandler();

  return {
    ...base,
    pressAndRelease(key: string): void {
      base.handleKeyDown(key);
      base.handleKeyUp(key);
    },
    pressKeys(keys: string[]): void {
      for (const key of keys) base.handleKeyDown(key);
    },
  };
}
