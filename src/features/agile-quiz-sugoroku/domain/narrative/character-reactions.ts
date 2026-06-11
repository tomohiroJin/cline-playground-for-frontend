/**
 * Agile Quiz Sugoroku - キャラクターリアクション
 *
 * クイズ中にキャラクターが状況に応じた吹き出しコメントを表示するためのデータと関数
 */

// ── 型定義 ────────────────────────────────────────────────

/** リアクションの状況 */
export type ReactionSituation =
  | 'idle'
  | 'timeMild'
  | 'timeWarning'
  | 'correct'
  | 'incorrect'
  | 'combo'
  | 'emergency';

/** キャラクターのコメント */
export interface CharacterComment {
  characterId: string;
  text: string;
}

/** クイズに登場するキャラクター */
export interface QuizCharacter {
  id: string;
  name: string;
  emoji: string;
}

// ── クイズキャラクター定義 ────────────────────────────────

/** クイズに登場する3体のキャラクター */
export const QUIZ_CHARACTERS: QuizCharacter[] = [
  { id: 'neko', name: 'ネコ', emoji: '🐱' },
  { id: 'inu', name: 'イヌ', emoji: '🐶' },
  { id: 'usagi', name: 'ウサギ', emoji: '🐰' },
];

// ── キャラ得意分野とタグのマッピング ──────────────────────

/** キャラごとの得意タグID */
export const CHARACTER_TAG_MAP: Record<string, string[]> = {
  neko: ['design-principles', 'design-patterns', 'programming', 'code-quality', 'refactoring'],
  inu: ['scrum', 'agile', 'estimation', 'backlog', 'team'],
  usagi: ['testing', 'ci-cd', 'sre', 'incident', 'release'],
};

/** タグに対して得意なキャラIDを返す */
export const getExpertCharacterForTags = (tags: string[]): string | undefined => {
  for (const [charId, expertTags] of Object.entries(CHARACTER_TAG_MAP)) {
    if (tags.some((t) => expertTags.includes(t))) {
      return charId;
    }
  }
  return undefined;
};

// ── リアクションコメントデータ ────────────────────────────

