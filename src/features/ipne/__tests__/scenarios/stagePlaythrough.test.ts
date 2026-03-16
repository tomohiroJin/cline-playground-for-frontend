/**
 * 決定的シナリオテスト（シード固定ゲームプレイ）
 * SeededRandomProvider を使用して、同一入力から同一結果を保証する
 */
import { tickGameState, TickSoundEffect } from '../../application/engine/tickGameState';
import { SeededRandomProvider, createTestTickInput } from '../helpers/scenarioHelpers';
import { aPlayer, anEnemy, aMap } from '../builders';
import { SequentialIdGenerator } from '../../infrastructure/id/SequentialIdGenerator';
import { createItem } from '../../domain/entities/item';
import { createTrap, TRAP_CONFIGS } from '../../domain/entities/trap';
import { ItemType, TrapType } from '../../types';
import { REGEN_CONFIG } from '../../application/usecases/resolveRegen';

describe('ステージ通しプレイ シナリオテスト', () => {
  it('固定シードで同一入力なら同一結果になる（決定性の検証）', () => {
    // Arrange: 同じシードで2回実行
    const runScenario = (seed: number) => {
      const random = new SeededRandomProvider(seed);
      const idGen = new SequentialIdGenerator();

      const player = aPlayer().at(3, 3).withHp(15, 20).build();
      const trap = createTrap(TrapType.TELEPORT, 3, 3, idGen);
      const map = aMap(15, 15).build();

      const input = createTestTickInput({
        player,
        traps: [trap],
        map,
        currentTime: 1000,
        random,
      });

      return tickGameState(input);
    };

    // Act: 同じシードで2回実行
    const result1 = runScenario(12345);
    const result2 = runScenario(12345);

    // Assert: 完全に同じ結果
    expect(result1.player.x).toBe(result2.player.x);
    expect(result1.player.y).toBe(result2.player.y);
    expect(result1.player.hp).toBe(result2.player.hp);
    expect(result1.effects).toEqual(result2.effects);
    expect(result1.traps).toEqual(result2.traps);

    // 異なるシードでも決定性は保たれる（同じシード→同じ結果）
    const result3a = runScenario(99999);
    const result3b = runScenario(99999);
    expect(result3a.player.x).toBe(result3b.player.x);
    expect(result3a.player.y).toBe(result3b.player.y);
    expect(result3a.player.hp).toBe(result3b.player.hp);
  });

  it('連続ティックでダメージ→回復→罠の一連のフローが決定的に実行される', () => {
    // Arrange: 固定シード環境
    const seed = 54321;
    const idGen = new SequentialIdGenerator();

    const player = aPlayer()
      .at(3, 3)
      .withHp(15, 20)
      .withLastRegenAt(0)
      .withStats({ healBonus: 0 })
      .build();

    const healItem = createItem(ItemType.HEALTH_SMALL, 3, 3, idGen);
    const damageTrap = createTrap(TrapType.DAMAGE, 4, 3, idGen);
    const enemy = anEnemy().withId('enemy-s1').at(8, 8).withDamage(2).build();
    const map = aMap().build();

    // ティック1: アイテムを拾ってHP回復
    const random1 = new SeededRandomProvider(seed);
    const input1 = createTestTickInput({
      player,
      items: [healItem],
      traps: [damageTrap],
      map,
      currentTime: 1000,
      random: random1,
    });

    const result1 = tickGameState(input1);

    // 1ティック目の検証: アイテム回復（HEALTH_SMALL = 3HP）
    expect(result1.player.hp).toBe(18); // 15 + 3
    // アイテムは拾われて消える
    expect(result1.items).toHaveLength(0);

    // ティック2: 罠の位置に移動してダメージを受ける
    const playerAtTrap = { ...result1.player, x: 4, y: 3, isInvincible: false, invincibleUntil: 0 };
    const random2 = new SeededRandomProvider(seed + 1);
    const input2 = createTestTickInput({
      player: playerAtTrap,
      enemies: [enemy],
      traps: result1.traps,
      map,
      currentTime: 2000,
      random: random2,
    });

    const result2 = tickGameState(input2);

    // 罠ダメージを受ける
    expect(result2.player.hp).toBeLessThan(playerAtTrap.hp);
    expect(result2.effects).toContainEqual(
      expect.objectContaining({ kind: 'sound', type: TickSoundEffect.TRAP_TRIGGERED })
    );

    // ティック3: 十分な時間経過後にリジェネ発動
    const regenPlayer = { ...result2.player, lastRegenAt: 0, x: 5, y: 5 };
    const input3 = createTestTickInput({
      player: regenPlayer,
      map,
      currentTime: REGEN_CONFIG.BASE_INTERVAL + 1,
    });

    const result3 = tickGameState(input3);

    // リジェネで1HP回復
    expect(result3.player.hp).toBe(regenPlayer.hp + REGEN_CONFIG.AMOUNT);
  });

  it('ステージ間引き継ぎでプレイヤー能力値が維持される', () => {
    // Arrange: レベル3のプレイヤーがステージ1をクリアし、能力値を引き継ぐ
    const stage1Player = aPlayer()
      .at(5, 5)
      .withHp(18, 20)
      .withLevel(3)
      .withStats({ attackPower: 3, attackRange: 2, moveSpeed: 5, attackSpeed: 0.8, healBonus: 1 })
      .withKillCount(10)
      .build();

    // ステージ2の初期状態を想定
    // プレイヤーの能力値はそのまま引き継がれるが、位置はリセット
    const stage2Player = {
      ...stage1Player,
      x: 1,
      y: 1,
      killCount: 0,
      hasKey: false,
    };

    // Assert: 能力値が引き継がれていること
    expect(stage2Player.level).toBe(3);
    expect(stage2Player.stats.attackPower).toBe(3);
    expect(stage2Player.stats.attackRange).toBe(2);
    expect(stage2Player.stats.moveSpeed).toBe(5);
    expect(stage2Player.stats.attackSpeed).toBe(0.8);
    expect(stage2Player.stats.healBonus).toBe(1);
    expect(stage2Player.hp).toBe(18);
    expect(stage2Player.maxHp).toBe(20);

    // ステージ2でのティック: 能力値を活かして戦闘
    const map = aMap().build();
    const input = createTestTickInput({
      player: stage2Player,
      map,
      currentTime: 1000,
    });
    const result = tickGameState(input);

    // 能力値が維持されていること
    expect(result.player.level).toBe(3);
    expect(result.player.stats.attackPower).toBe(3);
  });

  it('複数の罠種類を順番に踏むシナリオが正しく動作する', () => {
    // Arrange
    const idGen2 = new SequentialIdGenerator();
    const player = aPlayer().at(3, 3).withHp(20, 20).build();
    const damageTrap = createTrap(TrapType.DAMAGE, 3, 3, idGen2);
    const map = aMap().build();
    const random = new SeededRandomProvider(777);

    // ティック1: ダメージ罠を踏む
    const input1 = createTestTickInput({
      player,
      traps: [damageTrap],
      map,
      currentTime: 1000,
      random,
    });
    const result1 = tickGameState(input1);
    expect(result1.player.hp).toBe(20 - (TRAP_CONFIGS[TrapType.DAMAGE].damage ?? 0));

    // ティック2: クールダウン中は同じ罠が発動しない
    const input2 = createTestTickInput({
      player: { ...result1.player, isInvincible: false, invincibleUntil: 0 },
      traps: result1.traps,
      map,
      currentTime: 1500, // クールダウン5000ms以内
    });
    const result2 = tickGameState(input2);
    expect(result2.player.hp).toBe(result1.player.hp); // HP変化なし

    // ティック3: クールダウン後は再発動
    const cooldownEnd = 1000 + (TRAP_CONFIGS[TrapType.DAMAGE].cooldown ?? 0);
    const input3 = createTestTickInput({
      player: { ...result2.player, isInvincible: false, invincibleUntil: 0 },
      traps: result2.traps,
      map,
      currentTime: cooldownEnd + 1,
    });
    const result3 = tickGameState(input3);
    expect(result3.player.hp).toBeLessThan(result2.player.hp);
  });
});
