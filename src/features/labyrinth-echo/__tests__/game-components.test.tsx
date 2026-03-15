/**
 * 迷宮の残響 - GameComponents テスト
 *
 * ステータスバー、ログエントリー、変化表示等の UIプリミティブを検証。
 */
import { render, screen } from '@testing-library/react';
import {
  StatBar, StatusTag, Change, FlagIndicator,
  DrainDisplay, LogEntry, StepDots, DiffBadge,
} from '../components/GameComponents';
import { DIFFICULTY } from '../game-logic';
import type { LogEntry as LogEntryDef } from '../definitions';

describe('StatBar', () => {
  it('ラベルと値が表示される', () => {
    // Arrange & Act
    render(<StatBar label="体力" value={60} max={100} color="#ef4444" icon="❤" />);

    // Assert
    expect(screen.getByText(/体力/)).toBeInTheDocument();
    expect(screen.getByText('60/100')).toBeInTheDocument();
  });

  it('HPが25%未満の場合に危険表示が出る', () => {
    // Arrange & Act
    render(<StatBar label="体力" value={20} max={100} color="#ef4444" icon="❤" />);

    // Assert
    expect(screen.getByText(/危険/)).toBeInTheDocument();
  });

  it('HPが25%以上の場合は危険表示がない', () => {
    // Arrange & Act
    render(<StatBar label="体力" value={30} max={100} color="#ef4444" icon="❤" />);

    // Assert
    expect(screen.queryByText(/危険/)).not.toBeInTheDocument();
  });
});

describe('StatusTag', () => {
  it('状態異常名が表示される', () => {
    // Arrange & Act
    render(<StatusTag name="負傷" />);

    // Assert
    expect(screen.getByText(/負傷/)).toBeInTheDocument();
  });
});

describe('Change', () => {
  it('正の値を渡すと▲と+付きで表示される', () => {
    // Arrange & Act
    render(<Change value={5} label="HP" />);

    // Assert
    expect(screen.getByText(/HP.*▲.*\+5/)).toBeInTheDocument();
  });

  it('負の値を渡すと▼付きで表示される', () => {
    // Arrange & Act
    render(<Change value={-10} label="HP" />);

    // Assert
    expect(screen.getByText(/HP.*▼.*-10/)).toBeInTheDocument();
  });

  it('値が0の場合は何も表示されない', () => {
    // Arrange & Act
    const { container } = render(<Change value={0} label="HP" />);

    // Assert
    expect(container.innerHTML).toBe('');
  });
});

describe('FlagIndicator', () => {
  it('"add:負傷"フラグを渡すと状態異常名が表示される', () => {
    // Arrange & Act
    render(<FlagIndicator flag="add:負傷" />);

    // Assert
    expect(screen.getByText(/負傷/)).toBeInTheDocument();
  });

  it('"remove:負傷"フラグを渡すと回復表示がされる', () => {
    // Arrange & Act
    render(<FlagIndicator flag="remove:負傷" />);

    // Assert
    expect(screen.getByText(/負傷 回復/)).toBeInTheDocument();
  });

  it('"shortcut"フラグを渡すと近道発見表示がされる', () => {
    // Arrange & Act
    render(<FlagIndicator flag="shortcut" />);

    // Assert
    expect(screen.getByText(/近道発見/)).toBeInTheDocument();
  });

  it('nullを渡すと何も表示されない', () => {
    // Arrange & Act
    const { container } = render(<FlagIndicator flag={null} />);

    // Assert
    expect(container.innerHTML).toBe('');
  });
});

describe('DrainDisplay', () => {
  it('ドレイン情報を渡すと迷宮の侵蝕表示がされる', () => {
    // Arrange & Act
    render(<DrainDisplay drain={{ hp: -3, mn: -2 }} />);

    // Assert
    expect(screen.getByText(/迷宮の侵蝕/)).toBeInTheDocument();
    expect(screen.getByText(/HP-3/)).toBeInTheDocument();
    expect(screen.getByText(/精神-2/)).toBeInTheDocument();
  });

  it('nullを渡すと何も表示されない', () => {
    // Arrange & Act
    const { container } = render(<DrainDisplay drain={null} />);

    // Assert
    expect(container.innerHTML).toBe('');
  });
});

