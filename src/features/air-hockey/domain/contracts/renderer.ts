/**
 * レンダラーポート（インターフェース）
 * - ドメイン層で定義し、インフラ層で実装する
 * - 描画の抽象化（Canvas 依存をインフラ層に隔離）
 */
import type {
  FieldConfig,
  GameEffects,
  Mallet,
  Puck,
  Item,
  GoalEffect,
  ObstacleState,
  Particle,
  ComboState,
  HitStopState,
} from '../types';

/** レンダラーポートインターフェース */
export interface GameRendererPort {
  // 背景
  clear(now: number): void;

  // フィールド
  drawField(field: FieldConfig, obstacleStates: ObstacleState[], now: number): void;

  // エンティティ
  drawPuck(puck: Puck): void;
  drawMallet(mallet: Mallet, color: string, hasGlow: boolean, sizeScale?: number): void;
  drawItem(item: Item, now: number): void;

  // エフェクト
  drawEffectZones(effects: GameEffects, now: number): void;
  drawFlash(flash: { type: string; time: number } | null, now: number): void;
  drawGoalEffect(effect: GoalEffect | null, now: number): void;
  drawFeverEffect(active: boolean, now: number): void;
  drawParticles(particles: Particle[]): void;
  drawShockwave(hitStop: HitStopState): void;
  drawVignette(intensity?: number): void;
  drawShield(isPlayer: boolean, goalSize: number): void;
  drawMagnetEffect(mallet: Mallet, now: number): void;
  drawReaction(text: string, side: 'player' | 'cpu', elapsed: number): void;

  // UI
  drawHUD(effects: GameEffects, now: number): void;
  drawHelp(field?: FieldConfig): void;
  drawCountdown(countdownValue: number, elapsed: number): void;
  drawPauseOverlay(): void;
  drawCombo(combo: ComboState, now: number): void;
}
