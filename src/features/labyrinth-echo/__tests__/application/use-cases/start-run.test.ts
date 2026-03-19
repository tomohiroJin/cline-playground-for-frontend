/**
 * 迷宮の残響 - StartRunUseCase テスト
 */
import { startRun } from '../../../application/use-cases/start-run';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { createMetaState } from '../../../domain/models/meta-state';
import { CFG } from '../../../domain/constants/config';

describe('startRun', () => {
  describe('正常系', () => {
    it('normal難易度でプレイヤーの初期ステータスが正しく計算される', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'normal')!;
      const meta = createMetaState();

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      expect(result.gameState.player).not.toBeNull();
      const player = result.gameState.player!;
      expect(player.hp).toBe(CFG.BASE_HP + difficulty.modifiers.hpMod);
      expect(player.maxHp).toBe(CFG.BASE_HP + difficulty.modifiers.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + difficulty.modifiers.mnMod);
      expect(player.maxMn).toBe(CFG.BASE_MN + difficulty.modifiers.mnMod);
      expect(player.inf).toBe(CFG.BASE_INF);
    });

    it('easy難易度でHP/MNボーナスが適用される', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'easy')!;
      const meta = createMetaState();

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      const player = result.gameState.player!;
      expect(player.hp).toBe(CFG.BASE_HP + difficulty.modifiers.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + difficulty.modifiers.mnMod);
    });

    it('abyss難易度でHP/MNペナルティが適用される', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'abyss')!;
      const meta = createMetaState();

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      const player = result.gameState.player!;
      expect(player.hp).toBe(CFG.BASE_HP + difficulty.modifiers.hpMod);
      expect(player.mn).toBe(CFG.BASE_MN + difficulty.modifiers.mnMod);
    });

    it('GameStateが正しく初期化される', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'normal')!;
      const meta = createMetaState();

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      expect(result.gameState.phase).toBe('explore');
      expect(result.gameState.floor).toBe(1);
      expect(result.gameState.step).toBe(0);
      expect(result.gameState.usedEventIds).toEqual([]);
      expect(result.gameState.log).toEqual([]);
      expect(result.gameState.chainNextId).toBeNull();
      expect(result.gameState.usedSecondLife).toBe(false);
      expect(result.gameState.difficulty).toBe(difficulty);
    });

    it('meta.runsがインクリメントされる', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'normal')!;
      const meta = createMetaState({ runs: 5 });

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      expect(result.updatedMeta.runs).toBe(6);
    });

    it('FX効果がプレイヤーの初期ステータスに反映される', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'normal')!;
      // u2: 鋼の心臓 hpBonus +5, u3: 冷静沈着 mentalBonus +4
      const meta = createMetaState({ unlocked: ['u2', 'u3'] });

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      const player = result.gameState.player!;
      expect(player.hp).toBe(CFG.BASE_HP + 5);
      expect(player.mn).toBe(CFG.BASE_MN + 4);
    });

    it('metaの他のフィールドは変更されない', () => {
      // Arrange
      const difficulty = DIFFICULTY.find(d => d.id === 'normal')!;
      const meta = createMetaState({ kp: 100, escapes: 3, unlocked: ['u1'] });

      // Act
      const result = startRun({ difficulty, meta });

      // Assert
      expect(result.updatedMeta.kp).toBe(100);
      expect(result.updatedMeta.escapes).toBe(3);
      expect(result.updatedMeta.unlocked).toEqual(['u1']);
    });
  });
});
