/**
 * ゲーム画面コンポーネント群
 * GameScreen, ClassSelectScreen, LevelUpOverlayComponent, HelpOverlayComponent
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Overlay,
  GameRegion,
  Canvas,
  DPadContainer,
  DPadButton,
  ControlsContainer,
  MapToggleButton,
  HPBarContainer,
  HPBarFill,
  HPBarText,
  AttackButton,
  DamageOverlay,
  // MVP3追加
  ClassSelectContainer,
  ClassSelectTitle,
  ClassCardsContainer,
  ClassCard,
  ClassName,
  ClassDescription,
  ClassStats,
  ClassSelectButton,
  LevelUpOverlay,
  LevelUpTitle,
  LevelUpSubtitle,
  LevelUpChoicesContainer,
  LevelUpChoice,
  LevelUpChoiceLabel,
  LevelUpChoiceValue,
  StatsDisplay,
  StatRow,
  StatLabel,
  StatValue,
  ExperienceBar,
  ExperienceBarFill,
  LevelBadge,
  // MVP4追加
  HelpButton,
  HelpOverlay as HelpOverlayStyled,
  HelpContainer,
  HelpTitle,
  HelpSection,
  HelpSectionTitle,
  HelpKeyList,
  HelpKeyItem,
  HelpKey,
  HelpKeyDescription,
  HelpCloseButton,
  HelpHint,
  TimerDisplay,
  // MVP6追加
  KeyIndicator,
  KeyIcon,
  KeyRequiredMessage,
  ClassImage,
  // レベルアップポイント制UI
  PendingPointsBadge,
  PendingPointsCount,
  EnhanceButtonText,
  LevelUpCloseButton,
  RemainingPointsText,
  // 5ステージ制
  StageIndicator,
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
  getCanvasSize,
  Viewport,
  DebugState,
  drawDebugPanel,
  drawCoordinateOverlay,
  findPath,
  Position,
  DirectionValue,
  MovementState,
  getDirectionFromKey,
  startMovement,
  stopMovement,
  updateMovement,
  getEffectiveMoveInterval,
  INITIAL_MOVEMENT_STATE,
  DEFAULT_MOVEMENT_CONFIG,
  EnemyState,
  EnemyType,
  updateExploration,
  drawAutoMap,
  updatePlayerDirection,
  // MVP3追加
  PlayerClass,
  PlayerClassValue,
  Trap,
  Wall,
  TrapType,
  WallType,
  WallState,
  CLASS_CONFIGS,
  LEVEL_UP_CHOICES,
  KILL_COUNT_TABLE,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
  canChooseStat,
  getNextKillsRequired,
  StatTypeValue,
  StageNumber,
} from '../../index';
import { GameTimer } from '../../timer';
import { getElapsedTime, formatTimeShort } from '../../timer';
import { CONFIG, SPRITE_SIZES } from '../config';
import { EffectManager, EffectType, EffectTypeValue, DeathEffect, DeathPhase } from '../effects';
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
  ENEMY_MELEE_SLASH_SPRITE_SHEET,
  ENEMY_RANGED_SHOT_SPRITE_SHEET,
} from '../sprites';
import warriorClassImg from '../../../../assets/images/ipne_class_warrior.webp';
import thiefClassImg from '../../../../assets/images/ipne_class_thief.webp';

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

/** 外部からキューイングされるエフェクトイベント */
export interface EffectEvent {
  type: EffectTypeValue;
  x: number;
  y: number;
}

/**
 * 職業選択画面コンポーネント（MVP3）
 */
