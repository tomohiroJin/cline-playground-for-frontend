/**
 * Agile Quiz Sugoroku - イベント定数
 *
 * スプリントイベントと緊急対応イベントの定義
 */
import { GameEvent } from '../types';
import { COLORS } from './colors';

/** スプリントイベント */
const events: GameEvent[] = [
  { id: 'planning', name: 'プランニング', icon: '📋', description: '計画・合意', color: COLORS.accent },
  { id: 'impl1', name: '実装（1回目）', icon: '⌨️', description: '作り始め', color: COLORS.purple },
  { id: 'test1', name: 'テスト（1回目）', icon: '🧪', description: '確認', color: COLORS.cyan },
  { id: 'refinement', name: 'リファインメント', icon: '🔧', description: '整理・調整', color: COLORS.yellow },
  { id: 'impl2', name: '実装（2回目）', icon: '⌨️', description: '修正・対応', color: COLORS.purple },
  { id: 'test2', name: 'テスト（2回目）', icon: '✅', description: '最終確認', color: COLORS.green },
  { id: 'review', name: 'スプリントレビュー', icon: '📊', description: '共有・評価', color: COLORS.orange },
];
export const EVENTS: readonly GameEvent[] = Object.freeze(events);

/** 緊急対応イベント */
export const EMERGENCY_EVENT: GameEvent = Object.freeze({
  id: 'emergency',
  name: '緊急対応',
  icon: '🚨',
  description: '障害対応',
  color: COLORS.red,
});
