/**
 * 迷宮の残響 - 残響イベント生成
 *
 * 断片データ（ECHO_FRAGMENTS）から echo イベントを動的生成する。
 * 各 echo イベントは metaCond で深度・収集状況によりゲートされ、
 * 「読み解く」選択で fl:"frag:<id>" により断片を付与する。
 */
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';
import { PREDECESSORS } from '../domain/constants/predecessor-defs';
import type { MetaState } from '../domain/models/meta-state';
import type { GameEvent } from './event-utils';

/** 読み解き時の精神コスト（マイナス） */
const READ_MN_COST = -3;
/** 読み解き時の情報値ボーナス */
const READ_INF_BONUS = 5;

/** 断片定義から echo イベント配列を生成する */
export const buildEchoEvents = (): GameEvent[] =>
  ECHO_FRAGMENTS.map(f => {
    const pred = PREDECESSORS.find(p => p.id === f.predecessorId);
    const predName = pred?.name ?? '先人';
    const icon = pred?.icon ?? '🕯';
    return {
      id: `echo_${f.id}`,
      fl: [...f.floors],
      tp: 'echo',
      sit: `${icon} 壁にひとつの残響が滲んでいる。${predName}の痕跡――「${f.title}」。耳を澄ませば、過去の声が聞こえてくる。`,
      metaCond: (m: MetaState) =>
        (m.echoDepth ?? 0) >= f.depthGate && !(m.fragments ?? []).includes(f.id),
      ch: [
        { t: '残響を読み解く', o: [
          { c: 'default', r: `${f.body}\n\n――その残響を、書庫に書き留めた。`, mn: READ_MN_COST, inf: READ_INF_BONUS, fl: `frag:${f.id}` },
        ] },
        { t: '触れずに先へ進む', o: [
          { c: 'default', r: 'その残響に触れず、先へ進んだ。いつか、また巡り会うだろう。', mn: 0, inf: 0 },
        ] },
      ],
    };
  });

/** 生成済み echo イベント一覧 */
export const ECHO_EVENTS: GameEvent[] = buildEchoEvents();
