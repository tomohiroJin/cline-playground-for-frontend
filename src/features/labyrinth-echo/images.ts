import title from '../../assets/images/le_title.webp';

// タイトルパララックス
import titleFar from '../../assets/images/le_title_far.webp';
import titleMid from '../../assets/images/le_title_mid.webp';

// パララックス背景
import bg1Far from '../../assets/images/le_bg_1_far.webp';
import bg1Mid from '../../assets/images/le_bg_1_mid.webp';
import bg1Near from '../../assets/images/le_bg_1_near.webp';
import bg2Far from '../../assets/images/le_bg_2_far.webp';
import bg2Mid from '../../assets/images/le_bg_2_mid.webp';
import bg2Near from '../../assets/images/le_bg_2_near.webp';
import bg3Far from '../../assets/images/le_bg_3_far.webp';
import bg3Mid from '../../assets/images/le_bg_3_mid.webp';
import bg3Near from '../../assets/images/le_bg_3_near.webp';
import bg4Far from '../../assets/images/le_bg_4_far.webp';
import bg4Mid from '../../assets/images/le_bg_4_mid.webp';
import bg4Near from '../../assets/images/le_bg_4_near.webp';
import bg5Far from '../../assets/images/le_bg_5_far.webp';
import bg5Mid from '../../assets/images/le_bg_5_mid.webp';
import bg5Near from '../../assets/images/le_bg_5_near.webp';

// シーンイラスト
import sceneE030 from '../../assets/images/le_scene_e030.webp';
import sceneFloor1Key from '../../assets/images/le_scene_floor1_key.webp';
import sceneFloor2Key from '../../assets/images/le_scene_floor2_key.webp';
import sceneFloor3Key from '../../assets/images/le_scene_floor3_key.webp';
import sceneFloor4Key from '../../assets/images/le_scene_floor4_key.webp';
import sceneFloor5Key from '../../assets/images/le_scene_floor5_key.webp';
import sceneChainClimax1 from '../../assets/images/le_scene_chain_climax1.webp';
import sceneChainClimax2 from '../../assets/images/le_scene_chain_climax2.webp';
import sceneChainClimax3 from '../../assets/images/le_scene_chain_climax3.webp';
import sceneCrossrun1 from '../../assets/images/le_scene_crossrun1.webp';
import sceneCrossrun2 from '../../assets/images/le_scene_crossrun2.webp';
import sceneCrossrun3 from '../../assets/images/le_scene_crossrun3.webp';
import sceneStatusBleed from '../../assets/images/le_scene_status_bleed.webp';
import sceneStatusFear from '../../assets/images/le_scene_status_fear.webp';
import sceneStatusCurse from '../../assets/images/le_scene_status_curse.webp';

// 状態異常オーバーレイ
import overlayInjured from '../../assets/images/le_overlay_injured.webp';
import overlayConfused from '../../assets/images/le_overlay_confused.webp';
import overlayBleeding from '../../assets/images/le_overlay_bleeding.webp';
import overlayFear from '../../assets/images/le_overlay_fear.webp';
import overlayCurse from '../../assets/images/le_overlay_curse.webp';

// Difficulty Cards
import diffEasy from '../../assets/images/le_diff_easy.webp';
import diffNormal from '../../assets/images/le_diff_normal.webp';
import diffHard from '../../assets/images/le_diff_hard.webp';
import diffAbyss from '../../assets/images/le_diff_abyss.webp';

// Floor Intros
import floor1 from '../../assets/images/le_floor_1.webp';
import floor2 from '../../assets/images/le_floor_2.webp';
import floor3 from '../../assets/images/le_floor_3.webp';
import floor4 from '../../assets/images/le_floor_4.webp';
import floor5 from '../../assets/images/le_floor_5.webp';

// Event Types
import eventExploration from '../../assets/images/le_event_exploration.webp';
import eventEncounter from '../../assets/images/le_event_encounter.webp';
import eventTrap from '../../assets/images/le_event_trap.webp';
import eventRest from '../../assets/images/le_event_rest.webp';

// Endings
import endingAbyssPerfect from '../../assets/images/le_ending_abyss_perfect.webp';
import endingAbyssClear from '../../assets/images/le_ending_abyss_clear.webp';
import endingHardClear from '../../assets/images/le_ending_hard_clear.webp';
import endingPerfect from '../../assets/images/le_ending_perfect.webp';
import endingScholar from '../../assets/images/le_ending_scholar.webp';
import endingIron from '../../assets/images/le_ending_iron.webp';
import endingBattered from '../../assets/images/le_ending_battered.webp';
import endingMadness from '../../assets/images/le_ending_madness.webp';
import endingCursed from '../../assets/images/le_ending_cursed.webp';
import endingVeteran from '../../assets/images/le_ending_veteran.webp';
import endingStandard from '../../assets/images/le_ending_standard.webp';

// Game Over
import gameover from '../../assets/images/le_gameover.webp';

export const LE_IMAGES = {
  title,
  difficulty: {
    easy: diffEasy,
    normal: diffNormal,
    hard: diffHard,
    abyss: diffAbyss,
  },
  floors: {
    1: floor1,
    2: floor2,
    3: floor3,
    4: floor4,
    5: floor5,
  },
  events: {
    exploration: eventExploration,
    encounter: eventEncounter,
    trap: eventTrap,
    rest: eventRest,
  },
  endings: {
    abyss_perfect: endingAbyssPerfect,
    abyss_clear: endingAbyssClear,
    hard_clear: endingHardClear,
    perfect: endingPerfect,
    scholar: endingScholar,
    iron: endingIron,
    battered: endingBattered,
    madness: endingMadness,
    cursed: endingCursed,
    veteran: endingVeteran,
    standard: endingStandard,
  },
  gameover,
} as const;

/** フロアパララックス背景 */
export const LE_BG_IMAGES: Record<number, {
  far: string;
  mid: string;
  near: string;
}> = {
  1: { far: bg1Far, mid: bg1Mid, near: bg1Near },
  2: { far: bg2Far, mid: bg2Mid, near: bg2Near },
  3: { far: bg3Far, mid: bg3Mid, near: bg3Near },
  4: { far: bg4Far, mid: bg4Mid, near: bg4Near },
  5: { far: bg5Far, mid: bg5Mid, near: bg5Near },
};

/** イベントシーンイラスト（イベントID → 画像） */
export const LE_SCENE_IMAGES: Record<string, string> = {
  'e030': sceneE030,
  'floor1_key': sceneFloor1Key,
  'floor2_key': sceneFloor2Key,
  'floor3_key': sceneFloor3Key,
  'floor4_key': sceneFloor4Key,
  'floor5_key': sceneFloor5Key,
  'chain_climax1': sceneChainClimax1,
  'chain_climax2': sceneChainClimax2,
  'chain_climax3': sceneChainClimax3,
  'crossrun1': sceneCrossrun1,
  'crossrun2': sceneCrossrun2,
  'crossrun3': sceneCrossrun3,
  'status_bleed': sceneStatusBleed,
  'status_fear': sceneStatusFear,
  'status_curse': sceneStatusCurse,
};

/** 状態異常オーバーレイ */
export const LE_OVERLAY_IMAGES: Record<string, string> = {
  'injured': overlayInjured,
  'confused': overlayConfused,
  'bleeding': overlayBleeding,
  'fear': overlayFear,
  'curse': overlayCurse,
};

/** タイトルパララックスレイヤー */
export const LE_TITLE_LAYERS: {
  far: string;
  mid: string;
} = {
  far: titleFar,
  mid: titleMid,
};
