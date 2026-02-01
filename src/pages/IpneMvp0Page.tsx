/**
 * IPNE MVP0 ゲームページ
 * シンプルな迷路ゲーム - タイトル→プロローグ→ゲーム→クリア の画面遷移
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createMap,
  createPlayer,
  movePlayer,
  findStartPosition,
  isGoal,
  Direction,
  ScreenState,
  TileType,
  GameMap,
  Player,
  ScreenStateValue,
} from '../features/ipne-mvp0';
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
} from './IpneMvp0Page.styles';
import titleBg from '../assets/images/ipne_mvp0_title_bg.webp';
import prologueBg from '../assets/images/ipne_mvp0_prologue_bg.webp';

// 描画設定
const CONFIG = {
  tileSize: 32,
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
  onMove: (direction: (typeof Direction)[keyof typeof Direction]) => void;
}> = ({ map, player, onMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 空マップの場合は描画しない
    if (map.length === 0 || !map[0]) return;

    const { tileSize, wallColor, floorColor, goalColor, startColor, playerColor } = CONFIG;

    // キャンバスサイズ設定
    canvas.width = map[0].length * tileSize;
    canvas.height = map.length * tileSize;

    // マップ描画
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        let color = floorColor;

        if (tile === TileType.WALL) color = wallColor;
        else if (tile === TileType.GOAL) color = goalColor;
        else if (tile === TileType.START) color = startColor;

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // グリッド線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // プレイヤー描画（円）
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(
      player.x * tileSize + tileSize / 2,
      player.y * tileSize + tileSize / 2,
      tileSize / 2 - 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [map, player]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysRef.current[key]) return; // 連続入力防止
      keysRef.current[key] = true;

      if (key === 'w' || key === 'arrowup') {
        e.preventDefault();
        onMove(Direction.UP);
      } else if (key === 's' || key === 'arrowdown') {
        e.preventDefault();
        onMove(Direction.DOWN);
      } else if (key === 'a' || key === 'arrowleft') {
        e.preventDefault();
        onMove(Direction.LEFT);
      } else if (key === 'd' || key === 'arrowright') {
        e.preventDefault();
        onMove(Direction.RIGHT);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
    };

    // フォーカス喪失時にすべてのキー状態をリセット
    const handleBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onMove]);

  // モバイル用タッチ操作
  const handleTouchMove = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
      onMove(direction);
    },
    [onMove]
  );

  return (
    <GameRegion role="region" aria-label="ゲーム画面">
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
              handleTouchMove(Direction.UP);
            }}
            aria-label="上に移動"
          >
            ▲
          </DPadButton>
          <DPadButton
            $direction="left"
            onPointerDown={e => {
              e.preventDefault();
              handleTouchMove(Direction.LEFT);
            }}
            aria-label="左に移動"
          >
            ◀
          </DPadButton>
          <DPadButton
            $direction="right"
            onPointerDown={e => {
              e.preventDefault();
              handleTouchMove(Direction.RIGHT);
            }}
            aria-label="右に移動"
          >
            ▶
          </DPadButton>
          <DPadButton
            $direction="down"
            onPointerDown={e => {
              e.preventDefault();
              handleTouchMove(Direction.DOWN);
            }}
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
 * IPNE MVP0 メインページコンポーネント
 */
const IpneMvp0Page: React.FC = () => {
  const [screen, setScreen] = useState<ScreenStateValue>(ScreenState.TITLE);
  const [map, setMap] = useState<GameMap>([]);
  const [player, setPlayer] = useState<Player>({ x: 0, y: 0 });

  // ゲーム初期化
  const initGame = useCallback(() => {
    const newMap = createMap();
    const startPos = findStartPosition(newMap);
    if (startPos) {
      setMap(newMap);
      setPlayer(createPlayer(startPos.x, startPos.y));
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

      // ゴール判定
      if (isGoal(map, newPlayer.x, newPlayer.y)) {
        setScreen(ScreenState.CLEAR);
      }
    },
    [player, map]
  );

  // 画面に応じたコンテンツをレンダリング
  return (
    <PageContainer>
      {screen === ScreenState.TITLE && <TitleScreen onStart={handleStartGame} />}
      {screen === ScreenState.PROLOGUE && <PrologueScreen onSkip={handleSkipPrologue} />}
      {screen === ScreenState.GAME && <GameScreen map={map} player={player} onMove={handleMove} />}
      {screen === ScreenState.CLEAR && (
        <ClearScreen onRetry={handleRetry} onBackToTitle={handleBackToTitle} />
      )}
    </PageContainer>
  );
};

export default IpneMvp0Page;
