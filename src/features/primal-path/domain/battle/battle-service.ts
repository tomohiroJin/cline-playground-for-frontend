/**
 * バトルサービス
 *
 * バトルの開始・終了処理を担当する。
 */
import type { RunState, BiomeId } from '../../types';
import { ENM, BOSS } from '../../constants';
import { scaleEnemy } from './combat-calculator';
import { decSkillCds } from '../skill/skill-service';
import { calcEndlessScaleWithAM } from '../progression/biome-service';
import { deepCloneRun } from '../shared/utils';
import { requireValidPlayer } from '../../contracts/player-contracts';

/** バトル開始処理（敵生成・バトル状態初期化） */
export function startBattle(r: RunState, _finalMode: boolean): RunState {
  if (process.env.NODE_ENV !== 'production') {
    requireValidPlayer(r);
  }
  const next = deepCloneRun(r);
  next.cW++;
  const boss = next.cW > next.wpb;

  const biome = next.cBT as BiomeId;
  const src = boss
    ? BOSS[biome]
    : ENM[biome][Math.min(next.cW - 1, ENM[biome].length - 1)];

  const biomeScale = 0.75 + next.cB * 0.25;
  // エンドレスモード: ループごとに敵が指数的に強くなる（aM反映）
  const endlessScale = next.isEndless ? calcEndlessScaleWithAM(next.endlessWave, next.aM) : 1;
  next.en = scaleEnemy(src, next.dd.hm, next.dd.am, (biomeScale + next.bc * 0.25) * endlessScale);
  /* チャレンジ: 敵ATK倍率の適用 */
  if (next.enemyAtkMul && next.enemyAtkMul !== 1 && next.en) {
    next.en.atk = Math.floor(next.en.atk * next.enemyAtkMul);
  }
  next.log = [];
  next.wDmg = 0;
  next.wTurn = 0;
  next._wDmgBase = next.dmgDealt;

  return next;
}

/** バトル終了処理（ボス判定・回復・スキルCD） */
export function afterBattle(r: RunState): { nextRun: RunState; biomeCleared: boolean } {
  if (process.env.NODE_ENV !== 'production') {
    requireValidPlayer(r);
  }
  const next = deepCloneRun(r);
  const boss = next.cW > next.wpb;

  // バトルカウントインクリメント
  next.btlCount++;

  // スキルクールダウンデクリメント
  next.sk = decSkillCds(next.sk);

  if (boss) {
    // ボス撃破 → 即バイオームクリア
    next.bc++;
    const rec = Math.floor(next.mhp * 0.2);
    next.hp = Math.min(next.hp + rec, next.mhp);
    next.cW = 0;
    return { nextRun: next, biomeCleared: true };
  }
  return { nextRun: next, biomeCleared: false };
}
