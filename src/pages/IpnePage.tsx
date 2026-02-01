/**
 * IPNE ゲームページ
 * シンプルな迷路ゲーム - タイトル→プロローグ→ゲーム→クリア の画面遷移
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createMap,
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
  ScreenStateValue,
  AutoMapState,
  initExploration,
  updateExploration,
  drawAutoMap,
  calculateViewport,
  getCanvasSize,
  Viewport,
  VIEWPORT_CONFIG,
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
 * ゲーム画面コンポーネント
 */
const GameScreen: React.FC<{
  map: GameMap;
  player: Player;
  mapState: AutoMapState;
  goalPos: { x: number; y: number };
  debugState: DebugState;
  onMove: (direction: (typeof Direction)[keyof typeof Direction]) => void;
  onMapToggle: () => void;
  onDebugToggle: (option: keyof Omit<DebugState, 'enabled'>) => void;
}> = ({ map, player, mapState, goalPos, debugState, onMove, onMapToggle, onDebugToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const movementStateRef = useRef<MovementState>(INITIAL_MOVEMENT_STATE);
  const animationFrameRef = useRef<number | null>(null);

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
    const { wallColor, floorColor, goalColor, startColor, playerColor } = CONFIG;

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
    const drawTileCount = useFullMap ? mapWidth * mapHeight : viewport.width * viewport.height;
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

    // プレイヤー描画
    const playerScreenX = useFullMap
      ? offsetX + player.x * tileSize + tileSize / 2
      : (player.x - viewport.x) * tileSize + tileSize / 2;
    const playerScreenY = useFullMap
      ? offsetY + player.y * tileSize + tileSize / 2
      : (player.y - viewport.y) * tileSize + tileSize / 2;

    const playerRadius = useFullMap ? Math.max(tileSize / 2 - 1, 2) : tileSize / 2 - 4;

    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, playerRadius, 0, Math.PI * 2);
    ctx.fill();

    // プレイヤーの縁取り（視認性向上）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = useFullMap ? 1 : 2;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, playerRadius, 0, Math.PI * 2);
    ctx.stroke();

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
        drawCoordinateOverlay(ctx, player.x, player.y, playerScreenX, playerScreenY);
      }
    }
  }, [map, player, mapState, goalPos, debugState]);

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

      if (shouldMove && newState.activeDirection) {
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
  }, [onMove, onMapToggle, debugState.enabled, onDebugToggle]);

  // D-pad押下開始時のハンドラー
  const handleDPadPointerDown = useCallback(
    (direction: DirectionValue) => {
      const currentTime = Date.now();
      // 最初の1マス目は即座に移動
      onMove(direction);
      // 連続移動状態を開始
      movementStateRef.current = startMovement(
        movementStateRef.current,
        direction,
        currentTime
      );
    },
    [onMove]
  );

  // D-pad離し時のハンドラー
  const handleDPadPointerUp = useCallback((direction: DirectionValue) => {
    movementStateRef.current = stopMovement(movementStateRef.current, direction);
  }, []);

  return (
    <GameRegion role="region" aria-label="ゲーム画面">
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
  const [player, setPlayer] = useState<Player>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapState, setMapState] = useState<AutoMapState>({
    exploration: [],
    isMapVisible: true,
    isFullScreen: false,
  });
  const [debugState, setDebugState] = useState<DebugState>(() => initDebugState());

  // ゲーム初期化
  const initGame = useCallback(() => {
    const newMap = createMap();
    const startPos = findStartPosition(newMap);
    const goal = findGoalPosition(newMap);

    if (startPos && goal) {
      setMap(newMap);
      setPlayer(createPlayer(startPos.x, startPos.y));
      setGoalPos(goal);

      // 探索状態を初期化
      const exploration = initExploration(newMap[0].length, newMap.length);
      const updatedExploration = updateExploration(exploration, startPos, newMap);
      setMapState({
        exploration: updatedExploration,
        isMapVisible: true,
        isFullScreen: false,
      });
    }
  }, []);

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

  const handleBackToTitle = useCallback(() => {
    setScreen(ScreenState.TITLE);
  }, []);

  // プレイヤー移動ハンドラー
  const handleMove = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
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
    [player, map]
  );

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

  // 画面に応じたコンテンツをレンダリング
  return (
    <PageContainer>
      {screen === ScreenState.TITLE && <TitleScreen onStart={handleStartGame} />}
      {screen === ScreenState.PROLOGUE && <PrologueScreen onSkip={handleSkipPrologue} />}
      {screen === ScreenState.GAME && (
        <GameScreen
          map={map}
          player={player}
          mapState={mapState}
          goalPos={goalPos}
          debugState={debugState}
          onMove={handleMove}
          onMapToggle={handleMapToggle}
          onDebugToggle={handleDebugToggle}
        />
      )}
      {screen === ScreenState.CLEAR && (
        <ClearScreen onRetry={handleRetry} onBackToTitle={handleBackToTitle} />
      )}
    </PageContainer>
  );
};

export default IpnePage;
