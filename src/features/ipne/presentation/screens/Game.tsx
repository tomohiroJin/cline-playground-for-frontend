/**
 * ゲーム画面コンポーネント群（統合モジュール）
 * GameScreen をメインコンポーネントとして、GameHUD, GameControls, GameCanvas, GameModals を統合
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GameRegion,
} from '../../../../pages/IpnePage.styles';
import {
  Direction,
  TileType,
  GameMap,
  Player,
  Enemy,
  Item,
  AutoMapState,
  calculateViewport,
  calculateTileSize,
  getCanvasSize,
  Viewport,
  DebugState,
  drawDebugPanel,
  drawCoordinateOverlay,
  findPath,
  Position,
  MovementState,
  INITIAL_MOVEMENT_STATE,
  EnemyState,
  EnemyType,
  drawAutoMap,
  // MVP3追加
  Trap,
  Wall,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
  StageNumber,
} from '../../index';
import { GameTimer } from '../../application/services/timerService';
import { SPRITE_SIZES } from '../config';
import {
  EffectManager, EffectType, DeathEffect,
  FloatingTextManager, calculatePowerLevel,
  getDeathPhase, getDeathScale, isDeathAnimationComplete,
  createBossWarningState, shouldTriggerWarning, getWarningPhase, getBossAuraConfig,
  BOSS_WARNING_DURATION,
} from '../effects';
import type { BossWarningState } from '../effects';
import { isComboActive, COMBO_DISPLAY_MIN } from '../../domain/services/comboService';
import {
  SpriteRenderer,
  SpriteDefinition,
  SpriteSheetDefinition,
  FLOOR_SPRITE,
  WALL_SPRITE,
  getStageFloorSprite,
  getStageWallSprite,
  GOAL_SPRITE_SHEET,
  START_SPRITE,
  getPlayerSpriteSheet,
  getEnemySpriteSheet,
  getItemSprite,
  getTrapSpriteSheet,
  getWallSprite,
  ATTACK_SLASH_SPRITE_SHEET,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  THIEF_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
  THIEF_DAMAGE_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  THIEF_IDLE_SPRITE_SHEETS,
  PATROL_ATTACK_FRAME,
  CHARGE_RUSH_FRAME,
  RANGED_CAST_FRAME,
  SPECIMEN_MUTATE_FRAME,
  BOSS_ATTACK_FRAME,
  BOSS_DAMAGE_FRAME,
  MINI_BOSS_ATTACK_FRAME,
  MINI_BOSS_DAMAGE_FRAME,
  MEGA_BOSS_ATTACK_FRAME,
  MEGA_BOSS_DAMAGE_FRAME,
} from '../sprites';
import { drawPlayerAura } from '../effects/aura';
import { drawWeaponTrail, getWeaponTier, WeaponTier, drawShockwave } from '../effects/weaponEffect';
import { getActiveRewardEffects, drawShieldGlow, drawAfterImage, drawSpinParticles, drawHealParticles, AfterImageManager } from '../effects/stageVisual';
import { getStageIntroPhase, getStageIntroAlpha, getStageIntroTextAlpha, getGameOverTransitionAlpha } from '../effects/screenTransition';

// 分割コンポーネントのインポート
import { GameHUD } from './GameHUD';
import { GameControls } from './GameControls';
import { GameCanvas } from './GameCanvas';

// re-export（後方互換性維持）
export { ClassSelectScreen, LevelUpOverlayComponent, HelpOverlayComponent } from './GameModals';
export type { EffectEvent } from './GameModals';

/** 敵の状態に応じた特殊フレームを返す（Phase 3） */
function getEnemyStateFrame(enemyType: string, enemyState: string): SpriteDefinition | null {
  if (enemyState === EnemyState.ATTACK) {
    switch (enemyType) {
      case EnemyType.PATROL: return PATROL_ATTACK_FRAME;
      case EnemyType.CHARGE: return CHARGE_RUSH_FRAME;
      case EnemyType.RANGED: return RANGED_CAST_FRAME;
      case EnemyType.SPECIMEN: return SPECIMEN_MUTATE_FRAME;
      case EnemyType.BOSS: return BOSS_ATTACK_FRAME;
      case EnemyType.MINI_BOSS: return MINI_BOSS_ATTACK_FRAME;
      case EnemyType.MEGA_BOSS: return MEGA_BOSS_ATTACK_FRAME;
    }
  }
  if (enemyState === EnemyState.KNOCKBACK) {
    switch (enemyType) {
      case EnemyType.BOSS: return BOSS_DAMAGE_FRAME;
      case EnemyType.MINI_BOSS: return MINI_BOSS_DAMAGE_FRAME;
      case EnemyType.MEGA_BOSS: return MEGA_BOSS_DAMAGE_FRAME;
    }
  }
  return null;
}

