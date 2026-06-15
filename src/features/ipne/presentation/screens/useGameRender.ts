/**
 * ゲーム描画フック
 *
 * Game.tsx の Canvas描画 useEffect を移設したもの。
 * canvas へ renderGameFrame で1フレーム描画する。
 * 依存配列・描画ロジックは元 effect と完全に同一。
 */
import React, { useEffect } from 'react';
import { renderGameFrame } from './render/renderGameFrame';
import type {
  GameMap,
  Player,
  Enemy,
  Item,
  Trap,
  Wall,
  AutoMapState,
  Position,
  StageNumber,
  DebugState,
  MovementState,
} from '../../index';
import type { SpriteRenderer } from '../sprites';
import type { EffectManager } from '../effects/effectManager';
import type { DeathEffect } from '../effects/deathEffect';
import type { BossWarningState } from '../effects/bossEffects';
import type { AfterImageManager, RewardEffectFlags } from '../effects/stageVisual';
import type { FloatingTextManager } from '../effects/floatingText';
import type { ComboState } from '../../domain/services/comboService';
import type { EffectEvent } from './GameModals';

/** useGameRender に渡すパラメータ（RenderContext の生入力相当） */
export interface UseGameRenderParams {
  /** canvas 要素の ref */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** canvas を包む div の ref（サイズ取得用） */
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  /** 描画タイムスタンプ（renderTime state の値） */
  renderTime: number;
  /** ゲームマップ */
  map: GameMap;
  /** プレイヤー */
  player: Player;
  /** 敵一覧 */
  enemies: Enemy[];
  /** アイテム一覧 */
  items: Item[];
  /** 罠一覧 */
  traps: Trap[];
  /** 特殊壁一覧 */
  walls: Wall[];
  /** 自動マップ状態 */
  mapState: AutoMapState;
  /** ゴール座標 */
  goalPos: { x: number; y: number };
  /** デバッグ状態 */
  debugState: DebugState;
  /** 攻撃エフェクト（位置・有効期限） */
  attackEffect?: { position: Position; until: number };
  /** 最終ダメージ受付タイムスタンプ（props 値） */
  lastDamageAt: number;
  /** 死亡アニメーション中フラグ */
  isDying: boolean;
  /** 現在ステージ番号 */
  currentStage?: StageNumber;
  /** 最大レベル */
  maxLevel: number;
  /** ステージ報酬エフェクトフラグ */
  rewardEffects: RewardEffectFlags;
  /** スプライトレンダラー */
  spriteRenderer: SpriteRenderer;
  /** 移動状態 ref */
  movementStateRef: React.MutableRefObject<MovementState>;
  /** エフェクトマネージャー ref */
  effectManagerRef: React.MutableRefObject<EffectManager>;
  /** 死亡エフェクト ref */
  deathEffectRef: React.MutableRefObject<DeathEffect>;
  /** ボス WARNING 状態 ref */
  bossWarningRef: React.MutableRefObject<BossWarningState>;
  /** 残像マネージャー ref */
  afterImageManagerRef: React.MutableRefObject<AfterImageManager>;
  /** ステージ開始演出タイムスタンプ ref */
  stageStartTimeRef: React.MutableRefObject<number>;
  /** ゲームオーバー遷移タイムスタンプ ref */
  dyingStartTimeRef: React.MutableRefObject<number>;
  /** プレイヤー攻撃アニメーション終了時刻 ref */
  playerAttackUntilRef: React.MutableRefObject<number>;
  /** プレイヤー被弾フレーム終了時刻 ref */
  playerDamageUntilRef: React.MutableRefObject<number>;
  /** 最後に発火した攻撃エフェクトのキー ref */
  lastAttackEffectKeyRef: React.MutableRefObject<string | null>;
  /** 最終ダメージ受付タイムスタンプ ref（前回値との比較用） */
  lastDamageAtRef: React.MutableRefObject<number>;
  /** フローティングテキストマネージャー ref（省略可） */
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>;
  /** コンボ状態 ref（省略可） */
  comboStateRef?: React.MutableRefObject<ComboState>;
  /** 外部エフェクトキュー ref（省略可） */
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>;
}

/**
 * Canvas描画フック
 *
 * canvas/ctx ガード後に renderGameFrame を呼び出して1フレームを描画する。
 * 依存配列は Game.tsx の元 effect と完全に同一。
 */
export function useGameRender(params: UseGameRenderParams): void {
  const {
    canvasRef, canvasWrapperRef, renderTime, map, player, enemies, items, traps, walls,
    mapState, goalPos, debugState, attackEffect, lastDamageAt, isDying, currentStage, maxLevel,
    rewardEffects, spriteRenderer, movementStateRef, effectManagerRef, deathEffectRef,
    bossWarningRef, afterImageManagerRef, stageStartTimeRef, dyingStartTimeRef,
    playerAttackUntilRef, playerDamageUntilRef, lastAttackEffectKeyRef, lastDamageAtRef,
    floatingTextManagerRef, comboStateRef, effectQueueRef,
  } = params;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGameFrame({
      ctx, canvas, canvasWrapperRef, now: renderTime, map, player, enemies, items, traps, walls,
      mapState, goalPos, debugState, attackEffect, lastDamageAt, isDying, currentStage, maxLevel,
      rewardEffects, spriteRenderer, movementStateRef, effectManagerRef, deathEffectRef,
      bossWarningRef, afterImageManagerRef, stageStartTimeRef, dyingStartTimeRef,
      playerAttackUntilRef, playerDamageUntilRef, lastAttackEffectKeyRef, lastDamageAtRef,
      floatingTextManagerRef, comboStateRef, effectQueueRef,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime, attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef, spriteRenderer, isDying]);
}
