/**
 * 迷宮の残響 - 真エンディング定義（第6階層の最後の決断で到達）
 *
 * 通常の determineEnding（player 状態スキャン）には載せず、
 * determineTrueEnding が決断と昇格条件から直接選択する。
 */
import type { EndingDef } from '../models/ending';

/** 残響圧がこの値以上、または起源の継承で到達すると「真・」へ昇格 */
export const TRUE_ENDING_PROMOTE_PRESSURE = 5;

/** 真エンディング一覧（determineTrueEnding が直接選択） */
export const TRUE_ENDINGS: readonly EndingDef[] = Object.freeze([
  {
    id: 'te_inheritor', name: '継承者', subtitle: 'THE INHERITOR',
    description: '願いを継ぎ、迷宮の記憶の番人となった。先人たちの物語は、お前の中で生き続ける。忘れないという約束だけが、ここに残る。',
    cond: () => false, color: '#fbbf24', icon: '🕯', bonusKp: 30,
    gradient: 'linear-gradient(135deg, #3a2e0e, #7c5e16, #fbbf24)',
  },
  {
    id: 'te_liberator', name: '解放者', subtitle: 'THE LIBERATOR',
    description: '願いを断ち、囚われた残響のすべてを解き放った。迷宮は静かに崩れ、先人たちはようやく安らぐ。お前もまた、ひとつの光となって還る。',
    cond: () => false, color: '#7dd3fc', icon: '✶', bonusKp: 30,
    gradient: 'linear-gradient(135deg, #0c2a3a, #155e75, #7dd3fc)',
  },
  {
    id: 'te_inheritor_true', name: '真・継承者', subtitle: 'THE TRUE INHERITOR',
    description: '極限の残響圧を制し、起源の力を継いでなお願いを継いだ。お前は番人を超え、迷宮そのものの意志となる。すべての記憶は、もう二度と失われない。',
    cond: () => false, color: '#fde68a', icon: '☀', bonusKp: 50,
    gradient: 'linear-gradient(135deg, #4a3a0e, #b8860b, #fde68a, #fffbe6)',
  },
  {
    id: 'te_liberator_true', name: '真・解放者', subtitle: 'THE TRUE LIBERATOR',
    description: '極限を越えてなお、願いを断つ道を選んだ。崩れゆく迷宮の中心で、お前は始まりの探索者ごと、すべての残響を祝福して送り出す。後には、澄んだ静寂だけが残る。',
    cond: () => false, color: '#bae6fd', icon: '❅', bonusKp: 50,
    gradient: 'linear-gradient(135deg, #0a2233, #0e7490, #bae6fd, #f0f9ff)',
  },
]);
