/**
 * Agile Quiz Sugoroku - エンディングストーリーデータ
 *
 * 全スプリント完了後に表示するエンディングストーリー。
 * 共通パート（プロジェクト完了）＋チームタイプ別エピローグ（6種類）の2部構成。
 */
import { EndingEntry } from './types';

/** 共通パート: 「プロジェクト完了 — 旅の終わり、新たな始まり」 */
export const ENDING_COMMON: EndingEntry = {
  phase: 'common',
  title: 'プロジェクト完了 — 旅の終わり、新たな始まり',
  imageKey: 'ending_common',
  lines: [
    { text: '最終スプリントレビューが終わった。チーム全員がオフィスに集まっている。' },
    {
      speakerId: 'taka',
      text: 'みんな、プロダクトが完成した。正式にリリースだ。ここまで本当にお疲れ様。',
    },
    {
      speakerId: 'inu',
      text: '最初にバックログを作った時は、本当にこれが形になるのか不安だったワン…。',
    },
    {
      speakerId: 'neko',
      text: '技術的にも挑戦が多かったにゃ。でも、チームで乗り越えてきた。',
    },
    {
      speakerId: 'usagi',
      text: 'テストを書く文化が根付いたのが嬉しいぴょん。品質はみんなで守れた。',
    },
    {
      speakerId: 'penguin',
      text: 'このチームの成長を間近で見られて、スクラムマスター冥利に尽きるペン。',
    },
    {
      speakerId: 'taka',
      text: '一人ひとりの力だけじゃない。チームとして掛け合わさった結果が、このプロダクトだ。',
    },
    { text: 'プロダクトの完成。それは終わりではなく、新たな始まりだった。' },
  ],
};

