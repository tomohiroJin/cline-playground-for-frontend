/**
 * アイテム設定（core/config.ts から分離）
 */
import type { ItemType } from '../../core/types';

export type ItemConfig = Readonly<{
  id: ItemType;
  name: string;
  color: string;
  icon: string;
}>;

export const DOMAIN_ITEMS: readonly ItemConfig[] = [
  { id: 'split', name: 'Split', color: '#FF6B6B', icon: '◆' },
  { id: 'speed', name: 'Speed', color: '#4ECDC4', icon: '⚡' },
  { id: 'invisible', name: 'Hide', color: '#9B59B6', icon: '👻' },
  { id: 'shield', name: 'Shield', color: '#FFD700', icon: '🛡' },
  { id: 'magnet', name: 'Magnet', color: '#FF6B35', icon: '🧲' },
  { id: 'big', name: 'Big', color: '#00FF88', icon: '⬆' },
] as const;
