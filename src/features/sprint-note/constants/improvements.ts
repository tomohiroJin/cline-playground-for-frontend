import { Improvement, GameState } from '../types';

// 6 種の改善アクション定義
export const IMPROVEMENTS: Record<string, Improvement> = {
  improve_process: {
    id: 'improve_process',
    name: '開発プロセスの見直し',
    description: '作業の進め方を振り返り、無駄を減らす。',
    duration: 1,
  },
  improve_quality: {
    id: 'improve_quality',
    name: '品質チェック強化',
    description: 'テスト観点を増やし、レビューを丁寧にする。',
    duration: 1,
  },
  improve_communication: {
    id: 'improve_communication',
    name: 'コミュニケーション改善',
    description: 'チーム内の情報共有を密にする。',
    duration: 1,
  },
  stakeholder_report: {
    id: 'stakeholder_report',
    name: 'ステークホルダー報告会',
    description: '進捗と課題を丁寧に報告する。',
    duration: 1,
  },
  tech_study: {
    id: 'tech_study',
    name: '技術勉強会',
    description: '新しい技術や手法を学ぶ時間を取る。',
    duration: 1,
  },
  rest_and_recover: {
    id: 'rest_and_recover',
    name: '休息の確保',
    description: 'チームにしっかり休む時間を設ける。',
    duration: 1,
  },
};

// 改善アクション候補を選出する
export const getImprovementCandidates = (
  sprint: number,
  state: GameState
): [Improvement, Improvement] | undefined => {
  if (sprint === 1) {
    // Sprint 1: 候補 A は固定、候補 B は品質スコアで分岐
    const candidateA = IMPROVEMENTS.improve_process;
    const candidateB =
      state.qualityScore < 50
        ? IMPROVEMENTS.improve_quality
        : IMPROVEMENTS.improve_communication;
    return [candidateA, candidateB];
  }
  if (sprint === 2) {
    // Sprint 2: 候補 A は信頼度で分岐、候補 B は品質スコアで分岐
    const candidateA =
      state.teamTrust < 40
        ? IMPROVEMENTS.stakeholder_report
        : IMPROVEMENTS.tech_study;
    const candidateB =
      state.qualityScore < 50
        ? IMPROVEMENTS.improve_quality
        : IMPROVEMENTS.rest_and_recover;
    return [candidateA, candidateB];
  }
  // Sprint 3 は選択式ではない
  return undefined;
};
