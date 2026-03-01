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
    render(<StatBar label="体力" value={60} max={100} color="#ef4444" icon="❤" />);
    expect(screen.getByText(/体力/)).toBeInTheDocument();
    expect(screen.getByText('60/100')).toBeInTheDocument();
  });

  it('HP が 25% 未満の場合に危険表示が出る', () => {
    render(<StatBar label="体力" value={20} max={100} color="#ef4444" icon="❤" />);
    expect(screen.getByText(/危険/)).toBeInTheDocument();
  });

  it('HP が 25% 以上の場合は危険表示がない', () => {
    render(<StatBar label="体力" value={30} max={100} color="#ef4444" icon="❤" />);
    expect(screen.queryByText(/危険/)).not.toBeInTheDocument();
  });
});

describe('StatusTag', () => {
  it('状態異常名が表示される', () => {
    render(<StatusTag name="負傷" />);
    expect(screen.getByText(/負傷/)).toBeInTheDocument();
  });
});

describe('Change', () => {
  it('正の値で ▲ と + が表示される', () => {
    render(<Change value={5} label="HP" />);
    expect(screen.getByText(/HP.*▲.*\+5/)).toBeInTheDocument();
  });

  it('負の値で ▼ が表示される', () => {
    render(<Change value={-10} label="HP" />);
    expect(screen.getByText(/HP.*▼.*-10/)).toBeInTheDocument();
  });

  it('値が 0 の場合は何も表示されない', () => {
    const { container } = render(<Change value={0} label="HP" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('FlagIndicator', () => {
  it('add: フラグで状態異常が表示される', () => {
    render(<FlagIndicator flag="add:負傷" />);
    expect(screen.getByText(/負傷/)).toBeInTheDocument();
  });

  it('remove: フラグで回復が表示される', () => {
    render(<FlagIndicator flag="remove:負傷" />);
    expect(screen.getByText(/負傷 回復/)).toBeInTheDocument();
  });

  it('shortcut フラグで近道表示', () => {
    render(<FlagIndicator flag="shortcut" />);
    expect(screen.getByText(/近道発見/)).toBeInTheDocument();
  });

  it('null の場合は何も表示されない', () => {
    const { container } = render(<FlagIndicator flag={null} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('DrainDisplay', () => {
  it('ドレイン情報が表示される', () => {
    render(<DrainDisplay drain={{ hp: -3, mn: -2 }} />);
    expect(screen.getByText(/迷宮の侵蝕/)).toBeInTheDocument();
    expect(screen.getByText(/HP-3/)).toBeInTheDocument();
    expect(screen.getByText(/精神-2/)).toBeInTheDocument();
  });

  it('null の場合は何も表示されない', () => {
    const { container } = render(<DrainDisplay drain={null} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('LogEntry', () => {
  const entry: LogEntryDef = { fl: 1, step: 1, ch: "探索した", hp: -10, mn: 5, inf: 3 };

  it('ログエントリーが表示される', () => {
    render(<LogEntry entry={entry} />);
    expect(screen.getByText('探索した')).toBeInTheDocument();
    expect(screen.getByText(/第1層-1/)).toBeInTheDocument();
  });

  it('HP マイナスは #ef4444 色で表示される', () => {
    const { container } = render(<LogEntry entry={entry} />);
    const hpSpan = container.querySelector('span[style*="color: rgb(239, 68, 68)"]');
    expect(hpSpan).not.toBeNull();
    expect(hpSpan!.textContent).toContain('HP-10');
  });

  it('精神 プラスは #60a5fa 色で表示される', () => {
    const { container } = render(<LogEntry entry={entry} />);
    const spans = container.querySelectorAll('span[style*="color: rgb(96, 165, 250)"]');
    const mnSpan = Array.from(spans).find(s => s.textContent?.includes('精神'));
    expect(mnSpan).toBeDefined();
    expect(mnSpan!.textContent).toContain('精神+5');
  });

  it('情報 プラスは #fbbf24 色で表示される', () => {
    const { container } = render(<LogEntry entry={entry} />);
    const infSpan = container.querySelector('span[style*="color: rgb(251, 191, 36)"]');
    expect(infSpan).not.toBeNull();
    expect(infSpan!.textContent).toContain('情報+3');
  });

  it('情報 マイナスは #94a3b8 色で表示される', () => {
    const negEntry: LogEntryDef = { fl: 1, step: 1, ch: "失敗", hp: 0, mn: 0, inf: -5 };
    const { container } = render(<LogEntry entry={negEntry} />);
    const infSpan = container.querySelector('span[style*="color: rgb(148, 163, 184)"]');
    expect(infSpan).not.toBeNull();
    expect(infSpan!.textContent).toContain('情報-5');
  });

  it('精神 マイナスは #a855f7 色で表示される', () => {
    const negEntry: LogEntryDef = { fl: 1, step: 1, ch: "ダメージ", hp: 0, mn: -8, inf: 0 };
    const { container } = render(<LogEntry entry={negEntry} />);
    const mnSpan = container.querySelector('span[style*="color: rgb(168, 85, 247)"]');
    expect(mnSpan).not.toBeNull();
    expect(mnSpan!.textContent).toContain('精神-8');
  });
});

describe('StepDots', () => {
  it('正しい数のドットが表示される', () => {
    const { container } = render(<StepDots current={2} total={5} />);
    const dots = container.querySelectorAll('.dot');
    expect(dots.length).toBe(5);
  });

  it('完了済みドットに done クラスがある', () => {
    const { container } = render(<StepDots current={2} total={5} />);
    const dots = container.querySelectorAll('.dot');
    expect(dots[0].classList.contains('done')).toBe(true);
    expect(dots[1].classList.contains('done')).toBe(true);
    expect(dots[2].classList.contains('now')).toBe(true);
    expect(dots[3].classList.contains('done')).toBe(false);
  });
});

describe('DiffBadge', () => {
  it('難易度情報が表示される', () => {
    const diff = DIFFICULTY.find(d => d.id === 'normal')!;
    render(<DiffBadge diff={diff} />);
    expect(screen.getByText(new RegExp(diff.name))).toBeInTheDocument();
  });

  it('null の場合は何も表示されない', () => {
    const { container } = render(<DiffBadge diff={null} />);
    expect(container.innerHTML).toBe('');
  });
});
