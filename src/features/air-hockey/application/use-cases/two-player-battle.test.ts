/**
 * 2P 対戦ユースケースのテスト
 */
import { TwoPlayerBattleUseCase } from './two-player-battle';
import type { Character } from '../../core/types';
import { FIELDS } from '../../core/config';

describe('TwoPlayerBattleUseCase', () => {
  const mockCharacter = (id: string, name: string): Character => ({
    id,
    name,
    icon: '',
    color: '#000',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  });

  const defaultConfig = {
    field: FIELDS[0],
    winScore: 3,
    player1Character: mockCharacter('player', 'アキラ'),
    player2Character: mockCharacter('hiro', 'ヒロ'),
  };

  it('対戦を初期化するとスコアが 0-0 になる', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start(defaultConfig);

    const result = useCase.getState();
    expect(result.scores.player1).toBe(0);
    expect(result.scores.player2).toBe(0);
  });

  it('player1 にスコアを加算できる', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start(defaultConfig);
    useCase.addScore('player1');

    const result = useCase.getState();
    expect(result.scores.player1).toBe(1);
    expect(result.scores.player2).toBe(0);
  });

  it('player2 にスコアを加算できる', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start(defaultConfig);
    useCase.addScore('player2');

    const result = useCase.getState();
    expect(result.scores.player1).toBe(0);
    expect(result.scores.player2).toBe(1);
  });

  it('勝利スコアに到達した側が勝者になる', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start({ ...defaultConfig, winScore: 2 });

    useCase.addScore('player1');
    expect(useCase.getWinner()).toBeUndefined();

    useCase.addScore('player1');
    expect(useCase.getWinner()).toBe('player1');
  });

  it('player2 が勝利スコアに到達した場合', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start({ ...defaultConfig, winScore: 1 });

    useCase.addScore('player2');
    expect(useCase.getWinner()).toBe('player2');
  });

  it('対戦結果にキャラクター情報が含まれる', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start(defaultConfig);

    const state = useCase.getState();
    expect(state.player1Character.id).toBe('player');
    expect(state.player2Character.id).toBe('hiro');
  });

  it('2P 対戦では実績判定が無効である', () => {
    const useCase = new TwoPlayerBattleUseCase();
    useCase.start(defaultConfig);

    expect(useCase.isAchievementsEnabled()).toBe(false);
  });
});