export const ClassSelectScreen: React.FC<{
  onSelect: (playerClass: PlayerClassValue) => void;
}> = ({ onSelect }) => {
  const [selectedClass, setSelectedClass] = useState<PlayerClassValue | null>(null);

  const handleConfirm = () => {
    if (selectedClass) {
      onSelect(selectedClass);
    }
  };

  return (
    <Overlay>
      <ClassSelectContainer>
        <ClassSelectTitle>職業を選択</ClassSelectTitle>
        <ClassCardsContainer>
          <ClassCard
            $classType="warrior"
            $selected={selectedClass === PlayerClass.WARRIOR}
            onClick={() => setSelectedClass(PlayerClass.WARRIOR)}
          >
            <ClassImage src={warriorClassImg} alt="戦士" />
            <ClassName>{CLASS_CONFIGS[PlayerClass.WARRIOR].name}</ClassName>
            <ClassDescription>
              耐久力と攻撃力が高く、正面突破スタイル。罠・特殊壁は触れて判明。
            </ClassDescription>
            <ClassStats>
              <span>HP: 20 / 攻撃力: 2</span>
              <span>攻撃速度: 速 / 回復+1</span>
            </ClassStats>
          </ClassCard>
          <ClassCard
            $classType="thief"
            $selected={selectedClass === PlayerClass.THIEF}
            onClick={() => setSelectedClass(PlayerClass.THIEF)}
          >
            <ClassImage src={thiefClassImg} alt="盗賊" />
            <ClassName>{CLASS_CONFIGS[PlayerClass.THIEF].name}</ClassName>
            <ClassDescription>
              移動速度が高く、罠を避けて進むスタイル。罠・特殊壁がうっすら見える。
            </ClassDescription>
            <ClassStats>
              <span>HP: 12 / 攻撃力: 1</span>
              <span>移動速度: 速 / 罠視認: ○</span>
            </ClassStats>
          </ClassCard>
        </ClassCardsContainer>
        <ClassSelectButton $disabled={!selectedClass} onClick={handleConfirm}>
          この職業で開始
        </ClassSelectButton>
      </ClassSelectContainer>
    </Overlay>
  );
};

/**
 * レベルアップオーバーレイコンポーネント（MVP3、ポイント制対応）
 */
export const LevelUpOverlayComponent: React.FC<{
  player: Player;
  pendingPoints: number;
  onChoose: (stat: StatTypeValue) => void;
  onClose: () => void;
}> = ({ player, pendingPoints, onChoose, onClose }) => {
  const choices = LEVEL_UP_CHOICES.map(choice => ({
    ...choice,
    canChoose: canChooseStat(player.stats, choice.stat),
    currentValue: player.stats[choice.stat as keyof typeof player.stats],
  }));

  return (
    <LevelUpOverlay>
      <LevelUpTitle>🎉 レベルアップ！</LevelUpTitle>
      <LevelUpSubtitle>強化する能力を選んでください</LevelUpSubtitle>
      {pendingPoints > 1 && (
        <RemainingPointsText>残りポイント: {pendingPoints}</RemainingPointsText>
      )}
      <LevelUpChoicesContainer>
        {choices.map(choice => (
          <LevelUpChoice
            key={choice.stat}
            $disabled={!choice.canChoose}
            onClick={() => choice.canChoose && onChoose(choice.stat)}
          >
            <LevelUpChoiceLabel>{choice.description}</LevelUpChoiceLabel>
            <LevelUpChoiceValue $disabled={!choice.canChoose}>
              {choice.canChoose
                ? `${choice.currentValue} → ${choice.currentValue + choice.increase}`
                : '上限'}
            </LevelUpChoiceValue>
          </LevelUpChoice>
        ))}
      </LevelUpChoicesContainer>
      <LevelUpCloseButton onClick={onClose}>後で選ぶ</LevelUpCloseButton>
    </LevelUpOverlay>
  );
};

/**
 * ヘルプオーバーレイコンポーネント（MVP4）
 */
