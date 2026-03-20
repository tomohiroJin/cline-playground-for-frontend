// RendererPort の Canvas 実装
// 既存 renderer.ts の関数群を RendererPort インターフェースでラップ

import type { RendererPort } from '../../application/ports/renderer-port';
import type { Player } from '../../domain/player/types';
import type { Point } from '../../domain/shared/types';
import type { Course } from '../../domain/track/types';
import type { Card } from '../../domain/card/types';
import type { HighlightEvent } from '../../domain/highlight/types';
import type { Particle, Spark, Confetti } from '../../types';
import { Render } from '../../renderer';
import { Track } from '../../track';

/** Canvas RendererPort の生成 */
export const createCanvasRenderer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): RendererPort => ({
  beginFrame(shake: number): void {
    ctx.save();
    if (shake > 0.1) {
      ctx.translate(
        (Math.random() - 0.5) * shake * 4,
        (Math.random() - 0.5) * shake * 4,
      );
    }
    ctx.clearRect(0, 0, width, height);
  },

  endFrame(): void {
    ctx.restore();
  },

  renderBackground(course: Course): void {
    Render.background(ctx, course);
  },

  renderTrack(points: readonly Point[]): void {
    Render.track(ctx, points as Point[]);
    const sl = Track.startLine(points as Point[]);
    Render.startLine(ctx, sl);
  },

  renderKart(player: Player): void {
    Render.kart(ctx, player);
  },

  renderHud(players: readonly Player[], courseName: string, maxLaps: number, raceStart: number): void {
    // 旧 Render にはまとめた hud がないため、個別にラップ情報等を描画
    // フェーズ5 でリファクタリング予定。現時点では基本的な情報のみ。
  },

  renderEffects(particles: readonly Particle[], sparks: readonly Spark[]): void {
    Render.particles(ctx, particles as Particle[], sparks as Spark[]);
  },

  renderDraftUI(hand: readonly Card[], selectedIndex: number, timer: number, maxTimer: number, playerName: string, lap: number, confirmed: boolean, animProgress: number): void {
    Render.draftUI(ctx, hand as Card[], selectedIndex, timer, maxTimer, playerName, lap, confirmed, animProgress);
  },

  renderHighlightBanner(event: HighlightEvent, colors: Record<string, string>, index: number): void {
    Render.highlightBanner(ctx, event as HighlightEvent & { displayTime: number }, colors, index);
  },

  renderCountdown(elapsed: number): void {
    // 旧 Render にはカウントダウン専用メソッドがないため no-op
    // RacingGame.tsx 内でインライン描画されている
  },

  renderResult(confetti: readonly Confetti[]): void {
    Render.confetti(ctx, confetti as Confetti[]);
  },
});