/** チームタイプ別エピローグ（6種類） */
export const ENDING_EPILOGUES: EndingEntry[] = [
  // シナジーチーム: 「次なる挑戦へ」
  {
    phase: 'epilogue',
    teamTypeId: 'synergy',
    title: '次なる挑戦へ',
    imageKey: 'ending_epilogue',
    lines: [
      { text: 'プロジェクトの成功は、組織全体に波紋を広げた。' },
      {
        speakerId: 'taka',
        text: '他チームからメンタリングの依頼が来ている。このチームのやり方を共有してほしいそうだ。',
      },
      {
        speakerId: 'penguin',
        text: '僕たちのプラクティスが他のチームの助けになるなら、喜んでペン。',
      },
      {
        speakerId: 'neko',
        text: 'でも、次のプロダクトも面白そうにゃ。もっと大きな挑戦がしたい。',
      },
      {
        speakerId: 'inu',
        text: '新しいプロダクトのビジョン、もう見えてるワン。今度はもっとスケールの大きなものを。',
      },
      {
        speakerId: 'usagi',
        text: 'このチームなら何でもできる気がするぴょん！',
      },
      { text: '5人は次なる挑戦へ。シナジーの力で、さらなる高みを目指す。' },
    ],
  },

  // レジリエントチーム: 「嵐の後の虹」
  {
    phase: 'epilogue',
    teamTypeId: 'resilient',
    title: '嵐の後の虹',
    imageKey: 'ending_epilogue',
    lines: [
      { text: '数々の障害を乗り越えてきた。その度に、チームの絆は強くなった。' },
      {
        speakerId: 'taka',
        text: 'どんな困難が来ても、このチームなら大丈夫だ。それを証明してくれた。',
      },
      {
        speakerId: 'usagi',
        text: '本番障害の夜は大変だったぴょん…でも、あの経験があったからこそ今がある。',
      },
      {
        speakerId: 'neko',
        text: '障害対応のドキュメントも整備したにゃ。次は誰でも対応できる。',
      },
      {
        speakerId: 'penguin',
        text: '困難を乗り越えた経験は、チームの財産ペン。この回復力を次も活かそう。',
      },
      {
        speakerId: 'inu',
        text: '嵐の後の虹は、きっと一番きれいだワン。',
      },
      { text: '5人は次の難題に笑顔で向かう。嵐を超えた先に見える虹を信じて。' },
    ],
  },

  // 成長するチーム: 「成長の軌跡」
  {
    phase: 'epilogue',
    teamTypeId: 'evolving',
    title: '成長の軌跡',
    imageKey: 'ending_epilogue',
    lines: [
      { text: '振り返ると、最初の頃とは見違えるほど成長していた。' },
      {
        speakerId: 'penguin',
        text: '一番大切なのは成長し続けることペン。このチームはそれを体現してくれた。',
      },
      {
        speakerId: 'neko',
        text: '最初は自分のコードを直すのが精一杯だったにゃ。今はチーム全体を見れてる。',
      },
      {
        speakerId: 'usagi',
        text: 'レトロスペクティブで出した改善案、全部実践できたぴょん！',
      },
      {
        speakerId: 'inu',
        text: 'バックログリファインメントの質も格段に上がったワン。',
      },
      {
        speakerId: 'taka',
        text: 'この成長曲線を見ると、次のプロジェクトが楽しみだな。',
      },
      { text: 'チームは改善のサイクルを回し続ける。成長に終わりはない。' },
    ],
  },

  // アジャイルチーム: 「風のように」
  {
    phase: 'epilogue',
    teamTypeId: 'agile',
    title: '風のように',
    imageKey: 'ending_epilogue',
    lines: [
      { text: '素早い判断と実行力。それがこのチームの武器だった。' },
      {
        speakerId: 'inu',
        text: '次はもっと早く、もっと正確に届けるワン。ユーザーの声をダイレクトに反映したい。',
      },
      {
        speakerId: 'neko',
        text: 'デプロイ頻度も上がったにゃ。コードの品質を保ちながらスピードを出せるのが嬉しい。',
      },
      {
        speakerId: 'usagi',
        text: '自動テストのおかげで安心してリリースできるぴょん。',
      },
      {
        speakerId: 'penguin',
        text: 'チームの判断力が研ぎ澄まされてきたペン。無駄な会議も減った。',
      },
      {
        speakerId: 'taka',
        text: 'このスピード感でビジネス価値を届けてくれるチームは貴重だ。',
      },
      { text: 'チームのスピードはさらに加速していく。風のように、軽やかに。' },
    ],
  },

  // もがくチーム: 「泥の中から咲く花」
  {
    phase: 'epilogue',
    teamTypeId: 'struggling',
    title: '泥の中から咲く花',
    imageKey: 'ending_epilogue',
    lines: [
      { text: '技術的負債に苦しみ、何度も壁にぶつかった。でも、諦めなかった。' },
      {
        speakerId: 'neko',
        text: 'この経験が次に活きるにゃ。負債の怖さも、返し方も学んだ。',
      },
      {
        speakerId: 'usagi',
        text: '完璧じゃなくても、前に進めたことが大事ぴょん。',
      },
      {
        speakerId: 'inu',
        text: '次のプロジェクトでは、最初からリファインメントの時間を確保するワン。',
      },
      {
        speakerId: 'penguin',
        text: '苦しい時にも走り続けた経験は、必ず糧になるペン。',
      },
      {
        speakerId: 'taka',
        text: '泥の中からでも花は咲く。このチームの粘り強さを、俺は評価する。',
      },
      { text: 'チームは着実に前に進んでいく。泥の中から咲く花のように、力強く。' },
    ],
  },

  // 結成したてのチーム: 「はじまりの一歩」
  {
    phase: 'epilogue',
    teamTypeId: 'forming',
    title: 'はじまりの一歩',
    imageKey: 'ending_epilogue',
    lines: [
      { text: 'まだチームとしては未完成。でも、全員が同じ思いを抱いていた。' },
      {
        speakerId: 'usagi',
        text: '次はもっとうまくやれるぴょん！今回の経験があるから。',
      },
      {
        speakerId: 'neko',
        text: 'お互いの強みも弱みも分かってきたにゃ。次はもっと活かせる。',
      },
      {
        speakerId: 'inu',
        text: 'チームの約束事、次こそちゃんと決めようワン。',
      },
      {
        speakerId: 'penguin',
        text: 'Forming（形成期）を経験した。次はStormingを乗り越えようペン。',
      },
      {
        speakerId: 'taka',
        text: 'はじまりの一歩を踏み出したことに意味がある。物語はここから始まるんだ。',
      },
      { text: '全員が「もう一度やりたい」と口を揃える。物語はここから始まる。' },
    ],
  },
];

/**
 * 共通エンディング＋指定チームタイプのエピローグを取得
 * @param teamTypeId チームタイプID
 * @returns エンディングストーリー配列（共通パート＋エピローグ）
 */
export function getEndingStories(teamTypeId: string): EndingEntry[] {
  const epilogue = ENDING_EPILOGUES.find((e) => e.teamTypeId === teamTypeId);
  if (epilogue) {
    return [ENDING_COMMON, epilogue];
  }
  // 未知のチームタイプの場合は共通パートのみ
  return [ENDING_COMMON];
}
