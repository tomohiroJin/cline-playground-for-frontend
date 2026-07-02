/**
 * モバイル触覚フィードバック。
 * 非対応環境（navigator.vibrate 未実装 / SSR）では無害にスキップする。
 * reduced-motion 連動での抑制は呼び出し側で行い、本関数は純粋なラッパに保つ。
 */
export const vibrate = (ms: number): void => {
  if (ms <= 0) return;
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(ms);
  } catch {
    // 一部環境（ユーザー操作外・権限拒否）で例外となるため握りつぶす。
    // 触覚は機能低下のみで致命的でないため無視して継続する。
  }
};
