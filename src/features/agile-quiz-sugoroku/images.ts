import aqs_title from '../../assets/images/aqs_title.webp';
import aqs_sprint_start from '../../assets/images/aqs_sprint_start.webp';
import aqs_event_planning from '../../assets/images/aqs_event_planning.webp';
import aqs_event_impl1 from '../../assets/images/aqs_event_impl1.webp';
import aqs_event_test1 from '../../assets/images/aqs_event_test1.webp';
import aqs_event_refinement from '../../assets/images/aqs_event_refinement.webp';
import aqs_event_impl2 from '../../assets/images/aqs_event_impl2.webp';
import aqs_event_test2 from '../../assets/images/aqs_event_test2.webp';
import aqs_event_review from '../../assets/images/aqs_event_review.webp';
import aqs_event_emergency from '../../assets/images/aqs_event_emergency.webp';
import aqs_retro from '../../assets/images/aqs_retro.webp';
// チームタイプ画像（Phase 3c で新画像に差し替え済み）
import aqs_type_synergy from '../../assets/images/aqs_type_synergy.webp';
import aqs_type_resilient from '../../assets/images/aqs_type_resilient.webp';
import aqs_type_evolving from '../../assets/images/aqs_type_evolving.webp';
import aqs_type_agile from '../../assets/images/aqs_type_agile.webp';
import aqs_type_struggling from '../../assets/images/aqs_type_struggling.webp';
import aqs_type_forming from '../../assets/images/aqs_type_forming.webp';
import aqs_grade_celebration from '../../assets/images/aqs_grade_celebration.webp';
import aqs_build_success from '../../assets/images/aqs_build_success.webp';
import aqs_correct from '../../assets/images/aqs_correct.webp';
import aqs_incorrect from '../../assets/images/aqs_incorrect.webp';
import aqs_timeup from '../../assets/images/aqs_timeup.webp';
import aqs_char_neko from '../../assets/images/aqs_char_neko.webp';
import aqs_char_inu from '../../assets/images/aqs_char_inu.webp';
import aqs_char_usagi from '../../assets/images/aqs_char_usagi.webp';
import aqs_char_taka from '../../assets/images/aqs_char_taka.webp';
import aqs_char_penguin from '../../assets/images/aqs_char_penguin.webp';
import aqs_char_team from '../../assets/images/aqs_char_team.webp';
import aqs_char_group from '../../assets/images/aqs_char_group.webp';
// ストーリー画像（Phase 3c で追加）
import aqs_story_01 from '../../assets/images/aqs_story_01.webp';
import aqs_story_02 from '../../assets/images/aqs_story_02.webp';
import aqs_story_03 from '../../assets/images/aqs_story_03.webp';
import aqs_story_04 from '../../assets/images/aqs_story_04.webp';
import aqs_story_05 from '../../assets/images/aqs_story_05.webp';
import aqs_story_06 from '../../assets/images/aqs_story_06.webp';
import aqs_story_07 from '../../assets/images/aqs_story_07.webp';
import aqs_story_08 from '../../assets/images/aqs_story_08.webp';
// エンディング画像（Phase 3c で追加）
import aqs_ending_common from '../../assets/images/aqs_ending_common.webp';
import aqs_ending_epilogue from '../../assets/images/aqs_ending_epilogue.webp';
// 背景画像（Phase 3c で追加）
import aqs_bg_office from '../../assets/images/aqs_bg_office.webp';
import aqs_bg_planning from '../../assets/images/aqs_bg_planning.webp';
import aqs_bg_dev from '../../assets/images/aqs_bg_dev.webp';
import aqs_bg_emergency from '../../assets/images/aqs_bg_emergency.webp';
import aqs_bg_retro from '../../assets/images/aqs_bg_retro.webp';

export const AQS_IMAGES = {
  title: aqs_title,
  sprintStart: aqs_sprint_start,
  retro: aqs_retro,
  gradeCelebration: aqs_grade_celebration,
  buildSuccess: aqs_build_success,
  events: {
    planning: aqs_event_planning,
    daily: null, // デイリーイベントは画像なし
    impl1: aqs_event_impl1,
    test1: aqs_event_test1,
    refinement: aqs_event_refinement,
    impl2: aqs_event_impl2,
    test2: aqs_event_test2,
    review: aqs_event_review,
    emergency: aqs_event_emergency,
  },
  types: {
    synergy: aqs_type_synergy,
    resilient: aqs_type_resilient,
    evolving: aqs_type_evolving,
    agile: aqs_type_agile,
    struggling: aqs_type_struggling,
    forming: aqs_type_forming,
  },
  feedback: {
    correct: aqs_correct,
    incorrect: aqs_incorrect,
    timeup: aqs_timeup,
  },
  characters: {
    neko: aqs_char_neko,
    inu: aqs_char_inu,
    usagi: aqs_char_usagi,
    taka: aqs_char_taka,
    penguin: aqs_char_penguin,
    team: aqs_char_team,
    group: aqs_char_group,
  },
  stories: {
    story_01: aqs_story_01,
    story_02: aqs_story_02,
    story_03: aqs_story_03,
    story_04: aqs_story_04,
    story_05: aqs_story_05,
    story_06: aqs_story_06,
    story_07: aqs_story_07,
    story_08: aqs_story_08,
  },
  endings: {
    common: aqs_ending_common,
    epilogue: aqs_ending_epilogue,
  },
  backgrounds: {
    office: aqs_bg_office,
    planning: aqs_bg_planning,
    dev: aqs_bg_dev,
    emergency: aqs_bg_emergency,
    retro: aqs_bg_retro,
  },
} as const;