/** 状況別 × キャラ別のコメントデータ */
export const REACTION_COMMENTS: Record<ReactionSituation, CharacterComment[]> =
  {
    idle: [
      // ネコ
      { characterId: 'neko', text: '考えるにゃ...' },
      { characterId: 'neko', text: 'どれだにゃ？' },
      { characterId: 'neko', text: 'じっくり選ぶにゃ' },
      { characterId: 'neko', text: '落ち着いていくにゃ' },
      // イヌ
      { characterId: 'inu', text: 'どれかなワン？' },
      { characterId: 'inu', text: 'がんばれワン！' },
      { characterId: 'inu', text: '信じるワン！' },
      { characterId: 'inu', text: '応援するワン！' },
      // ウサギ
      { characterId: 'usagi', text: 'うーんぴょん' },
      { characterId: 'usagi', text: 'ファイトぴょん！' },
      { characterId: 'usagi', text: 'どれだろぴょん？' },
      { characterId: 'usagi', text: '見守るぴょん' },
    ],

    timeMild: [
      // ネコ
      { characterId: 'neko', text: 'そろそろ決めるにゃ' },
      { characterId: 'neko', text: '時間は大丈夫にゃ？' },
      { characterId: 'neko', text: '直感もアリにゃ' },
      // イヌ
      { characterId: 'inu', text: '半分過ぎたワン' },
      { characterId: 'inu', text: 'ゆっくりでいいワン' },
      { characterId: 'inu', text: '決められるワン！' },
      // ウサギ
      { characterId: 'usagi', text: '時間を意識ぴょん' },
      { characterId: 'usagi', text: 'まだ大丈夫ぴょん' },
      { characterId: 'usagi', text: '自信を持つぴょん' },
    ],

    timeWarning: [
      // ネコ
      { characterId: 'neko', text: '急ぐにゃ！' },
      { characterId: 'neko', text: '時間がないにゃ！' },
      { characterId: 'neko', text: '早くにゃ！' },
      // イヌ
      { characterId: 'inu', text: '時間がないワン！' },
      { characterId: 'inu', text: '急ぐワン！' },
      { characterId: 'inu', text: 'もうすぐ終わるワン！' },
      // ウサギ
      { characterId: 'usagi', text: '早くぴょん！' },
      { characterId: 'usagi', text: '時間切れぴょん！' },
      { characterId: 'usagi', text: '急いでぴょん！' },
    ],

    correct: [
      // ネコ
      { characterId: 'neko', text: 'にゃいす！' },
      { characterId: 'neko', text: 'さすがにゃ！' },
      { characterId: 'neko', text: '正解にゃ！' },
      // イヌ
      { characterId: 'inu', text: 'その通りワン！' },
      { characterId: 'inu', text: 'ナイスワン！' },
      { characterId: 'inu', text: '大正解ワン！' },
      // ウサギ
      { characterId: 'usagi', text: '正解ぴょん！' },
      { characterId: 'usagi', text: 'すごいぴょん！' },
      { characterId: 'usagi', text: 'バッチリぴょん！' },
    ],

    incorrect: [
      // ネコ
      { characterId: 'neko', text: 'ドンマイにゃ' },
      { characterId: 'neko', text: '惜しかったにゃ' },
      { characterId: 'neko', text: '次こそにゃ！' },
      // イヌ
      { characterId: 'inu', text: '次がんばるワン' },
      { characterId: 'inu', text: 'ドンマイワン！' },
      { characterId: 'inu', text: '大丈夫ワン！' },
      // ウサギ
      { characterId: 'usagi', text: '惜しいぴょん' },
      { characterId: 'usagi', text: '次があるぴょん' },
      { characterId: 'usagi', text: 'がんばるぴょん！' },
    ],

    combo: [
      // ネコ
      { characterId: 'neko', text: 'ノッてるにゃ！' },
      { characterId: 'neko', text: '絶好調にゃ！' },
      { characterId: 'neko', text: '止まらないにゃ！' },
      // イヌ
      { characterId: 'inu', text: 'すごいワン！' },
      { characterId: 'inu', text: '連続正解ワン！' },
      { characterId: 'inu', text: '最高ワン！' },
      // ウサギ
      { characterId: 'usagi', text: '絶好調ぴょん！' },
      { characterId: 'usagi', text: 'コンボぴょん！' },
      { characterId: 'usagi', text: 'ノリノリぴょん！' },
    ],

    emergency: [
      // ネコ
      { characterId: 'neko', text: '障害発生にゃ！' },
      { characterId: 'neko', text: '落ち着くにゃ！' },
      { characterId: 'neko', text: '対応するにゃ！' },
      // イヌ
      { characterId: 'inu', text: '落ち着くワン！' },
      { characterId: 'inu', text: '障害対応ワン！' },
      { characterId: 'inu', text: '冷静にワン！' },
      // ウサギ
      { characterId: 'usagi', text: '冷静にぴょん！' },
      { characterId: 'usagi', text: '障害発生ぴょん！' },
      { characterId: 'usagi', text: '対処するぴょん！' },
    ],
  };

// ── ヒントコメント（タグ別 × キャラ別） ─────────────────────

