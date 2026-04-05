/**
 * ストーリーモード 第2章「はじめての大舞台」ダイアログデータ
 *
 * 地区大会編: 4ステージ（練習試合 → 1回戦 → 準決勝 → 決勝）
 * プロット参照: doc/world/chapter2-plot.md
 */
import type { StageDefinition } from './story';

// ── Stage 2-1: 嵐の前の一打（練習試合 vs ソウタ）──────

const STAGE_2_1: StageDefinition = {
  id: '2-1',
  chapter: 2,
  stageNumber: 1,
  name: '嵐の前の一打',
  characterId: 'rookie',
  fieldId: 'zigzag',
  difficulty: 'easy',
  winScore: 3,
  chapterTitle: '第2章「はじめての大舞台」',
  chapterSubtitle: '挑戦と覚悟',
  backgroundId: 'bg-gym',
  preDialogue: [
    { characterId: 'hiro', text: 'いよいよ来週は地区大会だな！ 気合い入れていこうぜ！' },
    { characterId: 'player', text: 'うん…でも、正直ちょっと緊張してる' },
    { characterId: 'yuu', text: '大丈夫。今日は風見丘のソウタ君と練習試合だよ。肩慣らしにぴったり', expression: 'normal' },
    { characterId: 'rookie', text: 'よろしく！ 楽しくやろうよ！', expression: 'happy' },
  ],
  postWinDialogue: [
    { characterId: 'rookie', text: 'おー、やっぱ強いね！ 大会でも頑張って！', expression: 'happy' },
    { characterId: 'player', text: 'ありがとう！ 少し自信ついたかも' },
    { characterId: 'takuma', text: '…調子は悪くない。だが、本番はここからだ' },
  ],
  postLoseDialogue: [
    { characterId: 'rookie', text: 'あれ、勝っちゃった？ ラッキー！', expression: 'happy' },
    { characterId: 'yuu', text: '…緊張しすぎだよ、アキラ。深呼吸して、もう一回' },
  ],
};

// ── Stage 2-2: 堅実なる壁（1回戦 vs ケンジ）──────

const STAGE_2_2: StageDefinition = {
  id: '2-2',
  chapter: 2,
  stageNumber: 2,
  name: '堅実なる壁',
  characterId: 'regular',
  fieldId: 'fortress',
  difficulty: 'normal',
  winScore: 5,
  backgroundId: 'bg-tournament',
  preDialogue: [
    { characterId: 'yuu', text: '1回戦の相手は翠嶺学園の秋山ケンジ選手。堅実な守備型だよ' },
    { characterId: 'misaki', text: '正攻法で攻めてくるタイプね。焦らず、隙を見つけて', expression: 'normal' },
    { characterId: 'regular', text: 'よろしく。全力でいかせてもらう' },
    { characterId: 'player', text: '…よし、いける！' },
  ],
  postWinDialogue: [
    { characterId: 'regular', text: 'やるな…。お前、まっすぐで気持ちいいプレイだ' },
    { characterId: 'player', text: 'ありがとう。いい試合だった！' },
    { characterId: 'hiro', text: '1回戦突破！ 次は準決勝だぜ！', expression: 'happy' },
  ],
  postLoseDialogue: [
    { characterId: 'regular', text: '惜しかったな。でも、基本がしっかりしてないと勝てないぞ' },
    { characterId: 'takuma', text: '…焦るな。お前の力はこんなものじゃない' },
  ],
};

// ── Stage 2-3: 幻惑の罠（準決勝 vs カナタ）──────

const STAGE_2_3: StageDefinition = {
  id: '2-3',
  chapter: 2,
  stageNumber: 3,
  name: '幻惑の罠',
  characterId: 'kanata',
  fieldId: 'bastion',
  difficulty: 'normal',
  winScore: 5,
  backgroundId: 'bg-tournament',
  preDialogue: [
    { characterId: 'kanata', text: '蒼風館の…アキラ、だっけ？ ケンジに勝ったの、見てたよ' },
    { characterId: 'player', text: 'うん。…君が準決勝の相手？' },
    { characterId: 'kanata', text: 'ストレートな子だね。でもさ、まっすぐだけじゃ届かない場所もあるよ？', expression: 'normal' },
    { characterId: 'player', text: '…やってみなきゃ分からないでしょ！' },
    { characterId: 'yuu', text: '白波カナタ選手。碧波学院の2年生。データが少ないけど…変則的なプレイスタイルらしい' },
    { characterId: 'misaki', text: '気をつけて。読みづらい相手は、焦りが一番の敵よ', expression: 'normal' },
  ],
  postWinDialogue: [
    { characterId: 'kanata', text: 'あはは、読まれちゃったか。面白いね、キミ', expression: 'happy' },
    { characterId: 'player', text: 'ありがとう。…楽しかった！' },
    { characterId: 'kanata', text: '決勝、レン相手だよ？ 頑張ってね——あの人、僕より全然強いから' },
    { characterId: 'yuu', text: 'アキラ、後半から相手の癖を見抜いてたよ。データにない適応力だ…！', expression: 'happy' },
  ],
  postLoseDialogue: [
    { characterId: 'kanata', text: 'ね？ 予想通りにいかないでしょ？ でもキミ、途中から対応し始めてたよ', expression: 'normal' },
    { characterId: 'player', text: '…変化球に全然対応できなかった。でも、途中で何か掴みかけた気がする' },
    { characterId: 'yuu', text: 'アキラ、相手のパターンはメモしたよ。次は対策できる' },
  ],
};

// ── Stage 2-4: 氷の頂へ（決勝 vs レン）──────

const STAGE_2_4: StageDefinition = {
  id: '2-4',
  chapter: 2,
  stageNumber: 4,
  name: '氷の頂へ',
  characterId: 'ace',
  fieldId: 'pillars',
  difficulty: 'hard',
  winScore: 5,
  backgroundId: 'bg-tournament',
  isChapterFinale: true,
  preDialogue: [
    { characterId: 'takuma', text: '…決勝の相手は黒鉄高校の氷室レン。去年、俺が負けた相手だ' },
    { characterId: 'player', text: '…部長が負けた相手…' },
    { characterId: 'takuma', text: 'あいつは強い。だが——お前なら、やれる' },
    { characterId: 'hiro', text: 'アキラ、ここまで来たんだ。全力でぶつかってこい！', expression: 'happy' },
    { characterId: 'ace', text: '…蒼風館か。タクマの後輩、か。見せてもらおう' },
  ],
  postWinDialogue: [
    { characterId: 'ace', text: '…認めよう。お前は、強い' },
    { characterId: 'player', text: '…やった…勝った…！' },
    { characterId: 'takuma', text: 'よくやった。俺の代わりに——いや、お前の力で勝ったんだ', expression: 'happy' },
    { characterId: 'hiro', text: '地区大会優勝だーーー！！', expression: 'happy' },
    { characterId: 'shion', text: 'ふぅん…面白い選手がいるじゃない', expression: 'normal' },
  ],
  postLoseDialogue: [
    { characterId: 'ace', text: '…悪くなかった。だが、まだ足りない' },
    { characterId: 'player', text: '…くっ…！ でも、最後まで戦えた。次は——' },
    { characterId: 'takuma', text: '…顔を上げろ。お前はここまで来た。それは事実だ' },
    { characterId: 'shion', text: '惜しかったね。でも——あの1年、面白い目をしてた', expression: 'normal' },
  ],
};

/** 第2章 全ステージ定義 */
export const CHAPTER_2_STAGES: StageDefinition[] = [
  STAGE_2_1,
  STAGE_2_2,
  STAGE_2_3,
  STAGE_2_4,
];
