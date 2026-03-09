/**
 * Game.tsx 統合テスト
 *
 * GameScreen コンポーネントの描画ループと基本的なレンダリングを検証する。
 * 依存関係が多いため、必要最小限のモックでレンダリング可能性を確認する。
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Canvas のモック
const mockCanvasContext = {
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
  putImageData: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  measureText: jest.fn(() => ({ width: 10 })),
  setTransform: jest.fn(),
  globalAlpha: 1,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  lineCap: 'butt' as CanvasLineCap,
  font: '16px sans-serif',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'top' as CanvasTextBaseline,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
  canvas: { width: 720, height: 528 },
};

HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCanvasContext);

// SpriteRenderer のモック
jest.mock('../sprites', () => ({
  SpriteRenderer: class {
    drawSprite = jest.fn();
    drawAnimatedSprite = jest.fn();
    drawSpriteWithAlpha = jest.fn();
    clearCache = jest.fn();
  },
  FLOOR_SPRITE: { width: 32, height: 32, palette: [], pixels: [] },
  WALL_SPRITE: { width: 32, height: 32, palette: [], pixels: [] },
  getStageFloorSprite: jest.fn(() => ({ width: 32, height: 32, palette: [], pixels: [] })),
  getStageWallSprite: jest.fn(() => ({ width: 32, height: 32, palette: [], pixels: [] })),
  GOAL_SPRITE_SHEET: { sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 500 },
  START_SPRITE: { width: 32, height: 32, palette: [], pixels: [] },
  getPlayerSpriteSheet: jest.fn(() => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 })),
  getEnemySpriteSheet: jest.fn(() => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 })),
  getItemSprite: jest.fn(() => ({ width: 16, height: 16, palette: [], pixels: [] })),
  getTrapSpriteSheet: jest.fn(() => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 })),
  getWallSprite: jest.fn(() => ({ width: 32, height: 32, palette: [], pixels: [] })),
  ATTACK_SLASH_SPRITE_SHEET: { sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 100 },
  WARRIOR_ATTACK_SPRITE_SHEETS: new Proxy({}, { get: () => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 }) }),
  THIEF_ATTACK_SPRITE_SHEETS: new Proxy({}, { get: () => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 }) }),
  WARRIOR_DAMAGE_SPRITES: new Proxy({}, { get: () => ({ width: 32, height: 32, palette: [], pixels: [] }) }),
  THIEF_DAMAGE_SPRITES: new Proxy({}, { get: () => ({ width: 32, height: 32, palette: [], pixels: [] }) }),
  WARRIOR_IDLE_SPRITE_SHEETS: new Proxy({}, { get: () => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 }) }),
  THIEF_IDLE_SPRITE_SHEETS: new Proxy({}, { get: () => ({ sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 200 }) }),
  PATROL_ATTACK_FRAME: null,
  CHARGE_RUSH_FRAME: null,
  RANGED_CAST_FRAME: null,
  SPECIMEN_MUTATE_FRAME: null,
  BOSS_ATTACK_FRAME: null,
  BOSS_DAMAGE_FRAME: null,
  MINI_BOSS_ATTACK_FRAME: null,
  MINI_BOSS_DAMAGE_FRAME: null,
  MEGA_BOSS_ATTACK_FRAME: null,
  MEGA_BOSS_DAMAGE_FRAME: null,
  ENEMY_MELEE_SLASH_SPRITE_SHEET: { sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 100 },
  ENEMY_RANGED_SHOT_SPRITE_SHEET: { sprites: [{ width: 32, height: 32, palette: [], pixels: [] }], frameDuration: 100 },
}));

// アセットのモック
jest.mock('../../../../assets/images/ipne_class_warrior.webp', () => 'warrior.webp');
jest.mock('../../../../assets/images/ipne_class_thief.webp', () => 'thief.webp');

import { GameScreen } from './Game';
import { TileType, PlayerClass, Direction, ExplorationState, TimerState } from '../../types';
import type { AutoMapState, Enemy, Item, Trap, Wall, Position, GameTimer } from '../../types';
import { createPlayer } from '../../player';
import { createTestMap, createMockCanvasContext } from '../../__tests__/testUtils';

/** テスト用の AutoMapState を生成する */
const createTestMapState = (width: number, height: number): AutoMapState => ({
  exploration: Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ExplorationState.UNEXPLORED)
  ),
  isMapVisible: false,
  isFullScreen: false,
});

