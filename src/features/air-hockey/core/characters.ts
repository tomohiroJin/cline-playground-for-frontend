/**
 * キャラクター定義
 * US-2.1: CPU キャラクター（名前・個性・リアクション）
 * US-2.7: キャラクターアイコン画像パス
 * P1-01: portrait フィールド追加、カラー更新、ユウ追加
 */
import type { Character, Difficulty } from './types';

// ── アセットパス定数 ─────────────────────────────────
const ASSET_PATH = {
  character: (name: string) => `/assets/characters/${name}.png`,
  portrait: (name: string, expr: string) => `/assets/portraits/${name}-${expr}.png`,
  vs: (name: string) => `/assets/vs/${name}-vs.png`,
  background: (name: string) => `/assets/backgrounds/${name}.webp`,
} as const;

// ── 主人公 ─────────────────────────────────────────
export const PLAYER_CHARACTER: Character = {
  id: 'player',
  name: 'アキラ',
  icon: ASSET_PATH.character('akira'),
  color: '#3498db',
  reactions: {
    onScore: ['よし！', 'いける！'],
    onConcede: ['くっ…！', 'まだまだ！'],
    onWin: ['やった！'],
    onLose: ['次は負けない…'],
  },
  portrait: {
    normal: ASSET_PATH.portrait('akira', 'normal'),
    happy: ASSET_PATH.portrait('akira', 'happy'),
  },
  vsImage: ASSET_PATH.vs('akira'),
};

// ── フリー対戦用キャラ（難易度別）──────────────────
export const FREE_BATTLE_CHARACTERS: Record<Difficulty, Character> = {
  easy: {
    id: 'rookie',
    name: 'ルーキー',
    icon: ASSET_PATH.character('rookie'),
    color: '#27ae60',
    reactions: {
      onScore: ['おっ、入った！', 'ラッキー！'],
      onConcede: ['あちゃー', 'やるね〜'],
      onWin: ['やったー！'],
      onLose: ['ま、いっか〜'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('rookie', 'normal'),
      happy: ASSET_PATH.portrait('rookie', 'happy'),
    },
    vsImage: ASSET_PATH.vs('rookie'),
  },
  normal: {
    id: 'regular',
    name: 'レギュラー',
    icon: ASSET_PATH.character('regular'),
    color: '#2c3e50',
    reactions: {
      onScore: ['いい感じ！', 'もらった！'],
      onConcede: ['なかなかやるな', 'ちっ…'],
      onWin: ['勝った！'],
      onLose: ['やるじゃないか…'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('regular', 'normal'),
      happy: ASSET_PATH.portrait('regular', 'happy'),
    },
    vsImage: ASSET_PATH.vs('regular'),
  },
  hard: {
    id: 'ace',
    name: 'エース',
    icon: ASSET_PATH.character('ace'),
    color: '#2c3e50',
    reactions: {
      onScore: ['当然だ', 'フッ…'],
      onConcede: ['…面白い', 'なるほどな'],
      onWin: ['実力通りだ'],
      onLose: ['…認めよう、お前は強い'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('ace', 'normal'),
      happy: ASSET_PATH.portrait('ace', 'happy'),
    },
    vsImage: ASSET_PATH.vs('ace'),
  },
};

// ── ストーリーモード キャラクター（第1章 + 第2章準備）──
export const STORY_CHARACTERS = {
  hiro: {
    id: 'hiro',
    name: 'ヒロ',
    icon: ASSET_PATH.character('hiro'),
    color: '#e67e22',
    reactions: {
      onScore: ['へへっ！', 'どんなもんだ！'],
      onConcede: ['うわっ！', 'マジか！'],
      onWin: ['俺の勝ちだな！'],
      onLose: ['やるじゃん！参った！'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('hiro', 'normal'),
      happy: ASSET_PATH.portrait('hiro', 'happy'),
    },
    vsImage: ASSET_PATH.vs('hiro'),
  },
  misaki: {
    id: 'misaki',
    name: 'ミサキ',
    icon: ASSET_PATH.character('misaki'),
    color: '#9b59b6',
    reactions: {
      onScore: ['ふふっ♪', 'こんなもんよ'],
      onConcede: ['え、嘘…', 'やるわね…'],
      onWin: ['私の勝ちね♪'],
      onLose: ['あなた…やるわね'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('misaki', 'normal'),
      happy: ASSET_PATH.portrait('misaki', 'happy'),
    },
    vsImage: ASSET_PATH.vs('misaki'),
  },
  takuma: {
    id: 'takuma',
    name: 'タクマ',
    icon: ASSET_PATH.character('takuma'),
    color: '#c0392b',
    reactions: {
      onScore: ['甘いな', 'まだまだだ'],
      onConcede: ['…なかなかやる', 'ほう…'],
      onWin: ['部長の座は渡さんぞ'],
      onLose: ['見事だ…お前を認める'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('takuma', 'normal'),
      happy: ASSET_PATH.portrait('takuma', 'happy'),
    },
    vsImage: ASSET_PATH.vs('takuma'),
  },
  yuu: {
    id: 'yuu',
    name: 'ユウ',
    icon: ASSET_PATH.character('yuu'),
    color: '#2ecc71',
    reactions: {
      onScore: ['データ通りですね', '予測が的中しました'],
      onConcede: ['...修正が必要です', 'この変数は想定外...'],
      onWin: ['仮説が証明されました', 'QED'],
      onLose: ['データが不足していました', '次は別のアプローチで...'],
    },
    portrait: {
      normal: ASSET_PATH.portrait('yuu', 'normal'),
      happy: ASSET_PATH.portrait('yuu', 'happy'),
    },
    vsImage: ASSET_PATH.vs('yuu'),
  },
} as const satisfies Record<string, Character>;

// ── 背景IDからパスへのマッピング ──────────────────
export const BACKGROUND_MAP: Record<string, string> = {
  'bg-clubroom': ASSET_PATH.background('bg-clubroom'),
  'bg-gym': ASSET_PATH.background('bg-gym'),
  'bg-school-gate': ASSET_PATH.background('bg-school-gate'),
};

// ── ヘルパー関数 ───────────────────────────────────

/** 難易度に対応するフリー対戦キャラクターを取得 */
export const getCharacterByDifficulty = (difficulty: Difficulty): Character => {
  return FREE_BATTLE_CHARACTERS[difficulty];
};

/** 全キャラクターの ID → Character マップ（検索用） */
const ALL_CHARACTERS_BY_ID: Record<string, Character> = {
  [PLAYER_CHARACTER.id]: PLAYER_CHARACTER,
  ...Object.fromEntries(
    Object.values(STORY_CHARACTERS).map(c => [c.id, c])
  ),
  ...Object.fromEntries(
    Object.values(FREE_BATTLE_CHARACTERS).map(c => [c.id, c])
  ),
};

/** ID からキャラクターを検索（ストーリー + フリー + 主人公を横断） */
export const findCharacterById = (id: string): Character | undefined => {
  return ALL_CHARACTERS_BY_ID[id];
};

/** 全キャラクターをリストで取得（主人公 + ストーリー + フリー対戦） */
export const getAllCharacters = (): Character[] => {
  return Object.values(ALL_CHARACTERS_BY_ID);
};

/** 対戦可能キャラクターを取得（主人公 + フリー対戦キャラ） */
export const getBattleCharacters = (): Character[] => {
  return [PLAYER_CHARACTER, ...Object.values(FREE_BATTLE_CHARACTERS)];
};

/** リアクション配列からランダムに1つ選択 */
export const getRandomReaction = (reactions: string[]): string => {
  return reactions[Math.floor(Math.random() * reactions.length)];
};
