/**
 * 原始進化録 - PRIMAL PATH - 遊び方画面コンポーネントテスト（Phase 7-6 + P4）
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HowToPlayScreen } from '../components/HowToPlayScreen';
import { SYNERGY_BONUSES } from '../constants';
import type { SfxType } from '../types';
import type { GameAction } from '../hooks';

/* ===== テスト ===== */

describe('HowToPlayScreen', () => {
  const mockDispatch = jest.fn<void, [GameAction]>();
  const mockPlaySfx = jest.fn<void, [SfxType]>();

  beforeEach(() => {
    mockDispatch.mockClear();
    mockPlaySfx.mockClear();
  });

  describe('タブ切替（P4: FB#10）', () => {
    it('3つのタブが表示される（基本ルール/進化図鑑/シナジー）', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText('基本ルール')).toBeInTheDocument();
      expect(screen.getByText('進化図鑑')).toBeInTheDocument();
      expect(screen.getByText('シナジー')).toBeInTheDocument();
    });

    it('初期状態では基本ルールタブがアクティブ', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      // 基本ルールの内容が表示されている
      expect(screen.getByText(/3バイオーム踏破/)).toBeInTheDocument();
    });

    it('進化図鑑タブをクリックすると進化一覧が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      // EVOS の最初の進化名が表示される
      expect(screen.getByText('火おこし')).toBeInTheDocument();
    });

    it('シナジータブをクリックするとシナジー一覧が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('シナジー'));
      // SYNERGY_BONUSES の最初のシナジー名が表示される
      expect(screen.getByText('灼熱の魂')).toBeInTheDocument();
    });

    it('タブ切替でplaySfxが呼ばれる', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      expect(mockPlaySfx).toHaveBeenCalledWith('click');
    });
  });

  describe('進化図鑑タブ（P4: FB#10）', () => {
    it('全進化カードが表示される（フィルタ「全て」）', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      // EVOS 全件の名前が表示されるか確認（代表的なものをチェック）
      expect(screen.getByText('火おこし')).toBeInTheDocument();
      expect(screen.getByText('薬草知識')).toBeInTheDocument();
      expect(screen.getByText('血の誓い')).toBeInTheDocument();
    });

    it('フィルタボタンが4つ表示される（全て/技術/生活/儀式）', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      expect(screen.getByRole('button', { name: '全て' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '技術' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '生活' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '儀式' })).toBeInTheDocument();
    });

    it('「技術」フィルタで技術系のみ表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      // フィルタボタンはbutton要素なのでroleで取得
      fireEvent.click(screen.getByRole('button', { name: '技術' }));
      // 技術の進化は表示される
      expect(screen.getByText('火おこし')).toBeInTheDocument();
      // 生活・儀式の進化は表示されない
      expect(screen.queryByText('薬草知識')).not.toBeInTheDocument();
      expect(screen.queryByText('血の誓い')).not.toBeInTheDocument();
    });

    it('「生活」フィルタで生活系のみ表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      fireEvent.click(screen.getByRole('button', { name: '生活' }));
      expect(screen.getByText('薬草知識')).toBeInTheDocument();
      expect(screen.queryByText('火おこし')).not.toBeInTheDocument();
    });

    it('「儀式」フィルタで儀式系のみ表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      fireEvent.click(screen.getByRole('button', { name: '儀式' }));
      expect(screen.getByText('血の誓い')).toBeInTheDocument();
      expect(screen.queryByText('火おこし')).not.toBeInTheDocument();
    });

    it('各進化カードに説明とタグが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('進化図鑑'));
      // 火おこしの説明
      expect(screen.getByText('ATK+3')).toBeInTheDocument();
      // 火おこしのタグ（🔥火）
      expect(screen.getAllByText(/🔥/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('シナジータブ（P4: FB#10）', () => {
    it('全シナジーボーナスが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('シナジー'));
      // 各シナジーのTier1名が表示される
      for (const sb of SYNERGY_BONUSES) {
        expect(screen.getByText(sb.tier1.name)).toBeInTheDocument();
      }
    });

    it('Tier1とTier2の効果が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('シナジー'));
      // Tier1 の説明
      expect(screen.getByText(/火傷ダメージ\+30%/)).toBeInTheDocument();
      // Tier2 の名前
      expect(screen.getByText('業火の化身')).toBeInTheDocument();
    });

    it('シナジータグのアイコンが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText('シナジー'));
      // 各タグのアイコンが表示されているか
      expect(screen.getAllByText(/🔥/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/🧊/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('既存セクション（基本ルールタブ内）', () => {
    it('基本ルールの内容が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      // タブラベル「基本ルール」とコンテンツ内の「🌍 基本ルール」の2つがある
      expect(screen.getAllByText(/基本ルール/).length).toBeGreaterThanOrEqual(2);
    });

    it('三大文明セクションが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/三大文明/)).toBeInTheDocument();
    });

    it('アクティブスキルセクションが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/アクティブスキル/)).toBeInTheDocument();
    });
  });

  describe('シナジーセクション（基本ルールタブ内）', () => {
    it('シナジーシステムの見出しが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/シナジーシステム/)).toBeInTheDocument();
    });

    it('タグ2個でボーナス発動の説明がある', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/Tier1ボーナス/)).toBeInTheDocument();
    });
  });

  describe('ランダムイベントセクション（基本ルールタブ内）', () => {
    it('ランダムイベントの説明が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getAllByText(/ランダムイベント/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('実績・チャレンジセクション（基本ルールタブ内）', () => {
    it('実績・チャレンジの見出しが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/実績・チャレンジ/)).toBeInTheDocument();
    });

    it('チャレンジの種類説明が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/タイムアタック/)).toBeInTheDocument();
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンクリックで dispatch と playSfx が呼ばれる', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText(/もどる/));
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RETURN_TO_TITLE' });
      expect(mockPlaySfx).toHaveBeenCalledWith('click');
    });
  });
});
