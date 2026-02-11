import { Question, QuestionsByCategory } from '../types';
import planningQuestions from './planning.json';
import impl1Questions from './impl1.json';
import test1Questions from './test1.json';
import refinementQuestions from './refinement.json';
import impl2Questions from './impl2.json';
import test2Questions from './test2.json';
import reviewQuestions from './review.json';
import emergencyQuestions from './emergency.json';

function assertQuestionArray(data: unknown, category: string): Question[] {
  if (!Array.isArray(data)) {
    throw new Error(`[agile-quiz-sugoroku] ${category} is not an array`);
  }

  data.forEach((item, index) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as { q?: unknown }).q !== 'string' ||
      !Array.isArray((item as { o?: unknown }).o) ||
      !(item as { o: unknown[] }).o.every((option) => typeof option === 'string') ||
      typeof (item as { a?: unknown }).a !== 'number'
    ) {
      throw new Error(
        `[agile-quiz-sugoroku] Invalid question schema: ${category}[${index}]`
      );
    }
  });

  return data as Question[];
}

export const PLANNING_QUESTIONS = assertQuestionArray(planningQuestions, 'planning');
export const IMPL1_QUESTIONS = assertQuestionArray(impl1Questions, 'impl1');
export const TEST1_QUESTIONS = assertQuestionArray(test1Questions, 'test1');
export const REFINEMENT_QUESTIONS = assertQuestionArray(refinementQuestions, 'refinement');
export const IMPL2_QUESTIONS = assertQuestionArray(impl2Questions, 'impl2');
export const TEST2_QUESTIONS = assertQuestionArray(test2Questions, 'test2');
export const REVIEW_QUESTIONS = assertQuestionArray(reviewQuestions, 'review');
export const EMERGENCY_QUESTIONS = assertQuestionArray(emergencyQuestions, 'emergency');

export const QUESTIONS: QuestionsByCategory = {
  planning: PLANNING_QUESTIONS,
  impl1: IMPL1_QUESTIONS,
  test1: TEST1_QUESTIONS,
  refinement: REFINEMENT_QUESTIONS,
  impl2: IMPL2_QUESTIONS,
  test2: TEST2_QUESTIONS,
  review: REVIEW_QUESTIONS,
  emergency: EMERGENCY_QUESTIONS,
};