// テスト用の最小プロップス
const createMinimalProps = () => {
  const map = createTestMap(7, 7);
  const player = createPlayer(1, 1, PlayerClass.WARRIOR);

  return {
    map,
    player,
    enemies: [] as Enemy[],
    items: [] as Item[],
    traps: [] as Trap[],
    walls: [] as Wall[],
    mapState: createTestMapState(7, 7),
    goalPos: { x: 5, y: 5 },
    debugState: {
      enabled: false,
      showPanel: false,
      showFullMap: false,
      showPath: false,
      showCoordinates: false,
    },
    onMove: jest.fn(),
    onTurn: jest.fn(),
    onAttack: jest.fn(),
    onMapToggle: jest.fn(),
    onDebugToggle: jest.fn(),
    attackEffect: undefined as { position: Position; until: number } | undefined,
    lastDamageAt: 0,
    timer: {
      state: TimerState.RUNNING,
      startTime: Date.now(),
      pausedTime: 0,
      totalPausedDuration: 0,
    } as GameTimer,
    showHelp: false,
    onHelpToggle: jest.fn(),
    showKeyRequiredMessage: false,
    pendingLevelPoints: 0,
    onOpenLevelUpModal: jest.fn(),
    isDying: false,
  };
};

describe('GameScreen 統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // requestAnimationFrame のモック
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      // 1フレーム分だけ実行
      setTimeout(() => cb(performance.now()), 0);
      return 1;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('レンダリング', () => {
    it('エラーなくレンダリングできる', () => {
      const props = createMinimalProps();

      expect(() => {
        render(<GameScreen {...props} />);
      }).not.toThrow();
    });

    it('Canvas 要素が存在する', () => {
      const props = createMinimalProps();
      const { container } = render(<GameScreen {...props} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('攻撃ボタンが存在する', () => {
      const props = createMinimalProps();
      render(<GameScreen {...props} />);

      const attackButton = screen.getByText('ATK');
      expect(attackButton).toBeInTheDocument();
    });

    it('HPバーが表示される', () => {
      const props = createMinimalProps();
      const { container } = render(<GameScreen {...props} />);

      // HPバーのテキスト
      const hpText = container.querySelector('[class*="HPBar"]') ??
                     screen.queryByText(/HP/i);
      // HPバーコンポーネントが存在する
      expect(container.innerHTML).toContain('HP');
    });

    it('方向キーが存在する', () => {
      const props = createMinimalProps();
      render(<GameScreen {...props} />);

      // D-Pad ボタン
      expect(screen.getByText('▲')).toBeInTheDocument();
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.getByText('◀')).toBeInTheDocument();
      expect(screen.getByText('▶')).toBeInTheDocument();
    });
  });

  describe('コンポーネント Props', () => {
    it('敵がいる場合もレンダリングできる', () => {
      const props = createMinimalProps();
      const { createEnemy } = require('../../enemy');
      props.enemies = [createEnemy('patrol', 3, 3)];

      expect(() => {
        render(<GameScreen {...props} />);
      }).not.toThrow();
    });

    it('アイテムがある場合もレンダリングできる', () => {
      const props = createMinimalProps();
      const { createItem } = require('../../item');
      props.items = [createItem('health_small', 2, 2)];

      expect(() => {
        render(<GameScreen {...props} />);
      }).not.toThrow();
    });

    it('ヘルプ表示中もレンダリングできる', () => {
      const props = createMinimalProps();
      props.showHelp = true;

      expect(() => {
        render(<GameScreen {...props} />);
      }).not.toThrow();
    });

    it('死亡アニメーション中もレンダリングできる', () => {
      const props = createMinimalProps();
      props.isDying = true;

      expect(() => {
        render(<GameScreen {...props} />);
      }).not.toThrow();
    });

    it('レベルアップポイントがある場合にバッジが表示される', () => {
      const props = createMinimalProps();
      props.pendingLevelPoints = 3;

      render(<GameScreen {...props} />);

      const badge = screen.getByLabelText('未割り振りポイント: 3');
      expect(badge).toBeInTheDocument();
    });
  });
});
