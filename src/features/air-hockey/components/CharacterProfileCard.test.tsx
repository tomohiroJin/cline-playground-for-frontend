/**
 * キャラクタープロフィールカードのテスト
 * P2-04: CharacterProfileCard
 *
 * テスト項目:
 *   - プロフィール情報の正しい表示
 *   - 立ち絵の表示と表情切替
 *   - portrait 未定義時のアイコンフォールバック
 *   - 閉じるボタンのコールバック
 *   - 背景タップでの閉じる動作
 *   - 性格タグの表示
 *   - Escape キーでの閉じる動作
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterProfileCard, FADE_OUT_DURATION_MS } from './CharacterProfileCard';
import type { Character, DexEntry } from '../core/types';

// テスト用の図鑑エントリ（立ち絵あり）
const createDexEntry = (overrides?: Partial<DexEntry['profile']>): DexEntry => ({
  profile: {
    characterId: 'player',
    fullName: '蒼葉 アキラ',
    reading: 'あおば あきら',
    grade: '1年生',
    age: 15,
    birthday: '4月8日',
    height: '165cm',
    school: '蒼風館高校',
    club: 'エアホッケー部',
    personality: ['素直', '負けず嫌い', '行動派'],
    quote: 'エアホッケーって、こんなに熱くなれるんだ',
    playStyle: 'オールラウンダー',
    specialMove: 'ライジングショット',
    specialMoveDesc: '相手の意表を突く速射',
    description: '入学式の帰り道、エアホッケー部の練習を見てその場で入部を決意した1年生。',
    ...overrides,
  },
  unlockCondition: { type: 'default' },
});

// テスト用キャラクター（立ち絵あり）
const createCharacterWithPortrait = (): Character => ({
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/player.png',
  color: '#3498db',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  portrait: {
    normal: '/assets/portraits/akira-normal.png',
    happy: '/assets/portraits/akira-happy.png',
  },
});

// テスト用キャラクター（立ち絵なし）
const createCharacterWithoutPortrait = (): Character => ({
  id: 'rookie',
  name: 'ソウタ',
  icon: '/assets/characters/rookie.png',
  color: '#2ecc71',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
});

describe('CharacterProfileCard', () => {
  const defaultProps = {
    entry: createDexEntry(),
    character: createCharacterWithPortrait(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('プロフィール情報の表示', () => {
    it('キャラ名と読みが表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      expect(screen.getByText('蒼葉 アキラ')).toBeInTheDocument();
      expect(screen.getByText('あおば あきら')).toBeInTheDocument();
    });

    it('基本情報（学年・年齢・身長・誕生日・所属）が表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      // 「1年生 | 15歳 | 165cm」の行を確認
      expect(screen.getByText(/1年生 \| 15歳 \| 165cm/)).toBeInTheDocument();
      // 「4月8日生 | 蒼風館高校」の行を確認
      expect(screen.getByText(/4月8日生 \| 蒼風館高校/)).toBeInTheDocument();
    });

    it('代表セリフが表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      expect(
        screen.getByText('エアホッケーって、こんなに熱くなれるんだ')
      ).toBeInTheDocument();
    });

    it('プレイスタイルと得意技が表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      expect(screen.getByText('オールラウンダー')).toBeInTheDocument();
      expect(screen.getByText(/ライジングショット/)).toBeInTheDocument();
      expect(screen.getByText('相手の意表を突く速射')).toBeInTheDocument();
    });

    it('キャラクター紹介文が表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      expect(
        screen.getByText(/入学式の帰り道、エアホッケー部の練習を見て/)
      ).toBeInTheDocument();
    });
  });

  describe('性格タグ', () => {
    it('性格キーワードがタグとして表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      expect(screen.getByText('素直')).toBeInTheDocument();
      expect(screen.getByText('負けず嫌い')).toBeInTheDocument();
      expect(screen.getByText('行動派')).toBeInTheDocument();
    });
  });

  describe('立ち絵表示', () => {
    it('立ち絵が正しく表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      const portrait = screen.getByAltText('蒼葉 アキラ');
      expect(portrait).toHaveAttribute(
        'src',
        '/assets/portraits/akira-normal.png'
      );
    });

    it('立ち絵タップで表情が切り替わる', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      const portrait = screen.getByAltText('蒼葉 アキラ');
      expect(portrait).toHaveAttribute(
        'src',
        '/assets/portraits/akira-normal.png'
      );

      // タップで happy に切替
      fireEvent.click(portrait);
      expect(portrait).toHaveAttribute(
        'src',
        '/assets/portraits/akira-happy.png'
      );

      // 再タップで normal に戻る
      fireEvent.click(portrait);
      expect(portrait).toHaveAttribute(
        'src',
        '/assets/portraits/akira-normal.png'
      );
    });

    it('表情切替ヒントが表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      expect(screen.getByText('タップで表情変更')).toBeInTheDocument();
    });
  });

  describe('portrait 未定義時のフォールバック', () => {
    it('portrait 未定義時にアイコンが表示される', () => {
      render(
        <CharacterProfileCard
          {...defaultProps}
          character={createCharacterWithoutPortrait()}
          entry={createDexEntry({ characterId: 'rookie', fullName: '春日 ソウタ' })}
        />
      );

      const icon = screen.getByAltText('春日 ソウタ');
      expect(icon).toHaveAttribute('src', '/assets/characters/rookie.png');
    });

    it('portrait 未定義時に表情切替ヒントが表示されない', () => {
      render(
        <CharacterProfileCard
          {...defaultProps}
          character={createCharacterWithoutPortrait()}
          entry={createDexEntry({ characterId: 'rookie', fullName: '春日 ソウタ' })}
        />
      );

      expect(screen.queryByText('タップで表情変更')).not.toBeInTheDocument();
    });
  });

  describe('閉じる操作', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('閉じるボタンでフェードアウト後に onClose が呼ばれる', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

      // フェードアウト中は onClose が呼ばれない
      expect(defaultProps.onClose).not.toHaveBeenCalled();

      // フェードアウト完了後に onClose が呼ばれる
      jest.advanceTimersByTime(FADE_OUT_DURATION_MS + 50);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('背景オーバーレイタップでフェードアウト後に onClose が呼ばれる', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      fireEvent.click(screen.getByTestId('profile-overlay'));

      expect(defaultProps.onClose).not.toHaveBeenCalled();
      jest.advanceTimersByTime(FADE_OUT_DURATION_MS + 50);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('カード本体のクリックでは onClose が呼ばれない', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      fireEvent.click(screen.getByTestId('profile-card'));
      jest.advanceTimersByTime(FADE_OUT_DURATION_MS + 50);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('Escape キーでフェードアウト後に onClose が呼ばれる', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
      jest.advanceTimersByTime(FADE_OUT_DURATION_MS + 50);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('club フィールド表示', () => {
    it('部活名が学校名の横に表示される', () => {
      render(<CharacterProfileCard {...defaultProps} />);

      // 「蒼風館高校 エアホッケー部」がセットで表示される
      expect(screen.getByText(/蒼風館高校.*エアホッケー部/)).toBeInTheDocument();
    });
  });
});
