/**
 * RunStateBuilder のテスト
 *
 * ビルダーパターンでテスト用 RunState を構築するヘルパーのテスト。
 * ドメイン別のサブステートを個別に設定でき、可読性の高いテストデータ構築を実現する。
 */
import { RunStateBuilder } from './run-state-builder';
import { DIFFS } from '../../constants';
import type { Enemy } from '../../types/units';

/** テスト用の敵モック */
const mockEnemy: Enemy = {
  n: 'テスト敵',
  hp: 50,
  mhp: 50,
  atk: 5,
  def: 0,
  bone: 10,
};

describe('RunStateBuilder', () => {
  describe('create', () => {
    it('デフォルトの RunState を生成する', () => {
      // Act
      const run = RunStateBuilder.create().build();

      // Assert: 基本的なプレイヤーステート
      expect(run.hp).toBe(80);
      expect(run.mhp).toBe(80);
      expect(run.atk).toBe(8);
      expect(run.def).toBe(2);
      expect(run.cr).toBe(0.05);
      expect(run.burn).toBe(0);
      expect(run.aM).toBe(1);
      expect(run.dm).toBe(1);
    });

    it('デフォルトの戦闘ステートを持つ', () => {
      const run = RunStateBuilder.create().build();

      expect(run.en).toBeNull();
      expect(run.turn).toBe(0);
      expect(run.cW).toBe(1);
      expect(run.wpb).toBe(4);
    });

    it('デフォルトの進行ステートを持つ', () => {
      const run = RunStateBuilder.create().build();

      expect(run.di).toBe(0);
      expect(run.dd).toEqual(DIFFS[0]);
      expect(run.bc).toBe(0);
      expect(run.fe).toBeNull();
    });

    it('有効な RunState 型を返す', () => {
      const run = RunStateBuilder.create().build();

      // RunState として必要なフィールドが全て存在する
      expect(run).toHaveProperty('hp');
      expect(run).toHaveProperty('en');
      expect(run).toHaveProperty('di');
      expect(run).toHaveProperty('evs');
      expect(run).toHaveProperty('sk');
      expect(run).toHaveProperty('awoken');
      expect(run).toHaveProperty('kills');
      expect(run).toHaveProperty('isEndless');
      expect(run).toHaveProperty('log');
      expect(run).toHaveProperty('tb');
    });
  });

  describe('withPlayer', () => {
    it('プレイヤーステートを部分的にオーバーライドする', () => {
      // Arrange & Act
      const run = RunStateBuilder.create()
        .withPlayer({ hp: 50, mhp: 100, atk: 20 })
        .build();

      // Assert
      expect(run.hp).toBe(50);
      expect(run.mhp).toBe(100);
      expect(run.atk).toBe(20);
      // オーバーライドしていないフィールドはデフォルト値
      expect(run.def).toBe(2);
      expect(run.cr).toBe(0.05);
    });

    it('メソッドチェーンが可能である', () => {
      const builder = RunStateBuilder.create();
      const result = builder.withPlayer({ hp: 50 });

      expect(result).toBe(builder);
    });
  });

  describe('withBattle', () => {
    it('戦闘ステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withBattle({ en: mockEnemy, turn: 5 })
        .build();

      expect(run.en).toEqual(mockEnemy);
      expect(run.turn).toBe(5);
      expect(run.cW).toBe(1); // デフォルト値
    });
  });

  describe('withProgression', () => {
    it('進行ステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withProgression({ di: 2, bc: 3, evoN: 5 })
        .build();

      expect(run.di).toBe(2);
      expect(run.bc).toBe(3);
      expect(run.evoN).toBe(5);
    });
  });

  describe('withEvolution', () => {
    it('進化ステートを部分的にオーバーライドする', () => {
      const evo = { n: 'テスト進化', d: '説明', t: 'tech' as const, r: 1, e: { atk: 5 } };

      const run = RunStateBuilder.create()
        .withEvolution({ evs: [evo] })
        .build();

      expect(run.evs).toEqual([evo]);
    });
  });

  describe('withSkills', () => {
    it('スキルステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withSkills({ mxA: 5, skillUseCount: 3 })
        .build();

      expect(run.mxA).toBe(5);
      expect(run.skillUseCount).toBe(3);
    });
  });

  describe('withChallenge', () => {
    it('チャレンジステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withChallenge({ challengeId: 'test_challenge', noHealing: true })
        .build();

      expect(run.challengeId).toBe('test_challenge');
      expect(run.noHealing).toBe(true);
    });
  });

  describe('withEndless', () => {
    it('エンドレスステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withEndless({ isEndless: true, endlessWave: 3 })
        .build();

      expect(run.isEndless).toBe(true);
      expect(run.endlessWave).toBe(3);
    });
  });

  describe('withStats', () => {
    it('統計ステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withStats({ kills: 100, dmgDealt: 5000, maxHit: 200 })
        .build();

      expect(run.kills).toBe(100);
      expect(run.dmgDealt).toBe(5000);
      expect(run.maxHit).toBe(200);
    });
  });

  describe('withAwakening', () => {
    it('覚醒ステートを部分的にオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withAwakening({ saReq: 1, rvU: 1, awoken: [{ id: 'awk1', nm: '覚醒1', cl: '#fff' }] })
        .build();

      expect(run.saReq).toBe(1);
      expect(run.rvU).toBe(1);
      expect(run.awoken).toHaveLength(1);
    });
  });

  describe('withMeta', () => {
    it('メタステート（log, loopCount 等）をオーバーライドする', () => {
      const run = RunStateBuilder.create()
        .withMeta({ loopCount: 2, btlCount: 10, bb: 500 })
        .build();

      expect(run.loopCount).toBe(2);
      expect(run.btlCount).toBe(10);
      expect(run.bb).toBe(500);
    });
  });

  describe('複合的な使用', () => {
    it('複数のサブステートを組み合わせて設定できる', () => {
      const run = RunStateBuilder.create()
        .withPlayer({ hp: 50, mhp: 100, atk: 20 })
        .withBattle({ en: mockEnemy, turn: 3 })
        .withProgression({ di: 1, bc: 2 })
        .withStats({ kills: 15 })
        .build();

      expect(run.hp).toBe(50);
      expect(run.mhp).toBe(100);
      expect(run.atk).toBe(20);
      expect(run.en).toEqual(mockEnemy);
      expect(run.turn).toBe(3);
      expect(run.di).toBe(1);
      expect(run.bc).toBe(2);
      expect(run.kills).toBe(15);
    });

    it('後から呼び出した withPlayer が前の設定を上書きする', () => {
      const run = RunStateBuilder.create()
        .withPlayer({ hp: 50, atk: 20 })
        .withPlayer({ hp: 30 })
        .build();

      expect(run.hp).toBe(30);
      // 最初の withPlayer で設定した atk はリセットされない
      expect(run.atk).toBe(20);
    });
  });

  describe('イミュータビリティ', () => {
    it('build() を複数回呼んでも独立したオブジェクトを返す', () => {
      const builder = RunStateBuilder.create().withPlayer({ hp: 50 });
      const run1 = builder.build();
      const run2 = builder.build();

      expect(run1).not.toBe(run2);
      expect(run1).toEqual(run2);
    });
  });
});
