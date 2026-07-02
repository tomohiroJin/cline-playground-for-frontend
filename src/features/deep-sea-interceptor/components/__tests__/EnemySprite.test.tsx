import React from 'react';
import { render } from '@testing-library/react';
import EnemySprite from '../EnemySprite';
import { EntityFactory } from '../../entities';
import { EnemyVisual } from '../../enemy-visual';

describe('EnemySprite（通常敵の型別描画）', () => {
  const regulars = ['basic', 'fast', 'shooter', 'tank'] as const;

  test('通常敵4種すべてが例外なく描画され、型別 data-testid を持つ', () => {
    regulars.forEach(type => {
      const enemy = EntityFactory.enemy(type, 200, 200);
      const { container, getByTestId } = render(<EnemySprite enemy={enemy} />);
      expect(getByTestId(`enemy-silhouette-${EnemyVisual[type].silhouette}`)).toBeInTheDocument();
      expect(container.firstChild).not.toBeNull();
    });
  });

  test('shooter は発射予兆時にルアー発光要素を表示する', () => {
    const shooter = EntityFactory.enemy('shooter', 200, 200);
    // 発射直前になるよう lastShotAt を過去に設定（fireRate 2000, LEAD 400 → 1600ms 経過で予兆）
    shooter.lastShotAt = Date.now() - 1700;
    const { getByTestId } = render(<EnemySprite enemy={shooter} />);
    expect(getByTestId('enemy-telegraph')).toBeInTheDocument();
  });

  test('shooter は発射直後には予兆要素を表示しない', () => {
    const shooter = EntityFactory.enemy('shooter', 200, 200);
    shooter.lastShotAt = Date.now();
    const { queryByTestId } = render(<EnemySprite enemy={shooter} />);
    expect(queryByTestId('enemy-telegraph')).toBeNull();
  });

  test('high 危険度（shooter）は危険リングを表示する', () => {
    const shooter = EntityFactory.enemy('shooter', 200, 200);
    shooter.lastShotAt = Date.now();
    const { getByTestId } = render(<EnemySprite enemy={shooter} />);
    expect(getByTestId('enemy-danger-ring')).toBeInTheDocument();
  });

  test('low 危険度（basic）は危険リングを表示しない', () => {
    const basic = EntityFactory.enemy('basic', 200, 200);
    const { queryByTestId } = render(<EnemySprite enemy={basic} />);
    expect(queryByTestId('enemy-danger-ring')).toBeNull();
  });

  test('被弾直後の敵は被弾フラッシュ要素を表示する', () => {
    const enemy = EntityFactory.enemy('tank', 200, 200);
    enemy.lastHitAt = Date.now(); // 直近被弾
    const { getByTestId } = render(<EnemySprite enemy={enemy} />);
    expect(getByTestId('enemy-hit-flash')).toBeInTheDocument();
  });

  test('未被弾の敵は被弾フラッシュ要素を表示しない', () => {
    const enemy = EntityFactory.enemy('tank', 200, 200);
    const { queryByTestId } = render(<EnemySprite enemy={enemy} />);
    expect(queryByTestId('enemy-hit-flash')).toBeNull();
  });
});
