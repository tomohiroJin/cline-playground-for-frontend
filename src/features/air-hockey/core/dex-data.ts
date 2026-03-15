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
    unlockCondition: { type: 'hidden' }, // 現時点では解放不可
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
    unlockCondition: { type: 'hidden' }, // 現時点では解放不可
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
    unlockCondition: { type: 'hidden' }, // 現時点では解放不可
  },
];

/** IDで図鑑エントリを取得する */
export const getDexEntryById = (
  characterId: string
): DexEntry | undefined =>
  DEX_ENTRIES.find((entry) => entry.profile.characterId === characterId);

/** 全図鑑エントリを取得する */
export const getAllDexEntries = (): DexEntry[] => DEX_ENTRIES;
