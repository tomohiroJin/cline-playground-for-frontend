import React from 'react';
import { render } from '@testing-library/react';
import { BulletView } from '../../components/BulletView';
import type { BulletData } from '../../types';

const makeBullet = (overrides: Partial<BulletData> = {}): BulletData => ({
  id: 'test-bullet',
  x: 5,
  y: 10,
  dx: 0,
  dy: -1,
  pierce: false,
  ...overrides,
});

describe('BulletView', () => {
  test('通常弾を描画すること', () => {
    const { container } = render(
      <BulletView bullet={makeBullet()} size={30} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  test('貫通弾の場合に描画されること', () => {
    const { container } = render(
      <BulletView bullet={makeBullet({ pierce: true })} size={30} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  test('下方弾の場合に描画されること', () => {
    const { container } = render(
      <BulletView bullet={makeBullet({ dy: 1 })} size={30} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  test('異なるサイズで描画されること', () => {
    const { container: container1 } = render(
      <BulletView bullet={makeBullet()} size={20} />
    );
    const { container: container2 } = render(
      <BulletView bullet={makeBullet()} size={40} />
    );
    expect(container1.firstChild).toBeInTheDocument();
    expect(container2.firstChild).toBeInTheDocument();
  });
});