/** タグ別のヒントコメント（得意キャラが発する） */
export const HINT_COMMENTS: Record<string, CharacterComment[]> = {
  // ネコ（エンジニア系）の得意分野
  'design-principles': [
    { characterId: 'neko', text: 'SOLIDを思い出すにゃ' },
    { characterId: 'neko', text: '原則に立ち返るにゃ' },
    { characterId: 'neko', text: '責務の分離がカギにゃ' },
  ],
  'design-patterns': [
    { characterId: 'neko', text: 'パターンの意図にゃ' },
    { characterId: 'neko', text: '構造を考えるにゃ' },
    { characterId: 'neko', text: 'GoFを思い出すにゃ' },
  ],
  programming: [
    { characterId: 'neko', text: '基本概念にゃ！' },
    { characterId: 'neko', text: '副作用に注意にゃ' },
    { characterId: 'neko', text: '抽象化がポイントにゃ' },
  ],
  'code-quality': [
    { characterId: 'neko', text: '可読性が大事にゃ' },
    { characterId: 'neko', text: '命名がヒントにゃ' },
    { characterId: 'neko', text: 'スメルを嗅ぐにゃ' },
  ],
  refactoring: [
    { characterId: 'neko', text: '小さく直すにゃ' },
    { characterId: 'neko', text: '安全に変えるにゃ' },
    { characterId: 'neko', text: '負債を減らすにゃ' },
  ],

  // イヌ（PO系）の得意分野
  scrum: [
    { characterId: 'inu', text: '役割を考えるワン' },
    { characterId: 'inu', text: 'イベントが大事ワン' },
    { characterId: 'inu', text: '成果物に注目ワン' },
  ],
  agile: [
    { characterId: 'inu', text: '価値を重視ワン' },
    { characterId: 'inu', text: '宣言を思い出すワン' },
    { characterId: 'inu', text: '変化に対応ワン' },
  ],
  estimation: [
    { characterId: 'inu', text: '相対見積もりワン' },
    { characterId: 'inu', text: 'ベロシティがカギワン' },
    { characterId: 'inu', text: 'ポイントで考えるワン' },
  ],
  backlog: [
    { characterId: 'inu', text: '優先順位が大事ワン' },
    { characterId: 'inu', text: 'INVESTを確認ワン' },
    { characterId: 'inu', text: '価値順に並べるワン' },
  ],
  team: [
    { characterId: 'inu', text: 'チーム力が大事ワン' },
    { characterId: 'inu', text: '改善を続けるワン' },
    { characterId: 'inu', text: '心理的安全性ワン！' },
  ],

  // ウサギ（QA系）の得意分野
  testing: [
    { characterId: 'usagi', text: 'テスト技法ぴょん' },
    { characterId: 'usagi', text: '境界値に注目ぴょん' },
    { characterId: 'usagi', text: 'カバレッジぴょん' },
  ],
  'ci-cd': [
    { characterId: 'usagi', text: '自動化がカギぴょん' },
    { characterId: 'usagi', text: 'パイプラインぴょん' },
    { characterId: 'usagi', text: '継続的に回すぴょん' },
  ],
  sre: [
    { characterId: 'usagi', text: 'SLOを思い出すぴょん' },
    { characterId: 'usagi', text: '信頼性が大事ぴょん' },
    { characterId: 'usagi', text: '監視がカギぴょん' },
  ],
  incident: [
    { characterId: 'usagi', text: '原因分析ぴょん' },
    { characterId: 'usagi', text: 'MTTRに注目ぴょん' },
    { characterId: 'usagi', text: '再発防止ぴょん！' },
  ],
  release: [
    { characterId: 'usagi', text: 'デプロイ戦略ぴょん' },
    { characterId: 'usagi', text: 'リスク軽減ぴょん' },
    { characterId: 'usagi', text: '段階リリースぴょん' },
  ],
};

/** タグに対応しない汎用ヒント */
const GENERIC_HINTS: CharacterComment[] = [
  { characterId: 'neko', text: 'よく読むにゃ！' },
  { characterId: 'inu', text: '落ち着いてワン' },
  { characterId: 'usagi', text: '消去法もアリぴょん' },
];

// ── ユーティリティ関数 ────────────────────────────────────

/**
 * 指定した状況・キャラクターのリアクションコメントをランダムに返す
 */
export const getRandomReaction = (
  situation: ReactionSituation,
  characterId?: string
): CharacterComment => {
  const allComments = REACTION_COMMENTS[situation];

  const characterComments = characterId
    ? allComments.filter((c) => c.characterId === characterId)
    : [];

  const pool =
    characterComments.length > 0 ? characterComments : allComments;

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

/**
 * タグに関連するヒントコメントを返す
 * 得意キャラが見つかればそのキャラのヒント、なければ汎用ヒント
 */
export const getHintForTags = (
  tags: string[],
  characterId?: string,
): CharacterComment => {
  // 指定キャラの得意タグにマッチするヒントを探す
  if (characterId) {
    const expertTags = CHARACTER_TAG_MAP[characterId] ?? [];
    for (const tag of tags) {
      if (expertTags.includes(tag) && HINT_COMMENTS[tag]) {
        const pool = HINT_COMMENTS[tag].filter((c) => c.characterId === characterId);
        if (pool.length > 0) {
          return pool[Math.floor(Math.random() * pool.length)];
        }
      }
    }
  }

  // マッチしなければ任意のタグのヒントを探す
  for (const tag of tags) {
    if (HINT_COMMENTS[tag]) {
      const pool = HINT_COMMENTS[tag];
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // どのタグにもマッチしなければ汎用ヒント
  return GENERIC_HINTS[Math.floor(Math.random() * GENERIC_HINTS.length)];
};

/**
 * クイズキャラクターをランダムに1体返す
 */
export const getRandomCharacter = (): QuizCharacter => {
  const randomIndex = Math.floor(Math.random() * QUIZ_CHARACTERS.length);
  return QUIZ_CHARACTERS[randomIndex];
};
