import title from '../../assets/images/le_title.webp';

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
