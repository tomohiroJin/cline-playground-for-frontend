/**
 * ステージ遷移ルール（純粋関数）
 *
 * 洞窟 → 草原 → ボス → エンディングの遷移を管理する。
 */
import type { GameScreen } from '../../types/game-state';
import { Difficulty } from '../../difficulty';

/** ステージ種別 */
export type PlayableStage = 'cave' | 'grass' | 'boss';

/** ステージ情報 */
const STAGE_INFO: Record<PlayableStage, { label: string; subLabel: string }> = {
  cave: { label: 'STAGE 1', subLabel: 'THE CAVE' },
  grass: { label: 'STAGE 2', subLabel: 'THE PRAIRIE' },
  boss: { label: 'BOSS', subLabel: 'DARK CASTLE' },
};

/** ステージクリア後の遷移先を返す */
export function getNextStage(current: PlayableStage, loop?: number): GameScreen {
  switch (current) {
    case 'cave':
      return 'grass';
    case 'grass':
      return 'boss';
    case 'boss':
      return (loop !== undefined && Difficulty.isTrueEnding(loop)) ? 'trueEnd' : 'ending1';
  }
}

/** ステージ遷移時のラベルテキスト */
export function getStageLabel(stage: PlayableStage, loop: number): string {
  const base = STAGE_INFO[stage].label;
  return loop >= 2 ? `${base} — LOOP ${loop}` : base;
}

/** ステージ遷移時のサブラベルテキスト */
export function getStageSubLabel(stage: PlayableStage): string {
  return STAGE_INFO[stage].subLabel;
}
