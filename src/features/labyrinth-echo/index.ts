// メインコンポーネント
export { LabyrinthEchoGame } from './LabyrinthEchoGame';

// 契約・型
export { ErrorBoundary, safeSync, safeAsync } from './contracts';

// オーディオ
export { AudioEngine } from './audio';

// イベント
export { EV } from './events/event-data';
export { computeVignette, processChoice, validateEvents, pickEvent, findChainEvent } from './events/event-utils';

// ゲーム定義
export {
  FLOOR_META, EVENT_TYPE, FRESH_META, TITLES, ENDINGS,
  getUnlockedTitles, getActiveTitle, determineEnding,
  UNLOCK_CATS, DEATH_FLAVORS, DEATH_TIPS,
} from './definitions';

// スタイル
export { CSS, PAGE_STYLE } from './styles';

// カスタムフック
export { useTextReveal, usePersistence, useVisualFx } from './hooks';
