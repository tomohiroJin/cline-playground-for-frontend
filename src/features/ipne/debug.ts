/**
 * デバッグモード機能
 * 開発時のマップ確認やデバッグ情報表示に使用
 */

/** デバッグ状態 */
export interface DebugState {
  /** デバッグモードが有効か（URLパラメータで決定、変更不可） */
  enabled: boolean;
  /** デバッグパネルを表示するか（Dキーでトグル） */
  showPanel: boolean;
  /** 迷路全体を表示するか */
  showFullMap: boolean;
  /** 座標を表示するか */
  showCoordinates: boolean;
  /** スタート→ゴールのパスを表示するか */
  showPath: boolean;
}

/**
 * デバッグモードのデフォルト状態
 */
export const DEFAULT_DEBUG_STATE: DebugState = {
  enabled: false,
  showPanel: false,
  showFullMap: false,
  showCoordinates: false,
  showPath: false,
};

/**
 * URLパラメータでデバッグモードが有効かどうかを判定
 * /ipne?debug=1 でアクセスすると有効になる
 *
 * @returns デバッグモードが有効かどうか
 */
export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1';
}

/**
 * デバッグ状態を初期化
 *
 * @returns 初期化されたデバッグ状態
 */
export function initDebugState(): DebugState {
  const enabled = isDebugMode();

  return {
    ...DEFAULT_DEBUG_STATE,
    enabled,
    // デバッグモード時はパネルと全マップ表示をデフォルトで有効に
    showPanel: enabled,
    showFullMap: enabled,
  };
}

/**
 * デバッグオプションをトグル
 *
 * @param state - 現在のデバッグ状態
 * @param option - トグルするオプション
 * @returns 更新されたデバッグ状態
 */
export function toggleDebugOption(
  state: DebugState,
  option: keyof Omit<DebugState, 'enabled'>
): DebugState {
  return {
    ...state,
    [option]: !state[option],
  };
}

/**
 * デバッグパネルを描画
 *
 * @param ctx - Canvas 2D コンテキスト
 * @param state - デバッグ状態
 * @param info - 追加情報（プレイヤー座標など）
 */
export function drawDebugPanel(
  ctx: CanvasRenderingContext2D,
  state: DebugState,
  info: {
    playerX: number;
    playerY: number;
    viewportX: number;
    viewportY: number;
    mapWidth: number;
    mapHeight: number;
  }
): void {
  if (!state.enabled || !state.showPanel) return;

  const panelX = 10;
  const panelY = 10;
  const panelWidth = 200;
  const panelHeight = 138;
  const lineHeight = 18;

  // パネル背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // パネル枠
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // テキスト設定
  ctx.fillStyle = '#00ff00';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';

  let y = panelY + lineHeight;

  // デバッグ情報を表示
  ctx.fillText('DEBUG MODE', panelX + 10, y);
  y += lineHeight;

  ctx.fillText(`Player: (${info.playerX}, ${info.playerY})`, panelX + 10, y);
  y += lineHeight;

  ctx.fillText(`Viewport: (${info.viewportX}, ${info.viewportY})`, panelX + 10, y);
  y += lineHeight;

  ctx.fillText(`Map: ${info.mapWidth}x${info.mapHeight}`, panelX + 10, y);
  y += lineHeight;

  // オプション状態（Shift+キーで切替）
  ctx.fillText('Shift+: D F C P', panelX + 10, y);
  y += lineHeight;

  const options = [
    { key: 'D', label: 'Panel', value: state.showPanel },
    { key: 'F', label: 'FullMap', value: state.showFullMap },
    { key: 'C', label: 'Coords', value: state.showCoordinates },
    { key: 'P', label: 'Path', value: state.showPath },
  ];

  const optionText = options.map(o => `${o.key}${o.value ? '*' : ''}`).join(' ');
  ctx.fillText(optionText, panelX + 10, y);
}

/**
 * 座標オーバーレイを描画（デバッグ用）
 *
 * @param ctx - Canvas 2D コンテキスト
 * @param playerX - プレイヤーX座標
 * @param playerY - プレイヤーY座標
 * @param screenX - スクリーン上のX座標
 * @param screenY - スクリーン上のY座標
 */
export function drawCoordinateOverlay(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  screenX: number,
  screenY: number
): void {
  // プレイヤー位置の上に座標を表示
  ctx.fillStyle = '#ffff00';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`(${playerX},${playerY})`, screenX, screenY - 20);
}
