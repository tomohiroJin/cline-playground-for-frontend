/**
 * ストーリーモード第1章のステージ・ダイアログデータ
 */
import type { StageDefinition } from './story';

export const CHAPTER_1_STAGES: StageDefinition[] = [
  {
    id: '1-1',
    chapter: 1,
    stageNumber: 1,
    name: 'はじめの一打',
    characterId: 'hiro',
    fieldId: 'classic',
    difficulty: 'easy',
    winScore: 3,
    preDialogue: [
      { characterId: 'hiro', text: 'おっ、新入り？ エアホッケー部へようこそ！' },
      { characterId: 'hiro', text: 'まずは俺と一勝負だ。基本を見せてやるよ！' },
      { characterId: 'player', text: 'よろしくお願いします！' },
    ],
    postWinDialogue: [
      { characterId: 'hiro', text: 'やるじゃん！ 初めてとは思えないな！' },
      { characterId: 'hiro', text: 'でもこの部にはもっと強い先輩がいるぜ。' },
      { characterId: 'hiro', text: '次はミサキ先輩に挑戦してみな！' },
    ],
    postLoseDialogue: [
      { characterId: 'hiro', text: 'ドンマイ！ 最初は誰でもこんなもんだ。' },
      { characterId: 'hiro', text: 'もう一回やろうぜ！ コツを教えるからさ。' },
    ],
  },
  {
    id: '1-2',
    chapter: 1,
    stageNumber: 2,
    name: 'テクニカルな壁',
    characterId: 'misaki',
    fieldId: 'wide',
    difficulty: 'normal',
    winScore: 3,
    preDialogue: [
      { characterId: 'misaki', text: 'あなたが噂の新入り？ ヒロに勝ったんですって？' },
      { characterId: 'misaki', text: '私のフィールドは広いわよ。テクニックがないと厳しいかも♪' },
      { characterId: 'player', text: '負けません！' },
      { characterId: 'misaki', text: 'その意気よ！ アイテムの使い方、教えてあげる。' },
    ],
    postWinDialogue: [
      { characterId: 'misaki', text: 'まさか…私が負けるなんて…' },
      { characterId: 'misaki', text: 'あなた、才能あるわね。部長にも通じるかも。' },
      { characterId: 'misaki', text: 'タクマ先輩は手強いわよ。覚悟してね。' },
    ],
    postLoseDialogue: [
      { characterId: 'misaki', text: 'まだまだね♪ でもセンスは悪くないわ。' },
      { characterId: 'misaki', text: 'アイテムをうまく使えるようになれば、きっと勝てるわ。' },
    ],
  },
  {
    id: '1-3',
    chapter: 1,
    stageNumber: 3,
    name: '部長の壁',
    characterId: 'takuma',
    fieldId: 'pillars',
    difficulty: 'hard',
    winScore: 5,
    preDialogue: [
      { characterId: 'takuma', text: 'お前がヒロとミサキを倒した新入りか。' },
      { characterId: 'takuma', text: '面白い。だが部長の俺を倒すのは、そう簡単じゃないぞ。' },
      { characterId: 'player', text: '全力でいきます！' },
      { characterId: 'takuma', text: '…いい目だ。来い。' },
    ],
    postWinDialogue: [
      { characterId: 'takuma', text: '…見事だ。お前を部の正式メンバーとして認めよう。' },
      { characterId: 'takuma', text: '次は地区大会だ。もっと強い相手が待っている。' },
      { characterId: 'player', text: 'はい！ もっと強くなります！' },
    ],
    postLoseDialogue: [
      { characterId: 'takuma', text: 'まだ甘いな。だが…諦めない姿勢は認める。' },
      { characterId: 'takuma', text: '鍛え直して、もう一度来い。' },
    ],
  },
];
