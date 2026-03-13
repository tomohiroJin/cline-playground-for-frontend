/**
 * ステージ遷移のテスト
 */
import {
  getNextStage,
  getStageLabel,
  getStageSubLabel,
} from '../../domain/stage-flow/stage-transition';

describe('stage-flow/stage-transition', () => {
  describe('getNextStage', () => {
    it('洞窟クリア後は草原に遷移する', () => {
      expect(getNextStage('cave')).toBe('grass');
    });

    it('草原クリア後はボスに遷移する', () => {
      expect(getNextStage('grass')).toBe('boss');
    });

    it('ボスクリア後（ループ 1）はエンディング 1 に遷移する', () => {
      expect(getNextStage('boss', 1)).toBe('ending1');
    });

    it('ボスクリア後（ループ 2）はエンディング 1 に遷移する', () => {
      expect(getNextStage('boss', 2)).toBe('ending1');
    });

    it('ボスクリア後（ループ 3）はトゥルーエンドに遷移する', () => {
      expect(getNextStage('boss', 3)).toBe('trueEnd');
    });

    it('ボスクリア後（ループ 4, 5）はエンディング 1 に遷移する', () => {
      expect(getNextStage('boss', 4)).toBe('ending1');
      expect(getNextStage('boss', 5)).toBe('ending1');
    });

    it('ボスクリア後（ループ 6）はトゥルーエンドに遷移する', () => {
      expect(getNextStage('boss', 6)).toBe('trueEnd');
    });
  });

  describe('getStageLabel', () => {
    it('洞窟のラベルを返す', () => {
      expect(getStageLabel('cave', 1)).toBe('STAGE 1');
    });

    it('草原のラベルを返す', () => {
      expect(getStageLabel('grass', 1)).toBe('STAGE 2');
    });

    it('ボスのラベルを返す', () => {
      expect(getStageLabel('boss', 1)).toBe('BOSS');
    });

    it('ループ 2 以降はループ番号が付く', () => {
      const label = getStageLabel('cave', 2);
      expect(label).toContain('LOOP 2');
    });
  });

  describe('getStageSubLabel', () => {
    it('洞窟のサブラベルを返す', () => {
      expect(getStageSubLabel('cave')).toBe('THE CAVE');
    });

    it('草原のサブラベルを返す', () => {
      expect(getStageSubLabel('grass')).toBe('THE PRAIRIE');
    });

    it('ボスのサブラベルを返す', () => {
      expect(getStageSubLabel('boss')).toBe('DARK CASTLE');
    });
  });

  describe('ステージフロー全体', () => {
    it('洞窟 → 草原 → ボス の順序が正しい', () => {
      const stage1 = getNextStage('cave');
      const stage2 = getNextStage(stage1 as 'grass');
      expect(stage1).toBe('grass');
      expect(stage2).toBe('boss');
    });
  });
});
