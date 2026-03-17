/**
 * Agile Quiz Sugoroku - ゲーム結果リポジトリテスト
 */
import { SavedGameResult } from '../domain/types';
import { GameResultRepository } from '../infrastructure/storage/game-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';

describe('GameResultRepository', () => {
  let repository: GameResultRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new GameResultRepository(new LocalStorageAdapter());
  });

  const mockResult: SavedGameResult = {
    totalCorrect: 15,
    totalQuestions: 21,
    correctRate: 71,
    averageSpeed: 6.5,
    stability: 75,
    debt: 10,
    maxCombo: 4,
    tagStats: {
      scrum: { correct: 5, total: 7 },
      testing: { correct: 3, total: 5 },
    },
    incorrectQuestions: [
      {
        questionText: 'テスト問題',
        options: ['A', 'B', 'C', 'D'],
        selectedAnswer: 1,
        correctAnswer: 0,
        tags: ['scrum'],
        explanation: 'テスト解説',
      },
    ],
    sprintLog: [],
    grade: 'A',
    gradeLabel: 'High-Performing',
    teamTypeId: 'synergy',
    teamTypeName: 'シナジーチーム',
    timestamp: Date.now(),
  };

  describe('save', () => {
    it('ゲーム結果をlocalStorageに保存する', () => {
      repository.save(mockResult);
      const stored = localStorage.getItem('aqs_last_result');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.totalCorrect).toBe(15);
      expect(parsed.grade).toBe('A');
    });
  });

  describe('load', () => {
    it('保存されたゲーム結果を読み込む', () => {
      repository.save(mockResult);
      const result = repository.load();
      expect(result).toBeDefined();
      expect(result!.totalCorrect).toBe(15);
      expect(result!.correctRate).toBe(71);
      expect(result!.teamTypeName).toBe('シナジーチーム');
    });

    it('保存データがない場合はundefinedを返す', () => {
      expect(repository.load()).toBeUndefined();
    });

    it('不正なデータの場合はundefinedを返す', () => {
      localStorage.setItem('aqs_last_result', 'invalid json');
      expect(repository.load()).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('ゲーム結果を削除する', () => {
      repository.save(mockResult);
      expect(repository.load()).toBeDefined();
      repository.clear();
      expect(repository.load()).toBeUndefined();
    });
  });

  // ── 後方互換性テスト ──────────────────────────────

  describe('後方互換性: 旧エンジニアタイプデータの移行', () => {
    it('engineerTypeIdをteamTypeIdに変換する', () => {
      const oldData = {
        ...mockResult,
        engineerTypeId: 'stable',
        engineerTypeName: '安定運用型エンジニア',
        teamTypeId: undefined,
        teamTypeName: undefined,
      };
      // teamTypeId を削除して旧フォーマットにする
      const { teamTypeId: _tid, teamTypeName: _tn, ...rest } = oldData;
      localStorage.setItem('aqs_last_result', JSON.stringify(rest));

      const result = repository.load();
      expect(result).toBeDefined();
      expect(result!.teamTypeId).toBe('synergy');
      expect(result!.teamTypeName).toBe('シナジーチーム');
    });

    it('全エンジニアタイプの移行マッピング', () => {
      const mappings = [
        { oldId: 'stable', oldName: '安定運用型エンジニア', newId: 'synergy', newName: 'シナジーチーム' },
        { oldId: 'firefighter', oldName: '火消し職人エンジニア', newId: 'resilient', newName: 'レジリエントチーム' },
        { oldId: 'growth', oldName: '成長曲線型エンジニア', newId: 'evolving', newName: '成長するチーム' },
        { oldId: 'speed', oldName: '高速レスポンスエンジニア', newId: 'agile', newName: 'アジャイルチーム' },
        { oldId: 'debt', oldName: '技術的負債と共に生きる人', newId: 'struggling', newName: 'もがくチーム' },
        { oldId: 'default', oldName: '無難に回すエンジニア', newId: 'forming', newName: '結成したてのチーム' },
      ];

      mappings.forEach(({ oldId, oldName, newId, newName }) => {
        const oldData = {
          totalCorrect: 10, totalQuestions: 20, correctRate: 50,
          averageSpeed: 7, stability: 50, debt: 20, maxCombo: 3,
          tagStats: {}, incorrectQuestions: [], sprintLog: [],
          grade: 'C', gradeLabel: 'Developing',
          engineerTypeId: oldId, engineerTypeName: oldName,
          timestamp: Date.now(),
        };
        localStorage.setItem('aqs_last_result', JSON.stringify(oldData));
        const result = repository.load();
        expect(result!.teamTypeId).toBe(newId);
        expect(result!.teamTypeName).toBe(newName);
      });
    });

    it('不明な旧タイプIDはformingにフォールバック', () => {
      const oldData = {
        totalCorrect: 10, totalQuestions: 20, correctRate: 50,
        averageSpeed: 7, stability: 50, debt: 20, maxCombo: 3,
        tagStats: {}, incorrectQuestions: [], sprintLog: [],
        grade: 'C', gradeLabel: 'Average',
        engineerTypeId: 'unknown_type', engineerTypeName: '不明なタイプ',
        timestamp: Date.now(),
      };
      localStorage.setItem('aqs_last_result', JSON.stringify(oldData));
      const result = repository.load();
      expect(result!.teamTypeId).toBe('forming');
      expect(result!.teamTypeName).toBe('結成したてのチーム');
    });

    it('新フォーマットのデータはそのまま読み込む', () => {
      repository.save(mockResult);
      const result = repository.load();
      expect(result!.teamTypeId).toBe('synergy');
      expect(result!.teamTypeName).toBe('シナジーチーム');
    });
  });
});
