import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../../components/StatusBar';

describe('StatusBar', () => {
  test('ステージ番号を表示すること', () => {
    render(<StatusBar stage={2} lines={1} linesNeeded={4} score={500} />);
    expect(screen.getByText('ST2')).toBeInTheDocument();
  });

  test('ラインクリア進捗を表示すること', () => {
    render(<StatusBar stage={1} lines={1} linesNeeded={2} score={100} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  test('スコアを表示すること', () => {
    render(<StatusBar stage={1} lines={0} linesNeeded={1} score={1250} />);
    expect(screen.getByText('1250')).toBeInTheDocument();
  });

  test('全ての値が0の場合も正しく表示すること', () => {
    render(<StatusBar stage={1} lines={0} linesNeeded={1} score={0} />);
    expect(screen.getByText('ST1')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
