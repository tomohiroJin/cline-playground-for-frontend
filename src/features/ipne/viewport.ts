/**
 * ビューポート/カメラシステム
 * プレイヤー周辺のみを表示するためのビューポート計算
 */
import { Position } from './types';

/** ビューポート設定 */
export interface Viewport {
  /** ビューポート左上のワールド座標（タイル単位） */
  x: number;
  /** ビューポート左上のワールド座標（タイル単位） */
  y: number;
  /** 表示するタイル数（横） */
  width: number;
  /** 表示するタイル数（縦） */
  height: number;
  /** 固定タイルサイズ（ピクセル） */
  tileSize: number;
}

/** ビューポート設定定数 */
export const VIEWPORT_CONFIG = {
  /** 横方向に表示するタイル数（視界を狭くして探索感を増す） */
  tilesX: 15,
  /** 縦方向に表示するタイル数（視界を狭くして探索感を増す） */
  tilesY: 11,
  /** 固定タイルサイズ（ピクセル）- プレイヤーを見やすくするため拡大 */
  tileSize: 48,
} as const;

/**
 * キャンバスサイズを計算
 */
export function getCanvasSize(): { width: number; height: number } {
  return {
    width: VIEWPORT_CONFIG.tilesX * VIEWPORT_CONFIG.tileSize,
    height: VIEWPORT_CONFIG.tilesY * VIEWPORT_CONFIG.tileSize,
  };
}

/**
 * プレイヤー位置を中心としたビューポートを計算
 * マップ端ではクランプして、ビューポートがマップ外に出ないようにする
 *
 * @param player - プレイヤー位置
 * @param mapWidth - マップの幅（タイル数）
 * @param mapHeight - マップの高さ（タイル数）
 * @returns 計算されたビューポート
 */
export function calculateViewport(
  player: Position,
  mapWidth: number,
  mapHeight: number
): Viewport {
  const halfW = Math.floor(VIEWPORT_CONFIG.tilesX / 2);
  const halfH = Math.floor(VIEWPORT_CONFIG.tilesY / 2);

  // プレイヤーを中心に配置
  let x = player.x - halfW;
  let y = player.y - halfH;

  // マップ端でクランプ（ビューポートがマップ外に出ないように）
  // マップがビューポートより小さい場合は0に固定
  const maxX = Math.max(0, mapWidth - VIEWPORT_CONFIG.tilesX);
  const maxY = Math.max(0, mapHeight - VIEWPORT_CONFIG.tilesY);

  x = Math.max(0, Math.min(x, maxX));
  y = Math.max(0, Math.min(y, maxY));

  return {
    x,
    y,
    width: VIEWPORT_CONFIG.tilesX,
    height: VIEWPORT_CONFIG.tilesY,
    tileSize: VIEWPORT_CONFIG.tileSize,
  };
}

/**
 * ワールド座標をスクリーン座標に変換
 *
 * @param worldX - ワールドX座標（タイル単位）
 * @param worldY - ワールドY座標（タイル単位）
 * @param viewport - 現在のビューポート
 * @returns スクリーン座標（ピクセル）、またはビューポート外の場合はnull
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: Viewport
): { x: number; y: number } | null {
  const screenX = worldX - viewport.x;
  const screenY = worldY - viewport.y;

  // ビューポート外かチェック
  if (
    screenX < 0 ||
    screenX >= viewport.width ||
    screenY < 0 ||
    screenY >= viewport.height
  ) {
    return null;
  }

  return {
    x: screenX * viewport.tileSize,
    y: screenY * viewport.tileSize,
  };
}

/**
 * プレイヤーがビューポート内にいるか確認
 *
 * @param player - プレイヤー位置
 * @param viewport - 現在のビューポート
 * @returns プレイヤーがビューポート内にいるかどうか
 */
export function isPlayerInViewport(player: Position, viewport: Viewport): boolean {
  const relX = player.x - viewport.x;
  const relY = player.y - viewport.y;

  return (
    relX >= 0 &&
    relX < viewport.width &&
    relY >= 0 &&
    relY < viewport.height
  );
}
