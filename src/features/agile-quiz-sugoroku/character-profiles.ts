/**
 * Agile Quiz Sugoroku - キャラクタープロフィール
 */
import { COLORS } from './constants';

export interface CharacterProfile {
  id: string;
  name: string;
  animal: string;
  role: string;
  color: string;
  emoji: string;
  personality: string;
  skills: string[];
  catchphrase: string;
  trivia: string;
}

export const CHARACTER_PROFILES: CharacterProfile[] = [
  {
    id: 'neko',
    name: 'ネコ',
    animal: 'オレンジ三毛猫',
    role: 'フルスタックエンジニア',
    color: COLORS.accent,
    emoji: '🐱',
    personality:
      '好奇心旺盛で新技術に飛びつく。夜型で深夜にコードが冴える。気まぐれだがハマると集中力がすごい。',
    skills: ['TypeScript', 'React', 'Node.js', '設計原則', 'リファクタリング'],
    catchphrase: '「にゃるほど、こう書けばキレイに動くにゃ！」',
    trivia:
      'キーボードの上で寝るのが好き。お気に入りのエディタは VS Code（猫テーマ）。',
  },
  {
    id: 'inu',
    name: 'イヌ',
    animal: 'ビーグル犬',
    role: 'PO / スクラムマスター',
    color: COLORS.green,
    emoji: '🐶',
    personality:
      '忠実で責任感が強い。チームの雰囲気を常に気にかける。おやつ（進捗）が大好き。',
    skills: [
      'スクラム運営',
      'バックログ管理',
      'ファシリテーション',
      '見積もり',
      'ステークホルダー調整',
    ],
    catchphrase: '「よし、今日のデイリーは15分で終わらせるワン！」',
    trivia:
      '毎朝のデイリースクラムには必ず5分前に着席。手帳型のバックログを常に携帯。',
  },
  {
    id: 'usagi',
    name: 'ウサギ',
    animal: '白うさぎ',
    role: 'QAエンジニア',
    color: COLORS.cyan,
    emoji: '🐰',
    personality:
      '慎重で細部に目が行く。バグを見つけると耳がピンと立つ。静かだが鋭い指摘をする。',
    skills: [
      'テスト設計',
      '自動テスト',
      'CI/CD',
      'バグ分析',
      '品質メトリクス',
    ],
    catchphrase: '「このエッジケース、見逃してないぴょん？」',
    trivia:
      'テスト自動化率100%が夢。人参ジュースを飲みながらテストケースを書く。',
  },
];
