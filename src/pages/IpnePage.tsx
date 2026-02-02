/**
 * IPNE ゲームページ
 * シンプルな迷路ゲーム - タイトル→プロローグ→ゲーム→クリア の画面遷移
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createMapWithRooms,
  createPlayer,
  movePlayer,
  findStartPosition,
  findGoalPosition,
  isGoal,
  Direction,
  ScreenState,
  TileType,
  GameMap,
  Player,
  Enemy,
  Item,
  Room,
  CombatState,
  ScreenStateValue,
  AutoMapState,
  initExploration,
  updateExploration,
  drawAutoMap,
  calculateViewport,
  getCanvasSize,
  Viewport,
  DebugState,
  initDebugState,
  toggleDebugOption,
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
  INITIAL_MOVEMENT_STATE,
  DEFAULT_MOVEMENT_CONFIG,
  EnemyState,
  EnemyType,
  spawnEnemies,
  spawnItems,
  updateEnemiesWithContact,
  playerAttack,
  damagePlayer,
  canPickupItem,
  pickupItem,
  getEnemyAtPosition,
  COMBAT_CONFIG,
  updatePlayerDirection,
  canMove,
} from '../features/ipne';
import {
  PageContainer,
  Overlay,
  TitleContainer,
  StartButton,
  StoryText,
  SkipButton,
  GameRegion,
  Canvas,
  DPadContainer,
  DPadButton,
  ControlsContainer,
  ClearContainer,
  ClearTitle,
  ClearMessage,
  RetryButton,
  BackToTitleButton,
  MapToggleButton,
  HPBarContainer,
  HPBarFill,
  HPBarText,
  AttackButton,
  GameOverContainer,
  GameOverTitle,
  GameOverButton,
  DamageOverlay,
} from './IpnePage.styles';
import titleBg from '../assets/images/ipne_title_bg.webp';
import prologueBg from '../assets/images/ipne_prologue_bg.webp';

// 描画設定
const CONFIG = {
  playerColor: '#667eea',
  wallColor: '#374151',
  floorColor: '#1f2937',
  goalColor: '#10b981',
  startColor: '#3b82f6',
  enemyColors: {
    patrol: '#6b21a8',
    charge: '#991b1b',
    ranged: '#c2410c',
    specimen: '#1e3a5f',
    boss: '#7c2d12',
  },
  itemColors: {
    health_small: '#22c55e',
    health_large: '#ef4444',
    health_full: '#fbbf24',
    level_up: '#f0abfc',
    map_reveal: '#a16207',
  },
};

// プロローグテキスト
const PROLOGUE_TEXTS = [
  '古代遺跡の調査中、突如として通路が崩落した。',
  '閉じ込められたあなたは、唯一の脱出口を探す。',
  'デジタルマップを頼りに、迷宮を進め。',
];

/**
 * タイトル画面コンポーネント
 */
const TitleScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <Overlay $bgImage={titleBg}>
    <TitleContainer>
      <StartButton
        onClick={onStart}
        aria-label="ゲームを開始"
        style={{ marginTop: '60vh' }}
      >
        ゲームを開始
      </StartButton>
    </TitleContainer>
  </Overlay>
);

/**
 * プロローグ画面コンポーネント
 */
const PrologueScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    if (textIndex < PROLOGUE_TEXTS.length - 1) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [textIndex]);

  return (
    <Overlay $bgImage={prologueBg}>
      <div
        style={{
          width: '100%',
          maxWidth: '48rem',
          textAlign: 'center',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {PROLOGUE_TEXTS.slice(0, textIndex + 1).map((text, i) => (
          <StoryText key={i} $active={i === textIndex}>
            {text}
          </StoryText>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '2.5rem' }}>
        <SkipButton onClick={onSkip} aria-label="スキップ">
          スキップ
        </SkipButton>
      </div>
    </Overlay>
  );
};

/**
 * クリア画面コンポーネント
 * テスト用にエクスポート
 */
export const ClearScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
}> = ({ onRetry, onBackToTitle }) => (
  <Overlay>
    <ClearContainer>
      <ClearTitle>🎉 クリア！</ClearTitle>
      <ClearMessage>おめでとうございます！迷宮から脱出しました。</ClearMessage>
      <RetryButton onClick={onRetry}>もう一度プレイ</RetryButton>
      <BackToTitleButton onClick={onBackToTitle}>タイトルに戻る</BackToTitleButton>
    </ClearContainer>
  </Overlay>
);

/**
 * ゲームオーバー画面コンポーネント
 */
const GameOverScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
}> = ({ onRetry, onBackToTitle }) => (
  <Overlay>
    <GameOverContainer>
      <GameOverTitle>GAME OVER</GameOverTitle>
      <GameOverButton onClick={onRetry}>リトライ</GameOverButton>
      <GameOverButton onClick={onBackToTitle}>タイトルへ</GameOverButton>
    </GameOverContainer>
  </Overlay>
);

