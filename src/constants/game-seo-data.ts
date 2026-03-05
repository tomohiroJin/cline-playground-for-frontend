/** ゲームSEOデータの型定義 */
export interface GameSeoData {
  /** ゲーム名 */
  readonly name: string;
  /** ゲーム説明文（meta description / JSON-LD 用） */
  readonly description: string;
  /** ゲームページのパス（例: /puzzle） */
  readonly path: string;
}

/** サイトのベースURL */
export const SITE_BASE_URL = 'https://play.niku9.click';

/** サイト名 */
export const SITE_NAME = 'Game Platform';

/** 全13ゲームのSEO情報 */
export const GAME_SEO_DATA: Readonly<Record<string, GameSeoData>> = {
  '/puzzle': {
    name: 'Picture Puzzle',
    description:
      '美しい画像を使ったクラシックなスライドパズル。難易度調整機能付きで、初心者から上級者まで楽しめます。無料でブラウザからすぐにプレイ可能。',
    path: '/puzzle',
  },
  '/air-hockey': {
    name: 'Air Hockey',
    description:
      'リアルな物理演算で楽しむエアホッケー。直感的な操作でテンポの良い対戦が楽しめます。無料でブラウザからすぐにプレイ可能。',
    path: '/air-hockey',
  },
  '/racing': {
    name: 'Racing Game',
    description:
      'スピード感あふれるレースゲーム。コースを駆け抜けてベストタイムを目指せ。無料でブラウザからすぐにプレイ可能。',
    path: '/racing',
  },
  '/falling-shooter': {
    name: 'Falldown Shooter',
    description:
      '落下しながら敵を撃破するシューティングゲーム。反射神経と判断力が試される。無料でブラウザからすぐにプレイ可能。',
    path: '/falling-shooter',
  },
  '/maze-horror': {
    name: 'Labyrinth of Shadows',
    description:
      '暗闇の迷宮を探索するホラーアドベンチャー。緊張感あふれる雰囲気の中、出口を目指せ。無料でブラウザからすぐにプレイ可能。',
    path: '/maze-horror',
  },
  '/non-brake-descent': {
    name: 'Non-Brake Descent',
    description:
      'ブレーキなしで坂道を駆け下りるアクションゲーム。障害物を避けながらゴールを目指せ。無料でブラウザからすぐにプレイ可能。',
    path: '/non-brake-descent',
  },
  '/deep-sea-shooter': {
    name: 'Deep Sea Interceptor',
    description:
      '深海を舞台にしたシューティングゲーム。迫りくる敵を迎撃し、海の平和を守れ。無料でブラウザからすぐにプレイ可能。',
    path: '/deep-sea-shooter',
  },
  '/ipne': {
    name: 'IPNE',
    description:
      'ターン制ローグライクRPG。戦略的なバトルとダンジョン探索が楽しめる。無料でブラウザからすぐにプレイ可能。',
    path: '/ipne',
  },
  '/agile-quiz-sugoroku': {
    name: 'Agile Quiz Sugoroku',
    description:
      'アジャイル開発の知識を試すクイズすごろく。遊びながらスクラムやXPを学べる。無料でブラウザからすぐにプレイ可能。',
    path: '/agile-quiz-sugoroku',
  },
  '/labyrinth-echo': {
    name: '迷宮の残響',
    description:
      'テキスト探索×判断×ローグライトRPG。不確かな情報の中で選択を重ね、迷宮からの生還を目指せ。無料でブラウザからすぐにプレイ可能。',
    path: '/labyrinth-echo',
  },
  '/risk-lcd': {
    name: 'RISK LCD',
    description:
      'リスク管理をテーマにしたLCD風ストラテジーゲーム。限られたリソースで最適な判断を下せ。無料でブラウザからすぐにプレイ可能。',
    path: '/risk-lcd',
  },
  '/keys-and-arms': {
    name: 'KEYS & ARMS',
    description:
      '鍵と武器を駆使するアクションRPG。ダンジョンを攻略し、強力な装備を手に入れろ。無料でブラウザからすぐにプレイ可能。',
    path: '/keys-and-arms',
  },
  '/primal-path': {
    name: '原始進化録 - PRIMAL PATH',
    description:
      '三大文明を育て進化を重ねる自動戦闘ローグライト。シナジービルドで毎回異なる冒険が待つ。無料でブラウザからすぐにプレイ可能。',
    path: '/primal-path',
  },
};

/** FAQ アイテムの型定義 */
export interface FaqItem {
  /** 質問 */
  readonly question: string;
  /** 回答 */
  readonly answer: string;
}

/** About ページ用 FAQ データ */
export const ABOUT_FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    question: 'Game Platform は無料ですか？',
    answer:
      'はい、すべてのゲームは完全無料でプレイできます。課金要素はありません。',
  },
  {
    question: 'ユーザー登録は必要ですか？',
    answer:
      'いいえ、ユーザー登録は不要です。サイトにアクセスするだけですぐにゲームをプレイできます。',
  },
  {
    question: 'どのブラウザで遊べますか？',
    answer:
      'Google Chrome および Microsoft Edge の最新版を推奨しています。その他のモダンブラウザでも基本的に動作します。',
  },
  {
    question: 'スマートフォンでも遊べますか？',
    answer:
      'はい、多くのゲームはスマートフォンでもプレイ可能です。ただし、一部のゲームはPC操作を推奨しています。各ゲームの注意事項をご確認ください。',
  },
  {
    question: 'ゲームのデータはどこに保存されますか？',
    answer:
      'ゲームの進行データやスコアはブラウザの localStorage に保存されます。サーバーには送信されません。ブラウザのキャッシュクリアでデータが消える場合がありますのでご注意ください。',
  },
  {
    question: '何種類のゲームがありますか？',
    answer:
      '現在 13 種類のゲームを提供しています。パズル、シューティング、RPG、レース、ホラー、ストラテジーなど多彩なジャンルを取り揃えています。',
  },
];

/** ページごとのmeta description マッピング（ゲーム以外を含む） */
export const META_DESCRIPTIONS: Readonly<Record<string, string>> = {
  '/': '13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム。パズル、シューティング、RPG、レース、ホラーなど多彩なジャンルを収録。',
  ...Object.fromEntries(
    Object.entries(GAME_SEO_DATA).map(([path, data]) => [path, data.description])
  ),
  '/about': 'Game Platform（niku9.click）のサイト概要。13種類の無料ブラウザゲームを提供するゲームプラットフォームです。',
  '/privacy-policy': 'Game Platform（niku9.click）のプライバシーポリシー。個人情報の取り扱いについて説明します。',
  '/terms': 'Game Platform（niku9.click）の利用規約。サービスの利用条件について説明します。',
  '/contact': 'Game Platform（niku9.click）へのお問い合わせ。ご質問やご要望はこちらからお寄せください。',
};
