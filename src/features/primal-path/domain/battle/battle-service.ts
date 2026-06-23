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
import { resetKeystoneBattleState } from '../keystone/keystone-service';
import { applyEmberBiomeScale } from '../totem/totem-service';

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

  const biomeScale = 0.75 + next.cB * 0.18;
  // エンドレスモード: ループごとに敵が指数的に強くなる（aM反映）
  const endlessScale = next.isEndless ? calcEndlessScaleWithAM(next.endlessWave, next.aM) : 1;
  next.en = scaleEnemy(src, next.dd.hm, next.dd.am, (biomeScale + next.bc * 0.25) * endlessScale);
  // ボスは一撃で倒せないよう被ダメージ上限を掛ける（tick で BOSS_HIT_CAP 適用）
  if (boss && next.en) next.en.boss = true;
  /* チャレンジ: 敵ATK倍率の適用 */
  if (next.enemyAtkMul && next.enemyAtkMul !== 1 && next.en) {
    next.en.atk = Math.floor(next.en.atk * next.enemyAtkMul);
  }
  next.log = [];
  next.wDmg = 0;
  next.wTurn = 0;
  resetKeystoneBattleState(next);
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
    // 種火の祖: 踏破スケールを適用（種火以外は素通り）
    const scaled = applyEmberBiomeScale(next);
    scaled.cW = 0;
    const rec = Math.floor(scaled.mhp * 0.2);
    scaled.hp = Math.min(scaled.hp + rec, scaled.mhp);
    return { nextRun: scaled, biomeCleared: true };
  }
  return { nextRun: next, biomeCleared: false };
}
