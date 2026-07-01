import React from 'react';
import { render } from '@testing-library/react';
import EnemyBulletSprite from '../EnemyBulletSprite';
import { EntityFactory } from '../../entities';

describe('EnemyBulletSprite', () => {
  test('敵弾を例外なく描画し、白コアを含む', () => {
    const bullet = EntityFactory.enemyBullet(100, 200, { x: 0, y: 4 });
    const { container } = render(<EnemyBulletSprite bullet={bullet} />);
    // ルート要素が存在する
    const root = container.firstChild as HTMLElement;
    expect(root).not.toBeNull();
    // 白コア（#ffffff / #fff / rgb(255,255,255)）を持つ子要素が存在する
    const html = container.innerHTML.toLowerCase();
    expect(html.includes('#fff') || html.includes('rgb(255, 255, 255)')).toBe(true);
  });

  test('弾の座標が left/top に反映される', () => {
    const bullet = EntityFactory.enemyBullet(120, 240, { x: 0, y: 4 });
    const { container } = render(<EnemyBulletSprite bullet={bullet} />);
    const root = container.firstChild as HTMLElement;
    // 中心 (120,240) からサイズ 16 の半分ずれた位置
    expect(root.style.left).toBe(`${120 - 8}px`);
    expect(root.style.top).toBe(`${240 - 8}px`);
  });
});
