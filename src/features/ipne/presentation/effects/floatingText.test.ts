/**
 * FloatingTextManager テスト
 */

import {
  FloatingTextManager,
  FloatingTextType,
  FLOATING_TEXT_CONFIGS,
  getTextPosition,
} from './floatingText';

describe('FloatingTextManager', () => {
  let manager: FloatingTextManager;

  beforeEach(() => {
    manager = new FloatingTextManager();
  });

  describe('addText', () => {
    it('テキストを追加できる', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000);
      expect(manager.getTextCount()).toBe(1);
    });

    it('複数のテキストを追加できる', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000);
      manager.addText('+5', 150, 250, FloatingTextType.HEAL, 1000);
      manager.addText('-3', 200, 300, FloatingTextType.PLAYER_DAMAGE, 1000);
      expect(manager.getTextCount()).toBe(3);
    });

    it('上限数を超えた場合、古いテキストから削除される', () => {
      for (let i = 0; i < 35; i++) {
        manager.addText(`${i}`, 100, 200, FloatingTextType.DAMAGE, 1000 + i);
      }
      expect(manager.getTextCount()).toBeLessThanOrEqual(30);
    });

    it('テキスト種別に応じた設定が適用される', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000);
      const texts = manager.getTexts();
      expect(texts[0].color).toBe(FLOATING_TEXT_CONFIGS.damage.color);
      expect(texts[0].fontSize).toBe(FLOATING_TEXT_CONFIGS.damage.fontSize);
      expect(texts[0].duration).toBe(FLOATING_TEXT_CONFIGS.damage.duration);
    });
  });

  describe('update', () => {
    it('期限切れのテキストが除去される', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000);
      // DAMAGEの持続時間は800ms
      manager.update(1000 + 801);
      expect(manager.getTextCount()).toBe(0);
    });

    it('期限内のテキストは保持される', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000);
      manager.update(1000 + 400);
      expect(manager.getTextCount()).toBe(1);
    });

    it('混在する場合、期限切れのみ除去される', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000); // 800ms
      manager.addText('INFO', 150, 250, FloatingTextType.INFO, 1000); // 1500ms
      manager.update(1000 + 900);
      expect(manager.getTextCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('全テキストがクリアされる', () => {
      manager.addText('10', 100, 200, FloatingTextType.DAMAGE, 1000);
      manager.addText('+5', 150, 250, FloatingTextType.HEAL, 1000);
      manager.clear();
      expect(manager.getTextCount()).toBe(0);
    });
  });
});

describe('getTextPosition', () => {
  it('開始時はY方向オフセットが0に近い', () => {
    const result = getTextPosition(
      { text: '10', x: 100, y: 200, startTime: 1000, duration: 800, color: '#fff', fontSize: 12, type: FloatingTextType.DAMAGE },
      1000
    );
    expect(result.y).toBeCloseTo(200, 0);
    expect(result.alpha).toBe(1.0);
  });

  it('進行に応じてY座標が上方向に移動する', () => {
    const result = getTextPosition(
      { text: '10', x: 100, y: 200, startTime: 1000, duration: 800, color: '#fff', fontSize: 12, type: FloatingTextType.DAMAGE },
      1400 // 50% progress
    );
    expect(result.y).toBeLessThan(200);
  });

  it('後半でフェードアウトする', () => {
    const result = getTextPosition(
      { text: '10', x: 100, y: 200, startTime: 1000, duration: 800, color: '#fff', fontSize: 12, type: FloatingTextType.DAMAGE },
      1600 // 75% progress
    );
    expect(result.alpha).toBeLessThan(1.0);
    expect(result.alpha).toBeGreaterThan(0);
  });

  it('CRITICALタイプはスケールが変動する', () => {
    const midResult = getTextPosition(
      { text: '20', x: 100, y: 200, startTime: 1000, duration: 1000, color: '#fbbf24', fontSize: 18, type: FloatingTextType.CRITICAL },
      1500 // 50% progress
    );
    expect(midResult.scale).toBeGreaterThan(1.0);
  });

  it('DAMAGE以外の通常タイプはスケール1.0', () => {
    const result = getTextPosition(
      { text: '10', x: 100, y: 200, startTime: 1000, duration: 800, color: '#fff', fontSize: 12, type: FloatingTextType.DAMAGE },
      1400
    );
    expect(result.scale).toBe(1.0);
  });
});

describe('FLOATING_TEXT_CONFIGS', () => {
  it('全種別に設定が定義されている', () => {
    const types = Object.values(FloatingTextType);
    for (const type of types) {
      const config = FLOATING_TEXT_CONFIGS[type];
      expect(config).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.fontSize).toBeGreaterThan(0);
      expect(config.duration).toBeGreaterThan(0);
    }
  });
});
