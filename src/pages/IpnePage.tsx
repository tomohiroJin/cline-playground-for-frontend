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
  canGoal,
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
  getEffectiveMoveInterval,
  INITIAL_MOVEMENT_STATE,
  DEFAULT_MOVEMENT_CONFIG,
  EnemyState,
  EnemyType,
  spawnEnemies,
  spawnItems,
  playerAttack,
  getEnemyAtPosition,
  COMBAT_CONFIG,
  updatePlayerDirection,
  processEnemyDeath,
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
  MAX_LEVEL,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
  shouldLevelUp,
  canChooseStat,
  getNextKillsRequired,
  placeGimmicks,
  getWallAt,
  revealWall,
  incrementKillCount,
  processLevelUp,
  StatTypeValue,
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
  RetryButton,
  BackToTitleButton,
  MapToggleButton,
  HPBarContainer,
  HPBarFill,
  HPBarText,
  AttackButton,
  GameOverTitle,
  GameOverButton,
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
  HelpOverlay,
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
  ResultContainer,
  ResultRating,
  ResultTime,
  ResultEpilogueTitle,
  ResultEpilogueText,
  ResultImage,
  ResultVideo,
  NewBestBadge,
  VideoPlayButton,
  // MVP5追加
  AudioSettingsButton,
  AudioSettingsPanel,
  AudioSettingsTitle,
  VolumeSliderContainer,
  VolumeLabel,
  VolumeName,
  VolumeValue,
  VolumeSlider,
  MuteButton,
  TapToStartMessage,
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
} from './IpnePage.styles';
import titleBg from '../assets/images/ipne_title_bg.webp';
import titleBgMobile from '../assets/images/ipne_title_bg_mobile.webp';
import prologueBg from '../assets/images/ipne_prologue_bg.webp';
import prologueBgMobile from '../assets/images/ipne_prologue_bg_mobile.webp';
import warriorClassImg from '../assets/images/ipne_class_warrior.webp';
import thiefClassImg from '../assets/images/ipne_class_thief.webp';

// MVP4モジュール
import {
  createTimer,
  startTimer,
  stopTimer,
  getElapsedTime,
  formatTimeShort,
  GameTimer,
} from '../features/ipne/timer';
import {
  createRecord,
  saveRecord,
} from '../features/ipne/record';
import {
  calculateRating,
  getEpilogueText,
  getGameOverText,
  getRatingColor,
  getEndingImage,
  getGameOverImage,
  getEndingVideo,
} from '../features/ipne/ending';
import { RatingValue, AudioSettings } from '../features/ipne/types';

// MVP5 音声モジュール
import {
  enableAudio,
  isAudioInitialized,
  initializeAudioSettings,
  getAudioSettings,
  setMasterVolume,
  setSeVolume,
  setBgmVolume,
  toggleMute,
  playTitleBgm,
  playGameBgm,
  playClearJingle,
  playGameOverJingle,
  stopBgm,
  playPlayerDamageSound,
  playEnemyKillSound,
  playBossKillSound,
  playGameClearSound,
  playGameOverSound,
  playLevelUpSound,
  playAttackHitSound,
  playItemPickupSound,
  playHealSound,
  playTrapTriggeredSound,
} from '../features/ipne/audio';
import { useSyncedState } from '../features/ipne/presentation';
import { resolvePlayerDamage, tickGameState, TickDisplayEffect, TickSoundEffect, GameTickEffect } from '../features/ipne/application';

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
    key: '#fcd34d',
  },
  // MVP3追加
  trapColors: {
    damage: '#dc2626',
    slow: '#3b82f6',
    alert: '#f59e0b',
  },
  wallColors: {
    breakable: '#78350f',
    passable: '#166534',
    invisible: '#4c1d95',
  },
};

// プロローグテキスト
const PROLOGUE_TEXTS = [
  '古代遺跡の調査中、突如として通路が崩落した。',
  '閉じ込められたあなたは、唯一の脱出口を探す。',
  'デジタルマップを頼りに、迷宮を進め。',
];

