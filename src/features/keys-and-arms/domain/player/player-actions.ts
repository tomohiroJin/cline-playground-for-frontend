/**
 * プレイヤーアクション（純粋関数）
 *
 * 移動、攻撃、ガード等のアクション判定を担当する。
 */

/** アクションキー判定 */
export function isActionKey(key: string): boolean {
  const k = key.toLowerCase();
  return k === 'z' || k === ' ';
}

/** 方向キーの判定 */
export function getDirection(key: string): 'up' | 'down' | 'left' | 'right' | undefined {
  switch (key.toLowerCase()) {
    case 'arrowup': return 'up';
    case 'arrowdown': return 'down';
    case 'arrowleft': return 'left';
    case 'arrowright': return 'right';
    default: return undefined;
  }
}
