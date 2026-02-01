/**
 * デバッグモード機能のテスト
 */
import { DebugState, DEFAULT_DEBUG_STATE, toggleDebugOption } from './debug';

describe('debug', () => {
  describe('DEFAULT_DEBUG_STATE', () => {
    it('デフォルト状態が正しく定義されている', () => {
      expect(DEFAULT_DEBUG_STATE).toEqual({
        enabled: false,
        showPanel: false,
        showFullMap: false,
        showCoordinates: false,
        showPath: false,
      });
    });
  });

  describe('toggleDebugOption', () => {
    const baseState: DebugState = {
      enabled: true,
      showPanel: true,
      showFullMap: false,
      showCoordinates: false,
      showPath: false,
    };

    it('showPanelをトグルできる', () => {
      const newState = toggleDebugOption(baseState, 'showPanel');
      expect(newState.showPanel).toBe(false);
      expect(newState.enabled).toBe(true); // enabledは変更されない
    });

    it('showFullMapをトグルできる', () => {
      const newState = toggleDebugOption(baseState, 'showFullMap');
      expect(newState.showFullMap).toBe(true);
    });

    it('showCoordinatesをトグルできる', () => {
      const newState = toggleDebugOption(baseState, 'showCoordinates');
      expect(newState.showCoordinates).toBe(true);
    });

    it('showPathをトグルできる', () => {
      const newState = toggleDebugOption(baseState, 'showPath');
      expect(newState.showPath).toBe(true);
    });

    it('元の状態は変更されない（イミュータブル）', () => {
      const originalShowFullMap = baseState.showFullMap;
      toggleDebugOption(baseState, 'showFullMap');
      expect(baseState.showFullMap).toBe(originalShowFullMap);
    });

    it('連続トグルで元の状態に戻る', () => {
      const state1 = toggleDebugOption(baseState, 'showPath');
      expect(state1.showPath).toBe(true);

      const state2 = toggleDebugOption(state1, 'showPath');
      expect(state2.showPath).toBe(false);
    });

    it('複数オプションを独立してトグルできる', () => {
      let state = baseState;

      state = toggleDebugOption(state, 'showFullMap');
      state = toggleDebugOption(state, 'showCoordinates');
      state = toggleDebugOption(state, 'showPath');

      expect(state.showFullMap).toBe(true);
      expect(state.showCoordinates).toBe(true);
      expect(state.showPath).toBe(true);
      expect(state.showPanel).toBe(true); // 元の値を維持
    });
  });
});
