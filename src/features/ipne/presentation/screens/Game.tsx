/**
 * ゲーム画面コンポーネント群（統合モジュール）
 * GameScreen をメインコンポーネントとして、GameHUD, GameControls, GameCanvas, GameModals を統合
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameRender } from './useGameRender';
import {
  GameRegion,
} from '../../../../pages/IpnePage.styles';
import {
  Direction,
  GameMap,
  Player,
  Enemy,
  Item,
  AutoMapState,
  DebugState,
  Position,
  MovementState,
  INITIAL_MOVEMENT_STATE,
  // MVP3追加
  Trap,
  Wall,
  StageNumber,
} from '../../index';
import { GameTimer } from '../../application/services/timerService';
import {
  EffectManager, DeathEffect,
  FloatingTextManager,
  createBossWarningState,
} from '../effects';
import type { BossWarningState } from '../effects';
import { SpriteRenderer } from '../sprites';
import { getActiveRewardEffects, AfterImageManager } from '../effects/stageVisual';
import { HitStopManager } from '../effects/hitStop';
import { VisualPositionTracker } from './render/visualPosition';

// 分割コンポーネントのインポート
import { GameHUD } from './GameHUD';
import { GameControls } from './GameControls';
import { GameCanvas } from './GameCanvas';

// re-export（後方互換性維持）
export { ClassSelectScreen, LevelUpOverlayComponent, HelpOverlayComponent } from './GameModals';
export type { EffectEvent } from './GameModals';

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
  // 視覚位置トラッカー（描画位置補間用）
  const visualPositionsRef = useRef(new VisualPositionTracker());
  // ヒットストップマネージャー（打撃の重み演出用）
  const hitStopRef = useRef(new HitStopManager());

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

  // Canvas描画（useGameRender フックへ委譲）
  useGameRender({
    canvasRef, canvasWrapperRef, renderTime, map, player, enemies, items, traps, walls,
    mapState, goalPos, debugState, attackEffect, lastDamageAt, isDying, currentStage, maxLevel,
    rewardEffects, spriteRenderer, movementStateRef, effectManagerRef, deathEffectRef,
    bossWarningRef, afterImageManagerRef, stageStartTimeRef, dyingStartTimeRef,
    playerAttackUntilRef, playerDamageUntilRef, lastAttackEffectKeyRef, lastDamageAtRef,
    floatingTextManagerRef, comboStateRef, effectQueueRef, visualPositionsRef, hitStopRef,
  });

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
