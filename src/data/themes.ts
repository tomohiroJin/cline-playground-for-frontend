import { Theme } from '../types/puzzle';

export const themes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: '美しいイラスト作品のコレクション',
    unlockCondition: { type: 'always' },
    images: [
      {
        id: 'snowy_mountain_ukiyoe',
        filename: 'snowy_mountain_ukiyoe.webp',
        alt: '雪山の浮世絵風イラスト',
        themeId: 'illustration-gallery',
        hasVideo: true,
      },
      {
        id: 'moonlight_dancer',
        filename: 'moonlight_dancer.webp',
        alt: '月明かりのダンサー',
        themeId: 'illustration-gallery',
        hasVideo: true,
      },
    ],
  },
  {
    id: 'world-scenery',
    name: '世界の風景',
    description: '世界各地の美しい風景',
    unlockCondition: { type: 'always' },
    images: [
      {
        id: 'camel_in_the_desert',
        filename: 'camel_in_the_desert.webp',
        alt: '砂漠の中のキャメル',
        themeId: 'world-scenery',
        hasVideo: true,
      },
      {
        id: 'midnight_neon_street',
        filename: 'midnight_neon_street.webp',
        alt: '真夜中のネオン街',
        themeId: 'world-scenery',
        hasVideo: true,
      },
    ],
  },
  {
    id: 'nostalgia',
    name: 'ノスタルジー',
    description: '懐かしい日本の風景',
    unlockCondition: { type: 'always' },
    images: [
      {
        id: 'sunset_candy_shop',
        filename: 'sunset_candy_shop.webp',
        alt: '夕焼けの駄菓子屋',
        themeId: 'nostalgia',
        hasVideo: true,
      },
      {
        id: 'chalk_drawing_kids',
        filename: 'chalk_drawing_kids.webp',
        alt: 'チョークで落書きをする子供達',
        themeId: 'nostalgia',
        hasVideo: true,
      },
    ],
  },
  {
    id: 'sea-and-sky',
    name: '海と空',
    description: '海と空の美しい景色',
    unlockCondition: { type: 'clearCount', count: 5 },
    images: [
      {
        id: 'coral_reef_fish',
        filename: 'coral_reef_fish.webp',
        alt: 'サンゴ礁の熱帯魚',
        themeId: 'sea-and-sky',
        hasVideo: false,
      },
      {
        id: 'cumulonimbus_port_town',
        filename: 'cumulonimbus_port_town.webp',
        alt: '入道雲の港町',
        themeId: 'sea-and-sky',
        hasVideo: false,
      },
      {
        id: 'starry_beach',
        filename: 'starry_beach.webp',
        alt: '星降る砂浜',
        themeId: 'sea-and-sky',
        hasVideo: true,
      },
    ],
  },
  {
    id: 'four-seasons',
    name: '四季',
    description: '日本の四季を感じる風景',
    unlockCondition: { type: 'clearCount', count: 10 },
    images: [
      {
        id: 'cherry_blossom_path',
        filename: 'cherry_blossom_path.webp',
        alt: '桜並木の小道',
        themeId: 'four-seasons',
        hasVideo: false,
      },
      {
        id: 'autumn_valley',
        filename: 'autumn_valley.webp',
        alt: '紅葉の渓谷',
        themeId: 'four-seasons',
        hasVideo: false,
      },
      {
        id: 'snow_lantern_hotspring',
        filename: 'snow_lantern_hotspring.webp',
        alt: '雪灯りの温泉',
        themeId: 'four-seasons',
        hasVideo: false,
      },
    ],
  },
  {
    id: 'mystery',
    name: 'ミステリー',
    description: '全テーマクリアで解放される秘密のコレクション',
    unlockCondition: {
      type: 'themesClear',
      themeIds: ['illustration-gallery', 'world-scenery', 'nostalgia', 'sea-and-sky', 'four-seasons'],
    },
    images: [
      {
        id: '8bit_mystery_game',
        filename: '8bit_mystery_game.webp',
        alt: '8ビット風ミステリーゲーム',
        themeId: 'mystery',
        hasVideo: false,
      },
      {
        id: 'japanese_folktale_mystery',
        filename: 'japanese_folktale_mystery.webp',
        alt: '日本昔話のミステリー',
        themeId: 'mystery',
        hasVideo: false,
      },
      {
        id: 'mysteries_of_children_in_american_frontier',
        filename: 'mysteries_of_children_in_american_frontier.webp',
        alt: 'アメリカ開拓時代の子供たちの謎',
        themeId: 'mystery',
        hasVideo: false,
      },
    ],
  },
];
