/**
 * 迷宮の残響 - 先人定義
 *
 * 過去の探索者（残響の主）5名のデータ。
 */
import type { Predecessor } from '../models/echo';

/** 先人定義一覧 */
export const PREDECESSORS: readonly Predecessor[] = Object.freeze([
  {
    id: 'p_lian', name: '写本師リアン', icon: '📜', color: '#60a5fa', floors: [1, 2], truthLayer: 1,
    summary: '全てを記録すれば生還できると信じた写本師。情報に溺れ、錆びた檻の中で餓死した。彼の手記は、迷宮で最初に出会う「残響」となった。',
  },
  {
    id: 'p_twins', name: '双子 カイとノア', icon: '♊', color: '#a0a0b8', floors: [2, 3], truthLayer: 1,
    summary: '二人で挑んだ双子。片方がもう片方を背負い続けたが、灰色の迷路で別たれた。残された者の慟哭が、壁の引っ掻き傷に刻まれている。',
  },
  {
    id: 'p_galen', name: '地図屋ガレン', icon: '🗺', color: '#c084fc', floors: [3, 4], truthLayer: 2,
    summary: '迷宮を完全に図化しようとした地図屋。歪んだ幾何に正気を蝕まれ、狂気の果てに奇妙な悟りへ至った。',
  },
  {
    id: 'p_elna', name: '守人エルナ', icon: '🕯', color: '#fbbf24', floors: [4, 5], truthLayer: 3,
    summary: '最深部に到達しながら、自ら「留まる」ことを選んだ十二人目の探索者。先人たちの残響を看取る、迷宮の守人となった。',
  },
  {
    id: 'p_first', name: '始まりの探索者', icon: '✶', color: '#ff8fa3', floors: [5], truthLayer: 4,
    summary: '迷宮を生み出した最古の存在。喪った者を忘れぬため、全てを記憶する場所を願った。その願いの続きに、お前がいる。',
  },
]);
