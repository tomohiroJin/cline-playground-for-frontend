/**
 * Canvas レンダラー（Facade パターン）
 * - 描画責務を各サブレンダラーに委譲
 * - GameRendererPort の具象実装
 */
import type { GameRendererPort } from '../../domain/contracts/renderer';
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
} from '../../domain/types';
import type { GamepadToast } from '../../hooks/useGamepadInput';
import type { GameConstants } from '../../core/constants';
import { FieldRenderer } from './field-renderer';
import { EntityRenderer } from './entity-renderer';
import { EffectRenderer } from './effect-renderer';
import { UiRenderer } from './ui-renderer';

export class CanvasRenderer implements GameRendererPort {
  private readonly fieldRenderer: FieldRenderer;
  private readonly entityRenderer: EntityRenderer;
  private readonly effectRenderer: EffectRenderer;
  private readonly uiRenderer: UiRenderer;

  constructor(ctx: CanvasRenderingContext2D, consts: GameConstants) {
    this.fieldRenderer = new FieldRenderer(ctx, consts);
    this.entityRenderer = new EntityRenderer(ctx, consts);
    this.effectRenderer = new EffectRenderer(ctx, consts);
    this.uiRenderer = new UiRenderer(ctx, consts);
  }

  // 背景
  clear(now: number): void {
    this.fieldRenderer.clear(now);
  }

  // フィールド
  drawField(field: FieldConfig, obstacleStates: ObstacleState[], now: number): void {
    this.fieldRenderer.drawField(field, obstacleStates, now);
  }

  // エンティティ
  drawPuck(puck: Puck): void {
    this.entityRenderer.drawPuck(puck);
  }

  drawMallet(mallet: Mallet, color: string, hasGlow: boolean, sizeScale = 1): void {
    this.entityRenderer.drawMallet(mallet, color, hasGlow, sizeScale);
  }

  drawItem(item: Item, now: number): void {
    this.entityRenderer.drawItem(item, now);
  }

  // エフェクト
  drawEffectZones(effects: GameEffects, now: number): void {
    this.effectRenderer.drawEffectZones(effects, now);
  }

  drawFlash(flash: { type: string; time: number } | null, now: number): void {
    this.effectRenderer.drawFlash(flash, now);
  }

  drawGoalEffect(effect: GoalEffect | null, now: number): void {
    this.effectRenderer.drawGoalEffect(effect, now);
  }

  drawFeverEffect(active: boolean, now: number): void {
    this.effectRenderer.drawFeverEffect(active, now);
  }

  drawParticles(particles: Particle[]): void {
    this.effectRenderer.drawParticles(particles);
  }

  drawShockwave(hitStop: HitStopState): void {
    this.effectRenderer.drawShockwave(hitStop);
  }

  drawVignette(intensity = 0.5): void {
    this.effectRenderer.drawVignette(intensity);
  }

  drawShield(isPlayer: boolean, goalSize: number): void {
    this.effectRenderer.drawShield(isPlayer, goalSize);
  }

  drawMagnetEffect(mallet: Mallet, now: number): void {
    this.effectRenderer.drawMagnetEffect(mallet, now);
  }

  drawReaction(text: string, side: 'player' | 'cpu', elapsed: number): void {
    this.effectRenderer.drawReaction(text, side, elapsed);
  }

  // UI
  drawHUD(effects: GameEffects, now: number): void {
    this.uiRenderer.drawHUD(effects, now);
  }

  drawHelp(field?: FieldConfig): void {
    this.uiRenderer.drawHelp(field);
  }

  drawCountdown(countdownValue: number, elapsed: number): void {
    this.uiRenderer.drawCountdown(countdownValue, elapsed);
  }

  drawPauseOverlay(): void {
    this.uiRenderer.drawPauseOverlay();
  }

  drawCombo(combo: ComboState, now: number): void {
    this.uiRenderer.drawCombo(combo, now);
  }

  // トースト通知（GameRendererPort 外）
  drawToast(toast: GamepadToast | undefined, now: number): void {
    this.uiRenderer.drawToast(toast, now);
  }
}
