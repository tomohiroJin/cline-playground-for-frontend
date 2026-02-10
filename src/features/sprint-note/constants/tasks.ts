import { Task } from '../types';

// スプリント別タスクプール
export const SPRINT_TASKS: Record<number, Task[]> = {
  1: [
    {
      id: 's1_t1',
      name: 'ユーザー登録機能',
      description: '基本的なユーザー登録・ログイン機能を実装する。',
      category: 'feature',
      effects: { productProgress: 15, qualityScore: -5, teamTrust: 0 },
    },
    {
      id: 's1_t2',
      name: 'データベース設計',
      description: 'プロダクト全体のデータ構造を設計・構築する。',
      category: 'infra',
      effects: { productProgress: 5, qualityScore: 10, teamTrust: 0 },
    },
    {
      id: 's1_t3',
      name: 'UI プロトタイプ',
      description: '主要画面のプロトタイプを作成し、操作感を確認する。',
      category: 'design',
      effects: { productProgress: 10, qualityScore: 0, teamTrust: 5 },
    },
  ],
  2: [
    {
      id: 's2_t1',
      name: 'タスク一覧画面',
      description: 'タスクの表示・並べ替え・フィルタリング機能を実装する。',
      category: 'feature',
      effects: { productProgress: 15, qualityScore: -5, teamTrust: 0 },
    },
    {
      id: 's2_t2',
      name: 'API 設計とテスト整備',
      description: 'API の設計を整理し、自動テストの基盤を構築する。',
      category: 'quality',
      effects: { productProgress: 0, qualityScore: 15, teamTrust: 0 },
    },
    {
      id: 's2_t3',
      name: 'タスク作成機能',
      description: '新規タスクの作成・編集・削除機能を実装する。',
      category: 'feature',
      effects: { productProgress: 15, qualityScore: -5, teamTrust: 3 },
    },
  ],
  3: [
    {
      id: 's3_t1',
      name: '通知機能',
      description: 'タスクの期限通知・アサイン通知を実装する。',
      category: 'feature',
      effects: { productProgress: 15, qualityScore: -5, teamTrust: 3 },
    },
    {
      id: 's3_t2',
      name: 'パフォーマンス改善',
      description: '画面表示速度と API 応答速度を改善する。',
      category: 'quality',
      effects: { productProgress: 0, qualityScore: 15, teamTrust: 5 },
    },
    {
      id: 's3_t3',
      name: 'ダッシュボード画面',
      description: 'プロジェクト全体の進捗を俯瞰できる画面を実装する。',
      category: 'feature',
      effects: { productProgress: 10, qualityScore: 0, teamTrust: 5 },
    },
  ],
};

// 指定スプリントのタスク組み合わせ（3C2 = 3 通り）を取得する
export const getTaskCombinations = (sprint: number): [Task, Task][] => {
  const tasks = SPRINT_TASKS[sprint];
  if (!tasks || tasks.length < 3) return [];
  return [
    [tasks[0], tasks[1]],
    [tasks[0], tasks[2]],
    [tasks[1], tasks[2]],
  ];
};
