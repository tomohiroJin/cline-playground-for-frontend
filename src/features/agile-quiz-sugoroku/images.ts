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
import aqs_type_stable from '../../assets/images/aqs_type_stable.webp';
import aqs_type_firefighter from '../../assets/images/aqs_type_firefighter.webp';
import aqs_type_growth from '../../assets/images/aqs_type_growth.webp';
import aqs_type_speed from '../../assets/images/aqs_type_speed.webp';
import aqs_type_debt from '../../assets/images/aqs_type_debt.webp';
import aqs_type_default from '../../assets/images/aqs_type_default.webp';
import aqs_grade_celebration from '../../assets/images/aqs_grade_celebration.webp';
import aqs_build_success from '../../assets/images/aqs_build_success.webp';
import aqs_correct from '../../assets/images/aqs_correct.webp';
import aqs_incorrect from '../../assets/images/aqs_incorrect.webp';
import aqs_timeup from '../../assets/images/aqs_timeup.webp';

export const AQS_IMAGES = {
  title: aqs_title,
  sprintStart: aqs_sprint_start,
  retro: aqs_retro,
  gradeCelebration: aqs_grade_celebration,
  buildSuccess: aqs_build_success,
  events: {
    planning: aqs_event_planning,
    daily: null, // No image for daily
    impl1: aqs_event_impl1,
    test1: aqs_event_test1,
    refinement: aqs_event_refinement,
    impl2: aqs_event_impl2,
    test2: aqs_event_test2,
    review: aqs_event_review,
    emergency: aqs_event_emergency,
  },
  types: {
    stable: aqs_type_stable,
    firefighter: aqs_type_firefighter,
    growth: aqs_type_growth,
    speed: aqs_type_speed,
    debt: aqs_type_debt,
    default: aqs_type_default,
  },
  feedback: {
    correct: aqs_correct,
    incorrect: aqs_incorrect,
    timeup: aqs_timeup,
  },
} as const;