/**
 * ゲーム画面コンポーネント
 */
const GameScreen: React.FC<{
  map: GameMap;
  player: Player;
  enemies: Enemy[];
  items: Item[];
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
}> = ({
  map,
  player,
  enemies,
  items,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movementStateRef = useRef<MovementState>(INITIAL_MOVEMENT_STATE);
  const animationFrameRef = useRef<number | null>(null);
  const attackHoldRef = useRef(false);
  const [renderTime, setRenderTime] = useState(Date.now());

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
  }, [map, player, enemies, items, mapState, goalPos, debugState, renderTime, attackEffect]);

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
      const { shouldMove, newState } = updateMovement(
        movementStateRef.current,
        currentTime,
        DEFAULT_MOVEMENT_CONFIG
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
  }, [onMove]);

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
  }, [onMove, onTurn, onAttack, onMapToggle, debugState.enabled, onDebugToggle, setAttackHold]);

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

  return (
    <GameRegion role="region" aria-label="ゲーム画面">
      <DamageOverlay $visible={renderTime - lastDamageAt < 150} />
      <HPBarContainer>
        <HPBarFill $ratio={hpRatio} $color={hpColor} />
        <HPBarText>
          HP {player.hp}/{player.maxHp}
        </HPBarText>
      </HPBarContainer>
      <MapToggleButton onClick={onMapToggle} aria-label="マップ表示切替">
        🗺️
      </MapToggleButton>
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

/**
 * IPNE メインページコンポーネント
 */
const IpnePage: React.FC = () => {
  const [screen, setScreen] = useState<ScreenStateValue>(ScreenState.TITLE);
  const [map, setMap] = useState<GameMap>([]);
  const [player, setPlayer] = useState<Player>(() => createPlayer(0, 0));
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapState, setMapState] = useState<AutoMapState>({
    exploration: [],
    isMapVisible: true,
    isFullScreen: false,
  });
  const [debugState, setDebugState] = useState<DebugState>(() => initDebugState());
  const [isGameOver, setIsGameOver] = useState(false);
  const [combatState, setCombatState] = useState<CombatState>({ lastAttackAt: 0, lastDamageAt: 0 });
  const [attackEffect, setAttackEffect] = useState<{ position: Position; until: number } | undefined>(
    undefined
  );

  const mapRef = useRef<GameMap>(map);
  const playerRef = useRef<Player>(player);
  const enemiesRef = useRef<Enemy[]>(enemies);
  const itemsRef = useRef<Item[]>(items);
  const roomsRef = useRef<Room[]>([]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const setupGameState = useCallback((newMap: GameMap, rooms: Room[]) => {
    const startPos = findStartPosition(newMap);
    const goal = findGoalPosition(newMap);

    if (!startPos || !goal) return;

    setMap(newMap);
    mapRef.current = newMap;
    setGoalPos(goal);
    const createdPlayer = createPlayer(startPos.x, startPos.y);
    setPlayer(createdPlayer);
    playerRef.current = createdPlayer;
    setIsGameOver(false);
    setCombatState({ lastAttackAt: 0, lastDamageAt: 0 });
    setAttackEffect(undefined);

    roomsRef.current = rooms;

    const spawnedEnemies = spawnEnemies(rooms, startPos, goal);
    const spawnedItems = spawnItems(rooms, spawnedEnemies, [startPos, goal]);
    setEnemies(spawnedEnemies);
    setItems(spawnedItems);
    enemiesRef.current = spawnedEnemies;
    itemsRef.current = spawnedItems;

    // 探索状態を初期化
    const exploration = initExploration(newMap[0].length, newMap.length);
    const updatedExploration = updateExploration(exploration, startPos, newMap);
    setMapState({
      exploration: updatedExploration,
      isMapVisible: true,
      isFullScreen: false,
    });
  }, []);

  // ゲーム初期化
  const initGame = useCallback(() => {
    const result = createMapWithRooms();
    setupGameState(result.map, result.rooms);
  }, [setupGameState]);

  // 画面遷移ハンドラー
  const handleStartGame = useCallback(() => {
    setScreen(ScreenState.PROLOGUE);
  }, []);

  const handleSkipPrologue = useCallback(() => {
    initGame();
    setScreen(ScreenState.GAME);
  }, [initGame]);

  const handleRetry = useCallback(() => {
    initGame();
    setScreen(ScreenState.GAME);
  }, [initGame]);

  const handleGameOverRetry = useCallback(() => {
    if (mapRef.current.length === 0) return;
    setupGameState(mapRef.current, roomsRef.current);
    setScreen(ScreenState.GAME);
  }, [setupGameState]);

  const handleBackToTitle = useCallback(() => {
    setScreen(ScreenState.TITLE);
    setIsGameOver(false);
  }, []);

  // プレイヤー移動ハンドラー
  const handleMove = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
      if (isGameOver) return;

      const currentTime = Date.now();
      const nextPosition = (() => {
        switch (direction) {
          case Direction.UP:
            return { x: player.x, y: player.y - 1 };
          case Direction.DOWN:
            return { x: player.x, y: player.y + 1 };
          case Direction.LEFT:
            return { x: player.x - 1, y: player.y };
          case Direction.RIGHT:
            return { x: player.x + 1, y: player.y };
          default:
            return { x: player.x, y: player.y };
        }
      })();

      const enemyAtTarget = getEnemyAtPosition(enemiesRef.current, nextPosition.x, nextPosition.y);

      if (enemyAtTarget) {
        const updatedPlayer = damagePlayer(
          { ...player, direction },
          enemyAtTarget.damage,
          currentTime,
          COMBAT_CONFIG.invincibleDuration
        );
        const knockedPlayer =
          updatedPlayer !== player
            ? applyPlayerKnockback(
                updatedPlayer,
                enemyAtTarget,
                mapRef.current,
                enemiesRef.current
              )
            : updatedPlayer;
        if (updatedPlayer !== player) {
          setCombatState(prev => ({ ...prev, lastDamageAt: currentTime }));
        }
        setPlayer(knockedPlayer);
        return;
      }

      const newPlayer = movePlayer(player, direction, map);
      setPlayer(newPlayer);

      // 探索状態を更新
      setMapState(prev => ({
        ...prev,
        exploration: updateExploration(prev.exploration, newPlayer, map),
      }));

      // ゴール判定
      if (isGoal(map, newPlayer.x, newPlayer.y)) {
        setScreen(ScreenState.CLEAR);
      }
    },
    [player, map, isGameOver]
  );

  const handleTurn = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
      if (isGameOver) return;
      setPlayer(prev => updatePlayerDirection(prev, direction));
    },
    [isGameOver]
  );

  const handleAttack = useCallback(() => {
    if (isGameOver) return;
    const currentTime = Date.now();
    const result = playerAttack(playerRef.current, enemiesRef.current, mapRef.current, currentTime);

    if (result.didAttack) {
      setCombatState(prev => ({ ...prev, lastAttackAt: currentTime }));
      if (result.attackPosition) {
        setAttackEffect({ position: result.attackPosition, until: currentTime + 150 });
      } else {
        setAttackEffect(undefined);
      }
    }

    setPlayer(result.player);
    setEnemies(result.enemies.filter(enemy => enemy.hp > 0));
  }, [isGameOver]);

  // マップ表示切替ハンドラー（小窓 → 全画面 → 非表示 → 小窓）
  const handleMapToggle = useCallback(() => {
    setMapState(prev => {
      // 現在の状態に応じて次の状態に遷移
      if (!prev.isMapVisible) {
        // 非表示 → 小窓
        return { ...prev, isMapVisible: true, isFullScreen: false };
      } else if (!prev.isFullScreen) {
        // 小窓 → 全画面
        return { ...prev, isMapVisible: true, isFullScreen: true };
      } else {
        // 全画面 → 非表示
        return { ...prev, isMapVisible: false, isFullScreen: false };
      }
    });
  }, []);

  // デバッグオプション切替ハンドラー
  const handleDebugToggle = useCallback(
    (option: keyof Omit<DebugState, 'enabled'>) => {
      setDebugState(prev => toggleDebugOption(prev, option));
    },
    []
  );

  const applyPlayerKnockback = useCallback(
    (currentPlayer: Player, sourceEnemy: Enemy, currentMap: GameMap, currentEnemies: Enemy[]) => {
      const dx = currentPlayer.x - sourceEnemy.x;
      const dy = currentPlayer.y - sourceEnemy.y;
      const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
      const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
      const knockbackTarget = { x: currentPlayer.x + stepX, y: currentPlayer.y + stepY };

      if (!canMove(currentMap, knockbackTarget.x, knockbackTarget.y)) {
        return currentPlayer;
      }
      if (getEnemyAtPosition(currentEnemies, knockbackTarget.x, knockbackTarget.y)) {
        return currentPlayer;
      }

      return { ...currentPlayer, x: knockbackTarget.x, y: knockbackTarget.y };
    },
    []
  );

  // 敵AI・接触・アイテム取得の更新ループ
  useEffect(() => {
    if (screen !== ScreenState.GAME) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      let nextPlayer = playerRef.current;

      if (nextPlayer.isInvincible && currentTime >= nextPlayer.invincibleUntil) {
        nextPlayer = { ...nextPlayer, isInvincible: false };
      }

      const updateResult = updateEnemiesWithContact(
        enemiesRef.current,
        nextPlayer,
        mapRef.current,
        currentTime
      );

      const updatedEnemies = updateResult.enemies.filter(enemy => enemy.hp > 0);

      // 接触ダメージの処理
      if (updateResult.contactDamage > 0) {
        const damagedPlayer = damagePlayer(
          nextPlayer,
          updateResult.contactDamage,
          currentTime,
          COMBAT_CONFIG.invincibleDuration
        );
        const knockedPlayer =
          updateResult.contactEnemy && damagedPlayer !== nextPlayer
            ? applyPlayerKnockback(
                damagedPlayer,
                updateResult.contactEnemy,
                mapRef.current,
                updatedEnemies
              )
            : damagedPlayer;
        if (damagedPlayer !== nextPlayer) {
          setCombatState(prev => ({ ...prev, lastDamageAt: currentTime }));
        }
        nextPlayer = knockedPlayer;
      }

      // 敵の射程攻撃ダメージの処理
      if (updateResult.attackDamage > 0) {
        const damagedPlayer = damagePlayer(
          nextPlayer,
          updateResult.attackDamage,
          currentTime,
          COMBAT_CONFIG.invincibleDuration
        );
        if (damagedPlayer !== nextPlayer) {
          setCombatState(prev => ({ ...prev, lastDamageAt: currentTime }));
        }
        nextPlayer = damagedPlayer;
      }

      let remainingItems = itemsRef.current;
      const pickedIds: string[] = [];

      for (const item of remainingItems) {
        if (canPickupItem(nextPlayer, item)) {
          const pickupResult = pickupItem(nextPlayer, item);
          nextPlayer = pickupResult.player;
          pickedIds.push(pickupResult.itemId);
        }
      }

      if (pickedIds.length > 0) {
        remainingItems = remainingItems.filter(item => !pickedIds.includes(item.id));
      }

      setPlayer(nextPlayer);
      setEnemies(updatedEnemies);
      setItems(remainingItems);

      if (nextPlayer.hp <= 0) {
        setIsGameOver(true);
        setScreen(ScreenState.GAME_OVER);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [screen]);

  // 画面に応じたコンテンツをレンダリング
  return (
    <PageContainer>
      {screen === ScreenState.TITLE && <TitleScreen onStart={handleStartGame} />}
      {screen === ScreenState.PROLOGUE && <PrologueScreen onSkip={handleSkipPrologue} />}
      {screen === ScreenState.GAME && (
        <GameScreen
          map={map}
          player={player}
          enemies={enemies}
          items={items}
          mapState={mapState}
          goalPos={goalPos}
          debugState={debugState}
          onMove={handleMove}
          onTurn={handleTurn}
          onAttack={handleAttack}
          onMapToggle={handleMapToggle}
          onDebugToggle={handleDebugToggle}
          attackEffect={attackEffect}
          lastDamageAt={combatState.lastDamageAt}
        />
      )}
      {screen === ScreenState.CLEAR && (
        <ClearScreen onRetry={handleRetry} onBackToTitle={handleBackToTitle} />
      )}
      {screen === ScreenState.GAME_OVER && (
        <GameOverScreen onRetry={handleGameOverRetry} onBackToTitle={handleBackToTitle} />
      )}
    </PageContainer>
  );
};

export default IpnePage;
