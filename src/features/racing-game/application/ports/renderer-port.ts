// 描画ポートインターフェース（依存性逆転: Application 層が定義、Infrastructure 層が実装）

import type { Player } from '../../domain/player/types';
import type { Point } from '../../domain/shared/types';
import type { Course } from '../../domain/track/types';
import type { Card } from '../../domain/card/types';
import type { HighlightEvent } from '../../domain/highlight/types';
import type { Particle, Spark, Confetti } from '../../types';

export interface RendererPort {
  /** 背景描画 */
  renderBackground(course: Course): void;
  /** トラック描画 */
  renderTrack(points: readonly Point[]): void;
  /** プレイヤー車体描画 */
  renderKart(player: Player): void;
  /** HUD 描画 */
  renderHud(players: readonly Player[], courseName: string, maxLaps: number, raceStart: number): void;
  /** エフェクト描画 */
  renderEffects(particles: readonly Particle[], sparks: readonly Spark[]): void;
  /** ドラフト UI 描画 */
  renderDraftUI(hand: readonly Card[], selectedIndex: number, timer: number, maxTimer: number, playerName: string, lap: number, confirmed: boolean, animProgress: number): void;
  /** ハイライト通知描画 */
  renderHighlightBanner(event: HighlightEvent, colors: Record<string, string>, index: number): void;
  /** カウントダウン描画 */
  renderCountdown(elapsed: number): void;
  /** リザルト描画 */
  renderResult(confetti: readonly Confetti[]): void;
  /** フレーム開始（Canvas クリア + シェイク） */
  beginFrame(shake: number): void;
  /** フレーム終了 */
  endFrame(): void;
}
