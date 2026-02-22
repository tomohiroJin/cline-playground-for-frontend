/**
 * Agile Quiz Sugoroku - メインエクスポート
 */

// 型定義
export * from './types';

// 定数
export * from './constants';

// クイズデータ
export { QUESTIONS } from './quiz-data';

// タグマスタ
export { TAG_MASTER, VALID_TAG_IDS, TAG_MAP } from './questions/tag-master';
export type { TagDefinition } from './questions/tag-master';

// ゲームロジック
export * from './game-logic';
export * from './answer-processor';
export { classifyEngineerType } from './engineer-classifier';
export { getComboColor } from './combo-color';

// 音声
export * from './audio/sound';
export * from './audio/audio-actions';

// フック
export * from './hooks';

// コンポーネント
export * from './components';
