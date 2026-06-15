/**
 * ゲームフレーム描画関数
 *
 * Game.tsx の描画 useEffect 本体を単一関数として抽出したもの。
 * 描画ロジック・順序は元 effect と完全に同一（純粋な move）。
 */
import {
  TileType,
  calculateViewport,
  calculateTileSize,
  getCanvasSize,
  findPath,
} from '../../../index';
import { SPRITE_SIZES } from '../../config';
import {
  FLOOR_SPRITE,
  WALL_SPRITE,
  getStageFloorSprite,
  getStageWallSprite,
} from '../../sprites';
import type { RenderContext, FrameContext } from './renderContext';
import type { Position, Viewport } from '../../../index';
import { drawWorld } from './drawWorld';
import { drawEnemies } from './drawEnemies';
import { combatEffects } from './combatEffects';
import { drawPlayer } from './drawPlayer';
import { drawOverlays } from './drawOverlays';

/**
 * ゲームフレームを描画する
 *
 * Game.tsx の描画 useEffect 本体を逐語移植したもの。
 * 描画順序・ロジックは元 effect と完全に同一。
 */
export function renderGameFrame(rc: RenderContext): void {
  const {
    canvas,
    canvasWrapperRef,
    map,
    player,
    goalPos,
    debugState,
    currentStage,
    effectManagerRef,
  } = rc;

  // 空マップの場合は描画しない
  if (map.length === 0 || !map[0]) return;

  const mapWidth = map[0].length;
  const mapHeight = map.length;

  // デバッグモードで全体表示の場合とビューポート表示の場合で分岐
  const useFullMap = debugState.enabled && debugState.showFullMap;

  let tileSize: number;
  let offsetX = 0;
  let offsetY = 0;
  let viewport: Viewport;

  // CanvasWrapper サイズからタイルサイズを動的に計算
  const wrapper = canvasWrapperRef.current;
  const availableWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
  const availableHeight = wrapper ? wrapper.clientHeight : window.innerHeight;
  const dynamicTileSize = calculateTileSize(availableWidth, availableHeight);

  if (useFullMap) {
    // 全体マップ表示：マップ全体が収まるようにタイルサイズを計算
    const canvasSize = getCanvasSize(dynamicTileSize);
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    tileSize = Math.min(
      Math.floor(canvasSize.width / mapWidth),
      Math.floor(canvasSize.height / mapHeight)
    );
    // 中央揃え
    offsetX = Math.floor((canvasSize.width - mapWidth * tileSize) / 2);
    offsetY = Math.floor((canvasSize.height - mapHeight * tileSize) / 2);
    // ダミーのビューポート（全体表示用）
    viewport = { x: 0, y: 0, width: mapWidth, height: mapHeight, tileSize };
  } else {
    // 通常のビューポート表示（動的 tileSize を使用）
    viewport = calculateViewport(player, mapWidth, mapHeight, dynamicTileSize);
    tileSize = viewport.tileSize;
    const canvasSize = getCanvasSize(tileSize);
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }

  // スタート位置を探す（パス描画用）
  let startPos: Position | null = null;
  for (let y = 0; y < mapHeight && !startPos; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (map[y][x] === TileType.START) {
        startPos = { x, y };
        break;
      }
    }
  }

  // パス計算（デバッグモードでパス表示が有効な場合）
  let path: Position[] = [];
  if (debugState.enabled && debugState.showPath && startPos) {
    path = findPath(map, startPos, goalPos);
  }

  // マップ描画（T-02.2: スプライト描画）
  const drawWidth = useFullMap ? mapWidth : viewport.width;
  const drawHeight = useFullMap ? mapHeight : viewport.height;
  const spriteScale = tileSize / SPRITE_SIZES.base;

  // ステージ別パレットのタイルスプライトを使用
  const stageFloor = currentStage ? getStageFloorSprite(currentStage) : FLOOR_SPRITE;
  const stageWall = currentStage ? getStageWallSprite(currentStage) : WALL_SPRITE;

  const toScreenPosition = (pos: Position): Position => {
    if (useFullMap) {
      return {
        x: offsetX + pos.x * tileSize + tileSize / 2,
        y: offsetY + pos.y * tileSize + tileSize / 2,
      };
    }
    return {
      x: (pos.x - viewport.x) * tileSize + tileSize / 2,
      y: (pos.y - viewport.y) * tileSize + tileSize / 2,
    };
  };

  // プレイヤーのスクリーン座標を先行計算（FrameContext 構築に必要）
  const playerScreen = toScreenPosition(player);

  // シェイクオフセット取得（drawWorld で save/translate、後段で restore するため両側で参照）
  const shakeOffset = effectManagerRef.current.getShakeOffset();

  // FrameContext を構築してワールド描画層へ渡す
  const frame: FrameContext = {
    ...rc,
    viewport, tileSize, offsetX, offsetY, useFullMap, drawWidth, drawHeight,
    spriteScale, stageFloor, stageWall, startPos, path, playerScreen, toScreenPosition,
  };

  // ワールド描画（背景・マップ・パス・罠・壁・アイテム）
  drawWorld(frame, shakeOffset);

  // 敵描画（敵スプライト・撃破アニメ・ボスHPオーラ・攻撃エフェクト）
  drawEnemies(frame);

  // 戦闘エフェクト処理（攻撃/被弾トリガー・外部キュー・エフェクト更新描画・フローティングテキスト）
  combatEffects(frame);

  // プレイヤー描画（プレイヤー本体・オーラ・シールド・残像・武器光跡・衝撃波・パーティクル）
  drawPlayer(frame);

  // オーバーレイ描画（低HP警告・コンボ・ボスWARNING・シェイク復元・暗転・ステージ演出・自動マップ・デバッグ）
  drawOverlays(frame, shakeOffset);
}
