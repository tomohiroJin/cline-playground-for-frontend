// メインコンポーネント
export { LabyrinthEchoGame } from './LabyrinthEchoGame';

// 契約・型
export { ErrorBoundary, safeSync, safeAsync } from './contracts';

// オーディオ
export { AudioEngine } from './audio';

// イベント
export { EV } from './events/event-data';
export { computeVignette, processChoice, validateEvents, pickEvent, findChainEvent } from './events/event-utils';

// ゲーム定義（ドメイン層から re-export）
export {
  FLOOR_META, FRESH_META, UNLOCKS, DIFFICULTY, ENDINGS, TITLES,
  UNLOCK_CATS, DEATH_FLAVORS, DEATH_TIPS,
  getUnlockedTitles, getActiveTitle, determineEnding,
} from './domain';
export { EVENT_TYPE } from './domain/constants/event-type-defs';

// スタイル
export { CSS, PAGE_STYLE } from './styles';

// カスタムフック（プレゼンテーション層から re-export）
export { useTextReveal } from './presentation/hooks/use-text-reveal';
export { useVisualFx } from './presentation/hooks/use-visual-fx';
export { useKeyboardControl } from './presentation/hooks/use-keyboard-control';
export { useImagePreload } from './presentation/hooks/use-image-preload';
