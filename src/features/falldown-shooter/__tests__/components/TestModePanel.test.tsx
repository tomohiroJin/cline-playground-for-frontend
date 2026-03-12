// テストモードパネルのコンポーネントテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestModePanel } from '../../components/TestModePanel';

// デフォルトのモックprops
const createDefaultProps = () => ({
  // グリッド操作
  onFillRows: jest.fn(),
  onClearGrid: jest.fn(),
  playerX: 6,
  // エフェクト操作
  onBombShake: jest.fn(),
  onBlastShake: jest.fn(),
  onLineShake: jest.fn(),
  onGameOverShake: jest.fn(),
  onHighScoreEffect: jest.fn(),
  // スコア・ステージ操作
  onAddScore: jest.fn(),
  onSkillMax: jest.fn(),
  onNextStage: jest.fn(),
  // 状態表示
  comboCount: 3,
  comboMultiplier: 2.0,
  skillCharge: 45,
  score: 1250,
  stage: 2,
});

describe('TestModePanel', () => {
  describe('パネル表示', () => {
    it('デバッグパネルが表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText('Debug Panel')).toBeInTheDocument();
    });

    it('折りたたみボタンでパネルの内容を非表示にできる', () => {
      render(<TestModePanel {...createDefaultProps()} />);

      // 初期状態では展開されている
      expect(screen.getByText('1行セット')).toBeInTheDocument();

      // 折りたたみ
      fireEvent.click(screen.getByLabelText('デバッグパネルを折りたたむ'));

      // コンテンツが非表示
      expect(screen.queryByText('1行セット')).not.toBeInTheDocument();
    });

    it('折りたたみ後に再展開できる', () => {
      render(<TestModePanel {...createDefaultProps()} />);

      // 折りたたむ
      fireEvent.click(screen.getByLabelText('デバッグパネルを折りたたむ'));
      expect(screen.queryByText('1行セット')).not.toBeInTheDocument();

      // 再展開
      fireEvent.click(screen.getByLabelText('デバッグパネルを展開する'));
      expect(screen.getByText('1行セット')).toBeInTheDocument();
    });
  });

  describe('グリッド操作', () => {
    it('「1行セット」〜「4行セット」ボタンが表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText('1行セット')).toBeInTheDocument();
      expect(screen.getByText('2行セット')).toBeInTheDocument();
      expect(screen.getByText('3行セット')).toBeInTheDocument();
      expect(screen.getByText('4行セット')).toBeInTheDocument();
    });

    it('「1行セット」ボタンクリックで onFillRows(1) が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('1行セット'));
      expect(props.onFillRows).toHaveBeenCalledWith(1);
    });

    it('「3行セット」ボタンクリックで onFillRows(3) が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('3行セット'));
      expect(props.onFillRows).toHaveBeenCalledWith(3);
    });

    it('「グリッドクリア」ボタンクリックで onClearGrid が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('グリッドクリア'));
      expect(props.onClearGrid).toHaveBeenCalled();
    });
  });

  describe('エフェクト操作', () => {
    it('各シェイクボタンが表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText('Bomb')).toBeInTheDocument();
      expect(screen.getByText('Blast')).toBeInTheDocument();
      expect(screen.getByText('Line')).toBeInTheDocument();
      expect(screen.getByText('G.Over')).toBeInTheDocument();
      expect(screen.getByText('Hi-Score')).toBeInTheDocument();
    });

    it('Bombボタンクリックで onBombShake が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('Bomb'));
      expect(props.onBombShake).toHaveBeenCalled();
    });

    it('Hi-Scoreボタンクリックで onHighScoreEffect が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('Hi-Score'));
      expect(props.onHighScoreEffect).toHaveBeenCalled();
    });
  });

  describe('スコア・ステージ操作', () => {
    it('操作ボタンが表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText('+1000')).toBeInTheDocument();
      expect(screen.getByText('Skill MAX')).toBeInTheDocument();
      expect(screen.getByText('Next Stage')).toBeInTheDocument();
    });

    it('+1000ボタンクリックで onAddScore が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('+1000'));
      expect(props.onAddScore).toHaveBeenCalled();
    });

    it('Skill MAXボタンクリックで onSkillMax が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('Skill MAX'));
      expect(props.onSkillMax).toHaveBeenCalled();
    });

    it('Next Stageボタンクリックで onNextStage が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TestModePanel {...props} />);
      fireEvent.click(screen.getByText('Next Stage'));
      expect(props.onNextStage).toHaveBeenCalled();
    });
  });

  describe('状態表示', () => {
    it('コンボ数と倍率が表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText(/Combo: 3/)).toBeInTheDocument();
      expect(screen.getByText(/x2\.0/)).toBeInTheDocument();
    });

    it('スキルゲージの値が表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText(/Skill: 45%/)).toBeInTheDocument();
    });

    it('スコアとステージが表示される', () => {
      render(<TestModePanel {...createDefaultProps()} />);
      expect(screen.getByText(/Score: 1250/)).toBeInTheDocument();
      expect(screen.getByText(/Stage: 2/)).toBeInTheDocument();
    });
  });
});
