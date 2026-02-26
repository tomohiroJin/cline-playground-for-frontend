import React from 'react';
import { render, act } from '@testing-library/react';
import {
  LaserEffectComponent,
  ExplosionEffectComponent,
  BlastEffectComponent,
} from '../../components/Effects';

// setTimeout をモック化
jest.useFakeTimers();

describe('LaserEffectComponent', () => {
  test('初期表示されること', () => {
    const { container } = render(
      <LaserEffectComponent x={5} size={30} height={18} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  test('300ms後に非表示になること', () => {
    const { container } = render(
      <LaserEffectComponent x={5} size={30} height={18} />
    );
    expect(container.firstChild).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(container.firstChild).toBeNull();
  });
});

describe('ExplosionEffectComponent', () => {
  test('初期表示されること', () => {
    const { container } = render(
      <ExplosionEffectComponent x={3} y={5} size={30} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  test('250ms後に非表示になること', () => {
    const { container } = render(
      <ExplosionEffectComponent x={3} y={5} size={30} />
    );
    expect(container.firstChild).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(container.firstChild).toBeNull();
  });
});

describe('BlastEffectComponent', () => {
  test('visible=trueの場合表示されること', () => {
    const { container } = render(<BlastEffectComponent visible={true} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('visible=falseの場合表示されないこと', () => {
    const { container } = render(<BlastEffectComponent visible={false} />);
    expect(container.firstChild).toBeNull();
  });
});
