/**
 * 迷宮の残響 - 残響の亡霊イベント
 *
 * 発見済みの先人が残響圧で敵性化して襲来する高ステークの特殊イベント（5件・手書き）。
 * 二重ゲート: 圧 >= minPressure かつ その先人を発見済み（metaCond）。
 * 鎮静 outcome は fl:"revenant:<predId>" を付与する。
 */
import { isPredecessorDiscovered } from '../domain/services/echo-service';
import type { MetaState } from '../domain/models/meta-state';
import type { GameEvent } from './event-utils';

export const REVENANT_EVENTS: GameEvent[] = [
  {
    id: 'rv_lian', fl: [1, 2], tp: 'revenant', minPressure: 2,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_lian', m.fragments),
    sit: '通路の闇が紙片の渦になる。無数の手記が宙を舞い、写本師リアンの影が嗤う。「記録を……もっと記録を……」執着の塊が襲いかかる。',
    ch: [
      { t: '記録の山から弱点を読み取る', o: [
        { c: 'inf>25', r: '舞う手記の中に矛盾を見つけ、影の核を突いた。渦が鎮まり、リアンの残響が静かに崩れる。「ああ……これで……足りた」', hp: -6, mn: -4, inf: 12, fl: 'revenant:p_lian' },
        { c: 'default', r: '情報の渦に呑まれ、文字が脳裏で暴れる。視界が滲む。', hp: -10, mn: -14, inf: 4, fl: 'add:混乱' },
      ] },
      { t: '力ずくで紙片を振り払う', o: [
        { c: 'hp>40', r: '腕を盾に渦を突破。紙の刃に切られながらも影を抜けた。', hp: -16, mn: -6, inf: 2 },
        { c: 'default', r: '無数の紙の刃が全身を裂く。血が滲む。', hp: -24, mn: -6, inf: 0, fl: 'add:出血' },
      ] },
      { t: '「お前の記録は確かに残った」と語りかける', o: [
        { c: 'mn>35', r: '影が止まる。「……読んだ、のか」。執着がほどけ、リアンの残響は安らかに散った。', hp: 0, mn: -8, inf: 16, fl: 'revenant:p_lian' },
        { c: 'default', r: '言葉は届かない。影は「足りない、足りない」と精神を抉る。', hp: -4, mn: -18, inf: 2 },
      ] },
    ],
  },
  {
    id: 'rv_twins', fl: [2, 3], tp: 'revenant', minPressure: 2,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_twins', m.fragments),
    sit: '灰色の通路に、片割れだけの影が二人分の足音を響かせる。双子の亡霊だ。「なぜ私だけ……なぜお前が生きている……」嫉妬と哀しみが渦巻く。',
    ch: [
      { t: '「お前は一人で、ここまで来た」と讃える', o: [
        { c: 'mn>30', r: '影が震える。「……見て、いたのか」。背負い続けた重さが報われ、双子の残響は寄り添うように消えた。', hp: -3, mn: -6, inf: 14, fl: 'revenant:p_twins' },
        { c: 'default', r: '哀しみの波に呑まれる。誰かを喪う痛みが胸を貫く。', hp: -6, mn: -16, inf: 4, fl: 'add:恐怖' },
      ] },
      { t: '影を振り切って駆け抜ける', o: [
        { c: 'hp>35', r: '哀しみを背に走った。追いすがる手を振り切り、通路を抜ける。', hp: -14, mn: -10, inf: 2 },
        { c: 'default', r: '足が縺れ、影の手に掴まれた。冷たい絶望が体温を奪う。', hp: -20, mn: -10, inf: 0 },
      ] },
      { t: '共に背負う覚悟を示す', o: [
        { c: 'inf>20', r: '先人たちの記録を胸に、影の手を握り返す。「お前を忘れない」。双子は安らいで散った。', hp: -5, mn: -5, inf: 18, fl: 'revenant:p_twins' },
        { c: 'default', r: '覚悟は揺らぎ、影の重さに膝をつく。', hp: -10, mn: -12, inf: 3 },
      ] },
    ],
  },
  {
    id: 'rv_galen', fl: [3, 4], tp: 'revenant', minPressure: 3,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_galen', m.fragments),
    sit: '空間が軋み、床と天井が入れ替わる。地図屋ガレンの亡霊が歪んだ幾何を操り、現実を捻じ曲げてくる。「角度が……合わない……合わせろ……」',
    ch: [
      { t: '歪みの法則を冷静に解析する', o: [
        { c: 'inf>30', r: '捻じれた空間に一貫した規則を見抜き、歪みの中心を正した。ガレンの影は「……解けた」と崩れ落ちた。', hp: -8, mn: -8, inf: 14, fl: 'revenant:p_galen' },
        { c: 'default', r: '空間酔いに思考が砕ける。上下の感覚を失い嘔吐する。', hp: -12, mn: -16, inf: 3, fl: 'add:混乱' },
      ] },
      { t: '歪みが戻る一瞬を待って走り抜ける', o: [
        { c: 'mn>40', r: '深呼吸で平衡を保ち、空間が整う刹那に駆け抜けた。', hp: -10, mn: -10, inf: 4 },
        { c: 'default', r: 'タイミングを誤り、歪んだ壁に叩きつけられた。', hp: -22, mn: -8, inf: 0, fl: 'add:負傷' },
      ] },
      { t: '「お前の地図は、ここにある」と己の記憶を示す', o: [
        { c: 'inf>25', r: '集めた断片の記憶が、ガレンの未完の地図を補完する。影は「ああ、これが答えか」と満たされて消えた。', hp: -6, mn: -10, inf: 20, fl: 'revenant:p_galen' },
        { c: 'default', r: '記憶は断片的すぎた。影は嗤い、精神を深く抉る。', hp: -6, mn: -18, inf: 5 },
      ] },
    ],
  },
  {
    id: 'rv_elna', fl: [4, 5], tp: 'revenant', minPressure: 4,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_elna', m.fragments),
    sit: '最深部の手前、穏やかだった気配が刃に変わる。守人エルナが行く手を阻む。「ここから先へ進む資格が、お前にあるか。試させてもらう」',
    ch: [
      { t: '対話で資格を示す', o: [
        { c: 'mn>45', r: '先人たちを看取る覚悟を語る。エルナは静かに頷いた。「……お前なら、託せる」。道が開かれた。', hp: -5, mn: -12, inf: 16, fl: 'revenant:p_elna' },
        { c: 'default', r: '言葉は軽く、エルナの眼差しが鋭く精神を刺す。「まだ、足りぬ」', hp: -8, mn: -20, inf: 4 },
      ] },
      { t: '実力で突破を試みる', o: [
        { c: 'hp>45', r: '守人の試練を真正面から受け、満身創痍で押し通った。エルナは微笑む。「良い目だ」', hp: -26, mn: -8, inf: 8, fl: 'revenant:p_elna' },
        { c: 'default', r: '守人の一撃は重い。受け切れず、地に伏した。', hp: -30, mn: -10, inf: 2, fl: 'add:出血' },
      ] },
      { t: '先人たちの残響を束ねて応える', o: [
        { c: 'inf>35', r: '集めた残響の総体がエルナに語りかける。「皆、ここにいる」。守人は道を譲った。', hp: -6, mn: -12, inf: 22, fl: 'revenant:p_elna' },
        { c: 'default', r: '残響は散り散りで、エルナの心は動かない。試練は続く。', hp: -10, mn: -16, inf: 6 },
      ] },
    ],
  },
  {
    id: 'rv_first', fl: [5], tp: 'revenant', minPressure: 5,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_first', m.fragments),
    sit: '迷宮の核の手前。最古の刻印が光を放ち、始まりの探索者の残響が立ち上がる。「忘れたくなかった……だから、ここを創った……お前も、そうなのか」',
    ch: [
      { t: '「もう、終わらせていい」と告げる', o: [
        { c: 'inf>40', r: '迷宮の起源そのものに、別れを受け入れる言葉を返す。始まりの探索者は、初めて安らいだ表情で薄れていった。', hp: -8, mn: -14, inf: 18, fl: 'revenant:p_first' },
        { c: 'default', r: '願いの重さに言葉が潰される。起源の哀しみが全身を侵蝕する。', hp: -14, mn: -22, inf: 6 },
      ] },
      { t: '己の意志で抗い、押し通る', o: [
        { c: 'hp>40', r: '起源の引力に抗い、一歩ずつ前へ。残響の手をほどき、核へ近づいた。', hp: -24, mn: -12, inf: 10, fl: 'revenant:p_first' },
        { c: 'default', r: '起源の重力が骨を軋ませる。意識が遠のきかける。', hp: -28, mn: -14, inf: 3, fl: 'add:負傷' },
      ] },
      { t: '集めた全ての残響を捧げて鎮める', o: [
        { c: 'inf>45', r: '先人たちの記憶のすべてが、始まりの願いに応える。「お前たちは、忘れられない」。起源は満たされ、静かに眠りについた。', hp: -10, mn: -16, inf: 24, fl: 'revenant:p_first' },
        { c: 'default', r: '捧げた残響は足りず、起源は嘆く。精神が引き裂かれそうだ。', hp: -10, mn: -24, inf: 8, fl: 'add:恐怖' },
      ] },
    ],
  },
];
