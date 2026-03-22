import { createLocalStorageScoreRepository } from '../../../infrastructure/storage/local-storage-score-repository';
import { ScoreRepository } from '../../../infrastructure/storage/score-repository';
import * as scoreStorage from '../../../../../utils/score-storage';

// score-storage モジュールをモック化
jest.mock('../../../../../utils/score-storage');

const mockedScoreStorage = scoreStorage as jest.Mocked<typeof scoreStorage>;

describe('createLocalStorageScoreRepository', () => {
  let repository: ScoreRepository;

  beforeEach(() => {
    repository = createLocalStorageScoreRepository();
    jest.clearAllMocks();
  });

  describe('getHighScore', () => {
    it('指定キーのハイスコアを取得できる', async () => {
      // Arrange
      mockedScoreStorage.getHighScore.mockResolvedValue(1500);

      // Act
      const score = await repository.getHighScore('nbd');

      // Assert
      expect(score).toBe(1500);
      expect(mockedScoreStorage.getHighScore).toHaveBeenCalledWith('nbd');
    });

    it('スコアが存在しない場合は 0 を返す', async () => {
      // Arrange
      mockedScoreStorage.getHighScore.mockResolvedValue(0);

      // Act
      const score = await repository.getHighScore('unknown-game');

      // Assert
      expect(score).toBe(0);
    });
  });

  describe('saveScore', () => {
    it('指定キーにスコアを保存できる', async () => {
      // Arrange
      mockedScoreStorage.saveScore.mockResolvedValue(undefined);

      // Act
      await repository.saveScore('nbd', 2000);

      // Assert
      expect(mockedScoreStorage.saveScore).toHaveBeenCalledWith('nbd', 2000);
    });

    it('保存時にエラーが発生した場合は例外を伝播する', async () => {
      // Arrange
      mockedScoreStorage.saveScore.mockRejectedValue(
        new Error('Storage full')
      );

      // Act & Assert
      await expect(repository.saveScore('nbd', 9999)).rejects.toThrow(
        'Storage full'
      );
    });
  });
});