/**
 * 音声設定コンポーネント（MVP5）
 */
const AudioSettingsComponent: React.FC<{
  settings: AudioSettings;
  onMasterVolumeChange: (value: number) => void;
  onSeVolumeChange: (value: number) => void;
  onBgmVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onClose: () => void;
}> = ({ settings, onMasterVolumeChange, onSeVolumeChange, onBgmVolumeChange, onToggleMute, onClose }) => (
  <AudioSettingsPanel onClick={e => e.stopPropagation()}>
    <AudioSettingsTitle>音声設定</AudioSettingsTitle>

    <VolumeSliderContainer>
      <VolumeLabel>
        <VolumeName>マスター音量</VolumeName>
        <VolumeValue>{Math.round(settings.masterVolume * 100)}%</VolumeValue>
      </VolumeLabel>
      <VolumeSlider
        min={0}
        max={100}
        value={settings.masterVolume * 100}
        onChange={e => onMasterVolumeChange(Number(e.target.value) / 100)}
      />
    </VolumeSliderContainer>

    <VolumeSliderContainer>
      <VolumeLabel>
        <VolumeName>効果音</VolumeName>
        <VolumeValue>{Math.round(settings.seVolume * 100)}%</VolumeValue>
      </VolumeLabel>
      <VolumeSlider
        min={0}
        max={100}
        value={settings.seVolume * 100}
        onChange={e => onSeVolumeChange(Number(e.target.value) / 100)}
      />
    </VolumeSliderContainer>

    <VolumeSliderContainer>
      <VolumeLabel>
        <VolumeName>BGM</VolumeName>
        <VolumeValue>{Math.round(settings.bgmVolume * 100)}%</VolumeValue>
      </VolumeLabel>
      <VolumeSlider
        min={0}
        max={100}
        value={settings.bgmVolume * 100}
        onChange={e => onBgmVolumeChange(Number(e.target.value) / 100)}
      />
    </VolumeSliderContainer>

    <MuteButton $muted={settings.isMuted} onClick={onToggleMute}>
      {settings.isMuted ? '🔇 ミュート中' : '🔊 サウンドON'}
    </MuteButton>
  </AudioSettingsPanel>
);

/**
 * タイトル画面コンポーネント
 */
const TitleScreen: React.FC<{
  onStart: () => void;
  audioSettings: AudioSettings;
  showAudioSettings: boolean;
  isAudioReady: boolean;
  onAudioSettingsToggle: () => void;
  onMasterVolumeChange: (value: number) => void;
  onSeVolumeChange: (value: number) => void;
  onBgmVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onTapToStart: () => void;
}> = ({
  onStart,
  audioSettings,
  showAudioSettings,
  isAudioReady,
  onAudioSettingsToggle,
  onMasterVolumeChange,
  onSeVolumeChange,
  onBgmVolumeChange,
  onToggleMute,
  onTapToStart,
}) => (
  <Overlay $bgImage={titleBg} $bgImageMobile={titleBgMobile} onClick={!isAudioReady ? onTapToStart : undefined}>
    <AudioSettingsButton onClick={onAudioSettingsToggle} aria-label="音声設定">
      {audioSettings.isMuted ? '🔇' : '🔊'}
    </AudioSettingsButton>
    {showAudioSettings && (
      <AudioSettingsComponent
        settings={audioSettings}
        onMasterVolumeChange={onMasterVolumeChange}
        onSeVolumeChange={onSeVolumeChange}
        onBgmVolumeChange={onBgmVolumeChange}
        onToggleMute={onToggleMute}
        onClose={onAudioSettingsToggle}
      />
    )}
    <TitleContainer>
      {isAudioReady ? (
        <StartButton
          onClick={onStart}
          aria-label="ゲームを開始"
          style={{ marginTop: '60vh' }}
        >
          ゲームを開始
        </StartButton>
      ) : (
        <TapToStartMessage>
          タップしてゲームを開始
        </TapToStartMessage>
      )}
    </TitleContainer>
  </Overlay>
);

/**
 * 職業選択画面コンポーネント（MVP3）
 */
