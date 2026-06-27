/**
 * 迷宮の残響 - 残響断片定義
 *
 * 先人ごとの物語断片（合計19件）。order は読む順序、depthGate は出現可能な最小 echoDepth。
 */
import type { EchoFragment } from '../models/echo';

/** 残響断片一覧 */
export const ECHO_FRAGMENTS: readonly EchoFragment[] = Object.freeze([
  // ── 写本師リアン（p_lian） ──
  { id: 'f_lian_1', predecessorId: 'p_lian', order: 1, depthGate: 0, floors: [1], title: '写本師の最初の頁',
    body: '几帳面な字で綴られた手記の冒頭。「記録こそが生還の鍵だ。見たもの全てを書き留める。一片の情報も逃さない」――まだ、希望に満ちた筆致だった。' },
  { id: 'f_lian_2', predecessorId: 'p_lian', order: 2, depthGate: 1, floors: [1, 2], title: '増えてゆく注釈',
    body: '頁の余白が、後から書き足された注釈で埋め尽くされている。「地図は信じるな」「水音は罠」「沈黙こそ危険」。文字が、少しずつ乱れ始めている。' },
  { id: 'f_lian_3', predecessorId: 'p_lian', order: 3, depthGate: 1, floors: [2], title: 'インクの切れた頁',
    body: 'インクが尽きたのか、後半は黒ずんだ色で書かれている。「もう何日いる? 頁はまだ足りない。全部、記録しなければ。忘れては、ならない」。' },
  { id: 'f_lian_4', predecessorId: 'p_lian', order: 4, depthGate: 2, floors: [2], title: '写本師の最期',
    body: '錆びた檻の中の白骨。膝の上に、ぼろぼろの手記が抱かれている。最後の頁にはただ一言――「記録は完成した。だが、私を記録する者はいない」。' },
  // ── 双子 カイとノア（p_twins） ──
  { id: 'f_twins_1', predecessorId: 'p_twins', order: 1, depthGate: 1, floors: [2], title: '二人分の足跡',
    body: '埃の上に、寄り添うように並んだ二組の足跡。片方は力強く、片方は引きずるよう。「カイ、もう少しだ」「ノア、置いていけよ」――壁に交わした言葉が刻まれている。' },
  { id: 'f_twins_2', predecessorId: 'p_twins', order: 2, depthGate: 2, floors: [2, 3], title: '背負われた重さ',
    body: '片方の足跡が消え、もう片方が深くなる。誰かが、誰かを背負い始めた地点。床に乾いた血。「重くない。お前は羽みたいだ」と、震える字。' },
  { id: 'f_twins_3', predecessorId: 'p_twins', order: 3, depthGate: 2, floors: [3], title: '鏡に映る二人',
    body: 'あの鏡の前で、双子は何を見たのか。縁に二人分の指の跡。「鏡の中では、まだ二人とも立っている」。願いが、そこに焼き付いている。' },
  { id: 'f_twins_4', predecessorId: 'p_twins', order: 4, depthGate: 3, floors: [3], title: '一人分の到達点',
    body: '通路の行き止まりに、一人分の骸と、隣に丁寧に並べられた装備一式。背負われていた方は、ここまで来られなかったらしい。残された者の慟哭が、壁の引っ掻き傷に残っている。' },
  // ── 地図屋ガレン（p_galen） ──
  { id: 'f_galen_1', predecessorId: 'p_galen', order: 1, depthGate: 2, floors: [3], title: '地図屋の宣言',
    body: '壁一面に描かれた精緻な地図。署名は「地図屋ガレン」。「この迷宮を完全に図化する。不可能などない。幾何は嘘をつかない」――自信に満ちた筆致。' },
  { id: 'f_galen_2', predecessorId: 'p_galen', order: 2, depthGate: 3, floors: [3, 4], title: '歪み始める線',
    body: '地図の線が、途中から歪み、重なり、矛盾し始める。「同じ部屋に二度戻った。いや、別の部屋だ。距離が、合わない。壁が、動いている」。' },
  { id: 'f_galen_3', predecessorId: 'p_galen', order: 3, depthGate: 3, floors: [4], title: '不可能な幾何',
    body: '床にも天井にも、無数の線が錯乱して描かれている。もはや地図ではない。「角度の総和が合わない。ここは三次元では、ない。私の頭がおかしいのか、世界がおかしいのか」。' },
  { id: 'f_galen_4', predecessorId: 'p_galen', order: 4, depthGate: 4, floors: [4], title: '地図屋の解',
    body: '中心に、ただ一点だけ正確な円が描かれている。その中に座り込んだ骸。「分かった。迷宮を図化するな。迷宮に、自分を図化させるのだ」――狂気の果ての、奇妙な悟り。' },
  // ── 守人エルナ（p_elna） ──
  { id: 'f_elna_1', predecessorId: 'p_elna', order: 1, depthGate: 3, floors: [4], title: '守人の覚書',
    body: '他の痕跡と違い、落ち着いた筆致。「私は十二人目だ。先に進んだ者の記録を、全て読んだ。リアン、双子、ガレン――彼らは消えていない。ここに、いる」。' },
  { id: 'f_elna_2', predecessorId: 'p_elna', order: 2, depthGate: 4, floors: [4, 5], title: '核との対話',
    body: '「迷宮の核と話した。あれは敵ではない。寂しいのだ。忘れられることを、何より恐れている。だから、忘れたくない者を呼び、留めておく」。' },
  { id: 'f_elna_3', predecessorId: 'p_elna', order: 3, depthGate: 4, floors: [5], title: '留まる選択',
    body: '「私は帰れる。資格はある。だが、帰らない。先に逝った者たちの残響を、誰かが看取らねばならない。私は、この迷宮の守人になる」。' },
  { id: 'f_elna_4', predecessorId: 'p_elna', order: 4, depthGate: 5, floors: [5], title: '守人の今',
    body: '最深部の手前。穏やかな気配が漂う一角。声なき声が囁く。「よく来た。お前で、何人目だろうね。安心おし。お前のことも、私が憶えていてあげる」。' },
  // ── 始まりの探索者（p_first） ──
  { id: 'f_first_1', predecessorId: 'p_first', order: 1, depthGate: 4, floors: [5], title: '最古の刻印',
    body: '他のどの痕跡より古い、石に直接刻まれた文字。言語さえ異なる。かろうじて読める一節――「私は、失った。だから、二度と忘れぬ場所を、創る」。' },
  { id: 'f_first_2', predecessorId: 'p_first', order: 2, depthGate: 5, floors: [5], title: '迷宮の起源',
    body: '「愛する者を喪い、その記憶さえ薄れゆくことに耐えられなかった。私は願った。全てを憶えていてくれる場所を。願いは、形になった。これが、迷宮だ」。' },
  { id: 'f_first_3', predecessorId: 'p_first', order: 3, depthGate: 6, floors: [5], title: '始まりと、お前',
    body: '刻印の最後。なぜか、たった今書かれたように新しい。「そして今、これを読むお前へ。お前もまた、誰かに忘れられたくなかった者だ。だから、ここにいる。――おかえり」。' },
]);
