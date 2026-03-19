/**
 * Agile Quiz Sugoroku - ストーリーデータ
 *
 * 8スプリント分の成長物語テキストと
 * スプリント数に応じたストーリーマッピングを定義
 */
import { StoryEntry } from './domain/types';

/** 8スプリント分のストーリーデータ */
export const STORY_ENTRIES: StoryEntry[] = [
  // Sprint 1: 「はじめまして」 — 出会い・結成
  {
    sprintNumber: 1,
    title: 'はじめまして',
    narratorId: 'penguin',
    imageKey: 'story_01',
    lines: [
      { text: '新しいプロジェクトが始まる。5人のメンバーが初めて顔を合わせた。' },
      {
        speakerId: 'taka',
        text: '今日からこのチームで、世の中に届ける価値あるプロダクトを作っていく。よろしく頼む。',
      },
      {
        speakerId: 'inu',
        text: 'バックログは準備してきたワン！まずはみんなでゴールを確認しよう。',
      },
      {
        speakerId: 'penguin',
        text: 'スクラムのフレームワークに沿って、一歩ずつ進めていこうペン。',
      },
      {
        speakerId: 'neko',
        text: 'にゃるほど、面白そうなプロダクトだにゃ。早くコード書きたい。',
      },
      {
        speakerId: 'usagi',
        text: '品質の基準を最初に決めておきたいぴょん。テスト戦略も考えなきゃ。',
      },
      { text: 'それぞれの期待と不安を胸に、最初のスプリントが始まった。' },
    ],
  },

  // Sprint 2: 「それぞれのやり方」 — 衝突・混乱
  {
    sprintNumber: 2,
    title: 'それぞれのやり方',
    narratorId: 'inu',
    imageKey: 'story_02',
    lines: [
      { text: 'チームの中で、少しずつ意見の違いが見え始めた。' },
      {
        speakerId: 'neko',
        text: 'この設計の方が拡張性があるにゃ。テストは後から書けばいい。',
      },
      {
        speakerId: 'usagi',
        text: 'テストなしで進めるのは危険ぴょん！品質は最初から意識すべき。',
      },
      {
        speakerId: 'inu',
        text: '二人とも落ち着いてワン…。優先順位をどう付けるか、僕も悩んでるんだ。',
      },
      {
        speakerId: 'penguin',
        text: 'まずはお互いの考えを聞こうペン。チームの約束事を決めるのが先だ。',
      },
      {
        speakerId: 'taka',
        text: '意見がぶつかるのは悪いことじゃない。ただし、対話のない沈黙の方が怖い。',
      },
      { text: 'ぶつかり合いの中から、対話の大切さを学び始めた。' },
    ],
  },

  // Sprint 3: 「最初の壁」 — 最初の失敗
  {
    sprintNumber: 3,
    title: '最初の壁',
    narratorId: 'neko',
    imageKey: 'story_03',
    lines: [
      { text: 'スプリントレビューの結果は、期待には遠かった。' },
      {
        speakerId: 'taka',
        text: '正直に言おう。今回のデリバリーは期待を下回っている。',
      },
      {
        speakerId: 'neko',
        text: '…悔しいにゃ。技術的負債も溜まってきた。',
      },
      {
        speakerId: 'usagi',
        text: 'バグが想定以上に出てしまったぴょん…。テストのカバレッジが足りなかった。',
      },
      {
        speakerId: 'penguin',
        text: 'レトロスペクティブで率直に振り返ろうペン。失敗から学ぶのがアジャイルの本質だ。',
      },
      {
        speakerId: 'inu',
        text: '次のスプリントでは、バックログの粒度をもっと細かくするワン。',
      },
      { text: '初めての壁にぶつかった。でも、正直に問題を共有できたことが第一歩だった。' },
    ],
  },

  // Sprint 4: 「変わり始める空気」 — 気づき・変化
  {
    sprintNumber: 4,
    title: '変わり始める空気',
    narratorId: 'penguin',
    imageKey: 'story_04',
    lines: [
      { text: '振り返りの成果が、少しずつ形になり始めた。' },
      {
        speakerId: 'penguin',
        text: 'みんな、前回のレトロスペクティブで決めたアクションを実践してくれてるペン。',
      },
      {
        speakerId: 'neko',
        text: 'テストを先に書くようにしたら、安心してリファクタリングできるにゃ。',
      },
      {
        speakerId: 'inu',
        text: 'バックログの受け入れ基準を明確にしたら、手戻りが減ったワン！',
      },
      {
        speakerId: 'usagi',
        text: 'CI/CDのパイプラインも安定してきたぴょん。自動テストが守ってくれてる。',
      },
      {
        speakerId: 'taka',
        text: '小さな改善の積み重ね — これがカイゼンか。この調子で頼むぞ。',
      },
      { text: 'チームの空気が変わり始めた。小さな成功体験が自信につながっていく。' },
    ],
  },

  // Sprint 5: 「助け合いの芽」 — 協力・支え合い
  {
    sprintNumber: 5,
    title: '助け合いの芽',
    narratorId: 'usagi',
    imageKey: 'story_05',
    lines: [
      { text: '突然のインシデントがチームを襲った。' },
      {
        speakerId: 'usagi',
        text: '本番環境で障害が発生したぴょん！すぐに調査を始めなきゃ。',
      },
      {
        speakerId: 'neko',
        text: '原因はこの部分のロジックっぽいにゃ。ウサギ、テストケース書いて再現してくれる？',
      },
      {
        speakerId: 'usagi',
        text: '了解ぴょん！ネコの調査と並行して進めるね。',
      },
      {
        speakerId: 'taka',
        text: 'ステークホルダーへの連絡は俺が引き受ける。チームは修正に集中してくれ。',
      },
      {
        speakerId: 'penguin',
        text: '誰も責めない。今はチーム全員で解決に向かおうペン。',
      },
      { text: '誰に言われるでもなく、自然と助け合いが生まれた。チームの結束が深まった瞬間だった。' },
    ],
  },

  // Sprint 6: 「自分たちのリズム」 — 自己組織化
  {
    sprintNumber: 6,
    title: '自分たちのリズム',
    narratorId: 'inu',
    imageKey: 'story_06',
    lines: [
      { text: 'チームが自分たちのワークフローを見つけ始めた。' },
      {
        speakerId: 'inu',
        text: 'バックログの優先順位付け、みんな自発的に意見をくれるようになったワン。',
      },
      {
        speakerId: 'penguin',
        text: '最近、僕が介入しなくてもチームが自律的に動いてくれてるペン。嬉しいな。',
      },
      {
        speakerId: 'neko',
        text: 'ペアプロも定着したにゃ。コードレビューがスムーズになった。',
      },
      {
        speakerId: 'usagi',
        text: 'テスト自動化のおかげで、デプロイ頻度も上がったぴょん。',
      },
      {
        speakerId: 'taka',
        text: 'ベロシティが安定してきた。予測可能性が上がると、ビジネス側も計画が立てやすい。',
      },
      { text: 'チーム独自のリズムが生まれた。自己組織化の兆しが見え始めている。' },
    ],
  },

  // Sprint 7: 「嵐を超えて」 — 試練と克服
  {
    sprintNumber: 7,
    title: '嵐を超えて',
    narratorId: 'taka',
    imageKey: 'story_07',
    lines: [
      { text: '大きな試練がチームの前に立ちはだかった。' },
      {
        speakerId: 'taka',
        text: '急な要件変更だ。ステークホルダーの要望が大きく変わった。',
      },
      {
        speakerId: 'inu',
        text: 'バックログの再優先順位付けが必要ワン。でも、パニックにはならない。',
      },
      {
        speakerId: 'neko',
        text: 'アーキテクチャの変更が必要だけど、テストがあるから安心して進められるにゃ。',
      },
      {
        speakerId: 'usagi',
        text: 'リグレッションテストを先に回すぴょん。影響範囲を特定しよう。',
      },
      {
        speakerId: 'penguin',
        text: 'このチームなら乗り越えられるペン。これまでの経験が力になる。',
      },
      { text: '嵐の中でも冷静に対応できた。困難を乗り越えたことで、チームの信頼はさらに深まった。' },
    ],
  },

  // Sprint 8: 「真のTeam」 — 完成・絆
  {
    sprintNumber: 8,
    title: '真のTeam',
    narratorId: 'taka',
    imageKey: 'story_08',
    lines: [
      { text: '最後のスプリントを前に、チームには確かな絆が生まれていた。' },
      {
        speakerId: 'penguin',
        text: 'みんな、ここまで本当によく頑張ったペン。最初の頃とは別のチームみたいだ。',
      },
      {
        speakerId: 'neko',
        text: '最初はぶつかってばかりだったにゃ。でも今は、お互いの強みが分かってる。',
      },
      {
        speakerId: 'usagi',
        text: 'テストの文化がチーム全体に根付いたぴょん。品質はみんなの責任。',
      },
      {
        speakerId: 'inu',
        text: 'プロダクトの方向性をチーム全員で共有できてるワン。最高のチームだ。',
      },
      {
        speakerId: 'taka',
        text: 'このチームにプロダクトを任せて正解だった。さあ、最後のスプリントだ — 全力で行こう。',
      },
      { text: '5人は笑顔で最後のスプリントに向かう。真のTeamとして。' },
    ],
  },
];

/**
 * スプリント数→ストーリーのマッピング定義
 *
 * 選択されたスプリント数に応じて、表示するストーリーのスプリント番号を返す
 */
const SPRINT_STORY_MAP: Record<number, number[]> = {
  1: [1],
  2: [1, 8],
  3: [1, 4, 8],
  5: [1, 2, 4, 6, 8],
  8: [1, 2, 3, 4, 5, 6, 7, 8],
};

/**
 * 選択スプリント数に対応するストーリーリストを取得
 * @param sprintCount 選択されたスプリント数
 * @returns 表示すべきストーリーの配列（スプリント番号の昇順）
 */
export function getStoriesForSprintCount(sprintCount: number): StoryEntry[] {
  const sprintNumbers = SPRINT_STORY_MAP[sprintCount] ?? [1];
  return sprintNumbers
    .map((num) => STORY_ENTRIES.find((e) => e.sprintNumber === num))
    .filter((e): e is StoryEntry => e !== undefined);
}
