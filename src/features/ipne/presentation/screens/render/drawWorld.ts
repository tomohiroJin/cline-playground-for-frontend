/**
 * ワールド描画層（背景・マップ・パス・罠・壁・アイテム）
 *
 * renderGameFrame からの抽出。背景・マップ・パス・罠・壁・アイテムの
 * 描画順序は移植時のまま。
 */
import {
  TileType,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
} from '../../../index';
import { SPRITE_SIZES } from '../../config';
import {
  SpriteDefinition,
  SpriteSheetDefinition,
  GOAL_SPRITE_SHEET,
  START_SPRITE,
  getItemSprite,
  getTrapSpriteSheet,
  getWallSprite,
} from '../../sprites';
import { selectTileVariantIndex } from '../../sprites/tileVariation';
import type { FrameContext } from './renderContext';

/**
 * ワールド描画層を描画する（背景・マップ・パス・罠・壁・アイテム）
 *
 * renderGameFrame から切り出した純粋な move。
 * シェイクの save/translate は含むが restore は含まない（後段で復元）。
 * shakeOffset は renderGameFrame で1回だけ取得し引数として受け取る。
 */
export function drawWorld(
  frame: FrameContext,
  shakeOffset: { x: number; y: number } | null,
): void {
  const {
    ctx,
    canvas,
    now,
    map,
    player,
    items,
    traps,
    walls,
    debugState,
    spriteRenderer,
    viewport,
    tileSize,
    offsetX,
    offsetY,
    useFullMap,
    drawWidth,
    drawHeight,
    spriteScale,
    stageFloorVariants,
    stageWall,
    path,
    toScreenPosition,
    cameraOrigin,
  } = frame;

  const mapWidth = map[0]?.length ?? 0;
  const mapHeight = map.length;

  // 背景をクリア
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 画面シェイクオフセット適用（Phase 4）
  if (shakeOffset) {
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);
  }

  // マップ描画（T-02.2: スプライト描画）
  for (let vy = 0; vy < drawHeight; vy++) {
    for (let vx = 0; vx < drawWidth; vx++) {
      const worldX = useFullMap ? vx : viewport.x + vx;
      const worldY = useFullMap ? vy : viewport.y + vy;

      // マップ範囲外は描画しない
      if (worldX < 0 || worldX >= mapWidth || worldY < 0 || worldY >= mapHeight) {
        continue;
      }

      const tile = map[worldY][worldX];
      const tileDrawX = Math.round(offsetX + (worldX - cameraOrigin.x) * tileSize);
      const tileDrawY = Math.round(offsetY + (worldY - cameraOrigin.y) * tileSize);

      if (tile === TileType.WALL) {
        spriteRenderer.drawSprite(ctx, stageWall, tileDrawX, tileDrawY, spriteScale);
      } else if (tile === TileType.GOAL) {
        spriteRenderer.drawAnimatedSprite(ctx, GOAL_SPRITE_SHEET, now, tileDrawX, tileDrawY, spriteScale);
      } else if (tile === TileType.START) {
        spriteRenderer.drawSprite(ctx, START_SPRITE, tileDrawX, tileDrawY, spriteScale);
      } else {
        // 床: 座標ハッシュでバリアントを選択（決定論的・キャッシュ済み参照）
        const variant = stageFloorVariants[
          selectTileVariantIndex(worldX, worldY, stageFloorVariants.length)
        ];
        spriteRenderer.drawSprite(ctx, variant, tileDrawX, tileDrawY, spriteScale);
      }

      // グリッド線（全体表示時は省略）
      // 目地は床スプライトが担うため、補助線は気配程度に抑える
      if (!useFullMap) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeRect(tileDrawX, tileDrawY, tileSize, tileSize);
      }
    }
  }

  // パス描画（デバッグモードでパス表示が有効な場合）
  if (debugState.enabled && debugState.showPath && path.length > 1) {
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = Math.max(2, tileSize / 4);
    ctx.beginPath();

    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const screenX = offsetX + (p.x - cameraOrigin.x) * tileSize + tileSize / 2;
      const screenY = offsetY + (p.y - cameraOrigin.y) * tileSize + tileSize / 2;

      if (i === 0) {
        ctx.moveTo(screenX, screenY);
      } else {
        ctx.lineTo(screenX, screenY);
      }
    }
    ctx.stroke();
  }

  // MVP3: 罠描画（T-02.6: スプライト描画）
  for (const trap of traps) {
    // 職業に応じた可視性判定
    if (!canSeeTrap(player.playerClass, trap.state)) continue;

    const trapScreen = toScreenPosition(trap);
    const alpha = getTrapAlpha(player.playerClass, trap.state);
    const trapSheet = getTrapSpriteSheet(trap.type);
    const trapDrawSize = SPRITE_SIZES.base * spriteScale;
    const trapDrawX = trapScreen.x - trapDrawSize / 2;
    const trapDrawY = trapScreen.y - trapDrawSize / 2;

    ctx.globalAlpha = alpha;
    spriteRenderer.drawAnimatedSprite(ctx, trapSheet, now, trapDrawX, trapDrawY, spriteScale);
    ctx.globalAlpha = 1;
  }

  // MVP3: 特殊壁描画（T-02.7: スプライト描画）
  for (const wall of walls) {
    // 職業に応じた可視性判定
    if (!canSeeSpecialWall(player.playerClass, wall.type, wall.state)) continue;

    const wallScreen = toScreenPosition(wall);
    const alpha = getWallAlpha(player.playerClass, wall.type, wall.state);
    const wallSprite = getWallSprite(wall.type, wall.state);
    const wallDrawSize = SPRITE_SIZES.base * spriteScale;
    const wallDrawX = wallScreen.x - wallDrawSize / 2;
    const wallDrawY = wallScreen.y - wallDrawSize / 2;

    ctx.globalAlpha = alpha;
    spriteRenderer.drawSprite(ctx, wallSprite, wallDrawX, wallDrawY, spriteScale);
    ctx.globalAlpha = 1;
  }

  // アイテム描画（T-02.5: スプライト描画）
  for (const item of items) {
    const screenPos = toScreenPosition(item);
    const itemSpriteOrSheet = getItemSprite(item.type);
    const isSheet = 'sprites' in itemSpriteOrSheet;
    const spriteWidth = isSheet
      ? (itemSpriteOrSheet as SpriteSheetDefinition).sprites[0].width
      : (itemSpriteOrSheet as SpriteDefinition).width;
    const itemDrawSize = spriteWidth * spriteScale;
    const itemDrawX = screenPos.x - itemDrawSize / 2;
    const itemDrawY = screenPos.y - itemDrawSize / 2;

    if (isSheet) {
      spriteRenderer.drawAnimatedSprite(
        ctx, itemSpriteOrSheet as SpriteSheetDefinition, now, itemDrawX, itemDrawY, spriteScale
      );
    } else {
      spriteRenderer.drawSprite(
        ctx, itemSpriteOrSheet as SpriteDefinition, itemDrawX, itemDrawY, spriteScale
      );
    }
  }
}
