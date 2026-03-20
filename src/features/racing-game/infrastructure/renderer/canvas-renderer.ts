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

  renderHud(_players: readonly Player[], _courseName: string, _maxLaps: number, _raceStart: number): void {
    // 現在 RacingGame.tsx が Render オブジェクトを直接呼んで HUD を描画しているため、
    // この RendererPort 経由では呼ばれない。
    // フェーズ5-1 で RacingGame.tsx をスリム化する際に hud-renderer.ts として実装する。
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

  renderCountdown(_elapsed: number): void {
    // カウントダウン描画は RacingGame.tsx でインライン実装されているため、
    // この RendererPort 経由では呼ばれない。
    // フェーズ5-1 で hud-renderer.ts に移行する。
  },

  renderResult(confetti: readonly Confetti[]): void {
    Render.confetti(ctx, confetti as Confetti[]);
  },
});