const ClassSelectScreen: React.FC<{
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
const LevelUpOverlayComponent: React.FC<{
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
    } else {
      // 最後のテキスト表示後、3秒待って自動遷移
      const autoSkipTimer = setTimeout(() => {
        onSkip();
      }, 3000);
      return () => clearTimeout(autoSkipTimer);
    }
  }, [textIndex, onSkip]);

  return (
    <Overlay $bgImage={prologueBg} $bgImageMobile={prologueBgMobile}>
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
 * ヘルプオーバーレイコンポーネント（MVP4）
 */
const HelpOverlayComponent: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <HelpOverlay onClick={onClose}>
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
  </HelpOverlay>
);

/**
 * クリア画面コンポーネント（MVP4拡張）
 * テスト用にエクスポート
 */
export const ClearScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
  clearTime: number;
  rating: RatingValue;
  isNewBest: boolean;
}> = ({ onRetry, onBackToTitle, clearTime, rating, isNewBest }) => {
  const epilogue = getEpilogueText(rating);
  const ratingColor = getRatingColor(rating);
  const endingImage = getEndingImage(rating);
  const endingVideo = getEndingVideo(rating);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <Overlay>
      <ResultContainer>
        {isNewBest && <NewBestBadge>🏆 NEW BEST!</NewBestBadge>}
        <ResultRating $color={ratingColor}>{rating.toUpperCase()}</ResultRating>
        <ResultTime>{formatTimeShort(clearTime)}</ResultTime>
        <ResultEpilogueTitle>{epilogue.title}</ResultEpilogueTitle>
        <ResultEpilogueText>{epilogue.text}</ResultEpilogueText>
        {endingVideo ? (
          showVideo ? (
            <ResultVideo
              src={endingVideo}
              autoPlay
              muted
              playsInline
              onEnded={() => setShowVideo(false)}
              aria-label={`${rating}ランククリア動画`}
            />
          ) : (
            <>
              <ResultImage src={endingImage} alt={`${rating}ランククリア`} />
              <VideoPlayButton onClick={() => setShowVideo(true)}>
                特別動画を見る
              </VideoPlayButton>
            </>
          )
        ) : (
          <ResultImage src={endingImage} alt={`${rating}ランククリア`} />
        )}
        <RetryButton onClick={onRetry}>もう一度プレイ</RetryButton>
        <BackToTitleButton onClick={onBackToTitle}>タイトルに戻る</BackToTitleButton>
      </ResultContainer>
    </Overlay>
  );
};

/**
 * ゲームオーバー画面コンポーネント（MVP4拡張）
 */
const GameOverScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
}> = ({ onRetry, onBackToTitle }) => {
  const gameOverText = getGameOverText();
  const gameOverImage = getGameOverImage();

  return (
    <Overlay>
      <ResultContainer>
        <GameOverTitle>GAME OVER</GameOverTitle>
        <ResultEpilogueTitle>{gameOverText.title}</ResultEpilogueTitle>
        <ResultEpilogueText>{gameOverText.text}</ResultEpilogueText>
        <ResultImage src={gameOverImage} alt="ゲームオーバー" />
        <GameOverButton onClick={onRetry}>リトライ</GameOverButton>
        <GameOverButton onClick={onBackToTitle}>タイトルへ</GameOverButton>
      </ResultContainer>
    </Overlay>
  );
};

/**
 * ゲーム画面コンポーネント
 */
