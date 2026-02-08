/**
 * IPNE チュートリアルシステム
 *
 * 初回プレイ時のチュートリアル表示と進行を管理
 */

import { TutorialState, TutorialStep, TutorialStepType, TutorialStepTypeValue } from './types';
import { STORAGE_KEYS } from './record';
import { StorageProvider, createBrowserStorageProvider } from './infrastructure/storage/StorageProvider';

/** チュートリアルステップの定義 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: TutorialStepType.MOVEMENT,
    title: '移動方法',
    text: 'WASDキーまたは矢印キーで移動できます。',
    condition: 'move',
  },
  {
    id: TutorialStepType.ATTACK,
    title: '攻撃方法',
    text: 'Spaceキーで攻撃できます。敵に近づいて攻撃しましょう。',
    condition: 'attack',
  },
  {
    id: TutorialStepType.MAP,
    title: 'マップ表示',
    text: 'Mキーでミニマップを表示/非表示できます。Tabキーで全体マップを表示できます。',
    condition: 'map',
  },
  {
    id: TutorialStepType.ITEM,
    title: 'アイテム',
    text: 'アイテムの上を通ると自動で取得できます。回復アイテムでHPを回復しましょう。',
    condition: 'item',
  },
  {
    id: TutorialStepType.TRAP,
    title: '罠に注意',
    text: '床には罠が隠されています。盗賊は罠を事前に見ることができます。',
    condition: 'trap',
  },
  {
    id: TutorialStepType.GOAL,
    title: 'ゴールを目指せ',
    text: '迷宮を探索してゴールを見つけましょう。クリアタイムで評価が決まります！',
    condition: 'goal',
  },
];

let tutorial_storage_provider: StorageProvider = createBrowserStorageProvider();

/**
 * チュートリアルモジュールのストレージ依存を差し替える
 * @param provider ストレージプロバイダ
 */
export function setTutorialStorageProvider(provider: StorageProvider): void {
  tutorial_storage_provider = provider;
}

/**
 * チュートリアルモジュールのストレージ依存をデフォルトに戻す
 */
export function resetTutorialStorageProvider(): void {
  tutorial_storage_provider = createBrowserStorageProvider();
}

/**
 * チュートリアル状態を初期化する
 * @returns 初期状態のチュートリアル
 */
export function initTutorial(): TutorialState {
  return {
    isCompleted: isTutorialCompleted(),
    currentStep: 0,
    isVisible: !isTutorialCompleted(),
  };
}

/**
 * チュートリアルが完了しているかを確認する
 * @returns 完了している場合true
 */
export function isTutorialCompleted(): boolean {
  try {
    return tutorial_storage_provider.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED) === 'true';
  } catch {
    return false;
  }
}

/**
 * チュートリアル完了をローカルストレージに保存する
 */
export function saveTutorialCompleted(): void {
  try {
    tutorial_storage_provider.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
  } catch {
    console.warn('チュートリアル完了状態の保存に失敗しました');
  }
}

/**
 * チュートリアルを次のステップに進める
 * @param state 現在のチュートリアル状態
 * @returns 更新されたチュートリアル状態
 */
export function advanceTutorialStep(state: TutorialState): TutorialState {
  const nextStep = state.currentStep + 1;

  // 全ステップ完了時
  if (nextStep >= TUTORIAL_STEPS.length) {
    saveTutorialCompleted();
    return {
      ...state,
      isCompleted: true,
      currentStep: nextStep,
      isVisible: false,
    };
  }

  return {
    ...state,
    currentStep: nextStep,
  };
}

/**
 * チュートリアルをスキップする
 * @param state 現在のチュートリアル状態
 * @returns 更新されたチュートリアル状態
 */
export function skipTutorial(state: TutorialState): TutorialState {
  saveTutorialCompleted();
  return {
    ...state,
    isCompleted: true,
    isVisible: false,
  };
}

/**
 * チュートリアルの表示/非表示を切り替える
 * @param state 現在のチュートリアル状態
 * @returns 更新されたチュートリアル状態
 */
export function toggleTutorialVisibility(state: TutorialState): TutorialState {
  return {
    ...state,
    isVisible: !state.isVisible,
  };
}

/**
 * 現在のチュートリアルステップを取得する
 * @param state チュートリアル状態
 * @returns 現在のステップ（完了している場合はundefined）
 */
export function getCurrentTutorialStep(state: TutorialState): TutorialStep | undefined {
  if (state.isCompleted || state.currentStep >= TUTORIAL_STEPS.length) {
    return undefined;
  }
  return TUTORIAL_STEPS[state.currentStep];
}

/**
 * チュートリアルテキストを取得する
 * @param state チュートリアル状態
 * @returns タイトルとテキスト（完了している場合はundefined）
 */
export function getTutorialText(state: TutorialState): { title: string; text: string } | undefined {
  const step = getCurrentTutorialStep(state);
  if (!step) {
    return undefined;
  }
  return {
    title: step.title,
    text: step.text,
  };
}

/**
 * 指定されたアクションでチュートリアルを進めるべきかを判定する
 * @param state チュートリアル状態
 * @param action 実行されたアクション
 * @returns 進めるべき場合true
 */
export function shouldAdvanceTutorial(state: TutorialState, action: string): boolean {
  const step = getCurrentTutorialStep(state);
  if (!step || !step.condition) {
    return false;
  }
  return step.condition === action;
}

/**
 * 指定されたステップIDのインデックスを取得する
 * @param stepId ステップID
 * @returns インデックス（見つからない場合は-1）
 */
export function getTutorialStepIndex(stepId: TutorialStepTypeValue): number {
  return TUTORIAL_STEPS.findIndex(step => step.id === stepId);
}

/**
 * チュートリアルの進行度を取得する
 * @param state チュートリアル状態
 * @returns 進行度（0.0〜1.0）
 */
export function getTutorialProgress(state: TutorialState): number {
  if (state.isCompleted) {
    return 1.0;
  }
  return state.currentStep / TUTORIAL_STEPS.length;
}