/**
 * ゲーム画面コンポーネント
 */
export const GameScreen: React.FC<{
  map: GameMap;
  player: Player;
  enemies: Enemy[];
  items: Item[];
  traps: Trap[];
  walls: Wall[];
  mapState: AutoMapState;
  goalPos: { x: number; y: number };
  debugState: DebugState;
  onMove: (direction: (typeof Direction)[keyof typeof Direction]) => void;
  onTurn: (direction: (typeof Direction)[keyof typeof Direction]) => void;
  onAttack: () => void;
  onMapToggle: () => void;
  onDebugToggle: (option: keyof Omit<DebugState, 'enabled'>) => void;
  attackEffect?: { position: Position; until: number };
  lastDamageAt: number;
  // MVP4追加
  timer: GameTimer;
  showHelp: boolean;
  onHelpToggle: () => void;
  // MVP6追加
  showKeyRequiredMessage: boolean;
  // レベルアップポイント制
  pendingLevelPoints: number;
  onOpenLevelUpModal: () => void;
  // エフェクトシステム
  effectQueueRef?: React.MutableRefObject<import('./GameModals').EffectEvent[]>;
  // フローティングテキスト
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>;
  // コンボ状態
  comboStateRef?: React.MutableRefObject<import('../../domain/services/comboService').ComboState>;
  // 死亡アニメーション中フラグ
  isDying?: boolean;
  // 5ステージ制
  currentStage?: StageNumber;
  maxLevel?: number;
  // ステージ報酬履歴（ステージ進行見た目変化用）
  stageRewards?: import('../../types').StageRewardHistory[];
}> = ({
  map,
  player,
  enemies,
  items,
  traps,
  walls,
  mapState,
  goalPos,
  debugState,
  onMove,
  onTurn,
  onAttack,
  onMapToggle,
  onDebugToggle,
  attackEffect,
  lastDamageAt,
  // MVP4追加
  timer,
  showHelp,
  onHelpToggle,
  // MVP6追加
  showKeyRequiredMessage,
  // レベルアップポイント制
  pendingLevelPoints,
  onOpenLevelUpModal,
  // エフェクトシステム
  effectQueueRef,
  // フローティングテキスト
  floatingTextManagerRef,
  // コンボ状態
  comboStateRef,
  // 死亡アニメーション中フラグ
  isDying = false,
  // 5ステージ制
  currentStage,
  maxLevel = 10,
  // ステージ報酬履歴
  stageRewards = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const movementStateRef = useRef<MovementState>(INITIAL_MOVEMENT_STATE);
  const [renderTime, setRenderTime] = useState(0);

  // エフェクトシステム
  const effectManagerRef = useRef(new EffectManager());
  const lastAttackEffectKeyRef = useRef<string | null>(null);
  const lastDamageAtRef = useRef(0);

  // 死亡エフェクト
  const deathEffectRef = useRef(new DeathEffect());

  // ボスWARNING状態
  const bossWarningRef = useRef<BossWarningState>(createBossWarningState());

  // ステージ開始演出タイムスタンプ
  const stageStartTimeRef = useRef<number>(Date.now());

  // ゲームオーバー遷移タイムスタンプ
  const dyingStartTimeRef = useRef<number>(0);

  // ステージ進行見た目変化
  const afterImageManagerRef = useRef(new AfterImageManager());
  const rewardEffects = useMemo(() => getActiveRewardEffects(stageRewards), [stageRewards]);

  // アニメーション状態管理（Phase 3）
  const playerAttackUntilRef = useRef(0);  // 攻撃アニメーション終了時刻
  const playerDamageUntilRef = useRef(0);  // 被弾フレーム終了時刻

  // スプライトレンダラー（T-02.1）
  const spriteRenderer = useMemo(() => new SpriteRenderer(), []);

  // リサイズ時のスプライトキャッシュクリア
  useEffect(() => {
    const container = canvasWrapperRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let debounceTimer = 0;
    const observer = new ResizeObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        spriteRenderer.clearCache();
      }, 200);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [spriteRenderer]);

  // 死亡アニメーション開始
  useEffect(() => {
    if (isDying) {
      deathEffectRef.current.start(Date.now());
      dyingStartTimeRef.current = Date.now();
    } else {
      deathEffectRef.current.reset();
    }
  }, [isDying]);

  // ステージ変更時にステージ開始演出をリセット
  useEffect(() => {
    stageStartTimeRef.current = Date.now();
  }, [currentStage]);

  // 点滅表現用の再描画トリガー
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 空マップの場合は描画しない
    if (map.length === 0 || !map[0]) return;

    const mapWidth = map[0].length;
    const mapHeight = map.length;
    const now = renderTime;

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

    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画面シェイクオフセット適用（Phase 4）
    const shakeOffset = effectManagerRef.current.getShakeOffset();
    if (shakeOffset) {
      ctx.save();
      ctx.translate(shakeOffset.x, shakeOffset.y);
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

    for (let vy = 0; vy < drawHeight; vy++) {
      for (let vx = 0; vx < drawWidth; vx++) {
        const worldX = useFullMap ? vx : viewport.x + vx;
        const worldY = useFullMap ? vy : viewport.y + vy;

        // マップ範囲外は描画しない
        if (worldX < 0 || worldX >= mapWidth || worldY < 0 || worldY >= mapHeight) {
          continue;
        }

        const tile = map[worldY][worldX];
        const tileDrawX = offsetX + vx * tileSize;
        const tileDrawY = offsetY + vy * tileSize;

        if (tile === TileType.WALL) {
          spriteRenderer.drawSprite(ctx, stageWall, tileDrawX, tileDrawY, spriteScale);
        } else if (tile === TileType.GOAL) {
          spriteRenderer.drawAnimatedSprite(ctx, GOAL_SPRITE_SHEET, now, tileDrawX, tileDrawY, spriteScale);
        } else if (tile === TileType.START) {
          spriteRenderer.drawSprite(ctx, START_SPRITE, tileDrawX, tileDrawY, spriteScale);
        } else {
          spriteRenderer.drawSprite(ctx, stageFloor, tileDrawX, tileDrawY, spriteScale);
        }

        // グリッド線（全体表示時は省略）
        if (!useFullMap) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.strokeRect(tileDrawX, tileDrawY, tileSize, tileSize);
        }
      }
    }

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

    // パス描画（デバッグモードでパス表示が有効な場合）
    if (debugState.enabled && debugState.showPath && path.length > 1) {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = Math.max(2, tileSize / 4);
      ctx.beginPath();

      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const screenX = useFullMap
          ? offsetX + p.x * tileSize + tileSize / 2
          : (p.x - viewport.x) * tileSize + tileSize / 2;
        const screenY = useFullMap
          ? offsetY + p.y * tileSize + tileSize / 2
          : (p.y - viewport.y) * tileSize + tileSize / 2;

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

    // 敵描画（T-02.3: スプライト描画）
    for (const enemy of enemies) {
      if (
        enemy.x < viewport.x - 1 ||
        enemy.x > viewport.x + viewport.width + 1 ||
        enemy.y < viewport.y - 1 ||
        enemy.y > viewport.y + viewport.height + 1
      ) {
        if (!useFullMap) continue;
      }

      const enemyScreen = toScreenPosition(enemy);
      const enemySpriteSize =
        enemy.type === EnemyType.MEGA_BOSS ? SPRITE_SIZES.megaBoss :
        enemy.type === EnemyType.BOSS ? SPRITE_SIZES.boss :
        enemy.type === EnemyType.MINI_BOSS ? SPRITE_SIZES.miniBoss :
        SPRITE_SIZES.base;
      const enemyDrawSize = enemySpriteSize * spriteScale;
      const enemyDrawX = enemyScreen.x - enemyDrawSize / 2;
      const enemyDrawY = enemyScreen.y - enemyDrawSize / 2;

      // 撃破アニメーション中の描画
      if (enemy.isDying && enemy.deathStartTime) {
        const elapsed = now - enemy.deathStartTime;
        if (isDeathAnimationComplete(elapsed)) continue;

        const phase = getDeathPhase(elapsed);
        const scale = getDeathScale(elapsed);

        if (phase === 1) {
          // フェーズ1: 縮小描画（100ms）
          ctx.save();
          ctx.translate(enemyScreen.x, enemyScreen.y);
          ctx.scale(scale, scale);
          const scaledDrawX = -enemyDrawSize / 2;
          const scaledDrawY = -enemyDrawSize / 2;
          const enemySheet = getEnemySpriteSheet(enemy.type);
          spriteRenderer.drawSprite(ctx, enemySheet.sprites[0], scaledDrawX, scaledDrawY, spriteScale);
          ctx.restore();
        } else if (phase === 2) {
          // フェーズ2: 白フラッシュ（50ms）
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(enemyScreen.x, enemyScreen.y, enemyDrawSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // フェーズ3: スプライト非表示（パーティクルのみ）
        continue;
      }

      // ボスHP残量オーラ描画
      const isBossType = enemy.type === EnemyType.BOSS ||
        enemy.type === EnemyType.MINI_BOSS || enemy.type === EnemyType.MEGA_BOSS;
      if (isBossType && enemy.hp > 0) {
        const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
        const auraConfig = getBossAuraConfig(hpRatio);
        if (auraConfig) {
          const pulseT = (now % auraConfig.pulsePeriod) / auraConfig.pulsePeriod;
          const pulseAlpha = 0.15 + 0.15 * Math.sin(pulseT * Math.PI * 2);
          ctx.save();
          ctx.globalAlpha = pulseAlpha;
          const gradient = ctx.createRadialGradient(
            enemyScreen.x, enemyScreen.y, enemyDrawSize * 0.3,
            enemyScreen.x, enemyScreen.y, enemyDrawSize * 0.8
          );
          gradient.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
          gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(
            enemyScreen.x - enemyDrawSize,
            enemyScreen.y - enemyDrawSize,
            enemyDrawSize * 2,
            enemyDrawSize * 2
          );
          ctx.restore();
        }
      }

      const blinkOff = enemy.state === EnemyState.KNOCKBACK && Math.floor(now / 100) % 2 === 1;
      if (blinkOff) continue;

      const enemySheet = getEnemySpriteSheet(enemy.type);

      // 敵状態別フレーム選択（Phase 3）
      const enemyStateFrame = getEnemyStateFrame(enemy.type, enemy.state);
      if (enemyStateFrame) {
        spriteRenderer.drawSprite(ctx, enemyStateFrame, enemyDrawX, enemyDrawY, spriteScale);
      } else {
        spriteRenderer.drawAnimatedSprite(ctx, enemySheet, now, enemyDrawX, enemyDrawY, spriteScale);
      }
    }

    // 攻撃エフェクト描画（T-02.8: 斬撃アニメーション）
    if (attackEffect && now < attackEffect.until) {
      const effectPos = attackEffect.position;
      const screen = toScreenPosition(effectPos);
      const slashDrawSize = SPRITE_SIZES.base * spriteScale;
      const slashDrawX = screen.x - slashDrawSize / 2;
      const slashDrawY = screen.y - slashDrawSize / 2;

      spriteRenderer.drawAnimatedSprite(ctx, ATTACK_SLASH_SPRITE_SHEET, now, slashDrawX, slashDrawY, spriteScale);
    }

    // パーティクルエフェクトシステム
    const em = effectManagerRef.current;

    // 攻撃ヒットエフェクトのトリガー（パワーレベルスケーリング）
    if (attackEffect && now < attackEffect.until) {
      const key = `${attackEffect.position.x}-${attackEffect.position.y}-${attackEffect.until}`;
      if (lastAttackEffectKeyRef.current !== key) {
        lastAttackEffectKeyRef.current = key;
        playerAttackUntilRef.current = attackEffect.until;
        const screenPos = toScreenPosition(attackEffect.position);
        const powerLevel = calculatePowerLevel(player);
        em.addEffect(EffectType.ATTACK_HIT, screenPos.x, screenPos.y, now, { powerLevel });
      }
    }

    // ダメージエフェクトのトリガー
    if (lastDamageAt > lastDamageAtRef.current) {
      lastDamageAtRef.current = lastDamageAt;
      playerDamageUntilRef.current = now + 200; // 被弾フレーム200ms表示
      const screenPos = toScreenPosition(player);
      em.addEffect(EffectType.DAMAGE, screenPos.x, screenPos.y, now);
      // 画面シェイク（Phase 4）
      em.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, { damage: 4 });
    }

    // 外部エフェクトキューの処理
    if (effectQueueRef && effectQueueRef.current.length > 0) {
      for (const evt of effectQueueRef.current) {
        const screenPos = toScreenPosition({ x: evt.x, y: evt.y });
        em.addEffect(evt.type, screenPos.x, screenPos.y, now, {
          enemyType: evt.enemyType as import('../../types').EnemyTypeValue | undefined,
          comboMultiplier: evt.comboMultiplier,
          powerLevel: evt.powerLevel,
          variant: evt.variant as 'melee' | 'ranged' | 'boss' | undefined,
          itemType: evt.itemType as import('../../types').ItemTypeValue | undefined,
        });
      }
      effectQueueRef.current = [];
    }

    // エフェクト更新・描画（100ms 間隔）
    em.update(0.1, now);
    em.draw(ctx, canvas.width, canvas.height);

    // フローティングテキスト更新・描画
    if (floatingTextManagerRef) {
      floatingTextManagerRef.current.update(now);
      floatingTextManagerRef.current.draw(ctx, now, (tx, ty) => toScreenPosition({ x: tx, y: ty }));
    }

    // プレイヤー描画（T-02.4: スプライト描画）
    const playerScreen = toScreenPosition(player);
    const deathEff = deathEffectRef.current;
    const playerDrawSize = SPRITE_SIZES.base * spriteScale;

    if (isDying && deathEff.isActive()) {
      // 死亡アニメーション中
      const playerColors = player.playerClass === 'warrior'
        ? ['#667eea', '#5a67d8', '#4c51bf', '#ffffff']
        : ['#a78bfa', '#8b5cf6', '#7c3aed', '#ffffff'];

      deathEff.update(now, playerScreen.x, playerScreen.y, playerColors);

      // フェーズに応じてプレイヤースプライトを表示/非表示
      if (deathEff.isPlayerVisible(now)) {
        const playerSheet = getPlayerSpriteSheet(
          player.playerClass as 'warrior' | 'thief',
          player.direction as 'down' | 'up' | 'left' | 'right'
        );
        const playerDrawX = playerScreen.x - playerDrawSize / 2;
        const playerDrawY = playerScreen.y - playerDrawSize / 2;

        // 待機フレームで描画
        spriteRenderer.drawSprite(ctx, playerSheet.sprites[0], playerDrawX, playerDrawY, spriteScale);
      }

      // 死亡エフェクト描画（赤変色オーバーレイ + パーティクル分解）
      deathEff.draw(ctx, now, playerScreen.x, playerScreen.y, playerDrawSize);
    } else {
      // 通常時の描画（Phase 3: 優先度 攻撃 > 被弾 > 移動 > アイドルブリーズ）
      const isBlinkOff = player.isInvincible && Math.floor(now / 100) % 2 === 1;

      // パワーオーラ描画（スプライトの背面）
      if (!isBlinkOff) {
        drawPlayerAura(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, player.level, player.playerClass, now);

        // シールド輝き描画（maxHp強化時）
        if (rewardEffects.hasShieldGlow) {
          drawShieldGlow(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, now);
        }

        // 残像描画（移動速度強化時、スプライト背面に描画）
        if (rewardEffects.hasAfterImage) {
          for (const img of afterImageManagerRef.current.getAfterImages()) {
            const imgScreen = toScreenPosition(img);
            drawAfterImage(ctx, imgScreen.x, imgScreen.y, viewport.tileSize, img.alpha);
          }
        }
      }

      if (!isBlinkOff) {
        const pClass = player.playerClass as 'warrior' | 'thief';
        const pDir = player.direction as 'down' | 'up' | 'left' | 'right';
        const playerDrawX = playerScreen.x - playerDrawSize / 2;
        const playerDrawY = playerScreen.y - playerDrawSize / 2;

        const isAttacking = now < playerAttackUntilRef.current;
        const isDamaged = now < playerDamageUntilRef.current;
        const isMoving = movementStateRef.current.activeDirection !== null;

        if (isAttacking) {
          // 攻撃アニメーション
          const attackSheets = pClass === 'warrior' ? WARRIOR_ATTACK_SPRITE_SHEETS : THIEF_ATTACK_SPRITE_SHEETS;
          const attackSheet = attackSheets[pDir];
          const attackFrameIndex = Math.floor(now / attackSheet.frameDuration) % attackSheet.sprites.length;
          spriteRenderer.drawSprite(ctx, attackSheet.sprites[attackFrameIndex], playerDrawX, playerDrawY, spriteScale);

          // 武器光跡描画（攻撃アニメーション中のみ）
          const attackDuration = playerAttackUntilRef.current - (playerAttackUntilRef.current - 300);
          const attackElapsed = now - (playerAttackUntilRef.current - 300);
          const attackProgress = Math.min(1, Math.max(0, attackElapsed / attackDuration));
          drawWeaponTrail(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, player.direction, player.stats.attackPower, player.playerClass, attackProgress);

          // 衝撃波描画（RADIANT ティアのみ、攻撃ヒット時）
          if (getWeaponTier(player.stats.attackPower) === WeaponTier.RADIANT) {
            drawShockwave(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, attackElapsed);
          }
        } else if (isDamaged) {
          // 被弾フレーム（200ms表示）
          const damageSprites = pClass === 'warrior' ? WARRIOR_DAMAGE_SPRITES : THIEF_DAMAGE_SPRITES;
          spriteRenderer.drawSprite(ctx, damageSprites[pDir], playerDrawX, playerDrawY, spriteScale);
        } else if (isMoving) {
          // 歩行アニメーション
          const playerSheet = getPlayerSpriteSheet(pClass, pDir);
          const walkFrameIndex = Math.floor(now / playerSheet.frameDuration) % 2;
          spriteRenderer.drawSprite(ctx, playerSheet.sprites[1 + walkFrameIndex], playerDrawX, playerDrawY, spriteScale);

          // 残像記録（移動速度強化時）
          if (rewardEffects.hasAfterImage) {
            afterImageManagerRef.current.recordPosition(player.x, player.y, player.direction, now);
          }
        } else {
          // アイドルブリーズアニメーション
          const idleSheets = pClass === 'warrior' ? WARRIOR_IDLE_SPRITE_SHEETS : THIEF_IDLE_SPRITE_SHEETS;
          const idleSheet = idleSheets[pDir];
          const idleFrameIndex = Math.floor(now / idleSheet.frameDuration) % idleSheet.sprites.length;
          spriteRenderer.drawSprite(ctx, idleSheet.sprites[idleFrameIndex], playerDrawX, playerDrawY, spriteScale);
        }

        // 回転パーティクル描画（攻撃速度強化時、常時微小表示）
        if (rewardEffects.hasSpinParticles) {
          drawSpinParticles(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, now);
        }

        // 回復パーティクル描画（回復量強化時）
        if (rewardEffects.hasHealParticles) {
          drawHealParticles(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, now);
        }
      }
    }

    // 低HP警告描画（Phase 4: HP 25%以下でビネットパルス）
    if (player.hp > 0 && player.hp / player.maxHp <= 0.25) {
      const pulseT = (now % 1500) / 1500;
      const pulseAlpha = 0.15 + 0.1 * Math.sin(pulseT * Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      gradient.addColorStop(0, 'rgba(220, 38, 38, 0)');
      gradient.addColorStop(1, `rgba(220, 38, 38, ${pulseAlpha})`);
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // コンボカウンター描画（画面上部中央）
    if (comboStateRef && isComboActive(comboStateRef.current, now) &&
        comboStateRef.current.count >= COMBO_DISPLAY_MIN) {
      const combo = comboStateRef.current;
      const comboText = `${combo.count} COMBO!`;
      const timeSinceKill = now - combo.lastKillTime;

      // ポップアニメーション（コンボ増加時に拡大→縮小）
      const popProgress = Math.min(1, timeSinceKill / 200);
      const popScale = popProgress < 0.5
        ? 1.0 + 0.4 * (1 - popProgress * 2)
        : 1.0;

      // フェードアウト（コンボ時間切れ前の500msでフェードアウト開始）
      const remaining = 3000 - timeSinceKill;
      const fadeAlpha = remaining < 500 ? remaining / 500 : 1.0;

      ctx.save();
      ctx.font = `bold ${Math.round(20 * popScale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.globalAlpha = Math.max(0, fadeAlpha);

      // アウトライン
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(comboText, canvas.width / 2, 50);

      // 本文（金色）
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(comboText, canvas.width / 2, 50);
      ctx.restore();
    }

    // ボスWARNING演出
    const bossWarning = bossWarningRef.current;
    for (const enemy of enemies) {
      const isBoss = enemy.type === EnemyType.BOSS || enemy.type === EnemyType.MINI_BOSS || enemy.type === EnemyType.MEGA_BOSS;
      if (!isBoss || enemy.hp <= 0) continue;
      if (shouldTriggerWarning(bossWarning, enemy, player.x, player.y)) {
        bossWarningRef.current = {
          ...bossWarning,
          isActive: true,
          startTime: now,
          triggeredBossIds: [...bossWarning.triggeredBossIds, enemy.id],
        };
        break;
      }
    }

    if (bossWarningRef.current.isActive) {
      const warningElapsed = now - bossWarningRef.current.startTime;
      if (warningElapsed < BOSS_WARNING_DURATION) {
        const phase = getWarningPhase(warningElapsed);

        if (phase === 'darken' || phase === 'text') {
          // 画面暗転
          const darkenProgress = Math.min(1, warningElapsed / 300);
          ctx.save();
          ctx.globalAlpha = 0.5 * darkenProgress;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        if (phase === 'text') {
          // WARNING テキスト点滅（200ms間隔）
          const blink = Math.floor(now / 200) % 2 === 0;
          if (blink) {
            ctx.save();
            ctx.font = 'bold 32px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText('⚠ WARNING ⚠', canvas.width / 2, canvas.height / 2);
            ctx.fillText('⚠ WARNING ⚠', canvas.width / 2, canvas.height / 2);
            ctx.restore();
          }
        }

        if (phase === 'fadeout') {
          // フェードアウト
          const fadeProgress = (warningElapsed - 900) / 300;
          ctx.save();
          ctx.globalAlpha = 0.5 * (1 - fadeProgress);
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      } else {
        // WARNING完了
        bossWarningRef.current = { ...bossWarningRef.current, isActive: false };
      }
    }

    // 画面シェイクオフセット復元（HUDはシェイクの影響を受けない）
    if (shakeOffset) {
      ctx.restore();
    }

    // ゲームオーバー暗転描画（DYING状態）
    if (isDying) {
      const dyingElapsed = now - dyingStartTimeRef.current;
      const gameOverAlpha = getGameOverTransitionAlpha(dyingElapsed);
      if (gameOverAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = gameOverAlpha;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    // ステージ開始演出描画
    const stageIntroElapsed = now - stageStartTimeRef.current;
    const stageIntroPhase = getStageIntroPhase(stageIntroElapsed);
    if (stageIntroPhase !== 'done') {
      // 暗転フェードイン
      const introAlpha = getStageIntroAlpha(stageIntroElapsed);
      if (introAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = introAlpha;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // ステージ名テキスト
      const textAlpha = getStageIntroTextAlpha(stageIntroElapsed);
      if (textAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const stageText = currentStage ? `STAGE ${currentStage}` : 'STAGE 1';
        // テキストアウトライン
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(stageText, canvas.width / 2, canvas.height / 2);
        // テキスト本文
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stageText, canvas.width / 2, canvas.height / 2);
        ctx.restore();
      }
    }

    // 自動マップ描画（全体表示モードでは非表示）
    if (mapState.isMapVisible && !useFullMap) {
      drawAutoMap(ctx, map, mapState.exploration, player, goalPos, mapState.isFullScreen);
    }

    // デバッグ情報描画
    if (debugState.enabled) {
      drawDebugPanel(ctx, debugState, {
        playerX: player.x,
        playerY: player.y,
        viewportX: viewport.x,
        viewportY: viewport.y,
        mapWidth,
        mapHeight,
      });

      // 座標オーバーレイ
      if (debugState.showCoordinates) {
        drawCoordinateOverlay(ctx, player.x, player.y, playerScreen.x, playerScreen.y);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime, attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef, spriteRenderer, isDying]);

  const isAttackReady = renderTime >= player.attackCooldownUntil;

  return (
    <GameRegion role="region" aria-label="ゲーム画面">
      {/* HUD（ステータス表示、ボタン等） */}
      <GameHUD
        player={player}
        lastDamageAt={lastDamageAt}
        renderTime={renderTime}
        timer={timer}
        currentStage={currentStage}
        maxLevel={maxLevel}
        pendingLevelPoints={pendingLevelPoints}
        onOpenLevelUpModal={onOpenLevelUpModal}
        onMapToggle={onMapToggle}
        showHelp={showHelp}
        onHelpToggle={onHelpToggle}
        showKeyRequiredMessage={showKeyRequiredMessage}
      />
      {/* Canvas描画エリア */}
      <GameCanvas
        canvasRef={canvasRef}
        canvasWrapperRef={canvasWrapperRef}
      />
      {/* コントロール（D-pad、攻撃ボタン、キーボード入力） */}
      <GameControls
        player={player}
        debugState={debugState}
        onMove={onMove}
        onTurn={onTurn}
        onAttack={onAttack}
        onMapToggle={onMapToggle}
        onHelpToggle={onHelpToggle}
        onDebugToggle={onDebugToggle}
        isDying={isDying}
        isAttackReady={isAttackReady}
        movementStateRef={movementStateRef}
      />
    </GameRegion>
  );
};