describe('LogEntry', () => {
  const entry: LogEntryDef = { fl: 1, step: 1, ch: "探索した", hp: -10, mn: 5, inf: 3 };

  it('ログエントリーの選択テキストとフロア情報が表示される', () => {
    // Arrange & Act
    render(<LogEntry entry={entry} />);

    // Assert
    expect(screen.getByText('探索した')).toBeInTheDocument();
    expect(screen.getByText(/第1層-1/)).toBeInTheDocument();
  });

  it('HPマイナス値は赤色(#ef4444)で表示される', () => {
    // Arrange & Act
    const { container } = render(<LogEntry entry={entry} />);

    // Assert
    const hpSpan = container.querySelector('span[style*="color: rgb(239, 68, 68)"]');
    expect(hpSpan).not.toBeNull();
    expect(hpSpan!.textContent).toContain('HP-10');
  });

  it('精神プラス値は青色(#60a5fa)で表示される', () => {
    // Arrange & Act
    const { container } = render(<LogEntry entry={entry} />);

    // Assert
    const spans = container.querySelectorAll('span[style*="color: rgb(96, 165, 250)"]');
    const mnSpan = Array.from(spans).find(s => s.textContent?.includes('精神'));
    expect(mnSpan).toBeDefined();
    expect(mnSpan!.textContent).toContain('精神+5');
  });

  it('情報プラス値は黄色(#fbbf24)で表示される', () => {
    // Arrange & Act
    const { container } = render(<LogEntry entry={entry} />);

    // Assert
    const infSpan = container.querySelector('span[style*="color: rgb(251, 191, 36)"]');
    expect(infSpan).not.toBeNull();
    expect(infSpan!.textContent).toContain('情報+3');
  });

  it('情報マイナス値はグレー色(#94a3b8)で表示される', () => {
    // Arrange
    const negEntry: LogEntryDef = { fl: 1, step: 1, ch: "失敗", hp: 0, mn: 0, inf: -5 };

    // Act
    const { container } = render(<LogEntry entry={negEntry} />);

    // Assert
    const infSpan = container.querySelector('span[style*="color: rgb(148, 163, 184)"]');
    expect(infSpan).not.toBeNull();
    expect(infSpan!.textContent).toContain('情報-5');
  });

  it('精神マイナス値は紫色(#a855f7)で表示される', () => {
    // Arrange
    const negEntry: LogEntryDef = { fl: 1, step: 1, ch: "ダメージ", hp: 0, mn: -8, inf: 0 };

    // Act
    const { container } = render(<LogEntry entry={negEntry} />);

    // Assert
    const mnSpan = container.querySelector('span[style*="color: rgb(168, 85, 247)"]');
    expect(mnSpan).not.toBeNull();
    expect(mnSpan!.textContent).toContain('精神-8');
  });
});

describe('StepDots', () => {
  it('指定した数のドットが表示される', () => {
    // Arrange & Act
    const { container } = render(<StepDots current={2} total={5} />);

    // Assert
    const dots = container.querySelectorAll('.dot');
    expect(dots.length).toBe(5);
  });

  it('完了済みドットにdoneクラス、現在ドットにnowクラスがある', () => {
    // Arrange & Act
    const { container } = render(<StepDots current={2} total={5} />);

    // Assert
    const dots = container.querySelectorAll('.dot');
    expect(dots[0].classList.contains('done')).toBe(true);
    expect(dots[1].classList.contains('done')).toBe(true);
    expect(dots[2].classList.contains('now')).toBe(true);
    expect(dots[3].classList.contains('done')).toBe(false);
  });
});

describe('DiffBadge', () => {
  it('難易度情報を渡すと難易度名が表示される', () => {
    // Arrange
    const diff = DIFFICULTY.find(d => d.id === 'normal')!;

    // Act
    render(<DiffBadge diff={diff} />);

    // Assert
    // eslint-disable-next-line security/detect-non-literal-regexp
    expect(screen.getByText(new RegExp(diff.name))).toBeInTheDocument();
  });

  it('nullを渡すと何も表示されない', () => {
    // Arrange & Act
    const { container } = render(<DiffBadge diff={null} />);

    // Assert
    expect(container.innerHTML).toBe('');
  });
});
