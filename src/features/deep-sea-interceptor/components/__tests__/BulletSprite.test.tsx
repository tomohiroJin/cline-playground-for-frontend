import React from 'react';
import { render } from '@testing-library/react';
import BulletSprite from '../BulletSprite';
import { EntityFactory } from '../../entities';

describe('BulletSprite', () => {
  test('通常弾を例外なく描画し、発光フィルタを持つ', () => {
    const bullet = EntityFactory.bullet(100, 200);
    const { container } = render(<BulletSprite bullet={bullet} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.filter).toContain('drop-shadow');
  });

  test('チャージ弾も描画できる', () => {
    const bullet = EntityFactory.bullet(100, 200, { charged: true });
    const { container } = render(<BulletSprite bullet={bullet} />);
    expect(container.firstChild).not.toBeNull();
  });
});
