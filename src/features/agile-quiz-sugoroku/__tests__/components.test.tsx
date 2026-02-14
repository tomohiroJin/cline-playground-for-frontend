/**
 * Agile Quiz Sugoroku - コンポーネントテスト
 */

// tone モジュールのモック（ESM パッケージのため Jest で変換できない）
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  start: jest.fn(),
  getContext: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from '../components/TitleScreen';
import { ParticleEffect } from '../components/ParticleEffect';
import { BarChart } from '../components/BarChart';
import { RadarChart } from '../components/RadarChart';
import { QuizScreen } from '../components/QuizScreen';
import { SprintStartScreen } from '../components/SprintStartScreen';
import { RetrospectiveScreen } from '../components/RetrospectiveScreen';
import { ResultScreen } from '../components/ResultScreen';
import { SprintSummary, GameStats, DerivedStats, GameEvent, Question } from '../types';

// styled-components のアニメーション警告を抑制
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

/* ================================
   ヘルパー
   ================================ */

/** テスト用ゲーム統計 */
const mockStats: GameStats = {
  tc: 5,
  tq: 7,
  sp: [3, 4, 5, 6, 3, 4, 5],
  debt: 10,
  emC: 1,
  emS: 1,
  combo: 2,
  maxCombo: 3,
};

/** テスト用派生統計 */
const mockDerived: DerivedStats = {
  tp: 71,
  spd: 4.3,
  stab: 65,
  sc: [70, 72],
};

/** テスト用スプリントサマリー */
const mockSummary: SprintSummary = {
  sp: 1,
  pct: 71,
  cor: 5,
  tot: 7,
  spd: 4.3,
  debt: 10,
  em: false,
  emOk: 0,
  cats: {
    planning: { c: 1, t: 1 },
    impl1: { c: 1, t: 1 },
    test1: { c: 0, t: 1 },
  },
};

/** テスト用イベント */
const mockEvents: GameEvent[] = [
  { id: 'planning', nm: 'プランニング', ic: '📋', ds: '計画・合意', color: '#4d9fff' },
  { id: 'impl1', nm: '実装（1回目）', ic: '⌨️', ds: '作り始め', color: '#a78bfa' },
  { id: 'test1', nm: 'テスト（1回目）', ic: '🧪', ds: '確認', color: '#22d3ee' },
];

/** テスト用クイズ */
const mockQuiz: Question = {
  q: 'スクラムマスターの主な役割は？',
  o: ['プロジェクト管理', 'サーバント・リーダー', 'コード作成', '予算管理'],
  a: 1,
};

/* ================================
   TitleScreen
   ================================ */

