/**
 * キャラクター定義
 * US-2.1: CPU キャラクター（名前・個性・リアクション）
 * US-2.7: キャラクターアイコン画像パス
 * P1-01: portrait フィールド追加、カラー更新、ユウ追加
 */
import type { Character, Difficulty } from './types';

// ── 主人公 ─────────────────────────────────────────
export const PLAYER_CHARACTER: Character = {
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/akira.png',
  color: '#3498db',
  reactions: {
    onScore: ['よし！', 'いける！'],
    onConcede: ['くっ…！', 'まだまだ！'],
    onWin: ['やった！'],
    onLose: ['次は負けない…'],
  },
  portrait: {
    normal: '/assets/portraits/akira-normal.png',
    happy: '/assets/portraits/akira-happy.png',
  },
};

// ── フリー対戦用キャラ（難易度別）──────────────────
export const FREE_BATTLE_CHARACTERS: Record<Difficulty, Character> = {
  easy: {
    id: 'rookie',
    name: 'ルーキー',
    icon: '/assets/characters/rookie.png',
    color: '#27ae60',
    reactions: {
      onScore: ['おっ、入った！', 'ラッキー！'],
      onConcede: ['あちゃー', 'やるね〜'],
      onWin: ['やったー！'],
      onLose: ['ま、いっか〜'],
    },
    portrait: {
      normal: '/assets/portraits/rookie-normal.png',
      happy: '/assets/portraits/rookie-happy.png',
    },
  },
  normal: {
    id: 'regular',
    name: 'レギュラー',
    icon: '/assets/characters/regular.png',
    color: '#2c3e50',
    reactions: {
      onScore: ['いい感じ！', 'もらった！'],
      onConcede: ['なかなかやるな', 'ちっ…'],
      onWin: ['勝った！'],
      onLose: ['やるじゃないか…'],
    },
    portrait: {
      normal: '/assets/portraits/regular-normal.png',
      happy: '/assets/portraits/regular-happy.png',
    },
  },
  hard: {
    id: 'ace',
    name: 'エース',
    icon: '/assets/characters/ace.png',
    color: '#2c3e50',
    reactions: {
      onScore: ['当然だ', 'フッ…'],
      onConcede: ['…面白い', 'なるほどな'],
      onWin: ['実力通りだ'],
      onLose: ['…認めよう、お前は強い'],
    },
    portrait: {
      normal: '/assets/portraits/ace-normal.png',
      happy: '/assets/portraits/ace-happy.png',
    },
  },
};

// ── ストーリーモード キャラクター（第1章 + 第2章準備）──
export const STORY_CHARACTERS = {
  hiro: {
    id: 'hiro',
    name: 'ヒロ',
    icon: '/assets/characters/hiro.png',
    color: '#e67e22',
    reactions: {
      onScore: ['へへっ！', 'どんなもんだ！'],
      onConcede: ['うわっ！', 'マジか！'],
      onWin: ['俺の勝ちだな！'],
      onLose: ['やるじゃん！参った！'],
    },
    portrait: {
      normal: '/assets/portraits/hiro-normal.png',
      happy: '/assets/portraits/hiro-happy.png',
    },
  },
  misaki: {
    id: 'misaki',
    name: 'ミサキ',
    icon: '/assets/characters/misaki.png',
    color: '#9b59b6',
    reactions: {
      onScore: ['ふふっ♪', 'こんなもんよ'],
      onConcede: ['え、嘘…', 'やるわね…'],
      onWin: ['私の勝ちね♪'],
      onLose: ['あなた…やるわね'],
    },
    portrait: {
      normal: '/assets/portraits/misaki-normal.png',
      happy: '/assets/portraits/misaki-happy.png',
    },
  },
  takuma: {
    id: 'takuma',
    name: 'タクマ',
    icon: '/assets/characters/takuma.png',
    color: '#c0392b',
    reactions: {
      onScore: ['甘いな', 'まだまだだ'],
      onConcede: ['…なかなかやる', 'ほう…'],
      onWin: ['部長の座は渡さんぞ'],
      onLose: ['見事だ…お前を認める'],
    },
    portrait: {
      normal: '/assets/portraits/takuma-normal.png',
      happy: '/assets/portraits/takuma-happy.png',
    },
  },
  yuu: {
    id: 'yuu',
    name: 'ユウ',
    icon: '/assets/characters/yuu.png',
    color: '#2ecc71',
    reactions: {
      onScore: ['データ通りですね', '予測が的中しました'],
      onConcede: ['...修正が必要です', 'この変数は想定外...'],
      onWin: ['仮説が証明されました', 'QED'],
      onLose: ['データが不足していました', '次は別のアプローチで...'],
    },
    portrait: {
      normal: '/assets/portraits/yuu-normal.png',
      happy: '/assets/portraits/yuu-happy.png',
    },
  },
} as const satisfies Record<string, Character>;

// ── 背景IDからパスへのマッピング ──────────────────
export const BACKGROUND_MAP: Record<string, string> = {
  'bg-clubroom': '/assets/backgrounds/bg-clubroom.webp',
  'bg-gym': '/assets/backgrounds/bg-gym.webp',
  'bg-school-gate': '/assets/backgrounds/bg-school-gate.webp',
};

// ── ヘルパー関数 ───────────────────────────────────

/** 難易度に対応するフリー対戦キャラクターを取得 */
export const getCharacterByDifficulty = (difficulty: Difficulty): Character => {
  return FREE_BATTLE_CHARACTERS[difficulty];
};

/** ID からキャラクターを検索（ストーリー + フリー + 主人公を横断） */
export const findCharacterById = (id: string): Character | undefined => {
  if (PLAYER_CHARACTER.id === id) return PLAYER_CHARACTER;
  const storyChar = Object.values(STORY_CHARACTERS).find(c => c.id === id);
  if (storyChar) return storyChar;
  return Object.values(FREE_BATTLE_CHARACTERS).find(c => c.id === id);
};

/** リアクション配列からランダムに1つ選択 */
export const getRandomReaction = (reactions: string[]): string => {
  return reactions[Math.floor(Math.random() * reactions.length)];
};
