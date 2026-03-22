/**
 * ResultScreen テスト
 * P2-05: リザルト画面改修 — キャラ表情差分・アンロック通知
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ResultScreen } from './ResultScreen';
import type { Character } from '../core/types';

// Canvas getContext の元の実装を保持
const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  jest.useFakeTimers();
  let frameId = 0;
  // requestAnimationFrame のモック（カウントアップアニメーション制御用）
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    frameId += 1;
    setTimeout(() => cb(Date.now()), 16);
    return frameId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  // カウントアップを即座に完了させるのに十分な大きさの値
  jest.spyOn(Date, 'now').mockReturnValue(999999);
  // Canvas のモック（ConfettiOverlay 対策）
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    save: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    fillRect: jest.fn(),
    restore: jest.fn(),
    fillStyle: '',
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

// テスト用キャラクター定義
const playerCharacter: Character = {
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/akira.png',
  color: '#3498db',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  portrait: {
    normal: '/assets/portraits/akira-normal.png',
    happy: '/assets/portraits/akira-happy.png',
  },
};

const cpuCharacter: Character = {
  id: 'hiro',
  name: 'ヒロ',
  icon: '/assets/characters/hiro.png',
  color: '#e67e22',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  portrait: {
    normal: '/assets/portraits/hiro-normal.png',
    happy: '/assets/portraits/hiro-happy.png',
  },
};

const cpuCharacterNoPortrait: Character = {
  id: 'rookie',
  name: 'ルーキー',
  icon: '/assets/characters/rookie.png',
  color: '#27ae60',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

const defaultProps = {
  winner: 'player' as string | null,
  scores: { p: 3, c: 1 },
  onBackToMenu: jest.fn(),
};

describe('ResultScreen', () => {
  describe('キャラ表情差分', () => {
    it('勝利時にプレイヤー happy + 対戦キャラ normal が表示される', () => {
      render(
        <ResultScreen
          {...defaultProps}
          winner="player"
          playerCharacter={playerCharacter}
          cpuCharacter={cpuCharacter}
        />,
      );

      // プレイヤー立ち絵: happy 表情
      const playerImg = screen.getByAltText('アキラ');
      expect(playerImg).toHaveAttribute('src', '/assets/portraits/akira-happy.png');

      // 対戦キャラ立ち絵: normal 表情
      const cpuImg = screen.getByAltText('ヒロ');
      expect(cpuImg).toHaveAttribute('src', '/assets/portraits/hiro-normal.png');
    });

    it('敗北時にプレイヤー normal + 対戦キャラ happy が表示される', () => {
      render(
        <ResultScreen
          {...defaultProps}
          winner="cpu"
          playerCharacter={playerCharacter}
          cpuCharacter={cpuCharacter}
        />,
      );

      // プレイヤー立ち絵: normal 表情
      const playerImg = screen.getByAltText('アキラ');
      expect(playerImg).toHaveAttribute('src', '/assets/portraits/akira-normal.png');

      // 対戦キャラ立ち絵: happy 表情
      const cpuImg = screen.getByAltText('ヒロ');
      expect(cpuImg).toHaveAttribute('src', '/assets/portraits/hiro-happy.png');
    });

    it('キャラ情報なし時に立ち絵が表示されない（後方互換性）', () => {
      render(<ResultScreen {...defaultProps} />);

      // 立ち絵画像が存在しない
      expect(screen.queryByAltText('アキラ')).not.toBeInTheDocument();
      expect(screen.queryByAltText('ヒロ')).not.toBeInTheDocument();
    });

    it('portrait 未定義のキャラは立ち絵を表示しない', () => {
      render(
        <ResultScreen
          {...defaultProps}
          playerCharacter={playerCharacter}
          cpuCharacter={cpuCharacterNoPortrait}
        />,
      );

      // プレイヤーの立ち絵は表示される
      expect(screen.getByAltText('アキラ')).toBeInTheDocument();
      // portrait 未定義のキャラは表示されない
      expect(screen.queryByAltText('ルーキー')).not.toBeInTheDocument();
    });
  });

  describe('アンロック通知', () => {
    it('アンロック通知が表示される', () => {
      render(
        <ResultScreen
          {...defaultProps}
          newlyUnlockedCharacterName="ヒロ"
        />,
      );

      const banner = screen.getByText(/ヒロが図鑑に追加されました！/);
      // 500ms ディレイ前は opacity: 0（非表示状態）
      expect(banner.parentElement).toHaveStyle({ opacity: 0 });

      // 500ms ディレイ後にフェードイン
      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(banner.parentElement).toHaveStyle({ opacity: 1 });
    });

    it('アンロック通知なし時にバナーが表示されない', () => {
      render(<ResultScreen {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText(/図鑑に追加されました/)).not.toBeInTheDocument();
    });
  });

  describe('2P 対戦モード', () => {
    it('2P モードでキャラ名ありの場合「{キャラ名} Win!」が表示される', () => {
      render(
        <ResultScreen
          {...defaultProps}
          winner="player"
          is2PMode
          player1CharacterName="アキラ"
          player2CharacterName="ヒロ"
        />,
      );

      expect(screen.getByText('アキラ Win!')).toBeInTheDocument();
    });

    it('2P モードで player2 勝利時にキャラ名で表示される', () => {
      render(
        <ResultScreen
          {...defaultProps}
          winner="cpu"
          is2PMode
          player1CharacterName="アキラ"
          player2CharacterName="ヒロ"
        />,
      );

      expect(screen.getByText('ヒロ Win!')).toBeInTheDocument();
    });

    it('2P モードでキャラ名なしの場合「1P Win!」「2P Win!」にフォールバックする', () => {
      render(
        <ResultScreen
          {...defaultProps}
          winner="player"
          is2PMode
        />,
      );

      expect(screen.getByText('1P Win!')).toBeInTheDocument();
    });

    it('2P モードでは実績通知が表示されない', () => {
      render(
        <ResultScreen
          {...defaultProps}
          is2PMode
          newAchievements={[{ id: 'first_win', name: '初勝利', description: '初めて勝利', icon: '🏆' }]}
        />,
      );

      expect(screen.queryByText('初勝利')).not.toBeInTheDocument();
    });

    it('2P モードで「キャラ選択に戻る」ボタンが表示される', () => {
      const onBackToCharacterSelect = jest.fn();
      render(
        <ResultScreen
          {...defaultProps}
          is2PMode
          onBackToCharacterSelect={onBackToCharacterSelect}
        />,
      );

      expect(screen.getByText('キャラ選択に戻る')).toBeInTheDocument();
    });
  });
});