describe('TitleScreen', () => {
  it('タイトルテキストが表示される', () => {
    const onStart = jest.fn();
    render(<TitleScreen onStart={onStart} />);

    expect(screen.getByText('アジャイル・クイズすごろく')).toBeInTheDocument();
    expect(screen.getByText('AGILE QUIZ SUGOROKU')).toBeInTheDocument();
  });

  it('Sprint Startボタンのクリックでコールバックが呼ばれる', () => {
    const onStart = jest.fn();
    render(<TitleScreen onStart={onStart} />);

    const button = screen.getByText(/Sprint Start/);
    fireEvent.click(button);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('機能紹介が表示される', () => {
    const onStart = jest.fn();
    render(<TitleScreen onStart={onStart} />);

    expect(screen.getByText(/3スプリント/)).toBeInTheDocument();
    expect(screen.getByText(/技術的負債/)).toBeInTheDocument();
    expect(screen.getByText(/コンボボーナス/)).toBeInTheDocument();
  });
});

/* ================================
   ParticleEffect
   ================================ */

describe('ParticleEffect', () => {
  it('指定数のパーティクルが表示される', () => {
    const { container } = render(<ParticleEffect count={5} />);

    // useEffect 内で setState が呼ばれるので、パーティクルが描画される
    const particles = container.querySelectorAll('div > div');
    // コンテナ + パーティクル5個
    expect(particles.length).toBeGreaterThanOrEqual(5);
  });

  it('countを省略するとデフォルトの18個が生成される', () => {
    const { container } = render(<ParticleEffect />);
    const particles = container.querySelectorAll('div > div');
    expect(particles.length).toBeGreaterThanOrEqual(18);
  });
});

/* ================================
   BarChart
   ================================ */

describe('BarChart', () => {
  it('スプリントラベルが表示される', () => {
    const logs: SprintSummary[] = [mockSummary];
    render(<BarChart logs={logs} />);

    expect(screen.getByText('SP1')).toBeInTheDocument();
  });

  it('正答率が表示される', () => {
    const logs: SprintSummary[] = [mockSummary];
    render(<BarChart logs={logs} />);

    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('速度が表示される', () => {
    const logs: SprintSummary[] = [mockSummary];
    render(<BarChart logs={logs} />);

    expect(screen.getByText('4.3s')).toBeInTheDocument();
  });

  it('複数スプリントを表示できる', () => {
    const logs: SprintSummary[] = [
      mockSummary,
      { ...mockSummary, sp: 2, pct: 80 },
    ];
    render(<BarChart logs={logs} />);

    expect(screen.getByText('SP1')).toBeInTheDocument();
    expect(screen.getByText('SP2')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});

/* ================================
   RadarChart
   ================================ */

describe('RadarChart', () => {
  it('SVGが描画される', () => {
    const data = [
      { label: '正答率', value: 0.7 },
      { label: '速度', value: 0.5 },
      { label: '安定度', value: 0.6 },
    ];
    const { container } = render(<RadarChart data={data} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('ラベルが表示される', () => {
    const data = [
      { label: '正答率', value: 0.7 },
      { label: '速度', value: 0.5 },
      { label: '安定度', value: 0.6 },
    ];
    render(<RadarChart data={data} />);

    expect(screen.getByText('正答率')).toBeInTheDocument();
    expect(screen.getByText('速度')).toBeInTheDocument();
    expect(screen.getByText('安定度')).toBeInTheDocument();
  });

  it('指定サイズで描画される', () => {
    const data = [
      { label: 'A', value: 0.5 },
      { label: 'B', value: 0.5 },
      { label: 'C', value: 0.5 },
    ];
    const { container } = render(<RadarChart data={data} size={300} />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('300');
    expect(svg?.getAttribute('height')).toBe('300');
  });
});

/* ================================
   QuizScreen
   ================================ */

describe('QuizScreen', () => {
  const defaultProps = {
    sprint: 0,
    eventIndex: 0,
    events: mockEvents,
    quiz: mockQuiz,
    options: [0, 1, 2, 3],
    selectedAnswer: null,
    stats: mockStats,
    timer: 10,
    visible: true,
    onAnswer: jest.fn(),
    onNext: jest.fn(),
    quizIndex: 0,
  };

  it('問題文が表示される', () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByText('スクラムマスターの主な役割は？')).toBeInTheDocument();
  });

  it('選択肢が表示される', () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByText('プロジェクト管理')).toBeInTheDocument();
    expect(screen.getByText('サーバント・リーダー')).toBeInTheDocument();
    expect(screen.getByText('コード作成')).toBeInTheDocument();
    expect(screen.getByText('予算管理')).toBeInTheDocument();
  });

  it('タイマーが表示される', () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('選択肢クリックでonAnswerが呼ばれる', () => {
    const onAnswer = jest.fn();
    render(<QuizScreen {...defaultProps} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText('サーバント・リーダー'));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it('スプリント表示がある', () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByText(/Sprint 1\/3/)).toBeInTheDocument();
  });

  it('回答後にCORRECTが表示される', () => {
    render(<QuizScreen {...defaultProps} selectedAnswer={1} />);
    expect(screen.getByText('✓ CORRECT')).toBeInTheDocument();
  });

  it('不正解時にINCORRECTが表示される', () => {
    render(<QuizScreen {...defaultProps} selectedAnswer={0} />);
    expect(screen.getByText('✗ INCORRECT')).toBeInTheDocument();
  });

  it('回答後にNextボタンが表示される', () => {
    render(<QuizScreen {...defaultProps} selectedAnswer={1} />);
    expect(screen.getByText(/Next/)).toBeInTheDocument();
  });

  it('キーボードヒントが未回答時に表示される', () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByText(/A\/B\/C\/D/)).toBeInTheDocument();
  });

  it('コンボが2以上でCOMBOが表示される', () => {
    render(<QuizScreen {...defaultProps} stats={{ ...mockStats, combo: 3 }} />);
    expect(screen.getByText(/3 COMBO/)).toBeInTheDocument();
  });

  it('技術的負債が表示される', () => {
    render(<QuizScreen {...defaultProps} />);
    expect(screen.getByText(/10pt/)).toBeInTheDocument();
  });
});

/* ================================
   SprintStartScreen
   ================================ */

describe('SprintStartScreen', () => {
  const defaultProps = {
    sprint: 0,
    stats: mockStats,
    derived: mockDerived,
    visible: true,
    onBegin: jest.fn(),
  };

  it('スプリント番号が表示される', () => {
    render(<SprintStartScreen {...defaultProps} />);
    expect(screen.getByText('SPRINT')).toBeInTheDocument();
  });

  it('Beginボタンのクリックでコールバックが呼ばれる', () => {
    const onBegin = jest.fn();
    render(<SprintStartScreen {...defaultProps} onBegin={onBegin} />);

    const button = screen.getByText(/Begin Sprint/);
    fireEvent.click(button);
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  it('イベント一覧が表示される', () => {
    render(<SprintStartScreen {...defaultProps} />);
    expect(screen.getByText('SPRINT EVENTS')).toBeInTheDocument();
    expect(screen.getByText('プランニング')).toBeInTheDocument();
  });

  it('2スプリント目以降はステータスが表示される', () => {
    render(<SprintStartScreen {...defaultProps} sprint={1} />);
    expect(screen.getByText('STATUS')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('初回スプリントではステータスが非表示', () => {
    render(<SprintStartScreen {...defaultProps} sprint={0} />);
    expect(screen.queryByText('STATUS')).not.toBeInTheDocument();
  });

  it('負債が高いと警告が表示される', () => {
    render(
      <SprintStartScreen
        {...defaultProps}
        sprint={1}
        stats={{ ...mockStats, debt: 20 }}
      />,
    );
    expect(screen.getByText(/負債蓄積中/)).toBeInTheDocument();
  });
});

/* ================================
   RetrospectiveScreen
   ================================ */

describe('RetrospectiveScreen', () => {
  const defaultProps = {
    summary: mockSummary,
    log: [mockSummary],
    stats: mockStats,
    sprint: 0,
    visible: true,
    onNext: jest.fn(),
  };

  it('振り返りタイトルが表示される', () => {
    render(<RetrospectiveScreen {...defaultProps} />);
    expect(screen.getByText('RETROSPECTIVE')).toBeInTheDocument();
    expect(screen.getByText('Sprint 1 振り返り')).toBeInTheDocument();
  });

  it('統計が表示される', () => {
    render(<RetrospectiveScreen {...defaultProps} />);
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('カテゴリが表示される', () => {
    render(<RetrospectiveScreen {...defaultProps} />);
    expect(screen.getByText('CATEGORY')).toBeInTheDocument();
  });

  it('強みと課題が表示される', () => {
    render(<RetrospectiveScreen {...defaultProps} />);
    expect(screen.getByText(/強み/)).toBeInTheDocument();
    expect(screen.getByText(/課題/)).toBeInTheDocument();
  });

  it('次へボタンのクリックでコールバックが呼ばれる', () => {
    const onNext = jest.fn();
    render(<RetrospectiveScreen {...defaultProps} onNext={onNext} />);

    const button = screen.getByText(/Sprint 2/);
    fireEvent.click(button);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('最終スプリントではReleaseボタンが表示される', () => {
    render(<RetrospectiveScreen {...defaultProps} sprint={2} />);
    expect(screen.getByText(/Release v1.0.0/)).toBeInTheDocument();
  });

  it('緊急対応成功時にメッセージが表示される', () => {
    render(
      <RetrospectiveScreen
        {...defaultProps}
        summary={{ ...mockSummary, em: true, emOk: 1 }}
      />,
    );
    expect(screen.getByText(/対応成功/)).toBeInTheDocument();
  });

  it('緊急対応失敗時にメッセージが表示される', () => {
    render(
      <RetrospectiveScreen
        {...defaultProps}
        summary={{ ...mockSummary, em: true, emOk: 0 }}
      />,
    );
    expect(screen.getByText(/対応失敗/)).toBeInTheDocument();
  });
});

/* ================================
   ResultScreen
   ================================ */

describe('ResultScreen', () => {
  const defaultProps = {
    derived: mockDerived,
    stats: mockStats,
    log: [mockSummary],
    onReplay: jest.fn(),
  };

  it('グレードが表示される', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('BUILD SUCCESS')).toBeInTheDocument();
    expect(screen.getByText('Release v1.0.0')).toBeInTheDocument();
  });

  it('エンジニアタイプが表示される', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('YOUR ENGINEER TYPE')).toBeInTheDocument();
  });

  it('統計が表示される', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText('SKILL RADAR')).toBeInTheDocument();
    expect(screen.getByText('SPRINT HISTORY')).toBeInTheDocument();
    expect(screen.getByText('SUMMARY')).toBeInTheDocument();
  });

  it('Play Againボタンのクリックでコールバックが呼ばれる', () => {
    const onReplay = jest.fn();
    render(<ResultScreen {...defaultProps} onReplay={onReplay} />);

    const button = screen.getByText(/Play Again/);
    fireEvent.click(button);
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('Shareボタンが表示される', () => {
    render(<ResultScreen {...defaultProps} />);
    expect(screen.getByText(/Share/)).toBeInTheDocument();
  });
});

/* ================================
   スタイル分割の re-export テスト
   ================================ */

describe('styles re-export', () => {
  it('animations モジュールからキーフレームがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.pulse).toBeDefined();
    expect(animations.shake).toBeDefined();
    expect(animations.fadeSlideIn).toBeDefined();
    expect(animations.floatY).toBeDefined();
    expect(animations.comboGlow).toBeDefined();
    expect(animations.popIn).toBeDefined();
    expect(animations.titleGlow).toBeDefined();
    expect(animations.gradeReveal).toBeDefined();
    expect(animations.barGrow).toBeDefined();
    expect(animations.radarFill).toBeDefined();
  });

  it('common モジュールから共通コンポーネントがエクスポートされる', async () => {
    const common = await import('../components/styles/common');
    expect(common.PageWrapper).toBeDefined();
    expect(common.Panel).toBeDefined();
    expect(common.Button).toBeDefined();
    expect(common.SectionBox).toBeDefined();
    expect(common.StatsGrid).toBeDefined();
    expect(common.Scanlines).toBeDefined();
    expect(common.Divider).toBeDefined();
  });

  it('layout モジュールからレイアウトコンポーネントがエクスポートされる', async () => {
    const layout = await import('../components/styles/layout');
    expect(layout.TimelineContainer).toBeDefined();
    expect(layout.TimerContainer).toBeDefined();
    expect(layout.TitleGlow).toBeDefined();
    expect(layout.SprintNumber).toBeDefined();
    expect(layout.EventCard).toBeDefined();
    expect(layout.HeaderInfo).toBeDefined();
    expect(layout.FeatureItem).toBeDefined();
  });

  it('quiz モジュールからクイズスタイルがエクスポートされる', async () => {
    const quiz = await import('../components/styles/quiz');
    expect(quiz.OptionButton).toBeDefined();
    expect(quiz.OptionLabel).toBeDefined();
    expect(quiz.QuizQuestion).toBeDefined();
    expect(quiz.ResultBanner).toBeDefined();
    expect(quiz.OptionsContainer).toBeDefined();
  });

  it('result モジュールからリザルトスタイルがエクスポートされる', async () => {
    const result = await import('../components/styles/result');
    expect(result.GradeCircle).toBeDefined();
    expect(result.TypeCard).toBeDefined();
    expect(result.BarChartContainer).toBeDefined();
    expect(result.CategoryBadge).toBeDefined();
    expect(result.RadarPolygon).toBeDefined();
    expect(result.StrengthText).toBeDefined();
    expect(result.BuildSuccess).toBeDefined();
  });

  it('index からすべてのエクスポートが利用可能', async () => {
    const styles = await import('../components/styles');
    // アニメーション
    expect(styles.pulse).toBeDefined();
    // 共通
    expect(styles.PageWrapper).toBeDefined();
    // レイアウト
    expect(styles.TimelineContainer).toBeDefined();
    // クイズ
    expect(styles.OptionButton).toBeDefined();
    // リザルト
    expect(styles.GradeCircle).toBeDefined();
  });
});
