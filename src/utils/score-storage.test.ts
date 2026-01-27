import { saveScore, getHighScore, getScores, clearScores, ScoreRecord } from './score-storage';

describe('score-storage', () => {
  const TEST_GAME_ID = 'test-game';

  beforeEach(() => {
    localStorage.clear();
  });

  test('スコアが保存され、取得できること', async () => {
    await saveScore(TEST_GAME_ID, 100);
    const scores = await getScores(TEST_GAME_ID);
    expect(scores).toHaveLength(1);
    expect(scores[0].score).toBe(100);
  });

  test('ハイスコアが正しく取得できること', async () => {
    await saveScore(TEST_GAME_ID, 100);
    await saveScore(TEST_GAME_ID, 200);
    await saveScore(TEST_GAME_ID, 50);

    const highScore = await getHighScore(TEST_GAME_ID);
    expect(highScore).toBe(200);
  });

  test('スコアがない場合のハイスコアは0であること', async () => {
    const highScore = await getHighScore(TEST_GAME_ID);
    expect(highScore).toBe(0);
  });

  test('難易度別にスコアが保存されること', async () => {
    await saveScore(TEST_GAME_ID, 100, 'easy');
    await saveScore(TEST_GAME_ID, 200, 'hard');

    expect(await getHighScore(TEST_GAME_ID, 'easy')).toBe(100);
    expect(await getHighScore(TEST_GAME_ID, 'hard')).toBe(200);
  });

  test('スコア履歴が降順で取得できること', async () => {
    await saveScore(TEST_GAME_ID, 100);
    await saveScore(TEST_GAME_ID, 300);
    await saveScore(TEST_GAME_ID, 200);

    const scores = await getScores(TEST_GAME_ID);
    expect(scores[0].score).toBe(300);
    expect(scores[1].score).toBe(200);
    expect(scores[2].score).toBe(100);
  });

  test('制限件数付きでスコア履歴を取得できること', async () => {
    for (let i = 1; i <= 10; i++) {
      await saveScore(TEST_GAME_ID, i * 100);
    }
    const scores = await getScores(TEST_GAME_ID, 5);
    expect(scores).toHaveLength(5);
    expect(scores[0].score).toBe(1000); // Highest score first
  });

  test('スコアをクリアできること', async () => {
    await saveScore(TEST_GAME_ID, 100);
    await clearScores(TEST_GAME_ID);
    const scores = await getScores(TEST_GAME_ID);
    expect(scores).toHaveLength(0);
  });
});
