/**
 * 図鑑データ（P2-01: データ層整備）
 *
 * キャラクター図鑑のエントリデータ。
 * 各キャラクターのプロフィール情報とアンロック条件を定義する。
 * データソース: src/features/air-hockey/doc/world/character-profiles.md
 */
import { DexEntry } from './types';

// 全キャラクターの図鑑エントリ
export const DEX_ENTRIES: DexEntry[] = [
  // ── 蒼風館エアホッケー部 ──────────────────────────

  {
    profile: {
      characterId: 'player',
      fullName: '蒼葉 アキラ',
      reading: 'あおば あきら',
      grade: '1年生',
      age: 15,
      birthday: '4月8日',
      height: '165cm',
      school: '蒼風館高校',
      club: 'エアホッケー部',
      personality: ['素直', '負けず嫌い', '行動派'],
      quote: 'エアホッケーって、こんなに熱くなれるんだ',
      playStyle: 'オールラウンダー',
      specialMove: 'ライジングショット',
      specialMoveDesc:
        '相手の意表を突く、直感的なタイミングで放つ速射',
      description:
        '入学式の帰り道、エアホッケー部の練習を見てその場で入部を決意した1年生。考えるより先に体が動くタイプで、対戦相手から技を吸収して成長する。',
    },
    unlockCondition: { type: 'default' },
  },

  {
    profile: {
      characterId: 'hiro',
      fullName: '日向 ヒロ',
      reading: 'ひなた ひろ',
      grade: '2年生',
      age: 16,
      birthday: '7月22日',
      height: '172cm',
      school: '蒼風館高校',
      club: 'エアホッケー部',
      personality: ['明るい', '面倒見がいい', 'お調子者'],
      quote: 'まずは俺と一勝負だ。基本を見せてやるよ！',
      playStyle: 'ストレートシューター',
      specialMove: 'バレットストレート',
      specialMoveDesc:
        '最短距離で叩き込む豪快なストレートショット',
      description:
        '部のムードメーカー。誰とでもすぐに打ち解けられる社交性があり、新入部員の面倒を積極的に見る。ストレート主体で小細工なしの正面突破が信条。',
    },
    unlockCondition: { type: 'story-clear', stageId: '1-1' },
  },

  {
    profile: {
      characterId: 'misaki',
      fullName: '水瀬 ミサキ',
      reading: 'みなせ みさき',
      grade: '2年生',
      age: 16,
      birthday: '11月15日',
      height: '162cm',
      school: '蒼風館高校',
      club: 'エアホッケー部',
      personality: ['知的', '負けず嫌い', '世話焼き'],
      quote: 'テクニックがないと厳しいかも♪',
      playStyle: 'テクニシャン',
      specialMove: 'ファントムカーブ',
      specialMoveDesc:
        '微妙な角度調整で相手の予測を外す変化球ショット',
      description:
        '一見クールで余裕がある振る舞いだが、内面は相当な負けず嫌い。パック軌道の高精度な予測と、アイテムの戦略的活用が持ち味の頭脳派。',
    },
    unlockCondition: { type: 'story-clear', stageId: '1-2' },
  },

  {
    profile: {
      characterId: 'takuma',
      fullName: '鷹見 タクマ',
      reading: 'たかみ たくま',
      grade: '3年生',
      age: 17,
      birthday: '2月3日',
      height: '180cm',
      school: '蒼風館高校',
      club: 'エアホッケー部',
      personality: ['威厳', '責任感', '不器用な優しさ'],
      quote: '面白い。だが部長の俺を倒すのは、そう簡単じゃないぞ。',
      playStyle: 'パワーバウンサー',
      specialMove: 'サンダーウォール',
      specialMoveDesc:
        '壁反射を利用した予測困難なパワーショット',
      description:
        '蒼風館エアホッケー部の部長。寡黙で厳しい印象を与えるが、部の仲間を誰よりも大切に思っている。圧倒的なパワーと壁反射の読みを組み合わせた、力と技の融合スタイル。',
    },
    unlockCondition: { type: 'story-clear', stageId: '1-3' },
  },

  {
    profile: {
      characterId: 'yuu',
      fullName: '柊 ユウ',
      reading: 'ひいらぎ ゆう',
      grade: '1年生',
      age: 15,
      birthday: '9月12日',
      height: '160cm',
      school: '蒼風館高校',
      club: 'エアホッケー部',
      personality: ['分析的', '控えめ', '芯が強い'],
      quote:
        'データは嘘をつかない。でも、試合は数字だけじゃ決まらないんだよね',
      playStyle: 'アナライザー',
      specialMove: 'データドライブ',
      specialMoveDesc:
        '相手の癖をデータから読み切り、最適解のコースに打つ精密ショット',
      description:
        'チームの「頭脳」としてデータ面から部を支える解説役。アキラとは入学式で出会い、一緒に入部した同期の親友。',
    },
    unlockCondition: { type: 'hidden' }, // 隠しキャラ（将来のアップデートで解放予定）
  },

  // ── 第2章キャラクター ──────────────────────────────

  {
    profile: {
      characterId: 'kanata',
      fullName: '白波 カナタ',
      reading: 'しらなみ かなた',
      grade: '2年生',
      age: 16,
      birthday: '5月9日',
      height: '170cm',
      school: '碧波学院',
      club: 'エアホッケー部',
      personality: ['飄々', '観察眼', '遊び心'],
      quote: 'ね、読めなかったでしょ？',
      playStyle: 'トリックスター',
      specialMove: 'ミラージュバウンス',
      specialMoveDesc:
        '壁反射とフェイントを組み合わせた、軌道予測不能のトリックショット',
      description:
        '碧波学院エアホッケー部の2年生。飄々とした態度の裏で鋭い観察眼を持つ。壁バウンスを多用し、相手の予測を裏切るプレイスタイル。「面白い試合」を何より重視する。',
    },
    unlockCondition: { type: 'story-clear', stageId: '2-3' },
  },

  {
    profile: {
      characterId: 'riku',
      fullName: '風早 リク',
      reading: 'かざはや りく',
      grade: '2年生',
      age: 16,
      birthday: '8月15日',
      height: '175cm',
      school: '天嶺高校',
      club: 'エアホッケー部',
      personality: ['自信家', '素直', '負けず嫌い'],
      quote: '速さが勝負だ！',
      playStyle: 'スピードスター',
      specialMove: 'ソニックラッシュ',
      specialMoveDesc:
        '超高速の初動と反射で相手を圧倒するスピード特化ショット',
      description:
        '天嶺高校エアホッケー部の2年生。圧倒的なスピードと反射神経で相手を圧倒する。レンに敗れたことで「速さだけじゃダメ」と気づき始めている。',
    },
    unlockCondition: { type: 'hidden' }, // 第3章で対戦時に解放予定
  },

  {
    profile: {
      characterId: 'shion',
      fullName: '朝霧 シオン',
      reading: 'あさぎり しおん',
      grade: '2年生',
      age: 16,
      birthday: '1月7日',
      height: '163cm',
      school: '銀嶺学院',
      club: 'エアホッケー部',
      personality: ['分析的', '冷静', '好奇心'],
      quote: 'ふぅん…面白い選手がいるじゃない',
      playStyle: 'アダプター',
      specialMove: 'ゼロリーディング',
      specialMoveDesc:
        '対戦相手のパターンを分析し、試合中盤から精度が飛躍的に上がる適応型スタイル',
      description:
        '銀嶺学院エアホッケー部の2年生。県大会強豪校のスカウト役。試合を観察し、次の対戦相手を品定めしている。第3章の伏線キャラクター。',
    },
    unlockCondition: { type: 'hidden' }, // 第3章で対戦時に解放予定
  },

  // ── フリー対戦キャラクター ──────────────────────────

  {
    profile: {
      characterId: 'rookie',
      fullName: '春日 ソウタ',
      reading: 'かすが そうた',
      grade: '1年生',
      age: 15,
      birthday: '6月21日',
      height: '168cm',
      school: '風見丘高校',
      club: 'エアホッケー同好会',
      personality: ['のんびり', '楽天的'],
      quote: 'おっ、入った！ ラッキー！',
      playStyle: 'ビギナー',
      specialMove: 'ラッキーショット',
      specialMoveDesc:
        '本人も驚く、偶然生まれる予測不能なショット',
      description:
        '風見丘高校エアホッケー同好会の1年生。勝敗にこだわらず楽しむことが最優先。楽しんでるうちにいつの間にか強くなっているタイプ。',
    },
    unlockCondition: { type: 'story-clear', stageId: '2-1' },
  },

  {
    profile: {
      characterId: 'regular',
      fullName: '秋山 ケンジ',
      reading: 'あきやま けんじ',
      grade: '2年生',
      age: 16,
      birthday: '10月3日',
      height: '174cm',
      school: '翠嶺学園',
      club: 'エアホッケー部',
      personality: ['真面目', '努力家'],
      quote: 'いい感じ！ もらった！',
      playStyle: 'オーソドックス',
      specialMove: 'ステディドライブ',
      specialMoveDesc:
        '基本に忠実な、安定感のある堅実なショット',
      description:
        '翠嶺学園エアホッケー部の2年生。堅実なプレイスタイルで「基本に忠実」な強さを持つ。落ち着いているが、闘志は秘めている。',
    },
    unlockCondition: { type: 'story-clear', stageId: '2-2' },
  },

  {
    profile: {
      characterId: 'ace',
      fullName: '氷室 レン',
      reading: 'ひむろ れん',
      grade: '3年生',
      age: 17,
      birthday: '12月25日',
      height: '178cm',
      school: '黒鉄高校',
      club: 'エアホッケー部',
      personality: ['クール', '実力主義'],
      quote: '…面白い',
      playStyle: 'オールラウンドエース',
      specialMove: 'アブソリュートゼロ',
      specialMoveDesc:
        '圧倒的なスピードと精度を兼ね備えた、防御不能の一撃',
      description:
        '黒鉄高校エアホッケー部のエース。必要最低限の言葉しか発さないが、実力を認めた相手にだけ敬意を示す。地区大会決勝のボスとして立ちはだかる。',
    },
    unlockCondition: { type: 'story-clear', stageId: '2-4' },
  },
];

/** IDで図鑑エントリを取得する */
export const getDexEntryById = (
  characterId: string
): DexEntry | undefined =>
  DEX_ENTRIES.find((entry) => entry.profile.characterId === characterId);

/** 全図鑑エントリを取得する */
export const getAllDexEntries = (): DexEntry[] => DEX_ENTRIES;

/** 表示対象の図鑑エントリを取得する（hidden を除外） */
export const getVisibleDexEntries = (): DexEntry[] =>
  DEX_ENTRIES.filter((entry) => entry.unlockCondition.type !== 'hidden');
