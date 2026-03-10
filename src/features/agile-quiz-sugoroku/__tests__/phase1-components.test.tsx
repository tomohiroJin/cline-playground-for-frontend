/**
 * Agile Quiz Sugoroku - フェーズ1演出強化コンポーネントテスト
 */

// tone モジュールのモック（ESM パッケージのため Jest で変換できない）
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  Loop: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Transport: {
    bpm: { value: 120 },
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
  },
  start: jest.fn(),
  now: jest.fn().mockReturnValue(0),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameEvent } from '../types';

// ── A. アニメーション定義テスト ────────────────────────────

describe('新規アニメーション定義', () => {
  it('フラッシュアニメーションがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.greenFlash).toBeDefined();
    expect(animations.redFlash).toBeDefined();
    expect(animations.grayOut).toBeDefined();
  });

  it('バウンスとシェイクアニメーションがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.bounceIn).toBeDefined();
    expect(animations.shakeX).toBeDefined();
  });

  it('フロートアップアニメーションがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.floatUp).toBeDefined();
  });

  it('コンボ段階別アニメーションがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.comboFire).toBeDefined();
    expect(animations.comboLightning).toBeDefined();
    expect(animations.comboRainbow).toBeDefined();
    expect(animations.comboLegendary).toBeDefined();
  });

  it('ボード関連アニメーションがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.slideMove).toBeDefined();
    expect(animations.emergencyBlink).toBeDefined();
  });

  it('吹き出しアニメーションがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.bubbleFadeIn).toBeDefined();
    expect(animations.bubbleFadeOut).toBeDefined();
  });

  it('タイプライターカーソルがエクスポートされる', async () => {
    const animations = await import('../components/styles/animations');
    expect(animations.typewriterCursor).toBeDefined();
  });
});

// ── B. SugorokuBoard コンポーネントテスト ───────────────────

import { SugorokuBoard } from '../components/SugorokuBoard';

const mockEvents: GameEvent[] = [
  { id: 'planning', name: 'プランニング', icon: '📋', description: '計画', color: '#4d9fff' },
  { id: 'impl1', name: '実装', icon: '⌨️', description: '作り始め', color: '#a78bfa' },
  { id: 'test1', name: 'テスト', icon: '🧪', description: '確認', color: '#22d3ee' },
];

describe('SugorokuBoard', () => {
  it('全マスが表示される', () => {
    render(<SugorokuBoard events={mockEvents} currentIndex={0} />);
    expect(screen.getByText('プランニング')).toBeInTheDocument();
    expect(screen.getByText('実装')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });

  it('完了マスにチェックマークが表示される', () => {
    render(<SugorokuBoard events={mockEvents} currentIndex={2} />);
    const checks = screen.getAllByText('✓');
    expect(checks.length).toBe(2);
  });

  it('現在のマスにコマが表示される', () => {
    render(<SugorokuBoard events={mockEvents} currentIndex={1} />);
    expect(screen.getByTestId('board-piece')).toBeInTheDocument();
  });

  it('緊急対応マスが視覚的に区別される', () => {
    const eventsWithEmergency: GameEvent[] = [
      ...mockEvents,
      { id: 'emergency', name: '緊急対応', icon: '🚨', description: '障害', color: '#f06070' },
    ];
    render(<SugorokuBoard events={eventsWithEmergency} currentIndex={0} />);
    expect(screen.getByText('緊急対応')).toBeInTheDocument();
  });
});

// ── C. FlashOverlay コンポーネントテスト ────────────────────

import { FlashOverlay } from '../components/FlashOverlay';

describe('FlashOverlay', () => {
  it('typeが"correct"の場合に表示される', () => {
    const { container } = render(<FlashOverlay type="correct" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('typeが"incorrect"の場合に表示される', () => {
    const { container } = render(<FlashOverlay type="incorrect" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('typeが"timeup"の場合に表示される', () => {
    const { container } = render(<FlashOverlay type="timeup" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('typeがundefinedの場合に何も表示されない', () => {
    const { container } = render(<FlashOverlay type={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});

// ── D. ScoreFloat コンポーネントテスト ──────────────────────

import { ScoreFloat } from '../components/ScoreFloat';

describe('ScoreFloat', () => {
  it('スコアテキストが表示される', () => {
    render(<ScoreFloat text="+10pt" />);
    expect(screen.getByText('+10pt')).toBeInTheDocument();
  });

  it('テキストが空の場合何も表示されない', () => {
    const { container } = render(<ScoreFloat text="" />);
    expect(container.firstChild).toBeNull();
  });
});

// ── E. ComboEffect コンポーネントテスト ─────────────────────

import { ComboEffect } from '../components/ComboEffect';

describe('ComboEffect', () => {
  it('コンボ2以上でコンボ表示される', () => {
    render(<ComboEffect combo={3} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/COMBO/)).toBeInTheDocument();
  });

  it('コンボ1以下では何も表示されない', () => {
    const { container } = render(<ComboEffect combo={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('コンボ4以上でLIGHTNING表示', () => {
    render(<ComboEffect combo={4} />);
    expect(screen.getByText(/LIGHTNING/)).toBeInTheDocument();
  });

  it('コンボ8以上でLEGENDARY表示', () => {
    render(<ComboEffect combo={8} />);
    expect(screen.getByText(/LEGENDARY/)).toBeInTheDocument();
  });

  it('isBreakがtrueでCombo Break表示', () => {
    render(<ComboEffect combo={0} isBreak />);
    expect(screen.getByText(/Combo Break/)).toBeInTheDocument();
  });
});

// ── F. CharacterReaction コンポーネントテスト ────────────────

import { CharacterReaction } from '../components/CharacterReaction';

describe('CharacterReaction', () => {
  it('situationが指定されると3体のキャラアバターが表示される', () => {
    render(<CharacterReaction situation="correct" />);
    expect(screen.getByTestId('character-reaction')).toBeInTheDocument();
    expect(screen.getByAltText('neko')).toBeInTheDocument();
    expect(screen.getByAltText('inu')).toBeInTheDocument();
    expect(screen.getByAltText('usagi')).toBeInTheDocument();
  });

  it('situationがundefinedでも常時表示される', () => {
    render(<CharacterReaction situation={undefined} />);
    expect(screen.getByTestId('character-reaction')).toBeInTheDocument();
  });

  it('timer指定で表示される', () => {
    render(<CharacterReaction situation="idle" timer={5} quizTags={['scrum']} />);
    expect(screen.getByTestId('character-reaction')).toBeInTheDocument();
  });

  it('quizTags指定で表示される', () => {
    render(<CharacterReaction situation="idle" timer={10} quizTags={['testing']} />);
    expect(screen.getByTestId('character-reaction')).toBeInTheDocument();
  });
});
