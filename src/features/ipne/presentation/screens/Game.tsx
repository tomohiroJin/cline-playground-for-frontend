/**
 * ゲーム画面コンポーネント群
 * GameScreen, ClassSelectScreen, LevelUpOverlayComponent, HelpOverlayComponent
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from '../../index';
import { GameTimer } from '../../timer';
import { getElapsedTime, formatTimeShort } from '../../timer';
import { CONFIG } from '../config';
import warriorClassImg from '../../../../assets/images/ipne_class_warrior.webp';
import thiefClassImg from '../../../../assets/images/ipne_class_thief.webp';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movementStateRef = useRef<MovementState>(INITIAL_MOVEMENT_STATE);
  const animationFrameRef = useRef<number | null>(null);
  const attackHoldRef = useRef(false);
  const [renderTime, setRenderTime] = useState(0);

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
    const { wallColor, floorColor, goalColor, startColor, playerColor, enemyColors, itemColors } =
      CONFIG;
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

    // マップ描画
    const drawWidth = useFullMap ? mapWidth : viewport.width;
    const drawHeight = useFullMap ? mapHeight : viewport.height;

    for (let vy = 0; vy < drawHeight; vy++) {
      for (let vx = 0; vx < drawWidth; vx++) {
        const worldX = useFullMap ? vx : viewport.x + vx;
        const worldY = useFullMap ? vy : viewport.y + vy;

        // マップ範囲外は描画しない
        if (worldX < 0 || worldX >= mapWidth || worldY < 0 || worldY >= mapHeight) {
          continue;
        }

        const tile = map[worldY][worldX];
        let color = floorColor;

        if (tile === TileType.WALL) color = wallColor;
        else if (tile === TileType.GOAL) color = goalColor;
        else if (tile === TileType.START) color = startColor;

        ctx.fillStyle = color;
        ctx.fillRect(offsetX + vx * tileSize, offsetY + vy * tileSize, tileSize, tileSize);

        // グリッド線（全体表示時は省略）
        if (!useFullMap) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.strokeRect(offsetX + vx * tileSize, offsetY + vy * tileSize, tileSize, tileSize);
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

    // MVP3: 罠描画
    for (const trap of traps) {
      // 職業に応じた可視性判定
      if (!canSeeTrap(player.playerClass, trap.state)) continue;

      const trapScreen = toScreenPosition(trap);
      const size = useFullMap ? Math.max(tileSize / 2, 3) : tileSize * 0.6;
      const alpha = getTrapAlpha(player.playerClass, trap.state);
      const trapColor = CONFIG.trapColors[trap.type as keyof typeof CONFIG.trapColors] || '#dc2626';

      ctx.globalAlpha = alpha;
      ctx.fillStyle = trapColor;

      if (trap.type === TrapType.DAMAGE) {
        // ダメージ罠: X印
        ctx.strokeStyle = trapColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trapScreen.x - size / 3, trapScreen.y - size / 3);
        ctx.lineTo(trapScreen.x + size / 3, trapScreen.y + size / 3);
        ctx.moveTo(trapScreen.x + size / 3, trapScreen.y - size / 3);
        ctx.lineTo(trapScreen.x - size / 3, trapScreen.y + size / 3);
        ctx.stroke();
      } else if (trap.type === TrapType.SLOW) {
        // 移動妨害罠: 波線
        ctx.strokeStyle = trapColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trapScreen.x - size / 3, trapScreen.y);
        ctx.quadraticCurveTo(trapScreen.x - size / 6, trapScreen.y - size / 4, trapScreen.x, trapScreen.y);
        ctx.quadraticCurveTo(trapScreen.x + size / 6, trapScreen.y + size / 4, trapScreen.x + size / 3, trapScreen.y);
        ctx.stroke();
      } else if (trap.type === TrapType.TELEPORT) {
        // テレポート罠: 渦巻き（@マーク）
        ctx.font = `bold ${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('@', trapScreen.x, trapScreen.y);
      }

      ctx.globalAlpha = 1;
    }

    // MVP3: 特殊壁描画
    for (const wall of walls) {
      // 職業に応じた可視性判定
      if (!canSeeSpecialWall(player.playerClass, wall.type, wall.state)) continue;

      const wallScreen = toScreenPosition(wall);
      const alpha = getWallAlpha(player.playerClass, wall.type, wall.state);
      const wallColor = CONFIG.wallColors[wall.type as keyof typeof CONFIG.wallColors] || '#78350f';

      ctx.globalAlpha = alpha;
      ctx.fillStyle = wallColor;

      if (wall.type === WallType.BREAKABLE) {
        // 破壊可能壁: 状態によって表示を変える
        if (wall.state === WallState.BROKEN) {
          // 破壊済み: 緑の開口部（通過可能を示す）
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
          ctx.setLineDash([]);
          // 開口部の内側に通路を示す明るい緑
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.fillRect(wallScreen.x - tileSize / 3, wallScreen.y - tileSize / 3, tileSize / 1.5, tileSize / 1.5);
        } else if (wall.state === WallState.DAMAGED) {
          // 損傷: オレンジ色、大きなひび割れ
          ctx.fillStyle = '#f97316';
          ctx.fillRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 2;
          // 大きなX字ひび割れ
          ctx.beginPath();
          ctx.moveTo(wallScreen.x - tileSize / 3, wallScreen.y - tileSize / 3);
          ctx.lineTo(wallScreen.x + tileSize / 3, wallScreen.y + tileSize / 3);
          ctx.moveTo(wallScreen.x + tileSize / 3, wallScreen.y - tileSize / 3);
          ctx.lineTo(wallScreen.x - tileSize / 3, wallScreen.y + tileSize / 3);
          ctx.stroke();
        } else {
          // 完全（INTACT）: 茶色のひび割れ模様
          ctx.fillRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wallScreen.x - tileSize / 4, wallScreen.y - tileSize / 4);
          ctx.lineTo(wallScreen.x, wallScreen.y);
          ctx.lineTo(wallScreen.x + tileSize / 4, wallScreen.y - tileSize / 6);
          ctx.stroke();
        }
      } else if (wall.type === WallType.PASSABLE) {
        // すり抜け可能壁: 半透明塗りつぶし + 点線枠（視認性向上）
        ctx.fillStyle = 'rgba(22, 101, 52, 0.4)';
        ctx.fillRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
        ctx.setLineDash([]);
      } else if (wall.type === WallType.INVISIBLE) {
        // 透明壁: 半透明塗りつぶし + 太い輪郭（視認性向上）
        ctx.fillStyle = 'rgba(76, 29, 149, 0.3)';
        ctx.fillRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(wallScreen.x - tileSize / 2.5, wallScreen.y - tileSize / 2.5, tileSize / 1.25, tileSize / 1.25);
      }

      ctx.globalAlpha = 1;
    }

    // アイテム描画
    for (const item of items) {
      const screenPos = toScreenPosition(item);
      const size = useFullMap ? Math.max(tileSize / 3, 2) : tileSize / 3;
      ctx.fillStyle = itemColors[item.type];
      ctx.fillRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);
    }

    // 敵描画
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
      const baseRadius = useFullMap ? Math.max(tileSize / 2 - 1, 2) : tileSize / 2 - 3;
      const radius = enemy.type === EnemyType.BOSS ? baseRadius * 1.4 : baseRadius;
      ctx.fillStyle = enemyColors[enemy.type];
      ctx.beginPath();
      ctx.arc(enemyScreen.x, enemyScreen.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 攻撃エフェクト描画
    if (attackEffect && now < attackEffect.until) {
      const effectPos = attackEffect.position;
      const screen = toScreenPosition(effectPos);
      const size = useFullMap ? tileSize : tileSize * 0.9;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screen.x - size / 2, screen.y - size / 2, size, size);
    }

    // プレイヤー描画
    const playerScreen = toScreenPosition(player);
    const playerRadius = useFullMap ? Math.max(tileSize / 2 - 1, 2) : tileSize / 2 - 4;
    const isBlinkOff = player.isInvincible && Math.floor(now / 100) % 2 === 1;

    if (!isBlinkOff) {
      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.arc(playerScreen.x, playerScreen.y, playerRadius, 0, Math.PI * 2);
      ctx.fill();

      // プレイヤーの縁取り（視認性向上）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = useFullMap ? 1 : 2;
      ctx.beginPath();
      ctx.arc(playerScreen.x, playerScreen.y, playerRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 向き表示（小さな三角）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      if (player.direction === Direction.UP) {
        ctx.moveTo(playerScreen.x, playerScreen.y - playerRadius);
        ctx.lineTo(playerScreen.x - playerRadius / 2, playerScreen.y);
        ctx.lineTo(playerScreen.x + playerRadius / 2, playerScreen.y);
      } else if (player.direction === Direction.DOWN) {
        ctx.moveTo(playerScreen.x, playerScreen.y + playerRadius);
        ctx.lineTo(playerScreen.x - playerRadius / 2, playerScreen.y);
        ctx.lineTo(playerScreen.x + playerRadius / 2, playerScreen.y);
      } else if (player.direction === Direction.LEFT) {
        ctx.moveTo(playerScreen.x - playerRadius, playerScreen.y);
        ctx.lineTo(playerScreen.x, playerScreen.y - playerRadius / 2);
        ctx.lineTo(playerScreen.x, playerScreen.y + playerRadius / 2);
      } else if (player.direction === Direction.RIGHT) {
        ctx.moveTo(playerScreen.x + playerRadius, playerScreen.y);
        ctx.lineTo(playerScreen.x, playerScreen.y - playerRadius / 2);
        ctx.lineTo(playerScreen.x, playerScreen.y + playerRadius / 2);
      }
      ctx.closePath();
      ctx.fill();
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
  }, [map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime, attackEffect]);

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

      if (shouldMove && newState.activeDirection && !attackHoldRef.current) {
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
  }, [onMove, player]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [onMove, onTurn, onAttack, onMapToggle, onHelpToggle, debugState.enabled, onDebugToggle, setAttackHold]);

  // D-pad押下開始時のハンドラー
  const handleDPadPointerDown = useCallback(
    (direction: DirectionValue) => {
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
    [onMove, onTurn]
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
            player.level >= 10
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
