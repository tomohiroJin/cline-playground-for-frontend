/**
 * フィールド/アイテムアンロックシステム
 * 勝利数やアチーブメントで新しいフィールド・アイテムを解放する
 */
import { Difficulty } from './types';

const STORAGE_KEY = 'ah_unlock_state';

/** アンロック状態 */
export type UnlockState = {
  unlockedFields: string[];
  unlockedItems: string[];
  totalWins: number;
};

/** アンロック判定に使うコンテキスト */
export type UnlockContext = {
  isWin: boolean;
  difficulty: Difficulty;
  fieldId: string;
};

/** アンロック条件の定義 */
export type UnlockCondition = {
  id: string;
  type: 'field' | 'item';
  targetId: string;
  description: string;
  check: (state: UnlockState, ctx: UnlockContext) => boolean;
};

/** 初期状態で利用可能なフィールド */
const INITIAL_FIELDS = ['classic', 'wide'];

/** 初期状態で利用可能なアイテム */
const INITIAL_ITEMS = ['split', 'speed', 'invisible'];

/** アンロック条件一覧 */
export const UNLOCK_CONDITIONS: UnlockCondition[] = [
  // フィールドアンロック
  {
    id: 'unlock_pillars',
    type: 'field',
    targetId: 'pillars',
    description: '3勝でアンロック',
    check: (state) => state.totalWins >= 3,
  },
  {
    id: 'unlock_zigzag',
    type: 'field',
    targetId: 'zigzag',
    description: '5勝でアンロック',
    check: (state) => state.totalWins >= 5,
  },
  {
    id: 'unlock_fortress',
    type: 'field',
    targetId: 'fortress',
    description: '8勝でアンロック',
    check: (state) => state.totalWins >= 8,
  },
  {
    id: 'unlock_bastion',
    type: 'field',
    targetId: 'bastion',
    description: '12勝でアンロック',
    check: (state) => state.totalWins >= 12,
  },
  // アイテムアンロック
  {
    id: 'unlock_shield',
    type: 'item',
    targetId: 'shield',
    description: 'Normal以上で3勝',
    check: (state) => state.totalWins >= 3,
  },
  {
    id: 'unlock_magnet',
    type: 'item',
    targetId: 'magnet',
    description: 'Hard で勝利',
    check: (_state, ctx) => ctx.isWin && ctx.difficulty === 'hard',
  },
  {
    id: 'unlock_big',
    type: 'item',
    targetId: 'big',
    description: '10勝でアンロック',
    check: (state) => state.totalWins >= 10,
  },
];

/** 初期アンロック状態を生成 */
function createInitialState(): UnlockState {
  return {
    unlockedFields: [...INITIAL_FIELDS],
    unlockedItems: [...INITIAL_ITEMS],
    totalWins: 0,
  };
}

/** アンロック状態を読み込む */
export function getUnlockState(): UnlockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // 読み込み失敗時はデフォルト値
  }
  return createInitialState();
}

/** アンロック状態を保存する */
export function saveUnlockState(state: UnlockState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** フィールドがアンロック済みか確認する */
export function isFieldUnlocked(state: UnlockState, fieldId: string): boolean {
  return state.unlockedFields.includes(fieldId);
}

/** アイテムがアンロック済みか確認する */
export function isItemUnlocked(state: UnlockState, itemId: string): boolean {
  return state.unlockedItems.includes(itemId);
}

/**
 * 試合結果に基づいてアンロック状態を更新する
 * 新しいアンロックが発生した場合は更新後の状態を返す
 */
export function checkUnlocks(state: UnlockState, ctx: UnlockContext): UnlockState {
  const newState: UnlockState = {
    unlockedFields: [...state.unlockedFields],
    unlockedItems: [...state.unlockedItems],
    totalWins: state.totalWins + (ctx.isWin ? 1 : 0),
  };

  for (const cond of UNLOCK_CONDITIONS) {
    const alreadyUnlocked = cond.type === 'field'
      ? newState.unlockedFields.includes(cond.targetId)
      : newState.unlockedItems.includes(cond.targetId);

    if (alreadyUnlocked) continue;

    if (cond.check(newState, ctx)) {
      if (cond.type === 'field') {
        newState.unlockedFields.push(cond.targetId);
      } else {
        newState.unlockedItems.push(cond.targetId);
      }
    }
  }

  return newState;
}