const GameScreen: React.FC<{
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

/**
 * IPNE メインページコンポーネント
 */
const IpnePage: React.FC = () => {
  const [screen, setScreen] = useState<ScreenStateValue>(ScreenState.TITLE);
  const [map, setMap, mapRef] = useSyncedState<GameMap>([]);
  const [player, setPlayer, playerRef] = useSyncedState<Player>(createPlayer(0, 0));
  const [enemies, setEnemies, enemiesRef] = useSyncedState<Enemy[]>([]);
  const [items, setItems, itemsRef] = useSyncedState<Item[]>([]);
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
  // MVP3追加
  const [selectedClass, setSelectedClass] = useState<PlayerClassValue>(PlayerClass.WARRIOR);
  const [traps, setTraps, trapsRef] = useSyncedState<Trap[]>([]);
  const [walls, setWalls, wallsRef] = useSyncedState<Wall[]>([]);
  // レベルアップポイント制
  const [pendingLevelPoints, setPendingLevelPoints, pendingLevelPointsRef] = useSyncedState(0);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  // MVP4追加
  const [timer, setTimer] = useState<GameTimer>(() => createTimer());
  const [showHelp, setShowHelp] = useState(false);
  const [clearTime, setClearTime] = useState(0);
  const [clearRating, setClearRating] = useState<RatingValue>('d');
  const [isNewBest, setIsNewBest] = useState(false);

  // MVP6追加
  const [showKeyRequiredMessage, setShowKeyRequiredMessage] = useState(false);

  // MVP5追加: 音声関連
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => initializeAudioSettings());
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const roomsRef = useRef<Room[]>([]);

  const setupGameState = useCallback((newMap: GameMap, rooms: Room[], playerClass: PlayerClassValue) => {
    const startPos = findStartPosition(newMap);
    const goal = findGoalPosition(newMap);

    if (!startPos || !goal) return;

    setMap(newMap);
    setGoalPos(goal);
    // MVP3: 職業を使ってプレイヤー作成
    const createdPlayer = createPlayer(startPos.x, startPos.y, playerClass);
    setPlayer(createdPlayer);
    setIsGameOver(false);
    // レベルアップポイント制のリセット
    setPendingLevelPoints(0);
    setShowLevelUpModal(false);
    setCombatState({ lastAttackAt: 0, lastDamageAt: 0 });
    setAttackEffect(undefined);

    // MVP4: タイマーをリセットして開始
    const newTimer = startTimer(createTimer());
    setTimer(newTimer);
    setShowHelp(false);
    setClearTime(0);
    setIsNewBest(false);

    roomsRef.current = rooms;

    const spawnedEnemies = spawnEnemies(rooms, startPos, goal);
    const spawnedItems = spawnItems(rooms, spawnedEnemies, [startPos, goal], goal);
    setEnemies(spawnedEnemies);
    setItems(spawnedItems);

    // MVP3: 罠と壁を配置（戦略的配置を使用）
    const gimmickResult = placeGimmicks(rooms, newMap, [startPos, goal], undefined, startPos, goal);
    setTraps(gimmickResult.traps);
    setWalls(gimmickResult.walls);

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
  const initGame = useCallback((playerClass: PlayerClassValue) => {
    const result = createMapWithRooms();
    setupGameState(result.map, result.rooms, playerClass);
  }, [setupGameState]);

  // 画面遷移ハンドラー
  // MVP3: タイトル→職業選択へ
  const handleStartGame = useCallback(() => {
    setScreen(ScreenState.CLASS_SELECT);
  }, []);

  // MVP3: 職業選択→プロローグへ
  const handleClassSelect = useCallback((playerClass: PlayerClassValue) => {
    setSelectedClass(playerClass);
    setScreen(ScreenState.PROLOGUE);
  }, []);

  const handleSkipPrologue = useCallback(() => {
    initGame(selectedClass);
    setScreen(ScreenState.GAME);
  }, [initGame, selectedClass]);

  const handleRetry = useCallback(() => {
    initGame(selectedClass);
    setScreen(ScreenState.GAME);
  }, [initGame, selectedClass]);

  const handleGameOverRetry = useCallback(() => {
    if (mapRef.current.length === 0) return;
    setupGameState(mapRef.current, roomsRef.current, selectedClass);
    setScreen(ScreenState.GAME);
  }, [setupGameState, selectedClass]);

  const handleBackToTitle = useCallback(() => {
    setScreen(ScreenState.TITLE);
    setIsGameOver(false);
  }, []);

  // MVP3: レベルアップ選択（ポイント制対応）
  const handleLevelUpChoice = useCallback((stat: StatTypeValue) => {
    const leveledPlayer = processLevelUp(player, stat);
    setPlayer(leveledPlayer);
    setPendingLevelPoints(prev => {
      const newPoints = prev - 1;
      // ポイントが0になったら自動で閉じる
      if (newPoints <= 0) {
        setShowLevelUpModal(false);
      }
      return newPoints;
    });
  }, [player]);

  // レベルアップ画面を開く
  const handleOpenLevelUpModal = useCallback(() => {
    if (pendingLevelPoints > 0) {
      setShowLevelUpModal(true);
    }
  }, [pendingLevelPoints]);

  // レベルアップ画面を閉じる
  const handleCloseLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
  }, []);

  // MVP4: ヘルプ表示トグル
  const handleHelpToggle = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // MVP5: 音声初期化（ユーザー操作後に呼び出す）
  const handleEnableAudio = useCallback(async () => {
    const success = await enableAudio();
    if (success) {
      setIsAudioReady(true);
      // タイトル画面でBGMを再生
      if (screen === ScreenState.TITLE) {
        playTitleBgm();
      }
    }
  }, [screen]);

  // MVP5: 音声設定トグル
  const handleAudioSettingsToggle = useCallback(() => {
    setShowAudioSettings(prev => !prev);
  }, []);

  // MVP5: マスター音量変更
  const handleMasterVolumeChange = useCallback((value: number) => {
    setMasterVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  // MVP5: SE音量変更
  const handleSeVolumeChange = useCallback((value: number) => {
    setSeVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  // MVP5: BGM音量変更
  const handleBgmVolumeChange = useCallback((value: number) => {
    setBgmVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  // MVP5: ミュートトグル
  const handleToggleMute = useCallback(() => {
    toggleMute();
    setAudioSettings(getAudioSettings());
  }, []);

  // MVP5: 画面遷移時のBGM切り替え
  useEffect(() => {
    if (!isAudioReady) return;

    switch (screen) {
      case ScreenState.TITLE:
        playTitleBgm();
        break;
      case ScreenState.GAME:
        playGameBgm();
        break;
      case ScreenState.CLEAR:
        stopBgm();
        playClearJingle();
        playGameClearSound();
        break;
      case ScreenState.GAME_OVER:
        stopBgm();
        playGameOverJingle();
        playGameOverSound();
        break;
      default:
        // CLASS_SELECT, PROLOGUEではタイトルBGMを継続
        break;
    }
  }, [screen, isAudioReady]);

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
        const damageResult = resolvePlayerDamage({
          player: { ...player, direction },
          damage: enemyAtTarget.damage,
          currentTime,
          invincibleDuration: COMBAT_CONFIG.invincibleDuration,
          sourceEnemy: enemyAtTarget,
          map: mapRef.current,
          enemies: enemiesRef.current,
          walls: wallsRef.current,
        });
        if (damageResult.tookDamage) {
          setCombatState(prev => ({ ...prev, lastDamageAt: currentTime }));
          // MVP5: ダメージ音
          playPlayerDamageSound();
        }
        setPlayer(damageResult.player);
        return;
      }

      // 移動先に特殊壁があれば発見済みにする
      const wallAtTarget = getWallAt(wallsRef.current, nextPosition.x, nextPosition.y);
      if (wallAtTarget && wallAtTarget.state === WallState.INTACT) {
        const updatedWalls = wallsRef.current.map(w =>
          w.x === wallAtTarget.x && w.y === wallAtTarget.y ? revealWall(w) : w
        );
        setWalls(updatedWalls);
      }

      const newPlayer = movePlayer(player, direction, map, wallsRef.current);
      setPlayer(newPlayer);

      // 探索状態を更新
      setMapState(prev => ({
        ...prev,
        exploration: updateExploration(prev.exploration, newPlayer, map),
      }));

      // ゴール判定
      if (isGoal(map, newPlayer.x, newPlayer.y)) {
        // 鍵を持っている場合のみクリア
        if (canGoal(newPlayer)) {
          // MVP4: タイマー停止と記録保存
          const now = Date.now();
          const stoppedTimer = stopTimer(timer, now);
          const elapsed = getElapsedTime(stoppedTimer, now);
          const rating = calculateRating(elapsed);

          setClearTime(elapsed);
          setClearRating(rating);
          setTimer(stoppedTimer);

          // 記録を保存
          const record = createRecord(elapsed, rating, selectedClass);
          const { isNewBest: newBest } = saveRecord(record);
          setIsNewBest(newBest);

          setScreen(ScreenState.CLEAR);
        } else {
          // 鍵がない場合はメッセージを表示
          setShowKeyRequiredMessage(true);
          setTimeout(() => setShowKeyRequiredMessage(false), 2000);
        }
      }
    },
    [player, map, isGameOver, timer, selectedClass]
  );

  const handleTurn = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
      if (isGameOver) return;
      setPlayer(prev => updatePlayerDirection(prev, direction));
    },
    [isGameOver]
  );

  const handleAttack = useCallback(() => {
    // レベルアップモーダル表示中は攻撃不可（ポイントがあっても閉じていれば攻撃可能）
    if (isGameOver || showLevelUpModal) return;
    const currentTime = Date.now();
    const beforeEnemies = enemiesRef.current;
    const currentWalls = wallsRef.current;
    const result = playerAttack(playerRef.current, beforeEnemies, mapRef.current, currentTime, currentWalls);

    if (result.didAttack) {
      setCombatState(prev => ({ ...prev, lastAttackAt: currentTime }));
      if (result.attackPosition) {
        setAttackEffect({ position: result.attackPosition, until: currentTime + 150 });
        // MVP5: 攻撃命中音
        playAttackHitSound();
      } else {
        setAttackEffect(undefined);
      }
    }

    // 壁への攻撃結果を反映
    if (result.walls) {
      setWalls(result.walls);
    }

    // MVP3: 撃破した敵の数をカウントしてキルカウントを更新
    const survivingEnemies = result.enemies.filter(enemy => enemy.hp > 0);
    const survivingIds = new Set(survivingEnemies.map(e => e.id));
    const killedEnemies = beforeEnemies.filter(e => !survivingIds.has(e.id));

    let updatedPlayer = result.player;
    let updatedItems = itemsRef.current;

    if (killedEnemies.length > 0) {
      // MVP5: 敵撃破音（ボスなら特別な音）
      const killedBoss = killedEnemies.some(e => e.type === EnemyType.BOSS);
      if (killedBoss) {
        playBossKillSound();
      } else {
        playEnemyKillSound();
      }

      // MVP6: ボス撃破時は鍵をドロップ
      for (const enemy of killedEnemies) {
        const deathResult = processEnemyDeath(enemy);
        if (deathResult.droppedItem) {
          updatedItems = [...updatedItems, deathResult.droppedItem];
        }
      }

      // 撃破数だけインクリメント
      // 実効レベル = 現在レベル + 未使用ポイント（ポイント割り振るまでレベルアップしない）
      let addedPointsInLoop = 0;
      for (let i = 0; i < killedEnemies.length; i++) {
        const killResult = incrementKillCount(updatedPlayer);
        updatedPlayer = killResult.player;

        // 実効レベル = 現在レベル + 既存の未使用ポイント + このループ内で追加したポイント
        const effectiveLevel = updatedPlayer.level + pendingLevelPointsRef.current + addedPointsInLoop;

        // レベル上限（10）に達している場合はレベルアップしない
        if (effectiveLevel >= MAX_LEVEL) continue;

        // 実効レベルでレベルアップ判定
        if (shouldLevelUp(effectiveLevel, updatedPlayer.killCount)) {
          setPendingLevelPoints(prev => prev + 1);
          addedPointsInLoop++;
          // MVP5: レベルアップ音
          playLevelUpSound();
        }
      }
    }

    setPlayer(updatedPlayer);
    setEnemies(survivingEnemies);
    setItems(updatedItems);
  }, [isGameOver, showLevelUpModal]);

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

  const dispatchTickEffects = useCallback((effects: GameTickEffect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'sound') {
        switch (effect.type) {
          case TickSoundEffect.PLAYER_DAMAGE:
            setCombatState(prev => ({ ...prev, lastDamageAt: Date.now() }));
            playPlayerDamageSound();
            break;
          case TickSoundEffect.ITEM_PICKUP:
            playItemPickupSound();
            break;
          case TickSoundEffect.HEAL:
            playHealSound();
            break;
          case TickSoundEffect.TRAP_TRIGGERED:
            playTrapTriggeredSound();
            break;
          case TickSoundEffect.LEVEL_UP:
            playLevelUpSound();
            break;
          default:
            break;
        }
      } else if (effect.kind === 'display') {
        switch (effect.type) {
          case TickDisplayEffect.MAP_REVEALED: {
            const fullExploration = mapRef.current.map(row => row.map(() => 1 as const));
            setMapState(prev => ({ ...prev, exploration: fullExploration }));
            break;
          }
          case TickDisplayEffect.GAME_OVER:
            setIsGameOver(true);
            setScreen(ScreenState.GAME_OVER);
            break;
          default:
            break;
        }
      }
    }
  }, []);

  // 敵AI・接触・アイテム取得の更新ループ
  useEffect(() => {
    if (screen !== ScreenState.GAME) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const tickResult = tickGameState({
        map: mapRef.current,
        player: playerRef.current,
        enemies: enemiesRef.current,
        items: itemsRef.current,
        traps: trapsRef.current,
        walls: wallsRef.current,
        pendingLevelPoints: pendingLevelPointsRef.current,
        currentTime,
        maxLevel: MAX_LEVEL,
      });

      dispatchTickEffects(tickResult.effects);
      setPlayer(tickResult.player);
      setEnemies(tickResult.enemies);
      setItems(tickResult.items);
      setTraps(tickResult.traps);
      setPendingLevelPoints(tickResult.pendingLevelPoints);
    }, 200);

    return () => clearInterval(interval);
  }, [screen, dispatchTickEffects]);

  // 画面に応じたコンテンツをレンダリング
  return (
    <PageContainer>
      {screen === ScreenState.TITLE && (
        <TitleScreen
          onStart={handleStartGame}
          audioSettings={audioSettings}
          showAudioSettings={showAudioSettings}
          isAudioReady={isAudioReady}
          onAudioSettingsToggle={handleAudioSettingsToggle}
          onMasterVolumeChange={handleMasterVolumeChange}
          onSeVolumeChange={handleSeVolumeChange}
          onBgmVolumeChange={handleBgmVolumeChange}
          onToggleMute={handleToggleMute}
          onTapToStart={handleEnableAudio}
        />
      )}
      {screen === ScreenState.CLASS_SELECT && <ClassSelectScreen onSelect={handleClassSelect} />}
      {screen === ScreenState.PROLOGUE && <PrologueScreen onSkip={handleSkipPrologue} />}
      {screen === ScreenState.GAME && (
        <>
          <GameScreen
            map={map}
            player={player}
            enemies={enemies}
            items={items}
            traps={traps}
            walls={walls}
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
            timer={timer}
            showHelp={showHelp}
            onHelpToggle={handleHelpToggle}
            showKeyRequiredMessage={showKeyRequiredMessage}
            pendingLevelPoints={pendingLevelPoints}
            onOpenLevelUpModal={handleOpenLevelUpModal}
          />
          {showLevelUpModal && pendingLevelPoints > 0 && (
            <LevelUpOverlayComponent
              player={player}
              pendingPoints={pendingLevelPoints}
              onChoose={handleLevelUpChoice}
              onClose={handleCloseLevelUpModal}
            />
          )}
        </>
      )}
      {screen === ScreenState.CLEAR && (
        <ClearScreen
          onRetry={handleRetry}
          onBackToTitle={handleBackToTitle}
          clearTime={clearTime}
          rating={clearRating}
          isNewBest={isNewBest}
        />
      )}
      {screen === ScreenState.GAME_OVER && (
        <GameOverScreen onRetry={handleGameOverRetry} onBackToTitle={handleBackToTitle} />
      )}
    </PageContainer>
  );
};

export default IpnePage;
