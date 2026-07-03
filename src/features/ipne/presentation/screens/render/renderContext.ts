/**
 * 描画コンテキスト型定義
 *
 * Game.tsx の描画 useEffect が参照する値を RenderContext に集約し、
 * セットアップで計算される共有ローカルを加えた FrameContext を定義。
 * 描画ロジックは個別モジュール（drawWorld / drawEnemies 等）へ抽出済み。
 */
import type React from 'react';
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
  Viewport,
  DebugState,
  MovementState,
} from '../../../index';
import type { SpriteRenderer, SpriteDefinition } from '../../sprites';
import type { EffectManager } from '../../effects/effectManager';
import type { DeathEffect } from '../../effects/deathEffect';
import type { BossWarningState } from '../../effects/bossEffects';
import type { AfterImageManager, RewardEffectFlags } from '../../effects/stageVisual';
import type { FloatingTextManager } from '../../effects/floatingText';
import type { ComboState } from '../../../domain/services/comboService';
import type { EffectEvent } from '../GameModals';
import type { VisualPositionTracker } from './visualPosition';
import type { HitStopManager } from '../../effects/hitStop';

/**
 * 描画 effect が closure で参照する値の集合。
 * Props・refs・useMemo の結果を含む。
 */
export interface RenderContext {
  /** 描画先 2D コンテキスト */
  ctx: CanvasRenderingContext2D;
  /** 描画先 canvas 要素 */
  canvas: HTMLCanvasElement;
  /** canvas を包む div の ref（サイズ取得用） */
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  /** 描画タイムスタンプ（renderTime state の値）。FrameContext ではヒットストップで凍結した visualNow に上書きされる（凍結されない実時刻は realNow を参照） */
  now: number;
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
  /** ステージ報酬エフェクトフラグ（useMemo 計算済み） */
  rewardEffects: RewardEffectFlags;
  /** スプライトレンダラー（useMemo 生成） */
  spriteRenderer: SpriteRenderer;
  /** 移動状態 ref（プレイヤー歩行アニメーション判定用） */
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
  /** 最後に発火した攻撃エフェクトのキー ref（重複防止） */
  lastAttackEffectKeyRef: React.MutableRefObject<string | null>;
  /** 最終ダメージ受付タイムスタンプ ref（前回値との比較用） */
  lastDamageAtRef: React.MutableRefObject<number>;
  /** フローティングテキストマネージャー ref（省略可） */
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>;
  /** コンボ状態 ref（省略可） */
  comboStateRef?: React.MutableRefObject<ComboState>;
  /** 外部エフェクトキュー ref（省略可） */
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>;
  /** 視覚位置トラッカー ref（描画位置補間用） */
  visualPositionsRef: React.MutableRefObject<VisualPositionTracker>;
  /** ヒットストップマネージャー ref */
  hitStopRef: React.MutableRefObject<HitStopManager>;
}

/**
 * フレームセットアップで計算されるローカル値を RenderContext に加えた型。
 * 描画サブ関数（drawWorld, drawEnemies 等）の引数型として使用する。
 */
export interface FrameContext extends RenderContext {
  /** 計算済みビューポート */
  viewport: Viewport;
  /** タイルサイズ（px） */
  tileSize: number;
  /** 全体マップ表示時の X オフセット（通常表示では 0） */
  offsetX: number;
  /** 全体マップ表示時の Y オフセット（通常表示では 0） */
  offsetY: number;
  /** 全体マップ表示モードか否か */
  useFullMap: boolean;
  /** 描画タイル幅（ビューポートまたはマップ全体） */
  drawWidth: number;
  /** 描画タイル高さ（ビューポートまたはマップ全体） */
  drawHeight: number;
  /** スプライト描画スケール（tileSize / SPRITE_SIZES.base） */
  spriteScale: number;
  /** ステージ別フロアスプライト */
  stageFloor: SpriteDefinition;
  /** ステージ別壁スプライト */
  stageWall: SpriteDefinition;
  /** スタート位置（デバッグパス描画用、見つからない場合は null） */
  startPos: Position | null;
  /** デバッグ用パス（デバッグモード有効かつ showPath 時のみ非空） */
  path: Position[];
  /** プレイヤーのスクリーン座標 */
  playerScreen: Position;
  /** ワールド座標 → スクリーン座標変換関数 */
  toScreenPosition: (pos: Position) => Position;
  /** 浮動小数カメラ原点（タイル単位。全体マップ表示時は {x:0, y:0}） */
  cameraOrigin: Position;
  /** 凍結を適用しない実タイムスタンプ（トリガー検知用） */
  realNow: number;
}