export const HelpOverlayComponent: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <HelpOverlayStyled onClick={onClose}>
    <HelpContainer onClick={e => e.stopPropagation()}>
      <HelpTitle>操作方法</HelpTitle>

      <HelpSection>
        <HelpSectionTitle>移動</HelpSectionTitle>
        <HelpKeyList>
          <HelpKeyItem>
            <HelpKey>W A S D</HelpKey>
            <HelpKeyDescription>上/左/下/右に移動</HelpKeyDescription>
          </HelpKeyItem>
          <HelpKeyItem>
            <HelpKey>↑ ← ↓ →</HelpKey>
            <HelpKeyDescription>矢印キーでも移動可能</HelpKeyDescription>
          </HelpKeyItem>
        </HelpKeyList>
      </HelpSection>

      <HelpSection>
        <HelpSectionTitle>アクション</HelpSectionTitle>
        <HelpKeyList>
          <HelpKeyItem>
            <HelpKey>Space</HelpKey>
            <HelpKeyDescription>攻撃（押しながら移動キーで向き変更）</HelpKeyDescription>
          </HelpKeyItem>
          <HelpKeyItem>
            <HelpKey>M</HelpKey>
            <HelpKeyDescription>マップ表示切替（小窓→全画面→非表示）</HelpKeyDescription>
          </HelpKeyItem>
          <HelpKeyItem>
            <HelpKey>H</HelpKey>
            <HelpKeyDescription>このヘルプを表示/非表示</HelpKeyDescription>
          </HelpKeyItem>
        </HelpKeyList>
      </HelpSection>

      <HelpSection>
        <HelpSectionTitle>ゲームの目的</HelpSectionTitle>
        <HelpKeyList>
          <HelpKeyItem>
            <HelpKeyDescription>
              迷宮を探索してゴール（緑色のタイル）を目指しましょう。
              敵を倒してレベルアップし、アイテムを取得して有利に進めましょう。
              クリアタイムで評価が決まります！
            </HelpKeyDescription>
          </HelpKeyItem>
        </HelpKeyList>
      </HelpSection>

      <HelpCloseButton onClick={onClose}>閉じる</HelpCloseButton>
      <HelpHint>画面外をクリックしても閉じられます</HelpHint>
    </HelpContainer>
  </HelpOverlayStyled>
);

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
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>;
  // 死亡アニメーション中フラグ
  isDying?: boolean;
  // 5ステージ制
  currentStage?: StageNumber;
  maxLevel?: number;
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
  // 死亡アニメーション中フラグ
  isDying = false,
  // 5ステージ制
  currentStage,
  maxLevel = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movementStateRef = useRef<MovementState>(INITIAL_MOVEMENT_STATE);
  const animationFrameRef = useRef<number | null>(null);
  const attackHoldRef = useRef(false);
  const [renderTime, setRenderTime] = useState(0);

  // エフェクトシステム
  const effectManagerRef = useRef(new EffectManager());
  const lastAttackEffectKeyRef = useRef<string | null>(null);
  const lastDamageAtRef = useRef(0);

  // 死亡エフェクト
  const deathEffectRef = useRef(new DeathEffect());

  // アニメーション状態管理（Phase 3）
  const playerAttackUntilRef = useRef(0);  // 攻撃アニメーション終了時刻
  const playerDamageUntilRef = useRef(0);  // 被弾フレーム終了時刻

  // スプライトレンダラー（T-02.1）
  const spriteRenderer = useMemo(() => new SpriteRenderer(), []);

  // 死亡アニメーション開始
  useEffect(() => {
    if (isDying) {
      deathEffectRef.current.start(Date.now());
    } else {
      deathEffectRef.current.reset();
    }
  }, [isDying]);

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

    if (useFullMap) {
      // 全体マップ表示：マップ全体が収まるようにタイルサイズを計算
      const canvasSize = getCanvasSize();
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
      // 通常のビューポート表示
      viewport = calculateViewport(player, mapWidth, mapHeight);
      tileSize = viewport.tileSize;
      const canvasSize = getCanvasSize();
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

      const blinkOff = enemy.state === EnemyState.KNOCKBACK && Math.floor(now / 100) % 2 === 1;
      if (blinkOff) continue;

      const enemyScreen = toScreenPosition(enemy);
      const enemySheet = getEnemySpriteSheet(enemy.type);
      const enemySpriteSize =
        enemy.type === EnemyType.MEGA_BOSS ? SPRITE_SIZES.megaBoss :
        enemy.type === EnemyType.BOSS ? SPRITE_SIZES.boss :
        enemy.type === EnemyType.MINI_BOSS ? SPRITE_SIZES.miniBoss :
        SPRITE_SIZES.base;
      const enemyDrawSize = enemySpriteSize * spriteScale;
      const enemyDrawX = enemyScreen.x - enemyDrawSize / 2;
      const enemyDrawY = enemyScreen.y - enemyDrawSize / 2;

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

    // 攻撃ヒットエフェクトのトリガー
    if (attackEffect && now < attackEffect.until) {
      const key = `${attackEffect.position.x}-${attackEffect.position.y}-${attackEffect.until}`;
      if (lastAttackEffectKeyRef.current !== key) {
        lastAttackEffectKeyRef.current = key;
        playerAttackUntilRef.current = attackEffect.until;
        const screenPos = toScreenPosition(attackEffect.position);
        em.addEffect(EffectType.ATTACK_HIT, screenPos.x, screenPos.y, now);
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
        em.addEffect(evt.type, screenPos.x, screenPos.y, now);
      }
      effectQueueRef.current = [];
    }

    // エフェクト更新・描画（100ms 間隔）
    em.update(0.1, now);
    em.draw(ctx, canvas.width, canvas.height);

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
        } else if (isDamaged) {
          // 被弾フレーム（200ms表示）
          const damageSprites = pClass === 'warrior' ? WARRIOR_DAMAGE_SPRITES : THIEF_DAMAGE_SPRITES;
          spriteRenderer.drawSprite(ctx, damageSprites[pDir], playerDrawX, playerDrawY, spriteScale);
        } else if (isMoving) {
          // 歩行アニメーション
          const playerSheet = getPlayerSpriteSheet(pClass, pDir);
          const walkFrameIndex = Math.floor(now / playerSheet.frameDuration) % 2;
          spriteRenderer.drawSprite(ctx, playerSheet.sprites[1 + walkFrameIndex], playerDrawX, playerDrawY, spriteScale);
        } else {
          // アイドルブリーズアニメーション
          const idleSheets = pClass === 'warrior' ? WARRIOR_IDLE_SPRITE_SHEETS : THIEF_IDLE_SPRITE_SHEETS;
          const idleSheet = idleSheets[pDir];
          const idleFrameIndex = Math.floor(now / idleSheet.frameDuration) % idleSheet.sprites.length;
          spriteRenderer.drawSprite(ctx, idleSheet.sprites[idleFrameIndex], playerDrawX, playerDrawY, spriteScale);
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

    // 画面シェイクオフセット復元（HUDはシェイクの影響を受けない）
    if (shakeOffset) {
      ctx.restore();
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
  }, [map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime, attackEffect, lastDamageAt, effectQueueRef, spriteRenderer, isDying]);

  const setAttackHold = useCallback((isHolding: boolean) => {
    attackHoldRef.current = isHolding;
    if (isHolding) {
      movementStateRef.current = INITIAL_MOVEMENT_STATE;
    }
  }, []);

  // 連続移動のアニメーションループ
  useEffect(() => {
    const tick = () => {
      const currentTime = Date.now();

      // プレイヤーの移動速度を考慮した移動間隔を計算
      const effectiveMoveInterval = getEffectiveMoveInterval(
        player,
        DEFAULT_MOVEMENT_CONFIG.moveInterval,
        currentTime
      );
      const effectiveConfig = {
        ...DEFAULT_MOVEMENT_CONFIG,
        moveInterval: effectiveMoveInterval,
      };

      const { shouldMove, newState } = updateMovement(
        movementStateRef.current,
        currentTime,
        effectiveConfig
      );

      movementStateRef.current = newState;

      if (shouldMove && newState.activeDirection && !attackHoldRef.current && !isDying) {
        onMove(newState.activeDirection);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onMove, player, isDying]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // DYING 状態中は入力無効化
      if (isDying) return;

      const key = e.key.toLowerCase();

      // 攻撃（Spaceキー）
      if (key === ' ' || key === 'space') {
        e.preventDefault();
        setAttackHold(true);
        onAttack();
        return;
      }

      // マップ切替（Mキー）
      if (key === 'm') {
        e.preventDefault();
        onMapToggle();
        return;
      }

      // ヘルプ切替（Hキー）
      if (key === 'h') {
        e.preventDefault();
        onHelpToggle();
        return;
      }

      // デバッグモード時のキー（Shift + キーで操作、移動キーと競合しない）
      if (debugState.enabled && e.shiftKey) {
        if (key === 'd') {
          e.preventDefault();
          onDebugToggle('showPanel');
          return;
        } else if (key === 'f') {
          e.preventDefault();
          onDebugToggle('showFullMap');
          return;
        } else if (key === 'c') {
          e.preventDefault();
          onDebugToggle('showCoordinates');
          return;
        } else if (key === 'p') {
          e.preventDefault();
          onDebugToggle('showPath');
          return;
        }
      }

      // 移動キーの場合、連続移動状態を開始
      const direction = getDirectionFromKey(e.key);
      if (direction) {
        e.preventDefault();
        if (attackHoldRef.current) {
          onTurn(direction);
          return;
        }
        const currentTime = Date.now();

        // 最初の1マス目は即座に移動
        if (movementStateRef.current.activeDirection !== direction) {
          onMove(direction);
        }

        movementStateRef.current = startMovement(
          movementStateRef.current,
          direction,
          currentTime
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'space') {
        setAttackHold(false);
        return;
      }
      // 移動キーの場合、連続移動状態を停止
      const direction = getDirectionFromKey(e.key);
      if (direction) {
        movementStateRef.current = stopMovement(movementStateRef.current, direction);
      }
    };

    // フォーカス喪失時にすべてのキー状態をリセット
    const handleBlur = () => {
      movementStateRef.current = INITIAL_MOVEMENT_STATE;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onMove, onTurn, onAttack, onMapToggle, onHelpToggle, debugState.enabled, onDebugToggle, setAttackHold, isDying]);

  // D-pad押下開始時のハンドラー
  const handleDPadPointerDown = useCallback(
    (direction: DirectionValue) => {
      // DYING 状態中は入力無効化
      if (isDying) return;
      const currentTime = Date.now();
      if (attackHoldRef.current) {
        onTurn(direction);
        return;
      }
      // 最初の1マス目は即座に移動
      onMove(direction);
      // 連続移動状態を開始
      movementStateRef.current = startMovement(
        movementStateRef.current,
        direction,
        currentTime
      );
    },
    [onMove, onTurn, isDying]
  );

  // D-pad離し時のハンドラー
  const handleDPadPointerUp = useCallback((direction: DirectionValue) => {
    movementStateRef.current = stopMovement(movementStateRef.current, direction);
  }, []);

  const hpRatio = player.maxHp === 0 ? 0 : player.hp / player.maxHp;
  const hpColor = hpRatio > 0.66 ? '#22c55e' : hpRatio > 0.33 ? '#facc15' : '#ef4444';
  const isAttackReady = renderTime >= player.attackCooldownUntil;

  // タイマー表示用の現在時刻
  const currentElapsed = getElapsedTime(timer, renderTime);

  return (
    <GameRegion role="region" aria-label="ゲーム画面">
      <DamageOverlay $visible={renderTime - lastDamageAt < 150} />
      <TimerDisplay>{formatTimeShort(currentElapsed)}</TimerDisplay>
      {currentStage && <StageIndicator>STAGE {currentStage}</StageIndicator>}
      <HPBarContainer>
        <HPBarFill $ratio={hpRatio} $color={hpColor} />
        <HPBarText>
          HP {player.hp}/{player.maxHp}
        </HPBarText>
      </HPBarContainer>
      <LevelBadge>Lv.{player.level}</LevelBadge>
      <ExperienceBar>
        <ExperienceBarFill
          $ratio={
            player.level >= maxLevel
              ? 1
              : (player.killCount - (KILL_COUNT_TABLE[player.level] || 0)) /
                Math.max(1, getNextKillsRequired(player.level, player.killCount) + (player.killCount - (KILL_COUNT_TABLE[player.level] || 0)))
          }
        />
      </ExperienceBar>
      <StatsDisplay>
        <StatRow>
          <StatLabel>攻撃力</StatLabel>
          <StatValue>{player.stats.attackPower}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>攻撃距離</StatLabel>
          <StatValue>{player.stats.attackRange}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>移動速度</StatLabel>
          <StatValue>{player.stats.moveSpeed}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>攻撃速度</StatLabel>
          <StatValue>{player.stats.attackSpeed.toFixed(1)}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>撃破数</StatLabel>
          <StatValue>{player.killCount}</StatValue>
        </StatRow>
      </StatsDisplay>
      <PendingPointsBadge
        $hasPoints={pendingLevelPoints > 0}
        onClick={onOpenLevelUpModal}
        aria-label={pendingLevelPoints > 0 ? `未割り振りポイント: ${pendingLevelPoints}` : '未割り振りポイントなし'}
      >
        <PendingPointsCount $hasPoints={pendingLevelPoints > 0}>
          ★ {pendingLevelPoints}
        </PendingPointsCount>
        <EnhanceButtonText $hasPoints={pendingLevelPoints > 0}>
          強化
        </EnhanceButtonText>
      </PendingPointsBadge>
      <KeyIndicator $hasKey={player.hasKey} aria-label={player.hasKey ? '鍵を所持' : '鍵未所持'}>
        <KeyIcon $hasKey={player.hasKey}>🔑</KeyIcon>
      </KeyIndicator>
      <MapToggleButton onClick={onMapToggle} aria-label="マップ表示切替">
        🗺️
      </MapToggleButton>
      <HelpButton onClick={onHelpToggle} aria-label="ヘルプ表示">
        H
      </HelpButton>
      {showHelp && <HelpOverlayComponent onClose={onHelpToggle} />}
      {showKeyRequiredMessage && <KeyRequiredMessage>🔑 鍵が必要です</KeyRequiredMessage>}
      <Canvas
        ref={canvasRef}
        role="img"
        aria-label="迷路ゲーム画面"
        tabIndex={0}
      />
      <ControlsContainer>
        <DPadContainer>
          <DPadButton
            $direction="up"
            onPointerDown={e => {
              e.preventDefault();
              handleDPadPointerDown(Direction.UP);
            }}
            onPointerUp={() => handleDPadPointerUp(Direction.UP)}
            onPointerLeave={() => handleDPadPointerUp(Direction.UP)}
            onPointerCancel={() => handleDPadPointerUp(Direction.UP)}
            aria-label="上に移動"
          >
            ▲
          </DPadButton>
          <DPadButton
            $direction="left"
            onPointerDown={e => {
              e.preventDefault();
              handleDPadPointerDown(Direction.LEFT);
            }}
            onPointerUp={() => handleDPadPointerUp(Direction.LEFT)}
            onPointerLeave={() => handleDPadPointerUp(Direction.LEFT)}
            onPointerCancel={() => handleDPadPointerUp(Direction.LEFT)}
            aria-label="左に移動"
          >
            ◀
          </DPadButton>
          <AttackButton
            onPointerDown={e => {
              e.preventDefault();
              setAttackHold(true);
              if (isAttackReady) onAttack();
            }}
            onPointerUp={() => setAttackHold(false)}
            onPointerLeave={() => setAttackHold(false)}
            onPointerCancel={() => setAttackHold(false)}
            $ready={isAttackReady}
            aria-label="攻撃"
          >
            ATK
          </AttackButton>
          <DPadButton
            $direction="right"
            onPointerDown={e => {
              e.preventDefault();
              handleDPadPointerDown(Direction.RIGHT);
            }}
            onPointerUp={() => handleDPadPointerUp(Direction.RIGHT)}
            onPointerLeave={() => handleDPadPointerUp(Direction.RIGHT)}
            onPointerCancel={() => handleDPadPointerUp(Direction.RIGHT)}
            aria-label="右に移動"
          >
            ▶
          </DPadButton>
          <DPadButton
            $direction="down"
            onPointerDown={e => {
              e.preventDefault();
              handleDPadPointerDown(Direction.DOWN);
            }}
            onPointerUp={() => handleDPadPointerUp(Direction.DOWN)}
            onPointerLeave={() => handleDPadPointerUp(Direction.DOWN)}
            onPointerCancel={() => handleDPadPointerUp(Direction.DOWN)}
            aria-label="下に移動"
          >
            ▼
          </DPadButton>
        </DPadContainer>
      </ControlsContainer>
    </GameRegion>
  );
};
